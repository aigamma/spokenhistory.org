#!/usr/bin/env python3
"""Generate the figures embedded in docs/TECHNICAL_PAPER.md / .docx.

Run from the repository root:

    python docs/figures/technical-paper/generate_figures.py

Figures that visualize corpus data (constellation, spectrum, influence graph,
index composition, time substrate) read the live repo artifacts under
public/rag/ and transcripts/, so re-running after a corpus change refreshes
them. The remaining figures are architectural diagrams whose quantitative
labels mirror the verified numbers in the paper's Appendix A; update both
together.
"""

import json
import re
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
import numpy as np
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch

ROOT = Path(__file__).resolve().parents[3]
OUT = Path(__file__).resolve().parent
RAG = ROOT / "public" / "rag"

# Palette: stone-900 text, the project's two reds, and the site's tier scale.
INK = "#1c1917"
ACCENT = "#B23E2F"
BRAND = "#F2483C"
PAPER = "#ffffff"
STONE = "#57534e"
FAINT = "#e7e5e4"

TIER_COLORS = {
    "high": "#059669",
    "low": "#d97706",
    "medium": "#eab308",
    "publication-block": "#dc2626",
    "not-auditable": "#7c3aed",
    "ingestion-only": "#64748b",
    None: "#94a3b8",
    "unknown": "#94a3b8",
}

plt.rcParams.update(
    {
        "font.family": "DejaVu Sans",
        "text.color": INK,
        "axes.edgecolor": STONE,
        "axes.labelcolor": INK,
        "xtick.color": STONE,
        "ytick.color": STONE,
        "figure.facecolor": PAPER,
        "axes.facecolor": PAPER,
        "savefig.facecolor": PAPER,
        "font.size": 10,
    }
)

DPI = 200


def save(fig, name):
    path = OUT / name
    fig.savefig(path, dpi=DPI, bbox_inches="tight", pad_inches=0.25)
    plt.close(fig)
    print("wrote", path.name)


def box(ax, x, y, w, h, text, fc="#fafaf9", ec=STONE, fontsize=9, weight="normal", tc=INK):
    ax.add_patch(
        FancyBboxPatch(
            (x, y), w, h, boxstyle="round,pad=0.012", fc=fc, ec=ec, lw=1.1,
            mutation_aspect=1.0,
        )
    )
    ax.text(x + w / 2, y + h / 2, text, ha="center", va="center",
            fontsize=fontsize, weight=weight, color=tc, linespacing=1.35)


def arrow(ax, x1, y1, x2, y2, color=STONE, lw=1.4, style="-|>"):
    ax.add_patch(
        FancyArrowPatch((x1, y1), (x2, y2), arrowstyle=style, color=color,
                        lw=lw, mutation_scale=14, shrinkA=2, shrinkB=2)
    )


# ---------------------------------------------------------------- figure 1
def fig01_architecture():
    fig, ax = plt.subplots(figsize=(11.5, 7.2))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    # Row 1: sources
    box(ax, 2, 86, 29, 10, "LoC media\n(tile.loc.gov MP4 streams)", fc="#f0f9ff")
    box(ax, 35.5, 86, 29, 10, "Whisper ASR\n.srt cues, millisecond timestamps", fc="#f0f9ff")
    box(ax, 69, 86, 29, 10, "LoC published transcripts\nTEI2 XML and PDF via the LoC API", fc="#f0f9ff")

    # Row 2: correction layer
    box(ax, 19, 68, 62, 11,
        "Correction layer (non-destructive overlay)\n"
        "Passes 1-7 internal audit canon + Pass 8 LoC word-level heal\n"
        "raw/ is never edited; corrected/ regenerates from raw/ + overlay",
        fc="#fef3c7")
    arrow(ax, 50, 86, 50, 79.4)
    arrow(ax, 83.5, 86, 60, 79.4)

    # Row 3: generation
    box(ax, 2, 50, 45, 11,
        "Metadata pipeline (Python)\n7 steps; dual-scorer publication gate\n90/90 on both model families, fail closed",
        fc="#fee2e2")
    box(ax, 53, 50, 45, 11,
        "Onboarding pipeline (16 idempotent stages)\nLoC heal, chapterization, assembly,\nvector ingest, cross-link network rebuild",
        fc="#fee2e2")
    arrow(ax, 38, 68, 24.5, 61.4)
    arrow(ax, 62, 68, 75.5, 61.4)

    # Row 4: artifacts
    box(ax, 2, 30, 45, 13,
        "Static JSON artifacts (public/rag/)\nentry_<N>.json, toc, playlist index,\n202 person pages, 23 essays,\ncentroids, axes, neighbors, influence",
        fc="#ecfdf5")
    box(ax, 53, 30, 45, 13,
        "Pinecone index (civil-rights)\n16,759 vectors: 15,687 passages,\n203 person, 869 essay (live 2026-06-10)\nvoyage-3, 1024-dim, cosine + rerank-2",
        fc="#ecfdf5")
    arrow(ax, 24.5, 50, 24.5, 43.4)
    arrow(ax, 75.5, 50, 75.5, 43.4)

    # Row 5: surfaces
    box(ax, 2, 8, 29, 13,
        "React site (Netlify)\nspokenhistory.org\nbounded-clip player,\nplaylists, palette search", fc="#ede9fe")
    box(ax, 35.5, 8, 29, 13,
        "/retrieve function\n(Netlify, server-side proxy)\ncitation-grade passage search", fc="#ede9fe")
    box(ax, 69, 8, 29, 13,
        "MCP server (Fly.io)\nmcp.spokenhistory.org/mcp\n8 tools, 3 prompts, resources\nfor any AI client", fc="#ede9fe")
    arrow(ax, 16.5, 30, 16.5, 21.4)
    arrow(ax, 50, 30, 50, 21.4)
    arrow(ax, 75.5, 30, 60, 21.4)
    arrow(ax, 83.5, 30, 83.5, 21.4)

    ax.text(1, 100.5, "From Archive Sources to Exploration Surfaces", fontsize=13, weight="bold")
    ax.text(1, 97.5, "Every layer preserves the (entry, start, end) time anchor and the LoC citation chain.",
            fontsize=9.5, color=STONE)
    save(fig, "fig01_system_architecture.png")


# ---------------------------------------------------------------- figure 2
def fig02_healing_fusion():
    # Pull the real Klein -> Cline heal site from the corrected SRT; never invent a cue.
    srt_files = sorted((ROOT / "transcripts" / "corrected").glob("Aaron*Dixon*/*.srt")) or sorted(
        (ROOT / "transcripts" / "corrected").glob("Aaron*/*.srt"))
    if not srt_files:
        raise SystemExit("fig02: no corrected Aaron Dixon .srt found")
    raw = srt_files[0].read_text(encoding="utf-8", errors="replace")
    cue_line = None
    for b in re.split(r"\n\s*\n", raw):
        lines = [ln for ln in b.strip().splitlines() if ln.strip()]
        if len(lines) >= 3 and "-->" in lines[1] and "David Cline" in " ".join(lines[2:]):
            body = " ".join(lines[2:])
            if len(body) > 70:
                body = body[:67].rstrip() + "..."
            cue_line = lines[1] + "   “" + body + "”"
            break
    if cue_line is None:
        raise SystemExit("fig02: no David Cline cue found in the corrected SRT")

    fig, ax = plt.subplots(figsize=(11.5, 6.4))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    box(ax, 2, 64, 42, 26,
        "Library of Congress transcript\n(TEI2 XML or PDF)\n\n"
        "Authoritative text, edited prose\n540 speaker turns; only coarse\nfive-minute markers (Aaron Dixon)",
        fc="#f0f9ff", fontsize=9.5)
    box(ax, 56, 64, 42, 26,
        "Whisper ASR transcript\n(.srt)\n\n"
        "1,944 cues with millisecond\ntimestamps, but phonetic errors:\nKlein for Cline, PSU for BSU",
        fc="#fef3c7", fontsize=9.5)

    box(ax, 22, 36, 56, 17,
        "Word-level alignment (difflib SequenceMatcher, autojunk off)\n"
        "2,222 divergences for this entry, each with dual 8-word context\n"
        "Deterministic verdict rules only; no model in the loop",
        fc="#fee2e2", fontsize=9.5)
    arrow(ax, 23, 64, 38, 53.4)
    arrow(ax, 77, 64, 62, 53.4)

    box(ax, 9, 6, 82, 19,
        "Healed transcript: LoC's canonical names inside Whisper's time grid\n"
        "30 heals applied for this entry; cue boundaries untouched, zero timestamp drift\n"
        + cue_line,
        fc="#ecfdf5", fontsize=9.5)
    arrow(ax, 50, 36, 50, 25.4)

    ax.text(1, 99, "Fusing Textual Authority With Temporal Resolution", fontsize=13, weight="bold")
    ax.text(1, 94.5, "Neither source alone has both; the heal produces an artifact that does.",
            fontsize=9.5, color=STONE)
    save(fig, "fig02_healing_fusion.png")


# ---------------------------------------------------------------- figure 3
def fig03_divergence_outcomes():
    total = 185_091
    parts = [
        ("Healed (ASR error, applied)", 2_629, ACCENT),
        ("Preserved verbatim (LoC editorial smoothing, disfluency)", 49_829, "#059669"),
        ("Deferred to SME review (no deterministic verdict)", 132_633, "#94a3b8"),
    ]
    fig, ax = plt.subplots(figsize=(11.5, 3.9))
    left = 0
    for label, n, color in parts:
        ax.barh(0, n, left=left, color=color, edgecolor="white", height=0.55)
        left += n
    ax.set_xlim(0, total)
    ax.set_ylim(-0.9, 1.4)
    ax.set_yticks([])
    ax.set_xticks([0, 50_000, 100_000, 150_000, 185_091])
    ax.get_xaxis().set_major_formatter(lambda x, _: f"{int(x):,}")
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)

    ax.annotate("Healed: 2,629 (1.4%)", xy=(1_300, 0.28), xytext=(4_000, 1.05),
                fontsize=9.5, weight="bold", color=ACCENT,
                arrowprops=dict(arrowstyle="-", color=ACCENT, lw=1))
    ax.text(2_629 + 24_900, 0, "Preserved verbatim:\n49,829 (26.9%)", ha="center",
            va="center", fontsize=9.5, weight="bold", color="white")
    ax.text(2_629 + 49_829 + 66_300, 0, "Deferred to SME review: 132,633 (71.7%)",
            ha="center", va="center", fontsize=9.5, weight="bold", color=INK)
    ax.set_title("Pass 8 Outcomes Across 185,091 Aligned Divergences (140 Entries, as of 2026-06-10)",
                 fontsize=12, weight="bold", loc="left", pad=12)
    ax.text(0, -0.78,
            "Conservative by design: only rule-classified ASR errors are applied. 0 apply failures, 0 cue-count "
            "verification failures.\nThe verbatim layer deliberately preserves spoken disfluency that LoC's edited prose removes.",
            fontsize=8.5, color=STONE)
    save(fig, "fig03_divergence_outcomes.png")


# ---------------------------------------------------------------- figure 4
def fig04_audit_cascade():
    passes = [
        ("Pass 1 (sequential read)", 3_000, "internal", "~3,000 corrections, 132 entries"),
        ("Pass 2 + tail (parallel supervisors)", 4_870, "internal", "~4,000 + ~870 corrections"),
        ("Pass 3 (consolidation)", 1_500, "internal", "~1,500 confidence resolutions"),
        ("Pass 4 (isolated agents + fact-check)", 2_500, "internal", "~2,500 net-new catches"),
        ("Layer 5 (corpus-global self-audit)", 939, "self", "939 phantom rows found, 770 removed"),
        ("Pass 6 (adversarial re-resolution)", 300, "self", "300 low-confidence items re-judged"),
        ("Pass 7 (publication-readiness review)", 330, "self", "330 summary claims fixed"),
        ("Pass 8 (LoC canonical heal)", 2_629, "external", "2,629 heals vs LoC's own text"),
    ]
    colors = {"internal": "#d97706", "self": "#7c3aed", "external": ACCENT}
    fig, ax = plt.subplots(figsize=(11.5, 5.6))
    ys = np.arange(len(passes))[::-1]
    for y, (name, n, kind, note) in zip(ys, passes):
        ax.barh(y, n, color=colors[kind], height=0.62, edgecolor="white")
        ax.text(n + 60, y, note, va="center", fontsize=9, color=INK)
    ax.set_yticks(ys)
    ax.set_yticklabels([p[0] for p in passes], fontsize=9.5)
    ax.set_xlim(0, 8_200)
    ax.set_xlabel("Findings produced (count; definitions differ per pass)", fontsize=9)
    for spine in ("top", "right"):
        ax.spines[spine].set_visible(False)
    handles = [plt.Rectangle((0, 0), 1, 1, color=c) for c in colors.values()]
    ax.legend(handles, ["Internal review of ASR text", "The audit auditing itself",
                        "External authority (Library of Congress)"],
              loc="lower right", frameon=False, fontsize=9)
    ax.set_title("The Audit Cascade: Internal Review, Self-Audit, Then an External Anchor",
                 fontsize=12, weight="bold", loc="left", pad=12)
    save(fig, "fig04_audit_cascade.png")


# ---------------------------------------------------------------- figure 5
def fig05_time_substrate():
    # Pull a real cue and a real chapter so the diagram is data-true.
    def ts_to_s(ts):
        m = re.match(r"(\d+):(\d+):(\d+)", str(ts))
        return int(m.group(1)) * 3600 + int(m.group(2)) * 60 + int(m.group(3)) if m else 0

    entry = json.load(open(RAG / "summaries" / "pipeline_output" / "entry_1.json", encoding="utf-8"))
    chapters = entry.get("chapters") or entry.get("metadata", {}).get("chapters") or []
    chap = None
    for c in chapters:
        if c.get("part") and c.get("start_time") and c.get("end_time") and ts_to_s(c["start_time"]) > 0:
            chap = c
            break
    if chap is None:
        raise SystemExit("fig05: no usable chapter found in entry_1.json")
    c_title = (chap.get("chapter_title") or chap.get("title") or "Chapter")[:60]
    c_part = (chap.get("part") or "Part")[:60]
    c_start, c_end = chap["start_time"], chap["end_time"]

    # A real cue from inside that chapter's time range; never invent one.
    srt_files = sorted((ROOT / "transcripts" / "corrected").glob("Aaron*Dixon*/*.srt")) or sorted(
        (ROOT / "transcripts" / "corrected").glob("Aaron*/*.srt"))
    if not srt_files:
        raise SystemExit("fig05: no corrected Aaron Dixon .srt found")
    raw = srt_files[0].read_text(encoding="utf-8", errors="replace")
    lo, hi = ts_to_s(c_start) + 5, ts_to_s(c_end) - 5
    cue_text = None
    for b in re.split(r"\n\s*\n", raw):
        lines = [ln for ln in b.strip().splitlines() if ln.strip()]
        if len(lines) >= 3 and "-->" in lines[1]:
            cue_s = ts_to_s(lines[1].split("-->")[0].strip())
            body = " ".join(lines[2:])
            if lo <= cue_s <= hi and 45 < len(body) < 90:
                cue_text = lines[1] + "\n“" + body + "”"
                break
    if cue_text is None:
        raise SystemExit("fig05: no suitable cue found inside the chapter range")

    url = f"/interview/1?t={ts_to_s(c_start)}&end={ts_to_s(c_end)}"

    fig, ax = plt.subplots(figsize=(11.5, 6.8))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    box(ax, 6, 78, 88, 15,
        "Whisper SRT cue (the atomic time anchor, millisecond precision)\n" + cue_text,
        fc="#fef3c7", fontsize=9.5)
    box(ax, 6, 55, 88, 15,
        f"Cue-aligned chapter (authored segmentation; boundaries are verbatim cue timestamps)\n"
        f"“{c_title}”   {c_start} to {c_end}",
        fc="#ecfdf5", fontsize=9.5)
    box(ax, 6, 32, 88, 15,
        f"Named part (chapters grouped for reading)\n“{c_part}”\n"
        "Corpus-wide: 4,932 chapters in 1,387 parts across 140 interviews",
        fc="#f0f9ff", fontsize=9.5)
    box(ax, 6, 8, 88, 16,
        "Stable URL: any moment is shareable and citable\n"
        f"{url}\n"
        "The player opens seeked to t and pauses at end; second precision at the URL layer",
        fc="#ede9fe", fontsize=10)
    arrow(ax, 50, 78, 50, 70.4)
    arrow(ax, 50, 55, 50, 47.4)
    arrow(ax, 50, 32, 50, 24.4)
    ax.text(5, 98, "The Time Substrate: From ASR Cue to Citable URL", fontsize=13, weight="bold")
    save(fig, "fig05_time_substrate.png")


# ---------------------------------------------------------------- figure 6
def fig06_constellation():
    c = json.load(open(RAG / "constellation.json", encoding="utf-8"))
    pts = c["points"]
    fig, ax = plt.subplots(figsize=(9.8, 8.2))
    tiers = {}
    for p in pts:
        tiers.setdefault(p.get("uncertainty_tier"), []).append(p)
    order = ["high", "low", "medium", "publication-block", "not-auditable", "ingestion-only", None, "unknown"]
    for tier in order:
        group = tiers.get(tier)
        if not group:
            continue
        xs = [p["x"] for p in group]
        ys = [p["y"] for p in group]
        sizes = [22 + p.get("chunk_count", 60) * 0.32 for p in group]
        label = f"{tier if tier else 'untagged'} ({len(group)})"
        ax.scatter(xs, ys, s=sizes, c=TIER_COLORS.get(tier, "#94a3b8"),
                   alpha=0.78, edgecolors="white", linewidths=0.6, label=label)
    # Label a few high-chunk-count voices for orientation.
    for p in sorted(pts, key=lambda q: -q.get("chunk_count", 0))[:7]:
        name = p["entry_subject"].split(" and ")[0]
        ax.annotate(name, (p["x"], p["y"]), textcoords="offset points",
                    xytext=(7, 5), fontsize=8, color=INK)
    ax.set_xticks([])
    ax.set_yticks([])
    for spine in ax.spines.values():
        spine.set_color(FAINT)
    ax.legend(loc="upper left", frameon=False, fontsize=8.5, title="Audit tier (count)",
              title_fontsize=9)
    ax.set_title("A Map of the Corpus: 140 Interview Centroids Projected to 2D",
                 fontsize=12.5, weight="bold", loc="left", pad=12)
    ax.text(0, -0.06,
            "PCA power-iteration projection of 1024-dim voyage-3 interview centroids (constellation.json). "
            "Dot size tracks transcript chunk count;\ncolor is the per-entry audit tier, so the trust substrate "
            "is visible inside the discovery surface.",
            transform=ax.transAxes, fontsize=8.5, color=STONE, va="top")
    save(fig, "fig06_constellation.png")


# ---------------------------------------------------------------- figure 7
def fig07_spectrum():
    s = json.load(open(RAG / "summaries" / "ideological_spectrums.json", encoding="utf-8"))
    axis = next(a for a in s["axes"] if "Nonviolence" in a.get("title", ""))
    pos = axis["positions"]
    pole_a, pole_b = axis.get("pole_a", "Pole A"), axis.get("pole_b", "Pole B")
    if isinstance(pole_a, dict):
        pole_a = pole_a.get("label") or pole_a.get("title") or "Pole A"
    if isinstance(pole_b, dict):
        pole_b = pole_b.get("label") or pole_b.get("title") or "Pole B"

    rng = np.random.default_rng(42)
    fig, ax = plt.subplots(figsize=(11.5, 4.6))
    for p in pos:
        x = p["position_normalized"]
        y = rng.uniform(-0.65, 0.65)
        ax.scatter(x, y, s=42, c=TIER_COLORS.get(p.get("tier"), "#94a3b8"),
                   alpha=0.8, edgecolors="white", linewidths=0.5)
    ext = sorted(pos, key=lambda p: p["position_normalized"])
    for p, dy in [(ext[0], 0.85), (ext[1], -0.92), (ext[-1], 0.85), (ext[-2], -0.92)]:
        ax.annotate(p["entry_subject"].split(" and ")[0],
                    (p["position_normalized"], 0), textcoords="offset points",
                    xytext=(0, dy * 34), ha="center", fontsize=8.5, color=INK,
                    arrowprops=dict(arrowstyle="-", color=STONE, lw=0.7))
    ax.axvline(0, color=FAINT, lw=1)
    ax.set_ylim(-1.5, 1.5)
    ax.set_xlim(-1.18, 1.18)
    ax.set_yticks([])
    ax.set_xticks([-1, -0.5, 0, 0.5, 1])
    for spine in ("top", "right", "left"):
        ax.spines[spine].set_visible(False)
    ax.text(-1.16, -1.34, "toward: " + str(pole_b), fontsize=9.5, weight="bold", color=ACCENT)
    ax.text(1.16, -1.34, "toward: " + str(pole_a), fontsize=9.5, weight="bold",
            color="#059669", ha="right")
    ax.set_title("One Concept Axis: 140 Voices Between Nonviolence as Theology and Armed Self-Defense",
                 fontsize=12, weight="bold", loc="left", pad=12)
    ax.text(-1.16, 1.28,
            "Each centroid is projected onto the normalized difference of the two pole embeddings. Positions are "
            "corpus-relative\n(the observed range is stretched to [-1, 1]), not absolute ideological measurements.",
            fontsize=8.5, color=STONE, va="top")
    save(fig, "fig07_concept_axis.png")


# ---------------------------------------------------------------- figure 8
def fig08_index_composition():
    fig, (ax, ax2) = plt.subplots(1, 2, figsize=(11.5, 5.2),
                                  gridspec_kw={"width_ratios": [1, 1.15], "wspace": 0.05})
    sizes = [15_687, 869, 203]
    labels = ["Transcript passages: 15,687", "Essay segments: 869", "Person pages: 203"]
    colors = ["#059669", "#7c3aed", ACCENT]
    wedges, _ = ax.pie(sizes, colors=colors, startangle=90,
                       wedgeprops=dict(width=0.42, edgecolor="white"))
    ax.text(0, 0.06, "16,759", ha="center", fontsize=17, weight="bold")
    ax.text(0, -0.16, "vectors (live,\n2026-06-10)", ha="center", fontsize=8.5, color=STONE)
    ax.legend(wedges, labels, loc="upper center", bbox_to_anchor=(0.5, 0.02),
              frameon=False, fontsize=9, ncol=1)
    ax.set_title("One Semantic Index, Three Content Types", fontsize=12, weight="bold",
                 loc="left", pad=12)

    ax2.axis("off")
    ax2.text(0, 0.95, "How a passage vector is built", fontsize=11, weight="bold", va="top")
    notes = (
        "Source: LoC-healed .srt cues (corrected/, never raw/)\n\n"
        "Chunking: consecutive cues aggregated to ~60 seconds\nor 1,400 characters, timestamps preserved\n\n"
        "Embedding: Voyage voyage-3, 1024-dim, cosine;\nretrieval reranked with rerank-2\n\n"
        "Metadata on every vector: verbatim text, entry number,\nstart and end seconds, audit tier and provenance,\nLoC catalog URL\n\n"
        "Idempotent ingest: content-hashed IDs, so only\nchanged chunks re-embed after a correction\n\n"
        "History: 40,710 vectors pruned to 15,464 (2026-05-25)\nby dropping .txt and .vtt duplicates of the .srt layer"
    )
    ax2.text(0, 0.84, notes, fontsize=9, va="top", color=INK, linespacing=1.5)
    save(fig, "fig08_index_composition.png")


# ---------------------------------------------------------------- figure 9
def fig09_influence_graph():
    import networkx as nx

    data = json.load(open(RAG / "summaries" / "influence.json", encoding="utf-8"))
    G = nx.Graph()
    for n in data["nodes"]:
        G.add_node(n["id"], **n)
    for e in data["edges"]:
        if e["from"] in G and e["to"] in G:
            G.add_edge(e["from"], e["to"], weight=e.get("count", 1))

    # Render only the connected subgraph; isolated interviewees add noise.
    deg_all = dict(G.degree())
    H = G.subgraph([n for n, d in deg_all.items() if d > 0]).copy()
    n_dropped = G.number_of_nodes() - H.number_of_nodes()
    pos = nx.spring_layout(H, k=1.15, iterations=400, seed=7)
    deg = dict(H.degree())

    fig, ax = plt.subplots(figsize=(12.0, 9.2))
    ax.axis("off")
    nx.draw_networkx_edges(H, pos, ax=ax, alpha=0.18, width=0.8, edge_color=STONE)
    in_nodes = [n for n, d in H.nodes(data=True) if d.get("in_corpus")]
    ex_nodes = [n for n, d in H.nodes(data=True) if not d.get("in_corpus")]
    nx.draw_networkx_nodes(H, pos, nodelist=in_nodes, ax=ax,
                           node_size=[26 + deg[n] * 14 for n in in_nodes],
                           node_color="#059669", alpha=0.75, edgecolors="white",
                           linewidths=0.5)
    nx.draw_networkx_nodes(H, pos, nodelist=ex_nodes, ax=ax,
                           node_size=[120 + deg[n] * 34 for n in ex_nodes],
                           node_color=ACCENT, alpha=0.95, edgecolors="white",
                           linewidths=1.0)
    import matplotlib.patheffects as pe
    halo = [pe.withStroke(linewidth=2.8, foreground="white")]
    labeled = sorted(ex_nodes, key=lambda n: -deg[n])[:10]
    offsets = [(9, 9), (9, -14), (-9, 9), (-9, -14)]
    for i, nid in enumerate(labeled):
        dx, dy = offsets[i % 4]
        ax.annotate(H.nodes[nid]["name"], pos[nid], textcoords="offset points",
                    xytext=(dx, dy), fontsize=8.8, color=INK, weight="bold",
                    ha="left" if dx > 0 else "right", path_effects=halo)
    handles = [plt.Line2D([0], [0], marker="o", color="w", markerfacecolor="#059669",
                          markersize=9, label="Interviewee (in corpus)"),
               plt.Line2D([0], [0], marker="o", color="w", markerfacecolor=ACCENT,
                          markersize=12, label="External figure (never interviewed)")]
    ax.legend(handles=handles, loc="lower left", frameon=False, fontsize=9.5)
    ax.set_title("Who Discusses Whom: the Influence Graph (155 Nodes, 216 Edges)",
                 fontsize=13, weight="bold", loc="left", pad=12)
    ax.text(0, -0.02,
            "Interviewee-to-interviewee edges come from conservative full-name string matching (a deliberate lower bound); "
            "external-figure edges are retrieval-derived passages.\nFigures with no interview of their own (Ella Baker, Bayard Rustin, "
            "Fannie Lou Hamer) become first-class nodes reachable through quoted memory.\n"
            f"{n_dropped} interviewees with no detected full-name mention edges are omitted from this rendering.",
            transform=ax.transAxes, fontsize=8.5, color=STONE, va="top")
    save(fig, "fig09_influence_graph.png")


# ---------------------------------------------------------------- figure 10
def fig10_publication_gate():
    fig, ax = plt.subplots(figsize=(11.5, 7.0))
    ax.set_xlim(0, 100)
    ax.set_ylim(0, 100)
    ax.axis("off")

    box(ax, 30, 88, 40, 8, "Draft summary (OpenAI generation,\ngrounded on the 378-fact corpus)", fc="#f0f9ff")
    box(ax, 30, 72, 40, 9, "OpenAI tuning loop\nrubric-scored, regenerate up to 3x\niteration bar: 80/80", fc="#fef3c7")
    arrow(ax, 50, 88, 50, 81.4)
    box(ax, 30, 56, 40, 9, "Independent Claude Opus scorer\nsame rubric, different model family\nno self-grading blind spot", fc="#fef3c7")
    arrow(ax, 50, 72, 50, 65.4)
    box(ax, 25, 38, 50, 11,
        "Publication gate\nBOTH scorers at 90/90 or better\nAND zero unsupported claims", fc="#fee2e2", fontsize=10)
    arrow(ax, 50, 56, 50, 49.4)
    box(ax, 25, 22, 50, 9, "Per-claim citation audit\nevery factual claim must map to a\ntranscript passage that establishes it", fc="#fee2e2")
    arrow(ax, 50, 38, 50, 31.4)
    box(ax, 8, 4, 36, 10, "PUBLISH\n(both gates pass)", fc="#ecfdf5", fontsize=10.5, weight="bold")
    box(ax, 56, 4, 36, 10, "HUMAN REVIEW QUEUE\n(any failure or any disagreement;\nthe gate fails closed)", fc="#fdf2f8", fontsize=9.5)
    arrow(ax, 38, 22, 26, 14.4)
    arrow(ax, 62, 22, 74, 14.4, color=ACCENT)
    arrow(ax, 75, 43.5, 87, 14.4, color=ACCENT)
    ax.text(77.5, 45.5, "one passes,\none fails", fontsize=8.5, color=ACCENT)

    ax.text(1, 99, "The Fail-Closed Publication Gate", fontsize=13, weight="bold")
    ax.text(1, 95.5, "Nothing publishes on a coin flip: disagreement between model families routes to people, not to print.",
            fontsize=9.5, color=STONE)
    save(fig, "fig10_publication_gate.png")


if __name__ == "__main__":
    fig01_architecture()
    fig02_healing_fusion()
    fig03_divergence_outcomes()
    fig04_audit_cascade()
    fig05_time_substrate()
    fig06_constellation()
    fig07_spectrum()
    fig08_index_composition()
    fig09_influence_graph()
    fig10_publication_gate()
    print("all figures generated")
