# Script para completar actualizaciones de rutas no cubiertas

$root = "C:\xampp\htdocs\sigmaforo"

Write-Host "Completando actualizaciones de rutas..." -ForegroundColor Yellow

# Actualizar HTML
Write-Host "Actualizando HTML..."
$htmlFiles = Get-ChildItem "$root\src\frontend\pages" -Filter "*.html" -Recurse

foreach($f in $htmlFiles) {
    $content = Get-Content $f.FullName -Raw
    $updated = $false
    
    # Todas las referencias de CSS/JS sin ruta deben actualizarse
    if($content -like '*href="tendencias-styles.css"*') {
        $content = $content -replace 'href="tendencias-styles.css"', 'href="../../css/pages/trending.css"'
        $updated = $true
    }
    if($content -like '*href="delete-button-styles.css"*') {
        $content = $content -replace 'href="delete-button-styles.css"', 'href="../../css/components/delete-button.css"'
        $updated = $true
    }
    if($content -like '*href="responsive-improvements.css"*') {
        $content = $content -replace 'href="responsive-improvements.css"', 'href="../../css/responsive/improvements.css"'
        $updated = $true
    }
    if($content -like '*href="mobile-experience.css"*') {
        $content = $content -replace 'href="mobile-experience.css"', 'href="../../css/responsive/mobile.css"'
        $updated = $true
    }
    if($content -like '*href="reporte-detalle.css"*') {
        $content = $content -replace 'href="reporte-detalle.css"', 'href="../../css/pages/detail.css"'
        $updated = $true
    }
    if($content -like '*href="admin-styles.css"*') {
        $content = $content -replace 'href="admin-styles.css"', 'href="../../css/pages/admin.css"'
        $updated = $true
    }
    
    if($updated) {
        Set-Content $f.FullName $content -Force
        Write-Host "  Actualizado: $($f.Name)"
    }
}

Write-Host "Completado" -ForegroundColor Green
