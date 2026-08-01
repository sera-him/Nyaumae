import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { TrendingUp, Settings2, Crosshair } from 'lucide-react';

interface ModelDef {
  name: string;
  color: string;
  fn: (x: number) => number;
}

const models: ModelDef[] = [
  { name: '立方(咪呀)', color: '#00E5CC', fn: (x) => 9.89 * Math.pow(x, 3) },
  { name: '立方(无婴)', color: '#F59E0B', fn: (x) => 11.95 * Math.pow(x, 3) },
  { name: '立方', color: '#8B5CF6', fn: (x) => 14.0 * Math.pow(x, 3) },
  { name: '平方', color: '#EC4899', fn: (x) => 16.29 * x * x },
  { name: '牛津', color: '#F472B6', fn: (x) => 16.24 * Math.pow(x, 2.15) },
  { name: '多项', color: '#6366F1', fn: (x) => 9.73 * Math.pow(x, 1.64) + 6.09 * Math.pow(x, 3.0) },
  { name: '复合', color: '#06B6D4', fn: (x) => 15.28 * Math.pow(x, 1.97) * Math.pow(1 + Math.pow(x, 65.37), 0.0062) },
  { name: '约束', color: '#A78BFA', fn: (x) => 10.23 * Math.pow(x, 3.0) + 5.15 - 76213.41 * Math.exp(-18.45 * Math.max(x, 0.55)) },
  { name: '线偏', color: '#94A3B8', fn: (x) => Math.max(73.58 * x - 69.22, 24.85 * x - 9.09) },
  { name: '无约束', color: '#64748B', fn: (x) => 6.74 * Math.pow(x, 3.78) + 8.75 - 175.10 * Math.exp(-6.44 * Math.max(x, 0.524)) },
];

const PADDING = { top: 40, right: 40, bottom: 60, left: 70 };
const CANVAS_H = 420;

interface RangeState {
  xMin: number;
  xMax: number;
  yMax: number;
}

interface TooltipData {
  x: number;      // canvas px
  y: number;      // canvas px
  heightM: number;
  modelValues: { name: string; color: string; weight: number }[];
}

function niceStep(range: number, maxTicks: number): number {
  const rough = range / maxTicks;
  const mag = Math.pow(10, Math.floor(Math.log10(rough)));
  const residual = rough / mag;
  if (residual <= 1.5) return mag;
  if (residual <= 3) return 2 * mag;
  if (residual <= 7) return 5 * mag;
  return 10 * mag;
}

function drawChart(
  canvas: HTMLCanvasElement,
  dpr: number,
  width: number,
  height: number,
  activeModels: Set<number>,
  range: RangeState,
  hoverX: number | null,
  tooltipData: TooltipData | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(dpr, dpr);

  const { xMin, xMax, yMax } = range;
  const chartW = width - PADDING.left - PADDING.right;
  const chartH = height - PADDING.top - PADDING.bottom;

  const xScale = (v: number) => PADDING.left + ((v - xMin) / (xMax - xMin)) * chartW;
  const yScale = (v: number) => PADDING.top + (1 - v / yMax) * chartH;

  // Grid
  ctx.strokeStyle = 'rgba(139, 92, 246, 0.08)';
  ctx.lineWidth = 1;

  const xStep = niceStep(xMax - xMin, 8);
  const yStep = niceStep(yMax, 6);

  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 0.001; x += xStep) {
    const px = xScale(x);
    ctx.beginPath();
    ctx.moveTo(px, PADDING.top);
    ctx.lineTo(px, PADDING.top + chartH);
    ctx.stroke();
  }

  for (let y = 0; y <= yMax + 0.001; y += yStep) {
    const py = yScale(y);
    ctx.beginPath();
    ctx.moveTo(PADDING.left, py);
    ctx.lineTo(PADDING.left + chartW, py);
    ctx.stroke();
  }

  // Axes
  ctx.strokeStyle = 'rgba(155, 139, 181, 0.3)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(PADDING.left, PADDING.top);
  ctx.lineTo(PADDING.left, PADDING.top + chartH);
  ctx.lineTo(PADDING.left + chartW, PADDING.top + chartH);
  ctx.stroke();

  // X labels
  ctx.fillStyle = '#9B8BB5';
  ctx.font = '11px "JetBrains Mono", monospace';
  ctx.textAlign = 'center';
  for (let x = Math.ceil(xMin / xStep) * xStep; x <= xMax + 0.001; x += xStep) {
    ctx.fillText(x.toFixed(xStep < 1 ? 1 : 0) + 'm', xScale(x), PADDING.top + chartH + 22);
  }

  // Y labels
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  for (let y = 0; y <= yMax + 0.001; y += yStep) {
    ctx.fillText(Math.round(y) + 'kg', PADDING.left - 12, yScale(y));
  }

  // Axis titles
  ctx.fillStyle = '#C4B5E0';
  ctx.font = '12px "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('身高 (m)', PADDING.left + chartW / 2, height - 12);
  ctx.save();
  ctx.translate(16, PADDING.top + chartH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('体重 (kg)', 0, 0);
  ctx.restore();

  // Draw curves
  models.forEach((model, idx) => {
    if (!activeModels.has(idx)) return;

    ctx.strokeStyle = model.color;
    ctx.lineWidth = idx === 0 ? 3 : 1.5;
    ctx.beginPath();

    const steps = 400;
    let first = true;
    for (let i = 0; i <= steps; i++) {
      const x = xMin + (i / steps) * (xMax - xMin);
      const y = model.fn(x);
      if (y < 0 || y > yMax * 1.1) {
        first = true;
        continue;
      }
      const px = xScale(x);
      const py = yScale(y);
      if (first) {
        ctx.moveTo(px, py);
        first = false;
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.stroke();
  });

  // Hover crosshair
  if (hoverX !== null && hoverX >= PADDING.left && hoverX <= PADDING.left + chartW) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(hoverX, PADDING.top);
    ctx.lineTo(hoverX, PADDING.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Tooltip dots
  if (tooltipData) {
    const { x: tx, modelValues } = tooltipData;

    // Vertical guide line
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 3]);
    ctx.beginPath();
    ctx.moveTo(tx, PADDING.top);
    ctx.lineTo(tx, PADDING.top + chartH);
    ctx.stroke();
    ctx.setLineDash([]);

    // Dots for each model
    modelValues.forEach((mv) => {
      const py = yScale(mv.weight);
      if (py < PADDING.top || py > PADDING.top + chartH) return;

      // Outer ring
      ctx.fillStyle = mv.color + '40';
      ctx.beginPath();
      ctx.arc(tx, py, 10, 0, Math.PI * 2);
      ctx.fill();

      // Inner dot
      ctx.fillStyle = mv.color;
      ctx.beginPath();
      ctx.arc(tx, py, 4, 0, Math.PI * 2);
      ctx.fill();

      // White center
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(tx, py, 2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  ctx.restore();
}

export default function HeightWeightChart() {
  const { ref, isVisible } = useScrollReveal();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeModels, setActiveModels] = useState<Set<number>>(new Set([0, 1, 2, 5, 6]));

  const [range, setRange] = useState<RangeState>({ xMin: 0.3, xMax: 2.5, yMax: 130 });
  const [showRangePanel, setShowRangePanel] = useState(false);

  const [hoverX, setHoverX] = useState<number | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = container.getBoundingClientRect();
    const w = rect.width;
    canvas.width = w * dpr;
    canvas.height = CANVAS_H * dpr;
    canvas.style.width = w + 'px';
    canvas.style.height = CANVAS_H + 'px';
    drawChart(canvas, dpr, w, CANVAS_H, activeModels, range, hoverX, tooltip);
  }, [activeModels, range, hoverX, tooltip]);

  useEffect(() => {
    redraw();
  }, [redraw]);

  // Resize handler
  useEffect(() => {
    const onResize = () => redraw();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [redraw]);

  const toggleModel = (idx: number) => {
    setActiveModels((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  };

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>): { cx: number; cy: number } | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0]?.clientX ?? e.changedTouches[0]?.clientX ?? 0 : e.clientX;
    const clientY = 'touches' in e ? e.touches[0]?.clientY ?? e.changedTouches[0]?.clientY ?? 0 : e.clientY;
    return { cx: clientX - rect.left, cy: clientY - rect.top };
  };

  const buildTooltip = useCallback((canvasX: number): TooltipData | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const chartW = w - PADDING.left - PADDING.right;

    if (canvasX < PADDING.left || canvasX > PADDING.left + chartW) return null;

    const { xMin, xMax, yMax } = range;
    const heightM = xMin + ((canvasX - PADDING.left) / chartW) * (xMax - xMin);

    const modelValues: { name: string; color: string; weight: number }[] = [];
    models.forEach((model, idx) => {
      if (!activeModels.has(idx)) return;
      const weight = model.fn(heightM);
      if (weight >= 0 && weight <= yMax * 1.1) {
        modelValues.push({ name: model.name, color: model.color, weight });
      }
    });

    if (modelValues.length === 0) return null;

    return { x: canvasX, y: 0, heightM, modelValues };
  }, [range, activeModels]);

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    const data = buildTooltip(pos.cx);
    setTooltip((prev) => {
      if (prev && data && Math.abs(prev.heightM - data.heightM) < 0.001) {
        return null; // toggle off if clicking same spot
      }
      return data;
    });
  }, [buildTooltip]);

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const pos = getCanvasPos(e);
    if (!pos) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const w = rect.width;
    const chartW = w - PADDING.left - PADDING.right;

    if (pos.cx >= PADDING.left && pos.cx <= PADDING.left + chartW) {
      setHoverX(pos.cx);
    } else {
      setHoverX(null);
    }
  }, []);

  const handleCanvasLeave = useCallback(() => {
    setHoverX(null);
  }, []);

  // Tooltip popup position (CSS pixels relative to container)
  const tooltipPopupPos = (() => {
    if (!tooltip) return null;
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return null;

    let left = tooltip.x;
    // Clamp so tooltip doesn't go off right edge
    const maxLeft = rect.width - 200;
    if (left > maxLeft) left = maxLeft;
    if (left < 10) left = 10;

    return { left, top: 20 };
  })();

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={isVisible ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: 0.4 }}
      className="height-weight-motion bg-nc-bg border border-nc-violet/10 rounded-xl overflow-hidden"
      ref={ref}
    >
      <div className="px-6 py-4 border-b border-nc-violet/10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-nc-text-secondary" />
          <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight("身高-体重模型曲线")}</h3>
          <span className="text-xs text-nc-text-muted ml-2">
            {range.xMin.toFixed(1)}m — {range.xMax.toFixed(1)}m · 0–{Math.round(range.yMax)}kg
          </span>
        </div>
        <button
          onClick={() => setShowRangePanel(!showRangePanel)}
          className={`height-weight-settings flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all ${
            showRangePanel
              ? 'bg-nc-bg-tertiary text-nc-cyan border border-nc-cyan/30'
              : 'text-nc-text-secondary hover:text-nc-text hover:bg-nc-bg-tertiary border border-transparent'
          }`}
        >
          <Settings2 className="w-3.5 h-3.5" />
          范围
        </button>
      </div>

      {/* Legend / toggles */}
      <div className="px-6 py-3 flex flex-wrap gap-2 border-b border-nc-violet/5">
        {models.map((m, i) => (
          <button
            key={m.name}
            onClick={() => toggleModel(i)}
            className={`height-weight-series flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
              activeModels.has(i)
                ? 'bg-nc-bg-tertiary'
                : 'bg-nc-bg opacity-40 hover:opacity-70'
            }`}
          >
            <span className="w-2.5 h-0.5 rounded-full inline-block" style={{ backgroundColor: m.color }} />
            <span style={{ color: activeModels.has(i) ? m.color : '#5A4D6E' }}>{m.name}</span>
          </button>
        ))}
      </div>

      {/* Range adjustment panel */}
      <AnimatePresence>
        {showRangePanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-b border-nc-violet/10"
          >
            <div className="px-6 py-4 space-y-4">
              {/* X Min */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-nc-text-muted w-20 shrink-0">身高最小</label>
                <input
                  type="range"
                  min={0.1}
                  max={range.xMax - 0.1}
                  step={0.1}
                  value={range.xMin}
                  onChange={(e) => setRange((r) => ({ ...r, xMin: parseFloat(e.target.value) }))}
                  className="flex-1 accent-nc-cyan h-1"
                />
                <span className="text-xs font-mono text-nc-cyan w-12 text-right">{range.xMin.toFixed(1)}m</span>
              </div>
              {/* X Max */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-nc-text-muted w-20 shrink-0">身高最大</label>
                <input
                  type="range"
                  min={range.xMin + 0.1}
                  max={3.0}
                  step={0.1}
                  value={range.xMax}
                  onChange={(e) => setRange((r) => ({ ...r, xMax: parseFloat(e.target.value) }))}
                  className="flex-1 accent-nc-cyan h-1"
                />
                <span className="text-xs font-mono text-nc-cyan w-12 text-right">{range.xMax.toFixed(1)}m</span>
              </div>
              {/* Y Max */}
              <div className="flex items-center gap-3">
                <label className="text-xs text-nc-text-muted w-20 shrink-0">体重最大</label>
                <input
                  type="range"
                  min={20}
                  max={300}
                  step={10}
                  value={range.yMax}
                  onChange={(e) => setRange((r) => ({ ...r, yMax: parseFloat(e.target.value) }))}
                  className="flex-1 accent-nc-cyan h-1"
                />
                <span className="text-xs font-mono text-nc-cyan w-12 text-right">{Math.round(range.yMax)}kg</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Canvas area with tooltip */}
      <div ref={containerRef} className="w-full px-2 py-4 relative">
        <canvas
          ref={canvasRef}
          className="height-weight-canvas w-full rounded-lg cursor-crosshair"
          onClick={handleCanvasClick}
          onMouseMove={handleCanvasMove}
          onMouseLeave={handleCanvasLeave}
        />

        {/* Tooltip popup */}
        <AnimatePresence>
          {tooltip && tooltipPopupPos && (
            <motion.div
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.15 }}
              className="absolute z-10 pointer-events-none"
              style={{ left: tooltipPopupPos.left, top: tooltipPopupPos.top }}
            >
              <div className="bg-nc-bg-secondary/95 backdrop-blur-xl border border-nc-violet/20 rounded-lg shadow-xl shadow-black/40 px-4 py-3 min-w-[180px]">
                <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-nc-violet/10">
                  <Crosshair className="w-3 h-3 text-nc-cyan" />
                  <span className="text-xs font-mono text-nc-text-secondary">
                    身高 {tooltip.heightM.toFixed(2)}m
                  </span>
                </div>
                <div className="space-y-1">
                  {tooltip.modelValues.map((mv) => (
                    <div key={mv.name} className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-0.5 rounded-full inline-block shrink-0" style={{ backgroundColor: mv.color }} />
                        <span className="text-[10px] text-nc-text-muted">{mv.name}</span>
                      </div>
                      <span className="text-xs font-mono font-bold" style={{ color: mv.color }}>
                        {mv.weight.toFixed(1)}kg
                      </span>
                    </div>
                  ))}
                </div>
                {/* Close hint */}
                <p className="text-[9px] text-nc-text-muted/50 mt-2 text-center">再次点击关闭</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="px-6 py-3 border-t border-nc-violet/5 text-xs text-nc-text-muted flex items-center justify-between">
        <span>{semanticHighlight("咪呀专用模型（青色粗线）：y = 9.89 · x³ · 图中标注点为墨璇玥.iv 数据 1.47m/32kg")}</span>
        <span className="text-[10px] text-nc-text-muted/50 flex items-center gap-1">
          <Crosshair className="w-3 h-3" />
          点击曲线查看坐标
        </span>
      </div>
    </motion.div>
  );
}
