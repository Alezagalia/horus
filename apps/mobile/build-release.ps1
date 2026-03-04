# Script para generar APK de Release
# Este APK funcionará sin necesidad de Metro ni backend local

Write-Host "=== GENERAR APK DE RELEASE ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este APK se conectará a: https://horus-production-4629.up.railway.app" -ForegroundColor Green
Write-Host ""

# Verificar que ANDROID_HOME esté configurado
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
    Write-Host "Configurando ANDROID_HOME: $env:ANDROID_HOME" -ForegroundColor Yellow
}

# Verificar Java
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
    Write-Host "Configurando JAVA_HOME: $env:JAVA_HOME" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Paso 1: Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "android\app\build") {
    Remove-Item -Recurse -Force "android\app\build"
}

Write-Host ""
Write-Host "Paso 2: Generando bundle de JavaScript..." -ForegroundColor Yellow
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

Write-Host ""
Write-Host "Paso 3: Compilando APK de Release..." -ForegroundColor Yellow
cd android
.\gradlew assembleRelease
cd ..

Write-Host ""
Write-Host "=== BUILD COMPLETADO ===" -ForegroundColor Green
Write-Host ""
Write-Host "APK generado en:" -ForegroundColor Cyan
Write-Host "android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor White
Write-Host ""
Write-Host "Este APK:" -ForegroundColor Yellow
Write-Host "  ✓ Funciona sin Metro" -ForegroundColor Green
Write-Host "  ✓ Funciona sin backend local" -ForegroundColor Green
Write-Host "  ✓ Se conecta directamente a Railway" -ForegroundColor Green
Write-Host ""
Write-Host "Para instalar en la tablet:" -ForegroundColor Cyan
Write-Host "  adb install android/app/build/outputs/apk/release/app-release.apk" -ForegroundColor White
