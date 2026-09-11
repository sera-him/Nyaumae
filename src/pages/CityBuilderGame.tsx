import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRightLeft,
  BookOpen,
  Building2,
  Clock3,
  Gauge,
  Handshake,
  Pause,
  Play,
  ShieldAlert,
  Users,
  X,
} from 'lucide-react';
import {
  ATTRIBUTE_BY_ID,
  ATTRIBUTE_DEFINITIONS,
  ATTRIBUTE_IDS,
  BUILDINGS,
  BUILDING_BY_ID,
  CITY_HALL_INDEX,
  ERA_LABELS,
  type AttributeId,
  type BuildingDefinition,
  type CityBuilderGameState,
} from '@/game/cityBuilder/model';
import {
  calculateFinalScores,
  calculateScores,
  canQueueBuilding,
  contributeToProject,
  createCityBuilderGame,
  exchangeColor,
  formatClock,
  getActiveConstructionCount,
  getBuildingCost,
  getConstructionSlots,
  getDevelopmentCapacity,
  getEventDefense,
  getEventDefinition,
  getExchangeCost,
  getOccupiedTileCount,
  getProductionRate,
  getProjectDefinition,
  getProjectMinimumContribution,
  getProjectRequirements,
  getProjectTotals,
  getRankingPointSchedule,
  getReserveCap,
  getTileUnlockEra,
  queueBuilding,
  respondToEvent,
  setCityFocus,
  tickCityBuilderGame,
} from '@/game/cityBuilder/engine';
import './CityBuilderGame.css';

const DURATION_OPTIONS = [
  { seconds: 6 * 60, label: '快速', detail: '6 分钟' },
  { seconds: 12 * 60, label: '标准', detail: '12 分钟' },
  { seconds: 18 * 60, label: '完整', detail: '18 分钟' },
] as const;

const SPEED_OPTIONS = [0.5, 1, 2] as const;
type GameSpeed = (typeof SPEED_OPTIONS)[number];

interface SessionStateEventDetail {
  gameId?: string;
  paused?: boolean;
}

const DIALOG_FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

function getDialogFocusableElements(dialog: HTMLElement): HTMLElement[] {
  return Array.from(dialog.querySelectorAll<HTMLElement>(DIALOG_FOCUSABLE_SELECTOR))
    .filter((element) => element.getClientRects().length > 0 && element.getAttribute('aria-hidden') !== 'true');
}

function useDialogFocusTrap<T extends HTMLElement>(
  dialogRef: React.RefObject<T | null>,
  onDismiss?: () => void,
  restoreFocusRef?: { readonly current: HTMLElement | null },
) {
  const dismissRef = useRef(onDismiss);

  useEffect(() => {
    dismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return undefined;

    const previousFocus = restoreFocusRef?.current
      ?? (document.activeElement instanceof HTMLElement ? document.activeElement : null);
    const focusInside = (preferLast = false) => {
      const focusable = getDialogFocusableElements(dialog);
      const target = preferLast
        ? focusable.at(-1)
        : dialog.querySelector<HTMLElement>('[data-dialog-initial-focus]') ?? focusable[0];
      (target ?? dialog).focus({ preventScroll: true });
    };
    const initialFocusFrame = window.requestAnimationFrame(() => focusInside());

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissRef.current) {
        event.preventDefault();
        event.stopPropagation();
        dismissRef.current();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getDialogFocusableElements(dialog);
      if (focusable.length === 0) {
        event.preventDefault();
        dialog.focus({ preventScroll: true });
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (event.shiftKey && (active === first || !dialog.contains(active))) {
        event.preventDefault();
        last.focus({ preventScroll: true });
      } else if (!event.shiftKey && (active === last || !dialog.contains(active))) {
        event.preventDefault();
        first.focus({ preventScroll: true });
      }
    };

    const handleFocusIn = (event: FocusEvent) => {
      if (event.target instanceof Node && !dialog.contains(event.target)) focusInside();
    };

    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('focusin', handleFocusIn, true);
    return () => {
      window.cancelAnimationFrame(initialFocusFrame);
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('focusin', handleFocusIn, true);
      window.requestAnimationFrame(() => {
        if (document.querySelector('[role="dialog"][aria-modal="true"]')) return;
        if (previousFocus?.isConnected && !previousFocus.closest('[inert]')) {
          previousFocus.focus({ preventScroll: true });
        }
      });
    };
  }, [dialogRef, restoreFocusRef]);
}

function CityDialogPortal({ children }: { children: React.ReactNode }) {
  if (typeof document === 'undefined') return null;
  return createPortal(children, document.body);
}

function attributeStyle(color: AttributeId) {
  const definition = ATTRIBUTE_BY_ID[color];
  return {
    '--city-color': definition.color,
    '--city-ink': definition.textColor,
  } as React.CSSProperties;
}

function formatValue(value: number): string {
  return value >= 10 ? value.toFixed(0) : value.toFixed(1);
}

function BuildingCost({ building }: { building: BuildingDefinition }) {
  const cost = getBuildingCost(building);
  return (
    <span className="city-cost-row" role="group" aria-label="彩色成本">
      {ATTRIBUTE_IDS.filter((color) => (cost[color] ?? 0) > 0).map((color) => (
        <span className="city-cost-chip" style={attributeStyle(color)} key={color}>
          <span aria-hidden="true">{ATTRIBUTE_BY_ID[color].icon}</span>
          {cost[color]}
          <span className="sr-only">{ATTRIBUTE_BY_ID[color].label}</span>
        </span>
      ))}
    </span>
  );
}

function ScoreFormula({ cityCount = 4 }: { cityCount?: number }) {
  const schedule = getRankingPointSchedule(cityCount);
  return (
    <div className="city-score-formula">
      <code>单色分 =（属性值 + 该色排名分）× 核心倍率</code>
      <span>{cityCount} 城排名分依次为 {schedule.join(' / ')}；核心色 ×2，其余 ×1；并列均分占据名次。</span>
    </div>
  );
}

function SubwayPricingLab() {
  const [distanceKm, setDistanceKm] = useState(8);
  const [weeklyRides, setWeeklyRides] = useState(10);
  const [peakRatio, setPeakRatio] = useState(60);

  const monthlyRides = weeklyRides * 4;
  const peakCost = monthlyRides * distanceKm * 1;
  const offPeakCost = monthlyRides * distanceKm * 0.1;
  const mixedCost = monthlyRides * distanceKm * (peakRatio / 100 + (1 - peakRatio / 100) * 0.1);
  const saving = peakCost - offPeakCost;
  const formatYuan = (value: number) => `${value.toLocaleString('zh-CN', { maximumFractionDigits: 1 })} 元`;

  return (
    <div className="city-subway-lab">
      <div className="city-subway-controls">
        <label>
          <span>单程距离</span>
          <input type="range" min={1} max={30} value={distanceKm} onChange={(event) => setDistanceKm(Number(event.target.value))} />
          <strong>{distanceKm} 千米</strong>
        </label>
        <label>
          <span>每周乘车次数</span>
          <input type="range" min={1} max={14} value={weeklyRides} onChange={(event) => setWeeklyRides(Number(event.target.value))} />
          <strong>{weeklyRides} 次</strong>
        </label>
        <label>
          <span>高峰时段占比</span>
          <input type="range" min={0} max={100} step={5} value={peakRatio} onChange={(event) => setPeakRatio(Number(event.target.value))} />
          <strong>{peakRatio}%</strong>
        </label>
      </div>
      <div className="city-subway-results">
        <span><i>全高峰（1 元/千米）</i><strong>{formatYuan(peakCost)} / 月</strong></span>
        <span><i>全低谷（0.1 元/千米）</i><strong>{formatYuan(offPeakCost)} / 月</strong></span>
        <span><i>按 {peakRatio}% 高峰的混合通勤</i><strong>{formatYuan(mixedCost)} / 月</strong></span>
      </div>
      <p>
        按 4 周估算：同样的通勤，错峰到低谷时段每月能省 {formatYuan(saving)}；
        混合方案的成本正好落在两端之间，说明该定价主要在为“时间选择”而不是“距离”收费。
      </p>
    </div>
  );
}

function Rulebook({
  onClose,
  cityCount = 4,
  restoreFocusRef,
}: {
  onClose: () => void;
  cityCount?: number;
  restoreFocusRef?: { readonly current: HTMLElement | null };
}) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocusTrap(dialogRef, onClose, restoreFocusRef);
  const closeRulebook = () => onClose();
  return (
    <CityDialogPortal>
    <section ref={dialogRef} className="city-dialog city-rulebook" id="city-full-rules" role="dialog" aria-modal="true" aria-labelledby="city-rules-title" tabIndex={-1}>
      <header>
        <div>
          <span>RULEBOOK / 实时基础版</span>
          <h2 id="city-rules-title">《建设城市》完整规则</h2>
        </div>
        <button
          type="button"
          onClick={closeRulebook}
          onKeyDown={(event) => {
            if (event.key !== 'Enter' && event.key !== ' ') return;
            event.preventDefault();
            closeRulebook();
          }}
          aria-label="关闭完整规则"
          data-dialog-initial-focus
        ><X /></button>
      </header>

      <div className="city-rulebook-grid">
        <article>
          <h3>1. 实时核心</h3>
          <p>所有城市同时生产、施工、合作和应对事件。没有回合、行动点或“轮到谁”。一局分为奠基、联动、都会三个等长时代，分别开放 1、2、3 级建筑。</p>
          <p>玩家随时可调整专注颜色、排入施工、交换颜色、投入区域项目和响应事件。暂停会同时冻结倒计时、生产与全部 AI。</p>
        </article>
        <article>
          <h3>2. 只有十二种颜色</h3>
          <p>每种颜色同时拥有永久属性与可花费储备。没有无色资金、建设力、能源、工人或万能分。建筑、成本、交换、项目、事件、日志和评分全部明确指向属性颜色。</p>
          <p>每城初始十二项属性均为 2、储备均为 3。市政厅持续生产十二色，核心色额外生产；🤎人口提高所有储备上限。</p>
        </article>
        <article>
          <h3>3. 施工与地图</h3>
          <p>5×5 地图中央是十二色市政厅，其余地块随三个时代分批开放。每城发展容量为 8 → 12 → 16 格；🔴基建达到 6、🤎人口达到 6 时各再增加 1 格，因此终局也必须取舍。1级建筑放在空地，高级建筑和地标在同色低一级建筑上原位升级。</p>
          <ul>
            <li>1级：3 主色 + 2/1 依赖色；基准 16 秒；属性 +1。</li>
            <li>2级：5 主色 + 3/2 依赖色；基准 26 秒；升级额外 +1，该地块累计 +2。</li>
            <li>地标：8 主色 + 5/4 依赖色；基准 42 秒；升级额外 +1，该地块累计 +3。</li>
          </ul>
          <p>建筑入队时支付原色成本，完成后才增加永久属性。正交相邻且具有依赖关系的颜色会同时成长，🟣文化会放大邻接奖励。时间按所选局长等比缩放；基础有 2 个施工槽，🔴基建达到 6、10 时各增加 1 槽并持续缩短工期。</p>
        </article>
        <article>
          <h3>4. 高阶门槛</h3>
          <p>2级建筑还要求🔵科技达到 2.5、主色达到 4、两种依赖色都达到 3。地标要求🔵科技达到 4、主色达到 8、依赖色都达到 6，并且至少六种属性达到 4。单色冲刺无法绕过城市网络。</p>
        </article>
        <article>
          <h3>5. 交换与合作</h3>
          <p>区域交换可把任意富余颜色换成任意紧缺颜色，🟡经济越高损耗越低。跨城项目要求至少两座城市各贡献总需求的 15%；完成后所有城市获得 0.1 项目色，合格成员再等额获得 0.7。🩷景区只放大临时储备，最高贡献者也只多获得临时储备，点击速度不能换来更多永久分。</p>
          <p>项目失败会退回每城 90% 的原色投入，再损失 0.5 项目色储备；没有无色“区域血条”，也不能用象征性投入搭便车。</p>
        </article>
        <article>
          <h3>6. 区域事件</h3>
          <p>事件先预警，再开放实时响应。每城可投入列出的三种响应颜色；永久属性提供基础防御，投入储备提高临时防御。成功增加事件色属性与储备，失败只损失事件色储备。</p>
          <p>⚪医疗偏向健康、人口与服务风险；⚫治安偏向科技、经济、客流与安全风险；🩵民生和⚫治安都会减少失败损失。</p>
        </article>
        <article>
          <h3>7. 评分与终局</h3>
          <ScoreFormula cityCount={cityCount} />
          <p>排名领先不会带来额外生产；落后城市会获得基础追赶增益，🩵民生会进一步放大它。末局不会再生成来不及结算的项目或事件；时间归零立即结算。总分相同时依次比较十二项属性总和、达到 6 的颜色数量，仍相同则共同第一。</p>
        </article>
        <article>
          <h3>8. AI 与公平</h3>
          <p>默认三名 AI 分别偏向均衡规划、核心专业化和区域合作；增加 AI 时还会出现韧性路线。它们与玩家使用相同初始颜色、施工时间、事件信息与交换规则，不获得隐藏资源。AI 会先处理危机，再判断有效合作、交换和建设。</p>
        </article>
        <article>
          <h3>9. 地铁定价提案</h3>
          <p>高峰期每千米 1 元，低谷期每千米 0.1 元。该提案作为城市交通价格实验，可接入建设城市的交通成本模拟。</p>
          <SubwayPricingLab />
        </article>
      </div>

      <h3 className="city-rulebook-attributes-title">十二属性都有独立作用</h3>
      <div className="city-rulebook-attributes">
        {ATTRIBUTE_DEFINITIONS.map((definition) => (
          <article key={definition.id} style={attributeStyle(definition.id)}>
            <strong><span aria-hidden="true">{definition.icon}</span>{definition.label}</strong>
            <span>{definition.role}</span>
            <p>{definition.mechanic}</p>
            <small>依赖：{definition.dependencies.map((color) => `${ATTRIBUTE_BY_ID[color].icon}${ATTRIBUTE_BY_ID[color].label}`).join(' + ')}</small>
          </article>
        ))}
      </div>
    </section>
    </CityDialogPortal>
  );
}

function SetupScreen({
  core,
  aiCount,
  duration,
  rulesOpen,
  onCore,
  onAiCount,
  onDuration,
  onRules,
  onStart,
}: {
  core: AttributeId;
  aiCount: number;
  duration: number;
  rulesOpen: boolean;
  onCore: (color: AttributeId) => void;
  onAiCount: (count: number) => void;
  onDuration: (seconds: number) => void;
  onRules: () => void;
  onStart: () => void;
}) {
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  return (
    <div className="city-builder city-setup">
      <section className="city-hero" inert={rulesOpen || undefined}>
        <span className="city-kicker">REAL-TIME / TWELVE-COLOR CITY NETWORK</span>
        <h1 id="city-setup-title" tabIndex={-1}>建设城市</h1>
        <p>你与默认三座 AI 城市同时发展。建筑、资源、项目、事件与最终评分都只使用十二种属性颜色；每一种颜色既是分数，也是解决另一种城市问题的工具。</p>
        <div className="city-hero-points">
          <span><Clock3 />连续实时</span>
          <span><Users />默认 3 个 AI</span>
          <span><Handshake />竞争中合作</span>
          <span><Building2 />5×5 城市规划</span>
        </div>
      </section>

      <section className="city-setup-panel" aria-labelledby="city-core-title" inert={rulesOpen || undefined}>
        <div className="city-section-heading">
          <div><span>01 / CITY IDENTITY</span><h2 id="city-core-title">选择核心色</h2></div>
          <p>核心色最终 ×2，也会多获得一点被动产出；它不是万能色，高阶建设仍需要两种依赖颜色。</p>
        </div>
        <div className="city-core-grid">
          {ATTRIBUTE_DEFINITIONS.map((definition) => (
            <button
              type="button"
              key={definition.id}
              className={core === definition.id ? 'is-selected' : ''}
              style={attributeStyle(definition.id)}
              aria-pressed={core === definition.id}
              onClick={() => onCore(definition.id)}
            >
              <span aria-hidden="true">{definition.icon}</span>
              <strong>{definition.label}</strong>
              <small>{definition.role}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="city-setup-options" aria-label="对局设置" inert={rulesOpen || undefined}>
        <div>
          <span>AI 城市</span>
          <div className="city-stepper">
            <button type="button" onClick={() => onAiCount(Math.max(1, aiCount - 1))} disabled={aiCount <= 1} aria-label="减少 AI 城市">−</button>
            <strong>{aiCount}<small>{aiCount === 3 ? '默认' : '可调'}</small></strong>
            <button type="button" onClick={() => onAiCount(Math.min(5, aiCount + 1))} disabled={aiCount >= 5} aria-label="增加 AI 城市">+</button>
          </div>
        </div>
        <div>
          <span>实时局长</span>
          <div className="city-duration-options">
            {DURATION_OPTIONS.map((option) => (
              <button
                type="button"
                key={option.seconds}
                className={duration === option.seconds ? 'is-selected' : ''}
                aria-pressed={duration === option.seconds}
                onClick={() => onDuration(option.seconds)}
              >
                <strong>{option.label}</strong><small>{option.detail}</small>
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="city-setup-actions" inert={rulesOpen || undefined}>
        <button ref={rulesButtonRef} type="button" className="city-secondary-button" onClick={onRules} aria-expanded={rulesOpen} aria-controls="city-full-rules"><BookOpen />{rulesOpen ? '收起完整规则' : '阅读完整规则'}</button>
        <button type="button" className="city-primary-button" onClick={onStart}><Play />启动城市群</button>
      </div>

      {rulesOpen && <Rulebook onClose={onRules} cityCount={aiCount + 1} restoreFocusRef={rulesButtonRef} />}
    </div>
  );
}

function Leaderboard({ game }: { game: CityBuilderGameState }) {
  const scores = calculateScores(game);
  return (
    <section className="city-leaderboard" aria-label="实时城市排名">
      {scores.slice().sort((a, b) => a.place - b.place).map((score) => {
        const city = game.cities.find((candidate) => candidate.id === score.cityId)!;
        return (
          <article key={city.id} className={city.isHuman ? 'is-human' : ''} style={attributeStyle(city.core)}>
            <span className="city-place">{score.place}</span>
            <span className="city-leader-core" aria-hidden="true">{ATTRIBUTE_BY_ID[city.core].icon}</span>
            <span><strong>{city.name}</strong><small>{city.isHuman ? '玩家' : city.aiStyle === 'cooperator' ? '联盟者 AI' : city.aiStyle === 'specialist' ? '专业者 AI' : city.aiStyle === 'resilient' ? '韧性 AI' : '规划者 AI'}</small></span>
            <b>{score.total.toFixed(1)}</b>
          </article>
        );
      })}
    </section>
  );
}

function ResourceBoard({ game, onFocus }: { game: CityBuilderGameState; onFocus: (color: AttributeId) => void }) {
  const city = game.cities.find((candidate) => candidate.id === game.humanCityId)!;
  const score = calculateScores(game).find((candidate) => candidate.cityId === city.id)!;
  return (
    <section className="city-resource-board" aria-labelledby="city-resources-title">
      <div className="city-section-heading compact">
        <div><span>FOCUS / 点击切换产出</span><h2 id="city-resources-title">十二色城市轨</h2></div>
        <p>属性是永久建设，储备会被花费。当前专注：{ATTRIBUTE_BY_ID[city.focus].icon}{ATTRIBUTE_BY_ID[city.focus].label}</p>
      </div>
      <div className="city-resource-grid">
        {ATTRIBUTE_DEFINITIONS.map((definition) => (
          <button
            type="button"
            key={definition.id}
            style={attributeStyle(definition.id)}
            className={city.focus === definition.id ? 'is-focused' : ''}
            aria-pressed={city.focus === definition.id}
            aria-label={`专注${definition.label}；属性${formatValue(city.attributes[definition.id])}；储备${formatValue(city.reserves[definition.id])}`}
            onClick={() => onFocus(definition.id)}
          >
            <span className="city-resource-name"><i aria-hidden="true">{definition.icon}</i><strong>{definition.label}</strong>{city.core === definition.id && <b>×2</b>}</span>
            <span className="city-resource-values"><span>A {formatValue(city.attributes[definition.id])}</span><span>Q {formatValue(city.reserves[definition.id])}</span></span>
            <small>+{getProductionRate(game, city, definition.id).toFixed(2)}/秒 · 排名分 {score.rankBonuses[definition.id].toFixed(1)}</small>
          </button>
        ))}
      </div>
    </section>
  );
}

function GameMap({
  game,
  selectedBuildingId,
  onTile,
}: {
  game: CityBuilderGameState;
  selectedBuildingId: string | null;
  onTile: (index: number) => void;
}) {
  const city = game.cities.find((candidate) => candidate.id === game.humanCityId)!;
  const selectedBuilding = selectedBuildingId ? BUILDING_BY_ID[selectedBuildingId] : null;
  const occupiedTiles = getOccupiedTileCount(city);
  const developmentCapacity = getDevelopmentCapacity(game, city);
  const capacityFull = occupiedTiles >= developmentCapacity;
  return (
    <section className="city-map-panel" aria-labelledby="city-map-title">
      <div className="city-panel-title">
        <div><span>URBAN GRID</span><h2 id="city-map-title">你的 5×5 城市</h2></div>
        <div className="city-map-stats">
          <span>{getActiveConstructionCount(city)} / {getConstructionSlots(city)} 施工槽</span>
          <span>{occupiedTiles} / {developmentCapacity} 发展容量</span>
        </div>
      </div>
      <div className={`city-map${selectedBuildingId ? ' is-placing' : ''}`}>
        {city.tiles.map((tile, index) => {
          if (index === CITY_HALL_INDEX) {
            return <div className="city-hall" key="city-hall"><span>十二色</span><strong>市政厅</strong><small>持续生产全部颜色</small></div>;
          }
          if (!tile) {
            const unlockEra = getTileUnlockEra(index);
            if (unlockEra > game.era) {
              return <div className="city-locked-tile" key={index}><span>时代 {unlockEra === 2 ? 'II' : 'III'}</span><small>待开放地块</small></div>;
            }
            const requiresUpgradeTarget = Boolean(selectedBuilding && selectedBuilding.tier > 1);
            const unavailable = capacityFull || requiresUpgradeTarget;
            return (
              <button
                type="button"
                className={`city-empty-tile${unavailable ? ' is-unavailable' : ''}`}
                key={index}
                onClick={() => onTile(index)}
                disabled={unavailable}
                aria-label={capacityFull ? `地块 ${index + 1}：发展容量已满` : requiresUpgradeTarget ? `地块 ${index + 1}：高级建筑必须原位升级` : selectedBuilding ? `在地块 ${index + 1} 建设${selectedBuilding.name}` : `空地块 ${index + 1}`}
              >
                <span>{capacityFull ? '×' : requiresUpgradeTarget ? '↥' : selectedBuilding ? '+' : '·'}</span>
              </button>
            );
          }
          const definition = BUILDING_BY_ID[tile.buildingId];
          const canUpgrade = Boolean(
            selectedBuilding
            && tile.status === 'complete'
            && selectedBuilding.color === tile.color
            && selectedBuilding.tier === definition.tier + 1,
          );
          const progress = tile.status === 'complete'
            ? 100
            : Math.max(0, Math.min(100, ((game.elapsed - tile.startedAt) / (tile.completeAt - tile.startedAt)) * 100));
          const content = <>
            <span aria-hidden="true">{ATTRIBUTE_BY_ID[tile.color].icon}</span>
            <strong>{definition.name}</strong>
            <small>T{definition.tier}{tile.status === 'building' ? ` · ${progress.toFixed(0)}%` : canUpgrade ? ' · 可升级' : ''}</small>
            {tile.status === 'building' && <i style={{ width: `${progress}%` }} />}
          </>;
          if (canUpgrade) {
            return (
              <button
                type="button"
                className="city-map-building is-upgrade-target"
                style={attributeStyle(tile.color)}
                key={tile.instanceId}
                onClick={() => onTile(index)}
                aria-label={`把${definition.name}升级为${selectedBuilding?.name}`}
              >{content}</button>
            );
          }
          return (
            <div
              className={`city-map-building${tile.status === 'building' ? ' is-building' : ''}`}
              style={attributeStyle(tile.color)}
              key={tile.instanceId}
              aria-label={`${definition.name}，${tile.status === 'building' ? `施工${progress.toFixed(0)}%` : '已完成'}`}
            >
              {content}
            </div>
          );
        })}
      </div>
      <p className="city-map-hint">{selectedBuilding ? (selectedBuilding.tier === 1 ? (capacityFull ? '发展容量已满：升级现有建筑，或把🔴基建、🤎人口提高到 6 来增加容量。' : `选择空地块放置“${selectedBuilding.name}”`) : `选择同色 T${selectedBuilding.tier - 1} 建筑升级为“${selectedBuilding.name}”`) : '先从右侧方案库选择建筑。依赖颜色正交相邻会同时成长。'}</p>
    </section>
  );
}

function BuildingLibrary({
  game,
  selectedColor,
  selectedBuildingId,
  onColor,
  onBuilding,
}: {
  game: CityBuilderGameState;
  selectedColor: AttributeId;
  selectedBuildingId: string | null;
  onColor: (color: AttributeId) => void;
  onBuilding: (buildingId: string | null) => void;
}) {
  const city = game.cities.find((candidate) => candidate.id === game.humanCityId)!;
  const buildings = BUILDINGS.filter((building) => building.color === selectedColor);
  return (
    <section className="city-library" aria-labelledby="city-library-title">
      <div className="city-panel-title">
        <div><span>BUILD QUEUE</span><h2 id="city-library-title">彩色建设方案</h2></div>
        <span>时代 {game.era}</span>
      </div>
      <div className="city-library-colors" role="group" aria-label="筛选建筑颜色">
        {ATTRIBUTE_DEFINITIONS.map((definition) => (
          <button
            type="button"
            key={definition.id}
            style={attributeStyle(definition.id)}
            className={selectedColor === definition.id ? 'is-selected' : ''}
            aria-pressed={selectedColor === definition.id}
            onClick={() => onColor(definition.id)}
            title={definition.label}
          ><span aria-hidden="true">{definition.icon}</span><span className="sr-only">{definition.label}</span></button>
        ))}
      </div>
      <div className="city-building-cards">
        {buildings.map((building) => {
          const previewTile = building.tier === 1
            ? city.tiles.findIndex((tile, index) => !tile && index !== CITY_HALL_INDEX && getTileUnlockEra(index) <= game.era)
            : city.tiles.findIndex((tile) => {
              if (!tile || tile.status !== 'complete' || tile.color !== building.color) return false;
              return BUILDING_BY_ID[tile.buildingId]?.tier === building.tier - 1;
            });
          const check = canQueueBuilding(game, city.id, building.id, previewTile);
          return (
            <button
              type="button"
              key={building.id}
              className={`${selectedBuildingId === building.id ? 'is-selected' : ''}${check.ok ? '' : ' is-unavailable'}`}
              style={attributeStyle(building.color)}
              aria-pressed={selectedBuildingId === building.id}
              disabled={!check.ok}
              onClick={() => onBuilding(selectedBuildingId === building.id ? null : building.id)}
            >
              <span className="city-building-card-top"><i>T{building.tier}</i><strong>{building.name}</strong><b>{building.tier === 1 ? `属性 +${building.gain}` : `升级 +1 · 累计 ${building.gain}`}</b></span>
              <p>{building.description}</p>
              <BuildingCost building={building} />
              <small className={check.ok ? 'is-ready' : ''}>{check.ok ? `可施工 · ${check.durationSeconds.toFixed(0)} 秒` : check.reason}</small>
            </button>
          );
        })}
      </div>
      <div className="city-dependency-note" style={attributeStyle(selectedColor)}>
        <strong>{ATTRIBUTE_BY_ID[selectedColor].icon}{ATTRIBUTE_BY_ID[selectedColor].label}</strong>
        <span>依赖 {ATTRIBUTE_BY_ID[selectedColor].dependencies.map((color) => `${ATTRIBUTE_BY_ID[color].icon}${ATTRIBUTE_BY_ID[color].label}`).join(' + ')}</span>
        <p>{ATTRIBUTE_BY_ID[selectedColor].mechanic}</p>
      </div>
    </section>
  );
}

function CooperationPanel({
  game,
  exchangeSource,
  onExchangeSource,
  onExchange,
  onContribute,
  onRespond,
}: {
  game: CityBuilderGameState;
  exchangeSource: AttributeId;
  onExchangeSource: (color: AttributeId) => void;
  onExchange: (target: AttributeId) => void;
  onContribute: (color: AttributeId) => void;
  onRespond: (color: AttributeId) => void;
}) {
  const city = game.cities.find((candidate) => candidate.id === game.humanCityId)!;
  const project = getProjectDefinition(game);
  const requirements = getProjectRequirements(game);
  const totals = getProjectTotals(game);
  const minimumProjectContribution = project ? getProjectMinimumContribution(game) : 0;
  const projectContributions = game.activeProject ? game.cities.map((candidate) => ({
    city: candidate,
    amount: ATTRIBUTE_IDS.reduce(
      (sum, color) => sum + game.activeProject!.contributions[candidate.id][color],
      0,
    ),
  })) : [];
  const event = getEventDefinition(game);
  const defense = getEventDefense(game, city.id);
  const eventIsWarning = Boolean(game.activeEvent && game.elapsed < game.activeEvent.warningEndsAt);
  return (
    <section className="city-network-panel" aria-label="区域交换、合作与事件">
      <article className="city-exchange-card">
        <header><ArrowRightLeft /><div><span>区域交换</span><strong>富余颜色 → 紧缺颜色</strong></div></header>
        <label>付出颜色
          <select value={exchangeSource} onChange={(eventValue) => onExchangeSource(eventValue.target.value as AttributeId)}>
            {ATTRIBUTE_DEFINITIONS.map((definition) => <option value={definition.id} key={definition.id}>{definition.icon} {definition.label} · {formatValue(city.reserves[definition.id])}</option>)}
          </select>
        </label>
        <p>当前付出 {getExchangeCost(city).toFixed(2)}，获得 1 点目标色；🟡经济越高损耗越低。</p>
        <div className="city-mini-color-grid">
          {ATTRIBUTE_DEFINITIONS.map((definition) => (
            <button
              type="button"
              key={definition.id}
              style={attributeStyle(definition.id)}
              disabled={definition.id === exchangeSource || city.reserves[exchangeSource] < getExchangeCost(city) || game.elapsed < city.nextExchangeAt}
              onClick={() => onExchange(definition.id)}
              aria-label={`换取1点${definition.label}`}
            ><span aria-hidden="true">{definition.icon}</span><span>{definition.label}</span></button>
          ))}
        </div>
      </article>

      <article className={`city-project-card${project ? ' is-active' : ''}`} style={project ? attributeStyle(project.color) : undefined}>
        <header><Handshake /><div><span>跨城项目</span><strong>{project?.name ?? '等待下一项区域计划'}</strong></div></header>
        {project && game.activeProject ? (
          <>
            <p>{project.description} 至少两城各投入 {minimumProjectContribution.toFixed(1)}，才算有效贡献。</p>
            <time>募资剩余 {formatClock(game.activeProject.endsAt - game.elapsed)}</time>
            <div className="city-project-contributors" role="list" aria-label="各城项目贡献">
              {projectContributions.map(({ city: contributor, amount }) => (
                <span role="listitem" key={contributor.id} style={attributeStyle(contributor.core)} className={amount + 0.0001 >= minimumProjectContribution ? 'is-qualified' : ''}>
                  <i aria-hidden="true">{ATTRIBUTE_BY_ID[contributor.core].icon}</i>
                  <b>{contributor.isHuman ? '你' : contributor.name}</b>
                  <strong>{amount.toFixed(1)}</strong>
                </span>
              ))}
            </div>
            <div className="city-requirement-list">
              {ATTRIBUTE_IDS.filter((color) => (requirements[color] ?? 0) > 0).map((color) => {
                const required = requirements[color] ?? 0;
                const total = totals[color];
                return (
                  <button type="button" key={color} style={attributeStyle(color)} disabled={total >= required || city.reserves[color] <= 0 || game.elapsed < city.nextProjectContributionAt} onClick={() => onContribute(color)}>
                    <span>{ATTRIBUTE_BY_ID[color].icon}{ATTRIBUTE_BY_ID[color].label}</span><strong>{total.toFixed(1)} / {required.toFixed(1)}</strong><i style={{ width: `${Math.min(100, (total / required) * 100)}%` }} />
                  </button>
                );
              })}
            </div>
          </>
        ) : <p>{Number.isFinite(game.nextProjectAt) ? `新项目将在 ${formatClock(game.nextProjectAt - game.elapsed)} 后开放。AI 会判断自身收益，但区域合作通常比独自囤积更有效。` : '本局剩余时间不足以完成新项目，区域建设已收官。'}</p>}
      </article>

      <article className={`city-event-card${event ? ' is-active' : ''}`} style={event ? attributeStyle(event.color) : undefined}>
        <header><ShieldAlert /><div><span>区域事件</span><strong>{event?.name ?? '城市群目前平稳'}</strong></div></header>
        {event && game.activeEvent ? (
          <>
            <p>{event.description}</p>
            <time>{eventIsWarning ? '预警' : '响应'}剩余 {formatClock((eventIsWarning ? game.activeEvent.warningEndsAt : game.activeEvent.endsAt) - game.elapsed)}</time>
            <div className="city-defense-meter"><span style={{ width: `${Math.min(100, (defense.defense / defense.threshold) * 100)}%` }} /><strong>{defense.defense.toFixed(1)} / {defense.threshold.toFixed(1)}</strong></div>
            <div className="city-event-actions">
              {event.responses.map((color) => (
                <button type="button" key={color} style={attributeStyle(color)} disabled={eventIsWarning || city.reserves[color] < 1 || defense.ready} onClick={() => onRespond(color)}>
                  <span aria-hidden="true">{ATTRIBUTE_BY_ID[color].icon}</span>{ATTRIBUTE_BY_ID[color].label} −1
                </button>
              ))}
            </div>
            <small>{defense.ready ? '当前防御已达标' : eventIsWarning ? '预警期可先调整专注与交换颜色' : '投入响应色，避免损失事件对应储备'}</small>
          </>
        ) : <p>{Number.isFinite(game.nextEventAt) ? `下一次预警约在 ${formatClock(game.nextEventAt - game.elapsed)} 后。每个事件只影响明确的属性颜色。` : '本局不会再出现来不及结算的新事件。'}</p>}
      </article>
    </section>
  );
}

function FinalResults({ game, onNewGame }: { game: CityBuilderGameState; onNewGame: () => void }) {
  const dialogRef = useRef<HTMLElement>(null);
  useDialogFocusTrap(dialogRef);
  const scores = calculateFinalScores(game).slice().sort((a, b) => a.place - b.place);
  const leaders = game.winnerIds.flatMap((cityId) => {
    const city = game.cities.find((candidate) => candidate.id === cityId);
    return city ? [city] : [];
  });
  const humanCity = game.cities.find((city) => city.id === game.humanCityId)!;
  const humanScore = scores.find((score) => score.cityId === game.humanCityId)!;
  const leaderNames = leaders.map((city) => city.isHuman ? '你的城市' : city.name).join('、');
  return (
    <CityDialogPortal>
    <section ref={dialogRef} className="city-dialog city-final" role="dialog" aria-modal="true" aria-labelledby="city-final-title" tabIndex={-1}>
      <span>FINAL CITY NETWORK REPORT</span>
      <h2 id="city-final-title">{leaders.length > 1 ? `${leaderNames}并列第一` : `${leaderNames}获得第一名`}</h2>
      <p>终局分由十二种颜色分别结算。领先排名不会制造更多资源；真正拉开差距的是属性建设、跨色依赖与核心色规划。</p>
      <div className="city-final-ranking">
        {scores.map((score) => {
          const city = game.cities.find((candidate) => candidate.id === score.cityId)!;
          return <article key={city.id} style={attributeStyle(city.core)}><b>{score.place}</b><span><strong>{city.name}</strong><small>{ATTRIBUTE_BY_ID[city.core].icon}{ATTRIBUTE_BY_ID[city.core].label}核心</small></span><em>{score.total.toFixed(1)}</em></article>;
        })}
      </div>
      <ScoreFormula cityCount={game.cities.length} />
      <section className="city-final-colors" aria-label="你的十二色得分明细">
        <h3>你的十二色得分</h3>
        <div>
          {ATTRIBUTE_DEFINITIONS.map((definition) => (
            <article key={definition.id} style={attributeStyle(definition.id)}>
              <span><i aria-hidden="true">{definition.icon}</i><b>{definition.label}</b>{humanCity.core === definition.id && <em>×2</em>}</span>
              <small>{humanCity.attributes[definition.id].toFixed(1)} + 排名 {humanScore.rankBonuses[definition.id].toFixed(1)}</small>
              <strong>{humanScore.attributeScores[definition.id].toFixed(1)}</strong>
            </article>
          ))}
        </div>
      </section>
      <div className="city-final-metrics">
        <span><strong>{Object.values(game.metrics.buildsByColor).reduce((sum, value) => sum + value, 0)}</strong>完成建筑</span>
        <span><strong>{game.metrics.completedProjects}/{game.metrics.resolvedProjects}</strong>合作项目</span>
        <span><strong>{game.metrics.successfulEventDefenses}</strong>城市事件防御</span>
        <span><strong>{game.metrics.exchanges}</strong>彩色交换</span>
      </div>
      <button type="button" className="city-primary-button" onClick={onNewGame} data-dialog-initial-focus>重新选择核心色</button>
    </section>
    </CityDialogPortal>
  );
}

function PauseDialog({
  aiCount,
  onResume,
  restoreFocusRef,
}: {
  aiCount: number;
  onResume: () => void;
  restoreFocusRef: { readonly current: HTMLElement | null };
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap(dialogRef, onResume, restoreFocusRef);
  return (
    <CityDialogPortal>
    <div ref={dialogRef} className="city-dialog city-local-pause" role="dialog" aria-modal="true" aria-label="游戏已暂停" tabIndex={-1}>
      <Pause />
      <strong>城市群已暂停</strong>
      <span>计时、生产、施工与 {aiCount} 个 AI 全部冻结。</span>
      <button type="button" onClick={onResume} data-dialog-initial-focus><Play />继续运行</button>
    </div>
    </CityDialogPortal>
  );
}

export default function CityBuilderGame() {
  const [core, setCore] = useState<AttributeId>('technology');
  const [aiCount, setAiCount] = useState(3);
  const [duration, setDuration] = useState(12 * 60);
  const [game, setGame] = useState<CityBuilderGameState | null>(null);
  const [selectedColor, setSelectedColor] = useState<AttributeId>('technology');
  const [selectedBuildingId, setSelectedBuildingId] = useState<string | null>(null);
  const [exchangeSource, setExchangeSource] = useState<AttributeId>('economy');
  const [speed, setSpeed] = useState<GameSpeed>(1);
  const [localPaused, setLocalPaused] = useState(false);
  const [sessionPaused, setSessionPaused] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const gameHeaderRef = useRef<HTMLElement>(null);
  const rulesButtonRef = useRef<HTMLButtonElement>(null);
  const pauseButtonRef = useRef<HTMLButtonElement>(null);

  const status = game?.status;
  const paused = localPaused || sessionPaused || (status === 'running' && rulesOpen);
  const scores = useMemo(() => game ? calculateScores(game) : [], [game]);
  const humanScore = game ? scores.find((score) => score.cityId === game.humanCityId) ?? null : null;
  const gameSeed = game?.seed;

  useEffect(() => {
    const handleSessionState = (event: Event) => {
      const detail = (event as CustomEvent<SessionStateEventDetail>).detail;
      if (detail?.gameId === 'city-builder') setSessionPaused(Boolean(detail.paused));
    };
    window.addEventListener('nc-game-session-state', handleSessionState);
    return () => window.removeEventListener('nc-game-session-state', handleSessionState);
  }, []);

  useEffect(() => {
    if (status !== 'running' || paused) return undefined;
    let previous = performance.now();
    let accumulator = 0;
    const interval = window.setInterval(() => {
      const now = performance.now();
      accumulator += Math.min(0.5, (now - previous) / 1000) * speed;
      previous = now;
      if (accumulator < 0.25) return;
      setGame((current) => {
        if (!current || current.status !== 'running') return current;
        let next = current;
        let steps = 0;
        while (accumulator >= 0.25 && steps < 8) {
          next = tickCityBuilderGame(next, 0.25);
          accumulator -= 0.25;
          steps += 1;
        }
        return next;
      });
    }, 100);
    return () => window.clearInterval(interval);
  }, [paused, speed, status]);

  useEffect(() => {
    if (!notice) return undefined;
    const timeout = window.setTimeout(() => setNotice(''), 2400);
    return () => window.clearTimeout(timeout);
  }, [notice]);

  useEffect(() => {
    if (gameSeed === undefined) return undefined;
    const frame = window.requestAnimationFrame(() => {
      const header = gameHeaderRef.current;
      if (!header) return;
      const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      header.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'auto' : 'smooth' });
      header.focus({ preventScroll: true });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [gameSeed]);

  const startGame = () => {
    setSelectedColor(core);
    setSelectedBuildingId(null);
    setLocalPaused(false);
    setSpeed(1);
    setRulesOpen(false);
    setGame(createCityBuilderGame({ playerCore: core, aiCount, durationSeconds: duration }));
  };

  const focusColor = (color: AttributeId) => {
    if (paused) return;
    setGame((current) => current ? setCityFocus(current, current.humanCityId, color) : current);
  };

  const placeBuilding = (tileIndex: number) => {
    if (!game || !selectedBuildingId || paused) return;
    const check = canQueueBuilding(game, game.humanCityId, selectedBuildingId, tileIndex);
    if (!check.ok) {
      setNotice(check.reason);
      return;
    }
    setGame(queueBuilding(game, game.humanCityId, selectedBuildingId, tileIndex));
    setSelectedBuildingId(null);
  };

  const returnToSetup = () => {
    setGame(null);
    window.requestAnimationFrame(() => {
      document.getElementById('city-setup-title')?.focus({ preventScroll: true });
    });
  };

  if (!game) {
    return (
      <SetupScreen
        core={core}
        aiCount={aiCount}
        duration={duration}
        rulesOpen={rulesOpen}
        onCore={setCore}
        onAiCount={setAiCount}
        onDuration={setDuration}
        onRules={() => setRulesOpen((value) => !value)}
        onStart={startGame}
      />
    );
  }

  const humanCity = game.cities.find((city) => city.id === game.humanCityId)!;
  const remaining = game.durationSeconds - game.elapsed;
  const progress = (game.elapsed / game.durationSeconds) * 100;

  return (
    <div className="city-builder city-game" data-paused={paused || undefined}>
      <div className="city-game-surface" inert={localPaused || rulesOpen || game.status === 'finished' || undefined}>
      <header className="city-game-header" ref={gameHeaderRef} tabIndex={-1}>
        <div className="city-game-identity">
          <span className="city-kicker">CITY NETWORK / {ERA_LABELS[game.era]}</span>
          <h1>建设城市</h1>
        </div>
        <div className="city-clock" role="timer" aria-label={`剩余时间 ${formatClock(remaining)}`}>
          <Clock3 />
          <span><strong>{formatClock(remaining)}</strong><small>时代 {game.era} / 3</small></span>
          <i><b style={{ width: `${progress}%` }} /></i>
        </div>
        <div className="city-live-score">
          <span>实时预测</span>
          <strong>{humanScore?.total.toFixed(1)}</strong>
          <small>第 {humanScore?.place} / {game.cities.length}</small>
        </div>
        <div className="city-game-controls">
          <button ref={rulesButtonRef} type="button" onClick={() => setRulesOpen((value) => !value)} aria-expanded={rulesOpen} aria-controls="city-full-rules"><BookOpen />规则</button>
          <button ref={pauseButtonRef} type="button" onClick={() => setLocalPaused((value) => !value)}>{localPaused ? <Play /> : <Pause />}{localPaused ? '继续' : '暂停'}</button>
          <div className="city-speed-control" role="group" aria-label="游戏速度">
            <Gauge />
            {SPEED_OPTIONS.map((option) => <button type="button" key={option} aria-pressed={speed === option} className={speed === option ? 'is-selected' : ''} onClick={() => setSpeed(option)}>{option}×</button>)}
          </div>
        </div>
      </header>

      <Leaderboard game={game} />

      <ResourceBoard game={game} onFocus={focusColor} />

      <main className="city-main-grid">
        <GameMap game={game} selectedBuildingId={selectedBuildingId} onTile={placeBuilding} />
        <BuildingLibrary
          game={game}
          selectedColor={selectedColor}
          selectedBuildingId={selectedBuildingId}
          onColor={(color) => { setSelectedColor(color); setSelectedBuildingId(null); }}
          onBuilding={setSelectedBuildingId}
        />
      </main>

      <CooperationPanel
        game={game}
        exchangeSource={exchangeSource}
        onExchangeSource={setExchangeSource}
        onExchange={(target) => !paused && setGame((current) => current ? exchangeColor(current, current.humanCityId, exchangeSource, target) : current)}
        onContribute={(color) => !paused && setGame((current) => current ? contributeToProject(current, current.humanCityId, color) : current)}
        onRespond={(color) => !paused && setGame((current) => current ? respondToEvent(current, current.humanCityId, color) : current)}
      />

      <section className="city-activity" aria-label="城市群动态" aria-live="polite">
        <header><span>LIVE LOG</span><strong>城市群动态</strong></header>
        <div>{game.logs.slice(0, 8).map((entry) => <p key={entry.id} style={attributeStyle(entry.color)}><time>{formatClock(entry.at)}</time><span aria-hidden="true">{ATTRIBUTE_BY_ID[entry.color].icon}</span>{entry.text}</p>)}</div>
      </section>

      <footer className="city-game-summary">
        <span>{ATTRIBUTE_BY_ID[humanCity.core].icon}{ATTRIBUTE_BY_ID[humanCity.core].label}核心 ×2</span>
        <span>{getActiveConstructionCount(humanCity)}/{getConstructionSlots(humanCity)} 施工中</span>
        <span>储备上限 {getReserveCap(humanCity)}</span>
        <span>{game.cities.length - 1} 个 AI 同步运行</span>
      </footer>
      </div>

      {rulesOpen && <Rulebook onClose={() => setRulesOpen(false)} cityCount={game.cities.length} restoreFocusRef={rulesButtonRef} />}
      {localPaused && <PauseDialog aiCount={game.cities.length - 1} onResume={() => setLocalPaused(false)} restoreFocusRef={pauseButtonRef} />}
      {notice && <div className="city-notice" role="status">{notice}</div>}
      {game.status === 'finished' && <FinalResults game={game} onNewGame={returnToSetup} />}
    </div>
  );
}
