const nav = [
  { href: '#overview', label: '总览', short: '总览' },
  { href: '#archive', label: '逐条档案', short: '档案' },
  { href: '#domains', label: '功能域', short: '功能' },
  { href: '#timeline', label: '时间线', short: '时间' },
  { href: '#insights', label: '模式洞察', short: '洞察' },
  { href: '#clinic', label: '就诊摘要', short: '就诊' },
];

export default function Header() {
  return (
    <header className="no-print sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 md:px-8 md:py-3">
        <a href="#top" className="flex min-h-[44px] items-center gap-2 md:min-h-0" aria-label="返回档案顶部">
          <span className="font-display text-lg font-semibold tracking-tight text-inkstrong">
            自我观察档案
          </span>
          <span className="font-mono2 text-[12px] uppercase tracking-widest text-mute">
            Archive
          </span>
        </a>
        <span className="hidden font-mono2 text-[12px] tracking-wider text-mute md:inline">
          46 ENTRIES · DEVELOPMENT → NOW
        </span>
        <nav className="order-3 -mx-1 flex w-full gap-1 overflow-x-auto md:order-none md:ml-auto md:w-auto" aria-label="页面导航">
          {nav.map((n) => (
            <a
              key={n.href}
              href={n.href}
              aria-label={n.label}
              className="inline-flex min-h-[44px] flex-1 items-center justify-center whitespace-nowrap px-2 font-mono2 text-[12px] tracking-wider text-ink transition-colors hover:bg-cream hover:text-acc-deep focus-visible:bg-cream md:min-h-0 md:flex-none md:px-3 md:py-1.5"
            >
              <span className="md:hidden">{n.short}</span>
              <span className="hidden md:inline">{n.label}</span>
            </a>
          ))}
        </nav>
      </div>
    </header>
  );
}
