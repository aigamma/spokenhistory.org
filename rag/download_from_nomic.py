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
    deadline = time.time() + max_wait
    last_state = None
    while time.time() < deadline:
        if not dataset.maps:
            sys.stderr.write("Dataset has no maps yet; waiting...\n")
            time.sleep(poll_interval)
            continue
        atlas_map = dataset.maps[0]
        # The map's projection-ready state lives behind several
        # possible attribute names depending on SDK version. Check the
        # broadest set.
        state = None
        for attr in ("project_state", "state", "status", "_project_state"):
            if hasattr(atlas_map, attr):
                state = getattr(atlas_map, attr)
                break
        if state and str(state).lower() in ("complete", "completed", "ready", "indexed", "done"):
            sys.stderr.write(f"Map ready (state={state}).\n")
            return atlas_map
        if state != last_state:
            sys.stderr.write(f"  map state: {state}; waiting...\n")
            last_state = state
        time.sleep(poll_interval)
    sys.stderr.write(f"Timed out after {max_wait}s; map state never became ready.\n")
    raise SystemExit(3)


def extract_projection_points(atlas_map):
    """Pull the projected 2D coordinates + metadata + topics for every
    row in the map. The Nomic SDK has several access paths depending
    on version; we try them in order of preference and bail with a
    useful message if none work."""
    # Preferred path: as_pandas() returns a dataframe with all the
    # surfaced metadata + projection columns (typically `_embeddings_x`
    # and `_embeddings_y`, or under `topic_data` for topics).
    if hasattr(atlas_map, "data"):
        try:
            df = atlas_map.data.df  # AtlasMapData wraps an Arrow table
            return df
        except Exception:
            pass
    if hasattr(atlas_map, "embeddings"):
        try:
            return atlas_map.embeddings.df
        except Exception:
            pass
    if hasattr(atlas_map, "to_pandas"):
        try:
            return atlas_map.to_pandas()
        except Exception:
            pass
    raise RuntimeError(
        "Could not locate projection coordinates on the map object. "
        "Inspect dir(map) and update extract_projection_points()."
    )


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

    # Topic columns vary; surface the most likely candidates.
    topic_col = None
    for c in ("topic_label", "topic", "_topic_label", "_topic", "topic_id"):
        if c in df.columns:
            topic_col = c
            break

    points = []
    for _, row in df.iterrows():
        rec = {
            "x": float(row[x_col]) if row[x_col] is not None else 0.0,
            "y": float(row[y_col]) if row[y_col] is not None else 0.0,
        }
        for field in (
            "pinecone_id",
            "entry_number",
            "entry_subject",
            "text",
            "uncertainty_tier",
            "loc_item_url",
            "timestamp_start_seconds",
        ):
            if field in row and row[field] is not None:
                value = row[field]
                # text gets truncated to a preview for client size.
                if field == "text":
                    if not isinstance(value, str):
                        value = str(value)
                    rec["text_preview"] = value[:240]
                else:
                    try:
                        rec[field] = float(value) if isinstance(value, (int, float)) and field == "timestamp_start_seconds" else (int(value) if isinstance(value, (int, float)) and field == "entry_number" else value)
                    except Exception:
                        rec[field] = value
        if topic_col and row[topic_col] is not None:
            rec["topic"] = row[topic_col]
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
    args.out.write_text(json.dumps(payload, ensure_ascii=False))
    size_mb = args.out.stat().st_size / (1024 * 1024)
    print(f"[OK] Wrote {len(points)} points + {len(topics_list)} topics to {args.out}")
    print(f"     ({size_mb:.2f} MB)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
