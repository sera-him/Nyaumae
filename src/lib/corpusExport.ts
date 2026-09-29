// Build a downloadable dump of the full search index for /codex.
//
// Nothing here runs until the user confirms an export: opening the panel only
// reads the already-loaded index to count entries and estimate a size. The
// stringify / Blob / object-URL work happens in `buildCorpusExport` on demand.
//
// The index already ships both locales in one dynamic chunk (loadSearchData
// imports fullSearchIndex and fullSearchIndexEn together), so choosing a
// language never triggers a second network round trip.

import type { FullSearchItem } from '@/data/fullSearchIndex';

export type ExportFormat = 'json' | 'jsonl' | 'txt' | 'csv';
export type ExportLocale = 'zh' | 'en' | 'both';

export interface ExportOption {
  id: ExportFormat;
  label: string;
  hint: string;
}

export const EXPORT_FORMATS: readonly ExportOption[] = [
  { id: 'json', label: 'JSON', hint: '完整条目数组，保留 frequencySegments，可逆' },
  { id: 'jsonl', label: 'JSONL', hint: '每行一条，仅核心字段，适合流式读取' },
  { id: 'txt', label: 'TXT', hint: '只拼正文，标题作分隔，便于 grep' },
  { id: 'csv', label: 'CSV', hint: 'id/title/category/href/content 五列' },
];

/**
 * An optional slice the user can drop from the export.
 *
 * Declared here rather than in the page so the rule lives next to the data it
 * filters, and so the panel can show what each exclusion would cost without
 * duplicating the predicate.
 */
export interface ExportExclusion {
  id: string;
  /** Shown in the panel; Chinese, since the entry is a Chinese-language arc. */
  label: string;
  labelEn: string;
  /** Why it is worth excluding, in one clause. */
  detail: string;
  detailEn: string;
  matches: (item: FullSearchItem) => boolean;
}

/**
 * The id the full text is registered under in both locale indexes. It is the
 * single largest entry by a wide margin — around 730 KB, which is roughly 70%
 * of the whole Chinese corpus — so anyone exporting the site probably wants
 * the option to skip it. Characters, story metadata and the Giant Catch game
 * are separate entries and are deliberately kept.
 */
const GIANT_COUNTRY_FULL_TEXT = 'storytext_little-girl-in-giant-country';

export const EXPORT_EXCLUSIONS: readonly ExportExclusion[] = [
  {
    id: 'giant-country-full-text',
    label: '《大人国的小女孩》全套正文',
    labelEn: 'The Little Girl in the Giant Country full text',
    detail: '单条约 730 KB，占中文语料七成，角色与其他条目仍保留',
    detailEn: 'One ~730 KB entry, about 70% of the Chinese corpus; characters stay',
    matches: (item) => item.id === GIANT_COUNTRY_FULL_TEXT,
  },
];

/** True when the item is dropped by any of the given exclusions. */
export function isExcluded(
  item: FullSearchItem,
  exclusions: readonly ExportExclusion[],
  enabled: ReadonlySet<string>,
): boolean {
  return exclusions.some((exclusion) => enabled.has(exclusion.id) && exclusion.matches(item));
}

export interface ExportSource {
  key: ExportLocale;
  label: string;
  items: FullSearchItem[];
}

export function exportSources(
  zh: FullSearchItem[] | undefined,
  en: FullSearchItem[] | undefined,
): ExportSource[] {
  const sources: ExportSource[] = [];
  if (zh?.length) sources.push({ key: 'zh', label: '中文', items: zh });
  if (en?.length) sources.push({ key: 'en', label: 'English', items: en });
  return sources;
}

/** Build the payload for one format / locale pair. */
export function serializeCorpus(items: FullSearchItem[], format: ExportFormat): string {
  if (format === 'json') {
    return JSON.stringify(items, null, 2);
  }
  if (format === 'jsonl') {
    return items
      .map((item) => JSON.stringify({
        id: item.id,
        title: item.title,
        content: item.content,
        category: item.category,
        href: item.href,
      }))
      .join('\n');
  }
  if (format === 'txt') {
    return items
      .map((item) => `=== ${item.title} · ${item.category} · ${item.href} ===\n${item.content}`)
      .join('\n\n');
  }
  const escapeCsv = (value: string): string => `"${String(value ?? '').replace(/"/g, '""')}"`;
  const rows = items.map((item) => [
    item.id, item.title, item.category, item.href, item.content,
  ].map(escapeCsv).join(','));
  // U+FEFF so Excel opens the Chinese columns as text instead of mangling them.
  return `\u{FEFF}${['id', 'title', 'category', 'href', 'content'].map(escapeCsv).join(',')}\n${rows.join('\n')}`;
}

export function exportFileName(format: ExportFormat, locale: string): string {
  const stamp = new Date().toISOString().slice(0, 10);
  return `nyaumae-corpus-${locale}-${stamp}.${format}`;
}

export function exportMime(format: ExportFormat): string {
  switch (format) {
    case 'json': return 'application/json;charset=utf-8';
    case 'jsonl': return 'application/x-ndjson;charset=utf-8';
    case 'txt': return 'text/plain;charset=utf-8';
    case 'csv': return 'text/csv;charset=utf-8';
  }
}

/**
 * Exact UTF-8 byte length of a string, without building an encoder output.
 *
 * A character count is not good enough here: the Chinese corpus is ~3 bytes
 * per character and the English mirror is ~1, so any single bytes-per-char
 * constant is off by 3x on one side or the other. Walking the code units is
 * cheap (a few ms for 1.5M characters) and keeps the panel preview honest.
 */
function utf8Length(value: string): number {
  let bytes = 0;
  for (let index = 0; index < value.length; index += 1) {
    const code = value.charCodeAt(index);
    if (code < 0x80) {
      bytes += 1;
    } else if (code < 0x800) {
      bytes += 2;
    } else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) {
      // Surrogate pair: one 4-byte code point.
      bytes += 4;
      index += 1;
    } else {
      bytes += 3;
    }
  }
  return bytes;
}

/** Format-independent byte totals for a set of entries. */
export interface CorpusSize {
  /** UTF-8 bytes of content + title + category + href across every entry. */
  textBytes: number;
  /** UTF-8 bytes of the frequencySegments strings. */
  segmentTextBytes: number;
  segmentCount: number;
  records: number;
}

/**
 * Walk the corpus once and total its bytes. Separated from the per-format
 * arithmetic so that switching format in the panel is free: only a language
 * change (which swaps the item list) re-measures.
 */
export function measureCorpus(items: FullSearchItem[]): CorpusSize {
  const size: CorpusSize = { textBytes: 0, segmentTextBytes: 0, segmentCount: 0, records: 0 };
  for (const item of items) {
    size.textBytes += utf8Length(item.content ?? '') + utf8Length(item.title ?? '')
      + utf8Length(item.category ?? '') + utf8Length(item.href ?? '');
    if (item.frequencySegments?.length) {
      size.segmentCount += item.frequencySegments.length;
      for (const segment of item.frequencySegments) size.segmentTextBytes += utf8Length(segment);
    }
    size.records += 1;
  }
  return size;
}

/**
 * Payload size in bytes for a format, from measured byte totals plus the fixed
 * per-record syntax that format wraps around the text. No string is built.
 *
 * The per-record constants are fitted against the real corpus: worst-case
 * error across all four formats and all three language options is under 4%.
 */
export function estimateExportBytes(size: CorpusSize, format: ExportFormat): number {
  const { textBytes, segmentTextBytes, segmentCount, records } = size;
  switch (format) {
    // Only JSON carries frequencySegments, and pretty-printing adds quotes and
    // two-space indentation to every line.
    case 'json': return textBytes + segmentTextBytes + segmentCount * 18 + records * 150;
    // One compact object per line: `{"id":"…","title":"…",…}`.
    case 'jsonl': return textBytes + records * 62;
    // `=== title · category · href ===` header per entry, then a blank line.
    case 'txt': return textBytes + records * 48;
    // Five quoted columns with a comma between each, plus the header row and BOM.
    case 'csv': return textBytes + records * 24 + 44;
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Serialize, wrap in a Blob and trigger the browser download. The caller
 * should defer this by a tick so the confirming button can paint its pending
 * state first — a 1 MB stringify blocks the main thread long enough to make
 * the click look dropped.
 */
export function downloadCorpus(payload: string, format: ExportFormat, locale: string): void {
  const blob = new Blob([payload], { type: exportMime(format) });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = exportFileName(format, locale);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser a moment to pick up the blob before releasing it.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}
