import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import { 
  ArrowLeft, Save, Users, Check, Loader2, FileText, Share2, Download, History,
  Search, Replace, Printer, Copy, Clipboard, Undo, Redo, Scissors,
  Type, ChevronDown, Smile, Menu, Eye, EyeOff, Keyboard, HelpCircle,
  FileUp, FilePlus, X, Maximize2, ZoomIn, ZoomOut
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

// Font families for Quill
const Font = Quill.import('formats/font')
Font.whitelist = ['arial', 'times-new-roman', 'georgia', 'verdana', 'courier', 'comic-sans']
Quill.register(Font, true)

// Font sizes
const Size = Quill.import('attributors/style/size')
Size.whitelist = ['10px', '12px', '14px', '16px', '18px', '20px', '24px', '28px', '32px', '36px', '48px', '72px']
Quill.register(Size, true)

export default function Editor({ user, setUser }) {
  const { docId } = useParams()
  const editorRef = useRef(null)
  const quillRef = useRef(null)
  const providerRef = useRef(null)
  const ydocRef = useRef(null)
  
  // Document state
  const [title, setTitle] = useState('Untitled Document')
  const [collaborators, setCollaborators] = useState([])
  const [connected, setConnected] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [lastSaved, setLastSaved] = useState(null)
  
  // UI state
  const [showRevisions, setShowRevisions] = useState(false)
  const [revisions, setRevisions] = useState([])
  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [showNameModal, setShowNameModal] = useState(false)
  const [tempName, setTempName] = useState(user.name)
  
  // Menus
  const [activeMenu, setActiveMenu] = useState(null)
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [findResults, setFindResults] = useState({ current: 0, total: 0 })
  
  // Share modal
  const [showShareModal, setShowShareModal] = useState(false)
  const [copied, setCopied] = useState(false)
  
  // Word count
  const [wordCount, setWordCount] = useState({ words: 0, chars: 0, charsNoSpace: 0 })
  const [showWordCount, setShowWordCount] = useState(false)
  
  // Zoom
  const [zoom, setZoom] = useState(100)
  
  // Emoji picker
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  
  // Keyboard shortcuts modal
  const [showShortcuts, setShowShortcuts] = useState(false)
  
  // Templates
  const [showTemplates, setShowTemplates] = useState(false)

  // Common emojis
  const emojis = ['😀', '😂', '😊', '😍', '🤔', '😎', '👍', '👎', '❤️', '⭐', '🎉', '🔥', '✅', '❌', '📝', '💡', '🚀', '💪', '🙏', '👏']

  // Templates
  const templates = [
    { name: 'Meeting Notes', content: '<h1>Meeting Notes</h1><p><strong>Date:</strong> </p><p><strong>Attendees:</strong> </p><h2>Agenda</h2><ul><li></li></ul><h2>Discussion Points</h2><ul><li></li></ul><h2>Action Items</h2><ul><li></li></ul>' },
    { name: 'Project Proposal', content: '<h1>Project Proposal</h1><h2>Executive Summary</h2><p></p><h2>Problem Statement</h2><p></p><h2>Proposed Solution</h2><p></p><h2>Timeline</h2><p></p><h2>Budget</h2><p></p>' },
    { name: 'Resume', content: '<h1 style="text-align: center;">Your Name</h1><p style="text-align: center;">email@example.com | (123) 456-7890 | City, State</p><h2>Professional Summary</h2><p></p><h2>Experience</h2><h3>Job Title - Company</h3><p><em>Date - Date</em></p><ul><li></li></ul><h2>Education</h2><p></p><h2>Skills</h2><ul><li></li></ul>' },
    { name: 'Letter', content: '<p>Your Name<br>Your Address<br>City, State ZIP<br>Date</p><p>Recipient Name<br>Company Name<br>Address<br>City, State ZIP</p><p>Dear [Name],</p><p></p><p>Sincerely,</p><p>Your Name</p>' }
  ]

  // Keyboard shortcuts
  const shortcuts = [
    { key: 'Ctrl + B', action: 'Bold' },
    { key: 'Ctrl + I', action: 'Italic' },
    { key: 'Ctrl + U', action: 'Underline' },
    { key: 'Ctrl + Z', action: 'Undo' },
    { key: 'Ctrl + Y', action: 'Redo' },
    { key: 'Ctrl + F', action: 'Find' },
    { key: 'Ctrl + H', action: 'Find & Replace' },
    { key: 'Ctrl + S', action: 'Save' },
    { key: 'Ctrl + P', action: 'Print' },
    { key: 'Ctrl + A', action: 'Select All' },
    { key: 'Ctrl + C', action: 'Copy' },
    { key: 'Ctrl + V', action: 'Paste' },
    { key: 'Ctrl + X', action: 'Cut' }
  ]

  // Fetch document info
  useEffect(() => {
    const fetchDoc = async () => {
      try {
        const res = await fetch(`${API_URL}/api/documents/${docId}`)
        if (res.ok) {
          const data = await res.json()
          setTitle(data.title)
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

    const ydoc = new Y.Doc()
    ydocRef.current = ydoc

    const quill = new Quill(editorRef.current, {
      theme: 'snow',
      modules: {
        cursors: { transformOnTextChange: true },
        toolbar: {
          container: '#toolbar'
        },
        history: { userOnly: true }
      },
      placeholder: 'Start typing... Your changes sync in real-time!'
    })
    quillRef.current = quill

    // Track word count
    quill.on('text-change', () => {
      const text = quill.getText()
      const words = text.trim() ? text.trim().split(/\s+/).length : 0
      const chars = text.length - 1 // Exclude trailing newline
      const charsNoSpace = text.replace(/\s/g, '').length
      setWordCount({ words, chars, charsNoSpace })
    })

    // WebSocket connection
    const wsUrl = getWsUrl(docId)
    const provider = new WebsocketProvider(wsUrl, docId, ydoc, { connect: true })
    providerRef.current = provider

    const ytext = ydoc.getText('quill')
    const binding = new QuillBinding(ytext, quill, provider.awareness)

    provider.awareness.setLocalStateField('user', {
      name: user.name,
      color: user.color
    })

    provider.on('status', ({ status }) => {
      setConnected(status === 'connected')
    })

    const handleAwarenessChange = () => {
      const states = provider.awareness.getStates()
      const users = []
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          users.push({ clientId, name: state.user.name, color: state.user.color })
        }
      })
      setCollaborators(users)
    }

    provider.awareness.on('change', handleAwarenessChange)

    const cursorsModule = quill.getModule('cursors')
    provider.awareness.on('change', () => {
      const states = provider.awareness.getStates()
      states.forEach((state, clientId) => {
        if (state.user && clientId !== ydoc.clientID) {
          cursorsModule.createCursor(clientId.toString(), state.user.name, state.user.color)
        }
      })
    })

    return () => {
      binding.destroy()
      provider.disconnect()
      provider.destroy()
      ydoc.destroy()
    }
  }, [docId, user])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault()
            saveRevision()
            break
          case 'f':
            e.preventDefault()
            setShowFindReplace(true)
            break
          case 'h':
            e.preventDefault()
            setShowFindReplace(true)
            break
          case 'p':
            e.preventDefault()
            handlePrint()
            break
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => setActiveMenu(null)
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [])

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
      setLastSaved(new Date())
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

  // Find text
  const findInDocument = () => {
    if (!quillRef.current || !findText) return
    const text = quillRef.current.getText()
    const regex = new RegExp(findText, 'gi')
    const matches = [...text.matchAll(regex)]
    setFindResults({ current: matches.length > 0 ? 1 : 0, total: matches.length })
    
    if (matches.length > 0) {
      const firstMatch = matches[0]
      quillRef.current.setSelection(firstMatch.index, findText.length)
    }
  }

  // Replace text
  const replaceInDocument = () => {
    if (!quillRef.current || !findText) return
    const selection = quillRef.current.getSelection()
    if (selection && selection.length > 0) {
      quillRef.current.deleteText(selection.index, selection.length)
      quillRef.current.insertText(selection.index, replaceText)
    }
    findInDocument()
  }

  // Replace all
  const replaceAllInDocument = () => {
    if (!quillRef.current || !findText) return
    const text = quillRef.current.getText()
    const newText = text.replace(new RegExp(findText, 'g'), replaceText)
    quillRef.current.setText(newText)
    setFindResults({ current: 0, total: 0 })
  }

  // Export functions
  const exportAsHTML = () => {
    if (!quillRef.current) return
    const content = quillRef.current.root.innerHTML
    const fullHTML = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${title}</title><style>body{font-family:Arial,sans-serif;max-width:800px;margin:40px auto;padding:20px;}</style></head><body>${content}</body></html>`
    downloadFile(fullHTML, `${title}.html`, 'text/html')
  }

  const exportAsText = () => {
    if (!quillRef.current) return
    const content = quillRef.current.getText()
    downloadFile(content, `${title}.txt`, 'text/plain')
  }

  const exportAsWord = () => {
    if (!quillRef.current) return
    const content = quillRef.current.root.innerHTML
    const wordContent = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${title}</title></head><body>${content}</body></html>`
    downloadFile(wordContent, `${title}.doc`, 'application/msword')
  }

  const downloadFile = (content, filename, type) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  // Print
  const handlePrint = () => {
    if (!quillRef.current) return
    const content = quillRef.current.root.innerHTML
    const printWindow = window.open('', '_blank')
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 40px auto; padding: 20px; }
          @media print { body { margin: 0; padding: 20px; } }
        </style>
      </head>
      <body>${content}</body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  // Copy link
  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  // Insert emoji
  const insertEmoji = (emoji) => {
    if (!quillRef.current) return
    const selection = quillRef.current.getSelection()
    const index = selection ? selection.index : quillRef.current.getLength()
    quillRef.current.insertText(index, emoji)
    setShowEmojiPicker(false)
  }

  // Apply template
  const applyTemplate = (template) => {
    if (!quillRef.current) return
    quillRef.current.clipboard.dangerouslyPasteHTML(template.content)
    setShowTemplates(false)
  }

  // Zoom
  const handleZoom = (delta) => {
    setZoom(prev => Math.min(200, Math.max(50, prev + delta)))
  }

  // Menu items
  const menus = {
    file: [
      { label: 'New Document', icon: FilePlus, action: () => window.open('/', '_blank') },
      { divider: true },
      { label: 'Download as HTML', icon: Download, action: exportAsHTML },
      { label: 'Download as Word', icon: Download, action: exportAsWord },
      { label: 'Download as Text', icon: Download, action: exportAsText },
      { divider: true },
      { label: 'Print', icon: Printer, action: handlePrint, shortcut: 'Ctrl+P' }
    ],
    edit: [
      { label: 'Undo', icon: Undo, action: () => quillRef.current?.history.undo(), shortcut: 'Ctrl+Z' },
      { label: 'Redo', icon: Redo, action: () => quillRef.current?.history.redo(), shortcut: 'Ctrl+Y' },
      { divider: true },
      { label: 'Cut', icon: Scissors, action: () => document.execCommand('cut'), shortcut: 'Ctrl+X' },
      { label: 'Copy', icon: Copy, action: () => document.execCommand('copy'), shortcut: 'Ctrl+C' },
      { label: 'Paste', icon: Clipboard, action: () => document.execCommand('paste'), shortcut: 'Ctrl+V' },
      { divider: true },
      { label: 'Find & Replace', icon: Search, action: () => setShowFindReplace(true), shortcut: 'Ctrl+F' }
    ],
    view: [
      { label: 'Zoom In', icon: ZoomIn, action: () => handleZoom(10) },
      { label: 'Zoom Out', icon: ZoomOut, action: () => handleZoom(-10) },
      { label: 'Reset Zoom', icon: Maximize2, action: () => setZoom(100) },
      { divider: true },
      { label: 'Word Count', icon: Type, action: () => setShowWordCount(true) }
    ],
    insert: [
      { label: 'Emoji', icon: Smile, action: () => setShowEmojiPicker(true) },
      { label: 'Template', icon: FileText, action: () => setShowTemplates(true) }
    ],
    help: [
      { label: 'Keyboard Shortcuts', icon: Keyboard, action: () => setShowShortcuts(true) },
      { label: 'About', icon: HelpCircle, action: () => alert('DocKata - Real-time Collaborative Editor\nBuilt for GUVI Hackathon 2026') }
    ]
  }

  return (
    <div className="editor-page min-h-screen flex flex-col bg-gray-100">
      {/* Top Header - Title Bar */}
      <header className="bg-white border-b border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <FileText className="w-5 h-5 text-white" />
            </Link>
            
            <div>
              {editingTitle ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newTitle}
                    onChange={e => setNewTitle(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && updateTitle()}
                    onBlur={updateTitle}
                    className="text-lg font-medium px-2 py-1 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                    autoFocus
                  />
                </div>
              ) : (
                <button
                  onClick={() => { setNewTitle(title); setEditingTitle(true) }}
                  className="text-lg font-medium hover:bg-gray-100 px-2 py-1 rounded text-gray-900"
                >
                  {title}
                </button>
              )}
              <div className="flex items-center gap-2 text-xs text-gray-500 ml-2">
                <span className={`inline-flex items-center gap-1 ${connected ? 'text-green-600' : 'text-orange-500'}`}>
                  <span className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-orange-500'}`}></span>
                  {connected ? 'All changes saved' : 'Connecting...'}
                </span>
                {lastSaved && <span className="text-gray-500">• Last saved {formatDistanceToNow(lastSaved, { addSuffix: true })}</span>}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Collaborators */}
            {collaborators.length > 0 && (
              <div className="flex items-center -space-x-2 mr-4">
                {collaborators.slice(0, 4).map(collab => (
                  <div
                    key={collab.clientId}
                    className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-sm font-medium"
                    style={{ backgroundColor: collab.color }}
                    title={collab.name}
                  >
                    {collab.name.charAt(0).toUpperCase()}
                  </div>
                ))}
                {collaborators.length > 4 && (
                  <div className="w-8 h-8 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                    +{collaborators.length - 4}
                  </div>
                )}
              </div>
            )}

            <button onClick={fetchRevisions} className="p-2 hover:bg-gray-100 rounded-lg" title="Version history">
              <History className="w-5 h-5 text-gray-600" />
            </button>
            
            <button 
              onClick={() => setShowShareModal(true)}
              className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full font-medium transition-colors"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>

            <button
              onClick={() => { setTempName(user.name); setShowNameModal(true) }}
              className="w-9 h-9 rounded-full flex items-center justify-center text-white font-medium"
              style={{ backgroundColor: user.color }}
              title={user.name}
            >
              {user.name.charAt(0).toUpperCase()}
            </button>
          </div>
        </div>
      </header>

      {/* Menu Bar */}
      <div className="bg-white border-b border-gray-200 px-4 py-1">
        <div className="flex items-center gap-1">
          {Object.entries(menus).map(([menuName, items]) => (
            <div key={menuName} className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === menuName ? null : menuName) }}
                className={`px-3 py-1 text-sm rounded hover:bg-gray-100 capitalize text-gray-700 ${activeMenu === menuName ? 'bg-gray-100' : ''}`}
              >
                {menuName}
              </button>
              
              {activeMenu === menuName && (
                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg py-1 min-w-[200px] z-50">
                  {items.map((item, i) => (
                    item.divider ? (
                      <div key={i} className="border-t border-gray-200 my-1" />
                    ) : (
                      <button
                        key={i}
                        onClick={() => { item.action(); setActiveMenu(null) }}
                        className="w-full flex items-center justify-between px-4 py-2 text-sm hover:bg-gray-100 text-left text-gray-700"
                      >
                        <span className="flex items-center gap-3 text-gray-700">
                          {item.icon && <item.icon className="w-4 h-4 text-gray-500" />}
                          {item.label}
                        </span>
                        {item.shortcut && <span className="text-xs text-gray-400">{item.shortcut}</span>}
                      </button>
                    )
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-1">
        <div id="toolbar" className="flex items-center gap-2 flex-wrap">
          {/* Undo/Redo */}
          <button className="toolbar-btn-undo p-1.5 hover:bg-gray-200 rounded" onClick={() => quillRef.current?.history.undo()} title="Undo (Ctrl+Z)">
            <Undo className="w-4 h-4" />
          </button>
          <button className="toolbar-btn-redo p-1.5 hover:bg-gray-200 rounded" onClick={() => quillRef.current?.history.redo()} title="Redo (Ctrl+Y)">
            <Redo className="w-4 h-4" />
          </button>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Font Family */}
          <select className="ql-font">
            <option value="">Sans Serif</option>
            <option value="arial">Arial</option>
            <option value="times-new-roman">Times New Roman</option>
            <option value="georgia">Georgia</option>
            <option value="verdana">Verdana</option>
            <option value="courier">Courier</option>
            <option value="comic-sans">Comic Sans</option>
          </select>
          
          {/* Font Size */}
          <select className="ql-size">
            <option value="10px">10</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px" selected>16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
            <option value="36px">36</option>
            <option value="48px">48</option>
            <option value="72px">72</option>
          </select>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Basic Formatting */}
          <button className="ql-bold" />
          <button className="ql-italic" />
          <button className="ql-underline" />
          <button className="ql-strike" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Colors */}
          <select className="ql-color" />
          <select className="ql-background" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Headers */}
          <select className="ql-header">
            <option value="">Normal</option>
            <option value="1">Heading 1</option>
            <option value="2">Heading 2</option>
            <option value="3">Heading 3</option>
          </select>
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Lists */}
          <button className="ql-list" value="ordered" />
          <button className="ql-list" value="bullet" />
          <button className="ql-indent" value="-1" />
          <button className="ql-indent" value="+1" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Alignment */}
          <select className="ql-align" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Blocks */}
          <button className="ql-blockquote" />
          <button className="ql-code-block" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Links & Media */}
          <button className="ql-link" />
          <button className="ql-image" />
          
          <div className="w-px h-6 bg-gray-300 mx-1" />
          
          {/* Clear formatting */}
          <button className="ql-clean" />
        </div>
      </div>

      {/* Editor Area */}
      <main className="flex-1 overflow-auto" style={{ backgroundColor: '#f8f9fa' }}>
        <div className="max-w-4xl mx-auto my-8">
          <div 
            className="bg-white shadow-lg rounded-sm min-h-[1000px]"
            style={{ 
              transform: `scale(${zoom / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s'
            }}
          >
            <div ref={editorRef} className="min-h-[1000px]" />
          </div>
        </div>
      </main>

      {/* Footer - Word Count */}
      <footer className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-sm text-gray-500">
        <div className="flex items-center gap-4">
          <span>Words: {wordCount.words}</span>
          <span>Characters: {wordCount.chars}</span>
          <span>Zoom: {zoom}%</span>
        </div>
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4" />
          <span>{collaborators.length + 1} online</span>
        </div>
      </footer>

      {/* Collaborators Sidebar */}
      {collaborators.length > 0 && (
        <div className="fixed right-4 top-32 w-56 bg-white rounded-lg shadow-lg border border-gray-200 p-4">
          <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Online ({collaborators.length + 1})
          </h4>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2 rounded-lg bg-blue-50">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: user.color }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-medium">{user.name} (you)</span>
            </div>
            {collaborators.map(collab => (
              <div key={collab.clientId} className="flex items-center gap-3 p-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium" style={{ backgroundColor: collab.color }}>
                  {collab.name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm">{collab.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Find & Replace Modal */}
      {showFindReplace && (
        <div className="fixed top-20 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-80 z-50">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Find & Replace</h3>
            <button onClick={() => setShowFindReplace(false)} className="p-1 hover:bg-gray-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div>
              <input
                type="text"
                placeholder="Find"
                value={findText}
                onChange={e => setFindText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && findInDocument()}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {findResults.total > 0 && (
                <p className="text-xs text-gray-500 mt-1">{findResults.current} of {findResults.total} matches</p>
              )}
            </div>
            <input
              type="text"
              placeholder="Replace with"
              value={replaceText}
              onChange={e => setReplaceText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button onClick={findInDocument} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                Find
              </button>
              <button onClick={replaceInDocument} className="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium">
                Replace
              </button>
              <button onClick={replaceAllInDocument} className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                Replace All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShareModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Share "{title}"</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Share link</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={window.location.href}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </button>
              </div>
              {copied && <p className="text-sm text-green-600 mt-2">Link copied to clipboard!</p>}
            </div>
            <p className="text-sm text-gray-500">Anyone with this link can view and edit the document.</p>
            <button onClick={() => setShowShareModal(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
              Done
            </button>
          </div>
        </div>
      )}

      {/* Word Count Modal */}
      {showWordCount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowWordCount(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Word Count</h3>
            <div className="space-y-3">
              <div className="flex justify-between py-2 border-b">
                <span>Words</span>
                <span className="font-semibold">{wordCount.words}</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span>Characters (with spaces)</span>
                <span className="font-semibold">{wordCount.chars}</span>
              </div>
              <div className="flex justify-between py-2">
                <span>Characters (without spaces)</span>
                <span className="font-semibold">{wordCount.charsNoSpace}</span>
              </div>
            </div>
            <button onClick={() => setShowWordCount(false)} className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker Modal */}
      {showEmojiPicker && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowEmojiPicker(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Insert Emoji</h3>
            <div className="grid grid-cols-5 gap-2">
              {emojis.map((emoji, i) => (
                <button
                  key={i}
                  onClick={() => insertEmoji(emoji)}
                  className="text-2xl p-2 hover:bg-gray-100 rounded-lg"
                >
                  {emoji}
                </button>
              ))}
            </div>
            <button onClick={() => setShowEmojiPicker(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplates && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowTemplates(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Choose a Template</h3>
            <div className="space-y-2">
              {templates.map((template, i) => (
                <button
                  key={i}
                  onClick={() => applyTemplate(template)}
                  className="w-full text-left p-4 border border-gray-200 rounded-lg hover:bg-gray-50 hover:border-blue-500 transition-colors"
                >
                  <span className="font-medium">{template.name}</span>
                </button>
              ))}
            </div>
            <button onClick={() => setShowTemplates(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keyboard Shortcuts Modal */}
      {showShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowShortcuts(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Keyboard Shortcuts</h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex justify-between py-2 border-b border-gray-100">
                  <span>{shortcut.action}</span>
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-sm font-mono">{shortcut.key}</kbd>
                </div>
              ))}
            </div>
            <button onClick={() => setShowShortcuts(false)} className="w-full mt-4 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Revisions Modal */}
      {showRevisions && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowRevisions(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[80vh] overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <History className="w-5 h-5" />
              Version History
            </h3>
            {revisions.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No versions saved yet</p>
            ) : (
              <div className="space-y-2">
                {revisions.map((rev, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div>
                      <p className="font-medium">Version {i + 1}</p>
                      <p className="text-sm text-gray-500">
                        by {rev.savedBy} • {formatDistanceToNow(new Date(rev.savedAt), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowRevisions(false)} className="w-full mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
              Close
            </button>
          </div>
        </div>
      )}

      {/* Name Change Modal */}
      {showNameModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowNameModal(false)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-semibold mb-4">Change Display Name</h3>
            <input
              type="text"
              value={tempName}
              onChange={e => setTempName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && setUser({ ...user, name: tempName.trim() }) && setShowNameModal(false)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
              placeholder="Enter your name"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setShowNameModal(false)} className="flex-1 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium">
                Cancel
              </button>
              <button 
                onClick={() => { setUser({ ...user, name: tempName.trim() }); setShowNameModal(false) }}
                className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium"
              >
                Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
