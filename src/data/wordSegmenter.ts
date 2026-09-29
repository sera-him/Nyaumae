// Self-contained tokenizer for the word-frequency engine.
//
// This replaces Intl.Segmenter, whose Chinese segmentation differs slightly
// between Chrome, Node and other engines and made the published counts drift
// (measured: 24 occurrences / 9 words out of 37.8k). Nothing here reads a
// host locale table, so the same input always yields the same tokens.
//
// Han runs are split by a dynamic program over the frozen lexicon in
// ./segmenterLexicon. The objective is, in order: match as many dictionary
// words as possible, then cover as many characters as possible, then prefer
// the longer word at the earliest position. That total order keeps the result
// independent of the host.
//
// Word count leads because the lexicon only contains entries that passed a
// cohesion and branching-entropy test, so a real word is always worth more
// than the pair of junk bigrams that would cover the same span. Maximising
// coverage first would prefer junk instead: given 老师|有小|本子|叫页 that
// split tiles all eight characters, while 老师|本子|页表 leaves 有, 叫 and 表
// unmatched and would lose. Characters the lexicon has never seen are paired
// off in fixed two-character units so freshly coined terms still register;
// single stray characters are left for isUsefulWord to drop.
//
// Non-Han runs use plain character classes, and interior `+ # . - /` count as
// term connectors so notation like `U+1F9D1`, `SdN+` and `bice-om` stays in one
// piece, matching what the old Intl-based merge step produced.

import { HAN_LEXICON_MAX, isKnownHanWord } from './segmenterLexicon';

const HAN = /\p{Script=Han}/u;
const LETTER_OR_DIGIT = /[\p{L}\p{N}]/u;
const TERM_CONNECTOR = /[+#./-]/u;

function isBaseChar(char: string): boolean {
  return LETTER_OR_DIGIT.test(char) && !HAN.test(char);
}

function readBase(text: string, from: number): number {
  let end = from;
  while (end < text.length && isBaseChar(text[end])) end += 1;
  return end;
}

interface RunSegment {
  text: string;
  /** False when the segment was produced by the unknown-text fallback. */
  known: boolean;
}

function segmentHanRun(run: string, out: RunSegment[]): void {
  const n = run.length;
  // bestWords[i] / bestCovered[i] describe the best split of run.slice(i).
  const bestWords = new Array<number>(n + 1).fill(0);
  const bestCovered = new Array<number>(n + 1).fill(0);
  // choice[i] is the length matched at i, or 0 to skip a character.
  const choice = new Array<number>(n + 1).fill(0);

  for (let i = n - 1; i >= 0; i -= 1) {
    // Option A: skip one character — free, but contributes no coverage.
    let words = bestWords[i + 1];
    let covered = bestCovered[i + 1];
    let length = 0;

    // Option B: take a lexicon word. Word count dominates, because a real word
    // is worth more than junk bigrams covering the same span; coverage breaks
    // ties in favour of the longer match.
    const longest = Math.min(HAN_LEXICON_MAX, n - i);
    for (let size = longest; size >= 2; size -= 1) {
      if (!isKnownHanWord(run.slice(i, i + size))) continue;
      const wordsHere = 1 + bestWords[i + size];
      const coveredHere = size + bestCovered[i + size];
      if (wordsHere > words || (wordsHere === words && coveredHere > covered)) {
        words = wordsHere;
        covered = coveredHere;
        length = size;
      }
    }

    bestWords[i] = words;
    bestCovered[i] = covered;
    choice[i] = length;
  }

  // Walk the chosen split forward. Characters the lexicon never saw are emitted
  // as single-character segments and then dropped by isUsefulWord, which is what
  // the old Intl path did with unknown words. Pairing them up instead is worse:
  // an unmatched character wedged between two matches (the 有 in 老师|本子) would
  // drag a real character out of the neighbouring word and invent 有小.
  let index = 0;
  while (index < n) {
    const size = choice[index];
    if (size > 0) {
      out.push({ text: run.slice(index, index + size), known: true });
      index += size;
    } else {
      out.push({ text: run[index], known: false });
      index += 1;
    }
  }
}

/**
 * Split text into candidate word tokens. Punctuation, whitespace, symbols and
 * emoji are separators. Han and non-Han runs are scanned independently so mixed
 * text like `咪呀page table` yields `咪呀` then `page` then `table`.
 */
export function tokenizeForFrequency(text: string): string[] {
  const tokens: string[] = [];
  const length = text.length;
  let index = 0;

  while (index < length) {
    const char = text[index];

    if (HAN.test(char)) {
      let end = index;
      while (end < length && HAN.test(text[end])) end += 1;
      const run: RunSegment[] = [];
      segmentHanRun(text.slice(index, end), run);
      for (const piece of run) tokens.push(piece.text);
      index = end;
      continue;
    }

    if (isBaseChar(char)) {
      const start = index;
      let tokenEnd = readBase(text, index);
      // Absorb connectors, then more base runs: `1/4+1`, `U+1F9D1`, `bice-om`.
      for (;;) {
        const connectorAt = tokenEnd;
        if (connectorAt >= length) break;
        if (text[connectorAt] === '+') {
          // Either a trailing morpheme marker (`SdN+`) or a connector (`U+1F9D1`).
          const next = readBase(text, connectorAt + 1);
          if (next > connectorAt + 1) { tokenEnd = next; continue; }
          tokenEnd = connectorAt + 1;
          break;
        }
        if (!TERM_CONNECTOR.test(text[connectorAt])) break;
        const next = readBase(text, connectorAt + 1);
        if (next <= connectorAt + 1) break;
        tokenEnd = next;
      }
      tokens.push(text.slice(start, tokenEnd));
      index = tokenEnd;
      continue;
    }

    index += 1;
  }

  return tokens;
}

/**
 * Reduced mode used only if the lexicon ever ships empty. Keeps every Han run of
 * two or more characters and every Latin/number run whole — cruder than
 * {@link tokenizeForFrequency}, but still fully deterministic.
 */
export function tokenizeWithoutLexicon(text: string): string[] {
  return (text.match(/[\p{Script=Han}]{2,}|[\p{L}][\p{L}\p{N}+]*/gu) ?? []).filter(Boolean);
}
