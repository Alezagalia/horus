# Fix .js extensions in imports for Metro bundler

$files = Get-ChildItem -Path "src\_shared" -Filter *.ts -Recurse

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $newContent = $content -replace "from '(.*?)\.js'", "from '`$1'"
    $newContent = $newContent -replace 'from "(.*?)\.js"', 'from "`$1"'
    $newContent = $newContent -replace "import '(.*?)\.js'", "import '`$1'"
    $newContent = $newContent -replace 'import "(.*?)\.js"', 'import "`$1"'

    Set-Content -Path $file.FullName -Value $newContent -NoNewline
    Write-Host "Fixed: $($file.Name)"
}

Write-Host "All imports fixed!"
