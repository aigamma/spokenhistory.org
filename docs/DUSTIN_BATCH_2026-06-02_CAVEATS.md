Civil Rights History Project, site-improvement batch, 2026-06-02

Everything on your list is implemented and live on robotlogic.org. Below is what changed, grouped by area, then the few judgment calls I made and why. (The detailed line-by-line version is preserved in git history.)

WHAT CHANGED (now live)

Navigation and structure
- Main menu reduced to four items: Timeline, Table of Contents, Interviews & People, K-12 Curriculum.
- Essays, Data Insights, Methodology, About, and Technical Documentation moved into a global footer sitemap.
- Logo added in the upper-left as a home link, on every page except the homepage itself.
- Topics page renamed Table of Contents.
- Interviews and People merged into one section that defaults to interviews, with toggles for historic figures mentioned and all people.
- Each interviewee's biography now lives on their interview page; the old separate person page redirects there and the bio, sources, and quotes are layered onto the interview.

Homepage and Topics
- Technical labels replaced with plain ones: Explore the Collection, Browse Interviews, Browse Topics. Also corrected a stale interview count (was 136, now 140).
- Clicking a major theme now shows a short explanation and a Play button before the playlist loads.
- Topic cards link straight to the relevant playlist, no longer to analytics or data pages.

Playlist
- Auto-advance fixed. It was not advancing past the first clip at all; it now plays continuously.
- Default order is no longer alphabetical. Clips are curated and grouped by interviewee, with the most relevant voices first, so Aaron Dixon is no longer always at the top.
- Split into Featured Clips and All Related Clips; large topics surface a few representative clips at the top.
- Clips from the same interviewee are grouped and labeled so a run from one person reads as a group.
- Playlist metrics shown: clip count, interviewee count, total listening time, and related subtopics.
- Related topics below the player link out to other playlists.
- A concise text summary of the playlist sits below the player (see Post-player analytics in the notes).
- A thin progress bar runs across the active clip, and advancing is smoother.

Accordions and clip visibility
- Accordions collapsed by default in the interview directory and Table of Contents; no longer loads expanded on Aaron Dixon.
- Clip sections auto-open on the People pages and the K-12 curriculum so the snippets read clearly as playable video.

Interview pages
- "Semantic Neighbors" renamed Related Topics.
- The interview recording leads the page, and a short note explains how the recording, chapters, biography, sources, related topics, and essays relate.

Essays
- Essays moved out of the main menu into the footer.
- "A Voice from the South": the phrase was reworded for clarity, and the link that could 404 was hardened (a person link now appears only when that page actually exists).

Sharing
- Replaced the multiple per-clip share buttons with a single share button by the player.
- Share made more robust, with a clearer confirmation and a manual-copy fallback.

JUDGMENT CALLS AND ANYTHING NOT DONE EXACTLY AS ASKED (and why)

- Post-player analytics: your dictation said to drop data visualizations on this page, but the email proposed an analytics section, so the two conflicted. I shipped a short TEXT summary with no charts, which satisfies both. Easy to remove or expand once you decide.
- "Related Topics" label: that section actually lists related interviews and people, not topics, so the label is literal but not strictly accurate. I kept your wording; I can switch it to "Related Interviews" if you prefer accuracy.
- Interviews and People merge: built as one section with toggles (interviews by default), not a single fused page, because the two render very differently (chapter lists versus people cards). I can fully fuse them if that is what you meant.
- Menu labels versus page addresses: renaming Topics to Table of Contents means the menu labels no longer match the internal page addresses. I left the addresses unchanged so existing links and bookmarks keep working.
- Featured clips and curated order: chosen automatically by relevance, not hand-picked. If you want specific clips featured for big topics like Education, send the picks and I will pin them.
- Interviewee thumbnails: the data has no photos for these yet, so each new interviewee shows a simple placeholder icon. Real thumbnails need one image field added to the data.
- Technical Documentation: there is no documentation page yet, so the footer link points to the project's GitHub repository. Happy to point it elsewhere.
- Essay 404: I could not reproduce the exact 404 from the code (the phrase links to an in-page jump, and the data checked out), so I hardened the most likely cause. If it still happens, send me the exact URL.
- Share reliability: the code looked correct, so I could not pin down a specific failure. I added robustness and clearer feedback. If it still misbehaves, tell me the browser and what actually happens.
- Faster autoplay on advance: improved, but clips from different interviews still load a new video each time, which is inherent. A deeper fix is possible if the lag is still noticeable to you.
