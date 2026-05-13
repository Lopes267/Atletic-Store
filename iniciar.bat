@echo off
title Atletic Store - Servidor
cd /d "%~dp0"

echo ========================================
echo   Atletic Store - Iniciando servidor...
echo ========================================
echo.

node --version >nul 2>&1
if %errorlevel% == 0 (
    echo [OK] Node.js encontrado. Iniciando servidor na porta 4000...
    echo.
    echo Acesse: http://localhost:4000
    echo Pressione CTRL+C para encerrar.
    echo.
    start "" "http://localhost:4000"
    node server.js
    goto :fim
)

echo [ERRO] Node.js nao encontrado.
echo Instale o Node.js em https://nodejs.org e rode este bat novamente.
echo.
pause

:fim
