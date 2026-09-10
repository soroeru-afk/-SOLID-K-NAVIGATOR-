/**
 * 外部リンクを既存のブラウザタブにくっつけず、
 * 完全に独立した別ウィンドウ（Popup/Standalone Window）として開くユーティリティ
 */
export function openExternalWindow(url: string, windowName: string = '_blank'): void {
  try {
    const screenWidth = window.screen.availWidth || window.innerWidth || 1440;
    const screenHeight = window.screen.availHeight || window.innerHeight || 900;

    // 株探などの詳細ページが最も見やすいサイズ（画面の約85%〜90%、最大1360x920）
    const width = Math.min(1360, Math.max(1024, Math.floor(screenWidth * 0.85)));
    const height = Math.min(960, Math.max(720, Math.floor(screenHeight * 0.9)));
    const left = Math.max(0, Math.floor((screenWidth - width) / 2));
    const top = Math.max(0, Math.floor((screenHeight - height) / 2));

    // windowFeatures を明示的に指定することで、Chrome等のブラウザは「タブ」ではなく「独立した新規ウィンドウ」として生成します
    const features = [
      `width=${width}`,
      `height=${height}`,
      `left=${left}`,
      `top=${top}`,
      'resizable=yes',
      'scrollbars=yes',
      'status=yes',
      'toolbar=no',
      'menubar=no',
      'location=yes'
    ].join(',');

    const newWindow = window.open(url, windowName, features);
    if (newWindow) {
      newWindow.focus();
    } else {
      // ポップアップが制限されている場合のフォールバック
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  } catch (err) {
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
