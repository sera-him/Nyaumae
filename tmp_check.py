import re, pathlib
root = pathlib.Path(r"C:\Users\Administrator\Desktop\app")
for p in root.rglob("*.ts"):
    try:
        t = p.read_text(encoding="utf-8")
    except:
        continue
    if re.search(r'friend', t, re.I):
        hits = re.findall(r'friend', t, re.I)
        print(str(p.relative_to(root)), len(hits))
        for m in re.finditer(r'.{0,40}friend.{0,40}', t, re.I):
            print("  ", m.group(0).replace("\n"," ")[:120])
        print()
