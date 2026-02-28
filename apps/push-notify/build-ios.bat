@echo off
chcp 65001 >nul
echo.
echo ===================================
echo   かんたんプッシュ - iOS ビルド
echo ===================================
echo.
cd /d "%~dp0"
call npx eas build --platform ios --profile preview
echo.
echo ビルド完了！上のURLからインストールできます。
pause
