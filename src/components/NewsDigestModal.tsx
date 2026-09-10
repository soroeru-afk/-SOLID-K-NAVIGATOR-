import { useState, useEffect } from 'react';
import { ExternalLink, X, Clock, Tag, RefreshCw, AlertCircle } from 'lucide-react';
import { Theme } from '../App';
import { openExternalWindow } from '../lib/windowUtils';

interface Props {
  newsId: string;
  newsTitle: string;
  newsTime: string;
  newsCategory: string;
  newsUrl: string;
  onClose: () => void;
  theme?: Theme;
}

interface DetailData {
  title: string;
  time: string;
  category: string;
  body: string;
  url: string;
}

export default function NewsDigestModal({
  newsId,
  newsTitle,
  newsTime,
  newsCategory,
  newsUrl,
  onClose
}: Props) {
  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('KNAV_NEWS_FONT_SIZE');
    return saved ? parseInt(saved, 10) : 15;
  });

  const changeFontSize = (delta: number) => {
    setFontSize(prev => {
      const next = Math.max(12, Math.min(22, prev + delta));
      localStorage.setItem('KNAV_NEWS_FONT_SIZE', String(next));
      return next;
    });
  };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const urlParam = encodeURIComponent(newsUrl);
    fetch(`/api/news-detail?b=${newsId}&url=${urlParam}`)
      .then(res => {
        if (!res.ok) throw new Error('ニュース詳細の取得に失敗しました');
        return res.json();
      })
      .then(d => {
        if (isMounted) {
          setData(d);
          setLoading(false);
        }
      })
      .catch(err => {
        if (isMounted) {
          setError(err.message || '取得エラー');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [newsId, newsUrl]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const displayTitle = data?.title || newsTitle;
  const displayTime = data?.time || newsTime;
  const displayCategory = data?.category || newsCategory;
  const displayUrl = data?.url || newsUrl;

  const getCategoryBadgeClass = (cat: string) => {
    if (cat.includes('材料')) return 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/40';
    if (cat.includes('市況')) return 'bg-[#238636]/20 text-[#3fb950] border-[#238636]/40';
    if (cat.includes('決算')) return 'bg-[#d29922]/20 text-[#e3b341] border-[#d29922]/40';
    if (cat.includes('特集') || cat.includes('注目')) return 'bg-[#a371f7]/20 text-[#bc8cff] border-[#a371f7]/40';
    return 'bg-border-main text-text-dim border-border-main';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-[2px] animate-fadeIn">
      <div 
        className="bg-panel-bg border border-border-light w-full max-w-2xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-border-main bg-base-bg shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold tracking-widest text-text-dim uppercase">
              KABUTAN NEWS DIGEST
            </span>
            <span className="text-[10px] text-text-dim hidden sm:inline">| 株探ニュース要約</span>
          </div>

          <div className="flex items-center gap-3">
            {/* Font Size Controls */}
            <div className="flex items-center gap-1 bg-panel-bg px-2 py-0.5 border border-border-main rounded text-text-dim text-[11px]">
              <span className="text-[10px] font-mono hidden xs:inline">文字:</span>
              <button 
                onClick={() => changeFontSize(-1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-border-main hover:text-text-bright rounded font-bold transition-colors"
                title="文字を小さく (最小 12px)"
              >
                -
              </button>
              <span className="font-mono text-text-bright font-bold px-1 text-xs">{fontSize}px</span>
              <button 
                onClick={() => changeFontSize(1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-border-main hover:text-text-bright rounded font-bold transition-colors"
                title="文字を大きく (最大 22px)"
              >
                +
              </button>
            </div>

            <button
              onClick={onClose}
              className="text-text-dim hover:text-text-bright p-1 transition-colors"
              title="閉じる (Esc)"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 text-text-normal leading-relaxed">
          {/* Metadata Row */}
          <div className="flex flex-wrap items-center gap-2 mb-2.5">
            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-sm flex items-center gap-1 ${getCategoryBadgeClass(displayCategory)}`}>
              <Tag size={10} />
              {displayCategory}
            </span>
            <span className="text-[11px] font-mono text-text-dim flex items-center gap-1">
              <Clock size={11} />
              {displayTime}
            </span>
          </div>

          {/* Article Title */}
          <h2 
            className="font-bold text-text-bright leading-snug mb-4 border-b border-border-main/50 pb-3"
            style={{ fontSize: `${Math.max(16, fontSize + 3)}px` }}
          >
            {displayTitle}
          </h2>

          {/* Article Content */}
          {loading ? (
            <div className="py-10 flex flex-col items-center justify-center gap-2 text-text-dim">
              <RefreshCw size={20} className="animate-spin text-[#58a6ff]" />
              <span className="text-xs">ニュース記事のダイジェストを取得中...</span>
            </div>
          ) : error ? (
            <div className="p-4 bg-[#f85149]/10 border border-[#f85149]/30 rounded text-[#ff7b72] flex items-center gap-2 text-xs mb-4">
              <AlertCircle size={14} className="shrink-0" />
              <span>{error}。株探の元記事から直接ご確認ください。</span>
            </div>
          ) : (
            <div 
              className="space-y-3 font-sans text-text-bright/90"
              style={{ fontSize: `${fontSize}px`, lineHeight: 1.75 }}
            >
              {data?.body ? (
                data.body.split('\n').map((line, idx) => {
                  const trimmed = line.trim();
                  if (!trimmed) return <div key={idx} className="h-1.5" />;
                  
                  // Point highlight or bold start
                  if (trimmed.startsWith('■') || trimmed.startsWith('●') || trimmed.startsWith('◆') || trimmed.startsWith('【')) {
                    return (
                      <p key={idx} className="font-bold text-[#58a6ff] pt-1 border-l-2 border-[#58a6ff] pl-2.5 bg-base-bg/40 py-1">
                        {trimmed}
                      </p>
                    );
                  }

                  // Source attribution
                  if (trimmed.includes('提供：') || trimmed.startsWith('株探ニュース') || trimmed.startsWith('《')) {
                    return (
                      <p key={idx} className="text-text-dim italic pt-2" style={{ fontSize: `${Math.max(11, fontSize - 2)}px` }}>
                        {trimmed}
                      </p>
                    );
                  }

                  return (
                    <p key={idx} className="text-text-normal">
                      {trimmed}
                    </p>
                  );
                })
              ) : (
                <p className="text-text-dim">記事本文がありませんでした。</p>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 border-t border-border-main bg-base-bg/60 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-[10px] text-text-dim hidden sm:inline">
            情報提供: 株探 (Kabutan) / フィスコ
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <a
              href={displayUrl}
              target="_blank"
              rel="noreferrer"
              onClick={(e) => {
                e.preventDefault();
                openExternalWindow(displayUrl);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#1f6feb]/20 hover:bg-[#1f6feb]/30 border border-[#1f6feb]/50 text-[#58a6ff] hover:text-[#79c0ff] text-xs font-bold transition-colors"
              title="株探の元記事を別ウィンドウで開く"
            >
              <span>株探で元記事を見る</span>
              <ExternalLink size={12} />
            </a>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-panel-bg border border-border-main hover:bg-border-main text-text-bright text-xs transition-colors"
            >
              閉じる
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
