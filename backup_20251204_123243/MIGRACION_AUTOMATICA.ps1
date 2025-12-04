param([switch]$DryRun)

$root = $PSScriptRoot
$backup = "$root\backup_$(Get-Date -Format 'yyyyMMdd_HHmmss')"

Write-Host "MIGRACION AUTOMATICA - SIGMAFORO" -ForegroundColor Cyan
Write-Host "Modo: $(if($DryRun){'SIMULACION'}else{'REAL'})" -ForegroundColor Yellow
Write-Host ""

# Crear carpetas
$folders = @(
    "src/frontend/public", "src/frontend/pages/auth", "src/frontend/pages/user",
    "src/frontend/pages/reports", "src/frontend/pages/admin",
    "src/frontend/js/core", "src/frontend/js/modules", "src/frontend/js/ui",
    "src/frontend/css/core", "src/frontend/css/components", "src/frontend/css/layout",
    "src/frontend/css/pages", "src/frontend/css/responsive", "src/frontend/assets/images",
    "src/backend/api/controllers", "src/backend/api/models", "src/backend/api/middleware",
    "src/backend/api/services", "src/backend/api/validators", "src/backend/config",
    "src/backend/database/migrations", "src/backend/database/seeds", "src/backend/utils",
    "config", "docs/architecture", "docs/api", "docs/guides", "storage/uploads/reports",
    "storage/logs"
)

Write-Host "Creando carpetas..."
foreach($f in $folders) {
    $path = "$root\$f"
    if(-not (Test-Path $path)) {
        if(-not $DryRun) { mkdir $path -Force | Out-Null }
        Write-Host "  $f"
    }
}

# Crear backup
if(-not $DryRun) {
    Write-Host ""
    Write-Host "Creando backup en: $backup"
    mkdir $backup -Force | Out-Null
    $files = Get-ChildItem $root -File -Recurse | Where-Object { $_.FullName -notlike "*src*" -and $_.FullName -notlike "*backup*" -and $_.FullName -notlike "*.git*" }
    foreach($f in $files) {
        $rel = $f.FullName.Substring($root.Length + 1)
        $dst = "$backup\$rel"
        $dir = Split-Path $dst
        mkdir $dir -Force | Out-Null
        Copy-Item $f.FullName $dst -Force
    }
    Write-Host "  Backup completado"
}

# Mover HTML
$htmlMoves = @(
    "index.html|src/frontend/public/index.html",
    "dashboard.html|src/frontend/pages/user/dashboard.html",
    "perfil.html|src/frontend/pages/user/profile.html",
    "mis-reportes.html|src/frontend/pages/user/my-reports.html",
    "configuracion.html|src/frontend/pages/user/settings.html",
    "alertas.html|src/frontend/pages/user/alerts.html",
    "mapa.html|src/frontend/pages/reports/map.html",
    "reporte-detalle.html|src/frontend/pages/reports/detail.html",
    "admin-dashboard.html|src/frontend/pages/admin/dashboard.html",
    "admin-reports.html|src/frontend/pages/admin/reports.html",
    "admin-users.html|src/frontend/pages/admin/users.html",
    "admin-stats.html|src/frontend/pages/admin/stats.html"
)

Write-Host ""
Write-Host "Moviendo HTML..."
foreach($move in $htmlMoves) {
    $src, $dst = $move -split '\|'
    $srcPath = "$root\$src"
    $dstPath = "$root\$dst"
    if(Test-Path $srcPath) {
        if(-not $DryRun) { Move-Item $srcPath $dstPath -Force }
        Write-Host "  $src"
    }
}

# Mover JS
$jsMoves = @(
    "app.js|src/frontend/js/core/app.js",
    "admin-functions.js|src/frontend/js/modules/admin.js",
    "mapa-functions.js|src/frontend/js/modules/map.js",
    "perfil-functions.js|src/frontend/js/modules/profile.js",
    "mis-reportes-functions.js|src/frontend/js/modules/my-reports.js",
    "configuracion-functions.js|src/frontend/js/modules/settings.js",
    "tendencias-functions.js|src/frontend/js/modules/trending.js",
    "notifications.js|src/frontend/js/modules/notifications.js",
    "reporte-detalle.js|src/frontend/js/modules/comments.js",
    "mobile-experience.js|src/frontend/js/modules/mobile.js"
)

Write-Host ""
Write-Host "Moviendo JavaScript..."
foreach($move in $jsMoves) {
    $src, $dst = $move -split '\|'
    $srcPath = "$root\$src"
    $dstPath = "$root\$dst"
    if(Test-Path $srcPath) {
        if(-not $DryRun) { Move-Item $srcPath $dstPath -Force }
        Write-Host "  $src"
    }
}

# Mover CSS
$cssMoves = @(
    "styles.css|src/frontend/css/style.css",
    "admin-styles.css|src/frontend/css/pages/admin.css",
    "mobile-experience.css|src/frontend/css/responsive/mobile.css",
    "tendencias-styles.css|src/frontend/css/pages/trending.css",
    "reporte-detalle.css|src/frontend/css/pages/detail.css",
    "responsive-improvements.css|src/frontend/css/responsive/improvements.css",
    "delete-button-styles.css|src/frontend/css/components/delete-button.css"
)

Write-Host ""
Write-Host "Moviendo CSS..."
foreach($move in $cssMoves) {
    $src, $dst = $move -split '\|'
    $srcPath = "$root\$src"
    $dstPath = "$root\$dst"
    if(Test-Path $srcPath) {
        if(-not $DryRun) { Move-Item $srcPath $dstPath -Force }
        Write-Host "  $src"
    }
}

# Mover archivos API
Write-Host ""
Write-Host "Moviendo archivos API..."
$apiDir = "$root\api"
if(Test-Path $apiDir) {
    $apiFiles = Get-ChildItem $apiDir -File
    foreach($f in $apiFiles) {
        $dst = "$root\src\backend\api\$($f.Name)"
        if(-not $DryRun) { Move-Item $f.FullName $dst -Force }
        Write-Host "  $($f.Name)"
    }
}

# Mover documentacion
Write-Host ""
Write-Host "Moviendo documentacion..."
$docs = Get-ChildItem $root -Filter "*.md" -File | Where-Object { $_.Name -like "ARQUITECTURA*" -or $_.Name -like "PATRONES*" -or $_.Name -eq "INDICE_PATRONES.md" }
foreach($doc in $docs) {
    $dst = "$root\docs\architecture\$($doc.Name)"
    if(-not $DryRun) { Move-Item $doc.FullName $dst -Force }
    Write-Host "  $($doc.Name)"
}

# Actualizar HTML
if(-not $DryRun) {
    Write-Host ""
    Write-Host "Actualizando referencias HTML..."
    $htmlFiles = Get-ChildItem "$root\src\frontend\pages" -Filter "*.html" -Recurse
    foreach($f in $htmlFiles) {
        $content = Get-Content $f.FullName -Raw
        
        # Actualizar rutas
        $content = $content -replace 'href="styles.css"', 'href="../../css/style.css"'
        $content = $content -replace 'href="admin-styles.css"', 'href="../../css/pages/admin.css"'
        $content = $content -replace 'src="app.js"', 'src="../../js/core/app.js"'
        $content = $content -replace 'src="admin-functions.js"', 'src="../../js/modules/admin.js"'
        $content = $content -replace 'src="mobile-experience.js"', 'src="../../js/modules/mobile.js"'
        $content = $content -replace 'src="tendencias-functions.js"', 'src="../../js/modules/trending.js"'
        $content = $content -replace 'src="notifications.js"', 'src="../../js/modules/notifications.js"'
        $content = $content -replace 'src="reporte-detalle.js"', 'src="../../js/modules/comments.js"'
        
        Set-Content $f.FullName $content -Force
        Write-Host "  $($f.Name)"
    }
}

# Actualizar PHP
if(-not $DryRun) {
    Write-Host ""
    Write-Host "Actualizando referencias PHP..."
    $phpFiles = Get-ChildItem "$root\src\backend\api" -Filter "*.php" -File
    foreach($f in $phpFiles) {
        $content = Get-Content $f.FullName -Raw
        
        # Actualizar rutas
        $content = $content -replace "require_once 'config.php'", "require_once __DIR__ . '/../config/config.php'"
        $content = $content -replace 'include "config.php"', 'include __DIR__ . "/../config/config.php"'
        $content = $content -replace "include 'config.php'", "include __DIR__ . '/../config/config.php'"
        
        Set-Content $f.FullName $content -Force
        Write-Host "  $($f.Name)"
    }
}

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
if($DryRun) {
    Write-Host "SIMULACION COMPLETADA - Sin cambios reales" -ForegroundColor Yellow
    Write-Host "Ejecuta sin -DryRun para aplicar cambios" -ForegroundColor Yellow
} else {
    Write-Host "MIGRACION COMPLETADA" -ForegroundColor Green
    Write-Host "Backup: $backup" -ForegroundColor Green
}
Write-Host "============================================" -ForegroundColor Green
