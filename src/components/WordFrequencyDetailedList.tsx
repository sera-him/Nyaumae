import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';

import { frequencyMeta, type WordFreqDetailed } from '@/data/wordFrequency';
import './WordFrequencyDetailedList.css';

// Windowed rendering: thousands of <tr> at once is the single heaviest paint
// on the data page. Only the rows intersecting the scroll viewport (plus a
// small overscan) are mounted; spacer rows keep the scrollbar geometry exact.
const ROW_HEIGHT = 46; // must match `tbody tr { height }` in the CSS
const OVERSCAN = 8;

type SortKey = 'word' | 'count' | 'docCount' | 'saturation' | 'density' | 'length' | 'type';

interface SortState {
  key: SortKey;
  dir: 'asc' | 'desc';
}

const DEFAULT_DIR: Record<SortKey, 'asc' | 'desc'> = {
  word: 'asc',
  length: 'asc',
  type: 'asc',
  count: 'desc',
  docCount: 'desc',
  saturation: 'desc',
  density: 'desc',
};

function getDefaultDir(key: SortKey): 'asc' | 'desc' {
  return DEFAULT_DIR[key];
}

interface Props {
  entries: WordFreqDetailed[];
  /** Total weighted word count used for the share column; defaults to the zh engine meta. */
  totalWords?: number;
}

function Arrow({ active, dir }: { active: boolean; dir: 'asc' | 'desc' }) {
  return (
    <span className={`sort-arrow ${active ? 'is-active' : ''}`} aria-hidden="true">{active ? (dir === 'asc' ? '↑' : '↓') : '↕'}</span>
  );
}

function Th({ k, label, title, sort, onSort }: { k: SortKey; label: string; title?: string; sort: SortState; onSort: (key: SortKey) => void }) {
  const active = sort.key === k;
  return (
    <th onClick={() => onSort(k)} title={title ?? label} aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}>
      <span className="th-inner">{label}<Arrow active={active} dir={sort.dir} /></span>
    </th>
  );
}

function WordFrequencyDetailedList({ entries, totalWords = frequencyMeta.totalWords }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortState>({ key: 'count', dir: 'desc' });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(720);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (el) setScrollTop(el.scrollTop);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight || 720));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleSort = (key: SortKey) => {
    setSort(prev => {
      if (prev.key === key) {
        return { key, dir: prev.dir === 'asc' ? 'desc' : 'asc' };
      }
      return { key, dir: getDefaultDir(key) };
    });
  };

  const filteredSorted = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('zh-CN');
    const list = q ? entries.filter(e => e.word.toLocaleLowerCase('zh-CN').includes(q)) : entries.slice();
    const { key, dir } = sort;
    const mul = dir === 'asc' ? 1 : -1;
    list.sort((a, b) => {
      let cmp = 0;
      switch (key) {
        case 'word': cmp = a.word.localeCompare(b.word, 'zh-CN'); break;
        case 'count': cmp = a.count - b.count; break;
        case 'docCount': cmp = a.docCount - b.docCount; break;
        case 'saturation': cmp = a.saturation - b.saturation; break;
        case 'density': cmp = a.density - b.density; break;
        case 'length': cmp = a.length - b.length; break;
        case 'type': cmp = (a.isCharacter ? 0 : 1) - (b.isCharacter ? 0 : 1); break;
      }
      if (cmp !== 0) return cmp * mul;
      // stable tie-breakers: count desc then word asc
      if (key !== 'count') {
        const c = b.count - a.count;
        if (c !== 0) return c;
      }
      return a.word.localeCompare(b.word, 'zh-CN');
    });
    return list;
  }, [entries, query, sort]);



  const maxCount = useMemo(() => Math.max(1, ...filteredSorted.map(e => e.count)), [filteredSorted]);
  const maxDocCount = useMemo(() => Math.max(1, ...filteredSorted.map(e => e.docCount)), [filteredSorted]);
  const maxSaturation = useMemo(() => Math.max(1, ...filteredSorted.map(e => e.saturation)), [filteredSorted]);
  const maxDensity = useMemo(() => Math.max(1e-6, ...filteredSorted.map(e => e.density)), [filteredSorted]);

  // Reset scroll position when the dataset identity changes (filter/sort),
  // otherwise the window math lands somewhere unexpected.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) {
      el.scrollTop = 0;
      setScrollTop(0);
    }
  }, [query, sort]);

  const rowCount = filteredSorted.length;
  const start = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const end = Math.min(rowCount, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + OVERSCAN);
  const visibleRows = useMemo(() => filteredSorted.slice(start, end), [filteredSorted, start, end]);

  const downloadCsv = () => {
    const header = '排名,词语,绝对声量Σ,声量占比%,广度N,广度率N%,饱和度Σln,密度Σw/T,长度,类型';
    const rows = filteredSorted.map((e, idx) => {
      const rate = (e.docRate * 100).toFixed(2);
      const countRate = totalWords ? ((e.count / totalWords) * 100).toFixed(2) : '0.00';
      return `${idx + 1},${JSON.stringify(e.word)},${e.count.toFixed(1)},${countRate}%,${e.docCount},${rate}%,${e.saturation.toFixed(2)},${e.density.toFixed(4)},${e.length},${e.isCharacter ? '角色' : '普通'}`;
    });
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'word-frequency-detailed.csv';
    link.href = URL.createObjectURL(blob);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  };

  return (
    <section className="word-frequency-detailed" aria-labelledby="word-frequency-detailed-title">
      <div className="word-frequency-detailed-heading">
        <div>
          <h4 id="word-frequency-detailed-title">{L("详细词频列表")}</h4>
          <p>{L("每行展示多维指标，支持按列排序（默认：数值倒序 / 文字正序）")}</p>
        </div>
        <button type="button" className="word-frequency-download" onClick={downloadCsv}>{L("下载 CSV")}</button>
      </div>
      <div className="word-frequency-detailed-tools">
        <label>
          <span>{L("筛选词语")}</span>
          <input type="search" value={query} onChange={e => { setQuery(e.target.value); }} placeholder={L("输入词语…")} aria-label={L("筛选详细词频")} />
        </label>
        <span className="word-frequency-detailed-total">{rowCount.toLocaleString('zh-CN')} {L("项 · 虚拟滚动")}</span>
      </div>
      <div className="word-frequency-detailed-scroll" ref={scrollRef} onScroll={handleScroll}>
        <table data-frequency-detailed="true">
          <thead>
            <tr>
              <th className="col-rank">{L("排名")}</th>
              <Th k="word" label="词语" sort={sort} onSort={handleSort} />
              <Th k="count" label="绝对声量 Σ" title={L("Σw_i，大人国 0.1x 加权，灰字为占比")} sort={sort} onSort={handleSort} />
              <Th k="docCount" label="广度 N" title={L("N=文档数，原值不加权，灰字为N%")} sort={sort} onSort={handleSort} />
              <Th k="saturation" label="饱和度 Σln" title={L("Σ ln(w_i+1)，w_i为该词在单篇出现次数（原值）")} sort={sort} onSort={handleSort} />
              <Th k="density" label="密度 Σw/T" title={L("Σ w_i/TotalWords_i，原值")} sort={sort} onSort={handleSort} />
              <Th k="length" label="长度" title={L("字节数（汉字=2，ASCII=1）")} sort={sort} onSort={handleSort} />
              <Th k="type" label="类型" sort={sort} onSort={handleSort} />
            </tr>
          </thead>
          <tbody>
            {start > 0 && (
              <tr className="virtual-spacer" aria-hidden="true" style={{ height: start * ROW_HEIGHT }}>
                <td colSpan={8} />
              </tr>
            )}
            {visibleRows.map((e, offset) => {
              const idx = start + offset;
              const countRate = totalWords ? (e.count / totalWords) * 100 : 0;
              const docRate = e.docRate * 100;
              const countAlpha = e.count / maxCount;
              const docAlpha = e.docCount / maxDocCount;
              const satAlpha = e.saturation / maxSaturation;
              const denAlpha = e.density / maxDensity;
              const countColor = `rgba(56,189,248,${0.72 + countAlpha * 0.28})`;
              const docColor = `rgba(129,140,248,${0.72 + docAlpha * 0.28})`;
              const satColor = `rgba(52,211,153,${0.72 + satAlpha * 0.28})`;
              const denColor = `rgba(251,146,60,${0.72 + denAlpha * 0.28})`;
              return (
                <tr key={e.word}>
                  <td className="col-rank">{idx + 1}</td>
                  <td className="col-word">{e.word}</td>
                  <td className="num has-sub">
                    <span className="cell-main" style={{ color: countColor }}>{Number.isInteger(e.count) ? e.count.toLocaleString('zh-CN') : e.count.toFixed(1)}</span>
                    <span className="cell-sub">{countRate.toFixed(2)}%</span>
                  </td>
                  <td className="num has-sub">
                    <span className="cell-main" style={{ color: docColor }}>{e.docCount}</span>
                    <span className="cell-sub">{docRate.toFixed(2)}%</span>
                  </td>
                  <td className="num" style={{ color: satColor }}>{e.saturation.toFixed(2)}</td>
                  <td className="num" style={{ color: denColor }}>{e.density.toFixed(4)}</td>
                  <td className="num">{e.length}</td>
                  <td>{e.isCharacter ? '角色' : '普通'}</td>
                </tr>
              );
            })}
            {end < rowCount && (
              <tr className="virtual-spacer" aria-hidden="true" style={{ height: (rowCount - end) * ROW_HEIGHT }}>
                <td colSpan={8} />
              </tr>
            )}
          </tbody>
        </table>
        {rowCount === 0 && <p className="word-frequency-detailed-empty">{L("没有匹配的词语。")}</p>}
      </div>
    </section>
  );
}

export default memo(WordFrequencyDetailedList);
