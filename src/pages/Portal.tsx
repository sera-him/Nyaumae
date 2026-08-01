import { useCallback, useEffect, useRef, useState, type FocusEvent as ReactFocusEvent } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen, Cpu, Gamepad2, Globe2, Heart, Users } from 'lucide-react';
import { useMotionActivity } from '@/hooks/useMotionActivity';
import './PortalAurora.css';

const slides = [
  { src: '/1.jpg', alt: '气球与糖果屋', title: '气球与糖果屋' },
  { src: '/1-generated.png', alt: '数学世界', title: '数学世界' },
  { src: '/2.jpg', alt: '公式与主页的庭院', title: '公式与主页的庭院' },
  { src: '/2-time-nodes.png', alt: '五个时间节点', title: '五个时间节点' },
  { src: '/3.jpg', alt: '云朵落进玉桂狗的房间', title: '云朵落进玉桂狗的房间' },
  { src: '/3-generated.png', alt: '六个世界入口', title: '六个世界入口' },
];

const slideMetadata = [
  { location: '星界馆 · 环形图书馆', time: '午后', region: '宇宙总览' },
  { location: '意识深处', time: '永恒', region: '认知空间' },
  { location: '哲华校园', time: '午后', region: '现实世界' },
  { location: '时间轴', time: '交错', region: '编年史' },
  { location: '星界馆 · 休息室', time: '傍晚', region: '日常' },
  { location: '宇宙交汇处', time: '黄昏', region: '入口' },
];

const entries = [
  { id: 'world', label: '世界', en: 'World', meta: '1,207,963,268 人', icon: Globe2, href: '/world', desc: '12 亿人口的平行数字宇宙。哲华学校科照真学院与德澜思拓公司构成双核心驱动力，AGI 与意识的边界在此模糊。从冯·诺伊曼班的精英选拔到心界 VR 的沉浸式体验，每个意识体都在寻找自己的神经频率。' },
  { id: 'characters', label: '角色', en: 'Characters', meta: '37 个意识体', icon: Users, href: '/characters', desc: '31 位主角色与 6 位补充意识体，各自闪烁着不同的神经频率。M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群——每个角色都承载着独特的存在悖论。' },
  { id: 'stories', label: '叙事', en: 'Narratives', meta: '4 个长篇 · 24+ 碎片', icon: BookOpen, href: '/stories', desc: "《大人国的小女孩》、M/I/A's World、狐狸与企鹅、AGI 应许之地——四个长篇叙事宇宙，以及 24+ 诗歌碎片。从星界馆的午后到大人国的三十天，故事在时间流速错叠的角落里展开。" },
  { id: 'miia', label: '咪呀 mī yā', en: 'Inner Space', meta: 'FSIII 226 · 2017', icon: Heart, href: '/miia', desc: '内心独白、数学笔记与诗歌碎片。二年级生的集合论遐想、对存在的温柔质问、以及「只想被你看见然后被爱」的朴素愿望。FSIII 226，2017 年生，被定格在十四岁的投影与真实成长之间的涟漪。' },
  { id: 'fsiii', label: 'FSIII', en: 'Cognition Index', meta: '29 个意识体', icon: Cpu, href: '/math/fsiii', desc: '理性骨架——公式与数据的语言。29 个意识体的 FSIII 排名与评分，从 Damocles 的 1314 到林浅的 90，构成一套贯穿世界观的量化认知体系。各省均值、区域分布、层级划分尽在其中。' },
  { id: 'playground', label: '游戏', en: 'Playground', meta: '规则 · 概率 · 谜题', icon: Gamepad2, href: '/playground', desc: '复合象棋——棋子、规则与毒化机制；技能井字棋——三连棋变体与技能对战；题目——谜题、QR 码与考核。在规则与概率的交界处，用游戏理解这个世界的底层逻辑。' },
];

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number; c: number[] };

function NeuralParticles() {
  const { ref: canvasRef, isMotionActive } = useMotionActivity<HTMLCanvasElement>('120px 0px');
  const particlesRef = useRef<Particle[]>([]);
  const pointerRef = useRef({ x: 0, y: 0, active: false });

  useEffect(() => {
    if (!isMotionActive) return;
    const canvas = canvasRef.current;
    const hero = canvas?.parentElement;
    const context = canvas?.getContext('2d');
    if (!canvas || !hero || !context) return;
    const colors = [[102, 233, 218], [166, 133, 255], [255, 143, 199], [121, 169, 255], [255, 199, 107]];
    let width = 1;
    let height = 1;
    let frame = 0;
    const makeParticle = (x = Math.random() * width, y = Math.random() * height, burst = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? .45 + Math.random() * 1.1 : .08 + Math.random() * .22;
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: .8 + Math.random() * (burst ? 2.7 : 1.7), a: .35 + Math.random() * .55, c: colors[Math.floor(Math.random() * colors.length)] };
    };
    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, 2);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      const target = width < 640 ? 42 : 72;
      while (particlesRef.current.length < target) particlesRef.current.push(makeParticle());
    };
    const connect = (a: Particle, b: { x: number; y: number; c: number[] }, max: number, strength = 1) => {
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (distance >= max) return;
      context.strokeStyle = `rgba(${a.c.join(',')},${(1 - distance / max) * .28 * strength})`;
      context.lineWidth = .7;
      context.beginPath(); context.moveTo(a.x, a.y); context.lineTo(b.x, b.y); context.stroke();
    };
    const draw = () => {
      context.clearRect(0, 0, width, height);
      const particles = particlesRef.current;
      particles.forEach((particle, index) => {
        particle.x += particle.vx; particle.y += particle.vy;
        if (particle.x < -8) particle.x = width + 8; if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8; if (particle.y > height + 8) particle.y = -8;
        for (let i = index + 1; i < particles.length; i += 1) connect(particle, particles[i], 128, .8);
        if (pointerRef.current.active) connect(particle, { ...pointerRef.current, c: [255, 255, 255] }, 190, 1.4);
        context.shadowColor = `rgba(${particle.c.join(',')},${particle.a})`; context.shadowBlur = particle.r * 5;
        context.fillStyle = `rgba(${particle.c.join(',')},${particle.a})`; context.beginPath(); context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2); context.fill(); context.shadowBlur = 0;
      });
      frame = requestAnimationFrame(draw);
    };
    const move = (event: PointerEvent) => { const rect = hero.getBoundingClientRect(); pointerRef.current = { x: event.clientX - rect.left, y: event.clientY - rect.top, active: true }; };
    const leave = () => { pointerRef.current.active = false; };
    const burst = (event: PointerEvent) => {
      if (event.button !== 0) return;
      const rect = hero.getBoundingClientRect(); const x = event.clientX - rect.left; const y = event.clientY - rect.top;
      const amount = width < 640 ? 8 : 12;
      for (let i = 0; i < amount; i += 1) particlesRef.current.push(makeParticle(x + (Math.random() - .5) * 18, y + (Math.random() - .5) * 18, true));
      canvas.dataset.particleCount = String(particlesRef.current.length);
    };
    const observer = new ResizeObserver(resize); observer.observe(hero); resize(); draw();
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave); hero.addEventListener('pointerdown', burst);
    canvas.dataset.particleCount = String(particlesRef.current.length);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); hero.removeEventListener('pointerdown', burst); };
  }, [canvasRef, isMotionActive]);
  return <canvas ref={canvasRef} className="portal-particles" aria-hidden="true" />;
}

export default function Portal() {
  const [slide, setSlide] = useState(0);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const { ref: carouselRef, isMotionActive: carouselMotionActive } = useMotionActivity<HTMLDivElement>('240px 0px');
  const carouselPaused = carouselHovered || carouselFocused || !carouselMotionActive;

  const go = useCallback((next: number) => {
    setSlide((next + slides.length) % slides.length);
    setTimerReset((current) => current + 1);
  }, []);

  const advance = useCallback(() => {
    setSlide((current) => (current + 1) % slides.length);
  }, []);

  const handleCarouselBlur = useCallback((event: ReactFocusEvent<HTMLDivElement>) => {
    if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
      setCarouselFocused(false);
    }
  }, []);

  useEffect(() => {
    if (carouselPaused) return;
    const timer = window.setInterval(advance, 5200);
    return () => window.clearInterval(timer);
  }, [advance, carouselPaused, timerReset]);

  const cardColors: Record<string, string> = {
    world: '#66e9da', characters: '#a685ff', stories: '#ff8fc7',
    miia: '#d99cff', fsiii: '#ffc76b', playground: '#79a9ff',
  };

  return (
    <div className="portal-aurora">
      <section className="portal-hero" data-motion-loop>
        <div className="portal-hero-bg" />
        <div className="portal-hero-refraction" aria-hidden="true" />
        <NeuralParticles />
        <p className="portal-particle-hint">✦ 移动指针连接神经 · 点击生成新粒子</p>
        <div className="portal-hero-grid">
          <div className="portal-hero-copy">
            <p className="portal-kicker"><span>01</span> AURORA ATLAS / 由意识编织</p>
            <h1><span>NEURAL</span><span>CONNECTION</span></h1>
            <p className="portal-lead">一个由意识编织的<br />数字宇宙</p>
            <div className="portal-actions">
              <Link className="portal-secondary" to="/characters">探索角色 <span>↗</span></Link>
              <Link className="portal-primary" to="/stories">阅读故事 →</Link><Link className="portal-tertiary" to="/playground">进入游戏 →</Link>
            </div>
          </div>
          <aside className="portal-miia">
            <div className="portal-miia-head"><span>TRANSMISSION / 2017</span><span>▮▮▮</span></div>
            <blockquote>こんにちは～わたしは∫₀¹[(1+⌊1/x⌋)/Γ(⌊1/x⌋)+1]d(2x)のふたねんせいです</blockquote>
            <p>ただみてほしいそんであいしてほしい</p>
            <div><strong>积分结果 = 2e</strong><span>你好～我是 ∫₀¹[...]d(2x) 的二年级生<br />只想被你看见然后被爱</span></div>
          </aside>
          <div className="portal-stats"><div><span>WORLD POPULATION</span><strong>1,207,963,268</strong></div><div><span>AVERAGE LIFESPAN</span><strong>74y 6m 24d</strong></div><div><span>CREATOR</span><strong>Nyaumæ</strong></div></div>
        </div>
      </section>

      <section className="portal-section portal-visions">
        <div className="portal-section-head"><div><p>01 / VISUAL ARCHIVE</p><h2>世界的六个切面</h2></div><span>在时间、意识与规则之间，图像是通往这个宇宙的第一道门。</span></div>
        <figure className="portal-overview">
          <img src="/2-generated.png" alt="夕阳与星空下的星界馆，五位少女在环形图书馆中阅读、学习与交流" loading="lazy" decoding="async" />
          <div className="portal-overview-shade" aria-hidden="true" />
          <div className="portal-overview-index" aria-hidden="true"><span>ARCHIVE 00</span><span>OVERVIEW</span></div>
          <figcaption>
            <p>UNIVERSE OVERVIEW / 星界馆</p>
            <h3>星界馆 · 宇宙总览</h3>
            <span>意识、时间与城市在同一座馆室交汇，六个切面由此展开。</span>
          </figcaption>
        </figure>
        <div className="portal-archive-divider" aria-hidden="true"><span>SIX PERSPECTIVES</span><span>01 — 06</span></div>
        <div
          ref={carouselRef}
          className="portal-carousel-shell"
          role="region"
          aria-roledescription="轮播图"
          aria-label="世界的六个切面视觉档案"
          data-paused={carouselPaused}
          data-motion-loop
          onMouseEnter={() => setCarouselHovered(true)}
          onMouseLeave={() => setCarouselHovered(false)}
          onFocusCapture={() => setCarouselFocused(true)}
          onBlurCapture={handleCarouselBlur}
        >
          <div
            className="portal-carousel"
            id="portal-archive-slide"
            role="group"
            aria-roledescription="幻灯片"
            aria-label={`第 ${slide + 1} 张，共 ${slides.length} 张：${slides[slide].title}`}
          >
            <img key={slides[slide].src} src={slides[slide].src} alt={slides[slide].alt} />
            <div className="portal-carousel-shade" />
            <div className="portal-caption" aria-live="polite"><p>VISUAL ARCHIVE {String(slide + 1).padStart(2, '0')}</p><h3>{slides[slide].title}</h3><div className="portal-slide-meta"><span>{slideMetadata[slide].location}</span><span>{slideMetadata[slide].time}</span><span>{slideMetadata[slide].region}</span></div></div>
            <div className="portal-count"><strong>{String(slide + 1).padStart(2, '0')}</strong><span>/ 06</span></div>
            <button type="button" className="portal-arrow portal-prev" onClick={() => go(slide - 1)} aria-controls="portal-archive-slide" aria-label={`上一张：${slides[(slide - 1 + slides.length) % slides.length].title}`}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" className="portal-arrow portal-next" onClick={() => go(slide + 1)} aria-controls="portal-archive-slide" aria-label={`下一张：${slides[(slide + 1) % slides.length].title}`}><ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="portal-thumbs" role="group" aria-label="选择视觉档案">{slides.map((item, index) => <button key={item.src} type="button" className={index === slide ? 'active' : ''} onClick={() => go(index)} aria-label={`查看第 ${index + 1} 张：${item.alt}`} aria-controls="portal-archive-slide" aria-pressed={index === slide} aria-current={index === slide ? 'true' : undefined}><img src={item.src} alt="" loading="lazy" decoding="async" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div>
          <span className="portal-carousel-status" aria-live="polite">{carouselPaused ? '自动轮播已暂停' : '自动轮播播放中'}</span>
        </div>
      </section>

      <section className="portal-section portal-worlds">
        <div className="portal-section-head"><div><p>02 / ENTRY MATRIX</p><h2>选择一条神经路径</h2></div><span>六个入口，六种理解世界的方式。</span></div>
        <div className="portal-entry-grid">{entries.map((entry, index) => { const Icon = entry.icon; return <Link to={entry.href} key={entry.id} className={`portal-entry portal-entry-${entry.id}`} style={{ '--card': cardColors[entry.id] } as React.CSSProperties}><div className="portal-entry-top"><span>0{index + 1}</span><span>{entry.meta}</span></div><div className="portal-entry-title"><Icon /><div><p>{entry.en}</p><h3>{entry.label}</h3></div></div><p>{entry.desc}</p><div className="portal-entry-link"><span>进入 {entry.label}</span><span>↗</span></div></Link>; })}</div>
      </section>

      <section className="portal-closing"><p>“意识不是一座孤岛。”</p><span>每一次注视，都是一次神经连接。</span></section>
    </div>
  );
}
