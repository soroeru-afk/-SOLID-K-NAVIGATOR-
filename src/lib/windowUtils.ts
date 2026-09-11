/**
 * 外部リンクを既存のブラウザタブにくっつけず、
 * 完全に独立した別ウィンドウ（Popup/Standalone Window）として開くユーティリティ
 */
export function openExternalWindow(url: string, windowName: string = '_blank'): void {
  try {
    const screenWidth = window.screen.availWidth || window.innerWidth || 1440;
    const screenHeight = window.screen.availHeight || window.innerHeight || 900;

    // 横方向の幅はそのままで、位置を上に寄せて縦方向を下へしっかり伸ばす（ランキング等の下部まで見渡せるサイズ）
    const width = Math.min(1360, Math.max(1024, Math.floor(screenWidth * 0.85)));
    const top = Math.max(8, Math.min(20, Math.floor(screenHeight * 0.02)));
    const height = Math.min(1200, Math.max(780, screenHeight - top - 35));
    const left = Math.max(0, Math.floor((screenWidth - width) / 2));

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
