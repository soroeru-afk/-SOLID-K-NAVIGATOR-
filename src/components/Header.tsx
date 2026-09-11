import { Theme, FontType } from '../App';
import { FolderColor } from '../types';
import { Language, i18n } from '../i18n';
import { PanelLeft, PanelRight, Minimize2, Type, Palette } from 'lucide-react';
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
  priceColor, 
  onPriceColorChange, 
  onToggleCompactMode 
}: Props) {
  const t = i18n[language];

  return (
    <header className="flex justify-between items-center w-full shrink-0 border border-border-main bg-panel-bg px-3 py-1.5 md:py-2 relative overflow-x-auto scrollbar-none gap-2">
        {/* Left Label */}
        <div className="flex items-center gap-2 shrink-0">
            <span className="text-[10px] text-text-dim font-mono tracking-wider font-bold hidden md:inline">{t.canvasEnv}</span>
        </div>

        {/* Right Controls Container - Single Row (No Wrap) */}
        <div className="flex items-center gap-2 sm:gap-3 lg:gap-3.5 text-[10px] ml-auto shrink-0 whitespace-nowrap">
            {/* TEXT & LIST SIZE Slider */}
            <div className="flex items-center gap-1 shrink-0">
                <span className="text-text-dim hidden xl:inline font-mono">TEXT:</span>
                <input 
                  type="range" 
                  min="11" 
                  max="22" 
                  step="1"
                  value={listFontSize} 
                  onChange={(e) => onListFontSizeChange(Number(e.target.value))}
                  className="w-12 sm:w-14 accent-border-light cursor-pointer h-3"
                  title={`Text / Folder / Info Size: ${listFontSize}px`}
                />
                <span className="text-text-dim w-6 text-right font-mono text-[9px]">{listFontSize}PX</span>
            </div>

            {/* STOCK SIZE Slider */}
            <div className="flex items-center gap-1 shrink-0">
                <span className="text-text-bright font-bold hidden xl:inline font-mono">STOCK:</span>
                <input 
                  type="range" 
                  min="12" 
                  max="26" 
                  step="1"
                  value={stockFontSize} 
                  onChange={(e) => onStockFontSizeChange(Number(e.target.value))}
                  className="w-12 sm:w-14 accent-border-light cursor-pointer h-3"
                  title={`Stock Name Size: ${stockFontSize}px`}
                />
                <span className="text-text-bright font-bold w-6 text-right font-mono text-[9px]">{stockFontSize}PX</span>
            </div>

            {/* PRICE Color and Size */}
            <div className="flex items-center gap-1 shrink-0">
                <span className="text-text-dim hidden xl:inline font-mono">PRICE:</span>
                <button
                    type="button"
                    onClick={() => onPriceColorChange(priceColor === 'red' ? 'default' : 'red')}
                    className="h-[22px] px-1.5 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors text-center text-[9px] font-mono shrink-0 rounded-xs"
                    title="株価表示色切替 (THEME / RED)"
                >
                    {priceColor === 'red' ? 'RED' : 'THEME'}
                </button>
                <input 
                  type="range" 
                  min="10" 
                  max="26" 
                  step="1"
                  value={priceFontSize} 
                  onChange={(e) => onPriceFontSizeChange(Number(e.target.value))}
                  className="w-12 sm:w-14 accent-border-light cursor-pointer h-3"
                  title={`Price Font Size: ${priceFontSize}px`}
                />
                <span className="text-text-dim w-6 text-right font-mono text-[9px]">{priceFontSize}PX</span>
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
                    className="w-[68px] h-[22px] px-1.5 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors text-center text-[9px] font-mono flex items-center justify-center gap-1 shrink-0 rounded-xs"
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
                    className="w-[140px] sm:w-[150px] h-[22px] px-2 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors flex items-center justify-center gap-1.5 uppercase text-[9px] font-mono shrink-0 rounded-xs"
                >
                    <Palette size={12} className="text-text-dim shrink-0" />
                    <span className="truncate">
                      THEME: {
                        theme === 'black' ? (t.blackTheme || 'ONYX BLACK') :
                        theme === 'dark' ? t.navyDark :
                        theme === 'red' ? (t.redTheme || 'CRIMSON RED') :
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
