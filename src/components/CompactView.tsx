import React from 'react';
import { Category, Stock, MarketLink } from '../types';
import { Maximize2, ExternalLink, FileText, LayoutGrid } from 'lucide-react';
import { Language, i18n } from '../i18n';

interface Props {
  categories: Category[];
  stocks: Stock[];
  totalStocks: number;
  marketLinks: MarketLink[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  language: Language;
  onToggleMode: () => void;
}

export default function CompactView({ categories, stocks, totalStocks, marketLinks, activeCategory, onSelectCategory, language, onToggleMode }: Props) {
  const t = i18n[language];
  const isMarketLinks = activeCategory === 'MARKET_LINKS';

  return (
    <div className="h-screen w-full bg-base-bg flex flex-col p-3 text-xs uppercase tracking-wider overflow-hidden">
      <div className="flex items-start justify-between border-b border-border-main pb-3 mb-4 shrink-0">
         <div className="flex items-center gap-3">
           <div className="w-8 h-8 bg-border-main border border-border-light flex items-center justify-center text-text-bright shrink-0">
             <LayoutGrid size={16} />
           </div>
           <div className="flex flex-col">
             <h1 className="font-bold text-[13px] text-text-bright tracking-widest leading-tight">{t.appTitle}</h1>
             <h2 className="font-bold text-[11px] text-text-dim tracking-widest leading-tight">{t.appSubTitle} <span className="text-text-normal ml-1">MINI</span></h2>
           </div>
         </div>
         <button onClick={onToggleMode} className="text-text-dim hover:text-text-bright p-1 transition-colors mt-1" title="RETURN TO FULL VIEW">
           <Maximize2 size={16} />
         </button>
      </div>

      <div className="border border-border-main bg-panel-bg p-3 relative flex flex-col mb-4 shrink-0">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold">
          {t.systemStatus}
        </div>
        <div className="flex flex-col gap-1.5 text-[10px] text-text-dim mt-1">
          <div className="flex justify-between">
            <span>DIR COUNT:</span>
            <span className="text-text-normal font-mono font-bold text-xs">{categories.length}</span>
          </div>
          <div className="flex justify-between items-end">
            <span>{t.totalStocks}:</span>
            <span className="text-text-normal font-mono font-bold text-xs">{totalStocks}</span>
          </div>
        </div>
      </div>

      <div className="mb-4 shrink-0 px-1">
        <select
          value={activeCategory || ''}
          onChange={(e) => onSelectCategory(e.target.value || null)}
          className="w-full bg-panel-bg border border-border-main text-text-bright px-3 py-2 focus:outline-none focus:border-border-light text-sm font-bold tracking-widest cursor-pointer"
        >
          <option value="MARKET_LINKS">[ STOCK MARKET DATA ]</option>
          <option value="">[ {t.allData} ]</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {isMarketLinks ? (
          marketLinks.map(link => (
            <a
              key={link.id}
              href={link.url}
              target="_blank"
              rel="noreferrer"
              className="group flex items-center justify-between bg-panel-bg border border-border-main p-3 hover:border-border-light transition-colors"
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ExternalLink size={14} className="text-text-dim group-hover:text-[#58a6ff] shrink-0" />
                <span className="text-text-bright group-hover:text-[#58a6ff] text-sm truncate font-bold transition-colors">
                  {link.title}
                </span>
              </div>
            </a>
          ))
        ) : stocks.length === 0 ? (
          <div className="text-center text-text-dim py-8 text-[10px]">NO DATA</div>
        ) : (
          stocks.map(stock => {
            const numPrice = parseFloat(stock.price.replace(/[^\d.-]/g, ''));
            const trendColor = isNaN(numPrice) ? 'text-text-dim' : (numPrice > 0 ? 'text-text-normal' : 'text-[#f85149]');

            return (
              <div key={stock.id} className="group flex items-center justify-between bg-panel-bg border border-border-main p-3 hover:border-border-light transition-colors">
                <div className="flex items-center gap-3 overflow-hidden">
                  <a
                    href={`https://kabutan.jp/stock/chart?code=${stock.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 flex items-center justify-center bg-base-bg text-text-normal shrink-0 border border-border-main/50 hover:bg-border-light hover:text-text-bright transition-colors"
                    title="チャート"
                  >
                    <FileText size={14} />
                  </a>
                  <a
                    href={`https://kabutan.jp/stock/?code=${stock.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-text-bright hover:text-[#58a6ff] text-sm truncate font-bold transition-colors"
                  >
                    {stock.name} <span className="text-text-dim text-[10px] font-mono ml-1">{stock.code}</span>
                  </a>
                </div>
                <div className="flex items-center gap-4 shrink-0 pl-2">
                  <span className={`font-mono text-sm text-right ${trendColor} font-bold`}>
                    {stock.price !== '?' ? `¥${stock.price}` : stock.price}
                  </span>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  );
}
