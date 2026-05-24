import os
import sys
from pathlib import Path

def mutate(entry_dir, original_text, replacement_text):
    """
    Safely replace `original_text` with `replacement_text` across .srt, .vtt, and .txt files.
    """
    directory = Path(entry_dir)
    if not directory.exists() or not directory.is_dir():
        print(f"Error: {directory} does not exist.")
        return 0
        
    replacements_made = 0
    for p in directory.glob("*.*"):
        if p.suffix in [".srt", ".vtt", ".txt"]:
            try:
                text = p.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                # fallback for some windows files
                text = p.read_text(encoding="cp1252")
                
            if original_text in text:
                new_text = text.replace(original_text, replacement_text)
                p.write_text(new_text, encoding="utf-8")
                replacements_made += 1
                print(f"Mutated {p.name}: replaced '{original_text}' with '{replacement_text}'")
                
    return replacements_made
    
if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python mutate_transcript.py <directory_path> <original> <replacement>")
    else:
        d = sys.argv[1]
        o = sys.argv[2]
        r = sys.argv[3]
        mutate(d, o, r)
