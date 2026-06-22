import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronRight, Database, Type } from 'lucide-react';
import { Category } from '../types';
import { Language, i18n } from '../i18n';

interface Props {
  categories: Category[];
  onAdd: (items: {code: string, name: string, categoryId: string}[]) => void;
  language: Language;
}

export default function AddStockForm({ categories, onAdd, language }: Props) {
  const [mode, setMode] = useState<'single' | 'bulk'>('single');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [bulkText, setBulkText] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [isFetching, setIsFetching] = useState(false);
  const [isOpen, setIsOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('knav_add_form_open');
    return saved !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('knav_add_form_open', String(isOpen));
  }, [isOpen]);

  const t = i18n[language];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'single') {
        if (!code.trim()) return;
        onAdd([{ name: name.trim(), code: code.trim(), categoryId }]);
        setName('');
        setCode('');
    } else {
        if (!bulkText.trim()) return;
        // Parse basic format: Code Name or just Code
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
        setMode('single'); // Return to single mode after bulk add
    }
  };

  return (
    <div className="border border-border-main bg-panel-bg p-4 flex flex-col relative w-full shrink-0">
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold tracking-widest flex items-center gap-1 hover:text-text-normal transition-colors focus:outline-none"
      >
        {t.intakeModule} {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>
      
      {isOpen && (
        <>
          <div className="flex items-center gap-4 border-b border-border-main/50 pb-3 mb-3 shrink-0">
              <button 
                  type="button"
                  onClick={() => setMode('single')}
                  className={`flex items-center gap-2 text-[10px] tracking-widest transition-colors ${mode === 'single' ? 'text-text-bright font-bold' : 'text-text-dim hover:text-text-normal'}`}
              >
                  <Type size={12} /> {t.manualInput}
              </button>
              <button 
                 type="button"
                 onClick={() => setMode('bulk')}
                 className={`flex items-center gap-2 text-[10px] tracking-widest transition-colors ${mode === 'bulk' ? 'text-text-bright font-bold' : 'text-text-dim hover:text-text-normal'}`}
              >
                  <Database size={12} /> {t.bulkExtract}
              </button>
          </div>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
            {mode === 'single' ? (
                 <div className="flex flex-col sm:flex-row items-end gap-4 w-full">
                    <div className="flex-[1.5] w-full">
                    <label className="block text-[10px] text-text-dim mb-1 tracking-widest">{t.code}</label>
                    <input
                        type="text"
                        value={code}
                        onChange={e => setCode(e.target.value)}
                        placeholder="7203"
                        className="w-full h-9 px-3 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
                    />
                    </div>
                    <div className="flex-[1.5] w-full">
                    <label className="block text-[10px] text-text-dim mb-1 tracking-widest">{t.name}</label>
                    <input
                        type="text"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="トヨタ自動車"
                        className="w-full h-9 px-3 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
                    />
                    </div>
                    <div className="flex-1 w-full">
                    <label className="block text-[10px] text-text-dim mb-1 tracking-widest">{t.targetDir}</label>
                    <div className="relative">
                        <select 
                        value={categoryId}
                        onChange={e => setCategoryId(e.target.value)}
                        className="appearance-none w-full h-9 px-3 bg-base-bg border border-border-main text-text-normal focus:outline-none focus:border-border-light transition-colors"
                        >
                        <option value="">{t.unassigned}</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-dim">
                        <ChevronDown size={14} />
                        </div>
                    </div>
                    </div>
                    <button 
                    type="submit"
                    className="h-9 px-6 mt-4 sm:mt-0 bg-border-main hover:bg-border-light text-text-bright active:bg-accent-bg active:text-accent-text transition-colors border border-border-main shrink-0 tracking-widest"
                    >
                    {t.allocate}
                    </button>
                 </div>
            ) : (
                <div className="flex flex-col gap-4">
                    <div className="w-full">
                        <label className="block text-[10px] text-text-dim mb-1 tracking-widest">{t.pasteText}</label>
                        <textarea
                            value={bulkText}
                            onChange={e => setBulkText(e.target.value)}
                            placeholder="7203 トヨタ自動車&#10;8001 伊藤忠商事&#10;..."
                            className="w-full h-24 p-3 bg-base-bg border border-border-main text-text-normal placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors resize-none font-mono text-[10px]"
                        />
                    </div>
                    <div className="flex justify-between items-end gap-4">
                         <div className="flex-1 w-full max-w-[300px]">
                            <label className="block text-[10px] text-text-dim mb-1 tracking-widest">{t.targetDir}</label>
                            <div className="relative">
                                <select 
                                value={categoryId}
                                onChange={e => setCategoryId(e.target.value)}
                                className="appearance-none w-full h-9 px-3 bg-base-bg border border-border-main text-text-normal focus:outline-none focus:border-border-light transition-colors"
                                >
                                <option value="">{t.unassigned}</option>
                                {categories.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none text-text-dim">
                                <ChevronDown size={14} />
                                </div>
                            </div>
                        </div>
                        <button 
                        type="submit"
                        className="h-9 px-6 bg-border-main hover:bg-border-light text-text-bright active:bg-accent-bg active:text-accent-text transition-colors border border-border-main shrink-0 tracking-widest flex items-center gap-2"
                        >
                        <Database size={12} /> {t.extractAllocate}
                        </button>
                    </div>
                </div>
            )}
          </form>
        </>
      )}
    </div>
  );
}
