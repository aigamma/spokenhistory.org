import { createContext, useContext, useState, useEffect } from 'react'
import {
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'
import { auth } from '../services/firebase'

// Create context
const AuthContext = createContext()

// Client-side bypass for the team-shared credential. The team login is a
// shared password with NO backing Firebase user (the identifier
// wwu@civilrightsproject.local is not a registered account), so it is verified
// here client-side and works on any origin. Note: Firebase's Authorized Domains
// list only gates OAuth-redirect sign-in (Phone, Google, third-party) and
// email-link, not plain Email/Password, so neither this gate nor the admin
// Email/Password login depends on the custom domain being authorized. Actual
// data security is enforced by Firestore rules + App Check, not this gate. The
// password is the same team-shared value already published in the repo's
// CLAUDE.md and rag/SHOWCASE.md, so no new exposure.
const TEAM_EMAIL = 'wwu@civilrightsproject.local'
const TEAM_PASSWORD = 'civilrights'
const TEAM_SESSION_KEY = 'civilrights:teamSession'
const TEAM_USER = Object.freeze({
  uid: 'team-shared-wwu',
  email: TEAM_EMAIL,
  displayName: 'WWU Team',
  isTeamShared: true,
})

function readTeamSession() {
  try {
    return window.localStorage.getItem(TEAM_SESSION_KEY) === '1'
  } catch {
    return false
  }
}

function writeTeamSession(active) {
  try {
    if (active) {
      window.localStorage.setItem(TEAM_SESSION_KEY, '1')
    } else {
      window.localStorage.removeItem(TEAM_SESSION_KEY)
    }
  } catch {
    // localStorage can throw in private-mode Safari; session simply won't persist.
  }
}

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
    // Restore the team-shared session synchronously so a refresh on a
    // protected route doesn't bounce the user back to /login while
    // Firebase's onAuthStateChanged is still warming up.
    if (readTeamSession()) {
      setUser(TEAM_USER)
      setLoading(false)
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      // Don't log user.email -- the browser console can be screen-shared,
      // saved by browser-developer-tools logging extensions, or otherwise
      // exposed in ways the signed-in user may not expect. Log only the
      // signed-in / signed-out state.
      console.log('Auth state changed:', firebaseUser ? 'signed in' : 'signed out')
      if (firebaseUser) {
        // A real Firebase login (admin) takes precedence over any team
        // session marker so a later Firebase logout doesn't leave a
        // phantom team session active.
        writeTeamSession(false)
        setUser(firebaseUser)
      } else {
        setUser(readTeamSession() ? TEAM_USER : null)
      }
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
    setError(null)

    if (email === TEAM_EMAIL && password === TEAM_PASSWORD) {
      writeTeamSession(true)
      setUser(TEAM_USER)
      return TEAM_USER
    }

    try {
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
      writeTeamSession(false)
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