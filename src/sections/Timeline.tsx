import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { timelineEvents } from '@/data/timeline';
import SmartImage from '@/components/SmartImage';

const timelineImages = [
  { src: "/timeline-1.png", alt: "Timeline 1" },
  { src: "/timeline-2.png", alt: "Timeline 2" },
  { src: "/timeline-3.png", alt: "Timeline 3" },
  { src: "/timeline-4.png", alt: "Timeline 4" },
];

export default function Timeline() {
  const { ref, isVisible } = useScrollReveal();

  return (
    <div ref={ref} className="px-4 sm:px-6 py-6">
      <div className="max-w-[1100px] mx-auto">

        {/* Timeline Images Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {timelineImages.map((img, i) => (
            <motion.div
              key={img.src}
              initial={{ opacity: 0, y: 30 }}
              animate={isVisible ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: 0.1 + i * 0.1 }}
            >
              <SmartImage
                localSrc={img.src}
                alt={img.alt}
                aspectRatio="16/9"
                containerClassName="w-full rounded-xl overflow-hidden border border-nc-violet/10"
                className="object-cover"
              />
            </motion.div>
          ))}
        </div>

        {/* Single timeline */}
        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-4 sm:left-6 top-0 bottom-0 w-px bg-nc-violet/20" />

          <div className="space-y-1">
            {timelineEvents.map((event, i) => (
              <motion.div
                key={`${event.year}-${event.title}`}
                initial={{ opacity: 0, x: -20 }}
                animate={isVisible ? { opacity: 1, x: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.1 + i * 0.05 }}
                className="relative pl-12 sm:pl-14"
              >
                {/* Dot */}
                <div className="absolute left-2.5 sm:left-4.5 top-2 w-3 h-3 rounded-full border-2 border-nc-violet/40 bg-nc-bg" />

                <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5 sm:gap-4 py-3 border-b border-nc-violet/10">
                  <span className="font-mono text-sm font-bold text-nc-violet shrink-0 w-24">
                    {event.year}
                  </span>
                  <div className="flex-1 min-w-0">
                    <span className="text-base font-semibold text-nc-text mr-2">
                      {semanticHighlight(event.title)}
                    </span>
                    <span className="text-sm text-nc-text-secondary">
                      {event.desc}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
