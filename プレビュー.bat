@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  SOLID K-NAVIGATOR - プレビュー起動
echo ========================================
echo.

if not exist "dist" (
    echo [エラー] distフォルダが見つかりません。
    echo 先に「ビルド.bat」を実行してください。
    pause
    exit /b 1
)

echo サーバーを起動しています...
start "K-NAVIGATOR Server" node server-prod.cjs

echo サーバー起動待ち（3秒）...
timeout /t 3 /nobreak > nul

echo ブラウザを開いています...
start "" "http://localhost:3000"

echo.
echo [起動完了] http://localhost:3000 でアクセスできます。
echo サーバーを止めるには「K-NAVIGATOR Server」ウィンドウを閉じてください。
pause
