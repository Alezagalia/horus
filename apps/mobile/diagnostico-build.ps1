# Script de diagnostico pre-build

Write-Host "=== DIAGNOSTICO PRE-BUILD ===" -ForegroundColor Cyan
Write-Host ""

# 1. Verificar google-services.json
Write-Host "1. Verificando google-services.json..." -ForegroundColor Yellow
if (Test-Path "google-services.json") {
    $content = Get-Content "google-services.json" -Raw | ConvertFrom-Json
    $packageName = $content.client[0].client_info.android_client_info.package_name
    Write-Host "   OK - Encontrado con package: $packageName" -ForegroundColor Green
} else {
    Write-Host "   ERROR - google-services.json no encontrado!" -ForegroundColor Red
}

# 2. Verificar assets
Write-Host ""
Write-Host "2. Verificando assets..." -ForegroundColor Yellow
$requiredAssets = @("icon.png", "adaptive-icon.png", "notification-icon.png", "splash.png")
$missingAssets = @()
foreach ($asset in $requiredAssets) {
    if (Test-Path "assets\$asset") {
        Write-Host "   OK - $asset" -ForegroundColor Green
    } else {
        Write-Host "   FALTA - $asset" -ForegroundColor Red
        $missingAssets += $asset
    }
}

# 3. Verificar app.json
Write-Host ""
Write-Host "3. Verificando app.json..." -ForegroundColor Yellow
$appJson = Get-Content "app.json" -Raw | ConvertFrom-Json
$hasProjectId = $appJson.expo.extra.eas.projectId -ne $null
$hasNotificationPlugin = $appJson.expo.plugins -contains "expo-notifications" -or
                         ($appJson.expo.plugins | Where-Object { $_ -is [array] -and $_[0] -eq "expo-notifications" })
Write-Host "   EAS Project ID: $(if($hasProjectId){'OK'}else{'FALTA'})" -ForegroundColor $(if($hasProjectId){'Green'}else{'Red'})
Write-Host "   Plugin expo-notifications: $(if($hasNotificationPlugin){'OK'}else{'FALTA'})" -ForegroundColor $(if($hasNotificationPlugin){'Green'}else{'Red'})

# 4. Verificar package.json
Write-Host ""
Write-Host "4. Verificando package.json..." -ForegroundColor Yellow
$packageJson = Get-Content "package.json" -Raw | ConvertFrom-Json
$expoVersion = $packageJson.dependencies.expo
Write-Host "   Expo SDK: $expoVersion" -ForegroundColor Green

# 5. Verificar login EAS
Write-Host ""
Write-Host "5. Verificando login EAS..." -ForegroundColor Yellow
try {
    $whoami = eas whoami 2>&1
    Write-Host "   Logged in as: $whoami" -ForegroundColor Green
} catch {
    Write-Host "   NO logueado en EAS" -ForegroundColor Red
}

# Resumen
Write-Host ""
Write-Host "=== RESUMEN ===" -ForegroundColor Cyan
if ($missingAssets.Count -eq 0 -and (Test-Path "google-services.json") -and $hasProjectId) {
    Write-Host "OK - Todo listo para el build!" -ForegroundColor Green
} else {
    Write-Host "ATENCION - Hay problemas que resolver:" -ForegroundColor Yellow
    if ($missingAssets.Count -gt 0) {
        Write-Host "  - Assets faltantes: $($missingAssets -join ', ')" -ForegroundColor Red
    }
    if (-not (Test-Path "google-services.json")) {
        Write-Host "  - Falta google-services.json" -ForegroundColor Red
    }
    if (-not $hasProjectId) {
        Write-Host "  - Falta EAS Project ID en app.json" -ForegroundColor Red
    }
}
