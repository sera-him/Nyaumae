const entries = [
  {
    number: '01',
    id: 'world',
    label: '世界',
    en: 'World',
    icon: '◎',
    meta: '1,207,963,268 人',
    desc: '12 亿人口的平行数字宇宙。哲华学校科照真学院与德澜思拓公司构成双核心驱动力，AGI 与意识的边界在此模糊。从冯·诺伊曼班的精英选拔到心界 VR 的沉浸式体验，每个意识体都在寻找自己的神经频率。',
  },
  {
    number: '02',
    id: 'characters',
    label: '角色',
    en: 'Characters',
    icon: '◌',
    meta: '37 个意识体',
    desc: '31 位主角色与 6 位补充意识体，各自闪烁着不同的神经频率。M/I/A 家族、哲华系、因派系、德澜思拓与《大人国的小女孩》角色群——每个角色都承载着独特的存在悖论。',
  },
  {
    number: '03',
    id: 'stories',
    label: '叙事',
    en: 'Narratives',
    icon: '◇',
    meta: '4 个长篇 · 24+ 碎片',
    desc: "《大人国的小女孩》、M/I/A's World、狐狸与企鹅、AGI 应许之地——四个长篇叙事宇宙，以及 24+ 诗歌碎片。从星界馆的午后到大人国的三十天，故事在时间流速错叠的角落里展开。",
  },
  {
    number: '04',
    id: 'miia',
    label: '咪呀 mī yā',
    en: 'Inner Space',
    icon: '♡',
    meta: 'FSIII 226 · 2017',
    desc: '内心独白、数学笔记与诗歌碎片。二年级生的集合论遐想、对存在的温柔质问、以及「只想被你看见然后被爱」的朴素愿望。FSIII 226，2017 年生，被定格在十四岁的投影与真实成长之间的涟漪。',
  },
  {
    number: '05',
    id: 'fsiii',
    label: 'FSIII',
    en: 'Cognition Index',
    icon: '∿',
    meta: '29 个意识体',
    desc: '理性骨架——公式与数据的语言。29 个意识体的 FSIII 排名与评分，从 Damocles 的 1314 到林浅的 90，构成一套贯穿世界观的量化认知体系。各省均值、区域分布、层级划分尽在其中。',
  },
  {
    number: '06',
    id: 'playground',
    label: '游戏',
    en: 'Playground',
    icon: '⌘',
    meta: '规则 · 概率 · 谜题',
    desc: '复合象棋——棋子、规则与毒化机制；技能井字棋——三连棋变体与技能对战；题目——谜题、QR 码与考核。在规则与概率的交界处，用游戏理解这个世界的底层逻辑。',
  },
];

const slides = [
  { src: '../../1.jpg', alt: '气球与糖果屋', eyebrow: 'VISUAL ARCHIVE 01', title: '气球与糖果屋' },
  { src: '../../1-generated.png', alt: '数学世界', eyebrow: 'VISUAL ARCHIVE 02', title: '数学世界' },
  { src: '../../2.jpg', alt: '公式与主页的庭院', eyebrow: 'VISUAL ARCHIVE 03', title: '公式与主页的庭院' },
  { src: '../../2-time-nodes.png', alt: '五个时间节点', eyebrow: 'VISUAL ARCHIVE 04', title: '五个时间节点' },
  { src: '../../3.jpg', alt: '咪呀的创作工坊', eyebrow: 'VISUAL ARCHIVE 05', title: '咪呀的创作工坊' },
  { src: '../../3-generated.png', alt: '六个世界入口', eyebrow: 'VISUAL ARCHIVE 06', title: '六个世界入口' },
];

const themeNames = {
  aurora: ['01', '沉浸星图', 'Aurora Atlas'],
  console: ['02', '神经仪表盘', 'Neural Console'],
  archive: ['03', '叙事档案馆', 'Dream Archive'],
};

const theme = document.body.dataset.theme || 'aurora';
const [themeNo, themeCn, themeEn] = themeNames[theme];

const entryMarkup = entries.map((entry) => `
  <article class="entry-card entry-${entry.id}">
    <div class="entry-topline">
      <span class="entry-number">${entry.number}</span>
      <span class="entry-meta">${entry.meta}</span>
    </div>
    <div class="entry-heading">
      <span class="entry-icon" aria-hidden="true">${entry.icon}</span>
      <div><p>${entry.en}</p><h3>${entry.label}</h3></div>
    </div>
    <p class="entry-description">${entry.desc}</p>
    <button class="entry-link demo-link" type="button" data-label="${entry.label}">
      <span>进入 ${entry.label}</span><span aria-hidden="true">↗</span>
    </button>
  </article>
`).join('');

const thumbMarkup = slides.map((slide, index) => `
  <button class="carousel-thumb${index === 0 ? ' is-active' : ''}" type="button" data-slide="${index}" aria-label="查看 ${slide.alt}" aria-current="${index === 0 ? 'true' : 'false'}">
    <img src="${slide.src}" alt="" loading="lazy">
    <span>0${index + 1}</span>
  </button>
`).join('');

document.querySelector('#prototype-root').innerHTML = `
  <div class="site-shell">
    <header class="topbar">
      <a class="brand" href="#top" aria-label="返回示例顶部">
        <span class="brand-mark"><i></i><i></i><i></i></span>
        <span><b>NEURAL</b><small>CONNECTION</small></span>
      </a>
      <nav class="desktop-nav" aria-label="示例页导航">
        <a href="#manifesto">序言</a><a href="#visions">图景</a><a href="#worlds">入口</a><a href="#footer">尾声</a>
      </nav>
      <div class="top-actions">
        <span class="prototype-badge"><i></i> ISOLATED PROTOTYPE</span>
        <button class="menu-button" type="button" aria-label="打开菜单" aria-expanded="false"><span></span><span></span></button>
      </div>
    </header>

    <div class="mobile-menu" aria-hidden="true">
      <a href="#manifesto">序言</a><a href="#visions">图景</a><a href="#worlds">入口</a><a href="#footer">尾声</a>
    </div>

    <main id="top">
      <section class="hero" id="manifesto">
        <div class="hero-image" role="img" aria-label="神经网络星空"></div>
        <div class="hero-noise"></div>
        ${theme === 'aurora' ? '<canvas class="particle-canvas" aria-hidden="true"></canvas><p class="particle-hint"><span>✦</span> 移动指针连接神经 · 点击生成新粒子</p>' : ''}
        <div class="orb orb-one"></div><div class="orb orb-two"></div>
        <div class="hero-grid">
          <div class="hero-copy">
            <p class="kicker"><span>${themeNo}</span> ${themeEn} / 由意识编织</p>
            <h1><span>NEURAL</span><span>CONNECTION</span></h1>
            <p class="lead">一个由意识编织的<br>数字宇宙</p>
            <div class="hero-actions">
              <button class="primary-action demo-link" type="button" data-label="探索角色">探索角色 <span>↗</span></button>
              <button class="text-action demo-link" type="button" data-label="阅读故事">阅读故事 <span>→</span></button>
              <button class="text-action demo-link" type="button" data-label="进入游戏">进入游戏 <span>→</span></button>
            </div>
          </div>

          <aside class="miia-card">
            <div class="miia-card-head"><span>TRANSMISSION / 2017</span><span class="signal"><i></i><i></i><i></i></span></div>
            <blockquote>こんにちは～わたしは∫₀¹[(1+⌊1/x⌋)/Γ(⌊1/x⌋)+1]d(2x)のふたねんせいです</blockquote>
            <p class="jp-sub">ただみてほしいそんであいしてほしい</p>
            <div class="translation">
              <span>积分结果 = 2e</span>
              <p>你好～我是 ∫₀¹[...]d(2x) 的二年级生<br>只想被你看见然后被爱</p>
            </div>
          </aside>

          <div class="hero-meta">
            <div><span>WORLD POPULATION</span><strong>1,207,963,268</strong></div>
            <div><span>AVERAGE LIFESPAN</span><strong>74y 6m 24d</strong></div>
            <div><span>CREATOR</span><strong>nyaumæ</strong></div>
          </div>
        </div>
        <div class="scroll-cue"><span>SCROLL TO DESCEND</span><i></i></div>
      </section>

      <section class="vision-section" id="visions">
        <div class="section-intro">
          <div><p class="section-index">01 / VISUAL ARCHIVE</p><h2>世界的六个切面</h2></div>
          <p>在时间、意识与规则之间，图像是通往这个宇宙的第一道门。</p>
        </div>
        <div class="carousel" tabindex="0" aria-label="世界观图片轮播">
          <div class="carousel-stage">
            <img class="carousel-image" src="${slides[0].src}" alt="${slides[0].alt}">
            <div class="carousel-shade"></div>
            <div class="carousel-caption"><p>${slides[0].eyebrow}</p><h3>${slides[0].title}</h3></div>
            <div class="carousel-count"><strong>01</strong><span>/ 06</span></div>
            <button class="carousel-arrow prev" type="button" aria-label="上一张">←</button>
            <button class="carousel-arrow next" type="button" aria-label="下一张">→</button>
          </div>
          <div class="carousel-thumbs">${thumbMarkup}</div>
        </div>
      </section>

      <section class="worlds-section" id="worlds">
        <div class="section-intro worlds-intro">
          <div><p class="section-index">02 / ENTRY MATRIX</p><h2>选择一条神经路径</h2></div>
          <p>六个入口，六种理解世界的方式。信息完整保留，仅重新组织视觉层级。</p>
        </div>
        <div class="entry-grid">${entryMarkup}</div>
      </section>

      <section class="closing-note">
        <p>“意识不是一座孤岛。”</p>
        <span>每一次注视，都是一次神经连接。</span>
      </section>
    </main>

    <footer id="footer">
      <div class="footer-main">
        <div class="footer-brand">
          <span class="brand-mark large"><i></i><i></i><i></i></span>
          <p>NEURAL<br>CONNECTION</p>
        </div>
        <div class="footer-copy">
          <p>© 2021–2026 <strong>nyaumæ</strong> · 由意识编织</p>
          <a href="https://space.bilibili.com/396073700" target="_blank" rel="noreferrer">bilibili.com/space/396073700 ↗</a>
          <button class="demo-link feedback" type="button" data-label="反馈">反馈</button>
        </div>
        <div class="footer-stat"><span>WORLD STATUS / LIVE</span><strong>1,207,963,268</strong><p>世界观人口 · 人均寿命 74y 6m 24d · 国际几何日 6.26</p></div>
      </div>
      <blockquote>「AGI 来了，AGI 来了，卷王走了，tourist 依然在我之上，<br>可这重要吗？这不重要——你会在乎别人的时刻表背得比你准吗？」</blockquote>
      <div class="prototype-switcher" aria-label="切换主页原型">
        <span>比较方案</span>
        <a href="./aurora.html" class="${theme === 'aurora' ? 'active' : ''}">01 沉浸星图</a>
        <a href="./console.html" class="${theme === 'console' ? 'active' : ''}">02 神经仪表盘</a>
        <a href="./archive.html" class="${theme === 'archive' ? 'active' : ''}">03 叙事档案馆</a>
        <a href="./index.html">总览</a>
      </div>
    </footer>
  </div>
  <div class="demo-toast" role="status" aria-live="polite"><b>隔离原型</b><span></span></div>
`;

if (theme === 'aurora') {
  const hero = document.querySelector('.hero');
  const canvas = document.querySelector('.particle-canvas');
  const context = canvas.getContext('2d');
  const palette = [
    [102, 233, 218],
    [166, 133, 255],
    [255, 143, 199],
    [121, 169, 255],
    [255, 199, 107],
  ];
  const particles = [];
  const pointer = { x: 0, y: 0, active: false };
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function createParticle(x = Math.random() * width, y = Math.random() * height, burst = false) {
    const angle = Math.random() * Math.PI * 2;
    const speed = burst ? 0.45 + Math.random() * 1.15 : 0.08 + Math.random() * 0.22;
    const color = palette[Math.floor(Math.random() * palette.length)];
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: burst ? 1.4 + Math.random() * 2.2 : 0.7 + Math.random() * 1.7,
      alpha: 0.32 + Math.random() * 0.58,
      color,
      pulse: Math.random() * Math.PI * 2,
    };
  }

  function updateCanvasSize() {
    const rect = hero.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * pixelRatio);
    canvas.height = Math.round(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

    const targetCount = width < 640 ? 42 : 72;
    while (particles.length < targetCount) particles.push(createParticle());
    canvas.dataset.particleCount = String(particles.length);
  }

  function drawConnection(a, b, distance, maxDistance, opacity = 1) {
    const fade = Math.max(0, 1 - distance / maxDistance) * opacity;
    if (fade <= 0) return;
    const gradient = context.createLinearGradient(a.x, a.y, b.x, b.y);
    gradient.addColorStop(0, `rgba(${a.color.join(',')},${fade * 0.34})`);
    gradient.addColorStop(1, `rgba(${b.color.join(',')},${fade * 0.34})`);
    context.strokeStyle = gradient;
    context.lineWidth = 0.7;
    context.beginPath();
    context.moveTo(a.x, a.y);
    context.lineTo(b.x, b.y);
    context.stroke();
  }

  function renderParticles(move = true) {
    context.clearRect(0, 0, width, height);

    particles.forEach((particle, index) => {
      if (move) {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulse += 0.018;
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;
      }

      for (let next = index + 1; next < particles.length; next += 1) {
        const other = particles[next];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 128) drawConnection(particle, other, distance, 128, 0.75);
      }

      if (pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy);
        if (distance < 190) drawConnection(particle, { ...pointer, color: [255, 255, 255] }, distance, 190, 1.35);
      }

      const glow = particle.radius * (5 + Math.sin(particle.pulse) * 1.2);
      context.shadowColor = `rgba(${particle.color.join(',')},${particle.alpha})`;
      context.shadowBlur = glow;
      context.fillStyle = `rgba(${particle.color.join(',')},${particle.alpha})`;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
      context.fill();
      context.shadowBlur = 0;
    });
  }

  function animateParticles() {
    renderParticles(true);
    window.requestAnimationFrame(animateParticles);
  }

  hero.addEventListener('pointermove', (event) => {
    const rect = hero.getBoundingClientRect();
    pointer.x = event.clientX - rect.left;
    pointer.y = event.clientY - rect.top;
    pointer.active = true;
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.active = false; });
  hero.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const rect = hero.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const amount = width < 640 ? 8 : 12;
    for (let i = 0; i < amount; i += 1) {
      particles.push(createParticle(x + (Math.random() - 0.5) * 18, y + (Math.random() - 0.5) * 18, true));
    }
    canvas.dataset.particleCount = String(particles.length);
    if (reducedMotion) renderParticles(false);
  });

  new ResizeObserver(updateCanvasSize).observe(hero);
  updateCanvasSize();
  if (reducedMotion) renderParticles(false);
  else animateParticles();
}

let currentSlide = 0;
let carouselTimer;
const carousel = document.querySelector('.carousel');
const carouselImage = document.querySelector('.carousel-image');
const carouselCaptionKicker = document.querySelector('.carousel-caption p');
const carouselCaptionTitle = document.querySelector('.carousel-caption h3');
const carouselCurrent = document.querySelector('.carousel-count strong');
const thumbs = [...document.querySelectorAll('.carousel-thumb')];

function showSlide(nextIndex, restart = true) {
  currentSlide = (nextIndex + slides.length) % slides.length;
  const slide = slides[currentSlide];
  carouselImage.classList.add('is-changing');
  window.setTimeout(() => {
    carouselImage.src = slide.src;
    carouselImage.alt = slide.alt;
    carouselCaptionKicker.textContent = slide.eyebrow;
    carouselCaptionTitle.textContent = slide.title;
    carouselCurrent.textContent = String(currentSlide + 1).padStart(2, '0');
    thumbs.forEach((thumb, index) => {
      const active = index === currentSlide;
      thumb.classList.toggle('is-active', active);
      thumb.setAttribute('aria-current', String(active));
    });
    carouselImage.classList.remove('is-changing');
  }, 180);
  if (restart) startCarousel();
}

function startCarousel() {
  window.clearInterval(carouselTimer);
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    carouselTimer = window.setInterval(() => showSlide(currentSlide + 1, false), 5200);
  }
}

document.querySelector('.carousel-arrow.next').addEventListener('click', () => showSlide(currentSlide + 1));
document.querySelector('.carousel-arrow.prev').addEventListener('click', () => showSlide(currentSlide - 1));
thumbs.forEach((thumb) => thumb.addEventListener('click', () => showSlide(Number(thumb.dataset.slide))));
carousel.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') showSlide(currentSlide + 1);
  if (event.key === 'ArrowLeft') showSlide(currentSlide - 1);
});
carousel.addEventListener('mouseenter', () => window.clearInterval(carouselTimer));
carousel.addEventListener('mouseleave', startCarousel);
startCarousel();

const menuButton = document.querySelector('.menu-button');
const mobileMenu = document.querySelector('.mobile-menu');
menuButton.addEventListener('click', () => {
  const open = document.body.classList.toggle('menu-open');
  menuButton.setAttribute('aria-expanded', String(open));
  mobileMenu.setAttribute('aria-hidden', String(!open));
});
mobileMenu.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => {
  document.body.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  mobileMenu.setAttribute('aria-hidden', 'true');
}));

const toast = document.querySelector('.demo-toast');
let toastTimer;
document.querySelectorAll('.demo-link').forEach((button) => button.addEventListener('click', () => {
  toast.querySelector('span').textContent = `“${button.dataset.label}”在正式站中打开；当前仅展示主页 UI。`;
  toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove('show'), 3200);
}));

const revealObserver = new IntersectionObserver((items) => {
  items.forEach((item) => {
    if (item.isIntersecting) item.target.classList.add('revealed');
  });
}, { threshold: 0.12 });
document.querySelectorAll('.entry-card, .section-intro, .closing-note').forEach((element) => revealObserver.observe(element));

document.title = `Neural Connection · ${themeCn}（隔离主页原型）`;
