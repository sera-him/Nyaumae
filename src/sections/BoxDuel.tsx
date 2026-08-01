import { useState, useEffect, useCallback, useRef } from 'react';

const AMOUNTS = [0.01, 1, 5, 10, 25, 50, 75, 100, 200, 300, 400, 500, 750, 1000, 5000, 10000, 25000, 50000, 75000, 100000, 200000, 300000, 400000, 500000, 750000, 1000000];
const OFFER_NODES = [6, 11, 15, 18, 20, 21, 22, 23, 24];
const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX'];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomUnit(): number {
  return Math.random();
}

function pickRandom<T>(items: T[]): T | undefined {
  return items.length > 0 ? items[Math.floor(randomUnit() * items.length)] : undefined;
}

function fmt(v: number) {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: v < 1 && v > 0 ? 2 : 0, maximumFractionDigits: 2 });
}

interface Case {
  id: number; amount: number; opened: boolean; isPlayer: boolean;
}

interface RoundHist {
  round: number; conIdx: number; capIdx: number; type: string;
  conGain: number; capGain: number; actual: number;
}

interface LogEntry { time: string; msg: string; }

export default function BoxDuel() {
  const [phase, setPhase] = useState<'setup' | 'select' | 'opening' | 'offer' | 'decide' | 'negotiate' | 'capDecide' | 'end' | 'result'>('setup');
  const [totalRounds, setTotalRounds] = useState(4);
  const [round, setRound] = useState(1);
  const [playerTypes, setPlayerTypes] = useState<[string, string]>(['human', 'human']);
  const [scores, setScores] = useState<[number, number]>([0, 0]);
  const [cases, setCases] = useState<Case[]>([]);
  const [playerCaseId, setPlayerCaseId] = useState<number | null>(null);
  const [openedCount, setOpenedCount] = useState(0);
  const [roles, setRoles] = useState<[string, string]>(['contestant', 'capitalist']);
  const [energy, setEnergy] = useState(1);
  const [offer, setOffer] = useState(0);
  const [history, setHistory] = useState<RoundHist[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [hint, setHint] = useState('');
  const [modal, setModal] = useState<{ title: string; desc: string; amount?: string; showInput?: boolean; showEnergy?: boolean; inputPlaceholder?: string; inputHint?: string; buttons: { text: string; cls: string; action: () => void; disabled?: boolean }[] } | null>(null);
  const [transition, setTransition] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const blockRef = useRef(false);

  const conIdx = roles[0] === 'contestant' ? 0 : 1;
  const capIdx = roles[0] === 'capitalist' ? 0 : 1;
  const conName = playerTypes[conIdx] === 'ai' ? `AI ${conIdx + 1}` : `玩家 ${conIdx + 1}`;
  const capName = playerTypes[capIdx] === 'ai' ? `AI ${capIdx + 1}` : `玩家 ${capIdx + 1}`;
  const isConAI = playerTypes[conIdx] === 'ai';
  const isCapAI = playerTypes[capIdx] === 'ai';

  const addLog = useCallback((msg: string) => {
    const time = new Date().toLocaleTimeString('zh-CN', { hour12: false });
    setLogs(l => [...l, { time, msg }]);
  }, []);

  useEffect(() => { logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' }); }, [logs]);

  const getExpected = useCallback(() => {
    const remaining = cases.filter(c => !c.opened);
    return remaining.length ? remaining.reduce((s, c) => s + c.amount, 0) / remaining.length : 0;
  }, [cases]);

  const getNextStage = useCallback(() => {
    for (let i = 0; i < OFFER_NODES.length; i++) if (OFFER_NODES[i] > openedCount) return { target: OFFER_NODES[i], roman: ROMAN[i] };
    return { target: 25, roman: '终' };
  }, [openedCount]);

  const getStage = useCallback(() => {
    const idx = OFFER_NODES.indexOf(openedCount);
    return idx >= 0 ? ROMAN[idx] : null;
  }, [openedCount]);

  const startRound = useCallback(() => {
    const p1Con = round % 2 === 1;
    setRoles(p1Con ? ['contestant', 'capitalist'] : ['capitalist', 'contestant']);
    const shuffled = shuffle(AMOUNTS);
    const newCases: Case[] = shuffled.map((amt, i) => ({ id: i + 1, amount: amt, opened: false, isPlayer: false }));
    setCases(newCases);
    setPlayerCaseId(null);
    setOpenedCount(0);
    setEnergy(1);
    setOffer(0);
    blockRef.current = false;
    setHint(`${conName}（参赛者）请选择你的幸运箱子`);
    addLog(`第 ${round} 轮开始！${conName} 是参赛者，${capName} 是资本家。`);

    setPhase('select');
  }, [round, conName, capName, addLog]);

  function selectCase(id: number) {
    if (blockRef.current) return;
    setCases(c => c.map(x => x.id === id ? { ...x, isPlayer: true } : x));
    setPlayerCaseId(id);
    const need = getNextStage();
    setHint(`开始打开箱子！还需打开 ${need.target - openedCount} 个箱子进入 ${need.roman} 阶段`);
    addLog(`${conName} 选择了 ${id} 号箱子作为幸运箱。`);
    setPhase('opening');
    if (isConAI) {
      blockRef.current = true;
      setTimeout(() => {
        blockRef.current = false;
        aiOpenCase();
      }, 800);
    }
  }

  function aiSelectCase(cs: Case[]) {
    const avail = cs.filter(c => !c.isPlayer);
    const picked = pickRandom(avail);
    if (picked) selectCase(picked.id);
  }

  useEffect(() => {
    if (phase === 'select' && isConAI && !blockRef.current) {
      blockRef.current = true;
      const timer = window.setTimeout(() => {
        blockRef.current = false;
        aiSelectCase(cases);
      }, 800);
      return () => window.clearTimeout(timer);
    }
    return undefined;
    // The delayed AI action intentionally uses the current case snapshot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, isConAI, cases]);

  function aiOpenCase() {
    if (blockRef.current) return;
    const avail = cases.filter(c => !c.opened && !c.isPlayer);
    if (avail.length === 0) return;
    const picked = pickRandom(avail);
    if (picked) openCase(picked.id);
  }

  function openCase(id: number) {
    if (blockRef.current) return;
    const c = cases.find(x => x.id === id);
    if (!c || c.opened || c.isPlayer) return;

    const newCases = cases.map(x => x.id === id ? { ...x, opened: true } : x);
    const newCount = openedCount + 1;
    setCases(newCases);
    setOpenedCount(newCount);
    addLog(`打开 ${id} 号箱子：${fmt(c.amount)}`);

    if (OFFER_NODES.includes(newCount)) {
      const stage = getStage();
      addLog(`已打开 ${newCount} 个，进入第 ${stage} 阶段！资本家准备出价...`);
      setPhase('offer');
      blockRef.current = true;
      setTimeout(() => makeOffer(newCases, newCount), 800);
    } else if (newCount >= 25) {
      blockRef.current = true;
      setTimeout(() => resolveKeep(), 1200);
    } else {
      const need = getNextStage();
      setHint(`还需打开 ${need.target - newCount} 个箱子进入 ${need.roman} 阶段`);
      if (isConAI) {
        blockRef.current = true;
        setTimeout(() => {
          blockRef.current = false;
          aiOpenCase();
        }, 800);
      }
    }
  }

  function makeOffer(cs: Case[], oc: number) {
    const expected = cs.filter(c => !c.opened).reduce((s, c) => s + c.amount, 0) / Math.max(1, cs.filter(c => !c.opened).length);
    if (isCapAI) {
      const idx = OFFER_NODES.indexOf(oc);
      const risk = 0.55 + (idx / OFFER_NODES.length) * 0.35;
      const jitter = 0.9 + randomUnit() * 0.2;
      let o = expected * risk * jitter;
      o = Math.round(o / 100) * 100;
      if (o < 100) o = Math.round(o);
      o = Math.max(o, 0);
      setOffer(o);
      addLog(`${capName}(资本家) 出价 ${fmt(o)}`);
      proceedToDecision(o);
    } else {
      setModal({
        title: '💰 资本家出价',
        desc: `${capName}，请输入你的出价金额`,
        showInput: true,
        inputHint: '请根据剩余金额面板自行判断',
        buttons: [{
          text: '确认出价', cls: 'btn-primary',
          action: () => {
            const val = parseFloat(inputRef.current?.value || '');
            if (isNaN(val) || val < 0) return;
            setOffer(val);
            setModal(null);
            addLog(`${capName}(资本家) 出价 ${fmt(val)}`);
            proceedToDecision(val);
          },
        }],
        inputPlaceholder: '输入出价金额',
      });
    }
  }

  function proceedToDecision(o: number) {
    setPhase('decide');
    if (isConAI) {
      blockRef.current = true;
      setTimeout(() => aiDecide(o), 1200);
    } else {
      setModal({
        title: '💰 资本家出价',
        desc: `${capName} 出价购买你的箱子`,
        amount: fmt(o),
        showEnergy: true,
        buttons: [
          { text: '接受', cls: 'btn-accept', action: () => { setModal(null); resolveDeal(o, 'accept'); } },
          { text: '拒绝', cls: 'btn-reject', action: () => { setModal(null); onReject(); } },
          { text: `议价${energy > 0 ? ' (-1精神力)' : ' (无精神力)'}`, cls: 'btn-negotiate', disabled: energy <= 0, action: () => showNegotiate() },
        ],
      });
    }
  }

  function showNegotiate() {
    setPhase('negotiate');
    setModal({
      title: '🤝 议价',
      desc: `${conName}，请输入你的议价金额`,
      showInput: true,
      inputPlaceholder: '输入议价金额',
      inputHint: `当前出价: ${fmt(offer)}`,
      buttons: [
        { text: '提交议价', cls: 'btn-primary', action: () => submitNegotiate() },
        { text: '取消', cls: 'btn-secondary', action: () => { setModal(null); proceedToDecision(offer); } },
      ],
    });
  }

  function submitNegotiate() {
    const val = parseFloat(inputRef.current?.value || '');
    if (isNaN(val) || val < 0) return;
    if (val < offer) return;
    setEnergy(e => e - 1);
    addLog(`${conName} 议价至 ${fmt(val)}！（精神力已耗尽）`);
    setModal(null);
    proceedToCapDecision(val);
  }

  function proceedToCapDecision(newOffer: number) {
    setPhase('capDecide');
    if (isCapAI) {
      blockRef.current = true;
      setTimeout(() => aiCapDecide(newOffer), 1200);
    } else {
      setModal({
        title: '🤝 议价请求',
        desc: `${conName} 议价至 ${fmt(newOffer)}，是否接受？`,
        amount: fmt(newOffer),
        buttons: [
          { text: '接受议价', cls: 'btn-accept', action: () => { setModal(null); resolveDeal(newOffer, 'negotiate-accept'); } },
          { text: '拒绝议价', cls: 'btn-reject', action: () => { setModal(null); addLog(`${capName} 拒绝了议价！`); continueOpening(); } },
        ],
      });
    }
  }

  function aiDecide(o: number) {
    const expected = getExpected();
    const remaining = cases.filter(c => !c.opened);
    const highCount = remaining.filter(c => c.amount > o).length;
    const lowCount = remaining.filter(c => c.amount < o).length;

    let action = 'reject';
    if (o > expected * 1.25) action = 'accept';
    else if (o > expected * 0.95 && lowCount > highCount * 1.5) action = 'accept';

    if (action === 'reject' && energy > 0 && o < expected * 1.1 && randomUnit() < 0.35) action = 'negotiate';
    if (openedCount >= 24 && o > expected * 0.75) action = 'accept';

    if (action === 'accept') {
      resolveDeal(o, 'accept');
    } else if (action === 'negotiate') {
      setEnergy(e => e - 1);
      const newOffer = Math.max(1, Math.round(expected * 1.18 / 100) * 100);
      addLog(`${conName} 议价至 ${fmt(newOffer)}！`);
      proceedToCapDecision(newOffer);
    } else {
      onReject();
    }
  }

  function aiCapDecide(newOffer: number) {
    const expected = getExpected();
    const remaining = cases.filter(c => !c.opened);
    const probHigh = remaining.filter(c => c.amount > newOffer).length / remaining.length;

    let accept = newOffer < expected * 1.1 && probHigh > 0.4;
    if (randomUnit() > 0.75) accept = !accept;
    if (newOffer > expected * 1.3) accept = false;
    if (newOffer < expected * 0.8) accept = true;

    if (accept) {
      resolveDeal(newOffer, 'negotiate-accept');
    } else {
      addLog(`${capName} 拒绝了议价！`);
      continueOpening();
    }
  }

  function onReject() {
    addLog(`${conName} 拒绝了出价！`);
    continueOpening();
  }

  function continueOpening() {
    if (openedCount >= 25) {
      resolveKeep();
    } else {
      setPhase('opening');
      const need = getNextStage();
      setHint(`继续打开箱子！还需打开 ${need.target - openedCount} 个箱子进入 ${need.roman} 阶段`);
      if (isConAI) {
        blockRef.current = true;
        setTimeout(() => {
          blockRef.current = false;
          aiOpenCase();
        }, 800);
      }
    }
  }

  function resolveDeal(price: number, type: string) {
    const actual = cases.find(c => c.id === playerCaseId)?.amount ?? 0;
    const cGain = price;
    const capGain = actual - price;
    setScores(s => {
      const ns = [...s] as [number, number];
      ns[conIdx] += cGain;
      ns[capIdx] += capGain;
      return ns;
    });
    if (type === 'accept') addLog(`${conName} 接受 ${fmt(price)}！箱子实际为 ${fmt(actual)}。`);
    else addLog(`${capName} 接受议价 ${fmt(price)}！箱子实际为 ${fmt(actual)}。`);
    addLog(`${conName} 收益: ${fmt(cGain)} | ${capName} 净收益: ${fmt(capGain)}${capGain < 0 ? ' (亏损!)' : ''}`);
    setHistory(h => [...h, { round, conIdx, capIdx, type, conGain: cGain, capGain, actual }]);
    endRound();
  }

  function resolveKeep() {
    const actual = cases.find(c => c.id === playerCaseId)?.amount ?? 0;
    setScores(s => {
      const ns = [...s] as [number, number];
      ns[conIdx] += actual;
      return ns;
    });
    addLog(`全部拒绝/已开完25箱！${conName} 保留箱子，获得 ${fmt(actual)}。资本家本局无收益。`);
    setHistory(h => [...h, { round, conIdx, capIdx, type: 'keep', conGain: actual, capGain: 0, actual }]);
    endRound();
  }

  function endRound() {
    setPhase('end');
    blockRef.current = true;
    setCases(c => c.map(x => x.opened || x.isPlayer ? x : { ...x, opened: true }));
    setTimeout(() => {
      if (round < totalRounds) {
        setTransition(true);
        setTimeout(() => {
          setTransition(false);
          setRound(r => r + 1);
        }, 3000);
      } else {
        setPhase('result');
      }
    }, 2500);
  }

  useEffect(() => {
    if (phase !== 'setup' && phase !== 'result') return;
    if (phase === 'result') return;
  }, [phase]);

  useEffect(() => { if (phase !== 'end') return; }, [phase]);

  useEffect(() => {
    const isInitialStart = phase === 'select' && cases.length === 0;
    const isNextRound = phase === 'end' && round > 1;
    if (!isInitialStart && !isNextRound) return;
    const timer = window.setTimeout(() => startRound(), 0);
    return () => window.clearTimeout(timer);
  }, [cases.length, phase, round, startRound]);

  if (phase === 'setup') return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-center mb-2" style={{ color: '#e9c46a' }}>💼 箱子对决</h2>
      <p className="text-center text-nc-text-muted mb-6">资本与命运的博弈</p>
      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-6 mb-6">
        <h3 className="text-center text-lg font-medium mb-4" style={{ color: '#e9c46a' }}>🎮 玩家设置</h3>
        {[0, 1].map(i => (
          <div key={i} className="flex items-center justify-between py-3 px-4 rounded-xl bg-black/20 mb-2">
            <span className="text-sm">玩家 {i + 1}</span>
            <div className="flex gap-2">
              <button onClick={() => setPlayerTypes(pts => { const n = [...pts] as [string, string]; n[i] = 'human'; return n; })} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${playerTypes[i] === 'human' ? 'bg-nc-violet text-white' : 'border border-white/20 text-nc-text-muted'}`}>人类</button>
              <button onClick={() => setPlayerTypes(pts => { const n = [...pts] as [string, string]; n[i] = 'ai'; return n; })} className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${playerTypes[i] === 'ai' ? 'bg-nc-violet text-white' : 'border border-white/20 text-nc-text-muted'}`}>AI</button>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-6 mb-6">
        <h3 className="text-center text-lg font-medium mb-4" style={{ color: '#e9c46a' }}>🔄 回合数（必须为偶数）</h3>
        <div className="flex justify-center gap-3 flex-wrap">
          {[2, 4, 6, 8].map(n => (
            <button key={n} onClick={() => setTotalRounds(n)} className={`px-5 py-2 rounded-xl text-sm font-medium transition-all ${totalRounds === n ? 'bg-nc-violet text-white shadow-lg shadow-nc-violet/20' : 'border border-white/20 text-nc-text-muted hover:text-nc-text'}`}>{n}轮</button>
          ))}
        </div>
      </div>
      <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-6 mb-6">
        <h3 className="text-center text-lg font-medium mb-4" style={{ color: '#e9c46a' }}>📋 规则</h3>
        <ul className="text-sm text-nc-text-secondary space-y-1.5">
          <li>• 26个箱子固定编号 1~26，内部金额随机打乱</li>
          <li>• <strong className="text-nc-text">参赛者</strong>：先选自己的箱子，然后逐个打开其他箱子</li>
          <li>• <strong className="text-nc-text">资本家</strong>：在阶段节点出价购买参赛者的箱子（手动输入价格）</li>
          <li>• 打开 <strong className="text-nc-text">6/11/15/18/20/21/22/23/24</strong> 个箱子时触发 I ~ IX 阶段出价</li>
          <li>• 参赛者可选：<span style={{ color: '#2ecc71' }}>接受</span> / <span style={{ color: '#e74c3c' }}>拒绝</span> / <span style={{ color: '#f39c12' }}>议价</span></li>
          <li>• 每局参赛者仅有 <strong className="text-nc-text">1点精神力</strong>，议价消耗1点</li>
          <li>• 资本家<strong className="text-nc-text">扣减出价成本</strong>，净收益 = 箱子实际金额 − 成交价</li>
          <li>• 多轮后比较<strong className="text-nc-text">净收益</strong>，高者获胜</li>
        </ul>
      </div>
      <div className="text-center">
        <button onClick={() => { setPhase('select'); setRound(1); setLogs([]); setHistory([]); setScores([0, 0]); }} className="px-10 py-3 text-base font-bold rounded-xl transition-all" style={{ background: '#e9c46a', color: '#1a1a2e' }}>开始游戏</button>
      </div>
    </div>
  );

  if (phase === 'result') {
    const [s1, s2] = scores;
    const winner = s1 > s2 ? 1 : s2 > s1 ? 2 : 0;
    return (
      <div className="max-w-3xl mx-auto px-4 py-8 text-center">
        <h2 className="text-3xl font-bold mb-4" style={winner === 0 ? { color: '#e9c46a' } : { color: '#2ecc71' }}>{winner === 0 ? '🤝 平局！' : `🏆 ${winner === 1 ? playerTypes[0] === 'ai' ? 'AI 1' : '玩家 1' : playerTypes[1] === 'ai' ? 'AI 2' : '玩家 2'} 获胜！`}</h2>
        <div className="rounded-2xl border border-white/[0.06] bg-nc-bg-tertiary/20 p-6 text-left">
          {history.map((h, i) => (
            <div key={i} className="flex justify-between py-3 px-4 border-b border-white/5 text-sm">
              <span><strong>第{h.round}轮</strong> {h.type === 'accept' ? '接受出价' : h.type === 'negotiate-accept' ? '议价成交' : '保留箱子'} | 箱子: {fmt(h.actual)}</span>
              <span className="text-right"><span style={{ color: '#2ecc71' }}>{h.conGain >= 0 ? `+${fmt(h.conGain)}` : fmt(h.conGain)}</span> / <span style={{ color: h.capGain >= 0 ? '#2ecc71' : '#e74c3c' }}>{h.capGain >= 0 ? `+${fmt(h.capGain)}` : fmt(h.capGain)}</span></span>
            </div>
          ))}
          <div className="flex justify-between py-3 px-4 font-bold text-base" style={{ color: '#e9c46a' }}>
            <span>总计</span>
            <span>{playerTypes[0] === 'ai' ? 'AI 1' : '玩家 1'}: {fmt(s1)} &nbsp;|&nbsp; {playerTypes[1] === 'ai' ? 'AI 2' : '玩家 2'}: {fmt(s2)}</span>
          </div>
        </div>
        <button onClick={() => { setPhase('setup'); setLogs([]); setHistory([]); setScores([0, 0]); }} className="mt-6 px-10 py-3 text-base font-bold rounded-xl transition-all" style={{ background: '#e9c46a', color: '#1a1a2e' }}>再来一局</button>
      </div>
    );
  }

  if (transition) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-3" style={{ color: '#e9c46a' }}>第 {round} 轮结束</h2>
          <p className="text-nc-text-secondary">{playerTypes[0] === 'ai' ? 'AI 1' : '玩家 1'}: {fmt(scores[0])} &nbsp;|&nbsp; {playerTypes[1] === 'ai' ? 'AI 2' : '玩家 2'}: {fmt(scores[1])}</p>
        </div>
      </div>
    );
  }

  const sorted = [...cases].sort((a, b) => a.id - b.id);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h2 className="text-2xl font-bold text-center mb-1" style={{ color: '#e9c46a' }}>💼 箱子对决</h2>
      <p className="text-center text-sm text-nc-text-muted mb-4">第 {round} / {totalRounds} 轮</p>

      <div className="text-center py-2 px-4 rounded-xl mb-4 border" style={{ borderColor: 'rgba(233,196,106,0.25)', background: 'rgba(255,255,255,0.04)', minHeight: '44px' }}>
        <span className="text-sm text-nc-text-secondary">{hint || '等待游戏开始...'}</span>
      </div>

      <div className="flex gap-4 mb-4">
        {[0, 1].map(i => (
          <div key={i} className="flex-1 rounded-xl p-4 border-2 transition-all" style={{ borderColor: roles[i] === 'contestant' ? '#e9c46a' : 'transparent', background: roles[i] === 'contestant' ? 'rgba(233,196,106,0.1)' : 'rgba(255,255,255,0.05)' }}>
            <div className="font-bold text-base">{playerTypes[i] === 'ai' ? 'AI' : '玩家'} {i + 1}</div>
            <div className="text-xs mb-2" style={{ color: '#e9c46a' }}>{roles[i] === 'contestant' ? '参赛者' : '资本家'}</div>
            <div className="text-xs text-nc-text-muted">总净收益: <span style={{ color: scores[i] >= 0 ? '#2ecc71' : '#e74c3c' }}>{fmt(scores[i])}</span></div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_280px] gap-4 mb-4">
        <div className="grid grid-cols-7 sm:grid-cols-13 gap-1.5 p-4 rounded-xl" style={{ background: 'rgba(255,255,255,0.04)' }}>
          {sorted.map(c => {
            let cls = 'box-duel-case aspect-square flex items-center justify-center rounded-lg font-bold text-xs transition-all border-2 cursor-pointer select-none overflow-hidden text-center';
            let style: React.CSSProperties = {};
            if (c.opened) {
              cls += ' is-opened opacity-85 cursor-default';
              style = { background: 'linear-gradient(145deg, #2c3e50, #1a252f)', borderColor: '#34495e', color: '#e74c3c' };
            } else if (c.isPlayer) {
              cls += ' is-player cursor-default';
              style = { background: 'linear-gradient(145deg, #2ecc71, #27ae60)', borderColor: '#27ae60', color: '#fff', fontSize: '1.3em' };
            } else {
              style = { background: 'linear-gradient(145deg, #e9c46a, #c8956c)', borderColor: '#f4a261', color: '#1a1a2e' };
              if (phase !== 'select' && phase !== 'opening') { cls += ' opacity-35 cursor-not-allowed'; }
            }
            const available = (phase === 'select' || phase === 'opening') && !c.opened && !c.isPlayer;
            return (
              <button
                key={c.id}
                type="button"
                className={cls}
                style={style}
                disabled={!available}
                aria-label={c.opened ? `箱子 ${c.id}，已打开，金额 ${fmt(c.amount)}` : c.isPlayer ? `箱子 ${c.id}，玩家保留箱` : `选择箱子 ${c.id}`}
                onClick={() => {
                if (available) {
                  if (phase === 'select') selectCase(c.id);
                  else openCase(c.id);
                }
              }}
              >
                {c.opened ? fmt(c.amount) : c.isPlayer ? '👤' : c.id}
              </button>
            );
          })}
        </div>

        <div>
          <div className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <h3 className="text-center text-sm mb-3" style={{ color: '#e9c46a' }}>💰 金额面板</h3>
            <div className="flex flex-col gap-0.5 max-h-[400px] overflow-y-auto">
              {[...AMOUNTS].sort((a, b) => a - b).map(amt => {
                const eliminated = cases.filter(c => c.opened).some(c => c.amount === amt);
                return (
                  <div key={amt} className="flex justify-between px-2.5 py-1 text-xs rounded" style={eliminated ? { background: 'rgba(231,76,60,0.15)', color: '#888', textDecoration: 'line-through', opacity: 0.35 } : { background: 'rgba(0,0,0,0.25)' }}>
                    <span>{fmt(amt)}</span>
                    <span>{eliminated ? '✕' : '•'}</span>
                  </div>
                );
              })}
            </div>
            <div className="mt-3 pt-3 text-xs space-y-1.5" style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }}>
              <div className="flex justify-between"><span>已打开:</span><span style={{ color: '#e9c46a' }}>{openedCount} / 25</span></div>
              <div className="flex justify-between"><span>精神力:</span><span style={{ color: '#e74c3c', fontWeight: 'bold' }}>{energy} / 1</span></div>
            </div>
          </div>
        </div>
      </div>

      <div ref={logRef} className="rounded-xl p-3 text-xs max-h-[150px] overflow-y-auto border" style={{ background: 'rgba(0,0,0,0.25)', borderColor: 'rgba(255,255,255,0.08)' }}>
        {logs.map((l, i) => (
          <div key={i} className="py-1 border-b border-white/[0.04] last:border-b-0">
            <span className="text-nc-text-muted mr-1">[{l.time}]</span>
            <span className="text-nc-text-secondary">{l.msg}</span>
          </div>
        ))}
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}>
          <div className="rounded-2xl p-8 max-w-md w-[90%] text-center border-2" style={{ borderColor: '#e9c46a', background: 'linear-gradient(145deg, #12122a, #1a1a3e)', animation: 'slideIn 0.35s' }}>
            <h2 className="text-xl font-bold mb-3" style={{ color: '#e9c46a' }}>{modal.title}</h2>
            <p className="text-sm text-nc-text-secondary mb-3">{modal.desc}</p>
            {modal.amount && <div className={`text-4xl font-bold my-4 ${modal.amount?.startsWith('-') ? '' : ''}`} style={{ color: modal.amount?.startsWith('-') ? '#e74c3c' : '#2ecc71' }}>{modal.amount}</div>}
            {modal.showInput && (
              <div className="my-4">
                <input ref={inputRef} type="number" placeholder={modal.inputPlaceholder || '输入金额'} min={0} step={100} className="w-full p-3 text-lg text-center font-bold rounded-xl border-2 bg-black/40 text-white" style={{ borderColor: '#e9c46a' }} />
                {modal.inputHint && <p className="text-xs text-nc-text-muted mt-2">{modal.inputHint}</p>}
              </div>
            )}
            {modal.showEnergy && (
              <div className="my-3 text-sm" style={{ color: '#aaa' }}>
                <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${energy > 0 ? '' : 'opacity-30'}`} style={{ background: energy > 0 ? '#e74c3c' : '#555', boxShadow: energy > 0 ? '0 0 8px #e74c3c' : 'none' }}></span>
                剩余 {energy} 点精神力
              </div>
            )}
            <div className="flex gap-3 justify-center mt-5 flex-wrap">
              {modal.buttons.map((b, i) => (
                <button key={i} onClick={b.action} disabled={b.disabled} className="px-6 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                  style={b.cls === 'btn-accept' ? { background: '#2ecc71', color: 'white' } : b.cls === 'btn-reject' ? { background: '#e74c3c', color: 'white' } : b.cls === 'btn-negotiate' ? { background: '#f39c12', color: 'white' } : b.cls === 'btn-primary' ? { background: '#e9c46a', color: '#1a1a2e' } : { background: 'rgba(255,255,255,0.15)', color: 'white' }}
                  onMouseEnter={e => { if (!b.disabled) (e.target as HTMLElement).style.transform = 'scale(1.05)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.transform = 'scale(1)'; }}
                >{b.text}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
