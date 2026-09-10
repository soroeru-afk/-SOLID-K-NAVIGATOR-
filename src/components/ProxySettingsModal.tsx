import React, { useState, useEffect } from 'react';
import { X, Globe, Key, HelpCircle, Check, Copy, ExternalLink, RefreshCw } from 'lucide-react';

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
    }, 800);
  };

  const handleTest = async () => {
    const trimmed = apiUrl.trim();
    if (!trimmed) {
      setTestResult({ success: false, message: 'API URLを入力してください。' });
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
          message: `接続成功！ 銘柄(${testCode})の株価: ${extractedPrice} 円 を正常に取得できました！` 
        });
      } else {
        setTestResult({ 
          success: false, 
          message: `GASには接続できましたが、株価が取得できませんでした（受信データ: ${JSON.stringify(data)}）。下の「最新GASコードをコピー」をGASに貼り付けて「新バージョン」で再デプロイしてください。` 
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

  const gasSampleCode = `function doGet(e) {
  var code = (e && e.parameter && e.parameter.code) ? String(e.parameter.code).trim() : "7203";
  var price = null;

  // 1. Yahoo Finance Japan から取得 (入れ子spanタグ構造に対応)
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
  } catch (yErr) {
    // Yahoo取得失敗時は株探へフォールバック
  }

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
    } catch (kErr) {
      // ignore
    }
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
      <div className="bg-panel-bg border border-border-light max-w-xl w-full flex flex-col max-h-[90vh] shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg/50">
          <div className="flex items-center gap-2 text-text-bright font-bold">
            <Globe size={16} className="text-[#58a6ff]" />
            <span>外部株価API / プロキシ設定（GitHub Pages用）</span>
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
              <span>なぜこの設定が必要なのか？</span>
            </div>
            <p>
              GitHub Pages（<code className="text-[#58a6ff]">soroeru-afk.github.io</code>）は静的サイトのため、Node.jsバックエンドサーバー（<code className="text-[#58a6ff]">/api/fetch-price</code>）が稼働していません。
            </p>
            <p>
              GitHub Pages上のPWAから直接「FETCH ALL PRICES」を実行したい場合は、以下のいずれかの方法を利用できます：
            </p>
            <div className="mt-1 flex flex-col gap-1 pl-2 border-l-2 border-[#58a6ff]/40">
              <div><strong className="text-text-bright">方法A（おすすめ・追加設定不要）：</strong> AI Studioプレビュー側で一括取得したデータを「JSONエクスポート」し、PWA側で「JSONインポート」する。</div>
              <div><strong className="text-text-bright">方法B（直接一括取得）：</strong> 下記の無料Google Apps Script (GAS) またはCloudflare Worker等のURLを設定する。</div>
            </div>
          </div>

          {/* API URL Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-text-bright font-bold flex items-center justify-between">
              <span>カスタムAPI URL (GAS Web App / Cloudflare Worker)</span>
              {apiUrl && (
                <button 
                  onClick={() => setApiUrl('')} 
                  className="text-[10px] text-[#ff7b72] hover:underline"
                >
                  クリア（標準/apiに戻す）
                </button>
              )}
            </label>
            <input 
              type="url"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              placeholder="例: https://script.google.com/macros/s/.../exec"
              className="w-full bg-base-bg border border-border-main px-3 py-2 text-text-bright text-xs focus:border-[#58a6ff] outline-none font-mono"
            />
            <span className="text-[11px] text-text-dim">
              ※ 未入力の場合は、標準のローカルAPI（<code className="text-[#58a6ff]">/api/fetch-price?code=...</code>）が使用されます。
            </span>
          </div>

          {/* Test Section */}
          <div className="p-3 bg-base-bg border border-border-main flex flex-col gap-2">
            <span className="text-text-bright font-bold">API接続テスト</span>
            <div className="flex items-center gap-2">
              <input 
                type="text"
                value={testCode}
                onChange={(e) => setTestCode(e.target.value)}
                placeholder="銘柄コード (例: 7203)"
                className="w-28 bg-panel-bg border border-border-main px-2.5 py-1.5 text-text-bright text-xs outline-none font-mono"
              />
              <button 
                onClick={handleTest}
                disabled={testing || !apiUrl.trim()}
                className="px-3 py-1.5 bg-[#58a6ff]/20 border border-[#58a6ff]/50 hover:bg-[#58a6ff]/30 text-[#58a6ff] font-bold flex items-center gap-1.5 disabled:opacity-40 transition-colors"
              >
                <RefreshCw size={12} className={testing ? 'animate-spin' : ''} />
                <span>{testing ? 'テスト中...' : '接続テスト'}</span>
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
              <span>【重要】Google Apps Script (GAS) コードとデプロイ手順</span>
              <button 
                onClick={copyGasScript}
                className="flex items-center gap-1 text-[11px] text-[#58a6ff] hover:underline cursor-pointer"
              >
                {copiedGas ? <Check size={12} className="text-[#3fb950]" /> : <Copy size={12} />}
                <span>{copiedGas ? 'コードをコピーしました！' : '最新GASコードをコピー'}</span>
              </button>
            </div>
            
            <div className="text-text-dim text-[11px] leading-relaxed flex flex-col gap-2 bg-base-bg p-2.5 border border-border-main">
              <div>
                <strong className="text-text-bright">すでにGASを作成済みで修正する場合の最重要ポイント：</strong>
                <p className="mt-0.5 text-[#f59e0b]">
                  GASはエディタを書き換えて保存しただけではWebアプリURLに反映されません！必ず以下の手順で「新バージョン」をデプロイしてください：
                </p>
                <ol className="list-decimal list-inside pl-1 mt-1 flex flex-col gap-0.5">
                  <li>上の「最新GASコードをコピー」を押し、GASエディタの内容を全て上書きして保存</li>
                  <li>画面右上の「デプロイ」ボタン → <strong>「デプロイを管理」</strong>をクリック</li>
                  <li>左側で現在のウェブアプリを選択し、右上の<strong>「鉛筆アイコン（編集）」</strong>をクリック</li>
                  <li>「バージョン」のプルダウンを<strong>「新バージョン」</strong>に変更</li>
                  <li>右下の<strong>「デプロイ」</strong>ボタンを押す（※URLは同じまま更新されます！）</li>
                  <li>この画面に戻り、上の「接続テスト」を押して株価が表示されるか確認</li>
                </ol>
              </div>

              <div className="pt-2 border-t border-border-main/50">
                <strong className="text-text-bright">新規作成の場合：</strong>
                <ol className="list-decimal list-inside pl-1 mt-0.5 flex flex-col gap-0.5">
                  <li>Google ドライブで「新規」→「その他」→「Google Apps Script」を作成</li>
                  <li>コードを貼り付けて保存 → 右上「デプロイ」→「新しいデプロイ」</li>
                  <li>種類「ウェブアプリ」、アクセス「全員」にしてデプロイ</li>
                  <li>発行されたURLを上の入力欄に貼り付け</li>
                </ol>
              </div>
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-border-main bg-base-bg/50">
          <button 
            onClick={onClose}
            className="px-3 py-1.5 border border-border-main text-text-dim hover:text-text-bright hover:bg-base-bg transition-colors"
          >
            キャンセル
          </button>
          <button 
            onClick={handleSave}
            className="px-4 py-1.5 bg-[#58a6ff] hover:bg-[#58a6ff]/90 text-black font-bold flex items-center gap-1.5 transition-colors"
          >
            {saved ? <Check size={14} /> : null}
            <span>{saved ? '保存完了！' : '設定を保存'}</span>
          </button>
        </div>

      </div>
    </div>
  );
}
