import React, { useState, useEffect } from 'react';
import { MarketLink } from '../types';
import { 
  X, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  ChevronsUp, 
  ChevronsDown, 
  ExternalLink,
  Link2,
  AlertCircle
} from 'lucide-react';
import { Language, i18n } from '../i18n';

interface MarketLinkEditorProps {
  initialLinks: MarketLink[];
  onSave: (links: MarketLink[]) => void;
  onClose: () => void;
  language?: Language;
}

export function MarketLinkEditor({
  initialLinks,
  onSave,
  onClose,
  language = 'JP'
}: MarketLinkEditorProps) {
  const t = i18n[language];
  const [links, setLinks] = useState<MarketLink[]>(initialLinks);

  // 新規追加モーダル状態
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [insertPosition, setInsertPosition] = useState<'top' | 'bottom'>('top');
  const [addError, setAddError] = useState('');

  // 親からinitialLinksが渡された場合に追従
  useEffect(() => {
    setLinks(initialLinks);
  }, [initialLinks]);

  // 1つ上へ移動
  const handleMoveUp = (index: number) => {
    if (index === 0) return;
    const next = [...links];
    const item = next[index];
    next[index] = next[index - 1];
    next[index - 1] = item;
    setLinks(next);
  };

  // 1つ下へ移動
  const handleMoveDown = (index: number) => {
    if (index === links.length - 1) return;
    const next = [...links];
    const item = next[index];
    next[index] = next[index + 1];
    next[index + 1] = item;
    setLinks(next);
  };

  // 一番上（先頭）へ移動
  const handleMoveToTop = (index: number) => {
    if (index === 0) return;
    const next = [...links];
    const [item] = next.splice(index, 1);
    next.unshift(item);
    setLinks(next);
  };

  // 一番下（末尾）へ移動
  const handleMoveToBottom = (index: number) => {
    if (index === links.length - 1) return;
    const next = [...links];
    const [item] = next.splice(index, 1);
    next.push(item);
    setLinks(next);
  };

  // 削除
  const handleDelete = (id: string) => {
    setLinks(links.filter(l => l.id !== id));
  };

  // タイトルまたはURLの直接変更
  const handleUpdate = (id: string, field: 'title' | 'url', val: string) => {
    setLinks(links.map(l => l.id === id ? { ...l, [field]: val } : l));
  };

  // 新規追加モーダルを開く
  const handleOpenAddModal = () => {
    setNewTitle('');
    setNewUrl('');
    setInsertPosition('top');
    setAddError('');
    setIsAddModalOpen(true);
  };

  // 新規追加確定
  const handleConfirmAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      setAddError('リンクのタイトルを入力してください');
      return;
    }
    if (!newUrl.trim()) {
      setAddError('URLを入力してください');
      return;
    }

    let formattedUrl = newUrl.trim();
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }

    const newLink: MarketLink = {
      id: `m_${Date.now()}`,
      title: newTitle.trim(),
      url: formattedUrl
    };

    if (insertPosition === 'top') {
      setLinks([newLink, ...links]);
    } else {
      setLinks([...links, newLink]);
    }

    setIsAddModalOpen(false);
  };

  const handleSave = () => {
    onSave(links);
  };

  return (
    <div className="fixed inset-0 bg-base-bg/85 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="bg-panel-bg border border-border-main p-4 sm:p-6 shadow-2xl w-full max-w-4xl flex flex-col max-h-[92vh] rounded-xs">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border-main pb-3 mb-3 shrink-0">
          <div className="font-bold tracking-wider flex items-center gap-2 text-text-bright text-sm md:text-base">
            <Link2 size={16} className="text-text-bright" />
            <span>[ {t.marketLinksManage || '市場データ・リンク管理'} ]</span>
            <span className="text-xs text-text-dim font-normal ml-2">
              (登録件数: {links.length}件)
            </span>
          </div>
          <button 
            onClick={onClose} 
            className="text-text-dim hover:text-text-bright transition-colors p-1"
            title="閉じる"
          >
            <X size={20} />
          </button>
        </div>

        {/* Subheader / 説明 */}
        <div className="text-[11px] text-text-dim mb-3 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            各項目の右側（後ろ）にある矢印ボタン（<ChevronsUp size={11} className="inline text-text-bright" /> 一番上 / <ArrowUp size={11} className="inline" /> 1つ上 / <ArrowDown size={11} className="inline" /> 1つ下 / <ChevronsDown size={11} className="inline text-text-bright" /> 一番下）で並び替えできます。
          </div>
          <button
            onClick={handleOpenAddModal}
            className="self-start sm:self-auto flex items-center gap-1.5 border border-border-main hover:border-border-light bg-base-bg hover:bg-hover-bg text-text-bright px-3 py-1.5 text-xs font-bold rounded-xs transition-colors shrink-0"
          >
            <Plus size={14} />
            <span>新規リンクを登録</span>
          </button>
        </div>

        {/* Links List */}
        <div className="overflow-y-auto overflow-x-hidden flex-1 pr-1 mb-3 space-y-2 scrollbar-thin">
          {links.length === 0 ? (
            <div className="text-center text-text-dim py-12 border border-dashed border-border-main">
              登録されているリンクはありません。「新規リンクを登録」ボタンから追加してください。
            </div>
          ) : (
            links.map((link, index) => {
              const isFirst = index === 0;
              const isLast = index === links.length - 1;

              return (
                <div 
                  key={link.id} 
                  className="flex items-center gap-2 bg-base-bg p-2 sm:p-2.5 border border-border-main hover:border-border-light transition-colors group"
                >
                  {/* 1. Index badge (前) */}
                  <div className="w-7 text-center font-mono text-xs font-bold text-text-dim shrink-0">
                    #{String(index + 1).padStart(2, '0')}
                  </div>
                  
                  {/* 2. Title & URL inputs (中央) */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-text-dim text-[11px] font-bold w-12 shrink-0">タイトル:</span>
                      <input 
                        type="text" 
                        value={link.title}
                        onChange={(e) => handleUpdate(link.id, 'title', e.target.value)}
                        className="flex-1 bg-panel-bg border border-border-main px-2 py-1 text-xs sm:text-sm focus:outline-none focus:border-border-light text-text-bright font-medium"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-text-dim text-[11px] font-bold w-12 shrink-0">URL:</span>
                      <input 
                        type="text" 
                        value={link.url}
                        onChange={(e) => handleUpdate(link.id, 'url', e.target.value)}
                        className="flex-1 bg-panel-bg border border-border-main px-2 py-1 text-xs font-mono focus:outline-none focus:border-border-light text-text-normal"
                      />
                    </div>
                  </div>

                  {/* 3. Actions: 並び替え上下ボタン + テスト表示 + 削除 (後ろ側) */}
                  <div className="shrink-0 flex items-center gap-1.5 pl-2 border-l border-border-main">
                    {/* 上下移動ボタン群 (後ろ側) */}
                    <div className="flex items-center gap-0.5 bg-panel-bg p-0.5 border border-border-main">
                      {/* 一番上へ */}
                      <button 
                        onClick={() => handleMoveToTop(index)}
                        disabled={isFirst}
                        title="一番上へ移動"
                        className="p-1 text-text-dim hover:text-text-bright hover:bg-base-bg disabled:opacity-20 disabled:hover:text-text-dim disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsUp size={13} />
                      </button>
                      {/* 1つ上へ */}
                      <button 
                        onClick={() => handleMoveUp(index)}
                        disabled={isFirst}
                        title="1つ上へ移動"
                        className="p-1 text-text-dim hover:text-text-bright hover:bg-base-bg disabled:opacity-20 disabled:hover:text-text-dim disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowUp size={13} />
                      </button>
                      {/* 1つ下へ */}
                      <button 
                        onClick={() => handleMoveDown(index)}
                        disabled={isLast}
                        title="1つ下へ移動"
                        className="p-1 text-text-dim hover:text-text-bright hover:bg-base-bg disabled:opacity-20 disabled:hover:text-text-dim disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <ArrowDown size={13} />
                      </button>
                      {/* 一番下へ */}
                      <button 
                        onClick={() => handleMoveToBottom(index)}
                        disabled={isLast}
                        title="一番下へ移動"
                        className="p-1 text-text-dim hover:text-text-bright hover:bg-base-bg disabled:opacity-20 disabled:hover:text-text-dim disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronsDown size={13} />
                      </button>
                    </div>

                    {/* 外部リンク確認 */}
                    <a
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      title="このリンクをテスト表示（別ウィンドウ）"
                      className="p-1.5 text-text-dim hover:text-text-bright hover:bg-panel-bg transition-colors"
                    >
                      <ExternalLink size={14} />
                    </a>

                    {/* 削除 */}
                    <button 
                      onClick={() => handleDelete(link.id)}
                      className="p-1.5 text-text-dim hover:text-text-bright hover:bg-panel-bg transition-colors"
                      title="このリンクを削除"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 pt-3 border-t border-border-main flex items-center justify-between">
          <button 
            onClick={handleOpenAddModal}
            className="flex items-center gap-1.5 border border-border-main hover:border-border-light bg-base-bg hover:bg-hover-bg px-3.5 py-1.5 text-xs text-text-bright font-bold transition-colors rounded-xs"
          >
            <Plus size={14} />
            <span>新規リンク登録</span>
          </button>

          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              className="px-4 py-1.5 border border-border-main text-text-dim hover:text-text-normal transition-colors text-xs font-bold rounded-xs"
            >
              {t.close || 'キャンセル'}
            </button>
            <button 
              onClick={handleSave}
              className="px-5 py-1.5 border border-border-light bg-text-bright text-base-bg hover:bg-text-normal transition-colors text-xs font-bold tracking-wider rounded-xs"
            >
              {t.save || '変更を保存'}
            </button>
          </div>
        </div>

      </div>

      {/* ============================================================== */}
      {/* 新規リンク登録 ポップアップ / モーダル ダイアログ                  */}
      {/* ============================================================== */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-base-bg/85 backdrop-blur-xs z-60 flex items-center justify-center p-4">
          <div className="bg-panel-bg border border-border-main shadow-2xl w-full max-w-lg rounded-xs overflow-hidden flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border-main bg-base-bg">
              <div className="flex items-center gap-2 font-bold text-text-bright text-sm">
                <Plus size={16} className="text-text-bright" />
                <span>新規マーケットリンクの登録</span>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="text-text-dim hover:text-text-bright transition-colors p-0.5"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form onSubmit={handleConfirmAdd} className="p-4 sm:p-5 flex flex-col gap-4 text-xs">
              {addError && (
                <div className="p-2.5 bg-base-bg border border-border-light rounded-xs text-text-bright flex items-center gap-2 text-xs font-bold">
                  <AlertCircle size={14} className="shrink-0 text-text-dim" />
                  <span>{addError}</span>
                </div>
              )}

              {/* Title input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-bright font-bold">
                  リンクタイトル
                </label>
                <input 
                  type="text"
                  value={newTitle}
                  onChange={e => { setNewTitle(e.target.value); setAddError(''); }}
                  placeholder="例: 市場ニュース（総合）, 決算速報 など"
                  autoFocus
                  className="w-full h-8 px-2.5 bg-base-bg border border-border-main focus:border-border-light text-text-bright text-xs outline-none rounded-xs font-medium"
                />
              </div>

              {/* URL input */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-bright font-bold">
                  URL
                </label>
                <input 
                  type="text"
                  value={newUrl}
                  onChange={e => { setNewUrl(e.target.value); setAddError(''); }}
                  placeholder="https://kabutan.jp/..."
                  className="w-full h-8 px-2.5 bg-base-bg border border-border-main focus:border-border-light text-text-bright text-xs font-mono outline-none rounded-xs"
                />
              </div>

              {/* Position selector (一番上 / 一番下) */}
              <div className="flex flex-col gap-1.5">
                <label className="text-text-dim font-bold">
                  追加する位置:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setInsertPosition('top')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xs font-bold text-xs transition-colors ${
                      insertPosition === 'top'
                        ? 'border-border-light bg-border-main text-text-bright'
                        : 'border-border-main bg-base-bg text-text-dim hover:text-text-bright hover:border-border-light'
                    }`}
                  >
                    <ChevronsUp size={14} />
                    <span>一番上（先頭）に追加</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setInsertPosition('bottom')}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 border rounded-xs font-bold text-xs transition-colors ${
                      insertPosition === 'bottom'
                        ? 'border-border-light bg-border-main text-text-bright'
                        : 'border-border-main bg-base-bg text-text-dim hover:text-text-bright hover:border-border-light'
                    }`}
                  >
                    <ChevronsDown size={14} />
                    <span>一番下（末尾）に追加</span>
                  </button>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border-main mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-1.5 border border-border-main bg-base-bg hover:bg-hover-bg text-text-dim hover:text-text-bright text-xs font-bold rounded-xs transition-colors"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-5 py-1.5 border border-border-light bg-text-bright text-base-bg hover:bg-text-normal text-xs font-bold rounded-xs transition-colors"
                >
                  登録してリストに追加
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default MarketLinkEditor;
