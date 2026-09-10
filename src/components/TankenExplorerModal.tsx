import { useState, useEffect } from 'react';
import { ExternalLink, X, Search, Compass, Sparkles } from 'lucide-react';
import { tankenCategories } from '../data/tankenData';
import { Theme } from '../App';
import { openExternalWindow } from '../lib/windowUtils';

interface Props {
  onClose: () => void;
  theme?: Theme;
}

export default function TankenExplorerModal({ onClose }: Props) {
  const [filterQuery, setFilterQuery] = useState('');

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const query = filterQuery.toLowerCase().trim();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-[2px] animate-fadeIn">
      <div 
        className="bg-panel-bg border border-border-light w-full max-w-5xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-[#1f6feb]/20 border border-[#1f6feb]/40 flex items-center justify-center text-[#58a6ff]">
              <Compass size={14} />
            </div>
            <div>
              <div className="text-xs font-bold text-text-bright flex items-center gap-2">
                <span>銘柄探検 リンク集</span>
                <span className="text-[10px] text-text-dim font-normal font-mono">(株探プリセットスクリーニング)</span>
              </div>
              <div className="text-[10px] text-text-dim">
                ファンダメンタルズ分析・テクニカル指標別の注目銘柄リスト
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Search Input */}
            <div className="relative w-44 sm:w-60">
              <input
                type="text"
                value={filterQuery}
                onChange={e => setFilterQuery(e.target.value)}
                placeholder="条件を検索 (例: ROE, クロス)..."
                className="w-full h-7 pl-7 pr-7 bg-panel-bg border border-border-main text-text-bright text-[11px] placeholder:text-text-dim/50 focus:outline-none focus:border-border-light"
              />
              <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-text-dim" />
              {filterQuery && (
                <button
                  onClick={() => setFilterQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright"
                >
                  <X size={11} />
                </button>
              )}
            </div>

            <button
              onClick={onClose}
              className="text-text-dim hover:text-text-bright p-1 transition-colors ml-1"
              title="閉じる (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* 2-Column Tanken Layout matching image 2026y09m10d_092415903.png */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {tankenCategories.map(category => {
              const isFundamentals = category.id === 'fundamentals';
              
              // Filter groups & items
              const filteredGroups = category.groups.map(group => {
                const matchedItems = group.items.filter(item => 
                  !query || 
                  item.title.toLowerCase().includes(query) || 
                  group.groupName.toLowerCase().includes(query)
                );
                return { ...group, items: matchedItems };
              }).filter(group => group.items.length > 0);

              return (
                <div key={category.id} className="flex flex-col border border-border-main bg-base-bg/50 overflow-hidden">
                  {/* Category Title Banner */}
                  <div className={`px-3.5 py-2 font-bold text-xs text-white flex items-center justify-between shadow-sm ${
                    isFundamentals 
                      ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] border-b border-[#f59e0b]' 
                      : 'bg-gradient-to-r from-[#15803d] to-[#166534] border-b border-[#22c55e]'
                  }`}>
                    <span className="tracking-wider">{category.title}</span>
                    <span className="text-[10px] font-normal opacity-90 font-mono">
                      {filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} 項目
                    </span>
                  </div>

                  {/* Groups */}
                  <div className="p-3.5 space-y-4">
                    {filteredGroups.length === 0 ? (
                      <div className="py-6 text-center text-xs text-text-dim">
                        一致する条件がありません
                      </div>
                    ) : (
                      filteredGroups.map((group, gIdx) => (
                        <div key={gIdx} className="space-y-1.5">
                          {/* Group Sub-heading */}
                          <div className={`text-[11px] font-bold pb-1 border-b flex items-center gap-1.5 ${
                            isFundamentals 
                              ? 'text-[#f59e0b] border-[#d97706]/30' 
                              : 'text-[#4ade80] border-[#16a34a]/30'
                          }`}>
                            <span className={`w-1.5 h-3 rounded-xs ${isFundamentals ? 'bg-[#f59e0b]' : 'bg-[#4ade80]'}`} />
                            <span>{group.groupName}</span>
                          </div>

                          {/* Link items with bullet dot icon */}
                          <div className="space-y-0.5 pt-0.5">
                            {group.items.map((item, itemIdx) => (
                              <a
                                key={itemIdx}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => {
                                  e.preventDefault();
                                  openExternalWindow(item.url);
                                }}
                                className="group flex items-center justify-between px-2 py-1 text-xs text-text-normal hover:text-text-bright hover:bg-border-main/50 rounded transition-colors"
                                title={`${item.title}（別ウィンドウで開く）`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  <span className="w-1.5 h-1.5 rounded-full bg-text-dim/60 group-hover:bg-[#58a6ff] shrink-0 transition-colors" />
                                  <span className="truncate group-hover:underline text-[11px] leading-snug">
                                    {item.title}
                                  </span>
                                </div>
                                <ExternalLink size={10} className="shrink-0 text-text-dim group-hover:text-text-bright opacity-0 group-hover:opacity-100 transition-opacity ml-1.5" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-2.5 border-t border-border-main bg-base-bg/60 flex items-center justify-between text-[11px] text-text-dim shrink-0">
          <div className="flex items-center gap-1">
            <Sparkles size={11} className="text-[#d29922]" />
            <span>株探「銘柄探検」公式プリセット条件リンク</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1 bg-panel-bg border border-border-main hover:bg-border-main text-text-bright text-xs transition-colors"
          >
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}
