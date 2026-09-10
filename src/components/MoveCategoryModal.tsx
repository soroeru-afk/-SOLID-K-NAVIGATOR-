import React, { useState } from 'react';
import { Category, Stock } from '../types';
import { getFlattenedCategoryTree } from '../lib/categoryUtils';
import { Folder, FolderPlus, X, Check, ArrowRight } from 'lucide-react';
import { i18n, Language } from '../i18n';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  targetStocks: Stock[];
  categories: Category[];
  onMove: (stockIds: string[], newCategoryId: string) => void;
  onAddCategory?: (name: string, parentId?: string | null) => void;
  language: Language;
}

export default function MoveCategoryModal({
  isOpen,
  onClose,
  targetStocks,
  categories,
  onMove,
  onAddCategory,
  language
}: Props) {
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatParentId, setNewCatParentId] = useState<string>('');

  if (!isOpen || targetStocks.length === 0) return null;

  const t = i18n[language];
  const flattened = getFlattenedCategoryTree(categories);

  const handleConfirmMove = (catId: string) => {
    const ids = targetStocks.map(s => s.id);
    onMove(ids, catId);
    onClose();
  };

  const handleCreateAndMove = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !onAddCategory) return;
    const newId = Date.now().toString();
    onAddCategory(newCatName.trim(), newCatParentId || null);
    // 新規作成されたカテゴリーへ移動
    const ids = targetStocks.map(s => s.id);
    onMove(ids, newId);
    setNewCatName('');
    setIsAddingNew(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-panel-bg border border-border-light w-full max-w-md shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg shrink-0">
          <div className="flex items-center gap-2">
            <Folder size={16} className="text-[#58a6ff]" />
            <span className="font-bold text-xs text-text-bright tracking-wider">
              {language === 'EN' ? 'MOVE TO CATEGORY' : 'カテゴリーへの移動'}
            </span>
          </div>
          <button
            onClick={onClose}
            className="text-text-dim hover:text-text-bright p-1 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Target Stock Preview */}
        <div className="px-4 py-2.5 bg-base-bg/50 border-b border-border-main shrink-0 text-xs">
          <div className="text-[10px] text-text-dim uppercase font-bold mb-1">
            {language === 'EN' ? 'Selected Stocks' : '移動対象の銘柄'}: ({targetStocks.length}件)
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-20 overflow-y-auto">
            {targetStocks.slice(0, 5).map(s => (
              <span key={s.id} className="px-2 py-0.5 bg-base-bg border border-border-main text-text-bright text-[11px] font-bold">
                {s.code} {s.name}
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
            {language === 'EN' ? 'Select Destination Directory' : '移動先のフォルダーを選択'}
          </div>

          {/* Unassigned Option */}
          <button
            onClick={() => handleConfirmMove('')}
            className="flex items-center justify-between px-3 py-2 text-left bg-base-bg/60 hover:bg-border-main/50 border border-transparent hover:border-border-main transition-colors text-xs text-text-dim hover:text-text-bright group"
          >
            <div className="flex items-center gap-2">
              <Folder size={14} className="text-text-dim group-hover:text-text-bright shrink-0" />
              <span>{t.unassigned}</span>
            </div>
            <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim" />
          </button>

          {/* Hierarchical Categories */}
          {flattened.map(item => (
            <button
              key={item.id}
              onClick={() => handleConfirmMove(item.id)}
              className="flex items-center justify-between px-3 py-2 text-left bg-base-bg/60 hover:bg-border-main/50 border border-transparent hover:border-border-light transition-colors text-xs group"
              style={{ paddingLeft: `${Math.max(12, item.level * 20 + 12)}px` }}
            >
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Folder size={14} className={`shrink-0 ${item.level > 0 ? 'text-[#58a6ff]' : 'text-[#d29922]'}`} />
                <span className={`truncate font-bold ${item.level > 0 ? 'text-text-normal' : 'text-text-bright'}`}>
                  {item.name}
                </span>
                {item.level > 0 && (
                  <span className="text-[9px] px-1 py-0.2 bg-border-main text-text-dim shrink-0">SUB</span>
                )}
              </div>
              <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity text-[#58a6ff] shrink-0" />
            </button>
          ))}
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
                <span>{language === 'EN' ? '+ Create New Directory & Move' : '+ 新規フォルダーを作成して移動'}</span>
              </button>
            ) : (
              <form onSubmit={handleCreateAndMove} className="flex flex-col gap-2">
                <div className="text-[10px] text-text-dim font-bold">
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
                    className="h-6 px-3 bg-border-light hover:bg-[#58a6ff] text-text-bright text-[11px] font-bold transition-colors"
                  >
                    {language === 'EN' ? 'Create & Move' : '作成して移動'}
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
