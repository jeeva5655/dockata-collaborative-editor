import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  FileText, Plus, Trash2, Clock, User, Search, Menu, X,
  Settings, LogOut, Grid, List, SortAsc, ChevronDown,
  Table, Presentation, FileSpreadsheet, ClipboardList,
  HardDrive, Star, Users, Loader2, MoreVertical
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { API_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'

// Document Templates
const templates = [
  { id: 'blank', name: 'Blank document', icon: Plus, preview: null, color: '#4285f4' },
  { id: 'resume-serif', name: 'Resume', subtitle: 'Serif', preview: '📄', color: '#34a853' },
  { id: 'resume-coral', name: 'Resume', subtitle: 'Coral', preview: '📄', color: '#ea4335' },
  { id: 'letter', name: 'Letter', subtitle: 'Spearmint', preview: '✉️', color: '#fbbc04' },
  { id: 'project', name: 'Project proposal', subtitle: 'Tropic', preview: '📊', color: '#4285f4' },
  { id: 'brochure', name: 'Brochure', subtitle: 'Geometric', preview: '📰', color: '#34a853' },
  { id: 'report', name: 'Report', subtitle: 'Luxe', preview: '📋', color: '#ea4335' }
]

// Sidebar products
const products = [
  { id: 'docs', name: 'Docs', icon: FileText, color: '#4285f4', active: true },
  { id: 'sheets', name: 'Sheets', icon: FileSpreadsheet, color: '#34a853' },
  { id: 'slides', name: 'Slides', icon: Presentation, color: '#fbbc04' },
  { id: 'vids', name: 'Vids', icon: () => <span className="text-lg">▶️</span>, color: '#ea4335' },
  { id: 'forms', name: 'Forms', icon: ClipboardList, color: '#673ab7' }
]

export default function Dashboard() {
  const { user, signOut } = useAuth()
  const [documents, setDocuments] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('recent')
  const [showUserMenu, setShowUserMenu] = useState(false)
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

  const createDocument = async (templateId = 'blank') => {
    setCreating(true)
    try {
      const template = templates.find(t => t.id === templateId)
      const res = await fetch(`${API_URL}/api/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title: templateId === 'blank' ? 'Untitled Document' : template?.name || 'Untitled',
          owner: user?.name || 'Anonymous',
          template: templateId
        })
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

  const filteredDocs = documents.filter(doc => 
    doc.title.toLowerCase().includes(search.toLowerCase())
  )

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-0'} transition-all duration-300 overflow-hidden border-r border-gray-200 bg-gray-50 flex-shrink-0`}>
        <div className="p-4 h-full flex flex-col">
          {/* Products */}
          <nav className="space-y-1">
            {products.map(product => (
              <button
                key={product.id}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-full text-left transition-colors
                  ${product.active ? 'bg-blue-50 text-blue-700' : 'text-gray-700 hover:bg-gray-100'}`}
              >
                {typeof product.icon === 'function' ? (
                  <product.icon />
                ) : (
                  <product.icon className="w-5 h-5" style={{ color: product.active ? product.color : undefined }} />
                )}
                <span className="font-medium">{product.name}</span>
              </button>
            ))}
          </nav>

          <div className="my-4 border-t border-gray-200" />

          {/* Settings & Help */}
          <nav className="space-y-1">
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-gray-700 hover:bg-gray-100 text-left">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-full text-gray-700 hover:bg-gray-100 text-left">
              <HardDrive className="w-5 h-5" />
              <span>Drive</span>
            </button>
          </nav>

          <div className="mt-auto pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 px-4">
              Privacy Policy · Terms of Service
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white border-b border-gray-100">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-4">
              <button 
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <Menu className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded bg-blue-600 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl text-gray-800">Docs</span>
              </div>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-gray-100 hover:bg-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-full text-gray-700 outline-none transition-all"
                />
              </div>
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-gray-100 rounded-full">
                <Grid className="w-5 h-5 text-gray-600" />
              </button>
              
              {/* User Menu */}
              <div className="relative">
                <button 
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-10 h-10 rounded-full overflow-hidden border-2 border-transparent hover:border-gray-200"
                >
                  {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                  ) : (
                    <div 
                      className="w-full h-full flex items-center justify-center text-white font-medium"
                      style={{ backgroundColor: user?.color || '#4285f4' }}
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                  )}
                </button>

                {showUserMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
                    <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden">
                      <div className="p-4 text-center border-b border-gray-100">
                        <div className="w-16 h-16 rounded-full mx-auto mb-3 overflow-hidden">
                          {user?.photoURL ? (
                            <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
                          ) : (
                            <div 
                              className="w-full h-full flex items-center justify-center text-white text-2xl font-medium"
                              style={{ backgroundColor: user?.color || '#4285f4' }}
                            >
                              {user?.name?.charAt(0).toUpperCase() || 'U'}
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900">{user?.name}</p>
                        <p className="text-sm text-gray-500">{user?.email || 'Guest User'}</p>
                      </div>
                      <div className="p-2">
                        <button 
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg text-left"
                        >
                          <LogOut className="w-5 h-5" />
                          <span>Sign out</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto">
          {/* Templates Section */}
          <section className="bg-gray-50 py-6 px-8 border-b border-gray-200">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-gray-700">Start a new document</h2>
                <button className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-200 px-3 py-1.5 rounded">
                  Template gallery
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-2">
                {templates.map(template => (
                  <button
                    key={template.id}
                    onClick={() => createDocument(template.id)}
                    disabled={creating}
                    className="flex-shrink-0 group"
                  >
                    <div className={`w-36 h-48 rounded-lg border-2 border-gray-200 hover:border-blue-500 transition-colors overflow-hidden
                      ${template.id === 'blank' ? 'flex items-center justify-center bg-white' : 'bg-white'}`}
                    >
                      {template.id === 'blank' ? (
                        <Plus className="w-16 h-16 text-blue-500" strokeWidth={1} />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl bg-gray-50">
                          {template.preview}
                        </div>
                      )}
                    </div>
                    <p className="mt-2 text-sm font-medium text-gray-700">{template.name}</p>
                    {template.subtitle && (
                      <p className="text-xs text-gray-500">{template.subtitle}</p>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Documents Section */}
          <section className="py-6 px-8">
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-medium text-gray-700">Recent documents</h2>
                <div className="flex items-center gap-2">
                  <button className="flex items-center gap-1 text-sm text-gray-600 hover:bg-gray-100 px-3 py-1.5 rounded">
                    Owned by anyone
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded ${viewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4 text-gray-600" />
                  </button>
                  <button 
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded ${viewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Grid className="w-4 h-4 text-gray-600" />
                  </button>
                  <button className="p-2 rounded hover:bg-gray-100">
                    <SortAsc className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : filteredDocs.length === 0 ? (
                <div className="text-center py-20">
                  <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-700 mb-2">No documents yet</h3>
                  <p className="text-gray-500">Click "Blank document" above to create one</p>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.docId}
                      onClick={() => navigate(`/doc/${doc.docId}`)}
                      className="group cursor-pointer"
                    >
                      <div className="aspect-[3/4] rounded-lg border border-gray-200 hover:border-blue-500 bg-white overflow-hidden relative">
                        <div className="p-4 h-full">
                          <div className="text-xs text-gray-400 line-clamp-[12]">
                            {doc.preview || 'Empty document'}
                          </div>
                        </div>
                        <button
                          onClick={e => deleteDocument(e, doc.docId)}
                          className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow opacity-0 group-hover:opacity-100 hover:bg-gray-100 transition-opacity"
                        >
                          <MoreVertical className="w-4 h-4 text-gray-600" />
                        </button>
                      </div>
                      <p className="mt-2 text-sm font-medium text-gray-700 truncate">{doc.title}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <FileText className="w-3 h-3 text-blue-500" />
                        <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-1">
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.docId}
                      onClick={() => navigate(`/doc/${doc.docId}`)}
                      className="flex items-center gap-4 p-3 hover:bg-gray-50 rounded-lg cursor-pointer group"
                    >
                      <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-gray-700 truncate">{doc.title}</p>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {doc.owner}
                        </span>
                        <span>{formatDistanceToNow(new Date(doc.updatedAt), { addSuffix: true })}</span>
                      </div>
                      <button
                        onClick={e => deleteDocument(e, doc.docId)}
                        className="p-2 hover:bg-gray-200 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
