import React, { useState } from 'react';
import { Database, FileText, Trash2, CheckSquare, Square, Pencil, ExternalLink, ArrowUp, ArrowDown, ChevronsUp, ChevronsDown, X } from 'lucide-react';
import { Stock, Category } from '../types';
import { Language, i18n } from '../i18n';

interface Props {
  stocks: Stock[];
  categories: Category[];
  onDelete: (ids: string[]) => void;
  onUpdate: (id: string, updates: Partial<Stock>) => void;
  onMoveStock?: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;
  onMoveStocksToCategory?: (ids: string[], categoryId: string) => void;
  language: Language;
  fontSize: number;
}

export default function StockList({ stocks, categories, onDelete, onUpdate, onMoveStock, onMoveStocksToCategory, language, fontSize }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const t = i18n[language];

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || t.unassigned;

  const filteredStocks = stocks.filter(st => 
    st.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    st.code.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (ms: number) => {
    const d = new Date(ms);
    return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
  };

  const toggleSelect = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const newIds = new Set(selectedIds);
    if (newIds.has(id)) {
      newIds.delete(id);
    } else {
      newIds.add(id);
    }
    setSelectedIds(newIds);
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

  return (
    <div className="border border-border-main bg-panel-bg p-4 pt-6 relative w-full flex-1 flex flex-col min-h-0">
      <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold tracking-widest">
        {t.dataBanks}
      </div>

      <div className="mb-4 relative">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t.search}
          className="w-full h-9 px-3 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      <div className="flex items-center justify-between text-[10px] text-text-dim border-b border-border-main pb-2 mb-2 px-2 shrink-0">
        <span>{t.sortDate} &nbsp; {t.totalRecs} {filteredStocks.length}</span>
        
        {filteredStocks.length > 0 && (
          <div className="flex gap-4">
             <button 
                onClick={toggleSelectAll}
                className="hover:text-text-bright transition-colors flex items-center gap-1"
             >
                {selectedIds.size === filteredStocks.length && filteredStocks.length > 0 ? <CheckSquare size={12} /> : <Square size={12} />}
                {t.selectAll}
             </button>
             {selectedIds.size > 0 && (
                 <div className="flex items-center gap-3">
                   {onMoveStocksToCategory && (
                     <select 
                        className="bg-panel-bg border border-border-main text-text-normal text-[10px] px-2 py-0.5 outline-none"
                        title={language === 'EN' ? 'Move to category' : 'カテゴリー移動'}
                        onChange={(e) => {
                           if (e.target.value) {
                             const targetCat = e.target.value === 'UNASSIGNED' ? '' : e.target.value;
                             onMoveStocksToCategory(Array.from(selectedIds), targetCat);
                             setSelectedIds(new Set());
                             e.target.value = "";
                           }
                        }}
                     >
                       <option value="">{language === 'EN' ? '-- Move to --' : '-- 移動先 --'}</option>
                       <option value="UNASSIGNED">{t.unassigned}</option>
                       {categories.map(c => (
                         <option key={c.id} value={c.id}>{c.name}</option>
                       ))}
                     </select>
                   )}
                   <button 
                      onClick={handleDelete}
                      className="text-[#ff7b72] hover:text-[#ff9b94] transition-colors flex items-center gap-1 font-bold"
                   >
                      <Trash2 size={12} /> {t.deleteSelected} ({selectedIds.size})
                   </button>
                 </div>
             )}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 sm:gap-4 text-[10px] font-bold text-text-dim border-b border-border-main pb-3 mb-2 px-2 shrink-0 tracking-wider">
        <span className="w-8 shrink-0"></span>
        <span className="w-16 shrink-0 md:min-w-[80px]">CODE</span>
        <span className="flex-[2] min-w-[200px]">{t.nodeTitle}</span>
        <span className="flex-1 min-w-[120px] hidden md:block">{t.directory}</span>
        <span className="w-24 text-right hidden sm:block">{t.timestamp}</span>
        <span className="w-32 text-right hidden sm:block"></span>
        <span className="w-10 text-right">{t.source}</span>
      </div>
      
      <div className="overflow-y-auto flex-1 pr-2 min-h-0">
        {filteredStocks.length === 0 ? (
          <div className="h-full flex items-center justify-center text-text-dim/50 text-[10px]">
             {stocks.length === 0 ? t.awaitingInit : 'NO RESULTS'}
          </div>
        ) : (
          <div className="flex flex-col">
            {filteredStocks.map((st) => (
              <div 
                key={st.id}
                className={`flex items-center py-3 px-2 border-b border-border-main border-dashed hover:bg-border-main/20 group transition-colors gap-2 sm:gap-4 ${selectedIds.has(st.id) ? 'bg-border-main/10' : ''}`}
              >
                <div 
                   className="w-8 flex justify-center shrink-0 cursor-pointer"
                   onClick={(e) => toggleSelect(st.id, e)}
                >
                   {selectedIds.has(st.id) ? 
                      <CheckSquare size={14} className="text-text-bright" /> : 
                      <Square size={14} className="text-text-dim group-hover:text-text-normal" />
                   }
                </div>

                <a 
                  href={`https://kabutan.jp/stock/?code=${st.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-16 shrink-0 md:min-w-[80px] font-bold tracking-widest text-[#ef4444] hover:underline"
                >
                  {st.code}
                </a>

                <div className="flex-[2] min-w-[200px] flex items-center gap-3 overflow-hidden">
                  <a 
                    href={`https://kabutan.jp/stock/chart?code=${st.code}`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-8 h-8 flex items-center justify-center bg-base-bg text-text-normal shrink-0 border border-border-main/50 hover:bg-border-light hover:text-text-bright transition-colors"
                    title="チャート"
                  >
                    <FileText size={14} />
                  </a>
                  {editingId === st.id ? (
                      <input
                        type="text"
                        className="flex-1 min-w-0 bg-base-bg border border-border-light text-text-bright px-2 py-1 focus:outline-none"
                        style={{ fontSize: fontSize }}
                        value={editName}
                        onChange={e => setEditName(e.target.value)}
                        onBlur={() => saveEdit(st.id)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') saveEdit(st.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        onClick={e => {
                            e.preventDefault();
                            e.stopPropagation();
                        }}
                        autoFocus
                      />
                  ) : (
                      <div className="flex items-center gap-2 overflow-hidden flex-1">
                          <a 
                            href={`https://kabutan.jp/stock/?code=${st.code}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-text-normal hover:text-[#ef4444] hover:underline truncate font-medium"
                            style={{ fontSize: fontSize }}
                          >
                              {st.name}
                          </a>
                          {st.price && st.price !== '?' && (
                             <span className="text-text-bright tabular-nums bg-border-main/30 px-2 py-0.5 border border-border-main/50 rounded-sm shrink-0 font-bold ml-1">
                                ¥{st.price}
                             </span>
                          )}
                      </div>
                  )}
                </div>

                <div className="flex-1 min-w-[120px] hidden md:flex items-center gap-2 text-text-dim truncate">
                   <Database size={10} className="shrink-0" />
                   <span className="truncate" style={{ fontSize: fontSize }}>{getCategoryName(st.categoryId)}</span>
                </div>

                <div className="w-24 text-right text-text-dim text-[10px] shrink-0 hidden sm:flex items-center justify-end">
                  {formatDate(st.createdAt)}
                </div>

                <div className="w-32 flex items-center justify-end gap-1 shrink-0 overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity hidden sm:flex">
                    <button onClick={(e) => startEdit(e, st)} className="text-text-dim hover:text-text-bright p-1" title={t.edit}><Pencil size={12} /></button>
                    <button onClick={() => onMoveStock?.(st.id, 'top')} className="text-text-dim hover:text-text-bright p-1" title={t.top}><ChevronsUp size={12} /></button>
                    <button onClick={() => onMoveStock?.(st.id, 'up')} className="text-text-dim hover:text-text-bright p-1" title={t.up}><ArrowUp size={12} /></button>
                    <button onClick={() => onMoveStock?.(st.id, 'down')} className="text-text-dim hover:text-text-bright p-1" title={t.down}><ArrowDown size={12} /></button>
                    <button onClick={() => onMoveStock?.(st.id, 'bottom')} className="text-text-dim hover:text-text-bright p-1" title={t.bottom}><ChevronsDown size={12} /></button>
                </div>

                <a 
                  href={`https://kabutan.jp/stock/?code=${st.code}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-10 flex justify-end text-text-dim text-[10px] shrink-0 font-bold hover:text-text-normal transition-colors"
                >
                  <ExternalLink size={14} />
                </a>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-base-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-panel-bg border border-border-main p-6 max-w-sm w-full flex flex-col gap-4 shadow-xl">
            <h3 className="text-text-bright font-bold tracking-widest text-sm flex items-center gap-2">
              <Trash2 size={16} className="text-[#ff7b72]" /> 
              {language === 'EN' ? 'CONFIRM DELETION' : '削除の確認'}
            </h3>
            <p className="text-text-dim text-xs leading-relaxed">
              {t.confirmDelete}
            </p>
            <div className="flex justify-end gap-3 mt-4">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 border border-border-main hover:bg-border-main/50 text-text-normal transition-colors text-[10px] font-bold tracking-widest"
              >
                {language === 'EN' ? 'CANCEL' : 'キャンセル'}
              </button>
              <button 
                onClick={confirmDeleteAction}
                className="px-4 py-2 bg-[#ff7b72]/10 border border-[#ff7b72]/30 text-[#ff7b72] hover:bg-[#ff7b72]/20 transition-colors text-[10px] font-bold tracking-widest"
              >
                {t.delete}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
