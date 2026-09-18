// English mirror of ./chess — same structure, English text.
import type { ChessPiece } from './chess';

export const chessPiecesEn: ChessPiece[] = [
  { letter: 'K', name: 'King', move: '1 square in any of 8 directions', eat: '1 square in any of 8 directions', notes: 'Key piece — checkmate loses the game' },
  { letter: 'Q', name: 'Queen', move: 'Any number of squares orthogonally/diagonally', eat: 'Any number of squares orthogonally/diagonally', notes: 'May transform into an Ostrich O before moving' },
  { letter: 'R', name: 'Rook', move: 'Any number of squares orthogonally', eat: 'Any number of squares orthogonally' },
  { letter: 'B', name: 'Bishop', move: 'Any number of squares diagonally', eat: 'Any number of squares diagonally' },
  { letter: 'N', name: 'Knight', move: 'L-shape ("sun" step)', eat: 'L-shape ("sun" step)', notes: 'Can jump over pieces' },
  { letter: 'P', name: 'Pawn', move: 'Forward 1 square only; 2 squares on first move', eat: '1 square diagonally forward', notes: 'Promotes upon reaching the opponent\'s back rank' },
  { letter: 'T', name: 'Cat', move: 'Any square within a 5×5 range', eat: 'Can only eat the Mouse', notes: 'Cannot be blocked' },
  { letter: 'Y', name: 'Maine Coon', move: 'Any square within a 5×5 range', eat: 'Cannot capture', notes: 'After moving, fires rays in 8 directions; the first enemy Mouse hit is frightened for 1 turn' },
  { letter: 'M', name: 'Mouse', move: 'Any number of squares orthogonally/diagonally/L-shape', eat: 'Can capture', notes: 'Cannot jump over pieces' },
  { letter: 'E', name: 'Elephant', move: '1 square forward/left/right; 2 squares on first move', eat: '1 square diagonally forward', notes: 'Promotes upon reaching the opponent\'s back rank' },
  { letter: 'L', name: 'English', move: '1–2 squares orthogonally; the middle must be empty when moving 2', eat: 'Same as movement', notes: '*A piece entering the enemy English\'s cross 1–2 square exclusion zone is removed immediately (an English poisoned ≥4 is disabled)' },
  { letter: 'A', name: 'Antenna', move: '(r±2,c∓1), (r±2,c±1), (r,c±2); or 1 square in 8 directions', eat: 'Jump captures on (r±2,c∓1)/(r±2,c±1)/(r,c±2); no capture on 1-square moves', notes: 'After moving, may push one adjacent piece 2 squares away from itself' },
  { letter: 'C', name: 'Cannon', move: 'Like a Rook, cannot jump', eat: 'Needs a "carriage" within its surrounding 4 squares and between cannon and target; eats the first piece beyond the carriage' },
  { letter: 'W', name: 'Witch', move: '1 square in 8 directions', eat: 'Cannot capture', notes: 'Can poison (place poison in 8 adjacent empty squares), self-destruct to summon 3 Skeletons, and craft cheese' },
  { letter: 'Z', name: 'Skeleton', move: '1 square forward/left/right', eat: 'Can capture', notes: 'Must promote to Anti-Witch upon reaching the opponent\'s back rank' },
  { letter: 'IW', name: 'Anti-Witch', move: '1 square in 8 directions', eat: 'Cannot capture', notes: 'Self-destructs to summon Anti-Skeletons' },
  { letter: 'IZ', name: 'Anti-Skeleton', move: '1 square forward/left/right', eat: 'Can capture', notes: 'Must promote to Witch upon reaching your own back rank' },
  { letter: 'J', name: 'Paladin', move: 'L-shape ("sun" step), can jump', eat: 'L-shape ("sun" step)', notes: 'After moving, clears poison in the adjacent 8 squares and enemy Skeletons/Anti-Skeletons, and enemy Witches/Anti-Witches in the adjacent 4 squares' },
  { letter: 'H', name: 'Whale', move: '1 square orthogonally', eat: '—', notes: 'Cannot move to the board edge; other pieces cannot move to the 8 squares around it; after moving, removes all enemy pieces in range' },
  { letter: 'X', name: 'Rocket', move: 'Cannot move on its own', eat: '—', notes: 'Only obtainable by promotion; the King may move onto your own Rocket to fuse into an Astronaut U; if any piece eats a Rocket, the eater is removed along with it' },
  { letter: 'U', name: 'Astronaut', move: 'Any square within a 9×9 range', eat: 'Cannot capture', notes: 'Key piece; Astronaut + all non-key pieces can fuse into a Starship S' },
  { letter: 'S', name: 'Starship', move: 'Any square within a 9×9 range', eat: 'Cannot capture key pieces', notes: 'Each turn may add 1 non-key piece to an empty square in range; key piece' },
  { letter: 'O', name: 'Ostrich', move: 'Any number of squares orthogonally/diagonally', eat: 'Cannot capture', notes: 'Transformed from the Queen Q; cannot enter any enemy piece\'s attack range' },
  { letter: 'G', name: 'Catgirl', move: '1 square in 8 directions', eat: '1 square in 8 directions', notes: 'Equivalent to King + Cat. Key piece — checkmate loses the game' },
];

export const chessBoardLayout = [
  ['x','x','x','r','c','t','q','k','t','m','c','r'],
  ['x','h','x','a','b','l','y','j','t','a','l','b'],
  ['x','x','x','w','e','n','p','e','p','n','e','w'],
  ['x','p','x','x','p','x','x','p','x','x','p','x'],
  ['x','x','x','x','x','x','x','x','x','x','x','x'],
  ['x','x','x','x','x','x','x','x','x','x','x','x'],
  ['x','x','x','x','x','x','x','x','x','x','x','x'],
  ['x','x','x','x','x','x','x','x','x','x','x','x'],
  ['x','P','x','x','P','x','x','P','x','x','P','x'],
  ['x','x','x','W','E','N','P','E','P','N','E','W'],
  ['x','H','x','A','B','L','Y','J','T','A','L','B'],
  ['x','x','x','R','C','T','Q','K','T','M','C','R'],
];

export const chessSpecialRulesEn = [
  {
    title: 'Promotion rules',
    content: 'Pawn promotion: upon reaching the opponent\'s back rank, may promote to Rook/Knight/Queen/Bishop/Bishop-teacher.\nElephant promotion: upon reaching the opponent\'s back rank, may promote to Rook/Knight/Cannon/Queen/Cat/Maine Coon/English/Antenna/Bishop-teacher/Mouse/Rocket/Ostrich/Elephant (not promoting keeps it an Elephant, and it may still promote later after moving sideways)/Paladin.',
  },
  {
    title: 'Catgirl rules',
    content: 'The Queen Q may transform into an Ostrich O before moving.\nOstrich O: any number of squares orthogonally/diagonally, cannot jump; cannot enter any enemy piece\'s attack range (the Cat has no attack range, so it doesn\'t matter).\nWhen you have an Ostrich, your King automatically becomes a Catgirl G (King + Cat).',
  },
  {
    title: 'Poison rules',
    content: 'Poison D: a neutral unit; any piece stepping on it removes the poison and gains 1 poison stack.\nPoison mark: -n (n = poison count). Different pieces get different restrictions when poisoned; color tier drops as poison deepens (white→gray→…).\nEach poison stack reduces the Mouse\'s saturation by 10; at R-1 the color tier drops 2 levels.',
  },
  {
    title: 'Cheese rules',
    content: 'When a Mouse steps onto a square with cheese:\nYellow cheese CY: Mouse loses 1 poison stack\nOrange cheese CO: Mouse loses 4 poison stacks\nBlue cheese CB: the opponent can control this Mouse next turn\nPurple cheese CP: Mouse gains 2 poison stacks\nBlack cheese CK: Mouse gains 8 poison stacks\nA Witch must sacrifice one of your own Z/IZ in the surrounding 8 squares to craft orange or black cheese.',
  },
  {
    title: 'Decipher rules',
    content: 'On any of your action turns, as long as your own Rocket lies within the movement range of at least two of your Antennas on the board, you may decipher (costs one action).\nSequence: the first action triggers deciphering; the opponent takes their second action normally, then immediately takes their fourth action; the decipherer executes their third action; normal order resumes afterward.\nLogic order: third action first, then fourth. If it cannot be satisfied, the game ends in a draw.',
  },
];
