import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { getLocale } from '@/lib/i18n';
import {
  nationsEn,
  chinaPolicyEn,
  travelInfoEn,
  timelineEn,
  pacificIntroEn,
  yuanchuiTitleEn,
  yuanchuiDescEn,
  lowerTierDescEn,
  customsDescEn,
  yuanchuiNoteEn,
  chengwanChinaTitleEn,
  cityHeadingEn,
  cityStatsEn,
} from '@/data/pacificIslands.en';
import {
  nationsZh,
  chinaPolicyZh,
  travelInfoZh,
  timelineZh,
  cityStatsZh,
  pacificIntroZh,
  yuanchuiTitleZh,
  yuanchuiDescZh,
  lowerTierDescZh,
  customsDescZh,
  yuanchuiNoteZh,
  chengwanChinaTitleZh,
  cityHeadingZh,
} from '@/data/pacificIslands.zh';
import { MapPin, Shield, Quote, Globe, Waves } from 'lucide-react';

export default function PacificIslands() {
  const { ref, isVisible } = useScrollReveal();
  const _en = getLocale() === 'en';

  const nations = _en ? nationsEn : nationsZh;
  const chinaPolicy = _en ? chinaPolicyEn : chinaPolicyZh;
  const travelInfo = _en ? travelInfoEn : travelInfoZh;
  const timeline = _en ? timelineEn : timelineZh;
  const cityStats = _en ? cityStatsEn : cityStatsZh;

  const intro = _en ? pacificIntroEn : pacificIntroZh;
  const yuanchuiTitle = _en ? yuanchuiTitleEn : yuanchuiTitleZh;
  const yuanchuiDesc = _en ? yuanchuiDescEn : yuanchuiDescZh;
  const lowerTierDesc = _en ? lowerTierDescEn : lowerTierDescZh;
  const customsDesc = _en ? customsDescEn : customsDescZh;
  const yuanchuiNote = _en ? yuanchuiNoteEn : yuanchuiNoteZh;
  const chengwanChinaTitle = _en ? chengwanChinaTitleEn : chengwanChinaTitleZh;
  const cityHeading = _en ? cityHeadingEn : cityHeadingZh;

  return (
    <section className="pacific-motion py-24 px-4 sm:px-6 relative">
      <div ref={ref} className="max-w-[1100px] mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <h2 className="text-3xl sm:text-4xl font-bold text-nc-text mb-4 tracking-wide">
            {semanticHighlight("西太平洋诸岛国")}
          </h2>
          <p className="font-serif text-lg text-nc-cyan leading-relaxed max-w-3xl mb-12">
            {semanticHighlight(intro)}
          </p>
        </motion.div>

        {/* Nations Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-16"
        >
          {nations.map((n, i) => (
            <motion.div
              key={n.name}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.05 }}
              className="pacific-nation-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 hover:border-nc-cyan/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <MapPin className={`pacific-nation-mark w-4 h-4 mt-1 shrink-0 ${n.color}`} />
                <div>
                  <h3 className={`font-semibold text-sm text-nc-text mb-1 ${n.color}`}>{n.name}</h3>
                  <p className="text-xs text-nc-text-muted leading-relaxed">{n.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 渊垂联邦详情 - 新增三层国家 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.45 }}
          className="pacific-relation-card bg-nc-bg-secondary border border-zinc-500/20 rounded-xl p-5 mb-16 hover:border-zinc-400/30 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <Shield className="w-5 h-5 text-zinc-300" />
            <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight(yuanchuiTitle)}</h3>
            <span className="ml-auto text-xs font-mono text-zinc-400 border border-zinc-500/20 px-2 py-0.5 rounded">TRIVIUM</span>
          </div>
          <p className="text-sm text-nc-text-secondary leading-relaxed mb-4">{semanticHighlight(yuanchuiDesc)}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <div className="bg-nc-bg/50 rounded-lg p-3 border border-zinc-500/10">
              <p className="text-xs text-zinc-400 font-bold mb-1">{L("下层规则")}</p>
              <p className="text-sm text-nc-text-muted leading-relaxed">{semanticHighlight(lowerTierDesc)}</p>
            </div>
            <div className="bg-nc-bg/50 rounded-lg p-3 border border-zinc-500/10">
              <p className="text-xs text-zinc-400 font-bold mb-1">{L("海关双轨")}</p>
              <p className="text-sm text-nc-text-muted leading-relaxed">{semanticHighlight(customsDesc)}</p>
            </div>
          </div>
          <p className="text-xs text-zinc-500">{semanticHighlight(yuanchuiNote)}</p>
        </motion.div>

        {/* 澄湾共和国 - 中国关系 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="pacific-relation-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 mb-16 hover:border-nc-cyan/30 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-nc-cyan" />
            <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight(chengwanChinaTitle)}</h3>
          </div>
          <div className="space-y-2 mb-4">
            {travelInfo.map((info, i) => (
              <p key={i} className="pacific-travel-item text-sm text-nc-text-muted pl-7 relative">
                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-nc-cyan/50" />
                {info}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            {chinaPolicy.map((p) => (
              <div key={p.label} className="pacific-policy-card bg-nc-bg/50 rounded-lg px-3 py-2 border border-nc-violet/5">
                <div className="text-xs text-nc-text-muted">{p.label}</div>
                <div className="text-sm font-medium text-nc-text">{p.detail}</div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ============== 雾岬自由市 ============== */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mb-16"
        >
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-6 h-6 text-nc-rose" />
            <h2 className="text-2xl sm:text-3xl font-bold text-nc-text tracking-wide">
              {semanticHighlight(cityHeading)}
            </h2>
          </div>
          <p className="font-serif text-base text-nc-text-secondary leading-relaxed mb-6">
            {L("原属岚汐共和国，2042年4月2日独立之战后成为自由市。\n          ")}</p>

          {/* City Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {cityStats.map((s) => (
              <div key={s.label} className="pacific-stat-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 text-center">
                <div className="font-mono text-lg font-bold text-nc-cyan">{s.value}</div>
                <div className="text-xs text-nc-text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="pacific-timeline relative mb-10" data-motion-reveal>
            <div className="pacific-timeline-rail absolute left-[11px] top-2 bottom-2 w-px bg-nc-violet/20" />
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
                  className="pacific-timeline-event flex gap-4 pl-0"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="pacific-timeline-node w-6 h-6 rounded-full bg-nc-bg-secondary border-2 border-nc-cyan/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-nc-cyan" />
                    </div>
                  </div>
                  <div className="pacific-timeline-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 flex-1 hover:border-nc-cyan/30 transition-all duration-300">
                    <div className="flex items-baseline gap-3 mb-1">
                      <span className="font-mono text-xs text-nc-cyan shrink-0">{t.time}</span>
                      <h4 className="font-semibold text-sm text-nc-text">{t.title}</h4>
                    </div>
                    <p className="text-xs text-nc-text-muted leading-relaxed">{t.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* 绯零 quote */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={isVisible ? { opacity: 1, scale: 1 } : {}}
            transition={{ duration: 0.6, delay: 1.4 }}
            className="pacific-quote-card bg-nc-bg-secondary/60 border border-nc-rose/20 rounded-xl p-6 mb-8 relative overflow-hidden"
          >
            <Quote className="absolute top-3 left-3 w-8 h-8 text-nc-rose/10" />
            <div className="pl-6">
              <p className="font-serif text-lg text-nc-rose leading-relaxed italic">
                {L("\"你们参与制造过我的身体，但从未拥有过我的现在。\"\n              ")}</p>
              <p className="text-xs text-nc-text-muted mt-2">{L("—— 绯零，2042年4月2日")}</p>
            </div>
          </motion.div>

          {/* Aftermath */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="pacific-aftermath-card bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Waves className="w-4 h-4 text-nc-cyan" />
              <h3 className="text-sm font-semibold text-nc-text">{L("后续")}</h3>
            </div>
            <p className="text-sm text-nc-text-muted leading-relaxed">
              {L("中国、日本、海庭共和国和镜海共和国没有立即承认它是一个国家，但都在数日内与雾岬建立了紧急联络渠道。国际航运公司重新接受雾岬港口签发的通行文件，银行继续处理它的结算，附近岛国则开始派遣观察人员。世界没有在一夜之间承认雾岬。世界只是逐渐发现：无论承认与否，这座只有几平方千米核心城区、不到二十万居民的城市，已经能够保护自己的天空、维持自己的秩序，并拒绝任何外部系统重新取得最高权限。\n            ")}</p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
