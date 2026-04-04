// Firebase Configuration
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

// Firebase config for DocKata
const firebaseConfig = {
  apiKey: "AIzaSyA9z3zfElY5a7QWXVhjPrxvizSaGSy1cr8",
  authDomain: "dockata-feaf0.firebaseapp.com",
  projectId: "dockata-feaf0",
  storageBucket: "dockata-feaf0.firebasestorage.app",
  messagingSenderId: "1016901773546",
  appId: "1:1016901773546:web:9c838718b3bba0b7c8cf93"
}

// Initialize Firebase
const app = initializeApp(firebaseConfig)
const auth = getAuth(app)
const googleProvider = new GoogleAuthProvider()

// Google Sign In
export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider)
    const user = result.user
    return {
      uid: user.uid,
      name: user.displayName,
      email: user.email,
      photoURL: user.photoURL
    }
  } catch (error) {
    console.error('Google sign-in error:', error)
    // For demo purposes, return a mock user if Firebase is not configured
    if (error.code === 'auth/configuration-not-found' || error.code === 'auth/invalid-api-key') {
      console.log('Firebase not configured, using demo mode')
      return null
    }
    throw error
  }
}

// Sign Out
export const logOut = async () => {
  try {
    await signOut(auth)
  } catch (error) {
    console.error('Sign out error:', error)
  }
}

export { auth }
