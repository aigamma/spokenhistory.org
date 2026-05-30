/**
 * @fileoverview ClipPlayer page for displaying individual interview clips.
 * 
 * This page loads and displays a specific interview clip based on URL parameters,
 * including the YouTube video at the specified timestamp, clip metadata, and
 * navigation options to related content.
 */

import React, { useEffect, useState, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { Clock, Tag } from 'lucide-react'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

/**
 * ClipPlayer - Page for playing individual interview clips
 * 
 * This page:
 * 1. Retrieves clip data based on URL parameters
 * 2. Initializes a YouTube player at the specific timestamp
 * 3. Displays clip metadata and summary
 * 4. Provides navigation to the full interview and keyword playlists
 * 
 * URL Parameters:
 * - documentName: ID of the parent interview document
 * - clipId: ID of the specific clip to play
 * 
 * @returns {React.ReactElement} Clip player page
 */
export default function ClipPlayer() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const documentName = searchParams.get('documentName')
  const clipId = searchParams.get('clipId')

  const [mainSummary, setMainSummary] = useState(null)
  const [clipData, setClipData] = useState(null)

  // Dynamic title from the interviewee + clip topic once the
  // Firestore fetches resolve. Before that, falls back to "Clip"
  // + the documentName slug.
  useDocumentTitle(
    clipData?.topic && mainSummary?.name
      ? `${mainSummary.name}: ${clipData.topic}`
      : (mainSummary?.name || documentName || 'Clip')
  )
  const [error, setError] = useState(null)
  const [playerReady, setPlayerReady] = useState(false)
  const playerRef = useRef(null)

  /**
   * Extracts YouTube video ID from various URL formats
   * 
   * @param {string} link - YouTube URL in different possible formats
   * @returns {string|null} YouTube video ID or null if not extractable
   */
  const extractVideoId = (link) => {
    const match = link?.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match?.[1] || null
  }

  /**
   * Converts a timestamp string to seconds
   * 
   * @param {string} timestamp - Timestamp in format "[MM:SS]" or "[HH:MM:SS]"
   * @returns {number} Time in seconds
   */
  const convertTimestampToSeconds = (timestamp) => {
    if (!timestamp) return 0
    const timeStr = timestamp.split(' - ')[0].replace(/[\[\]]/g, '').trim()
    const parts = timeStr.split(':').map(Number)
    return parts.length === 3
      ? parts[0] * 3600 + parts[1] * 60 + parts[2]
      : parts[0] * 60 + parts[1]
  }

  /**
   * Load main interview and clip data from Firestore
   */
  useEffect(() => {
    const loadData = async () => {
      try {
        // Get the parent interview document
        const mainDoc = await getDoc(doc(db, 'interviewSummaries', documentName))
        // Get the specific clip document
        const clipDoc = await getDoc(doc(db, 'interviewSummaries', documentName, 'subSummaries', clipId))

        if (!mainDoc.exists() || !clipDoc.exists()) {
          setError('Clip or interview not found')
          return
        }

        setMainSummary(mainDoc.data())
        setClipData(clipDoc.data())
      } catch (e) {
        console.error(e)
        setError('Failed to load data')
      }
    }

    loadData()
  }, [documentName, clipId])

  /**
   * Load YouTube IFrame API if not already loaded
   */
  useEffect(() => {
    if (window.YT && window.YT.Player) return
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => initPlayer()
  }, [])

  /**
   * Initialize YouTube player with the correct video and timestamp
   */
  const initPlayer = () => {
    if (!mainSummary?.videoEmbedLink || !playerRef.current) return
    const videoId = extractVideoId(mainSummary.videoEmbedLink)
    const startTime = convertTimestampToSeconds(clipData?.timestamp)

    new window.YT.Player(playerRef.current, {
      videoId,
      width: '100%',
      height: '360',
      playerVars: {
        autoplay: 1,
        start: startTime,
        controls: 1,
        modestbranding: 1,
      },
      events: {
        onReady: () => setPlayerReady(true),
      }
    })
  }

  /**
   * Initialize player when data is available and YouTube API is loaded
   */
  useEffect(() => {
    if (mainSummary && clipData && window.YT?.Player) initPlayer()
  }, [mainSummary, clipData])

  // Error state. role="alert" + aria-live so screen readers announce
  // the failure when it lands; previously the message just appeared
  // silently in the DOM without screen reader notification.
  if (error) return <div className="p-6 text-red-600 dark:text-red-400" role="alert" aria-live="assertive">{error}</div>

  // Loading state. role="status" + aria-live so screen readers
  // announce that the page is loading rather than presenting an
  // empty page that looks like nothing happened.
  if (!mainSummary || !clipData) return <div className="p-6 text-stone-900" role="status" aria-live="polite">Loading...</div>

  // Process keywords into array format regardless of input format
  const keywords = Array.isArray(clipData.keywords)
    ? clipData.keywords
    : clipData.keywords?.split(',') || []

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Interviewee Name as Link.
          Was <h1 onClick> -- looked like a link, behaved like a link,
          but was un-keyboardable and announced as a heading rather
          than as a navigable control. Now a real button styled to
          match the previous appearance; the heading is preserved as
          the button's child h1 so screen readers still announce the
          heading semantic ("heading level 1: Maynard E. Moore") in
          addition to the button affordance ("Open full interview"). */}
      <div>
        <button
          type="button"
          onClick={() => navigate(`/interview-player?documentName=${encodeURIComponent(documentName)}`)}
          className="text-left bg-transparent border-0 p-0 cursor-pointer hover:underline min-h-11"
          aria-label={`Open full interview with ${mainSummary.name}`}
        >
          <h1 className="text-3xl font-bold text-blue-700 dark:text-blue-400">
            {mainSummary.name}
          </h1>
        </button>
      </div>

      {/* Clip Info */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-300">
          {clipData.topic}
        </h2>
        <div className="flex items-center text-sm text-gray-500 dark:text-stone-400">
          <Clock size={16} className="mr-2" />
          <span>{clipData.timestamp}</span>
        </div>

        {/* Clickable Keywords.
            Was <span onClick> -- un-keyboardable. Now <button>s with
            aria-label so screen readers announce the destination.
            min-h-11 added to meet the WCAG 2.2 AA 44x44 tap target;
            previously px-2 py-1 + text-xs gave ~22px height. */}
        {keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-2">
            {keywords.map((k, idx) => (
              <button
                type="button"
                key={idx}
                className="bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200 px-3 py-2 min-h-11 rounded-full text-xs flex items-center gap-1 cursor-pointer hover:bg-blue-200 dark:hover:bg-blue-900/70 border-0"
                onClick={() => navigate(`/playlist-builder?keywords=${encodeURIComponent(k)}`)}
                aria-label={`Browse playlist for keyword ${k.trim()}`}
              >
                <Tag size={12} aria-hidden="true" /> {k}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* YouTube Player */}
      <div className="rounded-lg overflow-hidden bg-black mt-6">
        <div ref={playerRef} />
      </div>

      {/* Clip Summary */}
      <div className="bg-gray-50 border border-gray-200 dark:bg-stone-800 dark:border-stone-800 rounded-lg p-4 mt-4">
        <p className="text-gray-800 dark:text-stone-200 leading-relaxed">{clipData.summary}</p>
      </div>

      {/* Interviewee Role */}
      {mainSummary.role && (
        <div className="text-gray-600 dark:text-stone-400 text-lg mt-6 italic">
          {mainSummary.role}
        </div>
      )}
    </div>
  )
}