import json, pathlib, re

old_path = pathlib.Path("tmp/wordfreq_old.json")
new_path = pathlib.Path("tmp/wordfreq_new.json")

old = json.loads(old_path.read_text(encoding="utf-8"))
new = json.loads(new_path.read_text(encoding="utf-8"))

old_map = {item['key']: item for item in old['items']}
new_map = {item['key']: item for item in new['items']}

# Filter to Han words only for meaningful diff
def is_han_word(w):
    return bool(re.match(r'^[\u4e00-\u9fff]+$', w))

# Build diff list for Han words
diffs = []
for key, nitem in new_map.items():
    word = nitem['word']
    if not is_han_word(word):
        continue
    old_count = old_map.get(key, {}).get('count', 0)
    new_count = nitem['count']
    delta = new_count - old_count
    if delta != 0:
        diffs.append((word, old_count, new_count, delta))

# Sort by delta desc
diffs.sort(key=lambda x: (-x[3], -x[2]))

print(f"OLD_TOKENS={old['tokens']} UNIQUE={old['unique']}")
print(f"NEW_TOKENS={new['tokens']} UNIQUE={new['unique']}")
print(f"DELTA_TOKENS={new['tokens']-old['tokens']} DELTA_UNIQUE={new['unique']-old['unique']}")
print("="*60)
print("Top 80 Han word increases (delta>0):")
for word, oc, nc, d in diffs[:80]:
    if d>0:
        print(f"{word:12} {oc:3} -> {nc:3}  (+{d})")

print("="*60)
# Also show new Han words that didn't exist before
new_only = [(w,oc,nc,d) for w,oc,nc,d in diffs if oc==0 and d>0]
print(f"New Han words count: {len(new_only)}")
for w,oc,nc,d in new_only[:60]:
    print(f"  NEW {w} = {nc}")

print("="*60)
# Show top Han words overall new
han_new_sorted = sorted([ (it['word'], it['count']) for it in new['items'] if is_han_word(it['word']) ], key=lambda x: -x[1])
print("Top 30 Han overall new:")
for w,c in han_new_sorted[:30]:
    print(f"  {w:10} {c}")

# Also show specific keywords from 14 contents
keywords = ["生育","契约","抚养","保证金","竞价","恒星","硅基","恒温","双轴","控制不住","不认可","三一","圣子","圣父","圣灵","定理","人择","模拟","毒品","海关","工资","零花钱","到手","五险一金","超级智能","校长","高考","志愿","位次","地铁","高峰","低谷","招聘","面试","资质","京贝狗","笔","蝉鸣","星尘"]
print("="*60)
print("Keyword check:")
for kw in keywords:
    # find any word containing kw
    found = [ (it['word'], it['count']) for it in new['items'] if kw in it['word']]
    if found:
        found.sort(key=lambda x: -x[1])
        print(f" {kw}: {found[:5]}")
    else:
        # check old vs new contains
        old_found = [ it for it in old['items'] if kw in it['word']]
        print(f" {kw}: NOT FOUND (old had {len(old_found)})")

# Write JSON diff for reference
out = {
    "old_tokens": old['tokens'],
    "new_tokens": new['tokens'],
    "delta_tokens": new['tokens']-old['tokens'],
    "old_unique": old['unique'],
    "new_unique": new['unique'],
    "delta_unique": new['unique']-old['unique'],
    "diffs": [{"word": w, "old": oc, "new": nc, "delta": d} for w,oc,nc,d in diffs]
}
pathlib.Path("tmp/wordfreq_diff.json").write_text(json.dumps(out, ensure_ascii=False, indent=2), encoding="utf-8")
print("DIFF_WRITTEN=tmp/wordfreq_diff.json")
