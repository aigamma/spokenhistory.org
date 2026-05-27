"""
Generate the WWU presentation deck as a .pptx the team can touch up
before the meeting. Output: wwu_presentation_2026-05-27.pptx in the
project root.

The deck walks the audience through:
  1. The problem (ASR errors invisible to a casual read)
  2. Concrete error examples from the audit
  3. The 8-pass audit cascade
  4. The Library of Congress healing pass (Pass 8 / "the 9th")
  5. Conservative-first-pass discipline (95K detected / ~2.6K applied)
  6. Other challenge categories
  7. What the cleaned corpus enables: the live RAG layer
  8. The interactive demos on /rag-explore
  9. The philosophy of embedding
 10. The Steering Document Hierarchy
 11. When to read what (cheat sheet)
 12. Next / deferred work
 13. Close + Q&A

Visual palette matches the live site:
  brand red       #F2483C (large text / heading accent only)
  brand body red  #B23E2F (small body red, AA-compliant)
  cream           #EBEAE9
  ink             #1c1917
"""
from pathlib import Path
from pptx import Presentation
from pptx.util import Inches, Pt, Emu
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE


# ---------- Palette ----------
CREAM = RGBColor(0xEB, 0xEA, 0xE9)
INK = RGBColor(0x1C, 0x19, 0x17)
RED_BRAND = RGBColor(0xF2, 0x48, 0x3C)      # large-text only
RED_BODY = RGBColor(0xB2, 0x3E, 0x2F)        # AA-compliant body red
STONE_700 = RGBColor(0x44, 0x40, 0x3C)
STONE_500 = RGBColor(0x78, 0x71, 0x6C)
STONE_200 = RGBColor(0xE7, 0xE5, 0xE4)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
EMERALD_700 = RGBColor(0x04, 0x78, 0x57)
SKY_700 = RGBColor(0x03, 0x69, 0xA1)
VIOLET_700 = RGBColor(0x6D, 0x28, 0xD9)


# ---------- Deck setup ----------
prs = Presentation()
# 16:9, 13.333" x 7.5"
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)
BLANK = prs.slide_layouts[6]


def add_background(slide, color=CREAM):
    """Paint the whole slide background a flat color."""
    rect = slide.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, prs.slide_height
    )
    rect.fill.solid()
    rect.fill.fore_color.rgb = color
    rect.line.fill.background()
    # Send to back via XML reorder. python-pptx doesn't expose a public
    # API; we move the spTree child to the start.
    spTree = slide.shapes._spTree
    spTree.remove(rect._element)
    spTree.insert(2, rect._element)
    return rect


def add_text(slide, text, *, left, top, width, height,
             size=18, bold=False, color=INK, align=PP_ALIGN.LEFT,
             font="Inter"):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Emu(0)
    tf.margin_right = Emu(0)
    tf.margin_top = Emu(0)
    tf.margin_bottom = Emu(0)
    # First paragraph
    paragraphs = text.split("\n")
    for i, line in enumerate(paragraphs):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.alignment = align
        run = p.add_run()
        run.text = line
        font_obj = run.font
        font_obj.name = font
        font_obj.size = Pt(size)
        font_obj.bold = bold
        font_obj.color.rgb = color
    return box


def add_chip(slide, label, *, left, top, color, width=Inches(2.0)):
    """A pill-shaped colored chip with white label, like the nav pills."""
    chip = slide.shapes.add_shape(
        MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, Inches(0.42)
    )
    chip.adjustments[0] = 0.5
    chip.fill.solid()
    chip.fill.fore_color.rgb = color
    chip.line.fill.background()
    tf = chip.text_frame
    tf.margin_left = Inches(0.12)
    tf.margin_right = Inches(0.12)
    tf.margin_top = Emu(0)
    tf.margin_bottom = Emu(0)
    p = tf.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run = p.add_run()
    run.text = label
    run.font.name = "Chivo Mono"
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = WHITE
    return chip


def add_divider(slide, *, top, color=RED_BRAND):
    line = slide.shapes.add_connector(
        1, Inches(0.7), top, Inches(12.633), top
    )
    line.line.color.rgb = color
    line.line.width = Pt(2)
    return line


def add_footer(slide, slide_number, total_slides):
    add_text(
        slide,
        f"Civil Rights History Project  /  WWU  /  May 27, 2026",
        left=Inches(0.7), top=Inches(7.05),
        width=Inches(9.0), height=Inches(0.3),
        size=10, color=STONE_500, font="Chivo Mono",
    )
    add_text(
        slide,
        f"{slide_number} / {total_slides}",
        left=Inches(12.0), top=Inches(7.05),
        width=Inches(1.0), height=Inches(0.3),
        size=10, color=STONE_500, font="Chivo Mono", align=PP_ALIGN.RIGHT,
    )


def add_section_label(slide, label):
    add_text(
        slide, label.upper(),
        left=Inches(0.7), top=Inches(0.5),
        width=Inches(10), height=Inches(0.35),
        size=12, bold=True, color=RED_BODY, font="Chivo Mono",
    )


def add_title(slide, title):
    add_text(
        slide, title,
        left=Inches(0.7), top=Inches(0.85),
        width=Inches(12), height=Inches(1.0),
        size=36, bold=True, color=INK, font="Inter",
    )


def add_bullets(slide, items, *, left, top, width, height,
                size=18, color=INK, gap=0.32):
    """Render a list of bullet items. Each item can be either a plain
    string or a (head, body) tuple where head is bold and body trails."""
    cur_top = top
    for item in items:
        if isinstance(item, tuple):
            head, body = item
        else:
            head, body = item, ""
        box = slide.shapes.add_textbox(left, cur_top, width, Inches(gap + 0.2))
        tf = box.text_frame
        tf.word_wrap = True
        tf.margin_left = Emu(0)
        tf.margin_right = Emu(0)
        tf.margin_top = Emu(0)
        tf.margin_bottom = Emu(0)
        p = tf.paragraphs[0]
        p.alignment = PP_ALIGN.LEFT
        # red dot
        dot = p.add_run()
        dot.text = "*  "
        dot.font.color.rgb = RED_BRAND
        dot.font.size = Pt(size)
        dot.font.bold = True
        dot.font.name = "Inter"
        # head
        run_head = p.add_run()
        run_head.text = head
        run_head.font.name = "Inter"
        run_head.font.size = Pt(size)
        run_head.font.bold = True
        run_head.font.color.rgb = color
        if body:
            run_body = p.add_run()
            run_body.text = "  " + body
            run_body.font.name = "Inter"
            run_body.font.size = Pt(size)
            run_body.font.bold = False
            run_body.font.color.rgb = STONE_700
        cur_top += Inches(gap + 0.55)


def add_table(slide, header, rows, *, left, top, width, height,
              first_col_color=RED_BODY):
    table_shape = slide.shapes.add_table(
        len(rows) + 1, len(header), left, top, width, height
    )
    table = table_shape.table
    # Header row
    for i, h in enumerate(header):
        cell = table.cell(0, i)
        cell.text = ""
        p = cell.text_frame.paragraphs[0]
        run = p.add_run()
        run.text = h
        run.font.name = "Chivo Mono"
        run.font.size = Pt(11)
        run.font.bold = True
        run.font.color.rgb = WHITE
        cell.fill.solid()
        cell.fill.fore_color.rgb = INK
    # Body rows
    for r, row in enumerate(rows, start=1):
        for c, val in enumerate(row):
            cell = table.cell(r, c)
            cell.text = ""
            p = cell.text_frame.paragraphs[0]
            run = p.add_run()
            run.text = val
            run.font.name = "Inter"
            run.font.size = Pt(12)
            if c == 0:
                run.font.bold = True
                run.font.color.rgb = first_col_color
            else:
                run.font.color.rgb = INK
            cell.fill.solid()
            cell.fill.fore_color.rgb = WHITE if r % 2 == 1 else CREAM
    return table_shape


# ---------- Slides ----------
slides_meta = []  # (renderer, footer_label)


def slide_01_title():
    s = prs.slides.add_slide(BLANK)
    add_background(s, color=CREAM)
    # decorative left accent bar
    bar = s.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(0.22), prs.slide_height
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = RED_BRAND
    bar.line.fill.background()

    add_text(
        s, "CIVIL RIGHTS HISTORY PROJECT",
        left=Inches(0.9), top=Inches(0.9),
        width=Inches(11), height=Inches(0.5),
        size=14, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    add_text(
        s, "From Whisper to Smithsonian-Grade Publication",
        left=Inches(0.9), top=Inches(1.6),
        width=Inches(12), height=Inches(1.4),
        size=44, bold=True, color=INK, font="Inter",
    )
    add_text(
        s,
        "Nine audit passes, the Library of Congress as canonical authority, "
        "and a live RAG layer that surfaces the cleaned corpus.",
        left=Inches(0.9), top=Inches(3.2),
        width=Inches(11.5), height=Inches(1.5),
        size=22, color=STONE_700, font="Source Serif 4",
    )
    add_text(
        s,
        "WWU team meeting  /  May 27, 2026",
        left=Inches(0.9), top=Inches(5.4),
        width=Inches(11), height=Inches(0.4),
        size=16, color=RED_BODY, font="Chivo Mono",
    )
    add_text(
        s,
        "Live staging: civil-rights-staging.netlify.app",
        left=Inches(0.9), top=Inches(5.9),
        width=Inches(11), height=Inches(0.4),
        size=14, color=STONE_500, font="Chivo Mono",
    )
    return s


def slide_02_problem():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "The problem in one sentence")
    add_title(s, "Whisper transcripts read fluently. They are also wrong.")
    add_text(
        s,
        "Automatic Speech Recognition on 1960s-era oral history audio produces "
        "transcript text that reads fluently but contains systematic errors invisible "
        "to a casual read. A Smithsonian-grade publication built on those transcripts "
        "would confidently say the wrong thing.",
        left=Inches(0.7), top=Inches(2.2),
        width=Inches(12), height=Inches(1.5),
        size=20, color=STONE_700, font="Source Serif 4",
    )
    # Highlight box
    box = s.shapes.add_shape(
        MSO_SHAPE.RECTANGLE, Inches(0.7), Inches(4.1),
        Inches(11.9), Inches(2.5),
    )
    box.fill.solid()
    box.fill.fore_color.rgb = WHITE
    box.line.color.rgb = RED_BRAND
    box.line.width = Pt(2)
    add_text(
        s, "WHAT WHISPER SAID",
        left=Inches(1.0), top=Inches(4.25),
        width=Inches(5.5), height=Inches(0.4),
        size=11, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    add_text(
        s, '"Earl, Adam Clayton Powell Sr., Andrew, Carlos"',
        left=Inches(1.0), top=Inches(4.65),
        width=Inches(5.7), height=Inches(0.8),
        size=18, color=INK, font="Source Serif 4",
    )
    add_text(
        s,
        "John Carlos's siblings, in his own voice.",
        left=Inches(1.0), top=Inches(5.4),
        width=Inches(5.7), height=Inches(0.4),
        size=12, color=STONE_500, font="Chivo Mono",
    )
    # Right side
    add_text(
        s, "WHAT JOHN CARLOS ACTUALLY SAID",
        left=Inches(7.0), top=Inches(4.25),
        width=Inches(5.5), height=Inches(0.4),
        size=11, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    add_text(
        s, '"Earl Jr., Andrew, John Carlos"',
        left=Inches(7.0), top=Inches(4.65),
        width=Inches(5.7), height=Inches(0.8),
        size=18, color=INK, font="Source Serif 4",
    )
    add_text(
        s,
        "Whisper bled Adam Clayton Powell Sr. (the Abyssinian Baptist Church "
        "pastor mentioned three paragraphs later) backward into the siblings list, "
        "inventing a fictional brother.",
        left=Inches(7.0), top=Inches(5.4),
        width=Inches(5.5), height=Inches(1.0),
        size=12, color=STONE_500, font="Chivo Mono",
    )
    return s


def slide_03_error_examples():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Concrete examples from the corpus")
    add_title(s, "Categorical errors, not typos.")
    add_text(
        s,
        "Wrong person, wrong place, wrong fact, presented with the same confidence "
        "as the rest of the text.",
        left=Inches(0.7), top=Inches(1.95),
        width=Inches(12), height=Inches(0.7),
        size=16, color=STONE_700, font="Source Serif 4",
    )
    rows = [
        ("David Klein", "David Cline", "Wrong interviewer attributed to 100+ interviews"),
        ('"Daniel H. Krenge De Iongh"', "Daniel H. Crena de Iongh", "First Treasurer of the World Bank; key apartheid-finance figure"),
        ('"Paul Hoffman Robeson"', "Paul Robeson + Paul Hoffman", "Two distinct figures merged into one identity, 4 occurrences"),
        ('"Margaret the King"', "Martin Luther King Jr.", "Recurring across multiple interviews"),
        ('"Auto bom barroom"', "Audubon Ballroom", "Site of Malcolm X's assassination, rendered unrecognizable"),
        ('"Stoke and Carmichael"', "Stokely Carmichael", "SNCC chairman; Whisper invented a second speaker"),
        ('"Elders Cleaver"', "Eldridge Cleaver", "Black Panther Party Minister of Information (24 occurrences in one transcript)"),
    ]
    add_table(
        s,
        ["Whisper output", "Correct reading", "Why it matters"],
        rows,
        left=Inches(0.7), top=Inches(2.85),
        width=Inches(12), height=Inches(4.0),
    )
    return s


def slide_04_audit_cascade():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "The audit cascade")
    add_title(s, "Eight passes of cleaning + a ninth against the LoC archive.")
    passes = [
        ("Pass 1", "Phonetic alias matching + ground-truth corpus grounding."),
        ("Pass 2", "Per-entry tail sweep for entries with partial Pass 1 reads."),
        ("Pass 3", "Consolidation: confidence resolutions + adversarial-review flags."),
        ("Pass 4", "Sweeping QA + fact-check (one transcript per agent, strict isolation)."),
        ("Layer 5", "Corpus-global fidelity audit: phantom Whisper renderings, bidirectional canonical consistency, catalog-vs-per-entry contradictions."),
        ("Pass 6", "Apply-step discipline lockdown after the Pass 7 PRR side-file regression."),
        ("Pass 7 PRR", "Narrative-coherence pass: catches ASR name-bleed cases that alias matching cannot."),
        ("Pass 8", "Library of Congress canonical-archive cross-reference. The first pass anchored to a primary external authority. Coverage: 127 / 127 (100%)."),
    ]
    cur = Inches(2.05)
    for label, body in passes:
        add_chip(s, label, left=Inches(0.7), top=cur, color=RED_BODY, width=Inches(1.5))
        add_text(
            s, body,
            left=Inches(2.35), top=cur + Inches(0.04),
            width=Inches(10.4), height=Inches(0.55),
            size=14, color=STONE_700, font="Inter",
        )
        cur += Inches(0.6)
    return s


def slide_05_loc_pass():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Pass 8: Library of Congress healing")
    add_title(s, "The 9th pass that anchored the corpus to its canonical authority.")
    add_text(
        s,
        "Library of Congress and the Smithsonian NMAAHC jointly produced this corpus. "
        "LoC has authoritative transcripts for every interview. Passes 1-7 used internal "
        "ground truth + adversarial-model review but never cross-referenced our transcripts "
        "against LoC's own. Pass 8 fixed that.",
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(1.6),
        size=16, color=STONE_700, font="Source Serif 4",
    )
    # Workflow
    steps = [
        ("1.", "Resolve LoC item URL for each interviewee (search API + PDF fallback)."),
        ("2.", "Word-align our Whisper-derived .srt against LoC's transcript text."),
        ("3.", "Classify each divergence under conservative-first-pass discipline."),
        ("4.", "Apply only the deterministic-verdict heals inside existing cue boundaries."),
        ("5.", "Flag the rest for SME review (per-entry stage file: pass8_stage/entry_NNN_<slug>.md)."),
        ("6.", "Audit-canon safeguard: do not auto-reverse a confirmed prior-pass correction."),
    ]
    cur = Inches(3.7)
    for num, body in steps:
        add_text(
            s, num,
            left=Inches(0.7), top=cur,
            width=Inches(0.6), height=Inches(0.4),
            size=16, bold=True, color=RED_BRAND, font="Chivo Mono",
        )
        add_text(
            s, body,
            left=Inches(1.3), top=cur + Inches(0.02),
            width=Inches(11.5), height=Inches(0.5),
            size=14, color=STONE_700, font="Inter",
        )
        cur += Inches(0.45)
    return s


def slide_06_coverage():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Coverage achieved")
    add_title(s, "Every audit-able interview cross-validated against LoC.")
    rows = [
        ("Total interviews in audit-able corpus", "127"),
        ("Healed against LoC reference text", "127  (100%)"),
        ("Healed via LoC TEI2 XML transcripts", "92"),
        ("Healed via LoC PDF text extraction", "35"),
        ("Audio-only on LoC (no transcript available at all)", "0"),
        ("Total ASR-error heals applied", "~2,600"),
        ("Total divergences flagged for SME review", "~95,000"),
        ("Apply failures", "0"),
        ("Cue-count / timestamp verification failures", "0"),
    ]
    add_table(
        s,
        ["Metric", "Value"],
        rows,
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(4.5),
    )
    add_text(
        s,
        "LoC has machine-extractable transcripts for every interview in our corpus, "
        "and we have cross-validated all 127. Coverage is complete.",
        left=Inches(0.7), top=Inches(6.45),
        width=Inches(12), height=Inches(0.5),
        size=14, color=RED_BODY, font="Inter",
    )
    return s


def slide_07_conservative():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Conservative-first-pass discipline")
    add_title(s, "95,000 divergences detected.  ~2,600 applied as heals.  Why so few?")
    add_text(
        s,
        "The automatic-apply path is reserved for cases we are highly confident:",
        left=Inches(0.7), top=Inches(2.05),
        width=Inches(12), height=Inches(0.5),
        size=16, color=STONE_700, font="Source Serif 4",
    )
    bullets = [
        ("Single-word proper-noun substitution.", "Klein -> Cline.  Wide phonetic confusion band kept, anything broader skipped."),
        ("Similarity ratio in the 0.55-0.95 band.", "Close enough to be ASR phonetic confusion, far enough not to be case or orthography drift."),
        ("Our token NOT in the audit-canon set.", "Never reverse a confirmed prior-pass correction; surface as SME review instead."),
        ("Adjacent characters not contraction or hyphen.", "Avoids the substring-substitution landmines: 'don' -> 'Daniel H. Crena de Iongh' eats 'don't'."),
    ]
    add_bullets(
        s, bullets,
        left=Inches(0.7), top=Inches(2.7),
        width=Inches(12), height=Inches(3.5),
        size=15,
    )
    box = s.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.7), Inches(5.8),
        Inches(11.9), Inches(1.2),
    )
    box.fill.solid()
    box.fill.fore_color.rgb = WHITE
    box.line.color.rgb = RED_BRAND
    box.line.width = Pt(2)
    add_text(
        s,
        'The conservative path means we do not auto-introduce new errors while fixing old ones. '
        'Everything outside the clean buckets stays preserved verbatim and catalogued for human review.',
        left=Inches(1.0), top=Inches(5.95),
        width=Inches(11.3), height=Inches(0.9),
        size=14, color=STONE_700, font="Source Serif 4",
    )
    return s


def slide_08_challenges():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Challenge categories")
    add_title(s, "What else broke, and how we handled it.")
    rows = [
        ("Incorrect header / interviewer attribution",
         '"David Klein" everywhere it should have been David Cline. Pass 8 fixed all instances against LoC.'),
        ("Incomplete transcripts",
         "Whisper sometimes emptied multi-speaker joint interviews (e.g., the Ladners). Re-ingested via the streamlined 2026-05-25 pipeline."),
        ("Multiple speakers in one cue",
         "ASR cannot reliably segment overlapping voices. Affected entries flagged as ingestion-only tier so retrieval can hedge."),
        ("Corrupted transcriptions",
         "Audubon Ballroom -> Auto bom barroom; Lenox Avenue -> Linux Avenue. Pass 8 catches when LoC has the canonical form."),
        ("ASR name-bleed",
         "Two distinct figures merged into one: Paul Robeson + Paul Hoffman -> Paul Hoffman Robeson. Requires narrative-coherence pass (Pass 7)."),
        ("Short-needle substitution corruption",
         "'don' -> 'Daniel H. Crena de Iongh' would eat 'don't'. Fixed via word-boundary + contraction-suffix guards in apply_corrections."),
        ("Audit-canon leakage",
         "Whisper-derived spelling promoted in an early pass, then never re-checked. Pass 8 surfaces 710 cases where audit-canon disagrees with LoC."),
    ]
    add_table(
        s,
        ["Challenge", "How it surfaces / how we handled it"],
        rows,
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(4.6),
    )
    return s


def slide_09_what_it_enables():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "What the cleaned corpus enables")
    add_title(s, "A live, interactive RAG layer on top of an audit-grade substrate.")
    add_text(
        s,
        "Audit cleanliness is the foundation. The retrieval layer is what makes the corpus "
        "useful to a researcher today.",
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(0.8),
        size=16, color=STONE_700, font="Source Serif 4",
    )
    bullets = [
        ("Voyage AI voyage-3 embeddings (1024-dim).",
         "Retrieval-tuned; finds passages that ANSWER a question, not just passages that mention the same words."),
        ("Pinecone Builder serverless vector index.",
         "15,464 time-anchored .srt chunks across the 136-entry unified corpus."),
        ("Voyage rerank-2 on top of vector search.",
         "Reorders candidates by deeper semantic relevance after the initial 50-candidate pull."),
        ("5-tier fidelity badge on every passage.",
         "low / medium / publication-block / not-auditable / ingestion-only. The Smithsonian rigor surfaced at the result level."),
        ("Library of Congress catalog deep-link on every result.",
         "The audience can verify the source against the canonical archive in one click."),
    ]
    add_bullets(
        s, bullets,
        left=Inches(0.7), top=Inches(2.9),
        width=Inches(12), height=Inches(4.0),
        size=15,
    )
    return s


def slide_10_demos():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "/rag-explore  -  the interactive demo page")
    add_title(s, "Six surfaces on one page, all on the same embedding substrate.")
    demos = [
        ("Spectrum",
         "136 dots placed along one named conceptual axis at a time. Nonviolence as Theology vs. Armed Self-Defense, Sacred vs. Secular Framing, etc. Click a dot to drill into the passages anchoring it.",
         VIOLET_700),
        ("Semantic Overlap",
         "Pick an interview. See which other voices in the corpus discuss semantically-related material. The 'voices in conversation' demo.",
         SKY_700),
        ("Word Search",
         "Four 2D scatters across pairs of named axes, plus a 5-spectrum 1D summary that lights up when you type a phrase and projects it onto every axis at once.",
         EMERALD_700),
        ("Interview Map",
         "136 dots in UMAP-projected space with empirically-derived axis labels extracted from the corpus itself (Medical Law, Movement, Family, Crime).",
         RED_BODY),
        ("Quote Finder",
         "Paste a half-remembered quote, get the source with the exact timestamp and LoC catalog link.",
         INK),
        ("Secondary surfaces",
         "Themes / Famous Names / Atlas / Network / Tours / Quote of the Day, each drawn from precomputed JSON for no-LLM-per-query rendering.",
         STONE_700),
    ]
    grid_left = Inches(0.7)
    grid_top = Inches(2.0)
    card_w = Inches(6.0)
    card_h = Inches(1.65)
    gap_x = Inches(0.2)
    gap_y = Inches(0.2)
    for i, (label, body, color) in enumerate(demos):
        col = i % 2
        row = i // 2
        x = grid_left + (card_w + gap_x) * col
        y = grid_top + (card_h + gap_y) * row
        card = s.shapes.add_shape(
            MSO_SHAPE.RECTANGLE, x, y, card_w, card_h
        )
        card.fill.solid()
        card.fill.fore_color.rgb = WHITE
        card.line.color.rgb = STONE_200
        card.line.width = Pt(1)
        add_chip(s, label, left=x + Inches(0.2), top=y + Inches(0.15),
                 color=color, width=Inches(2.4))
        add_text(
            s, body,
            left=x + Inches(0.2), top=y + Inches(0.7),
            width=card_w - Inches(0.4), height=card_h - Inches(0.8),
            size=11, color=STONE_700, font="Source Serif 4",
        )
    return s


def slide_mcp():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "MCP server  -  the corpus as a connector")
    add_title(s, "Same substrate, different interface.  Reachable from any MCP client.")
    add_text(
        s,
        "The Model Context Protocol server (mcp-server/server.mjs) exposes the same "
        "Pinecone + Voyage substrate to LLM chat clients (Codex Desktop, Claude Desktop, "
        "Anthropic Connector Directory). Six tools, three of them research-pattern, "
        "all citation-grade.",
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(1.5),
        size=15, color=STONE_700, font="Source Serif 4",
    )

    # Two-column layout: primitives on the left, research patterns on the right
    add_text(
        s, "PRIMITIVE TOOLS",
        left=Inches(0.7), top=Inches(3.55),
        width=Inches(5.5), height=Inches(0.3),
        size=11, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    primitives = [
        ("search_transcripts", "Citation-grade semantic search across the archive.  Filters by entry, tier, dedupe-by-entry."),
        ("get_transcript", "Full ordered transcript for one entry_number."),
        ("list_leaders", "Archive roster: entry numbers, LoC URLs, provenance, audit tiers."),
    ]
    cur = Inches(3.95)
    for name, body in primitives:
        add_text(
            s, name,
            left=Inches(0.7), top=cur,
            width=Inches(5.5), height=Inches(0.3),
            size=13, bold=True, color=INK, font="Chivo Mono",
        )
        add_text(
            s, body,
            left=Inches(0.7), top=cur + Inches(0.3),
            width=Inches(5.5), height=Inches(0.6),
            size=11, color=STONE_700, font="Source Serif 4",
        )
        cur += Inches(0.95)

    add_text(
        s, "RESEARCH-PATTERN TOOLS",
        left=Inches(6.8), top=Inches(3.55),
        width=Inches(5.8), height=Inches(0.3),
        size=11, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    patterns = [
        ("compare_perspectives({ topic })",
         "Multiple interviewee voices on one topic, deduped by entry, with citation framing."),
        ("trace_evolution({ interviewee, topic })",
         "Chronologically ordered passages from one interview, scoped to one topic."),
        ("source_for_claim({ claim })",
         "Passages that support, complicate, or contradict a claim.  Preserves citation metadata."),
    ]
    cur = Inches(3.95)
    for name, body in patterns:
        add_text(
            s, name,
            left=Inches(6.8), top=cur,
            width=Inches(5.8), height=Inches(0.3),
            size=13, bold=True, color=INK, font="Chivo Mono",
        )
        add_text(
            s, body,
            left=Inches(6.8), top=cur + Inches(0.3),
            width=Inches(5.8), height=Inches(0.6),
            size=11, color=STONE_700, font="Source Serif 4",
        )
        cur += Inches(0.95)

    # Footer band: what the MCP layer is for
    band = s.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        Inches(0.7), Inches(6.5), Inches(11.9), Inches(0.5),
    )
    band.fill.solid()
    band.fill.fore_color.rgb = INK
    band.line.fill.background()
    add_text(
        s,
        "Every tool returns Chicago / APA / MLA citation blocks + the LoC catalog URL.  Deployable to Fly.io; verified locally against the live Pinecone index.",
        left=Inches(0.9), top=Inches(6.58),
        width=Inches(11.6), height=Inches(0.45),
        size=11, color=WHITE, font="Chivo Mono",
    )
    return s


def slide_11_philosophy():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Philosophy of embedding")
    add_title(s, "When two voices land within 0.12 cosine, the embedding heard them.")
    add_text(
        s,
        "Cosine similarity is reading a thematic kinship the speakers may never have realized they shared. "
        "This is the conceptual move that turns retrieval into discovery.",
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(1.2),
        size=18, color=STONE_700, font="Source Serif 4",
    )
    bullets = [
        ("Geometric, deterministic, no LLM per query.",
         "Spectrum positions are pure dot products. Same query renders the same way across reloads."),
        ("Named axes, not statistical leftovers.",
         "UMAP and PCA give 'directions of max variance' that mean nothing to a researcher. Our axes are hand-curated semantic dimensions."),
        ("Cross-surface synchronization.",
         "Hover Aaron Dixon in one chart, see him move across the other three. The shift is what the structure means."),
        ("Provenance + uncertainty are first-class metadata.",
         "Every chunk knows its audit tier and its Library of Congress catalog URL. Citation-grade output by construction."),
    ]
    add_bullets(
        s, bullets,
        left=Inches(0.7), top=Inches(3.4),
        width=Inches(12), height=Inches(3.5),
        size=15,
    )
    return s


def slide_12_steering_hierarchy():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "Steering Document Hierarchy")
    add_title(s, "Six tiers.  Read top-down, build out from there.")
    rows = [
        ("Tier 1", "Orientation",
         "CLAUDE.md, README.md, PRESENTATION_REFERENCE.md"),
        ("Tier 2", "Active reference",
         "docs/*.md, rag/README.md, rag/INTERACTIVE_FEATURES_DESIGN.md, rag/OPERATIONS.md, rag/ENDPOINTS.md, mcp-server/USAGE_GUIDE.md"),
        ("Tier 3", "Lessons learned",
         "lessons_learned.md, docs/RAG_SUBSTRATE_DECISION.md"),
        ("Tier 4", "Demo prep",
         "rag/CONFERENCE_PREP.md, rag/DEMO_SCRIPT.md"),
        ("Tier 5", "Provenance / historical record",
         "transcripts/AUDIT_TRAIL.md, transcripts/CLEANED_TRANSCRIPTS_REVIEW.md, transcripts/loc_healing/COVERAGE_REPORT.md, per-pass stage files"),
        ("Tier 6", "Deprecated",
         "docs/WEAVIATE_INTEGRATION_DESIGN.md  (substrate pivoted 2026-05-22)"),
    ]
    add_table(
        s,
        ["Tier", "Purpose", "Documents"],
        rows,
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(4.4),
    )
    add_text(
        s,
        "Full hierarchy + 'when to read what' cheat sheet: STEERING_DOCS.md at the project root.",
        left=Inches(0.7), top=Inches(6.6),
        width=Inches(12), height=Inches(0.4),
        size=14, color=RED_BODY, font="Inter",
    )
    return s


def slide_13_when_to_read():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "When to read what")
    add_title(s, "Most-common-task cheat sheet.")
    rows = [
        ("Start contributing for the first time", "CLAUDE.md"),
        ("Brief an external stakeholder", "PRESENTATION_REFERENCE.md  then  lessons_learned.md"),
        ("Demo the live site", "rag/DEMO_SCRIPT.md"),
        ("Edit audit overlays", "CLAUDE.md (audit discipline)  +  transcripts/AUDIT_TRAIL.md"),
        ("Ingest a new transcript", "transcripts/ingestion/README.md"),
        ("Touch the RAG ingest / retrieval code", "rag/README.md"),
        ("Build a new interactive surface", "rag/INTERACTIVE_FEATURES_DESIGN.md"),
        ("Deploy to staging or production", "docs/DEPLOYMENT.md  +  rag/OPERATIONS.md"),
        ("Touch the MCP server", "mcp-server/README.md  +  mcp-server/USAGE_GUIDE.md"),
        ("Touch styling, colors, accessibility", "docs/ACCESSIBILITY.md  +  CLAUDE.md (writing rules)"),
        ("Show a Smithsonian / LoC reviewer the rigor", "transcripts/AUDIT_TRAIL.md  +  loc_healing/COVERAGE_REPORT.md  +  per-entry stage files"),
    ]
    add_table(
        s,
        ["You are about to...", "Read first"],
        rows,
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(4.6),
    )
    return s


def slide_14_next():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    add_section_label(s, "What is deferred / what is next")
    add_title(s, "Known follow-on work.")
    bullets = [
        ("5 spelling-discrepancy entries.",
         "Alternative-spelling re-search against LoC catalog. Recoverable; small, targeted."),
        ("~92,000 SME-flagged divergences.",
         "Future targeted pass with model classification. Most are editorial smoothing; a meaningful minority are real corrections we declined to auto-apply."),
        ("Forced-alignment timing improvement.",
         "WhisperX or Montreal Forced Aligner against LoC audio. Tightens per-clip precision below the current ~5-second cue grid. Independent of text quality."),
        ("MCP server deploy to Fly.io.",
         "Code verified locally. Awaiting flyctl auth login + fly deploy."),
        ("Pipeline run on the 135 raw transcripts.",
         "Dual-scoring + citation audit. ~$5.40 estimated cost across the full corpus."),
        ("Firebase Cloud Functions deploy.",
         "Requires Blaze billing on the new project + firebase functions:secrets:set OPENAI_API_KEY."),
    ]
    add_bullets(
        s, bullets,
        left=Inches(0.7), top=Inches(2.0),
        width=Inches(12), height=Inches(4.5),
        size=14,
    )
    return s


def slide_15_close():
    s = prs.slides.add_slide(BLANK)
    add_background(s)
    # decorative right accent bar
    bar = s.shapes.add_shape(
        MSO_SHAPE.RECTANGLE,
        prs.slide_width - Inches(0.22), Inches(0), Inches(0.22), prs.slide_height
    )
    bar.fill.solid()
    bar.fill.fore_color.rgb = RED_BRAND
    bar.line.fill.background()
    add_text(
        s, "WHAT TO TAKE AWAY",
        left=Inches(0.9), top=Inches(0.9),
        width=Inches(11), height=Inches(0.5),
        size=14, bold=True, color=RED_BODY, font="Chivo Mono",
    )
    add_text(
        s,
        "We built an audit instrument, not a clean-up script.",
        left=Inches(0.9), top=Inches(1.5),
        width=Inches(12), height=Inches(0.9),
        size=32, bold=True, color=INK, font="Inter",
    )
    add_text(
        s,
        "Eight internal passes plus a Library of Congress healing pass against the canonical "
        "archive. Conservative-first-pass discipline so we do not auto-introduce new errors. "
        "Every passage carries its audit tier and its LoC catalog deep-link. The substrate is "
        "live at civil-rights-staging.netlify.app and the six demos on /rag-explore are what "
        "the cleaned corpus enables right now.",
        left=Inches(0.9), top=Inches(2.7),
        width=Inches(11.5), height=Inches(2.5),
        size=18, color=STONE_700, font="Source Serif 4",
    )
    add_text(
        s, "Questions.",
        left=Inches(0.9), top=Inches(5.6),
        width=Inches(11.5), height=Inches(0.8),
        size=40, bold=True, color=RED_BRAND, font="Inter",
    )
    return s


renderers = [
    slide_01_title,
    slide_02_problem,
    slide_03_error_examples,
    slide_04_audit_cascade,
    slide_05_loc_pass,
    slide_06_coverage,
    slide_07_conservative,
    slide_08_challenges,
    slide_09_what_it_enables,
    slide_10_demos,
    slide_mcp,
    slide_11_philosophy,
    slide_12_steering_hierarchy,
    slide_13_when_to_read,
    slide_14_next,
    slide_15_close,
]


total = len(renderers)
for i, r in enumerate(renderers, start=1):
    slide = r()
    # add footer to non-title / non-close slides
    if i != 1 and i != total:
        add_footer(slide, i, total)


out_path = Path("wwu_presentation_2026-05-27.pptx")
prs.save(out_path)
print(f"Wrote {out_path.resolve()}")
print(f"  Total slides: {total}")
