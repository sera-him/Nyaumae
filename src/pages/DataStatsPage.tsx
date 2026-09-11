import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Archive,
  ArrowRight,
  BarChart3,
  Clock3,
  Download,
  FileUp,
  History,
  Mail,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  TrendingUp,
} from 'lucide-react';
import { Link } from 'react-router';
import {
  ANALYTICS_CATEGORIES,
  ANALYTICS_DATA_EVENT,
  clearAnalyticsData,
  createDataArchive,
  parseDataArchive,
  readAnalyticsData,
  restoreDataArchive,
  type AnalyticsCategory,
  type AnalyticsData,
  type AnalyticsVisit,
} from '@/lib/analytics';
import './DataStatsPage.css';

type RangeKey = '7d' | '30d' | 'all';

interface PageSummary {
  path: string;
  label: string;
  category: AnalyticsCategory;
  count: number;
  durationMs: number;
}

interface TransitionSummary {
  from: string;
  to: string;
  count: number;
}

interface SearchSummary {
  query: string;
  count: number;
  resultCount: number;
  lastAt: number;
}

const CATEGORY_COLORS: Record<AnalyticsCategory, string> = {
  首页: '#78e1d5',
  故事: '#ff9fc8',
  角色: '#b8a6ff',
  世界观: '#91c8ff',
  咪呀: '#ffd17a',
  数学: '#c6a4ff',
  游戏: '#9fe3a7',
  AI: '#f1a7ff',
  API: '#8bd8ff',
  其他: '#a7b6c8',
};

const RANGE_LABELS: Record<RangeKey, string> = {
  '7d': '最近 7 天',
  '30d': '最近 30 天',
  all: '全部记录',
};

const TOOLTIP_STYLE = {
  background: '#0b1820',
  border: '1px solid rgba(120,225,213,.25)',
  borderRadius: 12,
  color: '#eafffb',
  fontSize: 12,
};

// recharts 的悬停条目默认继承系列色，环形图取不到系列色时会回退成黑色，必须显式指定亮色
const TOOLTIP_ITEM_STYLE = { color: '#eafffb' };

function formatDuration(milliseconds: number): string {
  const seconds = Math.max(0, Math.round(milliseconds / 1_000));
  if (seconds < 60) return `${seconds} 秒`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} 分钟${seconds % 60 ? ` ${seconds % 60} 秒` : ''}`;
  const hours = Math.floor(minutes / 60);
  return `${hours} 小时${minutes % 60 ? ` ${minutes % 60} 分钟` : ''}`;
}

function formatShortDuration(milliseconds: number): string {
  const minutes = Math.round(Math.max(0, milliseconds) / 60_000);
  if (minutes < 1) return '<1 分钟';
  if (minutes < 60) return `${minutes} 分钟`;
  return `${Math.floor(minutes / 60)} 小时${minutes % 60 ? ` ${minutes % 60} 分` : ''}`;
}

function formatDate(value: number): string {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function dayKey(value: number): string {
  const date = new Date(value);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function dayLabel(value: number): string {
  const date = new Date(value);
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function createFilename(): string {
  return `neural-connection-archive-${dayKey(Date.now())}.json`;
}

function downloadArchive(): string {
  const filename = createFilename();
  const archive = createDataArchive();
  const blob = new Blob([JSON.stringify(archive, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  return filename;
}

function openEmailGuide(filename: string): void {
  const subject = 'Neural Connection 数据存档';
  const body = [
    '你好，我想发送 Neural Connection 的本机数据存档。',
    '',
    `请在这封邮件中手动添加附件：${filename}`,
    '发送前请确认附件中没有不想分享的浏览记录、对话或其他个人内容。',
  ].join('\n');
  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function isWithinRange(timestamp: number, range: RangeKey, now: number): boolean {
  if (range === 'all') return true;
  const days = range === '7d' ? 7 : 30;
  return timestamp >= now - days * 24 * 60 * 60 * 1_000;
}

function summarize(data: AnalyticsData, range: RangeKey): {
  visits: AnalyticsVisit[];
  totalDurationMs: number;
  uniquePages: number;
  activeDays: number;
  sessions: number;
  categoryData: { name: AnalyticsCategory; minutes: number; visits: number; fill: string }[];
  trendData: { label: string; minutes: number; visits: number }[];
  hourlyData: { hour: string; visits: number }[];
  topPages: PageSummary[];
  recentVisits: AnalyticsVisit[];
  transitions: TransitionSummary[];
  searchSummaries: SearchSummary[];
} {
  const now = Date.now();
  const visits = data.visits.filter((visit) => isWithinRange(visit.startedAt, range, now));
  const pageMap = new Map<string, PageSummary>();
  const categoryMap = new Map<AnalyticsCategory, { minutes: number; visits: number }>();
  const activeDaySet = new Set<string>();
  const sessionSet = new Set<string>();
  let totalDurationMs = 0;

  for (const category of ANALYTICS_CATEGORIES) categoryMap.set(category, { minutes: 0, visits: 0 });

  for (const visit of visits) {
    totalDurationMs += visit.durationMs;
    activeDaySet.add(dayKey(visit.startedAt));
    sessionSet.add(visit.sessionId);

    const page = pageMap.get(visit.path) ?? {
      path: visit.path,
      label: visit.label,
      category: visit.category,
      count: 0,
      durationMs: 0,
    };
    page.count += 1;
    page.durationMs += visit.durationMs;
    pageMap.set(visit.path, page);

    const category = categoryMap.get(visit.category);
    if (category) {
      category.minutes += visit.durationMs / 60_000;
      category.visits += 1;
    }
  }

  const categoryData = ANALYTICS_CATEGORIES
    .map((name) => ({
      name,
      minutes: Number((categoryMap.get(name)?.minutes ?? 0).toFixed(1)),
      visits: categoryMap.get(name)?.visits ?? 0,
      fill: CATEGORY_COLORS[name],
    }))
    .filter((entry) => entry.visits > 0 || entry.minutes > 0);

  const trendDays = range === '7d' ? 7 : 14;
  const trendData = Array.from({ length: trendDays }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() - (trendDays - index - 1));
    const key = dayKey(date.getTime());
    const matchingVisits = visits.filter((visit) => dayKey(visit.startedAt) === key);
    return {
      label: dayLabel(date.getTime()),
      minutes: Number((matchingVisits.reduce((total, visit) => total + visit.durationMs, 0) / 60_000).toFixed(1)),
      visits: matchingVisits.length,
    };
  });

  const hourlyData = Array.from({ length: 24 }, (_, hour) => ({
    hour: `${String(hour).padStart(2, '0')}时`,
    visits: visits.filter((visit) => new Date(visit.startedAt).getHours() === hour).length,
  }));

  const topPages = [...pageMap.values()]
    .sort((left, right) => right.durationMs - left.durationMs || right.count - left.count)
    .slice(0, 8);
  const recentVisits = [...visits].sort((left, right) => right.startedAt - left.startedAt).slice(0, 10);

  const orderedVisits = [...visits].sort((left, right) => left.startedAt - right.startedAt);
  const transitionMap = new Map<string, TransitionSummary>();
  for (let index = 1; index < orderedVisits.length; index += 1) {
    const previous = orderedVisits[index - 1];
    const current = orderedVisits[index];
    if (!previous || !current || previous.path === current.path) continue;
    const key = `${previous.path}→${current.path}`;
    const transition = transitionMap.get(key) ?? { from: previous.label, to: current.label, count: 0 };
    transition.count += 1;
    transitionMap.set(key, transition);
  }

  const transitions = [...transitionMap.values()].sort((left, right) => right.count - left.count).slice(0, 6);

  const searchMap = new Map<string, SearchSummary>();
  for (const search of data.searches) {
    const entry = searchMap.get(search.query) ?? { query: search.query, count: 0, resultCount: 0, lastAt: search.at };
    entry.count += 1;
    entry.resultCount = search.resultCount;
    entry.lastAt = Math.max(entry.lastAt, search.at);
    searchMap.set(search.query, entry);
  }

  return {
    visits,
    totalDurationMs,
    uniquePages: pageMap.size,
    activeDays: activeDaySet.size,
    sessions: sessionSet.size,
    categoryData,
    trendData,
    hourlyData,
    topPages,
    recentVisits,
    transitions,
    searchSummaries: [...searchMap.values()].sort((left, right) => right.lastAt - left.lastAt).slice(0, 10),
  };
}

function MetricCard({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: typeof Clock3 }) {
  return (
    <article className="analytics-metric-card">
      <div className="analytics-metric-icon"><Icon size={17} /></div>
      <span>{label}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function EmptyChart({ message }: { message: string }) {
  return <div className="analytics-empty-chart"><History size={22} /><p>{message}</p></div>;
}

export default function DataStatsPage() {
  const [data, setData] = useState<AnalyticsData>(() => readAnalyticsData());
  const [range, setRange] = useState<RangeKey>('30d');
  const [status, setStatus] = useState('');
  const [lastExportFilename, setLastExportFilename] = useState(createFilename);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const refresh = useCallback(() => setData(readAnalyticsData()), []);

  useEffect(() => {
    const refreshFrame = window.requestAnimationFrame(refresh);
    window.addEventListener(ANALYTICS_DATA_EVENT, refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.cancelAnimationFrame(refreshFrame);
      window.removeEventListener(ANALYTICS_DATA_EVENT, refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const summary = useMemo(() => summarize(data, range), [data, range]);

  const isFreshUser = summary.totalDurationMs === 0
    && summary.visits.length === 0
    && summary.uniquePages === 0
    && summary.activeDays === 0
    && data.searches.length === 0;

  const handleDownload = () => {
    const filename = downloadArchive();
    setLastExportFilename(filename);
    setStatus(`存档已下载：${filename}`);
  };

  const handleArchiveChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    const archive = parseDataArchive(await file.text());
    if (!archive) {
      setStatus('读取失败：这不是可识别的 Neural Connection 存档。');
      return;
    }
    if (!window.confirm('读取存档会覆盖同名本地数据，并保留当前未包含的项目。确定继续吗？')) return;

    const restoreResult = restoreDataArchive(archive);
    refresh();
    setStatus(restoreResult.failed > 0
      ? `存档已部分读取：${restoreResult.restored} 项成功，${restoreResult.failed} 项因存储受限未能持久保存。`
      : `已读取存档，导出于 ${formatDate(archive.exportedAt)}。`);
  };

  const handleClear = () => {
    if (!window.confirm('只清空浏览统计和搜索记录，不会删除故事进度、对话或 NCTB 数据。确定吗？')) return;
    clearAnalyticsData();
    refresh();
    setStatus('浏览统计已清空。');
  };

  return (
    <div className="analytics-page">
      <div className="analytics-shell">
        <header className="analytics-hero">
          <div>
            <p className="analytics-eyebrow"><span>08 / OTHER</span> LOCAL OBSERVATORY</p>
            <h1>数据统计</h1>
            <p className="analytics-lead">把你在这个宇宙里走过的路、停留的时间和搜索过的线索，整理成一份只属于你的本机观察报告。</p>
          </div>
          <div className="analytics-hero-actions">
            <Link className="analytics-secondary-action" to="/codex"><ArrowRight size={15} />返回其他入口</Link>
            <button className="analytics-secondary-action" type="button" onClick={refresh}><RefreshCw size={15} />刷新</button>
          </div>
        </header>

        <section className="analytics-privacy-note" aria-label="数据隐私说明">
          <ShieldCheck size={19} />
          <div><strong>本机数据 · 你来控制</strong><p>统计、存档与读档都在当前设备完成，不会自动上传。发送前请检查导出的文件；AI 密钥和令牌会被自动排除。</p></div>
        </section>

        <section className="analytics-section" aria-labelledby="analytics-overview-title">
          <div className="analytics-section-heading">
            <div><p className="analytics-eyebrow">OVERVIEW / {RANGE_LABELS[range]}</p><h2 id="analytics-overview-title">你的浏览切片</h2></div>
            <label className="analytics-range-label">统计范围<select value={range} onChange={(event) => setRange(event.target.value as RangeKey)}>{Object.entries(RANGE_LABELS).map(([key, label]) => <option value={key} key={key}>{label}</option>)}</select></label>
          </div>
          <div className="analytics-metric-grid">
            <MetricCard label="有效浏览时间" value={formatDuration(summary.totalDurationMs)} detail="仅统计页面可见时段" icon={Clock3} />
            <MetricCard label="访问次数" value={String(summary.visits.length)} detail="页面进入记录" icon={TrendingUp} />
            <MetricCard label="浏览页面" value={String(summary.uniquePages)} detail="去重后的路径" icon={BarChart3} />
            <MetricCard label="活跃天数" value={String(summary.activeDays)} detail={`${summary.sessions} 个浏览会话`} icon={History} />
            <MetricCard label="搜索次数" value={String(data.searches.length)} detail="搜索词也会写入存档" icon={Search} />
          </div>
        </section>

        {isFreshUser ? (
          <section className="analytics-fresh-panel" aria-label="新手引导">
            <h2>这里还是一张白纸</h2>
            <p>在这个宇宙里读几章故事、认识几位角色、玩几局游戏之后，你的本机观察报告就会长出来。</p>
            <div className="analytics-fresh-actions">
              <Link to="/stories">去读故事<ArrowRight size={14} /></Link>
              <Link to="/characters">认识角色<ArrowRight size={14} /></Link>
              <Link to="/playground/games">去游戏实验场<ArrowRight size={14} /></Link>
            </div>
          </section>
        ) : (
          <>
        <section className="analytics-chart-grid" aria-label="浏览图表">
          <article className="analytics-card analytics-chart-card">
            <header><div><p className="analytics-eyebrow">TIME SHARE</p><h2>时间都去了哪里</h2></div><span>按内容分类</span></header>
            {summary.categoryData.length === 0 ? <EmptyChart message="开始浏览几个页面后，这里会出现时间饼图。" /> : <div className="analytics-pie-layout">
              <div className="analytics-pie" aria-hidden="true"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={summary.categoryData} dataKey="minutes" nameKey="name" innerRadius="54%" outerRadius="82%" paddingAngle={2} stroke="none">{summary.categoryData.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}</Pie><Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value.toFixed(1)} 分钟`, '停留时间']} /></PieChart></ResponsiveContainer></div>
              <ul className="analytics-legend">{summary.categoryData.map((entry) => <li key={entry.name}><span style={{ background: entry.fill }} /><div><strong>{entry.name}</strong><small>{entry.minutes.toFixed(1)} 分钟 · {entry.visits} 次</small></div></li>)}</ul>
            </div>}
          </article>

          <article className="analytics-card analytics-chart-card">
            <header><div><p className="analytics-eyebrow">DAILY FLOW</p><h2>每日浏览趋势</h2></div><span>分钟 / 次数</span></header>
            <div className="analytics-chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={summary.trendData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><defs><linearGradient id="analytics-time-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#78e1d5" stopOpacity={0.35} /><stop offset="100%" stopColor="#78e1d5" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.08)" strokeDasharray="4 4" /><XAxis dataKey="label" tick={{ fill: '#8ea9aa', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis tick={{ fill: '#8ea9aa', fontSize: 10 }} tickLine={false} axisLine={false} allowDecimals={false} /><Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number, name: string) => [name === 'minutes' ? `${value} 分钟` : `${value} 次`, name === 'minutes' ? '浏览时间' : '访问次数']} /><Area type="monotone" dataKey="minutes" stroke="#78e1d5" fill="url(#analytics-time-fill)" strokeWidth={2.2} /></AreaChart></ResponsiveContainer></div>
          </article>

          <article className="analytics-card analytics-chart-card analytics-chart-card-wide">
            <header><div><p className="analytics-eyebrow">DAY PART</p><h2>你通常什么时候来</h2></div><span>按进入页面的小时统计</span></header>
            <div className="analytics-hour-chart"><ResponsiveContainer width="100%" height="100%"><BarChart data={summary.hourlyData} margin={{ top: 10, right: 8, left: -20, bottom: 0 }}><CartesianGrid stroke="rgba(255,255,255,.07)" vertical={false} /><XAxis dataKey="hour" interval={2} tick={{ fill: '#8ea9aa', fontSize: 10 }} tickLine={false} axisLine={false} /><YAxis allowDecimals={false} tick={{ fill: '#8ea9aa', fontSize: 10 }} tickLine={false} axisLine={false} /><Tooltip contentStyle={TOOLTIP_STYLE} itemStyle={TOOLTIP_ITEM_STYLE} formatter={(value: number) => [`${value} 次`, '访问']} /><Bar dataKey="visits" fill="#b8a6ff" radius={[4, 4, 0, 0]} /></BarChart></ResponsiveContainer></div>
          </article>
        </section>

        <section className="analytics-detail-grid" aria-label="浏览路径与页面排行">
          <article className="analytics-card">
            <header><div><p className="analytics-eyebrow">RECENT PATH</p><h2>最近浏览路径</h2></div><span>{summary.recentVisits.length} 条</span></header>
            {summary.recentVisits.length === 0 ? <EmptyChart message="还没有浏览记录。" /> : <div className="analytics-history-list">{summary.recentVisits.map((visit) => <Link to={visit.path} key={visit.id}><span className="analytics-history-dot" style={{ background: CATEGORY_COLORS[visit.category] }} /><span><strong>{visit.label}</strong><small>{visit.category} · {formatDate(visit.startedAt)} · {formatShortDuration(visit.durationMs)}</small></span><ArrowRight size={15} /></Link>)}</div>}
          </article>

          <article className="analytics-card">
            <header><div><p className="analytics-eyebrow">TOP PAGES</p><h2>停留最久的页面</h2></div><span>按有效时间</span></header>
            {summary.topPages.length === 0 ? <EmptyChart message="浏览后会在这里形成页面排行。" /> : <div className="analytics-top-pages">{summary.topPages.map((page, index) => { const max = summary.topPages[0]?.durationMs || 1; return <Link to={page.path} key={page.path}><span className="analytics-rank">{String(index + 1).padStart(2, '0')}</span><span className="analytics-top-page-copy"><strong>{page.label}</strong><small>{page.category} · {page.count} 次访问</small><i><b style={{ width: `${Math.max(3, (page.durationMs / max) * 100)}%`, background: CATEGORY_COLORS[page.category] }} /></i></span><em>{formatShortDuration(page.durationMs)}</em></Link>; })}</div>}
          </article>

          <article className="analytics-card">
            <header><div><p className="analytics-eyebrow">COMMON TRANSITIONS</p><h2>常见跳转</h2></div><span>相邻页面</span></header>
            {summary.transitions.length === 0 ? <EmptyChart message="再浏览几个不同页面后，这里会显示你的常见路线。" /> : <div className="analytics-transition-list">{summary.transitions.map((transition) => <div key={`${transition.from}-${transition.to}`}><span><strong>{transition.from}</strong><ArrowRight size={13} /><strong>{transition.to}</strong></span><em>{transition.count} 次</em></div>)}</div>}
          </article>

          <article className="analytics-card">
            <header><div><p className="analytics-eyebrow">SEARCH MEMORY</p><h2>搜索过什么</h2></div><span>{data.searches.length} 次搜索</span></header>
            {summary.searchSummaries.length === 0 ? <EmptyChart message="使用全站搜索后，关键词会出现在这里。" /> : <div className="analytics-search-list">{summary.searchSummaries.map((search) => <div key={search.query}><span><Search size={13} /><strong>{search.query}</strong><small>{search.count} 次 · 最近 {formatDate(search.lastAt)}</small></span><em>{search.resultCount} 结果</em></div>)}</div>}
          </article>
        </section>
          </>
        )}

        <section className="analytics-data-section" aria-labelledby="analytics-data-title">
          <div className="analytics-section-heading"><div><p className="analytics-eyebrow">ARCHIVE / RESTORE / EMAIL</p><h2 id="analytics-data-title">存档、读档与上传数据</h2></div><Archive size={25} /></div>
          <div className="analytics-data-grid">
            <article className="analytics-card analytics-archive-card">
              <div className="analytics-data-icon"><Archive size={20} /></div>
              <h3>存档与读档</h3>
              <p>导出浏览统计、搜索记录以及其他可迁移的本机站点数据。读取存档会覆盖同名记录，但保留当前未包含的数据。</p>
              <div className="analytics-button-row"><button type="button" className="analytics-primary-action" onClick={handleDownload}><Download size={15} />下载存档</button><button type="button" className="analytics-secondary-action" onClick={() => fileInputRef.current?.click()}><FileUp size={15} />读取存档</button><input ref={fileInputRef} className="analytics-visually-hidden" type="file" accept="application/json,.json" onChange={handleArchiveChange} aria-label="读取统计数据存档文件" /></div>
            </article>

            <article className="analytics-card analytics-archive-card">
              <div className="analytics-data-icon analytics-data-icon-mail"><Mail size={20} /></div>
              <h3>通过邮箱发送</h3>
              <p>先下载 JSON 存档，再打开邮箱编辑器。系统只会填好主题和说明，附件需要你手动添加，最后由你确认发送。</p>
              <div className="analytics-button-row"><button type="button" className="analytics-primary-action" onClick={() => openEmailGuide(lastExportFilename)}><Mail size={15} />打开邮箱引导</button></div>
            </article>

            <article className="analytics-card analytics-archive-card analytics-danger-card">
              <div className="analytics-data-icon analytics-data-icon-danger"><Trash2 size={20} /></div>
              <h3>清空浏览统计</h3>
              <p>只删除浏览时间、路径和搜索统计，不影响故事进度、AI 对话、NCTB 报告或已经下载的存档文件。</p>
              <div className="analytics-button-row"><button type="button" className="analytics-danger-action" onClick={handleClear}><Trash2 size={15} />清空统计</button></div>
            </article>
          </div>
          {status && <p className="analytics-status" role="status">{status}</p>}
        </section>
      </div>
    </div>
  );
}
