@echo off
@rem ##########################################################################
@rem
@rem  analytics-agent-start startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
setlocal EnableDelayedExpansion

@rem Add default JVM options here. You can also use JAVA_OPTS and ANALYTICS_PROCESSOR_START_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS=

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APPLICATION_HOME=%DIRNAME%..
set APPLICATION_HOME=%APPLICATION_HOME%
set STARTUP_LOG_FILE="%APPLICATION_HOME%\startup.log"
set PROPERTIES_FILE="%APPLICATION_HOME%\conf\analytics-agent.properties"
set MAX_WAIT_TIME=60

@rem find the processor architecture.
if "x%PROCESSOR_ARCHITECTURE%" == "x" (
    SYSTEMINFO > .sysinfo 2>&1
) else (
    echo %PROCESSOR_ARCHITECTURE% > .sysinfo 2>&1
)
FINDSTR /I /C:"x86%" .sysinfo 2>&1
if %ERRORLEVEL% NEQ 0 (
        set SYS_ARCH=64bit
) else (
        set SYS_ARCH=32bit
)
del .sysinfo



@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=javaw.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto init

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/javaw.exe

if exist "%JAVA_EXE%" goto init

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:init
@rem Get command-line arguments, handling Windowz variants

if not "%OS%" == "Windows_NT" goto win9xME_args
if "%@eval[2+2]" == "4" goto 4NT_args

:win9xME_args
@rem Slurp the command line arguments.
set CMD_LINE_ARGS=
set _SKIP=2

:win9xME_args_slurp
if "x%~1" == "x" goto execute

set CMD_LINE_ARGS=%*
goto execute

:4NT_args
@rem Get arguments from the 4NT Shell from JP Software
set CMD_LINE_ARGS=%$

:execute
@rem Setup the command line
if [%CMD_LINE_ARGS%] == [] (
	call:usage
	exit /b 1
)
for /f "tokens=1,*" %%a in ("%CMD_LINE_ARGS%") do (
    set CMD_LINE_ARGS=%%b
    if "%%a"=="start" (
        goto:agent_start
    )
    if "%%a"=="stop" (
        call:agent_stop
        exit /b %ERRORLEVEL%
    )
    if "%%a"=="install-analytics-agent" (
        goto:install_analytics_agent
    )
    if "%%a"=="uninstall-analytics-agent" (
        goto:uninstall_analytics_agent
    )
    if "%%a"=="start-service" (
        goto:start_service
    )
    if "%%a"=="stop-service" (
        goto:stop_service
    )

	call:usage
	exit /b 1
)

:agent_start
call:setJavaOptions
@rem Execute analytics-agent
@rem ERRORLEVEL might be set to 1 by the string comparisions made in isJavaOptionNotSet function.
@rem It is explicitly set to zero to ensure the success of start command.
set ERRORLEVEL=0

echo.
echo Starting analytics-agent with properties file %PROPERTIES_FILE%
echo.
echo JAVA_OPTS passed to the program are %JAVA_OPTS%
call:removeStalePidFiles

echo.
echo Startup errors if any will be written to %STARTUP_LOG_FILE%
start /b "" "%JAVA_EXE%" %JAVA_OPTS% -classpath "%APPLICATION_HOME%\lib\*" com.appdynamics.analytics.agent.AnalyticsAgent %PROPERTIES_FILE% > %STARTUP_LOG_FILE% 2>&1
call :waitForAgentStartup

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" (
    goto mainEnd
)
:fail
@rem Set variable ANALYTICS_AGENT_START_EXIT_CONSOLE if you need the _script_ return code instead of
@rem the _cmd.exe /c_ return code!
if  not "" == "%ANALYTICS_AGENT_START_EXIT_CONSOLE%"(
    exit 1
    exit /b 1
)
goto :eof

:agent_stop
if "x!CMD_LINE_ARGS!" == "x" (
    echo "No arguments are passed to the stop command"
    echo "Stopping all the processes currently launched from !APPLICATION_HOME!"
    for /R %%G in (*.id) do (
        set PROCESS_ID_FILE="%%G"
        call:read_pid_and_kill_process
    )
) else (
    for  %%a in (!CMD_LINE_ARGS!) do (
        set PROCESS_ID_FILE=%%a
        call:read_pid_and_kill_process
    )
)
goto :eof

:read_pid_and_kill_process
if exist !PROCESS_ID_FILE! (
    for /F "usebackq delims=" %%a in (!PROCESS_ID_FILE!) do (
        echo Killing process with id [!PROCESS_ID_FILE!]
        taskkill /f /pid %%a
        del !PROCESS_ID_FILE!
    )
) else (
    echo Unable to find [!PROCESS_ID_FILE!]
    echo Either the process is not running or [!PROCESS_ID_FILE!] has been moved/deleted
    echo Please kill the process associated with [!PROCESS_ID_FILE!] manually if it is running
)
goto:eof

:setJavaOptions
    call:setHeapOptionsIfNotset
    set JAVA_OPTS=%JAVA_OPTS%
    FOR /F "usebackq delims=" %%a in ("%APPLICATION_HOME%\conf\analytics-agent.vmoptions") do (
        set JAVA_OPTS=!JAVA_OPTS! %%a
    )
goto :eof

:setHeapOptionsIfNotset
set isXmxSet=false
set isXmsSet=false

set DEFAULT_MAX_HEAP_SIZE=1g
set DEFAULT_MIN_HEAP_SIZE=1g

set OPTION_ALREADY_SET=false
call:isJavaOptionNotSet "-Xmx"

echo.%JAVA_OPTS% | findstr /C:-Xmx 1>nul
if "!OPTION_ALREADY_SET!"=="true" (
    set isXmxSet=true
)

set OPTION_ALREADY_SET=false
call:isJavaOptionNotSet "-Xms"
if "!OPTION_ALREADY_SET!"=="true" (
    set isXmsSet=true
)
echo !JAVA_OPTS!
set eitherXmxOrXms=true
if not "%isXmxSet%"=="true" (
    if not "%isXmsSet%"=="true" (
        set eitherXmxOrXms=false
    )
)

if "%eitherXmxOrXms%"=="true" (
    echo JVM heap options are set in JAVA_OPTS. Default heap options will not be added
    goto :eof
)

if "%isXmxSet%"=="false" (
    echo -Xmx option not found in JAVA_OPTS
    echo Adding default [-Xmx%DEFAULT_MAX_HEAP_SIZE%] to JAVA_OPTS
    set JAVA_OPTS=%JAVA_OPTS% -Xmx%DEFAULT_MAX_HEAP_SIZE%
)

if "%isXmsSet%"=="false" (
    echo -Xms option not found in JAVA_OPTS
    echo Adding default [-Xms%DEFAULT_MIN_HEAP_SIZE%] to JAVA_OPTS
    set JAVA_OPTS=%JAVA_OPTS% -Xms%DEFAULT_MAX_HEAP_SIZE%
)
goto :eof

:isJavaOptionNotSet
echo.%JAVA_OPTS% | findstr /C:%~1 1>nul

if %ERRORLEVEL%==0 (
    set OPTION_ALREADY_SET=true
)
goto :eof

:isProcessRunning
tasklist /v | findstr /C:%~1 > startup-script-output.tmp
for %%x in (startup-script-output.tmp) do if not %%~zx==0 (
    set PROCESS_RUNNING=true
)
goto :eof


:install_analytics_agent
    call :set_app_home_in_prop_file
    "%APPLICATION_HOME%\bin\%SYS_ARCH%\analytics-agent.exe" /install non-interactive
goto :eof

:uninstall_analytics_agent
    "%APPLICATION_HOME%\bin\%SYS_ARCH%\analytics-agent.exe" /uninstall
goto :eof

:start_service
    "%APPLICATION_HOME%\bin\%SYS_ARCH%\analytics-agent.exe" /start
goto :eof

:stop_service
    "%APPLICATION_HOME%\bin\%SYS_ARCH%\analytics-agent.exe" /stop
goto :eof

:removeStalePidFiles
call :find_process_name
set APP_PID_FILE="%APPLICATION_HOME%\%ANALYTICS_PROCESS_NAME%.id"

    if exist !APP_PID_FILE! (
        echo "!APP_PID_FILE! already exists. Checking if any process associated with it is running."

        for /F "usebackq delims=" %%a in (!APP_PID_FILE!) do (
            set PID=%%a
            call:isProcessRunning !PID!
            if "x!PROCESS_RUNNING!" == "x" (
                echo No process seems to be running with pid !PID! which is stored in !APP_PID_FILE!
                echo Removing the stale pid file.
                del !APP_PID_FILE!
            ) else (
                echo Cannot launch another process with the same ID. Exiting now.
                exit /b 1
            )
        )
    )

goto :eof

:waitForAgentStartup
call :find_process_name
set APP_PID_FILE="%APPLICATION_HOME%/%ANALYTICS_PROCESS_NAME%.id"
echo|set /p="Starting agent "
FOR /L %%G IN (1,1,%MAX_WAIT_TIME%) DO (
    if exist !APP_PID_FILE! (
        echo started.
        goto :break
    ) else (
    @rem prints on the same line
    echo|set /p=.
    @rem will only be interrupted by CTRL-c
    timeout /t 1 /nobreak > NUL
    )
)
echo Failed to start agent within the time limit of %MAX_WAIT_TIME% sec.
exit /b 1
:break
goto :eof

:find_process_name
FOR /F "DELIMS== TOKENS=1,2" %%i IN ('findstr ^ad.process.name !PROPERTIES_FILE!') DO set ANALYTICS_PROCESS_NAME=%%j
goto :eof

:set_app_home_in_prop_file
    FOR /F "DELIMS== TOKENS=1,2" %%i IN ('findstr ^ad.dw.log.path "!PROPERTIES_FILE!"') DO set LINE=%%j
    @rem the replace function automatically takes care of spaces. So no need to wrap the path in double quotes.
    set find=${APPLICATION_HOME}
    @rem This is how string replacement works in batch files
    @rem set STRING=%%STRING:TEXT_TO_FIND=TEXT_TO_REPLACE_IT_WITH%%
    call set LINE=%%LINE:!find!=!APPLICATION_HOME!%%

    FOR /F "DELIMS== TOKENS=1,2" %%i IN ('findstr ^conf.dir "!PROPERTIES_FILE!"') DO set LINE=%%j
    @rem the replace function automatically takes care of spaces. So no need to wrap the path in double quotes.
    set find=${APPLICATION_HOME}
    @rem This is how string replacement works in batch files
    @rem set STRING=%%STRING:TEXT_TO_FIND=TEXT_TO_REPLACE_IT_WITH%%
    call set LINE=%%LINE:!find!=!APPLICATION_HOME!%%
goto:eof


:usage
echo Usage:
echo.
echo    Start the analytics-agent
echo        %~f0 start
echo.
echo    Stop the analytics-agent
echo        %~f0 stop
echo.
echo    Other settings:
echo        To configure additional behavior use JAVA_OPTS: set JAVA_OPTS="-Xmx2g -Xms2g".
echo        Edit %APPLICATION_HOME%\conf\analytics-agent.vmoptions file to fine tune the JVM GC options.
goto :eof

:mainEnd
endlocal

:omega
