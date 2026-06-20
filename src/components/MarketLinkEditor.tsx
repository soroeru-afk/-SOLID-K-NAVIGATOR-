import React, { useState } from 'react';
import { MarketLink } from '../types';
import { X, Plus, Trash2, ArrowUp, ArrowDown, Move } from 'lucide-react';
import { i18n, Language } from '../i18n';

interface Props {
  initialLinks: MarketLink[];
  onSave: (links: MarketLink[]) => void;
  onClose: () => void;
  language: Language;
}

export default function MarketLinkEditor({ initialLinks, onSave, onClose, language }: Props) {
  const [links, setLinks] = useState<MarketLink[]>(initialLinks);
  const t = i18n[language];

  // Optional: drag and drop state could go here, but let's stick to up/down arrows for simplicity.

  const handleUpdate = (id: string, field: keyof MarketLink, value: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleDelete = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const newLinks = [...links];
      [newLinks[index - 1], newLinks[index]] = [newLinks[index], newLinks[index - 1]];
      setLinks(newLinks);
    } else if (direction === 'down' && index < links.length - 1) {
      const newLinks = [...links];
      [newLinks[index + 1], newLinks[index]] = [newLinks[index], newLinks[index + 1]];
      setLinks(newLinks);
    }
  };

  const handleAdd = () => {
    const newLink: MarketLink = {
      id: Date.now().toString(),
      title: 'New Link',
      url: 'https://'
    };
    setLinks([...links, newLink]);
  };

  const handleSave = () => {
    onSave(links);
  };

  return (
    <div className="fixed inset-0 bg-base-bg/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-panel-bg border border-border-main p-6 shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
        
        <div className="flex items-center justify-between border-b border-border-main pb-4 mb-4 shrink-0">
          <div className="font-bold tracking-widest flex items-center gap-2">
            <span>[ {t.marketLinksManage || 'MANAGE MARKET LINKS'} ]</span>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text-bright transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 pr-2 mb-4 space-y-2">
          {links.length === 0 ? (
            <div className="text-center text-text-dim py-8">NO DATA</div>
          ) : (
            links.map((link, index) => (
              <div key={link.id} className="flex items-center gap-2 bg-base-bg p-2 border border-border-main group">
                <div className="flex flex-col gap-1 shrink-0">
                  <button 
                    onClick={() => handleMove(index, 'up')}
                    disabled={index === 0}
                    className="p-1 text-text-dim hover:text-text-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button 
                    onClick={() => handleMove(index, 'down')}
                    disabled={index === links.length - 1}
                    className="p-1 text-text-dim hover:text-text-bright disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ArrowDown size={14} />
                  </button>
                </div>
                
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-xs w-12 shrink-0">TITLE:</span>
                    <input 
                      type="text" 
                      value={link.title}
                      onChange={(e) => handleUpdate(link.id, 'title', e.target.value)}
                      className="flex-1 bg-panel-bg border border-border-main px-2 py-1 text-sm focus:outline-none focus:border-border-light text-text-bright"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-text-dim text-xs w-12 shrink-0">URL:</span>
                    <input 
                      type="text" 
                      value={link.url}
                      onChange={(e) => handleUpdate(link.id, 'url', e.target.value)}
                      className="flex-1 bg-panel-bg border border-border-main px-2 py-1 text-sm focus:outline-none focus:border-border-light text-text-normal"
                    />
                  </div>
                </div>

                <div className="shrink-0 pl-2 border-l border-border-main">
                  <button 
                    onClick={() => handleDelete(link.id)}
                    className="p-2 text-text-dim hover:text-[#f85149] transition-colors"
                    title={t.delete}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="shrink-0 pt-4 border-t border-border-main flex items-center justify-between">
          <button 
            onClick={handleAdd}
            className="flex items-center gap-2 border border-border-main px-4 py-2 text-sm hover:border-border-light hover:text-text-bright transition-colors"
          >
            <Plus size={16} />
            <span>ADD LINK</span>
          </button>

          <div className="flex gap-4">
            <button 
              onClick={onClose}
              className="px-6 py-2 border border-border-main text-text-dim hover:text-text-normal transition-colors text-sm font-bold tracking-wider"
            >
              {t.close || 'CLOSE'}
            </button>
            <button 
              onClick={handleSave}
              className="px-6 py-2 border border-border-main bg-text-normal text-panel-bg hover:bg-text-bright transition-colors text-sm font-bold tracking-wider"
            >
              {t.save || 'SAVE'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
