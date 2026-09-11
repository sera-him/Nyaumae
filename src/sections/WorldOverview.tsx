import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { worldviewStats, worldviewInfo, regionFsiiiStats } from '@/data/worldview';
import { semanticHighlight } from '@/lib/semanticHighlight';
import SmartImage from '@/components/SmartImage';
import { Calendar, BrainCircuit } from 'lucide-react';

export default function WorldOverview() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section id="worldview" className="py-24 px-4 sm:px-6 relative">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-4 tracking-wide">
            {semanticHighlight("世界设定")}
          </h2>
          <p className="font-serif text-lg text-nc-cyan leading-relaxed max-w-3xl mb-12">
            {semanticHighlight('Neural Connection 是一个存在 12 亿人口的平行数字宇宙。哲华学校科照真学院与德澜思拓公司构成双核心驱动力，AGI 与意识的边界在此模糊。从冯·诺伊曼班的精英选拔到心界 VR 的沉浸式体验，每个意识体都在这个宇宙中寻找自己的神经频率。')}
          </p>
        </motion.div>

        {/* Overview Images */}
        <div className="world-overview-visuals grid grid-cols-1 sm:grid-cols-2 gap-4 mb-12">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <SmartImage
              localSrc="/world-overview-1.png"
              alt="World Overview 1"
              aspectRatio="16/9"
              containerClassName="world-overview-image w-full rounded-xl overflow-hidden border border-nc-violet/10"
              className="object-cover"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isVisible ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <SmartImage
              localSrc="/world-overview-2.png"
              alt="World Overview 2"
              aspectRatio="16/9"
              containerClassName="world-overview-image w-full rounded-xl overflow-hidden border border-nc-violet/10"
              className="object-cover"
            />
          </motion.div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
          {worldviewStats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.2 + i * 0.1 }}
              className="world-stat-motion bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 hover:border-nc-cyan/30 transition-all duration-300"
            >
              <div className="font-mono text-xl sm:text-2xl xl:text-3xl font-bold text-nc-cyan mb-1 whitespace-nowrap tracking-tight">
                {stat.value}
              </div>
              <div className="text-sm text-nc-text-muted">
                {stat.label} <span className="text-nc-rose">{stat.unit}</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* FSIII Regional Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="world-stat-motion world-fsiii-stat bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 mb-12 hover:border-nc-cyan/30 transition-all duration-300 max-w-[540px]"
        >
          <div className="flex items-center gap-2 mb-3">
            <BrainCircuit className="w-5 h-5 text-nc-text-secondary" />
            <span className="text-sm text-nc-text-muted">FSIII 区域均值</span>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="font-mono text-3xl font-bold text-nc-cyan">
              {regionFsiiiStats.average}
            </span>
            <span className="font-mono text-sm text-nc-text-muted">
              / 各省 {regionFsiiiStats.range[0]}–{regionFsiiiStats.range[1]}
            </span>
          </div>
        </motion.div>

        {/* Holidays */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="world-holiday-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6 max-w-md"
        >
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-nc-text-secondary" />
            <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight("节日")}</h3>
          </div>
          <div className="space-y-2.5">
            {worldviewInfo.holidays.map((h) => (
              <div key={h.date} className="group">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm text-nc-text-secondary shrink-0">{h.date}</span>
                  <span className="text-sm text-nc-text ml-3">{semanticHighlight(h.name)}</span>
                </div>
                {h.desc && (
                  <p className="text-[11px] text-nc-text-muted mt-0.5 leading-relaxed pl-[3.2rem]">{h.desc}</p>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
