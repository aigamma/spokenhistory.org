import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen" style={{ backgroundColor: '#EBEAE9' }}>
        <div
          className="w-12 h-12 border-4 border-black/20 rounded-full animate-spin"
          style={{ borderTopColor: '#F2483C' }}
        />
      </div>
    )
  }

  if (!user) {
    // Redirect to login page with info about where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return children
}