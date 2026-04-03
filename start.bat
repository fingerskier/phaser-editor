@echo off
set PORT=7433
if not "%1"=="" set PORT=%1
set PHASER_PROJECT_DIR=%2
if "%PHASER_PROJECT_DIR%"=="" set PHASER_PROJECT_DIR=.
echo Starting Phaser Editor on http://localhost:%PORT%
start http://localhost:%PORT%
node "%~dp0build\index.js"
