import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { 
  ArrowLeft, Save, Users, Clock, Check, Loader2, 
  FileText, Share2, Download, History, Settings,
  Bold, Italic, Underline, List, ListOrdered, Quote,
  Code, Link as LinkIcon, Image, AlignLeft, AlignCenter, AlignRight
} from 'lucide-react'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import { WebsocketProvider } from 'y-websocket'
import { formatDistanceToNow } from 'date-fns'
import { API_URL, getWsUrl } from '../config/api'

// Register Quill modules
Quill.register('modules/cursors', QuillCursors)

export default function Editor({ user, setUser }) {
  const { docId } = useParams()
  const navigate = useNavigate()
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const providerRef = useRef(null)
  const ydocRef = useRef(null)
  
  const [docInfo, setDocInfo] = useState(null)
  const [title, setTitle] = useState('Untitled Document')
  const [collaborators, setCollaborators] = useState([])
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showRevisions, setShowRevisions] = useState(false)
  const [revisions, setRevisions] = useState([])
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [tempName, setTempName] = useState(user.name)

  // Fetch document info
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${API_URL}/api/documents/${docId}`)
        if (res.ok) {
          const data = await res.json()
          setDocInfo(data)
          setTitle(data.title)
        } else if (res.status === 404) {
          // Create document if it doesn't exist
          await fetch(`${API_URL}/api/documents`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              title: 'Untitled Document',
              owner: user.name 
            })
          })
        }
      } catch (error) {
        console.error('Error fetching document:', error)
      }
    }
    fetchDoc()
  }, [docId])

  // Initialize Quill and Yjs
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return

    // Create Yjs document
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    // Initialize Quill
    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        cursors: {
          transformOnTextChange: true,
        },
        toolbar: [
          [{ 'header': [1, 2, 3, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ 'color': [] }, { 'background': [] }],
          [{ 'list': 'ordered' }, { 'list': 'bullet' }],
          [{ 'indent': '-1' }, { 'indent': '+1' }],
          [{ 'align': [] }],
          ['blockquote', 'code-block'],
          ['link', 'image'],
          ['clean']
        ],
        history: {
          userOnly: true
        }
      },
      placeholder: 'Start typing... Your changes sync in real-time!'
    })
    quillRef.current = quill

    // Connect to WebSocket
    const wsUrl = getWsUrl(docId)
    const provider = new WebsocketProvider(wsUrl, docId, ydoc, {
      connect: true,
      awareness: null // We'll handle awareness separately
    })
    providerRef.current = provider

    // Get the shared text type
    const ytext = ydoc.getText('quill')

    // Bind Quill to Yjs
    const binding = new QuillBinding(ytext, quill, provider.awareness)

    // Set up awareness (user presence)
    provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color
    })

    // Handle connection status
    provider.on('status', ({ status }) => {
      setConnected(status === 'connected')
    })

    // Handle awareness updates (collaborators)
    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const users = []
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          users.push({
            clientId,
            name: state.user.name,
            color: state.user.color
          })
        }
      })
      setCollaborators(users)
    }

    provider.awareness.on('change', handleAwarenessChange)

    // Add cursor module styling for remote cursors
    const cursorsModule = quill.getModule('cursors')
    
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          cursorsModule.createCursor(clientId.toString(), state.user.name, state.user.color)
        }
      })
    })

    // Cleanup
    return () => {
      binding.destroy()
      provider.disconnect()
      provider.destroy()
      ydoc.destroy()
    }
  }, [docId, user])

  // Update awareness when user changes
  useEffect(() => {
    if (providerRef.current?.awareness) {
      providerRef.current.awareness.setLocalStateField('user', {
        name: user.name,
        color: user.color
      })
    }
  }, [user])

  // Save revision
  const saveRevision = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/documents/${docId}/revisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ savedBy: user.name })
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Error saving revision:', error)
    } finally {
      setSaving(false)
    }
  }

  // Update title
  const updateTitle = async () => {
    if (!newTitle.trim()) return
    
    try {
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle.trim() })
      })
      setTitle(newTitle.trim())
      setEditingTitle(false)
    } catch (error) {
      console.error('Error updating title:', error)
    }
  }

  // Fetch revisions
  const fetchRevisions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}/revisions`)
      if (res.ok) {
        const data = await res.json()
        setRevisions(data)
        setShowRevisions(true)
      }
    } catch (error) {
      console.error('Error fetching revisions:', error)
    }
  }

  // Update username
  const updateUserName = () => {
    if (tempName.trim()) {
      setUser({ ...user, name: tempName.trim() })
      setShowNameModal(false)
    }
  }

  // Export document
  const exportDocument = () => {
    if (!quillRef.current) return
    const content = quillRef.current.root.innerHTML
    const blob = new Blob([content], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.html`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark-bg/80 border-b border-dark-border">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Left section */}
          <div className="flex items-center gap-4">
            <Link 
              to="/"
              className="p-2 rounded-lg hover:bg-dark-card transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <FileText className="w-4 h-4 text-white" />
              </div>
              
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && updateTitle()}
                    className="input py-1 px-2 w-64"
                    autoFocus
                  />
                  <button onClick={updateTitle} className="btn-primary py-1 px-3 text-sm">
                    Save
                  </button>
                  <button 
                    onClick={() => setEditingTitle(false)} 
                    className="btn-ghost py-1 px-3 text-sm"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => { setNewTitle(title); setEditingTitle(true) }}
                  className="text-lg font-semibold hover:text-primary-400 transition-colors"
                >
                  {title}
                </button>
              )}
            </div>
          </div>

          {/* Center - connection status */}
          <div className="hidden md:flex items-center gap-2 text-sm">
            <div className={`status-dot ${connected ? 'online' : 'offline'}`} />
            <span className="text-gray-400">
              {connected ? 'Connected' : 'Connecting...'}
            </span>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-3">
            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center -space-x-2 mr-2">
                {collaborators.slice(0, 5).map(collab => (
                  <div
                    key={collab.clientId}
                    className="avatar"
                    style={{ backgroundColor: collab.color }}
                    title={collab.name}
                  >
                    {collab.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 5 && (
                  <div className="avatar bg-dark-card text-gray-400">
                    +{collaborators.length - 5}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <button
              onClick={fetchRevisions}
              className="btn-ghost p-2"
              title="Revision history"
            >
              <History className="w-5 h-5" />
            </button>

            <button
              onClick={exportDocument}
              className="btn-ghost p-2"
              title="Export"
            >
              <Download className="w-5 h-5" />
            </button>

            <button
              onClick={saveRevision}
              disabled={saving}
              className="btn-primary flex items-center gap-2"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : saved ? (
                <Check className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {saved ? 'Saved!' : 'Save'}
            </button>

            {/* User avatar */}
            <button
              onClick={() => { setTempName(user.name); setShowNameModal(true) }}
              className="avatar ml-2"
              style={{ backgroundColor: user.color }}
              title="Change name"
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Editor */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6">
        <div className="card p-0 overflow-hidden">
          <div ref={editorRef} />
        </div>
      </main>

      {/* Collaborators sidebar (visible when there are collaborators) */}
      {collaborators.length > 0 && (
        <div className="fixed right-4 top-24 w-64 card">
          <h4 className="text-sm font-semibold text-gray-400 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Online ({collaborators.length + 1})
          </h4>
          <div className="space-y-2">
            {/* Current user */}
            <div className="flex items-center gap-3 p-2 rounded-lg bg-primary-500/10">
              <div className="avatar" style={{ backgroundColor: user.color }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user.name} (you)</span>
            </div>
            
            {/* Other collaborators */}
            {collaborators.map(collab => (
              <div key={collab.clientId} className="flex items-center gap-3 p-2">
                <div className="avatar" style={{ backgroundColor: collab.color }}>
                  {collab.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{collab.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Revisions modal */}
      {showRevisions && (
        <div className="modal-backdrop" onClick={() => setShowRevisions(false)}>
          <div className="modal-content card w-full max-w-md max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5 text-primary-400" />
              Revision History
            </h3>
            
            {revisions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No revisions saved yet</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg/50">
                    <div>
                      <p className="font-medium">Revision {i + 1}</p>
                      <p className="text-sm text-gray-500">
                        by {rev.savedBy} • {formatDistanceToNow(new Date(rev.savedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <button 
              onClick={() => setShowRevisions(false)} 
              className="btn-secondary w-full mt-4"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Name change modal */}
      {showNameModal && (
        <div className="modal-backdrop" onClick={() => setShowNameModal(false)}>
          <div className="modal-content card w-full max-w-sm" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Change Display Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && updateUserName()}
              className="input mb-4"
              placeholder="Enter your name"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="btn-secondary flex-1">
                Cancel
              </button>
              <button onClick={updateUserName} className="btn-primary flex-1">
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
