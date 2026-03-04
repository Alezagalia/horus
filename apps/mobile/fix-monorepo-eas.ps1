# Script para hacer que EAS funcione con el monorepo

Write-Host "=== CONFIGURAR MONOREPO PARA EAS ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "Este script copiara @horus/shared inline para evitar problemas de workspace" -ForegroundColor Yellow
Write-Host ""

$continue = Read-Host "¿Continuar? (s/n)"
if ($continue -ne "s") {
    exit
}

# Backup
Write-Host ""
Write-Host "Creando backup..." -ForegroundColor Yellow
Copy-Item package.json package.json.backup
Copy-Item tsconfig.json tsconfig.json.backup

# Copiar shared inline
Write-Host "Copiando @horus/shared inline..." -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path "src\_shared" | Out-Null
Copy-Item -Recurse -Force "..\..\packages\shared\src\*" "src\_shared\"

# Actualizar package.json
Write-Host "Actualizando package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$packageJson.dependencies.PSObject.Properties.Remove("@horus/shared")
$packageJson | ConvertTo-Json -Depth 10 | Set-Content "package.json"

# Actualizar tsconfig.json
Write-Host "Actualizando tsconfig.json..." -ForegroundColor Yellow
$tsconfig = Get-Content "tsconfig.json" -Raw | ConvertFrom-Json
$tsconfig.compilerOptions.paths."@horus/shared" = @("./src/_shared/index.ts")
$tsconfig | ConvertTo-Json -Depth 10 | Set-Content "tsconfig.json"

Write-Host ""
Write-Host "=== CONFIGURACION COMPLETA ===" -ForegroundColor Green
Write-Host ""
Write-Host "Ahora puedes ejecutar:" -ForegroundColor Cyan
Write-Host "eas build --platform android --profile preview" -ForegroundColor White
Write-Host ""
Write-Host "Para revertir los cambios:" -ForegroundColor Yellow
Write-Host "Copy-Item package.json.backup package.json" -ForegroundColor White
Write-Host "Copy-Item tsconfig.json.backup tsconfig.json" -ForegroundColor White
Write-Host "Remove-Item -Recurse src\_shared" -ForegroundColor White
