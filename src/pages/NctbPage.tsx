import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { L } from '@/lib/translations/manual';

import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  Download,
  FileJson,
  FileText,
  Gauge,
  History,
  Pause,
  Play,
  Printer,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  X,
  Zap,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  CartesianGrid,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { levelSystem } from '@/conversation/levelSystem';
import InteractiveTrials from '@/nctb/interactive/InteractiveTrials';
import ReportCard from '@/nctb/ReportCard';
import { getNctbDimension, NCTB_DIMENSIONS, questionsRequiredForDimension } from '@/nctb/catalog';
import { NCTB_DIMENSIONS_EN } from '@/nctb/catalog.en';
import { getLocale } from '@/lib/i18n';
import { getNctbQuestion } from '@/nctb/questionBank';
import { reportToCsv, scoreNctbSession } from '@/nctb/scoring';
import {
  accrueActiveTime,
  advanceNctbSession,
  answerCurrentQuestion,
  configureNctbSession,
  createNctbSession,
  currentDimensionId,
  currentResponse,
  effectiveResponses,
  markCurrentStimulusSeen,
  openNctbReport,
  orderedQuestionOptions,
  pauseNctbSession,
  resumeNctbSession,
  requiredQuestionsForSessionDimension,
  sessionCompletion,
  startNctbSession,
} from '@/nctb/sessionEngine';
import {
  clearNctbState,
  loadNctbState,
  putNctbReport,
  putNctbSession,
  saveNctbState,
  setActiveNctbSession,
} from '@/nctb/storage';
import type {
  NctbDimensionId,
  NctbMode,
  NctbReport,
  NctbSession,
  NctbState,
  NctbStrategy,
} from '@/nctb/types';
import './NctbPage.css';

type PageScreen = 'dashboard' | 'session' | 'history' | 'reportcard';

function DIMS() { return getLocale() === 'en' ? NCTB_DIMENSIONS_EN : NCTB_DIMENSIONS; }
function dimOf(id: NctbDimensionId) { return DIMS().find((dimension) => dimension.id === id) ?? getNctbDimension(id); }
const MODE_LABELS: Record<NctbMode, string> = { formal: '标准考试' };
const STRATEGY_LABELS: Record<NctbStrategy, string> = { fixed: '固定难度', adaptive: '自适应难度' };

function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.floor(milliseconds / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(value));
  } catch {
    return value;
  }
}

function downloadText(filename: string, content: string, type: string): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function reportFileStem(report: NctbReport): string {
  return `nctb-${report.mode}-${report.createdAt.slice(0, 10)}-${report.sessionId.slice(-6)}`;
}

function Dashboard({
  state,
  onCreate,
  onResume,
  onHistory,
  onReportCard,
  onReset,
}: {
  state: NctbState;
  onCreate: (mode: NctbMode) => void;
  onResume: (session: NctbSession) => void;
  onHistory: () => void;
  onReportCard: () => void;
  onReset: () => void;
}) {
  const latestReport = [...state.reports].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
  const resumable = [...state.sessions]
    .filter((session) => ['setup', 'active', 'paused'].includes(session.phase))
    .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  const latestByDimension = new Map(latestReport?.dimensions.map((result) => [result.dimensionId, result]));
  const _en = getLocale() === 'en';
  return (
    <>
      <header className="nctb-hero">
        <div className="nctb-hero-copy">
          <p className="nctb-eyebrow"><span>NCTB / 05</span> NEURAL COGNITION TEST BATTERY</p>
          <h1>{L("认知实验室")}</h1>
          <p className="nctb-lead">{L("十个维度，五十道题，一套可中断、可恢复、可解释的本地能力探索闭环。")}</p>
          <div className="nctb-hero-actions">
            <button type="button" className="nctb-primary-action" onClick={() => onCreate('formal')}><ShieldCheck size={17} />{L("开始考试")}<ArrowRight size={16} /></button>
            <button type="button" className="nctb-secondary-action" onClick={onReportCard}><FileText size={16} />{L("能力成绩单")}</button>
            <button type="button" className="nctb-secondary-action" onClick={onHistory}><History size={16} />{L("历史与趋势")}</button>
          </div>
        </div>
        <div className="nctb-hero-orbit" aria-hidden="true">
          <div className="nctb-orbit-ring nctb-orbit-ring-a" />
          <div className="nctb-orbit-ring nctb-orbit-ring-b" />
          <div className="nctb-orbit-core"><BrainCircuit size={34} /><span>EXPLORATION</span><strong>{latestReport?.composite?.score ?? '—'}</strong><small>{latestReport?.composite ? (_en ? 'Composite exploration score' : '综合探索分') : (_en ? 'Awaiting the first report' : '等待首份报告')}</small></div>
        </div>
      </header>

      <section className="nctb-control-bar" aria-label={L("实验室状态")}>
        <div><span>{L("本机报告")}</span><strong>{state.reports.length}</strong></div>
        <div><span>{L("可恢复会话")}</span><strong>{resumable.length}</strong></div>
        <div><span>{L("最近活动")}</span><strong>{latestReport ? formatDate(latestReport.createdAt) : (_en ? 'None yet' : '尚无')}</strong></div>
        <div className="nctb-control-note"><ShieldCheck size={17} /><span>{L("仅保存在本机")}<br /><b>{L("不用于医疗或教育诊断")}</b></span></div>
      </section>

      {state.legacy && (
        <section className="nctb-legacy-note" role="status">
          <History size={18} />
          <div><strong>{L("旧版进度仍被保留")}</strong><p>{L("检测到 v")}{state.legacy.sourceVersion ?? 2} {L("的 ")}{state.legacy.answeredCount} {L("道作答、")}{state.legacy.completedParts} {L("个已完成部分。新版不会把旧选项误算成新报告；旧数据会一直保留到你主动重置。")}</p></div>
        </section>
      )}

      {resumable.length > 0 && (
        <section className="nctb-resume-section" aria-labelledby="nctb-resume-title">
          <div className="nctb-section-heading"><div><p className="nctb-eyebrow">RESUMABLE SESSIONS</p><h2 id="nctb-resume-title">{L("从上次停下的位置继续")}</h2></div><span>{L("题目顺序、选项顺序、当前难度与有效作答都由同一个 seed 恢复。")}</span></div>
          <div className="nctb-session-list">
            {resumable.map((session) => {
              const completion = sessionCompletion(session);
              return <button type="button" key={session.id} onClick={() => onResume(session)} className="nctb-session-card">
                <span className="nctb-session-icon"><Play size={17} /></span>
                <span><small>{L(MODE_LABELS[session.mode])} · {L(STRATEGY_LABELS[session.strategy])}</small><strong>{session.focusDimension === 'all' ? (_en ? 'Full ten-dimension exam' : '十维完整考试') : `${getNctbDimension(session.focusDimension).title}${_en ? ' focused exam' : '专项考试'}`}</strong><i><b style={{ width: `${completion.percentage}%` }} /></i></span>
                <em>{completion.answered} / {completion.required}<ChevronRight size={16} /></em>
              </button>;
            })}
          </div>
        </section>
      )}

      <section className="nctb-dimensions-section" aria-labelledby="nctb-dimensions-title">
        <div className="nctb-section-heading"><div><p className="nctb-eyebrow">THE TEN DIMENSIONS</p><h2 id="nctb-dimensions-title">{L("动态能力图谱")}</h2></div><span>{L("每一维都同时呈现正确率、有效作答时间、难度和 95% 置信区间，不压缩成 IQ。")}</span></div>
        <div className="nctb-parts-grid">
          {DIMS().map((dimension) => {
            const result = latestByDimension.get(dimension.id);
            return <article className="nctb-part-card" key={dimension.id} style={{ '--dimension-accent': dimension.accent } as React.CSSProperties}>
              <span className="nctb-part-index">{dimension.index}</span>
              <span className="nctb-part-status">{result ? <Check size={14} /> : <CircleHelp size={14} />}</span>
              <strong>{dimension.title}</strong><small>{dimension.english} / {dimension.skill}</small><p>{dimension.description}</p>
              <footer><span>{result ? L(`${result.score} 分 · CI ${result.ciLow}–${result.ciHigh}`) : L('等待数据')}</span><span>{_en ? `${questionsRequiredForDimension(dimension.id, 'all', 'formal')} questions` : `考试题 ${questionsRequiredForDimension(dimension.id, 'all', 'formal')} 道`}</span></footer>
            </article>;
          })}
        </div>
      </section>

      <InteractiveTrials onOpenReportCard={onReportCard} />

      <section className="nctb-safety-note"><ShieldCheck size={20} /><div><strong>{L("数据与解释边界")}</strong><p>{L("标准考试只是本地一致化操作，不是受监管或保密的心理测验。综合探索分是十维描述性分数的平均，其中速度维同时考虑正确率与目标用时，只用于回顾个人表现。")}</p></div><button type="button" onClick={onReset}><Trash2 size={13} />{L("重置全部本机数据")}</button></section>
    </>
  );
}

function SetupView({ session, onChange, onStart, onCancel }: {
  session: NctbSession;
  onChange: (patch: Parameters<typeof configureNctbSession>[1]) => void;
  onStart: () => void;
  onCancel: () => void;
}) {
  const required = session.dimensionOrder.reduce((total, id) => total + requiredQuestionsForSessionDimension(session, id), 0);
  const perDimension = questionsRequiredForDimension('pattern', 'all', 'formal');
  const _en = getLocale() === 'en';
  return (
    <section className="nctb-setup" aria-labelledby="nctb-setup-title">
      <button type="button" className="nctb-back-button" onClick={onCancel}><ArrowLeft size={15} />{L("返回实验室")}</button>
      <div className="nctb-workspace-head"><div><p className="nctb-eyebrow">SESSION SETUP</p><h2 id="nctb-setup-title">{L("建立一次可复现的探索会话")}</h2><p>{L("开始后会锁定模式、题库版本、随机 seed 与难度策略。")}</p></div><span className="nctb-mode-badge">SEED / {session.seed.toString(16).toUpperCase()}</span></div>

      <div className="nctb-setup-grid">
        <fieldset className="nctb-setup-card"><legend>{L("01 · 考试模式")}</legend>
          <button type="button" className="is-active" disabled><span><ShieldCheck size={18} /></span><div><strong>{L("标准考试")}</strong><p>{L("全部题目统一作为考试题；整套完成后统一反馈，不显示提示、解释或单题对错。")}</p></div><Check size={16} /></button>
        </fieldset>
        <fieldset className="nctb-setup-card"><legend>{L("02 · 选题策略")}</legend>
          {(['fixed', 'adaptive'] as const).map((strategy) => <button type="button" key={strategy} disabled={strategy === 'adaptive'} className={session.strategy === strategy ? 'is-active' : ''} onClick={() => onChange({ strategy })}><span>{strategy === 'fixed' ? <Target size={18} /> : <Zap size={18} />}</span><div><strong>{L(STRATEGY_LABELS[strategy])}</strong><p>{strategy === 'fixed'
            ? (_en ? 'Questions are ordered by target difficulty first, and the actual difficulty is fully recorded.' : '题库按目标难度优先排序，并完整记录实际难度。')
            : (_en ? 'Opens once the item bank is expanded and calibrated; the current bank does not pretend to be a valid adaptive test.' : '题量扩充并完成标定后开放；当前题库不伪装成有效自适应测试。')}</p></div><Check size={16} /></button>)}
        </fieldset>
      </div>

      <div className="nctb-setup-options">
        {session.strategy === 'fixed' && <label><span>{L("固定难度")}</span><div className="nctb-difficulty-picker">{([1, 2, 3, 4, 5] as const).map((difficulty) => <button type="button" key={difficulty} className={session.fixedDifficulty === difficulty ? 'is-active' : ''} onClick={() => onChange({ fixedDifficulty: difficulty })}>{difficulty}</button>)}</div><small>{L("1 为入门，5 为最高。报告会记录实际题目难度。")}</small></label>}
        <label className="nctb-friendly-option"><span>{L("友好停靠模式")}</span><button type="button" role="switch" disabled aria-checked={false}><i /></button><small>{L("考试按每维 ")}{perDimension} {L("道题完整进行；友好停靠仍会在规则成熟后再开放。")}</small></label>
      </div>

      <div className="nctb-protocol-card"><ShieldCheck size={22} /><div><strong>{L("开始前须知")}</strong><ul><li>{L("只记录页面可见且会话处于 active 时的有效用时；暂停、切到后台和刷新等待不累计。")}</li><li>{L("标准考试完成前不反馈单题对错，也不会显示提示或允许重新作答。")}</li><li>{L("当前是纯前端本地评分，答案键仍可能被高级用户从客户端资源读取；“标准考试”不代表保密考试。")}</li><li>{L("结果是本地探索指标，不提供医疗、心理、智力或教育诊断。")}</li></ul></div></div>
      <div className="nctb-setup-summary"><div><span>{L("预计作答")}</span><strong>{required} {L("题")}</strong></div><div><span>{L("维度覆盖")}</span><strong>{session.dimensionOrder.length} / 10</strong></div><div><span>{L("题库版本")}</span><strong>v{session.bankVersion}</strong></div><button type="button" className="nctb-primary-action" onClick={onStart}><Play size={16} />{L("锁定设置并开始")}<ArrowRight size={15} /></button></div>
    </section>
  );
}

function ActiveRunner({
  session,
  onAnswer,
  onAdvance,
  onPause,
  onMarkStimulus,
}: {
  session: NctbSession;
  onAnswer: (optionId: string) => void;
  onAdvance: () => void;
  onPause: () => void;
  onMarkStimulus: () => void;
}) {
  const question = getNctbQuestion(session.mode, session.currentItemId, session.bankId, getLocale());
  const dimensionId = currentDimensionId(session);
  const dimension = getNctbDimension(dimensionId);
  const response = currentResponse(session);
  const options = orderedQuestionOptions(session, getLocale());
  const answeredInDimension = effectiveResponses(session).filter((item) => item.dimensionId === dimensionId).length;
  const required = requiredQuestionsForSessionDimension(session, dimensionId);
  const questionNumber = Math.min(required, response ? answeredInDimension : answeredInDimension + 1);
  const completion = sessionCompletion(session);
  const [revealUntil, setRevealUntil] = useState<number | null>(null);
  const [revealNow, setRevealNow] = useState(() => Date.now());
  const memoryShowing = Boolean(revealUntil && revealUntil > revealNow);
  const memoryReady = question?.kind !== 'memory' || session.currentStimulusSeen && !memoryShowing;

  useEffect(() => {
    if (!revealUntil) return;
    const interval = window.setInterval(() => setRevealNow(Date.now()), 100);
    const timeout = window.setTimeout(() => {
      setRevealNow(Date.now());
      setRevealUntil(null);
    }, Math.max(0, revealUntil - Date.now()));
    return () => { window.clearInterval(interval); window.clearTimeout(timeout); };
  }, [revealUntil]);

  useEffect(() => {
    if (!question || response || !memoryReady) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      const option = options[Number(event.key) - 1];
      if (!option) return;
      event.preventDefault();
      onAnswer(option.id);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [memoryReady, onAnswer, options, question, response]);

  if (!question) return <div className="nctb-empty-state"><CircleHelp size={28} /><h2>{L("无法恢复当前题目")}</h2><p>{L("题库版本与会话不匹配。请返回实验室新建会话，旧作答仍保留在本机。")}</p></div>;

  const revealStimulus = () => {
    onMarkStimulus();
    const until = Date.now() + (question.revealMs ?? 3_500);
    setRevealNow(Date.now());
    setRevealUntil(until);
  };
  return (
    <section className="nctb-runner" aria-labelledby="nctb-question-title">
      <header className="nctb-runner-header">
        <div><p className="nctb-eyebrow">CURRENT MODULE / {dimension.index}</p><h2>{dimension.title}</h2><span>{dimension.description}</span></div>
        <div className="nctb-runner-metrics"><span><Clock3 size={14} />{L("有效用时 ")}<b>{formatDuration(session.activeMs)}</b></span><span><Gauge size={14} />{L("难度 ")}<b>{question.difficulty} / 5</b></span><button type="button" onClick={onPause}><Pause size={14} />{L("暂停")}</button></div>
      </header>
      <div className="nctb-progress-panel"><div><span>{L("总进度 ")}{completion.answered} / {completion.required}</span><b>{completion.percentage}%</b></div><div className="nctb-progress-track" role="progressbar" aria-label={L("整套作答进度")} aria-valuemin={0} aria-valuemax={100} aria-valuenow={completion.percentage}><i style={{ width: `${completion.percentage}%` }} /></div></div>

      <div className="nctb-question-card">
        <div className="nctb-question-meta"><span>QUESTION {String(questionNumber).padStart(2, '0')} / {required}</span><span>{L(MODE_LABELS[session.mode])} · {L(STRATEGY_LABELS[session.strategy])}</span></div>
        {question.kind === 'memory' && !session.currentStimulusSeen && <div className="nctb-memory-ready"><BrainCircuit size={28} /><h3>{L("准备查看记忆序列")}</h3><p>{L("点击后序列只显示约 ")}{((question.revealMs ?? 3_500) / 1_000).toFixed(1)} {L("秒。切到后台不会继续累计有效用时。")}</p><button type="button" className="nctb-primary-action" onClick={revealStimulus}><Play size={15} />{L("显示序列")}</button></div>}
        {question.kind === 'memory' && memoryShowing && <div className="nctb-memory-stimulus" role="timer"><span>{L("请记住")}</span><strong>{question.stimulus}</strong><small>{Math.max(0, ((revealUntil ?? 0) - revealNow) / 1_000).toFixed(1)} {L("秒")}</small></div>}
          {memoryReady && <>
           {question.stimulus && question.kind !== 'memory' && <pre className="nctb-question-stimulus">{question.stimulus}</pre>}
           <h3 id="nctb-question-title">{question.prompt}</h3>
           <div className="nctb-options">{options.map((option, index) => {
             const selected = response?.optionId === option.id;
             const responseClass = !response ? '' : selected ? 'is-selected' : '';
             return <button type="button" key={option.id} className={responseClass} onClick={() => onAnswer(option.id)} disabled={Boolean(response)} aria-pressed={selected}><span>{index + 1}</span>{option.label}</button>;
           })}</div>
           {response && <div className="nctb-answer-feedback is-formal" role="status"><ShieldCheck size={17} /><span><strong>{L("答案已锁定")}</strong>{L("单题对错将在整套考试结束后汇总。")}</span></div>}
           <footer className="nctb-challenge-footer"><span>{L("本题有效用时 ")}{formatDuration(session.currentItemActiveMs)} {L("· 目标参考 ")}{formatDuration(question.targetMs)}</span><div>{response && <button type="button" className="is-primary" onClick={onAdvance}>{answeredInDimension >= required ? L('完成本部分') : L('下一题')}<ArrowRight size={13} /></button>}</div></footer>
        </>}
      </div>
      <p className="nctb-keyboard-note">{L("键盘提示：题目出现后可按 1–4 选择答案。考试模式不显示提示，也不允许重试。")}</p>
    </section>
  );
}

function PausedView({ session, onResume, onDashboard }: { session: NctbSession; onResume: () => void; onDashboard: () => void }) {
  const nextDimension = getNctbDimension(currentDimensionId(session));
  const _en = getLocale() === 'en';
  const copy = session.pauseReason === 'section-break'
    ? { title: _en ? 'Previous section complete' : '上一部分已完成', detail: _en ? `Next up is "${nextDimension.title}". Rest breaks do not count active time.` : `下一部分是“${nextDimension.title}”。休息不会累计有效用时。`, icon: <Check size={28} /> }
    : session.pauseReason === 'friendly-break'
      ? { title: _en ? 'Friendly dock point' : '友好停靠点', detail: _en ? 'You have completed three questions in a row. Continue now, or resume later from the same seed.' : '已经连续完成三题。可以现在继续，也可以稍后从同一个 seed 恢复。', icon: <Sparkles size={28} /> }
      : { title: _en ? 'Session paused' : '会话已暂停', detail: _en ? 'Background time and pause time do not count toward activeMs.' : '页面后台时间和暂停时间不会计入 activeMs。', icon: <Pause size={28} /> };
  return <section className="nctb-pause-view"><div className="nctb-pause-icon">{copy.icon}</div><p className="nctb-eyebrow">PAUSED / LOCAL CHECKPOINT</p><h2>{copy.title}</h2><p>{copy.detail}</p><div><button type="button" className="nctb-primary-action" onClick={onResume}><Play size={15} />{L("继续考试")}</button><button type="button" className="nctb-secondary-action" onClick={onDashboard}>{L("返回实验室")}</button></div></section>;
}

function CompletedView({ session, report, persisted, onOpen, onDashboard }: { session: NctbSession; report?: NctbReport; persisted: boolean; onOpen: () => void; onDashboard: () => void }) {
  const answered = report?.totalAnswered ?? effectiveResponses(session).length;
  const _en = getLocale() === 'en';
  return <section className="nctb-completed-view"><div className="nctb-complete-mark"><Check size={34} /></div><p className="nctb-eyebrow">EXAM COMPLETED</p><h2>{persisted ? (_en ? 'This exam has been fully saved' : '本次考试已经完整保存') : (_en ? 'The exam is complete, but it could not be written to local storage' : '本次考试已完成，但未能写入本机存储')}</h2><p>{persisted
    ? (_en ? `${answered} valid answers recorded; timing, difficulty, confidence intervals and exam advice have been written to the local report.` : `共记录 ${answered} 道有效作答，计时、难度、置信区间和考试建议已写入本机报告。`)
    : (_en ? `${answered} valid answers are still held in this page; please export the report now, as this data may be lost after closing or refreshing.` : `当前页面仍保留 ${answered} 道有效作答；请立即导出报告，关闭或刷新页面后这些数据可能丢失。`)}</p><div><button type="button" className="nctb-primary-action" onClick={onOpen} disabled={!report}><BarChart3 size={16} />{L("查看完整报告")}<ArrowRight size={15} /></button><button type="button" className="nctb-secondary-action" onClick={onDashboard}>{L("返回实验室")}</button></div></section>;
}

function ReportView({
  report,
  session,
  onBack,
  onRetest,
}: {
  report: NctbReport;
  session?: NctbSession;
  onBack: () => void;
  onRetest: () => void;
}) {
  const radarData = DIMS().map((dimension) => ({
    dimension: dimension.title,
    score: report.dimensions.find((result) => result.dimensionId === dimension.id)?.score ?? 0,
  }));
  const reportJson = JSON.stringify({
    schema: 'nctb-local-report/v1',
    disclaimer: '本报告仅用于个人探索，不用于医疗、心理、智力或教育诊断。',
    report,
    session: session ? { ...session, candidateOrderByDimension: undefined } : undefined,
  }, null, 2);
  const exportJson = () => downloadText(`${reportFileStem(report)}.json`, reportJson, 'application/json;charset=utf-8');
  const exportCsv = () => downloadText(`${reportFileStem(report)}.csv`, `\ufeff${reportToCsv(report)}`, 'text/csv;charset=utf-8');
  return (
    <section className="nctb-report" aria-labelledby="nctb-report-title">
      <div className="nctb-report-toolbar"><button type="button" className="nctb-back-button" onClick={onBack}><ArrowLeft size={15} />{L("返回")}</button><div><button type="button" onClick={exportJson}><FileJson size={14} />JSON</button><button type="button" onClick={exportCsv}><Download size={14} />CSV</button><button type="button" onClick={() => window.print()}><Printer size={14} />{L("打印 / PDF")}</button></div></div>
      <header className="nctb-report-hero"><div><p className="nctb-eyebrow">LOCAL EXPLORATION REPORT</p><h2 id="nctb-report-title">{L("NCTB 本地探索报告")}</h2><p>{formatDate(report.createdAt)} · {L(MODE_LABELS[report.mode])} · {L(STRATEGY_LABELS[report.strategy])}{report.friendlyMode ? L(' · 启动友好模式') : ''}</p></div><div className="nctb-report-score"><span>{report.composite ? L('综合探索分') : L('专项报告')}</span><strong>{report.composite?.score ?? report.dimensions[0]?.score ?? '—'}</strong><small>{report.composite ? L(`${report.composite.coverage} 个维度的描述性汇总`) : L(`${report.dimensions.length} 个维度有数据`)}</small></div></header>
      <div className="nctb-report-stat-grid"><div><span>{L("有效作答")}</span><strong>{report.totalAnswered}</strong></div><div><span>{L("正确")}</span><strong>{report.totalCorrect}</strong></div><div><span>{L("有效用时")}</span><strong>{formatDuration(report.totalActiveMs)}</strong></div><div><span>{L("中断次数")}</span><strong>{report.interruptionCount}</strong></div></div>

      <div className="nctb-report-grid">
        <article className="nctb-chart-card"><header><div><p className="nctb-eyebrow">TEN-DIMENSION PROFILE</p><h3>{L("十维能力轮廓")}</h3></div><span>{L("0–100 描述性分数")}</span></header><div className="nctb-radar-chart" aria-label={L("十维能力雷达图")}><ResponsiveContainer width="100%" height="100%"><RadarChart data={radarData} outerRadius="72%"><PolarGrid stroke="rgba(255,255,255,.15)" /><PolarAngleAxis dataKey="dimension" tick={{ fill: '#b8cecc', fontSize: 11 }} /><Radar dataKey="score" stroke="#74efe0" fill="#74efe0" fillOpacity={0.24} strokeWidth={2} /><Tooltip contentStyle={{ background: '#0c1820', border: '1px solid rgba(116,239,224,.25)', borderRadius: 12 }} /></RadarChart></ResponsiveContainer></div><p>{L("雷达图只是视觉摘要；下方每一维的样本量与区间更重要。")}</p></article>
        <article className="nctb-recommendation-card"><header><p className="nctb-eyebrow">NEXT EXAM</p><h3>{L("下一次考试建议")}</h3></header><p>{L("所有题目都属于标准考试题。下一次完整考试仍会覆盖十个维度和全部 50 道题，下面的维度可作为回顾重点。")}</p><div className="nctb-recommendation-list">{report.focusAreas.map((dimensionId) => { const dimension = getNctbDimension(dimensionId); return <div key={dimensionId}><span style={{ background: dimension.accent }} /><div><strong>{dimension.title}</strong><small>{L("下一次考试继续观察")}</small></div></div>; })}</div><button type="button" className="nctb-retest-button" onClick={onRetest}><RefreshCw size={14} />{L("重新开始考试")}</button></article>
      </div>

      <section className="nctb-result-list" aria-labelledby="nctb-result-list-title"><div className="nctb-section-heading"><div><p className="nctb-eyebrow">DIMENSION DETAILS</p><h2 id="nctb-result-list-title">{L("每一维的证据")}</h2></div><span>{L("Wilson 区间只描述正确率的不确定性，不是综合分的置信区间；不同设置下的结果不应当作同一标准量表比较。")}</span></div><div>{report.dimensions.map((result) => { const dimension = dimOf(result.dimensionId); return <article key={result.dimensionId} style={{ '--dimension-accent': dimension.accent } as React.CSSProperties}><header><span>{dimension.index}</span><div><strong>{dimension.title}</strong><small>{dimension.english}</small></div><b>{result.score}</b></header><div className="nctb-result-track"><i style={{ width: `${result.score}%` }} /><span style={{ left: `${result.ciLow}%`, width: `${Math.max(1, result.ciHigh - result.ciLow)}%` }} /></div><footer><span>{result.correct} / {result.answered} {L("正确 · ")}{result.accuracy}%</span><span>{L("正确率 95% CI ")}{result.ciLow}–{result.ciHigh}</span><span>{L("中位用时 ")}{formatDuration(result.medianActiveMs)}</span><span>{result.scoreModel === 'speed-accuracy' ? L('分数含 25% 目标用时权重') : L(`平均难度 ${result.averageDifficulty}`)}</span></footer></article>; })}</div></section>
      <aside className="nctb-report-disclaimer"><ShieldCheck size={19} /><p><strong>{L("解释边界：")}</strong>{L("综合探索分是十维描述性分数的平均；速度维含 25% 目标用时权重，其余维度使用平滑正确率。它不是 FSIQ，尚未经过心理测量标定，也没有调用角色世界观使用的 FSIII 公式。")}</p></aside>
    </section>
  );
}

function HistoryView({ reports, onBack, onOpen }: { reports: NctbReport[]; onBack: () => void; onOpen: (report: NctbReport) => void }) {
  const [dimensionId, setDimensionId] = useState<NctbDimensionId>('pattern');
  const ordered = useMemo(() => [...reports].sort((left, right) => left.createdAt.localeCompare(right.createdAt)), [reports]);
  const trendData = ordered.flatMap((report) => {
    const result = report.dimensions.find((item) => item.dimensionId === dimensionId);
    return result ? [{ date: new Date(report.createdAt).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' }), score: result.score, low: result.ciLow, high: result.ciHigh }] : [];
  });
  return <section className="nctb-history" aria-labelledby="nctb-history-title"><button type="button" className="nctb-back-button" onClick={onBack}><ArrowLeft size={15} />{L("返回实验室")}</button><div className="nctb-section-heading"><div><p className="nctb-eyebrow">LOCAL HISTORY</p><h2 id="nctb-history-title">{L("历史报告与趋势")}</h2></div><span>{L("趋势只比较同一维度；模式、策略和友好设置会保留在每份报告上。")}</span></div>
    {reports.length === 0 ? <div className="nctb-empty-state"><History size={28} /><h3>{L("还没有历史报告")}</h3><p>{L("完成一次标准考试后，趋势会出现在这里。")}</p></div> : <>
      <article className="nctb-trend-card"><header><div><p className="nctb-eyebrow">SCORE TREND</p><h3>{dimOf(dimensionId).title}{L("趋势")}</h3></div><label>{L("选择维度")}<select value={dimensionId} onChange={(event) => setDimensionId(event.target.value as NctbDimensionId)}>{DIMS().map((dimension) => <option value={dimension.id} key={dimension.id}>{dimension.title}</option>)}</select></label></header><div><ResponsiveContainer width="100%" height="100%"><LineChart data={trendData} margin={{ top: 15, right: 20, left: -15, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.08)" strokeDasharray="4 4" /><XAxis dataKey="date" tick={{ fill: '#92acab', fontSize: 11 }} /><YAxis domain={[0, 100]} tick={{ fill: '#92acab', fontSize: 11 }} /><Tooltip contentStyle={{ background: '#0c1820', border: '1px solid rgba(116,239,224,.25)', borderRadius: 12 }} /><Line type="monotone" dataKey="score" name={L("探索分")} stroke="#74efe0" strokeWidth={2.5} dot={{ r: 4, fill: '#74efe0' }} /></LineChart></ResponsiveContainer></div>{trendData.length < 2 && <p>{L("需要至少两份包含该维度的报告才能形成趋势线。")}</p>}</article>
      <div className="nctb-history-list">{[...reports].sort((left, right) => right.createdAt.localeCompare(left.createdAt)).map((report) => <button type="button" key={report.id} onClick={() => onOpen(report)}><span className="nctb-history-score">{report.composite?.score ?? report.dimensions[0]?.score ?? '—'}</span><span><small>{L(MODE_LABELS[report.mode])} · {L(STRATEGY_LABELS[report.strategy])}{report.friendlyMode ? L(' · 友好') : ''}</small><strong>{report.focusDimension === 'all' ? L('十维探索报告') : L(`${dimOf(report.focusDimension).title}专项报告`)}</strong><em>{formatDate(report.createdAt)} · {report.totalAnswered} {L("题 · ")}{formatDuration(report.totalActiveMs)}</em></span><ChevronRight size={17} /></button>)}</div>
    </>}
  </section>;
}

function ResetDialog({ onCancel, onConfirm }: { onCancel: () => void; onConfirm: () => void }) {
  return <div className="nctb-dialog-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}><section className="nctb-dialog" role="alertdialog" aria-modal="true" aria-labelledby="nctb-reset-title" aria-describedby="nctb-reset-description"><button type="button" className="nctb-dialog-close" onClick={onCancel} aria-label={L("关闭")}><X size={16} /></button><Trash2 size={24} /><h2 id="nctb-reset-title">{L("重置全部本机 NCTB 数据？")}</h2><p id="nctb-reset-description">{L("这会删除新版会话、报告、趋势和保留的旧版 v2 进度。导出的 JSON / CSV 文件不会受影响。")}</p><div><button type="button" onClick={onCancel}>{L("取消")}</button><button type="button" className="is-danger" onClick={onConfirm}>{L("确认删除")}</button></div></section></div>;
}

export default function NctbPage() {
  const [store, setStoreState] = useState<NctbState>(() => loadNctbState());
  const storeRef = useRef(store);
  const finalizingRef = useRef(new Set<string>());
  const [screen, setScreen] = useState<PageScreen>('dashboard');
  const [viewingReportId, setViewingReportId] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [persistenceSucceeded, setPersistenceSucceeded] = useState(true);

  const commitStore = useCallback((next: NctbState) => {
    storeRef.current = next;
    setStoreState(next);
    setPersistenceSucceeded(saveNctbState(next));
  }, []);

  const commitSession = useCallback((sessionId: string, updater: (session: NctbSession) => NctbSession, makeActive = true): NctbSession | undefined => {
    const currentStore = storeRef.current;
    const current = currentStore.sessions.find((session) => session.id === sessionId);
    if (!current) return undefined;
    const nextSession = updater(current);
    commitStore(putNctbSession(currentStore, nextSession, makeActive));
    return nextSession;
  }, [commitStore]);

  const activeSession = store.activeSessionId ? store.sessions.find((session) => session.id === store.activeSessionId) : undefined;
  const activeSessionId = activeSession?.id;
  const activeSessionPhase = activeSession?.phase;
  const activeReport = store.reports.find((report) => report.id === (viewingReportId || activeSession?.reportId));

  const finalizeCompletedSession = useCallback((sessionId: string) => {
    const currentStore = storeRef.current;
    const saved = currentStore.sessions.find((session) => session.id === sessionId);
    if (!saved || !['completed', 'report'].includes(saved.phase) || finalizingRef.current.has(sessionId)) return;
    if (saved.reportId && saved.completionEventId) return;
    finalizingRef.current.add(sessionId);
    let nextSession = saved;
    const report = currentStore.reports.find((item) => item.sessionId === sessionId) ?? scoreNctbSession(saved);
    if (!saved.completionEventId) {
      const event = levelSystem.applyEvent({
        eventType: 'complete-test',
        reason: 'Completed a local NCTB standard-flow session.',
        triggeredBy: saved.id,
        explorationId: 'nctb',
        explorationDelta: 10,
        metadata: { sessionId: saved.id, reportId: report.id },
      });
      nextSession = { ...nextSession, completionEventId: event.id };
    }
    nextSession = { ...nextSession, reportId: report.id, updatedAt: new Date().toISOString() };
    const withReport = putNctbReport(currentStore, report);
    commitStore(putNctbSession(withReport, nextSession, true));
    finalizingRef.current.delete(sessionId);
  }, [commitStore]);

  useEffect(() => {
    if (activeSession && ['completed', 'report'].includes(activeSession.phase) && (!activeSession.reportId || !activeSession.completionEventId)) {
      finalizeCompletedSession(activeSession.id);
    }
  }, [activeSession, finalizeCompletedSession]);

  useEffect(() => {
    if (!activeSessionId || activeSessionPhase !== 'active') return;
    const sessionId = activeSessionId;
    let lastTick = performance.now();
    const tick = () => {
      const now = performance.now();
      if (document.visibilityState === 'visible') commitSession(sessionId, (session) => accrueActiveTime(session, now - lastTick));
      lastTick = now;
    };
    const interval = window.setInterval(tick, 1_000);
    const onVisibility = () => {
      const now = performance.now();
      if (document.visibilityState === 'hidden') commitSession(sessionId, (session) => accrueActiveTime(session, now - lastTick));
      lastTick = now;
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => { window.clearInterval(interval); document.removeEventListener('visibilitychange', onVisibility); };
  }, [activeSessionId, activeSessionPhase, commitSession]);

  const createSession = () => {
    const session = createNctbSession();
    commitStore(putNctbSession(storeRef.current, session, true));
    setViewingReportId('');
    setScreen('session');
  };
  const resumeSession = (session: NctbSession) => {
    commitStore(setActiveNctbSession(storeRef.current, session.id));
    setViewingReportId(session.reportId ?? '');
    setScreen('session');
  };
  const openHistoryReport = (report: NctbReport) => {
    const session = storeRef.current.sessions.find((item) => item.id === report.sessionId);
    if (session) {
      const reportSession = openNctbReport(session);
      commitStore(putNctbSession(storeRef.current, reportSession, true));
    }
    setViewingReportId(report.id);
    setScreen('session');
  };
  const backToDashboard = () => {
    setViewingReportId('');
    setScreen('dashboard');
  };
  const resetAll = () => {
    const next = clearNctbState();
    storeRef.current = next;
    setStoreState(next);
    setViewingReportId('');
    setShowReset(false);
    setScreen('dashboard');
  };

  let sessionContent: React.ReactNode = null;
  if (screen === 'session' && activeReport && (viewingReportId || activeSession?.phase === 'report')) {
    sessionContent = <ReportView report={activeReport} session={activeSession} onBack={backToDashboard} onRetest={createSession} />;
  } else if (screen === 'session' && activeSession?.phase === 'setup') {
    sessionContent = <SetupView session={activeSession} onChange={(patch) => commitSession(activeSession.id, (session) => configureNctbSession(session, patch))} onStart={() => commitSession(activeSession.id, startNctbSession)} onCancel={backToDashboard} />;
  } else if (screen === 'session' && activeSession?.phase === 'active') {
    sessionContent = <ActiveRunner key={activeSession.currentItemId} session={activeSession} onAnswer={(optionId) => commitSession(activeSession.id, (session) => answerCurrentQuestion(session, optionId))} onAdvance={() => commitSession(activeSession.id, advanceNctbSession)} onPause={() => commitSession(activeSession.id, pauseNctbSession)} onMarkStimulus={() => commitSession(activeSession.id, markCurrentStimulusSeen)} />;
  } else if (screen === 'session' && activeSession?.phase === 'paused') {
    sessionContent = <PausedView session={activeSession} onResume={() => commitSession(activeSession.id, resumeNctbSession)} onDashboard={backToDashboard} />;
  } else if (screen === 'session' && activeSession && ['completed', 'report'].includes(activeSession.phase)) {
    sessionContent = <CompletedView session={activeSession} report={store.reports.find((report) => report.sessionId === activeSession.id)} persisted={persistenceSucceeded} onOpen={() => { commitSession(activeSession.id, openNctbReport); setViewingReportId(activeSession.reportId ?? ''); }} onDashboard={backToDashboard} />;
  }

  return (
    <div className="nctb-page aurora-ui" data-aurora-accent="math">
      <div className="nctb-shell">
        {screen === 'dashboard' && <Dashboard state={store} onCreate={createSession} onResume={resumeSession} onHistory={() => setScreen('history')} onReportCard={() => setScreen('reportcard')} onReset={() => setShowReset(true)} />}
        {screen === 'history' && <HistoryView reports={store.reports} onBack={backToDashboard} onOpen={openHistoryReport} />}
        {screen === 'reportcard' && <ReportCard report={[...store.reports].sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0]} onBack={backToDashboard} />}
        {screen === 'session' && (sessionContent ?? <div className="nctb-empty-state"><CircleHelp size={28} /><h2>{L("没有可显示的会话")}</h2><button type="button" className="nctb-primary-action" onClick={backToDashboard}>{L("返回实验室")}</button></div>)}
        {screen !== 'session' && <footer className="nctb-page-footer"><span>{L("NCTB 数据不会自动发送到服务器。")}</span><Link to="/chat/ocean?mode=nctb-proctor&prompt=NCTB%E6%B5%81%E7%A8%8B%E8%AF%B4%E6%98%8E%EF%BC%9A%E8%AF%B7%E5%8F%AA%E8%A7%A3%E9%87%8A%E6%93%8D%E4%BD%9C%E3%80%81%E6%9A%82%E5%81%9C%E5%92%8C%E9%9A%90%E7%A7%81%E8%A7%84%E5%88%99%EF%BC%8C%E4%B8%8D%E8%A6%81%E6%8F%90%E7%A4%BA%E7%AD%94%E6%A1%88%E3%80%82"><BrainCircuit size={14} />{L("在星海对话查看流程说明")}<ArrowRight size={13} /></Link></footer>}
      </div>
      {showReset && <ResetDialog onCancel={() => setShowReset(false)} onConfirm={resetAll} />}
    </div>
  );
}
