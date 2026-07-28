import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { worldviewInfo } from '@/data/worldview';
import SmartImage from '@/components/SmartImage';
import { Trophy } from 'lucide-react';

export default function QETSection() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className="px-4 sm:px-6 py-6">
      <div className="max-w-[1100px] mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="bg-nc-bg-secondary border border-nc-violet/10 rounded-xl p-6"
        >
          <SmartImage
            localSrc="/qet-card.jpg"
            alt="QET Qualification Examination Test"
            aspectRatio="16/9"
            containerClassName="w-full rounded-lg mb-4 border border-[#8B5CF6]/10"
            className="object-cover"
          />
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-nc-text-secondary" />
            <h3 className="text-lg font-semibold text-nc-text">{semanticHighlight("QET 选拔")}</h3>
          </div>
          <div className="space-y-2 text-sm text-nc-text-secondary">
            <p>{semanticHighlight('总分 1000 分，分为笔试（500 分）与机试（500 分）两部分。')}</p>
            {worldviewInfo.qet.note && (
              <p className="text-[11px] text-nc-text-muted leading-relaxed">{worldviewInfo.qet.note}</p>
            )}
            <div className="flex justify-between border-t border-nc-violet/10 pt-2">
              <span>{semanticHighlight("笔试上限")}</span>
              <span className="font-mono text-nc-text-secondary">{worldviewInfo.qet.written.maxApplicants.toLocaleString()} 人</span>
            </div>
            <div className="flex justify-between">
              <span>{semanticHighlight("笔试通过")}</span>
              <span className="font-mono text-nc-text-secondary">{worldviewInfo.qet.written.maxPass} 人</span>
            </div>
            <div className="flex justify-between">
              <span>{semanticHighlight("最终录取")}</span>
              <span className="font-mono text-nc-text-secondary">{worldviewInfo.qet.practical.maxPass} 人</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
