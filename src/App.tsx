import { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import AddStockForm from './components/AddStockForm';
import StockList from './components/StockList';
import Header from './components/Header';
import CompactView from './components/CompactView';
import MarketDataView from './components/MarketDataView';
import { Category, Stock, MarketLink } from './types';
import { Language, i18n } from './i18n';
import { initialGroups } from './data';
import { initialData } from './importData';
import { enrichedPreset } from './data/enrichedPreset';
import { getAllDescendantCategoryIds } from './lib/categoryUtils';

export type Theme = 'light' | 'dark' | 'black';
export type FontType = 'mono' | 'gothic' | 'meiryo' | 'maru';

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('knav_theme') as Theme) || 'black'
  );

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

  const [listFontSize, setListFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('knav_list_font_size') || localStorage.getItem('knav_font_size') || '13')
  );

  const [stockFontSize, setStockFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('knav_stock_font_size') || '16')
  );

  const [priceFontSize, setPriceFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('knav_price_font_size') || '16')
  );

  const [priceColor, setPriceColor] = useState<string>(
    () => {
      const saved = localStorage.getItem('knav_price_color');
      return saved === 'red' ? 'red' : 'default';
    }
  );

  useEffect(() => {
    localStorage.setItem('knav_sidebar_pos', sidebarPos);
  }, [sidebarPos]);

  useEffect(() => {
    localStorage.setItem('knav_list_font_size', listFontSize.toString());
  }, [listFontSize]);

  useEffect(() => {
    localStorage.setItem('knav_stock_font_size', stockFontSize.toString());
  }, [stockFontSize]);

  useEffect(() => {
    localStorage.setItem('knav_price_font_size', priceFontSize.toString());
  }, [priceFontSize]);

  useEffect(() => {
    localStorage.setItem('knav_price_color', priceColor);
  }, [priceColor]);

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

  // Safeguard: if activeCategoryId is set but no longer exists in categories, fallback to null (ALL DATA)
  useEffect(() => {
    if (activeCategoryId && activeCategoryId !== 'MARKET_DATA' && activeCategoryId !== 'MARKET_LINKS' && activeCategoryId !== 'UNASSIGNED') {
      const exists = categories.some(c => c.id === activeCategoryId);
      if (!exists) {
        setActiveCategoryId(null);
      }
    }
  }, [categories, activeCategoryId]);

  const [isFetchingAll, setIsFetchingAll] = useState(false);
  const [fetchProgress, setFetchProgress] = useState({ current: 0, total: 0 });
  const [refreshingCode, setRefreshingCode] = useState<string | null>(null);
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

  const fetchSinglePrice = async (code: string) => {
    if (refreshingCode) return;
    setRefreshingCode(code);
    try {
      const res = await fetch(`/api/fetch-price?code=${encodeURIComponent(code)}`);
      if (res.ok) {
        const data = await res.json();
        const price = data.price;
        if (price && price !== '?') {
          localStorage.setItem('KNAV_SX_CLOSE_' + code, JSON.stringify({
            price: price,
            date: new Date().toLocaleDateString('ja-JP')
          }));
          setStocks(prev => prev.map(s => s.code === code ? { 
            ...s, 
            price: price, 
            priceUpdatedAt: Date.now() 
          } : s));
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshingCode(null);
    }
  };

  const fetchAllPrices = async (categoryId?: string) => {
    if (isFetchingAll) return;
    setIsFetchingAll(true);
    
    const allStocks = categoryId 
        ? (categoryId === 'UNASSIGNED' ? stocks.filter(s => !s.categoryId) : stocks.filter(s => s.categoryId === categoryId))
        : [...stocks];
        
    setFetchProgress({ current: 0, total: allStocks.length });
    
    // Concurrency pool (batch of 3 parallel requests for smooth & fast fetching)
    const BATCH_SIZE = 3;
    for (let i = 0; i < allStocks.length; i += BATCH_SIZE) {
      const batch = allStocks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (st) => {
        try {
          const res = await fetch(`/api/fetch-price?code=${encodeURIComponent(st.code)}`);
          if (res.ok) {
            const data = await res.json();
            const price = data.price;
            if (price && price !== '?') {
              localStorage.setItem('KNAV_SX_CLOSE_' + st.code, JSON.stringify({
                price: price,
                date: new Date().toLocaleDateString('ja-JP')
              }));
              setStocks(prev => prev.map(s => s.id === st.id ? { 
                ...s, 
                price: price, 
                priceUpdatedAt: Date.now() 
              } : s));
            }
          }
        } catch (error) {
          console.error(error);
        }
      }));
      
      setFetchProgress({ current: Math.min(i + batch.length, allStocks.length), total: allStocks.length });
      // Shorter, gentle sleep between small batches
      await new Promise(r => setTimeout(r, 250));
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

  const addCategory = (name: string, parentId?: string | null) => {
    const newCategory: Category = { 
      id: Date.now().toString(), 
      name, 
      parentId: parentId || null 
    };
    setCategories(prev => [...prev, newCategory]);
  };

  const updateCategory = (id: string, name: string) => {
    setCategories(categories.map(c => c.id === id ? { ...c, name } : c));
  };

  const deleteCategory = (id: string) => {
    setCategories(prev => prev
      .filter(c => c.id !== id)
      .map(c => c.parentId === id ? { ...c, parentId: null } : c)
    );
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
      stocks: stocks.filter(st => st.categoryId === c.id).map(st => ({ code: st.code, name: st.name, description: st.description })),
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

  const handleDownloadEnrichedJson = () => {
    const blob = new Blob([JSON.stringify(enrichedPreset, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'k-navigator-enriched.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

      let loadedCategories: Category[] = [];
      let loadedStocks: Stock[] = [];

      if (Array.isArray(data.categories) && Array.isArray(data.stocks) && data.categories.length > 0) {
        loadedCategories = data.categories;
        loadedStocks = data.stocks.map((s: any) => ({
          ...s,
          description: s.description || s.memo || undefined,
          price: s.price || (data.closeCache && data.closeCache[s.code] ? data.closeCache[s.code]?.price : undefined)
        }));
      } else if (data.groups && Array.isArray(data.groups)) {
        data.groups.forEach((g: any) => {
          loadedCategories.push({ id: g.id, name: g.name, parentId: g.parentId || undefined });
          if (Array.isArray(g.stocks)) {
            g.stocks.forEach((s: any, index: number) => {
              let priceStr = undefined;
              if (data.closeCache && data.closeCache[s.code]) {
                priceStr = data.closeCache[s.code]?.price;
              }
              loadedStocks.push({
                id: s.id || `${g.id}_${s.code}`,
                code: s.code,
                name: s.name,
                categoryId: g.id,
                price: s.price || priceStr,
                description: s.description || s.memo || undefined,
                createdAt: s.createdAt || (Date.now() + index)
              });
            });
          }
        });
      }

      if (loadedCategories.length > 0 || loadedStocks.length > 0) {
        setCategories(loadedCategories);
        setStocks(loadedStocks);
        setActiveCategoryId(null);
        alert(`${loadedCategories.length}個のフォルダー、${loadedStocks.length}件の銘柄データを正常に読み込みました。`);
      } else {
        alert('読み込み可能な銘柄データが見つかりませんでした。JSONの形式をご確認ください。');
      }
    } catch (e) {
      console.error("Failed to parse JSON", e);
      alert('JSONファイルの解析に失敗しました。ファイルが破損していないか確認してください。');
    }
  };

  const handleLoadEnrichedPreset = () => {
    try {
      setCategories(enrichedPreset.categories);
      setStocks(enrichedPreset.stocks);
      setActiveCategoryId(null);
      alert(`初期プリセット（228銘柄・概要付き、${enrichedPreset.categories.length}フォルダー）を正常に復元しました。`);
    } catch (e) {
      console.error("Failed to restore preset", e);
      alert('228銘柄概要付きデータの復元に失敗しました');
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
      setActiveCategoryId(null);
    }
  };

  const filteredStocks = useMemo(() => {
    if (!activeCategoryId || activeCategoryId === 'MARKET_DATA' || activeCategoryId === 'MARKET_LINKS') return stocks;
    if (activeCategoryId === 'UNASSIGNED') return stocks.filter(st => !st.categoryId);
    const targetIds = new Set([activeCategoryId, ...getAllDescendantCategoryIds(activeCategoryId, categories)]);
    return stocks.filter(st => st.categoryId && targetIds.has(st.categoryId));
  }, [stocks, activeCategoryId, categories]);

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
          priceFontSize={priceFontSize}
          priceColor={priceColor}
          theme={theme}
          fontSize={listFontSize}
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
          stocks={stocks}
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
          listFontSize={listFontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
          onLoadEnrichedData={handleLoadEnrichedPreset}
          onDownloadEnrichedData={handleDownloadEnrichedJson}
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
          stocks={stocks}
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
          listFontSize={listFontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
          onLoadEnrichedData={handleLoadEnrichedPreset}
          onDownloadEnrichedData={handleDownloadEnrichedJson}
        />
      </div>

      <main className="flex-1 p-3 md:p-4 flex flex-col gap-3 md:gap-4 max-h-screen overflow-hidden">
        <Header 
          theme={theme} 
          onThemeChange={setTheme}
          fontType={fontType}
          onFontTypeChange={setFontType}
          language={language} 
          onLanguageChange={setLanguage} 
          sidebarPos={sidebarPos}
          onSidebarPosChange={setSidebarPos}
          listFontSize={listFontSize}
          onListFontSizeChange={setListFontSize}
          stockFontSize={stockFontSize}
          onStockFontSizeChange={setStockFontSize}
          priceFontSize={priceFontSize}
          onPriceFontSizeChange={setPriceFontSize}
          priceColor={priceColor}
          onPriceColorChange={setPriceColor}
          onToggleCompactMode={() => setIsCompactMode(true)}
        />
        {activeCategoryId === 'MARKET_DATA' ? (
          <MarketDataView
            links={marketLinks}
            onUpdateLinks={setMarketLinks}
            onBackToStocks={() => setActiveCategoryId(null)}
            language={language}
            theme={theme}
            fontSize={listFontSize}
          />
        ) : (
          <>
            <AddStockForm categories={categories} onAdd={addStocks} language={language} />
            <StockList 
              stocks={filteredStocks} 
              categories={categories} 
              activeCategory={activeCategoryId}
              onSelectCategory={setActiveCategoryId}
              onDelete={deleteStocks} 
              onUpdate={updateStock}
              onMoveStock={moveStock}
              onMoveStocksToCategory={moveStocksToCategory}
              onAddCategory={addCategory}
              onRefreshPrice={fetchSinglePrice}
              refreshingCode={refreshingCode}
              language={language} 
              listFontSize={listFontSize}
              stockFontSize={stockFontSize}
              priceFontSize={priceFontSize}
              priceColor={priceColor}
              theme={theme}
            />
          </>
        )}
      </main>
    </div>
  );
}

