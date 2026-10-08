import React, { useState } from 'react';
import { Category, Stock } from '../types';
import { getFlattenedCategoryTree } from '../lib/categoryUtils';
import { Folder, FolderPlus, X, ArrowRight, CornerUpRight } from 'lucide-react';
import { i18n, Language } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetStocks: Stock[];
  categories: Category[];
  allStocks?: Stock[];
  initialMode?: 'move' | 'shortcut';
  onMove: (stockIds: string[], newCategoryId: string) => void;
  onCreateShortcut?: (stockIds: string[], newCategoryId: string) => void;
  onAddCategory?: (name: string, parentId?: string | null) => void;
  language: Language;
}

export default function MoveCategoryModal({
  isOpen,
  onClose,
  targetStocks,
  categories,
  allStocks = [],
  initialMode = 'move',
  onMove,
  onCreateShortcut,
  onAddCategory,
  language
}: Props) {
  const [mode, setMode] = useState<'move' | 'shortcut'>(initialMode);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string>('');

  if (!isOpen || targetStocks.length === 0) return null;

  const t = i18n[language];
  const flattened = getFlattenedCategoryTree(categories);

  const handleExecute = (catId: string) => {
    const ids = targetStocks.map(s => s.id);
    if (mode === 'shortcut' && onCreateShortcut) {
      onCreateShortcut(ids, catId);
    } else {
      onMove(ids, catId);
    }
    onClose();
  };

  const handleCreateAndExecute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !onAddCategory) return;
    const newId = Date.now().toString();
    onAddCategory(newCatName.trim(), newCatParentId || null);
    const ids = targetStocks.map(s => s.id);
    if (mode === 'shortcut' && onCreateShortcut) {
      onCreateShortcut(ids, newId);
    } else {
      onMove(ids, newId);
    }
    setNewCatName('');
    setIsAddingNew(false);
    onClose();
  };

  // 選択先フォルダーにすでに対象銘柄が存在しているかを判定
  const getDestinationStatus = (catId: string) => {
    if (!allStocks || allStocks.length === 0) return null;
    const targetCodes = new Set(targetStocks.map(s => s.code));
    const matchingInDest = allStocks.filter(s => s.categoryId === catId && targetCodes.has(s.code));
    if (matchingInDest.length === 0) return null;
    return matchingInDest.length === targetStocks.length ? 'all' : 'partial';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-panel-bg border border-border-light w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg shrink-0">
          <div className="flex items-center gap-2">
            {mode === 'move' ? (
              <Folder size={16} className="text-text-normal" />
            ) : (
              <CornerUpRight size={16} className="text-text-normal" />
            )}
            <span className="font-bold text-xs text-text-bright tracking-wider font-mono">
              {mode === 'move' 
                ? (language === 'EN' ? 'MOVE TO CATEGORY' : 'カテゴリーへの移動')
                : (language === 'EN' ? 'CREATE SHORTCUT' : 'ショートカット作成')}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-bright p-1 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-2 border-b border-border-main bg-base-bg/80 shrink-0 text-xs font-mono">
          <button
            type="button"
            onClick={() => setMode('move')}
            className={`py-2 px-3 text-center border-b-2 font-bold transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'move'
                ? 'border-text-bright text-text-bright bg-panel-bg'
                : 'border-transparent text-text-dim hover:text-text-normal hover:bg-panel-bg/40'
            }`}
          >
            <Folder size={13} />
            <span>{language === 'EN' ? 'MOVE' : '移動'}</span>
          </button>
          <button
            type="button"
            onClick={() => setMode('shortcut')}
            className={`py-2 px-3 text-center border-b-2 font-bold transition-colors flex items-center justify-center gap-1.5 ${
              mode === 'shortcut'
                ? 'border-text-bright text-text-bright bg-panel-bg'
                : 'border-transparent text-text-dim hover:text-text-normal hover:bg-panel-bg/40'
            }`}
          >
            <CornerUpRight size={13} />
            <span>{language === 'EN' ? 'SHORTCUT' : 'ショートカット'}</span>
          </button>
        </div>

        {/* Mode Explanation */}
        <div className="px-4 py-2 bg-base-bg/40 border-b border-border-main shrink-0 text-[11px] text-text-dim">
          {mode === 'move' ? (
            <span>
              {language === 'EN' 
                ? 'Move selected stocks from current category to destination.' 
                : '選択した銘柄を現在のカテゴリーから移動します。'}
            </span>
          ) : (
            <span>
              {language === 'EN'
                ? 'Place synchronized shortcuts in destination. Edits will sync across all instances.'
                : '指定カテゴリーにショートカットを配置します。編集・株価はすべての場所で自動同期されます。'}
            </span>
          )}
        </div>

        {/* Target Stock Preview */}
        <div className="px-4 py-2.5 bg-base-bg/50 border-b border-border-main shrink-0 text-xs">
          <div className="text-[10px] text-text-dim uppercase font-bold mb-1">
            {language === 'EN' ? 'Target Stocks' : '対象銘柄'}: ({targetStocks.length}件)
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {targetStocks.slice(0, 5).map(s => (
              <span key={s.id} className="px-2 py-0.5 bg-base-bg border border-border-main text-text-bright text-[11px] font-bold inline-flex items-center gap-1">
                {s.isShortcut && <span className="text-[9px] text-text-dim border border-border-main px-0.5 py-0 font-mono">SC</span>}
                <span>{s.code} {s.name}</span>
              </span>
            ))}
            {targetStocks.length > 5 && (
              <span className="px-2 py-0.5 bg-base-bg border border-border-main text-text-dim text-[11px]">
                +{targetStocks.length - 5} 件
              </span>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-1 scrollbar-thin">
          <div className="text-[10px] text-text-dim font-bold px-2 py-1 uppercase tracking-wider">
            {mode === 'move'
              ? (language === 'EN' ? 'Select Destination Directory' : '移動先のフォルダーを選択')
              : (language === 'EN' ? 'Select Target Directory For Shortcut' : 'ショートカット配置先のフォルダーを選択')}
          </div>

          {/* Unassigned Option (only for Move) */}
          {mode === 'move' && (
            <button
              onClick={() => handleExecute('')}
              className="flex items-center justify-between px-3 py-2 text-left bg-base-bg/60 hover:bg-border-main/50 border border-transparent hover:border-border-main transition-colors text-xs text-text-dim hover:text-text-bright group"
            >
              <div className="flex items-center gap-2">
                <Folder size={14} className="text-text-dim group-hover:text-text-bright shrink-0" />
                <span>{t.unassigned}</span>
              </div>
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim" />
            </button>
          )}

          {/* Hierarchical Categories */}
          {flattened.map(item => {
            const destStatus = getDestinationStatus(item.id);
            const isAlreadyHere = destStatus === 'all';

            return (
              <button
                key={item.id}
                onClick={() => handleExecute(item.id)}
                className="flex items-center justify-between px-3 py-2 text-left bg-base-bg/60 hover:bg-border-main/50 border border-transparent hover:border-border-light transition-colors text-xs group"
                style={{ paddingLeft: `${Math.max(12, item.level * 20 + 12)}px` }}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <Folder size={14} className={`shrink-0 ${item.level > 0 ? 'text-text-dim' : 'text-text-normal'}`} />
                  <span className={`truncate font-bold ${item.level > 0 ? 'text-text-normal' : 'text-text-bright'}`}>
                    {item.name}
                  </span>
                  {item.level > 0 && (
                    <span className="text-[9px] px-1 py-0.2 bg-border-main text-text-dim shrink-0 font-mono">SUB</span>
                  )}
                  {isAlreadyHere && (
                    <span className="text-[9px] px-1 py-0.2 border border-border-main text-text-dim shrink-0 font-mono">
                      {language === 'EN' ? 'REGISTERED' : '登録済'}
                    </span>
                  )}
                </div>
                {mode === 'move' ? (
                  <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim group-hover:text-text-bright shrink-0" />
                ) : (
                  <CornerUpRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim group-hover:text-text-bright shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        {/* New Category Section */}
        {onAddCategory && (
          <div className="p-3 border-t border-border-main bg-base-bg shrink-0">
            {!isAddingNew ? (
              <button
                onClick={() => setIsAddingNew(true)}
                className="w-full h-8 flex items-center justify-center gap-2 border border-border-main hover:border-border-light text-text-dim hover:text-text-bright text-xs transition-colors"
              >
                <FolderPlus size={13} />
                <span>
                  {mode === 'move' 
                    ? (language === 'EN' ? '+ Create New Directory & Move' : '+ 新規フォルダーを作成して移動')
                    : (language === 'EN' ? '+ Create New Directory & Shortcut' : '+ 新規フォルダーを作成してショートカット')}
                </span>
              </button>
            ) : (
              <form onSubmit={handleCreateAndExecute} className="flex flex-col gap-2">
                <div className="text-[10px] text-text-dim font-bold font-mono">
                  {language === 'EN' ? 'NEW DIRECTORY' : '新規フォルダー名と親設定'}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder={t.dirName}
                    value={newCatName}
                    onChange={e => setNewCatName(e.target.value)}
                    className="flex-1 h-7 px-2 bg-panel-bg border border-border-main text-text-bright text-xs outline-none focus:border-border-light"
                  />
                  <select
                    value={newCatParentId}
                    onChange={e => setNewCatParentId(e.target.value)}
                    className="h-7 px-2 bg-panel-bg border border-border-main text-text-normal text-xs outline-none"
                  >
                    <option value="">{language === 'EN' ? '(Root Level)' : '(親なし・ルート)'}</option>
                    {flattened.map(item => (
                      <option key={item.id} value={item.id}>
                        {item.displayName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex justify-end gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingNew(false)}
                    className="h-6 px-2 text-[11px] text-text-dim hover:text-text-bright"
                  >
                    {t.close}
                  </button>
                  <button
                    type="submit"
                    className="h-6 px-3 bg-border-main hover:bg-border-light text-text-bright text-[11px] font-bold transition-colors border border-border-light"
                  >
                    {mode === 'move'
                      ? (language === 'EN' ? 'Create & Move' : '作成して移動')
                      : (language === 'EN' ? 'Create & Shortcut' : '作成してショートカット')}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
