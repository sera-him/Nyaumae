import { Fragment } from 'react';
import { semanticHighlight } from './semanticHighlight';

/** Parse [[TABLE|row1col1|row1col2|...]] into HTML table */
export function renderStoryContent(content: string): React.ReactNode[] {
  const parts: React.ReactNode[] = [];
  let remaining = content;
  let keyIndex = 0;

  while (remaining.length > 0) {
    const tableStart = remaining.indexOf('[[TABLE|');
    
    if (tableStart === -1) {
      // No more tables
      parts.push(<Fragment key={`t${keyIndex}`}>{semanticHighlight(remaining)}</Fragment>);
      break;
    }

    // Text before table
    if (tableStart > 0) {
      const textBefore = remaining.slice(0, tableStart);
      parts.push(<Fragment key={`t${keyIndex}`}>{semanticHighlight(textBefore)}</Fragment>);
    }
    keyIndex++;

    // Find table end ]]
    const tableEnd = remaining.indexOf(']]', tableStart);
    if (tableEnd === -1) {
      // Malformed, treat rest as text
      parts.push(<Fragment key={`t${keyIndex}`}>{semanticHighlight(remaining)}</Fragment>);
      break;
    }

    // Extract table content between [[TABLE| and ]]
    const tableInner = remaining.slice(tableStart + 8, tableEnd); // 8 = len('[[TABLE|')
    const cells = tableInner.split('|');
    
    const header = cells.slice(0, 17);
    const row1 = cells.slice(17, 34);
    const row2 = cells.slice(34, 51);

    parts.push(
      <div key={`tbl${keyIndex}`} className="my-6 overflow-x-auto rounded-lg border border-nc-violet/15 bg-nc-bg-secondary">
        <table className="text-xs font-mono" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>
              {header.map((cell, i) => (
                <th key={i} className="px-2 py-1.5 text-left text-nc-text-muted font-normal" style={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(139, 92, 246, 0.2)' }}>{cell}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>
              {row1.map((cell, i) => (
                <td key={i} className="px-2 py-1.5 text-nc-text" style={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(139, 92, 246, 0.1)' }}>{cell}</td>
              ))}
            </tr>
            <tr>
              {row2.map((cell, i) => (
                <td key={i} className="px-2 py-1.5 text-nc-text" style={{ whiteSpace: 'nowrap' }}>{cell}</td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    );

    remaining = remaining.slice(tableEnd + 2); // 2 = len(']]')
    keyIndex++;
  }

  return parts.length > 0 ? parts : [semanticHighlight(content)];
}
