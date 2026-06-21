@echo off
chcp 65001 > nul
cd /d "%~dp0"
echo ========================================
echo  SOLID K-NAVIGATOR - ビルド
echo ========================================
echo.
echo 本番用ビルドを実行しています...
echo.
call npm run build
if %ERRORLEVEL% == 0 (
    echo.
    echo [成功] ビルドが完了しました。distフォルダを確認してください。
) else (
    echo.
    echo [エラー] ビルドに失敗しました。エラーメッセージを確認してください。
)
echo.
pause
