import { useEffect, useMemo, useRef } from 'react';
import { L } from '@/lib/translations/manual';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Clock, ArrowUpRight } from 'lucide-react';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    triggerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(focusableSelector) ?? []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      window.cancelAnimationFrame(focusFrame);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) return;
    const trigger = triggerRef.current;
    if (trigger?.isConnected) {
      window.requestAnimationFrame(() => trigger.focus());
    }
    triggerRef.current = null;
  }, [isOpen]);

  // Auto-detect system time and determine target email
  const targetEmail = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(2028, 5, 30, 23, 59, 59); // June is month 5 (0-indexed)
    return now <= cutoff ? 'moxuanyue2016@hnu.edu.cn' : 'sera-him@qq.com';
  }, []);

  const mailtoLink = `mailto:${targetEmail}?subject=Neural%20Connection%20%E5%8F%8D%E9%A6%88`;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="feedback-dialog-title"
            aria-describedby="feedback-dialog-description"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-nc-bg-secondary border border-nc-violet/20 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-nc-violet/10">
              <div id="feedback-dialog-title" className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-nc-cyan" />
                <h3 className="text-sm font-medium text-nc-text">{L("反馈")}</h3>
              </div>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={onClose}
                aria-label={L("关闭反馈窗口")}
                className="p-1.5 rounded-md hover:bg-nc-violet/10 text-nc-text-muted hover:text-nc-text transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div id="feedback-dialog-description" className="px-5 py-6 space-y-5">
              {/* Email display */}
              <div className="text-center space-y-3">
                <p className="text-xs text-nc-text-muted">
                  {L("当前反馈接收邮箱\n                ")}</p>
                <a
                  href={mailtoLink}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-nc-cyan/8 border border-nc-cyan/20 text-nc-cyan hover:bg-nc-cyan/15 hover:border-nc-cyan/30 transition-all text-sm font-mono"
                >
                  <Mail className="w-4 h-4" />
                  {targetEmail}
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Time indicator */}
              <div className="flex items-center justify-center gap-2 text-[11px] text-nc-text-muted/70">
                <Clock className="w-3 h-3" />
                <span>
                  {targetEmail === 'moxuanyue2016@hnu.edu.cn'
                    ? '截止 2028.6.30 23:59:59 前'
                    : '2028.6.30 23:59:59 后'}
                </span>
              </div>

              {/* Divider */}
              <div className="h-px bg-nc-violet/10" />

              {/* Instructions */}
              <div className="space-y-2">
                <p className="text-xs text-nc-text-muted leading-relaxed">
                  {L("点击上方邮箱地址即可唤起邮件客户端发送反馈。\n                ")}</p>
                <p className="text-[11px] text-nc-text-muted/60 leading-relaxed">
                  {L("你也可以手动复制邮箱地址发送邮件。反馈内容可以包括：网站 bug 报告、内容勘误、功能建议，或者任何关于 Neural Connection 世界观的想法。\n                ")}</p>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-nc-violet/10 bg-nc-bg-tertiary/50 flex justify-between items-center">
              <span className="text-[10px] text-nc-text-muted/50">
                Neural Connection Feedback
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-1.5 rounded-lg bg-nc-violet/10 border border-nc-violet/15 text-xs text-nc-text-secondary hover:text-nc-text hover:bg-nc-violet/15 transition-colors"
              >
                {L("关闭\n              ")}</button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
