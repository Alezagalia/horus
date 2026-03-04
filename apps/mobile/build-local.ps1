# Script para build local de Android

Write-Host "=== BUILD LOCAL DE HORUS ===" -ForegroundColor Cyan
Write-Host ""

Write-Host "Requisito: Android Studio instalado" -ForegroundColor Yellow
Write-Host "Si no lo tienes, descarga de: https://developer.android.com/studio" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "¿Tienes Android Studio instalado? (s/n)"
if ($continue -ne "s") {
    Write-Host "Instala Android Studio primero y vuelve a ejecutar este script." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Paso 1: Generando carpeta android..." -ForegroundColor Yellow
npx expo prebuild --platform android --clean

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en prebuild. Verifica los errores arriba." -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "Paso 2: Compilando APK..." -ForegroundColor Yellow
Set-Location android
./gradlew assembleDebug

if ($LASTEXITCODE -ne 0) {
    Write-Host "Error en compilacion. Verifica los errores arriba." -ForegroundColor Red
    exit
}

Set-Location ..

Write-Host ""
Write-Host "=== BUILD COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "APK generado en:" -ForegroundColor Cyan
Write-Host "android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "Para instalar:" -ForegroundColor Yellow
Write-Host "1. Conecta tu movil por USB" -ForegroundColor White
Write-Host "2. Habilita 'Depuracion USB' en el movil" -ForegroundColor White
Write-Host "3. Ejecuta: adb install android\app\build\outputs\apk\debug\app-debug.apk" -ForegroundColor White
Write-Host ""
Write-Host "O copia el APK a tu movil manualmente" -ForegroundColor White
