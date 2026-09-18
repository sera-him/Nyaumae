import { useCallback, useEffect, useState } from 'react';
import { Check, FileText, Grid3x3, Hash, Layers, Palette, Play, RotateCw, Search, Trophy, X, Zap } from 'lucide-react';
import { L } from '@/lib/translations/manual';
import { getNctbDimension } from '@/nctb/catalog';
import { PRIMARY_INDICES } from '@/nctb/indices';
import { TRIAL_TASK_COMPONENTS } from './tasks.tsx';
import {
  getTrialTask,
  loadTrialRecords,
  recordTrialResult,
  saveTrialRecords,
  TRIAL_TASKS,
  type TrialRecords,
  type TrialResult,
  type TrialTaskId,
} from './trials.ts';

const TRIAL_ICONS: Record<TrialTaskId, typeof Zap> = {
  reaction: Zap,
  'memory-matrix': Grid3x3,
  stroop: Palette,
  rotation: RotateCw,
  hanoi: Layers,
  'visual-search': Search,
  'digit-span': Hash,
  coding: FileText,
  'symbol-search': Search,
};

type OverlayStage = 'intro' | 'running' | 'result';

export default function InteractiveTrials({ onOpenReportCard }: { onOpenReportCard?: () => void }) {
  const [records, setRecords] = useState<TrialRecords>(() => loadTrialRecords());
  const [activeId, setActiveId] = useState<TrialTaskId | null>(null);
  const [stage, setStage] = useState<OverlayStage>('intro');
  const [result, setResult] = useState<TrialResult | null>(null);
  const [runKey, setRunKey] = useState(0);

  const activeTask = activeId ? getTrialTask(activeId) : null;
  const ActiveComponent: (typeof TRIAL_TASK_COMPONENTS)[TrialTaskId] | null = activeId ? TRIAL_TASK_COMPONENTS[activeId] : null;

  const openTask = (id: TrialTaskId) => {
    setActiveId(id);
    setStage('intro');
    setResult(null);
  };

  const closeOverlay = useCallback(() => {
    setActiveId(null);
    setStage('intro');
    setResult(null);
  }, []);

  useEffect(() => {
    if (!activeId) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlay();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeId, closeOverlay]);

  const handleFinish = useCallback((trialResult: TrialResult) => {
    setActiveId((currentId) => {
      if (currentId) {
        setRecords((currentRecords) => {
          const next = recordTrialResult(currentRecords, currentId, trialResult);
          saveTrialRecords(next);
          return next;
        });
      }
      return currentId;
    });
    setResult(trialResult);
    setStage('result');
  }, []);

  const runAgain = () => {
    setResult(null);
    setRunKey((key) => key + 1);
    setStage('running');
  };

  return (
    <section className="nctb-trials-section" aria-labelledby="nctb-trials-title">
      <div className="nctb-section-heading">
        <div>
          <p className="nctb-eyebrow">INTERACTIVE SUBTESTS</p>
          <h2 id="nctb-trials-title">{L('互动分测验')}</h2>
        </div>
        <span>{L('仿照韦氏智力量表的分测验结构：每个指数提供若干互动分测验，任选其一完成即可计入该指数，全部成绩只保存在本机，并汇入 FSIQ 风格成绩单。')}</span>
      </div>

      {PRIMARY_INDICES.map((index) => {
        const tasks = TRIAL_TASKS.filter((task) => task.indexId === index.id);
        const completedCount = tasks.filter((task) => records[task.id]).length;
        return (
          <div className="nctb-trial-group" key={index.id} style={{ '--trial-accent': index.accent } as React.CSSProperties}>
            <header className="nctb-trial-group-head">
              <span className="nctb-trial-group-code">{index.code}</span>
              <div>
                <strong>{L(index.title)}</strong>
                <small>{index.english}</small>
              </div>
              <p>{L(index.description)}</p>
              <span className="nctb-trial-group-badge">
                {tasks.length > 1 ? L(`${tasks.length} 选 1`) : tasks.length === 1 ? L('1 项分测验') : L('由考试维度覆盖')}
              </span>
              <span className={`nctb-trial-group-status ${completedCount > 0 ? 'is-done' : ''}`}>
                {completedCount > 0 ? <><Check size={13} />{L('已计入')}</> : L('未挑战')}
              </span>
            </header>
            {tasks.length > 0 && (
              <div className="nctb-trials-grid">
                {tasks.map((task) => {
                  const record = records[task.id];
                  const Icon = TRIAL_ICONS[task.id];
                  return (
                    <button
                      type="button"
                      key={task.id}
                      className="nctb-trial-card"
                      style={{ '--trial-accent': task.accent } as React.CSSProperties}
                      onClick={() => openTask(task.id)}
                    >
                      <span className="nctb-trial-topline">
                        <span className="nctb-trial-index">{task.index}</span>
                        <span className="nctb-trial-icon"><Icon size={17} /></span>
                      </span>
                      <strong>{L(task.title)}</strong>
                      <small>{task.english} / {L(getNctbDimension(task.dimensionId).title)}</small>
                      <p>{L(task.tagline)}</p>
                      <footer>
                        <span>{record ? L(`最佳 ${record.bestScore} 分 · ${record.attempts} 次`) : L('尚未挑战')}</span>
                        <span className="nctb-trial-go"><Play size={12} />{L('开始')}</span>
                      </footer>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {onOpenReportCard && (
        <button type="button" className="nctb-reportcard-link" onClick={onOpenReportCard}>
          <FileText size={16} />
          <span><strong>{L('查看 FSIQ 风格成绩单')}</strong><small>{L('汇总考试维度与互动分测验，生成指数标准分与综合标准分')}</small></span>
        </button>
      )}

      {activeTask && (
        <div className="nctb-trial-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}>
          <section
            className="nctb-trial-panel"
            role="dialog"
            aria-modal="true"
            aria-labelledby="nctb-trial-title"
            style={{ '--trial-accent': activeTask.accent } as React.CSSProperties}
          >
            <header className="nctb-trial-panel-head">
              <div>
                <p className="nctb-eyebrow">{activeTask.index} / {activeTask.english}</p>
                <h3 id="nctb-trial-title">{L(activeTask.title)}</h3>
              </div>
              <span className="nctb-trial-dimension">{L(getNctbDimension(activeTask.dimensionId).title)}</span>
              <button type="button" className="nctb-dialog-close" onClick={closeOverlay} aria-label={L('关闭')}><X size={16} /></button>
            </header>

            {stage === 'intro' && (
              <div className="nctb-trial-intro">
                <ol>
                  {activeTask.instructions.map((line) => <li key={line}>{L(line)}</li>)}
                </ol>
                <p>{L('分测验成绩只保存在本机，可反复挑战刷新最佳分；同一指数内任选其一完成即可计入成绩单。')}</p>
                <button type="button" className="nctb-primary-action" onClick={() => setStage('running')}>
                  <Play size={15} />{L('开始分测验')}
                </button>
              </div>
            )}

            {stage === 'running' && ActiveComponent && (
              <div className="nctb-trial-stage">
                <ActiveComponent key={`${activeTask.id}:${runKey}`} onFinish={handleFinish} />
              </div>
            )}

            {stage === 'result' && result && (
              <div className="nctb-trial-result">
                <div className="nctb-trial-score-ring">
                  <Trophy size={18} />
                  <strong>{result.score}</strong>
                  <span>{L('试炼分')}</span>
                </div>
                <h4>{result.headline}</h4>
                <p>{result.detail}</p>
                {records[activeTask.id] && (
                  <small>{L(`历史最佳 ${records[activeTask.id]?.bestScore ?? result.score} 分 · 已挑战 ${records[activeTask.id]?.attempts ?? 1} 次`)}</small>
                )}
                <div>
                  <button type="button" className="nctb-primary-action" onClick={runAgain}><RotateCw size={14} />{L('再来一次')}</button>
                  <button type="button" className="nctb-secondary-action" onClick={closeOverlay}>{L('返回分测验')}</button>
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </section>
  );
}
