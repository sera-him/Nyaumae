import { memo, useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { getWordDocumentCount, type WordFreq } from '@/data/wordFrequency';
import './WordFrequencyTable.css';

// Progressive rendering: thousands of dense cells stall the first paint.
const PAGE_ROWS = 200;
const PAGE_STEP = 500;

interface WordFrequencyTableProps {
  entries: WordFreq[];
}

type SortMode = 'count' | 'docs' | 'word';

interface FrequencyRow {
  entry: WordFreq;
  index: number;
}

function WordFrequencyTable({ entries }: WordFrequencyTableProps) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count');
  const [packColumns, setPackColumns] = useState(18);
  const [rowLimit, setRowLimit] = useState(PAGE_ROWS);

  useEffect(() => {
    const updatePackColumns = () => {
      const width = window.innerWidth;
      setPackColumns(
        width >= 1200 ? 18
          : width >= 840 ? 16
            : width >= 680 ? 13
              : width >= 520 ? 10
                : width >= 380 ? 7
                  : 5,
      );
    };
    updatePackColumns();
    window.addEventListener('resize', updatePackColumns);
    return () => window.removeEventListener('resize', updatePackColumns);
  }, []);

  const filteredEntries = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('zh-CN');
    return entries
      .filter((entry) => !normalizedQuery || entry.word.toLocaleLowerCase('zh-CN').includes(normalizedQuery))
      .map((entry, index) => ({ ...entry, sourceIndex: index }))
      .sort((a, b) => {
        if (sortMode === 'count') return b.count - a.count || a.word.localeCompare(b.word, 'zh-CN');
        if (sortMode === 'docs') {
          const aDocs = getWordDocumentCount(a.word);
          const bDocs = getWordDocumentCount(b.word);
          return bDocs - aDocs || b.count - a.count || a.word.localeCompare(b.word, 'zh-CN');
        }
        return a.word.localeCompare(b.word, 'zh-CN') || b.count - a.count;
      });
  }, [entries, query, sortMode]);

  const packedRows = useMemo(() => {
    const rows: FrequencyRow[][] = [];
    for (let index = 0; index < filteredEntries.length; index += packColumns) {
      rows.push(filteredEntries.slice(index, index + packColumns).map((entry, columnIndex) => ({
        entry,
        index: index + columnIndex + 1,
      })));
    }
    return rows;
  }, [filteredEntries, packColumns]);

  const visibleRows = useMemo(() => packedRows.slice(0, rowLimit), [packedRows, rowLimit]);
  const hiddenRows = packedRows.length - visibleRows.length;
  const hiddenEntries = Math.max(0, filteredEntries.length - visibleRows.length * packColumns);

  const downloadCsv = () => {
    const csv = ['词语,出现次数,文档数', ...filteredEntries.map((entry) => `${JSON.stringify(entry.word)},${entry.count.toFixed(1)},${getWordDocumentCount(entry.word)}`)].join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8' });
    const link = document.createElement('a');
    link.download = 'word-frequency.csv';
    link.href = URL.createObjectURL(blob);
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(link.href), 1_000);
  };

  return (
    <section className="word-frequency-table" aria-labelledby="word-frequency-table-title">
      <div className="word-frequency-table-heading">
        <div>
          <h4 id="word-frequency-table-title">完整词频明细</h4>
          <p>云图是概览；这里保留每一个词语和它的实际出现次数。</p>
        </div>
        <button type="button" className="word-frequency-download" onClick={downloadCsv}>
          下载 CSV
        </button>
      </div>
      <div className="word-frequency-table-tools">
        <label>
          <span>筛选词语</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="输入词语…"
            aria-label="筛选词频明细"
          />
        </label>
        <div className="word-frequency-sort" role="group" aria-label="词频排序方式">
          <button type="button" className={sortMode === 'count' ? 'is-active' : ''} onClick={() => setSortMode('count')}>按频次</button>
          <button type="button" className={sortMode === 'docs' ? 'is-active' : ''} onClick={() => setSortMode('docs')}>按篇数</button>
          <button type="button" className={sortMode === 'word' ? 'is-active' : ''} onClick={() => setSortMode('word')}>按词语</button>
        </div>
        <span className="word-frequency-table-total">显示 {filteredEntries.length.toLocaleString('zh-CN')} / {entries.length.toLocaleString('zh-CN')} 项</span>
      </div>
      <div className="word-frequency-table-scroll">
        <table
          data-frequency-table="all-entries"
          data-frequency-entry-count={filteredEntries.length}
          data-frequency-columns={packColumns}
          data-frequency-row-count={packedRows.length}
          style={{ '--frequency-columns': packColumns } as CSSProperties}
        >
          <caption>全部 {entries.length.toLocaleString('zh-CN')} 个词语的出现次数</caption>
          <thead>
            <tr>
              <th colSpan={packColumns} scope="col">
                词语 · 出现次数 · 文档数（密集显示，每排 {packColumns} 组）
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {Array.from({ length: packColumns }, (_, columnIndex) => {
                  const item = row[columnIndex];
                  return item ? (
                    <td key={`entry-${columnIndex}`} className="word-frequency-cell">
                      <div
                        className="word-frequency-entry"
                        aria-label={`${item.entry.word}，出现 ${item.entry.count.toLocaleString('zh-CN')} 次，${getWordDocumentCount(item.entry.word)} 篇`}
                        title={`${item.entry.word}：${item.entry.count.toLocaleString('zh-CN')} 次 / ${getWordDocumentCount(item.entry.word)} 篇`}
                      >
                        <span className="word-frequency-rank" aria-hidden="true">{item.index}</span>
                        <span className="word-frequency-word">{item.entry.word}</span>
                        <span className="word-frequency-count">{item.entry.count.toLocaleString('zh-CN')}·{getWordDocumentCount(item.entry.word)}篇</span>
                      </div>
                    </td>
                  ) : (
                    <td key={`empty-${columnIndex}`} className="word-frequency-cell" aria-hidden="true" />
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        {hiddenRows > 0 && (
          <div className="word-frequency-more">
            <button type="button" onClick={() => setRowLimit((n) => n + PAGE_STEP)}>
              加载更多（还有约 {hiddenEntries.toLocaleString('zh-CN')} 项）
            </button>
            <button type="button" onClick={() => setRowLimit(packedRows.length)}>
              显示全部
            </button>
          </div>
        )}
        {filteredEntries.length === 0 && <p className="word-frequency-table-empty">没有匹配的词语。</p>}
      </div>
    </section>
  );
}

export default memo(WordFrequencyTable);
