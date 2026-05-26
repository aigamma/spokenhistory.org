/**
 * @fileoverview Optimized service for playlist-related data fetching with caching
 * 
 * This service provides optimized methods for fetching keyword-based video data
 * with intelligent caching, progressive loading, and minimal Firestore operations.
 */

import { collection, getDocs } from "firebase/firestore";
import { db } from "./firebase";
import { parseKeywords, extractVideoId } from "../utils/timeUtils";
import { getActiveCollection, mapInterviewData, mapSubSummaryData } from "./collectionMapper";

// In-memory cache for performance
let keywordIndex = null;
let keywordCounts = null;
let allSegments = null;
let cacheTimestamp = null;

// Cache duration: 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;

/**
 * Check if cached data is still valid
 */
const isCacheValid = () => {
  return cacheTimestamp && (Date.now() - cacheTimestamp) < CACHE_DURATION;
};

/**
 * Build comprehensive keyword index from all interviews
 * This runs once and caches results for fast subsequent lookups
 */
const buildKeywordIndex = async () => {
  if (isCacheValid() && keywordIndex && keywordCounts && allSegments) {
    console.log('Using cached keyword index');
    return {
      keywordIndex,
      keywordCounts,
      allSegments
    };
  }

  console.log('Building fresh keyword index...');
  const startTime = Date.now();

  try {
    const tempKeywordIndex = {};
    const tempKeywordCounts = {};
    const tempAllSegments = [];

    const activeCollection = getActiveCollection();
    const interviewsSnapshot = await getDocs(collection(db, activeCollection));

    // Process all interviews in parallel where possible
    const processPromises = [];

    for (const interviewDoc of interviewsSnapshot.docs) {
      const processInterview = async () => {
        const interviewId = interviewDoc.id;
        const rawInterviewData = interviewDoc.data();
        
        // Map interview data using collection mapper
        const interviewData = mapInterviewData(rawInterviewData, activeCollection);

        // Get thumbnail URL once per interview.
        //
        // Preference order:
        //   1. interviewData.poster_url (LoC-served poster, set by our
        //      pipeline-to-firestore push when LoC video data is merged)
        //   2. YouTube thumbnail derived from videoEmbedLink (legacy
        //      data path; only works for YouTube embed URLs)
        //   3. null (no thumbnail available; UI falls back to placeholder)
        const parentVideoEmbedLink = interviewData.videoEmbedLink;
        let thumbnailUrl = interviewData.poster_url || null;
        if (!thumbnailUrl && parentVideoEmbedLink) {
          const ytId = extractVideoId(parentVideoEmbedLink);
          if (ytId) {
            thumbnailUrl = `https://img.youtube.com/vi/${ytId}/mqdefault.jpg`;
          }
        }

        const subSummariesRef = collection(db, activeCollection, interviewId, "subSummaries");
        const querySnapshot = await getDocs(subSummariesRef);

        querySnapshot.forEach((docSnapshot) => {
          const rawSubSummary = docSnapshot.data();
          
          // Map subsummary data using collection mapper
          const subSummary = mapSubSummaryData(rawSubSummary, activeCollection);
          
          // Handle keywords - metadataV2 uses arrays, interviewSummaries uses comma-separated strings
          let documentKeywords = [];
          if (activeCollection === 'metadataV2') {
            // In metadataV2, keywords are already an array
            documentKeywords = Array.isArray(rawSubSummary.keywords) 
              ? rawSubSummary.keywords.map(k => k.trim().toLowerCase())
              : [];
          } else {
            // In interviewSummaries, keywords are comma-separated strings
            documentKeywords = (subSummary.keywords || "").split(",").map(k => k.trim().toLowerCase());
          }

          // Create segment object
          const segment = {
            id: docSnapshot.id,
            documentName: interviewId,
            ...subSummary,
            ...interviewData,
            thumbnailUrl,
            keywords: documentKeywords
          };

          tempAllSegments.push(segment);

          // Index by keywords
          documentKeywords.forEach(keyword => {
            if (keyword) {
              // Count occurrences
              tempKeywordCounts[keyword] = (tempKeywordCounts[keyword] || 0) + 1;

              // Index segments by keyword
              if (!tempKeywordIndex[keyword]) {
                tempKeywordIndex[keyword] = [];
              }
              tempKeywordIndex[keyword].push(segment);
            }
          });
        });
      };

      processPromises.push(processInterview());
    }

    // Wait for all interviews to be processed
    await Promise.all(processPromises);

    // Cache results
    keywordIndex = tempKeywordIndex;
    keywordCounts = tempKeywordCounts;
    allSegments = tempAllSegments;
    cacheTimestamp = Date.now();

    const endTime = Date.now();
    console.log(`Keyword index built in ${endTime - startTime}ms`);
    console.log(`Indexed ${Object.keys(keywordIndex).length} keywords across ${allSegments.length} segments`);

    return {
      keywordIndex,
      keywordCounts,
      allSegments
    };
  } catch (error) {
    console.error('Error building keyword index:', error);
    throw error;
  }
};

/**
 * Get segments for specific keywords (fast lookup using index).
 *
 * Matching strategy, in priority order:
 *   1. Exact match against the keyword index (fast hash lookup)
 *   2. Substring match across all indexed keyword phrases
 *      — needed because our subagent-generated chapter keywords
 *        are phrases like "Montgomery Bus Boycott" or "Selma to
 *        Montgomery March", which don't exact-match the home-page
 *        timeline's simple "montgomery" anchor. Substring catches them.
 *   3. Substring match against chapter title + topic
 *      — catches chapters where the keyword wasn't tagged as such but
 *        the chapter is clearly about it (e.g. a chapter titled
 *        "Marching on Montgomery").
 */
export const getSegmentsForKeywords = async (keywords) => {
  const { keywordIndex, allSegments } = await buildKeywordIndex();

  const keywordsArray = Array.isArray(keywords) ? keywords : parseKeywords(keywords);
  const matchingSegments = new Set();

  keywordsArray.forEach(keyword => {
    const keywordLower = keyword.toLowerCase().trim();
    if (!keywordLower) return;

    // 1. Exact match
    const exact = keywordIndex[keywordLower] || [];
    exact.forEach(segment => matchingSegments.add(segment));

    // 2. Substring match across indexed keyword phrases
    if (exact.length === 0) {
      Object.keys(keywordIndex).forEach(indexedKey => {
        if (indexedKey.includes(keywordLower)) {
          keywordIndex[indexedKey].forEach(segment => matchingSegments.add(segment));
        }
      });
    }
  });

  // 3. Substring fallback across chapter title + topic if still empty
  if (matchingSegments.size === 0) {
    const haystackKeywords = keywordsArray.map(k => k.toLowerCase().trim()).filter(Boolean);
    (allSegments || []).forEach(segment => {
      const blob = `${segment.title || ''} ${segment.topic || ''}`.toLowerCase();
      if (haystackKeywords.some(k => blob.includes(k))) {
        matchingSegments.add(segment);
      }
    });
  }

  return Array.from(matchingSegments);
};

/**
 * Get count of clips for specific keyword (instant lookup from cache)
 */
export const getKeywordCount = async (keyword) => {
  const { keywordCounts } = await buildKeywordIndex();
  return keywordCounts[keyword.toLowerCase()] || 0;
};

/**
 * Get all available keywords with their counts
 */
export const getAllKeywords = async () => {
  const { keywordCounts } = await buildKeywordIndex();
  return keywordCounts;
};

/**
 * Get keywords that have multiple clips (for "up next" suggestions)
 */
export const getKeywordsWithMultipleClips = async () => {
  const { keywordCounts } = await buildKeywordIndex();
  return Object.keys(keywordCounts).filter(keyword => keywordCounts[keyword] > 1);
};

/**
 * Get a random sample of segments for thumbnail/preview purposes
 */
export const getSampleSegmentsForKeyword = async (keyword, sampleSize = 3) => {
  const segments = await getSegmentsForKeywords([keyword]);
  
  if (segments.length <= sampleSize) {
    return segments;
  }

  // Return random sample
  const shuffled = segments.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, sampleSize);
};

/**
 * Audit-tier rank used to sort playlist results best-quality-first.
 * Lower number = higher confidence in the underlying transcript. Tiers
 * come from the Pass 9 LoC-verification rescore (see transcripts/
 * AUDIT_TRAIL.md). Unranked entries sort to the end.
 */
const TIER_RANK = {
  high: 0,
  medium: 1,
  low: 2,
  'publication-block': 3,
  'not-auditable': 4,
  'ingestion-only': 5,
};

/**
 * Deterministic, quality-ordered sort comparator for playlist segments.
 *   1. Audit tier (high → medium → low → others)
 *   2. Inferential uncertainty score (lower = better) within tier
 *   3. Interviewee name (alphabetical) as a tie-break — stable order
 *      across reloads is the property the legacy grad-student-curated
 *      playlist had that the random shuffle threw away.
 *   4. Chapter number within an interview (chronological).
 */
const compareSegments = (a, b) => {
  const tierA = TIER_RANK[a.uncertaintyTier ?? a.inferential_uncertainty_tier] ?? 99;
  const tierB = TIER_RANK[b.uncertaintyTier ?? b.inferential_uncertainty_tier] ?? 99;
  if (tierA !== tierB) return tierA - tierB;

  const scoreA = typeof a.uncertaintyScore === 'number' ? a.uncertaintyScore
               : typeof a.inferential_uncertainty_score === 'number' ? a.inferential_uncertainty_score
               : 1;
  const scoreB = typeof b.uncertaintyScore === 'number' ? b.uncertaintyScore
               : typeof b.inferential_uncertainty_score === 'number' ? b.inferential_uncertainty_score
               : 1;
  if (scoreA !== scoreB) return scoreA - scoreB;

  const nameA = (a.name || a.documentName || '').toLowerCase();
  const nameB = (b.name || b.documentName || '').toLowerCase();
  if (nameA !== nameB) return nameA < nameB ? -1 : 1;

  const chA = a.chapterNumber || a.chapter_number || 0;
  const chB = b.chapterNumber || b.chapter_number || 0;
  return chA - chB;
};

/**
 * Progressive loading: Get first video immediately, then rest in background.
 *
 * 2026-05-26: replaced random shuffle with deterministic quality-tier sort.
 * The legacy playlist surface was a curated grad-student artifact; we don't
 * have that curation data in the new Firebase, so the next-best signal is
 * the Pass 9 audit tier, which orders segments by transcript confidence.
 * Same query → same order across reloads, which is what the original UI
 * implicitly promised.
 */
export const getPlaylistProgressive = async (keywords, onFirstVideo, onComplete) => {
  try {
    const segments = await getSegmentsForKeywords(keywords);

    if (segments.length === 0) {
      onComplete([]);
      return;
    }

    const orderedSegments = [...segments].sort(compareSegments);

    // Return first video immediately
    onFirstVideo(orderedSegments[0], orderedSegments.length);

    // Return complete playlist
    setTimeout(() => {
      onComplete(orderedSegments);
    }, 0);

  } catch (error) {
    console.error('Error in progressive loading:', error);
    onComplete([]);
  }
};

/**
 * Get related keywords based on content similarity
 */
export const getRelatedKeywords = async (currentKeyword, limit = 5) => {
  const { keywordIndex, keywordCounts } = await buildKeywordIndex();
  
  const currentSegments = keywordIndex[currentKeyword.toLowerCase()] || [];
  if (currentSegments.length === 0) {
    return [];
  }

  // Find keywords that appear in the same segments
  const relatedKeywordScores = {};
  
  currentSegments.forEach(segment => {
    segment.keywords.forEach(keyword => {
      if (keyword !== currentKeyword.toLowerCase() && keywordCounts[keyword] > 1) {
        relatedKeywordScores[keyword] = (relatedKeywordScores[keyword] || 0) + 1;
      }
    });
  });

  // Sort by co-occurrence frequency and return top results
  return Object.entries(relatedKeywordScores)
    .sort(([,a], [,b]) => b - a)
    .slice(0, limit)
    .map(([keyword]) => keyword);
};

/**
 * Clear cache (useful for testing or forced refresh)
 */
export const clearCache = () => {
  keywordIndex = null;
  keywordCounts = null;
  allSegments = null;
  cacheTimestamp = null;
  console.log('Playlist service cache cleared');
};

/**
 * Preload common keywords (can be called on app startup)
 */
export const preloadKeywords = async (commonKeywords = []) => {
  console.log('Preloading keyword index...');
  await buildKeywordIndex();
  
  // Optionally preload specific keyword data
  for (const keyword of commonKeywords) {
    await getSegmentsForKeywords([keyword]);
  }
  
  console.log('Preload complete');
};
