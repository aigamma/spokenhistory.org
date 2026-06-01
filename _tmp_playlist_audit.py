"""Throwaway: replay StaticPlaylist.jsx keyword filter against playlist_index.json.

Mirrors the exact JS logic in src/pages/StaticPlaylist.jsx:
  tokenize(s): lowercase, replace [^a-z0-9\s.] with space, split on whitespace, drop empties.
  textOf(c): `${title} ${summary} ${keywords.join(' ')} ${related_events.join(' ')} ${topic_category} ${subject}`.toLowerCase()
  Primary: whole-phrase substring (keywords.toLowerCase() in textOf).
  Fallback (only if primary == 0): every tokenized query word present in textOf.
NOTE: c.topic and c.text are NOT part of textOf in the component.
"""
import json
import re

d = json.load(open('public/rag/playlist_index.json', encoding='utf-8'))
clips = d['clips']


def tokenize(s):
    s = (s or '').lower()
    s = re.sub(r'[^a-z0-9\s.]', ' ', s)
    return [w for w in s.split() if w]


def text_of(c):
    parts = [
        c.get('title', '') or '',
        c.get('summary', '') or '',
        ' '.join(c.get('keywords', []) or []),
        ' '.join(c.get('related_events', []) or []),
        c.get('topic_category', '') or '',
        c.get('subject', '') or '',
    ]
    return ' '.join(parts).lower()


# Precompute text blobs once.
blobs = [text_of(c) for c in clips]


def count_for(keywords):
    phrase = keywords.lower()
    words = tokenize(keywords)
    hits = [i for i, t in enumerate(blobs) if phrase in t]
    via = 'phrase'
    if len(hits) == 0 and words:
        hits = [i for i, t in enumerate(blobs) if all(w in t for w in words)]
        via = 'fallback-allwords'
    return len(hits), via


# Each promised playlist -> a list of candidate keyword strings to test.
# We report the single best (highest count) candidate per playlist, plus
# show the alternates so the keyword choice is transparent.
playlists = {
    'High School Activists': ['high school', 'student', 'youth council', 'young people', 'teenager'],
    'Young Organizers': ['young', 'youth', 'student', 'young people', 'organizer'],
    'Coming of Age in the Movement': ['coming of age', 'childhood', 'growing up', 'young', 'teenager'],
    'Churches as Organizing Spaces': ['church', 'mass meeting', 'congregation', 'pastor', 'baptist'],
    'Debates Within Religious Communities': ['religion', 'church', 'theology', 'faith', 'minister'],
    'Local Movement Stories': ['local', 'community', 'hometown', 'local people', 'grassroots'],
    'National Leaders and Local Communities': ['national', 'leadership', 'local', 'community', 'sclc'],
    'Organizing Across Scales': ['organizing', 'organization', 'coalition', 'network', 'movement'],
    'Media and the Movement': ['media', 'press', 'newspaper', 'journalist', 'television'],
    'The Politics of Visibility': ['visibility', 'publicity', 'public', 'press', 'media'],
    'Protest and Public Opinion': ['protest', 'demonstration', 'march', 'public opinion', 'boycott'],
    'Funding the Movement': ['funding', 'fundraising', 'money', 'finance', 'bail'],
    'Logistics': ['logistics', 'transportation', 'travel', 'organizing', 'supplies'],
    'Resource Networks': ['resource', 'network', 'support', 'mutual aid', 'community'],
    'Organizational Support': ['organizational', 'organization', 'support', 'staff', 'sclc'],
    'Multi-generational narratives': ['generation', 'family', 'father', 'mother', 'children'],
}

THRESHOLD = 20
print(f'Total clips in index: {len(clips)}\n')
print(f'{"Playlist":<42} {"Best keyword":<22} {"Count":>6}  {"Verdict":<9} via')
print('-' * 100)
rows = []
for name, candidates in playlists.items():
    scored = []
    for kw in candidates:
        n, via = count_for(kw)
        scored.append((n, kw, via))
    # Best = highest count; tie-break prefers the earlier (cleaner) candidate.
    scored_sorted = sorted(scored, key=lambda x: -x[0])
    best_n, best_kw, best_via = scored_sorted[0]
    verdict = 'FEASIBLE' if best_n >= THRESHOLD else 'THIN'
    rows.append((name, best_kw, best_n, verdict, best_via, scored))
    print(f'{name:<42} {best_kw:<22} {best_n:>6}  {verdict:<9} {best_via}')

print('\n\n=== Full candidate breakdown per playlist ===')
for name, best_kw, best_n, verdict, best_via, scored in rows:
    print(f'\n{name}  [BEST: "{best_kw}" = {best_n} -> {verdict}]')
    for n, kw, via in sorted(scored, key=lambda x: -x[0]):
        mark = '  <-- best' if kw == best_kw else ''
        print(f'    {n:>5}  "{kw}"  ({via}){mark}')
