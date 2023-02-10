@echo off
IF NOT "%1"=="am_admin" (powershell start -verb runas '%0' am_admin & exit /b)

SET ROOT=%~dp0
CALL :RESOLVE "%ROOT%\.." MT_HOME
echo %MT_HOME%

set LOG_DIR=%MT_HOME%\logs
set BIN_DIR=%MT_HOME%\bin

IF NOT EXIST "C:\Program Files\nodejs\node.exe" (
echo "Error! cannot locate C:\Program Files\nodejs\node.exe"
 goto FAIL
)

call npm --prefix "%MT_HOME%" run install:prod || goto FAIL
::call npm install --silent || goto FAIL

set SERVICE_TITLE=Qmatic Mobile Ticket
set SERVICE_NAME=QP_MT

::set prunsrv=%BIN_DIR%\prunsrv.exe
set prunsrv="%BIN_DIR%\prunsrv.exe"

::stop service:
net start | findstr %SERVICE_NAME%
if ERRORLEVEL 1 net stop %SERVICE_NAME%
::net stop %SERVICE_NAME%

::delete service:
net start | findstr %SERVICE_NAME%
if ERRORLEVEL 1 %prunsrv% //DS//%SERVICE_NAME%
::%prunsrv% //DS//%SERVICE_NAME%

::install service:
:: ++StartParams is the arguments. arguments are separated with "#"
%prunsrv% //IS//%SERVICE_NAME% --DisplayName="%SERVICE_TITLE%" --Startup=auto --Install=%prunsrv% --StartMode=exe --StartImage="C:\\Program Files\\nodejs\\node.exe" ++StartParams="%MT_HOME%\server.js" --LogPath="%MT_HOME%\bin\logs" --StdOutput="%MT_HOME%\bin\logs\service.log" --StdError="%MT_HOME%\bin\logs\service-error.log"

::start service:
net start %SERVICE_NAME%

::clear auto generate files for clean the MT directory
del "%MT_HOME%\*.cmd"
del "%MT_HOME%\*.ps1"
del "%MT_HOME%\*."

:RESOLVE
SET %2=%~f1
goto:eof

if ERRORLEVEL 1 GOTO SUCCESS
else GOTO FAIL

:FAIL
ECHO %SERVICE_TITLE% installation failed.
PAUSE
exit /b

:SUCCESS
ECHO %SERVICE_TITLE% service successfully installed.
exit /b