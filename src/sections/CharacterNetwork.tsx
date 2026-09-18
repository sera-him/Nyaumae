import { useState, useCallback, useMemo } from 'react';
import { L } from '@/lib/translations/manual';
import { getLocale } from '@/lib/i18n';

import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { networkNodes, characterRelations, relationLabels, relationColors } from '@/data/relationships';
import { networkNodesEn, relationLabelsEn } from '@/data/relationships.en';
import type { RelationType } from '@/data/relationships';

const groupColors: Record<string, string> = {
  'mia-family': '#F472B6', 'zhihua': '#8B5CF6', 'impact': '#00E5CC',
  'other': '#F59E0B', 'independent': '#3B82F6', 'ai': '#EF4444',
  'special': '#E2E8F0', 'giant': '#84CC16',
};
const groupLabelsZh: Record<string, string> = {
  'mia-family': 'M/I/A 家族', 'zhihua': '哲华学校', 'impact': '因派',
  'other': '卡可拉家', 'independent': '独立角色', 'ai': '数字生命',
  'special': '特殊', 'giant': '大人国篇',
};
const groupLabelsEn: Record<string, string> = {
  'mia-family': 'M/I/A Family', 'zhihua': 'Zhehua School', 'impact': 'Yin Pai',
  'other': 'Calcla Family', 'independent': 'Independent', 'ai': 'Digital Life',
  'special': 'Special', 'giant': 'Giant Country arc',
};

const R = 3.8;
const R2 = R * 2;
const BG = '#100A1A';

interface PosNode {
  id: string; name: string; group: string; x: number; y: number;
}

export default function CharacterNetwork() {
  const { ref, isVisible } = useScrollReveal();
  const [selected, setSelected] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<RelationType | null>(null);
  const _en = getLocale() === 'en';
  const nodesSource = _en ? networkNodesEn : networkNodes;
  const labels = _en ? relationLabelsEn : relationLabels;
  const groupLabels = _en ? groupLabelsEn : groupLabelsZh;

  const nodes: PosNode[] = useMemo(
    () => nodesSource.map((node) => (
      node.group === 'giant' ? node : { ...node, y: node.y + 45 }
    )),
    [nodesSource],
  );

  const filteredRels = useMemo(() => {
    if (!activeFilter) return characterRelations;
    return characterRelations.filter((r) => r.type === activeFilter);
  }, [activeFilter]);

  const directNeighbors = useMemo(() => {
    if (!selected) return new Set<string>();
    const set = new Set<string>();
    filteredRels.forEach((r) => {
      if (r.from === selected) set.add(r.to);
      if (r.to === selected) set.add(r.from);
    });
    set.add(selected);
    return set;
  }, [selected, filteredRels]);

  const onBgClick = useCallback(() => setSelected(null), []);
  const onNodeClick = useCallback((nodeId: string) => {
    setSelected(prev => prev === nodeId ? null : nodeId);
  }, []);

  return (
    <section id="character-network" className="py-24 px-4 sm:px-6 relative">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <motion.div initial={{ opacity: 0, y: 40 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.8 }} className="mb-8">
          <h2 className="character-network-title text-3xl sm:text-4xl font-bold mb-3 tracking-wide">{semanticHighlight("角色/网络")}</h2>
          <p className="text-nc-text-secondary text-lg">{semanticHighlight(_en ? `${nodes.length} characters · click a node for details` : `${nodes.length} 位角色 · 点击查看详情`)}</p>
          <p className="text-nc-text-muted text-xs mt-2 max-w-lg">
            {L("为什么叫「角色/网络」而不是「关系网」或「角色网」？")}<br />
            {L("「/」是一个分隔符，暗示这不是单纯的角色列表，也不是静态的关系图谱——而是一个")}<strong className="text-nc-cyan">{L("动态的、可交互的神经拓扑")}</strong>{L("。每个节点既是独立意识体（角色），又是网络中的一个信号中继（网络节点）。「角色/网络」强调的不是\"谁认识谁\"，而是")}<strong className="text-nc-cyan">{L("意识如何在连接中涌现")}</strong>{L("——这是 Neural Connection 世界观的核心隐喻。\n          ")}</p>
        </motion.div>

        {/* Filters */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-wrap gap-3 mb-4">
          {(Object.entries(labels) as [RelationType, string][]).map(([type, label]) => (
            <button key={type} onClick={() => setActiveFilter(activeFilter === type ? null : type)}
              className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${activeFilter === type ? 'border-nc-cyan text-nc-cyan bg-nc-cyan/10' : 'border-nc-violet/20 text-nc-text-muted hover:border-nc-violet/40'}`}>
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: relationColors[type] }} />{label}
            </button>
          ))}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.5, delay: 0.15 }} className="flex flex-wrap gap-x-4 gap-y-1 mb-6 text-xs text-nc-text-muted">
          {Object.entries(groupLabels).map(([key, label]) => (
            <span key={key} className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: groupColors[key] }} />{label}</span>
          ))}
        </motion.div>

        {/* SVG */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={isVisible ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl overflow-hidden" style={{ height: 760 }}>
          <svg className="w-full h-full select-none" viewBox="0 0 100 140" preserveAspectRatio="xMidYMid meet" onClick={onBgClick}>
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#ffffff06" strokeWidth="0.3" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />

            {/* EDGES */}
            {filteredRels.map((rel) => {
              const a = nodes.find((n) => n.id === rel.from);
              const b = nodes.find((n) => n.id === rel.to);
              if (!a || !b) return null;
              const dx = b.x - a.x, dy = b.y - a.y;
              const dist = Math.hypot(dx, dy);
              if (dist < R2) return null;
              const nx = dx / dist, ny = dy / dist;
              const isDirect = selected === rel.from || selected === rel.to;
              return (
                <line key={`${rel.from}-${rel.to}-${rel.type}`}
                  x1={a.x + nx * R} y1={a.y + ny * R}
                  x2={b.x - nx * R} y2={b.y - ny * R}
                  stroke={relationColors[rel.type]} strokeWidth={0.45}
                  opacity={selected ? (isDirect ? 0.9 : 0.03) : 0.7} />
              );
            })}

            {/* NODES */}
            {nodes.map((node) => {
              const color = groupColors[node.group] || '#8B5CF6';
              const isSel = selected === node.id;
              const inSet = !selected || directNeighbors.has(node.id);
              return (
                <g key={node.id}
                  opacity={inSet ? 1 : 0.1}
                  onClick={(e) => { e.stopPropagation(); onNodeClick(node.id); }}
                  style={{ cursor: 'pointer', transition: 'opacity 0.4s ease' }}>
                  <circle cx={node.x} cy={node.y} r={R + 0.4}
                    fill="none" stroke={isSel ? '#fff' : color}
                    strokeWidth={isSel ? 1.0 : 0.6} />
                  <circle cx={node.x} cy={node.y} r={R} fill={BG} />
                  {isSel && (
                    <circle cx={node.x} cy={node.y} r={R - 0.3}
                      fill={color} opacity={0.35} />
                  )}
                  <text x={node.x} y={node.y} textAnchor="middle" dominantBaseline="central"
                    fill={isSel ? '#fff' : color}
                    fontSize={node.name.length > 3 ? 2.2 : 2.6}
                    fontWeight={isSel ? 700 : 500}
                    style={{ pointerEvents: 'none' }}>
                    {node.name}
                  </text>
                </g>
              );
            })}
          </svg>
        </motion.div>

        {/* Selected info */}
        {selected && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-3 bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-nc-text mb-2">
              {nodes.find((n) => n.id === selected)?.name}
              <span className="text-nc-text-muted font-normal ml-2">{groupLabels[nodes.find((n) => n.id === selected)?.group || '']}</span>
            </h4>
            <div className="flex flex-wrap gap-2">
              {filteredRels.filter((r) => r.from === selected || r.to === selected).map((r, i) => {
                const other = r.from === selected ? r.to : r.from;
                return (
                  <span key={i} className="text-xs px-2 py-1 rounded-full border" style={{ borderColor: relationColors[r.type] + '40', color: relationColors[r.type] }}>
                    {labels[r.type]} · {nodes.find((n) => n.id === other)?.name}
                  </span>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
