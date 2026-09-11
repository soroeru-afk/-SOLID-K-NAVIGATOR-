import React, { useState, useMemo } from 'react';
import { 
  Database, FileText, Trash2, CheckSquare, Square, Pencil, ExternalLink, 
  ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, X, LayoutGrid, List as ListIcon, 
  Folder, FolderOpen, FolderInput, FolderPlus, ChevronRight, ChevronDown, RefreshCw, 
  ChevronUp, RotateCcw, GripVertical
} from 'lucide-react';
import { Stock, Category, StockMemo, FolderColor } from '../types';
import { Language, i18n } from '../i18n';
import { Theme } from '../App';
import StockDetailModal from './StockDetailModal';
import MoveCategoryModal from './MoveCategoryModal';
import { getCategoryPath, getChildCategories, countStocksInCategory } from '../lib/categoryUtils';
import { openExternalWindow } from '../lib/windowUtils';
import { getFolderColorClass } from '../lib/folderUtils';

interface Props {
  stocks: Stock[];
  categories: Category[];
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  onDelete: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<Stock>) => void;
  onMoveStock?: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onReorderStocks?: (sourceIds: string[], targetId: string, position: 'before' | 'after') => void;
  onMoveStocksToCategory?: (ids: string[], categoryId: string) => void;
  onAddCategory?: (name: string, parentId?: string | null) => void;
  onRefreshPrice?: (code: string) => Promise<void>;
  refreshingCode?: string | null;
  language: Language;
  listFontSize: number;
  stockFontSize: number;
  priceFontSize: number;
  priceColor: string;
  theme: Theme;
  folderColor?: FolderColor;
}

type SortOption = 'default' | 'date_desc' | 'date_asc' | 'code_asc' | 'price_desc' | 'name_asc';

export interface ListColumnWidths {
  code: number;
  name: number;
  price: number;
  description: number;
  category: number;
  date: number;
  actions: number;
}

const DEFAULT_COLUMN_WIDTHS: ListColumnWidths = {
  code: 90,
  name: 160,
  price: 90,
  description: 320,
  category: 120,
  date: 85,
  actions: 76,
};

// 文字が欠けないための各項目の最小幅
const MIN_COLUMN_WIDTHS: Record<keyof ListColumnWidths, number> = {
  code: 75,
  name: 110,      // 銘柄名が欠けない最小幅
  price: 80,      // 現在値が欠けない最小幅
  description: 140, // メモ最小幅
  category: 95,   // セクター名が欠けない最小幅
  date: 80,       // 登録日が欠けない最小幅
  actions: 76,    // OPENボタンが欠けない最小幅
};

export default function StockList({
  stocks,
  categories,
  activeCategory,
  onSelectCategory,
  onDelete,
  onUpdate,
  onMoveStock,
  onReorderStocks,
  onMoveStocksToCategory,
  onAddCategory,
  onRefreshPrice,
  refreshingCode,
  language,
  listFontSize,
  stockFontSize,
  priceFontSize,
  priceColor,
  theme,
  folderColor = 'theme'
}: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastSelectedId, setLastSelectedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [viewMode, setViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('knav_view_mode') as 'card' | 'list') || 'card';
  });
  const [sortBy, setSortBy] = useState<SortOption>('default');
  const [selectedStockForDetail, setSelectedStockForDetail] = useState<Stock | null>(null);
  const [movingStocks, setMovingStocks] = useState<Stock[] | null>(null);

  // Drag & drop state for stocks
  const [draggingStockIds, setDraggingStockIds] = useState<string[]>([]);
  const [dragOverStockId, setDragOverStockId] = useState<string | null>(null);
  const [dragInsertPosition, setDragInsertPosition] = useState<'before' | 'after'>('before');
  const [dragOverCategoryId, setDragOverCategoryId] = useState<string | null>(null);
  
  // Resizable column widths for list view (persisted in localStorage)
  const [columnWidths, setColumnWidths] = useState<ListColumnWidths>(() => {
    try {
      const saved = localStorage.getItem('knav_list_column_widths');
      if (saved) {
        const parsed = JSON.parse(saved);
        return { 
          ...DEFAULT_COLUMN_WIDTHS, 
          ...parsed,
          actions: 76 // OPENボタンの幅に合わせたコンパクトサイズに固定
        };
      }
    } catch {}
    return DEFAULT_COLUMN_WIDTHS;
  });

  const [resizingCol, setResizingCol] = useState<keyof ListColumnWidths | null>(null);

  // Collapse state for Categories Grid (persisted in localStorage)
  const [isCategoriesCollapsed, setIsCategoriesCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('knav_cat_grid_collapsed') === 'true';
  });

  const [isQuickAddingSubCat, setIsQuickAddingSubCat] = useState(false);
  const [quickSubCatName, setQuickSubCatName] = useState('');

  const t = i18n[language];

  // Column resizing handlers (enforces minimum width to avoid text clipping, free upper bounds)
  const handleResizeStart = (colKey: keyof ListColumnWidths, e: React.MouseEvent) => {
    if (colKey === 'actions') return; // actions列は固定幅
    e.preventDefault();
    e.stopPropagation();

    const startX = e.clientX;
    const startWidth = columnWidths[colKey];
    setResizingCol(colKey);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const minW = MIN_COLUMN_WIDTHS[colKey];
      // 文字欠けを防ぐ最小幅のみを担保し、上限はフリー（ブラウザの端まで自由にドラッグ可能）
      const newWidth = Math.max(minW, startWidth + delta);
      setColumnWidths(prev => ({
        ...prev,
        [colKey]: newWidth
      }));
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      setResizingCol(null);
      setColumnWidths(current => {
        localStorage.setItem('knav_list_column_widths', JSON.stringify(current));
        return current;
      });
    };

    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleResetColWidth = (colKey: keyof ListColumnWidths) => {
    setColumnWidths(prev => {
      const updated = { ...prev, [colKey]: DEFAULT_COLUMN_WIDTHS[colKey] };
      localStorage.setItem('knav_list_column_widths', JSON.stringify(updated));
      return updated;
    });
  };

  const handleResetAllWidths = () => {
    setColumnWidths(DEFAULT_COLUMN_WIDTHS);
    localStorage.setItem('knav_list_column_widths', JSON.stringify(DEFAULT_COLUMN_WIDTHS));
  };

  const totalTableWidth = useMemo(() => {
    return (
      Math.max(MIN_COLUMN_WIDTHS.code, columnWidths.code) +
      Math.max(MIN_COLUMN_WIDTHS.name, columnWidths.name) +
      Math.max(MIN_COLUMN_WIDTHS.price, columnWidths.price) +
      Math.max(MIN_COLUMN_WIDTHS.description, columnWidths.description) +
      Math.max(MIN_COLUMN_WIDTHS.category, columnWidths.category) +
      Math.max(MIN_COLUMN_WIDTHS.date, columnWidths.date) +
      columnWidths.actions
    );
  }, [columnWidths]);

  const toggleCategoriesCollapse = () => {
    const next = !isCategoriesCollapsed;
    setIsCategoriesCollapsed(next);
    localStorage.setItem('knav_cat_grid_collapsed', next.toString());
  };

  const handleViewModeChange = (mode: 'card' | 'list') => {
    setViewMode(mode);
    localStorage.setItem('knav_view_mode', mode);
  };

  const getCategoryName = (id: string) => {
    if (!id || id === 'UNASSIGNED') return t.unassigned;
    return categories.find(c => c.id === id)?.name || t.unassigned;
  };

  // Breadcrumb path from root to current active category
  const breadcrumbTrail = useMemo(() => {
    return getCategoryPath(activeCategory, categories);
  }, [activeCategory, categories]);

  // Current category name for breadcrumb title
  const currentCategoryName = activeCategory === 'UNASSIGNED' 
    ? t.unassigned 
    : activeCategory 
      ? getCategoryName(activeCategory) 
      : (language === 'EN' ? 'ALL DATA' : 'すべての銘柄');

  // Filter stocks by search & sort
  const filteredStocks = useMemo(() => {
    let result = stocks.filter(st => 
      st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      st.code.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (sortBy === 'date_desc') {
      result = [...result].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    } else if (sortBy === 'date_asc') {
      result = [...result].sort((a, b) => (a.createdAt || 0) - (b.createdAt || 0));
    } else if (sortBy === 'code_asc') {
      result = [...result].sort((a, b) => a.code.localeCompare(b.code));
    } else if (sortBy === 'name_asc') {
      result = [...result].sort((a, b) => a.name.localeCompare(b.name, 'ja'));
    } else if (sortBy === 'price_desc') {
      result = [...result].sort((a, b) => {
        const pa = parseFloat(a.price?.replace(/,/g, '') || '0') || 0;
        const pb = parseFloat(b.price?.replace(/,/g, '') || '0') || 0;
        return pb - pa;
      });
    }

    return result;
  }, [stocks, searchQuery, sortBy]);

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
  };

  // Helper to load memo for card preview
  const getMemoData = (code: string): StockMemo | null => {
    try {
      const raw = localStorage.getItem('KNAV_SX_MEMO_' + code);
      if (raw) return JSON.parse(raw);
    } catch {}
    return null;
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Shift key range selection
    if (e.shiftKey && lastSelectedId && filteredStocks.length > 0) {
      const lastIdx = filteredStocks.findIndex(st => st.id === lastSelectedId);
      const currIdx = filteredStocks.findIndex(st => st.id === id);
      if (lastIdx >= 0 && currIdx >= 0) {
        const start = Math.min(lastIdx, currIdx);
        const end = Math.max(lastIdx, currIdx);
        const rangeIds = filteredStocks.slice(start, end + 1).map(st => st.id);
        const newIds = new Set(selectedIds);
        rangeIds.forEach(rangeId => newIds.add(rangeId));
        setSelectedIds(newIds);
        setLastSelectedId(id);
        return;
      }
    }

    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
      setLastSelectedId(null);
    } else {
      newIds.add(id);
      setLastSelectedId(id);
    }
    setSelectedIds(newIds);
  };

  const handleBatchMove = (direction: 'top' | 'up' | 'down' | 'bottom') => {
    if (!onMoveStock || selectedIds.size === 0) return;

    // 現在のリスト内での表示順序を維持
    const orderedSelected = filteredStocks
      .filter(st => selectedIds.has(st.id))
      .map(st => st.id);

    if (orderedSelected.length === 0) return;

    if (direction === 'top') {
      // 逆順で先頭に送ることで、選択時の元の順番がそのまま先頭に並ぶ
      for (let i = orderedSelected.length - 1; i >= 0; i--) {
        onMoveStock(orderedSelected[i], 'top');
      }
    } else if (direction === 'bottom') {
      // 順方向に末尾へ送ることで、選択時の元の順番がそのまま末尾に並ぶ
      for (let i = 0; i < orderedSelected.length; i++) {
        onMoveStock(orderedSelected[i], 'bottom');
      }
    } else if (direction === 'up') {
      // 上へ移動（上から順に1つずつ移動）
      for (let i = 0; i < orderedSelected.length; i++) {
        onMoveStock(orderedSelected[i], 'up');
      }
    } else if (direction === 'down') {
      // 下へ移動（下から順に1つずつ移動）
      for (let i = orderedSelected.length - 1; i >= 0; i--) {
        onMoveStock(orderedSelected[i], 'down');
      }
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredStocks.length && filteredStocks.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStocks.map(st => st.id)));
    }
  };

  const handleDelete = () => {
    if (selectedIds.size === 0) return;
    setShowDeleteConfirm(true);
  };

  const confirmDeleteAction = () => {
    onDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
    setShowDeleteConfirm(false);
  };

  const startEdit = (e: React.MouseEvent, st: Stock) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingId(st.id);
    setEditName(st.name);
  };

  const saveEdit = (id: string) => {
    if (editName.trim()) {
      onUpdate(id, { name: editName.trim() });
    }
    setEditingId(null);
  };

  // Drag & drop handlers for stocks
  const handleDragStart = (e: React.DragEvent, st: Stock) => {
    const idsToDrag = selectedIds.has(st.id) ? Array.from(selectedIds) : [st.id];
    setDraggingStockIds(idsToDrag);
    e.dataTransfer.setData('text/plain', st.code);
    e.dataTransfer.setData('text/stock-id', st.id);
    e.dataTransfer.setData('application/json', JSON.stringify({ stockIds: idsToDrag, sourceCategoryId: st.categoryId }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggingStockIds([]);
    setDragOverStockId(null);
    setDragOverCategoryId(null);
  };

  const handleDragOverStock = (e: React.DragEvent, targetStock: Stock, isCard: boolean) => {
    if (draggingStockIds.length === 0 || draggingStockIds.includes(targetStock.id)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    const rect = e.currentTarget.getBoundingClientRect();
    let pos: 'before' | 'after' = 'before';
    if (isCard) {
      const midX = rect.left + rect.width / 2;
      pos = e.clientX > midX ? 'after' : 'before';
    } else {
      const midY = rect.top + rect.height / 2;
      pos = e.clientY > midY ? 'after' : 'before';
    }
    
    if (dragOverStockId !== targetStock.id || dragInsertPosition !== pos) {
      setDragOverStockId(targetStock.id);
      setDragInsertPosition(pos);
    }
  };

  const handleDragLeaveStock = (e: React.DragEvent, targetStock: Stock) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverStockId === targetStock.id) {
      setDragOverStockId(null);
    }
  };

  const handleDropStock = (e: React.DragEvent, targetStock: Stock) => {
    e.preventDefault();
    if (draggingStockIds.length > 0 && !draggingStockIds.includes(targetStock.id)) {
      onReorderStocks?.(draggingStockIds, targetStock.id, dragInsertPosition);
    }
    setDraggingStockIds([]);
    setDragOverStockId(null);
  };

  const handleCategoryDragOver = (e: React.DragEvent, catId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverCategoryId !== catId) {
      setDragOverCategoryId(catId);
    }
  };

  const handleCategoryDragLeave = (e: React.DragEvent, catId: string) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCategoryId === catId) {
      setDragOverCategoryId(null);
    }
  };

  const handleCategoryDrop = (e: React.DragEvent, catId: string) => {
    e.preventDefault();
    let stockIdsToMove = draggingStockIds;
    if (stockIdsToMove.length === 0) {
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.stockIds) stockIdsToMove = data.stockIds;
        }
      } catch {}
    }
    if (stockIdsToMove.length > 0) {
      onMoveStocksToCategory?.(stockIdsToMove, catId);
    }
    setDraggingStockIds([]);
    setDragOverCategoryId(null);
  };

  // Sub-categories or Root-categories to show in grid card section
  const gridCategories = useMemo(() => {
    if (activeCategory === 'MARKET_DATA' || activeCategory === 'UNASSIGNED') {
      return [];
    }
    const cats = getChildCategories(activeCategory, categories);
    return cats.map(cat => {
      const { directCount, totalCount } = countStocksInCategory(cat.id, categories, stocks);
      return { ...cat, count: directCount, totalCount };
    });
  }, [categories, stocks, activeCategory]);

  const handleQuickAddSubCat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickSubCatName.trim() || !onAddCategory) return;
    onAddCategory(quickSubCatName.trim(), activeCategory);
    setQuickSubCatName('');
    setIsQuickAddingSubCat(false);
  };

  return (
    <div className="border border-border-main bg-panel-bg p-3 md:p-4 relative w-full flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
      
      {/* Top Breadcrumb & Path (Log Viewer Style - Slim & Smart) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-main pb-2 mb-2 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto text-xs py-0.5 scrollbar-thin">
          <button
            onClick={() => onSelectCategory(null)}
            className={`font-bold flex items-center gap-1.5 transition-colors shrink-0 ${!activeCategory ? 'text-text-bright' : 'text-text-dim hover:text-text-bright'}`}
          >
            <Folder size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, !activeCategory, true)}`} />
            <span>[ {language === 'EN' ? 'ALL DATA' : '全てのデータ'} ]</span>
          </button>

          {activeCategory === 'UNASSIGNED' && (
            <>
              <ChevronRight size={12} className="text-text-dim shrink-0" />
              <span className="font-bold text-text-bright flex items-center gap-1.5 shrink-0">
                <FolderOpen size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, true, false)}`} />
                {t.unassigned}
              </span>
            </>
          )}

          {breadcrumbTrail.map((crumb, idx) => {
            const isLast = idx === breadcrumbTrail.length - 1;
            return (
              <React.Fragment key={crumb.id}>
                <ChevronRight size={12} className="text-text-dim shrink-0" />
                {isLast ? (
                  <span className="font-bold text-text-bright flex items-center gap-1.5 shrink-0">
                    <FolderOpen size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, true, idx === 0)}`} />
                    {crumb.name}
                  </span>
                ) : (
                  <button
                    onClick={() => onSelectCategory(crumb.id)}
                    className="font-bold text-text-dim hover:text-text-bright flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Folder size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, false, idx === 0)}`} />
                    {crumb.name}
                  </button>
                )}
              </React.Fragment>
            );
          })}

          <span className="text-[10px] text-text-dim ml-1.5 tabular-nums shrink-0">
            ({filteredStocks.length} {language === 'EN' ? 'files' : '件'})
          </span>
        </div>

        {/* Search bar - Compact */}
        <div className="relative w-full sm:w-64 shrink-0">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={language === 'EN' ? 'Search in this folder...' : 'このフォルダー内を検索...'}
            className="w-full h-7 px-2.5 pr-7 bg-base-bg border border-border-main text-text-normal text-[11px] placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright transition-colors"
            >
              <X size={11} />
            </button>
          )}
        </div>
      </div>

      {/* CATEGORIES / SUB-CATEGORIES Grid Cards (Solid Bookmark Link Manager Style) */}
      {(gridCategories.length > 0 || isQuickAddingSubCat || (activeCategory && activeCategory !== 'UNASSIGNED')) && (
        <div className="mb-2.5 shrink-0 border border-border-main/60 bg-base-bg/30 p-2">
          {/* Header with Title, Count, Add Button, and COLLAPSE / EXPAND Toggle */}
          <div className="flex items-center justify-between text-[10px] font-bold text-text-dim uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <Folder size={12} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, Boolean(activeCategory), !activeCategory)}`} />
              <span>
                {!activeCategory ? t.categories : t.subCategories} ({gridCategories.length})
              </span>

              {onAddCategory && !isQuickAddingSubCat && (
                <button
                  onClick={() => setIsQuickAddingSubCat(true)}
                  className="px-1.5 py-0.2 bg-base-bg border border-border-main hover:border-border-light text-text-dim hover:text-text-bright transition-colors text-[9px] font-bold flex items-center gap-1 normal-case tracking-normal"
                >
                  <FolderPlus size={10} className={`shrink-0 ${getFolderColorClass(folderColor, false, false)}`} />
                  <span>{activeCategory ? (language === 'EN' ? '+ Sub-category' : '+ 子カテゴリー') : (language === 'EN' ? '+ Category' : '+ カテゴリー')}</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleCategoriesCollapse}
                className="flex items-center gap-1 text-[9px] font-bold text-text-dim hover:text-text-bright px-1.5 py-0.5 border border-border-main hover:border-border-light bg-base-bg transition-colors"
                title={isCategoriesCollapsed ? (language === 'EN' ? 'Expand categories' : 'カテゴリーを展開') : (language === 'EN' ? 'Collapse categories' : 'カテゴリーを折りたたむ')}
              >
                {isCategoriesCollapsed ? (
                  <>
                    <ChevronDown size={11} />
                    <span>[ {language === 'EN' ? 'EXPAND' : '展開'} ]</span>
                  </>
                ) : (
                  <>
                    <ChevronUp size={11} />
                    <span>[ {language === 'EN' ? 'COLLAPSE' : '折りたたむ'} ]</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Quick Sub-Category Add Form */}
          {isQuickAddingSubCat && (
            <form onSubmit={handleQuickAddSubCat} className="flex items-center gap-2 mt-2 pt-2 border-t border-border-main/50">
              <input
                autoFocus
                type="text"
                value={quickSubCatName}
                onChange={e => setQuickSubCatName(e.target.value)}
                placeholder={activeCategory ? (language === 'EN' ? 'Sub-category name...' : '子カテゴリー名を入力...') : (language === 'EN' ? 'Category name...' : 'カテゴリー名を入力...')}
                className="flex-1 h-7 px-2 bg-panel-bg border border-border-light text-text-bright text-xs outline-none"
              />
              <button
                type="submit"
                className="h-7 px-3 bg-border-light text-text-bright text-xs font-bold hover:bg-[#58a6ff] transition-colors"
              >
                +
              </button>
              <button
                type="button"
                onClick={() => setIsQuickAddingSubCat(false)}
                className="h-7 px-2 text-text-dim hover:text-text-bright text-xs"
              >
                ✕
              </button>
            </form>
          )}

          {/* Grid Layout (Hidden when collapsed) */}
          {!isCategoriesCollapsed && gridCategories.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-40 overflow-y-auto pr-1 scrollbar-thin mt-2">
              {gridCategories.map(cat => {
                const isDragTarget = dragOverCategoryId === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => onSelectCategory(cat.id)}
                    onDragOver={(e) => handleCategoryDragOver(e, cat.id)}
                    onDragLeave={(e) => handleCategoryDragLeave(e, cat.id)}
                    onDrop={(e) => handleCategoryDrop(e, cat.id)}
                    className={`group flex items-center justify-between px-3 py-1.5 bg-base-bg border text-left transition-colors h-9 shadow-xs ${
                      isDragTarget 
                        ? 'border-border-light bg-border-main/40 ring-1 ring-border-light' 
                        : 'border-border-main hover:border-border-light hover:bg-border-main/30'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden flex-1 min-w-0">
                      <Folder size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, false, !activeCategory)} group-hover:scale-105 transition-transform`} />
                      <span 
                        className="font-bold text-text-bright truncate"
                        style={{ fontSize: listFontSize }}
                      >
                        {cat.name}
                      </span>
                    </div>
                    <span className="px-1.5 py-0.2 bg-panel-bg border border-border-main text-text-dim text-[10px] font-mono font-bold shrink-0 ml-2">
                      {cat.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Section Action Bar (LOGS / ARTICLES style toolbar) */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-main pb-2 mb-2.5 shrink-0 text-xs">
        <div className="flex items-center gap-3">
          <span className="font-bold text-text-dim tracking-wider text-[11px] flex items-center gap-1.5">
            <FileText size={13} />
            LOGS / STOCKS ({filteredStocks.length})
          </span>

          {filteredStocks.length > 0 && (
            <div className="flex items-center gap-3 border-l border-border-main pl-3">
              <button 
                onClick={toggleSelectAll}
                className="hover:text-text-bright text-text-dim transition-colors flex items-center gap-1.5 text-[10px] font-bold"
              >
                {selectedIds.size === filteredStocks.length && filteredStocks.length > 0 ? (
                  <CheckSquare size={13} className="text-text-bright" />
                ) : (
                  <Square size={13} className="text-text-dim" />
                )}
                {t.selectAll}
              </button>

              {selectedIds.size > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-text-bright font-bold h-6 flex items-center">
                    {selectedIds.size} 件選択中
                  </span>

                  {/* Select Cancel (Deselect All) Button */}
                  <button
                    onClick={() => {
                      setSelectedIds(new Set());
                      setLastSelectedId(null);
                    }}
                    className="h-6 px-2 bg-base-bg border border-border-main hover:border-border-light text-text-dim hover:text-text-bright text-[10px] font-bold inline-flex items-center gap-1 transition-colors box-border"
                    title={language === 'EN' ? 'Cancel selection' : '選択を解除'}
                  >
                    <X size={11} />
                    <span>{language === 'EN' ? 'Cancel' : '選択解除'}</span>
                  </button>

                  {/* Reorder Buttons (Top / Up / Down / Bottom) */}
                  {onMoveStock && (
                    <div className="h-6 inline-flex items-stretch border border-border-main bg-base-bg divide-x divide-border-main box-border" title={language === 'EN' ? 'Reorder selected' : '選択した銘柄を並び替え'}>
                      <button
                        onClick={() => handleBatchMove('top')}
                        className="px-1.5 flex items-center justify-center text-text-dim hover:text-text-bright hover:bg-border-main/50 transition-colors"
                        title={t.top}
                      >
                        <ChevronsUp size={12} />
                      </button>
                      <button
                        onClick={() => handleBatchMove('up')}
                        className="px-1.5 flex items-center justify-center text-text-dim hover:text-text-bright hover:bg-border-main/50 transition-colors"
                        title={t.up}
                      >
                        <ArrowUp size={12} />
                      </button>
                      <button
                        onClick={() => handleBatchMove('down')}
                        className="px-1.5 flex items-center justify-center text-text-dim hover:text-text-bright hover:bg-border-main/50 transition-colors"
                        title={t.down}
                      >
                        <ArrowDown size={12} />
                      </button>
                      <button
                        onClick={() => handleBatchMove('bottom')}
                        className="px-1.5 flex items-center justify-center text-text-dim hover:text-text-bright hover:bg-border-main/50 transition-colors"
                        title={t.bottom}
                      >
                        <ChevronsDown size={12} />
                      </button>
                    </div>
                  )}

                  {/* Single Item Edit Button */}
                  {selectedIds.size === 1 && (
                    <button
                      onClick={() => {
                        const singleId = Array.from(selectedIds)[0];
                        const targetStock = stocks.find(s => s.id === singleId);
                        if (targetStock) {
                          setEditingId(targetStock.id);
                          setEditName(targetStock.name);
                        }
                      }}
                      className="h-6 px-2 bg-base-bg border border-border-main hover:border-border-light text-text-bright text-[10px] font-bold inline-flex items-center gap-1 transition-colors box-border"
                      title={t.edit}
                    >
                      <Pencil size={11} />
                      <span>{t.edit}</span>
                    </button>
                  )}

                  {/* Move Selected to Category Modal Trigger */}
                  <button
                    onClick={() => {
                      const targets = stocks.filter(s => selectedIds.has(s.id));
                      setMovingStocks(targets);
                    }}
                    className="h-6 px-2 bg-base-bg border border-border-main hover:border-border-light text-text-bright text-[10px] font-bold inline-flex items-center gap-1 transition-colors box-border"
                  >
                    <FolderInput size={12} />
                    <span>{language === 'EN' ? 'Move to...' : 'カテゴリ移動'}</span>
                  </button>

                  <button 
                    onClick={handleDelete}
                    className="h-6 px-2 bg-base-bg border border-border-main hover:border-[#ff7b72] text-[#ff7b72] hover:text-[#ff9b94] text-[10px] font-bold inline-flex items-center gap-1 transition-colors box-border"
                  >
                    <Trash2 size={12} /> {t.delete}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right side: Sort + Reset Widths (in List View) + Card / List Switcher */}
        <div className="flex items-center gap-3">
          {viewMode === 'list' && (
            <button
              type="button"
              onClick={handleResetAllWidths}
              className="h-6 px-2 bg-base-bg border border-border-main hover:border-border-light text-text-dim hover:text-text-bright text-[10px] font-bold inline-flex items-center gap-1 transition-colors box-border"
              title={language === 'EN' ? 'Reset column widths to default' : '列幅を初期状態にリセット'}
            >
              <RotateCcw size={11} />
              <span>{language === 'EN' ? 'Reset Widths' : '列幅リセット'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[10px] text-text-dim">
            <span className="font-bold">{t.sortOrder}:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="h-6 bg-base-bg border border-border-main text-text-normal text-[10px] px-1.5 outline-none font-bold box-border inline-flex items-center"
            >
              <option value="default">{language === 'EN' ? 'Default' : '登録順'}</option>
              <option value="code_asc">{t.sortCode}</option>
              <option value="name_asc">{t.sortName}</option>
              <option value="price_desc">{t.sortPrice}</option>
              <option value="date_desc">{t.sortDate}</option>
            </select>
          </div>

          <div className="h-6 inline-flex items-stretch border border-border-main bg-base-bg divide-x divide-border-main box-border">
            <button
              onClick={() => handleViewModeChange('card')}
              className={`px-1.5 flex items-center justify-center transition-colors ${viewMode === 'card' ? 'bg-border-main text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
              title={t.cardView}
            >
              <LayoutGrid size={13} />
            </button>
            <button
              onClick={() => handleViewModeChange('list')}
              className={`px-1.5 flex items-center justify-center transition-colors ${viewMode === 'list' ? 'bg-border-main text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
              title={t.listView}
            >
              <ListIcon size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Stock Content Area */}
      <div className="flex-1 overflow-y-auto min-h-0 pr-1 scrollbar-thin">
        {filteredStocks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-text-dim py-12 gap-2">
            <FileText size={32} className="opacity-30" />
            <p className="text-xs">{t.awaitingInit}</p>
          </div>
        ) : viewMode === 'card' ? (
          /* CARD VIEW (Solid High-Contrast Technical Cards) */
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 pb-4">
            {filteredStocks.map((st) => {
              const memo = getMemoData(st.code);
              const isSelected = selectedIds.has(st.id);
              const isRefreshingThis = refreshingCode === st.code;
              const isDragging = draggingStockIds.includes(st.id);
              const isDropTarget = dragOverStockId === st.id;

              return (
                <div
                  key={st.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, st)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => handleDragOverStock(e, st, true)}
                  onDragLeave={(e) => handleDragLeaveStock(e, st)}
                  onDrop={(e) => handleDropStock(e, st)}
                  className={`group relative flex flex-col justify-between border bg-base-bg/40 hover:bg-base-bg/90 transition-all shadow-sm ${
                    isDragging ? 'opacity-40 border-dashed scale-[0.99]' : ''
                  } ${
                    isDropTarget 
                      ? (dragInsertPosition === 'before' ? 'border-l-4 border-l-border-light ring-2 ring-border-light bg-border-main/20' : 'border-r-4 border-r-border-light ring-2 ring-border-light bg-border-main/20')
                      : (isSelected ? 'border-border-light ring-1 ring-border-light' : 'border-border-main hover:border-border-light')
                  }`}
                  style={{
                    backgroundColor: theme === 'light' ? '#FFFFFF' : undefined,
                    padding: '12px'
                  }}
                >
                  {/* Card Header Top (Checkbox, Code Badge, Quick Actions) */}
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5">
                        {/* Drag Handle */}
                        <div
                          className="cursor-grab active:cursor-grabbing text-text-dim/40 group-hover:text-text-dim hover:!text-text-bright transition-colors p-0.5"
                          title={language === 'EN' ? 'Drag to reorder' : 'ドラッグして並び替え'}
                        >
                          <GripVertical size={13} />
                        </div>

                        <button
                          onClick={(e) => toggleSelect(st.id, e)}
                          className="text-text-dim hover:text-text-bright transition-colors"
                        >
                          {isSelected ? (
                            <CheckSquare size={14} className="text-text-bright" />
                          ) : (
                            <Square size={14} className="text-text-dim" />
                          )}
                        </button>

                        <a
                          href={`https://kabutan.jp/stock/?code=${st.code}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExternalWindow(`https://kabutan.jp/stock/?code=${st.code}`);
                          }}
                          className={`font-mono font-black tracking-widest px-1.5 py-0.5 border border-border-main hover:underline ${
                            theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
                          }`}
                          style={{ fontSize: Math.max(10, Math.round(listFontSize * 0.9)) }}
                          title={`${st.code}（別ウィンドウで株探を開く）`}
                        >
                          {st.code}
                        </a>
                      </div>

                      {/* Right Mini Action Bar */}
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                        {/* Move to Category button */}
                        <button
                          onClick={() => setMovingStocks([st])}
                          className="w-6 h-6 flex items-center justify-center bg-base-bg text-text-dim hover:text-text-bright hover:border-border-light border border-border-main transition-colors"
                          title={language === 'EN' ? 'Move to category' : 'カテゴリーを移動'}
                        >
                          <FolderInput size={12} />
                        </button>

                        {/* Kabutan Chart */}
                        <a
                          href={`https://kabutan.jp/stock/chart?code=${st.code}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExternalWindow(`https://kabutan.jp/stock/chart?code=${st.code}`);
                          }}
                          className="w-6 h-6 flex items-center justify-center bg-base-bg text-text-dim hover:text-text-bright border border-border-main transition-colors"
                          title="チャート (別ウィンドウで株探を開く)"
                        >
                          <FileText size={12} />
                        </a>

                        {/* Single Price Refresh */}
                        {onRefreshPrice && (
                          <button
                            onClick={() => onRefreshPrice(st.code)}
                            disabled={isRefreshingThis}
                            title={t.updatePrice}
                            className="w-6 h-6 flex items-center justify-center bg-base-bg text-text-dim hover:text-text-bright border border-border-main transition-colors disabled:opacity-40"
                          >
                            <RefreshCw size={11} className={isRefreshingThis ? 'animate-spin text-text-bright' : ''} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Stock Title (Large & Bold) */}
                    <div className="mb-2">
                      {editingId === st.id ? (
                        <input
                          type="text"
                          className="w-full bg-base-bg border border-border-light text-text-bright px-2 py-1 text-sm focus:outline-none font-bold"
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => saveEdit(st.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(st.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <div className="flex items-baseline justify-between gap-2">
                          <a
                            href={`https://kabutan.jp/stock/?code=${st.code}`}
                            target="_blank"
                            rel="noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openExternalWindow(`https://kabutan.jp/stock/?code=${st.code}`);
                            }}
                            className="text-text-bright font-black leading-snug tracking-wide hover:underline truncate"
                            style={{ fontSize: stockFontSize }}
                            title={`${st.name}（別ウィンドウで株探を開く）`}
                          >
                            {st.name}
                          </a>
                          <button 
                            onClick={(e) => startEdit(e, st)} 
                            className="opacity-0 group-hover:opacity-100 text-text-dim hover:text-text-bright transition-opacity p-0.5"
                            title={t.edit}
                          >
                            <Pencil size={11} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Price & Target Row */}
                    <div className="flex items-center justify-between gap-2 bg-base-bg/70 px-2.5 py-1.5 border border-border-main mb-3 font-mono">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] text-text-dim">現在値:</span>
                        <span
                          className="font-black text-text-bright tracking-tight"
                          style={{
                            fontSize: priceFontSize,
                            color: priceColor === 'red' ? '#C41414' : undefined
                          }}
                        >
                          {st.price && st.price !== '?' ? `¥${st.price}` : '---'}
                        </span>
                      </div>

                      {memo?.targetPrice && (
                        <div className="flex items-center gap-1 text-[10px]">
                          <span className="text-text-dim">目標:</span>
                          <span className="text-text-bright font-bold">¥{memo.targetPrice}</span>
                        </div>
                      )}
                    </div>

                    {/* Company Description / Overview Preview (or Memo fallback) */}
                    <div 
                      onClick={() => setSelectedStockForDetail(st)}
                      className="cursor-pointer bg-base-bg/40 hover:bg-base-bg border border-border-main/50 p-2.5 mb-3 min-h-[64px] transition-colors rounded-xs flex flex-col justify-center"
                    >
                      {st.description ? (
                        <div>
                          <div className="text-[9px] text-text-bright font-bold tracking-wider mb-1 flex items-center gap-1">
                            <span>[ 企業概要・詳細情報 ]</span>
                          </div>
                          <p className="text-xs text-text-bright line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                            {st.description}
                          </p>
                        </div>
                      ) : memo && memo.text ? (
                        <div>
                          <div className="text-[9px] text-text-dim font-bold tracking-wider mb-1 flex items-center gap-1">
                            <span>[ メモ・考察 ]</span>
                          </div>
                          <p className="text-xs text-text-bright line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                            {memo.text}
                          </p>
                        </div>
                      ) : (
                        <div className="h-full flex items-center justify-center text-text-dim/60 text-[11px] italic">
                          詳細情報・メモ未登録
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Card Footer (Char count, Category, and "開く →" action) */}
                  <div className="flex items-center justify-between border-t border-border-main pt-2.5 mt-1 text-[10px] text-text-dim">
                    <div className="flex items-center gap-2">
                      <span className="font-mono">
                        {st.description 
                          ? `${st.description.length} ${t.charCount}` 
                          : (memo?.text ? `${memo.text.length} ${t.charCount}` : `0 ${t.charCount}`)}
                      </span>
                      <span>•</span>
                      <span 
                        onClick={() => setMovingStocks([st])}
                        className="truncate max-w-[110px] hover:text-text-bright cursor-pointer hover:underline"
                        title={language === 'EN' ? 'Click to move category' : 'クリックしてカテゴリー移動'}
                      >
                        {getCategoryName(st.categoryId)}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedStockForDetail(st)}
                      className="text-text-dim hover:text-text-bright font-bold flex items-center gap-1 transition-colors px-2 py-0.5 border border-transparent hover:border-border-main bg-base-bg/50"
                    >
                      <span>{t.openDetail}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* LIST VIEW (Resizable Columns Header & Rows) */
          <div className="flex flex-col pb-4 overflow-x-auto scrollbar-thin">
            {/* Resizable Column Header Bar */}
            <div 
              style={{ minWidth: totalTableWidth }}
              className="flex items-stretch bg-panel-bg border-b border-border-main text-[10px] font-mono text-text-dim sticky top-0 z-20 py-0 pl-2 pr-0 select-none min-w-full"
            >
              {/* Col 1: Code & Checkbox */}
              <div 
                style={{ width: columnWidths.code, minWidth: MIN_COLUMN_WIDTHS.code, flexShrink: 0 }}
                className="relative flex items-center gap-2 pr-2 py-1.5 group/col"
              >
                <button
                  onClick={toggleSelectAll}
                  className="text-text-dim hover:text-text-bright transition-colors shrink-0"
                  title={selectedIds.size === filteredStocks.length && filteredStocks.length > 0 ? (language === 'EN' ? 'Deselect all' : '全解除') : t.selectAll}
                >
                  {selectedIds.size > 0 && selectedIds.size === filteredStocks.length ? (
                    <CheckSquare size={13} className="text-text-bright" />
                  ) : (
                    <Square size={13} className="text-text-dim" />
                  )}
                </button>
                <span className="truncate font-bold tracking-wider">コード</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('code', e)}
                  onDoubleClick={() => handleResetColWidth('code')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'code' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 2: Name */}
              <div 
                style={{ width: columnWidths.name, minWidth: MIN_COLUMN_WIDTHS.name, flexShrink: 0 }}
                className="relative flex items-center px-2 py-1.5 group/col"
              >
                <span className="truncate font-bold tracking-wider">銘柄名</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('name', e)}
                  onDoubleClick={() => handleResetColWidth('name')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'name' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 3: Price */}
              <div 
                style={{ width: columnWidths.price, minWidth: MIN_COLUMN_WIDTHS.price, flexShrink: 0 }}
                className="relative flex items-center justify-end px-2 py-1.5 group/col"
              >
                <span className="truncate font-bold tracking-wider">現在値</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('price', e)}
                  onDoubleClick={() => handleResetColWidth('price')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'price' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 4: Description / Memo (Flexible Middle Column) */}
              <div 
                style={{ minWidth: Math.max(MIN_COLUMN_WIDTHS.description, columnWidths.description) }}
                className="relative flex-1 flex items-center px-2 py-1.5 group/col min-w-0"
              >
                <span className="truncate font-bold tracking-wider text-text-bright">企業概要・詳細 / メモ</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('description', e)}
                  onDoubleClick={() => handleResetColWidth('description')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'description' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 5: Category */}
              <div 
                style={{ width: columnWidths.category, minWidth: MIN_COLUMN_WIDTHS.category, flexShrink: 0 }}
                className="relative flex items-center px-2 py-1.5 group/col"
              >
                <span className="truncate font-bold tracking-wider">セクター / 分類</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('category', e)}
                  onDoubleClick={() => handleResetColWidth('category')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'category' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 6: Date */}
              <div 
                style={{ width: columnWidths.date, minWidth: MIN_COLUMN_WIDTHS.date, flexShrink: 0 }}
                className="relative flex items-center justify-end px-2 py-1.5 group/col"
              >
                <span className="truncate font-bold tracking-wider">登録日</span>
                {/* Resizer Handle */}
                <div
                  onMouseDown={(e) => handleResizeStart('date', e)}
                  onDoubleClick={() => handleResetColWidth('date')}
                  className="absolute right-0 top-0 bottom-0 w-3 -mr-1.5 cursor-col-resize flex items-center justify-center group-hover/col:bg-border-light/40 z-20"
                  title="ドラッグで幅調整 (ダブルクリックで初期化)"
                >
                  <div className={`w-[2px] h-3.5 ${resizingCol === 'date' ? 'bg-text-bright' : 'bg-border-light/60 group-hover/col:bg-text-bright'}`} />
                </div>
              </div>

              {/* Col 7: Actions / Edit (Pinned to Right Edge, Seamless) */}
              <div 
                style={{ width: columnWidths.actions, minWidth: MIN_COLUMN_WIDTHS.actions, flexShrink: 0 }}
                className="sticky right-0 z-30 self-stretch flex items-center justify-end px-2 text-right bg-panel-bg"
              >
                <span className="truncate font-bold tracking-wider text-[10px]">
                  編集
                </span>
              </div>
            </div>

            {/* List Rows */}
            <div className="flex flex-col gap-1 pt-1 min-w-full" style={{ minWidth: totalTableWidth }}>
              {filteredStocks.map((st) => {
                const memo = getMemoData(st.code);
                const isSelected = selectedIds.has(st.id);
                const isRefreshingThis = refreshingCode === st.code;
                const isDragging = draggingStockIds.includes(st.id);
                const isDropTarget = dragOverStockId === st.id;

                return (
                  <div
                    key={st.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, st)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => handleDragOverStock(e, st, false)}
                    onDragLeave={(e) => handleDragLeaveStock(e, st)}
                    onDrop={(e) => handleDropStock(e, st)}
                    className={`group flex items-stretch border transition-colors pl-1.5 pr-0 min-w-full relative ${
                      isDragging ? 'opacity-40 border-dashed' : ''
                    } ${
                      isDropTarget
                        ? (dragInsertPosition === 'before' ? 'border-t-2 border-t-border-light bg-border-main/30' : 'border-b-2 border-b-border-light bg-border-main/30')
                        : (isSelected ? 'border-border-light bg-border-main/20' : 'border-border-main hover:border-border-light bg-base-bg/30 hover:bg-base-bg/80')
                    }`}
                  >
                    {/* Col 1: Code & Checkbox */}
                    <div 
                      style={{ width: columnWidths.code, minWidth: MIN_COLUMN_WIDTHS.code, flexShrink: 0 }}
                      className="flex items-center gap-1.5 pr-2 py-1.5 overflow-hidden"
                    >
                      {/* Drag Handle */}
                      <div
                        className="cursor-grab active:cursor-grabbing text-text-dim/40 group-hover:text-text-dim hover:!text-text-bright transition-colors p-0.5 shrink-0"
                        title={language === 'EN' ? 'Drag to reorder' : 'ドラッグして並び替え'}
                      >
                        <GripVertical size={13} />
                      </div>

                      <button
                        onClick={(e) => toggleSelect(st.id, e)}
                        className="text-text-dim hover:text-text-bright transition-colors shrink-0"
                      >
                        {isSelected ? (
                          <CheckSquare size={14} className="text-text-bright" />
                        ) : (
                          <Square size={14} className="text-text-dim" />
                        )}
                      </button>

                      <a
                        href={`https://kabutan.jp/stock/?code=${st.code}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openExternalWindow(`https://kabutan.jp/stock/?code=${st.code}`);
                        }}
                        className={`font-bold tracking-widest hover:underline truncate ${
                          theme === 'light' ? 'text-black' : 'text-white'
                        }`}
                        style={{ fontSize: Math.max(10, Math.round(listFontSize * 0.9)) }}
                        title={`${st.code}（別ウィンドウで株探を開く）`}
                      >
                        {st.code}
                      </a>
                    </div>

                    {/* Col 2: Name */}
                    <div 
                      style={{ width: columnWidths.name, minWidth: MIN_COLUMN_WIDTHS.name, flexShrink: 0 }}
                      className="flex items-center gap-1.5 px-2 py-1.5 overflow-hidden"
                    >
                      {editingId === st.id ? (
                        <input
                          type="text"
                          className="w-full bg-base-bg border border-border-light text-text-bright px-2 py-0.5 focus:outline-none font-medium text-xs"
                          style={{ fontSize: stockFontSize }}
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          onBlur={() => saveEdit(st.id)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveEdit(st.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                          autoFocus
                        />
                      ) : (
                        <a
                          href={`https://kabutan.jp/stock/?code=${st.code}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExternalWindow(`https://kabutan.jp/stock/?code=${st.code}`);
                          }}
                          className="text-text-bright hover:underline truncate font-bold leading-tight"
                          style={{ fontSize: stockFontSize }}
                          title={`${st.name}（別ウィンドウで株探を開く）`}
                        >
                          {st.name}
                        </a>
                      )}
                    </div>

                    {/* Col 3: Price */}
                    <div 
                      style={{ width: columnWidths.price, minWidth: MIN_COLUMN_WIDTHS.price, flexShrink: 0 }}
                      className="flex items-center justify-end gap-1.5 px-2 py-1.5 font-mono text-right overflow-hidden"
                    >
                      {st.price && st.price !== '?' ? (
                        <span 
                          className="font-bold tracking-tight truncate"
                          style={{ 
                            fontSize: priceFontSize, 
                            color: priceColor === 'red' ? '#C41414' : undefined 
                          }}
                        >
                          ¥{st.price}
                        </span>
                      ) : (
                        <span className="text-text-dim text-[10px]">---</span>
                      )}
                      {onRefreshPrice && (
                        <button
                          onClick={() => onRefreshPrice(st.code)}
                          disabled={isRefreshingThis}
                          title={t.updatePrice}
                          className="text-text-dim hover:text-text-bright p-0.5 opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-40 shrink-0"
                        >
                          <RefreshCw size={11} className={isRefreshingThis ? 'animate-spin text-text-bright' : ''} />
                        </button>
                      )}
                    </div>

                    {/* Col 4: Description / Memo preview (Flexible Middle Column) */}
                    <div 
                      style={{ minWidth: Math.max(MIN_COLUMN_WIDTHS.description, columnWidths.description) }}
                      onClick={() => setSelectedStockForDetail(st)}
                      className="flex-1 flex items-center px-2 py-1.5 text-text-dim hover:text-text-bright cursor-pointer truncate text-[11px] min-w-0 overflow-hidden"
                      title={st.description || memo?.text || ''}
                    >
                      {st.description ? (
                        <span className="text-text-bright truncate">
                          <span className="text-text-bright font-bold text-[10px] mr-1 shrink-0">[詳細]</span>
                          {st.description}
                        </span>
                      ) : memo?.text ? (
                        <span className="truncate">
                          <span className="text-text-dim text-[10px] mr-1 shrink-0">[メモ]</span>
                          {memo.text}
                        </span>
                      ) : (
                        <span className="text-text-dim/40 italic">未登録</span>
                      )}
                    </div>

                    {/* Col 5: Category */}
                    <div 
                      style={{ width: columnWidths.category, minWidth: MIN_COLUMN_WIDTHS.category, flexShrink: 0 }}
                      className="flex items-center gap-1 px-2 py-1.5 text-text-dim overflow-hidden"
                    >
                      <button
                        onClick={() => setMovingStocks([st])}
                        className="p-1 hover:text-text-bright transition-colors shrink-0"
                        title={language === 'EN' ? 'Move to category' : 'カテゴリー移動'}
                      >
                        <FolderInput size={11} />
                      </button>
                      <span 
                        onClick={() => setMovingStocks([st])}
                        className="truncate cursor-pointer hover:underline hover:text-text-bright" 
                        style={{ fontSize: listFontSize }}
                        title={getCategoryName(st.categoryId)}
                      >
                        {getCategoryName(st.categoryId)}
                      </span>
                    </div>

                    {/* Col 6: Date */}
                    <div 
                      style={{ width: columnWidths.date, minWidth: MIN_COLUMN_WIDTHS.date, flexShrink: 0 }}
                      className="flex items-center justify-end px-2 py-1.5 text-right text-text-dim text-[10px] font-mono truncate overflow-hidden"
                    >
                      {formatDate(st.createdAt)}
                    </div>

                    {/* Col 7: Actions (Tight Fit "OPEN ⇒" Only, Seamless Integration) */}
                    <div 
                      style={{ width: columnWidths.actions, minWidth: MIN_COLUMN_WIDTHS.actions, flexShrink: 0 }}
                      className={`sticky right-0 z-10 self-stretch flex items-center justify-end px-1.5 overflow-hidden transition-colors ${
                        isSelected 
                          ? (theme === 'light' ? 'bg-[#cbd5e1]' : 'bg-[#1c2128]') 
                          : (theme === 'light' ? 'bg-[#ffffff] group-hover:bg-[#f1f5f9]' : 'bg-[#0d1117] group-hover:bg-[#161b22]')
                      }`}
                    >
                      <button
                        onClick={() => setSelectedStockForDetail(st)}
                        className="text-text-dim hover:text-text-bright text-[10px] font-bold px-1.5 py-0.5 border border-border-main bg-base-bg hover:bg-border-main/50 transition-colors shrink-0 whitespace-nowrap"
                        title={t.openDetail}
                      >
                        {t.openDetail}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-panel-bg border border-border-light p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="font-bold text-sm text-text-bright tracking-wider">DELETE CONFIRMATION</h3>
            <p className="text-xs text-text-normal leading-relaxed">
              {t.confirmDelete} ({selectedIds.size} items)
            </p>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 text-xs text-text-dim hover:text-text-bright border border-border-main transition-colors"
              >
                {t.close}
              </button>
              <button
                onClick={confirmDeleteAction}
                className="px-3 py-1.5 text-xs font-bold text-white bg-[#ff7b72] hover:bg-[#ff9b94] transition-colors"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Detail Modal */}
      {selectedStockForDetail && (
        <StockDetailModal
          stock={selectedStockForDetail}
          category={categories.find(c => c.id === selectedStockForDetail.categoryId)}
          onClose={() => setSelectedStockForDetail(null)}
          onUpdateStock={onUpdate}
          onRefreshPrice={onRefreshPrice}
          isRefreshingPrice={refreshingCode === selectedStockForDetail.code}
          language={language}
          theme={theme}
          priceColor={priceColor}
        />
      )}

      {/* Move Category Modal */}
      {movingStocks && (
        <MoveCategoryModal
          isOpen={true}
          onClose={() => setMovingStocks(null)}
          targetStocks={movingStocks}
          categories={categories}
          onMove={(ids, newCatId) => {
            if (onMoveStocksToCategory) {
              onMoveStocksToCategory(ids, newCatId);
            }
            // 選択解除
            setSelectedIds(prev => {
              const next = new Set(prev);
              ids.forEach(id => next.delete(id));
              return next;
            });
          }}
          onAddCategory={onAddCategory}
          language={language}
        />
      )}

    </div>
  );
}
