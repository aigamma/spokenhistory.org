/**
 * @fileoverview TopicGlossary component for browsing interview topics in a card-based layout.
 * 
 * This component provides a glossary view of topics/keywords extracted from interviews,
 * displaying them in a clean card grid with topic titles and statistics.
 * It implements caching for performance and supports filtering and sorting.
 */

import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';
import { DirectoryCacheContext } from '../pages/ContentDirectory';

/**
 * TopicGlossary - Card-based topic directory with filtering and navigation
 * 
 * This component provides:
 * 1. A card grid layout of topics/keywords from interviews
 * 2. Statistics about each topic (interview count, clip count, total duration)
 * 3. Filtering and sorting capabilities
 * 4. Navigation to playlists and content
 * 5. Efficient data loading with caching
 * 
 * @component
 * @example
 * <TopicGlossary onViewAllClips={handleViewAllClips} />
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onViewAllClips - Callback when a topic card is clicked
 * @returns {React.ReactElement} Topic glossary interface
 */
export default function TopicGlossary({ onViewAllClips }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topicData, setTopicData] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredTopics, setFilteredTopics] = useState([]);
  const [sortBy, setSortBy] = useState('alphabetical'); // 'alphabetical', 'clipCount', 'interviewCount'
  const navigate = useNavigate();

  // Get caching functions from context
  const { cache, updateCache, addSearchToCache, getSearchFromCache } = useContext(DirectoryCacheContext);

  /**
   * Initialize data from cache or fetch new data
   */
  useEffect(() => {
    if (cache.keywords) {
      console.log('Using cached topic data');
      setTopicData(cache.keywords);
      setLoading(false);
    } else {
      fetchAndProcessTopics();
    }
  }, [cache.keywords]);

  /**
   * Update filtered and sorted topics when search term or sort option changes
   */
  useEffect(() => {
    let filtered = topicData;
    
    if (searchTerm) {
      // Check if this search is cached
      const cachedResults = getSearchFromCache('keywords', searchTerm);
      
      if (cachedResults) {
        console.log('Using cached topic search results');
        filtered = cachedResults;
      } else {
        // Filter topics based on search term
        filtered = topicData.filter(item => 
          item.keyword.toLowerCase().includes(searchTerm.toLowerCase())
        );
        
        // Cache the search results
        addSearchToCache('keywords', searchTerm, filtered);
      }
    }

    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'alphabetical':
          return a.keyword.localeCompare(b.keyword);
        case 'clipCount':
          return b.count - a.count;
        case 'interviewCount':
          return b.interviewCount - a.interviewCount;
        default:
          return a.keyword.localeCompare(b.keyword);
      }
    });

    setFilteredTopics(sorted);
  }, [searchTerm, topicData, sortBy]);

  /**
   * Fetches and processes topics from all interviews
   * 
   * This function:
   * 1. Aggregates keywords from all interview segments
   * 2. Counts occurrences, interviews, and collects associated clips
   * 3. Calculates total duration for each keyword
   * 4. Filters out keywords with only one occurrence
   * 
   * @returns {Promise<void>}
   */
  const fetchAndProcessTopics = async () => {
    try {
      setLoading(true);
      const keywordCounts = {};
      const interviewsSnapshot = await getDocs(collection(db, "interviewSummaries"));

      // Process interviews
      for (const interviewDoc of interviewsSnapshot.docs) {
        const interviewId = interviewDoc.id;
        const interviewData = interviewDoc.data();
        const subSummariesRef = collection(db, "interviewSummaries", interviewId, "subSummaries");
        const subSummariesSnapshot = await getDocs(subSummariesRef);

        subSummariesSnapshot.forEach((doc) => {
          const subSummary = doc.data();
          if (subSummary.keywords) {
            const keywords = subSummary.keywords.split(",").map(kw => kw.trim().toLowerCase());
            keywords.forEach(keyword => {
              if (!keywordCounts[keyword]) {
                keywordCounts[keyword] = { 
                  count: 0, 
                  summaries: [], 
                  interviewIds: new Set() 
                };
              }
              keywordCounts[keyword].count++;
              keywordCounts[keyword].interviewIds.add(interviewId);
              
              // Add parent interview data for thumbnails and person name
              const enrichedSummary = {
                ...subSummary,
                id: doc.id,
                documentName: interviewId,
                videoEmbedLink: interviewData.videoEmbedLink,
                personName: interviewData.name || "Unknown",
                thumbnailUrl: interviewData.videoEmbedLink ? 
                  `https://img.youtube.com/vi/${extractVideoId(interviewData.videoEmbedLink)}/mqdefault.jpg` : 
                  null
              };
              
              keywordCounts[keyword].summaries.push(enrichedSummary);
            });
          }
        });
      }

      // Transform data for display and filter out keywords with only 1 clip
      const processedData = Object.entries(keywordCounts)
        .filter(([_, details]) => details.count > 1)
        .map(([keyword, details]) => {
          let totalLengthSeconds = 0;
          details.summaries.forEach(subSummary => {
            if (subSummary.timestamp && subSummary.timestamp.includes(" - ")) {
              const start = extractStartTimestamp(subSummary.timestamp);
              const end = extractStartTimestamp(subSummary.timestamp.split(" - ")[1]);
              totalLengthSeconds += Math.max(0, convertTimestampToSeconds(end) - convertTimestampToSeconds(start));
            }
          });
          
          return {
            keyword,
            count: details.count,
            interviewCount: details.interviewIds.size,
            totalLengthSeconds,
            summaries: details.summaries
          };
        });

      setTopicData(processedData);
      setFilteredTopics(processedData);
      
      // Store in cache
      updateCache('keywords', processedData);
      
      setLoading(false);
    } catch (error) {
      console.error("Error fetching topics:", error);
      setError("Failed to load topic data");
      setLoading(false);
    }
  };

  /**
   * Extracts YouTube video ID from various URL formats
   */
  const extractVideoId = (videoEmbedLink) => {
    if (!videoEmbedLink) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
    const match = videoEmbedLink.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  /**
   * Extracts timestamp from formatted string, handling brackets
   */
  const extractStartTimestamp = (rawTimestamp) => {
    const match = rawTimestamp.match(/(?:\[)?(\d{1,2}:\d{2}(?::\d{2})?)/);
    return match ? match[1] : "00:00";
  };

  /**
   * Converts a timestamp string to seconds
   */
  const convertTimestampToSeconds = (timestamp) => {
    const parts = timestamp.split(":").map(Number);
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return 0;
  };

  /**
   * Handles topic card click to view all clips
   */
  const handleTopicClick = (keyword) => {
    if (onViewAllClips) {
      onViewAllClips(keyword);
    }
  };

  /**
   * Formats seconds as hours and minutes
   */
  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else {
      return `${minutes}m`;
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-200 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-black/20 rounded-full animate-spin" style={{
          borderTopColor: '#F2483C'
        }}></div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-200 flex justify-center items-center">
        <div className="bg-white border border-black text-black px-6 py-4" style={{
          fontFamily: 'Freight Text Pro, serif'
        }}>
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-200">
      {/* Header Section */}
      <div className="px-12 pt-9 pb-6">
        {/* Logo/Title */}
        <div className="mb-8">
          <div className="text-stone-900 text-4xl font-normal" style={{ fontFamily: 'Freight Text Pro, serif' }}>
            Civil Rights <br />
            <span className="font-black leading-9">History Project</span>
          </div>
        </div>

        {/* Topic count */}
        <div className="mb-4">
          <span className="text-civil-red-body text-xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
            {filteredTopics.length} Keywords
          </span>
        </div>

        {/* Main heading */}
        <div className="mb-6">
          <h1 className="text-stone-900 text-8xl font-medium" style={{ fontFamily: 'Acumin Pro, sans-serif' }}>
            Topic Glossary
          </h1>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-black mb-6"></div>

        {/* Controls Row */}
        <div className="flex justify-between items-center mb-8">
          {/* Filter Section */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex flex-col justify-center">
                <div className="w-9 h-0.5 bg-black mb-1.5"></div>
                <div className="w-9 h-0.5 bg-black mb-1.5"></div>
                <div className="w-9 h-0.5 bg-black"></div>
              </div>
              <span className="text-stone-900 text-xl font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                Filter
              </span>
            </div>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search topics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-black bg-white text-base font-light"
              style={{ fontFamily: 'Chivo Mono, monospace' }}
            />
          </div>

          {/* Sort and View Map */}
          <div className="flex items-center gap-4">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="text-stone-900 text-xl font-light bg-transparent border-none"
              style={{ fontFamily: 'Chivo Mono, monospace' }}
            >
              <option value="alphabetical">Sort by: A-Z</option>
              <option value="clipCount">Sort by: Most Clips</option>
              <option value="interviewCount">Sort by: Most Interviews</option>
            </select>
            
            <button className="px-6 py-3 rounded-full border border-black">
              <span className="text-black text-base font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
                View Map
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Topics Grid */}
      <div className="px-12 pb-12">
        {filteredTopics.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-stone-900 text-base font-light" style={{ fontFamily: 'Chivo Mono, monospace' }}>
              No topics found matching your search.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredTopics.map((topic) => (
              <div 
                key={topic.keyword}
                className="w-full h-72 border border-black bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => handleTopicClick(topic.keyword)}
              >
                {/* Topic Title - Centered */}
                <div className="h-full flex flex-col justify-center items-center text-center px-6">
                  <h3 className="text-stone-900 text-6xl font-black mb-8 capitalize" style={{ 
                    fontFamily: 'Freight Text Pro, serif'
                  }}>
                    {topic.keyword}
                  </h3>
                  
                  {/* Statistics */}
                  <div className="text-center">
                    <span className="text-stone-900 text-base font-light" style={{ 
                      fontFamily: 'Chivo Mono, monospace' 
                    }}>
                      {topic.interviewCount} Interview{topic.interviewCount !== 1 ? 's' : ''}, {formatDuration(topic.totalLengthSeconds)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}