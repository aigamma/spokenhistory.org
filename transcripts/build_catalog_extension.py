#!/usr/bin/env python3
"""
Phase 1b: Aggregate Pass-3 "missed-pattern catches" entries from all 127
staging files in transcripts/pass3_stage/, deduplicate, rank by recurrence,
categorize against the existing catalog sections A-I, and append a new
back-fill subsection to transcripts/CLEANED_TRANSCRIPTS_REVIEW.md.

Re-runnable: deletes its previous output block (between the two sentinel
comments) before re-emitting. Does NOT modify the existing A-I sections
or any per-entry tables.

Run:
    python D:/civil/transcripts/build_catalog_extension.py

Inputs:
    D:/civil/transcripts/pass3_stage/entry_*.md
Outputs:
    Appends a "Cross-corpus catalog - Phase 1b back-fill extension" subsection
    to D:/civil/transcripts/CLEANED_TRANSCRIPTS_REVIEW.md, inserted between
    section I and the "---" / Progress Tracker that follows.
"""
from __future__ import annotations

import re
from collections import defaultdict
from pathlib import Path

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
ROOT = Path(r"D:/civil/transcripts")
STAGE_DIR = ROOT / "pass3_stage"
MASTER_MD = ROOT / "CLEANED_TRANSCRIPTS_REVIEW.md"

# Markers around the auto-generated block so the script is idempotent / re-runnable.
BEGIN_MARK = "<!-- BEGIN: phase1b-backfill-extension (auto-generated; do not edit) -->"
END_MARK = "<!-- END: phase1b-backfill-extension -->"

# The block is inserted after Section I and before the "---" separator that
# precedes the Progress Tracker. We anchor on the unique "## Progress Tracker"
# header which immediately follows the "---" line.
PROGRESS_TRACKER_HEADER = "## Progress Tracker"

# ---------------------------------------------------------------------------
# Extraction
# ---------------------------------------------------------------------------
SECTION_RE = re.compile(
    r"\*\*Pass 3 missed-pattern catches:\*\*\s*\n+(\|[^\n]+\|\n)+",
    re.MULTILINE,
)


def extract_pass3_catches_block(text: str) -> str | None:
    """Return the slice of `text` containing the 'Pass 3 missed-pattern catches'
    section's markdown table, or None if not present / empty.
    """
    idx = text.find("**Pass 3 missed-pattern catches:**")
    if idx < 0:
        return None
    # Slice from the header to the next bold sub-heading or end of file.
    after = text[idx + len("**Pass 3 missed-pattern catches:**"):]
    # Stop at the next "**" bold header or "####" sub-heading or end-of-file.
    stop = len(after)
    for marker in ("\n**", "\n####", "\n---"):
        j = after.find(marker)
        if j >= 0 and j < stop:
            stop = j
    return after[:stop]


# Row regex: pipes-delimited markdown row with 6 cells (plus leading + trailing
# empty cells). We use a permissive split.
def parse_rows(block: str) -> list[dict]:
    rows = []
    for line in block.splitlines():
        line = line.strip()
        if not line.startswith("|"):
            continue
        if set(line.replace("|", "").replace("-", "").strip()) == set():
            # separator row of dashes
            continue
        # Header row detection: first cell == "#"
        cells = [c.strip() for c in line.strip("|").split("|")]
        # Drop column-divider rows
        if all(set(c) <= set("-: ") for c in cells):
            continue
        # Skip the header itself
        if cells and cells[0] in {"#", "# "}:
            continue
        # Need at least 6 fields: #, Span, Correction, Confidence, Source, Context
        if len(cells) < 6:
            continue
        rows.append(
            {
                "id": cells[0],
                "span": cells[1],
                "correction": cells[2],
                "confidence": cells[3],
                "source": cells[4],
                "context": "|".join(cells[5:]).strip(),  # context may contain pipes
            }
        )
    return rows


def entry_id_from_filename(path: Path) -> str:
    m = re.match(r"entry_(\d+)\.md$", path.name)
    return m.group(1) if m else path.stem


# ---------------------------------------------------------------------------
# Normalization for deduplication
# ---------------------------------------------------------------------------
# Strip parentheticals, role notes, "(see ...)", "(SCLC)" etc. for the dedup key.
PAREN_RE = re.compile(r"\s*\([^)]*\)")
PUNCT_RE = re.compile(r"[\.,;:'\"`/\\]")
WS_RE = re.compile(r"\s+")


def normalize_correction(s: str) -> str:
    """Produce a normalized dedup key from a canonical-correction string."""
    t = s.lower()
    # Strip trailing "(catalog #X entry)" / "(see ...)" / role notes etc.
    t = PAREN_RE.sub("", t)
    # Strip italics / bold markdown.
    t = t.replace("*", "").replace("_", "")
    t = t.replace("—", "-").replace("–", "-")
    t = t.replace("&", "and")
    t = PUNCT_RE.sub("", t)
    t = WS_RE.sub(" ", t).strip()
    # Strip trailing role / qualifier phrases on a canonical noun-name key.
    # E.g. "stokely carmichael " stays as is. Trailing dangling 'jr', 'sr', 'iii' kept.
    # Common stop-words on canonical noun phrases (light-touch, do not over-merge).
    for stop in (
        "the ",
        "a ",
        "an ",
    ):
        if t.startswith(stop):
            t = t[len(stop):]
    # Drop trailing "rendering / pattern / catalog #x entry" tails that are
    # decoration on a canonical-form noun phrase.
    for tail in (
        " rendering",
        " pattern",
        " catalog entry",
        " catalog row",
    ):
        if t.endswith(tail):
            t = t[: -len(tail)]
    t = WS_RE.sub(" ", t).strip()
    return t


# ---------------------------------------------------------------------------
# Category routing
# ---------------------------------------------------------------------------
# We bucket each correction into one of the catalog sections A-I plus new
# sections we propose: J (publications/media), K (military terminology),
# L (institutional / academic / labor terms), M (Pan-African + international),
# N (foreign-language + Spanish-context Whisper substitutions),
# O (musicians + cultural figures), P (catalog meta / cross-entry patterns).
#
# A correction is routed to a section by keyword matching against a curated
# dictionary of canonical surface forms; the first matching section wins.
# When nothing matches, we route to a catch-all "Unsorted" bucket which the
# caller can hand-curate. In practice the unsorted bucket is small.

# Section A: interview-team / interviewer / videographer names
A_KEYWORDS = {
    "joe mosnier",
    "mosnier",
    "southern oral history",
    "sohp",
    "university of north carolina at chapel hill",
    "unc chapel hill",
    "chapel hill",
    "guha shankar",
    "shankar",
    "john bishop",
    "videographer",
    "emilye crosby",
    "crosby",
    "john dittmer",
    "dittmer",
    "david cline",
    "cline",
}

# Section B: civil rights organizations + federal agencies
B_KEYWORDS = {
    "sncc",
    "student nonviolent",
    "sclc",
    "southern christian leadership",
    "core",
    "congress of racial equality",
    "naacp",
    "ldf",
    "legal defense",
    "cofo",
    "nag",
    "nonviolent action group",
    "cointelpro",
    "fbi",
    "huac",
    "house un-american",
    "deacons for defense",
    "tougaloo nine",
    "friendship nine",
    "mfdp",
    "mississippi freedom democratic",
    "amsac",
    "ku klux klan",
    "klan",
    "kkk",
    "white citizens council",
    "citizens council",
    "white citizens' council",
    "freedom rides",
    "freedom riders",
    "fbi counterintelligence",
    "uaw",
    "afl-cio",
    "u.s. department",
    "us department",
    "us justice department",
    "justice department",
    "civil rights division",
    "rcp",
    "revolutionary union",
    "communist party",
    "young communist",
    "labor union",
    "voters league",
    "voting rights",
    "selective service",
    "department of defense",
    "armed services",
    "department of education",
    "head start",
    "ofo - the organization",
    "operation push",
    "rainbow coalition",
    "city council",
    "school board",
    "selma improvement",
    "highlander",
    "council of federated",
}

# Section C: SNCC/SCLC/BPP/NAACP canonical figures (mainline Movement era)
C_KEYWORDS = {
    "martin luther king",
    "dr. king",
    "mlk",
    "malcolm x",
    "rosa parks",
    "ella baker",
    "fannie lou hamer",
    "bayard rustin",
    "bob moses",
    "robert moses",
    "stokely carmichael",
    "kwame ture",
    "james forman",
    "bobby seale",
    "huey newton",
    "huey p. newton",
    "diane nash",
    "andrew young",
    "andy young",
    "hosea williams",
    "septima clark",
    "esau jenkins",
    "myles horton",
    "bernice robinson",
    "bull connor",
    "medgar evers",
    "cleveland sellers",
    "cleve sellers",
    "ruby doris",
    "ruby doris smith",
    "ruby doris robinson",
    "amzie moore",
    "hartman turnbow",
    "charles cobb",
    "charlie cobb",
    "ivanhoe donaldson",
    "muriel tillinghast",
    "mary lovelace",
    "tom kahn",
    "mendy samstein",
    "hank thomas",
    "dinky forman",
    "constance romilly",
    "liz sutherland",
    "elizabeth sutherland",
    "betita martinez",
    "maria varela",
    "danny lyon",
    "zoharah simmons",
    "gwendolyn zoharah",
    "bernice johnson reagon",
    "adam clayton powell",
    "rabbi feibelman",
    "father fichter",
    "casey hayden",
    "hollis watkins",
    "lawrence guyot",
    "annie devine",
    "aaron henry",
    "h. rap brown",
    "rap brown",
    "jamil al-amin",
    "courtland cox",
    "judy richardson",
    "joyce ladner",
    "dorie ladner",
    "ladner",
    "annelle ponder",
    "willie peacock",
    "wazir peacock",
    "sam block",
    "willie ricks",
    "mukasa dada",
    "ralph featherstone",
    "matt jones",
    "marion barry",
    "john lewis",
    "julian bond",
    "ruby sales",
    "jonathan daniels",
    "ben chaney",
    "andrew goodman",
    "michael schwerner",
    "mickey schwerner",
    "james chaney",
    "viola liuzzo",
    "james reeb",
    "wyatt tee walker",
    "wyatt walker",
    "shuttlesworth",
    "fred shuttlesworth",
    "abernathy",
    "ralph abernathy",
    "juanita abernathy",
    "coretta scott king",
    "coretta king",
    "dorothy cotton",
    "andrew goodman",
    "kathleen cleaver",
    "stanley levison",
    "stan levison",
    "a. philip randolph",
    "philip randolph",
    "freddie greene",
    "lonnie king",
    "gwen patton",
    "gwendolyn patton",
    "mateo camarillo",
    "matthew perry",
    "robert g. clark",
    "robert clark",
    "robert l. carter",
    "robert carter",
    "constance baker motley",
    "constance motley",
    "thurgood marshall",
    "spottswood robinson",
    "jack greenberg",
    "charles hamilton houston",
    "noel dowling",
    "rita schwerner",
    "fannie chaney",
    "owen brooks",
    "victoria gray adams",
    "mae bertha carter",
    "unita blackwell",
    "modjeska simkins",
    "lillian smith",
    "anne braden",
    "carl braden",
    "virginia durr",
    "myles horton",
    "joanne grant",
    "wesley brown",
    "wally nelson",
    "wallace nelson",
    "rabbi heschel",
    "abraham joshua heschel",
    "septima clark",
    "ron carter",
    "fred gray",
    "z. alexander",
    "z. alexander looby",
    "william kunstler",
    "kunstler",
    "tom hayden",
    "sds",
    "students for a democratic society",
    "vincent harding",
    "albert lutuli",
    "samora machel",
    "kwame nkrumah",
    "nkrumah",
    "patrice lumumba",
    "frelimo",
    "anc",
    "ujamaa",
    "panafricanism",
    "pan-africanism",
    "negritude",
    "harriet tubman",
    "frederick douglass",
    "sojourner truth",
    "phillis wheatley",
    "henry highland",
    "marcus garvey",
    "garvey",
    "unia",
    "harlem renaissance",
    "harlem writers guild",
    "langston hughes",
    "alain locke",
    "claude mckay",
    "lorraine hansberry",
    "richard wright",
    "james baldwin",
    "amiri baraka",
    "leroi jones",
    "sonia sanchez",
    "nikki giovanni",
    "audre lorde",
    "amy ashwood garvey",
    "amy jacques garvey",
    "ida wells",
    "ida b. wells",
    "anna julia cooper",
    "mary church terrell",
    "mary mcleod bethune",
    "dorothy height",
    "septima clark",
    "lugenia burns hope",
    "nannie helen burroughs",
    "pauli murray",
    "highlander folk school",
    "highlander research",
    "jane stembridge",
    "constance curry",
    "casey hayden",
    "mary king",
    "sandra cason",
    "dottie zellner",
    "dorothy zellner",
    "bob zellner",
    "anne moody",
}

# Section D: Black Panther Party + Black Power era (true BPP / Black-Power-only)
# Figures who later became BPP but whose primary catalog home is SNCC/SCLC
# (Stokely Carmichael, Kwame Ture, H. Rap Brown) are routed to Section C above.
D_KEYWORDS = {
    "black panther party",
    "black panthers",
    "bpp",
    "eldridge cleaver",
    "kathleen cleaver",
    "kathleen neal cleaver",
    "huey newton",
    "huey p. newton",
    "huey p newton",
    "bobby seale",
    "geronimo pratt",
    "geronimo ji jaga",
    "geronimo ji-jaga",
    "elmer pratt",
    "elmer geronimo",
    "bunchy carter",
    "alprentice carter",
    "fred hampton",
    "mark clark",
    "ericka huggins",
    "john huggins",
    "elaine brown",
    "audrea jones",
    "audrea dunham",
    "bobby hutton",
    "lil bobby hutton",
    "emory douglas",
    "david hilliard",
    "wilson riles",
    "barbara easley",
    "afeni shakur",
    "tupac shakur",
    "assata shakur",
    "joanne chesimard",
    "mumia abu-jamal",
    "george jackson",
    "jonathan jackson",
    "donald defreeze",
    "symbionese",
    "lowndes county freedom organization",
    "lcfo",
    "us organization",
    "ron karenga",
    "maulana karenga",
    "kwanzaa",
    "republic of new africa",
    "imari obadele",
    "queen mother moore",
    "audley moore",
    "blackstone rangers",
    "black p. stones",
    "mao zedong",
    "mao tse-tung",
    "che guevara",
    "ho chi minh",
    "fidel castro",
    "free huey",
    "all power to the people",
    "off the pig",
    "panther 21",
    "new york 21",
    "panther twenty-one",
    "ten point program",
    "ten-point platform",
    "10 point program",
    "minister of information",
    "minister of defense",
    "minister of culture",
    "minister of justice",
    "chief of staff",
    "stephen shames",
    "kingman brewster",
    "bert schneider",
    "weather underground",
    "weatherman",
    "bernardine dohrn",
    "bill ayers",
    "kathy boudin",
    "young lords",
    "yippies",
    "abbie hoffman",
    "jerry rubin",
    "chicago seven",
    "chicago 7",
    "chicago eight",
    "the black panther newspaper",
    "the black panther (newspaper)",
    "robert avakian",
    "avakian",
    "herbert aptheker",
    "bettina aptheker",
    "aptheker",
    "carol watanabe",
    "charles bursey",
    "soledad brother",
    "us united slaves",
    "us united-slaves",
    "h. rap brown",
    "rap brown",
}

# Section E: Pre-Movement-era and supporting figures
E_KEYWORDS = {
    "w.e.b. du bois",
    "du bois",
    "dubois",
    "ida b. wells",
    "pauli murray",
    "dorothy height",
    "mary mcleod bethune",
    "mary church terrell",
    "anna julia cooper",
    "ida wells",
    "george washington carver",
    "george w. carver",
    "carver",
    "john killens",
    "john oliver killens",
    "frank yerby",
    "chinua achebe",
    "achebe",
    "tom mboya",
    "kenneth kaunda",
    "kaunda",
    "george lincoln rockwell",
    "lincoln rockwell",
    "norman thomas",
    "n.r. burger",
    "nathaniel burger",
    "j. ralph noonkester",
    "noonkester",
    "theron lynd",
    "lynd",
    "vernon dahmer",
    "dahmer",
    "clyde kennard",
    "kennard",
    "eleanor holmes",
    "ivanhoe donaldson",
    "dick gregory",
    "dennis sweeney",
    "heffner",
    "joseph fichter",
    "rabbi feibelman",
    "schomburg",
    "frederick herzberg",
    "ernst borinski",
    "george owens",
    "willa b. player",
    "robert kennedy",
    "rfk",
    "bobby kennedy",
    "lyndon johnson",
    "lbj",
    "john f. kennedy",
    "jfk",
    "kennedy",
    "humphrey",
    "hubert humphrey",
    "earl warren",
    "warren court",
    "william brennan",
    "thurgood marshall",
    "robert williams",
    "robert f. williams",
    "negroes with guns",
    "stan levison",
    "stanley levison",
    "rabbi heschel",
    "abraham heschel",
    "rabbi prinz",
    "joachim prinz",
    "anne braden",
    "carl braden",
    "virginia durr",
    "clifford durr",
    "myles horton",
    "fannie lou hamer",
    "stokely carmichael",
    "kwame ture",
    "rabbi heschel",
    "noel dowling",
    "dowling",
    "annie devine",
    "annie d. van",
    "wally nelson",
    "rosa parks",
    "claudette colvin",
    "jo ann robinson",
    "e.d. nixon",
    "raymond parks",
    "fred shuttlesworth",
    "joseph lowery",
    "william g. anderson",
    "william anderson",
    "andrew young",
    "harry belafonte",
    "belafonte",
    "ossie davis",
    "ruby dee",
    "ossie",
    "ruby",
    "sidney poitier",
    "poitier",
    "lena horne",
    "horne",
    "miriam makeba",
    "makeba",
    "harry edwards",
    "tommie smith",
    "john carlos",
    "ben caldwell",
    "wheeler parker",
    "emmett till",
    "till",
    "carolyn bryant",
    "roy bryant",
    "j.w. milam",
    "milam",
    "mamie till",
    "rita schwerner",
    "ben chaney",
    "michael schwerner",
    "andrew goodman",
    "james chaney",
    "jonathan daniels",
    "james reeb",
    "viola liuzzo",
    "lemuel penn",
    "willie edwards",
    "william moore",
    "harry t. moore",
    "harriette moore",
    "louis allen",
    "herbert lee",
    "wharlest jackson",
    "ben chester white",
    "samuel younge",
    "samuel younge jr.",
    "samuel younge, jr",
    "sammy younge",
    "crispus attucks",
    "phillis wheatley",
    "benjamin banneker",
    "richard allen",
    "absalom jones",
    "harriet tubman",
    "frederick douglass",
    "sojourner truth",
    "nat turner",
    "denmark vesey",
    "gabriel prosser",
    "frances ellen watkins harper",
    "ida b. wells",
    "booker t. washington",
    "marcus garvey",
    "amy ashwood garvey",
    "amy jacques garvey",
    "robert s. abbott",
    "carter g. woodson",
    "asa philip randolph",
    "a. philip randolph",
    "e. franklin frazier",
    "alain locke",
    "zora neale hurston",
    "harry lee",
    "fred hampton",
    "mark clark",
    "bunchy carter",
    "john huggins",
    "huey newton",
    "frederick herzberg",
    "rosenberg",
    "julius rosenberg",
    "ethel rosenberg",
    "rosenbergs",
    "morris dees",
    "joseph rauh",
    "rabbi neusner",
    "rabbi heschel",
    "ahjamu umi",
    "father groppi",
    "fr. groppi",
    "groppi",
    "bishop spottswood",
    "spottswood",
    "carl rowan",
    "louis martin",
    "vincent harding",
    "vincent",
    "alex haley",
    "haley",
    "alice walker",
    "june jordan",
    "ntozake shange",
    "shange",
    "michael harrington",
    "michael walzer",
    "walzer",
    "irving howe",
    "howe",
    "michael harrington",
    "harrington",
    "norman cousins",
    "anna arnold hedgeman",
    "septima poinsette clark",
    "wyatt tee walker",
    "wyatt walker",
    "marion barry",
}

# Section F: Geographic errors
F_KEYWORDS = {
    "mississippi",
    "alabama",
    "georgia",
    "south carolina",
    "north carolina",
    "tennessee",
    "louisiana",
    "arkansas",
    "florida",
    "virginia",
    "kentucky",
    "texas",
    "oklahoma",
    "kansas",
    "missouri",
    "maryland",
    "delaware",
    "ohio",
    "indiana",
    "illinois",
    "michigan",
    "wisconsin",
    "minnesota",
    "iowa",
    "nebraska",
    "south dakota",
    "north dakota",
    "wyoming",
    "colorado",
    "new mexico",
    "arizona",
    "nevada",
    "utah",
    "idaho",
    "montana",
    "washington",
    "oregon",
    "california",
    "alaska",
    "hawaii",
    "new york",
    "new jersey",
    "pennsylvania",
    "connecticut",
    "massachusetts",
    "rhode island",
    "vermont",
    "new hampshire",
    "maine",
    "hattiesburg",
    "tougaloo",
    "goldsboro",
    "petersburg",
    "cumberland",
    "danville",
    "greenwood",
    "itta bena",
    "mound bayou",
    "bessemer",
    "hayneville",
    "pocahontas",
    "williamsbridge",
    "bangor",
    "oaxaca",
    "monrovia",
    "chattanooga",
    "madrona",
    "yesler",
    "edmund pettus",
    "pettus bridge",
    "soledad",
    "tombs",
    "manhattan detention",
    "camp lee",
    "fort lee",
    "grand rapids",
    "mount carmel",
    "16th street baptist",
    "sixteenth street baptist",
    "mccomb",
    "atlantic city",
    "rock hill",
    "sumter",
    "lynch street",
    "beaumont",
    "richton",
    "mclain",
    "mclaurin",
    "lowndes",
    "greene county",
    "ruleville",
    "clarksdale",
    "berclair",
    "brownsville",
    "selma",
    "montgomery",
    "birmingham",
    "tuskegee",
    "auburn",
    "anniston",
    "decatur",
    "huntsville",
    "mobile",
    "jackson",
    "vicksburg",
    "natchez",
    "biloxi",
    "gulfport",
    "meridian",
    "columbus",
    "starkville",
    "oxford",
    "philadelphia, mississippi",
    "neshoba",
    "leflore",
    "leflore county",
    "sunflower county",
    "winona",
    "indianola",
    "moss point",
    "greenville",
    "yazoo",
    "marks",
    "drew",
    "shaw",
    "rosedale",
    "cleveland, mississippi",
    "raymond",
    "canton",
    "lexington",
    "carthage",
    "kosciusko",
    "tallahatchie",
    "money, mississippi",
    "money",
    "sumner",
    "rolling fork",
    "greenville, south carolina",
    "spartanburg",
    "columbia",
    "charleston",
    "orangeburg",
    "denmark",
    "sumter",
    "savannah",
    "atlanta",
    "albany",
    "americus",
    "macon",
    "augusta",
    "athens",
    "valdosta",
    "fort valley",
    "vidalia",
    "lagrange",
    "talbot",
    "tougaloo college",
    "rust college",
    "alcorn",
    "alcorn state",
    "miles college",
    "stillman college",
    "talladega college",
    "fisk",
    "fisk university",
    "howard university",
    "howard",
    "morehouse",
    "spelman",
    "clark atlanta",
    "atlanta university",
    "south carolina state",
    "south carolina state university",
    "scsu",
    "claflin",
    "benedict",
    "voorhees",
    "morris college",
    "savannah state",
    "albany state",
    "fort valley state",
    "north carolina central",
    "norfolk state",
    "virginia state",
    "virginia union",
    "hampton",
    "winston-salem state",
    "elizabeth city state",
    "shaw university",
    "shaw",
    "saint augustine",
    "saint augustine's",
    "bennett college",
    "bennett",
    "tennessee state",
    "knoxville college",
    "lemoyne-owen",
    "lemoyne",
    "philander smith",
    "arkansas baptist",
    "alabama state",
    "alabama a&m",
    "selma university",
    "concordia college",
    "miles college",
    "stillman",
    "lincoln university",
    "lincoln u",
    "central state",
    "wilberforce",
    "kentucky state",
    "tuskegee university",
    "tuskegee institute",
    "alabama a and m",
    "delaware state",
    "morgan state",
    "coppin state",
    "bowie state",
    "university of mississippi",
    "ole miss",
    "university of alabama",
    "lsu",
    "louisiana state",
    "ucla",
    "university of california",
    "uc berkeley",
    "berkeley",
    "stanford",
    "harvard",
    "yale",
    "columbia",
    "columbia university",
    "princeton",
    "cornell",
    "brown university",
    "dartmouth",
    "penn",
    "university of pennsylvania",
    "mit",
    "duke",
    "duke university",
    "unc",
    "north carolina state",
    "n.c. state",
    "wake forest",
    "vanderbilt",
    "emory",
    "georgia tech",
    "georgia state",
    "florida state",
    "florida a&m",
    "famu",
    "miami",
    "city college",
    "ccny",
    "city college of new york",
    "queens college",
    "brooklyn college",
    "hunter college",
    "lehman",
    "nyu",
    "new york university",
    "barnard",
    "smith",
    "smith college",
    "mount holyoke",
    "wellesley",
    "radcliffe",
    "vassar",
    "bryn mawr",
    "spelman",
    "morehouse",
    "atlanta university",
    "florida memorial",
    "edward waters",
    "south carolina college",
    "u.s.c.",
    "u.s. constitution",
    "selma improvement",
    "freedom house",
    "freedom school",
    "freedom schools",
    "freedom riders",
    "manning marable",
    "manning",
    "freedom city",
    "delta",
    "delta ministry",
    "miss delta",
    "lowndes county",
    "lowndes",
    "wilcox county",
    "wilcox",
    "marengo county",
    "marengo",
    "perry county",
    "marion, alabama",
    "marion",
    "selma to montgomery",
    "selma-to-montgomery",
    "edmund pettus",
    "petersburg",
    "petersburg, virginia",
    "richmond",
    "richmond, virginia",
    "lynchburg",
    "norfolk",
    "newport news",
    "hampton roads",
    "alexandria",
    "arlington",
    "fairfax",
    "fredericksburg",
    "danville, virginia",
    "atlanta, georgia",
    "philadelphia, pennsylvania",
    "south jersey",
    "north jersey",
    "newark",
    "east orange",
    "trenton",
    "camden",
    "atlantic city",
    "jersey city",
    "passaic",
    "linden",
    "linden, new jersey",
    "sioux city",
    "sioux",
    "hendaye",
    "hendaia",
    "madrid",
    "spain",
    "facultad",
    "facultad de filosofía",
    "facultad de filosofia",
    "havana",
    "cuba",
    "saigon",
    "vietnam",
    "hanoi",
    "tanzania",
    "tanganyika",
    "dar es salaam",
    "dar-es-salaam",
    "nairobi",
    "kampala",
    "kinshasa",
    "leopoldville",
    "lagos",
    "accra",
    "guinea",
    "conakry",
    "dakar",
    "senegal",
    "ghana",
    "kenya",
    "south africa",
    "soweto",
    "johannesburg",
    "pretoria",
    "cape town",
    "robben island",
    "freetown",
    "monrovia",
    "haiti",
    "port-au-prince",
    "jamaica",
    "kingston",
    "trinidad",
    "guyana",
    "guiana",
    "british guiana",
    "barbados",
    "puerto rico",
    "san juan",
    "ponce",
    "vieques",
    "havana, cuba",
    "soledad, california",
    "watts",
    "watts, los angeles",
    "compton",
    "south central",
    "south l.a.",
    "boyle heights",
    "harlem",
    "bedford-stuyvesant",
    "bedford stuyvesant",
    "bed-stuy",
    "fort greene",
    "crown heights",
    "central brooklyn",
    "east new york",
    "east harlem",
    "bronx",
    "south bronx",
    "morrisania",
    "queens",
    "south jamaica",
    "st. albans",
    "saint albans",
    "harlem, new york",
    "fillmore",
    "fillmore district",
    "western addition",
    "bayview",
    "bayview-hunters point",
    "bayview hunters point",
    "hunters point",
    "oakland",
    "west oakland",
    "north oakland",
    "east oakland",
    "richmond, california",
    "san francisco",
    "berkeley",
    "south berkeley",
    "south side",
    "south side chicago",
    "west side chicago",
    "robert taylor homes",
    "robert taylor",
    "cabrini-green",
    "south austin",
    "lawndale",
    "north lawndale",
    "humboldt park",
    "logan square",
    "rogers park",
    "douglas park",
    "kenwood",
    "hyde park",
    "south shore",
    "woodlawn",
    "englewood",
    "bronzeville",
    "central district",
    "central area",
    "south seattle",
    "rainier",
    "rainier valley",
    "rainier beach",
    "leschi",
    "mount baker",
    "madison valley",
    "madison park",
    "judkins park",
    "skyway",
    "white center",
    "georgetown",
    "south park, seattle",
    "high point",
    "magnolia",
    "queen anne",
    "ballard",
    "south end",
    "sodo",
    "sodo, seattle",
    "boren",
    "first hill",
    "capitol hill",
    "downtown seattle",
    "downtown, seattle",
    "international district",
    "chinatown-international district",
    "lake city",
    "lake forest park",
    "shoreline",
    "kent",
    "renton",
    "auburn",
    "federal way",
    "burien",
    "tukwila",
    "snohomish",
    "fife",
    "milton",
    "puyallup",
    "tacoma",
    "spanaway",
    "lakewood",
    "olympia",
    "shelton",
    "bremerton",
    "kingston",
    "bainbridge",
    "everett",
    "marysville",
    "monroe",
    "snohomish county",
    "king county",
    "pierce county",
    "thurston county",
    "spokane",
    "yakima",
    "richland",
    "kennewick",
    "pasco",
    "south carolina sea islands",
    "sea islands",
    "johns island",
    "edisto",
    "wadmalaw",
    "daufuskie",
    "st. helena",
    "saint helena",
    "saint helena island",
    "beaufort",
    "beaufort, south carolina",
    "hilton head",
    "frogmore",
    "penn center",
    "penn school",
    "highlander",
    "highlander folk school",
    "highlander research and education center",
    "monteagle",
    "knoxville",
    "memphis",
    "chattanooga",
    "nashville",
    "fayetteville",
    "asheville",
    "winston-salem",
    "greensboro",
    "raleigh",
    "durham",
    "wilmington",
    "wilmington, north carolina",
    "rocky mount",
    "fayetteville, north carolina",
    "elizabeth city",
    "elizabeth city, north carolina",
    "hampton, virginia",
    "norfolk, virginia",
    "petersburg, virginia",
    "richmond, virginia",
    "lynchburg, virginia",
    "appomattox",
    "danville, virginia",
    "roanoke",
    "rocky mount, virginia",
    "martinsville",
    "danville",
    "south boston, virginia",
    "south boston",
    "boston",
    "roxbury",
    "south boston, massachusetts",
    "dorchester",
    "mattapan",
    "jamaica plain",
    "fields corner",
    "south end, boston",
    "back bay",
    "wellesley",
    "newton",
    "cambridge",
    "boston city hall",
    "boston commons",
    "boston common",
    "boston public library",
    "boston public school",
    "south boston high",
    "south boston high school",
    "south boston, massachusetts",
    "alcorn state",
}

# Section G: common-noun + idiom errors
G_KEYWORDS = {
    "wats line",
    "mimeograph",
    "memograph",
    "master race",
    "master is",
    "dashiki",
    "dashikis",
    "tarzan",
    "in extremis",
    "patulin",
    "marshall field",
    "woolworth",
    "fajita",
    "fatigue",
    "brown v. board",
    "brown vs. board",
    "brown vs board",
    "episcopal",
    "episcopalian",
    "gibson",
    "marshall field foundation",
    "the world",
    "swastika",
    "schwerner",
    "chaney",
    "schwerner chaney",
    "schwerner and chaney",
    "schwerner-chaney",
    "tougaloo nine",
    "friendship nine",
    "lillie burney",
    "earl travillion",
    "sam brinkley",
    "amanda elzy",
    "jim hill",
}

# Section H: special patterns / meta
H_KEYWORDS = {
    "homophone",
    "homophones",
    "doubled-vowel",
    "vowel doubling",
    "stress pattern",
    "cleve to slave",
    "cleveland to slave",
    "bob's owner",
    "bobs owner",
    "elon musk",
    "elam arms",
    "repetition",
    "duplication",
    "bayard",
    "by rustin",
}


# New sections we propose:
# Section J: Publications, media, periodicals, books
J_KEYWORDS = {
    "newspaper",
    "magazine",
    "berkeley barb",
    "the black panther",
    "muhammad speaks",
    "the militant",
    "village voice",
    "ramparts",
    "freedomways",
    "negro digest",
    "ebony",
    "jet",
    "amsterdam news",
    "chicago defender",
    "pittsburgh courier",
    "afro-american",
    "the crisis",
    "the messenger",
    "the southern patriot",
    "southern courier",
    "southern patriot",
    "delta democrat",
    "clarion-ledger",
    "atlanta journal",
    "atlanta constitution",
    "atlanta journal-constitution",
    "los angeles times",
    "new york times",
    "washington post",
    "wall street journal",
    "the nation",
    "the new republic",
    "harper's",
    "atlantic monthly",
    "playboy",
    "look magazine",
    "life magazine",
    "newsweek",
    "time magazine",
    "esquire",
    "saturday review",
    "national review",
    "commentary",
    "dissent",
    "monthly review",
    "studies on the left",
    "kala",
    "negro world",
    "the black scholar",
    "essence",
    "encore",
    "movement magazine",
    "the movement",
    "ramparts magazine",
    "i.f. stone",
    "stone's weekly",
    "guardian newspaper",
    "guardian, the",
    "national guardian",
    "freedom newspaper",
    "freedom paper",
    "young blood",
    "the foxes of harrow",
    "souls of black folk",
    "their eyes were watching god",
    "invisible man",
    "native son",
    "go tell it on the mountain",
    "the fire next time",
    "if beale street",
    "another country",
    "nobody knows my name",
    "soul on ice",
    "die nigger die",
    "the autobiography of malcolm x",
    "stride toward freedom",
    "why we can't wait",
    "where do we go from here",
    "the world and africa",
    "black bourgeoisie",
    "black reconstruction",
    "the philadelphia negro",
    "race and economics",
    "negroes with guns",
    "the wretched of the earth",
    "wretched of the earth",
    "discourse on colonialism",
    "discourse on liberation",
    "race rebels",
    "blood in my eye",
    "soledad brother",
    "if they come in the morning",
    "freedom dreams",
    "a taste of power",
    "this little light of mine",
    "i may not get there with you",
    "the children",
    "parting the waters",
    "pillar of fire",
    "at canaan's edge",
    "local people",
    "in struggle",
    "freedom song",
    "ready for revolution",
    "panther 21 letter",
    "we want freedom",
    "to die for the people",
    "revolutionary suicide",
    "berkeley barb",
    "the lookout",
    "newspaper of record",
    "the new republic",
}

# Section K: military terminology + service / weapons
K_KEYWORDS = {
    "selective service",
    "draft board",
    "draft",
    "marines",
    "marine corps",
    "u.s. marines",
    "u.s. marine corps",
    "army",
    "u.s. army",
    "us army",
    "navy",
    "u.s. navy",
    "air force",
    "u.s. air force",
    "coast guard",
    "national guard",
    "alabama national guard",
    "mississippi national guard",
    "u.s. national guard",
    "fort jackson",
    "fort hood",
    "fort dix",
    "fort bragg",
    "fort benning",
    "fort knox",
    "fort lee",
    "fort lewis",
    "fort sill",
    "fort polk",
    "camp lee",
    "camp lejeune",
    "lackland",
    "lackland afb",
    "chanute",
    "chanute afb",
    "chanute air force base",
    "tuskegee army air field",
    "tuskegee airmen",
    "freedman's bureau",
    "freedmen's bureau",
    "buffalo soldiers",
    "buffalo soldier",
    "rotc",
    "r.o.t.c.",
    "rotc unit",
    "rotc program",
    "m16",
    "m-16",
    "m1 carbine",
    "m1 garand",
    "garand",
    "browning automatic rifle",
    "bar",
    "browning bar",
    "thompson submachine",
    "tommy gun",
    "ak-47",
    "ak47",
    "shotgun",
    "winchester",
    "winchester rifle",
    "smith & wesson",
    "smith and wesson",
    "colt",
    "colt .45",
    "service revolver",
    "korea",
    "korean war",
    "korean conflict",
    "pork chop hill",
    "porkchop hill",
    "world war ii",
    "wwii",
    "world war 2",
    "world war one",
    "wwi",
    "world war i",
    "vietnam war",
    "viet nam",
    "viet cong",
    "vc",
    "nva",
    "pavn",
    "khe sanh",
    "tet",
    "tet offensive",
    "hanoi",
    "saigon",
    "agent orange",
    "napalm",
    "kent state",
    "jackson state",
    "draft card",
    "draft card burning",
    "moratorium",
    "moratorium to end the war",
    "mobilization",
    "mobe",
    "the mobe",
    "march on the pentagon",
    "moratorium march",
    "vietnam veterans against",
    "vvaw",
    "honor america",
    "students for a democratic society",
    "sds",
    "weather underground",
    "weatherman faction",
}

# Section L: institutional + academic + legal terms
L_KEYWORDS = {
    "ldf",
    "naacp legal defense",
    "naacp ldf",
    "legal defense fund",
    "legal defense and educational fund",
    "department of justice",
    "doj",
    "civil rights division",
    "fbi",
    "federal bureau of investigation",
    "u.s. attorney",
    "u.s. attorney general",
    "attorney general",
    "u.s. district court",
    "circuit court of appeals",
    "supreme court",
    "scotus",
    "u.s. supreme court",
    "u.s. senate",
    "u.s. house",
    "house of representatives",
    "u.s. congress",
    "congressional black caucus",
    "cbc",
    "americans for democratic action",
    "ada",
    "fellowship of reconciliation",
    "f.o.r.",
    "for - fellowship",
    "war resisters league",
    "wrl",
    "war resisters",
    "american friends service",
    "afsc",
    "quaker",
    "young men's christian association",
    "ymca",
    "ywca",
    "young women's christian association",
    "national council of negro women",
    "ncnw",
    "national urban league",
    "urban league",
    "naacp youth council",
    "youth council",
    "national women's political caucus",
    "national lawyers guild",
    "lawyers guild",
    "lcdc",
    "lawyers committee for civil rights under law",
    "lawyers committee",
    "harlem ymca",
    "lincoln university",
    "lincoln u",
    "lincoln university of pennsylvania",
    "morehouse",
    "morehouse college",
    "morehouse school",
    "atlanta university center",
    "auc",
    "the union",
    "afl-cio",
    "afl cio",
    "uaw",
    "united auto workers",
    "1199",
    "1199 union",
    "drum",
    "drug",
    "drum (detroit)",
    "fight back",
    "us southern conference",
    "southern conference educational fund",
    "scef",
    "the lincoln-douglass society",
    "lincoln-douglass society",
    "alpha kappa alpha",
    "aka",
    "delta sigma theta",
    "delta",
    "zeta phi beta",
    "zeta",
    "sigma gamma rho",
    "alpha phi alpha",
    "kappa alpha psi",
    "omega psi phi",
    "omega",
    "phi beta sigma",
    "iota phi theta",
    "national pan-hellenic council",
    "the divine nine",
    "the divine 9",
    "boy scouts",
    "girl scouts",
    "civilian conservation corps",
    "ccc",
    "wpa",
    "works progress administration",
    "head start",
    "vista",
    "americorps",
    "operation push",
    "rainbow coalition",
    "rainbow/push",
    "people united to save humanity",
    "freedom city",
    "delta ministry",
    "national council of churches",
    "ncc",
    "world council of churches",
    "wcc",
    "national association of black social workers",
    "national bar association",
    "national medical association",
    "nma",
    "freedom riders",
    "freedom buses",
    "freedom rides",
    "noel dowling",
    "frederick herzberg",
    "two-factor theory",
    "alabama state college",
    "alabama state",
    "south carolina state college",
    "florida agricultural and mechanical",
    "famu",
    "tougaloo southern christian college",
    "rust college",
    "head start",
    "noel dowling",
    "lemoyne college",
    "lemoyne owen",
    "u.s. v. lynd",
    "u.s. v lynd",
    "us v. lynd",
    "us v lynd",
    "brown v. board",
    "brown v board",
    "plessy v. ferguson",
    "plessy v ferguson",
    "loving v. virginia",
    "loving v virginia",
    "smith v. allwright",
    "smith v allwright",
    "morgan v. virginia",
    "morgan v virginia",
    "boynton v. virginia",
    "boynton v virginia",
    "shelley v. kraemer",
    "shelley v kraemer",
    "sweatt v. painter",
    "sweatt v painter",
    "mclaurin v. oklahoma",
    "missouri ex rel gaines",
    "alabama state v. naacp",
    "naacp v. alabama",
    "naacp v alabama",
    "garner v. louisiana",
    "garner v louisiana",
    "edwards v. south carolina",
    "edwards v south carolina",
    "cox v. louisiana",
    "cox v louisiana",
    "katzenbach v. mccaslin",
    "katzenbach v. mcclung",
    "heart of atlanta v. u.s.",
    "heart of atlanta",
    "south carolina v. katzenbach",
    "u.s. v. price",
    "us v. price",
    "u.s. v. guest",
    "us v. guest",
    "swann v. charlotte-mecklenburg",
    "milliken v. bradley",
    "milliken v bradley",
    "bakke",
    "regents of the university of california v. bakke",
    "voting rights act",
    "voting rights act of 1965",
    "vra",
    "civil rights act",
    "civil rights act of 1964",
    "1964 civil rights act",
    "1965 voting rights act",
    "1968 civil rights act",
    "fair housing act",
    "fha",
    "open housing",
    "civil rights act of 1968",
    "the great society",
    "the war on poverty",
    "ofo",
    "office of economic opportunity",
    "oeo",
    "moynihan report",
    "the moynihan report",
    "kerner commission",
    "kerner report",
    "the kerner commission",
    "u.s. commission on civil rights",
    "uscccr",
    "u.s. ccr",
    "alcorn state",
}

# Section M: International / Pan-African / global liberation movements
M_KEYWORDS = {
    "ghana",
    "kenya",
    "tanzania",
    "tanganyika",
    "uganda",
    "kenya",
    "zambia",
    "rhodesia",
    "zimbabwe",
    "angola",
    "mozambique",
    "frelimo",
    "mpla",
    "unita",
    "fnla",
    "swapo",
    "south africa",
    "south west africa",
    "namibia",
    "azania",
    "anc",
    "pac",
    "pan africanist congress",
    "umkhonto",
    "umkhonto we sizwe",
    "nelson mandela",
    "winnie mandela",
    "oliver tambo",
    "tambo",
    "albert lutuli",
    "luthuli",
    "steve biko",
    "biko",
    "robert sobukwe",
    "sobukwe",
    "wally serote",
    "soweto",
    "soweto uprising",
    "sharpeville",
    "sharpeville massacre",
    "amnesty international",
    "cuba",
    "havana",
    "fidel castro",
    "raul castro",
    "che guevara",
    "che",
    "guevara",
    "tricontinental",
    "ospaaal",
    "vietnam",
    "ho chi minh",
    "ho chi minh city",
    "viet cong",
    "vietnam workers party",
    "patrice lumumba",
    "lumumba",
    "kwame nkrumah",
    "nkrumah",
    "julius nyerere",
    "nyerere",
    "kenneth kaunda",
    "kaunda",
    "jomo kenyatta",
    "kenyatta",
    "tom mboya",
    "mboya",
    "sekou toure",
    "ahmed sekou toure",
    "modibo keita",
    "leopold senghor",
    "senghor",
    "negritude",
    "césaire",
    "aime cesaire",
    "frantz fanon",
    "fanon",
    "wretched of the earth",
    "black skin white masks",
    "amilcar cabral",
    "cabral",
    "samora machel",
    "machel",
    "agostinho neto",
    "neto",
    "robert mugabe",
    "mugabe",
    "joshua nkomo",
    "nkomo",
    "guinea",
    "conakry",
    "dakar",
    "senegal",
    "casablanca",
    "morocco",
    "algeria",
    "algiers",
    "fln",
    "ahmed ben bella",
    "houari boumedienne",
    "muammar gaddafi",
    "gaddafi",
    "tripoli",
    "haile selassie",
    "selassie",
    "ethiopia",
    "addis ababa",
    "oau",
    "organization of african unity",
    "non-aligned",
    "non-aligned movement",
    "tito",
    "yugoslavia",
    "indonesia",
    "sukarno",
    "bandung",
    "bandung conference",
    "third world",
    "tricontinental",
    "tricontinental conference",
    "freedom now",
    "uhuru",
    "harambee",
    "ujamaa",
    "japan",
    "tokyo",
    "hiroshima",
    "nagasaki",
    "korea",
    "north korea",
    "south korea",
    "pyongyang",
    "kim il sung",
    "philippines",
    "manila",
    "marcos",
    "ferdinand marcos",
    "imelda marcos",
    "thailand",
    "bangkok",
    "burma",
    "myanmar",
    "rangoon",
    "yangon",
    "india",
    "new delhi",
    "calcutta",
    "kolkata",
    "bombay",
    "mumbai",
    "gandhi",
    "mohandas gandhi",
    "indira gandhi",
    "nehru",
    "jawaharlal nehru",
    "mexico",
    "mexico city",
    "guatemala",
    "salvador",
    "nicaragua",
    "managua",
    "sandinista",
    "sandinistas",
    "el salvador",
    "san salvador",
    "puerto rico",
    "san juan",
    "ponce",
    "vieques",
    "jamaica",
    "kingston",
    "guyana",
    "georgetown",
    "trinidad",
    "port-of-spain",
    "haiti",
    "port-au-prince",
    "barbados",
    "bridgetown",
    "antigua",
    "st. john's",
    "saint john's",
    "carol watanabe",
    "carol wattanabe",
    "guardia civil",
    "facultad de filosofía",
    "yankis fuera de vietnam",
    "yankis fuera",
}

# Section N: foreign-language / non-English Whisper renderings (other than the
# Pan-African / international politics handled in M)
N_KEYWORDS = {
    "spanish",
    "yiddish",
    "french",
    "german",
    "italian",
    "swahili",
    "wolof",
    "yoruba",
    "arabic",
    "hebrew",
    "russian",
    "ladino",
    "creole",
    "haitian creole",
    "louisiana creole",
    "patois",
    "gullah",
    "gullah-geechee",
    "sephardic",
    "ashkenazic",
    "ashkenazi",
    "yom kippur",
    "rosh hashanah",
    "shabbat",
    "shabbos",
    "shabbas",
    "mitzvah",
    "bar mitzvah",
    "bat mitzvah",
    "kosher",
    "knesset",
    "torah",
    "talmud",
    "haggadah",
    "passover",
    "pesach",
    "rabbi",
    "synagogue",
    "shul",
    "yeshiva",
    "kibbutz",
    "moshav",
    "israel",
    "palestine",
    "jerusalem",
    "tel aviv",
    "haifa",
    "yiddishkeit",
    "schmaltz",
    "shtetl",
    "umma",
    "ramadan",
    "eid",
    "hajj",
    "imam",
    "salat",
    "zakat",
    "shahada",
    "qibla",
    "mecca",
    "medina",
    "mosque",
    "masjid",
    "islam",
    "muslim",
    "moslem",
    "nation of islam",
    "noi",
    "elijah muhammad",
    "louis farrakhan",
    "farrakhan",
    "wallace fard",
    "fard muhammad",
    "fruit of islam",
    "foi",
    "mosque no. 7",
    "mosque #7",
    "swahili",
    "uhuru",
    "harambee",
    "habari gani",
    "kwaheri",
    "asante",
    "umoja",
    "kuumba",
    "imani",
    "ujima",
    "kujichagulia",
    "ujamaa",
}

# Section O: Musicians + arts + cultural figures (Movement-era artists)
O_KEYWORDS = {
    "harry belafonte",
    "belafonte",
    "miriam makeba",
    "makeba",
    "mahalia jackson",
    "mahalia",
    "lena horne",
    "horne",
    "marian anderson",
    "leontyne price",
    "paul robeson",
    "robeson",
    "duke ellington",
    "ellington",
    "ella fitzgerald",
    "ella fitzgerald",
    "louis armstrong",
    "satchmo",
    "count basie",
    "billie holiday",
    "lady day",
    "sarah vaughan",
    "dinah washington",
    "nina simone",
    "simone",
    "abbey lincoln",
    "max roach",
    "max roach",
    "art blakey",
    "blakey",
    "jazz messengers",
    "horace silver",
    "thelonious monk",
    "monk",
    "miles davis",
    "miles",
    "john coltrane",
    "coltrane",
    "alice coltrane",
    "pharoah sanders",
    "sun ra",
    "sun-ra",
    "archie shepp",
    "archie shepp",
    "albert ayler",
    "ayler",
    "cecil taylor",
    "taylor, cecil",
    "ornette coleman",
    "ornette",
    "ahmad jamal",
    "yusef lateef",
    "lateef",
    "rahsaan roland kirk",
    "rahsaan",
    "betty carter",
    "betty carter",
    "nancy wilson",
    "carmen mcrae",
    "shirley horn",
    "ray charles",
    "ray charles",
    "sam cooke",
    "sam cooke",
    "otis redding",
    "redding",
    "wilson pickett",
    "pickett",
    "aretha franklin",
    "aretha",
    "aretha franklin",
    "queen of soul",
    "marvin gaye",
    "gaye",
    "stevie wonder",
    "wonder",
    "smokey robinson",
    "smokey",
    "diana ross",
    "supremes",
    "jackson 5",
    "jackson five",
    "michael jackson",
    "michael jackson",
    "curtis mayfield",
    "mayfield",
    "isley brothers",
    "isleys",
    "temptations",
    "four tops",
    "kool and the gang",
    "earth wind and fire",
    "earth, wind & fire",
    "the o'jays",
    "o'jays",
    "ojay's",
    "gladys knight",
    "gladys knight and the pips",
    "stax",
    "stax records",
    "motown",
    "motown records",
    "atlantic records",
    "atlantic",
    "chess records",
    "chess",
    "philadelphia international",
    "tsop",
    "the sound of philadelphia",
    "gamble and huff",
    "kenny gamble",
    "leon huff",
    "berry gordy",
    "berry gordy jr.",
    "gordy",
    "ahmet ertegun",
    "ertegun",
    "jerry wexler",
    "wexler",
    "phil ramone",
    "quincy jones",
    "quincy",
    "freedom songs",
    "we shall overcome",
    "this little light",
    "ain't gonna let nobody",
    "ain't gonna let nobody turn me around",
    "i'll be alright",
    "oh freedom",
    "go tell it",
    "go tell it on the mountain",
    "guy carawan",
    "candie carawan",
    "the carawans",
    "highlander",
    "ohio players",
    "war",
    "war (band)",
    "sly stone",
    "sly and the family stone",
    "santana",
    "carlos santana",
    "tito puente",
    "puente",
    "ray barretto",
    "barretto",
    "willie colon",
    "ruben blades",
    "blades",
    "celia cruz",
    "celia",
    "fania records",
    "fania",
    "fania all stars",
    "salsa",
    "boogaloo",
    "mambo",
    "afro-cuban jazz",
    "latin jazz",
    "freedom riders quartet",
    "freedom singers",
    "snc freedom singers",
    "snnc freedom singers",
    "the freedom singers",
    "bernice johnson reagon",
    "sweet honey",
    "sweet honey in the rock",
    "matt jones",
    "rutha mae harris",
    "cordell reagon",
    "charles neblett",
    "freedom singers",
    "pete seeger",
    "seeger",
    "the weavers",
    "weavers",
    "lee hays",
    "alan lomax",
    "lomax",
    "phil ochs",
    "phil ochs",
    "bob dylan",
    "dylan",
    "joan baez",
    "baez",
    "odetta",
    "richie havens",
    "havens",
    "marian anderson",
    "leontyne price",
    "carmen de lavallade",
    "alvin ailey",
    "ailey",
    "judith jamison",
    "katherine dunham",
    "dunham",
    "katherine dunham",
    "arthur mitchell",
    "dance theater of harlem",
    "lorraine hansberry",
    "hansberry",
    "raisin in the sun",
    "imamu amiri baraka",
    "amiri baraka",
    "leroi jones",
    "spirit house",
    "blkartswest",
    "new lafayette theater",
    "free southern theater",
    "fst",
    "the free southern theater",
    "doug turner ward",
    "negro ensemble company",
    "nec",
    "douglas turner ward",
    "ben caldwell",
    "ronald milner",
    "ed bullins",
    "bullins",
    "lonne elder",
    "joseph walker",
    "philip hayes dean",
    "vinnette carroll",
    "richard wesley",
    "ron milner",
    "milner",
    "sonia sanchez",
    "ntozake shange",
    "for colored girls",
    "alice walker",
    "color purple",
    "the color purple",
    "toni morrison",
    "morrison",
    "song of solomon",
    "beloved",
    "june jordan",
    "audre lorde",
    "june jordan",
    "kwame dawes",
    "rita dove",
    "yusef komunyakaa",
    "haki madhubuti",
    "haki r. madhubuti",
    "don l. lee",
    "don lee",
    "third world press",
    "the third world press",
    "ishmael reed",
    "ishmael reed",
    "alice walker",
    "june jordan",
    "ntozake shange",
    "shange",
    "audre lorde",
    "barbara christian",
    "spike lee",
    "spike",
    "spike lee",
    "she's gotta have it",
    "do the right thing",
    "school daze",
    "jungle fever",
    "malcolm x (film)",
    "ossie davis",
    "ruby dee",
    "rev. dr. samuel proctor",
    "samuel proctor",
    "samuel d. proctor",
    "proctor",
    "judith jamison",
    "rabbi heschel",
    "abraham joshua heschel",
}

# Section P: catalog meta + cross-entry patterns (when source = reinforcement
# / catalog-row-extension on already-existing rows, or process-discussion)
P_KEYWORDS = {
    "catalog",
    "section a",
    "section b",
    "section c",
    "section d",
    "section e",
    "section f",
    "section g",
    "section h",
    "section i",
    "reinforce",
    "reinforces",
    "reinforcement",
    "promote",
    "ground truth",
    "ground-truth",
    "civil_rights_facts",
    "audit",
}


# Routing decision order. We try buckets in order and the FIRST matching keyword
# wins. So sections with the most specific names go first; the most generic
# buckets (E, F, G) go last so they don't over-claim.
#
# Important: C goes before D so that figures who are SNCC/SCLC mainline (Stokely
# Carmichael, James Forman, Bob Zellner, Medgar Evers, Fannie Lou Hamer, etc.)
# get routed to C even if their later trajectory also matches D's BPP/Black-Power
# keywords. D should only fire on figures whose primary catalog home is BPP.
SECTION_TABLE = [
    ("A", "Canonical interview-team / interviewer / cameraman / videographer names", A_KEYWORDS),
    ("J", "Movement-era publications, periodicals, books, broadsides (NEW)", J_KEYWORDS),
    ("K", "Military terminology, weapons, draft & service (NEW)", K_KEYWORDS),
    ("O", "Musicians + arts + cultural figures (Movement-era artists) (NEW)", O_KEYWORDS),
    ("N", "Foreign-language / non-English Whisper renderings (NEW)", N_KEYWORDS),
    ("M", "Pan-African + international liberation movements (NEW)", M_KEYWORDS),
    ("C", "SNCC / SCLC / NAACP canonical figures (mainline Movement-era)", C_KEYWORDS),
    ("D", "Black Panther Party / Black Power era figures", D_KEYWORDS),
    ("L", "Institutional / legal / academic / labor terms (NEW)", L_KEYWORDS),
    ("B", "Civil rights organizations + federal agencies", B_KEYWORDS),
    ("E", "Pre-Movement-era and supporting figures", E_KEYWORDS),
    ("F", "Geographic + institutional place-name errors", F_KEYWORDS),
    ("G", "Common-noun and idiom errors", G_KEYWORDS),
    ("H", "Special homophone / Whisper-meta patterns", H_KEYWORDS),
    ("P", "Cross-entry catalog-meta and reinforcement notes (NEW)", P_KEYWORDS),
]


_CATALOG_REF_RE = re.compile(r"catalog\s*[#§]?\s*([abcdefghijklmnop])(?:\b|[/, .)])", re.IGNORECASE)


def _build_kw_pattern(keywords: set[str]):
    """Build a compiled regex that matches any keyword as a whole word/phrase.

    We use word boundaries on alphanumeric edges so e.g. 'wwi' will NOT match
    inside 'wwii' (since 'i' is alphanumeric and so 'i' before 'i' has no word
    boundary). Punctuation within a keyword (periods, hyphens) is escaped.
    """
    # Sort by descending length so longer phrases match before short prefixes
    # do (regex alternation is greedy left-to-right; longest-first prevents
    # 'fbi' from gobbling 'fbi counterintelligence').
    items = sorted({k for k in keywords if k}, key=lambda s: -len(s))
    parts = []
    for k in items:
        # Use a word boundary on each end where the edge character is alphanum.
        start = r"\b" if k[:1].isalnum() else ""
        end = r"\b" if k[-1:].isalnum() else ""
        parts.append(start + re.escape(k) + end)
    return re.compile("|".join(parts), re.IGNORECASE)


# Pre-compile per-section keyword regexes (saves time on the 783 categorize calls).
_SECTION_PATTERNS: list[tuple[str, str, re.Pattern]] = []


def _ensure_patterns():
    if _SECTION_PATTERNS:
        return
    for section, label, keywords in SECTION_TABLE:
        _SECTION_PATTERNS.append((section, label, _build_kw_pattern(keywords)))


def categorize(correction_norm: str, span: str, context: str) -> str:
    """Return the catalog section letter best matching this correction.

    Routing precedence:
      1. Proper-noun signal: keyword match on the normalized Correction field
         alone (the canonical-noun field). Highest-precision.
      2. Strong supervisor signal: explicit "Catalog #X entry" / "Section X"
         reference in context (only when unambiguous across all aggregated
         contexts for this row).
      3. Span signal: keyword match on the Whisper-rendered Span field.
      4. Context fallback: keyword match anywhere in the full haystack.
    """
    _ensure_patterns()
    valid_letters = {row[0] for row in SECTION_TABLE}

    # Tier 1: match against the canonical correction string itself. This is the
    # highest-precision signal because the proper noun's catalog home is
    # determined by the noun, not by surrounding narrative context.
    correction_only = correction_norm
    for section, _label, pattern in _SECTION_PATTERNS:
        if pattern.search(correction_only):
            return section

    # Tier 2: Pass-3 supervisors often wrote "catalog #C entry" / "section F" /
    # "extends row in §B" inline. Respect that authoritative routing when a
    # single unambiguous reference letter appears across all aggregated contexts.
    full_haystack = " ".join([correction_norm, span.lower(), context.lower()])
    refs = _CATALOG_REF_RE.findall(full_haystack)
    if refs:
        unique = {r.upper() for r in refs}
        if len(unique) == 1:
            sec = next(iter(unique))
            if sec in valid_letters:
                return sec

    # Tier 3: Whisper-rendered span (the misheard form often preserves part of
    # the canonical signal — e.g., "Hattie's Burg" still contains "burg").
    span_only = span.lower()
    for section, _label, pattern in _SECTION_PATTERNS:
        if pattern.search(span_only):
            return section

    # Tier 4: full haystack with surrounding context. Lowest precision since the
    # supervisor may mention adjacent topics that don't define the row's home.
    for section, _label, pattern in _SECTION_PATTERNS:
        if pattern.search(full_haystack):
            return section
    return "Z"  # Unsorted catch-all


# ---------------------------------------------------------------------------
# Main aggregation
# ---------------------------------------------------------------------------
def main():
    print(f"Scanning {STAGE_DIR}...")
    files = sorted(STAGE_DIR.glob("entry_*.md"), key=lambda p: int(re.match(r"entry_(\d+)", p.stem).group(1)))
    if not files:
        raise SystemExit(f"No entry_*.md files found in {STAGE_DIR}")

    all_rows = []
    for f in files:
        text = f.read_text(encoding="utf-8", errors="replace")
        block = extract_pass3_catches_block(text)
        if not block:
            continue
        rows = parse_rows(block)
        eid = entry_id_from_filename(f)
        for r in rows:
            r["entry_id"] = eid
            all_rows.append(r)

    print(f"Extracted {len(all_rows)} raw rows from {len(files)} staging files.")

    # Deduplicate by normalized correction.
    grouped = defaultdict(lambda: {
        "spans": set(),
        "corrections": set(),
        "entries": set(),
        "sources": set(),
        "contexts": [],
        "confidences": set(),
    })
    filtered_na = 0
    filtered_short = 0
    # Meta-phrases that appear as the Correction field but are NOT the canonical
    # noun phrase; treat them as "key from span instead" rows.
    # We normalize and check against the post-normalize form (e.g., trailing
    # " rendering" is stripped by normalize_correction).
    META_PHRASES = {
        normalize_correction(s)
        for s in (
            "New canonical-alias rendering",
            "New canonical alias rendering",
            "Catalog row extension",
            "Catalog row-extension",
            "Catalog new",
            "Catalog-new",
            "Catalog confirmation",
            "Catalog-confirmation",
            "Catalog entry needed",
            "Catalog category G entry needed",
            "Catalog category needed",
            "Catalog backfile recommendation",
            "See context",
            "New catalog candidate",
            "New catalog row",
            "Cross-corpus catalog",
            "Cross-corpus catalog candidate",
        )
    }

    # Substring-prefix meta-markers: if Correction STARTS WITH one of these, the
    # row is meta-tagged and the canonical noun lives in the Span column.
    META_PREFIXES = (
        "cross-corpus pattern",
        "cross-corpus link",
        "cross corpus link",
        "cross-corpus catalog",
        "cross corpus catalog",
        "cross-corpus whisper",
        "cross corpus whisper",
        "catalog backfile recommendation",
        "new catalog candidate",
        "new catalog row",
        "catalog category",
        "see context",
        "see catalog",
        "new canonical-alias",
        "new canonical alias",
    )
    for r in all_rows:
        norm = normalize_correction(r["correction"])
        # Drop "n/a" confirmation-only placeholders. Pass-3 supervisors used
        # "n/a" / "n\a" in Correction when the row only confirms Pass 1/2 was
        # already right — those are not new catalog patterns.
        if not norm or norm in {"na", "n a", "none", "no correction"}:
            filtered_na += 1
            continue
        # If the Correction field is a meta phrase, switch the dedup key to be
        # derived from the Span (the proper noun is in the Whisper-rendering,
        # the Correction column is meta-description here).
        is_meta = norm in META_PHRASES or any(norm.startswith(p) for p in META_PREFIXES)
        if is_meta:
            span_norm = normalize_correction(r["span"])
            # Skip if span itself is empty or too short.
            if not span_norm or len(span_norm) < 3:
                filtered_short += 1
                continue
            norm = span_norm
        # Sanity: drop excessively short keys that are unlikely to be a noun phrase.
        if len(norm) < 3:
            filtered_short += 1
            continue
        key = norm
        g = grouped[key]
        g["spans"].add(r["span"])
        g["corrections"].add(r["correction"])
        g["entries"].add(int(r["entry_id"]) if r["entry_id"].isdigit() else r["entry_id"])
        g["sources"].add(r["source"])
        g["confidences"].add(r["confidence"])
        g["contexts"].append(r["context"])
    print(f"Filtered {filtered_na} 'n/a' confirmation-only rows, {filtered_short} short noise rows.")

    print(f"After dedup: {len(grouped)} unique canonical patterns.")

    # Categorize.
    bucketed = defaultdict(list)  # section letter -> list of (recurrence, payload)
    for norm, g in grouped.items():
        canonical = pick_canonical(g["corrections"], g["spans"])
        section = categorize(norm, " | ".join(sorted(g["spans"])), " | ".join(g["contexts"]))
        bucketed[section].append({
            "norm": norm,
            "canonical": canonical,
            "spans": sorted(g["spans"]),
            "entries": sorted(g["entries"], key=_entry_sort_key),
            "sources": sorted(g["sources"]),
            "confidences": sorted(g["confidences"]),
            "recurrence": len(g["entries"]),
        })

    # Rank within each section by recurrence (desc), then alpha of canonical.
    for section in bucketed:
        bucketed[section].sort(key=lambda d: (-d["recurrence"], d["canonical"].lower()))

    # Emit markdown.
    md = render_markdown(bucketed)

    # Insert into master file between markers.
    inject_into_master(md)

    # Emit a brief summary to stdout.
    summary = summarize(all_rows, grouped, bucketed)
    print(summary)


def _entry_sort_key(e):
    if isinstance(e, int):
        return (0, e)
    return (1, str(e))


def pick_canonical(corrections: set[str], spans: set[str] = None) -> str:
    """From the variants of the Correction field, pick the cleanest concise form
    as the canonical row label.

    Strategy: prefer the shortest non-trivial correction string that still
    contains a proper-noun-like signal (capitalized word). Long prose rows
    (describing the catalog action rather than the noun phrase itself) are
    suppressed in favor of the cleanest noun-phrase form. If no clean
    Correction candidate exists, fall back to the cleanest Span variant.
    """
    META_PREFIX_DROP = (
        "one more variant",
        "cross-corpus",
        "cross corpus",
        "master md section",
        "catalog backfile",
        "catalog row",
        "new catalog",
        "see catalog",
        "see context",
        "catalog category",
        "new canonical-alias",
        "new canonical alias",
        "pass 1 logged",
        "pass 2 caught",
        "pass 3 caught",
        "pass 1 caught",
        "pass 2 marked",
        "the canonical",
        "canonical ",  # catches "Canonical Bayard Rustin..." prose but not bare "Canonical" noun
        "confirmed via",
        "confirmed by",
        "whisper-degradation",
        "whisper degradation",
        "speaker correctly",
        "these are two",
        "tillow's testimony",
        "recurring throughout",
        "recurring severe",
        "severe whisper",
        "distinctive whisper",
    )

    def _is_meta(s: str) -> bool:
        low = s.lower().lstrip(" *_-")
        for p in META_PREFIX_DROP:
            if low.startswith(p):
                # Special-case: "the canonical ANC" / "Canonical Bayard Rustin"
                # are still noun-phrases that the catalog needs. Only drop if
                # the string is *long* (>= 60 chars) or contains a sentence
                # break / verb tense suggesting prose.
                if p in ("canonical ", "the canonical") and len(s) < 80:
                    continue
                return True
        return False

    cleaned = [c.strip() for c in corrections if len(c.strip()) >= 3 and not _is_meta(c)]
    pool = cleaned

    def has_capitalized(s: str) -> bool:
        return any(w[:1].isupper() and len(w) > 1 for w in s.split())

    capitalized = [c for c in pool if has_capitalized(c)]
    pool2 = capitalized or pool
    pool2.sort(key=lambda s: (len(s), s))
    if pool2:
        return pool2[0]

    # All Correction fields were meta: fall back to the Span (the Whisper
    # rendering string, which often quotes the canonical noun in passing).
    if spans:
        span_candidates = sorted({s.strip() for s in spans if s.strip()}, key=lambda s: (len(s), s))
        for cand in span_candidates:
            if len(cand) >= 3:
                return cand
    # Last resort: longest correction unfiltered.
    fallback = sorted(corrections, key=len)
    return fallback[0] if fallback else ""


def render_markdown(bucketed: dict) -> str:
    out = []
    out.append("")
    out.append("## Cross-corpus catalog - Phase 1b back-fill extension (added 2026-05-22)")
    out.append("")
    out.append(
        "This subsection extends the original sections A-I with patterns surfaced by "
        "the 127 Pass-3 supervisor staging files in `transcripts/pass3_stage/`. Patterns "
        "are organized by category, ranked by cross-corpus recurrence (number of entries "
        "where the pattern appears), and tagged with provenance entry IDs for traceability. "
        "Aggregation is produced by `transcripts/build_catalog_extension.py` (re-runnable; "
        "regenerates this block between the BEGIN/END sentinel comments without touching "
        "the manually-curated A-I sections above)."
    )
    out.append("")
    out.append(
        "Sections A-I extend the existing same-letter rubrics above; sections J-O and P "
        "are newly proposed by this Phase 1b back-fill to cover corpus-spanning themes "
        "not captured by the original taxonomy:"
    )
    out.append("")
    out.append("- **Section J (NEW)** - Movement-era publications, periodicals, books, broadsides")
    out.append("- **Section K (NEW)** - Military terminology, weapons, draft and service")
    out.append("- **Section L (NEW)** - Institutional, legal, academic, labor terms (LDF, DOJ, fraternities, unions, court cases)")
    out.append("- **Section M (NEW)** - Pan-African and international liberation movements (Africa, Caribbean, Latin America, Asia)")
    out.append("- **Section N (NEW)** - Foreign-language and non-English Whisper renderings (Spanish, Yiddish, Swahili, Arabic, French)")
    out.append("- **Section O (NEW)** - Movement-era musicians, artists, cultural figures, freedom-songs ensembles")
    out.append("- **Section P (NEW)** - Cross-entry catalog-meta and reinforcement-only notes (rows where the Pass-3 supervisor flagged the row as a confirmation of an existing catalog A-I entry rather than a new pattern)")
    out.append("")
    out.append(
        "Provenance entries are listed as transcript IDs (e.g. `#1` = entry_1 = Aaron Dixon). "
        "Confidence column reflects what the Pass-3 supervisor wrote in the staging row; "
        "where the same pattern appears at different confidences across entries, the union "
        "is shown."
    )
    out.append("")

    section_titles = {letter: label for letter, label, _ in SECTION_TABLE}
    section_titles["Z"] = "Unsorted (no catalog section matched - manual review recommended)"

    # Emit each section in catalog letter order; if there's a Z bucket, emit last.
    emit_order = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Z"]
    for section in emit_order:
        rows = bucketed.get(section, [])
        if not rows:
            continue
        title = section_titles.get(section, section)
        out.append(f"### Section {section} extension - {title}")
        out.append("")
        out.append("| Canonical correction | Whisper renderings (variants) | Recurrence | Source entries | Source-tag | Confidence |")
        out.append("|---|---|---|---|---|---|")
        for row in rows:
            canonical = _md_safe(row["canonical"])
            # Filter out meta-spans (e.g., "Catalog backfile recommendation")
            # so the Whisper-rendering column shows real Whisper variants.
            clean_spans = [s for s in row["spans"] if not _is_meta_span(s)]
            if clean_spans:
                display_spans = clean_spans
                spans = _md_safe(
                    " / ".join(display_spans[:6])
                    + (" / ..." if len(display_spans) > 6 else "")
                )
            else:
                # All spans are meta tags; the Whisper rendering lives inside
                # the canonical Correction. Show the canonical itself with a
                # marker indicating the supervisor only logged a routing tag.
                spans = "(supervisor logged only a meta-tag; see canonical)"
            entries = ", ".join(f"#{e}" for e in row["entries"])
            sources = _md_safe(", ".join(row["sources"]))
            confidences = _md_safe(", ".join(row["confidences"]))
            out.append(
                f"| {canonical} | {spans} | {row['recurrence']} | {entries} | {sources} | {confidences} |"
            )
        out.append("")

    out.append("")
    return "\n".join(out)


def _md_safe(s: str) -> str:
    """Escape pipes inside markdown table cells and clamp whitespace."""
    return s.replace("|", "\\|").replace("\n", " ").strip()


_META_SPAN_FRAGMENTS = (
    "catalog backfile recommendation",
    "catalog-backfile recommendation",
    "catalog row extension",
    "catalog confirmation",
    "catalog category",
    "see context",
    "see catalog",
    "n/a",
    "n\\a",
)


def _is_meta_span(s: str) -> bool:
    low = s.lower().strip().strip(" *_-\"'")
    if not low:
        return True
    if low in {"na", "n/a", "n\\a"}:
        return True
    for frag in _META_SPAN_FRAGMENTS:
        if low == frag or low.startswith(frag + " "):
            return True
    return False


def inject_into_master(md_block: str):
    """Insert `md_block` between BEGIN_MARK and END_MARK sentinel comments in the
    master MD. If the sentinels are missing, insert them immediately before the
    "## Progress Tracker" header (with a `---` separator preserved before the
    tracker, per the existing file structure)."""
    # Read as bytes and decode manually so we can detect/preserve the original
    # newline convention. The repo stores LF in the git index; the working tree
    # may be CRLF on Windows. We preserve whatever the working file is using.
    raw = MASTER_MD.read_bytes()
    if b"\r\n" in raw:
        newline = "\r\n"
    else:
        newline = "\n"
    text = raw.decode("utf-8").replace("\r\n", "\n")

    new_block = (
        f"{BEGIN_MARK}\n"
        f"{md_block}\n"
        f"{END_MARK}\n"
    )

    if BEGIN_MARK in text and END_MARK in text:
        pre, _, rest = text.partition(BEGIN_MARK)
        _, _, post = rest.partition(END_MARK)
        # Strip the leading newline of `post` so we don't accumulate blank lines.
        post = post.lstrip("\n")
        new_text = f"{pre}{new_block}\n{post}"
    else:
        # First-time insertion: locate the Progress Tracker header and place the
        # auto-block in front of the "---" separator that precedes it.
        anchor = "\n---\n\n## Progress Tracker"
        idx = text.find(anchor)
        if idx < 0:
            # Fall back to plain "## Progress Tracker" with a missing horizontal rule.
            anchor = "\n## Progress Tracker"
            idx = text.find(anchor)
            if idx < 0:
                raise RuntimeError(
                    "Could not find Progress Tracker anchor in CLEANED_TRANSCRIPTS_REVIEW.md; "
                    "manual edit required."
                )
            new_text = text[:idx] + "\n" + new_block + text[idx:]
        else:
            new_text = text[:idx] + "\n" + new_block + text[idx:]

    # Restore original newline convention.
    if newline == "\r\n":
        new_text = new_text.replace("\n", "\r\n")
    MASTER_MD.write_bytes(new_text.encode("utf-8"))


def summarize(all_rows: list, grouped: dict, bucketed: dict) -> str:
    lines = []
    lines.append("=" * 78)
    lines.append("Phase 1b back-fill extension - aggregation summary")
    lines.append("=" * 78)
    lines.append(f"Total raw rows extracted        : {len(all_rows)}")
    lines.append(f"Unique canonical patterns       : {len(grouped)}")
    lines.append("")
    lines.append("Per-section row counts:")
    emit_order = ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K", "L", "M", "N", "O", "P", "Z"]
    for section in emit_order:
        n = len(bucketed.get(section, []))
        if n:
            lines.append(f"  Section {section:>2} : {n:>4}")
    lines.append("")
    lines.append("Top 15 patterns by cross-corpus recurrence:")
    flat = []
    for section, rows in bucketed.items():
        for r in rows:
            flat.append((r["recurrence"], section, r["canonical"], r["entries"]))
    flat.sort(key=lambda t: -t[0])
    for i, (rec, sec, can, entries) in enumerate(flat[:15], 1):
        ent_preview = ", ".join(f"#{e}" for e in entries[:8])
        if len(entries) > 8:
            ent_preview += f" (+{len(entries) - 8} more)"
        lines.append(f"  {i:>2}. [{sec}] r={rec:>2}  {can:<55}  entries={ent_preview}")
    lines.append("")
    lines.append(f"Output written to: {MASTER_MD}")
    return "\n".join(lines)


if __name__ == "__main__":
    main()
