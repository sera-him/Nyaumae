import { useEffect, useRef, useState } from 'react';
import type { WordFreq } from '@/data/wordFrequency';
import './WordFrequencyCloud.css';

/** All frequency clouds use the dense, collision-packed WordClouds-style cloud. */
export type WordCloudShape = 'wordclouds';

interface WordFrequencyCloudProps {
  id: string;
  title: string;
  entries: WordFreq[];
  alpha: number;
  /** Kept as a compatibility prop for callers that already describe the cloud. */
  shape?: WordCloudShape;
  shapeLabel?: string;
  emptyText?: string;
}

interface HoveredWord {
  word: string;
  count: number;
}

interface PositionedWord extends WordFreq {
  x: number;
  y: number;
  fontSize: number;
  width: number;
  height: number;
  rotate: number;
  color: string;
  fontWeight: number;
  /** Ink-shaped rectangles in the word's local coordinate system. */
  inkBoxes: InkRect[];
}

interface CloudLayout {
  width: number;
  height: number;
  words: PositionedWord[];
  postScale: number;
}

interface InkRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

interface PlacedBox extends InkRect {
  word: PositionedWord;
  inkBoxes: InkRect[];
}

const CLOUD_COLORS = ['#247ca5', '#2e9b88', '#78a83b', '#d89024', '#c84f5d', '#765aa5', '#3f7eb0'];
const FONT_FAMILY = '"Noto Sans SC", "Microsoft YaHei", system-ui, sans-serif';
// Work in a larger coordinate system than the visible panel. This keeps the
// smallest words legible after the SVG is scaled down, just like the exported
// WordClouds preview, while still letting the page stay reasonably compact.
const INTERNAL_WIDTH_SCALE = 1.5;
const MIN_CLOUD_WIDTH = 1200;
const MIN_CLOUD_HEIGHT = 960;
const CLOUD_ASPECT_RATIO = 0.88;
const CLOUD_PADDING = 4;
const CLOUD_RADIUS_X_RATIO = 0.49;
const CLOUD_RADIUS_Y_RATIO = 0.49;
const COLLISION_GAP = 0;
const CELL_SIZE = 6;
const MIN_WORD_FONT_SIZE = 4.2;
const MAX_FONT_RATIO = 0.085;
const PLACEMENT_RESERVE_SCALE = 1.18;
const MAX_POST_SCALE = 1.32;
const POST_SCALE_SEARCH_STEPS = 18;
const ANCHOR_GAP_PATTERNS: ReadonlyArray<readonly [number, number]> = [
  [-1, .5], [2, .5], [.5, -1], [.5, 2],
  [.5, .5], [.25, .5], [.75, .5], [.5, .25], [.5, .75],
  [.25, .25], [.75, .25], [.25, .75], [.75, .75],
];

function stableHash(word: string): number {
  let hash = 2166136261;
  for (const character of word) {
    hash ^= character.codePointAt(0) ?? 0;
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function stableColorIndex(word: string): number {
  return stableHash(word) % CLOUD_COLORS.length;
}

function isCjk(character: string): boolean {
  return /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(character);
}

function getTextWidth(word: string, fontSize: number): number {
  let width = 0;
  for (const character of word) {
    width += getCharacterAdvance(character, fontSize);
  }
  return width + Math.max(1.2, fontSize * 0.16);
}

function getCharacterAdvance(character: string, fontSize: number): number {
  if (/\s/u.test(character)) return fontSize * 0.35;
  if (isCjk(character)) return fontSize;
  if (/[A-Z\d]/u.test(character)) return fontSize * 0.65;
  return fontSize * 0.58;
}

function rotateRect(rect: InkRect, rotate: number): InkRect {
  if (rotate === 0) return rect;
  const radians = rotate * Math.PI / 180;
  const cosine = Math.cos(radians);
  const sine = Math.sin(radians);
  const corners = [
    [rect.left, rect.top],
    [rect.right, rect.top],
    [rect.left, rect.bottom],
    [rect.right, rect.bottom],
  ].map(([x, y]) => [x * cosine - y * sine, x * sine + y * cosine]);
  return {
    left: Math.min(...corners.map(([x]) => x)),
    right: Math.max(...corners.map(([x]) => x)),
    top: Math.min(...corners.map(([, y]) => y)),
    bottom: Math.max(...corners.map(([, y]) => y)),
  };
}

function getGlyphInkBoxes(word: string, fontSize: number, rotate: number): InkRect[] {
  const advances = [...word].map((character) => getCharacterAdvance(character, fontSize));
  const totalAdvance = advances.reduce((sum, advance) => sum + advance, 0);
  let cursor = -totalAdvance / 2;
  const inkBoxes: InkRect[] = [];

  [...word].forEach((character, index) => {
    const advance = advances[index];
    const isSpace = /\s/u.test(character);
    if (!isSpace) {
      // Use the approximate painted glyph area, not the full advance cell.
      // The surrounding cell is intentionally available to other words so
      // small terms can occupy the real whitespace between larger glyphs.
      const inkWidth = isCjk(character)
        ? fontSize * 0.78
        : Math.min(advance * 0.72, fontSize * 0.66);
      const inkHeight = fontSize * (isCjk(character) ? 0.76 : 0.72);
      const center = cursor + advance / 2;
      inkBoxes.push(rotateRect({
        left: center - inkWidth / 2,
        right: center + inkWidth / 2,
        top: -inkHeight / 2,
        bottom: inkHeight / 2,
      }, rotate));
    }
    cursor += advance;
  });

  return inkBoxes;
}

function getRotatedSize(width: number, height: number, rotate: number): { width: number; height: number } {
  const radians = Math.abs(rotate) * Math.PI / 180;
  const cosine = Math.abs(Math.cos(radians));
  const sine = Math.abs(Math.sin(radians));
  return {
    width: width * cosine + height * sine,
    height: width * sine + height * cosine,
  };
}

function getRotation(word: string, rank: number, total: number): number {
  const hash = stableHash(word);
  const shortWord = [...word].length <= 4;
  // Keep the dominant horizontal reading direction, but introduce enough
  // vertical terms to create the irregular WordClouds-style collisions.
  if (rank < Math.max(70, Math.ceil(total * 0.045)) && hash % 9 === 0) return 90;
  if (shortWord && hash % 9 === 0) return hash % 2 === 0 ? 90 : -90;
  if (!shortWord && hash % 43 === 0) return hash % 2 === 0 ? 90 : -90;
  return 0;
}

function estimateInkAreaAtOnePixel(word: string): number {
  // The browser cannot measure every glyph before layout. This conservative
  // estimate keeps the rendered glyph area proportional to count^alpha while
  // accounting for CJK and Latin words having different widths.
  return Math.max(0.45, getTextWidth(word, 1) * 1.36 * 0.56);
}

function getAreaWeightedFontSize(
  entry: WordFreq,
  maximumEntry: WordFreq,
  maximumFontSize: number,
  alpha: number,
  minimumFontSize = 0,
): number {
  const referenceCount = Math.max(1, maximumEntry.count);
  const count = Math.max(1, entry.count);
  const exponent = alpha * (Math.log(count) - Math.log(referenceCount));
  // The input is already restricted to finite values. Clamping only avoids
  // overflowing the browser when a user deliberately enters a very large one.
  const relativeArea = Math.exp(Math.max(-60, Math.min(60, exponent)));
  const referenceArea = maximumFontSize * maximumFontSize * estimateInkAreaAtOnePixel(maximumEntry.word);
  return Math.max(
    minimumFontSize,
    Math.sqrt((referenceArea * relativeArea) / estimateInkAreaAtOnePixel(entry.word)),
  );
}

function getWeight(entry: WordFreq, referenceCount: number, alpha: number): number {
  const exponent = alpha * (Math.log(Math.max(1, entry.count)) - Math.log(Math.max(1, referenceCount)));
  return Math.exp(Math.max(-60, Math.min(60, exponent)));
}

function makeWord(entry: WordFreq, fontSize: number, rotate: number): PositionedWord {
  const textWidth = getTextWidth(entry.word, fontSize);
  // The visible SVG glyphs are much tighter than the old 1.36 line-height
  // approximation. A tighter mask lets small words close the gaps naturally.
  const textHeight = Math.max(1.25, fontSize * 0.98);
  const padded = getRotatedSize(
    textWidth + Math.max(0.24, fontSize * 0.026),
    textHeight + Math.max(0.24, fontSize * 0.026),
    rotate,
  );
  return {
    ...entry,
    x: 0,
    y: 0,
    fontSize,
    width: padded.width,
    height: padded.height,
    rotate,
    color: CLOUD_COLORS[stableColorIndex(entry.word)],
    fontWeight: 400,
    inkBoxes: getGlyphInkBoxes(entry.word, fontSize, rotate),
  };
}

function getBox(word: PositionedWord, x: number, y: number): PlacedBox {
  return {
    word,
    left: x - word.width / 2 - COLLISION_GAP,
    right: x + word.width / 2 + COLLISION_GAP,
    top: y - word.height / 2 - COLLISION_GAP,
    bottom: y + word.height / 2 + COLLISION_GAP,
    inkBoxes: word.inkBoxes.map((box) => ({
      left: box.left + x,
      right: box.right + x,
      top: box.top + y,
      bottom: box.bottom + y,
    })),
  };
}

interface OccupancyGrid {
  columns: number;
  rows: number;
  cells: Array<PlacedBox[] | undefined>;
  placedBoxes: PlacedBox[];
}

function createOccupancyGrid(width: number, height: number): OccupancyGrid {
  const columns = Math.ceil(width / CELL_SIZE) + 1;
  const rows = Math.ceil(height / CELL_SIZE) + 1;
  return {
    columns,
    rows,
    cells: new Array<PlacedBox[] | undefined>(columns * rows),
    placedBoxes: [],
  };
}

function getOccupancyRange(box: InkRect, grid: OccupancyGrid): { left: number; right: number; top: number; bottom: number } {
  return {
    left: Math.max(0, Math.floor(box.left / CELL_SIZE)),
    right: Math.min(grid.columns - 1, Math.ceil(box.right / CELL_SIZE)),
    top: Math.max(0, Math.floor(box.top / CELL_SIZE)),
    bottom: Math.min(grid.rows - 1, Math.ceil(box.bottom / CELL_SIZE)),
  };
}

function collides(box: PlacedBox, grid: OccupancyGrid): boolean {
  const nearby = new Set<PlacedBox>();
  for (const inkBox of box.inkBoxes) {
    const range = getOccupancyRange(inkBox, grid);
    for (let row = range.top; row <= range.bottom; row += 1) {
      const offset = row * grid.columns;
      for (let column = range.left; column <= range.right; column += 1) {
        for (const other of grid.cells[offset + column] ?? []) nearby.add(other);
      }
    }
  }

  for (const other of nearby) {
    for (const inkBox of box.inkBoxes) {
      for (const otherInkBox of other.inkBoxes) {
        if (inkBox.left < otherInkBox.right
          && inkBox.right > otherInkBox.left
          && inkBox.top < otherInkBox.bottom
          && inkBox.bottom > otherInkBox.top) return true;
      }
    }
  }
  return false;
}

function addToGrid(box: PlacedBox, grid: OccupancyGrid): void {
  for (const inkBox of box.inkBoxes) {
    const range = getOccupancyRange(inkBox, grid);
    for (let row = range.top; row <= range.bottom; row += 1) {
      const offset = row * grid.columns;
      for (let column = range.left; column <= range.right; column += 1) {
        const cellIndex = offset + column;
        const cell = grid.cells[cellIndex];
        if (cell) {
          if (!cell.includes(box)) cell.push(box);
        } else grid.cells[cellIndex] = [box];
      }
    }
  }
  grid.placedBoxes.push(box);
}

function isInsideCloud(box: PlacedBox, width: number, height: number): boolean {
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * CLOUD_RADIUS_X_RATIO - CLOUD_PADDING;
  const radiusY = height * CLOUD_RADIUS_Y_RATIO - CLOUD_PADDING;
  if (radiusX <= 0 || radiusY <= 0) return false;

  return [
    [box.left, box.top],
    [box.right, box.top],
    [box.left, box.bottom],
    [box.right, box.bottom],
  ].every(([x, y]) => {
    const normalizedX = (x - centerX) / radiusX;
    const normalizedY = (y - centerY) / radiusY;
    // WordClouds' edge is not a perfect geometric ellipse: its final outline
    // is the accidental edge of the scattered words. A very small deterministic
    // ripple gives the same organic contour without turning it into a mask.
    const angle = Math.atan2(normalizedY, normalizedX);
    const ripple = 1
      + 0.035 * Math.sin(angle * 3 + 0.8)
      + 0.022 * Math.sin(angle * 7 - 1.4)
      + 0.014 * Math.cos(angle * 11 + 0.25);
    return normalizedX * normalizedX + normalizedY * normalizedY <= ripple * ripple;
  });
}

function isInkInsideCloud(word: PositionedWord, width: number, height: number): boolean {
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * CLOUD_RADIUS_X_RATIO - CLOUD_PADDING;
  const radiusY = height * CLOUD_RADIUS_Y_RATIO - CLOUD_PADDING;
  if (radiusX <= 0 || radiusY <= 0) return false;

  return word.inkBoxes.every((inkBox) => [
    [inkBox.left + word.x, inkBox.top + word.y],
    [inkBox.right + word.x, inkBox.top + word.y],
    [inkBox.left + word.x, inkBox.bottom + word.y],
    [inkBox.right + word.x, inkBox.bottom + word.y],
  ].every(([x, y]) => {
    const normalizedX = (x - centerX) / radiusX;
    const normalizedY = (y - centerY) / radiusY;
    const angle = Math.atan2(normalizedY, normalizedX);
    const ripple = 1
      + 0.035 * Math.sin(angle * 3 + 0.8)
      + 0.022 * Math.sin(angle * 7 - 1.4)
      + 0.014 * Math.cos(angle * 11 + 0.25);
    return normalizedX * normalizedX + normalizedY * normalizedY <= ripple * ripple;
  }));
}

function getInkBounds(words: PositionedWord[]): InkRect | undefined {
  if (words.length === 0) return undefined;
  let bounds: InkRect | undefined;
  for (const word of words) {
    for (const inkBox of word.inkBoxes) {
      const next: InkRect = {
        left: inkBox.left + word.x,
        right: inkBox.right + word.x,
        top: inkBox.top + word.y,
        bottom: inkBox.bottom + word.y,
      };
      bounds = bounds
        ? {
          left: Math.min(bounds.left, next.left),
          right: Math.max(bounds.right, next.right),
          top: Math.min(bounds.top, next.top),
          bottom: Math.max(bounds.bottom, next.bottom),
        }
        : next;
    }
  }
  return bounds;
}

function transformCloudWord(
  word: PositionedWord,
  width: number,
  height: number,
  scale: number,
  offsetX = 0,
  offsetY = 0,
): PositionedWord {
  const centerX = width / 2;
  const centerY = height / 2;
  return {
    ...word,
    x: centerX + (word.x - centerX) * scale + offsetX,
    y: centerY + (word.y - centerY) * scale + offsetY,
    fontSize: word.fontSize * scale,
    width: word.width * scale,
    height: word.height * scale,
    inkBoxes: word.inkBoxes.map((box) => ({
      left: box.left * scale,
      right: box.right * scale,
      top: box.top * scale,
      bottom: box.bottom * scale,
    })),
  };
}

function projectPackedCloud(
  words: PositionedWord[],
  sourceWidth: number,
  sourceHeight: number,
  targetWidth: number,
  targetHeight: number,
  scale: number,
): PositionedWord[] {
  const offsetX = targetWidth / 2 - sourceWidth / 2;
  const offsetY = targetHeight / 2 - sourceHeight / 2;
  return words.map((word) => {
    const scaled = transformCloudWord(word, sourceWidth, sourceHeight, scale);
    return {
      ...scaled,
      x: scaled.x + offsetX,
      y: scaled.y + offsetY,
    };
  });
}

function canScaleCloud(
  words: PositionedWord[],
  width: number,
  height: number,
  scale: number,
  offsetX: number,
  offsetY: number,
): boolean {
  return words.every((word) => isInkInsideCloud(
    transformCloudWord(word, width, height, scale, offsetX, offsetY),
    width,
    height,
  ));
}

interface PostProcessedCloud {
  words: PositionedWord[];
  scale: number;
}

function postProcessCloud(words: PositionedWord[], width: number, height: number): PostProcessedCloud {
  if (words.length === 0) return { words, scale: 1 };

  // First center the actual painted ink, rather than the much looser word
  // frames. This removes the common one-sided halo before the zoom pass.
  const bounds = getInkBounds(words);
  const centerX = width / 2;
  const centerY = height / 2;
  const boundsCenterX = bounds ? (bounds.left + bounds.right) / 2 : centerX;
  const boundsCenterY = bounds ? (bounds.top + bounds.bottom) / 2 : centerY;
  const maxCenterShiftX = width * 0.035;
  const maxCenterShiftY = height * 0.035;
  const offsetX = Math.max(-maxCenterShiftX, Math.min(maxCenterShiftX, centerX - boundsCenterX));
  const offsetY = Math.max(-maxCenterShiftY, Math.min(maxCenterShiftY, centerY - boundsCenterY));
  const centeredWords = words.map((word) => transformCloudWord(word, width, height, 1, offsetX, offsetY));
  const baseWords = canScaleCloud(centeredWords, width, height, 1, 0, 0)
    ? centeredWords
    : words;

  // Find the largest safe uniform zoom after placement. Only the painted
  // glyph boxes constrain this pass, so the unused advance space can still
  // be filled by neighboring words without clipping visible text.
  if (!canScaleCloud(baseWords, width, height, 1, 0, 0)) return { words, scale: 1 };
  let low = 1;
  let high = MAX_POST_SCALE;
  if (!canScaleCloud(baseWords, width, height, high, 0, 0)) {
    for (let step = 0; step < POST_SCALE_SEARCH_STEPS; step += 1) {
      const middle = (low + high) / 2;
      if (canScaleCloud(baseWords, width, height, middle, 0, 0)) low = middle;
      else high = middle;
    }
  } else low = high;

  return {
    words: baseWords.map((word) => transformCloudWord(word, width, height, low)),
    scale: low,
  };
}

function findCloudPosition(
  word: PositionedWord,
  width: number,
  height: number,
  startAngle: number,
  grid: OccupancyGrid,
  maxAttempts: number,
  rank: number,
): { x: number; y: number } | undefined {
  const centerX = width / 2;
  const centerY = height / 2;
  const radiusX = width * CLOUD_RADIUS_X_RATIO - CLOUD_PADDING - word.width / 2;
  const radiusY = height * CLOUD_RADIUS_Y_RATIO - CLOUD_PADDING - word.height / 2;
  if (radiusX <= 0 || radiusY <= 0) return undefined;

  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  // WordClouds-style placement starts with random landing zones. The high
  // weight terms get many samples so they spread across the whole cloud;
  // later terms use random samples to find small pockets between them.
  const scatterCount = rank < 180 ? 150 : rank < 900 ? 86 : 48;
  let randomState = (stableHash(`${word.word}:${rank}`) || 1) >>> 0;
  const nextRandom = () => {
    randomState = Math.imul(randomState, 1664525) + 1013904223;
    return (randomState >>> 0) / 4_294_967_296;
  };

  const tryPosition = (x: number, y: number): { x: number; y: number } | undefined => {
    const box = getBox(word, x, y);
    return isInsideCloud(box, width, height) && !collides(box, grid) ? { x, y } : undefined;
  };

  // Give every later term a deterministic, evenly scattered target before
  // falling back to random samples. The golden-angle/radial sequence keeps
  // the result visibly irregular while preventing small words from collecting
  // around only the first few large-word islands.
  if (rank >= 120) {
    const hashUnit = stableHash(word.word) / 4_294_967_296;
    const coverageFraction = (rank * 0.7548776662466927 + hashUnit * 0.13) % 1;
    const coverageAngle = rank * goldenAngle + hashUnit * Math.PI * 0.38;
    const coverageRadius = Math.sqrt(coverageFraction)
      * (rank < 360 ? 0.62 : rank < 1_000 ? 0.82 : 0.985);
    const targetX = centerX + Math.cos(coverageAngle) * coverageRadius * radiusX;
    const targetY = centerY + Math.sin(coverageAngle) * coverageRadius * radiusY;
    const localStep = Math.max(1.1, Math.min(word.width, word.height) * 0.42);
    const localAttempts = rank < 1_000 ? 96 : 72;
    for (let attempt = 0; attempt < localAttempts; attempt += 1) {
      const localRadius = attempt === 0 ? 0 : Math.sqrt(attempt) * localStep;
      const localAngle = startAngle + attempt * goldenAngle;
      const position = tryPosition(
        targetX + Math.cos(localAngle) * localRadius,
        targetY + Math.sin(localAngle) * localRadius,
      );
      if (position) return position;
    }
  }

  // Once the large terms have established the irregular cloud silhouette,
  // systematically sweep the frames of the strongest anchors. The frame is
  // allowed to overlap; the glyph boxes are still collision-tested, so a
  // small word can settle between the glyphs of a larger word. This is a
  // deterministic gap pass rather than a handful of random anchor samples:
  // every later word gets two patterns around the leading anchor pool.
  const anchorPoolSize = Math.min(rank < 900 ? 140 : 220, grid.placedBoxes.length);
  const anchorAttempts = rank < 120 ? 0 : anchorPoolSize * 2;
  const anchorFirst = anchorAttempts > 0;
  const findAnchorPosition = (): { x: number; y: number } | undefined => {
    if (anchorPoolSize === 0) return undefined;
    const seed = stableHash(word.word) % anchorPoolSize;
    for (let sample = 0; sample < anchorAttempts; sample += 1) {
      const anchor = grid.placedBoxes[(seed + sample % anchorPoolSize) % anchorPoolSize];
      const anchorWidth = anchor.right - anchor.left;
      const anchorHeight = anchor.bottom - anchor.top;
      const [xFraction, yFraction] = ANCHOR_GAP_PATTERNS[
        (Math.floor(sample / anchorPoolSize) + sample + seed) % ANCHOR_GAP_PATTERNS.length
      ];
      const resolveCoordinate = (
        start: number,
        size: number,
        fraction: number,
        wordSize: number,
      ): number => fraction === -1
        ? start - wordSize / 2
        : fraction === 2
          ? start + size + wordSize / 2
          : start + size * fraction;
      const x = resolveCoordinate(anchor.left, anchorWidth, xFraction, word.width);
      const y = resolveCoordinate(anchor.top, anchorHeight, yFraction, word.height);
      const position = tryPosition(x, y);
      if (position) return position;
    }
    return undefined;
  };

  if (anchorFirst) {
    const position = findAnchorPosition();
    if (position) return position;
  }

  const scatterRadius = rank < 180 ? 0.55 : rank < 900 ? 0.82 : 1;
  for (let sample = 0; sample < scatterCount; sample += 1) {
    const angle = nextRandom() * Math.PI * 2;
    const radius = Math.sqrt(nextRandom()) * scatterRadius;
    const x = centerX + Math.cos(angle) * radius * radiusX;
    const y = centerY + Math.sin(angle) * radius * radiusY;
    const position = tryPosition(x, y);
    if (position) return position;
  }

  if (!anchorFirst) {
    const position = findAnchorPosition();
    if (position) return position;
  }

  // The golden-angle spiral is the compacting pass. Its step is based on the
  // actual glyph box, so tiny words can settle into holes instead of creating
  // a second regular row.
  const step = Math.max(1.2, Math.min(word.width, word.height) * 0.55);
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const radius = attempt === 0 ? 0 : 0.7 + Math.sqrt(attempt) * step;
    const angle = startAngle + attempt * goldenAngle;
    const normalizedRadius = Math.min(1, radius / Math.min(radiusX, radiusY));
    const x = centerX + Math.cos(angle) * normalizedRadius * radiusX;
    const y = centerY + Math.sin(angle) * normalizedRadius * radiusY;
    const position = tryPosition(x, y);
    if (position) return position;
  }

  // A final low-discrepancy sweep recovers isolated pockets that one spiral
  // can miss when many large words have already been scattered.
  const sampleCount = Math.min(260, Math.max(90, Math.floor(maxAttempts / 2)));
  const seed = (stableHash(word.word) % 10_000) / 10_000;
  for (let sample = 0; sample < sampleCount; sample += 1) {
    const fraction = (sample + 0.5) / sampleCount;
    const radius = Math.sqrt((fraction + seed) % 1);
    const angle = startAngle + sample * goldenAngle * 1.7;
    const x = centerX + Math.cos(angle) * radius * radiusX;
    const y = centerY + Math.sin(angle) * radius * radiusY;
    const position = tryPosition(x, y);
    if (position) return position;
  }
  return undefined;
}

interface PackedCloud {
  words: PositionedWord[];
  complete: boolean;
}

function packCloud(
  sortedEntries: WordFreq[],
  width: number,
  height: number,
  scale: number,
  minimumFontSize: number,
  maximumEntry: WordFreq,
  alpha: number,
  maximumFontSize: number,
): PackedCloud {
  const grid = createOccupancyGrid(width, height);
  const words: PositionedWord[] = [];
  const availableWidth = width - CLOUD_PADDING * 2;

  for (let rank = 0; rank < sortedEntries.length; rank += 1) {
    const entry = sortedEntries[rank];
    const rotation = getRotation(entry.word, rank, sortedEntries.length);
    let fontSize = Math.max(
      minimumFontSize,
      getAreaWeightedFontSize(entry, maximumEntry, maximumFontSize, alpha, minimumFontSize) * scale,
    );
    const startAngle = (stableHash(entry.word) % 360) * Math.PI / 180;
    const attempts = sortedEntries.length > 2_000
      ? rank < 180 ? 1_000 : rank < 900 ? 620 : 360
      : 760;
    let placedWord: PositionedWord | undefined;

    // Preserve the area hierarchy. A small per-word fallback is only for a
    // browser font with an unusually wide glyph; it never reaches the former
    // sub-pixel fallback.
    for (let sizeAttempt = 0; sizeAttempt < 10 && !placedWord; sizeAttempt += 1) {
      let word = makeWord(entry, fontSize, rotation);
      if (word.width > availableWidth) {
        fontSize = Math.max(minimumFontSize, fontSize * availableWidth / word.width * 0.96);
        word = makeWord(entry, fontSize, rotation);
      }
      const position = findCloudPosition(word, width, height, startAngle, grid, attempts, rank);
      if (position) {
        word.x = position.x;
        word.y = position.y;
        placedWord = word;
        break;
      }
      const nextFontSize = Math.max(minimumFontSize, fontSize * 0.9);
      if (nextFontSize === fontSize) break;
      fontSize = nextFontSize;
    }

    if (!placedWord) return { words, complete: false };
    addToGrid(getBox(placedWord, placedWord.x, placedWord.y), grid);
    words.push(placedWord);
  }

  return { words, complete: true };
}

function makeCloudLayout(entries: WordFreq[], width: number, alpha: number): CloudLayout {
  const safeWidth = Math.max(MIN_CLOUD_WIDTH, Math.round(width * INTERNAL_WIDTH_SCALE));
  const cloudHeight = Math.max(MIN_CLOUD_HEIGHT, Math.round(safeWidth * CLOUD_ASPECT_RATIO));
  const referenceCount = alpha >= 0
    ? Math.max(...entries.map((entry) => entry.count))
    : Math.min(...entries.map((entry) => entry.count));
  const maximumEntry = entries.reduce((maximum, entry) => {
    const maximumWeight = getWeight(maximum, referenceCount, alpha);
    const entryWeight = getWeight(entry, referenceCount, alpha);
    return entryWeight > maximumWeight ? entry : maximum;
  }, entries[0]);
  const sortedEntries = [...entries].sort((a, b) => {
    const weightDifference = getWeight(b, referenceCount, alpha) - getWeight(a, referenceCount, alpha);
    return weightDifference || stableHash(a.word) - stableHash(b.word);
  });

  // Establish one global scale before packing. This preserves every area
  // ratio, including negative alpha values, while guaranteeing that the sum
  // of all requested word areas can fit inside the cloud.
  const nominalMaximumFontSize = safeWidth * MAX_FONT_RATIO;
  const nominalArea = sortedEntries.reduce((sum, entry) => {
    const fontSize = getAreaWeightedFontSize(entry, maximumEntry, nominalMaximumFontSize, alpha);
    return sum + fontSize * fontSize * estimateInkAreaAtOnePixel(entry.word);
  }, 0);
  const ellipseArea = Math.PI
    * (safeWidth * CLOUD_RADIUS_X_RATIO)
    * (cloudHeight * CLOUD_RADIUS_Y_RATIO);
  const areaScale = Math.min(1, Math.sqrt((ellipseArea * 0.78) / Math.max(1, nominalArea)));
  const maximumFontSize = nominalMaximumFontSize * areaScale;
  const minimumFontSize = Math.max(0.55, MIN_WORD_FONT_SIZE * areaScale);
  const placementWidth = Math.max(720, Math.round(safeWidth / PLACEMENT_RESERVE_SCALE));
  const placementHeight = Math.max(640, Math.round(cloudHeight / PLACEMENT_RESERVE_SCALE));

  // Keep the first passes close to the requested visual scale. If a very
  // extreme alpha makes the big terms too dominant, only then reduce the
  // whole cloud modestly; the layout must remain readable at every pass.
  const densityPasses = [1, 0.94, 0.88, 0.82, 0.76, 0.7];
  for (const scale of densityPasses) {
    const packed = packCloud(
      sortedEntries,
      placementWidth,
      placementHeight,
      scale,
      minimumFontSize,
      maximumEntry,
      alpha,
      maximumFontSize,
    );
    if (packed.complete) {
      const projectedWords = projectPackedCloud(
        packed.words,
        placementWidth,
        placementHeight,
        safeWidth,
        cloudHeight,
        PLACEMENT_RESERVE_SCALE,
      );
      const postProcessed = postProcessCloud(projectedWords, safeWidth, cloudHeight);
      return {
        width: safeWidth,
        height: cloudHeight,
        words: postProcessed.words,
        postScale: PLACEMENT_RESERVE_SCALE * postProcessed.scale,
      };
    }
  }

  // The all-words contract is more important than forcing a word out of the
  // canvas. Give the same natural cloud a little extra height as the final
  // recovery, while keeping the minimum font readable.
  const expandedHeight = Math.max(cloudHeight, Math.round(safeWidth * 1.08));
  const expandedPass = packCloud(
    sortedEntries,
    placementWidth,
    Math.max(640, Math.round(expandedHeight / PLACEMENT_RESERVE_SCALE)),
    0.68,
    minimumFontSize,
    maximumEntry,
    alpha,
    maximumFontSize,
  );
  if (!expandedPass.complete) {
    console.warn('Word cloud layout incomplete: not all words could be placed');
  }
  const projectedWords = projectPackedCloud(
    expandedPass.words,
    placementWidth,
    Math.max(640, Math.round(expandedHeight / PLACEMENT_RESERVE_SCALE)),
    safeWidth,
    expandedHeight,
    PLACEMENT_RESERVE_SCALE,
  );
  const postProcessed = postProcessCloud(projectedWords, safeWidth, expandedHeight);
  return {
    width: safeWidth,
    height: expandedHeight,
    words: postProcessed.words,
    postScale: PLACEMENT_RESERVE_SCALE * postProcessed.scale,
  };
}

function serializeSvg(svg: SVGSVGElement): string {
  const serialized = new XMLSerializer().serializeToString(svg);
  return serialized.includes('xmlns=')
    ? serialized
    : serialized.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
}

export default function WordFrequencyCloud({
  id,
  title,
  entries,
  alpha,
  shapeLabel = 'WordClouds 风格自然词团',
  emptyText = '暂无可显示的词频数据',
}: WordFrequencyCloudProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [status, setStatus] = useState<'idle' | 'drawing' | 'ready'>('idle');
  const [layout, setLayout] = useState<CloudLayout | undefined>();
  const [hoveredWord, setHoveredWord] = useState<HoveredWord | undefined>();

  useEffect(() => {
    const container = containerRef.current;
    if (!container || entries.length === 0) return;
    let disposed = false;
    let renderTimer = 0;
    let lastWidth = 0;
    let renderedWidth = 0;
    let renderedAlpha = Number.NaN;

    const render = () => {
      const width = Math.max(280, Math.floor(container.clientWidth));
      if (width === lastWidth && renderedWidth === width && renderedAlpha === alpha) return;
      lastWidth = width;
      setStatus('drawing');
      window.clearTimeout(renderTimer);
      renderTimer = window.setTimeout(() => {
        if (disposed) return;
        const nextLayout = makeCloudLayout(entries, width, alpha);
        renderedWidth = width;
        renderedAlpha = alpha;
        setLayout(nextLayout);
        setStatus('ready');
      }, 0);
    };

    render();
    const observer = new ResizeObserver(render);
    observer.observe(container);
    return () => {
      disposed = true;
      window.clearTimeout(renderTimer);
      observer.disconnect();
    };
  }, [entries, alpha]);

  const downloadCloud = () => {
    const svg = svgRef.current;
    if (!svg || !layout || status !== 'ready') return;
    const svgUrl = URL.createObjectURL(new Blob([serializeSvg(svg)], { type: 'image/svg+xml;charset=utf-8' }));
    const image = new Image();
    image.onload = () => {
      const scale = 2;
      const canvas = document.createElement('canvas');
      canvas.width = layout.width * scale;
      canvas.height = layout.height * scale;
      const context = canvas.getContext('2d');
      if (context) {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        const link = document.createElement('a');
        link.download = `${id}-word-frequency.png`;
        link.href = canvas.toDataURL('image/png');
        link.style.display = 'none';
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
      URL.revokeObjectURL(svgUrl);
    };
    image.onerror = () => URL.revokeObjectURL(svgUrl);
    image.src = svgUrl;
  };

  const statusText = status === 'drawing'
    ? '正在生成全量“词云与月”…'
    : status === 'ready' && layout
      ? `已完整排入 ${layout.words.length.toLocaleString('zh-CN')} / ${entries.length.toLocaleString('zh-CN')} 项 · alpha = ${alpha}`
      : '';

  return (
    <section aria-labelledby={`${id}-title`} className="word-frequency-cloud">
      <div className="word-frequency-cloud-heading">
        <div>
          <h4 id={`${id}-title`}>{title}</h4>
          <p>{shapeLabel} · 文字实际面积 ∝ 词频^{alpha} · 随机碰撞排布 · 全量显示</p>
        </div>
        <div className="word-frequency-cloud-actions">
          <span className="word-frequency-cloud-count">“词云与月” · {entries.length.toLocaleString('zh-CN')} 项</span>
          <button type="button" onClick={downloadCloud} disabled={status !== 'ready'} className="word-frequency-download">
            下载 PNG
          </button>
        </div>
      </div>
      {entries.length === 0 ? (
        <div className="word-frequency-cloud-empty">{emptyText}</div>
      ) : (
        <div ref={containerRef} className="word-frequency-cloud-canvas-wrap">
          {layout ? (
            <svg
              ref={svgRef}
              className="word-frequency-cloud-svg"
              viewBox={`0 0 ${layout.width} ${layout.height}`}
              role="img"
              data-layout-status={status}
              data-source-count={entries.length}
              data-frequency-total={entries.length}
              data-rendered-count={layout.words.length}
              data-post-scale={layout.postScale.toFixed(3)}
              data-cloud-style="wordclouds"
              data-area-alpha={alpha}
              aria-label={`${title}，“词云与月” WordClouds 风格，alpha=${alpha}，完整展示 ${entries.length} 项词频`}
            >
              <g fontFamily={FONT_FAMILY} textAnchor="middle" dominantBaseline="central">
                {layout.words.map((item) => (
                  <text
                    key={item.word}
                    x={item.x}
                    y={item.y}
                    fill={item.color}
                    fontSize={item.fontSize}
                    fontWeight={item.fontWeight}
                    transform={`rotate(${item.rotate} ${item.x} ${item.y})`}
                    data-word={item.word}
                    tabIndex={0}
                    onMouseEnter={() => setHoveredWord({ word: item.word, count: item.count })}
                    onMouseLeave={() => setHoveredWord(undefined)}
                    onFocus={() => setHoveredWord({ word: item.word, count: item.count })}
                    onBlur={() => setHoveredWord(undefined)}
                    onClick={() => setHoveredWord({ word: item.word, count: item.count })}
                  >
                    <title>{`${item.word} · ${item.count.toLocaleString('zh-CN')} 次`}</title>
                    {item.word}
                  </text>
                ))}
              </g>
            </svg>
          ) : (
            <div className="word-frequency-cloud-generating">正在生成全量“词云与月”…</div>
          )}
          <div className="word-frequency-cloud-status" aria-live="polite">
            <span>{statusText}</span>
            {hoveredWord && <strong>{hoveredWord.word} · {hoveredWord.count.toLocaleString('zh-CN')} 次</strong>}
          </div>
        </div>
      )}
    </section>
  );
}
