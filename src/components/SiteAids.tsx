import { useEffect, useRef, useState } from 'react';
import { Languages } from 'lucide-react';
import { getLocale, setLocale, type Locale } from '@/lib/i18n';
import { startPageTranslation } from '@/lib/translations/pageTranslator';

/** Skip link + working page translation + global keyboard: `/` searches, `Esc` blurs. */
export default function SiteAids() {
  const [locale, setActiveLocale] = useState<Locale>(() => getLocale());
  const [hint, setHint] = useState<string | null>(null);
  const hintTimer = useRef<number | null>(null);

  useEffect(() => {
    // Every locale change re-runs the translator: the disposer restores the
    // previous nodes, then the new run translates the current DOM.
    return startPageTranslation(locale === 'en');
  }, [locale]);

  useEffect(() => () => {
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
  }, []);

  const showHint = (message: string) => {
    setHint(message);
    if (hintTimer.current !== null) window.clearTimeout(hintTimer.current);
    hintTimer.current = window.setTimeout(() => setHint(null), 3200);
  };

  const toggle = () => {
    const next: Locale = locale === 'zh-CN' ? 'en' : 'zh-CN';
    setLocale(next);
    setActiveLocale(next);
    showHint(next === 'en'
      ? 'Interface and site data are now in English. Long-form chapters and lore stay in the original Chinese.'
      : '已恢复中文原文。');
  };

  const isEnglish = locale === 'en';

  return (
    <>
      <a
        href="#main"
        data-no-translate
        onClick={(e) => {
          const el = document.getElementById('main');
          if (el) {
            e.preventDefault();
            el.focus();
            el.scrollIntoView();
          }
        }}
        style={{
          position: 'absolute', left: 8, top: -48, zIndex: 100,
          background: '#fff', color: '#000', padding: '8px 12px', borderRadius: 8,
          transition: 'top .15s',
        }}
        onFocus={(e) => { e.currentTarget.style.top = '8px'; }}
        onBlur={(e) => { e.currentTarget.style.top = '-48px'; }}
      >
        {isEnglish ? 'Skip to content' : '跳到正文'}
      </a>

      {hint && (
        <div
          role="status"
          style={{
            position: 'fixed', right: 12, bottom: 54, zIndex: 61, maxWidth: 260,
            padding: '8px 12px', borderRadius: 10, fontSize: 12, lineHeight: 1.5,
            background: 'rgba(12,14,22,.92)', color: '#fff',
            border: '1px solid rgba(255,255,255,.18)',
            boxShadow: '0 8px 24px rgba(0,0,0,.28)',
          }}
        >
          {hint}
        </div>
      )}

      <button
        type="button"
        onClick={toggle}
        data-no-translate
        aria-pressed={isEnglish}
        aria-label={isEnglish ? 'Switch the site back to Chinese' : 'Translate this site into English'}
        title={isEnglish ? 'Switch back to Chinese / 恢复中文' : 'Translate this page / 翻译本页'}
        data-translate-active={isEnglish ? 'true' : 'false'}
        style={{
          position: 'fixed', right: 12, bottom: 12, zIndex: 60,
          display: 'inline-flex', alignItems: 'center', gap: 6,
          borderRadius: 999, padding: '7px 13px', fontSize: 12, fontWeight: 600,
          cursor: 'pointer',
          background: isEnglish ? 'rgba(122,92,255,.92)' : 'rgba(12,14,22,.72)',
          color: '#fff', border: '1px solid rgba(255,255,255,.24)',
          backdropFilter: 'blur(8px)',
          boxShadow: '0 6px 18px rgba(0,0,0,.22)',
          transition: 'background .18s ease, transform .18s ease',
        }}
      >
        <Languages size={14} aria-hidden="true" />
        <span>{isEnglish ? '中文' : 'EN'}</span>
      </button>
    </>
  );
}
