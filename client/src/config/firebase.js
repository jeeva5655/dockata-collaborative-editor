// Firebase Configuration
import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth'

// Firebase config - Replace with your own Firebase project credentials
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDemo-key-replace-with-yours",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "dockata-demo.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "dockata-demo",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "dockata-demo.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:123456789:web:abc123"
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
