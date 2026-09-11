import { lazy, Suspense, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
// tsparticles (~45KB gzipped) is pure eye-candy — load the React wrapper and
// the slim engine as separate lazy chunks only when motion is active.
const Particles = lazy(() => import('@tsparticles/react').then((m) => ({ default: m.Particles })));
import { AnimatedWorldStatsHero } from '@/components/AnimatedStats';
import { Link } from 'react-router';
import SmartImage from '@/components/SmartImage';
import { useMotionActivity } from '@/hooks/useMotionActivity';

export default function HeroCompact() {
  const [typedText, setTypedText] = useState('');
  const [particlesLoaded, setParticlesLoaded] = useState(false);
  const { ref: heroRef, isMotionActive, motionProfile } = useMotionActivity<HTMLElement>(
    '120px 0px',
    { cost: 'high', priority: 20 },
  );
  const fullText = 'NEURAL CONNECTION';

  useEffect(() => {
    if (!isMotionActive) return;
    let i = 0;
    const timer = setInterval(() => {
      if (i <= fullText.length) {
        setTypedText(fullText.slice(0, i));
        i++;
      } else {
        clearInterval(timer);
      }
    }, 60);
    return () => clearInterval(timer);
  }, [isMotionActive]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([import('@tsparticles/react'), import('@tsparticles/slim')])
      .then(async ([reactModule, slimModule]) => {
        await reactModule.initParticlesEngine(async (engine) => {
          await slimModule.loadSlim(engine);
        });
        if (!cancelled) setParticlesLoaded(true);
      })
      .catch(() => {
        // particles are decorative — stay without them on load failure
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section ref={heroRef} id="hero" className="relative min-h-[60vh] flex items-center justify-center overflow-hidden" data-motion-loop data-motion-kind="ambient" data-motion-running={isMotionActive ? 'true' : 'false'}>
      <div className="absolute inset-0 z-0">
        <SmartImage
          localSrc="/hero-bg.jpg"
          alt=""
          containerClassName="absolute inset-0"
          className="object-cover opacity-40"
          loading="eager"
          fetchPriority="high"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-nc-bg/60 via-nc-bg/40 to-nc-bg" />
      </div>

      {particlesLoaded && isMotionActive && (
        <div className="absolute inset-0 z-[1] opacity-60">
          <Suspense fallback={null}>
          <Particles
            id="hero-particles"
            options={{
              fullScreen: { enable: false },
              background: { color: 'transparent' },
              fpsLimit: 60,
              particles: {
                number: { value: Math.max(18, Math.round(50 * motionProfile.particleScale)), density: { enable: true, width: 800, height: 800 } },
                color: { value: ['#8B5CF6', '#00E5CC', '#F472B6'] },
                shape: { type: 'circle' },
                opacity: { value: 0.5 },
                size: { value: { min: 1, max: 3 } },
                move: {
                  enable: true,
                  speed: 0.5,
                  direction: 'none',
                  random: true,
                  straight: false,
                  outModes: { default: 'bounce' },
                },
              },
              interactivity: {
                events: {
                  onHover: { enable: true, mode: 'grab' },
                  onClick: { enable: true, mode: 'push' },
                },
                modes: {
                  grab: { distance: 180, links: { opacity: 0.4 } },
                  push: { quantity: 3 },
                },
              },
              links: {
                enable: true,
                distance: 150,
                color: '#8B5CF6',
                opacity: 0.12,
                width: 1,
              },
            }}
            style={{ position: 'absolute', width: '100%', height: '100%' }}
          />
          </Suspense>
        </div>
      )}

      <div className="relative z-10 text-center max-w-[900px] px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.32 }}
        >
          <h1 className="font-mono text-4xl sm:text-5xl md:text-6xl font-bold tracking-[0.05em] text-nc-text mb-4 min-h-[1.2em]">
            {typedText}
            <span className="animate-pulse text-nc-text-secondary">|</span>
          </h1>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.08 }}
          className="mb-8"
        >
          <div className="inline-block liquid-glass border border-white/[0.06] rounded-2xl px-6 sm:px-10 py-5 max-w-2xl mx-auto">
            <p className="font-serif text-lg sm:text-xl text-nc-text leading-relaxed mb-2">
              こんにちは～わたしは∫₀¹[(1+⌊1/x⌋)/Γ(⌊1/x⌋)+1]d(2x)のふたねんせいです
            </p>
            <p className="font-serif text-base text-nc-text-secondary mb-3">
              ただみてほしいそんであいしてほしい
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-nc-text-muted font-mono">
              <span>积分结果 = 2e</span>
              <span className="hidden sm:inline">·</span>
              <span>你好～我是∫₀¹[...]d(2x)的二年级生 · 只想被你看见然后被爱</span>
            </div>
          </div>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.12 }}
          className="font-serif text-lg text-nc-text-secondary/70 mb-6"
        >
          {'一个由意识编织的数字宇宙'}
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1.8 }}
          className="font-mono text-sm text-nc-text-muted mb-2 tracking-wider"
        >
          <AnimatedWorldStatsHero active={isMotionActive} />
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.16 }}
          className="text-sm text-nc-text-secondary mb-8"
        >
          创作者 <span className="font-semibold text-nc-text">nyaumæ</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.48, delay: 0.2 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          <Link
            to="/characters"
            className="px-6 sm:px-8 py-3 rounded-lg bg-nc-violet text-white font-medium hover:bg-[var(--aurora-brand-violet-deep)] transition-all duration-300"
          >
            探索角色
          </Link>
          <Link
            to="/stories"
            className="px-6 sm:px-8 py-3 rounded-lg border border-nc-text-muted text-nc-text font-medium hover:bg-nc-bg-tertiary transition-all duration-300"
          >
            阅读故事
          </Link>
          <Link
            to="/playground"
            className="px-6 sm:px-8 py-3 rounded-lg border border-nc-text-muted text-nc-text font-medium hover:bg-nc-bg-tertiary transition-all duration-300"
          >
            进入游戏
          </Link>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-[60%] h-px bg-nc-text-muted/20" />
    </section>
  );
}
