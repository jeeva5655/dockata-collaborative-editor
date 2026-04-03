# Real-time Collaborative Text Editor

A Google Docs-like collaborative editing experience built for the GUVI Hackathon 2026.

![CollabDocs](https://img.shields.io/badge/CollabDocs-Real--time%20Editor-6366f1)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![CRDT](https://img.shields.io/badge/CRDT-Yjs-ff6b6b)

## Features

### Core Features
- Real-time Synchronization - Instant sync across all connected users using WebSockets
- CRDT Conflict Resolution - Yjs-based Conflict-free Replicated Data Types for seamless merging
- User Presence - See who is online and editing in real-time
- Cursor Tracking - Colored cursors showing each users position
- Rich Text Formatting - Bold, italic, underline, headers, lists, code blocks, and more
- Document Persistence - MongoDB Atlas for reliable document storage
- Revision History - Save and view document versions

### UI/UX Features
- Modern dark theme with gradient accents
- Animated background with floating particles
- Responsive design for all devices
- Real-time connection status indicator
- Collaborator avatars with live presence

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18 + Vite |
| Styling | Tailwind CSS |
| Editor | Quill.js |
| Real-time Sync | Yjs CRDT + WebSocket |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| State Sync | y-websocket, y-quill |

## Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (free tier works)

### 1. Install Dependencies

```bash
cd track1-collaborative-editor
npm run install:all
```

### 2. Configure MongoDB Atlas

1. Go to MongoDB Atlas (https://www.mongodb.com/atlas)
2. Create a free cluster
3. Create a database user
4. Get your connection string
5. Update `.env`:

```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/collab-editor
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 3. Run Development

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3001
- React frontend on http://localhost:5173

### 4. Production Build

```bash
npm run build
npm start
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/documents | List all documents |
| POST | /api/documents | Create new document |
| GET | /api/documents/:id | Get document info |
| PATCH | /api/documents/:id | Update document |
| DELETE | /api/documents/:id | Delete document |
| GET | /api/documents/:id/revisions | Get revision history |
| POST | /api/documents/:id/revisions | Save revision |

## WebSocket Protocol

Connect to: ws://localhost:3001/ws?docId=<document-id>

## Project Structure

```
track1-collaborative-editor/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── styles/         # CSS
│   │   └── main.jsx
│   └── package.json
├── server/                 # Node.js backend
│   ├── models/             # MongoDB schemas
│   ├── routes/             # API routes
│   └── index.js            # Server entry
├── .env                    # Environment config
└── package.json
```

## License

MIT License - Built for GUVI Hackathon 2026
