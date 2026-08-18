@echo off
cd /d "%~dp0"
start "nyaumae local" cmd /k "npm.cmd run dev -- --open"