import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './styles/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* ErrorBoundary wraps the entire app so any unhandled render error
        in a descendant lands on a recoverable error card instead of
        unmounting the React root and showing a blank white page. The
        boundary sits OUTSIDE HashRouter + AuthProvider so an error in
        either of those providers is also caught (e.g., a corrupted
        Firebase auth state, a malformed URL hash). */}
    <ErrorBoundary>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </ErrorBoundary>
  </React.StrictMode>
)
