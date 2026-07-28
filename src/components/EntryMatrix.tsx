import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import {
  Globe, Users, BookOpen, Heart, Cpu, Grid3X3,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router';

const entries = [
  {
    id: 'world',
    label: '世界',
    desc: '12 亿人口的平行数字宇宙。哲华学校科照真学院与德澜思拓公司构成双核心驱动力，AGI 与意识的边界在此模糊。从冯·诺伊曼班的精英选拔到心界 VR 的沉浸式体验，每个意识体都在寻找自己的神经频率。',
    icon: Globe,
    color: 'text-nc-cyan',
    href: '/world',
  },
  {
    id: 'characters',
    label: '角色',
    desc: '31 位主角色与 6 位补充意识体，各自闪烁着不同的神经频率。M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群——每个角色都承载着独特的存在悖论。',
    icon: Users,
    color: 'text-nc-violet',
    href: '/characters',
  },
  {
    id: 'stories',
    label: '叙事',
    desc: "《大人国的小女孩》、M/I/A's World、狐狸与企鹅、AGI 应许之地——四个长篇叙事宇宙，以及 24+ 诗歌碎片。从星界馆的午后到大人国的三十天，故事在时间流速错叠的角落里展开。",
    icon: BookOpen,
    color: 'text-nc-rose',
    href: '/stories',
  },
  {
    id: 'miia',
    label: '咪呀 mī yā',
    desc: '内心独白、数学笔记与诗歌碎片。二年级生的集合论遐想、对存在的温柔质问、以及「只想被你看见然后被爱」的朴素愿望。FSIII 226，2017 年生，被定格在十四岁的投影与真实成长之间的涟漪。',
    icon: Heart,
    color: 'text-pink-400',
    href: '/miia',
  },
  {
    id: 'fsiii',
    label: 'FSIII',
    desc: '理性骨架——公式与数据的语言。29 个意识体的 FSIII 排名与评分，从 Damocles 的 1314 到林浅的 90，构成一套贯穿世界观的量化认知体系。各省均值、区域分布、层级划分尽在其中。',
    icon: Cpu,
    color: 'text-amber-400',
    href: '/math/fsiii',
  },
  {
    id: 'playground',
    label: '游戏',
    desc: '复合象棋——棋子、规则与毒化机制；技能井字棋——三连棋变体与技能对战；题目——谜题、QR 码与考核。在规则与概率的交界处，用游戏理解这个世界的底层逻辑。',
    icon: Grid3X3,
    color: 'text-nc-gold',
    href: '/playground',
  },
];

export default function EntryMatrix() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <section className="px-4 sm:px-6 py-12 max-w-[1100px] mx-auto">
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 30 }}
        animate={isVisible ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {entries.map((e, i) => {
          const Icon = e.icon;
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 20 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.08 }}
            >
              <Link
                to={e.href}
                className="group relative overflow-hidden rounded-xl border border-nc-violet/10 bg-nc-bg-secondary p-6 hover:border-nc-cyan/30 transition-all duration-300 block h-full"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-nc-violet/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-6 h-6 ${e.color}`} />
                      <h3 className="text-lg font-bold text-nc-text">{e.label}</h3>
                    </div>
                    <ArrowRight className="w-4 h-4 text-nc-text-muted group-hover:text-nc-text group-hover:translate-x-1 transition-all shrink-0" />
                  </div>
                  <p className="text-sm text-nc-text-secondary leading-relaxed flex-1">
                    {e.desc}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </motion.div>
    </section>
  );
}
