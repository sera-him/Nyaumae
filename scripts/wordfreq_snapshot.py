#!/usr/bin/env python3
# Approximate word frequency mirroring wordFrequency.ts logic
import re
import pathlib
import json
from collections import Counter

ROOT = pathlib.Path(__file__).parent.parent
DATA_DIR = ROOT / "src" / "data"

# Read all data files that contribute to fullSearchIndex
# Simplified: collect all string literals from relevant files
files_to_scan = [
    "extraStories.ts",
    "fragments.ts",
    "miiaTexts.ts",
    "worldSettings.ts",
    "worldview.ts",
    "organizations.ts",
    "timeline.ts",
    "stories.ts",
    "dictionary.ts",
    "characters.ts",
    "extraCharacters.ts",
    "fullSearchIndex.ts",  # includes hardcoded pacific strings etc.
    "chess.ts",  # 复合象棋棋子/规则，*禁区/升变/火箭等最新修改影响词频
]

# Also scan component files for new UI content that may not be in data
component_files = [
    "src/sections/PacificIslands.tsx",
    "src/sections/MiiaWorld.tsx",
    "src/sections/ExtraStories.tsx",
    "src/sections/PrimeFocus.tsx",
    "src/sections/MiiaMathNotes.tsx",
    "src/sections/WorldSettings.tsx",
    "src/sections/Organizations.tsx",
    "src/pages/MathModelsPage.tsx",
]

def normalize_word(w):
    # NFKC approximated, strip leading/trailing non-alphanum
    w = w.strip()
    # remove leading/trailing chars that are not Han/Latin/N
    w = re.sub(r'^[^\w\u4e00-\u9fff]+|[^\w\u4e00-\u9fff]+$', '', w, flags=re.UNICODE)
    return w

def normalize_key(w):
    return normalize_word(w).lower()

def is_useful(word, protected_keys):
    if not word:
        return False
    low = word.lower()
    if low == 'object':
        return False
    if low in protected_keys:
        return True
    if re.match(r'^(?:\+[^+\s]+|[^+\s]+\+)$', word):
        return False
    if re.match(r'^(?:from|via|to)-[a-z\d-]+$', word, re.I):
        return False
    if re.match(r'^(?:https?:\/\/|\/|#)[^\s]+$', word, re.I):
        return False
    if re.match(r'^\d+$', word):
        return False
    # Han only
    if re.match(r'^[\u4e00-\u9fff]+$', word):
        return len(word) >= 2
    # else latin
    return bool(re.match(r'^[A-Za-z][A-Za-z0-9\+]+(?:-[A-Za-z0-9\+]+)*$', word))

# Load protected terms: character names
protected_terms = set()
try:
    chars = (DATA_DIR / "characters.ts").read_text(encoding="utf-8")
    extra = (DATA_DIR / "extraCharacters.ts").read_text(encoding="utf-8")
    # crude extract name: "name: \"...\""
    for m in re.finditer(r'name:\s*"([^"]+)"', chars):
        protected_terms.add(m.group(1).strip().lower())
    for m in re.finditer(r'name:\s*"([^"]+)"', extra):
        protected_terms.add(m.group(1).strip().lower())
    # also id titles?
except Exception as e:
    pass

protected_keys = { t.lower() for t in protected_terms }

def tokenize(text):
    # simplified mergeSegmentedWords: split by punctuation and spaces
    # keep markers for protected terms
    # For simplicity, just extract Han 2+ and latin words
    # This mirrors tokenize's isUseful filtering after extraction
    # Extract candidates
    candidates = re.findall(r'[\u4e00-\u9fff]{2,}|[A-Za-z][A-Za-z0-9\+]+(?:-[A-Za-z0-9\+]+)*', text)
    # Filter
    result = []
    for c in candidates:
        nw = normalize_word(c)
        if not nw:
            continue
        if is_useful(nw, protected_keys):
            result.append(nw)
    return result

def collect_text_from_file(path):
    try:
        txt = pathlib.Path(path).read_text(encoding="utf-8", errors="ignore")
        # Remove imports and technical lines? Keep all
        return txt
    except:
        return ""

# Build corpus from data + components
corpus_parts = []
for fname in files_to_scan:
    p = DATA_DIR / fname
    if p.exists():
        corpus_parts.append(collect_text_from_file(p))
for cfile in component_files:
    p = ROOT / cfile
    if p.exists():
        corpus_parts.append(collect_text_from_file(p))

full_text = "\n".join(corpus_parts)

tokens = tokenize(full_text)
counter = Counter()
for tok in tokens:
    key = normalize_key(tok)
    # keep display form first occurrence
    counter[key] += 1

# Need to handle display mapping: keep first form
display_map = {}
for tok in tokens:
    key = normalize_key(tok)
    if key not in display_map:
        display_map[key] = tok
    # if current is not lower and stored is lower, replace (as in TS)
    # simplified
    if display_map[key].islower() and not tok.islower():
        display_map[key] = tok

# Build sorted list
items = sorted(counter.items(), key=lambda x: (-x[1], -len(display_map.get(x[0], x[0])), display_map.get(x[0], x[0])))

# Output summary
print(f"TOTAL_WORDS={len(tokens)}")
print(f"UNIQUE_WORDS={len(counter)}")
print(f"SOURCE_PARTS={len(corpus_parts)}")
# Top 50
print("TOP50_JSON_START")
top = [{"word": display_map[k], "count": v, "key": k} for k,v in items[:50]]
print(json.dumps(top, ensure_ascii=False))
print("TOP50_JSON_END")
# Also output top 200 for diff
print("TOP200_JSON_START")
top200 = [{"word": display_map[k], "count": v} for k,v in items[:200]]
print(json.dumps(top200, ensure_ascii=False))
print("TOP200_JSON_END")
# Full counter for diff file
out_path = ROOT / "tmp" / "wordfreq_snapshot.json"
out_path.parent.mkdir(parents=True, exist_ok=True)
with open(out_path, "w", encoding="utf-8") as f:
    json.dump({"tokens": len(tokens), "unique": len(counter), "items": [{"word": display_map[k], "count": v, "key": k} for k,v in items]}, f, ensure_ascii=False, indent=2)
print(f"SNAPSHOT_WRITTEN={out_path}")
