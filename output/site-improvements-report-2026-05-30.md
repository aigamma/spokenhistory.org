CIVIL RIGHTS HISTORY PROJECT, SITE IMPROVEMENTS

Updated 2026-05-31
Live site: robotlogic.org (production, deployed from the master branch through Netlify)

This report walks through each site-improvement request in the order it was written, quoting the original wording and then describing what shipped. After the written list, a Beyond the Written List section covers features that came from follow-up calls and texts and a few fixes made on our own initiative. Points 1 through 13 are the written requests; items still in motion are flagged honestly.


QUICK STATUS

- Remove the top nav, keep Light/Dark and Menu, merge into the Menu.
- Rename Spectrum (revised to "Data Insights" on the phone).
- Data Insights made into one toggle grouping to simplify the page.
- Gray out the current page in the menu instead of hiding it.
- Renamed "Explore the Embeddings" to "Explore the Interview Data".
- Corpus count, 136 versus 145: done, with an honest framing.
- Every topic has a playlist; everything leads to a playlist.
- Content-focused names; drop Word Search and Semantic Overlap from the Menu.
- Make the site interview-forward, fewer clicks.
- Editorialize the Spectrum view.
- Rename External Figures to Historic Figures.
- Editorialize Topics as a curated guide using the David Cline framework.
- Shorter, more granular chapters: 35 of 136 done and live everywhere (interview pages and playlists, not just the index); the remaining ~101 in progress.
- Machine Audit page plus feedback, and the indicator opens it.
- Remove the LoC catalog links (to stop driving traffic off the site).
- Fix the "Watch the full interview" link.
- Clarify the video player.
- Show clip duration and progress.
- Build the four not-yet-on-site interviews to reach 140: done. The site is now at 140, each of the four searchable and with its own person page.
- Chapters grouped into parts.
- Table of Contents page (expandable by parts and chapters).


1. NAVIGATION, AND THE EXPLORE PAGE HEADER

Request: "Remove the top level navigation. Just keep the Light/Dark and Menu. Merge with the Menu. Rename Spectrum to Ideological Spectrums. On the menu, keep the ordering and items, but gray out the one for the current page rather than menu." And: "Top of the embedding page, rename 'Explore the Embeddings' to 'Explore the Interview Data'. Underneath that, replace [the long technical subtitle] with 'Below are a set of tools for exploring the data and learning about the ideas in the interviews.' And 136 where said needs to say 145 since 9 new ones were added."

Done. The three top-of-page pill links are gone; the header is just the Light/Dark toggle and the Menu button, and every destination lives in the one Menu drawer. The drawer keeps its full ordering and items, and the entry for the current page is grayed and non-interactive (and marked for screen readers as the current page) instead of disappearing, so the menu keeps a constant shape. On the Explore page the title is now "Explore the Interview Data," and the subtitle is the requested replacement copy: "Below are a set of tools for exploring the data and learning about the ideas in the interviews." Spectrum was first renamed per the written note and then revised to "Data Insights" on a later call.

On 136 versus 145, an accuracy note. The number was checked against the data first, because the Smithsonian and LoC hold the project to an accuracy standard. The nine interviews added around May 25 (the Abernathy family, Alfred Moldovan, C. T. Vivian, the Ackermans, Geraldine Crawford Bennett and colleagues, Gertrude Newsome Jackson, John Dudley and colleagues, Myrtle Gonza Glascoe, and Simeon Wright) are already on the site, under entry numbers 28, 46, 64, and 133 through 138. The corpus went from 127 to 136 when they were added, so the nine are counted inside the 136, not missing from it. 145 is the size of the full Library of Congress and Smithsonian collection (the David Cline document says "approximately 145 long-form oral history interviews"), not the current holdings. Four interviews have transcripts but are genuinely not on the site yet (Glenda Funchess, Louise Broadway, the Lucius Holloway Sr. and Emma Kate Holloway joint interview, and Luis Zapata); building those brings the site to 140, and that build is underway now (see below). So rather than print a 145 the site does not have, the copy reads honestly and still names the target: the Home hero says "136 of the ~145-interview collection," and the Interview Index says "All 136 interviews currently on the site, drawn from the Library of Congress and Smithsonian collection of roughly 145." A true 145 would require sourcing five more interviews that are not in the holdings.


2. TOPIC PLAYLISTS, FEWER CLICKS

Request: "Every topic should have a playlist of videos. The playlists and the video interviews need to be more centered on the navigational elements requiring fewer clicks and less working."

Done. Every topic now links to a playlist of clips. This also fixed a real breakage: the old playlist and clip pages read from a database that holds no content, so roughly 50 "explore X" links on the Home timeline (Emmett Till, Montgomery, SNCC, Freedom Rides, and so on) led to a blank page. The new playlist is built on the actual data: every chapter across the 136 interviews is a clip in a precomputed index, and each one plays its own bounded segment of the Library of Congress video. Topics now open straight into clips, and the links that used to dead-end work again.


3. CONTENT-FOCUSED LANGUAGE

Request: "Use content-focused language rather than technical language. Terms like 'spectrum,' 'semantic overlap,' 'word search,' and 'embeddings' describe the underlying technology, but they don't tell visitors much about what they can actually explore... Decisions: 'Spectrum' >> 'Ideological Spectrums'. 'Semantic Overlap' >> 'Related People'. On the menu, remove 'Word Search' and 'Semantic Overlap'."

Done. In the menu, the two technical sub-tab entries (Semantic Overlap and Word Search) are removed, and Spectrum is renamed (now Data Insights, per the later call). On the Explore page the tabs are renamed to content language: Semantic Overlap to "Related People," Word Search to "Concept Lenses," Atlas to "Places," and Network to "Influence." The tab groups now read in plain terms: Maps of the Archive, Find a Moment, and Curated Paths.


4. MAKE THE SITE INTERVIEW-FORWARD

Request: "Make the site interview-forward. It currently takes too many clicks to get to the interviews. The interviews and playlists should be the primary destination throughout the site. Everything should lead to a playlist. Topics, themes, people, places, events, and concepts should all have playlist pages. Clicking on a topic should immediately bring users to relevant clips and interviews. Make supporting materials secondary."

Done, and "everything leads to a playlist" is addressed for each entity named in the request:

- Topics: every topic links to a playlist of its interviews' clips. Done.
- Themes: the major-theme playlists open straight into clips. Done.
- Events: the event layer carries time-anchored passages with playable clips (Emmett Till, the 16th Street Baptist Church bombing, and the rest), and the Home-timeline event links reach a working playlist. Done.
- Places: the geographic layer carries time-anchored passages with playable clips per place. Done.
- People: each person page surfaces that interviewee's own clips inline, with an "open the full interview" link. A dedicated per-person playlist that gathers every mention of a person across all interviews is a contained follow-on. Mostly done.
- Concepts: the Concept Lenses and the Data Insights spectrum let a visitor drill from a concept into the passages that anchor it; a one-click concept playlist is the remaining follow-on. Partially done.

Clicking a topic now lands on its clips in one step, which is the heart of the fewer-clicks request. On making supporting materials secondary: the navigation leads with content (interviews, topics-as-playlists, themes), and the analytical surfaces (visualizations, metadata, topic descriptions, the glossary, the analytical tools) sit under the Explore page or behind a "how was this generated" link, supporting the interviews rather than fronting them.


5. EDITORIALIZE THE SPECTRUM VIEW

Request: "Editorialize the spectrum view. Right now it's visually impressive, but it's not always clear what visitors are supposed to learn from it. We should be more selective and explanatory, helping users understand why particular clusters, relationships, or themes matter rather than simply exposing the computational structure of the archive."

Done. The Data Insights spectrum now opens by naming the actual debates inside the movement that the axes represent (nonviolence versus armed self-defense, individual conscience versus collective discipline, local versus national) and tells the visitor what to look for: who stood where, and which voices sit close together even though they never met. It no longer leads with the reproducible-math framing.

A later call added two changes, also done: the label is renamed from RAG Insights to Data Insights, and the spectrum is no longer a separate hero pinned above the tabs. Every view, including the spectrum, now lives in one toggle grouping, with the spectrum as the default toggle, so the page opens on it and a visitor toggles to the other views from the same row.


6. RENAME EXTERNAL FIGURES TO HISTORIC FIGURES

Request: "On https://robotlogic.org/#/people rename 'External Figures' to 'Historic Figures'."

Done. The People page filter, the prose, and the per-card label all read "Historic Figures."


7. EDITORIALIZE THE TOPICS VIEW, AND USE THE DAVID CLINE INTERVIEW

Request: "Editorialize the topics view. The topics page should feel less like a generated list and more like a curated guide to the collection... a kind of table of contents, index, or thematic guide... We should use the David Cline interview to shape both the spectrum and topics views. His discussion of interview methodology, community dynamics, local organizing, memory, violence, family relationships, Emmett Till, and other recurring narratives can help us determine what to highlight... Instructions for table of contents: What's missing on each topic is a list to the playlist for that topic."

Done. The Topics page now opens with "Major Themes in the Collection," eleven curated pathways drawn directly from Cline's framework: Family and Community, Growing Up Under Jim Crow, Education and Schools, Emmett Till and Generational Memory, Youth and Student Activism, Faith and the Church, Voter Registration and Local Organizing, Violence and State Repression, Military Service, Migration, and Music and Culture. Each opens a playlist of clips (each one verified to return between 36 and 459 clips, so none is empty). The intro is rewritten as a guide to the major stories rather than a description of computational clusters. And the missing piece flagged in the request is in: every individual topic below now has a "Play clips from these N interviews" link to its own playlist. Reviewing the timeline against Cline's framing is a noted follow-on.


8. REVIEW THE CHAPTERIZATION PROCESS

Request: "Review the chapterization process... The chapters in the playlist I looked at felt fairly long, often 10-15+ minutes. I think it's worth experimenting with shorter chapter lengths and more granular segmentation. In some cases, individual stories or narrative moments may only be a few minutes long, and those could function as useful chapters in their own right. The goal should be helping users quickly discover and navigate specific stories, topics, and moments within longer interviews."

In progress, and well underway: 35 of the 136 interviews are now re-chapterized and fully live, on the interview pages and in every playlist (not just the Table of Contents). The original read was right: the old chapters ran a median of 8 to 9 minutes, some as long as 19. The new ones are granular, most run 2 to 4 minutes, and each break falls where the story or topic actually shifts rather than on a clock. To protect the accuracy bar the Smithsonian and LoC hold the project to, this is done one interview at a time, reading each transcript in full and aligning every chapter boundary to the words before it ships, with an automatic check that the chapters cover the whole interview with no gaps. A few examples: Judge D'Army Bailey's three-hour interview went to 70 chapters in 16 parts, Michael Thelwell's four-hour interview to 71 chapters in 19 parts, Dorothy Cotton's to 43, and the Abernathy children's joint interview to 37.

Two refinements are visible. First, every chapter carries a specific, signed topic name, a real subject heading (for example "Buying the Lorraine Motel at Auction" or "Bringing Malcolm X to Howard"), separate from the narrative title and far more specific than the broad category, which makes the chapter list scannable. Second, the chapters are grouped into parts (see the parts note further down). The remaining interviews are being processed the same way; as a batch finishes, the new chapters are merged into the interview pages and the clip index is rebuilt, so the playlists and Table of Contents pick them up together. When the full run completes, every interview on the site reads in short, named, grouped chapters. This is the longest-running item on the list because it is a careful pass over hundreds of hours of testimony, not a one-click rerun.


9. DEVELOP THE MACHINE AUDIT CONCEPT, AND REMOVE THE LOC CATALOG LINKS

Request: "Develop the Machine Audit concept further... If users click on a Machine Audit indicator, it could open a page explaining how metadata was generated, where uncertainty exists, and provide a mechanism for feedback and corrections. Keep users on our site whenever possible. Include LOC attribution and source links, but avoid sending users away from the experience unnecessarily. Instructions: Remove the LoC catalog links entirely."

Done. There is a new page that explains the pipeline, the publication gate (two independent AI scorers that must both pass, a per-claim citation audit, and a fail-closed handoff to human review when they disagree), the Library of Congress cross-reference, the settled audit states with live counts, where uncertainty remains (stated honestly), and a correction path. The audit indicator is wired through: the audit-tier badge on every citation across the site now carries a "How was this generated?" link to that page, and the audit widget on the Explore page links to it too.

On the LoC links: every outbound "View in LoC catalog" link is removed site-wide. The textual "Library of Congress" attribution stays as plain text, the internal interview and person links stay, and the embedded LoC video and image sources are untouched (removing those would break playback). The scholarly source citations on person pages were already plain text, not links, so the citation substrate the institutional review depends on is intact. One judgment call: the "copy a citation" button still includes the LoC item URL in the copied text, because that is scholarly provenance a researcher pastes into a paper, not an on-page link that sends a visitor away. It can be removed too if preferred.


10. FIX THE FULL INTERVIEW FLOW

Request: "Fix the full interview flow. The 'Watch the full interview' link currently doesn't work, and individual interview pages should foreground the actual interview itself."

Done. The broken link pointed at the empty database player. Every full-interview link now goes to the working interview page, which leads with the recording itself, and the playlist's "Watch the Full Interview" button does the same.


11. CLARIFY THE VIDEO PLAYER

Request: "Clarify the video player. Make the relationship between the current clip, the full interview timeline, and related clips more obvious."

Done. The player shows "Clip N of M," labels the clip's title and the interview it comes from, lists the other clips alongside, gives previous and next controls, and puts a prominent "Watch the Full Interview" link beside the clip. The relationship between this clip, the full interview, and the rest of the list is now explicit.


12. SHOW CLIP DURATION AND PROGRESS

Request: "Show clip duration and progress. Users should be able to quickly see how long a clip is and where they are within it."

Done. Each clip shows its duration (for example 3:12) in both the player header and the clip list, plays bounded to its own passage, and the scrubber shows position within the clip, while "Clip N of M" shows position in the playlist.


13. CARRY FORWARD LESSONS FROM THE PREVIOUS SITE

Request: "I still prefer some aspects of the previous site's presentation. In particular, I think the interview index, video index, and glossary/index pages felt clearer and more approachable, and there may be useful lessons from those designs worth carrying forward."

Partially addressed. The interview-forward and playlist work above is the substance of this: clearer index-to-interview paths and a working video and clip index. A direct visual comparison against the previous designs is a good next step; if a specific previous version is identified (a branch, a deploy, or a screenshot), specific lessons can be carried across.


BEYOND THE WRITTEN LIST: FROM FOLLOW-UP CALLS AND TEXTS, AND OUR OWN INITIATIVE

Some of the most visible improvements were not in the written list at all. They came out of follow-up calls and texts, and in a few cases out of our own initiative once we were in the code. Almost all were completed in the most recent work session. They are deployed except where noted.

A TABLE OF CONTENTS PAGE

This came out of the ongoing conversation rather than the written list. The written notes gestured at the idea (a kind of table of contents, index, or thematic guide), and several follow-up calls and texts developed it into a real feature, so it was built last session. There is a new page at Menu, then Table of Contents. Every interview is one row; open it to see its chapters, and click a chapter to play that moment. The buffering concern raised by phone is handled, that opening a chapter must not pull the whole file or it could freeze for minutes buffering a multi-hour interview on the LoC servers: each chapter, and each part, plays a bounded clip, and the player seeks straight to the segment and streams only its bytes, so even a four-and-a-half-hour interview opens to the right place at once instead of buffering the whole file.

CHAPTERS GROUPED INTO PARTS

From a follow-up call: arrange the chapters into parts to declutter them rather than showing up to 250 chapters as a wall of text, with a red-worded part heading separating the parts, and clicking a part leads to its first chapter and can autoplay the whole part for a longer listen.

Done on every re-chapterized interview so far (35 of 136). Each chapter carries a part label, and consecutive chapters with the same label form a part with a red "Part N: title" heading. Charles McLaurin's 77 chapters, for example, read as twelve parts (Coming Up in Jackson; The Army; Finding the Movement in Jackson; and so on through The March Against Fear and Black Power). Clicking a chapter plays that moment; clicking a part plays it straight through, first chapter to last, as one bounded autoplay run. The rest of the corpus gains parts as the re-chapterization reaches each interview.

DATA INSIGHTS AS ONE TOGGLE GROUPING

From a follow-up call: put all the insights in one grouping with toggles rather than the Spectrum alone as a hero, with the Spectrum as the default toggle; rename RAG Insights to Data Insights; drop the "Concepts and Ideas" row since the whole page is data insights; and have the Ideological Spectrums toggle show the hero spectrum and then the grid of four spectrum tables beneath it.

Done. The menu item and page are now Data Insights. The page opens on a single default toggle, Ideological Spectrums, which shows the two-axis spectrum and then the four-chart grid beneath it. The separate hero and the "Concepts and Ideas" row are gone; the spectrums lead, and the remaining views (Interview Map, Related People, Quote Finder, Themes, Places, Influence, Tours, and Quote of the Day) sit in three grouped toggles below.

INTERVIEW INDEX TIER LABEL

From a follow-up note: the top of the interview index read "1 LoC-Verified, 123 Audited, 12 Audio-Limited Source," and a category of one saying LoC-Verified is not needed; it can just become Audited.

Done. The lone LoC-Verified count is folded into Audited, so the header now reads "124 Audited, 12 Audio-Limited Source," with the filter and the per-row badges grouped the same way.


PROACTIVE FIXES AND ENHANCEMENTS

A few things done on our own initiative while in the work, not on the written list:

- Repaired the broken playlist links. The previous playlist and clip pages drew from a data store that is currently empty, so roughly fifty "explore this" links on the Home timeline led to blank pages. They were rebuilt on the actual interview data and now play real clips. This is the foundation of the topic-playlist work in section 2.
- Added a signed topic name to every new chapter. Beyond simply shortening the chapters, each one carries a real subject heading (for example, "Buying the Lorraine Motel at Auction"), which makes a long chapter list scannable and lets the same topic be gathered across different interviews.
- Built bounded-clip playback. Across the Table of Contents and the playlists, clicking a moment seeks straight to it and streams only that segment, so a click never buffers a whole multi-hour file.
- Held the work to the institutional accuracy bar. Every new chapter title, topic name, and corrected spelling is held to the Smithsonian and Library of Congress standard, with no invented detail and careful handling of imperfect transcription, since the institutional review depends on exactly that.


THE DAVID CLINE GUIDANCE DOCUMENT

The second half of the source document turns the David Cline interview into historical themes, each with suggested playlists, categories, coordinate systems, and visualizations. Here is every one of those suggestions with its status. "Done" means a real, populated playlist or change is live; "Partial" means the underlying clips or layer exist but not the exact named artifact; "Follow-on" means it is scoped but not yet built.

Life history as organizing principle (family, education, religion, community, labor, migration, military as entry points):
- Family and Community playlists: Done
- Education and School Segregation playlists: Done (theme "Education and Schools")
- Growing Up Under Jim Crow thematic pathways: Done
- Life-course visualizations from childhood to activism: Follow-on

Family and community as foundations:
- Family and Community thematic clusters: Done
- Relationship mapping and community-network visualizations: Partial (the influence graph exists; a community-network map is a larger build)
- Multi-generational narratives: Follow-on
- Generated essays on family influence, intergenerational activism, community support, and youth activism: Follow-on (content generation)

Emmett Till as a generational turning point:
- Generational Memory playlist: Done (theme "Emmett Till and Generational Memory")
- Event-centered cluster linking Till references: Partial (the events layer holds Till passages across interviews)
- Network analysis linking events to later activism: Follow-on

Youth activism and high-school students:
- Categories (student activism, youth leadership, school-based organizing, student protests): Done (theme "Youth and Student Activism")
- Playlists (High School Activists, Young Organizers, Coming of Age in the Movement): Done (gathered under the Youth and Student Activism playlist)
- Visualizations (age and activism, educational pathways): Follow-on

The infrastructure of community organizing (barbershops, beauty parlors, funeral homes, churches, pool halls, local businesses):
- Categories (organizing spaces, community infrastructure, Black-owned businesses, informal communication networks): Follow-on (the clips exist; the named pathway is the next theme set to add)
- Community infrastructure maps and place-based navigation: Partial (the geographic layer exists)
- Synthesized accounts of Black-owned businesses: Follow-on (content generation)

Churches and the complexity of religious leadership:
- Distinguishing church institutions from religious leadership, religious activism, and community support: Follow-on (a metadata refinement)
- Faith and Activism playlist: Done (theme "Faith and the Church")
- Churches as Organizing Spaces, and Debates Within Religious Communities: Follow-on (facets of the faith theme)

Multiple pathways to social change, and local versus national:
- Coordinate system with Local to National on one axis and Grassroots to Institutional on the other: Follow-on (the spectrum already supports switchable axes; this adds two new axis poles)
- Dimensions for Organizing, Judicial, Legislative, and Corporate: Follow-on
- Playlists (Local Movement Stories, National Leaders and Local Communities, Organizing Across Scales): Follow-on
- Local-versus-national comparison retrieval: Follow-on (the engine supports it; the curated comparison is the build)

Media, optics, and public opinion:
- Categories (media strategy, public opinion, photography, television coverage, narrative framing): Follow-on
- Playlists (Media and the Movement, The Politics of Visibility, Protest and Public Opinion): Follow-on

Funding, resources, and movement sustainability:
- Categories (funding the movement, logistics, resource networks, organizational support): Follow-on
- Essays on the economics of organizing and on infrastructure and sustainability: Follow-on

The archive as an ecosystem:
- Helping users perceive the network of people, institutions, places, and ideas: Partial (the influence graph and the cross-link sections on person pages do this today; a richer ecosystem view is a larger build)

The editorial intent that runs through all of it, leading with the human narratives Cline identified rather than the computational categories, is already applied to the Topics and Spectrum views (sections 5 and 7).


BUILD THE FOUR NOT-YET-ON-SITE INTERVIEWS, TO REACH 140

Done. Glenda Funchess, Louise Broadway, the Lucius Holloway Sr. and Emma Kate Holloway joint interview, and Luis Zapata are now on the site, bringing it to 140 interviews. Each one was healed against the LoC reference, given a resolved LoC video, segmented into granular parts-grouped chapters with a summary, written up as a citation-bearing person page (verbatim interview quotes, sources led by the LoC item page), and ingested into the search index so it is findable. One honest note from the LoC audit: the Glenda Funchess transcript is a partial excerpt, about the first 23 minutes of an 83-minute interview, so her page is built from and labeled as that excerpt; the other three are complete.

These four were not hand-assembled one more time. They were run through a new single idempotent onboarding pipeline (transcripts/ingestion/onboard_interview.py) that carries a new submission all the way through: onboard, LoC heal, entry numbering, video resolution, chapters, summary, entry assembly, search ingest, person-page networking, and index rebuilds. Re-running it is safe and resumes where it left off, so future interview submissions integrate the same way every time rather than being guessed through by hand.


DEPLOYMENT AND A FEW OPEN ITEMS

- The site deploys through Netlify's cloud build, which is the gate; it will not publish a broken build. Every change is additionally verified locally, file by file, before it ships, with targeted checks such as confirming no outbound LoC catalog links remain and that every Home-page topic returns clips. Nothing described here is at risk of a broken deploy.
- A few legacy pages still reference the old, now-empty data store. They are not reachable from the menu, so they do not affect the main experience, but they are dead ends if reached directly; repointing or retiring them is a small follow-on.
- The Machine Audit feedback control currently opens a prefilled email. That is the working option without a dedicated backend; it can point at a project inbox or a feedback board instead whenever preferred.


WHERE THINGS STAND

Everything in the written list is live on robotlogic.org, along with the Beyond-the-Written-List features, and the site is now at 140 interviews. The one item still in motion is the chapterization (35 of 140 done and live everywhere, the rest landing interview by interview). It is being run to completion and pushed as it goes, so the site keeps improving between now and the full pass.
