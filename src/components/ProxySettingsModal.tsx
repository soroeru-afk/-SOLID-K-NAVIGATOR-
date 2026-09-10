import React, { useState, useEffect } from 'react';
import { X, Globe, HelpCircle, Check, Copy, TrendingUp } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function ProxySettingsModal({ isOpen, onClose }: Props) {
  const [apiUrl, setApiUrl] = useState('');
  const [testCode, setTestCode] = useState('7203');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const [copiedGas, setCopiedGas] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const stored = localStorage.getItem('KNAV_CUSTOM_API_URL') || '';
      setApiUrl(stored);
      setTestResult(null);
      setSaved(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    const trimmed = apiUrl.trim();
    if (trimmed) {
      localStorage.setItem('KNAV_CUSTOM_API_URL', trimmed);
    } else {
      localStorage.removeItem('KNAV_CUSTOM_API_URL');
    }
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  };

  const handleTestPrice = async () => {
    const trimmed = apiUrl.trim();
    if (!trimmed) {
      setTestResult({ success: false, message: 'WebアプリURLを入力してください。' });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const url = trimmed.includes('?') 
        ? `${trimmed}&code=${encodeURIComponent(testCode)}`
        : `${trimmed}?code=${encodeURIComponent(testCode)}`;

      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      const data = await res.json();
      const extractedPrice = data?.price || data?.PRICE || (data?.data && (data.data.price || data.data.PRICE));
      if (extractedPrice && extractedPrice !== '?') {
        setTestResult({ 
          success: true, 
          message: `【株価テスト成功】銘柄(${testCode})の株価: ${extractedPrice} 円 を正常に取得できました！` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `GASには接続できましたが、株価が取得できませんでした（受信データ: ${JSON.stringify(data)}）。` 
        });
      }
    } catch (err: any) {
      setTestResult({ 
        success: false, 
        message: `接続エラー: ${err.message || err}` 
      });
    } finally {
      setTesting(false);
    }
  };

  // さきほど全銘柄完走できた「バージョン4」そのままのシンプルなGASコード
  const gasSampleCode = `function doGet(e) {
  var code = (e && e.parameter && e.parameter.code) ? String(e.parameter.code).trim() : "7203";
  var price = null;

  // 1. Yahoo Finance Japan から取得
  try {
    var yUrl = "https://finance.yahoo.co.jp/quote/" + code + ".T";
    var yRes = UrlFetchApp.fetch(yUrl, {
      muteHttpExceptions: true,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
      }
    });
    var yHtml = yRes.getContentText();
    var ym = yHtml.match(/_CommonPriceBoard__price[^"]*"[^>]*>(?:<[^>]+>)*\\s*([0-9,]+(?:\\.[0-9]+)?)/);
    if (ym && ym[1]) {
      price = ym[1];
    }
  } catch (yErr) {}

  // 2. 株探 (Kabutan) からフォールバック取得
  if (!price) {
    try {
      var kUrl = "https://kabutan.jp/stock/?code=" + code;
      var kRes = UrlFetchApp.fetch(kUrl, {
        muteHttpExceptions: true,
        headers: { "User-Agent": "Mozilla/5.0" }
      });
      var kHtml = kRes.getContentText();
      var km = kHtml.match(/([0-9,]+(?:\\.[0-9]+)?)\\s*円/);
      if (km && km[1]) {
        price = km[1];
      }
    } catch (kErr) {}
  }

  var output = ContentService.createTextOutput(JSON.stringify({
    code: code,
    price: price || "?",
    success: !!price
  }));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}`;

  const copyGasScript = () => {
    navigator.clipboard.writeText(gasSampleCode);
    setCopiedGas(true);
    setTimeout(() => setCopiedGas(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-panel-bg border border-border-light max-w-lg w-full flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg/50">
          <div className="flex items-center gap-2 text-text-bright font-bold">
            <Globe size={16} className="text-[#58a6ff]" />
            <span>外部API設定（GitHub Pages・PWA用 株価プロキシ）</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-dim hover:text-text-bright p-1 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1 flex flex-col gap-4 text-xs">
          
          {/* Explanation Banner */}
          <div className="p-3 bg-base-bg border border-border-main text-text-dim leading-relaxed flex flex-col gap-1.5">
            <div className="text-text-bright font-bold flex items-center gap-1.5">
              <HelpCircle size={14} className="text-[#f59e0b]" />
              <span>GitHub Pages用 株価Webアプリ連携</span>
            </div>
            <p>
              GitHub Pages環境で「ALL（一括株価取得）」や個別銘柄の更新を行うための、Google Apps Script (GAS) Webアプリ連携です。
            </p>
          </div>

          {/* API URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-bright font-bold flex items-center justify-between">
              <span>Webアプリ URL (GAS Web App)</span>
              {apiUrl && (
                <button 
                  onClick={() => setApiUrl('')} 
                  className="text-[10px] text-[#ff7b72] hover:underline cursor-pointer"
                >
                  クリア（標準に戻す）
                </button>
              )}
            </label>
            <input 
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="w-full bg-base-bg border border-border-main px-3 py-2 text-text-bright text-xs focus:border-[#58a6ff] outline-none font-mono"
            />
            <span className="text-[11px] text-text-dim">
              ※ 入力後、右下の「設定を保存」を押すと即座に反映されます。
            </span>
          </div>

          {/* Test Section */}
          <div className="p-3 bg-base-bg border border-border-main flex flex-col gap-2">
            <span className="text-text-bright font-bold">株価接続テスト</span>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="コード (例: 7203)"
                className="w-24 bg-panel-bg border border-border-main px-2 py-1.5 text-text-bright text-xs outline-none font-mono"
              />
              <button 
                onClick={handleTestPrice}
                disabled={testing || !apiUrl.trim()}
                className="px-3 py-1.5 bg-[#58a6ff]/20 border border-[#58a6ff]/50 hover:bg-[#58a6ff]/30 text-[#58a6ff] font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors cursor-pointer"
              >
                <TrendingUp size={13} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? '取得中...' : '株価取得テスト実行'}</span>
              </button>
            </div>

            {testResult && (
              <div className={`p-2 border text-xs leading-relaxed ${testResult.success ? 'bg-[#3fb950]/10 border-[#3fb950]/40 text-[#3fb950]' : 'bg-[#ff7b72]/10 border-[#ff7b72]/40 text-[#ff7b72]'}`}>
                {testResult.message}
              </div>
            )}
          </div>

          {/* GAS Template Guide */}
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between text-text-bright font-bold">
              <span>【安定動作・Version 4】Google Apps Script コード</span>
              <button 
                onClick={copyGasScript}
                className="flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline cursor-pointer"
              >
                {copiedGas ? <Check size={12} className="text-[#3fb950]" /> : <Copy size={12} />}
                <span>{copiedGas ? 'コードをコピーしました！' : 'Version 4 コードをコピー'}</span>
              </button>
            </div>
            
            <div className="text-text-dim text-[11px] leading-relaxed flex flex-col gap-1 bg-base-bg p-2.5 border border-border-main">
              <p>
                さきほど全銘柄完走できたシンプルな株価専用コードです。
                GAS側のエディタに貼り付けて「デプロイ」→「デプロイを管理」→「新バージョン」で保存すれば確実に動作します。
              </p>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-main bg-base-bg/50">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 border border-border-main text-text-dim hover:text-text-bright hover:bg-base-bg transition-colors cursor-pointer"
          >
            閉じる
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-black font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {saved ? <Check size={14} /> : null}
            <span>{saved ? '保存完了！' : '設定を保存'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
