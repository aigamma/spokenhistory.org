import json
from pathlib import Path
import layer5_extract_corrections

def calculate():
    parsed = layer5_extract_corrections.parse_master_md()
    
    ledger = {}
    
    # Group correction rows by entry
    rows_by_entry = {e.entry_number: [] for e in parsed.entries}
    for r in parsed.correction_rows:
        if r.entry_number in rows_by_entry:
            rows_by_entry[r.entry_number].append(r)
            
    for entry in parsed.entries:
        if entry.source_dir is None:
            continue # Skipped

        rows = rows_by_entry[entry.entry_number]

        # Guard against the false-positive "perfect 100" failure mode.
        # An entry that has source_dir set but ZERO recorded correction
        # rows hasn't been audited at all -- it's a deferred/skipped
        # entry (e.g., #28 Abernathy Family, #46 Geraldine Bennett+,
        # #64 John Dudley+, #95 Patricia Crosby+ as of 2026-05-23). The
        # original scoring formula awarded these score=100.0 because
        # `audit_depth = len(set()) + 1 = 1` gave a +2 bonus while no
        # other penalties applied, making un-audited entries look more
        # publication-ready than entries that survived 5 passes of QA.
        # Emit them with readiness_confidence=None and an explicit
        # status flag so any downstream consumer sees the gap rather
        # than the misleading 100.0.
        if not rows:
            ledger[str(entry.entry_number)] = {
                "entry_number": entry.entry_number,
                "subject": entry.entry_subject_short,
                "readiness_confidence": None,
                "probability_of_error_percent": None,
                "status": "unaudited",
                "metrics": {
                    "initial_errors": 0,
                    "outstanding_flags": 0,
                    "unique_canonicals": 0,
                    "audit_depth": 0,
                },
            }
            continue

        # 1. Initial Error Density (Pass 1 + Pass 2)
        initial_errors = sum(1 for r in rows if r.pass_section in ["Pass 1", "Pass 2", "Pass 2 tail-sweep"])
        
        # 2. Outstanding Flags
        outstanding_flags = 0
        for r in rows:
            if r.confidence.startswith("flagged"):
                outstanding_flags += 1
            if "[LAYER-5:" in r.notes:
                outstanding_flags += 1
                
        # 3. Complexity (Unique canonicals)
        unique_canonicals = len(set(r.correction.lower().strip() for r in rows if r.correction.strip()))
        
        # 4. Audit Depth
        passes_endured = set(r.pass_section for r in rows)
        audit_depth = len(passes_endured) + 1 # +1 for layer 5
        
        # Calculate Score
        # Start at 100
        # - 5 points per outstanding flag
        # - 0.1 points per initial error
        # + 2 points per audit depth layer
        # - 0.05 points per unique canonical (complexity penalty)
        score = 100.0
        score -= (outstanding_flags * 5.0)
        score -= (initial_errors * 0.1)
        score += (audit_depth * 2.0)
        score -= (unique_canonicals * 0.05)
        
        # clamp between 0 and 100
        score = max(0.0, min(100.0, score))
        
        # Probability of transcription error = 100 - score
        prob_error = 100.0 - score
        
        ledger[str(entry.entry_number)] = {
            "entry_number": entry.entry_number,
            "subject": entry.entry_subject_short,
            "readiness_confidence": round(score, 2),
            "probability_of_error_percent": round(prob_error, 2),
            "metrics": {
                "initial_errors": initial_errors,
                "outstanding_flags": outstanding_flags,
                "unique_canonicals": unique_canonicals,
                "audit_depth": audit_depth
            }
        }
        
    out_path = Path("readiness_ledger.json")
    out_path.write_text(json.dumps(ledger, indent=2))
    print(f"Ledger written to {out_path} for {len(ledger)} entries.")
    
if __name__ == "__main__":
    calculate()
