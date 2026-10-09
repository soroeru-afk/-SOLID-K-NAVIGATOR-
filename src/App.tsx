import { useState, useEffect, useMemo, useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';
import Sidebar from './components/Sidebar';
import AddStockForm from './components/AddStockForm';
import StockList from './components/StockList';
import Header from './components/Header';
import CompactView from './components/CompactView';
import MarketDataView from './components/MarketDataView';
import { Category, Stock, MarketLink, FolderColor } from './types';
import { Language, i18n } from './i18n';
import { initialGroups } from './data';
import { initialData } from './importData';
import { enrichedPreset } from './data/enrichedPreset';
import { getAllDescendantCategoryIds } from './lib/categoryUtils';
import { safeFetch } from './lib/apiUtils';

export type Theme = 'light' | 'dark' | 'black' | 'red';
export type FontType = 'mono' | 'gothic' | 'meiryo' | 'maru';

export default function App() {
  const [theme, setTheme] = useState<Theme>(
    () => {
      const saved = localStorage.getItem('knav_theme') as Theme;
      return (saved === 'light' || saved === 'dark' || saved === 'black' || saved === 'red') ? saved : 'black';
    }
  );

  useEffect(() => {
    localStorage.setItem('knav_theme', theme);
    document.documentElement.setAttribute('data-theme', theme);

    // Dynamic meta theme-color sync for browser header/titlebar (matching sidebar background base-bg)
    let themeColorHex = '#0a0d12'; // default black
    if (theme === 'dark') themeColorHex = '#0d131f';
    else if (theme === 'red') themeColorHex = '#0d0404';
    else if (theme === 'light') themeColorHex = '#e2e8f0';

    let metaTheme = document.querySelector('meta[name="theme-color"]');
    if (!metaTheme) {
      metaTheme = document.createElement('meta');
      metaTheme.setAttribute('name', 'theme-color');
      document.head.appendChild(metaTheme);
    }
    metaTheme.setAttribute('content', themeColorHex);
  }, [theme]);

  const [fontType, setFontType] = useState<FontType>(
    () => (localStorage.getItem('knav_font_type') as FontType) || 'gothic'
  );

  const [isCompactMode, setIsCompactMode] = useState<boolean>(() => {
    return localStorage.getItem('knav_compact_mode') === 'true';
  });

  const lastFullWindowSizeRef = useRef<{ width: number; height: number }>({
    width: window.outerWidth || 1280,
    height: window.outerHeight || 800
  });

  useEffect(() => {
    localStorage.setItem('knav_compact_mode', String(isCompactMode));

    // Handle desktop Chrome PWA window resizing (similar to Solid Audio Music Player mini panel)
    if (typeof window !== 'undefined' && 'resizeTo' in window) {
      try {
        if (isCompactMode) {
          // Save current full window dimensions before shrinking
          if (window.outerWidth > 550) {
            lastFullWindowSizeRef.current = {
              width: window.outerWidth,
              height: window.outerHeight
            };
            localStorage.setItem('knav_last_full_win_size', JSON.stringify(lastFullWindowSizeRef.current));
          }
          // Restore user's saved compact window height if previously resized
          const savedCompactH = localStorage.getItem('knav_compact_win_height');
          let targetH = 850;
          if (savedCompactH) {
            const parsedH = parseInt(savedCompactH, 10);
            if (!isNaN(parsedH) && parsedH >= 400 && parsedH <= 2000) {
              targetH = parsedH;
            }
          } else if (window.screen.availHeight) {
            targetH = Math.max(750, Math.min(window.screen.availHeight - 60, 950));
          }
          window.resizeTo(450, targetH);
        } else {
          // Save compact height before switching back to full mode
          if (window.outerWidth <= 550 && window.outerHeight >= 300) {
            localStorage.setItem('knav_compact_win_height', String(window.outerHeight));
          }
          // Restore full window dimensions
          const savedFull = localStorage.getItem('knav_last_full_win_size');
          let restoreW = lastFullWindowSizeRef.current.width;
          let restoreH = lastFullWindowSizeRef.current.height;
          if (savedFull) {
            try {
              const parsed = JSON.parse(savedFull);
              if (parsed.width && parsed.width > 550) restoreW = parsed.width;
              if (parsed.height && parsed.height > 400) restoreH = parsed.height;
            } catch(e){}
          }
          window.resizeTo(Math.max(1000, restoreW), Math.max(650, restoreH));
        }
      } catch (e) {
        // Ignored if browser restricts resizeTo
      }
    }
  }, [isCompactMode]);

  // Continuously record user manual window height adjustments in compact mode
  useEffect(() => {
    if (!isCompactMode) return;
    const handleResize = () => {
      if (window.outerHeight >= 300) {
        localStorage.setItem('knav_compact_win_height', String(window.outerHeight));
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
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

  const [memoFontSize, setMemoFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('KNAV_DETAIL_FONT_SIZE') || '14')
  );

  const [limitFontSize, setLimitFontSize] = useState<number>(
    () => parseInt(localStorage.getItem('knav_limit_font_size') || '11')
  );

  const [priceColor, setPriceColor] = useState<string>(
    () => {
      const saved = localStorage.getItem('knav_price_color');
      return saved === 'red' ? 'red' : 'default';
    }
  );

  const [folderColor, setFolderColor] = useState<FolderColor>(
    () => {
      const saved = localStorage.getItem('knav_folder_color') as FolderColor;
      const validColors: FolderColor[] = ['amber', 'blue', 'white', 'black', 'gray', 'theme'];
      return validColors.includes(saved) ? saved : 'theme';
    }
  );

  useEffect(() => {
    localStorage.setItem('knav_folder_color', folderColor);
  }, [folderColor]);

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
    localStorage.setItem('KNAV_DETAIL_FONT_SIZE', memoFontSize.toString());
  }, [memoFontSize]);

  useEffect(() => {
    localStorage.setItem('knav_limit_font_size', limitFontSize.toString());
  }, [limitFontSize]);

  useEffect(() => {
    localStorage.setItem('knav_price_color', priceColor);
  }, [priceColor]);

  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
    const descMap = new Map<string, string>();
    enrichedPreset.stocks.forEach(s => {
      if (s.description && s.description.trim()) {
        descMap.set(s.code, s.description);
      }
    });

    const saved = localStorage.getItem('knav_stocks_v2');
    if (saved) {
        try { 
            const parsed = JSON.parse(saved);
            return parsed.map((s: Stock) => {
                const c = localStorage.getItem('KNAV_SX_CLOSE_' + s.code);
                if (c) {
                    try { const cv = JSON.parse(c); if(cv.price) s.price = cv.price; } catch(e){}
                }
                if (!s.description || !s.description.trim()) {
                  const defaultDesc = descMap.get(s.code);
                  if (defaultDesc) {
                    s.description = defaultDesc;
                  }
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
          description: s.description || descMap.get(s.code) || '',
          createdAt: Date.now() + index
        });
      });
    });
    return initialStocks;
  });

  // Auto-fill missing descriptions for all registered stocks from enrichedPreset
  useEffect(() => {
    const descMap = new Map<string, string>();
    enrichedPreset.stocks.forEach(s => {
      if (s.description && s.description.trim()) {
        descMap.set(s.code, s.description);
      }
    });

    let hasChange = false;
    const filledStocks = stocks.map(st => {
      if (!st.description || !st.description.trim()) {
        const d = descMap.get(st.code);
        if (d) {
          hasChange = true;
          return { ...st, description: d };
        }
      }
      return st;
    });

    if (hasChange) {
      setStocks(filledStocks);
      try {
        localStorage.setItem('knav_stocks_v2', JSON.stringify(filledStocks));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);
  
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
  const cancelFetchRef = useRef(false);
  const [refreshingCode, setRefreshingCode] = useState<string | null>(null);

  const handleStopFetch = () => {
    if (isFetchingAll) {
      cancelFetchRef.current = true;
    }
  };
  const [isDraggingSidebar, setIsDraggingSidebar] = useState(false);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem('knav_sidebar_width');
    const parsed = saved ? parseInt(saved, 10) : 370;
    return (!isNaN(parsed) && parsed >= 200 && parsed <= 600) ? parsed : 370;
  });

  const lastSidebarWidthRef = useRef<number>(sidebarWidth);

  useEffect(() => {
    if (!isCompactMode && sidebarWidth >= 200) {
      lastSidebarWidthRef.current = sidebarWidth;
      localStorage.setItem('knav_sidebar_width', String(sidebarWidth));
    }
  }, [sidebarWidth, isCompactMode]);

  const defaultMarketLinks: MarketLink[] = [
    { id: 'm0', title: "市場ニュース（総合）", url: "https://kabutan.jp/news/marketnews/" },
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
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // If the user's saved list doesn't have 市場ニュース（総合）, insert it at the top
          const hasM0 = parsed.some((l: MarketLink) => l.id === 'm0' || l.title === '市場ニュース（総合）');
          if (!hasM0) {
            return [
              { id: 'm0', title: '市場ニュース（総合）', url: 'https://kabutan.jp/news/marketnews/' },
              ...parsed
            ];
          }
          return parsed;
        }
      } catch(e) {}
    }
    return (enrichedPreset.marketLinks && enrichedPreset.marketLinks.length > 0)
      ? enrichedPreset.marketLinks
      : defaultMarketLinks;
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

  const getPriceFetchUrl = (code: string) => {
    const customUrl = localStorage.getItem('KNAV_CUSTOM_API_URL')?.trim();
    if (customUrl) {
      return customUrl.includes('?') 
        ? `${customUrl}&code=${encodeURIComponent(code)}`
        : `${customUrl}?code=${encodeURIComponent(code)}`;
    }
    return `/api/fetch-price?code=${encodeURIComponent(code)}`;
  };

  const fetchSinglePrice = async (code: string) => {
    if (refreshingCode) return;

    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const customUrl = localStorage.getItem('KNAV_CUSTOM_API_URL')?.trim();

    if (isGitHubPages && !customUrl) {
      alert(
        `【GitHub Pages環境での株価取得について】\n` +
        `GitHub Pagesは静的サイトのため、バックエンドサーバー（/api/fetch-price）が存在しません。\n\n` +
        `以下のいずれかの方法をご利用ください：\n\n` +
        `①【最も簡単・推奨】\nAI Studioのプレビュー画面で株価を一括取得（FETCH ALL）し、「JSONエクスポート」したファイルを、このPWAで「JSONインポート」する。\n\n` +
        `②【直接取得したい場合】\nサイドバーの「外部株価API設定 (GitHub Pages用)」から、無料のGoogle Apps Script (GAS) 等のプロキシURLを設定する。`
      );
      return;
    }

    setRefreshingCode(code);
    try {
      const url = getPriceFetchUrl(code);
      const res = await safeFetch(url, {
        headers: { 'Accept': 'application/json' }
      }, 10000);
      
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text();
        if (text.includes('__cookie_check') || text.includes('302 Found')) {
          alert(`【セッション確認】銘柄(${code})の株価取得に失敗しました。\nセッションを更新するため、画面を一度再読み込み（リロード）してください。`);
          return;
        }
        throw new Error(`Invalid content-type: ${contentType}`);
      }

      if (res.ok) {
        const data = await res.json();
        const price = data?.price || data?.PRICE || (data?.data && (data.data.price || data.data.PRICE));
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
        } else {
          alert(`銘柄(${code})の現在値が見つかりませんでした。`);
        }
      } else {
        alert(`銘柄(${code})の株価取得に失敗しました (ステータス: ${res.status})。`);
      }
    } catch (error) {
      console.error(`Error fetching single price for ${code}:`, error);
      alert(`銘柄(${code})の通信エラーが発生しました。接続状況またはAPI設定をご確認ください。`);
    } finally {
      setRefreshingCode(null);
    }
  };

  const fetchAllPrices = async (categoryId?: string) => {
    if (isFetchingAll) return;

    const isGitHubPages = typeof window !== 'undefined' && window.location.hostname.includes('github.io');
    const customUrl = localStorage.getItem('KNAV_CUSTOM_API_URL')?.trim();

    if (isGitHubPages && !customUrl) {
      alert(
        `【GitHub Pages環境での株価取得について】\n` +
        `GitHub Pagesは静的ホスティング（静的サイト）のため、Node.jsバックエンドサーバー（/api/fetch-price）が稼働していません。\n\n` +
        `そのため、GitHub Pages単体では直接株価を取得できません。\n\n` +
        `【解決策】\n` +
        `①【推奨・最も確実】\n` +
        `AI Studioのプレビュー画面で「ALL」を押して最新株価を一括取得し、サイドバーの「JSONエクスポート」で保存したファイルを、GitHub Pages側で「JSONインポート」してください（設定不要・数秒で完了）。\n\n` +
        `②【GitHub Pagesから直接一括取得したい場合】\n` +
        `サイドバーの「外部株価API設定 (GitHub Pages用)」から、無料のGoogle Apps Script (GAS) などのプロキシURLを設定してください。`
      );
      return;
    }

    setIsFetchingAll(true);
    cancelFetchRef.current = false;
    
    const allStocks = categoryId 
        ? (categoryId === 'UNASSIGNED' ? stocks.filter(s => !s.categoryId) : stocks.filter(s => s.categoryId === categoryId))
        : [...stocks];
        
    setFetchProgress({ current: 0, total: allStocks.length });
    
    let successCount = 0;
    let failCount = 0;
    let authRequired = false;
    let isCancelled = false;

    // Concurrency pool:
    // If using custom GAS URL, use gentle settings (2 parallel, 400ms sleep) to prevent Google rate-limits.
    // If using standard local server (AI Studio), restore high-speed parallel fetching (6 parallel, 50ms sleep) for ultra-fast updates.
    const isCustom = Boolean(customUrl);
    const BATCH_SIZE = isCustom ? 2 : 6;

    for (let i = 0; i < allStocks.length; i += BATCH_SIZE) {
      if (cancelFetchRef.current) {
        isCancelled = true;
        break;
      }
      const batch = allStocks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (st) => {
        try {
          const url = getPriceFetchUrl(st.code);
          const res = await safeFetch(url, {
            headers: { 'Accept': 'application/json' }
          }, isCustom ? 7000 : 5000);

          const contentType = res.headers.get('content-type') || '';
          if (!contentType.includes('application/json')) {
            const text = await res.text();
            if (text.includes('__cookie_check') || text.includes('302 Found')) {
              authRequired = true;
            }
            failCount++;
            return;
          }

          if (res.ok) {
            const data = await res.json();
            const price = data?.price || data?.PRICE || (data?.data && (data.data.price || data.data.PRICE));
            if (price && price !== '?') {
              localStorage.setItem('KNAV_SX_CLOSE_' + st.code, JSON.stringify({
                price: price,
                date: new Date().toLocaleDateString('ja-JP')
              }));
              setStocks(prev => prev.map(s => s.code === st.code ? { 
                ...s, 
                price: price, 
                priceUpdatedAt: Date.now() 
              } : s));
              successCount++;
            } else {
              failCount++;
            }
          } else {
            failCount++;
          }
        } catch (error) {
          console.error(`Error fetching price for ${st.code}:`, error);
          failCount++;
        }
      }));
      
      setFetchProgress({ current: Math.min(i + batch.length, allStocks.length), total: allStocks.length });
      if (cancelFetchRef.current) {
        isCancelled = true;
        break;
      }
      // Sleep between batches: 400ms for GAS to respect quota, 60ms for local AI Studio to maximize speed
      await new Promise(r => setTimeout(r, isCustom ? 400 : 60));
    }
    
    setIsFetchingAll(false);
    setTimeout(() => setFetchProgress({ current: 0, total: 0 }), 3000);

    // Provide clear, helpful outcome notification
    if (isCancelled) {
      alert(`株価取得を停止しました。（更新完了: ${successCount}件）`);
      return;
    }

    // Provide clear, helpful outcome notification
    if (allStocks.length > 0) {
      if (authRequired || successCount === 0) {
        if (isGitHubPages) {
          alert(`【GitHub Pages環境でのご案内】\n株価が取得できませんでした（成功: ${successCount}件 / 失敗: ${failCount}件）。\n\nAI Studioで株価取得してエクスポート＆インポートするか、外部API設定のURLをご確認ください。`);
        } else {
          alert(`【株価取得のご案内】\n株価の取得ができませんでした（成功: ${successCount}件 / 失敗: ${failCount}件）。\n\nセッション確認が必要な可能性があります。画面を一度再読み込み（リロード）して再試行してください。`);
        }
      } else if (failCount > 0) {
        alert(`株価の更新が完了しました。\n成功: ${successCount}件 / 取得不可: ${failCount}件`);
      } else {
        alert(`全${successCount}件の最新株価を正常に取得・更新しました。`);
      }
    }
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
    const descMap = new Map<string, string>();
    enrichedPreset.stocks.forEach(s => {
      if (s.description && s.description.trim()) {
        descMap.set(s.code, s.description);
      }
    });

    const newStocks = items.map((item, index) => ({
      id: Date.now().toString() + index,
      ...item,
      description: descMap.get(item.code) || '',
      createdAt: Date.now()
    }));
    setStocks([...newStocks, ...stocks]);
  };
  
  const deleteStocks = (ids: string[]) => {
    setStocks(stocks.filter(st => !ids.includes(st.id)));
  };

  const moveStocksToCategory = (ids: string[], newCategoryId: string) => {
    setStocks(prev => {
      const movedStocks = prev.filter(s => ids.includes(s.id));
      const targetCat = categories.find(c => c.id === newCategoryId);
      const targetName = targetCat ? targetCat.name : (newCategoryId === '' ? (language === 'EN' ? 'Unassigned' : '未分類') : '');
      
      const stockDesc = movedStocks.length === 1 
        ? `${movedStocks[0].code} ${movedStocks[0].name}` 
        : `${movedStocks.length} ${language === 'EN' ? 'stocks' : '件の銘柄'}`;
      
      setToastMessage(language === 'EN' 
        ? `Moved ${stockDesc} to "${targetName}"` 
        : `${stockDesc} を「${targetName}」に移動しました`);

      return prev.map(s => ids.includes(s.id) ? { ...s, categoryId: newCategoryId } : s);
    });
  };

  const createStockShortcuts = (sourceStockIds: string[], targetCategoryId: string) => {
    setStocks(prev => {
      const sourceStocks = prev.filter(s => sourceStockIds.includes(s.id));
      if (sourceStocks.length === 0) return prev;

      const targetCat = categories.find(c => c.id === targetCategoryId);
      const targetName = targetCat ? targetCat.name : (targetCategoryId === '' ? (language === 'EN' ? 'Unassigned' : '未分類') : '');

      const existingCodesInTarget = new Set(
        prev.filter(s => s.categoryId === targetCategoryId).map(s => s.code)
      );

      const newlyCreated: Stock[] = [];
      let skippedCount = 0;

      sourceStocks.forEach((src, idx) => {
        if (existingCodesInTarget.has(src.code)) {
          skippedCount++;
          return;
        }
        newlyCreated.push({
          id: `sc_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 6)}`,
          code: src.code,
          name: src.name,
          categoryId: targetCategoryId,
          description: src.description || '',
          price: src.price,
          priceUpdatedAt: src.priceUpdatedAt,
          createdAt: Date.now() + idx,
          isShortcut: true,
        });
        existingCodesInTarget.add(src.code);
      });

      if (newlyCreated.length === 0) {
        setToastMessage(language === 'EN'
          ? `Selected stock(s) already exist in "${targetName}"`
          : `対象の銘柄はすでに「${targetName}」に登録されています`);
        return prev;
      }

      const stockDesc = newlyCreated.length === 1 
        ? `${newlyCreated[0].code} ${newlyCreated[0].name}` 
        : `${newlyCreated.length} ${language === 'EN' ? 'stocks' : '件の銘柄'}`;

      const skipSuffix = skippedCount > 0 
        ? (language === 'EN' ? ` (${skippedCount} already existed)` : ` (${skippedCount}件は重複のためスキップ)`)
        : '';

      setToastMessage(language === 'EN'
        ? `Created shortcut for ${stockDesc} in "${targetName}"${skipSuffix}`
        : `${stockDesc} のショートカットを「${targetName}」に作成しました${skipSuffix}`);

      return [...newlyCreated, ...prev];
    });
  };

  const updateStock = (id: string, updates: Partial<Stock>) => {
    setStocks(prev => {
      const target = prev.find(st => st.id === id);
      if (!target) return prev;

      // 同一銘柄コードを持つすべての実体・ショートカットに同期する項目
      const syncFields: Partial<Stock> = {};
      if (updates.name !== undefined) syncFields.name = updates.name;
      if (updates.description !== undefined) syncFields.description = updates.description;
      if (updates.price !== undefined) syncFields.price = updates.price;
      if (updates.priceUpdatedAt !== undefined) syncFields.priceUpdatedAt = updates.priceUpdatedAt;

      return prev.map(st => {
        if (st.id === id) {
          return { ...st, ...updates };
        }
        if (st.code === target.code && Object.keys(syncFields).length > 0) {
          return { ...st, ...syncFields };
        }
        return st;
      });
    });
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

  const reorderStocks = (sourceIds: string[], targetId: string, position: 'before' | 'after' = 'before') => {
    if (!sourceIds.length || sourceIds.includes(targetId)) return;
    setStocks(prev => {
      const itemsToMove = prev.filter(s => sourceIds.includes(s.id));
      if (itemsToMove.length === 0) return prev;
      const remaining = prev.filter(s => !sourceIds.includes(s.id));
      
      let targetIdx = remaining.findIndex(s => s.id === targetId);
      if (targetIdx < 0) {
        return [...remaining, ...itemsToMove];
      }
      if (position === 'after') {
        targetIdx += 1;
      }
      remaining.splice(targetIdx, 0, ...itemsToMove);
      return remaining;
    });
  };

  const reorderCategory = (sourceId: string, targetId: string, position: 'before' | 'after' = 'before') => {
    if (sourceId === targetId) return;
    setCategories(prev => {
      const newCats = [...prev];
      const sourceIdx = newCats.findIndex(c => c.id === sourceId);
      if (sourceIdx < 0) return prev;
      const [moved] = newCats.splice(sourceIdx, 1);
      
      let targetIdx = newCats.findIndex(c => c.id === targetId);
      if (targetIdx < 0) return prev;
      if (position === 'after') {
        targetIdx += 1;
      }
      newCats.splice(targetIdx, 0, moved);
      return newCats;
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
    const dataToExport = {
      groups: enrichedPreset.groups,
      bbHistory: enrichedPreset.bbHistory || {},
      closeCache: enrichedPreset.closeCache || {},
      memoCache: enrichedPreset.memoCache || {},
      bwpCache: enrichedPreset.bwpCache || {},
      categories: enrichedPreset.categories,
      stocks: enrichedPreset.stocks,
      marketLinks: (enrichedPreset.marketLinks && enrichedPreset.marketLinks.length > 0)
        ? enrichedPreset.marketLinks
        : (marketLinks.length > 0 ? marketLinks : defaultMarketLinks),
      exportedAt: new Date().toLocaleString('ja-JP'),
      version: 'Simple-X-Web'
    };
    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `knav_enriched_latest_${enrichedPreset.stocks.length}stocks.json`;
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
      if (data.marketLinks && Array.isArray(data.marketLinks) && data.marketLinks.length > 0) {
        setMarketLinks(data.marketLinks);
      }

      let loadedCategories: Category[] = [];
      let loadedStocks: Stock[] = [];

      const groupStocksCount = Array.isArray(data.groups) 
        ? data.groups.reduce((acc: number, g: any) => acc + (Array.isArray(g.stocks) ? g.stocks.length : 0), 0)
        : 0;
      const directStocksCount = Array.isArray(data.stocks) ? data.stocks.length : 0;

      if (directStocksCount >= groupStocksCount && directStocksCount > 0 && Array.isArray(data.categories) && data.categories.length > 0) {
        loadedCategories = data.categories;
        loadedStocks = data.stocks.map((s: any) => ({
          ...s,
          description: s.description || s.memo || undefined,
          price: s.price || (data.closeCache && data.closeCache[s.code] ? data.closeCache[s.code]?.price : undefined)
        }));
      } else if (data.groups && Array.isArray(data.groups)) {
        loadedCategories = Array.isArray(data.categories) && data.categories.length > 0
          ? data.categories
          : data.groups.map((g: any) => ({ id: g.id, name: g.name, parentId: g.parentId || undefined }));
        
        data.groups.forEach((g: any) => {
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
      } else if (Array.isArray(data.stocks) && data.stocks.length > 0) {
        loadedCategories = Array.isArray(data.categories) ? data.categories : [];
        loadedStocks = data.stocks;
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
      if (enrichedPreset.closeCache) {
        Object.keys(enrichedPreset.closeCache).forEach(c => {
          localStorage.setItem('KNAV_SX_CLOSE_' + c, JSON.stringify(enrichedPreset.closeCache![c]));
        });
      }
      if (enrichedPreset.bbHistory) {
        Object.keys(enrichedPreset.bbHistory).forEach(c => {
          localStorage.setItem('KNAV_SX_HIST_' + c, JSON.stringify(enrichedPreset.bbHistory![c]));
        });
      }
      if (enrichedPreset.memoCache) {
        Object.keys(enrichedPreset.memoCache).forEach(c => {
          localStorage.setItem('KNAV_SX_MEMO_' + c, JSON.stringify(enrichedPreset.memoCache![c]));
        });
      }
      if (enrichedPreset.bwpCache) {
        Object.keys(enrichedPreset.bwpCache).forEach(c => {
          localStorage.setItem('KNAV_SX_BWP_' + c, JSON.stringify(enrichedPreset.bwpCache![c]));
        });
      }
      if (enrichedPreset.marketLinks && enrichedPreset.marketLinks.length > 0) {
        setMarketLinks(enrichedPreset.marketLinks);
      } else {
        setMarketLinks(defaultMarketLinks);
      }
      setActiveCategoryId(null);
      alert(`最新データ（全${enrichedPreset.stocks.length}銘柄・サイバーセキュリティ等概要付き、${enrichedPreset.categories.length}フォルダー）を正常に復元・反映しました。`);
    } catch (e) {
      console.error("Failed to restore preset", e);
      alert('最新データの復元に失敗しました');
    }
  };

  const handleFillMissingDescriptions = () => {
    const descMap = new Map<string, string>();
    enrichedPreset.stocks.forEach(s => {
      if (s.description && s.description.trim()) {
        descMap.set(s.code, s.description);
      }
    });

    let count = 0;
    const nextStocks = stocks.map(st => {
      if (!st.description || !st.description.trim()) {
        const d = descMap.get(st.code);
        if (d) {
          count++;
          return { ...st, description: d };
        }
      }
      return st;
    });

    if (count > 0) {
      setStocks(nextStocks);
      try {
        localStorage.setItem('knav_stocks_v2', JSON.stringify(nextStocks));
      } catch (e) {}
      setToastMessage(`${count}銘柄の詳細情報（企業概要）を自動補完・登録しました。`);
    } else {
      setToastMessage('すべての登録銘柄に詳細情報が登録されています。');
    }
  };

  const handleResetData = () => {
    if (window.confirm(i18n[language].confirmReset)) {
      const descMap = new Map<string, string>();
      enrichedPreset.stocks.forEach(s => {
        if (s.description && s.description.trim()) {
          descMap.set(s.code, s.description);
        }
      });
      setCategories(initialGroups.map(g => ({ id: g.id, name: g.name })));
      const initialStocks: Stock[] = [];
      initialGroups.forEach(g => {
        g.stocks.forEach((s, index) => {
          initialStocks.push({
            id: `${g.id}_${s.code}`,
            code: s.code,
            name: s.name,
            categoryId: g.id,
            description: s.description || descMap.get(s.code) || '',
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
          stockFontSize={stockFontSize}
          priceFontSize={priceFontSize}
          limitFontSize={limitFontSize}
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
          onStopFetch={handleStopFetch}
          listFontSize={listFontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
          onLoadEnrichedData={handleLoadEnrichedPreset}
          onDownloadEnrichedData={handleDownloadEnrichedJson}
          onFillMissingDescriptions={handleFillMissingDescriptions}
          folderColor={folderColor}
          onReorderCategory={reorderCategory}
          onMoveStocksToCategory={moveStocksToCategory}
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
          onStopFetch={handleStopFetch}
          listFontSize={listFontSize}
          marketLinks={marketLinks}
          onMarketLinksChange={setMarketLinks}
          onLoadEnrichedData={handleLoadEnrichedPreset}
          onDownloadEnrichedData={handleDownloadEnrichedJson}
          onFillMissingDescriptions={handleFillMissingDescriptions}
          folderColor={folderColor}
          onReorderCategory={reorderCategory}
          onMoveStocksToCategory={moveStocksToCategory}
        />
      </div>

      <main className="flex-1 p-3 md:p-4 flex flex-col gap-3 md:gap-4 max-h-screen overflow-hidden">
        <Header 
          theme={theme} 
          onThemeChange={setTheme}
          fontType={fontType}
          onFontTypeChange={setFontType}
          folderColor={folderColor}
          onFolderColorChange={setFolderColor}
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
          limitFontSize={limitFontSize}
          onLimitFontSizeChange={setLimitFontSize}
          memoFontSize={memoFontSize}
          onMemoFontSizeChange={setMemoFontSize}
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
            folderColor={folderColor}
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
              onReorderStocks={reorderStocks}
              onMoveStocksToCategory={moveStocksToCategory}
              onCreateStockShortcuts={createStockShortcuts}
              onAddCategory={addCategory}
              onRefreshPrice={fetchSinglePrice}
              refreshingCode={refreshingCode}
              language={language} 
              listFontSize={listFontSize}
              stockFontSize={stockFontSize}
              priceFontSize={priceFontSize}
              limitFontSize={limitFontSize}
              memoFontSize={memoFontSize}
              onMemoFontSizeChange={setMemoFontSize}
              priceColor={priceColor}
              theme={theme}
              folderColor={folderColor}
            />
          </>
        )}
      </main>

      {/* Drag & Drop Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-panel-bg border border-[#58a6ff] text-text-bright px-4 py-2.5 shadow-2xl flex items-center gap-2.5 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-150 rounded-xs">
          <CheckCircle2 size={16} className="text-[#2ea043] shrink-0" />
          <span className="font-bold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}

