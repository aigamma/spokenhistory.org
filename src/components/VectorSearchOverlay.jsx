import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search as SearchIcon, X } from 'lucide-react';
import { searchClipsByTopic } from '../services/embeddings';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../services/firebase';

/**
 * VectorSearchOverlay - Modal overlay for semantic search
 * 
 * Features:
 * - Dark backdrop overlay
 * - Red shadow effect on search box
 * - Chivo Mono font
 * - Semantic search with results
 * 
 * @param {boolean} isOpen - Whether the overlay is open
 * @param {function} onClose - Function to close the overlay
 * @returns {React.ReactElement} The search overlay modal
 */
export default function VectorSearchOverlay({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [topicDefinition, setTopicDefinition] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const [topicsCache, setTopicsCache] = useState([]);
  const navigate = useNavigate();

  // Load topics for autocomplete when overlay opens
  useEffect(() => {
    if (isOpen && topicsCache.length === 0) {
      fetchTopicsForAutocomplete();
    }
  }, [isOpen]);

  /**
   * Fetches topics from events_and_topics collection for autocomplete
   */
  const fetchTopicsForAutocomplete = async () => {
    try {
      const eventsAndTopicsCollection = collection(db, 'events_and_topics');
      const eventsSnapshot = await getDocs(eventsAndTopicsCollection);
      
      const topics = eventsSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          keyword: data.eventTopic || doc.id,
          description: data.description || data.updatedLongDescription || '',
          category: data.aiCuration?.category || 'other',
          importanceScore: data.aiCuration?.importanceScore || 5
        };
      });

      // Sort by importance score, then alphabetically
      topics.sort((a, b) => {
        if (b.importanceScore !== a.importanceScore) {
          return b.importanceScore - a.importanceScore;
        }
        return a.keyword.localeCompare(b.keyword);
      });

      setTopicsCache(topics);
    } catch (error) {
      console.error("Error fetching topics for autocomplete:", error);
    }
  };

  /**
   * Filters topics based on search query and returns suggestions
   */
  const getSuggestions = (query) => {
    if (!query.trim() || topicsCache.length === 0) {
      return [];
    }

    const lowerQuery = query.toLowerCase();
    return topicsCache
      .filter(topic => 
        topic.keyword.toLowerCase().includes(lowerQuery)
      )
      .slice(0, 8); // Limit to 8 suggestions
  };

  /**
   * Handles input change and updates suggestions
   */
  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim()) {
      const newSuggestions = getSuggestions(value);
      setSuggestions(newSuggestions);
      setShowSuggestions(newSuggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }
  };

  /**
   * Handles keyboard navigation in autocomplete
   */
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          selectSuggestion(suggestions[selectedSuggestionIndex]);
        } else {
          handleSearch(e);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        break;
    }
  };

  /**
   * Handles suggestion selection
   */
  const selectSuggestion = (suggestion) => {
    setSearchQuery(suggestion.keyword);
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    // Trigger search with the selected suggestion
    setTimeout(() => {
      handleSearch({ preventDefault: () => {} });
    }, 100);
  };

  // Animation and close handling
  useEffect(() => {
    if (isOpen) {
      // Prevent layout shift by preserving scrollbar space
      const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.overflow = 'hidden';
      document.body.style.paddingRight = `${scrollbarWidth}px`;
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
      // Restore original styles after animation
      setTimeout(() => {
        document.body.style.overflow = 'unset';
        document.body.style.paddingRight = '0px';
      }, 300);
    }
  }, [isOpen]);

  // Close on Escape key and handle clicks outside suggestions
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        if (showSuggestions) {
          setShowSuggestions(false);
          setSelectedSuggestionIndex(-1);
        } else {
          handleClose();
        }
      }
    };

    const handleClickOutside = (e) => {
      // Close suggestions if clicking outside the search area
      if (showSuggestions && !e.target.closest('.search-container')) {
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, showSuggestions]);

  const handleClose = () => {
    setIsAnimating(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match the transition duration
  };

  /**
   * Extracts YouTube video ID from various YouTube URL formats
   * 
   * @param {string} videoEmbedLink - YouTube URL
   * @returns {string|null} YouTube video ID or null if not valid
   */
  const extractVideoId = (videoEmbedLink) => {
    if (!videoEmbedLink) return null;
    
    const regExp = /^.*(youtu.be\/|v\/|e\/|u\/\w+\/|embed\/|v=)([^#&?]*).*/;
    const match = videoEmbedLink.match(regExp);
    
    return (match && match[2].length === 11) ? match[2] : null;
  };

  /**
   * Fetches topic definition from events_and_topics collection
   * 
   * @param {string} topicName - The topic to search for
   * @returns {Promise<string>} Topic definition or fallback text
   */
  const fetchTopicDefinition = async (topicName) => {
    try {
      const eventsAndTopicsRef = collection(db, 'events_and_topics');
      
      // Try exact match first (case-insensitive)
      const exactQuery = query(eventsAndTopicsRef, where('eventTopic', '==', topicName));
      let snapshot = await getDocs(exactQuery);
      
      if (snapshot.empty) {
        // Try case-insensitive search by converting to lowercase
        const allDocsSnapshot = await getDocs(eventsAndTopicsRef);
        const matchingDoc = allDocsSnapshot.docs.find(doc => {
          const data = doc.data();
          const eventTopic = data.eventTopic || doc.id;
          return eventTopic.toLowerCase() === topicName.toLowerCase();
        });
        
        if (matchingDoc) {
          const data = matchingDoc.data();
          return data.description || data.updatedLongDescription || 
            `${topicName} is a significant topic in the Civil Rights Movement. Explore interviews and stories from activists who experienced and shaped this important aspect of history.`;
        }
      } else {
        const doc = snapshot.docs[0];
        const data = doc.data();
        return data.description || data.updatedLongDescription || 
          `${topicName} is a significant topic in the Civil Rights Movement. Explore interviews and stories from activists who experienced and shaped this important aspect of history.`;
      }
      
      // Fallback if no match found
      return `${topicName} is a significant topic in the Civil Rights Movement. Explore interviews and stories from activists who experienced and shaped this important aspect of history.`;
      
    } catch (error) {
      console.error('Error fetching topic definition:', error);
      return `${topicName} is a significant topic in the Civil Rights Movement. Explore interviews and stories from activists who experienced and shaped this important aspect of history.`;
    }
  };

  /**
   * Handles semantic search form submission using enhanced clip search
   */
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setTopicDefinition(''); // Clear previous definition
    try {
      // Fetch topic definition and search results in parallel
      const [clipResults, definition] = await Promise.all([
        searchClipsByTopic(searchQuery, { limit: 20 }),
        fetchTopicDefinition(searchQuery)
      ]);
      
      // Set the topic definition
      setTopicDefinition(definition);
      
      // Transform results to match expected format for display
      const enhancedResults = clipResults.map((clip) => {
        // Generate thumbnail URL from video embed link if available
        let thumbnailUrl = clip.thumbnailUrl;
        if (!thumbnailUrl && clip.videoEmbedLink) {
          const videoId = extractVideoId(clip.videoEmbedLink);
          thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : null;
          console.log(`Generated thumbnail for ${clip.interviewName}:`, thumbnailUrl);
        } else if (clip.videoEmbedLink) {
          console.log(`Video link available for ${clip.interviewName}:`, clip.videoEmbedLink);
        } else {
          console.log(`No video link for ${clip.interviewName}`);
        }
        
        return {
          id: clip.id || `${clip.documentId}-${clip.segmentId}`,
          documentId: clip.documentId,
          segmentId: clip.segmentId,
          personName: clip.interviewName,
          clipTitle: clip.topic || clip.displayTitle || 'Untitled Segment', // Use clip topic as title
          timestamp: clip.timestamp,
          summary: clip.textPreview || clip.summary,
          keywords: clip.keywordsArray ? clip.keywordsArray.join(', ') : '',
          similarity: clip.topicRelevance || clip.similarity,
          thumbnailUrl,
          
          // Enhanced metadata from our new system
          role: clip.interviewRole,
          mainTopicCategory: clip.mainTopicCategory,
          relatedEvents: clip.relatedEvents || [],
          notableQuotes: clip.notableQuotes || [],
          hasQuotes: clip.hasQuotes,
          hasEvents: clip.hasEvents
        };
      });

      // Remove duplicates based on documentId + segmentId combination
      const uniqueResults = enhancedResults.filter((result, index, self) => 
        index === self.findIndex(r => 
          r.documentId === result.documentId && r.segmentId === result.segmentId
        )
      );
      
      setResults(uniqueResults);
    } catch (error) {
      console.error("Error during enhanced clip search:", error);
    } finally {
      setIsSearching(false);
    }
  };

  /**
   * Navigates to the clip player for a specific result
   */
  const navigateToClip = (documentName, clipId) => {
    navigate(`/clip-player?documentName=${encodeURIComponent(documentName)}&clipId=${encodeURIComponent(clipId)}`);
    handleClose();
  };

  // Don't render if not open
  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ease-out ${
        isAnimating ? 'opacity-100' : 'opacity-0'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Search"
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 transition-all duration-300 ease-out ${
          isAnimating 
            ? 'backdrop-blur-sm backdrop-brightness-75 opacity-100' 
            : 'backdrop-blur-none backdrop-brightness-100 opacity-0'
        }`}
        onClick={handleClose}
      />
      
      {/* Main overlay content */}
      <div className={`w-full h-full relative overflow-hidden transition-all duration-500 ease-out ${
        isAnimating ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4'
      }`} style={{ backgroundColor: '#EBEAE9' }}>
        
        {/* Conditional Header - Standard header when results are loaded */}
        {(isSearching || results.length > 0) ? (
          /* Standard Universal Header */
          <header className="relative" style={{ backgroundColor: '#EBEAE9' }}>
            <div className="w-full px-4 sm:px-8 lg:px-12 py-6 lg:py-9">
              <div className="flex justify-between items-start">
                {/* Logo/Title.
                    Was <div onClick> -- not keyboard-accessible and not
                    announced as an interactive control. Switched to
                    real <button> with type="button", aria-label, and
                    bg/border resets so it visually matches the prior
                    <div> while being announced as "Close search and
                    return to site" to screen readers. The wordmark
                    sizing matches the site Header so dismissing the
                    overlay feels like returning home. */}
                <button
                  type="button"
                  onClick={handleClose}
                  aria-label="Close search and return to site"
                  className="cursor-pointer text-left bg-transparent border-0 p-0 min-h-11"
                >
                  <div style={{ fontFamily: 'Source Serif 4, serif' }}>
                    <span className="text-stone-900 text-3xl sm:text-4xl font-normal">Civil Rights </span>
                    <br />
                    <span className="text-stone-900 text-3xl sm:text-4xl font-bold leading-9">History Project</span>
                  </div>
                </button>

                {/* Close button in header style */}
                <button
                  onClick={handleClose}
                  aria-label="Close search"
                  className="inline-flex items-center justify-center min-w-11 min-h-11 p-1 text-black hover:opacity-70 transition-opacity"
                >
                  <X size={18} className="lg:w-6 lg:h-6" aria-hidden="true" />
                </button>
              </div>
            </div>
          </header>
        ) : (
          /* Original Large Title Layout for Empty State.
             Close button was right-12 (48px from edge) which is past
             the right edge of a 360px phone since the inner control
             starts at right=48px and is 48px wide -- pinning it
             flush against the viewport. Switched to right-4 sm:right-12
             so mobile gets a comfortable 16px gutter. */}
          <>
            {/* Close button */}
            <button
              onClick={handleClose}
              aria-label="Close search"
              className="absolute top-4 right-4 sm:top-6 sm:right-12 z-10 min-w-11 min-h-11 flex items-center justify-center hover:opacity-70 transition-opacity"
            >
              <div className="w-6 h-6 outline outline-2 outline-offset-[-1px] outline-black flex items-center justify-center" aria-hidden="true">
                <X size={24} strokeWidth={2} />
              </div>
            </button>

            {/* Large Title.
                text-6xl with leading-[66.46px] was an exact-pixel match
                for the Figma design at desktop width. On mobile, 60px
                text + 66.46px line-height pushed the title across two
                lines and overlapped the close button. Now scales
                3xl/4xl/5xl/6xl, and the absolute positioning is
                relaxed on mobile (left-4 top-4) so the title clears
                the top-right close button. */}
            <div className="absolute left-4 sm:left-12 top-16 sm:top-9 right-16 sm:right-auto">
              <div className="text-stone-900 text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal leading-tight sm:leading-none" style={{ fontFamily: 'Source Serif 4, serif' }}>
                <span className="font-normal">Civil Rights </span>
                <span className="font-bold tracking-[2.56px]">History</span>
                <span className="font-bold"> Project</span>
              </div>
            </div>
          </>
        )}

        {/* Search section - positioned differently based on header state.
            Was max-w-[1632px] absolute left-12 (and on results state
            absolute left-0 right-0 px-12). On mobile the px-12 was
            48px on each side, leaving only 264px content width on a
            360px phone, AND the absolute top:140/156px was based on
            the desktop header heights. Now: top scales 100/116 on
            mobile -> 140/156 from sm, padding scales px-4 -> px-12,
            and the absolute-left:48 becomes left-4 on mobile so the
            search bar sits 16px from each edge. */}
        <div className={`max-w-[1632px] w-full h-14 ${
          (isSearching || results.length > 0)
            ? 'absolute left-0 right-0 px-4 sm:px-6 md:px-8 lg:px-12'
            : 'absolute left-4 right-4 sm:left-12 sm:right-auto'
        }`} style={{
          top: (isSearching || results.length > 0) ? 'clamp(100px, 18vh, 140px)' : 'clamp(140px, 22vh, 156px)'
        }}>
          <form onSubmit={handleSearch} className="w-full h-full flex max-w-[1632px] search-container">
            {/* Search input */}
            <div className="flex-1 h-14 relative border-l border-t border-b border-stone-900 bg-white">
              <label htmlFor="vector-search-input" className="sr-only">Search the archive</label>
              {/* Search label - only show when input is empty */}
              {!searchQuery && (
                <div className="absolute left-4 sm:left-6 top-1/2 transform -translate-y-1/2 text-black text-lg sm:text-xl md:text-2xl font-light font-['Inter'] pointer-events-none">
                  Search
                </div>
              )}
              <input
                id="vector-search-input"
                type="text"
                value={searchQuery}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder=""
                className="w-full h-full px-4 sm:px-6 text-black text-lg sm:text-xl md:text-2xl font-light font-['Inter'] bg-transparent border-none outline-none placeholder-gray-400 flex items-center"
                style={{ lineHeight: '56px' }}
                autoFocus
                role="combobox"
                aria-expanded={showSuggestions && suggestions.length > 0}
                aria-controls="vector-search-suggestions"
                aria-autocomplete="list"
                autoCapitalize="none"
                autoCorrect="off"
              />

              {/* Autocomplete suggestions dropdown.
                  Was a <div> list with onClick + onMouseEnter on each
                  row -- not keyboard accessible (the input's
                  handleKeyDown still drives selection via arrow keys,
                  so the keyboard worked, but the touch/screen-reader
                  story was broken). Now each row is a real <button>
                  with role="option" so the input's role="combobox" +
                  aria-controls relationship is complete. */}
              {showSuggestions && suggestions.length > 0 && (
                <ul
                  id="vector-search-suggestions"
                  role="listbox"
                  aria-label="Search suggestions"
                  className="absolute top-full left-0 right-0 bg-white border-l border-r border-b border-stone-900 z-10 max-h-80 overflow-y-auto list-none m-0 p-0"
                >
                  {suggestions.map((suggestion, index) => (
                    <li key={suggestion.id} role="option" aria-selected={index === selectedSuggestionIndex}>
                      <button
                        type="button"
                        className={`w-full text-left px-4 sm:px-6 py-3 min-h-11 cursor-pointer transition-colors border-b border-gray-200 last:border-b-0 bg-transparent border-l-0 border-r-0 border-t-0 ${
                          index === selectedSuggestionIndex
                            ? 'bg-gray-100'
                            : 'hover:bg-gray-50'
                        }`}
                        onClick={() => selectSuggestion(suggestion)}
                        onMouseEnter={() => setSelectedSuggestionIndex(index)}
                      >
                        <span className="text-black text-lg sm:text-xl md:text-2xl font-light font-['Inter']">
                          {suggestion.keyword}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            
            {/* Search button */}
            <button
              type="submit"
              disabled={isSearching}
              className="w-14 h-14 p-1.5 outline outline-1 outline-offset-[-1px] outline-stone-900 inline-flex justify-center items-center bg-white hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 relative flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border-2 border-black relative">
                  <div className="w-2.5 h-0.5 bg-black absolute -bottom-1 -right-1 rotate-45 origin-left"></div>
                </div>
              </div>
            </button>
          </form>
        </div>

        {/* Topic suggestion tags.
            Was absolute left-12 top:240px -- pinned to a layout point
            that worked only at desktop width and only with the large
            title above at its desktop position. With the empty-state
            title now responsive (mobile uses smaller text + lower
            top), this row also flows with the page rather than being
            absolutely positioned. Suggestion pills converted from
            <div onClick> to real <button>s with aria-label and
            min-h-11 for tap-target compliance. */}
        {!isSearching && results.length === 0 && (
          <div className="absolute left-4 right-4 sm:left-12 sm:right-12 top-[180px] sm:top-[240px]">
            <div className="flex flex-wrap gap-3 sm:gap-4 items-center">
              {[
                'Desegregation',
                'Little Rock Nine',
                'Black Panther Party',
                'Student Nonviolent Coordinating Committee',
              ].map((suggestion) => (
                <button
                  type="button"
                  key={suggestion}
                  className="px-4 sm:px-6 py-3 min-h-11 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black inline-flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors bg-transparent"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    handleSearch({ preventDefault: () => {} });
                  }}
                  aria-label={`Search for ${suggestion}`}
                >
                  <span className="text-center text-black text-sm sm:text-base font-light font-['Chivo_Mono']">{suggestion}</span>
                </button>
              ))}
              <button
                type="button"
                className="inline-flex justify-start items-center gap-2.5 sm:ml-8 min-h-11 cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-0"
                onClick={() => navigate('/topic-glossary')}
                aria-label="Open the Topic Glossary page"
              >
                <span className="text-center text-stone-900 text-sm sm:text-base font-light font-['Chivo_Mono']">See Topic Glossary</span>
                <span className="w-3.5 h-2.5 outline outline-1 outline-offset-[-0.50px] outline-stone-900" aria-hidden="true"></span>
              </button>
            </div>
          </div>
        )}

        {/* Results section - New Figma-based layout.
            Comprehensive mobile + a11y pass: top offset was 220px
            unconditional (designed for the desktop header + search
            row); on a phone where the header takes ~150px + search
            takes ~100px, 220px is too low and the results overlap.
            Now scales 200px on mobile -> 220px from sm up. The inner
            padding drops from px-12 to px-4 sm:px-6 md:px-8 lg:px-12;
            the text-8xl titles scale 4xl -> 8xl; the 3-column grid
            stacks 1 -> 2 -> 3; the 765px-wide definition column
            becomes w-full on mobile so it stacks under the search
            term title; and every <div onClick> in this section was
            converted to a real <button>. */}
        {(isSearching || results.length > 0) && (
          <div
            className="absolute left-0 right-0 bottom-0 overflow-y-auto"
            style={{
              top: 'clamp(200px, 25vh, 220px)',
              backgroundColor: '#EBEAE9',
            }}
          >
            {isSearching ? (
              <div className="flex justify-center items-center py-12" role="status" aria-live="polite">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-black rounded-full animate-spin" aria-hidden="true"></div>
                <span className="sr-only">Searching</span>
              </div>
            ) : results.length > 0 ? (
              <div className="px-4 sm:px-6 md:px-8 lg:px-12 pb-12">
                {/* Search Term Section */}
                <div className="w-full mb-8 sm:mb-12">
                  <div className="w-full inline-flex flex-col justify-start items-start gap-4 sm:gap-6">
                    {/* Divider line and search results count.
                        Replaced the absolute-positioned line + text
                        layout with a normal-flow flex-column: the
                        count sits above a thin border-b black line.
                        The old absolute layout depended on the parent
                        being exactly h-8 (32px), and on small viewports
                        the count text wrapped to two lines and got
                        clipped by the 32px container. */}
                    <div className="w-full pb-2 border-b border-black">
                      <div className="text-red-500 text-base font-light font-['Chivo_Mono']">
                        {results.length} search results for "{searchQuery}"
                      </div>
                    </div>

                    {/* Search term title and definition.
                        Stacks vertically on mobile, side-by-side at
                        lg. Definition column drops the hardcoded
                        w-[765px] in favor of lg:w-2/5 so it shares
                        width proportionally with the title. */}
                    <div className="w-full flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6 lg:gap-12">
                      <div className="flex-1">
                        <h2 className="text-black text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium font-['Acumin_Pro']">
                          {searchQuery}
                        </h2>
                      </div>

                      <div className="w-full lg:w-2/5">
                        <p className="text-stone-900 text-xl sm:text-2xl md:text-3xl font-medium font-['FreightText_Pro']">
                          {topicDefinition || `${searchQuery} is a significant topic in the Civil Rights Movement. Explore interviews and stories from activists who experienced and shaped this important aspect of history.`}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Watch Related Interviews Button.
                    Converted from <div onClick> to real <button> with
                    aria-label, min-h-11, and content-sized hit area.
                    The chevron is now an SVG with viewBox so it
                    scales cleanly. */}
                <div className="w-full mb-8 sm:mb-12">
                  <button
                    type="button"
                    className="inline-flex justify-start items-center gap-2.5 min-h-11 mb-8 cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-0 p-0"
                    onClick={() => {
                      navigate(`/playlist-builder?keywords=${encodeURIComponent(searchQuery)}`);
                      handleClose();
                    }}
                    aria-label={`Watch related interviews for ${searchQuery}`}
                  >
                    <span className="text-stone-900 text-lg sm:text-xl font-light font-['Chivo_Mono']">
                      Watch Related Interviews
                    </span>
                    <svg className="w-4 h-3" viewBox="0 0 16 12" fill="none" aria-hidden="true">
                      <path d="M0 6h14M9 1l5 5-5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-stone-900" />
                    </svg>
                  </button>
                </div>

                {/* Interviews Section. text-8xl section header scales
                    4xl -> 8xl; grid is 1 -> 2 -> 3 columns. */}
                <div className="w-full mb-8 sm:mb-12">
                  <div className="w-full inline-flex flex-col justify-start items-start gap-4 sm:gap-6">
                    <div className="w-full pb-2 border-b border-black" />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium font-['Acumin_Pro']">
                      <span className="text-red-500">
                        {results.length.toString().padStart(2, '0')}
                      </span>
                      <span className="text-black"> Interviews</span>
                    </h2>
                  </div>

                  {/* Interview grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 mt-8 sm:mt-12">
                    {results.map((result) => (
                      <button
                        type="button"
                        key={result.id}
                        className="group cursor-pointer hover:opacity-90 transition-opacity duration-200 bg-transparent border-0 p-0 text-left"
                        onClick={() => navigateToClip(result.documentId, result.segmentId)}
                        aria-label={`Watch clip with ${result.personName || 'unknown speaker'}: ${result.clipTitle || 'untitled segment'}`}
                      >
                        <div className="flex flex-col gap-4">
                          <div className="w-full aspect-[4/3] bg-zinc-300 relative overflow-hidden">
                            {result.thumbnailUrl ? (
                              <img
                                src={result.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-300 to-gray-400">
                                <svg className="h-16 w-16 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                              </div>
                            )}
                          </div>

                          <div className="flex flex-col gap-2">
                            <h3 className="text-stone-900 text-xl sm:text-2xl font-bold leading-tight" style={{ fontFamily: 'Source Serif 4, serif' }}>
                              {result.personName || "Unknown Speaker"}
                            </h3>
                            <p className="text-stone-900 text-sm font-light font-['Chivo_Mono'] leading-relaxed">
                              {result.clipTitle || "Untitled Segment"} | {result.timestamp || "Duration Unknown"}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Related Topics Section.
                    Same scaling as Interviews. Tag-cloud pills now
                    <button>s with aria-label. */}
                <div className="w-full">
                  <div className="w-full inline-flex flex-col justify-start items-start gap-4 sm:gap-6">
                    <div className="w-full pb-2 border-b border-black" />
                    <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-medium font-['Acumin_Pro']">
                      <span className="text-red-500">
                        {Math.min(21, Array.from(new Set([
                          ...results.flatMap(result =>
                            result.keywords ? result.keywords.split(",").map(kw => kw.trim()) : []
                          ),
                          ...results.flatMap(result => result.relatedEvents || []),
                          ...results.map(result => result.mainTopicCategory).filter(Boolean)
                        ])).length).toString().padStart(2, '0')}
                      </span>
                      <span className="text-black"> Related Topics</span>
                    </h2>
                  </div>

                  <div className="w-full mt-6 sm:mt-8">
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {Array.from(new Set([
                        ...results.flatMap(result =>
                          result.keywords ? result.keywords.split(",").map(kw => kw.trim()) : []
                        ),
                        ...results.flatMap(result => result.relatedEvents || []),
                        ...results.map(result => result.mainTopicCategory).filter(Boolean)
                      ])).slice(0, 21).map((keyword, i) => (
                        <button
                          type="button"
                          key={i}
                          className="px-4 sm:px-6 py-3 min-h-11 rounded-[50px] outline outline-1 outline-offset-[-1px] outline-black inline-flex justify-center items-center bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSearchQuery(keyword);
                            handleSearch({ preventDefault: () => {} });
                          }}
                          aria-label={`Search for ${keyword}`}
                        >
                          <span className="text-center text-black text-sm sm:text-base font-light font-['Chivo_Mono']">
                            {keyword}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
} 