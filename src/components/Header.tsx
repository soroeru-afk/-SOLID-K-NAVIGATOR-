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
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  priceFontSize: number;
  onPriceFontSizeChange: (size: number) => void;
  priceColor: string;
  onPriceColorChange: (color: string) => void;
  onToggleCompactMode: () => void;
}

export default function Header({ theme, onThemeChange, fontType, onFontTypeChange, language, onLanguageChange, sidebarPos, onSidebarPosChange, fontSize, onFontSizeChange, priceFontSize, onPriceFontSizeChange, priceColor, onPriceColorChange, onToggleCompactMode }: Props) {
  const t = i18n[language];

  return (
    <header className="flex justify-between items-center w-full shrink-0 border border-border-main bg-panel-bg p-4 relative flex-wrap gap-4">
        <div className="absolute top-0 left-0 bg-base-bg px-2 -mt-[0.6rem] ml-4 text-[10px] text-text-dim font-bold tracking-widest hidden md:block">
            {t.systemControl}
        </div>
        <div className="flex items-center gap-4">
            <span className="text-[10px] text-text-dim hidden md:inline">{t.canvasEnv}</span>
        </div>
        <div className="flex items-center gap-6 text-[10px] ml-auto">
            <div className="flex items-center gap-2">
                <span className="text-text-dim mr-2 hidden md:inline">SIZE:</span>
                <input 
                  type="range" 
                  min="10" 
                  max="20" 
                  step="1"
                  value={fontSize} 
                  onChange={(e) => onFontSizeChange(Number(e.target.value))}
                  className="w-16"
                />
                <span className="text-text-dim w-4 text-right">{fontSize}</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-text-dim mr-2 hidden md:inline">PRICE:</span>
                <button
                    onClick={() => onPriceColorChange(priceColor === 'red' ? 'default' : 'red')}
                    className="w-[120px] px-3 py-1 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors mr-1 text-center"
                >
                    COLOR: {priceColor === 'red' ? 'RED' : 'THEME'}
                </button>
                <input 
                  type="range" 
                  min="10" 
                  max="24" 
                  step="1"
                  value={priceFontSize} 
                  onChange={(e) => onPriceFontSizeChange(Number(e.target.value))}
                  className="w-16"
                />
                <span className="text-text-dim w-4 text-right">{priceFontSize}</span>
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
                    className="w-[180px] px-3 py-1 border border-border-main bg-base-bg text-text-bright hover:bg-border-main/50 transition-colors flex items-center justify-center gap-2 uppercase font-bold"
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
