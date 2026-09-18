import { BlockMath } from 'react-katex';
import { L } from '@/lib/translations/manual';

import {
  ArrowDown,
  BadgeCheck,
  Building2,
  Check,
  Dice5,
  Equal,
  Eye,
  FileCheck2,
  Landmark,
  Leaf,
  LockKeyhole,
  MapPinned,
  Scale,
  ShieldCheck,
  TimerReset,
} from 'lucide-react';
import {
  LAND_ALLOCATION_CHAPTERS,
  LAND_ALLOCATION_META,
  LAND_ALLOCATION_PILLARS,
  LAND_ALLOCATION_STEPS,
  type LandPolicyBlock,
} from '@/data/landAllocationPolicy';
import 'katex/dist/katex.min.css';
import './LandAllocationPolicy.css';

const pillarIcons = [Equal, MapPinned, BadgeCheck];
const stepIcons = [MapPinned, Scale, LockKeyhole, Eye];
const chapterIcons = [Landmark, Dice5, ShieldCheck, TimerReset, FileCheck2, Scale];

function scrollToSection(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

function PolicyBlock({ block, sectionTitle }: { block: LandPolicyBlock; sectionTitle: string }) {
  if (block.type === 'paragraph') {
    return <p className="land-policy-paragraph">{block.text}</p>;
  }

  if (block.type === 'bullets') {
    return (
      <ul className="land-policy-list">
        {block.items.map((item) => (
          <li key={item}><Check aria-hidden="true" /><span>{item}</span></li>
        ))}
      </ul>
    );
  }

  if (block.type === 'formula') {
    return (
      <figure className="land-policy-formula">
        <div className="land-policy-formula-scroll"><BlockMath math={block.math} /></div>
        {block.caption && <figcaption>{block.caption}</figcaption>}
      </figure>
    );
  }

  if (block.type === 'table') {
    return (
      <div className="land-policy-table-wrap">
        <table className="land-policy-table">
          <caption className="sr-only">{sectionTitle}</caption>
          <thead><tr>{block.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead>
          <tbody>
            {block.rows.map((row) => (
              <tr key={row.join('-')}><th scope="row">{row[0]}</th><td>{row[1]}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="land-policy-choices">
      {block.items.map((item) => (
        <div className="land-policy-choice" key={`${item.label}-${item.text}`}>
          <span>{item.label}</span><p>{item.text}</p>
        </div>
      ))}
    </div>
  );
}

export default function LandAllocationPolicy({ embedded = false }: { embedded?: boolean }) {
  return (
    <section id="land-allocation-policy" className={`land-policy${embedded ? ' land-policy-embedded' : ''}`} aria-labelledby="land-policy-title">
      <header className="land-policy-hero">
        <div className="land-policy-hero-copy">
          <div className="land-policy-status"><span>{L("制度档案")}</span><i aria-hidden="true" />{LAND_ALLOCATION_META.edition}</div>
          <h2 id="land-policy-title">{LAND_ALLOCATION_META.title}</h2>
          <p className="land-policy-intro">{LAND_ALLOCATION_META.summary}</p>
          <div className="land-policy-tags" aria-label={L("制度的三项核心特征")}>
            <span><Equal aria-hidden="true" />{L("等额权重")}</span>
            <span><MapPinned aria-hidden="true" />{L("自主选地")}</span>
            <span><Dice5 aria-hidden="true" />{L("公开随机")}</span>
          </div>
          <button className="land-policy-read-button" type="button" onClick={() => scrollToSection('land-policy-reading')}>
            {L("阅读完整制度")}<ArrowDown aria-hidden="true" />
          </button>
        </div>

        <aside className="land-policy-index-card" aria-label={L("制度档案摘要")}>
          <p>LAND / ALLOCATION</p>
          <div><strong>22</strong><span>{L("项完整规则")}</span></div>
          <div><strong>02</strong><span>{L("条核心公式")}</span></div>
          <div><strong>01</strong><span>{L("份平等权重")}</span></div>
          <small>PUBLIC · VERIFIABLE · NON-TRADABLE</small>
        </aside>
      </header>

      <div className="land-policy-note" role="note">
        <ShieldCheck aria-hidden="true" />
        <div><strong>{L("阅读说明")}</strong><p>{LAND_ALLOCATION_META.disclaimer}</p></div>
      </div>

      <section className="land-policy-overview" aria-labelledby="land-policy-overview-title">
        <div className="land-policy-section-heading">
          <p>WHY IT IS FAIR</p>
          <h3 id="land-policy-overview-title">{L("公平不来自统一安排，而来自同样的选择能力")}</h3>
        </div>
        <div className="land-policy-pillar-grid">
          {LAND_ALLOCATION_PILLARS.map((pillar, index) => {
            const Icon = pillarIcons[index];
            return (
              <article key={pillar.title}>
                <Icon aria-hidden="true" />
                <span>0{index + 1}</span>
                <h4>{pillar.title}</h4>
                <p>{pillar.text}</p>
              </article>
            );
          })}
        </div>
      </section>

      <section className="land-policy-flow" aria-labelledby="land-policy-flow-title">
        <div className="land-policy-section-heading">
          <p>ONE ROUND</p>
          <h3 id="land-policy-flow-title">{L("一轮分配，四个公开步骤")}</h3>
        </div>
        <ol>
          {LAND_ALLOCATION_STEPS.map((step, index) => {
            const Icon = stepIcons[index];
            return (
              <li key={step.title}>
                <div><Icon aria-hidden="true" /><span>{index + 1}</span></div>
                <h4>{step.title}</h4>
                <p>{step.text}</p>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="land-policy-equations" aria-labelledby="land-policy-equations-title">
        <div className="land-policy-section-heading">
          <p>THE TWO RULES</p>
          <h3 id="land-policy-equations-title">{L("整套制度的数学核心")}</h3>
        </div>
        <div className="land-policy-equation-grid">
          <article>
            <span>{L("总量约束")}</span>
            <div><BlockMath math="\\sum_i w_i\\le 1" /></div>
            <p>{L("每个人拥有有限且相同的总权重。")}</p>
          </article>
          <article>
            <span>{L("相对概率")}</span>
            <div><BlockMath math="P(i\\mid L)=\\frac{w_{i,L}}{\\sum_j w_{j,L}}" /></div>
            <p>{L("同一地块按照各申请者投入的相对权重随机分配。")}</p>
          </article>
        </div>
      </section>

      <div id="land-policy-reading" className="land-policy-reading" tabIndex={-1}>
        <aside className="land-policy-toc">
          <p>{L("完整制度")}</p>
          <strong>{L("6 个主题 · 22 项规则")}</strong>
          <nav aria-label={L("制度正文主题")}>
            {LAND_ALLOCATION_CHAPTERS.map((chapter, index) => {
              const Icon = chapterIcons[index];
              return (
                <button key={chapter.id} type="button" onClick={() => scrollToSection(`land-policy-chapter-${chapter.id}`)}>
                  <Icon aria-hidden="true" /><span><small>{chapter.number}</small>{chapter.title}</span>
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="land-policy-document">
          {LAND_ALLOCATION_CHAPTERS.map((chapter, chapterIndex) => {
            const ChapterIcon = chapterIcons[chapterIndex];
            return (
              <section className="land-policy-chapter" key={chapter.id} aria-labelledby={`land-policy-chapter-${chapter.id}`}>
                <header>
                  <div><ChapterIcon aria-hidden="true" /></div>
                  <p>CHAPTER {chapter.number}</p>
                  <h3 id={`land-policy-chapter-${chapter.id}`} tabIndex={-1}>{chapter.title}</h3>
                  <span>{chapter.summary}</span>
                </header>

                <div className="land-policy-rules">
                  {chapter.sections.map((section) => (
                    <article id={`land-policy-rule-${section.number}`} className="land-policy-rule" key={section.id}>
                      <div className="land-policy-rule-heading">
                        <span>{String(section.number).padStart(2, '0')}</span>
                        <div><h4>{section.title}</h4><p>{section.lead}</p></div>
                      </div>
                      <div className="land-policy-rule-body">
                        {section.blocks.map((block, blockIndex) => (
                          <PolicyBlock key={`${section.id}-${block.type}-${blockIndex}`} block={block} sectionTitle={section.title} />
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            );
          })}

          <blockquote className="land-policy-conclusion">
            <Scale aria-hidden="true" />
            <p>{LAND_ALLOCATION_META.conclusion}</p>
            <footer>{L("公平随机土地分配制度 · 一句话版本")}</footer>
          </blockquote>

          <div className="land-policy-rights-note">
            <Building2 aria-hidden="true" /><p>{LAND_ALLOCATION_META.rightsNote}</p><Leaf aria-hidden="true" />
          </div>
        </div>
      </div>
    </section>
  );
}
