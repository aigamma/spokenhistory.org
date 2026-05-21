// src/pages/Login.jsx
import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// Non-routable domain appended to bare-username logins before they are
// passed to Firebase Email/Password Auth, which requires an email-shaped
// identifier. .local is reserved by IANA and never resolvable on the
// public internet, so no real mail server can collide with it. A team
// member who types just `wwu` becomes `wwu@civilrightsproject.local` to
// Firebase; anyone who already has an email-shaped login (such as the
// admin account at eric@aigamma.com) types it in full and the input
// passes through unchanged.
const USERNAME_DOMAIN = 'civilrightsproject.local';

function normalizeIdentifier(input) {
  const trimmed = (input || '').trim();
  if (!trimmed) return '';
  return trimmed.includes('@') ? trimmed : `${trimmed}@${USERNAME_DOMAIN}`;
}

export default function Login() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Get the redirect path from location state or default to home
  const from = location.state?.from?.pathname || '/';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!identifier || !password) {
      setErrorMessage('Please enter both username and password');
      return;
    }

    try {
      setLoading(true);
      setErrorMessage('');
      await login(normalizeIdentifier(identifier), password);
      navigate(from, { replace: true });
    } catch (error) {
      // Log only error.code -- the full Firebase error object includes
      // customData with the attempted email, which is PII that should
      // not land in the browser console. Same pattern as AuthContext.
      console.error('Login error:', error.code || 'unknown');
      let message = 'Failed to log in';
      
      // Map Firebase error messages to user-friendly messages. The
      // identifier-field copy is generic ("username or email") so the
      // user-facing messages stay generic too -- saying "no account
      // found with this email" would be confusing for a member who
      // logged in with the bare-username form.
      if (error.code === 'auth/invalid-email') {
        message = 'Invalid username or email';
      } else if (error.code === 'auth/user-not-found' ||
                 error.code === 'auth/invalid-credential') {
        message = 'Incorrect username or password';
      } else if (error.code === 'auth/wrong-password') {
        message = 'Incorrect username or password';
      } else if (error.code === 'auth/too-many-requests') {
        message = 'Too many failed login attempts. Please try again later';
      }
      
      setErrorMessage(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-6 font-sans">
      <div className="max-w-md w-full bg-white p-8 rounded-xl shadow-md">
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
            Sign in to your account
          </h2>
          <p className="text-sm text-center text-gray-500 mt-2">
            Enter your credentials to access your account
          </p>
        </div>
        
        {errorMessage && (
          <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6 rounded">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-600" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{errorMessage}</p>
              </div>
            </div>
          </div>
        )}
        
        <form className="mt-6" onSubmit={handleSubmit}>
          <div className="mb-6">
            <label
              htmlFor="identifier"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Username or email
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              autoComplete="username"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
            />
          </div>
          
          <div className="mb-6">
            <div className="flex justify-between items-center mb-2">
              <label 
                htmlFor="password" 
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <a 
                href="#" 
                className="text-xs text-blue-600 hover:text-blue-700 transition-colors"
              >
                Forgot password?
              </a>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>

          <div className="mt-8">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center py-3 px-4 relative bg-blue-600 text-white text-sm font-medium border-0 rounded-lg shadow-sm transition-colors ${loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-blue-700 cursor-pointer'}`}
            >
              {loading ? (
                <>
                  <span className="absolute left-6 flex items-center">
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </span>
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span className="absolute left-6 flex items-center">
                    <svg className="h-5 w-5 text-blue-200" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span>Sign in</span>
                </>
              )}
            </button>
          </div>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Team members: use the credentials provided by your project lead.
            </p>
          </div>
        </form>
      </div>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}