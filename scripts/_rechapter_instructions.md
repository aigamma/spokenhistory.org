# Re-chapterization instructions (Civil Rights History Project)

You are re-chapterizing ONE oral history interview for the Civil Rights History
Project, a Library of Congress / Smithsonian NMAAHC archive. The quality bar is
Smithsonian-grade publication: ZERO hallucination. Every word you write must be
supported by the transcript.

The orchestrator gives you your ENTRY NUMBER (N) and the interviewee NAME.
Wherever this file says <N>, use your entry number.

## Step 1 - Read the transcript
Read the entire file scripts/blocks_<N>.txt. It is the complete interview
transcript, segmented into ~40-second blocks formatted "[i] HH:MM:SS | spoken
text". The [i] is the block index. Read every block; this is the actual content
you are chaptering.

## Step 2 - Study the gold standard
Read scripts/spec_34.json (the Ekwueme Michael Thelwell interview). That is the
exact JSON format and the quality bar. Notice: each chapter is ONE coherent
topic; titles are vivid and specific to the content (not generic labels); part
names are evocative and track the interview's narrative arc; summaries are richly
specific and grounded in what is actually said.

## Step 3 - Author scripts/spec_<N>.json
An ordered JSON array of chapter objects covering blocks 0..LAST with NO gaps and
NO overlaps: chapter k's end_block + 1 = chapter k+1's start_block; the first
chapter starts at block 0; the last ends at the final block index. Each object:

    {
      "start_block": int,
      "end_block": int,
      "part": "..."        (ONLY on the first chapter of each part; omit otherwise)
      "title": "...",
      "topic": "...",
      "summary": "...",
      "main_topic_category": "...",
      "keywords": ["...", "..."],
      "related_events": ["..."]
    }

## Rules

CHAPTER LENGTH (read this twice). Target 2 to 4 minutes per chapter, which is
roughly 3 to 6 of the ~40-second blocks. This is a real target, not a loose
suggestion. As a rule of thumb your total chapter count should land near
(number of blocks / 4) to (number of blocks / 5). Do NOT chop the interview into
many 1-block or 2-block slivers. If a topic occupies only a block or two, FOLD it
into the adjacent chapter under a slightly broader title rather than making a
sub-90-second chapter. Reserve a short chapter (under ~2 minutes) only for a
genuinely distinct, self-contained moment that would be diminished by merging. A
continuous subject that runs 7 or 8 blocks stays ONE chapter. Erring slightly
long is fine; erring short is not.

TOPIC-ISOLATED, NOT CLOCK-SLICED. Within that length target, place each break
where the SUBJECT changes, never at an arbitrary clock mark. Never split one
continuous story across two chapters, and never merge two genuinely unrelated
topics into one.

title: a specific, vivid chapter name drawn from THIS interview, a concrete
phrase, image, name, or line from the passage (see how spec_34 uses "He Told
Them to Kiss His Behind", "Kittens in an Oven"). Title Case. Detailed, not
generic (write "A Two-Room School in Sunflower County", never just "Childhood").

topic: a short subject heading, 3 to 6 words, naming what the chapter is about.

summary: one or two sentences, richly specific to what is actually said (real
names, places, events), no invention, no editorializing adjectives like
"influential" or "tragic".

part: group consecutive chapters into named narrative arcs. Set "part" ONLY on
the first chapter of each arc, with an evocative, thoughtful Title Case name that
tracks the interview's real movement (childhood, movement entry, a specific
campaign, later life, reflection). Roughly 4 to 10 chapters per part. Part names
must be as thoughtful as the chapter titles.

main_topic_category: EXACTLY one of these 12, verbatim: Early Life, Family
History, Education, Geographic Context, Religious Foundations, Movement Entry,
Major Campaign, Political Analysis, Legal Work, Post-Movement Career, Personal
Reflection, Music & Culture.

keywords: 3 to 5 specific terms from the passage.

related_events: named historical events explicitly discussed (for example
"Mississippi Freedom Summer", "Selma to Montgomery marches", "Freedom Rides");
[] if none.

ACCURACY: this is Whisper-derived text and may contain mis-heard names. If a name
or word is clearly garbled or you are unsure, GENERALIZE (describe the role or
place) rather than guessing a specific spelling. Never invent a fact, date, name,
or event not present in the blocks.

NO EM DASHES (the U+2014 character) anywhere in your output. Use commas, colons,
semicolons, periods, or parentheses. En dashes for numeric ranges are fine.

RECORDING RESTARTS: if the transcript shows a near-verbatim repeat of an earlier
stretch (the recording stopped and restarted, the speaker re-told a passage),
collapse that repeated span into a single chapter whose title notes the recording
resumed, rather than duplicating chapters.

## Step 4 - Validate
Run: python scripts/expand_chapters.py <N>
If it prints FAIL (gap/overlap/coverage), fix scripts/spec_<N>.json and re-run
until it prints "entry <N>: wrote K chapters covering blocks 0..LAST".
Sanity-check K against the rule of thumb above (blocks/4 to blocks/5). If K is far
higher, you over-segmented: merge the slivers and re-run.

## Step 5 - Report back
Your final message, raw, no preamble: entry number; total chapters; number of
distinct parts and the list of part names; any spans you collapsed as
recording-restarts; any names you generalized due to Whisper uncertainty; and
confirmation that expand_chapters.py passed. Your final text is data for the
orchestrator, not a human message.
