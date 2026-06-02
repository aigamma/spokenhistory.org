/**
 * @fileoverview The Collection > Theme > Playlist taxonomy for the Civil Rights
 * History Project archive. Single source of truth for:
 *   - the nested, book-style Table of Contents (src/pages/TopicGlossary.jsx)
 *   - the Related Playlists logic on the playlist page (src/pages/StaticPlaylist.jsx)
 *
 * The hierarchy, top to bottom, is the vocabulary the UI standardizes on so a
 * visitor always knows which object they are looking at:
 *   Collection   the whole archive (there is one: the Civil Rights History Project)
 *   Theme        a broad section of the book (for example "Education")
 *   Playlist     a specific subtopic that resolves to a set of clips
 *   Video Clip   one time-anchored segment inside a playlist
 *
 * Each Playlist carries a `query` the static playlist page understands:
 *   { topic: '<topic_category>' }   exact topic_category match (a curated bucket)
 *   { keywords: '<terms>' }         substring search across the clip text fields
 * Every query below was checked against public/rag/playlist_index.json so it
 * resolves to a non-empty playlist. Blurbs are archive-grounded and factual,
 * with no evaluative adjectives, per the project narration discipline.
 *
 * Dustin's three themes (Movement Building and Organizing; Violence and State
 * Repression; Education) lead the book in his order. The three themes after
 * them extend coverage across the rest of the corpus.
 */

export const COLLECTION_NAME = 'Civil Rights History Project';

export const THEMES = [
  {
    id: 'movement-building',
    name: 'Movement Building and Organizing',
    blurb:
      'How the movement was built: its set-piece campaigns, the local people who organized them, and the students who pushed it forward.',
    playlists: [
      {
        id: 'major-campaigns',
        name: 'Major Campaigns',
        query: { topic: 'Major Campaign' },
        blurb:
          'The campaigns that anchor the national story, Montgomery, Birmingham, Selma, and Freedom Summer, recalled by people who were inside them.',
      },
      {
        id: 'grassroots-organizing',
        name: 'Grassroots Organizing',
        query: { keywords: 'organizing' },
        blurb:
          'County-by-county organizing and the local movement structures the national narrative often leaves out.',
      },
      {
        id: 'student-activism',
        name: 'Student Activism',
        query: { keywords: 'student' },
        blurb:
          'Students and young people carrying sit-ins, marches, and voter drives.',
      },
    ],
  },
  {
    id: 'violence-and-state-repression',
    name: 'Violence and State Repression',
    blurb:
      'The force the movement met: police violence, mass arrest, and the surveillance and intimidation directed at activists and their families.',
    playlists: [
      {
        id: 'police-violence',
        name: 'Police Violence',
        query: { keywords: 'police' },
        blurb: 'First-hand accounts of encounters with police force.',
      },
      {
        id: 'arrest-and-imprisonment',
        name: 'Arrest and Imprisonment',
        query: { keywords: 'jail' },
        blurb: 'Arrest, jail, and imprisonment as a recurring cost of the work.',
      },
      {
        id: 'intimidation-and-surveillance',
        name: 'Intimidation and Surveillance',
        query: { keywords: 'intimidation' },
        blurb:
          'Threats, harassment, and surveillance aimed at organizers and the people around them.',
      },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    blurb:
      'The schoolhouse as a site of the movement: desegregation, what students lived through, and the unequal schooling that drove the fight.',
    playlists: [
      {
        id: 'school-desegregation',
        name: 'School Desegregation',
        query: { keywords: 'desegregation' },
        blurb: 'Desegregating schools and the students who walked in first.',
      },
      {
        id: 'student-experiences',
        name: 'Student Experiences',
        query: { keywords: 'school' },
        blurb: 'Daily life inside segregated and desegregating schools.',
      },
      {
        id: 'educational-inequality',
        name: 'Educational Inequality',
        query: { topic: 'Education' },
        blurb: 'Unequal schooling and the long fight for an equal education.',
      },
    ],
  },
  {
    id: 'family-faith-culture',
    name: 'Family, Faith, and Culture',
    blurb:
      'The ground the movement grew from: households and kin, the church, and the music that carried it.',
    playlists: [
      {
        id: 'family-and-community',
        name: 'Family and Community',
        query: { keywords: 'family' },
        blurb: 'Households, kin networks, and neighborhoods that shaped interviewees.',
      },
      {
        id: 'faith-and-the-church',
        name: 'Faith and the Church',
        query: { keywords: 'church' },
        blurb: 'Churches, faith, and clergy sustaining the movement.',
      },
      {
        id: 'music-and-culture',
        name: 'Music and Culture',
        query: { topic: 'Music & Culture' },
        blurb: 'Freedom songs and cultural expression within the movement.',
      },
    ],
  },
  {
    id: 'growing-up-and-memory',
    name: 'Growing Up and Generational Memory',
    blurb:
      'Childhood under Jim Crow, the memory of Emmett Till, and coming of age inside the movement.',
    playlists: [
      {
        id: 'growing-up-under-jim-crow',
        name: 'Growing Up Under Jim Crow',
        query: { keywords: 'segregation' },
        blurb: 'Childhood and daily life under legal segregation.',
      },
      {
        id: 'emmett-till-and-memory',
        name: 'Emmett Till and Generational Memory',
        query: { keywords: 'emmett till' },
        blurb: 'How the 1955 murder of Emmett Till is remembered across the interviews.',
      },
      {
        id: 'coming-of-age',
        name: 'Coming of Age in the Movement',
        query: { keywords: 'childhood' },
        blurb: 'Interviewees who grew up inside the movement and came of age within it.',
      },
    ],
  },
  {
    id: 'voting-and-political-power',
    name: 'Voting and Political Power',
    blurb:
      'The drive for the ballot: voter registration, the politics of the movement, and the service that fed its consciousness.',
    playlists: [
      {
        id: 'voter-registration',
        name: 'Voter Registration',
        query: { keywords: 'voter registration' },
        blurb: 'Registering Black voters, county by county.',
      },
      {
        id: 'movement-politics',
        name: 'Movement Politics',
        query: { topic: 'Political Analysis' },
        blurb: 'How interviewees read the politics of the movement and its aftermath.',
      },
      {
        id: 'military-service',
        name: 'Military Service',
        query: { keywords: 'military' },
        blurb: 'Military service and its ties to civil-rights consciousness and organizing.',
      },
    ],
  },
];

/**
 * Build the in-app href for a playlist node. The static playlist page reads
 * ?topic / ?keywords / ?label, so this carries the query plus the display
 * label (so the playlist page can title itself and situate itself in the book).
 */
export function playlistHref(playlist) {
  const params = new URLSearchParams();
  if (playlist.query?.topic) params.set('topic', playlist.query.topic);
  if (playlist.query?.keywords) params.set('keywords', playlist.query.keywords);
  if (playlist.name) params.set('label', playlist.name);
  return `/playlist-builder?${params.toString()}`;
}

/** Flatten the taxonomy to a list of { theme, playlist } pairs. */
export function allPlaylists() {
  const out = [];
  for (const theme of THEMES) {
    for (const playlist of theme.playlists) out.push({ theme, playlist });
  }
  return out;
}

/**
 * Find the taxonomy node that matches a current playlist view. Matches by the
 * display label first (the Table of Contents always passes &label=, so it is
 * the most reliable key), then falls back to the query (topic or keywords).
 * Returns { theme, playlist } or null when the view is not a taxonomy playlist
 * (for example a cluster-derived ?entries= playlist).
 */
export function findPlaylist({ label, topic, keywords } = {}) {
  const norm = (s) => (s || '').trim().toLowerCase();
  const L = norm(label);
  const T = norm(topic);
  const K = norm(keywords);
  if (L) {
    for (const theme of THEMES) {
      for (const playlist of theme.playlists) {
        if (norm(playlist.name) === L) return { theme, playlist };
      }
    }
  }
  if (T || K) {
    for (const theme of THEMES) {
      for (const playlist of theme.playlists) {
        const q = playlist.query || {};
        if (T && norm(q.topic) === T) return { theme, playlist };
        if (K && norm(q.keywords) === K) return { theme, playlist };
      }
    }
  }
  return null;
}

/**
 * Related Playlists for a current playlist view: two closely related (siblings
 * in the same theme) plus one unexpected but relevant (the lead playlist of a
 * different theme). Deterministic, so the same playlist always yields the same
 * recommendations. Each returned playlist carries its parent themeName.
 * Returns { close: Playlist[], surprise: Playlist|null } or null when the
 * current view is not a taxonomy playlist.
 */
export function relatedPlaylists(current) {
  const match = findPlaylist(current);
  if (!match) return null;
  const { theme, playlist } = match;
  const withTheme = (p, t) => ({ ...p, themeId: t.id, themeName: t.name });

  const siblings = theme.playlists.filter((p) => p.id !== playlist.id);
  const close = siblings.slice(0, 2).map((p) => withTheme(p, theme));

  // Surprise: walk to the next theme (cyclic) and take its first playlist, so
  // the recommendation always crosses into a different section of the book.
  const ti = THEMES.findIndex((t) => t.id === theme.id);
  let surprise = null;
  for (let step = 1; step < THEMES.length; step++) {
    const other = THEMES[(ti + step) % THEMES.length];
    if (other.id === theme.id) continue;
    if (other.playlists.length) {
      surprise = withTheme(other.playlists[0], other);
      break;
    }
  }
  return { close, surprise };
}
