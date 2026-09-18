import { motion } from 'framer-motion';
import { L } from '@/lib/translations/manual';

import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { worldviewInfo } from '@/data/worldview';
import { worldviewInfoEn } from '@/data/worldview.en';
import { getLocale } from '@/lib/i18n';
import SmartImage from '@/components/SmartImage';
import { Trophy } from 'lucide-react';

export default function QETSection() {
  const { ref, isVisible } = useScrollReveal();
  const _en = getLocale() === 'en';
  const qet = (_en ? worldviewInfoEn : worldviewInfo).qet;

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
            <p>{_en
              ? 'Total 1,000 points, split into the written round (500 pts) and the practical round (500 pts).'
              : semanticHighlight('总分 1000 分，分为笔试（500 分）与机试（500 分）两部分。')}</p>
            {qet.note && (
              <p className="text-[11px] text-nc-text-muted leading-relaxed">{qet.note}</p>
            )}
            <div className="flex justify-between border-t border-nc-violet/10 pt-2">
              <span>{_en ? 'Written cap' : semanticHighlight("笔试上限")}</span>
              <span className="font-mono text-nc-text-secondary">{qet.written.maxApplicants.toLocaleString()} {L("人")}</span>
            </div>
            <div className="flex justify-between">
              <span>{_en ? 'Written pass' : semanticHighlight("笔试通过")}</span>
              <span className="font-mono text-nc-text-secondary">{qet.written.maxPass} {L("人")}</span>
            </div>
            <div className="flex justify-between">
              <span>{_en ? 'Final admits' : semanticHighlight("最终录取")}</span>
              <span className="font-mono text-nc-text-secondary">{qet.practical.maxPass} {L("人")}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
