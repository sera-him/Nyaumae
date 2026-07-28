export interface HexCoord {
  q: number;
  r: number;
}

export interface MazeState {
  radius: number;
  cells: Set<string>;
  walls: Set<string>;
  start: HexCoord;
  end: HexCoord;
  exitDir: number;
  targets: HexCoord[];
  playerPos: HexCoord;
  playerDir: number;
  collected: Set<string>;
  steps: number;
  surrendered: boolean;
  won: boolean;
  started: boolean;
}

export interface Difficulty {
  name: string;
  radius: number;
  targets: number;
}

export const DIRECTIONS: [number, number][] = [
  [1, 0], [0, 1], [-1, 1],
  [-1, 0], [0, -1], [1, -1],
];

export const DIR_NAMES = ['→', '↗', '↖', '←', '↙', '↘'];

export function hexKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function wallKey(a: HexCoord, b: HexCoord): string {
  return [hexKey(a.q, a.r), hexKey(b.q, b.r)].sort().join('|');
}

export function hexNeighbor(q: number, r: number, dir: number): HexCoord {
  const [dq, dr] = DIRECTIONS[dir];
  return { q: q + dq, r: r + dr };
}

export function hexDistance(a: HexCoord, b: HexCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.r - b.r) + Math.abs(a.q + a.r - b.q - b.r)) / 2;
}
