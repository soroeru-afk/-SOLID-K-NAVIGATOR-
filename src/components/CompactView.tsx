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
import { getPriceLimit } from '../lib/priceLimitUtils';

interface Props {
  categories: Category[];
  stocks: Stock[];
  totalStocks: number;
  marketLinks: MarketLink[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  language: Language;
  onToggleMode: () => void;
  stockFontSize?: number;
  priceFontSize?: number;
  limitFontSize?: number;
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
  stockFontSize,
  priceFontSize,
  limitFontSize = 10,
  priceColor,
  theme,
  fontSize
}: Props) {
  const t = i18n[language];

  // メイン画面のサイズ設定（localStorage および props）と完全連動
  const [syncedListFontSize, setSyncedListFontSize] = useState<number>(() => {
    return fontSize || parseInt(localStorage.getItem('knav_list_font_size') || '13', 10);
  });
  const [syncedStockFontSize, setSyncedStockFontSize] = useState<number>(() => {
    return stockFontSize || parseInt(localStorage.getItem('knav_stock_font_size') || '16', 10);
  });
  const [syncedPriceFontSize, setSyncedPriceFontSize] = useState<number>(() => {
    return priceFontSize || parseInt(localStorage.getItem('knav_price_font_size') || '16', 10);
  });
  const [syncedLimitFontSize, setSyncedLimitFontSize] = useState<number>(() => {
    return limitFontSize || parseInt(localStorage.getItem('knav_limit_font_size') || '11', 10);
  });
  const [syncedPriceColor, setSyncedPriceColor] = useState<string>(() => {
    return priceColor || localStorage.getItem('knav_price_color') || 'default';
  });

  useEffect(() => {
    if (fontSize) setSyncedListFontSize(fontSize);
  }, [fontSize]);

  useEffect(() => {
    if (stockFontSize) setSyncedStockFontSize(stockFontSize);
  }, [stockFontSize]);

  useEffect(() => {
    if (priceFontSize) setSyncedPriceFontSize(priceFontSize);
  }, [priceFontSize]);

  useEffect(() => {
    if (limitFontSize) setSyncedLimitFontSize(limitFontSize);
  }, [limitFontSize]);

  useEffect(() => {
    if (priceColor) setSyncedPriceColor(priceColor);
  }, [priceColor]);

  // 別ウィンドウ・PWA間でもリアルタイムでスライダー変更を即座に検知・反映
  useEffect(() => {
    const handleStorage = (e: StorageEvent) => {
      if (!e.newValue) return;
      if (e.key === 'knav_list_font_size') setSyncedListFontSize(parseInt(e.newValue, 10));
      if (e.key === 'knav_stock_font_size') setSyncedStockFontSize(parseInt(e.newValue, 10));
      if (e.key === 'knav_price_font_size') setSyncedPriceFontSize(parseInt(e.newValue, 10));
      if (e.key === 'knav_limit_font_size') setSyncedLimitFontSize(parseInt(e.newValue, 10));
      if (e.key === 'knav_price_color') setSyncedPriceColor(e.newValue);
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  const effectiveFontSize = syncedListFontSize;
  const marketLinkFontSize = syncedListFontSize;

  // STOCK MARKET DATA の開閉状態
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(true);
  const [marketTab, setMarketTab] = useState<'links' | 'tanken'>('links');
  const [tankenSubTab, setTankenSubTab] = useState<'fundamentals' | 'technicals'>('fundamentals');
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
          <div className={`w-7 h-7 border flex items-center justify-center shrink-0 shadow-2xs ${
            theme === 'paper' 
              ? 'bg-[#73634F] text-white border-[#8e7d69]' 
              : 'bg-panel-bg border-border-main text-text-bright'
          }`}>
            <LayoutGrid size={15} className={theme === 'paper' ? 'text-white' : undefined} />
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
            <div 
              className="flex items-center gap-2 text-text-bright font-bold"
              style={{ fontSize: effectiveFontSize }}
            >
              <LineChart size={Math.max(12, effectiveFontSize - 1)} className="text-text-bright shrink-0" />
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
                      ? (theme === 'paper' 
                          ? 'bg-[#d95430] text-white border border-[#c24523] shadow-xs' 
                          : 'bg-border-main text-text-bright border border-border-light/50 shadow-xs')
                      : 'text-text-dim hover:text-text-normal bg-base-bg'
                  }`}
                  style={{ fontSize: Math.max(10, syncedListFontSize - 1) }}
                >
                  リンク
                </button>
                <button
                  type="button"
                  onClick={() => setMarketTab('tanken')}
                  className={`py-1 text-center font-bold transition-colors rounded-xs ${
                    marketTab === 'tanken'
                      ? (theme === 'paper' 
                          ? 'bg-[#d95430] text-white border border-[#c24523] shadow-xs' 
                          : 'bg-border-main text-text-bright border border-border-light/50 shadow-xs')
                      : 'text-text-dim hover:text-text-normal bg-base-bg'
                  }`}
                  style={{ fontSize: Math.max(10, syncedListFontSize - 1) }}
                >
                  銘柄探検
                </button>
              </div>

              {/* Content for TAB 1: リンク (高さいっぱいにスクロール可能) */}
              {marketTab === 'links' && (
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin flex flex-col gap-1">
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
                      className="flex items-center justify-between text-text-dim hover:text-text-bright hover:bg-border-main/50 px-2.5 py-1.5 rounded-xs transition-colors group border border-transparent hover:border-border-main bg-base-bg/30 min-w-0 w-full"
                      title={`${link.title}（別ウィンドウで開く）`}
                    >
                      <span 
                        className="truncate pr-1 font-medium min-w-0 flex-1 group-hover:text-text-bright transition-colors"
                        style={{ fontSize: marketLinkFontSize }}
                      >
                        {link.title}
                      </span>
                      <ExternalLink size={Math.max(10, marketLinkFontSize - 2)} className="shrink-0 opacity-40 group-hover:opacity-100 group-hover:text-text-bright ml-1" />
                    </a>
                  ))}
                </div>
              )}

              {/* Content for TAB 2: 銘柄探検 (リンクタブと完全連動した文字サイズ) */}
              {marketTab === 'tanken' && (
                <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pr-1 scrollbar-thin flex flex-col gap-1.5">
                  {/* Header: ファンダ / テクニカル 切り替え */}
                  <div className="grid grid-cols-2 gap-1 pb-1.5 border-b border-border-main/40 shrink-0">
                    <button
                      type="button"
                      onClick={() => setTankenSubTab('fundamentals')}
                      className={`py-1 text-center font-bold rounded-xs transition-colors ${
                        tankenSubTab === 'fundamentals'
                          ? (theme === 'paper' 
                              ? 'bg-[#d95430] text-white border border-[#c24523] shadow-2xs' 
                              : 'bg-border-main text-text-bright border border-border-light/50 shadow-2xs')
                          : 'text-text-dim hover:text-text-normal bg-base-bg'
                      }`}
                      style={{ fontSize: Math.max(10, syncedListFontSize - 1) }}
                    >
                      ファンダ
                    </button>
                    <button
                      type="button"
                      onClick={() => setTankenSubTab('technicals')}
                      className={`py-1 text-center font-bold rounded-xs transition-colors ${
                        tankenSubTab === 'technicals'
                          ? (theme === 'paper' 
                              ? 'bg-[#d95430] text-white border border-[#c24523] shadow-2xs' 
                              : 'bg-border-main text-text-bright border border-border-light/50 shadow-2xs')
                          : 'text-text-dim hover:text-text-normal bg-base-bg'
                      }`}
                      style={{ fontSize: Math.max(10, syncedListFontSize - 1) }}
                    >
                      テクニカル
                    </button>
                  </div>

                  {/* リスト表示 */}
                  <div className="flex flex-col gap-2">
                    {(tankenCategories.find(c => c.id === tankenSubTab)?.groups || []).map((group, gIdx) => (
                      <div key={gIdx} className="space-y-0.5">
                        <div 
                          className="font-bold text-text-dim px-1 pt-0.5 pb-0.5 flex items-center gap-1.5"
                          style={{ fontSize: Math.max(10, syncedListFontSize - 1) }}
                        >
                          <span className="w-1.5 h-2 rounded-xs bg-border-light shrink-0" />
                          <span className="truncate">{group.groupName}</span>
                        </div>
                        <div className="flex flex-col gap-0.5">
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
                              className="group flex items-center justify-between px-2.5 py-1.5 text-text-dim hover:text-text-bright hover:bg-border-main/50 bg-base-bg/30 border border-transparent hover:border-border-main rounded-xs transition-colors min-w-0 w-full"
                              title={`${item.title}（別ウィンドウで開く）`}
                            >
                              <span 
                                className="truncate min-w-0 flex-1 group-hover:text-text-bright font-medium tracking-normal"
                                style={{ fontSize: marketLinkFontSize }}
                              >
                                {item.title}
                              </span>
                              <ExternalLink size={Math.max(10, marketLinkFontSize - 2)} className="shrink-0 opacity-40 group-hover:opacity-100 ml-1.5 text-text-bright" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
                className="w-full bg-base-bg border border-border-main text-text-bright px-2.5 py-1.5 focus:outline-none focus:border-border-light font-bold tracking-wider cursor-pointer rounded-xs truncate pr-6"
                style={{ fontSize: syncedListFontSize }}
              >
                <option value="">[ {t.allData} ]</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
                <option value="UNASSIGNED">{t.unassigned}</option>
              </select>
            </div>
            <span 
              className="font-mono tabular-nums px-2 py-1 bg-base-bg border border-border-main text-text-dim font-bold rounded-xs shrink-0"
              style={{ fontSize: Math.max(9, syncedListFontSize - 2) }}
            >
              {stocks.length} 件
            </span>
          </div>

          {/* Stock List Scroll Area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden space-y-1.5 pr-1 scrollbar-thin">
            {stocks.length === 0 ? (
              <div className="text-center text-text-dim py-8 text-[11px]">
                銘柄データがありません
              </div>
            ) : (
              stocks.map(stock => {
                return (
                  <div 
                    key={stock.id} 
                    className={`group flex items-center justify-between border px-2.5 py-1.5 hover:border-border-light transition-colors rounded-xs ${
                      (theme === 'light' || theme === 'paper')
                        ? 'bg-white border-border-main shadow-2xs hover:bg-[#FAF9F5]'
                        : 'bg-base-bg/70 border-border-main/70 hover:bg-border-main/30'
                    }`}
                    style={{
                      backgroundColor: (theme === 'light' || theme === 'paper') ? '#FFFFFF' : undefined
                    }}
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
                        className={`w-6 h-6 flex items-center justify-center shrink-0 border border-border-main transition-colors rounded-2xs ${
                          (theme === 'light' || theme === 'paper')
                            ? 'bg-white text-text-dim hover:bg-border-main/20 hover:text-text-bright'
                            : 'bg-panel-bg text-text-dim hover:bg-border-light hover:text-text-bright'
                        }`}
                        style={{
                          backgroundColor: (theme === 'light' || theme === 'paper') ? '#FFFFFF' : undefined
                        }}
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
                        className="text-text-bright hover:text-[#58a6ff] truncate font-bold transition-colors flex items-center gap-1.5 flex-1 min-w-0"
                        title={`${stock.name}（別ウィンドウで株探を開く）`}
                      >
                        <span 
                          className="truncate font-bold tracking-wide"
                          style={{ fontSize: syncedStockFontSize }}
                        >
                          {stock.name}
                        </span>
                        <span 
                          className={`tabular-nums shrink-0 font-mono ${
                            (theme === 'light' || theme === 'paper') ? 'text-black' : 'text-text-dim group-hover:text-text-bright'
                          }`}
                          style={{ fontSize: Math.max(9, Math.round(syncedListFontSize * 0.85)) }}
                        >
                          {stock.code}
                        </span>
                      </a>
                    </div>

                    {/* Price Display */}
                    <div className="flex items-center gap-2 shrink-0 pl-1">
                      {(() => {
                        const limit = getPriceLimit(stock.price);
                        return (
                          <div className="flex flex-col items-end leading-tight font-mono">
                            <span 
                              className="text-text-bright tabular-nums text-right font-bold"
                              style={{ 
                                fontSize: syncedPriceFontSize, 
                                color: syncedPriceColor === 'red' ? '#C41414' : undefined 
                              }}
                              title={limit ? `制限値幅: ${limit.fullText}` : undefined}
                            >
                              {stock.price && stock.price !== '?' ? `¥${stock.price}` : (stock.price || '---')}
                            </span>
                            {limit && (
                              <span 
                                className="text-text-dim tabular-nums tracking-tighter"
                                style={{ fontSize: syncedLimitFontSize }}
                                title={`制限値幅: ${limit.fullText} (ストップ安: ${limit.low.toLocaleString()} / ストップ高: ${limit.high.toLocaleString()})`}
                              >
                                {limit.displayText}
                              </span>
                            )}
                          </div>
                        );
                      })()}
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
