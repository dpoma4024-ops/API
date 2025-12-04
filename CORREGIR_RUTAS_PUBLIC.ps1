# Script para corregir rutas en index.html (en public/)

$indexPath = "C:\xampp\htdocs\sigmaforo\src\frontend\public\index.html"

Write-Host "Corrigiendo rutas en index.html..." -ForegroundColor Yellow

$content = Get-Content $indexPath -Raw

# Corregir rutas relativas desde src/frontend/public/
# Necesita ../css/, ../js/
$content = $content -replace 'href="styles\.css"', 'href="../css/style.css"'
$content = $content -replace 'src="app\.js"', 'src="../js/core/app.js"'

# Guardar
Set-Content $indexPath $content -Force

Write-Host "Corrected: index.html" -ForegroundColor Green
