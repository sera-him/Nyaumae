import { useRef } from 'react';
import { L } from '@/lib/translations/manual';

import { motion, useInView } from 'framer-motion';
import { BookOpenText, Eraser } from 'lucide-react';
import { theoremFragments } from '@/data/extraStories';
import { theoremFragmentsEn } from '@/data/extraStories.en';
import { semanticHighlightProse } from '@/lib/semanticHighlight';
import { getLocale } from '@/lib/i18n';
import {
  miiaMathParagraphsEn,
  miiaMathHighlightsEn,
  miiaMathRedMarksEn,
} from '@/data/miiaMathNotes.en';
import { nyaumae8Classes, nyaumae8Capacity, nyaumae8Emoji, nyaumae8EmojiTotals } from '@/data/nyaumae8';
import {
  nyaumae8ClassesEn, nyaumae8CapacityEn, nyaumae8EmojiEn, nyaumae8EmojiTotalsEn,
  nyaumae8LeadZh, nyaumae8LeadEn, nyaumae8EmojiLeadZh, nyaumae8EmojiLeadEn,
  nyaumae8TableHeadZh, nyaumae8TableHeadEn,
} from '@/data/nyaumae8.en';

const paragraphsZh = [
  `我2年级啦，我在想，1是奇数，3是奇数，5是奇数，能不能有一个东西自己判断一个数字是不是奇数？那么就叫做"数是奇数"。`,
  `我们可以把这些数字放在一起，叫做<数，数是奇数>。那么1在<数，数是奇数>里，2不在<数，数是奇数>里，每个数都知道自己在不在里面。`,
  `然后我们学校得不同的分数有不同的星星奖励，90分以上40颗星星，85分以上37颗星星，80分以上33颗星星，75分以上30颗星星，70分以上27颗星星，67分以上23颗星星，65分以上20颗星星，62分以上17颗星星，60分以上10颗星星，不及格没有星星。`,
  `重要的科目有多倍星星，比如数学课550倍星星，英语课200倍星星。我在想，可以设计一个东西，知道分数就知道星星数量，它就叫"@星星"，比如说99@星星=40，80@星星=33，64@星星=17......`,
  `我们都学过龟兔赛跑的故事，乌龟看上去慢，但是最后还是先到了终点，这个可以用到@吗？我们可以有时间@乌龟=距离，时间@兔子=距离，比如说我们可以规定时间@乌龟=时间*1千米每小时，时间@兔子=时间*10千米每小时在前6分钟，=1千米在第6-116分钟，因为兔子在睡觉，=1千米+(时间-116分钟)*10千米每小时在最后几分钟。`,
  `如果有2千米，我们可以算出来120分钟@乌龟=2千米，122分钟@兔子=2千米，所以乌龟快。`,
  `可是，如果有无限长的距离话，就是兔子快了。可是无限长的时间之后，谁跑得更快呢？我们可以把无限时间@兔子和无限时间@乌龟进行比较吗？不行，如果两个一样快的人，一个人抢跑，它会比出来抢跑的人快，不公平。`,
  `怎么办呢？我们要用除法。如果一样快，除出来就是1。这样随便两个人都可以比赛了。`,
  `可是，我还是觉得有哪里是不一样的啊。比如说，东西掉下去，它就会不断加速。如果没有空气的话，不管你跑得多快，最后都没有它快。(无限时间@你)/(无限时间@掉下来)=0，这个0就可以说明你再快，无限时间之后，也跑不过它。`,
  `前面那个<数，数是奇数>，它里面可以填其他东西吗？让我试试看，变成<@东西，规则>。我们来玩玩，把这些东西合起来。`,
  `我们让所有的玩玩都符合这个玩玩=<@东西一号，@玩玩里存在东西二号，(无限时间@东西一号)/(无限时间@东西二号)=0>。所有玩玩之间是有区别的，我们让一个玩玩@玩玩分类=@一个东西，(无限时间@玩玩里任何东西)/(无限时间@这个东西)不是0，(无限时间@这个东西)/(无限时间@不在玩玩里的任何东西)不是0。`,
  `我发现不同的这个东西之间永远无限时间的时候都不会是0，好不好玩？我们把它们叫做一个艾特分类。`,
  `坏消息是有时候这里有些除法会算不出来，算不出来全都是坏@，可以跳过。乱动也算它算出来，只要一直在0/无穷大/其他中的一个它就算算出来，可以乱动。`,
  `我数了一下，我发现艾特分类有很多个，有多多呢？多到我就算用1,2,3,4,5...全都变成小纸条，给一个艾特分类贴标签，不管怎么贴都会有很多艾特分类没有标签。`,
  `我又数了一下，好@和坏@都比艾特分类还要多，就算用所有的艾特分类，不管怎么贴都贴不完。然后好@、坏@、所有@互相之间贴标签都可以贴完。`,
  `然后@其实分成两种，一种前面是数，一种是像@玩玩分类一样前面不是数，后面那种又更多更多个。`,
  `我发现，就算像@一样大的东西，它也可以排好队，排好队就是说可以造出来一个机器人，随便找两个人，机器人都可以告诉你谁站在前面。而且机器人还发现了一个秘密：如果A排在B前面，B排在C前面，那A一定排在C前面，不用再问了！就像我排在小红前面，小红排在小刚前面，那我肯定排在小刚前面呀，这还用比吗？`,
  `怎么样才能让机器人更快告诉你呢？可以用最快的芯片。可是最快的芯片很贵。所以我们可以只买很小的最快的芯片，然后为了加速它，可以让它像地铁一样，两边上传，中间下载。`,
  `上传和下载给第二快的芯片，然后第二快的芯片可以稍微大一点，然后再给第三快的芯片，它更大，依此类推。然后工程师需要尽量把东西放进最快的芯片里面，最好就是每个东西都可以被@，得到一个位置，这样用它就能立马找到。`,
  `可是最快芯片太小了。因为生日悖论，所以有用的数据经常会被挤掉，这样就需要去更慢的芯片拿。工程师要减少去更慢芯片拿的次数，因为每拿一次都很费时间。`,
  `所以可以随便乱放，可是这样用它就要把整个最快芯片全都看一遍，还是不好。所以工程师发明了几种不一样的@，每个东西先用第一个@，如果那里有东西就换一个@，全都有才会挤掉。这样机器人就可以最快告诉你这两个东西谁排在前面了。`,
];

const highlightsZh = ['数是奇数', '@星星', '龟兔赛跑', '无限时间', '艾特分类', '坏@', '生日悖论', '机器人'];
const redMarksZh = ['不公平', '无穷大'];

function NoteParagraph({
  text,
  index,
  highlights,
  redMarks,
}: {
  text: string;
  index: number;
  highlights: string[];
  redMarks: string[];
}) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  let content: React.ReactNode[] = [text];
  let highlightKey = 0;
  let redMarkKey = 0;

  highlights.forEach((word) => {
    content = content.flatMap((node) => {
      if (typeof node !== 'string') return [node];
      const parts = node.split(word);
      if (parts.length === 1) return [node];
      const result: React.ReactNode[] = [];
      parts.forEach((part, i) => {
        result.push(part);
        if (i < parts.length - 1) {
          result.push(
            <mark
              key={`note-${index}-hl-${highlightKey++}`}
              className="rounded-sm px-0.5"
              style={{
                background: 'linear-gradient(120deg, #fde047 0%, #fde047 100%)',
                backgroundPosition: '0 88%',
                backgroundRepeat: 'no-repeat',
                backgroundSize: '100% 40%',
                color: 'inherit',
              }}
            >
              {word}
            </mark>
          );
        }
      });
      return result;
    });
  });

  redMarks.forEach((word) => {
    content = content.flatMap((node) => {
      if (typeof node !== 'string') return [node];
      const parts = node.split(word);
      if (parts.length === 1) return [node];
      const result: React.ReactNode[] = [];
      parts.forEach((part, i) => {
        result.push(part);
        if (i < parts.length - 1) {
          result.push(
            <span
              key={`note-${index}-rm-${redMarkKey++}`}
              className="relative inline-block"
              style={{ color: '#c0392b' }}
            >
              {word}
              <svg
                className="absolute -inset-x-1 -inset-y-0.5 pointer-events-none"
                viewBox="0 0 100 20"
                preserveAspectRatio="none"
                style={{ width: 'calc(100% + 8px)', height: 'calc(100% + 4px)', left: '-4px', top: '-2px' }}
              >
                <ellipse
                  cx="50"
                  cy="10"
                  rx="48"
                  ry="8"
                  fill="none"
                  stroke="#e74c3c"
                  strokeWidth="1.5"
                  strokeDasharray="3 2"
                  opacity="0.7"
                />
              </svg>
            </span>
          );
        }
      });
      return result;
    });
  });

  return (
    <motion.p
      ref={ref}
      initial={{ opacity: 0, y: 12 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.06 }}
      className="m-0"
      style={{
        fontFamily: '"ZCOOL KuaiLe", "Ma Shan Zheng", "KaiTi", "STKaiti", cursive',
        fontSize: '22px',
        lineHeight: '36px',
        color: '#3d3b38',
        textIndent: '2em',
        wordBreak: 'break-all',
      }}
    >
      {content}
    </motion.p>
  );
}

/** Nyaumae-8 — P.2 of the notebook. Mirrors the P.1 paper/grid styling. */
function Nyaumae8Page({ en }: { en: boolean }) {
  const classes = en ? nyaumae8ClassesEn : nyaumae8Classes;
  const capacity = en ? nyaumae8CapacityEn : nyaumae8Capacity;
  const clusters = en ? nyaumae8EmojiEn : nyaumae8Emoji;
  const totals = en ? nyaumae8EmojiTotalsEn : nyaumae8EmojiTotals;
  const lead = en ? nyaumae8LeadEn : nyaumae8LeadZh;
  const emojiLead = en ? nyaumae8EmojiLeadEn : nyaumae8EmojiLeadZh;
  const head = en ? nyaumae8TableHeadEn : nyaumae8TableHeadZh;
  const hand = '"ZCOOL KuaiLe", "Ma Shan Zheng", "KaiTi", "STKaiti", cursive';
  const mono = '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace';
  const ink = '#3d3b38';

  return (
    <div
      className="relative rounded-lg shadow-2xl overflow-hidden"
      style={{
        backgroundColor: '#faf6ed',
        boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 60px rgba(139,119,95,0.08)',
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          mixBlendMode: 'multiply',
        }}
      />
      <div
        className="relative px-6 sm:px-10 py-10 miia-grid-paper"
        style={{
          backgroundImage: `
            linear-gradient(90deg, transparent 39px, #e8a5a5 39px, #e8a5a5 40px, transparent 40px),
            repeating-linear-gradient(
              to bottom,
              transparent,
              transparent 35px,
              #c4d7e8 35px,
              #c4d7e8 36px
            )
          `,
          backgroundSize: '100% 100%, 100% 36px',
          backgroundPosition: '0 0, 0 10px',
          paddingLeft: '56px',
          paddingRight: '24px',
          paddingTop: '14px',
          paddingBottom: '36px',
        }}
      >
        <div
          className="absolute top-3 right-5 text-xs"
          style={{ fontFamily: '"ZCOOL KuaiLe", cursive', color: '#c4b8a8' }}
        >
          P.2
        </div>
        <div
          className="absolute top-3 left-14 text-xs"
          style={{ fontFamily: '"ZCOOL KuaiLe", cursive', color: '#c4b8a8' }}
        >
          {en ? 'byte table' : '字节表'}
        </div>

        <h3
          className="m-0 mb-3"
          style={{ fontFamily: hand, fontSize: '30px', lineHeight: '36px', color: ink }}
        >
          Nyaumae-8
        </h3>
        <p
          className="m-0 mb-6"
          style={{ fontFamily: hand, fontSize: '20px', lineHeight: '34px', color: ink, textIndent: '2em' }}
        >
          {lead}
        </p>

        {/* Byte-class patterns */}
        <div className="space-y-2 mb-6">
          {classes.map((cls) => (
            <div key={cls.bytes} className="flex items-baseline gap-3 flex-wrap">
              <span
                className="shrink-0"
                style={{ fontFamily: hand, fontSize: '20px', color: ink }}
              >
                {cls.bytes} {en ? 'bytes' : '字节'}：
              </span>
              <span className="font-mono text-[15px] sm:text-base" style={{ color: ink, letterSpacing: '0.06em' }}>
                {cls.pattern.join(' ')}
              </span>
            </div>
          ))}
        </div>
        {classes.filter((c) => c.leadExcludes.length > 0).map((cls) => (
          <div key={`ex-${cls.bytes}`} className="mb-1 pl-1">
            {cls.leadExcludes.map((ex) => (
              <p
                key={ex}
                className="m-0 font-mono text-[13px] sm:text-sm"
                style={{ color: '#a16207', letterSpacing: '0.04em' }}
              >
                {en ? 'but ' : '但 '}
                {ex}
              </p>
            ))}
          </div>
        ))}

        {/* Capacity table */}
        <table className="w-full my-6 text-sm" style={{ fontFamily: hand, color: ink, borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {head.map((h) => (
                <th
                  key={h}
                  className="text-left font-normal pb-2 pr-4"
                  style={{ borderBottom: '1.5px solid #c9b8a4' }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {capacity.map((row) => (
              <tr key={row.bytes}>
                <td className="py-1.5 pr-4">{row.bytes} {en ? 'bytes' : '字节'}</td>
                <td className="py-1.5 pr-4 font-mono" style={{ fontFamily: mono }}>
                  {row.utf8.toLocaleString('en-US')}
                </td>
                <td className="py-1.5 font-mono" style={{ fontFamily: mono, color: '#0e7490' }}>
                  {row.nyaumae8.toLocaleString('en-US')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ height: '48px' }} />

        {/* Emoji: the worked example for the 4-byte class */}
        <h3 className="m-0 mb-3" style={{ fontFamily: hand, fontSize: '24px', lineHeight: '36px', color: ink }}>
          🧑‍🦯🧏🤐🧑‍🦼🧠💭🧩
        </h3>
        <p
          className="m-0 mb-4"
          style={{ fontFamily: hand, fontSize: '20px', lineHeight: '34px', color: ink, textIndent: '2em' }}
        >
          {emojiLead}
        </p>

        <div className="space-y-2 mb-4">
          {clusters.map((c) => (
            <div
              key={c.cluster}
              className="flex items-baseline gap-3 flex-wrap text-[22px] leading-[30px]"
            >
              <span className="w-10 shrink-0 text-center" style={{ fontFamily: hand, color: ink }}>
                {c.cluster}
              </span>
              <span className="font-mono text-[13px] sm:text-sm flex-1 min-w-[180px]" style={{ color: ink }}>
                {c.codePoints.map((cp) => `${cp.hex}(${cp.bytes})`).join(' + ')}
              </span>
              <span className="font-mono text-[13px] sm:text-sm" style={{ color: '#0e7490' }}>
                = {c.bytes}
              </span>
            </div>
          ))}
        </div>

        <p
          className="m-0 mb-4"
          style={{ fontFamily: hand, fontSize: '20px', lineHeight: '34px', color: ink }}
        >
          {en ? 'In total' : '一共'}
          <span className="font-mono" style={{ fontFamily: mono }}>
            {totals.clusters} {en ? 'clusters' : '簇'} / {totals.codePoints} {en ? 'code points' : '码点'} / {totals.bytes} {en ? 'bytes' : '字节'}
          </span>
        </p>

        <div style={{ height: '48px' }} />
        <p
          className="m-0 pr-8"
          style={{
            fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
            fontSize: '26px',
            lineHeight: '36px',
            color: '#5d4e6d',
            transform: 'rotate(-2deg)',
            textAlign: 'right',
          }}
        >
          {en ? '—— Miia' : '——咪呀'}
        </p>
      </div>
    </div>
  );
}

export default function MiiaMathNotes() {
  const _en = getLocale() === 'en';
  const paragraphs = _en ? miiaMathParagraphsEn : paragraphsZh;
  const highlights = _en ? miiaMathHighlightsEn : highlightsZh;
  const redMarks = _en ? miiaMathRedMarksEn : redMarksZh;
  const theoremText = _en ? theoremFragmentsEn : theoremFragments;

  return (
    <section id="miia-math-notes" className="miia-subpage miia-math-page py-20 px-4 sm:px-6 bg-[var(--aurora-brand-bg-deep)] relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-fuchsia-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-3xl mx-auto relative z-10">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 border border-fuchsia-500/20 text-fuchsia-300 text-xs mb-4">
            <BookOpenText className="w-3.5 h-3.5" />
            <span>{L("咪呀的手写笔记")}</span>
          </div>
          <h2
            className="text-3xl sm:text-4xl tracking-tight"
            style={{
              fontFamily: '"ZCOOL KuaiLe", "Ma Shan Zheng", cursive',
              color: '#F0E6FF',
            }}
          >
            {L("数学笔记\r\n          ")}</h2>
          <p className="text-sm text-nc-text-muted mt-2">{L("二年级 · 集合论遐想")}</p>
        </div>

        <div
          className="relative rounded-lg shadow-2xl overflow-hidden"
          style={{
            backgroundColor: '#faf6ed',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5), inset 0 0 60px rgba(139,119,95,0.08)',
          }}
        >
          <div
            className="absolute inset-0 pointer-events-none opacity-40"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
              mixBlendMode: 'multiply',
            }}
          />

          <div
            className="relative px-6 sm:px-10 py-10 miia-grid-paper"
            style={{
              backgroundImage: `
                linear-gradient(90deg, transparent 39px, #e8a5a5 39px, #e8a5a5 40px, transparent 40px),
                repeating-linear-gradient(
                  to bottom,
                  transparent,
                  transparent 35px,
                  #c4d7e8 35px,
                  #c4d7e8 36px
                )
              `,
              backgroundSize: '100% 100%, 100% 36px',
              backgroundPosition: '0 0, 0 10px',
              paddingLeft: '56px',
              paddingRight: '24px',
              paddingTop: '14px',
              paddingBottom: '36px',
            }}
          >
            <div
              className="absolute top-3 right-5 text-xs"
              style={{
                fontFamily: '"ZCOOL KuaiLe", cursive',
                color: '#c4b8a8',
              }}
            >
              P.1
            </div>

            <div
              className="absolute top-3 left-14 text-xs"
              style={{
                fontFamily: '"ZCOOL KuaiLe", cursive',
                color: '#c4b8a8',
              }}
            >
              {L("2026.5.10 星期日 多云\r\n            ")}</div>

            <div className="space-y-0">
              {paragraphs.map((text, i) => (
                <NoteParagraph key={i} text={text} index={i} highlights={highlights} redMarks={redMarks} />
              ))}
            </div>

            <div style={{ height: '72px' }} />

            <motion.p
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-right m-0 pr-8"
              style={{
                fontFamily: '"Ma Shan Zheng", "ZCOOL KuaiLe", cursive',
                fontSize: '26px',
                lineHeight: '36px',
                color: '#5d4e6d',
                transform: 'rotate(-2deg)',
              }}
            >
              {L("——咪呀\r\n            ")}</motion.p>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute bottom-4 right-8"
              style={{
                fontFamily: '"ZCOOL KuaiLe", cursive',
                fontSize: '14px',
                color: '#b8a99a',
                transform: 'rotate(8deg)',
              }}
            >
              (ฅ&apos;ω&apos;ฅ)
            </motion.div>
          </div>
        </div>

        <div className="mt-10">
          <Nyaumae8Page en={_en} />
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-4 text-xs text-nc-text-muted">
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-6 h-3 rounded-sm" style={{ background: 'linear-gradient(120deg, #fde047 0%, #fde047 100%)' }} />
            {L("重点标记\r\n          ")}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="inline-block w-6 h-3 rounded-sm border border-dashed border-red-400/70" />
            {L("红笔圈注\r\n          ")}</span>
          <span className="inline-flex items-center gap-1.5">
            <Eraser className="w-3.5 h-3.5" />
            {L("字体：站酷快乐体\r\n          ")}</span>
        </div>

        {/* 定理1-3 - 新增 */}
        <div className="max-w-3xl mx-auto mt-10 bg-[var(--aurora-brand-cream)] rounded-lg p-6 sm:p-8 shadow-xl">
          <h3 className="text-lg font-bold text-[var(--aurora-brand-stone)] mb-4 flex items-center gap-2">
            <BookOpenText className="w-5 h-5 text-violet-600" />
            {L("定理一二三 · 整数伪装\r\n          ")}</h3>
          <div className="space-y-4 text-sm text-[var(--aurora-brand-stone)] leading-relaxed whitespace-pre-wrap" style={{ fontFamily: '"ZCOOL KuaiLe", "Ma Shan Zheng", cursive' }}>
            {theoremText.split('\n\n').map((para, i) => (
              <p key={i}>{semanticHighlightProse(para)}</p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
