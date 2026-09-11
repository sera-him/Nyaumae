import { useEffect } from 'react';
import { t, getLocale, setLocale, type Locale } from '@/lib/i18n';

/** Skip link + locale toggle + global keyboard: `/` searches, `Esc` blurs. */
export default function SiteAids() {
  const locale = getLocale();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') {
        if (e.key === 'Escape') (e.target as HTMLElement).blur();
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent('nc:open-search'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const toggle = () => {
    const next: Locale = locale === 'zh-CN' ? 'en' : 'zh-CN';
    setLocale(next);
    window.location.reload();
  };
  return (
    <>
      <a
        href="#main"
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
        {t('skip')}
      </a>
      <button
        type="button"
        aria-label="language / 语言"
        onClick={toggle}
        style={{
          position: 'fixed', right: 12, bottom: 12, zIndex: 60,
          borderRadius: 999, padding: '6px 12px', fontSize: 12,
          background: 'rgba(0,0,0,.6)', color: '#fff', border: '1px solid rgba(255,255,255,.25)',
        }}
      >
        {locale === 'zh-CN' ? 'EN' : '中文'}
      </button>
    </>
  );
}
