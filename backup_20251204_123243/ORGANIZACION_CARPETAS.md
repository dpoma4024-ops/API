# 📁 REORGANIZACIÓN DEL PROYECTO - Arquitectura de Carpetas

**Fecha:** 2025-12-04  
**Proyecto:** SigmaForo  
**Objetivo:** Mejorar escalabilidad, mantenibilidad y profesionalismo

---

## 1. ESTRUCTURA ACTUAL (Problemas)

```
sigmaforo/
├── 📄 index.html                    ❌ Raíz muy llena (HTML, JS, CSS, docs)
├── 📄 dashboard.html
├── 📄 mapa.html
├── 📄 alertas.html
├── 📄 mis-reportes.html
├── 📄 perfil.html
├── 📄 configuracion.html
├── 📄 reporte-detalle.html
├── 📄 admin-dashboard.html
├── 📄 admin-reports.html
├── 📄 admin-stats.html
├── 📄 admin-users.html
│
├── 📜 app.js                        ❌ Archivos JS en raíz (difícil mantener)
├── 📜 admin-functions.js
├── 📜 mobile-experience.js
├── 📜 perfil-functions.js
├── 📜 mapa-functions.js
├── 📜 tendencias-functions.js
├── 📜 mis-reportes-functions.js
├── 📜 configuracion-functions.js
├── 📜 reporte-detalle.js
├── 📜 notifications.js
│
├── 📋 styles.css                    ❌ Estilos dispersos (7 archivos CSS)
├── 📋 mobile-experience.css
├── 📋 admin-styles.css
├── 📋 tendencias-styles.css
├── 📋 reporte-detalle.css
├── 📋 responsive-improvements.css
├── 📋 delete-button-styles.css
│
├── 🌐 api/                          ✓ Bien, pero sin subcarpetas
│   ├── config.php
│   ├── index.php (router)
│   ├── auth.php
│   ├── reports.php
│   ├── comments.php
│   ├── notifications.php
│   ├── trending.php
│   ├── uploads.php
│   ├── users.php
│   ├── settings.php
│   ├── geocoding.php
│   └── zones.php
│
├── 📚 libs/
│   └── leaflet/                      ✓ Correcto
│
├── 📁 uploads/                       ✓ Correcto
├── 📁 logs/                          ✓ Correcto
│
├── 📄 database.sql                   ⚠️ En raíz (debería estar en /config)
├── 📄 composer.json                  ⚠️ En raíz (ok pero podría estar en /config)
├── 📄 Procfile                       ⚠️ En raíz (para Railway, ok pero mejor en raíz)
│
├── 📚 DOCUMENTACIÓN (8 archivos)     ❌ Docs en raíz (crear /docs/)
│   ├── ANALISIS_PATRONES_DISEÑO.md
│   ├── ARQUITECTURA_CONTENIDO.md
│   ├── ARQUITECTURA_DIAGRAMAS.md
│   ├── ARQUITECTURA_WEB.md
│   ├── INDICE_PATRONES.md
│   ├── PATRONES_EJEMPLOS_CODIGO.md
│   ├── PATRONES_RESUMEN.md
│   └── PATRONES_TABLA_MAESTRA.md
│
└── ❌ PROBLEMAS PRINCIPALES:
    ├─ Raíz congestionada (35+ archivos visibles)
    ├─ Difícil localizar archivos por tipo
    ├─ No hay separación de concerns
    ├─ Escalabilidad comprometida
    ├─ Falta estructura de carpetas lógica
    └─ Documentación sin organizar
```

**Problemas específicos:**
1. **Raíz saturada**: 35+ archivos sin agrupar → confusión
2. **JS sin organización**: 9 archivos JS en raíz → difícil de mantener
3. **CSS disperso**: 7 archivos CSS → conflictos de estilos, duplicación
4. **Sin módulos frontend**: todo global → contaminación namespace
5. **API monolítica**: todos los endpoints en `/api/` sin subcarpetas
6. **Docs mezcladas**: 8 archivos markdown en raíz
7. **Config no centralizada**: `database.sql` en raíz
8. **Sin carpeta de assets**: imágenes, iconos, fuentes en ningún lado

---

## 2. ESTRUCTURA PROPUESTA (Mejorada)

```
sigmaforo/
│
├── 📁 src/                          ← CÓDIGO FUENTE (TODO lo importante)
│   │
│   ├── 📁 frontend/                 ← FRONTEND (HTML, JS, CSS)
│   │   │
│   │   ├── 📁 public/
│   │   │   ├── index.html
│   │   │   └── ...
│   │   │
│   │   ├── 📁 pages/                ← Páginas HTML organizadas
│   │   │   ├── 📁 auth/
│   │   │   │   ├── index.html (login/register)
│   │   │   │   └── styles.css
│   │   │   │
│   │   │   ├── 📁 user/
│   │   │   │   ├── dashboard.html
│   │   │   │   ├── profile.html
│   │   │   │   ├── my-reports.html
│   │   │   │   ├── settings.html
│   │   │   │   └── alerts.html
│   │   │   │
│   │   │   ├── 📁 reports/
│   │   │   │   ├── map.html
│   │   │   │   ├── detail.html
│   │   │   │   └── trending.html
│   │   │   │
│   │   │   └── 📁 admin/
│   │   │       ├── dashboard.html
│   │   │       ├── reports.html
│   │   │       ├── users.html
│   │   │       └── stats.html
│   │   │
│   │   ├── 📁 js/                   ← JavaScript organizado por módulo
│   │   │   ├── 📁 core/             (funcionalidad global)
│   │   │   │   ├── app.js           (inicialización)
│   │   │   │   ├── api.js           (apiRequest centralizado)
│   │   │   │   ├── auth.js          (manejo de autenticación)
│   │   │   │   └── utils.js         (helpers globales)
│   │   │   │
│   │   │   ├── 📁 modules/          (características específicas)
│   │   │   │   ├── reports.js
│   │   │   │   ├── comments.js
│   │   │   │   ├── notifications.js
│   │   │   │   ├── trending.js
│   │   │   │   ├── map.js
│   │   │   │   ├── profile.js
│   │   │   │   ├── settings.js
│   │   │   │   └── admin.js
│   │   │   │
│   │   │   ├── 📁 ui/               (componentes UI reutilizables)
│   │   │   │   ├── modal.js
│   │   │   │   ├── toast.js
│   │   │   │   ├── card.js
│   │   │   │   └── form.js
│   │   │   │
│   │   │   ├── 📁 adapters/         (integraciones externas)
│   │   │   │   ├── leaflet-adapter.js
│   │   │   │   └── cloudinary-adapter.js
│   │   │   │
│   │   │   └── index.js             (entry point)
│   │   │
│   │   ├── 📁 css/                  ← Estilos organizados
│   │   │   ├── 📁 core/
│   │   │   │   ├── reset.css
│   │   │   │   ├── variables.css
│   │   │   │   └── base.css
│   │   │   │
│   │   │   ├── 📁 components/
│   │   │   │   ├── card.css
│   │   │   │   ├── modal.css
│   │   │   │   ├── button.css
│   │   │   │   ├── form.css
│   │   │   │   ├── table.css
│   │   │   │   └── badge.css
│   │   │   │
│   │   │   ├── 📁 layout/
│   │   │   │   ├── header.css
│   │   │   │   ├── footer.css
│   │   │   │   ├── sidebar.css
│   │   │   │   └── grid.css
│   │   │   │
│   │   │   ├── 📁 pages/
│   │   │   │   ├── auth.css
│   │   │   │   ├── dashboard.css
│   │   │   │   ├── admin.css
│   │   │   │   └── map.css
│   │   │   │
│   │   │   ├── 📁 responsive/
│   │   │   │   ├── mobile.css
│   │   │   │   ├── tablet.css
│   │   │   │   └── desktop.css
│   │   │   │
│   │   │   └── style.css            (main, importa todo)
│   │   │
│   │   ├── 📁 assets/               ← Recursos estáticos
│   │   │   ├── 📁 images/
│   │   │   ├── 📁 icons/
│   │   │   ├── 📁 fonts/
│   │   │   └── 📁 svg/
│   │   │
│   │   └── 📁 vendor/               ← Librerías externas
│   │       └── leaflet/
│   │
│   └── 📁 backend/                  ← BACKEND (PHP)
│       │
│       ├── 📁 api/                  ← Endpoints REST (mejorado)
│       │   ├── 📁 controllers/      (manejo de peticiones)
│       │   │   ├── AuthController.php
│       │   │   ├── ReportController.php
│       │   │   ├── CommentController.php
│       │   │   ├── UserController.php
│       │   │   ├── NotificationController.php
│       │   │   ├── TrendingController.php
│       │   │   └── AdminController.php
│       │   │
│       │   ├── 📁 models/           (lógica de datos)
│       │   │   ├── User.php
│       │   │   ├── Report.php
│       │   │   ├── Comment.php
│       │   │   ├── Notification.php
│       │   │   ├── Trend.php
│       │   │   └── BaseModel.php
│       │   │
│       │   ├── 📁 middleware/       (validación, auth, etc)
│       │   │   ├── AuthMiddleware.php
│       │   │   ├── ValidationMiddleware.php
│       │   │   ├── CORSMiddleware.php
│       │   │   └── RateLimiter.php
│       │   │
│       │   ├── 📁 services/         (lógica de negocio)
│       │   │   ├── AuthService.php
│       │   │   ├── ImageService.php (Cloudinary)
│       │   │   ├── GeoService.php   (Nominatim)
│       │   │   ├── NotificationService.php
│       │   │   └── TrendingService.php
│       │   │
│       │   ├── 📁 validators/       (validación de datos)
│       │   │   ├── ReportValidator.php
│       │   │   ├── UserValidator.php
│       │   │   └── BaseValidator.php
│       │   │
│       │   ├── 📁 routes/           (definición de rutas)
│       │   │   ├── api.php
│       │   │   └── admin.php
│       │   │
│       │   ├── 📁 exceptions/       (excepciones personalizadas)
│       │   │   ├── APIException.php
│       │   │   ├── ValidationException.php
│       │   │   └── AuthException.php
│       │   │
│       │   └── index.php            (router principal)
│       │
│       ├── 📁 config/               ← Configuración
│       │   ├── config.php
│       │   ├── database.php
│       │   ├── env.example.php
│       │   └── constants.php
│       │
│       ├── 📁 database/             ← Esquema y migraciones
│       │   ├── schema.sql
│       │   ├── migrations/
│       │   │   ├── 001_create_users.sql
│       │   │   ├── 002_create_reports.sql
│       │   │   └── ...
│       │   └── seeds/
│       │       └── sample_data.sql
│       │
│       ├── 📁 utils/                ← Utilidades comunes
│       │   ├── Logger.php
│       │   ├── Response.php
│       │   ├── JWT.php
│       │   ├── Validator.php
│       │   └── Database.php
│       │
│       └── 📁 tests/                ← Tests (opcional)
│           ├── 📁 unit/
│           ├── 📁 integration/
│           └── phpunit.xml
│
├── 📁 config/                       ← Configuración del proyecto
│   ├── composer.json
│   ├── .env.example
│   ├── .env (git-ignored)
│   └── Procfile                     (Railway)
│
├── 📁 docs/                         ← Documentación
│   ├── 📁 architecture/
│   │   ├── ARQUITECTURA_WEB.md
│   │   ├── ARQUITECTURA_CONTENIDO.md
│   │   ├── ARQUITECTURA_DIAGRAMAS.md
│   │   └── PATRONES_DISEÑO.md
│   │
│   ├── 📁 api/
│   │   ├── ENDPOINTS.md
│   │   ├── AUTHENTICATION.md
│   │   └── EXAMPLES.md
│   │
│   ├── 📁 guides/
│   │   ├── SETUP.md
│   │   ├── DEPLOYMENT.md
│   │   ├── CONTRIBUTING.md
│   │   └── TROUBLESHOOTING.md
│   │
│   └── README.md
│
├── 📁 storage/                      ← Datos dinámicos
│   ├── 📁 uploads/
│   │   └── 📁 reports/
│   ├── 📁 logs/
│   └── 📁 cache/ (opcional)
│
├── 📁 .github/                      ← GitHub específico (opcional)
│   ├── 📁 workflows/
│   │   └── deploy.yml
│   └── 📁 templates/
│       └── ISSUE_TEMPLATE.md
│
├── .gitignore
├── .env.example
├── package.json (si añades JS build tools)
├── README.md
└── LICENSE

```

---

## 3. COMPARACIÓN: ANTES vs DESPUÉS

| Aspecto | ANTES | DESPUÉS |
|---------|-------|---------|
| Archivos en raíz | 35+ | <10 |
| Estructura JS | Plana, global | Módulos, namespaces |
| Estructura CSS | 7 archivos dispersos | Organizado por categoría |
| Búsqueda de archivos | Difícil | Fácil (por carpeta) |
| Escalabilidad | Baja | Alta |
| Mantenibilidad | Media | Alta |
| Colaboración en equipo | Conflictiva | Fácil |
| Separación de concerns | No | Sí |
| Testing | Difícil | Fácil |
| CI/CD | Complicado | Sencillo |

---

## 4. VENTAJAS DE LA NUEVA ESTRUCTURA

### ✅ Escalabilidad
- Fácil agregar nuevas páginas/módulos sin contaminar raíz
- Estructura predecible para nuevos desarrolladores

### ✅ Mantenibilidad
- Código organizado por responsabilidad
- Fácil localizar y modificar funcionalidad

### ✅ Rendimiento
- Modularización permite lazy loading
- Build tools (webpack, vite) pueden optimizar bundles

### ✅ Colaboración
- Menos conflictos en git
- Equipos pueden trabajar en paralelo

### ✅ Testing
- Código modular es más fácil de testear
- Estructura clara para tests unitarios

### ✅ Deployment
- Build process más claro
- Fácil integrar CI/CD (GitHub Actions)

---

## 5. PLAN DE MIGRACIÓN (Paso a Paso)

### Fase 1: Preparación (30 min)
```bash
# 1. Crear nuevas carpetas
mkdir -p src/frontend/pages/{auth,user,reports,admin}
mkdir -p src/frontend/js/{core,modules,ui,adapters}
mkdir -p src/frontend/css/{core,components,layout,pages,responsive}
mkdir -p src/frontend/assets/{images,icons,fonts,svg}
mkdir -p src/frontend/vendor
mkdir -p src/backend/api/{controllers,models,middleware,services,validators,routes,exceptions}
mkdir -p src/backend/config
mkdir -p src/backend/database/{migrations,seeds}
mkdir -p src/backend/utils
mkdir -p src/backend/tests/{unit,integration}
mkdir -p config
mkdir -p docs/{architecture,api,guides}
mkdir -p storage/{uploads/reports,logs,cache}
mkdir -p .github/workflows

# 2. Crear .env.example
cp src/backend/config/config.php src/backend/config/.env.example

# 3. Crear .gitignore (si no existe)
echo "/.env
/storage/uploads/*
/storage/logs/*
/vendor/
/node_modules/
.DS_Store" > .gitignore
```

### Fase 2: Mover Frontend HTML (20 min)
```bash
# Mover index.html → src/frontend/public/
mv index.html src/frontend/public/

# Mover páginas de usuario
mv dashboard.html src/frontend/pages/user/
mv perfil.html src/frontend/pages/user/profile.html
mv mis-reportes.html src/frontend/pages/user/my-reports.html
mv configuracion.html src/frontend/pages/user/settings.html
mv alertas.html src/frontend/pages/user/alerts.html

# Mover páginas de reportes
mv mapa.html src/frontend/pages/reports/map.html
mv reporte-detalle.html src/frontend/pages/reports/detail.html
mv tendencias.html src/frontend/pages/reports/trending.html

# Mover páginas de admin
mv admin-dashboard.html src/frontend/pages/admin/
mv admin-reports.html src/frontend/pages/admin/reports.html
mv admin-users.html src/frontend/pages/admin/users.html
mv admin-stats.html src/frontend/pages/admin/stats.html

# Mover auth (si existe)
mkdir -p src/frontend/pages/auth
touch src/frontend/pages/auth/index.html
```

### Fase 3: Mover Frontend JS (30 min)
```bash
# Núcleo
mv app.js src/frontend/js/core/app.js
# → Crear src/frontend/js/core/api.js (extraer apiRequest de app.js)
# → Crear src/frontend/js/core/auth.js (extraer auth functions)
# → Crear src/frontend/js/core/utils.js (helpers)

# Módulos
mv reports-functions.js src/frontend/js/modules/ 2>/dev/null || touch src/frontend/js/modules/reports.js
mv admin-functions.js src/frontend/js/modules/admin.js
mv mapa-functions.js src/frontend/js/modules/map.js
mv perfil-functions.js src/frontend/js/modules/profile.js
mv mis-reportes-functions.js src/frontend/js/modules/my-reports.js
mv configuracion-functions.js src/frontend/js/modules/settings.js
mv tendencias-functions.js src/frontend/js/modules/trending.js
mv notifications.js src/frontend/js/modules/notifications.js
mv reporte-detalle.js src/frontend/js/modules/comments.js

# UI Components (crear)
touch src/frontend/js/ui/{modal,toast,card,form}.js

# Adapters (mover librerías)
touch src/frontend/js/adapters/{leaflet-adapter,cloudinary-adapter}.js

# Entry point
touch src/frontend/js/index.js
```

### Fase 4: Mover Frontend CSS (20 min)
```bash
# Core
mkdir -p src/frontend/css/core
touch src/frontend/css/core/{reset,variables,base}.css

# Components
mkdir -p src/frontend/css/components
touch src/frontend/css/components/{card,modal,button,form,table,badge}.css

# Layout
mkdir -p src/frontend/css/layout
touch src/frontend/css/layout/{header,footer,sidebar,grid}.css

# Pages
mkdir -p src/frontend/css/pages
touch src/frontend/css/pages/{auth,dashboard,admin,map}.css

# Responsive
mkdir -p src/frontend/css/responsive
touch src/frontend/css/responsive/{mobile,tablet,desktop}.css

# Combinar todos en style.css (main)
cat styles.css > src/frontend/css/style.css

# Mover estilos específicos
mv admin-styles.css src/frontend/css/pages/admin.css
mv mobile-experience.css src/frontend/css/responsive/mobile.css
mv tendencias-styles.css src/frontend/css/pages/trending.css
mv reporte-detalle.css src/frontend/css/pages/detail.css
```

### Fase 5: Mover Backend PHP (15 min)
```bash
# Config
mv api/config.php src/backend/config/
mv database.sql src/backend/database/schema.sql

# API (refactorizar después)
mv api/* src/backend/api/
# Nota: Seguirá siendo monolítico por ahora, se refactoriza después

# Utils
touch src/backend/utils/{Logger,Response,JWT,Database}.php
```

### Fase 6: Mover Documentación (5 min)
```bash
mv ARQUITECTURA*.md docs/architecture/
mv PATRONES*.md docs/architecture/
mv INDICE_PATRONES.md docs/architecture/
touch docs/README.md
touch docs/api/ENDPOINTS.md
touch docs/guides/{SETUP,DEPLOYMENT,CONTRIBUTING}.md
```

### Fase 7: Mover Librerías (5 min)
```bash
mv libs/leaflet src/frontend/vendor/
```

### Fase 8: Actualizar rutas en archivos

**Actualizar paths en HTML** (ejemplo):
```html
<!-- ANTES -->
<script src="app.js"></script>

<!-- DESPUÉS -->
<script src="../../js/core/app.js"></script>
```

**Actualizar paths en JS** (ejemplo):
```javascript
// ANTES
const data = await apiRequest('reports.php?action=list');

// DESPUÉS (sin cambio, pero si usas bundler)
import { apiRequest } from '../core/api.js';
```

**Actualizar paths en PHP** (ejemplo):
```php
// ANTES
include 'config.php';

// DESPUÉS
include __DIR__ . '/../config/config.php';
```

---

## 6. CAMBIOS EN index.php (Router)

**ANTES:**
```php
<?php
header("Content-Type: application/json");
echo json_encode(["status" => "online"]);
```

**DESPUÉS:**
```php
<?php
define('BASE_PATH', __DIR__);
define('SIGMAFORO_API', true);

require_once BASE_PATH . '/../config/config.php';
require_once BASE_PATH . '/routes/api.php';

// Routing automático hacia controllers
$action = $_GET['action'] ?? 'list';
$resource = basename($_SERVER['REQUEST_URI'], '.php');

// Ejemplo: /api/reports.php?action=list → ReportController::list()
```

---

## 7. .gitignore Actualizado

```
# Env
.env
.env.local

# Vendor
/vendor/
/node_modules/

# Storage
/storage/uploads/
/storage/logs/
/storage/cache/

# OS
.DS_Store
Thumbs.db
*.swp
*.swo

# IDE
.vscode/
.idea/
*.code-workspace

# Testing
/coverage/

# Builds
/dist/
/build/
```

---

## 8. Estructura de URLs (Ejemplos)

**ANTES:**
```
http://localhost/api/reports.php?action=list
http://localhost/dashboard.html
http://localhost/mapa.html
```

**DESPUÉS** (lo mismo pero organizado):
```
http://localhost/src/backend/api/index.php?resource=reports&action=list
http://localhost/src/frontend/pages/user/dashboard.html
http://localhost/src/frontend/pages/reports/map.html
```

> **Nota:** Si usas Apache con mod_rewrite, puedes limpiar URLs:
> ```
> GET /api/reports/list → /src/backend/api/index.php
> ```

---

## 9. Beneficios Inmediatos

✅ **Raíz limpia**: 35 → <10 archivos visibles  
✅ **Fácil navegación**: estructura lógica  
✅ **Preparado para escala**: agregar features sin caos  
✅ **Mejor git workflow**: menos conflictos  
✅ **Fácil onboarding**: nuevos devs entienden rápido  

---

## 10. Próximos Pasos (Opcional, Futuro)

- [ ] **Module Bundler**: Webpack/Vite para agrupar JS y CSS
- [ ] **Build System**: npm scripts para minificar/optimizar
- [ ] **Testing**: PHPUnit (backend), Jest (frontend)
- [ ] **CI/CD**: GitHub Actions auto-deploy
- [ ] **Refactor Backend**: Controllers, Models, Services (OOP)
- [ ] **Package Manager**: Composer para PHP, npm para JS
- [ ] **Environment Config**: .env para secrets

---

**¿Listo para reorganizar? ¿Necesitas que cree un script automático o hacemos paso a paso?**

