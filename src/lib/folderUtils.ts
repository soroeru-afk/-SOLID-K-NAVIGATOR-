import { FolderColor } from '../types';

/**
 * 選択状態や階層に応じたフォルダーアイコンのCSSクラスを取得
 */
export function getFolderColorClass(
  folderColor: FolderColor = 'theme', 
  isSelected: boolean = false, 
  isRoot: boolean = false
): string {
  switch (folderColor) {
    case 'amber':
      return isSelected ? 'text-[#f59e0b]' : isRoot ? 'text-[#d29922]' : 'text-[#d29922]/90';
    case 'blue':
      return isSelected ? 'text-[#58a6ff]' : isRoot ? 'text-[#388bfd]' : 'text-[#388bfd]/90';
    case 'white':
      return isSelected ? 'text-[#ffffff] drop-shadow-xs' : 'text-[#ffffff]/90';
    case 'black':
      return isSelected ? 'text-[#000000]' : 'text-[#1a1a1a]';
    case 'gray':
      return isSelected ? 'text-[#e6edf3]' : 'text-[#8b949e]';
    case 'theme':
    default:
      return isSelected ? 'text-text-bright' : 'text-text-dim group-hover:text-text-bright';
  }
}

/**
 * プレビュー用バッジやドットの背景スタイルクラスを取得
 */
export function getFolderColorBadgeClass(folderColor: FolderColor): string {
  switch (folderColor) {
    case 'amber':
      return 'bg-[#d29922]';
    case 'blue':
      return 'bg-[#58a6ff]';
    case 'white':
      return 'bg-[#ffffff] border border-gray-400';
    case 'black':
      return 'bg-[#000000] border border-gray-600';
    case 'gray':
      return 'bg-[#8b949e]';
    case 'theme':
    default:
      return 'bg-text-bright border border-border-light';
  }
}
