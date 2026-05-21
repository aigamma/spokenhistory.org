import { createContext, useContext, useState, useEffect } from 'react'
import { 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged 
} from 'firebase/auth'
import { auth } from '../services/firebase'

// Create context
const AuthContext = createContext()

// Hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Provider component
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      // Don't log user.email -- the browser console can be screen-shared,
      // saved by browser-developer-tools logging extensions, or otherwise
      // exposed in ways the signed-in user may not expect. Log only the
      // signed-in / signed-out state.
      console.log('Auth state changed:', user ? 'signed in' : 'signed out')
      setUser(user)
      setLoading(false)
    }, (error) => {
      console.error('Auth state change error:', error)
      setError(error.message)
      setLoading(false)
    })

    // Cleanup subscription
    return () => unsubscribe()
  }, [])

  // Login function
  const login = async (email, password) => {
    try {
      setError(null)
      // Don't log the email or password. Firebase Auth's own internal
      // logging surfaces enough metadata for debugging without us also
      // writing PII into the browser console.
      const result = await signInWithEmailAndPassword(auth, email, password)
      setUser(result.user)
      return result.user
    } catch (error) {
      // Log the error code (e.g., 'auth/user-not-found') for debugging
      // but not the full Firebase error object which can include the
      // attempted email and other context.
      console.error('Login error:', error.code || 'unknown')
      setError(error.message)
      throw error
    }
  }

  // Logout function
  const logout = async () => {
    try {
      setError(null)
      await firebaseSignOut(auth)
      setUser(null)
    } catch (error) {
      console.error('Logout error:', error.code || 'unknown')
      setError(error.message)
      throw error
    }
  }

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}