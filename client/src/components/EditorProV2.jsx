import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { 
  ArrowLeft, Save, Users, Check, Loader2, FileText, Share2, Download, History,
  Search, Printer, Copy, Undo, Redo, ChevronDown, Smile, Menu, Eye, 
  Keyboard, HelpCircle, X, ZoomIn, ZoomOut, Star, Wand2, PenLine, FileCheck,
  MoreHorizontal, Calendar, CheckSquare, User, MapPin, Figma, Plus, ChevronRight,
  Clock, MessageSquare, Settings, Bold, Italic, Underline, AlignLeft, AlignCenter,
  AlignRight, List, ListOrdered, Link as LinkIcon, Image, Highlighter, Cloud,
  CloudOff, FileUp, FileType
} from 'lucide-react'
import Quill from 'quill'
import QuillCursors from 'quill-cursors'
import * as Y from 'yjs'
import { QuillBinding } from 'y-quill'
import { WebsocketProvider } from 'y-websocket'
import { format, formatDistanceToNow } from 'date-fns'
import { API_URL, getWsUrl } from '../config/api'
import { useAuth } from '../context/AuthContext'
import jsPDF from 'jspdf'
import html2canvas from 'html2canvas'

// Register Quill modules
Quill.register('modules/cursors', QuillCursors)

// Font families
const Font = Quill.import('formats/font')
Font.whitelist = ['arial', 'times-new-roman', 'georgia', 'verdana', 'courier', 'comic-sans']
Quill.register(Font, true)

// Font sizes
const Size = Quill.import('attributors/style/size')
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '72px']
Quill.register(Size, true)

// Unique colors for different collaborators
const collaboratorColors = [
  '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3',
  '#00BCD4', '#009688', '#4CAF50', '#8BC34A', '#FF9800',
  '#FF5722', '#795548', '#607D8B', '#F44336', '#00ACC1'
]

// Get color for user based on their ID/name
const getUserColor = (userId) => {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return collaboratorColors[Math.abs(hash) % collaboratorColors.length]
}

// AI Writing Prompts (Free - using local generation)
const aiPrompts = {
  generate: [
    { label: 'Blog Post', prompt: 'Write a blog post about' },
    { label: 'Email', prompt: 'Write a professional email about' },
    { label: 'Story', prompt: 'Write a short story about' },
    { label: 'Report', prompt: 'Write a report on' }
  ],
  help: [
    { label: 'Make it longer', action: 'expand' },
    { label: 'Make it shorter', action: 'summarize' },
    { label: 'Fix grammar', action: 'grammar' },
    { label: 'Change tone to formal', action: 'formal' },
    { label: 'Change tone to casual', action: 'casual' }
  ]
}

// Sidebar Plugins
const sidePlugins = [
  { id: 'calendar', name: 'Calendar', icon: Calendar, color: '#4285f4' },
  { id: 'tasks', name: 'Tasks', icon: CheckSquare, color: '#4285f4' },
  { id: 'contacts', name: 'Contacts', icon: User, color: '#4285f4' },
  { id: 'maps', name: 'Maps', icon: MapPin, color: '#34a853' },
  { id: 'figma', name: 'Figma', icon: Figma, color: '#a259ff' }
]

export default function EditorProV2() {
  const { docId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const providerRef = useRef(null)
  const ydocRef = useRef(null)
  const cursorsRef = useRef(null)
  const autoSaveTimerRef = useRef(null)
  
  // Document state
  const [title, setTitle] = useState('Untitled Document')
  const [collaborators, setCollaborators] = useState([])
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // UI state
  const [activeMenu, setActiveMenu] = useState(null)
  const [zoom, setZoom] = useState(100)
  const [showSidebar, setShowSidebar] = useState(true)
  const [showPlugins, setShowPlugins] = useState(false)
  const [activePlugin, setActivePlugin] = useState(null)
  
  // Version History
  const [showVersionHistory, setShowVersionHistory] = useState(false)
  const [versions, setVersions] = useState([])
  const [selectedVersion, setSelectedVersion] = useState(null)
  
  // AI Features
  const [showAI, setShowAI] = useState(false)
  const [aiMode, setAiMode] = useState(null)
  const [aiLoading, setAiLoading] = useState(false)
  
  // Share
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Document Tabs
  const [tabs, setTabs] = useState([{ id: 'tab1', name: 'Tab 1' }])
  const [activeTab, setActiveTab] = useState('tab1')
  
  // Word count
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0 })

  // Auto-save function
  const autoSave = useCallback(async () => {
    if (!hasUnsavedChanges || !quillRef.current) return
    
    setSaving(true)
    try {
      const content = quillRef.current.root.innerHTML
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title,
          content,
          lastEditor: user?.name || 'Anonymous'
        })
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Auto-save failed:', error)
    }
    setSaving(false)
  }, [docId, title, hasUnsavedChanges, user])

  // Initialize editor
  useEffect(() => {
    if (!editorRef.current || quillRef.current) return

    // Get user color based on their ID
    const userColor = user?.color || getUserColor(user?.uid || user?.name || 'anonymous')

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        cursors: {
          transformOnTextChange: true,
          hideDelayMs: 5000,
          hideSpeedMs: 0,
          selectionChangeSource: null
        },
        toolbar: '#toolbar',
        history: { userOnly: true }
      },
      placeholder: 'Start typing...'
    })

    quillRef.current = quill
    cursorsRef.current = quill.getModule('cursors')

    // Word count & track changes
    quill.on('text-change', (delta, oldDelta, source) => {
      const text = quill.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.length - 1
      setWordCount({ words, chars })
      
      // Mark as having unsaved changes
      if (source === 'user') {
        setHasUnsavedChanges(true)
      }
    })

    // Yjs setup
    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    const wsUrl = getWsUrl(docId)
    const provider = new WebsocketProvider(wsUrl, docId, ydoc)
    providerRef.current = provider

    const ytext = ydoc.getText('quill')
    new QuillBinding(ytext, quill, provider.awareness)

    // Set user info for awareness with unique color
    provider.awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous',
      color: userColor,
      odataId: user?.uid || Math.random().toString(36).substr(2, 9)
    })

    // Track collaborators and update cursors
    const updateCollaborators = () => {
      const states = provider.awareness.getStates()
      const users = []
      
      states.forEach((state, clientId) => {
        if (state.user && clientId !== provider.awareness.clientID) {
          const collaborator = {
            ...state.user,
            clientId,
            color: state.user.color || getUserColor(state.user.name || clientId.toString())
          }
          users.push(collaborator)
          
          // Update or create cursor with user's color
          if (cursorsRef.current) {
            try {
              // Remove existing cursor first to update color
              cursorsRef.current.removeCursor(clientId.toString())
              cursorsRef.current.createCursor(
                clientId.toString(),
                state.user.name || 'Anonymous',
                collaborator.color
              )
            } catch (e) {
              // Cursor handling
            }
          }
        }
      })
      
      setCollaborators(users)
    }

    provider.awareness.on('change', updateCollaborators)

    provider.on('status', ({ status }) => {
      setConnected(status === 'connected')
    })

    // Fetch document info
    fetchDocument()
    fetchVersions()

    return () => {
      provider.disconnect()
      ydoc.destroy()
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [docId])

  // Auto-save timer
  useEffect(() => {
    if (autoSaveEnabled) {
      autoSaveTimerRef.current = setInterval(() => {
        autoSave()
      }, 30000) // Auto-save every 30 seconds
    }
    
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current)
      }
    }
  }, [autoSaveEnabled, autoSave])

  const fetchDocument = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}`)
      if (res.ok) {
        const doc = await res.json()
        setTitle(doc.title || 'Untitled Document')
        setLastSaved(doc.updatedAt)
      }
    } catch (error) {
      console.error('Failed to fetch document:', error)
    }
  }

  const fetchVersions = async () => {
    try {
      const res = await fetch(`${API_URL}/api/documents/${docId}/versions`)
      if (res.ok) {
        const data = await res.json()
        setVersions(data)
      }
    } catch (error) {
      // Versions API might not exist yet, mock it
      setVersions([
        { id: 1, timestamp: new Date(), editor: user?.name || 'Anonymous', changes: 'Current version' },
        { id: 2, timestamp: new Date(Date.now() - 300000), editor: user?.name || 'Anonymous', changes: 'Previous edit' }
      ])
    }
  }

  const saveDocument = async () => {
    setSaving(true)
    try {
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title })
      })
      setLastSaved(new Date())
    } catch (error) {
      console.error('Failed to save:', error)
    }
    setSaving(false)
  }

  const updateTitle = async (newTitle) => {
    setTitle(newTitle)
    try {
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle })
      })
    } catch (error) {
      console.error('Failed to update title:', error)
    }
  }

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // AI Text Generation (Free - simple local templates)
  const generateAIContent = async (type, input) => {
    setAiLoading(true)
    
    // Simulate AI generation with templates (free, no API needed)
    const templates = {
      'blog': `# ${input}\n\nIntroduction paragraph about ${input}.\n\n## Key Points\n\n1. First important point\n2. Second important point\n3. Third important point\n\n## Conclusion\n\nSummary of thoughts on ${input}.`,
      'email': `Subject: ${input}\n\nDear [Recipient],\n\nI hope this email finds you well. I am writing to discuss ${input}.\n\n[Main content here]\n\nPlease let me know if you have any questions.\n\nBest regards,\n${user?.name || 'Your Name'}`,
      'meeting': `# Meeting Notes\n\n**Date:** ${format(new Date(), 'MMMM d, yyyy')}\n**Time:** ${format(new Date(), 'h:mm a')}\n**Attendees:** \n\n## Agenda\n\n1. \n2. \n3. \n\n## Discussion Points\n\n- \n\n## Action Items\n\n- [ ] Task 1 - @assignee\n- [ ] Task 2 - @assignee\n\n## Next Meeting\n\nScheduled for: `,
      'expand': (text) => `${text}\n\nFurthermore, this topic deserves deeper exploration. Consider the following additional aspects...`,
      'summarize': (text) => text.split('.').slice(0, 2).join('.') + '.',
      'formal': (text) => text.replace(/hey|hi/gi, 'Dear').replace(/thanks/gi, 'Thank you'),
      'casual': (text) => text.replace(/Dear/gi, 'Hey').replace(/Thank you/gi, 'Thanks')
    }

    await new Promise(r => setTimeout(r, 1000)) // Simulate delay

    let content = ''
    if (type === 'blog' || type === 'email') {
      content = templates[type]
    } else if (type === 'meeting') {
      content = templates.meeting
    } else if (templates[type]) {
      const selection = quillRef.current?.getSelection()
      if (selection && selection.length > 0) {
        const selectedText = quillRef.current.getText(selection.index, selection.length)
        content = templates[type](selectedText)
      }
    }

    if (content && quillRef.current) {
      const range = quillRef.current.getSelection() || { index: quillRef.current.getLength() }
      quillRef.current.insertText(range.index, content)
    }

    setAiLoading(false)
    setShowAI(false)
    setAiMode(null)
  }

  // Export as PDF
  const exportAsPDF = async () => {
    if (!quillRef.current) return
    
    setSaving(true)
    try {
      const editorContent = quillRef.current.root
      const canvas = await html2canvas(editorContent, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff'
      })
      
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF('p', 'mm', 'a4')
      const pdfWidth = pdf.internal.pageSize.getWidth()
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
      pdf.save(`${title}.pdf`)
    } catch (error) {
      console.error('PDF export failed:', error)
      alert('Failed to export PDF. Please try again.')
    }
    setSaving(false)
  }

  // Manual save with content
  const manualSave = async () => {
    setSaving(true)
    try {
      const content = quillRef.current?.root.innerHTML || ''
      await fetch(`${API_URL}/api/documents/${docId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          title,
          content,
          lastEditor: user?.name || 'Anonymous'
        })
      })
      setLastSaved(new Date())
      setHasUnsavedChanges(false)
    } catch (error) {
      console.error('Failed to save:', error)
    }
    setSaving(false)
  }

  // Menus
  const menus = {
    file: [
      { label: 'New', shortcut: 'Ctrl+N', action: () => navigate('/dashboard') },
      { label: 'Save', shortcut: 'Ctrl+S', action: manualSave },
      { label: 'Download as PDF', icon: FileType, action: exportAsPDF },
      { label: 'Download as HTML', action: () => downloadAs('html') },
      { label: 'Download as Text', action: () => downloadAs('txt') },
      { label: 'Print', shortcut: 'Ctrl+P', action: () => window.print() }
    ],
    edit: [
      { label: 'Undo', shortcut: 'Ctrl+Z', action: () => quillRef.current?.history.undo() },
      { label: 'Redo', shortcut: 'Ctrl+Y', action: () => quillRef.current?.history.redo() },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => document.execCommand('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => document.execCommand('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: () => document.execCommand('paste') }
    ],
    view: [
      { label: 'Zoom In', action: () => setZoom(z => Math.min(200, z + 10)) },
      { label: 'Zoom Out', action: () => setZoom(z => Math.max(50, z - 10)) },
      { label: 'Reset Zoom', action: () => setZoom(100) }
    ],
    insert: [
      { label: 'Image', action: () => insertImage() },
      { label: 'Link', action: () => insertLink() },
      { label: 'Table', action: () => {} }
    ],
    format: [
      { label: 'Bold', shortcut: 'Ctrl+B', action: () => quillRef.current?.format('bold', true) },
      { label: 'Italic', shortcut: 'Ctrl+I', action: () => quillRef.current?.format('italic', true) },
      { label: 'Underline', shortcut: 'Ctrl+U', action: () => quillRef.current?.format('underline', true) }
    ],
    tools: [
      { label: 'Word Count', action: () => alert(`Words: ${wordCount.words}\nCharacters: ${wordCount.chars}`) },
      { label: 'Spelling & Grammar', action: () => {} }
    ]
  }

  const downloadAs = (format) => {
    const content = quillRef.current?.root.innerHTML || ''
    const blob = new Blob([format === 'html' ? content : quillRef.current?.getText() || ''], 
      { type: format === 'html' ? 'text/html' : 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title}.${format}`
    a.click()
  }

  const insertImage = () => {
    const url = prompt('Enter image URL:')
    if (url) {
      const range = quillRef.current?.getSelection()
      quillRef.current?.insertEmbed(range?.index || 0, 'image', url)
    }
  }

  const insertLink = () => {
    const url = prompt('Enter URL:')
    if (url) {
      quillRef.current?.format('link', url)
    }
  }

  return (
    <div className="h-screen flex flex-col bg-gray-100 editor-page">
      {/* Top Menu Bar */}
      <header className="bg-white border-b border-gray-200 flex-shrink-0">
        {/* Title Row */}
        <div className="flex items-center px-4 py-2 gap-2">
          <Link to="/dashboard" className="p-2 hover:bg-gray-100 rounded-full">
            <FileText className="w-6 h-6 text-blue-600" />
          </Link>
          
          <div className="flex-1">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onBlur={() => updateTitle(title)}
              className="text-lg font-medium text-gray-800 bg-transparent border-none outline-none hover:bg-gray-100 focus:bg-gray-100 px-2 py-1 rounded"
            />
            <div className="flex items-center gap-3 text-xs text-gray-500 px-2">
              {/* Save Status Indicator */}
              <div className="flex items-center gap-1">
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin text-blue-500" />
                    <span className="text-blue-500">Saving...</span>
                  </>
                ) : hasUnsavedChanges ? (
                  <>
                    <CloudOff className="w-3 h-3 text-orange-500" />
                    <span className="text-orange-500">Unsaved changes</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3 h-3 text-green-500" />
                    <span className="text-green-500">
                      Saved {lastSaved ? formatDistanceToNow(new Date(lastSaved), { addSuffix: true }) : ''}
                    </span>
                  </>
                )}
              </div>
              <span className="text-gray-300">|</span>
              <Star className="w-3 h-3 cursor-pointer hover:text-yellow-500" />
              {/* Auto-save toggle */}
              <button 
                onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                className={`text-xs px-2 py-0.5 rounded ${autoSaveEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}
                title={autoSaveEnabled ? 'Auto-save enabled' : 'Auto-save disabled'}
              >
                {autoSaveEnabled ? 'Auto-save: ON' : 'Auto-save: OFF'}
              </button>
            </div>
          </div>

          {/* Version History Button */}
          <button 
            onClick={() => setShowVersionHistory(true)}
            className="p-2 hover:bg-gray-100 rounded-full"
            title="Version history"
          >
            <History className="w-5 h-5 text-gray-600" />
          </button>

          {/* Comments */}
          <button className="p-2 hover:bg-gray-100 rounded-full">
            <MessageSquare className="w-5 h-5 text-gray-600" />
          </button>

          {/* Collaborators */}
          {collaborators.length > 0 && (
            <div className="flex -space-x-2 mr-2 relative group">
              {collaborators.slice(0, 3).map((collab, i) => (
                <div
                  key={i}
                  className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium relative cursor-pointer transition-transform hover:scale-110 hover:z-10"
                  style={{ backgroundColor: collab.color }}
                  title={`${collab.name} (${connected ? 'Editing' : 'Offline'})`}
                >
                  {collab.name?.charAt(0).toUpperCase() || '?'}
                  {/* Online indicator */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                </div>
              ))}
              {collaborators.length > 3 && (
                <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-400 flex items-center justify-center text-white text-xs">
                  +{collaborators.length - 3}
                </div>
              )}
              {/* Tooltip showing all collaborators */}
              <div className="absolute top-full mt-2 right-0 bg-white shadow-lg rounded-lg border p-3 hidden group-hover:block z-50 min-w-48">
                <div className="text-xs text-gray-500 mb-2">Currently editing:</div>
                {collaborators.map((collab, i) => (
                  <div key={i} className="flex items-center gap-2 py-1">
                    <div 
                      className="w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-medium"
                      style={{ backgroundColor: collab.color }}
                    >
                      {collab.name?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <span className="text-sm text-gray-700">{collab.name}</span>
                    <span className="text-xs text-green-500">● Active</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Share Button */}
          <button 
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-5 py-2 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-full font-medium"
          >
            <Share2 className="w-4 h-4" />
            Share
          </button>

          {/* User Avatar */}
          <div 
            className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium"
            style={{ backgroundColor: user?.color || '#4285f4' }}
          >
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>

        {/* Menu Bar */}
        <div className="flex items-center px-4 py-1 text-sm border-t border-gray-100">
          {Object.entries(menus).map(([menuName, items]) => (
            <div key={menuName} className="relative">
              <button
                onClick={() => setActiveMenu(activeMenu === menuName ? null : menuName)}
                className={`px-3 py-1 rounded hover:bg-gray-100 capitalize ${activeMenu === menuName ? 'bg-gray-100' : ''}`}
              >
                {menuName}
              </button>
              {activeMenu === menuName && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />
                  <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50 py-1">
                    {items.map((item, i) => (
                      <button
                        key={i}
                        onClick={() => { item.action(); setActiveMenu(null); }}
                        className="w-full flex items-center justify-between px-4 py-2 hover:bg-gray-100 text-left"
                      >
                        <span>{item.label}</span>
                        {item.shortcut && <span className="text-xs text-gray-400">{item.shortcut}</span>}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Toolbar */}
        <div id="toolbar" className="flex items-center gap-1 px-4 py-2 border-t border-gray-100 flex-wrap">
          {/* Undo/Redo */}
          <button onClick={() => quillRef.current?.history.undo()} className="p-1.5 hover:bg-gray-200 rounded" title="Undo">
            <Undo className="w-4 h-4 text-gray-600" />
          </button>
          <button onClick={() => quillRef.current?.history.redo()} className="p-1.5 hover:bg-gray-200 rounded" title="Redo">
            <Redo className="w-4 h-4 text-gray-600" />
          </button>
          <button className="p-1.5 hover:bg-gray-200 rounded" title="Print">
            <Printer className="w-4 h-4 text-gray-600" />
          </button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Zoom */}
          <select 
            value={zoom} 
            onChange={(e) => setZoom(Number(e.target.value))}
            className="text-sm bg-transparent border border-gray-300 rounded px-2 py-1"
          >
            {[50, 75, 90, 100, 125, 150, 200].map(z => (
              <option key={z} value={z}>{z}%</option>
            ))}
          </select>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Text Style */}
          <select className="ql-header text-sm bg-transparent border border-gray-300 rounded px-2 py-1">
            <option value="">Normal text</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Font */}
          <select className="ql-font text-sm bg-transparent border border-gray-300 rounded px-2 py-1">
            <option value="arial">Arial</option>
            <option value="times-new-roman">Times New Roman</option>
            <option value="georgia">Georgia</option>
            <option value="verdana">Verdana</option>
            <option value="courier">Courier</option>
          </select>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Font Size */}
          <select className="ql-size text-sm bg-transparent border border-gray-300 rounded px-1 py-1 w-16">
            {['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px'].map(s => (
              <option key={s} value={s}>{parseInt(s)}</option>
            ))}
          </select>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Formatting */}
          <button className="ql-bold p-1.5 hover:bg-gray-200 rounded"><Bold className="w-4 h-4" /></button>
          <button className="ql-italic p-1.5 hover:bg-gray-200 rounded"><Italic className="w-4 h-4" /></button>
          <button className="ql-underline p-1.5 hover:bg-gray-200 rounded"><Underline className="w-4 h-4" /></button>
          <button className="ql-color p-1.5 hover:bg-gray-200 rounded" value="#000000">A</button>
          <button className="ql-background p-1.5 hover:bg-gray-200 rounded"><Highlighter className="w-4 h-4" /></button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Link & Image */}
          <button className="ql-link p-1.5 hover:bg-gray-200 rounded"><LinkIcon className="w-4 h-4" /></button>
          <button className="ql-image p-1.5 hover:bg-gray-200 rounded"><Image className="w-4 h-4" /></button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Alignment */}
          <button className="ql-align p-1.5 hover:bg-gray-200 rounded" value=""><AlignLeft className="w-4 h-4" /></button>
          <button className="ql-align p-1.5 hover:bg-gray-200 rounded" value="center"><AlignCenter className="w-4 h-4" /></button>
          <button className="ql-align p-1.5 hover:bg-gray-200 rounded" value="right"><AlignRight className="w-4 h-4" /></button>

          <div className="w-px h-5 bg-gray-300 mx-1" />

          {/* Lists */}
          <button className="ql-list p-1.5 hover:bg-gray-200 rounded" value="ordered"><ListOrdered className="w-4 h-4" /></button>
          <button className="ql-list p-1.5 hover:bg-gray-200 rounded" value="bullet"><List className="w-4 h-4" /></button>

          {/* Editing Mode */}
          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded">
              <PenLine className="w-4 h-4" />
              Editing
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Document Tabs */}
        {showSidebar && (
          <aside className="w-56 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto">
            <div className="p-3">
              <button 
                onClick={() => setShowSidebar(false)}
                className="p-1 hover:bg-gray-100 rounded mb-2"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>

              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Document tabs</span>
                <button className="p-1 hover:bg-gray-100 rounded">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {tabs.map(tab => (
                <div 
                  key={tab.id}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer ${
                    activeTab === tab.id ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <FileText className="w-4 h-4" />
                  <span className="text-sm">{tab.name}</span>
                  <MoreHorizontal className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100" />
                </div>
              ))}

              <p className="text-xs text-gray-500 mt-4 px-1">
                Headings you add to the document will appear here.
              </p>
            </div>
          </aside>
        )}

        {/* Editor Area */}
        <main className="flex-1 overflow-auto bg-gray-100 flex flex-col">
          {/* AI Quick Actions Bar */}
          <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-center gap-2">
            <button 
              onClick={() => { setShowAI(true); setAiMode('generate'); }}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-full text-sm font-medium border border-blue-200"
            >
              <Wand2 className="w-4 h-4" />
              Generate document
            </button>
            <button 
              onClick={() => { setShowAI(true); setAiMode('help'); }}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
            >
              <PenLine className="w-4 h-4" />
              Help me write
            </button>
            <button 
              onClick={() => generateAIContent('meeting', '')}
              className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200"
            >
              <FileCheck className="w-4 h-4" />
              Meeting notes
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-full text-sm font-medium border border-gray-200">
              <MoreHorizontal className="w-4 h-4" />
              More
            </button>
          </div>

          {/* Document Canvas */}
          <div className="flex-1 overflow-auto py-8" style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
            <div className="max-w-[816px] mx-auto bg-white shadow-lg min-h-[1056px]">
              <div ref={editorRef} className="min-h-full" />
            </div>
          </div>

          {/* Footer Status Bar */}
          <div className="bg-white border-t border-gray-200 px-4 py-1 flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center gap-4">
              {connected ? (
                <span className="flex items-center gap-1 text-green-600">
                  <span className="w-2 h-2 bg-green-500 rounded-full" />
                  Connected
                </span>
              ) : (
                <span className="flex items-center gap-1 text-red-600">
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  Disconnected
                </span>
              )}
              {lastSaved && (
                <span>Last saved {formatDistanceToNow(new Date(lastSaved), { addSuffix: true })}</span>
              )}
            </div>
            <div className="flex items-center gap-4">
              <span>{wordCount.words} words</span>
              <span>{wordCount.chars} characters</span>
            </div>
          </div>
        </main>

        {/* Right Sidebar - Plugins */}
        <aside className="w-12 bg-white border-l border-gray-200 flex flex-col items-center py-2 gap-1">
          {sidePlugins.map(plugin => (
            <button
              key={plugin.id}
              onClick={() => setActivePlugin(activePlugin === plugin.id ? null : plugin.id)}
              className={`p-2 rounded-full hover:bg-gray-100 ${activePlugin === plugin.id ? 'bg-blue-50' : ''}`}
              title={plugin.name}
            >
              <plugin.icon className="w-5 h-5" style={{ color: plugin.color }} />
            </button>
          ))}
          
          <div className="my-2 w-6 border-t border-gray-200" />
          
          <button className="p-2 rounded-full hover:bg-gray-100" title="Add plugin">
            <Plus className="w-5 h-5 text-gray-500" />
          </button>
          
          <div className="mt-auto">
            <button className="p-2 rounded-full hover:bg-gray-100">
              <ChevronRight className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </aside>
      </div>

      {/* Version History Panel */}
      {showVersionHistory && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/20" onClick={() => setShowVersionHistory(false)} />
          <div className="w-80 bg-white shadow-xl flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="font-medium">Version history</h2>
                <button onClick={() => setShowVersionHistory(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <select className="mt-2 w-full border border-gray-300 rounded px-3 py-2 text-sm">
                <option>All versions</option>
                <option>Named versions</option>
              </select>
            </div>
            
            <div className="flex-1 overflow-auto">
              <div className="p-2 text-xs text-gray-500 font-medium">Today</div>
              
              {versions.map((version, i) => (
                <div 
                  key={version.id}
                  className={`p-3 cursor-pointer border-l-4 ${
                    selectedVersion === version.id 
                      ? 'bg-cyan-50 border-cyan-500' 
                      : 'border-transparent hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedVersion(version.id)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">
                      {format(new Date(version.timestamp), 'MMMM d, h:mm a')}
                    </span>
                    <MoreHorizontal className="w-4 h-4 text-gray-400" />
                  </div>
                  {i === 0 && <span className="text-xs text-gray-500">Current version</span>}
                  <div className="flex items-center gap-1 mt-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: user?.color || '#4285f4' }}
                    />
                    <span className="text-xs text-gray-600">{version.editor}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-gray-200">
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" className="rounded" />
                Highlight changes
              </label>
            </div>
          </div>
        </div>
      )}

      {/* AI Modal */}
      {showAI && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">
                  {aiMode === 'generate' ? 'Generate Document' : 'Help Me Write'}
                </h2>
                <button onClick={() => { setShowAI(false); setAiMode(null); }} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              {aiMode === 'generate' && (
                <div className="grid grid-cols-2 gap-3">
                  {aiPrompts.generate.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        const topic = prompt(`Enter topic for ${item.label}:`)
                        if (topic) generateAIContent(item.label.toLowerCase().replace(' ', ''), topic)
                      }}
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 text-left"
                    >
                      <Wand2 className="w-5 h-5 text-blue-500 mb-2" />
                      <p className="font-medium">{item.label}</p>
                      <p className="text-sm text-gray-500">{item.prompt}...</p>
                    </button>
                  ))}
                </div>
              )}
              
              {aiMode === 'help' && (
                <div className="space-y-2">
                  <p className="text-sm text-gray-500 mb-3">Select text in your document first, then choose an action:</p>
                  {aiPrompts.help.map((item, i) => (
                    <button
                      key={i}
                      onClick={() => generateAIContent(item.action, '')}
                      className="w-full p-3 border border-gray-200 rounded-lg hover:bg-gray-50 text-left flex items-center gap-3"
                    >
                      <PenLine className="w-4 h-4 text-gray-400" />
                      <span>{item.label}</span>
                    </button>
                  ))}
                </div>
              )}
              
              {aiLoading && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3">Generating...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4">
            <div className="p-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-medium">Share "{title}"</h2>
                <button onClick={() => setShowShareModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-4">
              <p className="text-sm text-gray-600 mb-4">
                Anyone with the link can view and edit this document.
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={window.location.href}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>

              {collaborators.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Currently editing:</p>
                  <div className="space-y-2">
                    {collaborators.map((collab, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: collab.color }}
                        >
                          {collab.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm">{collab.name}</span>
                        <span className="text-xs text-green-500 ml-auto">● Online</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quill Styles Override */}
      <style>{`
        .ql-toolbar { display: none !important; }
        .ql-container { border: none !important; font-family: 'Google Sans', Arial, sans-serif; }
        .ql-editor { padding: 72px 96px; min-height: 1056px; font-size: 11pt; line-height: 1.5; }
        .ql-editor:focus { outline: none; }
        .ql-cursor-flag { font-size: 12px !important; }
        .ql-cursor-caret { background-color: currentColor !important; }
        
        /* Cursor label styling */
        .ql-cursor .ql-cursor-flag {
          background-color: inherit;
          border-radius: 3px;
          padding: 2px 6px;
          font-size: 11px;
          white-space: nowrap;
          transform: translateY(-100%);
        }
      `}</style>
    </div>
  )
}
