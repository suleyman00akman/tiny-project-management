@echo off
REM Set HOME environment variable for current session
set HOME=%USERPROFILE%
set PLAYWRIGHT_BROWSERS_PATH=%USERPROFILE%\.cache\ms-playwright

REM Run the command passed as arguments
%*
