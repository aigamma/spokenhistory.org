#!/usr/bin/env python3
"""rag/download_from_nomic.py — pull the 2D projection + topic labels
that Atlas computed for our civil-rights-passages dataset, and save
them as a static JSON the React app can render entirely on its own.

This is the "Atlas as data-pipeline backend" pattern: Atlas does the
heavy work (UMAP projection, topic modeling, label generation) but
we never embed their viewer. The output JSON is small (~1-2 MB for
15K rows × {x, y, topic, pinecone_id}) and ships with the site.

USAGE
-----
    python rag/download_from_nomic.py
    python rag/download_from_nomic.py --identifier civil-rights-passages \
        --out public/rag/atlas_projection.json

If Atlas hasn't finished projecting yet, the script waits up to
--max-wait seconds polling the dataset's map state. Atlas typically
takes 5-15 minutes to project 15K rows.

OUTPUT JSON SHAPE
-----------------
    {
      "generated": "2026-05-26T...",
      "source": {
        "dataset": "civil-rights-history/civil-rights-passages",
        "map_id": "019e6755-...",
        "n_points": 15464
      },
      "points": [
        {
          "x": 0.412,
          "y": -0.318,
          "topic": "Voter registration in Mississippi",
          "topic_id": 7,
          "pinecone_id": "chunk::entry-3::annie-pearl-avery::...",
          "entry_number": 3,
          "entry_subject": "Annie Pearl Avery",
          "text_preview": "But when I bought the ticket, I had bought me a knife...",
          "uncertainty_tier": "low"
        },
        ...
      ],
      "topics": [
        {"topic_id": 7, "label": "Voter registration in Mississippi", "size": 412},
        ...
      ]
    }
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import time
from datetime import datetime
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent

try:
    from nomic import AtlasDataset, login
except ImportError as exc:
    sys.stderr.write("nomic package not installed. Run:\n    pip install nomic\n")
    raise SystemExit(1) from exc


def _bootstrap_nomic_auth() -> None:
    if os.environ.get("NOMIC_API_KEY"):
        login(os.environ["NOMIC_API_KEY"])
        return
    env_file = REPO_ROOT / "rag" / ".env.local"
    if env_file.exists():
        for raw in env_file.read_text(encoding="utf-8").splitlines():
            line = raw.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k, _, v = line.partition("=")
            if k.strip() == "NOMIC_API_KEY":
                v = v.strip().strip('"').strip("'")
                os.environ["NOMIC_API_KEY"] = v
                login(v)
                return
    sys.stderr.write("NOMIC_API_KEY not set; see rag/upload_to_nomic.py docstring.\n")
    raise SystemExit(2)


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument(
        "--identifier",
        default="civil-rights-passages",
        help="Dataset slug within the authenticated Nomic org.",
    )
    p.add_argument(
        "--out",
        type=Path,
        default=REPO_ROOT / "public" / "rag" / "atlas_projection.json",
        help="Output JSON path (default: public/rag/atlas_projection.json).",
    )
    p.add_argument(
        "--max-wait",
        type=int,
        default=900,
        help="Max seconds to wait for the projection to be ready (default 900).",
    )
    p.add_argument(
        "--poll-interval",
        type=int,
        default=20,
        help="Seconds between readiness polls (default 20).",
    )
    return p.parse_args()


def wait_for_map_ready(dataset, max_wait: int, poll_interval: int):
    """Atlas's `AtlasProjection` object doesn't expose a discrete
    ready-state attribute on the SDK we have (nomic 3.9.0). What it
    DOES expose is `.embeddings.projected`, `.topics.df`, and
    `.data.df` — accessing those raises until the projection is
    ready, and succeeds once it is. We probe `.embeddings.df` (which
    pulls projected coords) as the readiness signal."""
    deadline = time.time() + max_wait
    while time.time() < deadline:
        if not dataset.maps:
            sys.stderr.write("Dataset has no maps yet; waiting...\n")
            time.sleep(poll_interval)
            continue
        atlas_map = dataset.maps[0]
        try:
            # Single-row probe — pulling the full df can take seconds.
            df = atlas_map.embeddings.df
            n = len(df)
            sys.stderr.write(f"Map ready: {n} projected points.\n")
            return atlas_map
        except Exception as exc:
            sys.stderr.write(f"  map not ready yet ({type(exc).__name__}: {str(exc)[:100]}); waiting...\n")
            time.sleep(poll_interval)
    sys.stderr.write(f"Timed out after {max_wait}s; map projection never became ready.\n")
    raise SystemExit(3)


def extract_projection_points(atlas_map):
    """Merge `data.df` (metadata), `embeddings.df` (2D coords), and
    `topics.df` (auto-labeled topic per row) into a single dataframe
    keyed on the Atlas row id. The SDK exposes these as three separate
    dataframes; joining them gives the shape the React component needs.

    Returns a pandas DataFrame with at minimum columns for x, y, and
    each metadata field from the original upload (entry_subject,
    pinecone_id, text, etc.). Adds a `_topic` column if topics
    were computed; falls back to None otherwise.
    """
    print("  fetching data.df...")
    data_df = atlas_map.data.df
    print(f"    {len(data_df)} rows, columns: {list(data_df.columns)[:8]}...")

    print("  fetching embeddings.df (projected coords)...")
    emb_df = atlas_map.embeddings.df
    print(f"    {len(emb_df)} rows, columns: {list(emb_df.columns)}")

    print("  fetching topics.df...")
    try:
        topic_df = atlas_map.topics.df
        print(f"    {len(topic_df)} rows, columns: {list(topic_df.columns)}")
    except Exception as exc:
        print(f"    (skipped — topics not available: {exc})")
        topic_df = None

    # Critical: `_position_index` is NOT a unique row id. Atlas stores
    # data in shards/pages and re-uses `_position_index` per shard.
    # The three dataframes (data, embeddings, topics) are in identical
    # row order — concat by position is the correct join.
    if len(data_df) != len(emb_df):
        raise RuntimeError(
            f"data.df and embeddings.df have different row counts "
            f"({len(data_df)} vs {len(emb_df)}); concat-by-position invalid."
        )
    print(f"  concat by row position: {len(data_df)} rows")
    # reset_index so positional concat works regardless of original index.
    data_df = data_df.reset_index(drop=True)
    emb_df = emb_df.reset_index(drop=True)
    # Drop emb_df's redundant `_position_index` to avoid column collision.
    emb_keep = [c for c in emb_df.columns if c != "_position_index"]
    import pandas as pd
    merged = pd.concat([data_df, emb_df[emb_keep]], axis=1)
    if topic_df is not None and len(topic_df) == len(data_df):
        topic_df = topic_df.reset_index(drop=True)
        topic_keep = [c for c in topic_df.columns if c != "_position_index"]
        merged = pd.concat([merged, topic_df[topic_keep]], axis=1)
    elif topic_df is not None:
        print(f"  WARN: topic_df row count ({len(topic_df)}) mismatch; skipping topic merge")
    print(f"  final: {len(merged)} rows × {len(merged.columns)} columns")
    return merged


def find_xy_columns(df):
    """Atlas uses a few different column-name conventions across SDK
    versions for the 2D projection. Find them robustly."""
    cands_x = ["x", "_embeddings_x", "umap_x", "_x", "_topic_x"]
    cands_y = ["y", "_embeddings_y", "umap_y", "_y", "_topic_y"]
    cols = set(df.columns)
    x_col = next((c for c in cands_x if c in cols), None)
    y_col = next((c for c in cands_y if c in cols), None)
    if not x_col or not y_col:
        raise RuntimeError(
            f"Could not find x/y columns in projection. "
            f"Available columns: {sorted(cols)}"
        )
    return x_col, y_col


def main() -> int:
    args = parse_args()
    _bootstrap_nomic_auth()

    print(f"Loading dataset {args.identifier}...")
    dataset = AtlasDataset(args.identifier)
    print(f"  dataset.id: {dataset.id}")
    print(f"  maps: {len(dataset.maps)}")

    print(f"Waiting for map projection to be ready (max {args.max_wait}s)...")
    atlas_map = wait_for_map_ready(dataset, args.max_wait, args.poll_interval)

    print("Extracting projection coordinates + topic labels...")
    df = extract_projection_points(atlas_map)
    print(f"  rows: {len(df)}")
    print(f"  columns: {list(df.columns)}")

    x_col, y_col = find_xy_columns(df)

    # Topic columns vary by SDK version. Hierarchical topic models
    # expose `topic_depth_1` (broader category — 8 broad clusters in
    # the civil-rights dataset) and `topic_depth_2` (narrower — 256
    # micro-topics). The broad version legends much more cleanly and
    # is preferred for the headline color encoding. We also surface
    # both depths in the output so the client can switch later.
    topic_col = None
    for c in ("topic_depth_1", "topic_depth_2", "topic_label", "topic", "_topic_label", "_topic", "topic_id"):
        if c in df.columns:
            topic_col = c
            break
    secondary_topic_col = None
    if topic_col == "topic_depth_1" and "topic_depth_2" in df.columns:
        secondary_topic_col = "topic_depth_2"
    print(f"  using topic column: {topic_col}")
    if secondary_topic_col:
        print(f"  (also surfacing {secondary_topic_col} as `topic_narrow`)")

    # Per-row trimming to keep the client-side JSON small. The
    # full Atlas data export carries fields the React component does
    # not need (chunk_index, source_path, entry_provenance, etc.).
    # We surface ONLY the fields the hover card and topic legend
    # actually read.
    import math
    points = []
    for _, row in df.iterrows():
        x_val = row[x_col]
        y_val = row[y_col]
        if x_val is None or y_val is None:
            continue
        try:
            x_f, y_f = float(x_val), float(y_val)
            if not (math.isfinite(x_f) and math.isfinite(y_f)):
                continue
        except (ValueError, TypeError):
            continue
        rec = {"x": round(x_f, 4), "y": round(y_f, 4)}

        # Numeric / short string fields.
        if "entry_number" in row and row["entry_number"] is not None:
            try:
                rec["entry_number"] = int(row["entry_number"])
            except (ValueError, TypeError):
                pass
        if "entry_subject" in row and isinstance(row["entry_subject"], str):
            rec["entry_subject"] = row["entry_subject"]
        if "uncertainty_tier" in row and isinstance(row["uncertainty_tier"], str):
            rec["uncertainty_tier"] = row["uncertainty_tier"]
        if "loc_item_url" in row and isinstance(row["loc_item_url"], str):
            rec["loc_item_url"] = row["loc_item_url"]
        if "timestamp_start_seconds" in row and row["timestamp_start_seconds"] is not None:
            try:
                rec["t_start"] = round(float(row["timestamp_start_seconds"]), 1)
            except (ValueError, TypeError):
                pass

        # Text preview only — never the full passage. 120 chars keeps
        # the static JSON manageable while still giving hover cards
        # enough words to recognize the passage. Truncated text ends
        # with an ellipsis to make it visually obvious it's a preview.
        text = row.get("text") if hasattr(row, "get") else (row["text"] if "text" in row else None)
        if isinstance(text, str) and text:
            if len(text) > 120:
                rec["text_preview"] = text[:117].rstrip() + "..."
            else:
                rec["text_preview"] = text

        # Topic label (broad / depth_1 — used for color legend).
        if topic_col and row[topic_col] is not None and not (isinstance(row[topic_col], float) and math.isnan(row[topic_col])):
            rec["topic"] = row[topic_col]
        # Narrow topic (depth_2) — surfaced for hover detail since it
        # adds specificity without crowding the color legend.
        if secondary_topic_col and row[secondary_topic_col] is not None and not (isinstance(row[secondary_topic_col], float) and math.isnan(row[secondary_topic_col])):
            rec["topic_narrow"] = row[secondary_topic_col]
        points.append(rec)

    # Roll up topics into a compact summary too.
    topics: dict = {}
    for rec in points:
        t = rec.get("topic")
        if t is None:
            continue
        topics[t] = topics.get(t, 0) + 1
    topics_list = [
        {"label": t, "size": n}
        for t, n in sorted(topics.items(), key=lambda kv: -kv[1])
    ]

    payload = {
        "generated": datetime.utcnow().isoformat() + "Z",
        "source": {
            "dataset": args.identifier,
            "map_id": getattr(atlas_map, "id", None),
            "n_points": len(points),
        },
        "points": points,
        "topics": topics_list,
    }

    args.out.parent.mkdir(parents=True, exist_ok=True)
    # Force UTF-8 — Windows Python defaults to cp1252 and chokes on
    # the Unicode characters in passage text (smart quotes, accents,
    # etc.).
    args.out.write_text(json.dumps(payload, ensure_ascii=False), encoding="utf-8")
    size_mb = args.out.stat().st_size / (1024 * 1024)
    print(f"[OK] Wrote {len(points)} points + {len(topics_list)} topics to {args.out}")
    print(f"     ({size_mb:.2f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
