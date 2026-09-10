import { Theme, FontType } from '../App';
import { Language, i18n } from '../i18n';
import { PanelLeft, PanelRight, Minimize2, Type, Palette } from 'lucide-react';

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  fontType: FontType;
  onFontTypeChange: (fontType: FontType) => void;
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
    <header className="flex justify-between items-center w-full shrink-0 border border-border-main bg-panel-bg px-3 py-2.5 md:p-3 relative flex-wrap gap-2 md:gap-4">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold tracking-widest hidden md:block">
            {t.systemControl}
        </div>
        <div className="flex items-center gap-3">
            <span className="text-[10px] text-text-dim hidden md:inline">{t.canvasEnv}</span>
        </div>
        <div className="flex items-center gap-4 md:gap-6 text-[10px] ml-auto flex-wrap">
            {/* TEXT & LIST SIZE Slider */}
            <div className="flex items-center gap-1.5">
                <span className="text-text-dim hidden md:inline font-mono">TEXT SIZE:</span>
                <input 
                  type="range" 
                  min="11" 
                  max="22" 
                  step="1"
                  value={listFontSize} 
                  onChange={(e) => onListFontSizeChange(Number(e.target.value))}
                  className="w-14 md:w-16 accent-border-light cursor-pointer"
                  title={`Text / Folder / Info Size: ${listFontSize}px`}
                />
                <span className="text-text-dim w-7 text-right font-mono">{listFontSize}PX</span>
            </div>

            {/* STOCK SIZE Slider */}
            <div className="flex items-center gap-1.5">
                <span className="text-text-bright font-bold hidden md:inline font-mono">STOCK SIZE:</span>
                <input 
                  type="range" 
                  min="12" 
                  max="26" 
                  step="1"
                  value={stockFontSize} 
                  onChange={(e) => onStockFontSizeChange(Number(e.target.value))}
                  className="w-14 md:w-16 accent-border-light cursor-pointer"
                  title={`Stock Name Size: ${stockFontSize}px`}
                />
                <span className="text-text-bright font-bold w-7 text-right font-mono">{stockFontSize}PX</span>
            </div>

            {/* PRICE Color and Size */}
            <div className="flex items-center gap-1.5">
                <span className="text-text-dim hidden md:inline font-mono">PRICE:</span>
                <button
                    onClick={() => onPriceColorChange(priceColor === 'red' ? 'default' : 'red')}
                    className="px-2 py-0.5 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors text-center text-[9px] font-mono"
                >
                    COLOR: {priceColor === 'red' ? 'RED' : 'THEME'}
                </button>
                <input 
                  type="range" 
                  min="10" 
                  max="26" 
                  step="1"
                  value={priceFontSize} 
                  onChange={(e) => onPriceFontSizeChange(Number(e.target.value))}
                  className="w-14 md:w-16 accent-border-light cursor-pointer"
                  title={`Price Font Size: ${priceFontSize}px`}
                />
                <span className="text-text-dim w-7 text-right font-mono">{priceFontSize}PX</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-text-dim mr-2 hidden md:inline">FONT:</span>
                <select
                  value={fontType}
                  onChange={(e) => onFontTypeChange(e.target.value as FontType)}
                  className="bg-base-bg border border-border-main text-text-bright px-2 py-1 outline-none focus:border-border-light cursor-pointer"
                >
                  <option value="gothic">GOTHIC</option>
                  <option value="maru">MARU GOTHIC</option>
                  <option value="meiryo">MEIRYO</option>
                  <option value="mono">MONO</option>
                </select>
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={() => {
                      const next = theme === 'black' ? 'dark' : theme === 'dark' ? 'light' : 'black';
                      onThemeChange(next);
                    }}
                    className="w-[180px] px-3 py-1 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors flex items-center justify-center gap-2 uppercase"
                >
                    <Palette size={14} className="text-text-dim shrink-0" />
                    <span className="truncate">THEME: {theme === 'black' ? ((t as any).blackTheme || 'ONYX BLACK') : theme === 'dark' ? t.navyDark : t.paperLight}</span>
                </button>
            </div>
            
            <div className="flex items-center gap-4 border-l border-border-main pl-6">
                <div className="flex border border-border-main rounded text-[10px] overflow-hidden leading-none shrink-0 bg-base-bg">
                  <button
                    onClick={() => onLanguageChange('EN')}
                    className={`px-3 py-1.5 transition-colors font-bold ${language === 'EN' ? 'bg-border-light text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
                  >
                    EN
                  </button>
                  <button
                    onClick={() => onLanguageChange('JP')}
                    className={`px-3 py-1.5 transition-colors font-bold ${language === 'JP' ? 'bg-border-light text-text-bright' : 'text-text-dim hover:text-text-normal'}`}
                  >
                    JP
                  </button>
                </div>

                <button
                    onClick={() => onSidebarPosChange(sidebarPos === 'left' ? 'right' : 'left')}
                    className="p-1.5 border border-border-main rounded text-text-dim hover:text-text-normal hover:bg-border-main/50 transition-colors"
                >
                    {sidebarPos === 'left' ? <PanelLeft size={16} /> : <PanelRight size={16} />}
                </button>
                <button
                    onClick={onToggleCompactMode}
                    title="Compact Mode"
                    className="p-1.5 border border-border-main rounded text-text-dim hover:text-[#58a6ff] hover:bg-border-main/50 transition-colors ml-2"
                >
                    <Minimize2 size={16} />
                </button>
            </div>
        </div>
    </header>
  );
}
