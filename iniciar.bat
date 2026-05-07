@echo off
title Atletic Store - Servidor Local
cd /d "%~dp0"

echo ========================================
echo   Atletic Store - Iniciando servidor...
echo ========================================
echo.

:: Tenta Python 3
python --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python encontrado. Iniciando servidor na porta 4000...
    echo.
    echo Acesse: http://localhost:4000/atletic-store.html
    echo Pressione CTRL+C para encerrar.
    echo.
    start "" "http://localhost:4000/atletic-store.html"
    python -m http.server 4000
    goto :fim
)

:: Tenta Python via py launcher
py --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Python (py) encontrado. Iniciando servidor na porta 4000...
    echo.
    echo Acesse: http://localhost:4000/atletic-store.html
    echo Pressione CTRL+C para encerrar.
    echo.
    start "" "http://localhost:4000/atletic-store.html"
    py -m http.server 4000
    goto :fim
)

:: Tenta Node.js com npx serve
node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js encontrado. Iniciando servidor com npx serve...
    echo.
    echo Acesse: http://localhost:4000
    echo Pressione CTRL+C para encerrar.
    echo.
    start "" "http://localhost:4000"
    npx serve -p 4000
    goto :fim
)

:: Nenhum servidor encontrado — abre direto no browser (limitado, sem localStorage em alguns browsers)
echo [AVISO] Python e Node.js nao encontrados.
echo Abrindo no navegador diretamente (modo arquivo)...
echo.
echo NOTA: Para o sistema de login funcionar corretamente,
echo       instale Python (python.org) ou Node.js (nodejs.org)
echo       e rode este bat novamente.
echo.
start "" "%~dp0atletic-store.html"
pause

:fim
