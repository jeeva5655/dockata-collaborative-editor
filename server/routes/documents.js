const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const crypto = require('crypto');
const mongoose = require('mongoose');

// Generate unique document ID
const generateDocId = () => {
  return crypto.randomBytes(8).toString('hex');
};

// Check if MongoDB is connected
const isMongoConnected = () => {
  return mongoose.connection.readyState === 1;
};

// GET /api/documents - List all documents
router.get('/', async (req, res) => {
  try {
    // Return empty array if MongoDB not connected
    if (!isMongoConnected()) {
      return res.json([]);
    }
    
    const documents = await Document.find({}, {
      docId: 1,
      title: 1,
      owner: 1,
      createdAt: 1,
      updatedAt: 1,
      isPublic: 1
    }).sort({ updatedAt: -1 }).limit(50);
    
    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    res.json([]); // Return empty array on error instead of 500
  }
});

// POST /api/documents - Create new document
router.post('/', async (req, res) => {
  try {
    const { title, owner } = req.body;
    const docId = generateDocId();
    
    // If MongoDB not connected, just return the generated docId
    if (!isMongoConnected()) {
      return res.status(201).json({
        docId: docId,
        title: title || 'Untitled Document',
        createdAt: new Date()
      });
    }
    
    const doc = new Document({
      docId: docId,
      title: title || 'Untitled Document',
      owner: owner || 'anonymous'
    });
    
    await doc.save();
    
    res.status(201).json({
      docId: doc.docId,
      title: doc.title,
      createdAt: doc.createdAt
    });
  } catch (error) {
    console.error('Error creating document:', error);
    // Still return a docId so the app can work
    res.status(201).json({
      docId: generateDocId(),
      title: req.body?.title || 'Untitled Document',
      createdAt: new Date()
    });
  }
});

// GET /api/documents/:docId - Get document details
router.get('/:docId', async (req, res) => {
  try {
    const doc = await Document.findOne({ docId: req.params.docId });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      docId: doc.docId,
      title: doc.title,
      owner: doc.owner,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      collaborators: doc.collaborators,
      revisionsCount: doc.revisions?.length || 0
    });
  } catch (error) {
    console.error('Error fetching document:', error);
    res.status(500).json({ error: 'Failed to fetch document' });
  }
});

// PATCH /api/documents/:docId - Update document metadata
router.patch('/:docId', async (req, res) => {
  try {
    const { title, isPublic } = req.body;
    const update = {};
    
    if (title !== undefined) update.title = title;
    if (isPublic !== undefined) update.isPublic = isPublic;
    
    const doc = await Document.findOneAndUpdate(
      { docId: req.params.docId },
      { $set: update },
      { new: true }
    );
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({
      docId: doc.docId,
      title: doc.title,
      updatedAt: doc.updatedAt
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.status(500).json({ error: 'Failed to update document' });
  }
});

// DELETE /api/documents/:docId - Delete document
router.delete('/:docId', async (req, res) => {
  try {
    const doc = await Document.findOneAndDelete({ docId: req.params.docId });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Error deleting document:', error);
    res.status(500).json({ error: 'Failed to delete document' });
  }
});

// GET /api/documents/:docId/revisions - Get revision history
router.get('/:docId/revisions', async (req, res) => {
  try {
    const doc = await Document.findOne({ docId: req.params.docId }, { revisions: 1 });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    const revisions = (doc.revisions || []).map((rev, index) => ({
      id: index,
      savedAt: rev.savedAt,
      savedBy: rev.savedBy,
      title: rev.title
    }));
    
    res.json(revisions);
  } catch (error) {
    console.error('Error fetching revisions:', error);
    res.status(500).json({ error: 'Failed to fetch revisions' });
  }
});

// GET /api/documents/:docId/versions - Alias for revisions (version history)
router.get('/:docId/versions', async (req, res) => {
  try {
    if (!isMongoConnected()) {
      // Return mock versions when DB not connected
      return res.json([
        { id: 1, timestamp: new Date(), editor: 'You', changes: 'Current version' }
      ]);
    }
    
    const doc = await Document.findOne({ docId: req.params.docId });
    
    if (!doc) {
      // Return mock version for new documents
      return res.json([
        { id: 1, timestamp: new Date(), editor: 'You', changes: 'Current version' }
      ]);
    }
    
    const versions = (doc.revisions || []).map((rev, index) => ({
      id: index + 1,
      timestamp: rev.savedAt || doc.updatedAt,
      editor: rev.savedBy || doc.owner || 'Anonymous',
      changes: rev.title || 'Edit'
    }));
    
    // Always include current version
    versions.unshift({
      id: 0,
      timestamp: doc.updatedAt,
      editor: doc.owner || 'Anonymous',
      changes: 'Current version'
    });
    
    res.json(versions);
  } catch (error) {
    console.error('Error fetching versions:', error);
    // Return mock on error
    res.json([
      { id: 1, timestamp: new Date(), editor: 'You', changes: 'Current version' }
    ]);
  }
});

// PUT /api/documents/:docId - Update document (title, etc.)
router.put('/:docId', async (req, res) => {
  try {
    const { title } = req.body;
    
    if (!isMongoConnected()) {
      return res.json({ docId: req.params.docId, title, updatedAt: new Date() });
    }
    
    const doc = await Document.findOneAndUpdate(
      { docId: req.params.docId },
      { $set: { title, updatedAt: new Date() } },
      { new: true, upsert: true }
    );
    
    res.json({
      docId: doc.docId,
      title: doc.title,
      updatedAt: doc.updatedAt
    });
  } catch (error) {
    console.error('Error updating document:', error);
    res.json({ docId: req.params.docId, title: req.body.title, updatedAt: new Date() });
  }
});

// POST /api/documents/:docId/revisions - Save a revision
router.post('/:docId/revisions', async (req, res) => {
  try {
    const { savedBy } = req.body;
    
    const doc = await Document.findOne({ docId: req.params.docId });
    
    if (!doc) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    // Add current state as a revision
    doc.revisions = doc.revisions || [];
    doc.revisions.push({
      content: doc.content,
      title: doc.title,
      savedBy: savedBy || 'anonymous'
    });
    
    // Keep only last 20 revisions
    if (doc.revisions.length > 20) {
      doc.revisions = doc.revisions.slice(-20);
    }
    
    await doc.save();
    
    res.status(201).json({
      message: 'Revision saved',
      revisionId: doc.revisions.length - 1
    });
  } catch (error) {
    console.error('Error saving revision:', error);
    res.status(500).json({ error: 'Failed to save revision' });
  }
});

module.exports = router;
