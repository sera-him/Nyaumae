import { useCallback, useEffect, useRef, useState } from 'react';
import { MousePointerClick, Play, RotateCcw, RotateCw } from 'lucide-react';
import { L } from '@/lib/translations/manual';
import { clampScore, type TrialResult } from './trials.ts';

export interface TrialTaskProps {
  onFinish: (result: TrialResult) => void;
}

function randomInt(min: number, max: number): number {
  return min + Math.floor(Math.random() * (max - min + 1));
}

/* ------------------------------------------------------------------ */
/* T1 · 闪电反应 — 5 trials of pure reaction time                      */
/* ------------------------------------------------------------------ */

const REACTION_TRIALS = 5;

export function ReactionTask({ onFinish }: TrialTaskProps) {
  const [phase, setPhase] = useState<'idle' | 'waiting' | 'go' | 'early'>('idle');
  const [trial, setTrial] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [earlyCount, setEarlyCount] = useState(0);
  const timeoutRef = useRef<number | undefined>(undefined);
  const goAtRef = useRef(0);
  const finishedRef = useRef(false);

  useEffect(() => () => window.clearTimeout(timeoutRef.current), []);

  const finish = useCallback((allTimes: number[], early: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const average = Math.round(allTimes.reduce((total, value) => total + value, 0) / allTimes.length);
    const score = clampScore(100 - Math.max(0, average - 180) * (85 / 520) - early * 3);
    onFinish({
      score,
      headline: L(`平均反应时 ${average} ms`),
      detail: L(`5 次成绩：${allTimes.join(' / ')} ms`) + (early > 0 ? L(`，抢跑 ${early} 次已扣分。`) : L('，没有抢跑。')),
    });
  }, [onFinish]);

  const arm = useCallback(() => {
    setPhase('waiting');
    timeoutRef.current = window.setTimeout(() => {
      goAtRef.current = performance.now();
      setPhase('go');
    }, randomInt(1200, 3400));
  }, []);

  const handlePad = () => {
    if (phase === 'idle' || phase === 'early') {
      arm();
      return;
    }
    if (phase === 'waiting') {
      window.clearTimeout(timeoutRef.current);
      setEarlyCount((count) => count + 1);
      setPhase('early');
      return;
    }
    const elapsed = Math.round(performance.now() - goAtRef.current);
    const nextTimes = [...times, elapsed];
    setTimes(nextTimes);
    if (nextTimes.length >= REACTION_TRIALS) {
      finish(nextTimes, earlyCount);
      return;
    }
    setTrial(nextTimes.length);
    setPhase('idle');
  };

  const padLabel = phase === 'waiting'
    ? L('等待变色…')
    : phase === 'go'
      ? L('点！')
      : phase === 'early'
        ? L('太早了，点击重新待命')
        : trial === 0
          ? L('点击开始第 1 轮')
          : L(`点击开始第 ${trial + 1} 轮`);

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('轮次')} {Math.min(trial + 1, REACTION_TRIALS)} / {REACTION_TRIALS}</span>
        <span>{times.length > 0 ? L(`已完成：${times.join(' / ')} ms`) : L('等待第一次测量')}</span>
        {earlyCount > 0 && <span className="is-warning">{L(`抢跑 ${earlyCount} 次`)}</span>}
      </div>
      <button type="button" className={`trial-reaction-pad is-${phase}`} onClick={handlePad}>
        <MousePointerClick size={30} />
        <strong>{padLabel}</strong>
        {phase === 'go' && <small>{L('越快越好')}</small>}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T2 · 记忆矩阵 — Simon-style sequence on a 3×3 grid                  */
/* ------------------------------------------------------------------ */

const MEMORY_START = 3;
const MEMORY_MAX = 12;
const MEMORY_FLASH_MS = 460;
const MEMORY_GAP_MS = 210;

function randomSequence(length: number): number[] {
  return Array.from({ length }, () => randomInt(0, 8));
}

export function MemoryMatrixTask({ onFinish }: TrialTaskProps) {
  const [sequence, setSequence] = useState<number[]>(() => randomSequence(MEMORY_START));
  const [status, setStatus] = useState<'showing' | 'input'>('showing');
  const [litTile, setLitTile] = useState<number | null>(null);
  const [inputIndex, setInputIndex] = useState(0);
  const [wrongTile, setWrongTile] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finish = useCallback((reached: number, failedAt: number | null) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const score = clampScore((reached - (MEMORY_START - 1)) * (100 / (MEMORY_MAX - MEMORY_START + 1)) * 1.0 + 4);
    onFinish({
      score,
      headline: L(`成功复现 ${reached} 步序列`),
      detail: failedAt === null
        ? L('你完成了全部 12 步，矩阵没有难住你。')
        : L(`序列从 ${MEMORY_START} 步开始每次加 1，你在 ${failedAt} 步序列上出错。`),
    });
  }, [onFinish]);

  useEffect(() => {
    if (status !== 'showing') return;
    sequence.forEach((tile, index) => {
      timersRef.current.push(window.setTimeout(() => setLitTile(tile), index * (MEMORY_FLASH_MS + MEMORY_GAP_MS)));
      timersRef.current.push(window.setTimeout(() => setLitTile(null), index * (MEMORY_FLASH_MS + MEMORY_GAP_MS) + MEMORY_FLASH_MS));
    });
    timersRef.current.push(window.setTimeout(() => {
      setInputIndex(0);
      setStatus('input');
    }, sequence.length * (MEMORY_FLASH_MS + MEMORY_GAP_MS) + 120));
    return clearTimers;
  }, [status, sequence, clearTimers]);

  const handleTile = (tile: number) => {
    if (status !== 'input') return;
    if (tile !== sequence[inputIndex]) {
      setWrongTile(tile);
      window.setTimeout(() => finish(sequence.length - 1, sequence.length), 650);
      return;
    }
    const nextIndex = inputIndex + 1;
    if (nextIndex < sequence.length) {
      setInputIndex(nextIndex);
      return;
    }
    if (sequence.length >= MEMORY_MAX) {
      finish(MEMORY_MAX, null);
      return;
    }
    setSequence(randomSequence(sequence.length + 1));
    setStatus('showing');
  };

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('当前序列')} {sequence.length} {L('步')}</span>
        <span>{status === 'showing' ? L('看清楚亮起的顺序…') : L(`轮到你了：第 ${inputIndex + 1} / ${sequence.length} 步`)}</span>
      </div>
      <div className={`trial-memory-grid ${status === 'showing' ? 'is-locked' : ''}`} role="group" aria-label={L('记忆矩阵')}>
        {Array.from({ length: 9 }, (_, tile) => (
          <button
            type="button"
            key={tile}
            className={`${litTile === tile ? 'is-lit' : ''} ${wrongTile === tile ? 'is-wrong' : ''}`}
            onClick={() => handleTile(tile)}
            disabled={status !== 'input'}
            aria-label={L(`格子 ${tile + 1}`)}
          />
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T3 · 色词干扰 — 30s Stroop                                          */
/* ------------------------------------------------------------------ */

const STROOP_DURATION_MS = 30_000;
const STROOP_COLORS = [
  { name: '红', value: '#ff6b81' },
  { name: '蓝', value: '#6ea8ff' },
  { name: '绿', value: '#5eead4' },
  { name: '黄', value: '#ffd166' },
] as const;

export function StroopTask({ onFinish }: TrialTaskProps) {
  const [stimulus, setStimulus] = useState(() => {
    const word = randomInt(0, 3);
    let ink = randomInt(0, 3);
    if (ink === word) ink = (ink + 1) % 4;
    return { word, ink };
  });
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [remainingMs, setRemainingMs] = useState(STROOP_DURATION_MS);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const finishedRef = useRef(false);
  const countsRef = useRef({ correct: 0, wrong: 0 });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { correct: good, wrong: bad } = countsRef.current;
    const total = good + bad;
    const accuracy = total === 0 ? 0 : good / total;
    const score = clampScore(Math.min(100, good * 3.4) * accuracy);
    onFinish({
      score,
      headline: L(`30 秒答对 ${good} 次`),
      detail: total === 0
        ? L('时间用完前没有作答，下次直接点击墨色对应的按钮。')
        : L(`共作答 ${total} 次，正确率 ${Math.round(accuracy * 100)}%；字义是干扰，墨色才是答案。`),
    });
  }, [onFinish]);

  useEffect(() => {
    const endAt = Date.now() + STROOP_DURATION_MS;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        finish();
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [finish]);

  const answer = (colorIndex: number) => {
    if (finishedRef.current) return;
    const isRight = colorIndex === stimulus.ink;
    countsRef.current = {
      correct: countsRef.current.correct + (isRight ? 1 : 0),
      wrong: countsRef.current.wrong + (isRight ? 0 : 1),
    };
    if (isRight) setCorrect((value) => value + 1);
    else setWrong((value) => value + 1);
    setFlash(isRight ? 'good' : 'bad');
    window.setTimeout(() => setFlash(null), 240);
    setStimulus((previous) => {
      const word = randomInt(0, 3);
      let ink = randomInt(0, 3);
      if (ink === word) ink = (ink + randomInt(1, 3)) % 4;
      if (word === previous.word && ink === previous.ink) ink = (ink + 1) % 4;
      return { word, ink };
    });
  };

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('剩余')} {(remainingMs / 1000).toFixed(1)} {L('秒')}</span>
        <span>{L('答对')} {correct} · {L('答错')} {wrong}</span>
      </div>
      <div className={`trial-stroop-stage ${flash ? `is-${flash}` : ''}`}>
        <span style={{ color: STROOP_COLORS[stimulus.ink].value }}>{STROOP_COLORS[stimulus.word].name}</span>
      </div>
      <div className="trial-stroop-options">
        {STROOP_COLORS.map((color, index) => (
          <button type="button" key={color.name} onClick={() => answer(index)}>
            <i style={{ background: color.value }} />{L(`${color.name}色`)}
          </button>
        ))}
      </div>
      <p className="trial-task-note">{L('点「墨水的颜色」，不是字的意思。')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T4 · 旋转归位 — match arrow orientation over 6 rounds               */
/* ------------------------------------------------------------------ */

const ROTATION_ROUNDS = 6;
const ROTATION_PAR_SECONDS = 20;

function rotationRound(): { target: number; start: number } {
  const target = randomInt(0, 7);
  const start = (target + randomInt(2, 6)) % 8;
  return { target, start };
}

function ArrowShape({ steps, accent }: { steps: number; accent: string }) {
  return (
    <svg viewBox="0 0 100 100" style={{ transform: `rotate(${steps * 45}deg)` }} aria-hidden="true">
      <path d="M50 10 L84 72 L50 57 L16 72 Z" fill={accent} />
      <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(255,255,255,.14)" strokeWidth="2" strokeDasharray="4 6" />
    </svg>
  );
}

export function RotationTask({ onFinish }: TrialTaskProps) {
  const [round, setRound] = useState(0);
  const [current, setCurrent] = useState(() => rotationRound());
  const [rotations, setRotations] = useState(0);
  const startAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    startAtRef.current = performance.now();
  }, []);

  const finish = useCallback((totalRotations: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const seconds = startAtRef.current === null ? 0 : Math.max(1, Math.round((performance.now() - startAtRef.current) / 1000));
    const minimal = ROTATION_ROUNDS * 2.5;
    const extra = Math.max(0, totalRotations - minimal);
    const score = clampScore(100 * (ROTATION_PAR_SECONDS / Math.max(ROTATION_PAR_SECONDS, seconds)) - extra * 2);
    onFinish({
      score,
      headline: L(`6 轮归位用时 ${seconds} 秒`),
      detail: L(`共旋转 ${totalRotations} 步；目标参考 ${ROTATION_PAR_SECONDS} 秒，多余的转动会小幅扣分。`),
    });
  }, [onFinish]);

  const rotate = useCallback((delta: number) => {
    setCurrent((previous) => {
      const nextSteps = (previous.start + delta + 8) % 8;
      const nextRotations = rotations + 1;
      setRotations(nextRotations);
      if (nextSteps === previous.target) {
        if (round + 1 >= ROTATION_ROUNDS) {
          finish(nextRotations);
          return previous;
        }
        setRound(round + 1);
        return rotationRound();
      }
      return { ...previous, start: nextSteps };
    });
  }, [finish, round, rotations]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowLeft') { event.preventDefault(); rotate(-1); }
      if (event.key === 'ArrowRight') { event.preventDefault(); rotate(1); }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [rotate]);

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('轮次')} {Math.min(round + 1, ROTATION_ROUNDS)} / {ROTATION_ROUNDS}</span>
        <span>{L('已旋转')} {rotations} {L('步')}</span>
      </div>
      <div className="trial-rotation-stage">
        <figure><ArrowShape steps={current.target} accent="#8deee0" /><figcaption>{L('目标方向')}</figcaption></figure>
        <figure className="is-yours"><ArrowShape steps={current.start} accent="#c2a0ff" /><figcaption>{L('你的箭头')}</figcaption></figure>
      </div>
      <div className="trial-rotation-controls">
        <button type="button" onClick={() => rotate(-1)}><RotateCcw size={16} />{L('逆时针 45°')}</button>
        <button type="button" onClick={() => rotate(1)}><RotateCw size={16} />{L('顺时针 45°')}</button>
      </div>
      <p className="trial-task-note">{L('也可以按键盘 ← / → 旋转。')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T5 · 汉诺塔 — 4 disks, fewest moves wins                            */
/* ------------------------------------------------------------------ */

const HANOI_DISKS = 4;
const HANOI_OPTIMAL = 15;

export function HanoiTask({ onFinish }: TrialTaskProps) {
  const [pegs, setPegs] = useState<number[][]>(() => [[4, 3, 2, 1], [], []]);
  const [selected, setSelected] = useState<number | null>(null);
  const [moves, setMoves] = useState(0);
  const [invalidPeg, setInvalidPeg] = useState<number | null>(null);
  const startAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    startAtRef.current = performance.now();
  }, []);

  const finish = useCallback((totalMoves: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const seconds = startAtRef.current === null ? 0 : Math.max(1, Math.round((performance.now() - startAtRef.current) / 1000));
    const score = clampScore(100 * (HANOI_OPTIMAL / Math.max(HANOI_OPTIMAL, totalMoves)));
    onFinish({
      score,
      headline: L(`${totalMoves} 步完成（最优 ${HANOI_OPTIMAL} 步）`),
      detail: L(`用时 ${seconds} 秒；每多走一步都会拉低效率分，先想清楚再动手。`),
    });
  }, [onFinish]);

  const handlePeg = (pegIndex: number) => {
    if (finishedRef.current) return;
    if (selected === null) {
      if (pegs[pegIndex].length === 0) return;
      setSelected(pegIndex);
      return;
    }
    if (selected === pegIndex) {
      setSelected(null);
      return;
    }
    const disk = pegs[selected][pegs[selected].length - 1];
    const targetTop = pegs[pegIndex][pegs[pegIndex].length - 1];
    if (targetTop !== undefined && targetTop < disk) {
      setInvalidPeg(pegIndex);
      window.setTimeout(() => setInvalidPeg(null), 350);
      return;
    }
    const nextPegs = pegs.map((peg, index) => {
      if (index === selected) return peg.slice(0, -1);
      if (index === pegIndex) return [...peg, disk];
      return peg;
    });
    const nextMoves = moves + 1;
    setPegs(nextPegs);
    setMoves(nextMoves);
    setSelected(null);
    if (nextPegs[1].length === HANOI_DISKS || nextPegs[2].length === HANOI_DISKS) {
      window.setTimeout(() => finish(nextMoves), 500);
    }
  };

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('步数')} {moves} · {L(`最优 ${HANOI_OPTIMAL} 步`)}</span>
        <span>{selected === null ? L('点击一根柱子拿起圆盘') : L('点击目标柱子放下')}</span>
      </div>
      <div className="trial-hanoi">
        {pegs.map((peg, pegIndex) => (
          <button
            type="button"
            key={pegIndex}
            className={`trial-hanoi-peg ${selected === pegIndex ? 'is-selected' : ''} ${invalidPeg === pegIndex ? 'is-invalid' : ''}`}
            onClick={() => handlePeg(pegIndex)}
            aria-label={L(`柱子 ${pegIndex + 1}`)}
          >
            <span className="trial-hanoi-stack">
              {peg.map((disk) => (
                <i key={disk} className={`trial-hanoi-disk size-${disk} ${selected === pegIndex && peg[peg.length - 1] === disk ? 'is-lifted' : ''}`} />
              ))}
            </span>
            <span className="trial-hanoi-base" />
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T6 · 目标搜索 — find 8 ◉ among ○ / ◎ distractors                    */
/* ------------------------------------------------------------------ */

const SEARCH_COLS = 8;
const SEARCH_ROWS = 6;
const SEARCH_TARGETS = 8;
const SEARCH_PAR_SECONDS = 30;

function buildSearchGrid(): string[] {
  const cells: string[] = Array.from({ length: SEARCH_COLS * SEARCH_ROWS }, () => (Math.random() < 0.5 ? '○' : '◎'));
  const positions = new Set<number>();
  while (positions.size < SEARCH_TARGETS) positions.add(randomInt(0, cells.length - 1));
  positions.forEach((position) => { cells[position] = '◉'; });
  return cells;
}

export function VisualSearchTask({ onFinish }: TrialTaskProps) {
  const [cells] = useState<string[]>(() => buildSearchGrid());
  const [found, setFound] = useState<Set<number>>(() => new Set());
  const [wrong, setWrong] = useState(0);
  const [missedCell, setMissedCell] = useState<number | null>(null);
  const startAtRef = useRef<number | null>(null);
  const finishedRef = useRef(false);

  useEffect(() => {
    startAtRef.current = performance.now();
  }, []);

  const finish = useCallback((wrongClicks: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const seconds = startAtRef.current === null ? 0 : Math.max(1, Math.round((performance.now() - startAtRef.current) / 1000));
    const score = clampScore(100 * (SEARCH_PAR_SECONDS / Math.max(SEARCH_PAR_SECONDS, seconds)) - wrongClicks * 4);
    onFinish({
      score,
      headline: L(`找齐 ${SEARCH_TARGETS} 个目标，用时 ${seconds} 秒`),
      detail: L(`误点 ${wrongClicks} 次；目标参考 ${SEARCH_PAR_SECONDS} 秒，越快越准分越高。`),
    });
  }, [onFinish]);

  const handleCell = (index: number) => {
    if (finishedRef.current || found.has(index)) return;
    if (cells[index] === '◉') {
      const next = new Set(found);
      next.add(index);
      setFound(next);
      if (next.size >= SEARCH_TARGETS) finish(wrong);
      return;
    }
    setWrong((value) => value + 1);
    setMissedCell(index);
    window.setTimeout(() => setMissedCell(null), 320);
  };

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('已找到')} {found.size} / {SEARCH_TARGETS}</span>
        <span>{L('误点')} {wrong} {L('次')}</span>
      </div>
      <div className="trial-search-grid" style={{ gridTemplateColumns: `repeat(${SEARCH_COLS},1fr)` }} role="group" aria-label={L('目标搜索网格')}>
        {cells.map((symbol, index) => (
          <button
            type="button"
            key={index}
            className={`${found.has(index) ? 'is-found' : ''} ${missedCell === index ? 'is-missed' : ''}`}
            onClick={() => handleCell(index)}
            aria-label={found.has(index) ? L('已找到的目标') : L('待检查符号')}
          >
            {symbol}
          </button>
        ))}
      </div>
      <p className="trial-task-note">{L('目标是实心双圈 ◉，混在 ○ 和 ◎ 之间。')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T7 · 数字广度 — Wechsler Digit Span: forward then backward recall   */
/* ------------------------------------------------------------------ */

const SPAN_FORWARD_START = 3;
const SPAN_FORWARD_MAX = 9;
const SPAN_BACKWARD_START = 2;
const SPAN_BACKWARD_MAX = 8;
const SPAN_DIGIT_MS = 950;

function randomDigits(length: number): number[] {
  return Array.from({ length }, () => randomInt(0, 9));
}

export function DigitSpanTask({ onFinish }: TrialTaskProps) {
  const [phase, setPhase] = useState<'forward' | 'backward'>('forward');
  const [length, setLength] = useState(SPAN_FORWARD_START);
  const [sequence, setSequence] = useState<number[]>(() => randomDigits(SPAN_FORWARD_START));
  const [status, setStatus] = useState<'showing' | 'input' | 'between'>('showing');
  const [showIndex, setShowIndex] = useState(0);
  const [entry, setEntry] = useState<number[]>([]);
  const [forwardReached, setForwardReached] = useState<number | null>(null);
  const timersRef = useRef<number[]>([]);
  const finishedRef = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const finish = useCallback((forward: number, backward: number) => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const raw = ((forward - (SPAN_FORWARD_START - 1)) / (SPAN_FORWARD_MAX - SPAN_FORWARD_START + 1)) * 60
      + ((backward - (SPAN_BACKWARD_START - 1)) / (SPAN_BACKWARD_MAX - SPAN_BACKWARD_START + 1)) * 40;
    onFinish({
      score: clampScore(raw + 4),
      headline: L(`正背 ${forward} 位 · 倒背 ${backward} 位`),
      detail: L(`数字逐个闪现后复述；正背从 ${SPAN_FORWARD_START} 位、倒背从 ${SPAN_BACKWARD_START} 位开始逐次加 1，倒背同时考察保持与重排。`),
    });
  }, [onFinish]);

  useEffect(() => {
    if (status !== 'showing') return;
    sequence.forEach((_, index) => {
      timersRef.current.push(window.setTimeout(() => setShowIndex(index + 1), (index + 1) * SPAN_DIGIT_MS));
    });
    timersRef.current.push(window.setTimeout(() => {
      setEntry([]);
      setStatus('input');
    }, (sequence.length + 1) * SPAN_DIGIT_MS));
    return clearTimers;
  }, [status, sequence, clearTimers]);

  const advancePhase = useCallback((reached: number) => {
    if (phase === 'forward') {
      setForwardReached(reached);
      setPhase('backward');
      setLength(SPAN_BACKWARD_START);
      setSequence(randomDigits(SPAN_BACKWARD_START));
      setShowIndex(0);
      setStatus('between');
      return;
    }
    finish(forwardReached ?? SPAN_FORWARD_START - 1, reached);
  }, [finish, forwardReached, phase]);

  const confirmEntry = () => {
    if (status !== 'input' || entry.length !== sequence.length) return;
    const expected = phase === 'forward' ? sequence : [...sequence].reverse();
    const correct = expected.every((digit, index) => digit === entry[index]);
    if (!correct) {
      advancePhase(length - 1);
      return;
    }
    if (length >= (phase === 'forward' ? SPAN_FORWARD_MAX : SPAN_BACKWARD_MAX)) {
      advancePhase(length);
      return;
    }
    const nextLength = length + 1;
    setLength(nextLength);
    setSequence(randomDigits(nextLength));
    setShowIndex(0);
    setStatus('showing');
  };

  const pressDigit = (digit: number) => {
    if (status !== 'input' || entry.length >= sequence.length) return;
    setEntry((current) => [...current, digit]);
  };

  useEffect(() => {
    if (status !== 'input') return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[0-9]$/.test(event.key)) pressDigit(Number(event.key));
      if (event.key === 'Backspace') setEntry((current) => current.slice(0, -1));
      if (event.key === 'Enter') confirmEntry();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  });

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{phase === 'forward' ? L('第一阶段 · 正背') : L('第二阶段 · 倒背')}</span>
        <span>{L('当前')} {length} {L('位')}</span>
        {forwardReached !== null && <span>{L(`正背成绩 ${forwardReached} 位`)}</span>}
      </div>
      {status === 'between' && (
        <div className="trial-span-stage">
          <strong>{L('正背阶段完成')}</strong>
          <p>{L('接下来是倒背：数字闪现后，请按相反顺序输入。')}</p>
          <button type="button" className="nctb-primary-action" onClick={() => setStatus('showing')}>
            <Play size={15} />{L('开始倒背')}
          </button>
        </div>
      )}
      {status === 'showing' && (
        <div className="trial-span-stage" role="timer">
          <span>{L('请记住依次出现的数字')}</span>
          <strong>{showIndex > 0 && showIndex <= sequence.length ? sequence[showIndex - 1] : '·'}</strong>
          <small>{Math.min(showIndex, sequence.length)} / {sequence.length}</small>
        </div>
      )}
      {status === 'input' && (
        <>
          <div className="trial-span-stage is-input">
            <span>{phase === 'forward' ? L('按相同顺序输入') : L('按相反顺序输入')}</span>
            <strong>{entry.length > 0 ? entry.join(' ') : '—'}</strong>
            <small>{entry.length} / {sequence.length}</small>
          </div>
          <div className="trial-keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((digit) => (
              <button type="button" key={digit} onClick={() => pressDigit(digit)}>{digit}</button>
            ))}
            <button type="button" className="is-utility" onClick={() => setEntry((current) => current.slice(0, -1))}>{L('删除')}</button>
            <button type="button" className="is-confirm" disabled={entry.length !== sequence.length} onClick={confirmEntry}>{L('确认')}</button>
          </div>
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T8 · 符号译码 — Wechsler Coding: 60s symbol→digit transcription     */
/* ------------------------------------------------------------------ */

const CODING_DURATION_MS = 60_000;
const CODING_SYMBOLS = ['◆', '●', '▲', '■', '★', '◐', '◇', '▣', '✚'];

function shuffled<T>(items: T[]): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = randomInt(0, index);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

export function CodingTask({ onFinish }: TrialTaskProps) {
  const [keyOrder] = useState<number[]>(() => shuffled(CODING_SYMBOLS.map((_, index) => index)));
  const [currentSymbol, setCurrentSymbol] = useState(() => randomInt(0, 8));
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [remainingMs, setRemainingMs] = useState(CODING_DURATION_MS);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const finishedRef = useRef(false);
  const countsRef = useRef({ correct: 0, wrong: 0 });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { correct: good, wrong: bad } = countsRef.current;
    const total = good + bad;
    const accuracy = total === 0 ? 0 : good / total;
    const score = clampScore(Math.min(100, good * 2.2) * accuracy);
    onFinish({
      score,
      headline: L(`60 秒译对 ${good} 个符号`),
      detail: total === 0
        ? L('时间用完前没有作答；先看顶部密码表，再按符号对应的数字。')
        : L(`共作答 ${total} 次，正确率 ${Math.round(accuracy * 100)}%；参考节奏约为每分钟 45 个。`),
    });
  }, [onFinish]);

  useEffect(() => {
    const endAt = Date.now() + CODING_DURATION_MS;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        finish();
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [finish]);

  const answer = useCallback((digit: number) => {
    if (finishedRef.current || digit < 1 || digit > 9) return;
    const isRight = keyOrder[digit - 1] === currentSymbol;
    countsRef.current = {
      correct: countsRef.current.correct + (isRight ? 1 : 0),
      wrong: countsRef.current.wrong + (isRight ? 0 : 1),
    };
    if (isRight) setCorrect((value) => value + 1);
    else setWrong((value) => value + 1);
    setFlash(isRight ? 'good' : 'bad');
    window.setTimeout(() => setFlash(null), 200);
    setCurrentSymbol((previous) => (previous + randomInt(1, 8)) % 9);
  }, [currentSymbol, keyOrder]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (/^[1-9]$/.test(event.key)) answer(Number(event.key));
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answer]);

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('剩余')} {(remainingMs / 1000).toFixed(0)} {L('秒')}</span>
        <span>{L('译对')} {correct} · {L('错误')} {wrong}</span>
      </div>
      <div className="trial-coding-key">
        {keyOrder.map((symbolIndex, position) => (
          <div key={symbolIndex}><span>{CODING_SYMBOLS[symbolIndex]}</span><b>{position + 1}</b></div>
        ))}
      </div>
      <div className={`trial-coding-stage ${flash ? `is-${flash}` : ''}`}>
        <strong>{CODING_SYMBOLS[currentSymbol]}</strong>
      </div>
      <div className="trial-keypad is-nine">
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((digit) => (
          <button type="button" key={digit} onClick={() => answer(digit)}>{digit}</button>
        ))}
      </div>
      <p className="trial-task-note">{L('看上方密码表：当前符号对应哪个数字，就按哪个键（键盘 1–9 也可以）。')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* T9 · 符号检索 — Wechsler Symbol Search: target present or not?      */
/* ------------------------------------------------------------------ */

const SEARCH2_DURATION_MS = 60_000;
const SEARCH2_POOL = ['◆', '●', '▲', '■', '★', '◐', '◇', '▣', '✚', '◉'];
const SEARCH2_CANDIDATES = 8;

interface SearchRow {
  targets: string[];
  candidates: string[];
  present: boolean;
}

function buildSearchRow(): SearchRow {
  const targets = shuffled(SEARCH2_POOL).slice(0, 2);
  const present = Math.random() < 0.5;
  const candidates = shuffled(SEARCH2_POOL.filter((symbol) => !targets.includes(symbol))).slice(0, SEARCH2_CANDIDATES);
  if (present) {
    const hit = targets[randomInt(0, 1)];
    candidates[randomInt(0, SEARCH2_CANDIDATES - 1)] = hit;
  }
  return { targets, candidates: shuffled(candidates), present };
}

export function SymbolSearchTask({ onFinish }: TrialTaskProps) {
  const [row, setRow] = useState<SearchRow>(() => buildSearchRow());
  const [correct, setCorrect] = useState(0);
  const [wrong, setWrong] = useState(0);
  const [remainingMs, setRemainingMs] = useState(SEARCH2_DURATION_MS);
  const [flash, setFlash] = useState<'good' | 'bad' | null>(null);
  const finishedRef = useRef(false);
  const countsRef = useRef({ correct: 0, wrong: 0 });

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const { correct: good, wrong: bad } = countsRef.current;
    const total = good + bad;
    const accuracy = total === 0 ? 0 : good / total;
    const score = clampScore(Math.min(100, good * 5) * accuracy);
    onFinish({
      score,
      headline: L(`60 秒判对 ${good} 组`),
      detail: total === 0
        ? L('时间用完前没有作答；任一目标出现就点「有」，否则点「无」。')
        : L(`共判断 ${total} 组，正确率 ${Math.round(accuracy * 100)}%；参考节奏约为每分钟 20 组。`),
    });
  }, [onFinish]);

  useEffect(() => {
    const endAt = Date.now() + SEARCH2_DURATION_MS;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, endAt - Date.now());
      setRemainingMs(remaining);
      if (remaining <= 0) {
        window.clearInterval(interval);
        finish();
      }
    }, 200);
    return () => window.clearInterval(interval);
  }, [finish]);

  const answer = useCallback((sayPresent: boolean) => {
    if (finishedRef.current) return;
    const isRight = sayPresent === row.present;
    countsRef.current = {
      correct: countsRef.current.correct + (isRight ? 1 : 0),
      wrong: countsRef.current.wrong + (isRight ? 0 : 1),
    };
    if (isRight) setCorrect((value) => value + 1);
    else setWrong((value) => value + 1);
    setFlash(isRight ? 'good' : 'bad');
    window.setTimeout(() => setFlash(null), 200);
    setRow(buildSearchRow());
  }, [row]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') answer(true);
      if (event.key === 'ArrowLeft') answer(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answer]);

  return (
    <div className="trial-task">
      <div className="trial-status-line">
        <span>{L('剩余')} {(remainingMs / 1000).toFixed(0)} {L('秒')}</span>
        <span>{L('判对')} {correct} · {L('判错')} {wrong}</span>
      </div>
      <div className={`trial-search2 ${flash ? `is-${flash}` : ''}`}>
        <div className="trial-search2-targets">
          <span>{L('目标')}</span>
          {row.targets.map((symbol) => <b key={symbol}>{symbol}</b>)}
        </div>
        <div className="trial-search2-row">
          {row.candidates.map((symbol, index) => <i key={`${symbol}-${index}`}>{symbol}</i>)}
        </div>
      </div>
      <div className="trial-search2-actions">
        <button type="button" onClick={() => answer(false)}>{L('无（都不在）')}</button>
        <button type="button" className="is-primary" onClick={() => answer(true)}>{L('有（出现了）')}</button>
      </div>
      <p className="trial-task-note">{L('键盘也可以：→ 有，← 无。')}</p>
    </div>
  );
}

/* ------------------------------------------------------------------ */

export const TRIAL_TASK_COMPONENTS = {
  reaction: ReactionTask,
  'memory-matrix': MemoryMatrixTask,
  stroop: StroopTask,
  rotation: RotationTask,
  hanoi: HanoiTask,
  'visual-search': VisualSearchTask,
  'digit-span': DigitSpanTask,
  coding: CodingTask,
  'symbol-search': SymbolSearchTask,
} as const;
