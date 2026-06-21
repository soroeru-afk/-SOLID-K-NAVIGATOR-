@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  SOLID K-NAVIGATOR - 開発サーバー起動
echo ========================================
echo.
echo 開発サーバーを起動しています...
:: cmd /k を使用して、開発サーバーがクラッシュした際もログを表示し続ける
start "K-NAVIGATOR Dev" cmd /k "npm run dev"

echo サーバー起動待ち（4秒）...
timeout /t 4 /nobreak > nul

echo ブラウザを開いています...
start "" "http://localhost:3000"

echo.
echo [起動完了] http://localhost:3000 でアクセスできます。
echo サーバーを止めるには「K-NAVIGATOR Dev」ウィンドウを閉じてください。
pause
