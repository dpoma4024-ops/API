# 🏗️ ARQUITECTURA WEB - SigmaForo

## 📐 Diagrama General de la Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         CAPA CLIENTE (FRONTEND)                         │
│                                                                         │
│  index.html ─────────────┐                                             │
│  dashboard.html          │    HTML Pages                              │
│  mapa.html               │   (9 páginas)                              │
│  admin-dashboard.html ───┘                                             │
│          ↓                                                              │
│  ┌─────────────────────────────────────────────────────────┐           │
│  │              FRONTEND JAVASCRIPT LAYER                 │           │
│  │                                                         │           │
│  │  ┌─────────────────────────────────────────────────┐   │           │
│  │  │  app.js (Core - 1307 líneas)                   │   │           │
│  │  │  ├─ Authentication                            │   │           │
│  │  │  ├─ Reports Management                        │   │           │
│  │  │  ├─ Modal Management                          │   │           │
│  │  │  ├─ Toast Notifications                       │   │           │
│  │  │  └─ Utility Functions                         │   │           │
│  │  └─────────────────────────────────────────────────┘   │           │
│  │                                                         │           │
│  │  ┌─────────────┬──────────────┬─────────────────────┐  │           │
│  │  │ Mobile UX   │ Admin Panel  │ User Features      │  │           │
│  │  ├─────────────┼──────────────┼─────────────────────┤  │           │
│  │  │ mobile-     │ admin-       │ perfil-functions   │  │           │
│  │  │ experience. │ functions.js │ mis-reportes-      │  │           │
│  │  │ js          │              │ functions.js       │  │           │
│  │  │             │              │ configuracion-     │  │           │
│  │  │             │              │ functions.js       │  │           │
│  │  │             │              │ tendencias-        │  │           │
│  │  │             │              │ functions.js       │  │           │
│  │  │             │              │ mapa-functions.js  │  │           │
│  │  │             │              │ notifications.js   │  │           │
│  │  │             │              │ reporte-detalle.js │  │           │
│  │  └─────────────┴──────────────┴─────────────────────┘  │           │
│  │                                                         │           │
│  │  ┌────────────────────────────────────────────────┐    │           │
│  │  │  CSS STYLING LAYER                           │    │           │
│  │  │  ├─ styles.css (Base)                        │    │           │
│  │  │  ├─ mobile-experience.css (Mobile)           │    │           │
│  │  │  ├─ admin-styles.css (Admin Panel)           │    │           │
│  │  │  ├─ tendencias-styles.css (Trending)         │    │           │
│  │  │  ├─ reporte-detalle.css (Report Detail)      │    │           │
│  │  │  ├─ delete-button-styles.css (Components)    │    │           │
│  │  │  └─ responsive-improvements.css (Responsive) │    │           │
│  │  └────────────────────────────────────────────────┘    │           │
│  │                                                         │           │
│  │  ┌────────────────────────────────────────────────┐    │           │
│  │  │  EXTERNAL LIBRARIES                          │    │           │
│  │  │  └─ Leaflet.js (Maps)                        │    │           │
│  │  └────────────────────────────────────────────────┘    │           │
│  └─────────────────────────────────────────────────────────┘           │
│                           ↓                                            │
│                   HTTP/HTTPS (REST API)                               │
│                           ↓                                            │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                      CAPA SERVIDOR (BACKEND)                           │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │             API REST LAYER (PHP)                                │  │
│  │                                                                 │  │
│  │  /api/index.php (Router)                                       │  │
│  │      ↓                                                          │  │
│  │  ┌────────────────────────────────────────────────────────┐   │  │
│  │  │  Endpoints Principales                               │   │  │
│  │  ├─────────────────────────────────────────────────────┤   │  │
│  │  │ auth.php           → Autenticación                  │   │  │
│  │  │ reports.php        → Gestión de reportes            │   │  │
│  │  │ comments.php       → Comentarios                    │   │  │
│  │  │ notifications.php  → Notificaciones                 │   │  │
│  │  │ trending.php       → Tendencias (Hashtags)         │   │  │
│  │  │ uploads.php        → Subida de imágenes            │   │  │
│  │  │ users.php          → Gestión de usuarios           │   │  │
│  │  │ settings.php       → Configuración de usuario       │   │  │
│  │  │ geocoding.php      → Geocodificación               │   │  │
│  │  │ zones.php          → Zonas/Áreas                   │   │  │
│  │  └────────────────────────────────────────────────────┘   │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐  │  │
│  │  │  config.php (Configuración centralizada)           │  │  │
│  │  │  ├─ Base de datos (MySQL)                         │  │  │
│  │  │  ├─ JWT Authentication                           │  │  │
│  │  │  ├─ Cloudinary Configuration                     │  │  │
│  │  │  ├─ File Upload Settings                         │  │  │
│  │  │  └─ Application Constants                        │  │  │
│  │  └──────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                           ↓                                         │
│                   MySQL Database Connection                        │
│                           ↓                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                       CAPA PERSISTENCIA (DATA)                         │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              MYSQL DATABASE (Railway)                           │  │
│  │                                                                 │  │
│  │  Database: railway (UTF8MB4)                                  │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  TABLAS PRINCIPALES                                   │  │  │
│  │  ├─────────────────────────────────────────────────────────┤  │  │
│  │  │ usuarios                  (Authentication + Profile)   │  │  │
│  │  │ reportes                  (Core Data)                  │  │  │
│  │  │ comentarios               (Interactions)              │  │  │
│  │  │ likes_reportes            (Voting)                    │  │  │
│  │  │ notificaciones            (Notifications)            │  │  │
│  │  │ configuracion_usuario     (Settings)                 │  │  │
│  │  │ archivos_subidos          (File Management)          │  │  │
│  │  │ tendencias_hashtags       (Trending Content)         │  │  │
│  │  │ seguimientos              (Follow System)            │  │  │
│  │  │ zonas_geocoding           (Geographic Data)          │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  │                                                                 │  │
│  │  ┌─────────────────────────────────────────────────────────┐  │  │
│  │  │  ÍNDICES OPTIMIZADOS                                  │  │  │
│  │  ├─────────────────────────────────────────────────────────┤  │  │
│  │  │ idx_user (usuarios)                                   │  │  │
│  │  │ idx_status (reportes)                                 │  │  │
│  │  │ idx_category (reportes)                               │  │  │
│  │  │ idx_fecha_creacion (reportes)                         │  │  │
│  │  │ idx_reporte (comentarios, likes)                      │  │  │
│  │  └─────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │              EXTERNAL SERVICES                                  │  │
│  ├──────────────────────────────────────────────────────────────────┤  │
│  │ Cloudinary (Image Storage & CDN)                               │  │
│  │ ├─ Cloud: dzclcz5hn                                           │  │
│  │ └─ URL: https://res.cloudinary.com/...                       │  │
│  │                                                                 │  │
│  │ OpenStreetMap / Nominatim (Geocoding)                         │  │
│  │ ├─ Reverse Geocoding                                         │  │
│  │ └─ Map Tiles                                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🗂️ Estructura de Carpetas

```
sigmaforo/
├── 📄 index.html                    # Landing page
├── 📄 dashboard.html                # Dashboard principal
├── 📄 mapa.html                     # Mapa de reportes
├── 📄 alertas.html                  # Notificaciones
├── 📄 mis-reportes.html             # Mis reportes
├── 📄 perfil.html                   # Perfil usuario
├── 📄 configuracion.html            # Configuración
├── 📄 tendencias.html               # Tendencias
├── 📄 reporte-detalle.html          # Detalle de reporte
│
├── 📁 admin/                        # Panel administrativo
│   ├── 📄 admin-dashboard.html
│   ├── 📄 admin-reports.html
│   ├── 📄 admin-stats.html
│   └── 📄 admin-users.html
│
├── 🔧 JAVASCRIPT
│   ├── 📜 app.js                    # Core (1307 líneas)
│   ├── 📜 mobile-experience.js      # Mobile UX (514 líneas)
│   ├── 📜 admin-functions.js        # Admin Panel (1366 líneas)
│   ├── 📜 perfil-functions.js
│   ├── 📜 mis-reportes-functions.js
│   ├── 📜 configuracion-functions.js
│   ├── 📜 mapa-functions.js
│   ├── 📜 tendencias-functions.js
│   ├── 📜 notifications.js
│   └── 📜 reporte-detalle.js
│
├── 🎨 STYLING
│   ├── 📋 styles.css                # Base styles
│   ├── 📋 mobile-experience.css     # Mobile responsive
│   ├── 📋 admin-styles.css          # Admin panel
│   ├── 📋 tendencias-styles.css     # Trending section
│   ├── 📋 reporte-detalle.css       # Report detail
│   ├── 📋 responsive-improvements.css
│   └── 📋 delete-button-styles.css
│
├── 📚 LIBRERÍAS
│   └── 📁 libs/
│       └── 📁 leaflet/
│           ├── leaflet.js
│           ├── leaflet.css
│           └── images/
│
├── 🌐 API
│   └── 📁 api/
│       ├── 📝 config.php            # Configuración (472 líneas)
│       ├── 📝 index.php             # Router
│       ├── 📝 auth.php              # Autenticación
│       ├── 📝 reports.php           # Reportes
│       ├── 📝 comments.php          # Comentarios
│       ├── 📝 notifications.php     # Notificaciones
│       ├── 📝 trending.php          # Tendencias
│       ├── 📝 uploads.php           # Subida de archivos
│       ├── 📝 users.php             # Usuarios
│       ├── 📝 settings.php          # Configuración
│       ├── 📝 geocoding.php         # Geocodificación
│       └── 📝 zones.php             # Zonas
│
├── 📊 DATABASE
│   └── database.sql                 # Database schema (609 líneas)
│
├── 📁 uploads/                      # Uploaded files
├── 📁 logs/                         # Application logs
│
└── 📄 Otros
    ├── composer.json
    ├── Procfile                     # Heroku/Railway config
    └── estructura.txt
```

---

## 🔄 Flujo de Datos (Data Flow)

### 1. Petición de Usuario → API → Base de Datos → Respuesta

```
┌─────────────────────────────────────────────────────┐
│  CLIENTE (Browser)                                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Usuario hace clic en "Crear Reporte"     │  │
│  │  2. app.js captura el evento                 │  │
│  │  3. Valida datos                             │  │
│  │  4. apiRequest("reports.php?action=create")  │  │
│  │  5. Envía JSON con datos del reporte         │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓ HTTP POST
┌─────────────────────────────────────────────────────┐
│  SERVIDOR (PHP API)                                 │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. reports.php recibe petición              │  │
│  │  2. Verifica autenticación (JWT Token)       │  │
│  │  3. Valida datos                             │  │
│  │  4. Si hay imagen:                           │  │
│  │     - uploads.php sube a Cloudinary          │  │
│  │     - Obtiene URL de imagen                  │  │
│  │  5. Prepara INSERT SQL                       │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓ SQL Query
┌─────────────────────────────────────────────────────┐
│  DATABASE (MySQL - Railway)                         │
│  ┌───────────────────────────────────────────────┐  │
│  │  INSERT INTO reportes (                       │  │
│  │    titulo, contenido, categoria, location,   │  │
│  │    lat, lng, imagen_url, user_id, ...        │  │
│  │  ) VALUES (...)                              │  │
│  │                                              │  │
│  │  INSERT INTO archivos_subidos (              │  │
│  │    user_id, ruta, tipo, ...                  │  │
│  │  ) VALUES (...)                              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓ JSON Response
┌─────────────────────────────────────────────────────┐
│  SERVIDOR (PHP)                                     │
│  ┌───────────────────────────────────────────────┐  │
│  │  {                                            │  │
│  │    "success": true,                          │  │
│  │    "data": {                                 │  │
│  │      "report_id": 123,                       │  │
│  │      "message": "Reporte creado"             │  │
│  │    }                                         │  │
│  │  }                                           │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                      ↓ HTTP Response
┌─────────────────────────────────────────────────────┐
│  CLIENTE (Browser)                                  │
│  ┌───────────────────────────────────────────────┐  │
│  │  1. Recibe respuesta                         │  │
│  │  2. createReportCard() genera HTML          │  │
│  │  3. Inserta en DOM                          │  │
│  │  4. showToast("¡Éxito!")                    │  │
│  │  5. Cierra modal                            │  │
│  │  6. Recarga la lista de reportes            │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

---

## 🔐 Capas de Seguridad

```
┌──────────────────────────────────────┐
│     CAPA 1: CLIENT-SIDE              │
├──────────────────────────────────────┤
│  ✓ Validación de formularios         │
│  ✓ Verificación de autenticación     │
│  ✓ Manejo de permisos locales        │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│     CAPA 2: TRANSMISSION             │
├──────────────────────────────────────┤
│  ✓ HTTPS/TLS (en producción)         │
│  ✓ JSON Content-Type                 │
│  ✓ CORS headers                      │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│     CAPA 3: SERVER-SIDE              │
├──────────────────────────────────────┤
│  ✓ JWT Token Validation              │
│  ✓ Input Sanitization                │
│  ✓ SQL Prepared Statements           │
│  ✓ File Type Validation              │
│  ✓ Size Limit Checking               │
└──────────────────────────────────────┘
              ↓
┌──────────────────────────────────────┐
│     CAPA 4: DATABASE                 │
├──────────────────────────────────────┤
│  ✓ Foreign Key Constraints           │
│  ✓ User Isolation                    │
│  ✓ Data Encryption (password hashing)│
│  ✓ Transaction Management            │
└──────────────────────────────────────┘
```

---

## 📡 Endpoints API

```
POST   /api/auth.php?action=register          → Register new user
POST   /api/auth.php?action=login             → Login user
POST   /api/auth.php?action=admin-login       → Admin login
POST   /api/auth.php?action=anonymous         → Anonymous access
GET    /api/auth.php?action=profile           → Get user profile

GET    /api/reports.php?action=list           → Get all reports
POST   /api/reports.php?action=create         → Create report
GET    /api/reports.php?action=get            → Get single report
PUT    /api/reports.php?action=update         → Update report
DELETE /api/reports.php?action=delete         → Delete report
GET    /api/reports.php?action=my-reports     → Get user's reports
GET    /api/reports.php?action=stats          → Get statistics
POST   /api/reports.php?action=like           → Like report

POST   /api/comments.php?action=create        → Create comment
GET    /api/comments.php?action=list          → Get comments
DELETE /api/comments.php?action=delete        → Delete comment

GET    /api/notifications.php?action=list     → Get notifications
GET    /api/notifications.php?action=count    → Get unread count
PUT    /api/notifications.php?action=mark-read → Mark as read

GET    /api/trending.php?action=top           → Get trending hashtags
GET    /api/trending.php?action=daily         → Get daily stats

POST   /api/uploads.php?action=image          → Upload image

GET    /api/users.php?action=list             → Get users
POST   /api/users.php?action=ban              → Ban user
POST   /api/users.php?action=unban            → Unban user

GET    /api/settings.php?action=get           → Get user settings
PUT    /api/settings.php?action=update        → Update settings

GET    /api/geocoding.php?action=reverse      → Reverse geocoding
```

---

## 👥 Tipos de Usuarios

```
┌──────────────────────────────────┐
│      ANONYMOUS USER              │
├──────────────────────────────────┤
│  ✓ Ver reportes                  │
│  ✓ Ver mapa                      │
│  ✓ Ver tendencias                │
│  ✗ Comentar                      │
│  ✗ Votar (likes)                 │
│  ✗ Crear reportes                │
│  ✗ Editar perfil                 │
└──────────────────────────────────┘
              vs
┌──────────────────────────────────┐
│    REGISTERED USER               │
├──────────────────────────────────┤
│  ✓ Ver reportes                  │
│  ✓ Comentar                      │
│  ✓ Votar (likes)                 │
│  ✓ Crear reportes                │
│  ✓ Editar perfil                 │
│  ✓ Editar sus reportes           │
│  ✓ Seguir usuarios               │
│  ✗ Moderar contenido             │
└──────────────────────────────────┘
              vs
┌──────────────────────────────────┐
│        ADMIN USER                │
├──────────────────────────────────┤
│  ✓ Todas las acciones            │
│  ✓ Moderar reportes              │
│  ✓ Gestionar usuarios            │
│  ✓ Ver estadísticas              │
│  ✓ Banear usuarios               │
│  ✓ Cambiar estado de reportes    │
└──────────────────────────────────┘
```

---

## 🗄️ Modelos de Datos

### Tabla: `usuarios`
```sql
id (int, PK)
nombre (varchar)
email (varchar, unique)
username (varchar, unique)
password (varchar, hashed)
tipo (enum: admin, registrado, anonimo)
avatar_url (varchar)
ubicacion (varchar)
biografia (text)
is_banned (boolean)
fecha_registro (datetime)
ÍNDICES: idx_email, idx_username, idx_tipo
```

### Tabla: `reportes`
```sql
id (int, PK)
user_id (int, FK)
titulo (varchar)
contenido (text)
categoria (enum: seguridad, infraestructura, vias, servicios, medio_ambiente)
estado (enum: pendiente, en_revision, en_proceso, resuelto)
ubicacion (varchar)
latitud (decimal)
longitud (decimal)
imagen_url (varchar)
vistas (int)
likes (int)
fecha_creacion (datetime)
ÍNDICES: idx_user_id, idx_estado, idx_categoria, idx_fecha_creacion
```

### Tabla: `comentarios`
```sql
id (int, PK)
reporte_id (int, FK)
user_id (int, FK)
contenido (text)
fecha_creacion (datetime)
ÍNDICES: idx_reporte_id, idx_user_id
```

### Tabla: `notificaciones`
```sql
id (int, PK)
user_id (int, FK)
tipo (varchar)
titulo (varchar)
descripcion (text)
reporte_id (int, FK)
is_read (boolean)
fecha_creacion (datetime)
ÍNDICES: idx_user_id, idx_is_read
```

### Tabla: `archivos_subidos`
```sql
id (int, PK)
user_id (int, FK)
nombre_original (varchar)
nombre_guardado (varchar)
ruta (varchar)
tipo (enum: imagen_reporte, avatar, otro)
tamanio (int)
fecha_subida (datetime)
ÍNDICES: idx_user_id, idx_tipo, idx_fecha
```

---

## ⚙️ Tecnologías Utilizadas

```
FRONTEND:
├─ HTML5
├─ CSS3 (Flexbox, Grid, Media Queries)
├─ JavaScript (ES6+)
│  ├─ Async/Await
│  ├─ Fetch API
│  ├─ LocalStorage
│  └─ DOM Manipulation
├─ Leaflet.js (Mapping)
└─ Responsive Design

BACKEND:
├─ PHP 8.x
├─ MySQL 8.0+
├─ JWT Authentication
├─ Prepared Statements
├─ File Upload Handling
└─ CORS Headers

EXTERNAL SERVICES:
├─ Cloudinary (Image CDN)
├─ OpenStreetMap (Maps)
├─ Nominatim (Geocoding)
└─ Railway (Deployment)

DEPLOYMENT:
├─ XAMPP (Development)
├─ Railway (Production)
├─ Procfile (Railway Config)
└─ Composer (PHP Dependencies)
```

---

## 📊 Estadísticas de Código

```
FRONTEND:
├─ HTML Files: 9 archivos
├─ JavaScript Files: 9 archivos (~4,500 líneas)
├─ CSS Files: 7 archivos
└─ Total Frontend: ~15,000 líneas

BACKEND:
├─ PHP API Endpoints: 12 archivos
├─ Core API: ~1,500 líneas
├─ Database Schema: 609 líneas
└─ Total Backend: ~4,000 líneas

TOTAL DE PROYECTO: ~19,000 líneas de código
```

---

## 🔄 Flujos Principales

### Flujo 1: Login → Dashboard
```
User → index.html → handleLogin() → apiRequest(auth.php?action=login)
    → saveUser() en localStorage → loadReports() → dashboard.html
```

### Flujo 2: Crear Reporte
```
User → openCreateReportModal() → initMapPicker() → handleCreateReport()
    → uploads.php (imagen) → apiRequest(reports.php?action=create)
    → loadReports() → showToast("¡Éxito!")
```

### Flujo 3: Ver Reportes en Mapa
```
loadMapReports() → apiRequest(reports.php?action=list)
    → renderMapMarkers() → Leaflet L.marker() → openPopup()
```

### Flujo 4: Admin Moderar Reportes
```
loadAdminReports() → filterAdminReports() → renderAdminReportsTable()
    → changeReportStatus() → apiRequest(reports.php?action=update)
    → loadAdminReports()
```

---

## 🎯 Componentes Principales

### Frontend Components
| Componente | Archivo | Función |
|---|---|---|
| Authentication | app.js | Login/Register/Auth |
| Reports Feed | app.js | Listar reportes |
| Map View | mapa-functions.js | Mapa Leaflet |
| Report Detail | reporte-detalle.js | Detalle + Comentarios |
| Admin Dashboard | admin-functions.js | Panel de administración |
| Mobile Nav | mobile-experience.js | Navegación móvil |
| Notifications | notifications.js | Gestión de notificaciones |
| User Profile | perfil-functions.js | Perfil y edición |
| My Reports | mis-reportes-functions.js | Mis reportes |
| Settings | configuracion-functions.js | Configuración |
| Trending | tendencias-functions.js | Tendencias |

### Backend Components
| Componente | Archivo | Función |
|---|---|---|
| Router | index.php | Enrutamiento de peticiones |
| Auth | auth.php | Autenticación JWT |
| Reports CRUD | reports.php | Gestión de reportes |
| Comments | comments.php | Gestión de comentarios |
| Uploads | uploads.php | Subida a Cloudinary |
| Notifications | notifications.php | Gestión de notificaciones |
| Geocoding | geocoding.php | Integración Nominatim |
| Trending | trending.php | Análisis de hashtags |
| Users | users.php | Gestión de usuarios |
| Settings | settings.php | Configuración de usuario |
| Config | config.php | Variables globales |

---

## 🚀 Flujo de Despliegue

```
Desarrollo:
  XAMPP (localhost:80)
    └─ PHP Built-in Server
    └─ MySQL Local
    └─ File Storage Local

Producción:
  Railway
    ├─ Node.js/PHP Runtime
    ├─ MySQL Database
    ├─ Environment Variables
    ├─ Procfile Configuration
    └─ Git Auto-Deploy
        └─ Push a GitHub
        └─ Railway detecta cambios
        └─ Rebuild automático
```

---

## ⚡ Performance & Optimizaciones

```
Frontend:
✓ LocalStorage para estado de usuario
✓ Lazy loading de imágenes
✓ CSS minificación (opcional)
✓ JavaScript modular
✓ Responsive design (mobile-first)

Backend:
✓ Índices en tablas principales
✓ Prepared statements (SQL Injection prevention)
✓ JWT tokens (sin sesiones)
✓ Cloudinary CDN (imágenes optimizadas)
✓ Pagination en listados

Database:
✓ Foreign keys con CASCADE
✓ Índices en filtros comunes
✓ UTF8MB4 encoding
✓ Proper column types
```

---

## 📋 Resumen Arquitectónico

| Aspecto | Valor |
|--------|-------|
| **Tipo de Arquitectura** | MVC (Frontend-Backend separado) |
| **Frontend Framework** | Vanilla JavaScript + Leaflet |
| **Backend Framework** | PHP Procedural |
| **Database** | MySQL (Railway) |
| **Authentication** | JWT Token |
| **File Storage** | Cloudinary CDN |
| **Mapping** | Leaflet + OpenStreetMap |
| **Deployment** | Railway (CI/CD) |
| **API Style** | REST |
| **Response Format** | JSON |

---

**Documento Generado:** 2025-12-03
**Proyecto:** SigmaForo
**Versión:** 1.0
**Estado:** Arquitectura Completa
