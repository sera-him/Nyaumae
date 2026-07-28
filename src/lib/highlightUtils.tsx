// Global text colorization utilities for Neural Connection
// Ensures ALL chess piece names/letters use tier colors, and general text is semantically colored
import React from 'react';

// ===== CHESS PIECE TIER COLOR MAP =====
// Maps every piece letter (upper/lower), Chinese name, and code to its tier color
// Tiers are defined in chessPieceTiers (fragments.ts):
//   钻石(yellow-300): S, U, G*, K   (*猫娘保留独特粉色)
//   辉金(amber-300):  M
//   金色(yellow-400): Q, H, O
//   紫色(purple-400): R, C, J
//   蓝色(blue-400):   N, Y, L, B, A, W, IW
//   绿色(green-400):  T, E
//   白色(gray-300):   P, Z, IZ, X
export const pieceTierColorMap: Record<string, string> = {
  // 钻石 tier (yellow-300)
  'K': 'text-yellow-300', 'k': 'text-yellow-300',
  'S': 'text-yellow-300', 's': 'text-yellow-300',
  'U': 'text-yellow-300', 'u': 'text-yellow-300',
  '王': 'text-yellow-300',
  '星舰': 'text-yellow-300',
  '太空人': 'text-yellow-300',
  // 辉金 tier (amber-300)
  'M': 'text-amber-300', 'm': 'text-amber-300',
  '老鼠': 'text-amber-300',
  // 金色 tier (yellow-400)
  'Q': 'text-yellow-400', 'q': 'text-yellow-400',
  'H': 'text-yellow-400', 'h': 'text-yellow-400',
  'O': 'text-yellow-400', 'o': 'text-yellow-400',
  '后': 'text-yellow-400',
  '巨鲸': 'text-yellow-400',
  '鸵鸟': 'text-yellow-400',
  // 紫色 tier (purple-400)
  'R': 'text-purple-400', 'r': 'text-purple-400',
  'C': 'text-purple-400', 'c': 'text-purple-400',
  'J': 'text-purple-400', 'j': 'text-purple-400',
  '车': 'text-purple-400',
  '大炮': 'text-purple-400',
  '圣骑士': 'text-purple-400',
  // 蓝色 tier (blue-400)
  'N': 'text-blue-400', 'n': 'text-blue-400',
  'Y': 'text-blue-400', 'y': 'text-blue-400',
  'L': 'text-blue-400', 'l': 'text-blue-400',
  'B': 'text-blue-400', 'b': 'text-blue-400',
  'A': 'text-blue-400', 'a': 'text-blue-400',
  'W': 'text-blue-400', 'w': 'text-blue-400',
  'IW': 'text-blue-400', 'iw': 'text-blue-400', 'Iw': 'text-blue-400', 'iW': 'text-blue-400',
  '马': 'text-blue-400',
  '缅因猫': 'text-blue-400',
  '英语': 'text-blue-400',
  '教': 'text-blue-400',
  '天线': 'text-blue-400',
  '女巫': 'text-blue-400',
  '反女巫': 'text-blue-400',
  // 绿色 tier (green-400)
  'T': 'text-green-400', 't': 'text-green-400',
  'E': 'text-green-400', 'e': 'text-green-400',
  '猫': 'text-green-400',
  '象': 'text-green-400',
  // 白色 tier (gray-300)
  'P': 'text-gray-300', 'p': 'text-gray-300',
  'Z': 'text-gray-300', 'z': 'text-gray-300',
  'IZ': 'text-gray-300', 'Iz': 'text-gray-300', 'iZ': 'text-gray-300', 'iz': 'text-gray-300',
  'X': 'text-gray-300', 'x': 'text-gray-300',
  '兵': 'text-gray-300',
  '骷髅兵': 'text-gray-300',
  '反骷髅兵': 'text-gray-300',
  '火箭': 'text-gray-300',
  // 猫娘保留独特粉色（可爱优先）
  'G': 'text-fuchsia-400', 'g': 'text-fuchsia-400',
  '猫娘': 'text-fuchsia-400',
};

// All searchable piece names, sorted longest-first for greedy matching
const PIECE_NAMES = Object.keys(pieceTierColorMap).filter(k => /[\u4e00-\u9fff]/.test(k));
PIECE_NAMES.sort((a, b) => b.length - a.length);

// Single letters that are piece codes (exclude common words)
const PIECE_LETTERS = Object.keys(pieceTierColorMap).filter(
  k => /^[a-zA-Z]$/.test(k) && !['a', 'A', 'i', 'I'].includes(k)
);

// Two-letter codes
const PIECE_CODES = Object.keys(pieceTierColorMap).filter(k => /^[a-zA-Z]{2}$/.test(k));

// ===== CORE: colorizePieces =====
// Scans ANY text and colors ALL piece names/letters with their tier colors
export function colorizePieces(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // 1. Try 2-letter codes first (IW, IZ)
    const two = text.substring(i, i + 2);
    if (PIECE_CODES.includes(two)) {
      const color = pieceTierColorMap[two];
      parts.push(
        <span key={key++} className={`${color} font-bold`}>{two}</span>
      );
      i += 2;
      continue;
    }

    // 2. Try Chinese piece names (longest first)
    for (const name of PIECE_NAMES) {
      if (text.substring(i, i + name.length) === name) {
        const color = pieceTierColorMap[name];
        parts.push(
          <span key={key++} className={`${color} font-medium`}>{name}</span>
        );
        i += name.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 3. Try single letters
    const one = text[i];
    if (PIECE_LETTERS.includes(one)) {
      const color = pieceTierColorMap[one];
      parts.push(
        <span key={key++} className={`${color} font-bold`}>{one}</span>
      );
      i += 1;
      continue;
    }

    // 4. Numbers (with optional units) → gold
    if (/\d/.test(one)) {
      let numStr = one;
      let j = i + 1;
      while (j < text.length && (/[\d.%°²³₀₁₂₃₄₅₆₇₈₉]/.test(text[j]) || /[格回合次级枚个条]+/.test(text[j]))) {
        numStr += text[j];
        j++;
      }
      parts.push(<span key={key++} className="text-nc-gold font-medium">{numStr}</span>);
      i = j;
      continue;
    }

    // 5. Default: push plain char
    parts.push(one);
    i += 1;
  }

  return parts;
}

// ===== colorizePiecesMultiline =====
// Handles text with newlines (preserves line breaks)
export function colorizePiecesMultiline(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  lines.forEach((line, idx) => {
    if (idx > 0) result.push(<br key={`br-${key++}`} />);
    result.push(
      <span key={`line-${key++}`}>{colorizePieces(line)}</span>
    );
  });

  return result;
}

// ===== SEMANTIC COLOR MAPS =====

// Cheese colors
const CHEESE_NAMES: Record<string, string> = {
  '黄奶酪': 'text-amber-400',
  '橙奶酪': 'text-orange-400',
  '蓝奶酪': 'text-blue-400',
  '紫奶酪': 'text-purple-400',
  '黑奶酪': 'text-gray-400',
};
const CHEESE_CODES: Record<string, string> = {
  'CY': 'text-amber-400',
  'CO': 'text-orange-400',
  'CB': 'text-blue-400',
  'CP': 'text-purple-400',
  'CK': 'text-gray-400',
};

// ===== FULL COLORIZE: pieces + semantics =====
export function fullColorize(text: string): React.ReactNode[] {
  if (!text) return [];
  const parts: React.ReactNode[] = [];
  let key = 0;
  let i = 0;

  while (i < text.length) {
    let matched = false;

    // 1. Chess piece names (Chinese, longest first)
    for (const name of PIECE_NAMES) {
      if (text.substring(i, i + name.length) === name) {
        const color = pieceTierColorMap[name];
        parts.push(<span key={key++} className={`${color} font-medium`}>{name}</span>);
        i += name.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 2. Two-letter codes (IW, IZ)
    const two = text.substring(i, i + 2);
    if (PIECE_CODES.includes(two)) {
      parts.push(<span key={key++} className={`${pieceTierColorMap[two]} font-bold`}>{two}</span>);
      i += 2;
      continue;
    }

    // 3. Single letters
    const one = text[i];
    if (PIECE_LETTERS.includes(one)) {
      parts.push(<span key={key++} className={`${pieceTierColorMap[one]} font-bold`}>{one}</span>);
      i += 1;
      continue;
    }

    // 4. Cheese names
    for (const [cheese, color] of Object.entries(CHEESE_NAMES)) {
      if (text.substring(i, i + cheese.length) === cheese) {
        parts.push(<span key={key++} className={`${color} font-medium`}>{cheese}</span>);
        i += cheese.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 5. Cheese codes
    for (const [code, color] of Object.entries(CHEESE_CODES)) {
      if (text.substring(i, i + code.length) === code) {
        parts.push(<span key={key++} className={`${color} font-bold`}>{code}</span>);
        i += code.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;

    // 6. Numbers (with units) → gold
    if (/\d/.test(one)) {
      let numStr = one;
      let j = i + 1;
      while (j < text.length && (/[\d.%°²³₀₁₂₃₄₅₆₇₈₉]/.test(text[j]) || /[格回合次级枚个条次]+/.test(text[j]))) {
        numStr += text[j];
        j++;
      }
      parts.push(<span key={key++} className="text-nc-gold font-medium">{numStr}</span>);
      i = j;
      continue;
    }

    // 7. Math symbols
    const mathSymbols: Record<string, string> = {
      '∫': 'text-nc-cyan', '₀': 'text-nc-gold', '₁': 'text-nc-gold', '₂': 'text-nc-gold',
      '₃': 'text-nc-gold', '₄': 'text-nc-gold', '₅': 'text-nc-gold', '⌊': 'text-nc-gold',
      '⌋': 'text-nc-gold', 'Γ': 'text-nc-gold', 'γ': 'text-nc-gold', '∞': 'text-nc-gold',
      '∧': 'text-nc-violet', '∨': 'text-nc-violet', '×': 'text-nc-gold', '÷': 'text-nc-gold',
      '√': 'text-nc-gold', '±': 'text-nc-gold', '≤': 'text-nc-gold', '≥': 'text-nc-gold',
      '≠': 'text-nc-gold', '≈': 'text-nc-gold', 'π': 'text-nc-gold', 'μ': 'text-nc-gold',
      'σ': 'text-nc-gold', 'δ': 'text-nc-gold', 'Σ': 'text-nc-gold', '∂': 'text-nc-gold',
      '→': 'text-nc-text-secondary', '←': 'text-nc-text-secondary', '↑': 'text-nc-text-secondary', '↓': 'text-nc-text-secondary',
    };
    if (mathSymbols[one]) {
      parts.push(<span key={key++} className={`${mathSymbols[one]} font-medium`}>{one}</span>);
      i += 1;
      continue;
    }

    // 8. Default
    parts.push(one);
    i += 1;
  }

  return parts;
}

// ===== MULTILINE FULL COLORIZE =====
export function fullColorizeMultiline(text: string): React.ReactNode[] {
  if (!text) return [];
  const lines = text.split('\n');
  const result: React.ReactNode[] = [];
  let key = 0;

  lines.forEach((line, idx) => {
    if (idx > 0) result.push(<br key={`br-${key++}`} />);
    result.push(<span key={`line-${key++}`}>{fullColorize(line)}</span>);
  });

  return result;
}
