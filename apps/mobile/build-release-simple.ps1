# Script para generar APK de Release

Write-Host "=== GENERAR APK DE RELEASE ===" -ForegroundColor Cyan
Write-Host "Este APK se conectara a Railway" -ForegroundColor Green

# Configurar ANDROID_HOME
if (-not $env:ANDROID_HOME) {
    $env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
}

# Configurar JAVA_HOME
if (-not $env:JAVA_HOME) {
    $env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
}

Write-Host "Paso 1: Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "android/app/build") {
    Remove-Item -Recurse -Force "android/app/build"
}

Write-Host "Paso 2: Creando directorio assets..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "android/app/src/main/assets" | Out-Null

Write-Host "Paso 3: Generando bundle de JavaScript..." -ForegroundColor Yellow
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

Write-Host "Paso 4: Compilando APK de Release..." -ForegroundColor Yellow
Set-Location android
./gradlew assembleRelease
Set-Location ..

Write-Host "=== BUILD COMPLETADO ===" -ForegroundColor Green
Write-Host "APK: android/app/build/outputs/apk/release/app-release.apk"
