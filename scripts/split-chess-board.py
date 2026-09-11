import io
import re

p = 'src/sections/ChessRules.tsx'
lines = io.open(p, encoding='utf-8').read().split('\n')
block = lines[324:1107]  # 0-based -> lines 325..1107 (ChessGameBoard)

new_name = 'src/sections/ChessGameBoard.tsx'
header = """import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Play, RotateCcw, Undo2 } from 'lucide-react';
import { pieceTierColorMap } from '@/lib/highlightUtils';
import { confirmAction } from '@/lib/confirmAction';
import { useChessStore } from '@/stores/chessStore';
import type { CheeseType, PieceType, Player } from '@/game/chess/types';
import { BOARD_SIZE, POISON_IMMUNE } from '@/game/chess/types';
import { getPiece } from '@/game/chess/board';
import { applyPoisonFilter, canDecrypt, getNonCriticalVariety } from '@/game/chess/rules';
import { CATEGORY_ORDER, CLOCK_PRESETS } from '@/game/chess/clockPresets';
import { formatClock, formatDuration, formatSignedClock } from './chessRulesModel';

"""

body = '\n'.join(block).strip()
body = re.sub(r'^function ChessGameBoard\(', 'export function ChessGameBoard(', body, count=1)
io.open(new_name, 'w', encoding='utf-8', newline='\n').write(header + body + '\n')

# Remove block from original and add the import.
rest = lines[:324] + lines[1107:]
text = '\n'.join(rest)
text = text.replace(
    "} from './chessRulesModel';",
    "} from './chessRulesModel';\nimport { ChessGameBoard } from './ChessGameBoard';",
    1,
)
text = text.rstrip() + '\n'
io.open(p, 'w', encoding='utf-8', newline='\n').write(text)

print('moved', len(block), 'lines')
