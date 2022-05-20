@echo off
IF NOT "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)

set SERVICE_NAME=QP_MT
echo Removing Mobile Ticket service

sc stop %SERVICE_NAME% > NUL
sc delete %SERVICE_NAME% > NUL

reg delete "HKLM\SYSTEM\CurrentControlSet\Services\%SERVICE_NAME%" /f >NUL 2>&1
exit /b 0

SUCCESS
echo service successfully uninstalled.
goto :EOF

:FAIL
echo service uninstallation failed.
goto :EOF