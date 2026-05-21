/**
 * @fileoverview InterviewPlayer page for displaying and controlling interview videos.
 * 
 * This component handles displaying a full interview video with customized playback controls,
 * segmented content navigation, and related metadata. It integrates with YouTube's iframe API
 * to provide a seamless media playback experience with custom controls.
 */

import React, { useState, useEffect, useRef } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { getInterviewData, getInterviewSegments, getAllInterviews } from '../services/firebase'
import { useAuth } from '../contexts/AuthContext'
import { useInlineFeedback } from '../hooks/useInlineFeedback'
import FeedbackModal from '../components/FeedbackModal'
import SelectionFeedbackButton from '../components/SelectionFeedbackButton'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import ArrowLeftIcon from "../assetts/vectors/arrow left.svg";
import ArrowRightIcon from "../assetts/vectors/arrow right.svg";

/**
 * InterviewPlayer - Main component for viewing and navigating interview videos
 * 
 * This component:
 * 1. Retrieves and displays interview metadata and segmented content
 * 2. Initializes and controls the YouTube player integration
 * 3. Provides custom playback controls and timeline navigation
 * 4. Manages segment-based navigation with timestamps and topics
 * 5. Offers related content discovery through keywords
 * 
 * URL Parameters:
 * - documentName: ID of the interview document to display
 * 
 * @returns {React.ReactElement} The interview player interface
 */
export default function InterviewPlayer() {
  // Routing and navigation
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const documentName = searchParams.get('documentName')
  const { user } = useAuth()
  
  // Component state variables
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [mainSummary, setMainSummary] = useState(null)
  const [subSummaries, setSubSummaries] = useState([])
  const [playerReady, setPlayerReady] = useState(false)
  const [youtubeApiLoaded, setYoutubeApiLoaded] = useState(false)
  const [relatedInterviews, setRelatedInterviews] = useState([])
  
  // Player control states
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [totalDuration, setTotalDuration] = useState(0)
  const [currentSegmentIndex, setCurrentSegmentIndex] = useState(0)
  const [seekToTime, setSeekToTime] = useState(null)
  const [showDescriptionModal, setShowDescriptionModal] = useState(false)
  
  
  // References
  const [containerEl, setContainerEl] = useState(null) // YouTube container element via callback ref
  const playerRef = useRef(null) // Reference to the YouTube player instance
  const playerUpdateIntervalRef = useRef(null) // Reference to the time update interval

  // Derive a more descriptive label for feedback context
  const interviewSubject =
    mainSummary?.title ||
    (Array.isArray(mainSummary?.intervieweeNames) && mainSummary.intervieweeNames.filter(Boolean).join(', ')) ||
    mainSummary?.intervieweeName ||
    mainSummary?.interviewee ||
    documentName

  const interviewSectionLabel = interviewSubject ? `Interview: ${interviewSubject}` : 'Interview'

  // Inline feedback functionality
  const {
    contentRef,
    selectionContext,
    showFeedbackModal,
    handleReportIssue,
    handleFeedbackSubmit,
    handleCloseFeedbackModal,
  } = useInlineFeedback({ user, sectionLabel: interviewSectionLabel })

  /**
   * --- Helper Functions ---
   */

  /**
   * Extracts YouTube video ID from various URL formats
   * 
   * @param {string} videoEmbedLink - YouTube URL in different possible formats
   * @returns {string|null} YouTube video ID or null if not extractable
   */
  const extractVideoId = (videoEmbedLink) => {
    if (!videoEmbedLink) return null
    const match = videoEmbedLink.match(/(?:embed\/|watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
    return match ? match[1] : null
  }

  /**
   * Converts a timestamp string to seconds
   * 
   * @param {string} timestamp - Timestamp in format "[MM:SS] - Text", "[HH:MM:SS] - Text", or "HH:MM:SS,000 - HH:MM:SS,000"
   * @returns {number} Time in seconds
   */
  const convertTimestampToSeconds = (timestamp) => {
    if (!timestamp) return 0
    
    // Handle metadataV2 format: "01:26:43,000 - 02:38:35,000"
    // Extract the start time (before the " - ")
    const timeStr = timestamp.split(' - ')[0].replace(/[\[\]]/g, '').replace(',000', '').trim()
    const parts = timeStr.split(':').map(Number)
    
    if (parts.length === 3) {
      return parts[0] * 3600 + parts[1] * 60 + parts[2]
    } else if (parts.length === 2) {
      return parts[0] * 60 + parts[1]
    }
    return 0
  }

  // Helper function to extract start timestamp from various formats
  const extractStartTimestamp = (timestamp) => {
    if (!timestamp) return '00:00'
    // Handle both formats: "[HH:MM:SS - HH:MM:SS]" and "HH:MM:SS,000 - HH:MM:SS,000"
    const cleanTimestamp = timestamp.replace(/[\[\]]/g, '').replace(',000', '')
    const parts = cleanTimestamp.split(' - ')
    return parts.length >= 1 ? parts[0].trim() : '00:00'
  }

  /**
   * Formats keywords into a consistent array format
   * 
   * @param {string|string[]} keywords - Keywords as string or array
   * @returns {string[]} Formatted array of keywords
   */
  const formatKeywords = (keywords) => {
    if (Array.isArray(keywords)) return keywords
    if (typeof keywords === 'string') return keywords.split(',').map((k) => k.trim())
    return []
  }

  /**
   * Extracts YouTube video ID for thumbnail generation
   * 
   * @param {string} videoEmbedLink - YouTube URL
   * @returns {string|null} YouTube video ID or null
   */
  const extractYouTubeVideoId = (videoEmbedLink) => {
    if (!videoEmbedLink) return null
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/
    const match = videoEmbedLink.match(regExp)
    return (match && match[2].length === 11) ? match[2] : null
  }

  /**
   * Gets thumbnail URL for a YouTube video
   * 
   * @param {string} videoEmbedLink - YouTube URL
   * @returns {string|null} Thumbnail URL or null
   */
  const getThumbnailUrl = (videoEmbedLink) => {
    const videoId = extractYouTubeVideoId(videoEmbedLink)
    return videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null
  }

  /**
   * Determines which segment is active based on current playback time
   * 
   * @param {number} time - Current playback time in seconds
   * @returns {number} Index of the current segment
   */
  const getCurrentSegmentIndex = (time) => {
    if (!subSummaries || subSummaries.length === 0) return 0
    
    // Find the last segment that starts before the current time
    for (let i = subSummaries.length - 1; i >= 0; i--) {
      const startTime = convertTimestampToSeconds(subSummaries[i].timestamp)
      if (startTime <= time) {
        return i
      }
    }
    
    return 0 // Default to first segment if none found
  }

  /**
   * Initialize related terms cache
   */
  useEffect(() => {
    const initializeRelatedTerms = async () => {
      try {
        console.log('Initializing related terms for interview player...');
        const relatedTerms = await calculateRelatedTerms();
        setRelatedTermsCache(relatedTerms);
        
        // Get available topics from the related terms cache
        const topics = Object.keys(relatedTerms).map(topic => ({ keyword: topic }));
        setAvailableTopics(topics);
      } catch (error) {
        console.error('Error initializing related terms:', error);
      }
    };

    initializeRelatedTerms();
  }, []);

  /**
   * --- Data Fetching ---
   * Fetches interview data and segment information from Firestore
   */
  useEffect(() => {
    if (!documentName) {
      setError('Document name is missing')
      setLoading(false)
      return
    }

    async function fetchData() {
      try {
        setLoading(true)
        
        // Use the new enhanced service functions
        const mainData = await getInterviewData(documentName)
        if (!mainData) {
          setError('Interview not found')
          setLoading(false)
          return
        }
        setMainSummary(mainData)

        // Fetch segments using new service
        const subs = await getInterviewSegments(documentName)
        
        // Sort segments by timestamp (handling both legacy and new formats)
        subs.sort((a, b) => {
          // Use startTime if available (metadataV2), otherwise extract from timestamp
          const timeA = a.startTime || extractStartTimestamp(a.timestamp)
          const timeB = b.startTime || extractStartTimestamp(b.timestamp)
          return convertTimestampToSeconds(timeA) - convertTimestampToSeconds(timeB)
        })
        
        setSubSummaries(subs)
        setLoading(false)
      } catch (err) {
        console.error('Error fetching interview data:', err)
        setError('Failed to load interview data')
        setLoading(false)
      }
    }

    fetchData()
  }, [documentName])

  /**
   * --- Fetch Related Interviews ---
   * Fetches interviews that share keywords/topics with current interview
   */
  useEffect(() => {
    async function fetchRelatedInterviews() {
      if (!subSummaries || subSummaries.length === 0) return
      
      try {
        // Collect all keywords from current interview segments
        const currentKeywords = new Set()
        subSummaries.forEach(segment => {
          const keywords = formatKeywords(segment.keywords)
          keywords.forEach(kw => currentKeywords.add(kw.toLowerCase().trim()))
        })

        if (currentKeywords.size === 0) return

        // Fetch all interviews
        const allInterviews = await getAllInterviews({ limit: 100 })
        
        // Calculate relevance score for each interview
        const interviewScores = []
        
        for (const interview of allInterviews) {
          // Skip the current interview
          if (interview.id === documentName) continue
          
          try {
            const segments = await getInterviewSegments(interview.id)
            let sharedKeywordsCount = 0
            const matchedKeywords = new Set()
            
            segments.forEach(segment => {
              const segmentKeywords = formatKeywords(segment.keywords)
              segmentKeywords.forEach(kw => {
                const normalized = kw.toLowerCase().trim()
                if (currentKeywords.has(normalized)) {
                  sharedKeywordsCount++
                  matchedKeywords.add(normalized)
                }
              })
            })
            
            if (sharedKeywordsCount > 0) {
              interviewScores.push({
                ...interview,
                relevanceScore: sharedKeywordsCount,
                uniqueMatchedKeywords: matchedKeywords.size,
                totalSegments: segments.length
              })
            }
          } catch (error) {
            console.warn(`Error processing interview ${interview.id}:`, error)
          }
        }
        
        // Sort by relevance score and get top 4
        const topRelated = interviewScores
          .sort((a, b) => {
            // First sort by unique matched keywords, then by total score
            if (b.uniqueMatchedKeywords !== a.uniqueMatchedKeywords) {
              return b.uniqueMatchedKeywords - a.uniqueMatchedKeywords
            }
            return b.relevanceScore - a.relevanceScore
          })
          .slice(0, 4)
        
        setRelatedInterviews(topRelated)
      } catch (error) {
        console.error('Error fetching related interviews:', error)
      }
    }

    fetchRelatedInterviews()
  }, [subSummaries, documentName])

  /**
   * --- Load YouTube API ---
   * Dynamically loads the YouTube iframe API if not already loaded
   */
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setYoutubeApiLoaded(true)
      return
    }
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    tag.async = true
    tag.onload = () => {
      if (window.YT && window.YT.Player) {
        setYoutubeApiLoaded(true)
      }
    }
    document.body.appendChild(tag)
    window.onYouTubeIframeAPIReady = () => {
      setYoutubeApiLoaded(true)
    }
  }, [])

  /**
   * --- Initialize YouTube Player ---
   * Creates and configures the YouTube player instance when dependencies are ready
   */
  useEffect(() => {
    if (!youtubeApiLoaded || !mainSummary?.videoEmbedLink || !containerEl) return

    const videoId = extractVideoId(mainSummary.videoEmbedLink)
    if (!videoId) {
      console.error('Invalid YouTube video link')
      return
    }

    // Destroy any existing player instance.
    if (playerRef.current && typeof playerRef.current.destroy === 'function') {
      playerRef.current.destroy()
      setPlayerReady(false)
    }

    // Initialize new player instance
    playerRef.current = new window.YT.Player(containerEl, {
      videoId,
      width: '100%',
      height: '100%',
      playerVars: {
        autoplay: 0,
        controls: 1, // Show default YouTube controls
        rel: 0,
        modestbranding: 1,
      },
      events: {
        onReady: (event) => {
          setPlayerReady(true)
          setTotalDuration(event.target.getDuration())
          console.log('Player is ready with duration:', event.target.getDuration())
        },
        onStateChange: (event) => {
          // Update isPlaying state based on player state
          setIsPlaying(event.data === window.YT.PlayerState.PLAYING)
          
          // If video ended
          if (event.data === window.YT.PlayerState.ENDED) {
            setIsPlaying(false)
          }
        },
        onError: (e) => {
          console.error('YouTube player error:', e.data)
        },
      },
    })

    // Set up interval to update current time and segment information
    playerUpdateIntervalRef.current = setInterval(() => {
      if (playerRef.current && typeof playerRef.current.getCurrentTime === 'function') {
        const currentTime = playerRef.current.getCurrentTime()
        setCurrentTime(currentTime)
        
        // Update current segment based on time
        const newSegmentIndex = getCurrentSegmentIndex(currentTime)
        if (newSegmentIndex !== currentSegmentIndex) {
          setCurrentSegmentIndex(newSegmentIndex)
          // Removed auto-opening accordion
        }
      }
    }, 500)

    // Cleanup function to clear interval and destroy player on unmount
    return () => {
      if (playerUpdateIntervalRef.current) {
        clearInterval(playerUpdateIntervalRef.current)
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy()
        playerRef.current = null
      }
    }
  }, [youtubeApiLoaded, mainSummary, containerEl])

  /**
   * Handle seek requests when seekToTime changes
   */
  useEffect(() => {
    if (seekToTime !== null && playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seekToTime, true)
      setSeekToTime(null) // Reset after seeking
    }
  }, [seekToTime])

  /**
   * --- Event Handlers ---
   */

  /**
   * Handles clicks on timestamp links to seek to specific points
   * 
   * @param {number} seconds - Target time in seconds to seek to
   */
  const handleTimestampClick = (seconds) => {
    setSeekToTime(seconds)
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true)
      playerRef.current.playVideo()
      setIsPlaying(true)
    }
  }

  /**
   * Navigate to previous chapter
   */
  const handlePreviousChapter = () => {
    if (currentSegmentIndex > 0) {
      const prevSegment = subSummaries[currentSegmentIndex - 1]
      const seconds = convertTimestampToSeconds(prevSegment.timestamp)
      handleTimestampClick(seconds)
      setCurrentSegmentIndex(currentSegmentIndex - 1)
    }
  }

  /**
   * Navigate to next chapter
   */
  const handleNextChapter = () => {
    if (currentSegmentIndex < subSummaries.length - 1) {
      const nextSegment = subSummaries[currentSegmentIndex + 1]
      const seconds = convertTimestampToSeconds(nextSegment.timestamp)
      handleTimestampClick(seconds)
      setCurrentSegmentIndex(currentSegmentIndex + 1)
    }
  }



  
  /**
   * Formats seconds into a human-readable time string
   * 
   * @param {number} seconds - Time in seconds
   * @returns {string} Formatted time string (MM:SS or HH:MM:SS)
   */
  const formatTime = (seconds) => {
    if (isNaN(seconds)) return '00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }


  /**
   * --- Rendering ---
   */
  
  // Loading state
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl">
        <p>
          <strong>Error:</strong> {error}
        </p>
      </div>
    )
  }

  const hasSegments = subSummaries.length > 0;

  return (
    <>
      {/* Feedback UI */}
      {!showFeedbackModal && (
        <SelectionFeedbackButton
          selection={selectionContext}
          onReport={handleReportIssue}
          disabled={false}
        />
      )}
      {showFeedbackModal && selectionContext && (
        <FeedbackModal
          selectedText={selectionContext.text}
          sectionLabel={selectionContext.sectionLabel}
          onSubmit={handleFeedbackSubmit}
          onClose={handleCloseFeedbackModal}
        />
      )}
      
      <div className="w-full min-h-screen overflow-hidden" style={{ backgroundColor: '#EBEAE9' }}>
        {/* Universal Header */}
        <Header />

        {/* Main content */}
        <div
          ref={contentRef}
          data-feedback-section={interviewSectionLabel}
          className="px-4 sm:px-6 md:px-8 lg:px-12 pt-4"
        >
        {/* Interview title.
            Was text-8xl unconditionally; on a 360px phone that 96px
            heading wraps a single first name across two or three lines
            and pushes the video below the fold. Scales now from
            text-4xl on mobile up to text-8xl at xl. */}
        <div className="mb-6 sm:mb-8">
          <h1 className="text-stone-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium mb-4" style={{fontFamily: 'Acumin Pro, Inter, sans-serif'}}>
            {mainSummary?.name || documentName}
          </h1>
          <div className="text-red-500 text-base font-mono">
            {mainSummary?.roleSimplified && `${mainSummary.roleSimplified} | `}
            {totalDuration > 0 && `${Math.round(totalDuration / 60)} minutes`}
          </div>
        </div>

        {/* Main video and content area.
            Was flex gap-6 with flex-shrink-0 video at w-[960px], which
            forced horizontal scroll on every viewport under ~1100px.
            Now stacks vertically on mobile/tablet (flex-col) and
            switches to side-by-side at lg. The video itself is now
            w-full inside an aspect-video container so it scales fluidly
            and fills available width while preserving 16:9. */}
        <div className="flex flex-col lg:flex-row gap-6 mb-8">
          {/* Video player section */}
          <div className="w-full lg:flex-shrink-0 lg:max-w-[960px]">
            {/* Video player.
                aspect-video (16:9) replaces the hardcoded 540px height
                so the player height tracks the responsive width. */}
            <div className="w-full aspect-video relative rounded-xl overflow-hidden mb-4">
              <div className="absolute inset-0 bg-black" ref={setContainerEl}></div>
              {!playerReady && (
                <div
                  className="absolute inset-0 flex items-center justify-center bg-black/30 pointer-events-none"
                  role="status"
                  aria-live="polite"
                >
                  <div className="w-16 h-16 border-4 border-white/50 border-t-white rounded-full animate-spin" aria-hidden="true"></div>
                  <span className="sr-only">Loading video player</span>
                </div>
              )}
            </div>

            {/* Chapter Navigation Controls.
                The prev/next chapter affordances were 24px-tall divs
                without role="button" or keyboard handlers, well below
                the 44x44 WCAG 2.2 AA tap-target rule and unreachable by
                keyboard. Converted to real <button> elements with
                min-h-11, aria-labels, and disabled state instead of
                CSS opacity (which still allowed the click handler to
                fire on a disabled-looking control). On mobile the chip
                pair stacks above the "Chapter N of M" indicator;
                desktop keeps the original row layout. */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-4">
              <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                <button
                  type="button"
                  onClick={handlePreviousChapter}
                  disabled={currentSegmentIndex === 0}
                  aria-label="Previous chapter"
                  className="inline-flex items-center gap-2 min-h-11 px-2 -mx-2 cursor-pointer hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <img src={ArrowLeftIcon} alt="" aria-hidden="true" className="w-5 h-4" />
                  <span className="text-stone-900 text-lg sm:text-xl font-light font-mono">Prev. Chapter</span>
                </button>

                <button
                  type="button"
                  onClick={handleNextChapter}
                  disabled={currentSegmentIndex >= subSummaries.length - 1}
                  aria-label="Next chapter"
                  className="inline-flex items-center gap-2 min-h-11 px-2 -mx-2 cursor-pointer hover:opacity-80 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-stone-900 text-lg sm:text-xl font-light font-mono">Next Chapter</span>
                  <img src={ArrowRightIcon} alt="" aria-hidden="true" className="w-5 h-4" />
                </button>
              </div>

              {subSummaries.length > 0 && (
                <div className="text-red-500 text-base font-mono" aria-live="polite">
                  Chapter {currentSegmentIndex + 1} of {subSummaries.length}
                </div>
              )}
            </div>

          </div>

          {/* Side content. On mobile this sits beneath the video; on
              desktop it sits to the right as before. */}
          <div className="flex-1 pt-0">
            {mainSummary && (
              <>
                {/* Role */}
                <div className="text-black text-xl sm:text-2xl font-normal leading-relaxed mb-6" style={{fontFamily: '"Source Serif 4", serif'}}>
                  {mainSummary.role || mainSummary.roleSimplified || 'No role information available'}
                </div>

                {/* Button to view full description */}
                <button
                  onClick={() => setShowDescriptionModal(true)}
                  className="text-red-500 text-base font-mono hover:text-red-700 transition-colors cursor-pointer min-h-11 inline-flex items-center"
                >
                  View Interview Description
                </button>
              </>
            )}
          </div>
        </div>

      {/* Interview Segments.
          Was px-12 unconditional + the per-segment row was
          flex gap-8 items-start with a hardcoded w-[503px] topic column
          and a max-w-[804px] summary column, which forced 1307px of
          horizontal layout the moment any segment rendered. Now
          responsive: px-4 -> px-12 progressive, and each segment row
          stacks (flex-col) on mobile + tablet and only switches to
          side-by-side at lg. Topic column drops the fixed w-[503px]
          in favor of lg:w-2/5 so the columns share width proportionally
          rather than competing for the same 503px on a 1024px tablet.
          The keyword pills are now real <button>s with min-h-11 (they
          were divs with onClick, breaking keyboard access and the
          44x44 tap target). The chapter timestamp link is also a real
          button now for the same reason. */}
      <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 space-y-8">
        <div className="w-full">
          <div className="mb-14">
            <h2 className="text-black text-3xl sm:text-4xl md:text-5xl font-medium mb-6" style={{fontFamily: 'Inter, sans-serif'}}>Interview Chapters</h2>

            {subSummaries.map((summary, index) => (
              <div key={summary.id || index} className="w-full mb-8">
                <button
                  type="button"
                  className="text-red-500 text-base font-mono mb-2 cursor-pointer hover:text-red-700 transition-colors min-h-11 inline-flex items-center text-left disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={() => {
                    const seconds = convertTimestampToSeconds(summary.timestamp);
                    handleTimestampClick(seconds);
                  }}
                  disabled={!playerReady}
                  aria-label={`Jump to chapter ${index + 1}`}
                >
                  Chapter {String(index + 1).padStart(2, '0')} | {summary.timestamp ? summary.timestamp.split(' - ')[0].replace(/[\[\]]/g, '').replace(',000', '').trim() : 'Unknown time'}
                </button>

                <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
                  <div className="w-full lg:w-2/5">
                    <div className="text-stone-900 text-2xl sm:text-3xl md:text-4xl font-bold font-['Source_Serif_4'] mb-4">
                      {summary.topic || `Segment ${index + 1}`}
                    </div>

                    {/* Keywords for this segment */}
                    <div className="flex flex-wrap gap-3 mb-6">
                      {formatKeywords(summary.keywords).slice(0, 3).map((keyword, idx) => (
                        <button
                          type="button"
                          key={idx}
                          className="px-4 sm:px-6 py-3 min-h-11 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black inline-flex justify-center items-center gap-2.5 cursor-pointer hover:bg-gray-50 transition-colors duration-200"
                          onClick={() => navigate(`/playlist-builder?keywords=${encodeURIComponent(keyword)}`)}
                          aria-label={`Browse playlist for keyword ${keyword}`}
                        >
                          <span className="text-center text-black text-sm sm:text-base font-light font-['Chivo_Mono']">
                            {keyword}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex-1 w-full">
                    <div className="text-black text-lg sm:text-xl md:text-2xl font-normal leading-relaxed" style={{fontFamily: '"Source Serif 4", serif'}}>
                      {summary.summary}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>


      {/* Related Interviews Section.
          Same responsive treatment as the title block: text-8xl was
          shrinking the related-row headline to ~12 chars per line on
          mobile, padding was px-12 unconditional, and each card was a
          <div> with onClick (un-keyboardable). Now responsive padding,
          progressive headline sizing, and the card row is a real
          <button> with aria-label so keyboard / screen reader users
          can navigate. */}
      {relatedInterviews.length > 0 && (
        <div className="w-full px-4 sm:px-6 md:px-8 lg:px-12 py-12 sm:py-16">
          <div className="w-full">
            <div className="mb-8">
              <div className="w-full h-px border-t border-black mb-6"></div>
              <div className="text-stone-900 text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium" style={{fontFamily: 'Acumin Pro, Inter, sans-serif'}}>
                <span className="text-stone-900">Related</span>
                <span className="text-red-500"> </span>
                <span className="text-stone-900">Interviews</span>
              </div>
            </div>

            {/* Related interviews grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 sm:gap-8">
              {relatedInterviews.map((interview) => {
                const thumbnailUrl = getThumbnailUrl(interview.videoEmbedLink)
                return (
                  <button
                    type="button"
                    key={interview.id}
                    className="w-full text-left cursor-pointer group"
                    onClick={() => navigate(`/interview-player?documentName=${encodeURIComponent(interview.id)}`)}
                    aria-label={`Open interview with ${interview.documentName || interview.name}`}
                  >
                    {/* Thumbnail.
                        h-72 (288px) was reasonable for desktop but
                        rendered each card 288px tall on a 360px-wide
                        single-column mobile layout, making the related
                        list feel taller than the page above. Now
                        responsive: aspect-video on mobile so the card
                        height tracks the card width; explicit h-72 only
                        at sm and up where the multi-column grid keeps
                        each card narrow. */}
                    <div className="w-full aspect-video sm:aspect-auto sm:h-72 bg-zinc-300 mb-3 rounded overflow-hidden relative group-hover:opacity-90 transition-opacity">
                      {thumbnailUrl ? (
                        <img
                          src={thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-zinc-300">
                          <span className="text-zinc-500 text-sm">No thumbnail</span>
                        </div>
                      )}
                    </div>

                    {/* Interview name */}
                    <div className="text-stone-900 text-2xl sm:text-3xl lg:text-4xl font-bold font-['Source_Serif_4'] mb-2 group-hover:text-red-500 transition-colors">
                      {interview.documentName || interview.name}
                    </div>

                    {/* Role and metadata */}
                    <div className="text-stone-900 text-base font-mono">
                      {interview.roleSimplified || interview.role || 'Unknown Role'}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

        </div>
        
        {/* Footer */}
        <Footer />

        {/* Description Modal */}
        {showDescriptionModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4"
            onClick={() => setShowDescriptionModal(false)}
          >
            <div 
              className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-y-auto p-8 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => setShowDescriptionModal(false)}
                className="absolute top-4 right-4 w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Modal content */}
              <div>
                <h2 className="text-stone-900 text-5xl font-medium mb-6" style={{fontFamily: 'Inter, sans-serif'}}>
                  Interview Description
                </h2>
                
                <div className="text-black text-2xl font-normal leading-relaxed" style={{fontFamily: '"Source Serif 4", serif'}}>
                  {mainSummary?.mainSummary || 'No description available'}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}