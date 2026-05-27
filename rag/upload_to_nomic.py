#!/usr/bin/env python3
"""rag/upload_to_nomic.py, one-time upload of the civil-rights passage
corpus to atlas.nomic.ai.

STATUS (2026-05-27): Nomic Atlas account was canceled after the
projection JSON was extracted. This script will FAIL because it
requires a valid NOMIC_API_KEY tied to an active account. Kept for
reference only. See `rag/ATLAS_PROVENANCE.md` for the full story.

Reads the NDJSON produced by `rag/dump_for_nomic.mjs` (each line carries
an `embedding` array + the metadata fields Atlas surfaces) and pushes
to Nomic via the official Python SDK. Atlas projects the embeddings
into 2D via UMAP, generates topic labels with their internal LLM, and
returns a hosted map URL we can iframe into the React app.

WHY THIS LIVES OUTSIDE THE PIPELINE
-----------------------------------
Nomic's official client is Python; the JS client is less mature. The
Node-side dump (rag/dump_for_nomic.mjs) keeps the Pinecone read in our
existing toolchain; this Python sidecar handles the Atlas-specific
piece. Running it once produces a stable Atlas project; subsequent
runs append/update via `nomic.atlas.map_data(data=..., identifier=...)`
using the same identifier.

USAGE
-----
1. Install the Nomic client:
       pip install nomic
2. Authenticate (one-time, opens a browser):
       nomic login
3. Dump the corpus from Pinecone:
       node --env-file=rag/.env.local rag/dump_for_nomic.mjs
4. Upload to Atlas:
       python rag/upload_to_nomic.py
5. Print the map URL to share with the React app:
       grep ATLAS_MAP_URL rag/.env.local  # set by step 4 if --write-env passed

The script prints the map URL on stdout. Drop that into
`src/components/rag/NomicAtlasEmbed.jsx` (NOMIC_ATLAS_URL constant)
to expose the embedded view on /rag-explore.

DATA SHAPE EXPECTED IN NDJSON
-----------------------------
Each line:
    {
      "id": "<pinecone-vector-id>",
      "embedding": [1024 floats],
      "entry_number": 1,
      "entry_subject": "Aaron Dixon",
      "text": "And we started getting domestic violent calls...",
      "timestamp_start_seconds": 412.3,
      "uncertainty_tier": "low",
      "loc_item_url": "https://www.loc.gov/item/2015669186/"
    }

We pass `embedding` to Atlas as the precomputed vector (skipping
Nomic's own embedding step, we already have Voyage embeddings that
match the Pinecone index, and using them keeps the Atlas projection
consistent with retrieval rankings).
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

import numpy as np

try:
    from nomic import atlas, login
except ImportError as exc:  # pragma: no cover
    sys.stderr.write(
        "nomic package not installed. Run:\n    pip install nomic\n"
    )
    raise SystemExit(1) from exc


def _bootstrap_nomic_auth() -> None:
    """Authenticate with Nomic from NOMIC_API_KEY rather than the
    interactive `nomic login` flow. The env var is canonical for headless
    pipelines and matches the upstream client expectation (Nomic's CLI
    checks NOMIC_API_KEY before opening a browser). Pulled from
    rag/.env.local by callers that source it (Node --env-file does this
    for us; Python uses dotenv-style load via os.environ when invoked
    directly through `node --env-file=rag/.env.local …` is not applicable,
    so we manually parse rag/.env.local here if NOMIC_API_KEY isn't already
    set in the process env)."""
    if os.environ.get("NOMIC_API_KEY"):
        login(os.environ["NOMIC_API_KEY"])
        return
    # Fallback: parse rag/.env.local for the key.
    env_file = REPO_ROOT / "rag" / ".env.local"
    if env_file.exists():
        for raw_line in env_file.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, _, value = line.partition("=")
            if key.strip() == "NOMIC_API_KEY":
                value = value.strip().strip('"').strip("'")
                os.environ["NOMIC_API_KEY"] = value
                login(value)
                return
    sys.stderr.write(
        "NOMIC_API_KEY not set. Either:\n"
        "  - export NOMIC_API_KEY=nk-...\n"
        "  - add NOMIC_API_KEY=nk-... to rag/.env.local\n"
        "  - or run `nomic login` interactively.\n"
    )
    raise SystemExit(2)


REPO_ROOT = Path(__file__).resolve().parent.parent
# Dump file lives under tmp/ (gitignored, not in the Netlify build).
# Putting it under public/ would leak the embedding matrix as a static
# asset on the live site.
DEFAULT_NDJSON = REPO_ROOT / "tmp" / "nomic_export.ndjson"
# Dataset slug within Eric's Nomic org (`civil-rights-history`). Final
# map URL: https://atlas.nomic.ai/data/civil-rights-history/civil-rights-passages
DEFAULT_IDENTIFIER = "civil-rights-passages"


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument(
        "--input",
        type=Path,
        default=DEFAULT_NDJSON,
        help=f"NDJSON file from dump_for_nomic.mjs (default: {DEFAULT_NDJSON})",
    )
    p.add_argument(
        "--identifier",
        default=DEFAULT_IDENTIFIER,
        help=f"Nomic dataset identifier (default: {DEFAULT_IDENTIFIER})",
    )
    p.add_argument(
        "--description",
        default=(
            "Civil Rights History Project (Library of Congress + Smithsonian NMAAHC). "
            "Passage-level embeddings of 136 oral histories with audit-tier provenance."
        ),
        help="Human-readable Atlas description shown on the map page.",
    )
    p.add_argument(
        "--public",
        action="store_true",
        help="Make the Atlas map publicly viewable (no Nomic login required).",
    )
    p.add_argument(
        "--colorable",
        nargs="*",
        default=["entry_subject", "uncertainty_tier", "entry_number"],
        help="Metadata fields exposed as Atlas colorable filters.",
    )
    p.add_argument(
        "--limit",
        type=int,
        default=0,
        help="Cap on rows uploaded (0 = all). Useful for a smoke test.",
    )
    p.add_argument(
        "--write-env",
        action="store_true",
        help="Append ATLAS_MAP_URL=... to rag/.env.local for downstream tooling.",
    )
    return p.parse_args()


def load_ndjson(path: Path, limit: int = 0):
    embeds: list[list[float]] = []
    metas: list[dict] = []
    with path.open("r", encoding="utf-8") as fh:
        for line_num, line in enumerate(fh, 1):
            line = line.strip()
            if not line:
                continue
            row = json.loads(line)
            embedding = row.pop("embedding", None)
            if not embedding:
                continue
            # Atlas caps id_field values at 36 chars; our Pinecone chunk
            # IDs are ~200 chars (the deterministic
            # `chunk::entry-N::source-safe::idx::hash` format). Rename
            # the field so Atlas auto-generates its own row IDs while
            # we still keep the Pinecone reference for downstream join
            # (e.g. clicking a point and resolving to the chunk).
            if "id" in row:
                row["pinecone_id"] = row.pop("id")
            # Atlas also doesn't allow None values inside metadata -
            # cast everything to a JSON-friendly primitive.
            for k, v in list(row.items()):
                if v is None:
                    del row[k]
            embeds.append(embedding)
            metas.append(row)
            if limit and len(embeds) >= limit:
                break
    return embeds, metas


def main() -> int:
    args = parse_args()
    if not args.input.exists():
        sys.stderr.write(f"Input file not found: {args.input}\n")
        sys.stderr.write("Run dump_for_nomic.mjs first.\n")
        return 1

    _bootstrap_nomic_auth()

    print(f"Loading {args.input}...")
    embeds, metas = load_ndjson(args.input, args.limit)
    print(f"  {len(embeds)} passages with embeddings")
    if not embeds:
        sys.stderr.write("No usable rows in input file.\n")
        return 1

    print(f"Dimension: {len(embeds[0])}")
    print(f"Identifier: {args.identifier}")
    print(f"Public: {args.public}")

    embeddings_array = np.asarray(embeds, dtype=np.float32)
    print(f"Embeddings array shape: {embeddings_array.shape}")

    print("Uploading to atlas.nomic.ai (this can take a few minutes)...")
    # Atlas creates the dataset + projection + topic labels in one call.
    # Passing `embeddings=` short-circuits Nomic's own embedding step so
    # our Voyage-derived geometry is preserved.
    dataset = atlas.map_data(
        embeddings=embeddings_array,
        data=metas,
        identifier=args.identifier,
        description=args.description,
        is_public=args.public,
        # Atlas auto-generates row IDs; our Pinecone chunk IDs (~200 chars)
        # exceed Atlas's 36-char id_field cap and are preserved as
        # `pinecone_id` metadata instead.
        id_field=None,
        topic_model={
            "build_topic_model": True,
            # Atlas uses this field to derive cluster labels from member
            # text content. Without it, the warning "your dataset will
            # not contain auto-labeled topics" fires and topics remain
            # numeric-only ("Topic 1", "Topic 2", ...). Pointing at
            # `text` (the passage transcript) makes the topic names
            # readable in the downloaded projection.
            "topic_label_field": "text",
        },
    )

    map_obj = dataset.maps[0]
    map_link = getattr(map_obj, "map_link", None) or getattr(map_obj, "url", None)
    print()
    print(f"[OK] Atlas map created.")
    print(f"  Dataset identifier: {args.identifier}")
    print(f"  Map URL:            {map_link}")
    print()
    print(f"Drop the URL into src/components/rag/NomicAtlasEmbed.jsx (NOMIC_ATLAS_URL)")
    print(f"to enable the embedded view on /rag-explore.")

    if args.write_env:
        env_file = REPO_ROOT / "rag" / ".env.local"
        if env_file.exists() and map_link:
            existing = env_file.read_text(encoding="utf-8")
            # Replace existing ATLAS_MAP_URL line if present, else append.
            lines = [l for l in existing.splitlines() if not l.startswith("ATLAS_MAP_URL=")]
            lines.append(f"ATLAS_MAP_URL={map_link}")
            env_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
            print(f"  Wrote ATLAS_MAP_URL to {env_file}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
