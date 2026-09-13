// Runtime page translator: swaps rendered zh-CN surface copy for English
// without touching React state, so the whole site (routes, dialogs, lazily
// mounted sections) becomes translatable without rewriting every component.
//
// Every replaced node keeps its original value in a WeakMap, so switching back
// to zh-CN restores the exact source text instead of a lossy round-trip.
import { EXACT_TRANSLATIONS, PHRASE_TRANSLATIONS } from './dictionary';
import { applyTranslationRules } from './entries/rules';

const EXACT = new Map(Object.entries(EXACT_TRANSLATIONS));
const CJK = /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/;
const SKIP_ANCESTOR_SELECTOR = 'script, style, noscript, code, pre, textarea, svg, canvas, iframe, [data-no-translate]';
const TRANSLATED_ATTRS = ['placeholder', 'title', 'aria-label'] as const;
const FULL_SCAN_THRESHOLD = 400;
const FLUSH_DELAY_MS = 80;
// React can re-render a node back to its source text after our mutation has
// already been applied (animation state, polling panels, lazy chunks). A slow
// full reconciliation sweep keeps the translated view stable without relying
// on catching every mutation in the right order.
const RECONCILE_INTERVAL_MS = 1500;

interface TextRecord {
  source: string;
  output: string;
}

const textRecords = new WeakMap<Text, TextRecord>();
const attrRecords = new WeakMap<Element, Record<string, string>>();

// zh-CN is the authored language, so the default experience must be a perfect
// no-op: until something has actually been translated there is nothing to
// restore, and the restore pass is skipped entirely (not even a DOM read).
let touchedAnything = false;
let titleRecord: string | null = null;

function translateDocumentTitle(enabled: boolean): void {
  if (typeof document === 'undefined') return;
  if (enabled) {
    const current = document.title;
    if (!current || titleRecord !== null) return;
    const output = translate(current);
    if (output === current) return;
    titleRecord = current;
    document.title = output;
    return;
  }
  if (titleRecord !== null) {
    document.title = titleRecord;
    titleRecord = null;
  }
}

function translate(input: string): string {
  const trimmed = input.trim();
  // A single glyph is never a UI label we want to swap: inside animated or
  // split-rendered prose it would corrupt the sentence ("天" → "days").
  if (trimmed.length < 2 || !CJK.test(trimmed)) return input;

  const exact = EXACT.get(trimmed);
  if (exact) return input.replace(trimmed, () => exact);

  const ruled = applyTranslationRules(input);
  if (ruled !== null) return ruled;

  let output = input;
  for (const [from, to] of PHRASE_TRANSLATIONS) {
    if (output.includes(from)) output = output.split(from).join(to);
  }
  return output;
}

function isSkipped(node: Node | null): boolean {
  const parent = node?.parentElement;
  if (!parent) return true;
  // Prose lives inside these wrappers (story readers, poem cards, code blocks).
  // Checking the whole ancestor chain keeps emphasised words inside a sentence
  // from being swapped for their UI translation.
  if (parent.closest(SKIP_ANCESTOR_SELECTOR)) return true;
  if (parent.isContentEditable) return true;
  if (parent.closest('[data-no-translate]')) return true;
  return false;
}

// Several sections render copy character by character (animated headings, poem
// and story readers, board grids). Those single-glyph nodes must never be
// translated word-by-word, otherwise a stray "天" or "红" inside a sentence
// turns into "days" / "Red". Detect the container once and skip its whole
// subtree for the rest of the session.
const splitContexts = new WeakMap<Element, boolean>();

function isSingleGlyph(value: string): boolean {
  const text = value.trim();
  return text.length === 1 && CJK.test(text);
}

function isSplitTextContainer(element: Element): boolean {
  const cached = splitContexts.get(element);
  if (cached !== undefined) return cached;

  const children = element.childNodes;
  let textNodes = 0;
  let singleGlyphTexts = 0;
  let elementNodes = 0;
  let singleGlyphElements = 0;

  for (const child of children) {
    if (child.nodeType === Node.TEXT_NODE) {
      textNodes += 1;
      if (isSingleGlyph(child.nodeValue ?? '')) singleGlyphTexts += 1;
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      elementNodes += 1;
      // Nested wrappers are common (span > span > glyph), so judge by the
      // element's whole text content instead of its direct children.
      if (isSingleGlyph((child as Element).textContent ?? '')) singleGlyphElements += 1;
    }
  }

  const splitByText = textNodes >= 5 && singleGlyphTexts >= textNodes - 1;
  const splitByElements = elementNodes >= 5 && singleGlyphElements >= elementNodes - 1 && textNodes === 0;
  const result = splitByText || splitByElements;

  splitContexts.set(element, result);
  return result;
}

function isSplitTextNode(node: Text): boolean {
  const parent = node.parentElement;
  if (!parent) return false;
  if (isSplitTextContainer(parent)) return true;
  const grandparent = parent.parentElement;
  return Boolean(grandparent && isSplitTextContainer(grandparent));
}

function processText(node: Text, enabled: boolean): void {
  const current = node.nodeValue ?? '';
  const record = textRecords.get(node);

  if (enabled) {
    if (record && record.output === current) return;
    if (isSkipped(node) || !CJK.test(current)) return;
    if (isSplitTextNode(node)) return;
    const output = translate(current);
    textRecords.set(node, { source: current, output });
    if (output !== current) {
      node.nodeValue = output;
      touchedAnything = true;
    }
    return;
  }

  // Restoring: only rewrite nodes we previously translated, and only when the
  // current value is still our output (React may have replaced it since).
  if (record && record.output === current && record.source !== current) {
    node.nodeValue = record.source;
    textRecords.delete(node);
  }
}

function processAttributes(element: Element, enabled: boolean): void {
  if (isSkipped(element)) return;
  const store = attrRecords.get(element) ?? {};

  for (const attr of TRANSLATED_ATTRS) {
    if (!element.hasAttribute(attr)) continue;
    const current = element.getAttribute(attr) ?? '';

    if (enabled) {
      const original = store[attr];
      // Already translated: keep it unless React rewrote the attribute back
      // to its source value, in which case translate it again.
      if (original !== undefined && current !== original) continue;
      if (!CJK.test(current)) continue;
      const output = translate(current);
      if (original === undefined) {
        store[attr] = current;
        attrRecords.set(element, store);
      }
      if (output !== current) {
        element.setAttribute(attr, output);
        touchedAnything = true;
      }
    } else if (store[attr] !== undefined) {
      element.setAttribute(attr, store[attr]);
      delete store[attr];
    }
  }
}

function collect(root: Node): { texts: Text[]; elements: Element[] } {
  const texts: Text[] = [];
  const elements: Element[] = [];

  if (root.nodeType === Node.TEXT_NODE) {
    texts.push(root as Text);
    return { texts, elements };
  }
  if (!(root instanceof Element)) return { texts, elements };

  elements.push(root);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let node = walker.nextNode();
  while (node) {
    if (node.nodeType === Node.TEXT_NODE) texts.push(node as Text);
    else elements.push(node as Element);
    node = walker.nextNode();
  }
  return { texts, elements };
}

function applyTo(root: Node, enabled: boolean): void {
  const { texts, elements } = collect(root);
  for (const element of elements) processAttributes(element, enabled);
  for (const text of texts) processText(text, enabled);
}

/**
 * Enables (or restores) the English surface copy. Returns a disposer that
 * puts every translated node back to its original zh-CN value.
 */
export function startPageTranslation(enabled: boolean): () => void {
  if (typeof document === 'undefined') return () => {};

  const root = document.body;

  // zh-CN is the authored language: if nothing was ever swapped there is
  // nothing to restore, so the default experience performs zero DOM writes.
  if (!enabled) {
    if (touchedAnything) {
      applyTo(root, false);
      translateDocumentTitle(false);
      touchedAnything = false;
    }
    return () => {};
  }

  let disposed = false;
  let timer: number | null = null;
  let reconcileTimer: number | null = null;
  const dirty = new Set<Node>();

  const flush = () => {
    timer = null;
    if (disposed || !root) return;

    const targets = [...dirty];
    dirty.clear();
    observer.disconnect();

    try {
      if (targets.length > FULL_SCAN_THRESHOLD || targets.length === 0) {
        applyTo(root, enabled);
      } else {
        for (const target of targets) {
          if (target.isConnected) applyTo(target, enabled);
        }
      }
    } finally {
      if (!disposed) observe();
    }
  };

  const schedule = () => {
    if (timer !== null || disposed) return;
    timer = window.setTimeout(flush, FLUSH_DELAY_MS);
  };

  const observer = new MutationObserver((records) => {
    for (const record of records) {
      if (record.type === 'characterData' || record.type === 'attributes') {
        dirty.add(record.target);
      } else {
        record.addedNodes.forEach((node) => dirty.add(node));
        record.removedNodes.forEach((node) => dirty.delete(node));
      }
    }
    schedule();
  });

  const observe = () => {
    observer.observe(root, {
      subtree: true,
      childList: true,
      characterData: true,
      attributes: true,
      attributeFilter: [...TRANSLATED_ATTRS],
    });
  };

  applyTo(root, enabled);
  translateDocumentTitle(true);
  observe();
  reconcileTimer = window.setInterval(() => {
    if (disposed || document.visibilityState !== 'visible') return;
    observer.disconnect();
    try {
      applyTo(root, true);
    } finally {
      if (!disposed) observe();
    }
  }, RECONCILE_INTERVAL_MS);

  return () => {
    disposed = true;
    if (timer !== null) {
      window.clearTimeout(timer);
      timer = null;
    }
    if (reconcileTimer !== null) {
      window.clearInterval(reconcileTimer);
      reconcileTimer = null;
    }
    observer.disconnect();
    dirty.clear();
    applyTo(root, false);
    translateDocumentTitle(false);
    touchedAnything = false;
  };
}
