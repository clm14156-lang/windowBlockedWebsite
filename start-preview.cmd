@echo off
setlocal
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 (
  set "FOCUS_NODE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
) else (
  set "FOCUS_NODE=node"
)
if not "%FOCUS_NODE%"=="node" if not exist "%FOCUS_NODE%" (
  echo Please install Node.js 18 or later, then run this file again.
  pause
  exit /b 1
)
"%FOCUS_NODE%" scripts\start-preview.mjs %*
if errorlevel 1 (
  echo.
  echo Startup failed. See the message above.
  pause
  exit /b 1
)
