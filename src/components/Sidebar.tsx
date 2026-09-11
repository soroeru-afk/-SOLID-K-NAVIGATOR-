import React, { useState, useRef, useEffect } from 'react';
import { 
  LayoutGrid, Folders, Plus, Folder, FolderOpen, FolderPlus, Download, 
  FileCode, Pencil, Trash2, ArrowUp, ArrowDown, Activity, ChevronDown, 
  ChevronRight, LineChart, ExternalLink, Settings, Compass, 
  RefreshCw, Maximize2, Sparkles, AlertTriangle, X, Globe, Square, GripVertical
} from 'lucide-react';
import { Category, MarketLink, Stock, FolderColor } from '../types';
import { Language, i18n } from '../i18n';
import MarketLinkEditor from './MarketLinkEditor';
import { getChildCategories, countStocksInCategory, getFlattenedCategoryTree } from '../lib/categoryUtils';
import { tankenCategories } from '../data/tankenData';
import TankenExplorerModal from './TankenExplorerModal';
import ProxySettingsModal from './ProxySettingsModal';
import { openExternalWindow } from '../lib/windowUtils';
import { getFolderColorClass } from '../lib/folderUtils';

interface Props {
  categories: Category[];
  stocksLength: number;
  stocks?: Stock[];
  onAddCategory: (name: string, parentId?: string | null) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveCategory?: (id: string, direction: 'up' | 'down') => void;
  onReorderCategory?: (sourceId: string, targetId: string, position: 'before' | 'after') => void;
  onMoveStocksToCategory?: (ids: string[], categoryId: string) => void;
  activeCategory: string | null;
  onSelectCategory: (id: string | null) => void;
  language: Language;
  onExportJson: () => void;
  onImportJson: (content: string) => void;
  onFetchAll?: () => void;
  onFetchCategory?: (id: string) => void;
  onResetData?: () => void;
  isFetchingAll?: boolean;
  fetchProgress?: { current: number, total: number };
  onStopFetch?: () => void;
  listFontSize: number;
  marketLinks: MarketLink[];
  onMarketLinksChange: (links: MarketLink[]) => void;
  onLoadEnrichedData?: () => void;
  onDownloadEnrichedData?: () => void;
  folderColor?: FolderColor;
}

export default function Sidebar({
  categories,
  stocksLength,
  stocks = [],
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
  onMoveCategory,
  onReorderCategory,
  onMoveStocksToCategory,
  activeCategory,
  onSelectCategory,
  language,
  onExportJson,
  onImportJson,
  onFetchAll,
  onFetchCategory,
  onResetData,
  isFetchingAll,
  fetchProgress,
  onStopFetch,
  listFontSize,
  marketLinks,
  onMarketLinksChange,
  onLoadEnrichedData,
  onDownloadEnrichedData,
  folderColor = 'theme'
}: Props) {
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(false);
  const [isMarketLinkEditorOpen, setIsMarketLinkEditorOpen] = useState(false);
  const [marketTab, setMarketTab] = useState<'links' | 'tanken'>('links');
  const [tankenSubTab, setTankenSubTab] = useState<'fundamentals' | 'technicals'>('fundamentals');
  const [isTankenModalOpen, setIsTankenModalOpen] = useState(false);
  const [collapsedCatIds, setCollapsedCatIds] = useState<Set<string>>(new Set());
  const [isRestoreConfirmOpen, setIsRestoreConfirmOpen] = useState(false);
  const [isProxyModalOpen, setIsProxyModalOpen] = useState(false);

  // Drag & drop state for Sidebar
  const [draggingCatId, setDraggingCatId] = useState<string | null>(null);
  const [dragOverCatId, setDragOverCatId] = useState<string | null>(null);
  const [dragOverIsStock, setDragOverIsStock] = useState<boolean>(false);
  const [dragCatInsertPos, setDragCatInsertPos] = useState<'before' | 'after'>('before');
  const [dragOverUnassigned, setDragOverUnassigned] = useState<boolean>(false);
  
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const t = i18n[language];
  const sidebarFontSize = Math.min(20, Math.max(12, listFontSize));

  const unassignedCount = stocks.filter(s => !s.categoryId).length;

  const handleSaveMarketLinks = (links: MarketLink[]) => {
    onMarketLinksChange(links);
    setIsMarketLinkEditorOpen(false);
  };

  // Category Drag Handlers
  const handleCatDragStart = (e: React.DragEvent, c: Category) => {
    setDraggingCatId(c.id);
    e.dataTransfer.setData('text/category-id', c.id);
    e.dataTransfer.setData('text/plain', c.name);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleCatDragEnd = () => {
    setDraggingCatId(null);
    setDragOverCatId(null);
    setDragOverIsStock(false);
    setDragOverUnassigned(false);
  };

  const handleCatDragOver = (e: React.DragEvent, c: Category) => {
    e.preventDefault();
    e.stopPropagation();

    // Check if dragging a stock or a category
    const isStockDrag = !draggingCatId;
    setDragOverIsStock(isStockDrag);

    if (isStockDrag) {
      e.dataTransfer.dropEffect = 'move';
      if (dragOverCatId !== c.id) {
        setDragOverCatId(c.id);
      }
    } else {
      if (draggingCatId === c.id) return;
      e.dataTransfer.dropEffect = 'move';
      const rect = e.currentTarget.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const pos = e.clientY > midY ? 'after' : 'before';
      setDragOverCatId(c.id);
      setDragCatInsertPos(pos);
    }
  };

  const handleCatDragLeave = (e: React.DragEvent, c: Category) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    if (dragOverCatId === c.id) {
      setDragOverCatId(null);
      setDragOverIsStock(false);
    }
  };

  const handleCatDrop = (e: React.DragEvent, c: Category) => {
    e.preventDefault();
    e.stopPropagation();

    if (dragOverIsStock) {
      // Dropping stocks into this category
      let stockIdsToMove: string[] = [];
      try {
        const raw = e.dataTransfer.getData('application/json');
        if (raw) {
          const data = JSON.parse(raw);
          if (data.stockIds) stockIdsToMove = data.stockIds;
        }
      } catch {}
      if (stockIdsToMove.length === 0) {
        const singleId = e.dataTransfer.getData('text/stock-id');
        if (singleId) stockIdsToMove = [singleId];
      }

      if (stockIdsToMove.length > 0) {
        onMoveStocksToCategory?.(stockIdsToMove, c.id);
      }
    } else if (draggingCatId && draggingCatId !== c.id) {
      // Reordering categories
      onReorderCategory?.(draggingCatId, c.id, dragCatInsertPos);
    }

    setDraggingCatId(null);
    setDragOverCatId(null);
    setDragOverIsStock(false);
  };

  const handleUnassignedDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverUnassigned(true);
  };

  const handleUnassignedDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setDragOverUnassigned(false);
  };

  const handleUnassignedDrop = (e: React.DragEvent) => {
    e.preventDefault();
    let stockIdsToMove: string[] = [];
    try {
      const raw = e.dataTransfer.getData('application/json');
      if (raw) {
        const data = JSON.parse(raw);
        if (data.stockIds) stockIdsToMove = data.stockIds;
      }
    } catch {}
    if (stockIdsToMove.length === 0) {
      const singleId = e.dataTransfer.getData('text/stock-id');
      if (singleId) stockIdsToMove = [singleId];
    }
    if (stockIdsToMove.length > 0) {
      onMoveStocksToCategory?.(stockIdsToMove, '');
    }
    setDragOverUnassigned(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setIsAdding(false);
      setNewCatParentId(null);
      return;
    }
    onAddCategory(newCatName.trim(), newCatParentId);
    setNewCatName('');
    setNewCatParentId(null);
    setIsAdding(false);
  };

  const startAddSubCategory = (e: React.MouseEvent, parentId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNewCatParentId(parentId);
    setIsAdding(true);
    // 開いていない場合は展開
    setCollapsedCatIds(prev => {
      const next = new Set(prev);
      next.delete(parentId);
      return next;
    });
  };

  const toggleCollapse = (e: React.MouseEvent, catId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setCollapsedCatIds(prev => {
      const next = new Set(prev);
      if (next.has(catId)) {
        next.delete(catId);
      } else {
        next.add(catId);
      }
      return next;
    });
  };

  const startEditCategory = (e: React.MouseEvent, c: Category) => {
    e.preventDefault();
    e.stopPropagation();
    setEditingCatId(c.id);
    setEditCatName(c.name);
  };

  const saveEditCategory = (id: string) => {
    if (editCatName.trim()) {
      onUpdateCategory(id, editCatName.trim());
    }
    setEditingCatId(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      onImportJson(content);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const renderCategoryItem = (c: Category, level: number = 0) => {
    const children = getChildCategories(c.id, categories);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedCatIds.has(c.id);
    const isSelected = activeCategory === c.id;
    const { directCount, totalCount } = countStocksInCategory(c.id, categories, stocks);
    const displayCount = hasChildren && totalCount !== directCount ? `${directCount} / ${totalCount}` : directCount;

    const isDraggingThisCat = draggingCatId === c.id;
    const isDragOverThisCat = dragOverCatId === c.id;

    return (
      <div key={c.id} className="flex flex-col">
        <div className="relative group/cat">
          {editingCatId === c.id ? (
            <div className="flex gap-2 p-1" style={{ paddingLeft: `${level * 14 + 4}px` }}>
              <input
                autoFocus
                type="text"
                value={editCatName}
                onChange={e => setEditCatName(e.target.value)}
                onBlur={() => saveEditCategory(c.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter') saveEditCategory(c.id);
                  if (e.key === 'Escape') setEditingCatId(null);
                }}
                className="w-full flex items-center justify-start px-2 py-1 bg-base-bg border border-border-light text-text-bright focus:outline-none transition-colors"
                style={{ fontSize: sidebarFontSize }}
              />
            </div>
          ) : (
            <div
              onClick={() => onSelectCategory(c.id)}
              draggable
              onDragStart={(e) => handleCatDragStart(e, c)}
              onDragEnd={handleCatDragEnd}
              onDragOver={(e) => handleCatDragOver(e, c)}
              onDragLeave={(e) => handleCatDragLeave(e, c)}
              onDrop={(e) => handleCatDrop(e, c)}
              className={`w-full flex items-center justify-between py-1 px-2 cursor-pointer border transition-colors relative ${
                isDraggingThisCat ? 'opacity-40 border-dashed' : ''
              } ${
                isDragOverThisCat
                  ? (dragOverIsStock 
                      ? 'border-border-light bg-border-main/60 text-text-bright ring-1 ring-border-light' 
                      : (dragCatInsertPos === 'before' ? 'border-t-2 border-t-border-light bg-border-main/30' : 'border-b-2 border-b-border-light bg-border-main/30'))
                  : (isSelected 
                      ? 'border-border-light bg-border-main text-text-bright' 
                      : 'border-transparent text-text-normal hover:text-text-bright hover:bg-border-main/30')
              }`}
              style={{ paddingLeft: `${level * 14 + 4}px` }}
            >
              <div className="flex items-center gap-1 min-w-0 flex-1">
                {/* Drag Grip Handle */}
                <div 
                  className="cursor-grab active:cursor-grabbing text-text-dim/30 group-hover/cat:text-text-dim hover:!text-text-bright transition-colors p-0.5 shrink-0"
                  title={language === 'EN' ? 'Drag to reorder folder' : 'ドラッグしてフォルダーを並び替え'}
                >
                  <GripVertical size={11} />
                </div>

                {/* Expand / Collapse toggle arrow */}
                {hasChildren ? (
                  <button
                    onClick={(e) => toggleCollapse(e, c.id)}
                    className="p-0.5 hover:text-text-bright transition-colors shrink-0 -ml-1 text-text-normal"
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                  </button>
                ) : (
                  <span className="w-2 shrink-0" />
                )}

                {/* Folder icon */}
                {isSelected ? (
                  <FolderOpen size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, true, level === 0)}`} />
                ) : (
                  <Folder size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, false, level === 0)}`} />
                )}

                {/* Category name */}
                <span className="truncate font-bold text-left" style={{ fontSize: sidebarFontSize }}>
                  {c.name}
                </span>
              </div>

              {/* Right side: Count badge & Action icons */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {/* Count badge (SOLID style: [ 13 ]) */}
                <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-base-bg border border-border-main text-text-normal font-bold">
                  {displayCount}
                </span>

                {/* Hover actions */}
                <div className="hidden group-hover/cat:flex items-center gap-1">
                  {/* Add sub-category */}
                  <span
                    onClick={(e) => startAddSubCategory(e, c.id)}
                    className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                    title={language === 'EN' ? 'Add sub-directory' : '子フォルダーを追加'}
                  >
                    <FolderPlus size={11} />
                  </span>

                  {onFetchCategory && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); onFetchCategory(c.id); }} 
                      className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                      title={t.reacquire}
                    >
                      <Activity size={11} />
                    </span>
                  )}
                  {level === 0 && (
                    <>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onMoveCategory?.(c.id, 'up'); }} 
                        className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                        title={t.up}
                      >
                        <ArrowUp size={11} />
                      </span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onMoveCategory?.(c.id, 'down'); }} 
                        className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                        title={t.down}
                      >
                        <ArrowDown size={11} />
                      </span>
                    </>
                  )}
                  <span 
                    onClick={(e) => startEditCategory(e, c)} 
                    className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                    title={t.edit}
                  >
                    <Pencil size={11} />
                  </span>
                  <span 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (window.confirm(language === 'EN' ? `Delete category "${c.name}"?` : `「${c.name}」を削除しますか？`)) {
                        onDeleteCategory(c.id);
                      }
                    }} 
                    className="text-text-dim hover:text-text-bright p-0.5 cursor-pointer"
                    title={t.delete}
                  >
                    <Trash2 size={11} />
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Render child categories if not collapsed */}
        {hasChildren && !isCollapsed && (
          <div className="flex flex-col">
            {children.map(child => renderCategoryItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  const rootCategories = getChildCategories(null, categories);
  const flattenedCategories = getFlattenedCategoryTree(categories);

  return (
    <>
      <aside className="w-full h-full md:h-screen border-b md:border-b-0 md:border-r border-border-main bg-base-bg flex flex-col p-4 gap-4 overflow-y-auto z-10">
        
        {/* Header Branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-border-main border border-border-light flex items-center justify-center text-text-bright shrink-0">
            <LayoutGrid size={16} />
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-[13px] text-text-bright tracking-widest leading-tight">{t.appTitle}</h1>
            <h2 className="font-bold text-[11px] text-text-dim tracking-widest leading-tight">{t.appSubTitle}</h2>
          </div>
        </div>

        {/* Status Box */}
        <div className="border border-border-main bg-panel-bg p-3 relative flex flex-col">
          <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold">
            {t.systemStatus}
          </div>
          <div className="flex flex-col gap-1.5 text-[10px] text-text-dim mt-1">
            <div className="flex justify-between items-center">
              <span>DIR COUNT:</span>
              <span className="text-text-normal tabular-nums font-bold text-xs">{categories.length}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>{t.totalStocks}:</span>
              <span className="text-text-normal tabular-nums font-bold text-xs">{stocksLength}</span>
            </div>

            {isFetchingAll ? (
              <div className="mt-1.5 flex items-center gap-1.5">
                <div className="flex-1 h-7 flex items-center justify-center gap-1.5 border border-border-light text-text-bright bg-base-bg font-bold text-[11px]">
                  <Activity size={12} className="animate-pulse shrink-0 text-text-dim" />
                  <span className="truncate">{t.fetching} {fetchProgress?.current}/{fetchProgress?.total}</span>
                </div>
                {onStopFetch && (
                  <button
                    type="button"
                    onClick={onStopFetch}
                    className="h-7 px-2.5 flex items-center justify-center gap-1 border border-border-light text-text-dim hover:text-text-bright hover:bg-border-main font-bold text-[11px] transition-colors shrink-0"
                    title="取得処理を停止"
                  >
                    <Square size={11} className="fill-current" />
                    <span>{t.stopFetch}</span>
                  </button>
                )}
              </div>
            ) : (
              <button 
                onClick={onFetchAll} 
                className="mt-1.5 w-full h-7 flex items-center justify-center gap-2 border border-border-main text-text-bright bg-base-bg hover:bg-border-main/50 hover:border-border-light transition-colors font-bold text-[11px]"
              >
                <Activity size={12} className="text-text-dim" /> {t.fetchAll}
              </button>
            )}
          </div>
        </div>

        {/* Directory Explorer Sets */}
        <div className="border border-border-main bg-panel-bg p-3 pt-3.5 relative flex flex-col flex-1 min-h-0">
          <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold z-10 select-none">
            {t.directorySets}
          </div>
          
          {/* Scrollable Explorer List: Holds + New Dir, Market Data, All Data, Categories, and Unassigned */}
          <div className="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1 scrollbar-thin mt-1">
            {!isAdding ? (
              <button 
                onClick={() => {
                  setNewCatParentId(null);
                  setIsAdding(true);
                }}
                className="w-full h-7 flex items-center justify-center gap-2 border border-border-light hover:bg-border-main text-text-bright transition-colors text-xs font-bold shrink-0"
              >
                <Plus size={12} /> {t.newDir}
              </button>
            ) : (
              <form onSubmit={handleAdd} className="flex flex-col gap-1.5 p-2 bg-base-bg border border-border-light shrink-0">
                <div className="text-[10px] text-text-dim font-bold flex justify-between items-center">
                  <span>{newCatParentId ? (language === 'EN' ? 'NEW SUB-DIRECTORY' : 'サブフォルダー新規作成') : (language === 'EN' ? 'NEW ROOT DIRECTORY' : 'ルートフォルダー新規作成')}</span>
                  <button type="button" onClick={() => { setIsAdding(false); setNewCatParentId(null); }} className="hover:text-text-bright">✕</button>
                </div>
                <input
                  autoFocus
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder={t.dirName}
                  className="w-full h-7 px-2 bg-panel-bg border border-border-main text-text-bright text-xs focus:outline-none focus:border-border-light"
                />
                <div className="flex gap-1.5 items-center">
                  <select
                    value={newCatParentId || ''}
                    onChange={e => setNewCatParentId(e.target.value || null)}
                    className="flex-1 h-6 bg-panel-bg border border-border-main text-text-dim text-[10px] px-1 outline-none"
                  >
                    <option value="">{language === 'EN' ? '(Root Level)' : '(親なし・ルート)'}</option>
                    {flattenedCategories.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                  <button type="submit" className="h-6 px-2.5 bg-border-light text-text-bright hover:bg-[#58a6ff] text-[10px] font-bold transition-colors">
                    +
                  </button>
                </div>
              </form>
            )}

            {/* STOCK MARKET DATA */}
            <div className="mt-1 shrink-0">
              <div 
                onClick={() => setIsMarketDataOpen(!isMarketDataOpen)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 transition-colors cursor-pointer group border ${
                  isMarketDataOpen 
                    ? 'border-border-light/60 bg-border-main/50 text-text-bright' 
                    : 'border-transparent text-text-normal hover:text-text-bright hover:bg-border-main/20'
                }`}
              >
                <div className="flex-1 flex items-center gap-2 text-left">
                  <LineChart size={13} className={`shrink-0 ${isMarketDataOpen ? 'text-text-bright' : 'text-text-normal'}`} />
                  <span className="font-bold truncate" style={{ fontSize: sidebarFontSize }}>[ STOCK MARKET DATA ]</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setIsMarketLinkEditorOpen(true); }}
                    className="opacity-0 group-hover:opacity-100 p-1 text-text-normal hover:text-text-bright hover:bg-border-main/60 rounded transition-all"
                    title={t.edit || 'EDIT'}
                  >
                    <Settings size={12} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); onSelectCategory('MARKET_DATA'); }}
                    className="p-1 border border-border-main hover:border-border-light bg-base-bg text-text-normal hover:text-text-bright rounded-xs transition-colors shadow-2xs flex items-center justify-center"
                    title="メイン画面で全画面表示"
                  >
                    <Maximize2 size={12} />
                  </button>
                </div>
              </div>

              {isMarketDataOpen && (
                <div className="flex flex-col mt-1 mb-2 border border-border-main/60 bg-base-bg/60 p-2 rounded-xs">
                  {/* Top Bar with Main Screen Open Button */}
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-border-main/50 text-[10px]">
                    <span className="text-text-normal font-bold">市場データ・リンク</span>
                    <button
                      onClick={() => onSelectCategory('MARKET_DATA')}
                      className="flex items-center gap-1 text-text-normal hover:text-text-bright hover:underline font-bold"
                    >
                      <Maximize2 size={10} />
                      <span>メイン画面で開く</span>
                    </button>
                  </div>

                  {/* Tab Selector: [リンク] [銘柄探検] */}
                  <div className="grid grid-cols-2 gap-1 mb-2 border-b border-border-main/60 pb-1.5 text-[10px]">
                    <button
                      onClick={() => setMarketTab('links')}
                      className={`py-1 text-center font-bold transition-colors rounded-xs ${
                        marketTab === 'links'
                          ? 'bg-border-main text-text-bright border border-border-light/50 shadow-xs'
                          : 'text-text-normal hover:text-text-bright bg-panel-bg'
                      }`}
                    >
                      リンク
                    </button>
                    <button
                      onClick={() => setMarketTab('tanken')}
                      className={`py-1 text-center font-bold transition-colors rounded-xs ${
                        marketTab === 'tanken'
                          ? 'bg-border-main text-text-bright border border-border-light/50 shadow-xs'
                          : 'text-text-normal hover:text-text-bright bg-panel-bg'
                      }`}
                    >
                      銘柄探検
                    </button>
                  </div>

                  {/* Tab 1: 市場リンク */}
                  {marketTab === 'links' && (
                    <div className="flex flex-col gap-1 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin">
                      <div className="flex items-center justify-between px-1 pb-1 text-[9px] text-text-normal border-b border-border-main/30">
                        <span>クイックリンク ({marketLinks.length})</span>
                        <button
                          onClick={() => setIsMarketLinkEditorOpen(true)}
                          className="hover:text-text-bright flex items-center gap-0.5 text-text-normal"
                        >
                          <Settings size={9} />
                          <span>編集</span>
                        </button>
                      </div>
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
                          className="flex items-center justify-between text-text-normal hover:text-text-bright hover:bg-border-main/50 px-2 py-1 rounded transition-colors group"
                          title={`${link.title}（別ウィンドウで開く）`}
                        >
                          <span className="truncate pr-1 font-medium" style={{ fontSize: Math.max(11, sidebarFontSize - 1) }}>{link.title}</span>
                          <ExternalLink size={10} className="shrink-0 opacity-60 group-hover:opacity-100 group-hover:text-text-bright" />
                        </a>
                      ))}
                    </div>
                  )}

                  {/* Tab 2: 銘柄探検 */}
                  {marketTab === 'tanken' && (
                    <div className="flex flex-col gap-1.5">
                      {/* Sub tab & Fullscreen button */}
                      <div className="flex items-center justify-between gap-1 text-[10px]">
                        <div className="flex items-center gap-1 flex-1">
                          <button
                            onClick={() => setTankenSubTab('fundamentals')}
                            className={`flex-1 py-0.5 text-center font-bold rounded-xs transition-colors text-[10px] ${
                              tankenSubTab === 'fundamentals'
                                ? 'bg-border-main text-text-bright border border-border-light/50'
                                : 'text-text-normal hover:text-text-bright bg-panel-bg'
                            }`}
                          >
                            ファンダ
                          </button>
                          <button
                            onClick={() => setTankenSubTab('technicals')}
                            className={`flex-1 py-0.5 text-center font-bold rounded-xs transition-colors text-[10px] ${
                              tankenSubTab === 'technicals'
                                ? 'bg-border-main text-text-bright border border-border-light/50'
                                : 'text-text-normal hover:text-text-bright bg-panel-bg'
                            }`}
                          >
                            テクニカル
                          </button>
                        </div>
                        <button
                          onClick={() => setIsTankenModalOpen(true)}
                          className="px-1.5 py-0.5 bg-panel-bg hover:bg-border-main border border-border-main text-text-normal hover:text-text-bright flex items-center gap-1 rounded-xs transition-colors text-[10px]"
                          title="全画面で2列表示"
                        >
                          <Maximize2 size={10} />
                          <span>全画面</span>
                        </button>
                      </div>

                      {/* Links list */}
                      <div className="flex flex-col gap-2 max-h-[280px] overflow-y-auto pr-1 scrollbar-thin pt-1">
                        {(tankenCategories.find(c => c.id === tankenSubTab)?.groups || []).map((group, gIdx) => (
                          <div key={gIdx} className="space-y-0.5">
                            <div className={`text-[10px] font-bold px-1 py-0.5 flex items-center gap-1 border-b ${
                              tankenSubTab === 'fundamentals' ? 'text-[#f59e0b] border-[#d97706]/30' : 'text-[#4ade80] border-[#16a34a]/30'
                            }`}>
                              <span className={`w-1 h-2 rounded-xs ${tankenSubTab === 'fundamentals' ? 'bg-[#f59e0b]' : 'bg-[#4ade80]'}`} />
                              <span className="truncate">{group.groupName}</span>
                            </div>
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
                                className="group flex items-center justify-between px-2 py-0.5 text-text-normal hover:text-text-bright hover:bg-border-main/50 rounded transition-colors"
                                title={`${item.title}（別ウィンドウで開く）`}
                              >
                                <span className="truncate group-hover:underline font-medium" style={{ fontSize: Math.max(11, sidebarFontSize - 1) }}>{item.title}</span>
                                <ExternalLink size={9} className="shrink-0 opacity-0 group-hover:opacity-100 text-text-bright ml-1" />
                              </a>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* [ ALL DATA ] item with total count badge */}
            <button 
              onClick={() => onSelectCategory(null)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 border transition-colors mt-1 shrink-0 ${
                activeCategory === null 
                  ? 'border-border-light bg-border-main text-text-bright' 
                  : 'border-transparent text-text-normal hover:text-text-bright'
              }`}
            >
              <div className="flex items-center gap-2">
                <Folders size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, activeCategory === null, true)}`} />
                <span className="font-bold" style={{ fontSize: sidebarFontSize }}>[ {t.allData} ]</span>
              </div>
              <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-base-bg border border-border-main text-text-normal font-bold">
                {stocksLength}
              </span>
            </button>
            
            {/* Hierarchical Categories Tree */}
            <div className="flex flex-col gap-0.5 mt-1">
              {rootCategories.map(c => renderCategoryItem(c, 0))}

              {/* UNASSIGNED item */}
              <button 
                onClick={() => onSelectCategory('UNASSIGNED')}
                onDragOver={handleUnassignedDragOver}
                onDragLeave={handleUnassignedDragLeave}
                onDrop={handleUnassignedDrop}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 border transition-colors group/unassigned mt-1 ${
                  dragOverUnassigned
                    ? 'border-border-light bg-border-main/60 text-text-bright ring-1 ring-border-light'
                    : (activeCategory === 'UNASSIGNED' 
                        ? 'border-border-light bg-border-main text-text-bright' 
                        : 'border-transparent text-text-normal hover:text-text-bright')
                }`}
              >
                <div className="flex items-center gap-2">
                  <FolderOpen size={13} className={`shrink-0 transition-colors ${getFolderColorClass(folderColor, activeCategory === 'UNASSIGNED', false)}`} />
                  <span className="truncate flex-1 text-left font-bold" style={{ fontSize: sidebarFontSize }}>{t.unassigned}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] font-mono tabular-nums px-1.5 py-0.2 bg-base-bg border border-border-main text-text-normal font-bold">
                    {unassignedCount}
                  </span>
                  {onFetchCategory && (
                    <span 
                      onClick={(e) => { e.stopPropagation(); onFetchCategory('UNASSIGNED'); }} 
                      className="opacity-0 group-hover/unassigned:opacity-100 text-text-dim hover:text-text-bright p-0.5 ml-1"
                      title={t.reacquire}
                    >
                      <Activity size={11} />
                    </span>
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Data Management Footer - Pinned at bottom inside card */}
          <div className="shrink-0 pt-2.5 mt-2 border-t border-border-main flex flex-col gap-1.5 bg-panel-bg z-10">
            <div className="text-[10px] text-text-dim mb-0.5 font-bold flex items-center justify-between">
              <span>{t.dataManagement}</span>
              <span className="text-[9px] text-text-dim font-mono">228 STOCKS</span>
            </div>
            
            <button onClick={onExportJson} className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs group">
              <Download size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" /> {t.exportJson}
            </button>
            <button onClick={() => jsonInputRef.current?.click()} className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs group">
              <FileCode size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" /> {t.importJson}
            </button>

            <button 
              type="button"
              onClick={onDownloadEnrichedData} 
              className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs mt-1 cursor-pointer group"
              title="228銘柄の概要付きJSONファイルを保存"
            >
              <Download size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" />
              <span>概要付JSONをダウンロード</span>
            </button>

            <button 
              type="button"
              onClick={() => setIsProxyModalOpen(true)} 
              className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs cursor-pointer group"
              title="GitHub Pagesや外部環境用の株価取得API / プロキシURL設定"
            >
              <Globe size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" />
              <span>外部株価API設定 (GitHub Pages用)</span>
            </button>

            {onLoadEnrichedData && (
              <button 
                onClick={() => setIsRestoreConfirmOpen(true)} 
                className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs font-bold group"
                title="全228銘柄と各社の企業概要（事業内容・強み）を初期プリセットから復元します（確認画面が開きます）"
              >
                <Sparkles size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" />
                <span>228銘柄（概要付）を復元</span>
              </button>
            )}

            <button onClick={onResetData} className="w-full h-7 flex items-center justify-start px-2.5 gap-2 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors text-xs mt-1 group">
              <Trash2 size={11} className="shrink-0 text-text-dim group-hover:text-text-bright transition-colors" /> {t.resetData}
            </button>
            <input type="file" accept=".json" className="hidden" ref={jsonInputRef} onChange={e => handleFileChange(e)} />
          </div>
        </div>
        
        <div className="text-[9px] text-text-dim/50 shrink-0 text-center">
          {t.systemReady}
        </div>
      </aside>
      {isMarketLinkEditorOpen && (
        <MarketLinkEditor
          initialLinks={marketLinks}
          onSave={handleSaveMarketLinks}
          onClose={() => setIsMarketLinkEditorOpen(false)}
          language={language}
        />
      )}

      {isTankenModalOpen && (
        <TankenExplorerModal
          onClose={() => setIsTankenModalOpen(false)}
        />
      )}

      {/* 228銘柄復元 確認ダイアログ */}
      {isRestoreConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-panel-bg border border-border-light shadow-2xl rounded-xs overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg">
              <div className="flex items-center gap-2 text-[#f59e0b] font-bold text-xs md:text-sm">
                <AlertTriangle size={16} className="shrink-0 text-[#f59e0b]" />
                <span>228銘柄プリセット復元の確認</span>
              </div>
              <button 
                onClick={() => setIsRestoreConfirmOpen(false)}
                className="text-text-dim hover:text-text-bright transition-colors p-1"
                title="閉じる"
              >
                <X size={14} />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 flex flex-col gap-3 text-xs leading-relaxed text-text-normal">
              <div className="p-3 bg-[#f85149]/10 border border-[#f85149]/30 rounded-xs text-[#ff7b72] font-bold flex items-start gap-2">
                <AlertTriangle size={16} className="shrink-0 mt-0.5 text-[#ff7b72]" />
                <div>
                  【注意】現在のデータはすべて上書きされます
                </div>
              </div>

              <div className="text-text-bright font-medium">
                この操作を実行すると、現在登録されている銘柄データ・新しく作成したカテゴリー・編集したメモなどは<span className="text-[#ff7b72] font-bold">差分ではなくすべて初期状態に上書きリセット</span>されます。
              </div>

              <div className="p-2.5 bg-base-bg border border-border-main text-[11px] text-text-dim rounded-xs leading-normal">
                💡 現在のデータを残しておきたい場合は、一旦「キャンセル」し、事前に「<span className="text-text-bright font-bold">JSONエクスポート</span>」で現在のバックアップファイルを保存してください。
              </div>

              <div className="text-text-bright text-xs pt-1 font-bold">
                本当に初期プリセット（228銘柄・概要付き）へ復元しますか？
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-main bg-base-bg">
              <button
                type="button"
                onClick={() => setIsRestoreConfirmOpen(false)}
                className="px-3.5 py-1.5 border border-border-main bg-panel-bg hover:bg-border-main text-text-bright text-xs font-bold transition-colors rounded-xs"
              >
                キャンセル
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsRestoreConfirmOpen(false);
                  onLoadEnrichedData?.();
                }}
                className="px-3.5 py-1.5 border border-[#f85149]/60 bg-[#f85149]/20 hover:bg-[#f85149]/30 text-[#ff7b72] text-xs font-bold transition-colors rounded-xs flex items-center gap-1.5"
              >
                <Sparkles size={12} />
                <span>上書き復元を実行する</span>
              </button>
            </div>
          </div>
        </div>
      )}
      <ProxySettingsModal 
        isOpen={isProxyModalOpen} 
        onClose={() => setIsProxyModalOpen(false)} 
      />
    </>
  );
}
