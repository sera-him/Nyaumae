import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import type { WordFreq } from '@/data/wordFrequency';
import './WordFrequencyTable.css';

interface WordFrequencyTableProps {
  entries: WordFreq[];
}

type SortMode = 'count' | 'word';

interface FrequencyRow {
  entry: WordFreq;
  index: number;
}

export default function WordFrequencyTable({ entries }: WordFrequencyTableProps) {
  const [query, setQuery] = useState('');
  const [sortMode, setSortMode] = useState<SortMode>('count');
  const [packColumns, setPackColumns] = useState(18);

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
      .sort((a, b) => sortMode === 'count'
        ? b.count - a.count || a.word.localeCompare(b.word, 'zh-CN')
        : a.word.localeCompare(b.word, 'zh-CN') || b.count - a.count);
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

  const downloadCsv = () => {
    const csv = ['词语,出现次数', ...filteredEntries.map((entry) => `${JSON.stringify(entry.word)},${entry.count}`)].join('\n');
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
                词语 · 出现次数（密集显示，每排 {packColumns} 组）
              </th>
            </tr>
          </thead>
          <tbody>
            {packedRows.map((row, rowIndex) => (
              <tr key={`row-${rowIndex}`}>
                {Array.from({ length: packColumns }, (_, columnIndex) => {
                  const item = row[columnIndex];
                  return item ? (
                    <td key={`entry-${columnIndex}`} className="word-frequency-cell">
                      <div
                        className="word-frequency-entry"
                        aria-label={`${item.entry.word}，出现 ${item.entry.count.toLocaleString('zh-CN')} 次`}
                        title={`${item.entry.word}：${item.entry.count.toLocaleString('zh-CN')} 次`}
                      >
                        <span className="word-frequency-rank" aria-hidden="true">{item.index}</span>
                        <span className="word-frequency-word">{item.entry.word}</span>
                        <span className="word-frequency-count">{item.entry.count.toLocaleString('zh-CN')}</span>
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
        {filteredEntries.length === 0 && <p className="word-frequency-table-empty">没有匹配的词语。</p>}
      </div>
    </section>
  );
}
