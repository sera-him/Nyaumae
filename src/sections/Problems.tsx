import { useState, useRef, useCallback } from 'react';
import { L } from '@/lib/translations/manual';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Brain, Send, Sparkles, RefreshCw,
} from 'lucide-react';
import {
  PROBLEMS,
  getAllSlots,
  getSlotOffset,
  computeQRData,
  drawQRCode,
} from '@/lib/puzzleEngine';

const TOTAL_SLOTS = getAllSlots().length;
const NONQR_PROBLEMS = PROBLEMS.filter((p) => p.id > 13);
const TOTAL_NONQR_SLOTS = NONQR_PROBLEMS.reduce((sum, p) => sum + p.slots.length, 0);

export default function Problems() {
  const { ref } = useScrollReveal<HTMLElement>();
  const [qrAnswers, setQrAnswers] = useState<string[]>(Array(TOTAL_SLOTS).fill(''));
  const [refAnswers, setRefAnswers] = useState<string[]>(Array(TOTAL_NONQR_SLOTS).fill(''));
  const [computing, setComputing] = useState(false);
  const [hasResult, setHasResult] = useState(false);
  const [validationMessage, setValidationMessage] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleAnswerChange = useCallback((slotIndex: number, value: string) => {
    setQrAnswers((prev) => {
      const next = [...prev];
      next[slotIndex] = value;
      return next;
    });
    setHasResult(false);
    setValidationMessage('');
  }, []);

  const handleRefAnswerChange = useCallback((slotIndex: number, value: string) => {
    setRefAnswers((prev) => {
      const next = [...prev];
      next[slotIndex] = value;
      return next;
    });
    setHasResult(false);
    setValidationMessage('');
  }, []);

  const handleRefCheckboxChange = useCallback((slotIdx: number, option: string, checked: boolean) => {
    setRefAnswers((prev) => {
      const current = prev[slotIdx] || '';
      // Find the options for this slot from non-QR problems
      let opts: string[] = [];
      let idx = 0;
      for (const p of NONQR_PROBLEMS) {
        for (const s of p.slots) {
          if (idx === slotIdx && s.options) opts = s.options;
          idx++;
        }
      }
      if (!opts.length) return prev;
      const next = checked ? current + option : current.replace(option, '');
      const sorted = opts.filter((o) => next.includes(o)).join('');
      const result = [...prev];
      result[slotIdx] = sorted;
      return result;
    });
    setHasResult(false);
    setValidationMessage('');
  }, []);

  const handleSubmit = useCallback(async () => {
    setValidationMessage('');
    setComputing(true);
    try {
      const qrData = await computeQRData(qrAnswers, refAnswers);
      if (qrData) {
        setHasResult(true);
        if (canvasRef.current) {
          drawQRCode(canvasRef.current, qrData);
        }
      } else {
        setValidationMessage('答案暂时无法生成结果，请检查填写内容后重试。');
      }
    } catch (e) {
      console.error('QR computation failed:', e);
      setValidationMessage('生成结果时出现问题，请稍后重试。');
    } finally {
      setComputing(false);
    }
  }, [qrAnswers, refAnswers]);

  const handleReset = useCallback(() => {
    setQrAnswers(Array(TOTAL_SLOTS).fill(''));
    setRefAnswers(Array(TOTAL_NONQR_SLOTS).fill(''));
    setHasResult(false);
    setValidationMessage('');
  }, []);

  const renderInput = (slotIdx: number, values: string[], onChange: (idx: number, v: string) => void) => {
    const allSlots = getAllSlots();
    const slot = allSlots[slotIdx];
    if (!slot) return null;

    return (
      <input
        key={slot.id}
        type="text"
        value={values[slotIdx] || ''}
        onChange={(e) => onChange(slotIdx, e.target.value)}
        data-answer-key={`qr-${slotIdx}`}
        aria-label={L(`答案 ${slot.id}`)}
        placeholder={slot.placeholder || '?'}
        className={`align-middle mx-0.5 px-1.5 py-0.5 text-sm font-mono
          bg-nc-bg-tertiary border-b-2 outline-none transition-colors
          ${slot.width || 'w-24'}
          border-nc-violet/20 focus:border-nc-violet/50 text-nc-text
          placeholder:text-nc-text-muted/40`}
      />
    );
  };

  const renderRefInput = (slotIdx: number) => {
    let slot: (typeof NONQR_PROBLEMS[0]['slots'][0]) | undefined;
    let idx = 0;
    for (const p of NONQR_PROBLEMS) {
      for (const s of p.slots) {
        if (idx === slotIdx) { slot = s; break; }
        idx++;
      }
      if (slot) break;
    }
    if (!slot) return null;

    if (slot.options) {
      return (
        <span
          key={slot.id}
          className="inline-flex flex-wrap gap-1.5 align-middle"
          role="group"
          aria-label={L(`答案 ${slot.id}`)}
        >
          {slot.options.map((opt) => {
            const selected = (refAnswers[slotIdx] || '').includes(opt);
            return (
              <button
                key={opt}
                type="button"
                onClick={() => handleRefCheckboxChange(slotIdx, opt, !selected)}
                data-answer-key={`ref-${slotIdx}`}
                aria-pressed={selected}
                className={`h-10 w-10 text-sm sm:h-7 sm:w-7 sm:text-xs rounded font-mono font-bold transition-all
                  ${selected
                    ? 'bg-nc-cyan/30 text-nc-cyan border border-nc-cyan/50 shadow-[0_0_6px_rgba(0,229,204,0.3)]'
                    : 'bg-nc-bg-tertiary text-nc-text-muted border border-nc-cyan/10 hover:border-nc-cyan/30'
                  }`}
              >
                {opt}
              </button>
            );
          })}
        </span>
      );
    }

    return (
      <input
        key={slot.id}
        type="text"
        value={refAnswers[slotIdx] || ''}
        onChange={(e) => handleRefAnswerChange(slotIdx, e.target.value)}
        data-answer-key={`ref-${slotIdx}`}
        aria-label={L(`答案 ${slot.id}`)}
        placeholder={slot.placeholder || '?'}
        size={slot.size || undefined}
        style={{ width: slot.size ? undefined : (slot.width || undefined) }}
        className={`align-middle mx-0 px-0.5 py-0 text-sm font-mono
          bg-transparent border-b-2 outline-none transition-colors
          border-nc-cyan/20 focus:border-nc-cyan/50 text-nc-text
          placeholder:text-nc-text-muted/40`}
      />
    );
  };

  const getRefSlotOffset = (problemIdx: number) => {
    const nonQr = NONQR_PROBLEMS;
    let count = 0;
    for (let i = 0; i < problemIdx; i++) {
      count += nonQr[i].slots.length;
    }
    return count;
  };

  return (
    <section id="problems" ref={ref} className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-[900px] mx-auto">
        {/* ========== 头部 ========== */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-12 text-center select-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-nc-bg-tertiary border border-nc-violet/10 text-xs text-nc-text-muted mb-4">
            <Brain className="w-3.5 h-3.5" />
            {L("烧脑挑战\n          ")}</div>
          <h2 className="text-3xl sm:text-4xl font-bold mb-3">{L("题目")}</h2>
          <p className="text-nc-text-secondary max-w-2xl mx-auto text-sm leading-relaxed">
            {L("提交后将基于你当前填写的答案计算生成二维码，无需全部填完；答案全部正确时才能得到有效的二维码。\n          ")}</p>
        </motion.div>

        {/* ========== 全部题目列表 ========== */}
        <div className="space-y-4 mb-10 select-none">
          {PROBLEMS.map((problem, pIdx) => {
            const isQR = problem.id <= 13;

            if (isQR) {
              const offset = getSlotOffset(pIdx);
              return (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: pIdx * 0.04 }}
                  className="rounded-xl bg-nc-bg-secondary/40 border border-nc-violet/8 hover:border-nc-violet/15 transition-all p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-7 h-7 mt-0.5 rounded-md bg-nc-bg-tertiary border border-nc-violet/10 text-xs font-mono text-nc-text-secondary">
                      {problem.id}
                    </span>
                    <div className="flex-1 min-w-0 leading-relaxed text-sm sm:text-base text-nc-text">
                      {problem.parts.map((part, i) => (
                        <span key={i}>
                          {part}
                          {i < problem.slots.length && renderInput(offset + i, qrAnswers, handleAnswerChange)}
                        </span>
                      ))}
                      {problem.suffix && (
                        <span className="text-xs text-nc-text-muted ml-1">[{problem.suffix}]</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            } else {
              const nonQrIdx = pIdx - 13; // index within NONQR_PROBLEMS
              const slotStart = getRefSlotOffset(nonQrIdx);
              return (
                <motion.div
                  key={problem.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.35, delay: pIdx * 0.04 }}
                  className="rounded-xl bg-nc-bg-secondary/40 border border-nc-cyan/8 hover:border-nc-cyan/15 transition-all p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3">
                    <span className="shrink-0 flex items-center justify-center w-7 h-7 mt-0.5 rounded-md bg-nc-bg-tertiary border border-nc-cyan/10 text-xs font-mono text-nc-text-secondary">
                      {problem.id}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="leading-relaxed text-sm sm:text-base text-nc-text mb-3 whitespace-pre-wrap">
                        {problem.parts.map((part, i) => (
                          <span key={i}>
                            {part}
                            {i < problem.slots.length && renderRefInput(slotStart + i)}
                          </span>
                        ))}
                        {problem.suffix && (
                          <span className="text-xs text-nc-text-muted ml-1">[{problem.suffix}]</span>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            }
          })}
        </div>

        {/* ========== 提交按钮 ========== */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="flex flex-col items-center gap-4 mb-16 select-none"
        >
          {validationMessage && (
            <p id="problems-validation" role="alert" className="max-w-xl rounded-lg border border-red-400/25 bg-red-400/10 px-4 py-2 text-center text-sm text-red-200">
              {validationMessage}
            </p>
          )}
          <button
            type="button"
            onClick={handleSubmit}
            disabled={computing}
            className={`inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-medium transition-all
              ${computing
                ? 'bg-nc-bg-tertiary text-nc-text-muted cursor-not-allowed border border-nc-violet/5'
                : 'bg-nc-violet/20 text-nc-text hover:bg-nc-violet/30 border border-nc-violet/20 hover:border-nc-violet/40 cursor-pointer'
              }`}
          >
            {computing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                {L("计算中...\n              ")}</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                {L("提交答案\n              ")}</>
            )}
          </button>

          {hasResult && (
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs text-nc-text-secondary hover:text-nc-text bg-nc-bg-tertiary border border-nc-violet/10 hover:border-nc-violet/20 transition-all"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              {L("清空重填\n            ")}</button>
          )}
        </motion.div>

        {/* ========== QR 码结果 ========== */}
        <div className={`max-w-md mx-auto text-center transition-all duration-500 mb-20 select-none ${hasResult ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
          <div className="rounded-2xl bg-nc-bg-secondary/50 border border-nc-violet/10 p-8">
            <h3 className="text-lg font-bold text-nc-text mb-4">{L("生成结果")}</h3>
            <div className="inline-block p-4 bg-white rounded-xl shadow-lg">
              <canvas
                ref={canvasRef}
                className="block mx-auto"
                style={{ width: 69 * 5, height: 69 * 5 }}
              />
            </div>
          </div>
        </div>

        {/* ========== 底部统计 ========== */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-12 text-center select-none"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-nc-bg-tertiary border border-nc-violet/10 text-xs text-nc-text-muted">
            <Sparkles className="w-3.5 h-3.5" />
            {L("共 ")}{PROBLEMS.length} {L("道题 · ")}{TOTAL_SLOTS + TOTAL_NONQR_SLOTS} {L("个填空\n          ")}</div>
        </motion.div>
      </div>
    </section>
  );
}
