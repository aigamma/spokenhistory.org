"""Pre-compute k-means clusters + per-entry top-5 neighbors from centroids.json.

Output:
  public/rag/summaries/clusters_raw.json  - k-means assignments (needs LLM naming)
  public/rag/summaries/neighbors.json     - per-entry top-5 neighbors with metadata

Pure math. No LLM calls. No external API. Run from project root:
    python rag/precompute_clusters_neighbors.py
"""
from __future__ import annotations
import json
import sys
from pathlib import Path

import numpy as np

REPO_ROOT = Path(__file__).resolve().parent.parent
CENTROIDS_PATH = REPO_ROOT / "public" / "rag" / "centroids.json"
SUMMARIES_DIR = REPO_ROOT / "public" / "rag" / "summaries"
CLUSTERS_RAW = SUMMARIES_DIR / "clusters_raw.json"
NEIGHBORS = SUMMARIES_DIR / "neighbors.json"

K = 30          # number of clusters
TOP_N = 5       # top neighbors per entry
KMEANS_ITERS = 200
KMEANS_RESTARTS = 12
SEED = 42


def cosine_sim_matrix(M: np.ndarray) -> np.ndarray:
    """Pairwise cosine similarity matrix. Assumes M is L2-normalized."""
    return M @ M.T


def normalize_rows(M: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(M, axis=1, keepdims=True)
    norms = np.where(norms == 0, 1.0, norms)
    return M / norms


def kmeans(M: np.ndarray, k: int, iters: int, restarts: int, seed: int) -> tuple[np.ndarray, np.ndarray, float]:
    """Plain k-means on L2-normalized vectors with cosine-like geometry.
    Returns (centroids, assignments, inertia)."""
    rng = np.random.default_rng(seed)
    n, dim = M.shape
    best = None
    for r in range(restarts):
        idx = rng.choice(n, size=k, replace=False)
        centers = M[idx].copy()
        for _ in range(iters):
            sims = M @ centers.T  # n x k
            assignments = np.argmax(sims, axis=1)
            new_centers = np.zeros_like(centers)
            for c in range(k):
                members = M[assignments == c]
                if len(members) > 0:
                    new_centers[c] = members.mean(axis=0)
                else:
                    new_centers[c] = M[rng.integers(n)]
            new_centers = normalize_rows(new_centers)
            shift = float(np.linalg.norm(new_centers - centers))
            centers = new_centers
            if shift < 1e-6:
                break
        sims_final = M @ centers.T
        assignments = np.argmax(sims_final, axis=1)
        max_sims = sims_final[np.arange(n), assignments]
        inertia = float((1.0 - max_sims).sum())
        if best is None or inertia < best[2]:
            best = (centers, assignments, inertia)
            print(f"  restart {r+1}: inertia={inertia:.4f} (best so far)", file=sys.stderr)
        else:
            print(f"  restart {r+1}: inertia={inertia:.4f}", file=sys.stderr)
    return best


def main() -> int:
    centroids_data = json.loads(CENTROIDS_PATH.read_text(encoding="utf-8"))
    n = len(centroids_data)
    print(f"Loaded {n} centroids", file=sys.stderr)

    vectors = np.array([c["vector"] for c in centroids_data], dtype=np.float64)
    vectors = normalize_rows(vectors)

    # Compute neighbors first (cheap)
    print(f"\nComputing top-{TOP_N} neighbors per entry...", file=sys.stderr)
    sims = cosine_sim_matrix(vectors)
    np.fill_diagonal(sims, -np.inf)
    neighbors = {}
    for i, c in enumerate(centroids_data):
        top_indices = np.argsort(sims[i])[::-1][:TOP_N]
        neighbors[c["entry_number"]] = {
            "entry_number": c["entry_number"],
            "entry_subject": c["entry_subject"],
            "tier": c.get("uncertainty_tier"),
            "loc_item_url": c.get("loc_item_url"),
            "neighbors": [
                {
                    "entry_number": int(centroids_data[j]["entry_number"]),
                    "entry_subject": centroids_data[j]["entry_subject"],
                    "tier": centroids_data[j].get("uncertainty_tier"),
                    "similarity": round(float(sims[i, j]), 4),
                    "loc_item_url": centroids_data[j].get("loc_item_url"),
                }
                for j in top_indices
            ],
        }

    SUMMARIES_DIR.mkdir(parents=True, exist_ok=True)
    NEIGHBORS.write_text(
        json.dumps(neighbors, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {NEIGHBORS.relative_to(REPO_ROOT)} ({n} entries)", file=sys.stderr)

    # Compute k-means clusters
    print(f"\nRunning k-means (k={K}, restarts={KMEANS_RESTARTS})...", file=sys.stderr)
    centers, assignments, inertia = kmeans(vectors, K, KMEANS_ITERS, KMEANS_RESTARTS, SEED)
    print(f"\nFinal inertia: {inertia:.4f}", file=sys.stderr)

    # For each cluster, list members + exemplar (closest to centroid)
    clusters = []
    for cid in range(K):
        member_idx = np.where(assignments == cid)[0]
        if len(member_idx) == 0:
            continue
        member_sims = vectors[member_idx] @ centers[cid]
        exemplar_local = int(np.argmax(member_sims))
        exemplar_global = int(member_idx[exemplar_local])
        members = [
            {
                "entry_number": int(centroids_data[int(i)]["entry_number"]),
                "entry_subject": centroids_data[int(i)]["entry_subject"],
                "tier": centroids_data[int(i)].get("uncertainty_tier"),
                "similarity_to_centroid": round(float(vectors[int(i)] @ centers[cid]), 4),
            }
            for i in sorted(member_idx, key=lambda x: -float(vectors[int(x)] @ centers[cid]))
        ]
        clusters.append({
            "cluster_id": cid,
            "size": len(member_idx),
            "exemplar_entry_number": int(centroids_data[exemplar_global]["entry_number"]),
            "exemplar_entry_subject": centroids_data[exemplar_global]["entry_subject"],
            "members": members,
            "centroid": [round(float(x), 6) for x in centers[cid]],
        })
    clusters.sort(key=lambda c: -c["size"])

    clusters_raw = {
        "method": f"k-means k={K}, restarts={KMEANS_RESTARTS}, seed={SEED}",
        "total_entries": int(n),
        "total_clusters": len(clusters),
        "inertia": round(float(inertia), 4),
        "clusters": clusters,
    }
    CLUSTERS_RAW.write_text(
        json.dumps(clusters_raw, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )
    print(f"Wrote {CLUSTERS_RAW.relative_to(REPO_ROOT)} ({len(clusters)} clusters)", file=sys.stderr)
    print(f"\nCluster size distribution: " + ", ".join(str(c["size"]) for c in clusters), file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
