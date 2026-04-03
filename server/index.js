/**
 * Real-time Collaborative Editor - Server
 * 
 * Features:
 * - WebSocket-based real-time sync using Yjs CRDT
 * - MongoDB persistence for documents
 * - User presence and cursor tracking
 * - Document revision history
 */

require('dotenv').config();
const express = require('express');
const http = require('http');
const { WebSocketServer } = require('ws');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');

// Yjs imports
const Y = require('yjs');
const { encodeStateAsUpdate, applyUpdate, encodeStateVector } = require('yjs');
const syncProtocol = require('y-protocols/sync');
const awarenessProtocol = require('y-protocols/awareness');
const encoding = require('lib0/encoding');
const decoding = require('lib0/decoding');
const map = require('lib0/map');

// Local imports
const documentRoutes = require('./routes/documents');
const Document = require('./models/Document');

// Configuration
const PORT = process.env.PORT || 3001;
const MONGODB_URI = process.env.MONGODB_URI;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Initialize Express
const app = express();

// CORS configuration - allow all origins in production for hackathon demo
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? true  // Allow all origins in production
    : [CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true
};
app.use(cors(corsOptions));
app.use(express.json());

// API Routes
app.use('/api/documents', documentRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files in production
app.use(express.static(path.join(__dirname, '../client/dist')));

// Create HTTP server
const server = http.createServer(app);

// ========== Yjs WebSocket Server ==========

// Message types
const messageSync = 0;
const messageAwareness = 1;

// Store for Yjs documents
const docs = new Map();

// Get or create a Yjs document
const getYDoc = async (docId) => {
  return map.setIfUndefined(docs, docId, async () => {
    const doc = new Y.Doc();
    doc.gc = true;
    
    // Try to load from MongoDB
    try {
      const savedDoc = await Document.findOne({ docId });
      if (savedDoc && savedDoc.content) {
        applyUpdate(doc, new Uint8Array(savedDoc.content));
        console.log(`[${docId}] Loaded document from database`);
      } else if (!savedDoc) {
        // Create new document in database
        const newDoc = new Document({ docId, title: 'Untitled Document' });
        await newDoc.save();
        console.log(`[${docId}] Created new document`);
      }
    } catch (error) {
      console.error(`[${docId}] Error loading document:`, error.message);
    }
    
    // Set up persistence on updates
    doc.on('update', async (update, origin) => {
      // Don't save if update came from database load
      if (origin === 'db-load') return;
      
      try {
        const state = encodeStateAsUpdate(doc);
        await Document.findOneAndUpdate(
          { docId },
          { 
            $set: { 
              content: Buffer.from(state),
              updatedAt: new Date()
            }
          },
          { upsert: true }
        );
      } catch (error) {
        console.error(`[${docId}] Error saving document:`, error.message);
      }
    });
    
    return doc;
  });
};

// WebSocket server
const wss = new WebSocketServer({ server, path: '/ws' });

// Track connections per document
const connections = new Map();

// Get connections for a document
const getConnections = (docId) => {
  return map.setIfUndefined(connections, docId, () => new Set());
};

wss.on('connection', async (ws, req) => {
  // Parse document ID from URL
  const url = new URL(req.url, `http://${req.headers.host}`);
  const docId = url.searchParams.get('docId') || 'default';
  
  console.log(`[${docId}] Client connected`);
  
  // Get or create the Yjs document
  const doc = await getYDoc(docId);
  
  // Create awareness for this document
  if (!doc.awareness) {
    doc.awareness = new awarenessProtocol.Awareness(doc);
    
    // Clean up awareness when client disconnects
    doc.awareness.on('update', ({ added, updated, removed }) => {
      const encoder = encoding.createEncoder();
      encoding.writeVarUint(encoder, messageAwareness);
      encoding.writeVarUint8Array(
        encoder,
        awarenessProtocol.encodeAwarenessUpdate(doc.awareness, [...added, ...updated, ...removed])
      );
      const message = encoding.toUint8Array(encoder);
      
      // Broadcast to all clients of this document
      const conns = getConnections(docId);
      conns.forEach(conn => {
        if (conn.readyState === ws.OPEN) {
          conn.send(message);
        }
      });
    });
  }
  
  // Add to connections
  const conns = getConnections(docId);
  conns.add(ws);
  
  // Store doc reference on websocket
  ws.docId = docId;
  ws.doc = doc;
  
  // Send sync step 1
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  syncProtocol.writeSyncStep1(encoder, doc);
  ws.send(encoding.toUint8Array(encoder));
  
  // Send current awareness state
  const awarenessStates = doc.awareness.getStates();
  if (awarenessStates.size > 0) {
    const awarenessEncoder = encoding.createEncoder();
    encoding.writeVarUint(awarenessEncoder, messageAwareness);
    encoding.writeVarUint8Array(
      awarenessEncoder,
      awarenessProtocol.encodeAwarenessUpdate(doc.awareness, Array.from(awarenessStates.keys()))
    );
    ws.send(encoding.toUint8Array(awarenessEncoder));
  }
  
  // Handle messages
  ws.on('message', (message) => {
    try {
      const data = new Uint8Array(message);
      const decoder = decoding.createDecoder(data);
      const messageType = decoding.readVarUint(decoder);
      
      switch (messageType) {
        case messageSync:
          handleSync(ws, doc, decoder, docId);
          break;
        case messageAwareness:
          handleAwareness(ws, doc, decoder, docId);
          break;
      }
    } catch (error) {
      console.error(`[${docId}] Error handling message:`, error);
    }
  });
  
  // Handle disconnect
  ws.on('close', () => {
    console.log(`[${docId}] Client disconnected`);
    conns.delete(ws);
    
    // Remove awareness state
    if (doc.awareness) {
      awarenessProtocol.removeAwarenessStates(doc.awareness, [doc.clientID], null);
    }
    
    // Clean up document if no connections
    if (conns.size === 0) {
      setTimeout(async () => {
        if (getConnections(docId).size === 0) {
          docs.delete(docId);
          connections.delete(docId);
          console.log(`[${docId}] Document unloaded from memory`);
        }
      }, 30000); // Keep in memory for 30s after last disconnect
    }
  });
  
  ws.on('error', (error) => {
    console.error(`[${docId}] WebSocket error:`, error);
  });
});

// Handle sync messages
function handleSync(ws, doc, decoder, docId) {
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, messageSync);
  
  const syncMessageType = syncProtocol.readSyncMessage(decoder, encoder, doc, null);
  
  if (encoding.length(encoder) > 1) {
    ws.send(encoding.toUint8Array(encoder));
  }
  
  // Broadcast updates to all other clients
  if (syncMessageType === syncProtocol.messageYjsUpdate) {
    const conns = getConnections(docId);
    const updateEncoder = encoding.createEncoder();
    encoding.writeVarUint(updateEncoder, messageSync);
    syncProtocol.writeSyncStep2(updateEncoder, doc);
    const message = encoding.toUint8Array(updateEncoder);
    
    conns.forEach(conn => {
      if (conn !== ws && conn.readyState === ws.OPEN) {
        conn.send(message);
      }
    });
  }
}

// Handle awareness messages
function handleAwareness(ws, doc, decoder, docId) {
  const update = decoding.readVarUint8Array(decoder);
  awarenessProtocol.applyAwarenessUpdate(doc.awareness, update, ws);
}

// ========== Database Connection ==========

async function connectDB() {
  if (!MONGODB_URI) {
    console.warn('⚠️  MONGODB_URI not set - running without database persistence');
    return false;
  }
  
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');
    return true;
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.warn('⚠️  Running without database persistence');
    return false;
  }
}

// ========== Start Server ==========

async function startServer() {
  await connectDB();
  
  server.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════════════╗
║   🚀 Real-time Collaborative Editor Server                        ║
╠═══════════════════════════════════════════════════════════════════╣
║                                                                   ║
║   Server:     http://localhost:${PORT}                              ║
║   WebSocket:  ws://localhost:${PORT}/ws                             ║
║   API:        http://localhost:${PORT}/api                          ║
║                                                                   ║
║   Features:                                                       ║
║   ✓ CRDT-based conflict resolution (Yjs)                          ║
║   ✓ Real-time WebSocket synchronization                           ║
║   ✓ User presence & cursor tracking                               ║
║   ✓ MongoDB document persistence                                  ║
║   ✓ Revision history                                              ║
║                                                                   ║
╚═══════════════════════════════════════════════════════════════════╝
    `);
  });
}

startServer();
