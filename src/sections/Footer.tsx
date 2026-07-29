import { motion } from 'framer-motion';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import { Brain, ExternalLink, MessageSquareText } from 'lucide-react';
import { useState } from 'react';
import { semanticHighlight } from '@/lib/semanticHighlight';
import { AnimatedWorldStats } from '@/components/AnimatedStats';
import ParticleField from '@/components/ParticleField';
import FeedbackModal from '@/components/FeedbackModal';

export default function Footer() {
  const { ref, isVisible } = useScrollReveal();
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  return (
    <footer id="footer" className="aurora-site-footer py-20 px-4 sm:px-6 relative overflow-hidden">
      <div className="aurora-footer-particles" aria-hidden="true">
        <ParticleField type="rising" density={12} className="aurora-footer-particle-canvas" />
      </div>
      <div ref={ref} className="aurora-footer-content max-w-[1100px] mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isVisible ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
        >
          <div className="aurora-footer-brand flex items-center justify-center gap-3 mb-6">
            <Brain className="aurora-footer-brand-mark w-8 h-8 text-nc-cyan" />
            <span className="font-mono text-3xl sm:text-4xl font-bold text-nc-text tracking-wider">
              NEURAL CONNECTION
            </span>
          </div>

          <p className="aurora-footer-meta text-sm text-nc-text-muted mb-3">
            © 2021-2026 <span className="text-nc-text-secondary font-medium">Nyaumæ</span> · {semanticHighlight("由意识编织")}
          </p>

          <a
            href="https://space.bilibili.com/396073700"
            target="_blank"
            rel="noopener noreferrer"
            className="aurora-footer-social inline-flex items-center gap-1.5 text-sm text-nc-rose hover:text-nc-text transition-colors mb-2"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.813 4.653h.854c1.51.054 2.769.578 3.773 1.574 1.004.995 1.524 2.249 1.56 3.76v7.36c-.036 1.51-.556 2.769-1.56 3.773s-2.262 1.524-3.773 1.56H5.333c-1.51-.036-2.769-.556-3.773-1.56S.036 18.858 0 17.347v-7.36c.036-1.511.556-2.765 1.56-3.76 1.004-.996 2.262-1.52 3.773-1.574h.774l-1.174-1.12a1.234 1.234 0 0 1-.373-.906c0-.356.124-.658.373-.907l.027-.027c.267-.249.573-.373.92-.373.347 0 .653.124.92.373L9.653 4.44c.071.053.134.116.187.187h4.32c.053-.071.116-.134.187-.187l4.187-4c.267-.249.573-.373.92-.373.347 0 .653.124.92.373l.027.027c.249.249.373.551.373.907 0 .355-.124.657-.373.906l-1.174 1.12zM5.333 7.24c-.746.018-1.373.276-1.88.773-.506.498-.769 1.13-.786 1.894v7.52c.017.764.28 1.395.786 1.893.507.498 1.134.756 1.88.773h13.334c.746-.017 1.373-.275 1.88-.773.506-.498.769-1.129.786-1.893v-7.52c-.017-.765-.28-1.396-.786-1.894-.507-.497-1.134-.755-1.88-.773H5.333zM8 11.107c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c0-.373.129-.689.386-.947.258-.257.574-.386.947-.386zm8 0c.373 0 .684.124.933.373.25.249.383.569.4.96v1.173c-.017.391-.15.711-.4.96-.249.25-.56.374-.933.374s-.684-.125-.933-.374c-.25-.249-.383-.569-.4-.96V12.44c.017-.391.15-.711.4-.96.249-.249.56-.373.933-.373z"/>
            </svg>
            bilibili.com/space/396073700
            <ExternalLink className="w-3 h-3" />
          </a>

          <button
            onClick={() => setFeedbackOpen(true)}
            className="aurora-footer-feedback inline-flex items-center gap-1.5 text-sm text-nc-text-secondary hover:text-nc-text transition-colors mb-3"
          >
            <MessageSquareText className="w-4 h-4" />
            {semanticHighlight("反馈")}
          </button>

          <div className="aurora-footer-stats inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-nc-bg-secondary border border-nc-cyan/20 mb-8">
            <p className="font-mono text-sm sm:text-base text-nc-text leading-relaxed">
              <AnimatedWorldStats /> · 国际几何日 6.26
            </p>
          </div>

          <div className="aurora-footer-divider w-full max-w-md mx-auto h-px bg-gradient-to-r from-transparent via-nc-violet/20 to-transparent mb-8" />

          <p className="aurora-footer-quote font-serif text-nc-text-secondary italic text-base leading-relaxed">
            {semanticHighlight('「AGI 来了，AGI 来了，')}
            <br />
            {semanticHighlight('卷王走了，')}
            <br />
            {semanticHighlight('tourist 依然在我之上，')}
            <br />
            {semanticHighlight('可这重要吗？这不重要')}
            <br />
            {semanticHighlight('——你会在乎别人的时刻表背得比你准吗？」')}
          </p>

          <div className="aurora-footer-quotes grid gap-8 max-w-4xl mx-auto mt-8 text-left">
            <blockquote className="aurora-footer-quote font-serif text-nc-text-secondary italic text-base leading-relaxed border-l border-nc-cyan/30 pl-5">
              {semanticHighlight('残障未必可见，智力正常不等于所有功能正常；不要先判断品德，先理解实际困难。')}
              <footer className="mt-3 text-sm not-italic text-nc-text-muted">—— Sol</footer>
            </blockquote>

            <blockquote className="aurora-footer-quote font-serif text-nc-text-secondary italic text-base leading-relaxed border-l border-nc-rose/30 pl-5">
              {semanticHighlight('别急着用同一把尺子丈量所有人；能按自己的节奏走下去，也是一种抵达。')}
              <footer className="mt-3 text-sm not-italic text-nc-text-muted">—— Luna</footer>
            </blockquote>
          </div>
        </motion.div>
      </div>

      <FeedbackModal isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </footer>
  );
}
