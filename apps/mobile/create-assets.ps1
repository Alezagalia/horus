# Script para crear assets temporales basicos usando PowerShell

$assetsDir = ".\assets"

Write-Host "Creando assets temporales para Horus..." -ForegroundColor Cyan

# Funcion para crear una imagen PNG basica
function Create-BasicImage {
    param(
        [string]$path,
        [int]$width,
        [int]$height,
        [string]$text
    )

    Add-Type -AssemblyName System.Drawing

    $bitmap = New-Object System.Drawing.Bitmap($width, $height)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)

    # Fondo azul
    $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(33, 150, 243))
    $graphics.FillRectangle($brush, 0, 0, $width, $height)

    # Texto blanco centrado
    $font = New-Object System.Drawing.Font("Arial", [int]($width/8), [System.Drawing.FontStyle]::Bold)
    $stringFormat = New-Object System.Drawing.StringFormat
    $stringFormat.Alignment = [System.Drawing.StringAlignment]::Center
    $stringFormat.LineAlignment = [System.Drawing.StringAlignment]::Center

    $textBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White)
    $rectF = New-Object System.Drawing.RectangleF(0, 0, $width, $height)

    $graphics.DrawString($text, $font, $textBrush, $rectF, $stringFormat)

    # Guardar
    $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)

    # Limpiar
    $graphics.Dispose()
    $bitmap.Dispose()
    $brush.Dispose()
    $textBrush.Dispose()
    $font.Dispose()
}

try {
    # Crear directorio si no existe
    if (-not (Test-Path $assetsDir)) {
        New-Item -ItemType Directory -Path $assetsDir | Out-Null
    }

    Write-Host "Creando icon.png (1024x1024)..." -ForegroundColor Yellow
    Create-BasicImage -path "$assetsDir\icon.png" -width 1024 -height 1024 -text "Horus"

    Write-Host "Creando adaptive-icon.png (1024x1024)..." -ForegroundColor Yellow
    Create-BasicImage -path "$assetsDir\adaptive-icon.png" -width 1024 -height 1024 -text "H"

    Write-Host "Creando notification-icon.png (96x96)..." -ForegroundColor Yellow
    Create-BasicImage -path "$assetsDir\notification-icon.png" -width 96 -height 96 -text "H"

    Write-Host "Creando splash.png (1284x2778)..." -ForegroundColor Yellow
    Create-BasicImage -path "$assetsDir\splash.png" -width 1284 -height 2778 -text "Horus"

    Write-Host "Creando favicon.png (48x48)..." -ForegroundColor Yellow
    Create-BasicImage -path "$assetsDir\favicon.png" -width 48 -height 48 -text "H"

    Write-Host ""
    Write-Host "Assets temporales creados exitosamente!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Archivos creados:" -ForegroundColor Cyan
    Get-ChildItem $assetsDir\*.png | Format-Table Name, Length

    Write-Host ""
    Write-Host "NOTA: Estos son assets temporales para testing." -ForegroundColor Yellow
    Write-Host "Para la version final, reemplazalos con imagenes profesionales." -ForegroundColor Yellow

} catch {
    Write-Host "Error al crear assets: $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "Alternativa: Descarga assets desde:" -ForegroundColor Yellow
    Write-Host "  - https://easyappicon.com/" -ForegroundColor White
    Write-Host "  - https://makeappicon.com/" -ForegroundColor White
}
