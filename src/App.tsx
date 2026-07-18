import { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import AddStockForm from './components/AddStockForm';
import StockList from './components/StockList';
import Header from './components/Header';
import CompactView from './components/CompactView';
import { Category, Stock, MarketLink } from './types';
import { Language, i18n } from './i18n';
import { initialGroups } from './data';
import { initialData } from './importData';

// GitHub Pages上で動作する場合はローカルサーバーのAPIを使用
let API_BASE = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
  ? ''
  : 'http://localhost:3000';

export type Theme = 'light' | 'dark' | 'black';
export type FontType = 'mono' | 'gothic' | 'meiryo' | 'maru';

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('knav_theme') as Theme) || 'black'
  );

  useEffect(() => {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return;
    }

    const probeLocalServer = async () => {
      const ports = Array.from({ length: 16 }, (_, i) => 3000 + i);
      for (const port of ports) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 120);
          const res = await fetch(`http://localhost:${port}/api/ping`, { signal: controller.signal });
          clearTimeout(timeoutId);
          if (res.ok) {
            const data = await res.json();
            if (data.pong) {
              API_BASE = `http://localhost:${port}`;
              console.log(`Successfully connected to local proxy on http://localhost:${port}`);
              break;
            }
          }
        } catch (e) {
          // ignore error and try next port
        }
      }
    };

    probeLocalServer();
  }, []);

  const [fontType, setFontType] = useState<FontType>(
    () => (localStorage.getItem('knav_font_type') as FontType) || 'gothic'
  );

  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('knav_compact_mode') === 'true';
  });

  useEffect(() => {
    localStorage.setItem('knav_compact_mode', String(isCompactMode));
  }, [isCompactMode]);

  const [language, setLanguage] = useState<Language>(
    () => (localStorage.getItem('knav_language') as Language) || 'JP'
  );

  const [sidebarPos, setSidebarPos] = useState<'left' | 'right'>(
    () => (localStorage.getItem('knav_sidebar_pos') as any) || 'left'
  );

  const [fontSize, setFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('knav_font_size') || '12')
  );

  useEffect(() => {
    localStorage.setItem('knav_sidebar_pos', sidebarPos);
  }, [sidebarPos]);

  useEffect(() => {
    localStorage.setItem('knav_font_size', fontSize.toString());
  }, [fontSize]);

  useEffect(() => {
    // Initialize caches from initialData if they don't exist
    const isInitialized = localStorage.getItem('knav_sx_caches_initialized');
    if (!isInitialized) {
      if (initialData.bbHistory) Object.keys(initialData.bbHistory).forEach(c => localStorage.setItem('KNAV_SX_HIST_' + c, JSON.stringify((initialData.bbHistory as any)[c])));
      if (initialData.closeCache) Object.keys(initialData.closeCache).forEach(c => localStorage.setItem('KNAV_SX_CLOSE_' + c, JSON.stringify((initialData.closeCache as any)[c])));
      if (initialData.memoCache) Object.keys(initialData.memoCache).forEach(c => localStorage.setItem('KNAV_SX_MEMO_' + c, JSON.stringify((initialData.memoCache as any)[c])));
      if (initialData.bwpCache) Object.keys(initialData.bwpCache).forEach(c => localStorage.setItem('KNAV_SX_BWP_' + c, JSON.stringify((initialData.bwpCache as any)[c])));
      localStorage.setItem('knav_sx_caches_initialized', 'true');
      
      // Update stocks with newly imported prices
      setStocks(prev => prev.map(s => {
        const c = localStorage.getItem('KNAV_SX_CLOSE_' + s.code);
        if (c) {
          try { const cv = JSON.parse(c); if (cv.price) return { ...s, price: cv.price }; } catch(e){}
        }
        return s;
      }));
    }
  }, []);

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem('knav_categories_v2');
    if (saved) {
        try { return JSON.parse(saved); } catch (e) { console.error(e); }
    }
    return initialGroups.map(g => ({ id: g.id, name: g.name }));
  });

  const [stocks, setStocks] = useState<Stock[]>(() => {
    const saved = localStorage.getItem('knav_stocks_v2');
    if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            return parsed.map((s: Stock) => {
                const c = localStorage.getItem('KNAV_SX_CLOSE_' + s.code);
                if (c) {
                    try { const cv = JSON.parse(c); if(cv.price) s.price = cv.price; } catch(e){}
                }
                return s;
            });
        } catch (e) { console.error(e); }
    }
    const initialStocks: Stock[] = [];
    initialGroups.forEach(g => {
      g.stocks.forEach((s, index) => {
        initialStocks.push({
          id: `${g.id}_${s.code}`,
          code: s.code,
          name: s.name,
          categoryId: g.id,
          createdAt: Date.now() + index
        });
      });
    });
    return initialStocks;
  });
  
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);
  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(370);

  const defaultMarketLinks: MarketLink[] = [
    { id: 'm1', title: "決算速報", url: "https://kabutan.jp/news/" },
    { id: 'm5', title: "今日の上昇率", url: "https://kabutan.jp/warning/?mode=2_1" },
    { id: 'm6', title: "今日の下落率", url: "https://kabutan.jp/warning/?mode=2_2" },
    { id: 'm2', title: "本日の活況銘柄", url: "https://kabutan.jp/warning/?mode=2_9" },
    { id: 'm3', title: "本日の売買代金ランキング", url: "https://kabutan.jp/warning/trading_value_ranking" },
    { id: 'm4', title: "本日の出来高ランキング", url: "https://kabutan.jp/warning/volume_ranking" },
    { id: 'm9', title: "日経平均の寄与度ランキング", url: "https://kabutan.jp/warning/?mode=8_1" },
    { id: 'm7', title: "本日のストップ高銘柄", url: "https://kabutan.jp/warning/?mode=3_1" },
    { id: 'm8', title: "本日のストップ安銘柄", url: "https://kabutan.jp/warning/?mode=3_2" },
    { id: 'm11', title: "移動平均線上昇トレンド銘柄", url: "https://kabutan.jp/tansaku/?mode=2_0262" },
    { id: 'm12', title: "25日線マイナスカイリ -10%以上", url: "https://kabutan.jp/tansaku/?mode=2_0278" },
    { id: 'm13', title: "出来高急増銘柄", url: "https://kabutan.jp/tansaku/?mode=2_0311" },
  ];

  const [marketLinks, setMarketLinks] = useState<MarketLink[]>(() => {
    const saved = localStorage.getItem('knav_market_links');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return defaultMarketLinks;
  });

  useEffect(() => {
    localStorage.setItem('knav_market_links', JSON.stringify(marketLinks));
  }, [marketLinks]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSidebar) return;
      e.preventDefault();
      if (sidebarPos === 'right') {
        setSidebarWidth(Math.max(200, Math.min(window.innerWidth - e.clientX, 600)));
      } else {
        setSidebarWidth(Math.max(200, Math.min(e.clientX, 600)));
      }
    };
    const handleMouseUp = () => {
      setIsDraggingSidebar(false);
    };

    if (isDraggingSidebar) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSidebar, sidebarPos]);

  const fetchAllPrices = async (categoryId?: string) => {
    if (isFetchingAll) return;
    setIsFetchingAll(true);
    
    const allStocks = categoryId 
        ? (categoryId === 'UNASSIGNED' ? stocks.filter(s => !s.categoryId) : stocks.filter(s => s.categoryId === categoryId))
        : [...stocks];
        
    setFetchProgress({ current: 0, total: allStocks.length });
    
    for (let i = 0; i < allStocks.length; i++) {
        const st = allStocks[i];
        try {
            const res = await fetch(`${API_BASE}/api/fetch-price?code=${encodeURIComponent(st.code)}`);
            if (res.ok) {
                const data = await res.json();
                const price = data.price;
                if (price && price !== '?') {
                    // Update Local Storage for Tampermonkey compatibility
                    localStorage.setItem('KNAV_SX_CLOSE_' + st.code, JSON.stringify({
                        price: price,
                        date: new Date().toLocaleDateString('ja-JP')
                    }));
                }
                setStocks(prev => prev.map(s => s.id === st.id ? { 
                    ...s, 
                    price: price, 
                    priceUpdatedAt: Date.now() 
                } : s));
            }
        } catch (error) {
            console.error(error);
        }
        setFetchProgress((prev) => ({ ...prev, current: i + 1 }));
        await new Promise(r => setTimeout(r, 800)); // sleep to prevent server overload
    }
    
    setIsFetchingAll(false);
    setTimeout(() => setFetchProgress({ current: 0, total: 0 }), 3000);
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('knav_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('knav_font_type', fontType);
  }, [fontType]);

  useEffect(() => {
    localStorage.setItem('knav_language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('knav_categories_v2', JSON.stringify(categories));
  }, [categories]);

  useEffect(() => {
    localStorage.setItem('knav_stocks_v2', JSON.stringify(stocks));
  }, [stocks]);

  const addCategory = (name: string) => {
    const newCategory = { id: Date.now().toString(), name };
    setCategories([...categories, newCategory]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    setStocks(stocks.map(st => st.categoryId === id ? { ...st, categoryId: '' } : st));
    if (activeCategoryId === id) {
      setActiveCategoryId(null);
    }
  };

  const moveCategory = (id: string, direction: 'up' | 'down') => {
    setCategories(prev => {
      const idx = prev.findIndex(c => c.id === id);
      if (idx < 0) return prev;
      const newCats = [...prev];
      const item = newCats.splice(idx, 1)[0];
      if (direction === 'up' && idx > 0) {
        newCats.splice(idx - 1, 0, item);
      } else if (direction === 'down' && idx < prev.length - 1) {
        newCats.splice(idx + 1, 0, item);
      } else {
        newCats.splice(idx, 0, item);
      }
      return newCats;
    });
  };

  const addStocks = (items: {code: string, name: string, categoryId: string}[]) => {
    const newStocks = items.map((item, index) => ({
      id: Date.now().toString() + index,
      ...item,
      createdAt: Date.now()
    }));
    setStocks([...newStocks, ...stocks]);
  };
  
  const deleteStocks = (ids: string[]) => {
    setStocks(stocks.filter(st => !ids.includes(st.id)));
  };

  const moveStocksToCategory = (ids: string[], newCategoryId: string) => {
    setStocks(prev => prev.map(s => ids.includes(s.id) ? { ...s, categoryId: newCategoryId } : s));
  };

  const updateStock = (id: string, updates: Partial<Stock>) => {
    setStocks(stocks.map(st => st.id === id ? { ...st, ...updates } : st));
  };

  const moveStock = (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => {
    setStocks(prev => {
      const currentListIds = activeCategoryId 
        ? prev.filter(st => st.categoryId === activeCategoryId).map(s => s.id)
        : prev.map(s => s.id);
      
      const localIdx = currentListIds.indexOf(id);
      if (localIdx < 0) return prev;
      
      const newStocks = [...prev];
      const globalIdx = newStocks.findIndex(s => s.id === id);
      const item = newStocks.splice(globalIdx, 1)[0];
      
      if (direction === 'up' && localIdx > 0) {
        const targetId = currentListIds[localIdx - 1];
        const targetGlobalIdx = newStocks.findIndex(s => s.id === targetId);
        newStocks.splice(targetGlobalIdx, 0, item);
      } else if (direction === 'down' && localIdx < currentListIds.length - 1) {
        const targetId = currentListIds[localIdx + 1];
        const targetGlobalIdx = newStocks.findIndex(s => s.id === targetId);
        newStocks.splice(targetGlobalIdx + 1, 0, item);
      } else if (direction === 'top') {
        const firstIdTarget = currentListIds[0];
        if (firstIdTarget === id) {
            newStocks.splice(globalIdx, 0, item);
        } else {
            const targetGlobalIdx = newStocks.findIndex(s => s.id === firstIdTarget);
            newStocks.splice(Math.max(0, targetGlobalIdx), 0, item);
        }
      } else if (direction === 'bottom') {
        const lastIdTarget = currentListIds[currentListIds.length - 1];
        if (lastIdTarget === id) {
           newStocks.splice(globalIdx, 0, item);
        } else {
           const targetGlobalIdx = newStocks.findIndex(s => s.id === lastIdTarget);
           newStocks.splice(targetGlobalIdx + 1, 0, item);
        }
      } else {
        newStocks.splice(globalIdx, 0, item);
      }
      return newStocks;
    });
  };

  const handleExportJson = () => {
    const bbHistory: Record<string, any> = {};
    const closeCache: Record<string, any> = {};
    const memoCache: Record<string, any> = {};
    const bwpCache: Record<string, any> = {};

    stocks.forEach(s => {
      try { const h = JSON.parse(localStorage.getItem('KNAV_SX_HIST_' + s.code) || 'null'); if (h) bbHistory[s.code] = h; } catch (e) {}
      try { const c = JSON.parse(localStorage.getItem('KNAV_SX_CLOSE_' + s.code) || 'null'); if (c) closeCache[s.code] = c; } catch (e) {}
      try { const m = JSON.parse(localStorage.getItem('KNAV_SX_MEMO_' + s.code) || 'null'); if (m) memoCache[s.code] = m; } catch (e) {}
      try { const b = JSON.parse(localStorage.getItem('KNAV_SX_BWP_' + s.code) || 'null'); if (b) bwpCache[s.code] = b; } catch (e) {}
    });

    const groups = categories.map(c => ({
      id: c.id,
      name: c.name,
      stocks: stocks.filter(st => st.categoryId === c.id).map(st => ({ code: st.code, name: st.name })),
      collapsed: false
    }));

    const dataToExport = {
      groups,
      bbHistory,
      closeCache,
      memoCache,
      bwpCache,
      categories,
      stocks,
      marketLinks,
      exportedAt: new Date().toLocaleString('ja-JP'),
      version: 'Simple-X-Web'
    };

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knav_simple_${new Date().getTime()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (content: string) => {
    try {
      const data = JSON.parse(content);
      
      // Import Tampermonkey caches
      if (data.bbHistory) Object.keys(data.bbHistory).forEach(c => localStorage.setItem('KNAV_SX_HIST_' + c, JSON.stringify(data.bbHistory[c])));
      if (data.closeCache) Object.keys(data.closeCache).forEach(c => localStorage.setItem('KNAV_SX_CLOSE_' + c, JSON.stringify(data.closeCache[c])));
      if (data.memoCache) Object.keys(data.memoCache).forEach(c => localStorage.setItem('KNAV_SX_MEMO_' + c, JSON.stringify(data.memoCache[c])));
      if (data.bwpCache) Object.keys(data.bwpCache).forEach(c => localStorage.setItem('KNAV_SX_BWP_' + c, JSON.stringify(data.bwpCache[c])));
      if (data.manualBwp) Object.keys(data.manualBwp).forEach(c => localStorage.setItem('KNAV_SX_BWP_' + c, JSON.stringify(data.manualBwp[c])));
      if (data.marketLinks) setMarketLinks(data.marketLinks);

      if (data.categories && data.stocks && !Array.isArray(data.groups)) {
        setCategories(data.categories);
        setStocks(data.stocks);
      } else if (data.groups && Array.isArray(data.groups)) {
        const newCategories: Category[] = [];
        const newStocks: Stock[] = [];
        data.groups.forEach((g: any) => {
          newCategories.push({ id: g.id, name: g.name });
          if (Array.isArray(g.stocks)) {
            g.stocks.forEach((s: any, index: number) => {
              let priceStr = undefined;
              if (data.closeCache && data.closeCache[s.code]) {
                  priceStr = data.closeCache[s.code]?.price;
              }
              newStocks.push({
                id: `${g.id}_${s.code}`,
                code: s.code,
                name: s.name,
                categoryId: g.id,
                price: priceStr,
                createdAt: Date.now() + index
              });
            });
          }
        });
        setCategories(newCategories);
        setStocks(newStocks);
      } else {
        console.error("Unsupported JSON format");
      }
    } catch (e) {
      console.error("Failed to parse JSON");
    }
  };

  const handleResetData = () => {
    if (window.confirm(i18n[language].confirmReset)) {
      setCategories(initialGroups.map(g => ({ id: g.id, name: g.name })));
      const initialStocks: Stock[] = [];
      initialGroups.forEach(g => {
        g.stocks.forEach((s, index) => {
          initialStocks.push({
            id: `${g.id}_${s.code}`,
            code: s.code,
            name: s.name,
            categoryId: g.id,
            createdAt: Date.now() + index
          });
        });
      });
      setStocks(initialStocks);
    }
  };

  const filteredStocks = activeCategoryId === 'UNASSIGNED'
    ? stocks.filter(st => !st.categoryId)
    : activeCategoryId 
      ? stocks.filter(st => st.categoryId === activeCategoryId)
      : stocks;

  if (isCompactMode) {
    return (
      <div className={`font-type-${fontType}`}>
        <CompactView
          categories={categories}
          stocks={filteredStocks}
          totalStocks={stocks.length}
          marketLinks={marketLinks}
          activeCategory={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          language={language}
          onToggleMode={() => setIsCompactMode(false)}
        />
      </div>
    );
  }

  return (
    <div className={`font-type-${fontType} min-h-screen bg-base-bg flex flex-col ${sidebarPos === 'right' ? 'md:flex-row-reverse' : 'md:flex-row'} text-[10px] md:text-xs uppercase tracking-wider relative h-screen overflow-hidden`}>
      <div style={{ width: sidebarWidth }} className={`shrink-0 md:flex flex-col ${sidebarPos === 'right' ? 'border-l' : 'border-r'} border-border-main hidden z-10 relative h-full`}>
        <Sidebar 
          categories={categories} 
          stocksLength={stocks.length}
          onAddCategory={addCategory} 
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onMoveCategory={moveCategory}
          activeCategory={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          language={language}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onFetchAll={() => fetchAllPrices()}
          onFetchCategory={(id) => fetchAllPrices(id)}
          onResetData={handleResetData}
          isFetchingAll={isFetchingAll}
          fetchProgress={fetchProgress}
          fontSize={fontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
        />
        <div 
           className={`absolute top-0 ${sidebarPos === 'right' ? 'left-0 -ml-1' : 'right-0'} w-2 h-full cursor-col-resize hover:bg-border-light/30 active:bg-border-light/50 transition-colors z-20`}
           onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSidebar(true);
           }}
        />
      </div>
      {/* Mobile Sidebar */}
      <div className="md:hidden block">
        <Sidebar 
          categories={categories} 
          stocksLength={stocks.length}
          onAddCategory={addCategory} 
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onMoveCategory={moveCategory}
          activeCategory={activeCategoryId}
          onSelectCategory={setActiveCategoryId}
          language={language}
          onExportJson={handleExportJson}
          onImportJson={handleImportJson}
          onFetchAll={() => fetchAllPrices()}
          onFetchCategory={(id) => fetchAllPrices(id)}
          onResetData={handleResetData}
          isFetchingAll={isFetchingAll}
          fetchProgress={fetchProgress}
          fontSize={fontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
        />
      </div>

      <main className="flex-1 p-4 md:p-6 flex flex-col gap-6 max-h-screen overflow-hidden">
        <Header 
          theme={theme} 
          onThemeChange={setTheme}
          fontType={fontType}
          onFontTypeChange={setFontType}
          language={language} 
          onLanguageChange={setLanguage} 
          sidebarPos={sidebarPos}
          onSidebarPosChange={setSidebarPos}
          fontSize={fontSize}
          onFontSizeChange={setFontSize}
          onToggleCompactMode={() => setIsCompactMode(true)}
        />
        <AddStockForm categories={categories} onAdd={addStocks} language={language} />
        <StockList 
          stocks={filteredStocks} 
          categories={categories} 
          onDelete={deleteStocks} 
          onUpdate={updateStock}
          onMoveStock={moveStock}
          onMoveStocksToCategory={moveStocksToCategory}
          language={language} 
          fontSize={fontSize}
        />
      </main>
    </div>
  );
}

