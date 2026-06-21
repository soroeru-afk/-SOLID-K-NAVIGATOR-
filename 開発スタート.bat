@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  SOLID K-NAVIGATOR - 開発サーバー起動
echo ========================================
echo.
echo 開発サーバーを起動しています...
:: startを使わず直接実行し、エラーがあればその場に残す
call npm run dev
if %ERRORLEVEL% neq 0 (
    echo.
    echo [エラー] 開発サーバーが異常終了しました。
)

echo.
pause
