import { useState } from 'react';
import { L } from '@/lib/translations/manual';

import { dictionary as dictionaryZh, bilingualText as bilingualTextZh } from '@/data/dictionary';
import { dictionaryEn, bilingualTextEn } from '@/data/dictionary.en';
import {
  mysticSayingNote, mathCoupletNote, lightPunNote, rulesAndCatPoem, catgirlLexicon,
} from '@/data/poems';
import {
  mysticSayingNoteEn, mathCoupletNoteEn, lightPunNoteEn, rulesAndCatPoemEn, catgirlLexiconEn,
} from '@/data/poems.en';
import { getLocale } from '@/lib/i18n';
import { semanticHighlight, posColorHighlight } from '@/lib/semanticHighlight';
import CollapsibleCard from '@/components/CollapsibleCard';
import { Search, BookMarked, Languages, BookOpen } from 'lucide-react';

const letters = ['全部', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'K', 'L', 'M', 'N', 'O', 'P', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'];

const tagColors: Record<string, string> = {
  '基础': 'bg-cyan-500/12 text-cyan-400 border-cyan-500/20',
  '称谓': 'bg-violet-500/12 text-violet-400 border-violet-500/20',
  '动作': 'bg-rose-500/12 text-rose-400 border-rose-500/20',
  '情感': 'bg-pink-500/12 text-pink-400 border-pink-500/20',
  '自然': 'bg-green-500/12 text-green-400 border-green-500/20',
  '数学': 'bg-yellow-500/12 text-yellow-400 border-yellow-500/20',
  '抽象': 'bg-gray-500/12 text-gray-400 border-gray-500/20',
  '复合': 'bg-amber-500/12 text-amber-400 border-amber-500/20',
  '特殊': 'bg-purple-500/12 text-purple-400 border-purple-500/20',
};

export default function Dictionary() {
  const _en = getLocale() === 'en';
  const dictionary = _en ? dictionaryEn : dictionaryZh;
  const bilingualText = _en ? bilingualTextEn.map((line) => ({ dadi: line.dadi, chinese: line.english })) : bilingualTextZh;
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('全部');

  const mysticText = _en ? mysticSayingNoteEn : mysticSayingNote;
  const coupletText = _en ? mathCoupletNoteEn : mathCoupletNote;
  const lightPunText = _en ? lightPunNoteEn : lightPunNote;
  const catPoemText = _en ? rulesAndCatPoemEn : rulesAndCatPoem;
  const catgirlList = _en ? catgirlLexiconEn : catgirlLexicon;

  const filtered = dictionary.filter((entry) => {
    const matchesSearch = !search ||
      entry.word.toLowerCase().includes(search.toLowerCase()) ||
      entry.meaning.includes(search);
    const matchesLetter = activeLetter === '全部' || entry.word.toUpperCase().startsWith(activeLetter);
    return matchesSearch && matchesLetter;
  });

  return (
    <section id="dictionary" className="py-24 px-4 sm:px-6 relative">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <Languages className="w-7 h-7 text-[var(--aurora-brand-cyan)]" />
            <h2 className="text-3xl sm:text-4xl font-bold text-[var(--aurora-brand-text)] tracking-wide">
              {semanticHighlight("Dadi Sapichi")}
            </h2>
          </div>
          <p className="text-nc-text text-lg">
            {L("Chinese Dictionary 2.1 · 自创语言对照词典\n          ")}</p>
        </div>

        {/* ===== Dictionary Content (Collapsible, default collapsed) ===== */}
            <CollapsibleCard
          id="dict-main"
          defaultExpanded={false}
          title={<>{L("词汇表 ")}<span className="text-sm font-normal text-nc-text-muted">· {dictionary.length} {L("个词条")}</span></>}
          summary={L("搜索、筛选和浏览全部 Dadi Sapichi 词汇")}
          icon={<Languages className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-[var(--aurora-brand-text)]"
          borderColor="border-[#8B5CF6]/20"
          bgColor="bg-[var(--aurora-brand-bg)]"
        >
          {/* Search */}
          <div className="p-6 pb-0">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nc-text-muted" />
              <input
                type="text"
                placeholder={L("搜索词汇（支持中文、Dadi Sapichi）...")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/15 rounded-xl pl-12 pr-4 py-3 text-[var(--aurora-brand-text)] placeholder:text-nc-text-muted focus:outline-none focus:border-[#00E5CC]/40 transition-colors"
              />
            </div>

            {/* Letter Filter */}
            <div className="flex flex-wrap gap-1.5 mb-6">
              {letters.map((letter) => (
                <button
                  key={letter}
                  onClick={() => setActiveLetter(letter)}
                  className={`px-2.5 py-1 rounded-md text-xs font-mono transition-all ${
                    activeLetter === letter
                      ? 'bg-[var(--aurora-brand-violet)] text-white'
                      : 'bg-[var(--aurora-brand-bg-raised)] text-nc-text-muted hover:text-nc-text'
                  }`}
                >
                  {letter === '全部' ? L(letter) : letter}
                </button>
              ))}
            </div>
          </div>

          {/* Dictionary Grid */}
          <div className="px-6 pb-6">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filtered.map((entry) => (
                <div
                  key={entry.word}
                  id={`dict-${entry.word}`}
                  className="dictionary-entry-motion bg-[var(--aurora-brand-bg)] border border-[#8B5CF6]/10 rounded-lg p-4 hover:border-[#00E5CC]/25 hover:-translate-y-0.5 transition-all duration-200 scroll-mt-[100px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-base font-bold text-[var(--aurora-brand-cyan)]">{entry.word}</span>
                    {entry.tags?.includes('特殊') && (
                      <BookMarked className="w-3.5 h-3.5 text-[var(--aurora-brand-violet)]" />
                    )}
                  </div>
                  <p className="text-sm text-nc-text">{posColorHighlight(entry.meaning, entry.tags?.[0] || '')}</p>
                  {entry.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] border ${tagColors[tag] || 'bg-[var(--aurora-brand-bg-raised)] text-[var(--aurora-brand-muted)]'}`}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </CollapsibleCard>

        {/* ===== Bilingual Example Text (Collapsible) ===== */}
        <CollapsibleCard
          id="dict-bilingual"
          defaultExpanded={true}
          title={<>{L("示例文本 ")}<span className="text-sm font-normal text-nc-text-muted">· The World of We Three</span></>}
          summary={_en ? 'Dadi Sapichi original text alongside its Chinese parallel, 63 full lines' : 'Dadi Sapichi 原文与中文对照，共 63 行完整段落'}
          icon={<BookOpen className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-[var(--aurora-brand-text)]"
          borderColor="border-[#8B5CF6]/20"
          bgColor="bg-transparent"
        >
          {/* Two-column bilingual */}
          <div className="grid md:grid-cols-2 bg-[var(--aurora-brand-bg-void)]">
            {/* Left: Dadi */}
            <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[#8B5CF6]/10">
              <p className="text-xs font-mono text-[var(--aurora-brand-cyan)] mb-5 tracking-widest uppercase">Dadi Sapichi</p>
              <div className="space-y-1">
                {bilingualText.map((line, i) => (
                  <p key={`d-${i}`} className="font-mono text-[13px] text-[#00E5CC]/90 leading-7">
                    {semanticHighlight(line.dadi)}
                  </p>
                ))}
              </div>
            </div>

            {/* Right: Chinese */}
            <div className="p-6 sm:p-8">
              <p className="text-xs font-mono text-[var(--aurora-brand-pink)] mb-5 tracking-widest uppercase">{L("中文翻译")}</p>
              <div className="space-y-1">
                {bilingualText.map((line, i) => (
                  <p key={`c-${i}`} className="font-serif text-[13px] text-nc-text leading-7">
                    {semanticHighlight(line.chinese)}
                  </p>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#1A1025]/50 px-6 sm:px-8 py-3 border-t border-[#8B5CF6]/10">
            <p className="text-xs text-nc-text-muted">
              {L("63 行完整对照 · 来自 The World of We Three 的 Dadi Sapichi 示例段落\n            ")}</p>
          </div>
        </CollapsibleCard>

        {/* ===== Poems & Aphorisms (moved from world settings) ===== */}
        <CollapsibleCard
          id="dict-poems"
          defaultExpanded={true}
          title={<>{L("诗歌与格言")}<span className="text-sm font-normal text-nc-text-muted">· {L("规则与猫 · 对联 · 双关 · 口诀")}</span></>}
          summary={_en ? "A free verse on learning social rules like a cat, plus a couplet, a pun and a cryptic ascending saying." : "诗《规则与猫》、数学对联、光双关，以及一句递进口诀"}
          icon={<BookOpen className="w-5 h-5 text-[var(--aurora-brand-cyan)]" />}
          titleColor="text-[var(--aurora-brand-text)]"
          borderColor="border-[#8B5CF6]/20"
          bgColor="bg-transparent"
        >
          <div className="p-6 sm:p-8 space-y-8">
            <div>
              <h4 className="text-sm font-semibold text-[var(--aurora-brand-pink)] mb-3 tracking-widest uppercase">{L("规则与猫")}</h4>
              <pre className="whitespace-pre-wrap font-serif text-sm sm:text-base text-nc-text leading-loose">{catPoemText}</pre>
            </div>
            <div className="grid sm:grid-cols-3 gap-4 pt-4 border-t border-[#8B5CF6]/10">
              <div className="text-center">
                <p className="text-[10px] font-mono text-nc-text-muted tracking-widest uppercase mb-2">{L("递进口诀")}</p>
                <p className="font-serif text-sm text-nc-text leading-loose">{mysticText}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-nc-text-muted tracking-widest uppercase mb-2">{L("数学对联")}</p>
                <pre className="whitespace-pre-line font-serif text-sm text-nc-text leading-loose">{coupletText}</pre>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-nc-text-muted tracking-widest uppercase mb-2">{L("光双关")}</p>
                <p className="font-serif text-sm text-nc-text leading-loose">{lightPunText}</p>
              </div>
            </div>
          </div>
        </CollapsibleCard>

        {/* ===== Catgirl Lexicon (moved from world settings) ===== */}
        <CollapsibleCard
          id="dict-catgirl-lexicon"
          defaultExpanded={false}
          title={<>{L("猫娘语词汇表")}<span className="text-sm font-normal text-nc-text-muted">· 10 {L("类")}</span></>}
          summary={_en ? "Ten thematic categories; source terms kept verbatim." : "自然、生灵、身体、动作……十类分组，词条保留原文用字"}
          icon={<Languages className="w-5 h-5 text-[var(--aurora-brand-pink)]" />}
          titleColor="text-[var(--aurora-brand-text)]"
          borderColor="border-[#F472B6]/20"
          bgColor="bg-transparent"
        >
          <div className="p-6 sm:p-8 grid md:grid-cols-2 gap-x-8 gap-y-5">
            {catgirlList.map((item) => (
              <div key={item.title} className="border-l-2 border-[#F472B6]/30 pl-4">
                <h4 className="text-sm font-semibold text-[var(--aurora-brand-pink)] mb-1">{item.title}</h4>
                <p className="text-sm text-nc-text-secondary leading-relaxed">{item.content}</p>
              </div>
            ))}
          </div>
        </CollapsibleCard>
      </div>
    </section>
  );
}
