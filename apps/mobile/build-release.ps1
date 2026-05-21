# Script para generar APK de Release
# Este APK funcionará sin necesidad de Metro ni backend local
# El bundle JS se genera automáticamente via Gradle (expo export:embed)

Write-Host "=== GENERAR APK DE RELEASE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este APK se conectará a: https://horus-production-4629.up.railway.app" -ForegroundColor Green
Write-Host ""

# Configurar ANDROID_HOME
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    Write-Host "Configurando ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Yellow
}

# Configurar JAVA_HOME
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    Write-Host "Configurando JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
}

# Bakear la URL de Railway en el JS bundle
$env:EXPO_PUBLIC_API_URL = "https://horus-production-4629.up.railway.app/api"
Write-Host "API URL: $env:EXPO_PUBLIC_API_URL" -ForegroundColor Yellow

# Fix para monorepo pnpm: sin esto, Metro usa el monorepo root como serverRoot
# y no puede resolver index.js relativo a apps/mobile/
$env:EXPO_NO_METRO_WORKSPACE_ROOT = "1"

Write-Host ""
Write-Host "Paso 1: Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
}

Write-Host ""
Write-Host "Paso 2: Compilando APK de Release (incluye bundle JS via expo export:embed)..." -ForegroundColor Yellow
Set-Location android
.\gradlew assembleRelease
$buildResult = $LASTEXITCODE
Set-Location ..

Write-Host ""
if ($buildResult -ne 0) {
    Write-Host "=== BUILD FALLIDO (exit code: $buildResult) ===" -ForegroundColor Red
    exit $buildResult
}

Write-Host "=== BUILD COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "APK generado en:" -ForegroundColor Cyan
Write-Host "  android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor White
Write-Host ""
Write-Host "Este APK:" -ForegroundColor Yellow
Write-Host "  OK  Funciona sin Metro" -ForegroundColor Green
Write-Host "  OK  Funciona sin backend local" -ForegroundColor Green
Write-Host "  OK  Se conecta directamente a Railway" -ForegroundColor Green
Write-Host ""
Write-Host "Para instalar en la tablet (USB conectada):" -ForegroundColor Cyan
Write-Host "  adb install android\app\build\outputs\apk\release\app-release.apk" -ForegroundColor White
Write-Host ""
Write-Host "Si ya tenia una version anterior instalada, primero desinstalar:" -ForegroundColor Yellow
Write-Host "  adb uninstall com.horus.app" -ForegroundColor White
