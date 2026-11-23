@echo off
setlocal
cd /d "%~dp0"
where py >nul 2>&1
if %errorlevel%==0 (
  set "PY=py -3"
) else (
  set "PY=python"
)
start "" /min cmd /c "timeout /t 2 /nobreak >nul && start http://127.0.0.1:8765/02_peaufine/"
echo ------------------------------------------
echo TATTOOmap - MELISA FORTIN
echo ------------------------------------------
echo Interface 3D : http://127.0.0.1:8765/02_peaufine/
echo Prototype : http://127.0.0.1:8765/01_prototype/
echo Pour arreter : Ctrl+C
%PY% -m http.server 8765 --bind 127.0.0.1
if errorlevel 1 (
  echo ERREUR : Python 3 n'a pas pu lancer le serveur.
  echo Installez Python ou lancez "python -m http.server 8765" manuellement.
  pause
)
endlocal
