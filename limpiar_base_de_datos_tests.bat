@echo off
echo ========================================================
echo   EcoAlerta - Limpieza y Reseteo de Datos de Testing
echo ========================================================
echo.
echo Eliminando usuarios, vouchers y denuncias de prueba...
cd /d "%~dp0\server"
call npx tsx prisma/clean-test-data.ts
echo.
pause
