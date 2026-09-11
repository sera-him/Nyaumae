import io, os, re

MAP = {
    '#00e5cc': '--aurora-brand-cyan',
    '#06b6d4': '--aurora-brand-cyan-deep',
    '#14b8a6': '--aurora-brand-teal',
    '#8b5cf6': '--aurora-brand-violet',
    '#7c3aed': '--aurora-brand-violet-deep',
    '#a78bfa': '--aurora-brand-violet-soft',
    '#a855f7': '--aurora-brand-purple',
    '#f472b6': '--aurora-brand-pink',
    '#ec4899': '--aurora-brand-rose',
    '#ef4444': '--aurora-brand-red',
    '#f59e0b': '--aurora-brand-amber',
    '#f97316': '--aurora-brand-orange',
    '#eab308': '--aurora-brand-yellow',
    '#6366f1': '--aurora-brand-indigo',
    '#22c55e': '--aurora-brand-green',
    '#f0e6ff': '--aurora-brand-text',
    '#faf6ed': '--aurora-brand-cream',
    '#8b7daf': '--aurora-brand-muted',
    '#3d3b38': '--aurora-brand-stone',
    '#100a1a': '--aurora-brand-bg',
    '#1a1025': '--aurora-brand-bg-raised',
    '#0d0614': '--aurora-brand-bg-deep',
    '#0a0614': '--aurora-brand-bg-night',
    '#0a0510': '--aurora-brand-bg-plum',
    '#08040f': '--aurora-brand-bg-void',
    '#07040e': '--aurora-brand-bg-abyss',
    '#06030d': '--aurora-brand-bg-pitch',
    '#0a0a12': '--aurora-brand-bg-ink',
    '#251836': '--aurora-brand-bg-lilac',
    '#06100f': '--aurora-brand-bg-teal',
}

PREFIX = r'(bg|text|border|from|to|via|fill|stroke|ring|decoration|outline|divide|placeholder|caret)'
pattern = re.compile(PREFIX + r'-\[#([0-9a-fA-F]{6})\](?![0-9a-fA-F/])')

root = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'src')
print('scanning:', os.path.normpath(root))
total = 0
files_changed = 0
scanned = 0
for dirpath, _, names in os.walk(root):
    for n in names:
        if not n.endswith('.tsx'):
            continue
        scanned += 1
        p = os.path.join(dirpath, n)
        s = io.open(p, encoding='utf-8').read()

        def repl(m):
            global total
            tok = MAP.get('#' + m.group(2).lower())
            if not tok:
                return m.group(0)
            total += 1
            return '{}-[var({})]'.format(m.group(1), tok)

        new = pattern.sub(repl, s)
        if new != s:
            io.open(p, 'w', encoding='utf-8', newline='').write(new)
            files_changed += 1

print('scanned tsx:', scanned, '| replacements:', total, '| files:', files_changed)
