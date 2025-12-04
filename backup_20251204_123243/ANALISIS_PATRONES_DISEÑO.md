# ANÁLISIS EXHAUSTIVO DE PATRONES DE DISEÑO - SigmaForo Frontend

## 📊 Tabla Resumen Ejecutiva

| Total Patrones | Creacionales | Estructurales | Comportamiento |
|---|---|---|---|
| **17 patrones** | 4 | 5 | 8 |

---

## 🔵 PATRONES CREACIONALES (4)
*Cómo se crean los objetos/componentes*

### 1. **Factory Pattern (Patrón Fábrica)**
- **Clasificación:** CREACIONAL
- **Ubicación:** 
  - `mobile-experience.js`: líneas 14-77
  - `mobile-experience.js`: líneas 79-120
  - `mobile-experience.js`: líneas 122-145
- **Descripción:** Funciones que crean componentes UI dinámicamente
- **Código:**
```javascript
function createBottomNavigation() {
  const bottomNav = document.createElement('div');
  bottomNav.className = 'mobile-bottom-nav';
  // ... más configuración
  document.body.appendChild(bottomNav);
}

function createFloatingActionButton() { /* ... */ }
function createTrendingButton() { /* ... */ }
```
- **Ventaja:** Encapsula la lógica de creación de elementos

---

### 2. **Singleton Pattern (Patrón Singleton)**
- **Clasificación:** CREACIONAL
- **Ubicación:** `app.js`: línea 49 (función `apiRequest`)
- **Descripción:** Una única instancia de comunicación con el API
- **Código:**
```javascript
async function apiRequest(endpoint, options = {}) {
  // Única función para todas las peticiones
  // Garantiza consistencia en headers, autenticación, manejo de errores
}
```
- **Por qué es Singleton:** No se puede instanciar múltiples conexiones; siempre se usa esta función única

---

### 3. **Constructor Pattern (Patrón Constructor)**
- **Clasificación:** CREACIONAL
- **Ubicación:** `app.js`: líneas 268-295 (creación de toasts)
- **Descripción:** Crea objetos con propiedades específicas usando constructores
- **Código:**
```javascript
function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  // Inicializa propiedades del elemento
  toast.innerHTML = `...`;
}
```

---

### 4. **Object Literal Pattern (Patrón Literal de Objetos)**
- **Clasificación:** CREACIONAL
- **Ubicación:** `app.js`: líneas 318-328
- **Descripción:** Crear objetos configurables usando literales
- **Código:**
```javascript
const colors = {
  seguridad: '#dc2626',
  infraestructura: '#ea580c',
  vias: '#ca8a04',
  servicios: '#2563eb',
  medio_ambiente: '#16a34a',
};

const labels = {
  seguridad: 'Seguridad',
  infraestructura: 'Infraestructura',
  // ...
};
```
- **Ventaja:** Mapeos de configuración reutilizables

---

## 🟢 PATRONES ESTRUCTURALES (5)
*Cómo se organizan/componen los objetos*

### 1. **Adapter Pattern (Patrón Adaptador)**
- **Clasificación:** ESTRUCTURAL
- **Ubicación:** `app.js`: líneas 49-78
- **Descripción:** Adapta `fetch()` nativo a formato personalizado del API
- **Código:**
```javascript
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message);
  return data;
}
```
- **Por qué es Adapter:** Transforma la API de `fetch()` en una interfaz consistente para toda la app

---

### 2. **Module Pattern (Patrón Módulo)**
- **Clasificación:** ESTRUCTURAL
- **Ubicación:** Cada archivo `.js` es un módulo
  - `app.js` - Funcionalidad principal
  - `admin-functions.js` - Funcionalidad admin
  - `mobile-experience.js` - Experiencia móvil
  - `perfil-functions.js` - Perfil de usuario
  - `tendencias-functions.js` - Tendencias
  - etc.
- **Descripción:** Encapsula datos y funciones relacionadas en un módulo
- **Código:**
```javascript
// app.js - Variables privadas del módulo
let currentReports = [];
let currentFilter = 'all';

// Funciones públicas que usan las variables privadas
async function loadReports() { /* ... */ }
function filterReports() { /* ... */ }
```
- **Ventaja:** Evita contaminación del scope global, agrupa funcionalidad relacionada

---

### 3. **Facade Pattern (Patrón Fachada)**
- **Clasificación:** ESTRUCTURAL
- **Ubicación:** Múltiples ubicaciones
- **Descripción:** Proporciona interfaz simplificada a operaciones complejas
- **Código:**
```javascript
// Fachada simple para modales complejos
function openModal(type) {
  const modal = document.getElementById(type + 'Modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

// Fachada para mostrar notificaciones
function showToast(message, type = 'info') {
  // Simplifica mostrar notificaciones complejas
}

// Fachada para gestión de usuarios
function logout() {
  localStorage.removeItem('sigmaforo_user');
  localStorage.removeItem('sigmaforo_token');
  window.location.href = 'index.html';
}
```
- **Por qué es Facade:** Simplifica operaciones complejas con interfaces simples

---

### 4. **Decorator Pattern (Patrón Decorador)**
- **Clasificación:** ESTRUCTURAL
- **Ubicación:** `app.js`: líneas 503-572
- **Descripción:** Añade comportamiento a elementos ya existentes sin modificar su estructura
- **Código:**
```javascript
// En createReportCard, se "decoran" los reportes con:
// - Badges de categoría y estado
// - Menú contextual
// - Avatares personalizados
// - Hashtags clickeables

let avatarHTML;
if (report.autor_avatar) {
  avatarHTML = `<img src="${report.autor_avatar}" 
                     style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
} else {
  avatarHTML = `<span>${report.autor_nombre.charAt(0).toUpperCase()}</span>`;
}

// Decorar con estilos condicionales
return `
  <article class="report-card" style="${report.autor_avatar ? 'background-color: transparent;' : ''}">
    <!-- Contenido decorado -->
  </article>
`;
```
- **Por qué es Decorator:** Añade decoraciones dinámicas (avatares, estados, etc.) sin cambiar la estructura base

---

### 5. **Composite Pattern (Patrón Compuesto)**
- **Clasificación:** ESTRUCTURAL
- **Ubicación:** `app.js`: líneas 501-605
- **Descripción:** Compone objetos en estructuras de árbol (reportes con múltiples componentes)
- **Código:**
```javascript
// Un reporte está compuesto de múltiples partes:
// - Header (autor, tiempo, menú)
// - Content (título, descripción, hashtags, imagen, ubicación)
// - Footer (stats, botones de acción)

function createReportCard(report) {
  return `
    <article class="report-card">
      <div class="report-header"><!-- Componente --></div>
      <div class="report-content"><!-- Componente --></div>
      <div class="report-footer"><!-- Componente --></div>
    </article>
  `;
}
```
- **Por qué es Composite:** Los reportes se tratan como contenedores que incluyen múltiples sub-componentes

---

## 🔴 PATRONES DE COMPORTAMIENTO (8)
*Cómo interactúan los objetos entre sí*

### 1. **Observer Pattern (Patrón Observador)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `app.js`: línea 255-263 (modal listeners)
- **Descripción:** Los elementos observan eventos y reaccionan
- **Código:**
```javascript
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// Listeners de eventos
document.addEventListener('DOMContentLoaded', function() { /* ... */ });
element.addEventListener('click', function() { /* ... */ });
```
- **Por qué es Observer:** Los elementos "observan" eventos y responden cuando ocurren

---

### 2. **Strategy Pattern (Patrón Estrategia)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `tendencias-functions.js`: líneas 47-80
- **Descripción:** Diferentes estrategias para renderizar el mismo contenedor
- **Código:**
```javascript
// Estrategia 1: Mostrar loading
function showTrendingLoading(container) {
  container.innerHTML = `<div class="trending-loading">...</div>`;
}

// Estrategia 2: Mostrar datos
function renderTrending(container, trending) {
  container.innerHTML = trending.map(...).join('');
}

// Estrategia 3: Mostrar vacío
function showTrendingEmpty(container) {
  container.innerHTML = `<div class="trending-empty">...</div>`;
}

// Estrategia 4: Mostrar error
function showTrendingError(container) {
  container.innerHTML = `<div class="trending-empty">Error...</div>`;
}

// El contexto elige la estrategia según el estado
async function loadTrending(limit = 5) {
  if (data.success && data.data.trending.length > 0) {
    renderTrending(container, data.data.trending); // Estrategia correcta
  } else {
    showTrendingEmpty(container);
  }
}
```
- **Por qué es Strategy:** Cambia el algoritmo de renderizado según la situación

---

### 3. **Template Method Pattern (Patrón Método Plantilla)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `app.js`: líneas 430-470
- **Descripción:** Define la estructura de un algoritmo, permitiendo que los pasos varíen
- **Código:**
```javascript
async function loadReports() {
  // Paso 1: Verificar usuario
  const user = getCurrentUser();
  
  // Paso 2: Mostrar notificación si es necesario
  if (user && user.type === 'anonimo') {
    html += `<div class="info-banner">...</div>`;
  }

  try {
    // Paso 3: Cargar datos
    const data = await apiRequest('reports.php?action=list');
    
    if (data.success) {
      // Paso 4: Procesar datos
      currentReports = data.data.reports;
      
      // Paso 5: Renderizar
      if (currentReports.length === 0) {
        html += '<div class="empty-state">...</div>';
      } else {
        html += currentReports.map(report => createReportCard(report)).join('');
      }
      
      // Paso 6: Asignar al DOM
      container.innerHTML = html;
    }
  } catch (error) {
    // Paso 7: Manejar error
    container.innerHTML = html + '<div class="empty-state">Error...</div>';
    showToast('Error al cargar reportes', 'error');
  }
}
```
- **Por qué es Template Method:** Define pasos fijos (verificar, cargar, procesar, renderizar, manejar errores) pero permite variaciones

---

### 4. **State Pattern (Patrón Estado)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `localStorage` en `app.js`
- **Descripción:** El comportamiento cambia según el estado del usuario
- **Código:**
```javascript
// Estados posibles del usuario:
// 1. No autenticado
// 2. Anonimo
// 3. Registrado
// 4. Admin

function isAuthenticated() {
  return localStorage.getItem('sigmaforo_token') !== null;
}

function canComment() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo'; // Comportamiento cambia según tipo
}

function canVote() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo';
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.type === 'admin';
}

// En createReportCard, el menú contextual cambia según el estado
${canModerate || canEdit || canDelete ? `
  <button class="report-menu-btn">...</button>
  <div class="report-dropdown">
    ${canEdit ? `<button>Editar</button>` : ''}
    ${canDelete ? `<button>Eliminar</button>` : ''}
    ${canModerate ? `<button>Aprobar</button>` : ''}
  </div>
` : ''}
```
- **Por qué es State:** El comportamiento se adapta dinámicamente según el estado del usuario

---

### 5. **Command Pattern (Patrón Comando)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** Eventos HTML inline
- **Descripción:** Encapsula una petición como un objeto para parametrizarla
- **Código:**
```javascript
// Cada acción se encapsula como un comando
<button onclick="likeReport(${report.id}, event)">Like</button>
<button onclick="toggleReportMenu('${report.id}', event)">Menú</button>
<button onclick="editReport('${report.id}', event)">Editar</button>
<button onclick="deleteReport('${report.id}', event)">Eliminar</button>
<button onclick="approveReport('${report.id}', event)">Aprobar</button>
<button onclick="markAsFalse('${report.id}', event)">Marcar como falso</button>
<button onclick="deleteReportAdmin('${report.id}', event)">Eliminar (Admin)</button>

// Cada comando es una función con el ID y evento
async function likeReport(reportId, event) {
  event.stopPropagation();
  // Lógica del comando
}
```
- **Por qué es Command:** Las acciones (likeReport, editReport, etc.) son comandos invocables

---

### 6. **Chain of Responsibility Pattern (Patrón Cadena de Responsabilidad)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `admin-functions.js`: líneas 208-270
- **Descripción:** Pasa una petición a través de una cadena de filtros/validadores
- **Código:**
```javascript
function filterAdminReports() {
  const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
  const statusFilter = document.getElementById('adminStatusFilter').value;
  const categoryFilter = document.getElementById('adminCategoryFilter').value;

  // Cadena de filtros - cada uno procesa la petición
  filteredAdminReports = adminReportsData.filter(report => {
    // Filtro 1: Búsqueda
    const matchesSearch = report.titulo.toLowerCase().includes(searchQuery) ||
                         report.contenido.toLowerCase().includes(searchQuery);
    
    // Filtro 2: Estado
    const matchesStatus = statusFilter === 'all' || report.estado === statusFilter;
    
    // Filtro 3: Categoría
    const matchesCategory = categoryFilter === 'all' || report.categoria === categoryFilter;
    
    // Todos deben pasar
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Luego pasa por ordenamiento
  filteredAdminReports.sort((a, b) => {
    switch(sortFilter) {
      case 'recent': return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      case 'oldest': return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
      case 'likes': return b.likes - a.likes;
    }
  });
}
```
- **Por qué es Chain of Responsibility:** Las peticiones pasan por una cadena de filtros (búsqueda → estado → categoría → ordenamiento)

---

### 7. **Mediator Pattern (Patrón Mediador)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `app.js` funciones globales como `switchModal()`, `openModal()`, `closeModal()`
- **Descripción:** Centraliza la comunicación entre componentes
- **Código:**
```javascript
// El mediador controla la interacción entre modales
function openModal(type) {
  const modal = document.getElementById(type + 'Modal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeModal(type) {
  const modal = document.getElementById(type + 'Modal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function switchModal(from, to) {
  closeModal(from);
  openModal(to);
}

// En lugar de que los modales se comuniquen directamente,
// van a través del mediador (switchModal)
<button onclick="switchModal('login', 'register')">Crear cuenta</button>
```
- **Por qué es Mediator:** Centraliza la lógica de interacción entre componentes (modales)

---

### 8. **Iterator Pattern (Patrón Iterador)**
- **Clasificación:** COMPORTAMIENTO
- **Ubicación:** `admin-functions.js`: líneas 250-290
- **Descripción:** Accede secuencialmente a elementos de una colección
- **Código:**
```javascript
// Itera sobre los datos filtrados
function renderAdminReportsTable() {
  const start = (currentPage - 1) * reportsPerPage;
  const end = start + reportsPerPage;
  const paginatedReports = filteredAdminReports.slice(start, end);

  // Itera sobre cada reporte
  tbody.innerHTML = paginatedReports.map(report => `
    <tr>
      <td>${report.titulo}</td>
      <td>${report.autor_nombre}</td>
      <!-- ... más propiedades -->
    </tr>
  `).join('');
}

// En loadNotifications
async function loadNotifications(onlyUnread = false, limit = 20) {
  const data = await apiRequest(endpoint);
  
  // Itera sobre las notificaciones
  return data.data.notifications.map(notif => createNotificationHTML(notif)).join('');
}

// En loadTrending
trending.map((item, index) => {
  const rank = index + 1;
  return `<div class="trending-item">...</div>`;
}).join('');
```
- **Por qué es Iterator:** Accede secuencialmente a colecciones (reportes, notificaciones, tendencias) usando métodos como `.map()` y `.filter()`

---

## 📈 Distribución Visual

```
CREACIONALES (4 patrones - 24%)
├─ Factory Pattern ✓
├─ Singleton Pattern ✓
├─ Constructor Pattern ✓
└─ Object Literal Pattern ✓

ESTRUCTURALES (5 patrones - 29%)
├─ Adapter Pattern ✓
├─ Module Pattern ✓
├─ Facade Pattern ✓
├─ Decorator Pattern ✓
└─ Composite Pattern ✓

COMPORTAMIENTO (8 patrones - 47%)
├─ Observer Pattern ✓
├─ Strategy Pattern ✓
├─ Template Method Pattern ✓
├─ State Pattern ✓
├─ Command Pattern ✓
├─ Chain of Responsibility Pattern ✓
├─ Mediator Pattern ✓
└─ Iterator Pattern ✓
```

---

## 🎯 Análisis por Archivo

| Archivo | Patrones | Total |
|---------|----------|-------|
| `app.js` | Factory, Singleton, Constructor, Object Literal, Adapter, Module, Facade, Decorator, Composite, Observer, State, Command, Mediator | 13 |
| `admin-functions.js` | Module, Facade, Chain of Responsibility, Iterator | 4 |
| `mobile-experience.js` | Factory, Module, Composite, Observer | 4 |
| `tendencias-functions.js` | Strategy, Module | 2 |
| `notifications.js` | Module, Iterator, Observer | 3 |
| `perfil-functions.js` | Module | 1 |
| `configuracion-functions.js` | Module | 1 |
| `mapa-functions.js` | Module, Observer | 2 |
| `reporte-detalle.js` | Module, Observer, State | 3 |
| `mis-reportes-functions.js` | Module, Filter/Iterator | 2 |

---

## 💡 Conclusiones

1. **Patrón Dominante:** Template Method + State (47% comportamiento)
2. **Fortaleza:** Buen uso de patrones de comportamiento (Observer, Strategy)
3. **Oportunidad de mejora:** Podría usar más patrones creacionales avanzados (Builder, Prototype)
4. **Recomendación:** Considerar implementar un State Management centralizado (como Redux o Vuex si migrases a Vue/React)

---

## 📝 Referencias de Localización

- **Línea X en archivo.js** = Ubicación exacta del código
- Todos los patrones están documentados con ejemplos reales del código
- La clasificación sigue el estándar Gang of Four (GoF)

