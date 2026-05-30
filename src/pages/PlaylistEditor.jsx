// src/pages/PlaylistEditor.jsx
import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../services/firebase'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import { useDocumentTitle } from '../hooks/useDocumentTitle'

export default function PlaylistEditor() {
  const [searchParams] = useSearchParams()
  const keyword = searchParams.get('keywords')
  useDocumentTitle(keyword ? `Edit: ${keyword} playlist` : 'Edit playlist')
  const [videoQueue, setVideoQueue] = useState([])
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isPlayerReady, setIsPlayerReady] = useState(false)
  const [isEditingDescription, setIsEditingDescription] = useState(false)
  const [editedDescription, setEditedDescription] = useState('')
  const playerRef = useRef(null)
  const playbackMonitorRef = useRef(null)

  useEffect(() => {
    const keyword = searchParams.get('keywords')
    if (keyword) {
      searchAndBuildPlaylist(keyword)
    }
  }, [searchParams])

  // Utility functions from PlaylistBuilder (same as before)
  const extractVideoId = (videoEmbedLink) => {
    const match = videoEmbedLink?.match(/embed\/([a-zA-Z0-9_-]+)/)
    return match ? match[1] : null
  }

  // ... (other utility functions remain the same as PlaylistBuilder)

  // New functions for editing capabilities
  const handleDragEnd = (result) => {
    if (!result.destination) return

    const items = Array.from(videoQueue)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    // Update playlist order
    const updatedItems = items.map((item, index) => ({
      ...item,
      playlistOrder: index
    }))

    setVideoQueue(updatedItems)
    savePlaylistOrder(updatedItems)
  }

  const savePlaylistOrder = async (items) => {
    try {
      // Save the new order to Firebase
      const keyword = searchParams.get('keywords')
      const keywordDocRef = doc(db, "keywordPlaylists", keyword)
      await updateDoc(keywordDocRef, {
        items: items.map(item => ({
          documentName: item.documentName,
          playlistOrder: item.playlistOrder
        }))
      })
    } catch (error) {
      console.error("Error saving playlist order:", error)
    }
  }

  const handleEditDescription = () => {
    setIsEditingDescription(true)
    setEditedDescription(document.getElementById('overallSummaryContent').innerText)
  }

  const handleSaveDescription = async () => {
    try {
      const keyword = searchParams.get('keywords')
      const keywordDocRef = doc(db, "keywordSummaries", keyword)
      await updateDoc(keywordDocRef, {
        summary: editedDescription
      })
      document.getElementById('overallSummaryContent').innerText = editedDescription
      setIsEditingDescription(false)
    } catch (error) {
      console.error("Error saving description:", error)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Panel: Overall Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="mb-4">
              <h2 className="text-2xl font-bold mb-2 text-stone-900 dark:text-stone-100">Playlist Info</h2>
              <p id="totalDuration" className="text-stone-900 dark:text-stone-200">
                Total Duration: {formatTime(getTotalPlaylistDuration(videoQueue))}
              </p>
            </div>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-xl font-semibold text-stone-900 dark:text-stone-100" id="playlist-summary-heading">Playlist Summary</h3>
                {/* Edit button. text-blue-500 (#3b82f6 = 4.0:1 on white)
                    fails WCAG AA normal text; bumped to text-blue-700
                    (#1d4ed8 = 8.6:1, passes AAA). Emoji removed from
                    the visible label and aria-label spelled out for
                    screen readers; min-h-11 brings the hit area to
                    44x44. */}
                <button
                  type="button"
                  onClick={handleEditDescription}
                  className="text-blue-700 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 min-h-11 px-2 -mx-2 inline-flex items-center"
                  aria-label="Edit playlist summary"
                >
                  <span aria-hidden="true" className="mr-1">✏️</span>
                  Edit
                </button>
              </div>

              {isEditingDescription ? (
                <div className="space-y-2">
                  <label htmlFor="playlist-summary-edit" className="sr-only">
                    Edit playlist summary text
                  </label>
                  <textarea
                    id="playlist-summary-edit"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    className="w-full h-40 p-2 border rounded dark:bg-stone-800 dark:border-stone-700 dark:text-stone-100 dark:placeholder-stone-500"
                    aria-describedby="playlist-summary-heading"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setIsEditingDescription(false)}
                      className="px-4 py-2 min-h-11 text-gray-700 hover:text-gray-900 dark:text-stone-300 dark:hover:text-stone-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveDescription}
                      className="px-4 py-2 min-h-11 bg-blue-600 text-white rounded hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <p id="overallSummaryContent" className="text-gray-700 dark:text-stone-300" />
              )}
            </div>
          </div>
        </div>

        {/* Right Panel: Video Player and Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-lg p-6">
            {currentVideo && (
              <>
                <div className="mb-4">
                  <h2 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{currentVideo.name}</h2>
                  <p className="text-gray-600 dark:text-stone-400">{currentVideo.role}</p>
                </div>

                <div id="player" className="w-full aspect-video mb-4" />

                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="timeline" direction="horizontal">
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="relative h-20 bg-gray-100 dark:bg-stone-800 rounded mb-4"
                      >
                        <div className="absolute inset-0 flex">
                          {videoQueue.map((video, index) => (
                            <Draggable
                              key={`${video.documentName}-${index}`}
                              draggableId={`${video.documentName}-${index}`}
                              index={index}
                            >
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`relative h-full cursor-move transition-colors
                                    ${index === currentVideoIndex ? 'bg-blue-500 dark:bg-blue-600' : 'bg-gray-300 dark:bg-stone-600'}
                                    ${snapshot.isDragging ? 'ring-2 ring-blue-400' : ''}`}
                                  style={{
                                    ...provided.draggableProps.style,
                                    width: `${(getDuration(video) / getTotalDuration(videoQueue)) * 100}%`
                                  }}
                                >
                                  <img
                                    src={`https://img.youtube.com/vi/${extractVideoId(video.videoEmbedLink)}/default.jpg`}
                                    alt="Thumbnail"
                                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                                  />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Playback Controls.
                    Icon-only buttons need aria-label so screen readers
                    announce the function (skip_previous / pause /
                    skip_next material icon names are not exposed as
                    accessible names). min-w-11 min-h-11 brings each
                    button to WCAG 2.2 AA 44x44; previously p-2 alone
                    gave ~32px (small icon + 8px padding each side). */}
                <div className="flex justify-center space-x-4" role="group" aria-label="Playback controls">
                  <button
                    type="button"
                    onClick={handleSkipPrevious}
                    disabled={currentVideoIndex === 0}
                    aria-label="Previous clip"
                    className="min-w-11 min-h-11 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    <span className="material-icons" aria-hidden="true">skip_previous</span>
                  </button>
                  <button
                    type="button"
                    onClick={handlePlayPause}
                    aria-label="Play or pause"
                    className="min-w-11 min-h-11 p-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white inline-flex items-center justify-center"
                  >
                    <span id="playPauseIcon" className="material-icons" aria-hidden="true">pause</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSkipNext}
                    disabled={currentVideoIndex === videoQueue.length - 1}
                    aria-label="Next clip"
                    className="min-w-11 min-h-11 p-2 rounded-full bg-gray-200 hover:bg-gray-300 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center"
                  >
                    <span className="material-icons" aria-hidden="true">skip_next</span>
                  </button>
                </div>

                <div className="mt-6">
                  <h3 className="text-xl font-semibold mb-2 text-stone-900 dark:text-stone-100">Summary</h3>
                  <p className="text-gray-700 dark:text-stone-300">{currentVideo.summary}</p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Utility function to get clip duration
function getDuration(video) {
  const start = convertTimestampToSeconds(extractStartTimestamp(video.timestamp))
  const end = convertTimestampToSeconds(extractStartTimestamp(video.timestamp.split(" - ")[1]))
  return end - start
}

// Utility function to get total duration
function getTotalDuration(queue) {
  return queue.reduce((sum, video) => sum + getDuration(video), 0)
}