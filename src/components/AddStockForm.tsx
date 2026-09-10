import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Database, Type, Plus } from 'lucide-react';
import { Category } from '../types';
import { Language, i18n } from '../i18n';
import { getFlattenedCategoryTree } from '../lib/categoryUtils';

interface Props {
  categories: Category[];
  onAdd: (items: {code: string, name: string, categoryId: string}[]) => void;
  language: Language;
}

export default function AddStockForm({ categories, onAdd, language }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [isOpen, setIsOpen] = useState(true);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const t = i18n[language];
  const flattenedCategories = getFlattenedCategoryTree(categories);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
      if (!code.trim()) return;
      onAdd([{ name: name.trim(), code: code.trim(), categoryId }]);
      setName('');
      setCode('');
    } else {
      if (!bulkText.trim()) return;
      const lines = bulkText.split('\n').filter(l => l.trim());
      if (lines.length === 0) return;
      
      const items = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        const c = parts[0];
        const n = parts.slice(1).join(' ') || c;
        return {
          name: n,
          code: c,
          categoryId
        };
      });
      
      onAdd(items);
      setBulkText('');
      setMode('single');
    }
  };

  return (
    <div className="border border-border-main bg-panel-bg px-3 py-2 flex flex-col relative w-full shrink-0 shadow-sm transition-all">
      {/* Module Title Badge & Inline Controls */}
      <div className="flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-text-dim font-bold tracking-widest uppercase">
            {t.intakeModule}
          </span>
          
          <div className="flex items-center gap-2 border-l border-border-main pl-3">
            <button 
              type="button"
              onClick={() => { setMode('single'); setIsOpen(true); }}
              className={`flex items-center gap-1 text-[10px] tracking-wider transition-colors px-1.5 py-0.5 ${
                mode === 'single' && isOpen ? 'text-text-bright font-bold bg-border-main/50' : 'text-text-dim hover:text-text-normal'
              }`}
            >
              <Type size={11} /> {t.manualInput}
            </button>
            <button 
              type="button"
              onClick={() => { setMode('bulk'); setIsOpen(true); }}
              className={`flex items-center gap-1 text-[10px] tracking-wider transition-colors px-1.5 py-0.5 ${
                mode === 'bulk' && isOpen ? 'text-text-bright font-bold bg-border-main/50' : 'text-text-dim hover:text-text-normal'
              }`}
            >
              <Database size={11} /> {t.bulkExtract}
            </button>
          </div>
        </div>

        {/* Minimize / Expand Toggle */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-1 text-[10px] text-text-dim hover:text-text-bright transition-colors"
          title={isOpen ? '最小化' : '展開'}
        >
          <span>{isOpen ? (language === 'EN' ? 'COLLAPSE' : '折りたたむ') : (language === 'EN' ? 'EXPAND' : '展開')}</span>
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Slim Form Body */}
      {isOpen && (
        <form onSubmit={handleSubmit} className="mt-2 pt-2 border-t border-border-main/40">
          {mode === 'single' ? (
            <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
              {/* Code input with inline placeholder */}
              <div className="w-full sm:w-28 shrink-0">
                <input
                  type="text"
                  value={code}
                  onChange={e => setCode(e.target.value)}
                  placeholder="コード (7203)"
                  className="w-full h-7 px-2.5 bg-base-bg border border-border-main text-text-bright placeholder:text-text-dim/50 text-xs font-mono focus:outline-none focus:border-border-light transition-colors"
                />
              </div>

              {/* Name input */}
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="銘柄名 (トヨタ自動車)"
                  className="w-full h-7 px-2.5 bg-base-bg border border-border-main text-text-bright placeholder:text-text-dim/50 text-xs focus:outline-none focus:border-border-light transition-colors"
                />
              </div>

              {/* Target Category Select */}
              <div className="w-full sm:w-48 shrink-0 relative">
                <select 
                  value={categoryId}
                  onChange={e => setCategoryId(e.target.value)}
                  className="appearance-none w-full h-7 px-2.5 pr-6 bg-base-bg border border-border-main text-text-normal text-xs focus:outline-none focus:border-border-light transition-colors cursor-pointer"
                >
                  <option value="">-- {t.unassigned} --</option>
                  {flattenedCategories.map(c => (
                    <option key={c.id} value={c.id}>{c.displayName}</option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-text-dim">
                  <ChevronDown size={12} />
                </div>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                className="w-full sm:w-auto h-7 px-3 bg-border-main hover:bg-border-light text-text-bright border border-border-light text-xs font-bold shrink-0 tracking-wider flex items-center justify-center gap-1 transition-colors"
              >
                <Plus size={12} />
                <span>{language === 'EN' ? 'ALLOCATE' : '登録'}</span>
              </button>
            </div>
          ) : (
            /* Bulk Mode (Compact) */
            <div className="flex flex-col gap-2">
              <textarea
                value={bulkText}
                onChange={e => setBulkText(e.target.value)}
                placeholder="7203 トヨタ自動車&#10;8001 伊藤忠商事&#10;..."
                className="w-full h-16 p-2 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors resize-none tabular-nums text-xs font-mono"
              />
              <div className="flex justify-between items-center gap-2">
                <div className="w-48 relative">
                  <select 
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="appearance-none w-full h-7 px-2.5 pr-6 bg-base-bg border border-border-main text-text-normal text-xs focus:outline-none focus:border-border-light transition-colors cursor-pointer"
                  >
                    <option value="">-- {t.unassigned} --</option>
                    {flattenedCategories.map(c => (
                      <option key={c.id} value={c.id}>{c.displayName}</option>
                    ))}
                  </select>
                  <div className="absolute inset-y-0 right-0 flex items-center px-1.5 pointer-events-none text-text-dim">
                    <ChevronDown size={12} />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="h-7 px-3 bg-border-main hover:bg-border-light text-text-bright border border-border-light text-xs font-bold tracking-wider flex items-center gap-1 transition-colors"
                >
                  <Database size={11} /> {t.extractAllocate}
                </button>
              </div>
            </div>
          )}
        </form>
      )}
    </div>
  );
}
