# 🚀 SCRIPT DE MIGRACIÓN AUTOMÁTICA

## ¿Qué hace este script?

El script `MIGRACION_AUTOMATICA.ps1` automatiza completamente la reorganización del proyecto:

### ✅ Tareas automáticas:

1. **Crea estructura de carpetas** (40+ carpetas nuevas)
2. **Mueve archivos HTML** (12 archivos → nuevas carpetas)
3. **Mueve archivos JS** (9 archivos → subcarpetas por módulo)
4. **Mueve archivos CSS** (7 archivos → carpetas organizadas)
5. **Mueve archivos PHP** (backend → nueva estructura)
6. **Mueve documentación** (8 MD files → docs/)
7. **Actualiza TODAS las rutas** en HTML, JS y PHP automáticamente
8. **Crea backup** de todos los archivos (por si falla algo)

---

## 📋 ANTES DE EJECUTAR

### Requisitos:
- Windows con PowerShell 5.1+ (incluido en Windows 10/11)
- XAMPP funcionando (opcional, solo si tienes servidor corriendo)
- Git (opcional, pero recomendado para estar seguro)

### Recomendaciones:
1. **Commit a git** antes de ejecutar (para poder rollback):
   ```powershell
   git add -A
   git commit -m "Pre-migración: backup antes de reorganizar"
   ```

2. **Cierra VS Code** (o al menos cierra archivos de este proyecto)

3. **Prueba en DRY-RUN** primero (sin cambios reales)

---

## 🎯 CÓMO USAR

### Opción 1: SIMULACIÓN (RECOMENDADO PRIMERO)

Prueba el script sin hacer cambios reales:

```powershell
cd C:\xampp\htdocs\sigmaforo
.\MIGRACION_AUTOMATICA.ps1 -DryRun
```

**Salida esperada:**
```
============================================
🔄 MIGRACIÓN AUTOMÁTICA - SIGMAFORO
============================================

📁 Proyecto: C:\xampp\htdocs\sigmaforo
🔒 Modo: SIMULACIÓN (sin cambios)
💾 Backup: C:\xampp\htdocs\sigmaforo\backup_20241204_120000

[12:00:01] [INFO] Creando estructura de carpetas...
  [SIMULAR] Crear: src\frontend\public
  [SIMULAR] Crear: src\frontend\pages\auth
  ...
  
[12:00:02] [INFO] Moviendo archivos Frontend...
  [SIMULAR] index.html → src\frontend\public\index.html
  [SIMULAR] dashboard.html → src\frontend\pages\user\dashboard.html
  ...

✅ MIGRACIÓN COMPLETADA
```

Si el resultado se ve bien, procede al Paso 2.

---

### Opción 2: EJECUCIÓN REAL

Ejecuta la migración de verdad:

```powershell
cd C:\xampp\htdocs\sigmaforo
.\MIGRACION_AUTOMATICA.ps1
```

**Lo que pasará:**
1. ✅ Se crea backup automático en `backup_YYYYMMDD_HHMMSS/`
2. ✅ Se crean todas las carpetas
3. ✅ Se mueven todos los archivos
4. ✅ Se actualizan todas las rutas
5. ✅ Fin: proyecto completamente reorganizado

**Salida esperada:**
```
✅ MIGRACIÓN COMPLETADA
============================================
✓ Backup disponible en: C:\xampp\htdocs\sigmaforo\backup_20241204_120000
✓ Estructura reorganizada
✓ Rutas actualizadas
```

---

## 🔍 VERIFICACIÓN POST-MIGRACIÓN

Después de ejecutar, verifica que todo se reorganizó correctamente:

### 1. Verifica la nueva estructura:
```powershell
Tree /L C:\xampp\htdocs\sigmaforo\src /F | Select-Object -First 50
```

Deberías ver:
```
├── frontend/
│   ├── public/
│   │   └── index.html ✓
│   ├── pages/
│   │   ├── user/
│   │   │   ├── dashboard.html ✓
│   │   │   └── ...
│   ├── js/
│   │   ├── core/
│   │   │   └── app.js ✓
│   │   └── modules/
│   ├── css/
│   └── assets/
└── backend/
    └── api/
        ├── auth.php ✓
        └── ...
```

### 2. Verifica que las rutas se actualizaron:
```powershell
# Busca referencias viejas (no debería encontrar nada)
Select-String -Path "C:\xampp\htdocs\sigmaforo\src\**\*.html" -Pattern "admin-functions.js" -ErrorAction SilentlyContinue

# Busca referencias nuevas (debería encontrar)
Select-String -Path "C:\xampp\htdocs\sigmaforo\src\**\*.html" -Pattern "js/modules/admin.js" -ErrorAction SilentlyContinue
```

### 3. Abre en VS Code y navega:
```powershell
code C:\xampp\htdocs\sigmaforo
```

En VS Code, expande `src/` y verifica la estructura.

---

## ⚠️ SI ALGO SALE MAL

### Opción 1: Rollback automático
Si la migración falla, no se hicieron cambios (excepto el backup).

### Opción 2: Restaurar desde backup
```powershell
# Lista backups disponibles
Get-ChildItem C:\xampp\htdocs\sigmaforo\backup_* -Directory | Sort-Object CreationTime -Descending

# Restaurar (ajusta el nombre del backup)
Copy-Item C:\xampp\htdocs\sigmaforo\backup_20241204_120000\* C:\xampp\htdocs\sigmaforo\src -Recurse -Force
```

### Opción 3: Git rollback (si hiciste commit)
```powershell
git reset --hard HEAD~1
```

---

## 📊 CAMBIOS REALIZADOS POR EL SCRIPT

### Archivos movidos:

| Archivo | Desde | Hacia |
|---------|-------|-------|
| index.html | `/` | `src/frontend/public/` |
| dashboard.html | `/` | `src/frontend/pages/user/` |
| admin-functions.js | `/` | `src/frontend/js/modules/admin.js` |
| styles.css | `/` | `src/frontend/css/style.css` |
| api/config.php | `/api/` | `src/backend/api/` |
| ARQUITECTURA*.md | `/` | `docs/architecture/` |

### Rutas actualizadas automáticamente:

**HTML antes:**
```html
<link rel="stylesheet" href="styles.css">
<script src="app.js"></script>
<a href="dashboard.html">
```

**HTML después:**
```html
<link rel="stylesheet" href="../../css/style.css">
<script src="../../js/core/app.js"></script>
<a href="../../../pages/user/dashboard.html">
```

**PHP antes:**
```php
require_once 'config.php';
```

**PHP después:**
```php
require_once __DIR__ . '/../config/config.php';
```

---

## 🎓 PRÓXIMOS PASOS DESPUÉS DE LA MIGRACIÓN

### Paso 1: Actualizar configuración global

En `src/backend/config/config.php`, al principio añade:
```php
<?php
// Definir rutas base del proyecto
define('PROJECT_ROOT', dirname(__DIR__, 2));
define('APP_URL', $_SERVER['REQUEST_SCHEME'] . '://' . $_SERVER['HTTP_HOST']);
define('API_URL', APP_URL . '/src/backend/api/');
```

### Paso 2: Actualizar index.html

En `src/frontend/public/index.html`, al inicio del `<body>` añade:
```html
<script>
    // Definir URL base para API calls
    window.API_BASE = '/src/backend/api/';
    window.APP_ROOT = '/src/frontend/';
</script>
```

### Paso 3: Actualizar app.js

En `src/frontend/js/core/app.js`, actualiza `apiRequest()`:
```javascript
async function apiRequest(endpoint, options = {}) {
    const url = window.API_BASE + endpoint;  // ← Usa URL base global
    
    // ... resto del código
}
```

### Paso 4: Actualizar .htaccess (si usas Apache)

Crea `src/backend/api/.htaccess`:
```
<IfModule mod_rewrite.c>
    RewriteEngine On
    RewriteBase /src/backend/api/
    RewriteCond %{REQUEST_FILENAME} !-f
    RewriteCond %{REQUEST_FILENAME} !-d
    RewriteRule ^(.*)$ index.php?request=$1 [QSA,L]
</IfModule>
```

---

## 📝 NOTAS IMPORTANTES

1. **El script es idempotente**: Puedes ejecutarlo varias veces sin problemas
2. **Crea backup automático**: Todos tus archivos originales se guardan en `backup_*/`
3. **Actualiza rutas inteligentemente**: Calcula profundidades automáticamente
4. **No toca .git**: Tu repositorio git permanece intacto
5. **Compatible con XAMPP**: Las nuevas rutas funcionan con Apache local

---

## 🐛 TROUBLESHOOTING

### Q: El script dice "Permission denied"
```powershell
# Ejecuta como administrador:
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

### Q: El script no encuentra archivos
```powershell
# Verifica que estés en el directorio correcto
Get-Location  # Debería ser: C:\xampp\htdocs\sigmaforo
```

### Q: Falta algún archivo después de migrar
```powershell
# Revisa el backup:
ls C:\xampp\htdocs\sigmaforo\backup_*/
```

### Q: Las rutas siguen siendo incorrectas
```powershell
# Ejecuta la actualización manual:
.\MIGRACION_AUTOMATICA.ps1 -Verbose
# Y revisa los mensajes de DEBUG
```

---

## 📞 SOPORTE

Si algo falla:
1. Revisa el archivo de log (output del script)
2. Compara con el backup en `backup_*/`
3. Usa git rollback: `git reset --hard HEAD~1`
4. Vuelve a intentar o pregunta

---

**¿Listo? Ejecuta:** 
```powershell
.\MIGRACION_AUTOMATICA.ps1 -DryRun
```

