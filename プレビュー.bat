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
:: startを使わず直接実行し、落ちたらその場にエラーを残すように変更
node server-prod.cjs
if %ERRORLEVEL% neq 0 (
    echo.
    echo [エラー] サーバーが異常終了しました。
)

echo.
pause
