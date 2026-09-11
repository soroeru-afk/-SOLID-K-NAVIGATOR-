import React, { useState, useEffect, useRef } from 'react';
import { Category, Stock, MarketLink } from '../types';
import { 
  Maximize2, ExternalLink, FileText, LayoutGrid, LineChart, 
  ChevronDown, ChevronRight, GripHorizontal
} from 'lucide-react';
import { Language, i18n } from '../i18n';
import { Theme } from '../App';
import { tankenCategories } from '../data/tankenData';
import { openExternalWindow } from '../lib/windowUtils';

interface Props {
  categories: Category[];
  stocks: Stock[];
  totalStocks: number;
  marketLinks: MarketLink[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  language: Language;
  onToggleMode: () => void;
  priceFontSize?: number;
  priceColor?: string;
  theme: Theme;
  fontSize?: number;
}

export default function CompactView({
  categories,
  stocks,
  totalStocks,
  marketLinks,
  activeCategory,
  onSelectCategory,
  language,
  onToggleMode,
  priceFontSize,
  priceColor,
  theme,
  fontSize
}: Props) {
  const t = i18n[language];

  // STOCK MARKET DATA の開閉状態
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(true);
  const [marketTab, setMarketTab] = useState<'links' | 'tanken'>('links');
  const [tankenSubTab, setTankenSubTab] = useState<'fundamentals' | 'technicals'>('fundamentals');

  // 銘柄探検の文字サイズ・行間（大・中・小 ＆ LocalStorage記憶）
  const [tankenSize, setTankenSize] = useState<'sm' | 'md' | 'lg'>(() => {
    const saved = localStorage.getItem('KNAV_COMPACT_TANKEN_SIZE');
    if (saved === 'sm' || saved === 'md' || saved === 'lg') return saved;
    return 'md'; // デフォルト「中」で以前より大きめ・ゆったり
  });

  const handleTankenSizeChange = (sz: 'sm' | 'md' | 'lg') => {
    setTankenSize(sz);
    localStorage.setItem('KNAV_COMPACT_TANKEN_SIZE', sz);
  };
  const [marketHeight, setMarketHeight] = useState<number>(() => {
    const saved = localStorage.getItem('KNAV_COMPACT_MARKET_HEIGHT');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed >= 120 && parsed <= 900) return parsed;
    }
    return 320; // デフォルト高さ（広め）
  });

  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);
  const startHeightRef = useRef(320);

  // カテゴリーの初期設定（「指標&ETF」デフォルト ＆ LocalStorage記憶・維持）
  useEffect(() => {
    const savedCatId = localStorage.getItem('KNAV_COMPACT_CATEGORY_ID');
    if (savedCatId !== null) {
      // 保存されていたカテゴリーがある場合
      if (savedCatId === '' || categories.some(c => c.id === savedCatId) || savedCatId === 'UNASSIGNED') {
        const targetId = savedCatId === '' ? null : savedCatId;
        if (activeCategory !== targetId) {
          onSelectCategory(targetId);
        }
        return;
      }
    }

    // 初回または保存値がない場合: 「指標&ETF」「指標」「ETF」を最優先でデフォルトに設定
    const targetCat = categories.find(c => 
      c.name.includes('指標') || 
      c.name.includes('ETF') || 
      c.name.toLowerCase().includes('index')
    );

    if (targetCat) {
      localStorage.setItem('KNAV_COMPACT_CATEGORY_ID', targetCat.id);
      if (activeCategory !== targetCat.id) {
        onSelectCategory(targetCat.id);
      }
    } else if (categories.length > 0 && (!activeCategory || activeCategory === 'MARKET_DATA' || activeCategory === 'MARKET_LINKS')) {
      // 指標&ETFがなくても先頭のカテゴリーを設定
      localStorage.setItem('KNAV_COMPACT_CATEGORY_ID', categories[0].id);
      onSelectCategory(categories[0].id);
    }
  }, [categories]);

  // ドラッグリサイズ処理
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startHeightRef.current = marketHeight;
  };

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaY = e.clientY - startYRef.current;
      const containerHeight = containerRef.current?.clientHeight || window.innerHeight;
      // 最小 130px、最大 (コンテナ高さ - 130px) の範囲で制限
      const minH = 130;
      const maxH = Math.max(minH, containerHeight - 130);
      const newHeight = Math.min(Math.max(startHeightRef.current + deltaY, minH), maxH);
      setMarketHeight(newHeight);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setMarketHeight(curr => {
        localStorage.setItem('KNAV_COMPACT_MARKET_HEIGHT', String(Math.round(curr)));
        return curr;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleCategoryChange = (val: string) => {
    localStorage.setItem('KNAV_COMPACT_CATEGORY_ID', val);
    onSelectCategory(val === '' ? null : val);
  };

  // カテゴリ選択値
  const selectedCatValue = (activeCategory === 'MARKET_LINKS' || activeCategory === 'MARKET_DATA') ? '' : (activeCategory || '');

  return (
    <div 
      ref={containerRef}
      className={`h-screen w-full bg-base-bg flex flex-col p-2.5 text-xs uppercase tracking-wider overflow-hidden ${
        isDragging ? 'select-none cursor-row-resize' : ''
      }`}
    >
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border-main pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-panel-bg border border-border-main flex items-center justify-center text-text-bright shrink-0 shadow-2xs">
            <LayoutGrid size={15} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[12px] text-text-bright tracking-widest leading-tight">{t.appTitle}</h1>
            <h2 className="font-bold text-[10px] text-text-dim tracking-widest leading-tight">
              {t.appSubTitle} <span className="text-text-dim ml-1">MINI</span>
            </h2>
          </div>
        </div>
        <button 
          onClick={onToggleMode} 
          className="text-text-dim hover:text-text-bright p-1.5 transition-colors border border-border-main bg-panel-bg rounded-xs hover:border-border-light" 
          title="通常画面に戻る (RETURN TO FULL VIEW)"
        >
          <Maximize2 size={14} />
        </button>
      </div>

      {/* System Status Pill */}
      <div className="flex items-center justify-between px-2.5 py-1 bg-panel-bg border border-border-main text-[10px] text-text-dim mb-2 shrink-0">
        <div className="flex items-center gap-2">
          <span>DIR:</span>
          <span className="text-text-bright font-bold font-mono">{categories.length}</span>
        </div>
        <div className="flex items-center gap-2">
          <span>{t.totalStocks}:</span>
          <span className="text-text-bright font-bold font-mono">{totalStocks}</span>
        </div>
      </div>

      {/* Main Split View Container */}
      <div className="flex-1 min-h-0 flex flex-col">
        {/* SECTION 1: STOCK MARKET DATA (ドラッグで可変の高さ) */}
        <div 
          style={{ height: isMarketDataOpen ? `${marketHeight}px` : 'auto' }}
          className="border border-border-main bg-panel-bg shrink-0 flex flex-col shadow-2xs overflow-hidden"
        >
          {/* Accordion Header */}
          <div 
            onClick={() => setIsMarketDataOpen(!isMarketDataOpen)}
            className="flex items-center justify-between px-2.5 py-1.5 cursor-pointer bg-base-bg/60 border-b border-border-main hover:bg-border-main/30 transition-colors select-none shrink-0"
          >
            <div className="flex items-center gap-2 text-text-bright font-bold text-[11px]">
              <LineChart size={13} className="text-text-bright" />
              <span>[ STOCK MARKET DATA ]</span>
            </div>
            <div className="flex items-center gap-1 text-text-dim text-[10px]">
              <span className="text-[9px] font-mono">{marketLinks.length} LINKS</span>
              {isMarketDataOpen ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
            </div>
          </div>

          {isMarketDataOpen && (
            <div className="p-2 flex-1 min-h-0 flex flex-col">
              {/* Tab Buttons: [リンク] [探検] */}
              <div className="grid grid-cols-2 gap-1 mb-2 border-b border-border-main/60 pb-1.5 text-[10px] shrink-0">
                <button
                  type="button"
                  onClick={() => setMarketTab('links')}
                  className={`py-1 text-center font-bold transition-colors rounded-xs ${
                    marketTab === 'links'
                      ? 'bg-border-main text-text-bright border border-border-light/50 shadow-xs'
                      : 'text-text-dim hover:text-text-normal bg-base-bg'
                  }`}
                >
                  リンク
                </button>
                <button
                  type="button"
                  onClick={() => setMarketTab('tanken')}
                  className={`py-1 text-center font-bold transition-colors rounded-xs ${
                    marketTab === 'tanken'
                      ? 'bg-border-main text-text-bright border border-border-light/50 shadow-xs'
                      : 'text-text-dim hover:text-text-normal bg-base-bg'
                  }`}
                >
                  銘柄探検
                </button>
              </div>

              {/* Content for TAB 1: リンク (高さいっぱいにスクロール可能) */}
              {marketTab === 'links' && (
                <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1">
                  {marketLinks.map(link => (
                    <a
                      key={link.id}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openExternalWindow(link.url);
                      }}
                      className="flex items-center justify-between text-text-dim hover:text-text-bright hover:bg-border-main/50 px-2.5 py-1.5 rounded-xs transition-colors group border border-transparent hover:border-border-main bg-base-bg/30"
                      title={`${link.title}（別ウィンドウで開く）`}
                    >
                      <span className="truncate pr-1 text-[12px] font-medium group-hover:text-[#58a6ff] transition-colors">
                        {link.title}
                      </span>
                      <ExternalLink size={11} className="shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-[#58a6ff]" />
                    </a>
                  ))}
                </div>
              )}

              {/* Content for TAB 2: 銘柄探検 (高さいっぱいにスクロール可能) */}
              {marketTab === 'tanken' && (() => {
                const sizeConfig = {
                  sm: {
                    title: 'text-[11px]',
                    groupTitle: 'text-[10px]',
                    itemPadding: 'py-1 px-2',
                    groupGap: 'space-y-1',
                    itemGap: 'gap-0.5',
                    iconSize: 9,
                  },
                  md: {
                    title: 'text-[12.5px]',
                    groupTitle: 'text-[11px]',
                    itemPadding: 'py-1.5 px-2.5',
                    groupGap: 'space-y-1.5',
                    itemGap: 'gap-1',
                    iconSize: 11,
                  },
                  lg: {
                    title: 'text-[14px]',
                    groupTitle: 'text-[12px]',
                    itemPadding: 'py-2 px-2.5',
                    groupGap: 'space-y-2',
                    itemGap: 'gap-1.5',
                    iconSize: 12,
                  },
                }[tankenSize];

                return (
                  <div className="flex-1 min-h-0 overflow-y-auto pr-1 scrollbar-thin flex flex-col gap-1.5">
                    {/* Header: ファンダ / テクニカル 切り替え ＆ 大・中・小 サイズ切替 */}
                    <div className="flex items-center justify-between gap-1.5 pb-1.5 border-b border-border-main/40 shrink-0">
                      <div className="flex items-center gap-1 flex-1">
                        <button
                          type="button"
                          onClick={() => setTankenSubTab('fundamentals')}
                          className={`flex-1 py-1 text-center font-bold rounded-xs transition-colors text-[10px] ${
                            tankenSubTab === 'fundamentals'
                              ? 'bg-border-main text-text-bright border border-border-light/50 shadow-2xs'
                              : 'text-text-dim hover:text-text-normal bg-base-bg'
                          }`}
                        >
                          ファンダ
                        </button>
                        <button
                          type="button"
                          onClick={() => setTankenSubTab('technicals')}
                          className={`flex-1 py-1 text-center font-bold rounded-xs transition-colors text-[10px] ${
                            tankenSubTab === 'technicals'
                              ? 'bg-border-main text-text-bright border border-border-light/50 shadow-2xs'
                              : 'text-text-dim hover:text-text-normal bg-base-bg'
                          }`}
                        >
                          テクニカル
                        </button>
                      </div>

                      {/* 文字サイズ・行間切り替え（大・中・小） */}
                      <div className="flex items-center gap-0.5 bg-base-bg border border-border-main p-0.5 rounded-xs shrink-0">
                        <span className="text-[9px] text-text-dim px-1 font-mono">文字:</span>
                        {(['sm', 'md', 'lg'] as const).map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() => handleTankenSizeChange(sz)}
                            className={`px-1.5 py-0.5 font-bold rounded-2xs transition-colors text-[9px] ${
                              tankenSize === sz
                                ? 'bg-border-main text-text-bright border border-border-light/60 shadow-2xs'
                                : 'text-text-dim hover:text-text-bright'
                            }`}
                            title={`文字・行間サイズ: ${sz === 'sm' ? '小' : sz === 'md' ? '中 (推奨)' : '大'}`}
                          >
                            {sz === 'sm' ? '小' : sz === 'md' ? '中' : '大'}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* リスト表示 */}
                    <div className={`flex flex-col ${sizeConfig.groupGap}`}>
                      {(tankenCategories.find(c => c.id === tankenSubTab)?.groups || []).map((group, gIdx) => (
                        <div key={gIdx} className={`space-y-1`}>
                          <div className={`${sizeConfig.groupTitle} font-bold text-text-dim px-1 pt-1 flex items-center gap-1.5`}>
                            <span className={`w-1.5 h-2 rounded-xs ${tankenSubTab === 'fundamentals' ? 'bg-[#f59e0b]' : 'bg-[#4ade80]'}`} />
                            <span className="truncate">{group.groupName}</span>
                          </div>
                          <div className={`flex flex-col ${sizeConfig.itemGap}`}>
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
                                className={`group flex items-center justify-between ${sizeConfig.itemPadding} text-text-dim hover:text-text-bright hover:bg-border-main/50 bg-base-bg/40 border border-border-main/30 hover:border-border-main rounded-xs transition-colors`}
                                title={`${item.title}（別ウィンドウで開く）`}
                              >
                                <span className={`truncate group-hover:text-[#58a6ff] ${sizeConfig.title} font-medium tracking-normal`}>
                                  {item.title}
                                </span>
                                <ExternalLink size={sizeConfig.iconSize} className="shrink-0 opacity-0 group-hover:opacity-100 ml-1.5 text-text-bright" />
                              </a>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* RESIZER SPLITTER (中間のドラッグ可能境界線バー) */}
        {isMarketDataOpen && (
          <div 
            onMouseDown={handleMouseDown}
            className={`h-2.5 my-1 flex items-center justify-center cursor-row-resize select-none group transition-colors rounded-2xs ${
              isDragging ? 'bg-border-light' : 'hover:bg-border-light/60 active:bg-border-light'
            }`}
            title="ドラッグして上下の表示高さを変更（設定は自動保存されます）"
          >
            <div className="w-12 h-1 bg-border-light group-hover:bg-text-bright rounded-full transition-colors flex items-center justify-center">
              <GripHorizontal size={10} className="text-text-dim group-hover:text-text-bright opacity-60" />
            </div>
          </div>
        )}

        {/* SECTION 2: CATEGORIES & STOCKS (下部：残りの領域にフィット) */}
        <div className="flex flex-col flex-1 min-h-0 border border-border-main bg-panel-bg p-2 shadow-2xs mt-0">
          {/* Category Selector Dropdown & Stock Count Badge */}
          <div className="flex items-center gap-1.5 mb-2 shrink-0">
            <div className="relative flex-1">
              <select
                value={selectedCatValue}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full bg-base-bg border border-border-main text-text-bright px-2.5 py-1.5 focus:outline-none focus:border-border-light text-[11px] font-bold tracking-wider cursor-pointer rounded-xs truncate pr-6"
              >
                <option value="">[ {t.allData} ]</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="UNASSIGNED">{t.unassigned}</option>
              </select>
            </div>
            <span className="text-[10px] font-mono tabular-nums px-2 py-1 bg-base-bg border border-border-main text-text-dim font-bold rounded-xs shrink-0">
              {stocks.length} 件
            </span>
          </div>

          {/* Stock List Scroll Area */}
          <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
            {stocks.length === 0 ? (
              <div className="text-center text-text-dim py-8 text-[11px]">
                銘柄データがありません
              </div>
            ) : (
              stocks.map(stock => {
                return (
                  <div 
                    key={stock.id} 
                    className="group flex items-center justify-between bg-base-bg/70 border border-border-main/70 px-2 py-1.5 hover:border-border-light hover:bg-border-main/30 transition-colors rounded-xs"
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0 pr-2">
                      {/* Chart Link */}
                      <a
                        href={`https://kabutan.jp/stock/chart?code=${stock.code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalWindow(`https://kabutan.jp/stock/chart?code=${stock.code}`);
                        }}
                        className="w-6 h-6 flex items-center justify-center bg-panel-bg text-text-dim shrink-0 border border-border-main hover:bg-border-light hover:text-text-bright transition-colors rounded-2xs"
                        title="株探チャート（別ウィンドウで開く）"
                      >
                        <FileText size={12} />
                      </a>

                      {/* Stock Name & Code */}
                      <a
                        href={`https://kabutan.jp/stock/?code=${stock.code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalWindow(`https://kabutan.jp/stock/?code=${stock.code}`);
                        }}
                        className="text-text-bright hover:text-[#58a6ff] text-[11px] truncate font-bold transition-colors flex items-center gap-1 flex-1 min-w-0"
                        style={{ fontSize: fontSize ? Math.max(11, fontSize - 1) : undefined }}
                        title={`${stock.name}（別ウィンドウで株探を開く）`}
                      >
                        <span className="truncate">{stock.name}</span>
                        <span 
                          className={`tabular-nums shrink-0 font-mono text-[10px] ${
                            theme === 'light' ? 'text-black' : 'text-text-dim group-hover:text-text-bright'
                          }`}
                        >
                          {stock.code}
                        </span>
                      </a>
                    </div>

                    {/* Price Display */}
                    <div className="flex items-center gap-2 shrink-0 pl-1">
                      <span 
                        className="text-text-bright tabular-nums text-right font-bold font-mono"
                        style={{ 
                          fontSize: priceFontSize || undefined, 
                          color: priceColor === 'red' ? '#C41414' : undefined 
                        }}
                      >
                        {stock.price && stock.price !== '?' ? `¥${stock.price}` : (stock.price || '---')}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
