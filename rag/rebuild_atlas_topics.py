#!/usr/bin/env python3
"""rag/rebuild_atlas_topics.py — trigger a new projection + topic model
on the existing civil-rights-passages dataset, with topic_label_field
set so Atlas generates human-readable topic names from passage text.

STATUS (2026-05-27): Nomic Atlas account was canceled. This script
will FAIL without an active account. Kept for reference; see
`rag/ATLAS_PROVENANCE.md` for the full story and replacement path.

The initial map was created without the topic_label_field option;
its topics show as emoji-encoded placeholder IDs. This script asks
Atlas to add a new index with proper labels. The original map is
preserved (Atlas keeps both); the React app reads whichever map is
the most recently indexed via dataset.maps[0].
"""

from __future__ import annotations

import os
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parent.parent


def _bootstrap_nomic_auth() -> None:
    if os.environ.get("NOMIC_API_KEY"):
        from nomic import login
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
                from nomic import login
                v = v.strip().strip('"').strip("'")
                os.environ["NOMIC_API_KEY"] = v
                login(v)
                return
    sys.stderr.write("NOMIC_API_KEY not found in env or rag/.env.local\n")
    raise SystemExit(2)


def main() -> int:
    _bootstrap_nomic_auth()
    from nomic import AtlasDataset

    ds = AtlasDataset("civil-rights-passages")
    print(f"Dataset: {ds.id}")
    print(f"Existing maps: {len(ds.maps)}")
    for i, m in enumerate(ds.maps):
        print(f"  [{i}] {m.projection_id} - {m.map_link}")

    print("\nCreating a new index with topic_label_field='text'...")
    print("(This generates auto-labeled topics from passage text.)")
    print("This can take several minutes.")
    new_map = ds.create_index(
        indexed_field="text",
        topic_model={
            "build_topic_model": True,
            "topic_label_field": "text",
        },
    )
    print()
    print("[OK] New index created.")
    print(f"  projection_id: {new_map.projection_id}")
    print(f"  map_link:      {new_map.map_link}")
    print()
    print("Atlas computes the projection + topic labels in the background.")
    print("Re-run rag/download_from_nomic.py once it's ready to refresh the JSON.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
