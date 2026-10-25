import { useEffect, useState } from 'react';
import { clinicSummary } from '@/data/okcomputerObservations';
import {
  buildClinicText,
  copyText,
  downloadArchiveMarkdown,
} from './exportArchive';

type Feedback = 'copied' | 'downloaded' | 'error' | null;

export default function Clinic() {
  const [feedback, setFeedback] = useState<Feedback>(null);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), 3500);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const copySummary = async () => {
    try {
      await copyText(buildClinicText());
      setFeedback('copied');
    } catch {
      setFeedback('error');
    }
  };

  const downloadArchive = () => {
    try {
      downloadArchiveMarkdown();
      setFeedback('downloaded');
    } catch {
      setFeedback('error');
    }
  };

  return (
    <section id="clinic" className="border-b border-line">
      <div className="mx-auto max-w-6xl px-4 py-14 md:px-8 md:py-20">
        <div className="print-block">
          <div className="flex items-baseline gap-4">
            <span className="no-print font-mono2 text-[12px] uppercase tracking-[0.25em] text-mute">
              06 — For Clinic
            </span>
            <h2 className="font-display text-2xl font-semibold tracking-tight text-inkstrong md:text-4xl">
              就诊摘要
            </h2>
          </div>
          <p className="no-print mt-4 max-w-2xl text-[14px] leading-6 text-mute">
            一页式就诊材料：核心材料六组、回溯时间线与下一步建议。可打印、复制摘要，或下载包含全部原文与整理注解的完整档案。
          </p>

          <div className="clinic-grid mt-8 grid gap-px border border-line bg-line md:grid-cols-2 lg:grid-cols-3">
            {clinicSummary.core.map((c) => (
              <div key={c.label} className="clinic-card bg-cardok p-5">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-display text-base font-semibold text-inkstrong">
                    {c.label}
                  </h3>
                  <span className="font-mono2 shrink-0 text-[12px] tracking-wider text-mute">
                    {c.ids.map((i) => String(i).padStart(2, '0')).join(' · ')}
                  </span>
                </div>
                <p className="mt-2 text-[13px] leading-6 text-ink">{c.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 border border-line bg-cardok p-5 md:p-6">
            <h3 className="font-mono2 text-[12px] tracking-wider text-acc-deep">
              下一步建议
            </h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-[13.5px] leading-6 text-ink">
              {clinicSummary.next.map((n) => (
                <li key={n}>{n}</li>
              ))}
            </ol>
          </div>

          <div className="no-print mt-6 flex flex-col gap-4 border border-line bg-cream p-5">
            <div className="flex flex-col gap-3 md:flex-row md:flex-wrap">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 bg-acc px-5 font-mono2 text-[13px] tracking-wider text-cardok transition-colors hover:bg-acc-deep focus-visible:bg-acc-deep"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                打印摘要
              </button>
              <button
                type="button"
                onClick={copySummary}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-line bg-cardok px-5 font-mono2 text-[13px] tracking-wider text-ink transition-colors hover:border-acc hover:text-acc-deep"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <rect x="8" y="8" width="12" height="12" />
                  <path d="M16 8V4H4v12h4" />
                </svg>
                复制就诊摘要
              </button>
              <button
                type="button"
                onClick={downloadArchive}
                className="inline-flex min-h-[44px] items-center justify-center gap-2 border border-line bg-cardok px-5 font-mono2 text-[13px] tracking-wider text-ink transition-colors hover:border-acc hover:text-acc-deep"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
                  <path d="M12 3v12m0 0 5-5m-5 5-5-5M4 19h16" />
                </svg>
                下载完整档案 · Markdown
              </button>
            </div>
            <div className="flex min-h-[24px] flex-col gap-1 md:flex-row md:items-center md:justify-between">
              <p className="text-[12px] leading-5 text-mute">
                打印仅输出本摘要；完整文件包含 46 条原文、整理线索、时间线与模式假设。
              </p>
              <p className="font-mono2 text-[12px] text-acc-deep" aria-live="polite" role="status">
                {feedback === 'copied' && '✓ 摘要已复制'}
                {feedback === 'downloaded' && '✓ 完整档案已生成'}
                {feedback === 'error' && '操作未完成，请重试'}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[12px] leading-5 text-mute">
            本页为压缩版；就诊时可同时提供完整的 46 条原始清单。摘要内容不能单独用于确诊或排除任何情况。
          </p>
        </div>
      </div>
    </section>
  );
}
