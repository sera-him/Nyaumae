import { useMemo } from 'react';
import { ArrowLeft, Award, FileJson, Printer, ShieldCheck, Sparkles, TrendingDown, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';
import { L } from '@/lib/translations/manual';
import { getNctbDimension } from '@/nctb/catalog';
import { characters } from '@/data/characters';
import { calculateFsiii } from '@/lib/fsiii';
import { getTier } from '@/lib/fsiiiTiers';
import {
  classifyStandardScore,
  computeComposite,
  computeIndexScores,
  type IndexScore,
} from '@/nctb/indices';
import { loadTrialRecords } from '@/nctb/interactive/trials';
import type { NctbReport } from '@/nctb/types';

function formatDate(value: string): string {
  try {
    return new Intl.DateTimeFormat('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value));
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

function evidenceLabel(item: IndexScore['evidence'][number]): string {
  return item.kind === 'exam' ? getNctbDimension(item.refId as Parameters<typeof getNctbDimension>[0]).title : item.label;
}

function IndexRow({ score }: { score: IndexScore }) {
  const standard = score.standard;
  const left = standard === null ? 0 : Math.max(0, Math.min(100, ((standard - 55) / 90) * 100));
  return (
    <article className={`nctb-reportcard-index ${score.index.ancillary ? 'is-ancillary' : ''}`} style={{ '--trial-accent': score.index.accent } as React.CSSProperties}>
      <header>
        <span className="nctb-trial-group-code">{score.index.code}</span>
        <div>
          <strong>{L(score.index.title)}</strong>
          <small>{score.index.english}{score.index.ancillary ? L(' · 补充指数') : ''}</small>
        </div>
        <b>{standard ?? '—'}</b>
        <em>{score.classification ? L(score.classification) : L('暂无数据')}</em>
      </header>
      <div className="nctb-reportcard-track" role="img" aria-label={standard === null ? L('暂无数据') : L(`标准分 ${standard}`)}>
        <i style={{ width: `${left}%` }} />
        <span className="nctb-reportcard-norm" />
      </div>
      <footer>
        {score.evidence.length === 0 && <span>{L('完成正式考试或任意一项该指数的互动分测验后计入。')}</span>}
        {score.evidence.map((item) => (
          <span key={`${item.kind}-${item.refId}`} className={item.counted ? 'is-counted' : 'is-standby'}>
            {item.kind === 'exam' ? L('考试') : L('试炼')} · {evidenceLabel(item)} {item.raw}
            {item.counted ? L(' ✓计入') : L('（备选）')}
          </span>
        ))}
      </footer>
    </article>
  );
}

export default function ReportCard({ report, onBack }: { report?: NctbReport; onBack: () => void }) {
  const trials = useMemo(() => loadTrialRecords(), []);
  const scores = useMemo(() => computeIndexScores(report, trials), [report, trials]);
  const composite = useMemo(() => computeComposite(scores), [scores]);
  const generatedAt = new Date().toISOString();

  const fsiii = composite ? calculateFsiii(composite.standard) : null;
  const fsiiiTier = fsiii === null ? null : getTier(fsiii);
  const fsiiiNeighbors = useMemo(() => {
    if (fsiii === null) return null;
    const ranked = characters
      .filter((character) => typeof character.fsiii === 'number')
      .sort((a, b) => (a.fsiii ?? 0) - (b.fsiii ?? 0));
    const above = ranked.filter((character) => (character.fsiii ?? 0) > fsiii);
    const below = ranked.filter((character) => (character.fsiii ?? 0) <= fsiii);
    return {
      rank: above.length + 1,
      total: ranked.length,
      above: above[0],
      below: below[below.length - 1],
    };
  }, [fsiii]);

  const ranked = scores.filter((score) => score.standard !== null);
  const strengths = [...ranked].sort((a, b) => (b.standard ?? 0) - (a.standard ?? 0)).slice(0, 2);
  const focusAreas = [...ranked].sort((a, b) => (a.standard ?? 0) - (b.standard ?? 0)).slice(0, 2);

  const exportJson = () => {
    const payload = {
      schema: 'nctb-local-report-card/v1',
      disclaimer: '本成绩单是本地探索指标，标准分仅仿韦氏量表显示格式，不是常模参照的临床 IQ。',
      generatedAt,
      examReportId: report?.id,
      composite,
      worldviewFsiii: fsiii === null ? undefined : { score: fsiii, tier: fsiiiTier, note: 'Neural Connection 世界观排名公式，与心理测量无关。' },
      indices: scores.map((score) => ({
        code: score.index.code,
        title: score.index.title,
        standard: score.standard,
        classification: score.classification,
        coverage: score.coverage,
        evidence: score.evidence,
      })),
    };
    downloadText(`nctb-report-card-${generatedAt.slice(0, 10)}.json`, JSON.stringify(payload, null, 2), 'application/json;charset=utf-8');
  };

  return (
    <section className="nctb-reportcard" aria-labelledby="nctb-reportcard-title">
      <div className="nctb-report-toolbar">
        <button type="button" className="nctb-back-button" onClick={onBack}><ArrowLeft size={15} />{L('返回实验室')}</button>
        <div>
          <button type="button" onClick={exportJson}><FileJson size={14} />JSON</button>
          <button type="button" onClick={() => window.print()}><Printer size={14} />{L('打印 / PDF')}</button>
        </div>
      </div>

      <header className="nctb-report-hero">
        <div>
          <p className="nctb-eyebrow">FSIQ-STYLE REPORT CARD</p>
          <h2 id="nctb-reportcard-title">{L('能力成绩单')}</h2>
          <p>
            {formatDate(generatedAt)} · {report ? L('已并入最近一次正式考试') : L('尚未完成正式考试，成绩单仅基于互动分测验')}
          </p>
        </div>
        <div className="nctb-report-score">
          <span>{L('综合标准分')}</span>
          <strong>{composite?.standard ?? '—'}</strong>
          <small>{composite ? L(`${composite.classification} · 覆盖 ${composite.coverage} / ${composite.total} 个指数`) : L('完成任意分测验后生成')}</small>
        </div>
      </header>

      <div className="nctb-reportcard-note">
        <ShieldCheck size={18} />
        <p>{L('标准分仿照韦氏量表的显示格式（均值 100、标准差 15，范围 55–145），但只由本机的考试与互动分测验数据换算，没有年龄常模，不是临床 IQ 分数。同一指数内完成任意一项互动分测验即可计入，取最佳成绩。')}</p>
      </div>

      <section className="nctb-reportcard-indices" aria-label={L('五大指数标准分')}>
        {scores.map((score) => <IndexRow key={score.index.id} score={score} />)}
      </section>

      {fsiii !== null && fsiiiTier && (
        <section className="nctb-fsiii-card" aria-label={L('FSIII 世界观联动')}>
          <header>
            <p className="nctb-eyebrow">WORLDVIEW LINK / FSIII</p>
            <h3><Sparkles size={17} />{L('FSIII · 全量内在智力指数')}</h3>
          </header>
          <div className="nctb-fsiii-body">
            <div className="nctb-fsiii-score">
              <strong>{fsiii}</strong>
              <span className={`nctb-fsiii-tier tier-${fsiiiTier.replace('+', 'plus')}`}>{fsiiiTier} {L('级')}</span>
            </div>
            <div className="nctb-fsiii-explain">
              <code>FSIII = 100 + (FSIQ − 85)(FSIQ − 115) / (15√2)</code>
              <p>{L('把你的综合标准分当作 FSIQ 代入 Neural Connection 角色世界观的排名公式。这条曲线在 100 处最低，离均值越远（无论偏高还是偏低）数值越高——在世界观里，它衡量的不是聪明程度，而是「内在独特性」。85 起步、235 满格、超出即 EX 溢出。')}</p>
              {fsiiiNeighbors && (
                <p className="nctb-fsiii-nearest">
                  {L('在 ')}{fsiiiNeighbors.total}{L(' 个世界观角色中约排第 ')}{fsiiiNeighbors.rank}{L(' 位')}
                  {fsiiiNeighbors.below && <> · {L('身旁是 ')}<b>{fsiiiNeighbors.below.name}</b>（{fsiiiNeighbors.below.fsiii}）</>}
                  {fsiiiNeighbors.above && <> · {L('前一名是 ')}<b>{fsiiiNeighbors.above.name}</b>（{fsiiiNeighbors.above.fsiii}）</>}
                </p>
              )}
              <Link to="/math/fsiii" className="nctb-fsiii-link">{L('查看 FSIII 角色排名')}<ArrowLeft size={13} style={{ transform: 'rotate(180deg)' }} /></Link>
            </div>
          </div>
          <small>{L('世界观联动彩蛋：FSIII 是故事设定中的排名公式，与心理测量无关，也不影响上方任何考试分数。')}</small>
        </section>
      )}

      {ranked.length >= 2 && (
        <div className="nctb-reportcard-profile">
          <article>
            <header><TrendingUp size={16} /><h3>{L('相对优势')}</h3></header>
            {strengths.map((score) => (
              <div key={score.index.id}><span style={{ background: score.index.accent }} /><strong>{L(score.index.title)}</strong><b>{score.standard}</b><em>{L(classifyStandardScore(score.standard ?? 0))}</em></div>
            ))}
          </article>
          <article>
            <header><TrendingDown size={16} /><h3>{L('待观察领域')}</h3></header>
            {focusAreas.map((score) => (
              <div key={score.index.id}><span style={{ background: score.index.accent }} /><strong>{L(score.index.title)}</strong><b>{score.standard}</b><em>{L(classifyStandardScore(score.standard ?? 0))}</em></div>
            ))}
          </article>
        </div>
      )}

      <section className="nctb-reportcard-subtests" aria-label={L('分测验明细')}>
        <div className="nctb-section-heading">
          <div><p className="nctb-eyebrow">SUBTEST DETAIL</p><h2>{L('分测验明细')}</h2></div>
          <span>{L('量表分仿韦氏格式（均值 10、标准差 3，范围 1–19）；标 ✓ 的是计入指数的证据，其余为备选。')}</span>
        </div>
        <div className="nctb-reportcard-table" role="table">
          <div className="nctb-reportcard-row is-head" role="row">
            <span>{L('分测验')}</span><span>{L('来源')}</span><span>{L('指数')}</span><span>{L('原始分')}</span><span>{L('量表分')}</span><span>{L('计入')}</span>
          </div>
          {scores.flatMap((score) => score.evidence.map((item) => (
            <div className="nctb-reportcard-row" role="row" key={`${score.index.id}-${item.kind}-${item.refId}`}>
              <span>{evidenceLabel(item)}</span>
              <span>{item.kind === 'exam' ? L('正式考试') : L('互动分测验')}</span>
              <span>{score.index.code}</span>
              <span>{item.raw}</span>
              <span>{item.scaled}</span>
              <span>{item.counted ? '✓' : '—'}</span>
            </div>
          )))}
          {scores.every((score) => score.evidence.length === 0) && (
            <div className="nctb-reportcard-row"><span>{L('还没有任何证据：先完成一次正式考试或任意互动分测验。')}</span></div>
          )}
        </div>
      </section>

      <aside className="nctb-report-disclaimer">
        <Award size={19} />
        <p><strong>{L('解释边界：')}</strong>{L('能力成绩单把正式考试（十维题库）与互动分测验（反应、记忆、译码等网页任务）汇总成五大指数与综合标准分，结构与显示格式参考 WAIS-IV / WISC-V，但不是经过心理测量标定的测验，不能用于医疗、心理、智力或教育诊断。')}</p>
      </aside>
    </section>
  );
}
