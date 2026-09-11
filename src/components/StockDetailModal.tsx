import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, ExternalLink, FileText, TrendingUp, Calendar, Tag, RefreshCw, BarChart2, Newspaper, FileSpreadsheet, AlertCircle, Save, Check, Volume2, Square, Play, Edit3, Trash2, List } from 'lucide-react';
import { Stock, Category, StockMemo } from '../types';
import { Language, i18n } from '../i18n';
import { Theme } from '../App';
import { openExternalWindow } from '../lib/windowUtils';

interface Props {
  stock: Stock | null;
  category?: Category;
  onClose: () => void;
  onUpdateStock: (id: string, updates: Partial<Stock>) => void;
  onRefreshPrice?: (code: string) => Promise<void>;
  isRefreshingPrice?: boolean;
  language: Language;
  theme: Theme;
  priceColor: string;
}

export default function StockDetailModal({
  stock,
  category,
  onClose,
  onUpdateStock,
  onRefreshPrice,
  isRefreshingPrice,
  language,
  theme,
  priceColor
}: Props) {
  const t = i18n[language];
  const [memoText, setMemoText] = useState('');
  const [targetPrice, setTargetPrice] = useState('');
  const [descText, setDescText] = useState('');
  const [isEditingDesc, setIsEditingDesc] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [history, setHistory] = useState<number[]>([]);
  
  // BWP (買値) state
  const [bwp, setBwp] = useState<{ price: string; comment?: string; setAt?: string } | null>(null);
  const [isEditingBwp, setIsEditingBwp] = useState(false);
  const [bwpPriceInput, setBwpPriceInput] = useState('');
  const [bwpDateInput, setBwpDateInput] = useState('');

  // Memo view mode: 'preview' (段落再生) or 'edit' (テキスト編集)
  const [memoViewMode, setMemoViewMode] = useState<'preview' | 'edit'>('preview');

  const [memoFontSize, setMemoFontSize] = useState<number>(() => {
    const saved = localStorage.getItem('KNAV_DETAIL_FONT_SIZE');
    return saved ? parseInt(saved, 10) : 14;
  });

  // Speech Synthesis (TTS) state - Ichiro & Haruka settings stored independently
  const [voiceType, setVoiceType] = useState<'ichiro' | 'haruka'>(() => {
    return (localStorage.getItem('KNAV_TTS_VOICE') as 'ichiro' | 'haruka') || 'ichiro';
  });

  // Ichiro settings
  const [ichiroRate, setIchiroRate] = useState<number>(() => {
    const v = localStorage.getItem('KNAV_TTS_RATE_ICHIRO');
    if (v) return parseFloat(v);
    const legacy = localStorage.getItem('KNAV_TTS_RATE');
    return legacy ? parseFloat(legacy) : 1.0;
  });
  const [ichiroPitch, setIchiroPitch] = useState<number>(() => {
    const v = localStorage.getItem('KNAV_TTS_PITCH_ICHIRO');
    if (v) return parseFloat(v);
    const legacy = localStorage.getItem('KNAV_TTS_PITCH');
    return legacy ? parseFloat(legacy) : 1.0;
  });

  // Haruka settings
  const [harukaRate, setHarukaRate] = useState<number>(() => {
    const v = localStorage.getItem('KNAV_TTS_RATE_HARUKA');
    if (v) return parseFloat(v);
    return 1.0;
  });
  const [harukaPitch, setHarukaPitch] = useState<number>(() => {
    const v = localStorage.getItem('KNAV_TTS_PITCH_HARUKA');
    if (v) return parseFloat(v);
    return 1.0;
  });

  // Current active rate and pitch based on selected voice
  const currentRate = voiceType === 'ichiro' ? ichiroRate : harukaRate;
  const currentPitch = voiceType === 'ichiro' ? ichiroPitch : harukaPitch;

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeSpeakingParagraph, setActiveSpeakingParagraph] = useState<number | null>(null);
  const [speakingSection, setSpeakingSection] = useState<'desc' | 'memo' | 'all' | null>(null);
  const keepAliveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleVoiceTypeChange = (newVoice: 'ichiro' | 'haruka') => {
    if (isSpeaking) {
      stopTTS();
    }
    setVoiceType(newVoice);
    localStorage.setItem('KNAV_TTS_VOICE', newVoice);
  };

  const handleRateChange = (newRate: number) => {
    const cleanRate = Math.round(newRate * 10) / 10;
    if (voiceType === 'ichiro') {
      setIchiroRate(cleanRate);
      localStorage.setItem('KNAV_TTS_RATE_ICHIRO', cleanRate.toFixed(1));
    } else {
      setHarukaRate(cleanRate);
      localStorage.setItem('KNAV_TTS_RATE_HARUKA', cleanRate.toFixed(1));
    }
  };

  const handlePitchChange = (newPitch: number) => {
    const cleanPitch = Math.round(newPitch * 10) / 10;
    if (voiceType === 'ichiro') {
      setIchiroPitch(cleanPitch);
      localStorage.setItem('KNAV_TTS_PITCH_ICHIRO', cleanPitch.toFixed(1));
    } else {
      setHarukaPitch(cleanPitch);
      localStorage.setItem('KNAV_TTS_PITCH_HARUKA', cleanPitch.toFixed(1));
    }
  };

  const stopTTS = () => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    if (keepAliveRef.current) {
      clearInterval(keepAliveRef.current);
      keepAliveRef.current = null;
    }
    setIsSpeaking(false);
    setActiveSpeakingParagraph(null);
    setSpeakingSection(null);
  };

  useEffect(() => {
    return () => {
      stopTTS();
    };
  }, [stock?.id]);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.getVoices();
      const onVoicesChanged = () => {
        window.speechSynthesis.getVoices();
      };
      window.speechSynthesis.onvoiceschanged = onVoicesChanged;
    }
  }, []);

  // Split memo into readable/playable paragraphs
  const memoParagraphs = useMemo(() => {
    if (!memoText.trim()) return [];
    const doubleSplit = memoText.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (doubleSplit.length > 1) {
      return doubleSplit;
    }
    return memoText.split(/\n/).map(p => p.trim()).filter(Boolean);
  }, [memoText]);

  // Core TTS speak function
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      alert('お使いのブラウザは音声合成 (Web Speech API) に対応していません。');
      return;
    }

    stopTTS();

    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = currentRate;
    utterance.pitch = currentPitch;

    const allVoices = synth.getVoices();
    const jaVoices = allVoices.filter(v => 
      v.lang.toLowerCase().startsWith('ja') || v.lang.toLowerCase() === 'ja_jp' || v.lang.toLowerCase() === 'ja' || /japanese|日本語/i.test(v.name)
    );

    if (jaVoices.length > 0) {
      if (voiceType === 'ichiro') {
        const ichiroVoice = 
          jaVoices.find(v => /ichiro|一郎/i.test(v.name)) ||
          jaVoices.find(v => /keita|takumi|otoya|daichi|kenji/i.test(v.name)) ||
          jaVoices.find(v => /male|男性/i.test(v.name)) ||
          jaVoices.find(v => !/haruka|はるか|nanami|ayumi|female|女性|kyoko|sayaka|mizuki/i.test(v.name)) ||
          jaVoices[0];
        utterance.voice = ichiroVoice;
      } else {
        const harukaVoice = 
          jaVoices.find(v => /haruka|はるか/i.test(v.name)) ||
          jaVoices.find(v => /nanami|ayumi|kyoko|sayaka|mizuki/i.test(v.name)) ||
          jaVoices.find(v => /female|女性/i.test(v.name)) ||
          jaVoices[0];
        utterance.voice = harukaVoice;
      }
    }

    utterance.onstart = () => {
      setIsSpeaking(true);
    };

    utterance.onend = () => {
      stopTTS();
      if (onEnd) onEnd();
    };

    utterance.onerror = () => {
      stopTTS();
      if (onEnd) onEnd();
    };

    synth.speak(utterance);
    setIsSpeaking(true);

    if (keepAliveRef.current) clearInterval(keepAliveRef.current);
    keepAliveRef.current = setInterval(() => {
      if (synth.speaking && !synth.paused) {
        synth.pause();
        synth.resume();
      }
    }, 10000);
  };

  // 1. Overall play button: starts from Company Description, then Memo
  const handleToggleTTS = () => {
    if (isSpeaking) {
      stopTTS();
      return;
    }

    // Selected text takes first priority
    const selectedText = window.getSelection()?.toString().trim();
    if (selectedText) {
      setSpeakingSection('all');
      speakText(selectedText);
      return;
    }

    // Start with Company Overview, then continue to Memo
    const parts: string[] = [];
    if (descText.trim()) {
      parts.push(`企業概要。${descText.trim()}`);
    }
    if (memoText.trim()) {
      parts.push(`考察メモ。${memoText.trim()}`);
    }
    if (parts.length === 0) {
      parts.push(`${stock?.code || ''} ${stock?.name || ''}`);
    }

    setSpeakingSection('all');
    speakText(parts.join('。\n\n'));
  };

  // 2. Play only company description
  const handleSpeakDescOnly = () => {
    if (isSpeaking && speakingSection === 'desc') {
      stopTTS();
      return;
    }
    if (!descText.trim()) return;
    setSpeakingSection('desc');
    speakText(`企業概要。${descText.trim()}`);
  };

  // 3. Play memo starting from a specific clicked paragraph
  const handlePlayFromParagraph = (startIndex: number) => {
    if (isSpeaking && activeSpeakingParagraph === startIndex) {
      stopTTS();
      return;
    }
    const targetParagraphs = memoParagraphs.slice(startIndex);
    if (targetParagraphs.length === 0) return;

    setActiveSpeakingParagraph(startIndex);
    setSpeakingSection('memo');

    speakText(targetParagraphs.join('。\n\n'), () => {
      setActiveSpeakingParagraph(null);
    });
  };

  const changeFontSize = (delta: number) => {
    setMemoFontSize(prev => {
      const next = Math.max(12, Math.min(22, prev + delta));
      localStorage.setItem('KNAV_DETAIL_FONT_SIZE', String(next));
      return next;
    });
  };

  useEffect(() => {
    if (!stock) return;
    setDescText(stock.description || '');
    setIsEditingDesc(false);

    // Load memo from localStorage
    try {
      const rawMemo = localStorage.getItem('KNAV_SX_MEMO_' + stock.code);
      if (rawMemo) {
        const parsed: StockMemo = JSON.parse(rawMemo);
        setMemoText(parsed.text || '');
        setTargetPrice(parsed.targetPrice || '');
        setMemoViewMode(parsed.text ? 'preview' : 'edit');
      } else {
        setMemoText('');
        setTargetPrice('');
        setMemoViewMode('edit');
      }
    } catch {
      setMemoText('');
      setTargetPrice('');
      setMemoViewMode('edit');
    }

    // Load history
    try {
      const rawHist = localStorage.getItem('KNAV_SX_HIST_' + stock.code);
      if (rawHist) {
        const parsed = JSON.parse(rawHist);
        if (Array.isArray(parsed)) {
          setHistory(parsed);
        }
      } else {
        setHistory([]);
      }
    } catch {
      setHistory([]);
    }

    // Load BWP
    try {
      const rawBwp = localStorage.getItem('KNAV_SX_BWP_' + stock.code);
      if (rawBwp) {
        const parsed = JSON.parse(rawBwp);
        setBwp(parsed);
        setBwpPriceInput(parsed.price || '');
        setBwpDateInput(parsed.setAt || '');
      } else {
        setBwp(null);
        setBwpPriceInput('');
        setBwpDateInput('');
      }
    } catch {
      setBwp(null);
      setBwpPriceInput('');
      setBwpDateInput('');
    }

    setIsEditingBwp(false);
    setIsSaved(false);
  }, [stock]);

  if (!stock) return null;

  const handleSaveMemo = () => {
    const memoObj: StockMemo = {
      text: memoText,
      targetPrice: targetPrice.trim(),
      savedAt: new Date().toLocaleString('ja-JP')
    };
    localStorage.setItem('KNAV_SX_MEMO_' + stock.code, JSON.stringify(memoObj));
    if (descText !== (stock.description || '')) {
      onUpdateStock(stock.id, { description: descText.trim() });
    }
    if (isEditingBwp) {
      handleSaveBwp();
    }
    setIsEditingDesc(false);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

  // BWP Save / Delete
  const handleSaveBwp = () => {
    const p = bwpPriceInput.trim();
    if (!p) {
      handleDeleteBwp();
      return;
    }
    const newBwp = {
      price: p,
      setAt: bwpDateInput.trim() || new Date().toLocaleString('ja-JP')
    };
    localStorage.setItem('KNAV_SX_BWP_' + stock.code, JSON.stringify(newBwp));
    setBwp(newBwp);
    setIsEditingBwp(false);
  };

  const handleDeleteBwp = () => {
    localStorage.removeItem('KNAV_SX_BWP_' + stock.code);
    setBwp(null);
    setBwpPriceInput('');
    setBwpDateInput('');
    setIsEditingBwp(false);
  };

  const formatDate = (ms?: number) => {
    if (!ms) return '-';
    const d = new Date(ms);
    return `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
  };

  const kabutanBaseUrl = `https://kabutan.jp/stock/?code=${stock.code}`;
  const kabutanChartUrl = `https://kabutan.jp/stock/chart?code=${stock.code}`;
  const kabutanKessanUrl = `https://kabutan.jp/stock/finance?code=${stock.code}`;
  const kabutanNewsUrl = `https://kabutan.jp/stock/news?code=${stock.code}`;
  const kabutanKaijiUrl = `https://kabutan.jp/stock/kabutan_disclose?code=${stock.code}`;

  const maxPrice = history.length > 0 ? Math.max(...history) : null;
  const minPrice = history.length > 0 ? Math.min(...history) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div 
        className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-panel-bg border border-border-main shadow-2xl overflow-hidden font-sans"
        style={{ color: theme === 'light' ? '#24292f' : '#adbac7' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border-main bg-base-bg">
          <div className="flex items-center gap-3">
            <span 
              className={`font-mono text-base font-black px-2 py-0.5 border border-border-main tracking-wider ${
                theme === 'light' ? 'bg-black text-white' : 'bg-white text-black'
              }`}
            >
              {stock.code}
            </span>
            <div>
              <h2 className="text-base font-black text-text-bright tracking-wide flex items-center gap-2">
                <span>{stock.name}</span>
              </h2>
              <div className="flex items-center gap-2 text-[10px] text-text-dim mt-0.5">
                <span>{category?.name || '未分類'}</span>
                <span>•</span>
                <span>登録: {formatDate(stock.createdAt)}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Font Size Adjuster */}
            <div className="flex items-center border border-border-main bg-panel-bg text-[11px] font-mono px-1.5 py-0.5 rounded-xs gap-1.5">
              <button 
                onClick={() => changeFontSize(-1)}
                className="w-5 h-5 flex items-center justify-center hover:bg-border-main hover:text-text-bright rounded font-bold transition-colors"
                title="文字を小さく (最小 12px)"
              >
                -
              </button>
              <span className="font-bold text-text-bright min-w-[32px] text-center">
                {memoFontSize}px
              </span>
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
              className="p-1.5 border border-border-main rounded hover:bg-border-main text-text-dim hover:text-text-bright transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body Content (scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 text-xs">
          
          {/* Price & Target Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-base-bg p-3 border border-border-main">
            <div>
              <div className="text-[10px] text-text-dim font-bold tracking-wider mb-1 flex items-center justify-between">
                <span>{language === 'EN' ? 'CURRENT PRICE' : '現在値 / 終値'}</span>
                {onRefreshPrice && (
                  <button
                    onClick={() => onRefreshPrice(stock.code)}
                    disabled={isRefreshingPrice}
                    title={t.updatePrice}
                    className="text-text-dim hover:text-text-bright p-0.5 disabled:opacity-40 transition-colors"
                  >
                    <RefreshCw size={11} className={isRefreshingPrice ? 'animate-spin text-[#58a6ff]' : ''} />
                  </button>
                )}
              </div>
              <div 
                className="text-lg font-black font-mono tracking-tight"
                style={{ color: priceColor === 'red' ? '#C41414' : undefined }}
              >
                {stock.price && stock.price !== '?' ? `¥${stock.price}` : '未取得'}
              </div>
              {stock.priceUpdatedAt && (
                <div className="text-[9px] text-text-dim mt-0.5">
                  更新: {new Date(stock.priceUpdatedAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </div>
              )}
            </div>

            <div>
              <div className="text-[10px] text-text-dim font-bold tracking-wider mb-1">
                {t.targetPrice}
              </div>
              <div className="flex items-center gap-1 font-mono text-base font-bold text-text-bright">
                ¥
                <input
                  type="text"
                  value={targetPrice}
                  onChange={(e) => setTargetPrice(e.target.value)}
                  placeholder="---"
                  className="w-24 bg-panel-bg border border-border-main px-1.5 py-0.5 text-xs text-text-bright focus:outline-none focus:border-border-light font-mono"
                />
              </div>
            </div>

            {/* Buy Watch Price (BWP / 買値) with Edit Capability */}
            <div>
              <div className="text-[10px] text-text-dim font-bold tracking-wider mb-1 flex items-center justify-between">
                <span>買値 / BWP</span>
                {!isEditingBwp && (
                  <button
                    type="button"
                    onClick={() => {
                      setBwpPriceInput(bwp?.price || '');
                      setBwpDateInput(bwp?.setAt || new Date().toLocaleString('ja-JP'));
                      setIsEditingBwp(true);
                    }}
                    className="text-[9px] text-[#58a6ff] hover:underline flex items-center gap-0.5 font-bold"
                    title="買値を変更・登録"
                  >
                    <Edit3 size={10} />
                    <span>{bwp ? '編集' : '+ 登録'}</span>
                  </button>
                )}
              </div>

              {isEditingBwp ? (
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-1 font-mono text-xs font-bold text-text-bright">
                    <span>¥</span>
                    <input
                      type="text"
                      value={bwpPriceInput}
                      onChange={(e) => setBwpPriceInput(e.target.value)}
                      placeholder="例: 2981"
                      className="w-20 bg-panel-bg border border-border-main px-1 py-0.5 text-xs text-text-bright focus:outline-none focus:border-[#58a6ff] font-mono"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleSaveBwp();
                        if (e.key === 'Escape') setIsEditingBwp(false);
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleSaveBwp}
                      className="px-1.5 py-0.5 bg-[#2ea043] text-white text-[10px] font-bold rounded-xs hover:bg-[#3fb950]"
                      title="保存"
                    >
                      保存
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsEditingBwp(false)}
                      className="px-1.5 py-0.5 bg-border-main text-text-dim hover:text-text-bright text-[10px] rounded-xs"
                      title="キャンセル"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-1 mt-0.5">
                    <input
                      type="text"
                      value={bwpDateInput}
                      onChange={(e) => setBwpDateInput(e.target.value)}
                      placeholder="設定日"
                      className="w-24 bg-panel-bg border border-border-main/50 px-1 py-0.5 text-[9px] text-text-dim focus:outline-none font-mono"
                    />
                    {bwp && (
                      <button
                        type="button"
                        onClick={handleDeleteBwp}
                        className="text-[9px] text-red-400 hover:underline"
                        title="買値データを削除"
                      >
                        削除
                      </button>
                    )}
                  </div>
                </div>
              ) : bwp ? (
                <div>
                  <div 
                    onClick={() => {
                      setBwpPriceInput(bwp.price);
                      setBwpDateInput(bwp.setAt || '');
                      setIsEditingBwp(true);
                    }}
                    className="text-base font-bold font-mono text-text-bright cursor-pointer hover:text-text-bright transition-colors"
                    title="クリックして買値を編集"
                  >
                    ¥{bwp.price}
                  </div>
                  {bwp.setAt && (
                    <div className="text-[9px] text-text-dim truncate">{bwp.setAt}</div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => {
                    setBwpPriceInput('');
                    setBwpDateInput(new Date().toLocaleString('ja-JP'));
                    setIsEditingBwp(true);
                  }}
                  className="text-text-dim/60 text-xs italic cursor-pointer hover:text-text-dim"
                  title="クリックして買値を登録"
                >
                  未設定 (クリックで登録)
                </div>
              )}
            </div>

            {history.length > 0 && (
              <div>
                <div className="text-[10px] text-text-dim font-bold tracking-wider mb-1">
                  過去高値 / 安値
                </div>
                <div className="text-[11px] font-mono font-bold text-text-bright">
                  高: ¥{maxPrice?.toLocaleString()}
                </div>
                <div className="text-[11px] font-mono font-bold text-text-dim">
                  安: ¥{minPrice?.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Direct Quick Links to Kabutan */}
          <div>
            <div className="text-[10px] text-text-dim font-bold tracking-wider mb-2 flex items-center gap-1.5">
              <ExternalLink size={12} />
              <span>{t.links} (KABUTAN)</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              <a
                href={kabutanBaseUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalWindow(kabutanBaseUrl);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-main bg-base-bg hover:bg-border-main/50 hover:text-text-bright transition-colors font-bold text-[11px]"
                title="株探の基本情報を完全に独立した新規ウィンドウで開く"
              >
                <ExternalLink size={12} className="text-text-bright" />
                {t.openKabutan}
              </a>
              <a
                href={kabutanChartUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalWindow(kabutanChartUrl);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-main bg-base-bg hover:bg-border-main/50 hover:text-text-bright transition-colors font-bold text-[11px]"
                title="株探のチャート画面を完全に独立した新規ウィンドウで開く"
              >
                <BarChart2 size={12} className="text-[#2ea043]" />
                {t.openChart}
              </a>
              <a
                href={kabutanKessanUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalWindow(kabutanKessanUrl);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-main bg-base-bg hover:bg-border-main/50 hover:text-text-bright transition-colors font-bold text-[11px]"
                title="株探の決算・業績画面を完全に独立した新規ウィンドウで開く"
              >
                <FileSpreadsheet size={12} className="text-[#d29922]" />
                {t.openKessan}
              </a>
              <a
                href={kabutanNewsUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalWindow(kabutanNewsUrl);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-main bg-base-bg hover:bg-border-main/50 hover:text-text-bright transition-colors font-bold text-[11px]"
                title="株探のニュース画面を完全に独立した新規ウィンドウで開く"
              >
                <Newspaper size={12} className="text-[#a371f7]" />
                {t.openNews}
              </a>
              <a
                href={kabutanKaijiUrl}
                target="_blank"
                rel="noreferrer"
                onClick={(e) => {
                  e.preventDefault();
                  openExternalWindow(kabutanKaijiUrl);
                }}
                className="flex items-center justify-center gap-1.5 px-3 py-2 border border-border-main bg-base-bg hover:bg-border-main/50 hover:text-text-bright transition-colors font-bold text-[11px] col-span-2 sm:col-span-1"
                title="株探の適時開示画面を完全に独立した新規ウィンドウで開く"
              >
                <FileText size={12} className="text-[#f85149]" />
                {t.openKaiji}
              </a>
            </div>
          </div>

          {/* Company Details / Overview Section (企業概要・詳細情報) */}
          <div className="flex flex-col gap-2">
            {/* Header: Title and TTS Audio Controls (グレー枠の上・外側に配置) */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] text-text-dim font-bold tracking-wider flex items-center gap-1.5">
                <Tag size={12} className="text-text-bright" />
                <span>企業概要・詳細情報 (銘柄詳細)</span>
              </div>

              {/* TTS Audio Controls */}
              <div className="flex items-center gap-2 flex-wrap">
                <div className="h-7 px-2.5 flex items-center gap-2 bg-base-bg border border-border-main text-[11px] rounded-xs box-border shrink-0">
                  {/* Voice: 一郎 / はるか */}
                  <div className="h-[22px] flex items-stretch border border-border-main bg-panel-bg rounded-xs overflow-hidden box-border">
                    <button
                      type="button"
                      onClick={() => handleVoiceTypeChange('ichiro')}
                      className={`px-2 flex items-center justify-center text-[10px] font-bold transition-colors leading-none ${
                        voiceType === 'ichiro'
                          ? 'bg-[#58a6ff] text-white'
                          : 'text-text-dim hover:text-text-bright'
                      }`}
                      title="男性音声 (一郎) - 速度・トーンは個別に記憶・維持されます"
                    >
                      一郎
                    </button>
                    <button
                      type="button"
                      onClick={() => handleVoiceTypeChange('haruka')}
                      className={`px-2 flex items-center justify-center text-[10px] font-bold transition-colors leading-none ${
                        voiceType === 'haruka'
                          ? 'bg-[#f778ba] text-white'
                          : 'text-text-dim hover:text-text-bright'
                      }`}
                      title="女性音声 (はるか) - 速度・トーンは個別に記憶・維持されます"
                    >
                      はるか
                    </button>
                  </div>

                  {/* Rate / Speed (速度: 一郎/はるか個別に記憶) */}
                  <div className="flex items-center gap-1 text-[10px] text-text-dim pl-0.5">
                    <span className="shrink-0 leading-none">速度:</span>
                    <select
                      value={currentRate.toFixed(1)}
                      onChange={(e) => handleRateChange(parseFloat(e.target.value))}
                      className="h-[22px] bg-panel-bg text-text-bright border border-border-main px-1 rounded-xs text-[10px] focus:outline-none cursor-pointer font-mono box-border"
                      title={`${voiceType === 'ichiro' ? '一郎' : 'はるか'}の読み上げ速度`}
                    >
                      <option value="0.7">0.7x</option>
                      <option value="0.8">0.8x</option>
                      <option value="0.9">0.9x</option>
                      <option value="1.0">1.0x</option>
                      <option value="1.1">1.1x</option>
                      <option value="1.2">1.2x</option>
                      <option value="1.3">1.3x</option>
                      <option value="1.4">1.4x</option>
                      <option value="1.5">1.5x</option>
                      <option value="1.6">1.6x</option>
                      <option value="1.8">1.8x</option>
                      <option value="2.0">2.0x</option>
                    </select>
                  </div>

                  {/* Pitch / Tone (トーン: 一郎/はるか個別に記憶) */}
                  <div className="flex items-center gap-1 text-[10px] text-text-dim pl-0.5">
                    <span className="shrink-0 leading-none">トーン:</span>
                    <select
                      value={currentPitch.toFixed(1)}
                      onChange={(e) => handlePitchChange(parseFloat(e.target.value))}
                      className="h-[22px] bg-panel-bg text-text-bright border border-border-main px-1 rounded-xs text-[10px] focus:outline-none cursor-pointer font-mono box-border"
                      title={`${voiceType === 'ichiro' ? '一郎' : 'はるか'}の声のトーン`}
                    >
                      <option value="0.8">0.8(低)</option>
                      <option value="0.9">0.9(やや低)</option>
                      <option value="1.0">1.0(標準)</option>
                      <option value="1.1">1.1(やや高)</option>
                      <option value="1.2">1.2(高)</option>
                      <option value="1.3">1.3(より高)</option>
                      <option value="1.4">1.4(超高)</option>
                    </select>
                  </div>

                  {/* Play / Stop Button - テーマに応じた白抜き/黒文字 & 太め枠線 */}
                  <button
                    type="button"
                    onClick={handleToggleTTS}
                    className={`w-[66px] min-w-[66px] max-w-[66px] h-[22px] flex items-center justify-center gap-1 font-bold text-[10px] transition-colors rounded-xs border-[1.5px] ml-0.5 shrink-0 box-border ${
                      isSpeaking
                        ? 'bg-red-500/20 text-red-400 border-red-500/60 hover:bg-red-500/30'
                        : theme === 'light'
                          ? 'bg-panel-bg text-black border-slate-500 hover:border-black hover:bg-border-main'
                          : 'bg-panel-bg text-white border-white/50 hover:border-white/80 hover:bg-border-main'
                    }`}
                    title={isSpeaking ? "読み上げを停止" : "企業概要から文章を音声読み上げ（テキスト選択時は選択部分）"}
                  >
                    <span className="w-3 h-3 flex items-center justify-center shrink-0">
                      {isSpeaking ? (
                        <Square size={10} className="fill-current text-red-400" />
                      ) : (
                        <Volume2 
                          size={11} 
                          className={theme === 'light' ? 'text-black shrink-0' : 'text-white shrink-0'} 
                        />
                      )}
                    </span>
                    <span className={`shrink-0 leading-none ${theme === 'light' ? (isSpeaking ? 'text-red-600' : 'text-black') : (isSpeaking ? 'text-red-400' : 'text-white')}`}>
                      {isSpeaking ? '停止' : '再生'}
                    </span>
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setIsEditingDesc(!isEditingDesc)}
                  className={`h-7 px-2.5 bg-base-bg border border-border-main hover:border-border-light text-[10px] font-bold inline-flex items-center gap-1 rounded-xs transition-colors box-border shrink-0 ${
                    isEditingDesc 
                      ? 'text-[#3fb950] border-[#2ea043]/50' 
                      : 'text-text-bright hover:text-text-bright'
                  }`}
                  title={isEditingDesc ? "編集を完了" : "企業概要・詳細情報を編集"}
                >
                  {isEditingDesc ? (
                    <>
                      <Check size={11} className="text-[#3fb950]" />
                      <span>完了</span>
                    </>
                  ) : (
                    <>
                      <Edit3 size={11} />
                      <span>{descText ? '編集' : '+ 詳細を追加'}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Gray Container for Description Text (企業概要とボタンの下に配置されたグレー枠) */}
            <div className="bg-base-bg p-3.5 border border-border-main">
              {isEditingDesc ? (
                <textarea
                  value={descText}
                  onChange={(e) => setDescText(e.target.value)}
                  placeholder="事業内容、主力製品、特色、テーマ、注目ポイントなどを記入..."
                  className="w-full h-24 bg-panel-bg border border-border-light p-2.5 text-text-bright leading-relaxed focus:outline-none font-sans resize-y"
                  style={{ fontSize: `${memoFontSize}px` }}
                />
              ) : descText ? (
                <div 
                  className="text-text-bright leading-relaxed whitespace-pre-wrap font-sans select-text"
                  style={{ fontSize: `${memoFontSize}px` }}
                >
                  {descText}
                </div>
              ) : (
                <div className="text-[11px] text-text-dim italic">
                  詳細情報は未登録です。「+ 詳細を追加」から事業内容や特色を登録できます。
                </div>
              )}
            </div>
          </div>

          {/* Memo & Analysis Area (MEMO 考察・メモ・投資ノート) */}
          <div className="flex flex-col gap-2 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-[10px] text-text-dim font-bold tracking-wider flex items-center gap-1.5">
                <FileText size={12} />
                <span>{t.memo} (考察・メモ・投資ノート)</span>
                <span className="text-text-dim font-normal ml-1">
                  ({memoText.length} {t.charCount})
                </span>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {/* View Mode Toggle: Preview (段落再生) vs Edit (テキスト編集) */}
                <div className="h-7 flex items-center border border-border-main bg-base-bg rounded-xs p-0.5 box-border">
                  <button
                    type="button"
                    onClick={() => setMemoViewMode('preview')}
                    className={`h-full px-2 text-[10px] font-bold transition-colors flex items-center gap-1 rounded-xs ${
                      memoViewMode === 'preview'
                        ? 'bg-border-main text-text-bright shadow-2xs'
                        : 'text-text-dim hover:text-text-bright'
                    }`}
                    title="段落ごとにクリックして読み上げる閲覧モード"
                  >
                    <List size={11} />
                    <span>段落再生</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemoViewMode('edit')}
                    className={`h-full px-2 text-[10px] font-bold transition-colors flex items-center gap-1 rounded-xs ${
                      memoViewMode === 'edit'
                        ? 'bg-border-main text-text-bright shadow-2xs'
                        : 'text-text-dim hover:text-text-bright'
                    }`}
                    title="文章を編集するモード"
                  >
                    <Edit3 size={11} />
                    <span>編集</span>
                  </button>
                </div>

                {/* Save Button */}
                <button
                  type="button"
                  onClick={handleSaveMemo}
                  className="h-7 flex items-center gap-1.5 px-3 bg-border-main hover:bg-border-light text-text-bright font-bold text-[10px] border border-border-light rounded-xs transition-colors shrink-0 box-border"
                >
                  {isSaved ? (
                    <>
                      <Check size={12} className="text-[#2ea043]" />
                      <span>保存しました</span>
                    </>
                  ) : (
                    <>
                      <Save size={12} />
                      <span>{t.save}</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Memo Display / Editor Content */}
            {memoViewMode === 'preview' ? (
              <div 
                className="w-full min-h-[176px] bg-base-bg border border-border-main p-3 leading-relaxed font-sans overflow-y-auto max-h-[360px]"
                style={{ fontSize: `${memoFontSize}px`, lineHeight: 1.6 }}
              >
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-border-main/50 text-[10px] text-text-dim">
                  <span>💡 任意の段落をクリックすると、その位置から読み上げを開始します</span>
                  <button
                    type="button"
                    onClick={() => setMemoViewMode('edit')}
                    className="text-text-bright hover:underline font-bold"
                  >
                    テキストを編集
                  </button>
                </div>

                {memoParagraphs.length === 0 ? (
                  <div 
                    onClick={() => setMemoViewMode('edit')}
                    className="text-text-dim/60 italic text-center py-8 cursor-pointer hover:text-text-dim"
                  >
                    メモは未登録です。クリックして記入してください。
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {memoParagraphs.map((para, idx) => {
                      const isThisSpeaking = isSpeaking && activeSpeakingParagraph === idx;
                      return (
                        <div
                          key={idx}
                          onClick={() => handlePlayFromParagraph(idx)}
                          className={`group relative p-2.5 rounded-xs transition-all cursor-pointer border ${
                            isThisSpeaking
                              ? 'bg-[#58a6ff]/15 border-[#58a6ff] text-text-bright shadow-xs'
                              : 'bg-panel-bg/60 hover:bg-panel-bg border-border-main/40 hover:border-border-light text-text-normal hover:text-text-bright'
                          }`}
                          title="クリックしてこの段落から再生"
                        >
                          <div className="flex items-start gap-2">
                            <button
                              type="button"
                              className={`mt-0.5 shrink-0 p-1 rounded-full transition-all ${
                                isThisSpeaking
                                  ? 'bg-[#58a6ff] text-white'
                                  : 'bg-border-main text-text-dim group-hover:text-[#58a6ff] group-hover:bg-border-light'
                              }`}
                            >
                              {isThisSpeaking ? (
                                <Square size={10} className="fill-current" />
                              ) : (
                                <Play size={10} className="fill-current ml-0.5" />
                              )}
                            </button>
                            <p className="flex-1 whitespace-pre-wrap leading-relaxed select-text text-text-bright">
                              {para}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              <textarea
                value={memoText}
                onChange={(e) => setMemoText(e.target.value)}
                placeholder={language === 'EN' ? 'Enter notes, investment thesis, key levels, catalysts...' : 'この銘柄の投資理由、決算メモ、目標・サポートライン、注目ニュースなどを記入...'}
                className="w-full h-44 bg-base-bg border border-border-main p-3 text-text-bright leading-relaxed focus:outline-none focus:border-border-light resize-y font-mono"
                style={{ fontSize: `${memoFontSize}px`, lineHeight: 1.6 }}
              />
            )}
          </div>

          {/* Price History Preview (if available) */}
          {history.length > 0 && (
            <div className="border-t border-border-main pt-3">
              <div className="text-[10px] text-text-dim font-bold tracking-wider mb-2 flex items-center justify-between">
                <span>{t.history} ({history.length} 点)</span>
                <span className="text-[9px] font-normal">最新 → 過去</span>
              </div>
              <div className="flex items-center gap-1.5 overflow-x-auto py-1 font-mono text-[10px] text-text-dim">
                {history.slice(-15).reverse().map((h, i) => (
                  <span key={i} className="px-2 py-0.5 bg-base-bg border border-border-main shrink-0 text-text-normal">
                    ¥{h.toLocaleString()}
                  </span>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border-main bg-base-bg/60 text-[10px] text-text-dim">
          <span>コード: {stock.code}</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 border border-border-main hover:bg-border-main text-text-normal transition-colors font-bold"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
}
