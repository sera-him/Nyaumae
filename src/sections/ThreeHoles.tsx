import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
} from 'react';
import { L } from '@/lib/translations/manual';

import { RotateCcw } from 'lucide-react';
import { DIFFICULTIES, createPuzzleState } from '@/game/threeHoles/puzzleGen';
import type { PuzzleState } from '@/game/threeHoles/puzzleGen';
import './ThreeHoles.css';
import { confirmAction } from '@/lib/confirmAction';

type Mark = 0 | 1 | 2;
type PaintMark = 1 | 2;
type DragMode = 'paint' | 'clear';

interface DragState {
  row: number;
  col: number;
  mode: DragMode;
  paintMark: PaintMark;
  moved: boolean;
  committed: Set<string>;
}

function assignRegionColors(regions: number[][]): string[] {
  const n = regions.length;
  const adjacency: Set<number>[] = Array.from({ length: n }, () => new Set());

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      const region = regions[row][col];
      for (const [dr, dc] of [[0, 1], [1, 0], [0, -1], [-1, 0]]) {
        const nextRow = row + dr;
        const nextCol = col + dc;
        if (nextRow < 0 || nextRow >= n || nextCol < 0 || nextCol >= n) continue;
        const neighbor = regions[nextRow][nextCol];
        if (neighbor !== region) adjacency[region].add(neighbor);
      }
    }
  }

  const hues = Array.from({ length: n }, (_, index) => (index * 137.508) % 360);
  for (let iteration = 0; iteration < 50; iteration++) {
    let moved = false;
    for (let region = 0; region < n; region++) {
      for (const neighbor of adjacency[region]) {
        if (neighbor <= region) continue;
        let difference = Math.abs(hues[region] - hues[neighbor]);
        if (difference > 180) difference = 360 - difference;
        if (difference >= 48) continue;
        const push = (48 - difference) / 2 + 1;
        if ((hues[neighbor] - hues[region] + 360) % 360 < 180) {
          hues[neighbor] = (hues[neighbor] + push) % 360;
        } else {
          hues[neighbor] = (hues[neighbor] - push + 360) % 360;
        }
        moved = true;
      }
    }
    if (!moved) break;
  }

  return hues.map((hue) => `hsl(${Math.round(hue)} 42% 30%)`);
}

function checkWin(state: PuzzleState): boolean {
  const { n, k, marks, regions } = state;
  const rabbits = marks.map((row) => row.map((value) => value === 2));

  for (let index = 0; index < n; index++) {
    if (rabbits[index].filter(Boolean).length !== k) return false;
    if (rabbits.filter((row) => row[index]).length !== k) return false;
  }

  const regionCounts = Array<number>(n).fill(0);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (rabbits[row][col]) regionCounts[regions[row][col]]++;
    }
  }
  if (!regionCounts.every((count) => count === k)) return false;

  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!rabbits[row][col]) continue;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (
            nextRow >= 0
            && nextRow < n
            && nextCol >= 0
            && nextCol < n
            && rabbits[nextRow][nextCol]
          ) return false;
        }
      }
    }
  }

  return true;
}

function formatTime(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function regionBorder(regions: number[][], row: number, col: number): CSSProperties {
  const n = regions.length;
  const region = regions[row][col];
  const boundary = '2px solid rgba(238, 246, 255, 0.78)';
  return {
    borderTop: row === 0 || regions[row - 1][col] !== region ? boundary : undefined,
    borderRight: col === n - 1 || regions[row][col + 1] !== region ? boundary : undefined,
    borderBottom: row === n - 1 || regions[row + 1][col] !== region ? boundary : undefined,
    borderLeft: col === 0 || regions[row][col - 1] !== region ? boundary : undefined,
  };
}

function hasAdjacentRabbit(marks: Mark[][], row: number, col: number): boolean {
  if (marks[row][col] !== 2) return false;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const nextRow = row + dr;
      const nextCol = col + dc;
      if (marks[nextRow]?.[nextCol] === 2) return true;
    }
  }
  return false;
}

export default function ThreeHoles() {
  const [difficultyIndex, setDifficultyIndex] = useState(0);
  const [state, setState] = useState<PuzzleState | null>(null);
  const [paintMark, setPaintMark] = useState<PaintMark>(2);
  const [error, setError] = useState('');
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(0);
  const dragRef = useRef<DragState | null>(null);

  const isActive = Boolean(state && !state.won && !state.surrendered);
  const stateRegions = state?.regions;
  const colors = useMemo(
    () => stateRegions ? assignRegionColors(stateRegions) : [],
    [stateRegions],
  );

  const start = useCallback(() => {
    setError('');
    try {
      setState(createPuzzleState(DIFFICULTIES[difficultyIndex]));
      setPaintMark(2);
      startTimeRef.current = Date.now();
      setElapsed(0);
      dragRef.current = null;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '题目加载失败');
    }
  }, [difficultyIndex]);

  useEffect(() => {
    if (!isActive) {
      if (startTimeRef.current) setElapsed(Date.now() - startTimeRef.current);
      return;
    }
    const timer = window.setInterval(
      () => setElapsed(Date.now() - startTimeRef.current),
      250,
    );
    return () => window.clearInterval(timer);
  }, [isActive]);

  const updateCell = useCallback((row: number, col: number, update: (mark: Mark) => Mark) => {
    setState((current) => {
      if (!current || current.won || current.surrendered) return current;
      if (current.givens[row][col]) return current;
      const marks = current.marks.map((currentRow) => [...currentRow]) as Mark[][];
      marks[row][col] = update(marks[row][col]);
      const next = { ...current, marks };
      return checkWin(next) ? { ...next, won: true } : next;
    });
  }, []);

  const applyDragAt = useCallback((row: number, col: number, drag: DragState) => {
    const key = `${row},${col}`;
    if (drag.committed.has(key)) return;
    drag.committed.add(key);
    updateCell(row, col, () => drag.mode === 'paint' ? drag.paintMark : 0);
  }, [updateCell]);

  const findPointerCell = (event: PointerEvent<HTMLDivElement>) => {
    const target = document.elementFromPoint(event.clientX, event.clientY);
    return target?.closest<HTMLElement>('[data-rabbit-cell]') ?? null;
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (!isActive || event.button !== 0) return;
    const cell = findPointerCell(event);
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (state!.givens[row][col]) return;
    const mark = state!.marks[row][col] as Mark;
    dragRef.current = {
      row,
      col,
      mode: mark === paintMark ? 'clear' : 'paint',
      paintMark,
      moved: false,
      committed: new Set(),
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    const cell = findPointerCell(event);
    if (!cell) return;
    const row = Number(cell.dataset.row);
    const col = Number(cell.dataset.col);
    if (row !== drag.row || col !== drag.col) drag.moved = true;
    if (drag.moved) {
      applyDragAt(drag.row, drag.col, drag);
      applyDragAt(row, col, drag);
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;
    if (!drag.moved) {
      updateCell(
        drag.row,
        drag.col,
        (mark) => mark === drag.paintMark ? 0 : drag.paintMark,
      );
    }
    dragRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handleCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, row: number, col: number) => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    updateCell(row, col, (mark) => mark === paintMark ? 0 : paintMark);
  };

  if (!state) {
    return (
      <div className="rabbit-game rabbit-game--welcome">
        <section className="rabbit-welcome" aria-labelledby="rabbit-title">
          <p className="rabbit-kicker">{L("逻辑填格")}</p>
          <h2 id="rabbit-title">{L("狡兔三窟")}</h2>
          <p>
            {L("在 n×n 草原上标出兔子洞。每行、每列和每个猞猁活动区都恰好有 k 个兔子洞，\n            且兔子洞之间不能相邻。\n          ")}</p>
          <label className="rabbit-field">
            <span>{L("难度")}</span>
            <select
              value={difficultyIndex}
              onChange={(event) => setDifficultyIndex(Number(event.target.value))}
            >
              {DIFFICULTIES.map((difficulty, index) => (
                <option key={difficulty.id} value={index}>
                  {difficulty.name}（{difficulty.n}×{difficulty.n}，k={difficulty.k}）
                </option>
              ))}
            </select>
          </label>
          <div className="rabbit-empty" role="status">
            <span>{L("本局目标兔子洞")}</span>
            <strong>{DIFFICULTIES[difficultyIndex].n * DIFFICULTIES[difficultyIndex].k}</strong>
          </div>
          {error && <p className="rabbit-error" role="alert">{error}</p>}
          <button className="rabbit-primary-button" type="button" onClick={start}>
            {L("开始游戏\n          ")}</button>
        </section>
      </div>
    );
  }

  const { n, k, marks, regions } = state;
  const rabbitCount = marks.reduce(
    (total, row) => total + row.filter((mark) => mark === 2).length,
    0,
  );
  const excludedCount = marks.reduce(
    (total, row) => total + row.filter((mark) => mark === 1).length,
    0,
  );
  let givenHoleCount = 0;
  let givenExcludedCount = 0;
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (!state.givens[row][col]) continue;
      if (marks[row][col] === 2) givenHoleCount++;
      if (marks[row][col] === 1) givenExcludedCount++;
    }
  }
  const givenCount = givenHoleCount + givenExcludedCount;
  const progressMarks: Mark[][] = state.surrendered
    ? state.solution.map((row) => row.map((hasRabbit) => hasRabbit ? 2 : 0) as Mark[])
    : marks as Mark[][];
  const rowCounts = progressMarks.map((row) => row.filter((mark) => mark === 2).length);
  const colCounts = Array.from(
    { length: n },
    (_, col) => progressMarks.filter((row) => row[col] === 2).length,
  );
  const regionCounts = Array<number>(n).fill(0);
  for (let row = 0; row < n; row++) {
    for (let col = 0; col < n; col++) {
      if (progressMarks[row][col] === 2) regionCounts[regions[row][col]]++;
    }
  }
  const adjacentConflictCount = marks.reduce(
    (total, row, rowIndex) => total + row.filter(
      (_, colIndex) => hasAdjacentRabbit(marks as Mark[][], rowIndex, colIndex),
    ).length,
    0,
  );
  const overfilled = rowCounts.some((count) => count > k)
    || colCounts.some((count) => count > k)
    || regionCounts.some((count) => count > k);
  const targetCount = n * k;
  const displayedRabbitCount = state.surrendered ? targetCount : rabbitCount;
  const boardStyle = {
    '--rabbit-grid-size': n,
    '--rabbit-cell-size': `max(18px, min(48px, calc((min(100vw, 760px) - 5rem) / ${n})))`,
  } as CSSProperties;

  const resetToMenu = () => {
    if (state && !state.won && !state.surrendered && !confirmAction({
      title: '放弃当前狡兔三窟谜题？',
      consequence: '当前标记、用时和未完成进度都会清空。',
    })) return;
    dragRef.current = null;
    startTimeRef.current = 0;
    setElapsed(0);
    setError('');
    setState(null);
  };

  const revealSolution = () => {
    dragRef.current = null;
    setState((current) => current ? { ...current, surrendered: true } : current);
  };

  return (
    <div className="rabbit-game">
      <header className="rabbit-header">
        <div>
          <p className="rabbit-kicker">{L("逻辑填格")}</p>
          <h2>{L("狡兔三窟")}</h2>
          <p>{DIFFICULTIES[difficultyIndex].name} · {n}×{n} {L("· 每行 / 列 / 区 ")}{k} {L("洞")}</p>
        </div>
        <button className="rabbit-secondary-button" type="button" onClick={resetToMenu}>
          <RotateCcw aria-hidden="true" />
          {L("重新开始\n        ")}</button>
      </header>

      {state.won || state.surrendered ? (
        <section className={`rabbit-result ${state.won ? 'rabbit-result--won' : ''}`} aria-live="polite">
          <p className="rabbit-kicker">{state.won ? '完成' : '本局结束'}</p>
          <h2>{state.won ? '全部兔子洞已找到' : '答案已揭示'}</h2>
          <p>
            {state.won
              ? `用时 ${formatTime(elapsed)}，所有行、列和猞猁活动区均满足规则。`
              : '下方显示本题答案；本局已停止操作。'}
          </p>
        </section>
      ) : null}

      <div className="rabbit-layout">
        <section className="rabbit-board-panel" aria-label={L("游戏棋盘")}>
          <div className="rabbit-tools" role="group" aria-label={L("标记工具")}>
            <button
              type="button"
              className={paintMark === 2 ? 'is-active' : ''}
              aria-pressed={paintMark === 2}
              onClick={() => setPaintMark(2)}
            >
              <i className="rabbit-legend-hole" aria-hidden="true">●</i>
              {L("兔子洞\n            ")}</button>
            <button
              type="button"
              className={paintMark === 1 ? 'is-active' : ''}
              aria-pressed={paintMark === 1}
              onClick={() => setPaintMark(1)}
            >
              <i className="rabbit-legend-excluded" aria-hidden="true">×</i>
              {L("排除\n            ")}</button>
          </div>
          <div className="rabbit-board-scroll">
            <div
              className="rabbit-board"
              style={boardStyle}
              role="grid"
              aria-label={L(`${n}乘${n}草原棋盘`)}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={() => { dragRef.current = null; }}
            >
              {Array.from({ length: n }, (_, row) =>
                Array.from({ length: n }, (_, col) => {
                  const isGiven = state.givens[row][col];
                  const visibleMark: Mark = state.surrendered
                    ? (state.solution[row][col] ? 2 : 0)
                    : marks[row][col] as Mark;
                  const region = regions[row][col];
                  const conflict = hasAdjacentRabbit(marks as Mark[][], row, col);
                  const label = isGiven
                    ? `第${row + 1}行第${col + 1}列，${
                      visibleMark === 2 ? '已知兔子洞' : '已知排除'
                    }`
                    : visibleMark === 2
                    ? `第${row + 1}行第${col + 1}列，兔子洞`
                    : visibleMark === 1
                      ? `第${row + 1}行第${col + 1}列，已排除`
                      : `第${row + 1}行第${col + 1}列，空`;
                  return (
                    <button
                      key={`${row}-${col}`}
                      type="button"
                      role="gridcell"
                      data-rabbit-cell
                      data-row={row}
                      data-col={col}
                      className={`rabbit-cell rabbit-cell--${visibleMark}${isGiven ? ' rabbit-cell--given' : ''}${conflict ? ' rabbit-cell--conflict' : ''}`}
                      style={{
                        backgroundColor: colors[region],
                        ...regionBorder(regions, row, col),
                      }}
                      aria-label={label}
                      aria-disabled={!isActive || isGiven}
                      disabled={!isActive || isGiven}
                      tabIndex={isActive && !isGiven ? 0 : -1}
                      onKeyDown={(event) => handleCellKeyDown(event, row, col)}
                    >
                      {visibleMark === 1 && <span aria-hidden="true">×</span>}
                      {visibleMark === 2 && <span aria-hidden="true">●</span>}
                    </button>
                  );
                }),
              )}
            </div>
          </div>
          <div className="rabbit-legend" aria-label={L("棋盘图例")}>
            <span><i className="rabbit-legend-empty" />{L("未判断")}</span>
            <span><i className="rabbit-legend-excluded">×</i>{L("排除")}</span>
            <span><i className="rabbit-legend-hole">●</i>{L("兔子洞")}</span>
            {givenHoleCount > 0 && (
              <span><i className="rabbit-legend-given">●</i>{L("已知兔洞")}</span>
            )}
            {givenExcludedCount > 0 && (
              <span><i className="rabbit-legend-given-excluded">×</i>{L("已知排除")}</span>
            )}
          </div>
        </section>

        <aside className="rabbit-sidebar">
          <section className="rabbit-status" aria-label={L("当前状态")}>
            <div>
              <span>{state.surrendered ? '答案中的兔子洞' : '已标记兔子洞'}</span>
              <strong>{displayedRabbitCount}<small> / {targetCount}</small></strong>
            </div>
            <div>
              <span>{state.surrendered ? '答案中的非兔洞' : '已排除'}</span>
              <strong>{state.surrendered ? n * n - targetCount : excludedCount}</strong>
            </div>
            <div>
              <span>{L("用时")}</span>
              <strong>{formatTime(elapsed)}</strong>
            </div>
          </section>

          {givenCount > 0 && (
            <p className="rabbit-notice" role="status">
              {L("本题有 ")}{givenCount} {L("个不可修改的题面线索：\n              ")}{givenHoleCount} {L("个已知兔洞、")}{givenExcludedCount} {L("个已知排除；\n              它们已计入当前标记。\n            ")}</p>
          )}
          {rabbitCount === 0 && isActive && (
            <p className="rabbit-notice" role="status">{L("当前没有兔子洞标记。选择“兔子洞”后点击格子即可放置。")}</p>
          )}
          {(overfilled || adjacentConflictCount > 0) && isActive && (
            <p className="rabbit-warning" role="status">
              {overfilled ? '有一行、列或活动区超过了规定数量。' : '兔子洞不能位于相邻格。'}
            </p>
          )}

          <section className="rabbit-progress" aria-label={L("完成进度")}>
            <h2>{L("约束进度")}</h2>
            <div><span>{L("行")}</span><strong>{rowCounts.filter((count) => count === k).length} / {n}</strong></div>
            <div><span>{L("列")}</span><strong>{colCounts.filter((count) => count === k).length} / {n}</strong></div>
            <div><span>{L("猞猁活动区")}</span><strong>{regionCounts.filter((count) => count === k).length} / {n}</strong></div>
          </section>

          <section className="rabbit-help">
            <h2>{L("操作")}</h2>
            <p>{L("先选择“兔子洞”或“排除”，再点击格子放置标记；再次点击相同标记可清除。支持拖动连续标记。")}</p>
          </section>

          {isActive && (
            <button className="rabbit-danger-button" type="button" onClick={revealSolution}>
              {L("结束并查看答案\n            ")}</button>
          )}
          {!isActive && (
            <button className="rabbit-primary-button" type="button" onClick={start}>
              {L("再来一局\n            ")}</button>
          )}
        </aside>
      </div>
    </div>
  );
}
