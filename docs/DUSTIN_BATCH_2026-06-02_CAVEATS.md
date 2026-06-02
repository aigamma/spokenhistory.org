# Dustin Site-Improvement Batch, 2026-06-02: What Shipped and Where the Direction Was Unclear

This document records the 2026-06-02 implementation of Dustin's site-improvement
request list. Every item was implemented and pushed to production (`master` ->
Netlify -> robotlogic.org), per Eric's direction to force the whole batch
through rather than leave items pending. Several requests were ambiguous,
internally inconsistent, or impossible to fully verify in this environment. We
acted anyway and recorded the assumption here, so a later reviewer (Dustin,
Eric, the Smithsonian/LoC reviewers, or a future agent) can see exactly what we
chose and reverse or refine it.

## Verification constraint that frames everything below

A full local `vite build` segfaults during the transform step on Eric's
machine. This was previously blamed on antivirus, but it persists after
Defender was disabled and Malwarebytes removed, and after disabling the harness
sandbox and raising the Node heap, so it is a genuine node/vite crash on this
box (most likely the msys Git Bash to Windows-node hop). Consequence: each
changed file was verified with a per-file `esbuild` parse check (syntax and JSX
validity), and the Netlify Linux build is the real gate. Runtime and visual
correctness were reasoned about, not observed. The single place this matters
most is the person/interview page merge (see item 5).

Where this can go: fix the local toolchain (try a clean Node LTS reinstall, or
build under WSL) so a real `npm run build` and a local preview are available.

## Navigation and information architecture

### 1. Four-item menu (DONE, clean)
Menu reduced to Timeline, Table of Contents, Interviews & People, K-12
Curriculum. No ambiguity.

### 2. Route vs label inversion (DONE, with a naming caveat)
Dustin renamed the Topics page to "Table of Contents" and merged Interviews and
People. The result is that the visible menu labels no longer match the route
names: "Table of Contents" points at `/topic-glossary`, and "Interviews &
People" points at `/table-of-contents`. We kept the routes stable because many
in-app deep links and external bookmarks target them; only the labels changed.
Where this can go: rename the routes to match the labels if desired, but that is
a cross-cutting change (every `/topic-glossary` and `/table-of-contents` link,
plus redirects for old bookmarks).

### 3. Footer sitemap, now global (DONE)
The footer is mounted once in `Layout` and carries the destinations pulled out
of the menu (Essays, Data Insights, Methodology, About), plus a "Technical
Documentation" entry. See item 12 for the Technical Documentation target.

### 4. Merge Interviews and People (DONE as a toggled section, not a fused page)
Implemented as one navigational section: the interviews directory is the
default, with a toggle bar to "Historic Figures Mentioned" and "All People"
(the People catalog, which now reads a `?type=` deep-link), and a matching
toggle back from the People catalog. We did NOT fuse the two into a single DOM
page, because the surfaces render very differently (interviews are
chapter-bearing accordions, people are catalog cards). Where this can go: a true
single-page fusion with an in-page view switch, if the toggled-section reading
is not what Dustin meant.

### 5. Merge each person page into their interview page (DONE, FORCED, NOT RENDER-TESTED)
This is the largest and least-verified change. Behavior now:
- An interviewee's `/person/:slug` hard-redirects (React Router `Navigate
  replace`) to `/interview/:entryNumber` once the catalog JSON loads. The
  redirect is gated on `person.person_type === 'interviewee'` and a non-null
  `person.entry_number`, and sits below the loading and not-found guards, so it
  never fires while loading or for an external figure.
- External figures (no `entry_number`) keep their standalone `/person` page.
- `InterviewDetail` now fetches the interviewee's catalog JSON (slug resolved
  via `peopleIndex.by_entry[n].slug`) and layers the biography, the AI's
  reading, the verbatim "Voices from the Archive" snippets, and the Sources list
  onto the interview page, so the redirect loses nothing. The fetch is
  defensive: a miss leaves the interview page unchanged.
- The old "Full catalog page" header link was removed because it now pointed at
  a page that redirects straight back (a self-loop).

What was unclear and how we acted: Dustin said "hard redirect from one to the
other"; we chose person -> interview (the interview page has the video and is
the richer destination). The field carrying the entry number was confirmed as
`entry_number` from the schema. The biography heading is "About {subject}" and
the AI's-reading heading reuses the catalog's "What the embedding finds" label.

Where this can go (REVIEW NEEDED): the redirect changes navigation site-wide
(every interviewee `/person` link now lands on the interview page), and the
layered sections were not render-tested locally. Specific things to eyeball on a
Netlify preview: the visual order and spacing of the layered biography / AI
reading / Voices / Sources relative to the existing chapters and Related Topics
sections; joint-interview cases (one entry, two interviewees); and any page that
linked to a `/person` page expecting the catalog layout.

## Homepage and Topics

### 6. User-facing labels (DONE)
"Explore the embeddings" -> "Explore the Collection", "Interview Index" ->
"Browse Interviews", "Topics" -> "Browse Topics". We also corrected a stale
homepage corpus count (136 -> 140). No ambiguity.

### 7. Rename Topics to Table of Contents (DONE)
See item 2 for the route/label consequence.

### 8. Topic detail before the playlist (DONE)
Clicking a major theme now opens an orientation panel (a one-line,
archive-grounded description plus a Play button) instead of jumping straight to
the playlist. The descriptions are ours, written factually with no evaluative
adjectives; treat them as editable copy.

### 9. Topic cards link to playlists, not analytics (DONE)
The two `/rag-explore` analytics links were removed from the Topics page.

## Playlist

### 10. Curated default order (DONE)
The alphabetical default (which always surfaced Aaron Dixon first) is replaced
by `curatedOrder()`: clips are grouped by interview, the groups are ordered by
how many clips each contributes to the filter, and chapter order is kept within
a group. This both de-thrones Aaron Dixon and clusters each interviewee's run.
What was unclear: "curated" implies an editorial sequence; we used a defensible
heuristic (contribution count), not a hand-authored order. Where this can go: a
per-topic editorial ordering if Dustin wants specific clips to lead.

### 11 and 12. Featured clips and the Featured / All split (DONE, heuristic)
The clip list is split into "Featured Clips" (the first clip of each of the
first three distinct interviews, shown only when there are more than six clips)
and "All Related Clips" (the full list). "Featured" is a heuristic
(representative, diverse top voices), not an editorial pick. Where this can go:
a curated featured-clips list per large topic.

### 13. Topic-level metrics (DONE)
Clip count, interviewee count, total listening time, and the subtopics present,
shown in the playlist header.

### 14. Related topics below the player (DONE, partial)
A "related topics" row links to other topic playlists. It is derived from the
subtopics present in the current clip set, so it is rich for keyword or mixed
playlists and EMPTY for a single-topic playlist (where every clip shares the one
topic). Where this can go: a topic-adjacency map so a single-topic playlist can
suggest thematically near topics.

### 15. Post-player analytics (DONE, FORCED on a conflicting source)
The two sources conflicted: the dictation explicitly tabled on-page analytics
("forget about putting data visualizations on that page"), while the email
proposed a new analytics summary. Per Eric's instruction to guess rather than
leave it open, we shipped a text-only "About This Playlist" panel (a sentence on
who is in the playlist and what recurs, plus the related-topics row). It honors
the dictation's "no charts" and the email's "summarize patterns" at once. Where
this can go: remove it, or expand it, once Dustin resolves which source wins.

### 16. Cluster by interviewee, label, sparse thumbnails (DONE, with a data gap)
Clips are clustered by interviewee (via `curatedOrder`), and the "All Related
Clips" list shows a group header with the interviewee name on each first
appearance. Thumbnails: `playlist_index.json` carries no poster/image field, so
the header uses a `UserCircle` placeholder. The code probes
`index.videos[entry]` for `poster` / `poster_url` / `image` and will
auto-upgrade if a future index build adds one. Where this can go: add a poster
URL to `scripts/build_playlist_index.py` output to get real thumbnails.

## Playback and performance

### 17. Auto-advance (DONE, was a real bug)
There was no auto-advance at all. `LocVideoEmbed` now fires an `onClipEnd`
callback at the clip's end mark (or the source's natural end), and the playlist
advances to the next clip; autoplay persists after the first user gesture, so
playback runs continuously. This is the one item that was a genuine defect, not
a preference.

### 18. Autoplay latency and smoother transitions (DONE, partial)
The loading spinner already existed and autoplay now continues across clips. We
did NOT implement the deeper optimization (a persistent player that seeks
instead of remounting across same-interview clips), because consecutive clips in
a topic playlist are usually different interviews, which require a new video
load regardless. Where this can go: a persistent-player-seek path for
within-interview runs.

### 19. Progress bar on the active clip card (DONE)
A 2px progress bar is pinned to the active clip card, driven by a new
`LocVideoEmbed` `onProgress` callback that reuses the existing `timeupdate`
listener (no added latency).

### 20. Collapse accordions by default (DONE)
The interview directory no longer auto-opens the first interview (Aaron Dixon).
Deep links (`?entry=`) still open their target.

### 21. Auto-open clip sections on People and Curriculum (DONE)
People-page clips now render open (via a `defaultOpen` prop on `HearInContext`)
but do NOT autoplay; the K-12 curriculum clips were already expanded.

## Interview pages

### 22. "Related Topics" rename (DONE, FORCED literal, inaccurate)
Dustin asked to rename the interview page's "Semantic Neighbors" / "Semantic
Overlap" section to "Related Topics". That section lists related INTERVIEWS and
PEOPLE, not topics, so the literal label is inaccurate. We first chose accurate
labels ("Related Interviews" / "Related People"), then forced the literal
"Related Topics" everywhere per Eric's "force all his changes" instruction.
Where this can go: switch back to "Related Interviews" / "Related People" if
accuracy is preferred, or actually populate the section with topic links to
match the label.

### 23. Make the interview central (DONE, light touch, subjective)
The interview page already led with the full-width LoC video. We removed the one
competing header element (the self-looping "Full catalog page" link, also part
of item 5) and kept the title plus a one-line capsule above the hero. This is a
subjective request; we made a light change rather than a heavy reweighting.
Where this can go: a stronger visual hierarchy (smaller metadata, a larger or
sticky player) if Dustin wants more.

### 24. Clarify essays / sources / quotes / interviews relationship (DONE, INTERPRETED)
This was unclear because the interview page did not previously contain essays,
sources, or quotes at all (those lived on the person and essay pages). With the
page merge (item 5), the interview page now carries the biography, the verbatim
quotes (Voices), and the Sources, so we added a short plain-language note
explaining how the recording and chapters, the biography and sources, the
related topics, and the essays that draw on this testimony relate. Where this can
go: confirm this is what Dustin meant; if he meant a different page or a
different relationship, the note is a single editable line.

## Essays

### 25. Move Essays out of the menu (DONE)
Essays is in the footer sitemap.

### 26. "Six oral histories take up this essay" phrase and 404 (DONE, phrase + likely cause)
The phrase was reworded to "Hear N oral histories connected to this essay". The
link itself is an in-page anchor (`#voices`) that cannot HTTP-404, and that
essay's connection data is valid, so we could not reproduce a literal 404 from
the code. The most plausible real cause is a stale person slug in a "Voices"
card ("About X" linking to a `/person/:slug` that does not exist), so we hardened
it: the "About X" link now renders only when the slug exists in
`/rag/people/index.json` (the "Full interview" link, always valid, stays). Where
this can go: if a 404 still appears, send the exact URL; with the merge in item
5, "About X" for an interviewee now redirects to the interview page anyway.

## Sharing

### 27. Single share control near the player (DONE)
The redundant per-clip share icons were removed from the playlist; one "Share
this clip" button by the player remains.

### 28. Share "unreliable" (DONE, robustness, no reproducible bug)
The share code was already sound (HTTPS clipboard with an `execCommand`
fallback, native share on touch, all inside the user gesture). We could not find
a concrete bug. We forced robustness anyway: an empty-URL guard, a longer and
clearer copied/failed confirmation with a manual-copy instruction, a
`window.focus()` before the legacy clipboard path, and `shareOrCopy` that never
throws. Where this can go: a specific repro (which browser, and what actually
happens, nothing copied vs wrong URL vs the opened link not restoring the
segment) would let us target the real failure if one remains.

## Other

### 12-doc. "Technical Documentation" footer link
No in-app documentation page exists, so the footer entry links out to the
open-source GitHub repository
(`https://github.com/jsovelove/civil-rights-history-project`). Where this can
go: point it at a dedicated docs page or a different repository if preferred.

### Unused imports residue
The eight pages that lost their per-page `<Footer/>` (when the footer went
global) still carry an unused `import Footer`. This is build-safe (the bundler
drops it) but untidy. Where this can go: a one-pass lint sweep.

## Summary of the judgment calls a reviewer may want to reverse

1. Routes kept stable while labels changed (item 2).
2. "Related Topics" forced as a literal but inaccurate label (item 22).
3. Directory merge as a toggled section, not a fused page (item 4).
4. Person/interview merge shipped without a local render test (item 5).
5. Post-player analytics shipped despite the source conflict (item 15).
6. Featured clips and curated order are heuristic, not editorial (items 10-12).
7. UserCircle placeholders instead of real thumbnails, pending a poster field
   in the index build (item 16).
8. "Technical Documentation" points at the GitHub repo for lack of a docs page.
