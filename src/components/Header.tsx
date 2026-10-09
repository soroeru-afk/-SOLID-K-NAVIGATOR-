import { useState, useRef, useEffect } from 'react';
import { Theme, FontType } from '../App';
import { FolderColor } from '../types';
import { Language, i18n } from '../i18n';
import { PanelLeft, PanelRight, Minimize2, Palette, SlidersHorizontal, ChevronDown, X } from 'lucide-react';
import { getFolderColorBadgeClass } from '../lib/folderUtils';

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  fontType: FontType;
  onFontTypeChange: (fontType: FontType) => void;
  folderColor: FolderColor;
  onFolderColorChange: (color: FolderColor) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  sidebarPos: 'left' | 'right';
  onSidebarPosChange: (pos: 'left' | 'right') => void;
  listFontSize: number;
  onListFontSizeChange: (size: number) => void;
  stockFontSize: number;
  onStockFontSizeChange: (size: number) => void;
  priceFontSize: number;
  onPriceFontSizeChange: (size: number) => void;
  limitFontSize: number;
  onLimitFontSizeChange: (size: number) => void;
  memoFontSize: number;
  onMemoFontSizeChange: (size: number) => void;
  priceColor: string;
  onPriceColorChange: (color: string) => void;
  onToggleCompactMode: () => void;
}

export default function Header({ 
  theme, 
  onThemeChange, 
  fontType, 
  onFontTypeChange, 
  folderColor,
  onFolderColorChange,
  language, 
  onLanguageChange, 
  sidebarPos, 
  onSidebarPosChange, 
  listFontSize, 
  onListFontSizeChange, 
  stockFontSize,
  onStockFontSizeChange,
  priceFontSize, 
  onPriceFontSizeChange,
  limitFontSize,
  onLimitFontSizeChange,
  memoFontSize,
  onMemoFontSizeChange,
  priceColor, 
  onPriceColorChange, 
  onToggleCompactMode 
}: Props) {
  const t = i18n[language];
  const [isSizePanelOpen, setIsSizePanelOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close panel on outside click or ESC key
  useEffect(() => {
    if (!isSizePanelOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        panelRef.current && 
        !panelRef.current.contains(e.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(e.target as Node)
      ) {
        setIsSizePanelOpen(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSizePanelOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSizePanelOpen]);

  return (
    <header className="flex justify-between items-center w-full shrink-0 border border-border-main bg-base-bg px-2.5 sm:px-3 py-1.5 md:py-2 relative gap-2">
        {/* Left Label */}
        <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-text-dim font-mono tracking-wider font-bold hidden md:inline">{t.canvasEnv}</span>
        </div>

        {/* Right Controls Container */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 lg:gap-3 text-[10px] ml-auto shrink-0 whitespace-nowrap">
            {/* PULLDOWN PANEL FOR SLIDERS / INDICATORS */}
            <div className="relative shrink-0">
                <button
                    ref={buttonRef}
                    type="button"
                    onClick={() => setIsSizePanelOpen(prev => !prev)}
                    className={`h-[22px] px-2 border flex items-center justify-center gap-1.5 font-mono text-[9px] rounded-xs transition-colors shrink-0 ${
                      isSizePanelOpen 
                        ? 'border-border-light bg-border-main text-text-bright' 
                        : 'border-border-main bg-base-bg text-text-bright hover:bg-border-main/50'
                    }`}
                    title="各スライダー・インジケーター設定パネル (TEXT / STOCK / PRICE / LIMIT / DETAIL)"
                >
                    <SlidersHorizontal size={11} className={isSizePanelOpen ? 'text-text-bright' : 'text-text-dim'} />
                    <span>SIZE / SLIDERS</span>
                    <ChevronDown size={10} className={`text-text-dim transition-transform duration-150 ${isSizePanelOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Pulldown Panel (Vertical layout) */}
                {isSizePanelOpen && (
                    <div 
                      ref={panelRef}
                      className="absolute right-0 top-full mt-1.5 z-50 w-[280px] sm:w-[310px] p-3 bg-panel-bg border border-border-main shadow-2xl rounded-xs flex flex-col gap-3 font-mono text-[10px]"
                      style={{ backdropFilter: 'blur(4px)' }}
                    >
                        {/* Panel Header */}
                        <div className="flex items-center justify-between pb-1.5 border-b border-border-main text-text-dim text-[9px] font-bold tracking-wider">
                            <div className="flex items-center gap-1.5">
                                <SlidersHorizontal size={11} className="text-text-bright" />
                                <span>SIZE & INDICATOR CONTROLS</span>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setIsSizePanelOpen(false)}
                                className="p-0.5 hover:text-text-bright text-text-dim rounded-xs hover:bg-border-main/50 transition-colors"
                                title="Close"
                            >
                                <X size={12} />
                            </button>
                        </div>

                        {/* 1. TEXT (List / Info Size) */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-text-dim">
                                <span className="font-bold">TEXT (LIST / INFO):</span>
                                <span className="text-text-bright font-mono font-bold">{listFontSize}PX</span>
                            </div>
                            <input 
                              type="range" 
                              min="11" 
                              max="22" 
                              step="1"
                              value={listFontSize} 
                              onChange={(e) => onListFontSizeChange(Number(e.target.value))}
                              className="w-full accent-border-light cursor-pointer h-3"
                              title={`Text / Folder / Info Size: ${listFontSize}px`}
                            />
                        </div>

                        {/* 2. STOCK (Stock Name Size) */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-text-dim">
                                <span className="font-bold text-text-bright">STOCK (NAME):</span>
                                <span className="text-text-bright font-mono font-bold">{stockFontSize}PX</span>
                            </div>
                            <input 
                              type="range" 
                              min="12" 
                              max="26" 
                              step="1"
                              value={stockFontSize} 
                              onChange={(e) => onStockFontSizeChange(Number(e.target.value))}
                              className="w-full accent-border-light cursor-pointer h-3"
                              title={`Stock Name Size: ${stockFontSize}px`}
                            />
                        </div>

                        {/* 3. PRICE (Stock Price Size & Color) */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-text-dim">
                                <div className="flex items-center gap-1.5">
                                    <span className="font-bold">PRICE (株価):</span>
                                    <button
                                        type="button"
                                        onClick={() => onPriceColorChange(priceColor === 'red' ? 'default' : 'red')}
                                        className="px-1.5 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 text-[9px] font-mono rounded-xs"
                                        title="株価表示色切替 (THEME / RED)"
                                    >
                                        {priceColor === 'red' ? 'RED' : 'THEME'}
                                    </button>
                                </div>
                                <span className="text-text-bright font-mono font-bold">{priceFontSize}PX</span>
                            </div>
                            <input 
                              type="range" 
                              min="10" 
                              max="26" 
                              step="1"
                              value={priceFontSize} 
                              onChange={(e) => onPriceFontSizeChange(Number(e.target.value))}
                              className="w-full accent-border-light cursor-pointer h-3"
                              title={`Price Font Size: ${priceFontSize}px`}
                            />
                        </div>

                        {/* 4. LIMIT (東証制限値幅・ストップ高安 Size) */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-text-dim">
                                <span className="font-bold text-text-bright">LIMIT (値幅制限):</span>
                                <span className="text-text-bright font-mono font-bold">{limitFontSize}PX</span>
                            </div>
                            <input 
                              type="range" 
                              min="9" 
                              max="24" 
                              step="1"
                              value={limitFontSize} 
                              onChange={(e) => onLimitFontSizeChange(Number(e.target.value))}
                              className="w-full accent-border-light cursor-pointer h-3"
                              title={`東証公定制限値幅フォントサイズ: ${limitFontSize}px`}
                            />
                        </div>

                        {/* 5. DETAIL (Memo, Overview & Popup Size) */}
                        <div className="flex flex-col gap-1">
                            <div className="flex justify-between items-center text-text-dim">
                                <span className="font-bold text-text-bright">DETAIL / POPUP (詳細・ポップアップ):</span>
                                <span className="text-text-bright font-mono font-bold">{memoFontSize}PX</span>
                            </div>
                            <input 
                              type="range" 
                              min="11" 
                              max="26" 
                              step="1"
                              value={memoFontSize} 
                              onChange={(e) => onMemoFontSizeChange(Number(e.target.value))}
                              className="w-full accent-border-light cursor-pointer h-3"
                              title={`詳細・メモ・ポップアップ文字サイズ: ${memoFontSize}px`}
                            />
                        </div>

                        {/* Reset / Guidance Footer */}
                        <div className="pt-1.5 border-t border-border-main/60 flex items-center justify-between text-[9px] text-text-dim/80">
                            <span>* リアルタイム反映 (自動保存)</span>
                            <button
                                type="button"
                                onClick={() => {
                                  onListFontSizeChange(13);
                                  onStockFontSizeChange(16);
                                  onPriceFontSizeChange(16);
                                  onLimitFontSizeChange(11);
                                  onMemoFontSizeChange(14);
                                }}
                                className="hover:text-text-bright underline hover:no-underline font-mono"
                                title="デフォルト値にリセット"
                            >
                                RESET
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* FOLDER COLOR Selector */}
            <div className="flex items-center gap-1 shrink-0">
                <span className="text-text-dim hidden xl:inline font-mono">FOLDER:</span>
                <button
                    type="button"
                    onClick={() => {
                      const colorOrder: FolderColor[] = ['theme', 'amber', 'blue', 'white', 'black', 'gray'];
                      const currentIndex = colorOrder.indexOf(folderColor);
                      const next = colorOrder[(currentIndex + 1) % colorOrder.length];
                      onFolderColorChange(next);
                    }}
                    className="w-[64px] h-[22px] px-1.5 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors text-center text-[9px] font-mono flex items-center justify-center gap-1 shrink-0 rounded-xs"
                    title="フォルダーアイコン色：THEME(同系色) / AMBER(琥珀) / BLUE(青) / WHITE(白) / BLACK(黒) / GRAY(灰)"
                >
                    <span className={`w-2 h-2 rounded-xs shrink-0 ${getFolderColorBadgeClass(folderColor)}`} />
                    <span className="w-[34px] text-left truncate">{folderColor === 'theme' ? 'THEME' : folderColor.toUpperCase()}</span>
                </button>
            </div>

            {/* FONT SELECTOR */}
            <div className="flex items-center gap-1 shrink-0">
                <span className="text-text-dim hidden xl:inline font-mono">FONT:</span>
                <select
                  value={fontType}
                  onChange={(e) => onFontTypeChange(e.target.value as FontType)}
                  className="h-[22px] bg-base-bg border border-border-main text-text-bright px-1.5 py-0.5 outline-none focus:border-border-light cursor-pointer text-[10px] rounded-xs font-mono"
                >
                  <option value="gothic">GOTHIC</option>
                  <option value="maru">MARU</option>
                  <option value="meiryo">MEIRYO</option>
                  <option value="mono">MONO</option>
                </select>
            </div>

            {/* THEME BUTTON */}
            <div className="flex items-center shrink-0">
                <button
                    type="button"
                    onClick={() => {
                      const next = theme === 'black' ? 'dark' : theme === 'dark' ? 'red' : theme === 'red' ? 'light' : 'black';
                      onThemeChange(next);
                    }}
                    className="w-[125px] sm:w-[135px] h-[22px] px-1.5 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors flex items-center justify-center gap-1 uppercase text-[9px] font-mono shrink-0 rounded-xs"
                >
                    <Palette size={11} className="text-text-dim shrink-0" />
                    <span className="truncate">
                      THEME: {
                        theme === 'black' ? (t.blackTheme || 'ONYX') :
                        theme === 'dark' ? t.navyDark :
                        theme === 'red' ? (t.redTheme || 'CRIMSON') :
                        t.paperLight
                      }
                    </span>
                </button>
            </div>
            
            {/* Action Toggles: EN/JP, Sidebar, Compact */}
            <div className="flex items-center gap-1.5 border-l border-border-main pl-2 sm:pl-2.5 shrink-0">
                <div className="flex border border-border-main rounded-xs text-[9px] font-mono overflow-hidden leading-none shrink-0 bg-base-bg h-[22px]">
                  <button
                    type="button"
                    onClick={() => onLanguageChange('EN')}
                    className={`px-1.5 sm:px-2 py-1 transition-colors font-bold ${language === 'EN' ? 'bg-border-light text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
                  >
                    EN
                  </button>
                  <button
                    type="button"
                    onClick={() => onLanguageChange('JP')}
                    className={`px-1.5 sm:px-2 py-1 transition-colors font-bold ${language === 'JP' ? 'bg-border-light text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
                  >
                    JP
                  </button>
                </div>

                <button
                    type="button"
                    onClick={() => onSidebarPosChange(sidebarPos === 'left' ? 'right' : 'left')}
                    className="w-[22px] h-[22px] flex items-center justify-center border border-border-main rounded-xs text-text-dim hover:text-text-normal hover:bg-border-main/50 transition-colors shrink-0"
                    title="サイドバー位置切替"
                >
                    {sidebarPos === 'left' ? <PanelLeft size={13} /> : <PanelRight size={13} />}
                </button>
                <button
                    type="button"
                    onClick={onToggleCompactMode}
                    title="Compact Mode"
                    className="w-[22px] h-[22px] flex items-center justify-center border border-border-main rounded-xs text-text-dim hover:text-text-bright hover:bg-border-main/50 transition-colors shrink-0"
                >
                    <Minimize2 size={13} />
                </button>
            </div>
        </div>
    </header>
  );
}
