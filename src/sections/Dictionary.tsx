import { useState } from 'react';
import { dictionary, bilingualText } from '@/data/dictionary';
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
  const [search, setSearch] = useState('');
  const [activeLetter, setActiveLetter] = useState('全部');

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
            <Languages className="w-7 h-7 text-[#00E5CC]" />
            <h2 className="text-3xl sm:text-4xl font-bold text-[#F0E6FF] tracking-wide">
              {semanticHighlight("Dadi Sapichi")}
            </h2>
          </div>
          <p className="text-nc-text text-lg">
            Chinese Dictionary 2.0 · 自创语言对照词典
          </p>
        </div>

        {/* ===== Dictionary Content (Collapsible, default collapsed) ===== */}
        <CollapsibleCard
          id="dict-main"
          defaultExpanded={false}
          title={<>词汇表 <span className="text-sm font-normal text-nc-text-muted">· {dictionary.length} 个词条</span></>}
          summary="搜索、筛选和浏览全部 Dadi Sapichi 词汇"
          icon={<Languages className="w-5 h-5 text-[#00E5CC]" />}
          titleColor="text-[#F0E6FF]"
          borderColor="border-[#8B5CF6]/20"
          bgColor="bg-[#100A1A]"
        >
          {/* Search */}
          <div className="p-6 pb-0">
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-nc-text-muted" />
              <input
                type="text"
                placeholder="搜索词汇（支持中文、Dadi Sapichi）..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#100A1A] border border-[#8B5CF6]/15 rounded-xl pl-12 pr-4 py-3 text-[#F0E6FF] placeholder:text-nc-text-muted focus:outline-none focus:border-[#00E5CC]/40 transition-colors"
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
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#1A1025] text-nc-text-muted hover:text-nc-text'
                  }`}
                >
                  {letter}
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
                  className="bg-[#100A1A] border border-[#8B5CF6]/10 rounded-lg p-4 hover:border-[#00E5CC]/25 hover:-translate-y-0.5 transition-all duration-200 scroll-mt-[100px]"
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-mono text-base font-bold text-[#00E5CC]">{entry.word}</span>
                    {entry.tags?.includes('特殊') && (
                      <BookMarked className="w-3.5 h-3.5 text-[#8B5CF6]" />
                    )}
                  </div>
                  <p className="text-sm text-nc-text">{posColorHighlight(entry.meaning, entry.tags?.[0] || '')}</p>
                  {entry.tags && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {entry.tags.map((tag) => (
                        <span key={tag} className={`px-1.5 py-0.5 rounded text-[10px] border ${tagColors[tag] || 'bg-[#1A1025] text-[#8B7DAF]'}`}>
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
          title={<>示例文本 <span className="text-sm font-normal text-nc-text-muted">· The World of We Three</span></>}
          summary="Dadi Sapichi 原文与中文对照，共 63 行完整段落"
          icon={<BookOpen className="w-5 h-5 text-[#00E5CC]" />}
          titleColor="text-[#F0E6FF]"
          borderColor="border-[#8B5CF6]/20"
          bgColor="bg-transparent"
        >
          {/* Two-column bilingual */}
          <div className="grid md:grid-cols-2 bg-[#08040F]">
            {/* Left: Dadi */}
            <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-[#8B5CF6]/10">
              <p className="text-xs font-mono text-[#00E5CC] mb-5 tracking-widest uppercase">Dadi Sapichi</p>
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
              <p className="text-xs font-mono text-[#F472B6] mb-5 tracking-widest uppercase">中文翻译</p>
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
              63 行完整对照 · 来自 The World of We Three 的 Dadi Sapichi 示例段落
            </p>
          </div>
        </CollapsibleCard>
      </div>
    </section>
  );
}
