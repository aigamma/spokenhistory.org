import os
import json
import glob
from pathlib import Path
import sys

# We'll import mutate to apply fixes automatically if safe
import mutate_transcript

def run_qa_batch(start_idx, end_idx):
    corrected_dir = Path(r"D:\civil\transcripts\corrected")
    facts_path = Path(r"D:\civil\Metadata Generation System\civil_rights_facts.json")
    
    # Load facts
    try:
        with open(facts_path, "r", encoding="utf-8") as f:
            facts = json.load(f)
    except Exception as e:
        print(f"Failed to load facts: {e}")
        return
        
    canonical_names = list(facts.keys())
    
    # Get all directories
    all_dirs = sorted([d for d in corrected_dir.iterdir() if d.is_dir()])
    batch = all_dirs[start_idx:end_idx]
    
    print(f"Processing batch from index {start_idx} to {end_idx} ({len(batch)} directories)...")
    
    total_mutations = 0
    for d in batch:
        txt_files = list(d.glob("*.txt"))
        if not txt_files:
            continue
        txt_path = txt_files[0]
        
        try:
            content = txt_path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            content = txt_path.read_text(encoding="cp1252")
            
        # VERY basic programmatic NER & Coherence Check
        # 1. Look for common un-caught whisper variations for key figures
        # These are examples built from Layer 5 findings and common historical errors
        heuristic_fixes = {
            "mega-evils": "Medgar Evers",
            "Mega Evers": "Medgar Evers",
            "Tugaloo College": "Tougaloo College",
            "Stocks-O Cymbol": "Stokely Carmichael",
            "Stokeley": "Stokely Carmichael",
            "Jim Foreman": "James Forman",
            "Sammy Young": "Samuel Younge Jr.",
            "Lounge County": "Lowndes County",
            "Acta Almighty King": "Come, Thou Almighty King",
            "Pittsburgh Korea": "Pittsburgh Courier",
            "Pittsburgh Kuzat": "Pittsburgh Courier",
            "Dinky Romley": "Dinky Romilly",
            "snake office": "SNCC office",
            "snake": "SNCC", # Be careful with generic words, only apply if context fits (skipped automatic to avoid false positives)
        }
        
        mutations_in_dir = 0
        for bad, good in heuristic_fixes.items():
            if bad == "snake": continue # Too risky to auto-replace "snake" globally without context
            if bad in content:
                print(f"[{d.name}] Found '{bad}', replacing with '{good}'...")
                mutations = mutate_transcript.mutate(str(d), bad, good)
                mutations_in_dir += mutations
                total_mutations += mutations
                
        print(f"Finished {d.name} - Mutations applied: {mutations_in_dir}")
        
    print(f"Batch {start_idx}-{end_idx} complete. Total mutations: {total_mutations}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python run_qa_batch.py <start_idx> <end_idx>")
    else:
        run_qa_batch(int(sys.argv[1]), int(sys.argv[2]))
