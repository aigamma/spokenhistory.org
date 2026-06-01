#!/usr/bin/env python3
"""Assemble per-essay connection files for EssayPage from curated + sourced inputs.

Reads (all under public/rag/essays/connections/ unless noted):
  - public/rag/essays/index.json                 essays: slug, authors, themes, title, year
  - _author_portraits.json                       author -> hero portrait block
  - dubois-souls-coming-of-john.json (existing)   the W. E. B. Du Bois hero block
  - _embedding_neighbors.json                     embedding-derived nearest voices per essay
  - _curation_g*.json                             related chapters + top_voice (per essay)
  - _inline_g*.json                               inline period images (per essay, keyed by slug)
  - public/rag/toc.json                           authoritative chapter data (validation)
  - public/rag/people/index.json                  entry -> catalog slug
  - public/rag/people/<slug>.json                 top_voice closing image (photo or first gallery)

Writes public/rag/essays/connections/<slug>.json for every essay and prints a
validation report. Exit non-zero if any essay lacks a hero or has zero chapters.
"""
import json, os, glob, re, sys

ROOT = r"C:/civil"
ESS = os.path.join(ROOT, "public/rag/essays")
CONN = os.path.join(ESS, "connections")
PEOPLE = os.path.join(ROOT, "public/rag/people")


def load(p):
    with open(p, encoding="utf-8") as f:
        return json.load(f)


def clean_text(s):
    if not isinstance(s, str):
        return s
    s = s.replace("&amp;", "&")
    s = re.sub(r"\s*—\s*", ", ", s)  # em dash -> comma (our chrome only)
    return s.strip()


def clean_subject(s):
    s = (s or "").strip()
    s = re.sub(r"\s*\([^)]*partial[^)]*\)\s*$", "", s, flags=re.I)  # (PARTIAL) / (partial read)
    return s.strip()


def clean_image(img):
    if not img:
        return None
    out = {}
    for k in ("src_external", "src_local", "alt", "caption", "photographer",
              "date_taken", "repository", "license", "source_url"):
        v = img.get(k)
        if v not in (None, ""):
            out[k] = clean_text(v) if isinstance(v, str) else v
    if not (out.get("src_external") or out.get("src_local")):
        return None
    return out


index = load(os.path.join(ESS, "index.json"))
essays = {e["slug"]: e for e in index["essays"]}
topic_label = {t["id"]: t["label"] for t in index["topics"]}

portraits = load(os.path.join(CONN, "_author_portraits.json"))["portraits"]
dubois_hero = None
try:
    dubois_hero = load(os.path.join(CONN, "dubois-souls-coming-of-john.json")).get("hero_image")
except Exception:
    pass

AUTHOR_KEY = {"W. E. B. Du Bois": "__DUBOIS__", "Ida B. Wells-Barnett": "Ida B. Wells"}


def hero_for(authors):
    a = (authors or ["?"])[0]
    key = AUTHOR_KEY.get(a, a)
    if key == "__DUBOIS__":
        return clean_image(dict(dubois_hero)) if dubois_hero else None
    p = portraits.get(key)
    if not p or p.get("no_portrait"):
        return None
    img = dict(p)
    img.setdefault("caption", f"{a}.")
    return clean_image(img)


emb = {}
try:
    emb = load(os.path.join(CONN, "_embedding_neighbors.json")).get("neighbors", {})
except Exception:
    pass

curation = {}
for f in sorted(glob.glob(os.path.join(CONN, "_curation_g*.json"))):
    for obj in load(f):
        curation[obj["slug"]] = obj

inline = {}
for f in sorted(glob.glob(os.path.join(CONN, "_inline_g*.json"))):
    for slug, imgs in load(f).items():
        bucket = inline.setdefault(slug, [])
        for im in (imgs or []):
            ci = clean_image(im)
            if ci:
                bucket.append(ci)

toc = load(os.path.join(ROOT, "public/rag/toc.json"))
chap_by_entry = {}
subj_by_entry = {}
for iv in toc["interviews"]:
    e = iv["entry"]
    subj_by_entry[e] = clean_subject(iv.get("subject"))
    lst = chap_by_entry.setdefault(e, [])
    for part in iv.get("parts", []):
        for ch in part.get("chapters", []):
            lst.append({"title": ch.get("title"), "topic": ch.get("topic"),
                        "start": ch.get("start"), "end": ch.get("end"),
                        "part_title": part.get("title")})

people_idx = load(os.path.join(PEOPLE, "index.json"))
by_entry = people_idx.get("by_entry", {})


def slug_for_entry(e):
    r = by_entry.get(str(e)) or by_entry.get(e) or {}
    return r.get("slug")


def norm(s):
    return re.sub(r"\s+", " ", (s or "").replace("’", "'")).strip().lower()


def find_chapter(entry, title, start):
    lst = chap_by_entry.get(entry, [])
    cands = [c for c in lst if c["title"] == title] or [c for c in lst if norm(c["title"]) == norm(title)]
    if not cands:
        return None
    if len(cands) == 1:
        return cands[0]
    for c in cands:
        if start is not None and c["start"] is not None and abs(c["start"] - start) < 1.0:
            return c
    return cands[0]


def closing_for(top_voice):
    if not top_voice:
        return None
    slug = top_voice.get("slug") or slug_for_entry(top_voice.get("entry"))
    if not slug:
        return None
    fp = os.path.join(PEOPLE, slug + ".json")
    if not os.path.exists(fp):
        return None
    d = load(fp)
    ph = d.get("photo")
    is_portrait = bool(ph and (ph.get("src_external") or ph.get("src_local")))
    src = ph if is_portrait else next((g for g in (d.get("gallery") or [])
                                       if g.get("src_external") or g.get("src_local")), None)
    img = clean_image(src)
    if not img:
        return None
    subj = clean_subject(top_voice.get("subject") or d.get("display_name"))
    reason = clean_text(top_voice.get("reason") or "")
    if is_portrait:
        img["caption"] = f"{subj}, the corpus voice this essay connects to most. {reason}".strip()
    else:
        base = (img.get("alt") or img.get("caption") or "").rstrip(".")
        img["caption"] = f"{base}. {subj} is the corpus voice this essay connects to most.".strip()
    return img


report = []
ok = True
for slug, e in essays.items():
    cur = curation.get(slug)
    authors = e.get("authors") or []
    themes = e.get("themes") or []
    title = e.get("title")
    hero = hero_for(authors)
    rels, dropped = [], 0
    for rc in (cur or {}).get("related_chapters", []):
        entry = rc.get("entry")
        c = find_chapter(entry, rc.get("chapter_title"), rc.get("start"))
        if not c:
            dropped += 1
            continue
        rels.append({"entry": entry,
                     "subject": subj_by_entry.get(entry) or clean_subject(rc.get("subject")),
                     "slug": slug_for_entry(entry) or rc.get("slug"),
                     "part_title": c["part_title"], "chapter_title": c["title"],
                     "topic": c["topic"], "start": c["start"], "end": c["end"],
                     "why": clean_text(rc.get("why"))})
    tv = (cur or {}).get("top_voice") or {}
    top_voice = {"entry": tv.get("entry"),
                 "subject": subj_by_entry.get(tv.get("entry")) or clean_subject(tv.get("subject")),
                 "slug": slug_for_entry(tv.get("entry")) or tv.get("slug"),
                 "reason": clean_text(tv.get("reason"))} if tv else None
    closing = closing_for(top_voice)
    nv = [{"entry": v.get("entry"), "subject": clean_subject(v.get("subject")),
           "slug": v.get("slug") or slug_for_entry(v.get("entry")),
           "score": v.get("top_score")}
          for v in (emb.get(slug, {}).get("nearest_voices") or [])[:5]]
    voices3 = [v["subject"] for v in nv[:3] if v["subject"]]
    if len(voices3) >= 2:
        names = ", ".join(voices3[:-1]) + ", and " + voices3[-1]
        emb_line, method = f"Our embedding model places it nearest the testimony of {names}.", "embedding"
    elif voices3:
        emb_line, method = f"Our embedding model places it nearest the testimony of {voices3[0]}.", "embedding"
    else:
        emb_line, method = "", "curated"
    summary = clean_text(f"Across the Civil Rights History Project, the oral histories below take up the questions {title} raises. {emb_line}".strip())
    out = {"schema_version": 1, "slug": slug,
           "primary_topic": themes[0] if themes else None,
           "hero_image": hero, "inline_images": inline.get(slug, []),
           "related_chapters": rels, "top_voice": top_voice, "closing_image": closing,
           "connections": {"summary": summary, "method": method, "nearest_voices": nv},
           "shared_topics": themes}
    emdash = json.dumps(out, ensure_ascii=False).count("—")
    with open(os.path.join(CONN, slug + ".json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
    status = "OK" if (hero and rels) else ("NO-CUR" if not cur else "INCOMPLETE")
    if not (hero and rels):
        ok = False
    report.append((slug, status, len(rels), bool(hero), len(out["inline_images"]),
                   bool(closing), len(nv), dropped, emdash))

print(f"{'slug':44}{'status':9}ch hero inl clo nv drop em")
for slug, status, nch, hero, ninl, clo, nnv, drop, em in report:
    print(f"{slug:44}{status:9}{nch:2}  {int(hero)}    {ninl:2}  {int(clo)}   {nnv:2}  {drop:2}  {em}")
print("\nALL OK" if ok else "\nISSUES PRESENT (see status column)")
sys.exit(0 if ok else 1)
