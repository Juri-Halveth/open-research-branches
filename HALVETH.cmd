@echo off
if defined HALVETH_NODE (
  "%HALVETH_NODE%" "%~dp0scripts\halveth-entry.mjs" %*
) else (
  node "%~dp0scripts\halveth-entry.mjs" %*
)
exit /b %errorlevel%
