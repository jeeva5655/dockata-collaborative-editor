# DocKata - Real-time Collaborative Text Editor

A Google Docs-like collaborative editing experience built for the **GUVI Hackathon 2026**.

![DocKata](https://img.shields.io/badge/DocKata-Real--time%20Editor-6366f1)
![React](https://img.shields.io/badge/React-18-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248)
![CRDT](https://img.shields.io/badge/CRDT-Yjs-ff6b6b)
![Firebase](https://img.shields.io/badge/Firebase-Auth-FFCA28)

---

## 🔗 Live Demo & Links

| Resource | Link |
|----------|------|
| **🌐 Live Application** | [https://dockata-collaborative-editor.vercel.app](https://dockata-collaborative-editor.vercel.app) |
| **📁 GitHub Repository** | [https://github.com/jeeva5655/dockata-collaborative-editor](https://github.com/jeeva5655/dockata-collaborative-editor) |
| **🎬 Video Demo** | [Google Drive - Demo Video](https://drive.google.com/drive/folders/1fdTzXoIjOprUbZkAe6AIWlJHWCrNDEYE?usp=drive_link) |

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture Overview](#architecture-overview)
- [Installation](#installation)
- [API Endpoints](#api-endpoints)
- [AI Tools Used](#ai-tools-used)
- [Known Limitations](#known-limitations)
- [Challenges & Solutions](#challenges--solutions)
- [License](#license)

---

## ✨ Features

### Core Features
- **Real-time Synchronization** - Instant sync across all connected users using WebSockets
- **CRDT Conflict Resolution** - Yjs-based Conflict-free Replicated Data Types for seamless merging
- **User Presence** - See who is online and editing in real-time
- **Cursor Tracking** - Colored cursors with name labels showing each user's position
- **Rich Text Formatting** - Bold, italic, underline, headers, lists, code blocks, and more
- **Document Persistence** - MongoDB Atlas for reliable cloud document storage
- **Auto-Save** - Automatic saving to cloud every 30 seconds
- **Google Authentication** - Firebase-powered Google Sign-In
- **Version History** - Track and view document revisions

### UI/UX Features
- Google Docs-inspired clean interface
- Real-time connection status indicator
- Collaborator avatars with color-coded presence
- Session-based cursor colors (like Google Docs)
- Responsive design for all devices
- AI-powered document generation (free tier)

---

## 🛠️ Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React 18 + Vite | Fast, modern UI framework |
| **Styling** | Tailwind CSS | Utility-first CSS |
| **Editor** | Quill.js + quill-cursors | Rich text editing with collaborative cursors |
| **Real-time Sync** | Yjs CRDT | Conflict-free replicated data types |
| **WebSocket** | y-websocket | Real-time communication |
| **Backend** | Node.js + Express | REST API server |
| **Database** | MongoDB Atlas | Cloud document storage |
| **Authentication** | Firebase Auth | Google Sign-In |
| **Frontend Hosting** | Vercel | Static site deployment |
| **Backend Hosting** | Render | Node.js server hosting |

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (React)                          │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │   Quill.js  │  │  y-quill    │  │    quill-cursors        │ │
│  │   Editor    │◄─┤  Binding    │◄─┤  (Cursor Rendering)     │ │
│  └─────────────┘  └──────┬──────┘  └─────────────────────────┘ │
│                          │                                      │
│                    ┌─────▼─────┐                                │
│                    │    Yjs    │  (CRDT Document)               │
│                    └─────┬─────┘                                │
└──────────────────────────┼──────────────────────────────────────┘
                           │ WebSocket
                           ▼
┌──────────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js + Express)                    │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  y-websocket    │  │  REST API       │  │   MongoDB       │  │
│  │  (Sync Server)  │  │  (Documents)    │  │   (Persistence) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

### Data Flow
1. User types in Quill editor
2. y-quill binds changes to Yjs CRDT document
3. Yjs syncs via WebSocket to all connected clients
4. quill-cursors renders remote user cursors
5. Documents are persisted to MongoDB via REST API

---

## 🚀 Installation

### Prerequisites
- Node.js 18+ 
- MongoDB Atlas account (free tier works)
- Firebase project (for Google Auth)

### 1. Clone Repository

```bash
git clone https://github.com/jeeva5655/dockata-collaborative-editor.git
cd dockata-collaborative-editor
```

### 2. Install Dependencies

```bash
npm run install:all
```

### 3. Configure Environment Variables

Create `.env` in the root directory:

```env
# MongoDB Atlas Connection
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/collab-editor

# Server Configuration
PORT=3001
CLIENT_URL=http://localhost:5173
```

Create `client/.env`:

```env
# Firebase Configuration (get from Firebase Console)
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Run Development Server

```bash
npm run dev
```

This starts:
- Backend server on http://localhost:3001
- React frontend on http://localhost:5173

### 5. Production Build

```bash
npm run build
npm start
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/documents` | List all documents |
| POST | `/api/documents` | Create new document |
| GET | `/api/documents/:id` | Get document info |
| PUT | `/api/documents/:id` | Update document |
| DELETE | `/api/documents/:id` | Delete document |
| GET | `/api/documents/:id/versions` | Get version history |
| POST | `/api/documents/:id/versions` | Save new version |

### WebSocket Protocol

Connect to: `wss://your-server.com/{document-id}`

---

## 🤖 AI Tools Used

> **Disclosure**: The following AI tools were used during the development of this project:

| Tool | Purpose | Usage |
|------|---------|-------|
| **GitHub Copilot (Claude Sonnet 4)** | Code assistance | Used via VS Code with GitHub Student Developer Pack for code generation, debugging, and implementation guidance |
| **Google Gemini** | Content research | Lightweight research for best practices in collaborative editing and CRDT implementation |
| **VoiceMaker.in** | Text-to-speech | Generated voice narration for the demo video |
| **YouCut App** | Video editing | Edited and assembled the demo video |

### AI Assistance Details
- **Code Generation**: GitHub Copilot assisted with React components, WebSocket integration, and CSS styling
- **Debugging**: AI helped identify and resolve cursor synchronization issues and color matching problems
- **Architecture**: AI provided guidance on CRDT implementation and real-time collaboration patterns
- **Documentation**: AI assisted in writing this README and code comments

---

## ⚠️ Known Limitations

1. **Cold Start Delay**: Backend hosted on Render free tier may have ~50 second cold start if inactive
2. **Concurrent User Limit**: Free tier supports limited concurrent WebSocket connections
3. **No Offline Support**: Requires active internet connection for real-time sync
4. **Limited AI Features**: AI document generation uses free APIs with rate limits
5. **No Export to PDF**: Currently supports text-based export only
6. **Session-based Colors**: Cursor colors may change if user refreshes the page

---

## 💪 Challenges & Solutions

| Challenge | Solution |
|-----------|----------|
| **Cursor color mismatch** | Set awareness state BEFORE QuillBinding creation so y-quill uses our colors |
| **Real-time sync conflicts** | Implemented Yjs CRDT for automatic conflict resolution |
| **WebSocket connection failures** | Added reconnection logic and connection status indicators |
| **Firebase popup auth issues** | Configured COOP headers and Firebase authorized domains |
| **Render cold starts** | Added loading states and retry logic for API calls |

---

## 📁 Project Structure

```
track1-collaborative-editor/
├── client/                     # React frontend
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── EditorProV2.jsx # Main editor with collaboration
│   │   │   ├── Home.jsx        # Landing/dashboard page
│   │   │   └── ...
│   │   ├── config/             # API and Firebase config
│   │   ├── context/            # React context (Auth)
│   │   ├── styles/             # CSS files
│   │   └── main.jsx            # App entry point
│   ├── .env                    # Frontend environment variables
│   └── package.json
├── server/                     # Node.js backend
│   ├── models/                 # MongoDB schemas
│   ├── routes/                 # API routes
│   └── index.js                # Server entry with WebSocket
├── .env                        # Backend environment variables
├── package.json                # Root package.json
└── README.md                   # This file
```

---

## 👨‍💻 Author

Built with ❤️ for GUVI Hackathon 2026

---

## 📄 License

MIT License - Free to use and modify
