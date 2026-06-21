import { Theme } from '../App';
import { Language, i18n } from '../i18n';
import { PanelLeft, PanelRight, Minimize2 } from 'lucide-react';

interface Props {
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  sidebarPos: 'left' | 'right';
  onSidebarPosChange: (pos: 'left' | 'right') => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  onToggleCompactMode: () => void;
}

export default function Header({ theme, onThemeChange, language, onLanguageChange, sidebarPos, onSidebarPosChange, fontSize, onFontSizeChange, onToggleCompactMode }: Props) {
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
                <span className="text-text-dim mr-2 hidden md:inline">FONT:</span>
                <input 
                  type="range" 
                  min="10" 
                  max="16" 
                  step="1"
                  value={fontSize} 
                  onChange={(e) => onFontSizeChange(Number(e.target.value))}
                  className="w-24"
                />
                <span className="text-text-dim w-4 text-right">{fontSize}</span>
            </div>

            <div className="flex items-center gap-2">
                <span className="text-text-dim mr-2 hidden md:inline">{t.theme}</span>
                <button 
                    onClick={() => onThemeChange('dark')}
                    className={`px-3 py-1 border transition-colors ${theme === 'dark' ? 'border-border-light bg-border-main text-text-bright' : 'border-border-main text-text-dim hover:text-text-normal'}`}
                >
                    {t.navyDark}
                </button>
                <button 
                    onClick={() => onThemeChange('light')}
                    className={`px-3 py-1 border transition-colors ${theme === 'light' ? 'border-border-light bg-border-main text-text-bright' : 'border-border-main text-text-dim hover:text-text-normal'}`}
                >
                    {t.paperLight}
                </button>
                <button 
                    onClick={() => onThemeChange('black')}
                    className={`px-3 py-1 border transition-colors ${theme === 'black' ? 'border-border-light bg-[#262626] text-[#ffffff]' : 'border-border-main text-text-dim hover:text-text-normal'}`}
                >
                    {(t as any).blackTheme}
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
