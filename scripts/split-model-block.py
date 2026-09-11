"""Split a large component file by moving its leading model block
(types + static tables + pure helpers) into a standalone module.

Usage: python scripts/split-model-block.py <source.tsx> <target.ts> <startLine> <endLine>
Line numbers are 1-based and inclusive.
"""
import io
import os
import re
import sys

src, dst, start, end = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])

lines = io.open(src, encoding='utf-8').read().split('\n')
block = lines[start - 1:end]

decl = re.compile(r'^(type|interface|const|function)\s+([A-Za-z_][\w]*)')
exports = []
out = []
for line in block:
    m = decl.match(line)
    if m:
        exports.append(m.group(2))
        out.append('export ' + line)
    else:
        out.append(line)

header = (
    "// Auto-extracted model block: types, static content tables and pure helpers.\n"
    "// Kept in a separate module so the UI file only holds rendering concerns.\n"
)
needs_storage = 'readJsonStorage' in '\n'.join(block)
if needs_storage:
    header += "import { readJsonStorage } from '@/lib/browserStorage';\n"

os.makedirs(os.path.dirname(dst), exist_ok=True)
io.open(dst, 'w', encoding='utf-8', newline='\n').write(header + '\n'.join(out).rstrip() + '\n')

# Rebuild the source: everything before the block + one import line + the rest.
name = os.path.splitext(os.path.basename(dst))[0]
import_line = (
    "import {\n"
    + ''.join('  ' + e + ',\n' for e in exports)
    + "} from './" + name + "';"
)
rest = lines[:start - 1] + [import_line] + lines[end:]
io.open(src, 'w', encoding='utf-8', newline='\n').write('\n'.join(rest))

print('moved {} lines, exported {} symbols -> {}'.format(len(block), len(exports), dst))
