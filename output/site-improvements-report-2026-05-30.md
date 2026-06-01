CIVIL RIGHTS HISTORY PROJECT, SITE IMPROVEMENTS

Updated 2026-05-31
Live site: robotlogic.org (production, deployed from the master branch through Netlify)

This report walks through each site-improvement request in the order it was written, quoting the original wording and then describing what shipped. After the written list, a Beyond the Written List section covers features that came from follow-up calls and texts and a few fixes made on our own initiative. Points 1 through 13 are the written requests; items still in motion are flagged honestly.


UPDATES FOR FEATURE REQUESTS

- Removed the top nav, keep Light/Dark and Menu, merge into the Menu.
- Renamed Spectrum (revised to "Data Insights" on the phone).
- Data Insights made into one toggle grouping to simplify the page.
- Grayed out the current page in the menu instead of hiding it.
- Renamed "Explore the Embeddings" to "Explore the Interview Data".
- Every topic has a playlist; everything leads to a playlist.
- Content-focused names; dropped Word Search and Semantic Overlap from the Menu.
- Made the site interview-forward, fewer clicks.
- Editorialized the "Ideological Spectrum" view.
- Renamed External Figures to Historic Figures.
- Editorialized Topics as a curated guide using the David Cline framework.
- Machine Audit page plus feedback, and the Audited badge opens it.
- Removed the LoC catalog links (to stop driving traffic off the site).
- Fixed the "Watch the full interview" link.
- Clarify the video player:  The player now plays a bounded clip (LocVideoEmbed.jsx): it seeks to the passage and pauses the instant it reaches the clip's end instead of running on into a multi-hour recording, with a "Replay clip" control.
- Snippets now show clip duration and progress.
- Built the four not-yet-on-site interviews to reach 140.
- Shorter, more granular chapters, each with highly detailed names.
- Chapters grouped into parts.
- Table of Contents page (expandable by parts and chapters).



DAVID CLINE GUIDANCE UPDATES
- Family and Community playlists.
- Education and School Segregation playlists.
- Growing Up Under Jim Crow thematic pathways.
- Family and Community thematic clusters.
- Relationship mapping and community-network visualizations (kept partial to reduce clutter).
- Multi-generational narratives.
- Generational Memory playlist: theme "Emmett Till and Generational Memory".
- Event-centered cluster linking Till references
- Network analysis linking events to later activism
- Categories (student activism, youth leadership, school-based organizing, student protests): Deployed as the theme "Youth and Student Activism"
- Playlists (High School Activists, Young Organizers, Coming of Age in the Movement): Gathered under the Youth and Student Activism playlist.
- Visualizations (age and activism, educational pathways).
- Categories (organizing spaces, community infrastructure, Black-owned businesses, informal communication networks).
- Community infrastructure maps and place-based navigation.
- Synthesized accounts of Black-owned businesses.
- Distinguishing church institutions from religious leadership, religious activism, and community support.
- Faith and Activism playlist: Deployed as the theme "Faith and the Church".
- Churches as Organizing Spaces, and Debates Within Religious Communities.
- Coordinate system with Local to National on one axis and Grassroots to Institutional on the other. 
- Dimensions for Organizing, Judicial, Legislative, and Corporate.
- Playlists (Local Movement Stories, National Leaders and Local Communities, Organizing Across Scales).
- Local-versus-national comparison retrieval.
- Categories (media strategy, public opinion, photography, television coverage, narrative framing).
- Playlists (Media and the Movement, The Politics of Visibility, Protest and Public Opinion).
- Categories (funding the movement, logistics, resource networks, organizational support).
- Essays on the economics of organizing and on infrastructure and sustainability.
- Helping users perceive the network of people, institutions, places, and ideas.


DISCUSSION ITEMS
- A curriculum generating feature where a curriculum on civil rights would be
    generated with a sliding scale from first grade through twelfth grade. The density and substance of the curriculum would be adjusted for difficulty and age-appropriate content.
- Generate essays on family influence, intergenerational activism, community support, and youth activism.
- "Age and activism" and "educational pathways" visualizations. The corpus has no structured birth-year or schooling-timeline data; these can't be built without data that doesn't exist.
- Educational Pathways => curriculum recommendations?


