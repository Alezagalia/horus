# Script de corrección automática de dependencias - Horus Mobile (Windows)

Write-Host "🔧 Iniciando corrección de compatibilidad..." -ForegroundColor Cyan
Write-Host ""

# Ir al directorio mobile
Set-Location $PSScriptRoot

Write-Host "📦 Paso 1: Actualizando dependencias de Expo SDK 54..." -ForegroundColor Yellow
npx expo install --check --fix

Write-Host ""
Write-Host "🗑️  Paso 2: Removiendo dependencias innecesarias..." -ForegroundColor Yellow
try {
    pnpm remove @types/react-native
} catch {
    Write-Host "⚠️  @types/react-native no estaba instalado" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "♻️  Paso 3: Reinstalando dependencias..." -ForegroundColor Yellow
Set-Location ..\..
pnpm install

Write-Host ""
Write-Host "🔍 Paso 4: Verificando estado del proyecto..." -ForegroundColor Yellow
Set-Location apps\mobile
try {
    npx expo-doctor
} catch {
    Write-Host "⚠️  Aún quedan advertencias (revisa assets y google-services.json)" -ForegroundColor DarkYellow
}

Write-Host ""
Write-Host "✅ Corrección completada!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Siguientes pasos:" -ForegroundColor Cyan
Write-Host "   1. Crear assets faltantes en apps/mobile/assets/" -ForegroundColor White
Write-Host "   2. Configurar google-services.json para Firebase" -ForegroundColor White
Write-Host "   3. Reemplazar app.json: Copy-Item app.json.fixed app.json" -ForegroundColor White
Write-Host "   4. Ejecutar: eas build --platform android --profile preview" -ForegroundColor White
Write-Host ""
Write-Host "📖 Lee BUILD_STRATEGIES.md para más detalles" -ForegroundColor Cyan
