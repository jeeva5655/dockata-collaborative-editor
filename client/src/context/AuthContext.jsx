import { createContext, useContext, useState, useEffect } from 'react'
import { auth, signInWithGoogle, logOut } from '../config/firebase'
import { onAuthStateChanged } from 'firebase/auth'

const AuthContext = createContext()

export const useAuth = () => useContext(AuthContext)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('dockata_user')
    return saved ? JSON.parse(saved) : null
  })
  const [loading, setLoading] = useState(true)

  // Random colors for anonymous users
  const colors = [
    '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e',
    '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6',
    '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899'
  ]

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || 'User',
          email: firebaseUser.email,
          photoURL: firebaseUser.photoURL,
          color: colors[Math.floor(Math.random() * colors.length)],
          isGuest: false
        }
        setUser(userData)
        localStorage.setItem('dockata_user', JSON.stringify(userData))
      }
      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  // Continue as Guest
  const continueAsGuest = () => {
    const guestUser = {
      uid: `guest-${Math.random().toString(36).substr(2, 9)}`,
      name: `Guest-${Math.random().toString(36).substr(2, 4)}`,
      email: null,
      photoURL: null,
      color: colors[Math.floor(Math.random() * colors.length)],
      isGuest: true
    }
    setUser(guestUser)
    localStorage.setItem('dockata_user', JSON.stringify(guestUser))
    return guestUser
  }

  // Google Sign In
  const googleSignIn = async () => {
    try {
      const result = await signInWithGoogle()
      if (result) {
        const userData = {
          ...result,
          color: colors[Math.floor(Math.random() * colors.length)],
          isGuest: false
        }
        setUser(userData)
        localStorage.setItem('dockata_user', JSON.stringify(userData))
        return userData
      } else {
        // Firebase not configured, use guest mode
        return continueAsGuest()
      }
    } catch (error) {
      console.error('Sign in error:', error)
      throw error
    }
  }

  // Sign Out
  const signOut = async () => {
    try {
      await logOut()
      setUser(null)
      localStorage.removeItem('dockata_user')
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  // Update user name
  const updateUserName = (name) => {
    if (user && name.trim()) {
      const updatedUser = { ...user, name: name.trim() }
      setUser(updatedUser)
      localStorage.setItem('dockata_user', JSON.stringify(updatedUser))
    }
  }

  const value = {
    user,
    loading,
    googleSignIn,
    signOut,
    continueAsGuest,
    updateUserName
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
