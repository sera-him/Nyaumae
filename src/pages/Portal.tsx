import { useCallback, useEffect, useRef, useState, type FocusEvent as ReactFocusEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ArrowRight, BookOpen, BrainCircuit, Gamepad2, Globe2, History, MessageCircleMore, Search, Sigma, Sparkles, Users } from 'lucide-react';
import { useMotionActivity } from '@/hooks/useMotionActivity';
import { readLastViewed } from '@/lib/lastViewed';
import { NAVIGATION_GROUPS } from '@/lib/routeManifest';
import ResponsiveImage, { PORTAL_IMAGE_WIDTHS, THUMBNAIL_IMAGE_WIDTHS } from '@/components/ResponsiveImage';
import { writeStorageValue } from '@/lib/browserStorage';
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

const commandExamples = ['打开小禾第一次出现的章节', '画出喵呜到游泳池的关系路线', '继续上次 NCTB 测试', '启动 Cat Machine', '检查第二卷第五章是否违反正史'];
const directoryIconMap = {
  miia: Sparkles,
  world: Globe2,
  stories: BookOpen,
  characters: Users,
  math: Sigma,
  playground: Gamepad2,
  ai: MessageCircleMore,
  other: Search,
} as const;
const directoryAccentMap = {
  miia: '#f58ab8',
  world: '#66e9da',
  stories: '#ff9fc8',
  characters: '#c2a0ff',
  math: '#75e8d5',
  playground: '#8caeff',
  ai: '#74efe0',
  other: '#ffd17a',
} as const;

function commandRoute(command: string): string {
  const normalized = command.toLocaleLowerCase();
  if (/nctb|智力|测验|测试|能力图谱/.test(normalized)) return '/nctb';
  if (/cat machine|catmachine|游戏|递归回响|aurora atlas/.test(normalized)) return '/playground';
  if (/角色|人物|关系|邻居|亲友|章节|故事|正史|出现/.test(normalized)) return `/codex?q=${encodeURIComponent(command)}`;
  return `/chat/aurora?prompt=${encodeURIComponent(command)}`;
}

function NeuralCommandConsole() {
  const navigate = useNavigate();
  const [command, setCommand] = useState('');
  const submit = (event: React.FormEvent<HTMLFormElement>, fallback = false) => {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    writeStorageValue('neural-connection:last-command', value);
    navigate(fallback ? `/codex?q=${encodeURIComponent(value)}` : commandRoute(value));
  };
  return <div className="portal-command-console"><div className="portal-command-heading"><span><BrainCircuit size={15} /> AI ASSISTANT / FIND & EXPLORE</span><small>{command.length} / 200</small></div><form onSubmit={(event) => submit(event)}><Search size={18} aria-hidden="true" /><input value={command} onChange={(event) => setCommand(event.target.value)} maxLength={200} placeholder="需要时，让 AI 帮你查找内容" aria-label="向站内 AI 助手输入问题" /><button type="submit" data-motion-ripple="true" aria-label="发送给站内 AI 助手"><ArrowRight size={18} /></button></form><div className="portal-command-actions"><button type="button" onClick={() => submit({ preventDefault: () => undefined } as React.FormEvent<HTMLFormElement>, true)}>搜索全部内容</button><span>可以直接搜索，也可以带着问题进入对话</span></div><div className="portal-command-examples" aria-label="辅助问题示例">{commandExamples.slice(0, 3).map((example) => <button type="button" key={example} onClick={() => setCommand(example)}>{example}</button>)}</div></div>;
}

type Particle = { x: number; y: number; vx: number; vy: number; r: number; a: number; c: number[] };

function NeuralParticles() {
  const { ref: canvasRef, isMotionActive, motionProfile } = useMotionActivity<HTMLCanvasElement>(
    '120px 0px',
    { cost: 'high', priority: 20 },
  );
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
    let targetCount = 72;
    const burstAllowance = motionProfile.mobile ? 8 : 24;
    const makeParticle = (x = Math.random() * width, y = Math.random() * height, burst = false): Particle => {
      const angle = Math.random() * Math.PI * 2;
      const speed = burst ? .45 + Math.random() * 1.1 : .08 + Math.random() * .22;
      return { x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, r: .8 + Math.random() * (burst ? 2.7 : 1.7), a: .35 + Math.random() * .55, c: colors[Math.floor(Math.random() * colors.length)] };
    };
    const resize = () => {
      const rect = hero.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const ratio = Math.min(devicePixelRatio || 1, motionProfile.pixelRatioCap);
      canvas.width = Math.round(width * ratio);
      canvas.height = Math.round(height * ratio);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      targetCount = Math.max(18, Math.round(72 * motionProfile.particleScale));
      while (particlesRef.current.length < targetCount) particlesRef.current.push(makeParticle());
      if (particlesRef.current.length > targetCount + burstAllowance) particlesRef.current.length = targetCount + burstAllowance;
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
      if (particlesRef.current.length > targetCount + burstAllowance) particlesRef.current.splice(0, particlesRef.current.length - targetCount - burstAllowance);
      canvas.dataset.particleCount = String(particlesRef.current.length);
    };
    const observer = new ResizeObserver(resize); observer.observe(hero); resize(); draw();
    hero.addEventListener('pointermove', move, { passive: true }); hero.addEventListener('pointerleave', leave); hero.addEventListener('pointerdown', burst);
    canvas.dataset.particleCount = String(particlesRef.current.length);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); hero.removeEventListener('pointerdown', burst); };
  }, [canvasRef, isMotionActive, motionProfile.mobile, motionProfile.particleScale, motionProfile.pixelRatioCap]);
  return <canvas ref={canvasRef} className="portal-particles" data-motion-kind="ambient" data-motion-running={isMotionActive ? 'true' : 'false'} data-motion-static={motionProfile.quality === 'static' || motionProfile.reducedMotion ? 'true' : 'false'} aria-hidden="true" />;
}

export default function Portal() {
  const [slide, setSlide] = useState(0);
  const [carouselHovered, setCarouselHovered] = useState(false);
  const [carouselFocused, setCarouselFocused] = useState(false);
  const [timerReset, setTimerReset] = useState(0);
  const [lastViewed] = useState(() => (typeof window === 'undefined' ? null : readLastViewed()));
  const { ref: carouselRef, isMotionActive: carouselMotionActive } = useMotionActivity<HTMLDivElement>('240px 0px');
  const carouselPaused = carouselHovered || carouselFocused || !carouselMotionActive;
  const nextSlide = slides[(slide + 1) % slides.length];

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

  const lastViewedTarget = lastViewed?.path ?? '/world';
  const lastViewedDescription = lastViewed ? `回到：${lastViewed.label}` : '还没有记录，从世界观开始';

  return (
    <div className="portal-aurora">
      <section className="portal-hero" data-motion-loop data-motion-kind="ambient">
        <div className="portal-hero-bg" />
        <div className="portal-hero-refraction" aria-hidden="true" />
        <NeuralParticles />
        <p className="portal-particle-hint">✦ 移动指针唤醒星尘 · 点击生成新粒子</p>
        <div className="portal-hero-grid">
          <div className="portal-hero-copy">
            <p className="portal-kicker"><span>01</span> AURORA ATLAS / 由意识编织</p>
            <h1><span>NEURAL</span><span>CONNECTION</span></h1>
            <p className="portal-lead">一个由意识编织的<br />数字宇宙</p>
            <nav className="portal-primary-paths" aria-label="咪呀空间入口">
              <Link to="/miia" className="portal-primary-path portal-primary-path--miia" data-motion-ripple="true">
                <Sparkles aria-hidden="true" /><span><small>MIIA / INNER SPACE</small><strong>咪呀空间</strong><em>从内心独白、数学遐想与诗歌碎片，进入咪呀的空间。</em></span><ArrowRight aria-hidden="true" />
              </Link>
            </nav>
          </div>
          <aside className="portal-miia">
            <div className="portal-miia-head"><span>TRANSMISSION / 2017</span><span>▮▮▮</span></div>
            <blockquote>こんにちは～わたしは∫₀¹[(1+⌊1/x⌋)/Γ(⌊1/x⌋)+1]d(2x)のふたねんせいです</blockquote>
            <p>ただみてほしいそんであいしてほしい</p>
            <div><strong>积分结果 = 2e</strong><span>你好～我是 ∫₀¹[...]d(2x) 的二年级生<br />只想被你看见然后被爱</span></div>
          </aside>
          <div className="portal-stats"><div><span>WORLD POPULATION</span><strong>1,207,963,268</strong></div><div><span>AVERAGE LIFESPAN</span><strong>74y 6m 24d</strong></div><div><span>CREATOR</span><strong>nyaumæ</strong></div></div>
        </div>
      </section>

      <section className="portal-section portal-activity-section" aria-labelledby="portal-activity-title">
        <div className="portal-section-head"><div><p>01 / FIRST CONNECTION</p><h2 id="portal-activity-title">从这里继续</h2></div><span>回到上次停下的地方，或从世界观、故事与角色开启新的旅程。</span></div>
        <div className="portal-activity-grid">
          <Link to={lastViewedTarget} className="portal-activity-card portal-activity-resume"><History /><span><small>CONTINUE / LAST VIEWED</small><strong>上次在看</strong><em>{lastViewedDescription}</em></span><ArrowRight /></Link>
          <Link to="/world" className="portal-activity-card portal-activity-world"><Globe2 /><span><small>WORLD LORE / CANON</small><strong>世界观</strong><em>从地点、规则、组织和时间线，找到这座世界的坐标。</em></span><ArrowRight /></Link>
          <Link to="/stories" className="portal-activity-card portal-activity-story"><BookOpen /><span><small>STORY DIRECTORY / READ</small><strong>故事</strong><em>打开故事目录，选择一个宇宙和一段章节开始阅读。</em></span><ArrowRight /></Link>
          <Link to="/characters" className="portal-activity-card portal-activity-character"><Users /><span><small>CHARACTER NETWORK / MEET</small><strong>角色</strong><em>从人物档案、阵营和关系网，认识每一次相遇。</em></span><ArrowRight /></Link>
        </div>
      </section>

      <section className="portal-section portal-visions">
        <div className="portal-section-head"><div><p>02 / VISUAL ARCHIVE</p><h2>世界的六个切面</h2></div><span>在时间、角色与规则之间，图像是通往宇宙的第一道门。</span></div>
        <figure className="portal-overview">
          <ResponsiveImage
            src="/2-generated.png"
            alt="夕阳与星空下的星界馆，五个身影在环形图书馆中阅读、学习与交流"
            widths={PORTAL_IMAGE_WIDTHS}
            sizes="(max-width: 640px) calc(100vw - 32px), 1180px"
            loading="lazy"
          />
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
            <ResponsiveImage
              key={slides[slide].src}
              src={slides[slide].src}
              alt={slides[slide].alt}
              widths={PORTAL_IMAGE_WIDTHS}
              sizes="(max-width: 640px) calc(100vw - 32px), 1180px"
              loading="lazy"
              className="portal-carousel-main"
            />
            {carouselMotionActive && (
              <ResponsiveImage
                key={`preload-${nextSlide.src}`}
                src={nextSlide.src}
                alt=""
                widths={PORTAL_IMAGE_WIDTHS}
                sizes="(max-width: 640px) calc(100vw - 32px), 1180px"
                loading="eager"
                fetchPriority="low"
                pictureClassName="portal-carousel-preload"
                aria-hidden="true"
              />
            )}
            <div className="portal-carousel-shade" />
            <div className="portal-caption" aria-live="polite"><p>VISUAL ARCHIVE {String(slide + 1).padStart(2, '0')}</p><h3>{slides[slide].title}</h3><div className="portal-slide-meta"><span>{slideMetadata[slide].location}</span><span>{slideMetadata[slide].time}</span><span>{slideMetadata[slide].region}</span></div></div>
            <div className="portal-count"><strong>{String(slide + 1).padStart(2, '0')}</strong><span>/ 06</span></div>
            <button type="button" className="portal-arrow portal-prev" data-motion-click="none" onClick={() => go(slide - 1)} aria-controls="portal-archive-slide" aria-label={`上一张：${slides[(slide - 1 + slides.length) % slides.length].title}`}><ArrowLeft aria-hidden="true" /></button>
            <button type="button" className="portal-arrow portal-next" data-motion-click="none" onClick={() => go(slide + 1)} aria-controls="portal-archive-slide" aria-label={`下一张：${slides[(slide + 1) % slides.length].title}`}><ArrowRight aria-hidden="true" /></button>
          </div>
          <div className="portal-thumbs" role="group" aria-label="选择视觉档案">{slides.map((item, index) => <button key={item.src} type="button" className={index === slide ? 'active' : ''} onClick={() => go(index)} aria-label={`查看第 ${index + 1} 张：${item.alt}`} aria-controls="portal-archive-slide" aria-pressed={index === slide} aria-current={index === slide ? 'true' : undefined}><ResponsiveImage src={item.src} alt="" widths={THUMBNAIL_IMAGE_WIDTHS} sizes="(max-width: 640px) 30vw, 180px" loading="lazy" /><span>{String(index + 1).padStart(2, '0')}</span></button>)}</div>
          <span className="portal-carousel-status" aria-live="polite">{carouselPaused ? '自动轮播已暂停' : '自动轮播播放中'}</span>
        </div>
      </section>

      <section className="portal-section portal-worlds" aria-labelledby="portal-directory-title">
        <div className="portal-section-head"><div><p>03 / COMPLETE DIRECTORY</p><h2 id="portal-directory-title">完整目录</h2></div><span>从故事、角色和世界观，到数学、游戏与对话，所有内容入口都汇集在这里。</span></div>
        <div className="portal-entry-grid portal-system-grid">
          {NAVIGATION_GROUPS.map((group, index) => {
            const Icon = directoryIconMap[group.id];
            return <Link to={group.root} key={group.id} className={`portal-entry portal-entry-${group.id}`} style={{ '--card': directoryAccentMap[group.id] } as React.CSSProperties}>
              <div className="portal-entry-top"><span>{String(index + 1).padStart(2, '0')}</span><span>{group.caption}</span></div>
              <div className="portal-entry-title"><Icon /><div><p>SPACE / {group.caption}</p><h3>{group.label}</h3></div></div>
              <p>{group.description}</p>
              <div className="portal-entry-link"><span>进入{group.label}</span><span>↗</span></div>
            </Link>;
          })}
        </div>
      </section>

      <section className="portal-section portal-support-section" aria-labelledby="portal-support-title">
        <div className="portal-section-head"><div><p>04 / SITE TOOL</p><h2 id="portal-support-title">需要时，问一次就好</h2></div><span>输入想找的人物、故事或设定，AI 会带着站内来源一起回答。</span></div>
        <div className="portal-support-layout portal-support-layout--single">
          <NeuralCommandConsole />
        </div>
      </section>

      <section className="portal-closing"><p>“世界不是一座孤岛。”</p><span>角色、世界与游戏，沿着神经连接彼此感应，让每一次相遇成为新的回响。</span></section>
    </div>
  );
}
