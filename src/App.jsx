// src/App.jsx
import { Routes, Route } from 'react-router-dom'
import Layout from './components/common/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Visualizations from './pages/Visualizations'
import Login from './pages/Login'
import PlaylistBuilder from './pages/PlaylistBuilder'
import PlaylistEditor from './pages/PlaylistEditor'
import SearchPage from './pages/SearchPage'
import InterviewPlayer from './pages/InterviewPlayer'
import ClipPlayer from './pages/ClipPlayer'
import ContentDirectory from './pages/ContentDirectory'
import TopicGlossary from './pages/TopicGlossary'
import InterviewIndex from './pages/InterviewIndex'
import About from './pages/About'
import ReviewQueue from './pages/ReviewQueue'
import RagExplore from './pages/RagExplore'
import NotFound from './pages/NotFound'


export default function App() {
  return (
    <>
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/visualizations" element={
        <ProtectedRoute>
          <Layout>
            <Visualizations />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/playlist-builder" element={
        <ProtectedRoute>
          <Layout>
            <PlaylistBuilder />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/playlist-editor" element={
        <ProtectedRoute>
          <Layout>
            <PlaylistEditor />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/content-directory" element={
        <ProtectedRoute>
          <Layout>
            <ContentDirectory />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/interview-index" element={
        <ProtectedRoute>
          <Layout>
            <InterviewIndex />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/topic-glossary" element={
        <ProtectedRoute>
          <Layout>
            <TopicGlossary />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/search" element={
        <ProtectedRoute>
          <Layout>
            <SearchPage />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/about" element={
        <ProtectedRoute>
          <Layout>
            <About />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/rag-explore" element={
        <ProtectedRoute>
          <Layout>
            <RagExplore />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/review-queue" element={
        <ProtectedRoute>
          <Layout>
            <ReviewQueue />
          </Layout>
        </ProtectedRoute>
      } />

      <Route path="/interview-player" element={
        <ProtectedRoute>
          <InterviewPlayer />
        </ProtectedRoute>
      } />

      <Route
        path="/clip-player"
        element={
          <ProtectedRoute>
            <Layout>
              <ClipPlayer />
            </Layout>
          </ProtectedRoute>
        }
      />


      {/* Catch all route. Was <Navigate to="/" replace /> which
          silently redirected mistyped URLs to home with no feedback;
          users (and search-engine bots) lost the signal that the URL
          they tried didn't exist. Now renders a proper 404 page that
          shows the attempted path and lists the real navigation
          destinations. NotFound is intentionally OUTSIDE
          <ProtectedRoute> so even unauthenticated users hitting an
          unknown URL see the 404 rather than getting bounced to the
          login screen with no indication the URL was broken in the
          first place. */}
      <Route path="*" element={<NotFound />} />
    </Routes>
    </>
  )
}