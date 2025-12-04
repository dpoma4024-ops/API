# Script para auditar y corregir todas las rutas en el proyecto

$root = "C:\xampp\htdocs\sigmaforo"

Write-Host "AUDITORIA DE RUTAS - SIGMAFORO" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""

# ===== VERIFICAR ARCHIVOS CSS EXISTEN =====
Write-Host "Verificando archivos CSS..." -ForegroundColor Yellow
$cssExpected = @(
    "src/frontend/css/style.css",
    "src/frontend/css/pages/admin.css",
    "src/frontend/css/pages/detail.css",
    "src/frontend/css/pages/trending.css",
    "src/frontend/css/responsive/mobile.css",
    "src/frontend/css/responsive/improvements.css",
    "src/frontend/css/components/delete-button.css"
)

foreach($css in $cssExpected) {
    $path = "$root\$($css -replace '/', '\')"
    if(Test-Path $path) {
        Write-Host "  [OK] $css" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $css" -ForegroundColor Red
    }
}

# ===== VERIFICAR ARCHIVOS JS EXISTEN =====
Write-Host ""
Write-Host "Verificando archivos JavaScript..." -ForegroundColor Yellow
$jsExpected = @(
    "src/frontend/js/core/app.js",
    "src/frontend/js/modules/admin.js",
    "src/frontend/js/modules/map.js",
    "src/frontend/js/modules/profile.js",
    "src/frontend/js/modules/my-reports.js",
    "src/frontend/js/modules/settings.js",
    "src/frontend/js/modules/trending.js",
    "src/frontend/js/modules/notifications.js",
    "src/frontend/js/modules/comments.js",
    "src/frontend/js/modules/mobile.js"
)

foreach($js in $jsExpected) {
    $path = "$root\$($js -replace '/', '\')"
    if(Test-Path $path) {
        Write-Host "  [OK] $js" -ForegroundColor Green
    } else {
        Write-Host "  [FALTA] $js" -ForegroundColor Red
    }
}

# ===== BUSCAR REFERENCIAS ROTAS EN HTML =====
Write-Host ""
Write-Host "Buscando referencias de archivos que no existen en HTML..." -ForegroundColor Yellow

$htmlFiles = Get-ChildItem "$root\src\frontend\pages" -Filter "*.html" -Recurse

$brokenRefs = @()

foreach($html in $htmlFiles) {
    $content = Get-Content $html.FullName -Raw
    
    # Buscar referencias a archivos que no están en la nueva ruta
    if($content -match 'href="[^"]*\.css"' -or $content -match 'src="[^"]*\.js"') {
        $matches = [regex]::Matches($content, '(?:href|src)="([^"]+\.(?:css|js))"')
        
        foreach($match in $matches) {
            $ref = $match.Groups[1].Value
            
            # Ignorar URLs externas
            if($ref -like "http*" -or $ref -like "*unpkg*" -or $ref -like "*leaflet*") {
                continue
            }
            
            # Ignorar referencias correctas (que contienen ../)
            if($ref -like "*../css/*" -or $ref -like "*../js/*") {
                continue
            }
            
            # Si no empieza con ../ es que está mal
            if($ref -notlike "../*") {
                $brokenRefs += @{
                    file = $html.Name
                    ref = $ref
                }
            }
        }
    }
}

if($brokenRefs.Count -gt 0) {
    Write-Host "  REFERENCIAS ROTAS ENCONTRADAS:" -ForegroundColor Red
    foreach($ref in $brokenRefs) {
        Write-Host "    - $($ref.file): $($ref.ref)" -ForegroundColor Red
    }
} else {
    Write-Host "  [OK] No hay referencias rotas" -ForegroundColor Green
}

# ===== RESUMEN =====
Write-Host ""
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "CSS archivos: $($cssExpected.Count)" -ForegroundColor Green
Write-Host "JS archivos: $($jsExpected.Count)" -ForegroundColor Green
Write-Host "HTML archivos: $($htmlFiles.Count)" -ForegroundColor Green
Write-Host "Referencias rotas: $($brokenRefs.Count)" -ForegroundColor $(if($brokenRefs.Count -eq 0) {"Green"} else {"Red"})
Write-Host "=================================" -ForegroundColor Cyan
