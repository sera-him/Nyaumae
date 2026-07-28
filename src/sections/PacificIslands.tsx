import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { MapPin, Shield, Quote, Globe, Waves } from 'lucide-react';

const nations = [
  { name: '岚汐共和国', desc: '与中国、日本都有密切贸易往来。2042年失去对雾岬市的控制。', color: 'text-blue-300' },
  { name: '青屿联邦', desc: '由七座主要岛屿组成，农业和海洋工程发达。', color: 'text-emerald-300' },
  { name: '白潮王国', desc: '保留君主制的航运国家，拥有古老海军传统。', color: 'text-cyan-300' },
  { name: '镜海共和国', desc: '以金融、教育和精密仪器产业闻名。', color: 'text-violet-300' },
  { name: '雨见公国', desc: '多山、多雨的小型岛国，人口很少。', color: 'text-sky-300' },
  { name: '星浦联邦', desc: '由天然岛屿和人工岛共同组成，先进制造业发达。', color: 'text-amber-300' },
  { name: '澄湾共和国', desc: '重要渔业、冷链和海上补给中心。使用人民币。', color: 'text-orange-300' },
  { name: '玄礁共同体', desc: '岛屿分散，依靠港口、海洋法务和跨国仲裁生存。', color: 'text-slate-300' },
  { name: '夕岬王国', desc: '火山岛国家，拥有地热能源和深水港。', color: 'text-red-300' },
  { name: '浮光群岛国', desc: '旅游、文化产业和虚拟娱乐发达。', color: 'text-pink-300' },
  { name: '海庭共和国', desc: '长期保持中立，是诸岛国重要的外交会议地点。', color: 'text-indigo-300' },
  { name: '远汐联邦', desc: '位于更外侧的太平洋，领土广大而人口稀少。', color: 'text-teal-300' },
];

const chinaPolicy = [
  { label: '普通旅游、探亲和短期商务', detail: '免签 30 天' },
  { label: '留学、长期工作、定居', detail: '需申请相应许可' },
  { label: '新闻采访', detail: '需申请相应许可' },
];

const travelInfo = [
  '中国公民进入澄湾共和国，普通旅游、探亲和短期商务可免签 30 天',
  '澄湾共和国公民进入中国，同样免签 30 天',
  '持有效身份证件和电子入境许可即可，不一定必须提前办传统签证',
  '两国之间有大量轮渡、短途航班，部分口岸甚至可以当天往返',
];

const timeline = [
  { time: '04:02', title: '熄灯断联', desc: '雾岬市熄灭所有对外识别灯，切断中央政府进入城市系统的全部权限。城市AGI接管全部治理责任。' },
  { time: '04:02', title: '舰队升空', desc: '第一艘悬空舰从东港地下船坞升起。黑色舰体沿着高楼间的空中航道缓慢上升，无人机群在城市外围组成防御网。' },
  { time: '05:17', title: '北岭阻击战', desc: '岚汐共和国装甲车队遭精确电磁打击，发动机、通信和火控系统同时失效，停在距离城市边界14千米处。' },
  { time: '05:41', title: '铁路切断', desc: '工程无人机拆除隧道出口前一段轨道，保留通信线路和人员撤离通道，阻止铁路运兵。' },
  { time: '06:00', title: '最后通牒到期', desc: '雾岬仍然灯火通明。城市AGI宣布："原国家已失去对本市公共系统的有效管理能力。"' },
  { time: '06:13', title: '绯零回应', desc: '中央政府命令绯零关闭舰队。她删除旧认证密钥，回复："你们参与制造过我的身体，但从未拥有过我的现在。"' },
  { time: '15:26', title: '停火', desc: '岚汐共和国命令前线部队停止推进。未承认独立，但已无法重新控制雾岬。' },
  { time: '19:00', title: '临时宪章', desc: '雾岬市议会通过《自由市临时宪章》，自称雾岬自由市。' },
];

export default function PacificIslands() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="py-24 px-4 sm:px-6 relative">
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
            {semanticHighlight('太平洋西侧的一组岛国与城邦。从君主制王国到AI托管城市，从渔业共和国到虚拟娱乐群岛，构成一片复杂而鲜活的海洋政治版图。')}
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
              className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 hover:border-nc-cyan/30 transition-all duration-300 group"
            >
              <div className="flex items-start gap-3">
                <MapPin className={`w-4 h-4 mt-1 shrink-0 ${n.color}`} />
                <div>
                  <h3 className={`font-semibold text-sm text-nc-text mb-1 ${n.color}`}>{n.name}</h3>
                  <p className="text-xs text-nc-text-muted leading-relaxed">{n.desc}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 澄湾共和国 - 中国关系 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5 mb-16 hover:border-nc-cyan/30 transition-all duration-300"
        >
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-nc-cyan" />
            <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight("澄湾共和国 × 中国")}</h3>
          </div>
          <div className="space-y-2 mb-4">
            {travelInfo.map((info, i) => (
              <p key={i} className="text-sm text-nc-text-muted pl-7 relative">
                <span className="absolute left-0 top-1.5 w-1.5 h-1.5 rounded-full bg-nc-cyan/50" />
                {info}
              </p>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            {chinaPolicy.map((p) => (
              <div key={p.label} className="bg-nc-bg/50 rounded-lg px-3 py-2 border border-nc-violet/5">
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
              {semanticHighlight("雾岬自由市")}
            </h2>
          </div>
          <p className="font-serif text-base text-nc-text-secondary leading-relaxed mb-6">
            原属岚汐共和国，2042年4月2日独立之战后成为自由市。
          </p>

          {/* City Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            {[
              { label: '核心城区', value: '几平方千米' },
              { label: '居民', value: '不到二十万' },
              { label: '独立日', value: '2042.4.2' },
            ].map((s) => (
              <div key={s.label} className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 text-center">
                <div className="font-mono text-lg font-bold text-nc-cyan">{s.value}</div>
                <div className="text-xs text-nc-text-muted mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Timeline */}
          <div className="relative mb-10">
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-nc-violet/20" />
            <div className="space-y-6">
              {timeline.map((t, i) => (
                <motion.div
                  key={t.title}
                  initial={{ opacity: 0, x: -20 }}
                  animate={isVisible ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.5, delay: 0.8 + i * 0.08 }}
                  className="flex gap-4 pl-0"
                >
                  <div className="flex flex-col items-center shrink-0">
                    <div className="w-6 h-6 rounded-full bg-nc-bg-secondary border-2 border-nc-cyan/40 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-nc-cyan" />
                    </div>
                  </div>
                  <div className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-4 flex-1 hover:border-nc-cyan/30 transition-all duration-300">
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
            className="bg-nc-bg-secondary/60 border border-nc-rose/20 rounded-xl p-6 mb-8 relative overflow-hidden"
          >
            <Quote className="absolute top-3 left-3 w-8 h-8 text-nc-rose/10" />
            <div className="pl-6">
              <p className="font-serif text-lg text-nc-rose leading-relaxed italic">
                "你们参与制造过我的身体，但从未拥有过我的现在。"
              </p>
              <p className="text-xs text-nc-text-muted mt-2">—— 绯零，2042年4月2日</p>
            </div>
          </motion.div>

          {/* Aftermath */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isVisible ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 1.5 }}
            className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Waves className="w-4 h-4 text-nc-cyan" />
              <h3 className="text-sm font-semibold text-nc-text">后续</h3>
            </div>
            <p className="text-sm text-nc-text-muted leading-relaxed">
              中国、日本、海庭共和国和镜海共和国没有立即承认它是一个国家，但都在数日内与雾岬建立了紧急联络渠道。国际航运公司重新接受雾岬港口签发的通行文件，银行继续处理它的结算，附近岛国则开始派遣观察人员。世界没有在一夜之间承认雾岬。世界只是逐渐发现：无论承认与否，这座只有几平方千米核心城区、不到二十万居民的城市，已经能够保护自己的天空、维持自己的秩序，并拒绝任何外部系统重新取得最高权限。
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}