# Corregir todas las referencias rotas en HTML

$root = "C:\xampp\htdocs\sigmaforo"

Write-Host "Corrigiendo referencias rotas en HTML..." -ForegroundColor Yellow
Write-Host ""

# Mapeo de referencias rotas a correctas
$corrections = @(
    @{old = 'src="mapa-functions.js"'; new = 'src="../../js/modules/map.js"'},
    @{old = 'src="mis-reportes-functions.js"'; new = 'src="../../js/modules/my-reports.js"'},
    @{old = 'src="perfil-functions.js"'; new = 'src="../../js/modules/profile.js"'},
    @{old = 'src="configuracion-functions.js"'; new = 'src="../../js/modules/settings.js"'},
    @{old = 'href="alertas-styles.css"'; new = 'href="../../css/responsive/mobile.css"'},
    @{old = 'href="configuracion-modern.css"'; new = 'href="../../css/pages/admin.css"'}
)

$htmlFiles = Get-ChildItem "$root\src\frontend\pages" -Filter "*.html" -Recurse

foreach($html in $htmlFiles) {
    $content = Get-Content $html.FullName -Raw
    $updated = $false
    
    foreach($correction in $corrections) {
        if($content -like "*$($correction.old)*") {
            $content = $content -replace [regex]::Escape($correction.old), $correction.new
            $updated = $true
            Write-Host "  Corregido en $($html.Name): $($correction.old)" -ForegroundColor Green
        }
    }
    
    if($updated) {
        Set-Content $html.FullName $content -Force
    }
}

Write-Host ""
Write-Host "Completado" -ForegroundColor Cyan
