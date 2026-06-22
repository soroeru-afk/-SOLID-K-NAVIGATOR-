import React, { useState, useRef, useEffect } from 'react';
import { LayoutGrid, Folders, Plus, FolderOpen, Download, Upload, FileCode, Pencil, Trash2, ArrowUp, ArrowDown, Activity, ChevronDown, ChevronRight, LineChart, ExternalLink, Settings } from 'lucide-react';
import { Category, MarketLink } from '../types';
import { Language, i18n } from '../i18n';
import MarketLinkEditor from './MarketLinkEditor';
interface Props {
  categories: Category[];
  stocksLength: number;
  onAddCategory: (name: string) => void;
  onUpdateCategory: (id: string, name: string) => void;
  onDeleteCategory: (id: string) => void;
  onMoveCategory?: (id: string, direction: 'up' | 'down') => void;
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
  fontSize: number;
  marketLinks: MarketLink[];
  onMarketLinksChange: (links: MarketLink[]) => void;
}

export default function Sidebar({ categories, stocksLength, onAddCategory, onUpdateCategory, onDeleteCategory, onMoveCategory, activeCategory, onSelectCategory, language, onExportJson, onImportJson, onFetchAll, onFetchCategory, onResetData, isFetchingAll, fetchProgress, fontSize, marketLinks, onMarketLinksChange }: Props) {
  const [newCatName, setNewCatName] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editCatName, setEditCatName] = useState('');
  const [isMarketDataOpen, setIsMarketDataOpen] = useState(false);
  const [isMarketLinkEditorOpen, setIsMarketLinkEditorOpen] = useState(false);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const t = i18n[language];

  const handleSaveMarketLinks = (links: MarketLink[]) => {
    onMarketLinksChange(links);
    setIsMarketLinkEditorOpen(false);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      setIsAdding(false);
      return;
    }
    onAddCategory(newCatName.trim());
    setNewCatName('');
    setIsAdding(false);
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

  const handleOpenFilePicker = async () => {
    try {
      if ('showOpenFilePicker' in window) {
        await (window as any).showOpenFilePicker({
          id: 'knav-launcher-picker',
          types: [{
            description: 'Batch Files',
            accept: {
              'application/x-msdos-program': ['.bat', '.cmd']
            }
          }]
        });
      } else {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.bat,.cmd';
        input.click();
      }
    } catch (e) {
      // User cancelled or not supported
    }
  };

  return (
    <>
      <aside className="w-full h-full md:h-screen border-b md:border-b-0 md:border-r border-border-main bg-base-bg flex flex-col p-4 gap-6 overflow-y-auto z-10">
        
        <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-border-main border border-border-light flex items-center justify-center text-text-bright shrink-0">
          <LayoutGrid size={16} />
        </div>
        <div className="flex flex-col">
          <h1 className="font-bold text-[13px] text-text-bright tracking-widest leading-tight">{t.appTitle}</h1>
          <h2 className="font-bold text-[11px] text-text-dim tracking-widest leading-tight">{t.appSubTitle}</h2>
        </div>
      </div>

      <div className="border border-border-main bg-panel-bg p-4 relative flex flex-col">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold">
          {t.systemStatus}
        </div>
        <div className="flex flex-col gap-2 text-[10px] text-text-dim mt-2">
          <div className="flex justify-between items-center">
            <span>DIR COUNT:</span>
            <span className="text-text-normal font-mono font-bold text-xs">{categories.length}</span>
          </div>
          <div className="flex justify-between items-center">
            <span>{t.totalStocks}:</span>
            <span className="text-text-normal font-mono font-bold text-xs">{stocksLength}</span>
          </div>

          <button 
            onClick={onFetchAll} 
            disabled={isFetchingAll}
            className="mt-2 w-full h-8 flex items-center justify-center gap-2 border border-border-main text-[#58a6ff] hover:text-[#58a6ff] bg-base-bg hover:bg-border-main/50 transition-colors disabled:opacity-50 font-bold"
          >
              {isFetchingAll ? (
                <><Activity size={12} className="animate-pulse" /> {t.fetching} {fetchProgress?.current}/{fetchProgress?.total}</>
              ) : (
                <><Activity size={12} /> {t.fetchAll}</>
              )}
          </button>
        </div>
      </div>

      <div className="border border-border-main bg-panel-bg p-4 relative flex flex-col gap-2">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold">
          {t.serverLauncher}
        </div>
        <div className="flex flex-col gap-2 text-[10px] mt-2">
          <button 
            onClick={handleOpenFilePicker} 
            className="w-full h-8 flex items-center justify-center gap-2 border border-border-light hover:bg-border-main text-text-bright transition-colors font-bold"
          >
            <FolderOpen size={12} /> {t.launchServer}
          </button>
          <p className="text-[9px] text-text-dim leading-relaxed">{t.regHelp}</p>
        </div>
      </div>

      <div className="border border-border-main bg-panel-bg p-4 relative flex flex-col flex-1">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold">
          {t.directorySets}
        </div>
        
        <div className="mt-2 flex flex-col gap-2">
          {!isAdding ? (
            <button 
              onClick={() => setIsAdding(true)}
              className="w-full h-8 flex items-center justify-center gap-2 border border-border-light hover:bg-border-main text-text-bright transition-colors"
            >
              <Plus size={12} /> {t.newDir}
            </button>
          ) : (
            <form onSubmit={handleAdd} className="flex gap-2">
              <input
                autoFocus
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                onBlur={() => {if(!newCatName) setIsAdding(false)}}
                placeholder={t.dirName}
                className="w-full h-8 px-2 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
              />
              <button type="submit" className="h-8 px-3 bg-border-light text-text-bright hover:bg-accent-bg hover:text-accent-text transition-colors">
                +
              </button>
            </form>
          )}

          <div className="mt-4">
            <div className="w-full flex items-center justify-between px-3 py-1.5 text-text-dim hover:text-text-normal transition-colors cursor-pointer group">
              <button 
                onClick={() => setIsMarketDataOpen(!isMarketDataOpen)}
                className="flex-1 flex items-center gap-3 text-left"
              >
                <LineChart size={12} className="shrink-0" />
                <span style={{ fontSize: fontSize }}>[ STOCK MARKET DATA ]</span>
              </button>
              <div className="flex items-center gap-2">
                <button 
                  onClick={(e) => { e.stopPropagation(); setIsMarketLinkEditorOpen(true); }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#58a6ff] transition-all"
                  title={t.edit || 'EDIT'}
                >
                  <Settings size={12} />
                </button>
                <button onClick={() => setIsMarketDataOpen(!isMarketDataOpen)}>
                  {isMarketDataOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                </button>
              </div>
            </div>
            {isMarketDataOpen && (
              <div className="pl-8 flex flex-col gap-1 mt-1 mb-2 pr-2">
                {marketLinks.map(link => (
                  <a 
                    key={link.id} 
                    href={link.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-text-dim hover:text-text-normal hover:bg-border-main/50 px-2 py-1 rounded transition-colors group"
                  >
                    <ExternalLink size={10} className="shrink-0 opacity-50 group-hover:opacity-100" />
                    <span className="truncate" style={{ fontSize: fontSize - 1 }}>{link.title}</span>
                  </a>
                ))}
              </div>
            )}
          </div>

          <button 
            onClick={() => onSelectCategory(null)}
            className={`w-full flex items-center justify-start px-3 py-1.5 gap-3 border ${activeCategory === null ? 'border-border-light bg-border-main text-text-bright' : 'border-transparent text-text-dim hover:text-text-normal'} transition-colors mt-2`}
          >
            <Folders size={12} className="shrink-0" />
            <span style={{ fontSize: fontSize }}>[ {t.allData} ]</span>
          </button>
          
          <button 
            onClick={() => onSelectCategory('UNASSIGNED')}
            className={`w-full flex items-center justify-start px-3 py-1.5 gap-3 border ${activeCategory === 'UNASSIGNED' ? 'border-border-light bg-border-main text-text-bright' : 'border-transparent text-text-dim hover:text-text-normal'} transition-colors group/unassigned`}
          >
            <FolderOpen size={12} className={`shrink-0 ${activeCategory === 'UNASSIGNED' ? 'text-text-bright' : 'text-text-dim'}`} />
            <span className="truncate flex-1 text-left" style={{ fontSize: fontSize }}>[ {t.unassigned} ]</span>
            <div className="opacity-0 group-hover/unassigned:opacity-100 flex items-center gap-2">
                {onFetchCategory && (
                <span 
                    onClick={(e) => { e.stopPropagation(); onFetchCategory('UNASSIGNED'); }} 
                    className="text-text-dim hover:text-[#58a6ff]"
                    title={t.reacquire}
                >
                    <Activity size={12} />
                </span>
                )}
            </div>
          </button>

          <div className="flex flex-col gap-1 mt-2 mx-1 overflow-y-auto">
            {categories.map(c => (
              <div key={c.id} className="relative group/cat">
                {editingCatId === c.id ? (
                  <div className="flex gap-2">
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
                      className="w-full flex items-center justify-start px-2 py-1.5 bg-base-bg border border-border-light text-text-bright focus:outline-none transition-colors"
                      style={{ fontSize: fontSize }}
                    />
                  </div>
                ) : (
                  <button
                    onClick={() => onSelectCategory(c.id)}
                    className={`w-full flex items-center justify-start px-3 py-1.5 gap-3 border ${activeCategory === c.id ? 'border-border-light bg-border-main text-text-bright' : 'border-transparent text-text-dim hover:text-text-normal'} transition-colors`}
                  >
                    <FolderOpen size={12} className={`shrink-0 ${activeCategory === c.id ? 'text-text-bright' : 'text-text-dim'}`} />
                    <span className="truncate flex-1 text-left" style={{ fontSize: fontSize }}>{c.name}</span>
                    <div className="opacity-0 group-hover/cat:opacity-100 flex items-center gap-2">
                      {onFetchCategory && (
                        <span 
                          onClick={(e) => { e.stopPropagation(); onFetchCategory(c.id); }} 
                          className="text-text-dim hover:text-[#58a6ff] mr-1"
                          title={t.reacquire}
                        >
                           <Activity size={12} />
                        </span>
                      )}
                      <span 
                        onClick={(e) => { e.stopPropagation(); onMoveCategory?.(c.id, 'up'); }} 
                        className="text-text-dim hover:text-text-bright"
                        title={t.up}
                      >
                         <ArrowUp size={12} />
                      </span>
                      <span 
                        onClick={(e) => { e.stopPropagation(); onMoveCategory?.(c.id, 'down'); }} 
                        className="text-text-dim hover:text-text-bright"
                        title={t.down}
                      >
                         <ArrowDown size={12} />
                      </span>
                      <span 
                        onClick={(e) => startEditCategory(e, c)} 
                        className="text-text-dim hover:text-text-bright ml-1"
                        title={t.edit}
                      >
                         <Pencil size={12} />
                      </span>
                      <span 
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          onDeleteCategory(c.id);
                        }} 
                        className="text-[#ff7b72] hover:text-[#ff9b94]"
                        title={t.delete}
                      >
                         <Trash2 size={12} />
                      </span>
                    </div>
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border-main flex flex-col gap-2">
            <div className="text-[10px] text-text-dim mb-1 font-bold">{t.dataManagement}</div>
            
            <button onClick={onExportJson} className="w-full h-8 flex items-center justify-start px-3 gap-3 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors">
                <Download size={12} /> {t.exportJson}
            </button>
            <button onClick={() => jsonInputRef.current?.click()} className="w-full h-8 flex items-center justify-start px-3 gap-3 border border-border-main text-text-dim bg-base-bg hover:text-text-bright hover:border-border-light transition-colors">
                <FileCode size={12} /> {t.importJson}
            </button>
            <button onClick={onResetData} className="w-full h-8 flex items-center justify-start px-3 gap-3 border border-border-main text-[#ff7b72] bg-base-bg hover:text-[#ff9b94] hover:border-[#ff7b72]/50 transition-colors mt-2">
                <Trash2 size={12} /> {t.resetData}
            </button>
            <input type="file" accept=".json" className="hidden" ref={jsonInputRef} onChange={e => handleFileChange(e)} />
        </div>
      </div>
      
      <div className="text-[9px] text-text-dim/50 mt-auto">
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
    </>
  );
}
