# Site Improvements: Response to Dustin's Requests

**Date:** 2026-05-30
**Live site:** https://robotlogic.org (production, fed by `origin/master` through Netlify).
**Structure:** organized by the headers in your source document (`p.md`). Each point quotes Dustin's exact language, followed by what was deployed.

---

## Status Checklist (quick reference for the email)

| Request | Status |
|---|---|
| Remove top nav, keep Light/Dark and Menu, merge into Menu | Done, live |
| Rename Spectrum to Ideological Spectrums (renamed Data Insights, latest phone guidance) | Done, live |
| Data Insights: one toggle grouping, Spectrum as the default toggle (phone) | Done, live |
| Gray out the current page in the menu (not hide it) | Done, live |
| Explore page: "Explore the Interview Data" plus the new subtitle | Done, live |
| Corpus count, 136 vs 145 | Done, honest framing, live (detail below) |
| Every topic has a playlist; everything leads to a playlist | Done, live |
| Content-focused names; drop Word Search and Semantic Overlap from the menu | Done, live |
| Make the site interview-forward, fewer clicks | Done, live |
| Editorialize the Spectrum view | Done, live |
| Rename External Figures to Historic Figures | Done, live |
| Editorialize Topics as a curated guide (David Cline framework) | Done, live |
| Shorter, more granular chapters | In progress, running now |
| Machine Audit page plus feedback; the indicator opens it | Done, live |
| Remove the LoC catalog links | Done, live, site-wide |
| Fix the "Watch the full interview" link | Done, live |
| Clarify the video player | Done, live |
| Show clip duration and progress | Done, live |
| Carry forward lessons from the previous site | Partial, needs the old version to compare |
| Build the not-yet-on-site interviews (to 140) | Queued next |
| Apply David Cline guidance (themes, playlists, coordinate axes) | Themes and playlists done; coordinate axes follow-on |

---

## 1. Navigation, and the Embedding Page Header

> Remove the top level navigation. Just keep the Light/Dark and Menu. Merge with the Menu. Rename Spectrum to Ideological Spectrums. On the menu, keep the ordering and items, but gray out the one for the current page rather than menu.
>
> Top of the embedding page, rename "Explore the Embeddings" to "Explore the Interview Data". Underneath that, replace "Multiple lenses on the 136-interview Civil Rights History Project corpus..." with "Below are a set of tools for exploring the data and learning about the ideas in the interviews." And 136 where said needs to say 145 since 9 new ones were added.

**Deployed.** The three top-of-page pill links are gone; the header is just the Light/Dark toggle and the Menu button. Every destination lives in the one Menu drawer. "Spectrum" is renamed "Data Insights" (your written note said "Ideological Spectrums"; a later phone note revised it to "Data Insights"). The drawer keeps its full ordering and items, and the entry for the page you are on is grayed and non-interactive (and marked for screen readers as the current page) instead of disappearing, so the menu keeps a constant shape. On the Explore page the title is now "Explore the Interview Data" and the subtitle is your exact replacement copy.

**On 136 vs 145, an important accuracy note.** Before changing the number I checked the data, because the Smithsonian and LoC hold us to an accuracy standard. The nine interviews added around May 25 (Abernathy family, Alfred Moldovan, C. T. Vivian, the Ackermans, Geraldine Crawford Bennett and colleagues, Gertrude Newsome Jackson, John Dudley and colleagues, Myrtle Gonza Glascoe, Simeon Wright) are **already on the site**, under entry numbers 28, 46, 64, and 133 through 138. The corpus went from 127 to 136 when they were added, so the nine are counted in the 136, not missing from it. 145 is the size of the full Library of Congress and Smithsonian collection ("approximately 145 long-form oral history interviews," per the David Cline document), not our current holdings. There are four interviews with transcripts that are genuinely not on the site yet (Glenda Funchess, Louise Broadway, the Lucius Holloway Sr. and Emma Kate Holloway joint interview, Luis Zapata); building those would bring the site to 140. So rather than print "145 interviews" the site does not have, the copy reads honestly and still names your number: the Home hero now says "136 of the ~145-interview collection," and the Interview Index says "All 136 interviews currently on the site, drawn from the Library of Congress and Smithsonian collection of roughly 145." Reproducible via `scripts/diag_corpus_state.py`. If you want a true 140, I can build the four (queued, see the chapterization and four-interview notes below); a true 145 would require sourcing five more interviews we do not hold.

---

## 2. Topic Playlists, Fewer Clicks

> Every topic should have a playlist of videos. The playlists and the video interviews need to be more centered on the navigational elements requiring fewer clicks and less working.

**Deployed.** Every topic now links to a playlist of clips. This also fixed a real breakage: the old playlist and clip pages read from Firestore, which holds no content, so roughly 50 "explore X" links on the Home timeline (Emmett Till, Montgomery, SNCC, Freedom Rides, and so on) led to a blank page. The new static playlist is built on our actual data: every chapter across the 136 interviews is a clip in a precomputed index (1,781 clips, every one with a playable LoC video). The `/playlist-builder` route filters that index by keyword, topic, interview, or a set of interviews, and plays the clips, so the existing links work unchanged and topics open straight into clips.

---

## 3. Content-Focused Language

> Use content-focused language rather than technical language. Terms like "spectrum," "semantic overlap," "word search," and "embeddings" describe the underlying technology, but they don't tell visitors much about what they can actually explore... Decisions: "Spectrum" >> "Ideological Spectrums". "Semantic Overlap" >> "Related People". On the menu, remove "Word Search" and "Semantic Overlap".

**Deployed.** In the menu, the two technical sub-tab entries (Semantic Overlap, Word Search) are removed; Spectrum is renamed Data Insights (your written note said Ideological Spectrums; a later phone note revised it to Data Insights). On the Explore page the tabs are renamed to content language: Semantic Overlap to "Related People," Word Search to "Concept Lenses," Atlas to "Places," Network to "Influence," and the tab groups now read "Concepts and Ideas," "Maps of the Archive," "Find a Moment," "Curated Paths."

---

## 4. Make the Site Interview-Forward

> Make the site interview-forward. It currently takes too many clicks to get to the interviews. The interviews and playlists should be the primary destination throughout the site. Everything should lead to a playlist. Topics, themes, people, places, events, and concepts should all have playlist pages. Clicking on a topic should immediately bring users to relevant clips and interviews. Make supporting materials secondary.

**Deployed.** The interview-forward shift is in, and "everything should lead to a playlist" is addressed for each entity type you named:

- **Topics:** every topic links to a playlist of its interviews' clips (see Sections 2 and 7). Done.
- **Themes:** the eleven major-theme playlists open straight into clips (Section 7). Done.
- **Events:** the event layer carries time-anchored passages with playable clips (Emmett Till, the 16th Street Baptist Church bombing, and the rest), and the Home-timeline event links now reach the working playlist. Done.
- **Places:** the geographic layer carries time-anchored passages with playable clips per place. Done.
- **People:** each person page surfaces that interviewee's own clips inline (play in place, plus an "open the full interview" link). A dedicated per-person playlist that gathers every mention of a person across all interviews is a contained follow-on. Mostly done.
- **Concepts:** the Concept Lenses and Data Insights spectrum let a visitor drill from a concept into the passages that anchor it; a one-click "concept playlist" is the remaining follow-on piece. Partially done.

"Clicking on a topic should immediately bring users to relevant clips and interviews" is done: a topic now lands you on its clips in one step, which also reduces clicks throughout.

On **"make supporting materials secondary"**: the navigation now leads with content (Interviews, topics-as-playlists, themes), and the analytical surfaces you listed (the visualizations, the metadata, the topic descriptions, the glossary, the analytical tools) sit under the Explore page or behind a "how was this generated" link, supporting the interviews rather than fronting them. The broken Firestore-only pages are out of the main path entirely.

---

## 5. Editorialize the Spectrum View

> Editorialize the spectrum view. Right now it's visually impressive, but it's not always clear what visitors are supposed to learn from it. We should be more selective and explanatory, helping users understand why particular clusters, relationships, or themes matter rather than simply exposing the computational structure of the archive.

**Deployed.** The Data Insights spectrum (renamed from "Ideological Spectrums" per the latest phone guidance) now opens by naming the actual debates inside the movement that the axes represent (nonviolence versus armed self-defense, individual conscience versus collective discipline, local versus national) and tells the visitor what to look for: who stood where, and which voices sit close together even though they never met. It no longer leads with the reproducible-math framing.

**Update (2026-05-30, phone guidance).** Two further changes you asked for by phone are in: the label is renamed from "RAG Insights" to **"Data Insights,"** and the spectrum is no longer a separate hero pinned above the tab nav. Every view, including the spectrum, now lives in **one toggle grouping**; "Data Insights" (the two-axis spectrum) is simply the **default toggle**, so the page opens on it and a visitor toggles to Concept Lenses, Related People, the maps, and the curated paths from the same row.

---

## 6. Rename External Figures to Historic Figures

> On https://robotlogic.org/#/people rename "External Figures" to "Historic Figures"

**Deployed.** The People page filter, the prose, and the per-card label now read "Historic Figures."

---

## 7. Editorialize the Topics View (and Use the David Cline Interview)

> Editorialize the topics view. The topics page should feel less like a generated list and more like a curated guide to the collection... a kind of table of contents, index, or thematic guide... We should use the David Cline interview to shape both the spectrum and topics views... His discussion of interview methodology, community dynamics, local organizing, memory, violence, family relationships, Emmett Till, and other recurring narratives can help us determine what to highlight... Instructions for table of contents: What's missing on each topic is a list to the playlist for that topic.

**Deployed.** The Topics page now opens with "Major Themes in the Collection," eleven curated pathways drawn directly from Cline's framework: Family and Community, Growing Up Under Jim Crow, Education and Schools, Emmett Till and Generational Memory, Youth and Student Activism, Faith and the Church, Voter Registration and Local Organizing, Violence and State Repression, Military Service, Migration, and Music and Culture. Each opens a playlist of clips (verified to return 36 to 459 clips each, so none is empty). The intro is rewritten as a guide to the major stories rather than a description of k-means clusters. And the missing piece you flagged is in: every individual topic below now has a "Play clips from these N interviews" link to its own playlist. Reviewing the timeline against Cline's framing is a noted follow-on.

---

## 8. Review the Chapterization Process

> Review the chapterization process... The chapters in the playlist I looked at felt fairly long, often 10-15+ minutes. I think it's worth experimenting with shorter chapter lengths and more granular segmentation... individual stories or narrative moments may only be a few minutes long... The goal should be helping users quickly discover and navigate specific stories, topics, and moments within longer interviews.

**In progress, running now.** Your read is correct: the current chapters run a median of 8 to 9 minutes, some as long as 19. Re-chapterizing is low risk (it only rewrites the chapter list on each interview and regenerates the clip index; the search index, the maps, and the clusters are untouched). Two pilots validated the approach first: Aaron Dixon went from 14 chapters to 67 (average 2.2 minutes, longest 4.0), the Ladners joint interview from 15 to 40 (average 3.0 minutes, longest 5.0), both with every chapter boundary aligned to the transcript, no gaps, and zero validation errors. The full corpus is being re-chapterized now, one agent per interview, targeting roughly 25 to 50 short chapters per interview instead of 12 to 14 long ones. When it finishes I validate every interview, merge the passing ones, regenerate the clip index, and push, so every playlist picks up the shorter chapters at once.

Two refinements are folded in. First, the segmentation is **topic-driven, not time-sliced**: each break falls where the story or topic actually shifts, so the 2-to-4-minute figure is only a target and chapter lengths vary by content (1.6 to 5 minutes in the sample so far). Second, every chapter now carries a **specific, intelligently-assigned topic name**, a real subject heading (for example "Freedom Summer Voter Registration" or "The Beckwith Trial"), distinct from the narrative title and far more specific than the broad category. That topic name makes the chapter list scannable and lets chapters be grouped by topic across interviews, the chapter index will surface it once the run merges.

---

## 9. Develop the Machine Audit Concept (and Remove the LoC Catalog Links)

> Develop the Machine Audit concept further... If users click on a Machine Audit indicator, it could open a page explaining how metadata was generated, where uncertainty exists, and provide a mechanism for feedback and corrections. Keep users on our site whenever possible. Include LOC attribution and source links, but avoid sending users away from the experience unnecessarily. Instructions: Remove the LoC catalog links entirely.

**Deployed.** A new page at `/machine-audit` explains the seven-step pipeline, the dual-scorer publication gate (two independent models both at 90/90, a per-claim citation audit, fail-closed to human review), the Library of Congress cross-reference, the three settled audit states (with live counts), where uncertainty remains (stated honestly), and a correction mechanism (a prefilled email link that works without the unbuilt backend). The audit indicator is wired through: the audit-tier badge on every citation across the site now carries a "How was this generated?" link to the page, and the audit widget on the Explore page links to it too.

**On the LoC links:** every outbound "View in LoC catalog" link is removed site-wide (16 files). The textual "Library of Congress" attribution stays as plain text, the internal interview and person links stay, and the embedded LoC video and image sources are untouched (removing those would break playback). The scholarly source citations on person pages were already non-clickable text, so the citation substrate the institutional review depends on is intact. One judgment call: the "copy a citation" button still includes the LoC item URL in the copied text, since that is scholarly provenance a researcher pastes into a paper, not an on-page link that sends a visitor away. Say the word if you want that removed too.

---

## 10. Fix the Full Interview Flow

> Fix the full interview flow. The "Watch the full interview" link currently doesn't work, and individual interview pages should foreground the actual interview itself.

**Deployed.** The broken link pointed at the empty-Firestore player. Every full-interview link now goes to the working `/interview/:number` page, which leads with the recording itself. The static playlist's "Watch the Full Interview" button does the same.

---

## 11. Clarify the Video Player

> Clarify the video player. Make the relationship between the current clip, the full interview timeline, and related clips more obvious.

**Deployed.** The playlist player shows "Clip N of M," labels the clip's title and the interview it comes from, lists the other clips alongside (the related clips), gives previous and next controls, and puts a prominent "Watch the Full Interview" link beside the clip. The relationship between this clip, the full interview, and the rest of the list is now explicit.

---

## 12. Show Clip Duration and Progress

> Show clip duration and progress. Users should be able to quickly see how long a clip is and where they are within it.

**Deployed.** Each clip shows its duration (for example "3:12") in both the player header and the clip list, plays bounded to its own passage, and the player's scrubber shows position within the clip. "Clip N of M" shows where you are in the playlist.

---

## 13. Carry Forward Lessons from the Previous Site

> I still prefer some aspects of the previous site's presentation. In particular, I think the interview index, video index, and glossary/index pages felt clearer and more approachable, and there may be useful lessons from those designs worth carrying forward.

**Partially addressed.** The interview-forward and static-playlist work above is the substance of this (clearer index-to-interview paths, a working video/clip index). A direct visual comparison against the previous designs is a good follow-on; point me at which previous version you mean (a branch, a deploy, or a screenshot) and I will carry specific lessons across.

---

## The David Cline Guidance Document

The second half of your document synthesizes the David Cline interview into historical themes, each with specific suggested playlists, categories, coordinate systems, and visualizations. Below is every one of those suggestions with its status. "Done" means a real, populated playlist or change is live; "Partial" means the underlying clips or layer exist but not the exact named artifact; "Follow-on" means it is scoped but not yet built.

**Life history as organizing principle (family, education, religion, community, labor, migration, military as entry points):**
- Family and Community playlists, Done (theme playlist live).
- Education and School Segregation playlists, Done (theme "Education and Schools").
- Growing Up Under Jim Crow thematic pathways, Done (theme playlist live).
- Life-course visualizations (childhood to activism), Follow-on.

**Family and community as foundations:**
- Family and Community thematic clusters, Done.
- Relationship mapping and community-network visualizations, Partial (the influence graph exists; a community-network map is a larger build).
- Multi-generational narratives, Follow-on.
- RAG essays (family influence, intergenerational activism, community support, youth activism), Follow-on (content generation).

**Emmett Till as a generational turning point:**
- Generational Memory playlist, Done (theme "Emmett Till and Generational Memory").
- Event-centered cluster linking Till references, Partial (the events layer holds Till passages across interviews).
- Network analysis linking events to later activism, Follow-on.

**Youth activism and high-school students:**
- Categories (Student activism, Youth leadership, School-based organizing, Student protests), Done (theme "Youth and Student Activism").
- Playlists (High School Activists, Young Organizers, Coming of Age in the Movement), Done (gathered under the Youth and Student Activism playlist).
- Visualizations (age and activism, educational pathways), Follow-on.

**The infrastructure of community organizing (barbershops, beauty parlors, funeral homes, churches, pool halls, local businesses):**
- Categories (Organizing spaces, Community infrastructure, Black-owned businesses, Informal communication networks), Follow-on (the next theme set to add; the clips exist, the named pathway does not yet).
- Community infrastructure maps and place-based navigation, Partial (the geographic layer exists).
- Synthesized accounts of Black-owned businesses, Follow-on (content generation).

**Churches and the complexity of religious leadership:**
- Distinguishing church institutions vs religious leadership vs religious activism vs community support, Follow-on (a metadata refinement).
- Faith and Activism playlist, Done (theme "Faith and the Church").
- Churches as Organizing Spaces, and Debates Within Religious Communities, Follow-on (facets of the faith theme).

**Multiple pathways to social change, and local vs national:**
- Coordinate system X: Local to National, Y: Grassroots to Institutional, Follow-on (the Spectrum already supports switchable axes; this adds two new axis poles).
- Dimensions Organizing / Judicial / Legislative / Corporate, Follow-on.
- Playlists (Local Movement Stories, National Leaders and Local Communities, Organizing Across Scales), Follow-on.
- Local-versus-national comparison retrieval, Follow-on (the retrieval engine supports it; the curated comparison is the build).

**Media, optics, and public opinion:**
- Categories (Media strategy, Public opinion, Photography, Television coverage, Narrative framing), Follow-on.
- Playlists (Media and the Movement, The Politics of Visibility, Protest and Public Opinion), Follow-on.

**Funding, resources, and movement sustainability:**
- Categories (Funding the movement, Logistics, Resource networks, Organizational support), Follow-on.
- RAG essays (economics of organizing, infrastructure and sustainability), Follow-on.

**The archive as an ecosystem:**
- Helping users perceive the network of people, institutions, places, and ideas, Partial (the influence graph and the cross-link manifests on person pages do this today; a richer ecosystem view is a larger build).

The editorial intent that runs through all of it (lead with the human narratives Cline identified, not the computational categories) is already applied to the Topics and Spectrum views (Sections 5 and 7).

---

## Build the Four Not-Yet-On-Site Interviews (to Reach 140)

Glenda Funchess, Louise Broadway, the Holloway joint interview, and Luis Zapata have corrected transcripts but no pages. Building each fully means generating chapters and a summary, writing a person page, and adding it to the search index. This is queued to run right after the re-chapterization finishes. The search-index step uses the embedding pipeline (plain Node, separate from the local build issue below), which I will confirm runs on this machine before counting them as fully searchable.

---

## Notes on Verification and the Local Build

- **The local production build cannot run on this machine,** but it is **not** the antivirus: Windows Defender was fully disabled and the crash persisted. The cause is a pre-existing access violation in the Rollup native bundler during the vite build, a known Windows issue. Plain Node scripts (including the re-chapterization tooling and the embedding pipeline) work fine; only the vite/Rollup bundle crashes. Netlify's cloud build is unaffected and is what deploys the site, so nothing shipped is at risk.
- **How changes were verified locally:** each changed file is parsed with the build's own transform (esbuild), plus targeted checks (for example, confirming zero outbound loc.gov links remain, and that every Home keyword returns clips). Netlify's build is the real gate and will not deploy a broken build.
- **Orphaned legacy routes.** A few old pages (`/content-directory`, `/search`, `/clip-player`, `/interview-player`) still reference the empty Firestore. They are not reachable from the menu, so they do not affect the main experience, but they are dead ends if reached directly. Repointing or retiring them is a small follow-on.
- **Machine Audit feedback** currently opens a prefilled email to eric@aigamma.com. That is the working option without a backend; we can point it at a project inbox or a feedback board whenever you prefer.

---

## Commits (in order)

`f42ff2c` nav, content-language renames, Historic Figures, loc.gov removal, editorialized Spectrum · `4c9acf4` Machine Audit page · `7423a8c` static playlist system plus Topics editorialization · `364cfda` honest corpus-count framing · `c5494b3` David Cline thematic playlists · `19bd604` this report plus repo-doc updates · plus the CitationCard audit-badge link and the re-chapterization tooling. Everything except the in-progress re-chapterization and the four-interview build is live on robotlogic.org now.
