import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Trash2, Clock, User, Search, 
  Settings, LogOut, Sparkles, Loader2
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { API_URL } from '../config/api'

export default function Home({ user, setUser }) {
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [showSettings, setShowSettings] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const navigate = useNavigate()

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents`)
      if (res.ok) {
        const data = await res.json()
        setDocuments(data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const createDocument = async () => {
    setCreating(true)
    try {
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Untitled Document', owner: user.name })
      })
      
      if (res.ok) {
        const doc = await res.json()
        navigate(`/doc/${doc.docId}`)
      }
    } catch (error) {
      console.error('Failed to create document:', error)
    } finally {
      setCreating(false)
    }
  }

  const deleteDocument = async (e, docId) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this document?')) return
    
    try {
      await fetch(`${API_URL}/api/documents/${docId}`, { method: 'DELETE' })
      setDocuments(docs => docs.filter(d => d.docId !== docId))
    } catch (error) {
      console.error('Failed to delete document:', error)
    }
  }

  const updateUserName = () => {
    if (newName.trim()) {
      setUser({ ...user, name: newName.trim() })
      setShowSettings(false)
    }
  }

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-dark-bg/80 border-b border-dark-border">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-pink-500 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-pink-400 bg-clip-text text-transparent">
                  CollabDocs
                </h1>
                <p className="text-xs text-gray-500">Real-time Collaborative Editor</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Search */}
              <div className="relative hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search documents..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="input pl-10 w-64"
                />
              </div>

              {/* User menu */}
              <div className="relative">
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-dark-card transition-colors"
                >
                  <div 
                    className="avatar"
                    style={{ backgroundColor: user.color }}
                  >
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="hidden md:block text-sm font-medium">{user.name}</span>
                </button>

                {showSettings && (
                  <div className="absolute right-0 top-full mt-2 w-72 card animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-dark-border">
                      <div 
                        className="w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold"
                        style={{ backgroundColor: user.color }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold">{user.name}</p>
                        <p className="text-sm text-gray-500">Collaborator</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm text-gray-400 block mb-1">Display Name</label>
                        <input
                          type="text"
                          value={newName}
                          onChange={e => setNewName(e.target.value)}
                          className="input text-sm"
                          placeholder="Enter your name"
                        />
                      </div>
                      <button onClick={updateUserName} className="btn-primary w-full text-sm">
                        Update Name
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome section */}
        <div className="mb-8 p-8 rounded-2xl bg-gradient-to-br from-primary-500/20 via-dark-card to-pink-500/20 border border-dark-border">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">
                Welcome back, {user.name}! <Sparkles className="inline w-8 h-8 text-yellow-400" />
              </h2>
              <p className="text-gray-400 max-w-lg">
                Create, collaborate, and share documents in real-time. 
                Experience seamless editing with instant sync across all devices.
              </p>
            </div>
            <button
              onClick={createDocument}
              disabled={creating}
              className="btn-primary flex items-center gap-2 text-lg px-6 py-3"
            >
              {creating ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Plus className="w-5 h-5" />
              )}
              New Document
            </button>
          </div>
        </div>

        {/* Documents grid */}
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-semibold">Your Documents</h3>
          <p className="text-sm text-gray-500">{filteredDocs.length} documents</p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
          </div>
        ) : filteredDocs.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-dark-card flex items-center justify-center">
              <FileText className="w-10 h-10 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">No documents yet</h3>
            <p className="text-gray-500 mb-6">Create your first document to get started</p>
            <button onClick={createDocument} className="btn-primary">
              <Plus className="w-4 h-4 mr-2 inline" />
              Create Document
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDocs.map(doc => (
              <div
                key={doc.docId}
                onClick={() => navigate(`/doc/${doc.docId}`)}
                className="doc-card card group cursor-pointer hover:border-primary-500/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-pink-500/20 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary-400" />
                  </div>
                  <button
                    onClick={e => deleteDocument(e, doc.docId)}
                    className="p-2 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 
                               opacity-0 group-hover:opacity-100 transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h4 className="font-semibold mb-2 truncate">{doc.title}</h4>
                
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {doc.owner}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Click outside to close settings */}
      {showSettings && (
        <div 
          className="fixed inset-0 z-30" 
          onClick={() => setShowSettings(false)} 
        />
      )}
    </div>
  )
}
