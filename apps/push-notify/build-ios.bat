@echo off
echo.
echo ===================================
echo   Push Notify - iOS Build
echo ===================================
echo.
cd /d "C:\Users\ytata\AppProject\baseProject\apps\push-notify"
set EXPO_APPLE_ID=y.tata02020202@icloud.com
echo Apple ID login required.
echo.
call npx eas build --platform ios --profile preview
if errorlevel 1 (
  echo.
  echo Build error.
  pause
  exit /b 1
)
echo.
echo Build complete!
pause
