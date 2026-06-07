// src/App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/common/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import Home from './pages/Home'
import Visualizations from './pages/Visualizations'
import Login from './pages/Login'
import Connect from './pages/Connect'
import StaticPlaylist from './pages/StaticPlaylist'
import SearchPage from './pages/SearchPage'
import InterviewPlayer from './pages/InterviewPlayer'
import InterviewDetail from './pages/InterviewDetail'
import ClipPlayer from './pages/ClipPlayer'
import ContentDirectory from './pages/ContentDirectory'
import TopicGlossary from './pages/TopicGlossary'
import About from './pages/About'
import ReviewQueue from './pages/ReviewQueue'
import RagExplore from './pages/RagExplore'
import PersonPage from './pages/PersonPage'
import PeopleCatalog from './pages/PeopleCatalog'
import MachineAudit from './pages/MachineAudit'
import TableOfContents from './pages/TableOfContents'
import Curriculum from './pages/Curriculum'
import Essays from './pages/Essays'
import EssayPage from './pages/EssayPage'
import NotFound from './pages/NotFound'
import { SearchProvider } from './context/SearchProvider'
import CommandPalette from './components/CommandPalette'


export default function App() {
  return (
    <SearchProvider>
      <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />

      {/* PUBLIC: the MCP connector onboarding page. Deliberately NOT wrapped in
          ProtectedRoute so outside researchers (not logged-in team members) can
          reach it and connect the archive to their own AI tools. */}
      <Route path="/connect" element={<Connect />} />

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

      {/* /playlist-builder renders the static, /rag/-backed StaticPlaylist
          (Dustin, 2026-05-30). The site's per-page rendering was moved onto the
          committed static JSON under /rag/, so StaticPlaylist filters
          /rag/playlist_index.json by ?keywords / ?topic / ?entry and plays
          real, time-anchored clips. (Firestore itself is populated and is now
          read live by the federated command-palette search; it is simply not
          the render path for these clips.) The old Firestore-backed
          PlaylistBuilder is retained in the tree for reference but no longer
          routed. */}
      <Route path="/playlist-builder" element={
        <ProtectedRoute>
          <Layout>
            <StaticPlaylist />
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

      {/* The card-grid Interview Index was retired 2026-05-31 and merged
          into the richer Table of Contents (parts, chapters, click-to-play,
          plus the capsule + audit-tier badge absorbed from the old grid).
          /interview-index now redirects so the existing in-app links and any
          outstanding bookmarks land on the consolidated Interviews page
          instead of 404ing. */}
      <Route path="/interview-index" element={<Navigate to="/table-of-contents" replace />} />

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

      {/* Machine Audit explainer (Dustin, 2026-05-30): how the AI
          metadata is generated, where uncertainty exists, and how to
          send a correction. Linked from the audit-tier indicators. */}
      <Route path="/machine-audit" element={
        <ProtectedRoute>
          <Layout>
            <MachineAudit />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Table of Contents (Dustin, 2026-05-30): every interview,
          expandable to its named chapters grouped into parts; each
          chapter and each part links to a bounded video segment so a
          multi-hour interview opens to the right place without buffering
          the whole file. Data: scripts/build_toc.py -> /rag/toc.json. */}
      <Route path="/table-of-contents" element={
        <ProtectedRoute>
          <Layout>
            <TableOfContents />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Curriculum pilot (2026-05-31): a teacher slides to a grade
          (K through 12) and the page assembles a grade-leveled lesson
          unit out of the archive. Band core (objectives, materials,
          activities) merges with per-grade tuning (reading level,
          essential question, vocabulary, scaffolding). Clip materials
          play as bounded LoC segments via LocVideoEmbed. Data:
          public/rag/curriculum/youth-and-student-activism.json, loaded
          defensively so the page degrades gracefully while authored. */}
      <Route path="/curriculum" element={
        <ProtectedRoute>
          <Layout>
            <Curriculum />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Curated essays (2026-06-01): public-domain and openly-licensed essays
          that illuminate the archive's themes, reproduced in full with citation
          and license, and cross-linked to the oral histories. /essays is the
          data-driven index (grouped by topic; ?topic= filters to one);
          /essays/:slug renders one essay as an integration hub. Data:
          public/rag/essays/ (built by scripts/build_essays_index.mjs). */}
      <Route path="/essays" element={
        <ProtectedRoute>
          <Layout>
            <Essays />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/essays/:slug" element={
        <ProtectedRoute>
          <Layout>
            <EssayPage />
          </Layout>
        </ProtectedRoute>
      } />

      {/* Per-person reference pages. One catalog entry per named
          individual (interviewees + external figures discussed by
          interviewees). See public/rag/people/README.md for the
          JSON schema and content discipline. The /people index is
          the browse surface; /person/:slug renders a single entry. */}
      <Route path="/people" element={
        <ProtectedRoute>
          <Layout>
            <PeopleCatalog />
          </Layout>
        </ProtectedRoute>
      } />
      <Route path="/person/:slug" element={
        <ProtectedRoute>
          <Layout>
            <PersonPage />
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

      <Route path="/interview/:entryNumber" element={
        <ProtectedRoute>
          <InterviewDetail />
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
      <CommandPalette />
    </SearchProvider>
  )
}