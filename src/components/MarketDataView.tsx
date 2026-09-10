import React, { useState, useEffect } from 'react';
import { 
  ExternalLink, Plus, Trash2, ArrowUp, ArrowDown, Pencil, Check, X, 
  LineChart, Folder, ChevronRight, Globe, Link2, Sparkles, Compass, 
  Newspaper, RefreshCw, Search, Tag, Clock, AlertCircle, LayoutGrid, List
} from 'lucide-react';
import { MarketLink } from '../types';
import { Language, i18n } from '../i18n';
import { Theme } from '../App';
import { tankenCategories } from '../data/tankenData';
import NewsDigestModal from './NewsDigestModal';
import { openExternalWindow } from '../lib/windowUtils';

interface Props {
  links: MarketLink[];
  onUpdateLinks: (links: MarketLink[]) => void;
  onBackToStocks: () => void;
  language: Language;
  theme: Theme;
  fontSize: number;
}

export default function MarketDataView({
  links,
  onUpdateLinks,
  onBackToStocks,
  language,
  theme,
  fontSize
}: Props) {
  const [activeTab, setActiveTab] = useState<'links' | 'tanken' | 'news'>('links');
  
  // Custom Links state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editUrl, setEditUrl] = useState('');
  const [isAdding, setIsAdding] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [linkViewMode, setLinkViewMode] = useState<'card' | 'list'>(() => {
    return (localStorage.getItem('KNAV_MARKET_LINK_VIEW_MODE') as 'card' | 'list') || 'card';
  });

  const toggleLinkViewMode = (mode: 'card' | 'list') => {
    setLinkViewMode(mode);
    localStorage.setItem('KNAV_MARKET_LINK_VIEW_MODE', mode);
  };

  // Tanken state
  const [tankenQuery, setTankenQuery] = useState('');

  // News state
  const [newsItems, setNewsItems] = useState<Array<{ id: string; time: string; category: string; title: string; url: string }>>([]);
  const [isLoadingNews, setIsLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState<string | null>(null);
  const [selectedNews, setSelectedNews] = useState<{ id: string; title: string; time: string; category: string; url: string } | null>(null);
  const [newsFilterQuery, setNewsFilterQuery] = useState('');

  const t = i18n[language];
  const [customFontSize, setCustomFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('KNAV_MARKET_VIEW_FONT_SIZE');
    return saved ? parseInt(saved, 10) : Math.max(14, fontSize);
  });

  const changeFontSize = (delta: number) => {
    setCustomFontSize(prev => {
      const next = Math.max(12, Math.min(22, prev + delta));
      localStorage.setItem('KNAV_MARKET_VIEW_FONT_SIZE', String(next));
      return next;
    });
  };

  const fetchNews = async () => {
    setIsLoadingNews(true);
    setNewsError(null);
    try {
      const res = await fetch('/api/market-news');
      if (!res.ok) throw new Error('ニュースの取得に失敗しました');
      const d = await res.json();
      setNewsItems(d.items || []);
    } catch (err: any) {
      setNewsError(err.message || 'ニュースを取得できませんでした');
    } finally {
      setIsLoadingNews(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'news' && newsItems.length === 0) {
      fetchNews();
    }
  }, [activeTab]);

  const handleStartEdit = (link: MarketLink) => {
    setEditingId(link.id);
    setEditTitle(link.title);
    setEditUrl(link.url);
  };

  const handleSaveEdit = (id: string) => {
    if (!editTitle.trim() || !editUrl.trim()) return;
    const updated = links.map(l => l.id === id ? { ...l, title: editTitle.trim(), url: editUrl.trim() } : l);
    onUpdateLinks(updated);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(language === 'EN' ? 'Delete this market link?' : 'このマーケットリンクを削除しますか？')) {
      onUpdateLinks(links.filter(l => l.id !== id));
    }
  };

  const handleMove = (index: number, direction: 'up' | 'down') => {
    if (direction === 'up' && index > 0) {
      const copy = [...links];
      [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
      onUpdateLinks(copy);
    } else if (direction === 'down' && index < links.length - 1) {
      const copy = [...links];
      [copy[index + 1], copy[index]] = [copy[index], copy[index + 1]];
      onUpdateLinks(copy);
    }
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newUrl.trim()) return;
    const formattedUrl = newUrl.startsWith('http://') || newUrl.startsWith('https://') 
      ? newUrl.trim() 
      : `https://${newUrl.trim()}`;
    const newLink: MarketLink = {
      id: `market_${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl
    };
    onUpdateLinks([...links, newLink]);
    setNewTitle('');
    setNewUrl('');
    setIsAdding(false);
  };

  const filteredLinks = links.filter(l => 
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredNews = newsItems.filter(item => 
    !newsFilterQuery || 
    item.title.toLowerCase().includes(newsFilterQuery.toLowerCase()) || 
    item.category.toLowerCase().includes(newsFilterQuery.toLowerCase())
  );

  return (
    <div className="border border-border-main bg-panel-bg p-3 md:p-4 relative w-full flex-1 flex flex-col min-h-0 overflow-hidden shadow-sm">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-border-main pb-2.5 mb-3 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto text-xs">
          <button
            onClick={onBackToStocks}
            className="font-bold flex items-center gap-1.5 text-text-dim hover:text-text-bright transition-colors"
          >
            <Folder size={13} className="text-[#d29922]" />
            <span>[ {language === 'EN' ? 'ALL DATA' : 'ALL DATA'} ]</span>
          </button>

          <ChevronRight size={12} className="text-text-dim shrink-0" />

          <span className="font-bold text-[#58a6ff] flex items-center gap-1.5 truncate">
            <LineChart size={13} className="shrink-0" />
            [ STOCK MARKET DATA ]
          </span>
        </div>

        {/* Right side: Tabs & Font Size */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Tabs */}
          <div className="flex items-center gap-1 bg-base-bg p-1 border border-border-main text-xs">
            <button
              onClick={() => setActiveTab('links')}
              className={`px-3 py-1 font-bold transition-colors rounded-xs flex items-center gap-1.5 ${
                activeTab === 'links'
                  ? 'bg-border-main text-text-bright border border-border-light shadow-xs'
                  : 'text-text-dim hover:text-text-normal'
              }`}
            >
              <Link2 size={12} />
              <span>市場リンク ({links.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('tanken')}
              className={`px-3 py-1 font-bold transition-colors rounded-xs flex items-center gap-1.5 ${
                activeTab === 'tanken'
                  ? 'bg-border-main text-[#f59e0b] border border-border-light shadow-xs'
                  : 'text-text-dim hover:text-text-normal'
              }`}
            >
              <Compass size={12} />
              <span>銘柄探検 (31条件)</span>
            </button>

            <button
              onClick={() => {
                setActiveTab('news');
                if (newsItems.length === 0) fetchNews();
              }}
              className={`px-3 py-1 font-bold transition-colors rounded-xs flex items-center gap-1.5 ${
                activeTab === 'news'
                  ? 'bg-border-main text-[#58a6ff] border border-border-light shadow-xs'
                  : 'text-text-dim hover:text-text-normal'
              }`}
            >
              <Newspaper size={12} />
              <span className="flex items-center gap-1">
                <span>主要ニュース</span>
                <span className="w-1.5 h-1.5 rounded-full bg-[#58a6ff] animate-pulse" />
              </span>
            </button>
          </div>

          {/* Font Size Adjuster */}
          <div className="flex items-center gap-1 bg-base-bg px-2 py-1 border border-border-main text-[11px] text-text-dim">
            <span className="text-[10px] font-mono hidden md:inline">文字:</span>
            <button 
              onClick={() => changeFontSize(-1)}
              className="w-5 h-5 flex items-center justify-center hover:bg-border-main hover:text-text-bright rounded font-bold transition-colors"
              title="文字を小さく (最小 12px)"
            >
              -
            </button>
            <span className="font-mono text-text-bright font-bold px-1 text-xs">{customFontSize}px</span>
            <button 
              onClick={() => changeFontSize(1)}
              className="w-5 h-5 flex items-center justify-center hover:bg-border-main hover:text-text-bright rounded font-bold transition-colors"
              title="文字を大きく (最大 22px)"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* TAB 1: 市場リンク (Market Links Management) */}
      {activeTab === 'links' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="text-xs text-text-dim">
              主要指標・ランキングなど、よく使う相場情報サイトへのクイックアクセスリンク
            </div>
            
            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-60">
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={language === 'EN' ? 'Search links...' : 'リンクを検索...'}
                  className="w-full h-7 px-2.5 pr-7 bg-base-bg border border-border-main text-text-normal text-[11px] placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              {/* View Mode Toggle: Card vs List */}
              <div className="flex items-center border border-border-main bg-base-bg p-0.5 rounded-xs">
                <button
                  type="button"
                  onClick={() => toggleLinkViewMode('card')}
                  className={`p-1 rounded-xs transition-colors ${
                    linkViewMode === 'card'
                      ? 'bg-border-main text-[#58a6ff]'
                      : 'text-text-dim hover:text-text-bright'
                  }`}
                  title="カード型表示"
                >
                  <LayoutGrid size={13} />
                </button>
                <button
                  type="button"
                  onClick={() => toggleLinkViewMode('list')}
                  className={`p-1 rounded-xs transition-colors ${
                    linkViewMode === 'list'
                      ? 'bg-border-main text-[#58a6ff]'
                      : 'text-text-dim hover:text-text-bright'
                  }`}
                  title="リスト型表示"
                >
                  <List size={13} />
                </button>
              </div>

              <button
                onClick={() => setIsAdding(!isAdding)}
                className={`flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border transition-colors ${
                  isAdding 
                    ? 'bg-border-main border-border-light text-text-bright' 
                    : 'bg-base-bg border-border-main text-text-bright hover:border-border-light'
                }`}
              >
                <Plus size={12} />
                <span>{language === 'EN' ? 'ADD LINK' : 'リンク追加'}</span>
              </button>
            </div>
          </div>

          {/* Inline Add Link Form */}
          {isAdding && (
            <form onSubmit={handleAdd} className="bg-base-bg border border-border-main p-3 mb-3 shrink-0 flex flex-col sm:flex-row gap-2 items-center">
              <div className="w-full sm:w-1/3">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder={language === 'EN' ? 'Title (e.g. 決算速報)' : 'タイトル (例: 決算速報)'}
                  className="w-full h-8 px-2.5 bg-panel-bg border border-border-main text-text-bright text-xs focus:outline-none focus:border-border-light font-medium"
                  autoFocus
                />
              </div>
              <div className="w-full sm:flex-1">
                <input
                  type="text"
                  value={newUrl}
                  onChange={e => setNewUrl(e.target.value)}
                  placeholder="URL (https://...)"
                  className="w-full h-8 px-2.5 bg-panel-bg border border-border-main text-text-bright text-xs font-mono focus:outline-none focus:border-border-light"
                />
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button
                  type="submit"
                  className="px-3 h-8 bg-border-main hover:bg-border-light border border-border-light text-text-bright text-xs font-bold transition-colors"
                >
                  {language === 'EN' ? 'ADD' : '追加'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-2.5 h-8 border border-border-main hover:bg-border-main text-text-dim text-xs transition-colors"
                >
                  {language === 'EN' ? 'CANCEL' : '取消'}
                </button>
              </div>
            </form>
          )}

          {/* Links Content (Card or List) */}
          <div className="flex-1 overflow-y-auto pr-1">
            {linkViewMode === 'card' ? (
              /* CARD VIEW */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredLinks.map((link, idx) => {
                  const isEditing = editingId === link.id;

                  return (
                    <div 
                      key={link.id} 
                      className="group flex flex-col justify-between border border-border-main bg-panel-bg p-3.5 hover:border-border-light transition-all relative shadow-sm"
                    >
                      {isEditing ? (
                        <div className="flex flex-col gap-2">
                          <div className="text-[10px] text-text-dim font-bold">タイトル編集</div>
                          <input
                            type="text"
                            value={editTitle}
                            onChange={e => setEditTitle(e.target.value)}
                            className="w-full px-2 py-1 bg-base-bg border border-border-light text-text-bright text-xs font-bold"
                          />
                          <div className="text-[10px] text-text-dim font-bold mt-1">URL</div>
                          <input
                            type="text"
                            value={editUrl}
                            onChange={e => setEditUrl(e.target.value)}
                            className="w-full px-2 py-1 bg-base-bg border border-border-light text-text-bright text-xs font-mono"
                          />
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <button
                              onClick={() => setEditingId(null)}
                              className="px-2 py-1 border border-border-main text-text-dim text-[10px] hover:bg-border-main"
                            >
                              {t.close}
                            </button>
                            <button
                              onClick={() => handleSaveEdit(link.id)}
                              className="px-2.5 py-1 bg-border-main border border-border-light text-text-bright text-[10px] font-bold flex items-center gap-1"
                            >
                              <Check size={11} /> {t.save}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <div className="flex items-center justify-between border-b border-border-main pb-2 mb-2 text-[10px] text-text-dim">
                              <span className="font-mono font-bold text-text-dim/70">
                                #{String(idx + 1).padStart(2, '0')}
                              </span>
                              
                              <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleMove(idx, 'up')}
                                  disabled={idx === 0}
                                  title="上へ移動"
                                  className="p-1 text-text-dim hover:text-text-bright disabled:opacity-20 transition-colors"
                                >
                                  <ArrowUp size={11} />
                                </button>
                                <button
                                  onClick={() => handleMove(idx, 'down')}
                                  disabled={idx === filteredLinks.length - 1}
                                  title="下へ移動"
                                  className="p-1 text-text-dim hover:text-text-bright disabled:opacity-20 transition-colors"
                                >
                                  <ArrowDown size={11} />
                                </button>
                                <button
                                  onClick={() => handleStartEdit(link)}
                                  title="編集"
                                  className="p-1 text-text-dim hover:text-text-bright transition-colors"
                                >
                                  <Pencil size={11} />
                                </button>
                                <button
                                  onClick={() => handleDelete(link.id)}
                                  title="削除"
                                  className="p-1 text-text-dim hover:text-[#ff7b72] transition-colors"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>

                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                openExternalWindow(link.url);
                              }}
                              className="block font-bold text-text-bright hover:text-[#58a6ff] hover:underline transition-colors tracking-wide mb-2 line-clamp-2 leading-snug"
                              style={{ fontSize: `${customFontSize}px` }}
                              title={`${link.title}（別ウィンドウで開く）`}
                            >
                              {link.title}
                            </a>

                            <div className="text-[10px] font-mono text-text-dim truncate bg-base-bg/60 px-2 py-1 border border-border-main/50 mb-3">
                              {link.url.replace(/^https?:\/\//, '')}
                            </div>
                          </div>

                          <div className="border-t border-border-main pt-2 flex items-center justify-between text-[11px]">
                            <span className="text-[9px] text-text-dim font-bold flex items-center gap-1">
                              <Globe size={10} /> WEB LINK
                            </span>
                            <a
                              href={link.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(e) => {
                                e.preventDefault();
                                openExternalWindow(link.url);
                              }}
                              className="flex items-center gap-1 text-[10px] font-bold text-text-dim group-hover:text-[#58a6ff] hover:underline transition-colors"
                              title="別ウィンドウで開く"
                            >
                              <span>開く</span>
                              <ExternalLink size={10} />
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}

                {/* Add Link Card */}
                <button
                  onClick={() => setIsAdding(true)}
                  className="flex flex-col items-center justify-center gap-2 border border-dashed border-border-main hover:border-border-light bg-base-bg/30 hover:bg-border-main/20 p-6 text-text-dim hover:text-text-bright transition-all min-h-[140px]"
                >
                  <Plus size={20} className="text-text-dim" />
                  <span className="text-xs font-bold tracking-wider">
                    {language === 'EN' ? '+ ADD NEW LINK' : '+ リンクを追加'}
                  </span>
                </button>
              </div>
            ) : (
              /* LIST VIEW */
              <div className="flex flex-col border border-border-main bg-panel-bg divide-y divide-border-main">
                {filteredLinks.map((link, idx) => {
                  const isEditing = editingId === link.id;

                  if (isEditing) {
                    return (
                      <div key={link.id} className="p-3 bg-base-bg flex flex-col sm:flex-row items-center gap-2">
                        <span className="font-mono text-xs font-bold text-text-dim w-8">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          placeholder="タイトル"
                          className="flex-1 w-full px-2 py-1 bg-panel-bg border border-border-light text-text-bright text-xs font-bold"
                          autoFocus
                        />
                        <input
                          type="text"
                          value={editUrl}
                          onChange={e => setEditUrl(e.target.value)}
                          placeholder="URL"
                          className="flex-1 w-full px-2 py-1 bg-panel-bg border border-border-light text-text-bright text-xs font-mono"
                        />
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            onClick={() => handleSaveEdit(link.id)}
                            className="px-2.5 py-1 bg-border-main border border-border-light text-text-bright text-xs font-bold flex items-center gap-1"
                          >
                            <Check size={12} /> {t.save}
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="px-2 py-1 border border-border-main text-text-dim text-xs hover:bg-border-main"
                          >
                            {t.close}
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={link.id}
                      className="group flex items-center justify-between p-2.5 sm:px-3.5 hover:bg-base-bg/50 transition-colors gap-3"
                    >
                      {/* Left: Index + Title */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <span className="font-mono text-[11px] font-bold text-text-dim/60 w-7 shrink-0">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExternalWindow(link.url);
                          }}
                          className="font-bold text-text-bright hover:text-[#58a6ff] hover:underline transition-colors truncate"
                          style={{ fontSize: `${customFontSize}px` }}
                          title={`${link.title}（別ウィンドウで開く）`}
                        >
                          {link.title}
                        </a>
                      </div>

                      {/* Middle: Host / URL Preview */}
                      <div className="hidden md:block w-48 lg:w-64 shrink-0 text-[11px] font-mono text-text-dim truncate">
                        {link.url.replace(/^https?:\/\//, '')}
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        <div className="flex items-center opacity-60 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => handleMove(idx, 'up')}
                            disabled={idx === 0}
                            title="上へ移動"
                            className="p-1 text-text-dim hover:text-text-bright disabled:opacity-20 transition-colors"
                          >
                            <ArrowUp size={12} />
                          </button>
                          <button
                            onClick={() => handleMove(idx, 'down')}
                            disabled={idx === filteredLinks.length - 1}
                            title="下へ移動"
                            className="p-1 text-text-dim hover:text-text-bright disabled:opacity-20 transition-colors"
                          >
                            <ArrowDown size={12} />
                          </button>
                          <button
                            onClick={() => handleStartEdit(link)}
                            title="編集"
                            className="p-1 text-text-dim hover:text-text-bright transition-colors"
                          >
                            <Pencil size={12} />
                          </button>
                          <button
                            onClick={() => handleDelete(link.id)}
                            title="削除"
                            className="p-1 text-text-dim hover:text-[#ff7b72] transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>

                        <a
                          href={link.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => {
                            e.preventDefault();
                            openExternalWindow(link.url);
                          }}
                          className="flex items-center gap-1 px-2 py-1 border border-border-main bg-base-bg text-[11px] font-bold text-text-dim group-hover:text-[#58a6ff] hover:border-border-light transition-colors ml-1"
                          title="別ウィンドウで開く"
                        >
                          <span>開く</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>
                  );
                })}

                {/* Add Link Row */}
                <button
                  onClick={() => setIsAdding(true)}
                  className="w-full py-2.5 px-4 text-center text-xs font-bold text-text-dim hover:text-text-bright hover:bg-base-bg/60 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Plus size={13} />
                  <span>{language === 'EN' ? '+ ADD NEW LINK' : '+ リンクを追加'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: 銘柄探検 (2-Column Tanken Layout matching image) */}
      {activeTab === 'tanken' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="text-xs text-text-dim flex items-center gap-1.5">
              <Compass size={13} className="text-[#f59e0b]" />
              <span>株探「銘柄探検」公式プリセット検索リンク集（ファンダメンタルズ / テクニカル）</span>
            </div>

            <div className="relative w-56 sm:w-72">
              <input 
                type="text" 
                value={tankenQuery}
                onChange={(e) => setTankenQuery(e.target.value)}
                placeholder="条件を検索 (例: ROE, ゴールデンクロス)..."
                className="w-full h-7 px-2.5 pr-7 bg-base-bg border border-border-main text-text-normal text-[11px] placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
              />
              {tankenQuery && (
                <button
                  onClick={() => setTankenQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright"
                >
                  <X size={11} />
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-4">
              {tankenCategories.map(category => {
                const isFundamentals = category.id === 'fundamentals';
                const q = tankenQuery.toLowerCase().trim();
                const filteredGroups = category.groups.map(group => {
                  const items = group.items.filter(item => 
                    !q || item.title.toLowerCase().includes(q) || group.groupName.toLowerCase().includes(q)
                  );
                  return { ...group, items };
                }).filter(group => group.items.length > 0);

                return (
                  <div key={category.id} className="flex flex-col border border-border-main bg-base-bg/50">
                    <div className={`px-4 py-2.5 font-bold text-xs text-white flex items-center justify-between ${
                      isFundamentals 
                        ? 'bg-gradient-to-r from-[#d97706] to-[#b45309] border-b border-[#f59e0b]' 
                        : 'bg-gradient-to-r from-[#15803d] to-[#166534] border-b border-[#22c55e]'
                    }`}>
                      <span className="tracking-wider">{category.title}</span>
                      <span className="text-[10px] font-normal opacity-90 font-mono">
                        {filteredGroups.reduce((acc, g) => acc + g.items.length, 0)} 条件
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {filteredGroups.length === 0 ? (
                        <div className="py-6 text-center text-xs text-text-dim">
                          一致する条件がありません
                        </div>
                      ) : (
                        filteredGroups.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1.5">
                            <div className={`text-xs font-bold pb-1 border-b flex items-center gap-1.5 ${
                              isFundamentals 
                                ? 'text-[#f59e0b] border-[#d97706]/30' 
                                : 'text-[#4ade80] border-[#16a34a]/30'
                            }`}>
                              <span className={`w-1.5 h-3 rounded-xs ${isFundamentals ? 'bg-[#f59e0b]' : 'bg-[#4ade80]'}`} />
                              <span>{group.groupName}</span>
                            </div>

                            <div className="space-y-1 pt-0.5">
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
                                  className="group flex items-center justify-between px-2.5 py-1.5 text-xs text-text-normal hover:text-text-bright hover:bg-border-main/50 rounded transition-colors"
                                  title={`${item.title}（別ウィンドウで開く）`}
                                >
                                  <div className="flex items-center gap-2 truncate">
                                    <span className="w-1.5 h-1.5 rounded-full bg-text-dim/60 group-hover:bg-[#58a6ff] shrink-0 transition-colors" />
                                    <span 
                                      className="truncate group-hover:underline"
                                      style={{ fontSize: `${Math.max(12, customFontSize - 1)}px` }}
                                    >
                                      {item.title}
                                    </span>
                                  </div>
                                  <ExternalLink size={11} className="shrink-0 text-text-dim group-hover:text-text-bright opacity-0 group-hover:opacity-100 transition-opacity ml-2" />
                                </a>
                              ))}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 主要ニュース (News Feed & Digest) */}
      {activeTab === 'news' && (
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="flex items-center justify-between gap-2 mb-3 shrink-0">
            <div className="text-xs text-text-dim flex items-center gap-1.5">
              <Newspaper size={13} className="text-[#58a6ff]" />
              <span>株探 市場ニュース速報（クリックで要約ダイジェスト表示）</span>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative w-48 sm:w-64">
                <input 
                  type="text" 
                  value={newsFilterQuery}
                  onChange={(e) => setNewsFilterQuery(e.target.value)}
                  placeholder="ニュースを検索 (例: 上方修正, トヨタ)..."
                  className="w-full h-7 px-2.5 pr-7 bg-base-bg border border-border-main text-text-normal text-[11px] placeholder:text-text-dim/50 focus:outline-none focus:border-border-light transition-colors"
                />
                {newsFilterQuery && (
                  <button
                    onClick={() => setNewsFilterQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-dim hover:text-text-bright"
                  >
                    <X size={11} />
                  </button>
                )}
              </div>

              <button
                onClick={fetchNews}
                disabled={isLoadingNews}
                className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold border border-border-main hover:border-border-light bg-base-bg text-[#58a6ff] hover:text-[#79c0ff] transition-colors disabled:opacity-50"
              >
                <RefreshCw size={11} className={isLoadingNews ? 'animate-spin' : ''} />
                <span>最新情報を取得</span>
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto pr-1">
            {isLoadingNews && newsItems.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center gap-2 text-text-dim">
                <RefreshCw size={20} className="animate-spin text-[#58a6ff]" />
                <span className="text-xs">最新の市場ニュースを取得中...</span>
              </div>
            ) : newsError && newsItems.length === 0 ? (
              <div className="p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded text-[#ff7b72] flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <AlertCircle size={14} />
                  <span>{newsError}</span>
                </div>
                <button onClick={fetchNews} className="underline text-[#58a6ff]">再試行</button>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredNews.map((item, idx) => (
                  <div
                    key={item.id || idx}
                    onClick={() => setSelectedNews(item)}
                    className="p-3 bg-panel-bg hover:bg-border-main/50 border border-border-main hover:border-border-light cursor-pointer transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-xs shrink-0 ${
                        item.category.includes('材料') ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40' :
                        item.category.includes('市況') ? 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40' :
                        item.category.includes('決算') ? 'bg-[#d29922]/20 text-[#e3b341] border-[#d29922]/40' :
                        'bg-border-main text-text-dim border-border-main'
                      }`}>
                        {item.category}
                      </span>
                      <span 
                        className="text-text-bright group-hover:text-[#58a6ff] font-bold truncate transition-colors"
                        style={{ fontSize: `${customFontSize}px` }}
                      >
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-[11px] text-text-dim shrink-0 justify-between sm:justify-end">
                      <span className="font-mono flex items-center gap-1">
                        <Clock size={11} />
                        {item.time}
                      </span>
                      <span className="text-[10px] text-[#58a6ff] opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5 font-bold">
                        <span>ダイジェスト</span>
                        <ChevronRight size={11} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* News Digest Modal */}
      {selectedNews && (
        <NewsDigestModal
          newsId={selectedNews.id}
          newsTitle={selectedNews.title}
          newsTime={selectedNews.time}
          newsCategory={selectedNews.category}
          newsUrl={selectedNews.url}
          onClose={() => setSelectedNews(null)}
          theme={theme}
        />
      )}
    </div>
  );
}
