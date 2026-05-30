import React from 'react';

/**
 * React error boundary. Catches any unhandled error thrown during render
 * in a descendant component and shows a fallback UI instead of letting
 * the entire app unmount to a blank white page.
 *
 * Without this boundary, React's default behavior on an uncaught error
 * is to unmount the root and clear the DOM. The user sees nothing -- no
 * message, no way to recover, no signal that anything went wrong. With
 * this boundary, the user sees a recoverable error card with a Reload
 * button that re-runs the React mount.
 *
 * Class component (not a hook) because React still requires the error
 * boundary pattern to use componentDidCatch / getDerivedStateFromError;
 * there is no useErrorBoundary hook equivalent as of React 18.
 *
 * Error reporting: the componentDidCatch log uses console.error so the
 * error + componentStack show up in the browser console and in any
 * production error-monitoring tool the team wires up later (Sentry,
 * Rollbar, Bugsnag, LogRocket, etc.). The team can swap the
 * console.error for a real reporter once they pick one.
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Console-only for now; swap in a real error-reporting service
    // (Sentry / Rollbar / Bugsnag / LogRocket) once the team picks one.
    console.error('ErrorBoundary caught an unhandled render error:', error, errorInfo);
  }

  handleReload = () => {
    // Hard reload to re-run the entire React mount with a fresh state.
    // setState({ hasError: false }) would only clear the boundary's
    // internal flag but the underlying issue (a corrupted Firestore
    // doc, a stale auth token, etc.) might still cause the same render
    // error on retry. A hard reload is the more reliable recovery.
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const errorMessage = this.state.error?.message || 'An unexpected error occurred.';
      return (
        <div
          className="min-h-screen flex items-center justify-center p-4 font-body bg-[#EBEAE9] dark:bg-zinc-900"
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md w-full bg-white dark:bg-zinc-800 border-2 border-black dark:border-zinc-700 p-6 shadow-xl">
            <h1 className="text-2xl font-bold mb-3 text-stone-900" style={{ fontFamily: 'Inter, sans-serif' }}>
              Something went wrong
            </h1>
            <p className="text-base mb-4 text-stone-900" style={{ fontFamily: 'Source Serif 4, serif' }}>
              The page hit an error it could not recover from. Reloading usually fixes it. If the issue persists, the team has been notified via the browser console.
            </p>
            <details className="mb-5 text-sm text-stone-700">
              <summary className="cursor-pointer font-medium mb-1">Technical details</summary>
              <code className="block whitespace-pre-wrap break-words mt-2 p-2 bg-gray-100 dark:bg-zinc-800 rounded text-xs">
                {errorMessage}
              </code>
            </details>
            <button
              type="button"
              onClick={this.handleReload}
              className="w-full px-6 py-3 min-h-11 text-white font-bold border-2 border-black"
              style={{ backgroundColor: '#F2483C', fontFamily: 'Inter, sans-serif' }}
            >
              Reload
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
