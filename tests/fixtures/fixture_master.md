# Fixture master MD for apply_corrections tests

A trimmed-down version of CLEANED_TRANSCRIPTS_REVIEW.md containing two fixture
entries so the test fixtures can exercise parsing, classification, substitution,
SRT/VTT timestamp preservation, idempotency, and the Pass-3 override path.

## Cross-corpus recurring error patterns

(This catalog section is intentionally minimal in the fixture; the script ignores
catalog tables because they don't carry an entry number.)

---

### 1. Test Entry One

**Source**: `transcripts/raw/test_entry_one_interview/`
**Interviewer / Date**: Tester, 2026-05-22, fixture-land
**Subject**: A miniaturized Aaron-Dixon-style transcript used to exercise the
high-confidence substitution path, the speaker-originating pending-context path,
the SRT/VTT timestamp-preservation path, and the Pass-3 confidence-override path.

#### Pass 1 corrections (2026-05-22)

| #   | Span as Whisper-transcribed   | Suggested correction          | Confidence | Source              | Surrounding context                                            |
|-----|-------------------------------|-------------------------------|------------|---------------------|----------------------------------------------------------------|
| 1.1 | Southern Oil History Program  | Southern Oral History Program | high       | phonetic+canonical  | "the Southern Oil History Program at UNC Chapel Hill"          |
| 1.2 | Stokeley Carmichael           | Stokely Carmichael            | medium     | canonical-alias     | "We talked about Stokeley Carmichael" (Pass 3 promotes to high)|
| 1.3 | H. Rat Brown                  | H. Rap Brown                  | high       | canonical           | "the H. Rat Brown story"                                       |
| 1.4 | Walter Concrite               | Walter Cronkite               | high       | canonical-alias     | "Walter Concrite when Margaret the King was assassinated"      |
| 1.5 | Margaret the King             | Martin Luther King            | high       | canonical-alias     | Same passage as 1.4                                            |
| 1.6 | Foreman / James Foreman       | James Forman                  | high       | canonical-alias     | Speaker says "James Foreman" but canonical is "James Forman"   |
| 1.7 | Bobby Seale                   | Bobby Seale                   | correct    | canonical           | No change needed; already canonical                            |
| 1.8 | Aaron Dixon                   | Aaron Dixon                   | speaker-originating | n/a        | Speaker's own name; pending only                               |
| 1.9 | Reverend Avenue               | Reverend Abernathy            | medium     | Stage-3 LLM         | Not in this transcript; pending only (lives in #2)             |

- **Status**: Pass 1 complete. Awaiting Pass 2.

#### Pass 3 consolidation (2026-05-22)

**Confidence resolutions:**

| Original row | Old confidence | New confidence | Resolution notes |
|---|---|---|---|
| 1.2 Stokeley Carmichael -> Stokely Carmichael | medium | high | One-character variant; canonical spelling per facts.json. |

**Audit-complete marker**: Pass 3 complete on entry #1 as of 2026-05-22.

---

### 2. Test Entry Two

**Source**: `transcripts/raw/test_entry_two_interview/`
**Subject**: A second entry to make sure the parser handles multiple entries in
the same MD.

#### Pass 1 corrections (2026-05-22)

| #   | Span as Whisper-transcribed | Suggested correction | Confidence | Source        | Surrounding context |
|-----|-----------------------------|----------------------|------------|---------------|---------------------|
| 2.1 | Reverend Avenue             | Reverend Abernathy   | high       | canonical     | "Reverend Avenue gave the eulogy" |
| 2.2 | Mama King                   | Alberta Williams King| medium     | canonical     | "led by Mama King and Bobby Seale" |
| 2.3 | Coretta King                | Coretta Scott King   | high       | canonical     | "Coretta King attended the service" |

- **Status**: Pass 1 complete.

---
