import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Home from './components/Home'
import Editor from './components/Editor'
import Particles from './components/Particles'

function App() {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    if (saved) return JSON.parse(saved)
    
    const colors = [
      '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
      '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
      '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
    ]
    
    return {
      name: `User-${Math.random().toString(36).substr(2, 4)}`,
      color: colors[Math.floor(Math.random() * colors.length)]
    }
  })

  useEffect(() => {
    localStorage.setItem('user', JSON.stringify(user))
  }, [user])

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <div className="animated-bg" />
        <Particles />
        
        <Routes>
          <Route path="/" element={<Home user={user} setUser={setUser} />} />
          <Route path="/doc/:docId" element={<Editor user={user} setUser={setUser} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App
