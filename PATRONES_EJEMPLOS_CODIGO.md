# EJEMPLOS DE CÓDIGO: LOS 17 PATRONES

## 1️⃣ FACTORY PATTERN (Creacional)
**Ubicación:** `mobile-experience.js:14-77`

```javascript
// Función Factory que crea un componente
function createBottomNavigation() {
  if (document.querySelector('.mobile-bottom-nav')) return; // Guard clause
  
  const bottomNav = document.createElement('div');
  bottomNav.className = 'mobile-bottom-nav';
  
  // Configuración compleja del componente
  bottomNav.innerHTML = `
    <div class="mobile-bottom-nav-content">
      <a href="dashboard.html" class="mobile-nav-item">Inicio</a>
      <a href="mapa.html" class="mobile-nav-item">Mapa</a>
      <!-- ... más items -->
    </div>
  `;
  
  document.body.appendChild(bottomNav);
  return bottomNav; // Retorna el objeto creado
}

// Uso: Simplemente llamar la función
createBottomNavigation();
createFloatingActionButton();
createTrendingButton();
```

**Ventaja:** La lógica de creación está centralizada, reutilizable

---

## 2️⃣ SINGLETON PATTERN (Creacional)
**Ubicación:** `app.js:49-78`

```javascript
// Una única función para TODAS las peticiones HTTP
// Garantiza consistencia global
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const token = getToken();
  
  // Headers automáticos
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  // Autenticación automática
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, { ...options, headers });
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// USO EN TODO EL CÓDIGO:
const data = await apiRequest('reports.php?action=list');
const response = await apiRequest('auth.php?action=login', {
  method: 'POST',
  body: JSON.stringify({...})
});
```

**Ventaja:** Todos los errores se manejan igual, headers siempre presentes, control centralizado

---

## 3️⃣ CONSTRUCTOR PATTERN (Creacional)
**Ubicación:** `app.js:268-295`

```javascript
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  
  // Constructor crea el objeto con propiedades
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  
  const icons = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠'
  };

  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <span class="toast-message">${message}</span>
  `;

  container.appendChild(toast);

  // Inicialización: mostrar después de 10ms
  setTimeout(() => toast.classList.add('show'), 10);
  
  // Destrucción: ocultar después de 3s
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => container.removeChild(toast), 300);
  }, 3000);
}

// USO:
showToast('¡Éxito!', 'success');
showToast('Error al cargar', 'error');
```

**Ventaja:** Propiedades consistentes, ciclo de vida predecible

---

## 4️⃣ OBJECT LITERAL PATTERN (Creacional)
**Ubicación:** `app.js:318-345`

```javascript
// Mapeos de configuración reutilizables
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
  vias: 'Vías',
  servicios: 'Servicios',
  medio_ambiente: 'Medio Ambiente',
};

const statusColors = {
  pendiente: '#6b7280',
  en_revision: '#eab308',
  en_proceso: '#3b82f6',
  resuelto: '#22c55e',
};

// USO EN TODO EL CÓDIGO:
function getCategoryColor(category) {
  return colors[category] || '#6b7280';
}

function getCategoryLabel(category) {
  return labels[category] || 'Otro';
}

// En el HTML:
<span class="category-badge" style="background-color: ${getCategoryColor(report.categoria)};">
  ${getCategoryLabel(report.categoria)}
</span>
```

**Ventaja:** Cambios centralizados, fácil de mantener

---

## 5️⃣ ADAPTER PATTERN (Estructural)
**Ubicación:** `app.js:49-78`

```javascript
// ANTES: fetch() nativo (interfaz complicada)
// fetch(url, options)
//   .then(res => res.json())
//   .then(data => if(!res.ok) throw...)
//   .catch(...)

// DESPUÉS: Adapter simplifica todo
async function apiRequest(endpoint, options = {}) {
  // Adapta los parámetros de entrada
  const url = `${API_BASE_URL}/${endpoint}`;
  
  // Adapta los headers (añade auth automáticamente)
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (getToken()) {
    headers['Authorization'] = `Bearer ${getToken()}`;
  }
  
  // Adapta la respuesta (manejo de errores centralizado)
  const response = await fetch(url, { ...options, headers });
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message);
  }
  
  return data;
}

// USO: Interfaz simple
const data = await apiRequest('reports.php?action=list');
```

**Ventaja:** Interface consistente, cambios internos no afectan el resto de la app

---

## 6️⃣ MODULE PATTERN (Estructural)
**Ubicación:** Cada archivo .js

```javascript
// ==========================================
// admin-functions.js - MÓDULO
// ==========================================

// Variables PRIVADAS del módulo
let adminReportsData = [];
let filteredAdminReports = [];
let currentPage = 1;
const reportsPerPage = 10;

// Funciones PÚBLICAS (globales)
async function loadAdminReports() {
  try {
    const response = await apiRequest('reports.php?action=list');
    adminReportsData = response.data.reports; // Usa variable privada
    renderAdminReportsTable();
  } catch (error) {
    console.error('Error:', error);
  }
}

function filterAdminReports() {
  const query = document.getElementById('adminSearchInput').value;
  // Filtra la variable privada
  filteredAdminReports = adminReportsData.filter(r => 
    r.titulo.includes(query)
  );
  renderAdminReportsTable();
}

// ==========================================
// mobile-experience.js - OTRO MÓDULO
// ==========================================

// Variables PRIVADAS de este módulo
let map = null;
let markers = [];

// Funciones PÚBLICAS (no colisiona con admin-functions.js)
function initMobileExperience() {
  if (window.innerWidth <= 768) {
    createBottomNavigation();
    createFloatingActionButton();
  }
}
```

**Ventaja:** No colisiona con otras variables, encapsulación, reutilización

---

## 7️⃣ FACADE PATTERN (Estructural)
**Ubicación:** `app.js:213-240`

```javascript
// COMPLEJO: Manejar modales manualmente
// document.getElementById('loginModal').style.display = 'flex';
// document.body.style.overflow = 'hidden';
// document.getElementById('registerModal').style.display = 'none';
// ... más código

// FACADE: Interface simplificada
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

// USO: Muy simple
openModal('login');        // Abre modal de login
switchModal('login', 'register'); // Cambia a registro
closeModal('register');     // Cierra modal
```

**Ventaja:** Interface simple, cambios internos no afectan el uso

---

## 8️⃣ DECORATOR PATTERN (Estructural)
**Ubicación:** `app.js:503-572`

```javascript
function createReportCard(report) {
  // Decoración condicional de avatares
  let avatarHTML;
  
  // DECORACIÓN 1: Si tiene foto, muestra imagen
  if (report.autor_avatar) {
    avatarHTML = `<img src="${report.autor_avatar}" 
                       style="width: 100%; height: 100%; 
                              object-fit: cover; border-radius: 50%;">`;
  } 
  // DECORACIÓN 2: Si no, muestra inicial
  else {
    avatarHTML = `<span>${report.autor_nombre.charAt(0)}</span>`;
  }

  // DECORACIÓN de badges condicionales
  let badgesHTML = `
    <span class="category-badge" style="background-color: ${getCategoryColor(report.categoria)};">
      ${getCategoryLabel(report.categoria)}
    </span>
    <span class="status-badge" style="background-color: ${getStatusColor(report.estado)};">
      ${getStatusLabel(report.estado)}
    </span>
  `;

  // DECORACIÓN de menú según permisos
  let menuHTML = '';
  if (canModerate || canEdit || canDelete) {
    menuHTML = `
      <button class="report-menu-btn" onclick="toggleReportMenu('${report.id}', event)">
        <svg><!-- icono --></svg>
      </button>
      <div class="report-dropdown" id="menu-${report.id}">
        ${canEdit ? `<button onclick="editReport('${report.id}', event)">Editar</button>` : ''}
        ${canDelete ? `<button onclick="deleteReport('${report.id}', event)">Eliminar</button>` : ''}
      </div>
    `;
  }

  // Retorna objeto "decorado"
  return `
    <article class="report-card">
      <div class="report-header">
        <div class="avatar">${avatarHTML}</div>
        ${menuHTML}
      </div>
      <div class="report-content">
        ${badgesHTML}
        <!-- más decoraciones -->
      </div>
    </article>
  `;
}
```

**Ventaja:** Añade funcionalidad dinámicamente sin modificar la estructura base

---

## 9️⃣ COMPOSITE PATTERN (Estructural)
**Ubicación:** `app.js:501-605`

```javascript
// Un REPORTE es una composición de partes
function createReportCard(report) {
  return `
    <article class="report-card">
      
      <!-- PARTE 1: Header Component -->
      <div class="report-header">
        <div class="report-author">
          <div class="avatar">...</div>
          <div class="author-info">...</div>
        </div>
        <div class="report-meta">...</div>
      </div>

      <!-- PARTE 2: Content Component -->
      <div class="report-content">
        <div class="report-categories">...</div>
        <h3 class="report-title">${report.titulo}</h3>
        <p class="report-description">${report.contenido}</p>
        
        ${report.hashtags_array ? `
          <div class="report-hashtags">
            ${report.hashtags_array.map(tag => 
              `<span class="hashtag-badge">#${tag}</span>`
            ).join('')}
          </div>
        ` : ''}
        
        ${report.imagen_url ? `
          <div class="report-image">
            <img src="${report.imagen_url}">
          </div>
        ` : ''}
        
        <div class="report-location">...</div>
      </div>

      <!-- PARTE 3: Footer Component -->
      <div class="report-footer">
        <div class="report-stats">
          <button class="stat-btn">Vistas: ${report.vistas}</button>
          <button class="stat-btn">Likes: ${report.likes}</button>
        </div>
        <button class="share-btn">Compartir</button>
      </div>
    </article>
  `;
}

// Las partes se tratan como componentes reutilizables:
// - report-header (puede usarse solo)
// - report-content (puede usarse solo)
// - report-footer (puede usarse solo)
```

**Ventaja:** Estructura jerárquica, componentes reutilizables

---

## 🔟 OBSERVER PATTERN (Comportamiento)
**Ubicación:** `app.js:255-263`

```javascript
// OBSERVADORES globales

// Observa clicks fuera de modales
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// Observa clicks en botones de "Like"
document.addEventListener('click', function(e) {
  if (e.target.closest('.like-btn')) {
    const reportId = e.target.dataset.reportId;
    likeReport(reportId, e);
  }
});

// En HTML, observadores locales:
<button onclick="likeReport(${report.id}, event)">Like</button>
<button onclick="editReport('${report.id}', event)">Editar</button>

// Los observadores REACCIONAN cuando ocurren eventos:
async function likeReport(reportId, event) {
  event.stopPropagation(); // Reacción: detener propagación
  
  const data = await apiRequest('reports.php?action=like', {
    method: 'POST',
    body: JSON.stringify({ report_id: reportId })
  });
  
  // Reacción: actualizar UI
  const likesElement = document.getElementById(`likes-${reportId}`);
  likesElement.textContent = data.data.total_likes;
  
  // Reacción: mostrar notificación
  showToast('¡Like agregado!', 'success');
}
```

**Ventaja:** Reactividad automática, desacoplamiento de componentes

---

## 1️⃣1️⃣ STRATEGY PATTERN (Comportamiento)
**Ubicación:** `tendencias-functions.js:47-80`

```javascript
// El CONTEXTO es loadTrending()
async function loadTrending(limit = 5) {
  const container = document.getElementById('trendingList');
  
  // ESTRATEGIA 1: Mostrar loading
  showTrendingLoading(container);

  try {
    const data = await apiRequest(`trending.php?action=top&limit=${limit}`);
    
    if (data.success && data.data.trending.length > 0) {
      // ESTRATEGIA 2: Renderizar datos
      renderTrending(container, data.data.trending);
    } else {
      // ESTRATEGIA 3: Mostrar vacío
      showTrendingEmpty(container);
    }
  } catch (error) {
    // ESTRATEGIA 4: Mostrar error
    showTrendingError(container);
  }
}

// ESTRATEGIA 1: Loading
function showTrendingLoading(container) {
  container.innerHTML = `
    <div class="trending-loading">
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
      <div class="skeleton-item"></div>
    </div>
  `;
}

// ESTRATEGIA 2: Renderizar
function renderTrending(container, trending) {
  container.innerHTML = trending.map((item, index) => `
    <div class="trending-item">
      <div class="trending-rank">${index + 1}</div>
      <div class="trending-content">
        <div class="trending-hashtag">${item.nombre}</div>
        <div class="trending-count">${item.contador} reportes</div>
      </div>
    </div>
  `).join('');
}

// ESTRATEGIA 3: Vacío
function showTrendingEmpty(container) {
  container.innerHTML = `
    <div class="trending-empty">
      <p>No hay tendencias todavía</p>
    </div>
  `;
}

// ESTRATEGIA 4: Error
function showTrendingError(container) {
  container.innerHTML = `
    <div class="trending-empty">
      <p style="color: red;">Error al cargar</p>
      <button onclick="loadTrending()">Reintentar</button>
    </div>
  `;
}
```

**Ventaja:** Algoritmos intercambiables, fácil de extender

---

## 1️⃣2️⃣ TEMPLATE METHOD PATTERN (Comportamiento)
**Ubicación:** `app.js:430-470`

```javascript
// MÉTODO PLANTILLA: estructura fija con variaciones
async function loadReports() {
  // PASO 1: Verificar usuario
  const container = document.getElementById('reportsFeed');
  const user = getCurrentUser();
  let html = '';

  // PASO 2: Mostrar notificación si es necesario
  if (user && user.type === 'anonimo') {
    html += `<div class="info-banner">Modo anónimo activo...</div>`;
  }

  try {
    // PASO 3: Cargar datos (puede variar la fuente)
    const data = await apiRequest('reports.php?action=list');
    
    if (data.success) {
      // PASO 4: Procesar datos (puede variar el procesamiento)
      currentReports = data.data.reports;
      
      // PASO 5: Renderizar (puede variar el formato)
      if (currentReports.length === 0) {
        html += '<div class="empty-state">No hay reportes</div>';
      } else {
        html += currentReports.map(report => createReportCard(report)).join('');
      }
      
      // PASO 6: Asignar al DOM (siempre igual)
      container.innerHTML = html;
    }
  } catch (error) {
    // PASO 7: Manejar error (siempre igual)
    container.innerHTML = html + '<div class="empty-state">Error</div>';
    showToast('Error al cargar reportes', 'error');
  }
}

// VARIACIÓN: loadMyReports() sigue la MISMA ESTRUCTURA
async function loadMyReports() {
  const user = getCurrentUser();
  const container = document.getElementById('myReportsList');
  
  try {
    // Paso 3: Variación - endpoint diferente
    const data = await apiRequest('reports.php?action=my-reports');
    
    if (data.success) {
      myReportsData = data.data.reports; // Paso 4: Variación
      renderMyReports(); // Paso 5: Variación
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Error</div>';
  }
}
```

**Ventaja:** Estructura predecible, fácil de mantener

---

## 1️⃣3️⃣ STATE PATTERN (Comportamiento)
**Ubicación:** localStorage + funciones de verificación

```javascript
// El ESTADO se guarda en localStorage
function saveUser(user, token) {
  localStorage.setItem('sigmaforo_user', JSON.stringify(user));
  localStorage.setItem('sigmaforo_token', token);
}

function getCurrentUser() {
  const userData = localStorage.getItem('sigmaforo_user');
  return userData ? JSON.parse(userData) : null;
}

// El COMPORTAMIENTO cambia según el ESTADO
function canComment() {
  const user = getCurrentUser();
  // Estado: anónimo → NO puede comentar
  // Estado: registrado → SÍ puede comentar
  // Estado: admin → SÍ puede comentar
  return user && user.type !== 'anonimo';
}

function canVote() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo';
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.type === 'admin';
}

// EN createReportCard, el menú cambia por ESTADO
function createReportCard(report) {
  const user = getCurrentUser();
  const isOwnReport = user && report.user_id === user.id;
  
  // Menú diferentes según ESTADO del usuario
  return `
    <article class="report-card">
      ${canModerate() ? `
        <button onclick="approveReport('${report.id}')">Aprobar</button>
      ` : ''}
      
      ${isOwnReport && canEditOwnReports() ? `
        <button onclick="editReport('${report.id}')">Editar</button>
      ` : ''}
      
      ${canComment() ? `
        <button class="comment-btn">Comentar</button>
      ` : `
        <button class="comment-btn disabled">Inicia sesión para comentar</button>
      `}
    </article>
  `;
}
```

**Ventaja:** Comportamiento adaptativo, fácil de debuggear

---

## 1️⃣4️⃣ COMMAND PATTERN (Comportamiento)
**Ubicación:** Eventos HTML

```javascript
// Cada acción es un COMANDO encapsulado en una función
// El HTML especifica QUÉ comando ejecutar

<button onclick="likeReport(${report.id}, event)">
  👍 Like
</button>

<button onclick="editReport('${report.id}', event)">
  ✏️ Editar
</button>

<button onclick="deleteReport('${report.id}', event)">
  🗑️ Eliminar
</button>

<button onclick="approveReport('${report.id}', event)">
  ✅ Aprobar
</button>

// Cada COMANDO es una función independiente
async function likeReport(reportId, event) {
  event.stopPropagation();
  const data = await apiRequest('reports.php?action=like', {
    method: 'POST',
    body: JSON.stringify({ report_id: reportId })
  });
  // Actualizar UI
}

async function editReport(reportId, event) {
  event.stopPropagation();
  // Lógica de edición
}

async function deleteReport(reportId, event) {
  event.stopPropagation();
  // Lógica de eliminación
}

// Se pueden encolar comandos:
const commands = [
  () => likeReport(1),
  () => editReport(1),
  () => deleteReport(1)
];

commands.forEach(cmd => cmd());
```

**Ventaja:** Acciones reutilizables, encapsulables, ejecutables

---

## 1️⃣5️⃣ CHAIN OF RESPONSIBILITY PATTERN (Comportamiento)
**Ubicación:** `admin-functions.js:208-270`

```javascript
// Procesa petición a través de una CADENA de filtros
function filterAdminReports() {
  let filtered = adminReportsData;
  
  // FILTRO 1: Búsqueda de texto
  const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
  if (searchQuery) {
    filtered = filtered.filter(report => 
      report.titulo.toLowerCase().includes(searchQuery) ||
      report.contenido.toLowerCase().includes(searchQuery)
    );
  }
  
  // FILTRO 2: Por estado
  const statusFilter = document.getElementById('adminStatusFilter').value;
  if (statusFilter !== 'all') {
    filtered = filtered.filter(report => 
      report.estado === statusFilter
    );
  }
  
  // FILTRO 3: Por categoría
  const categoryFilter = document.getElementById('adminCategoryFilter').value;
  if (categoryFilter !== 'all') {
    filtered = filtered.filter(report => 
      report.categoria === categoryFilter
    );
  }
  
  // FILTRO 4: Ordenamiento
  const sortFilter = document.getElementById('adminSortFilter').value;
  filtered.sort((a, b) => {
    switch(sortFilter) {
      case 'recent': 
        return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
      case 'oldest': 
        return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
      case 'likes': 
        return b.likes - a.likes;
      default: 
        return 0;
    }
  });
  
  filteredAdminReports = filtered;
  renderAdminReportsTable();
}

// La petición pasa por cada FILTRO de la cadena:
// 1. Búsqueda ←
// 2. Estado ←
// 3. Categoría ←
// 4. Ordenamiento ←
// 5. Renderizar
```

**Ventaja:** Separación de responsabilidades, fácil de agregar filtros

---

## 1️⃣6️⃣ MEDIATOR PATTERN (Comportamiento)
**Ubicación:** `app.js:213-240`

```javascript
// El MEDIADOR controla la comunicación entre componentes
// (Sin mediador, los modales se comunicarían entre sí)

// MEDIADOR: funciones centralizadas
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

// Uso del MEDIADOR
<button onclick="switchModal('login', 'register')">
  ¿Crear cuenta?
</button>

<button onclick="openModal('createReport')">
  Nuevo reporte
</button>

// SIN MEDIADOR (ACOPLADO):
// Modal login conoce de Modal register
// loginModal.addEventListener('switch-to-register', () => {
//   registerModal.show();
// });

// CON MEDIADOR (DESACOPLADO):
// Los modales no se conocen entre sí
// Solo saben que existe el mediador (switchModal)
```

**Ventaja:** Desacoplamiento, comunicación centralizada

---

## 1️⃣7️⃣ ITERATOR PATTERN (Comportamiento)
**Ubicación:** `admin-functions.js:250-290`

```javascript
// Accede secuencialmente a COLECCIONES

// ITERATOR 1: Sobre reportes
filteredAdminReports.forEach(report => {
  // Procesar cada reporte
  console.log(report.titulo);
});

// ITERATOR 2: Usando map
const reportRows = filteredAdminReports.map(report => `
  <tr>
    <td>${report.titulo}</td>
    <td>${report.autor_nombre}</td>
    <td>${report.estado}</td>
  </tr>
`).join('');

// ITERATOR 3: Usando filter
const pendingReports = filteredAdminReports.filter(r => 
  r.estado === 'pendiente'
);

// ITERATOR 4: Paginado
function renderAdminReportsTable() {
  const start = (currentPage - 1) * reportsPerPage;
  const end = start + reportsPerPage;
  
  // Itera sobre slice de la colección
  const paginatedReports = filteredAdminReports.slice(start, end);
  
  paginatedReports.forEach(report => {
    // Renderizar
  });
}

// EN notifications.js
async function renderHeaderNotifications() {
  const notifications = result.notifications;
  
  // Itera sobre notificaciones
  container.innerHTML = notifications.map(notif => 
    createNotificationHTML(notif)
  ).join('');
}

// EN tendencias-functions.js
function renderTrending(container, trending) {
  // Itera con índice
  container.innerHTML = trending.map((item, index) => `
    <div class="trending-item">
      <div class="trending-rank">${index + 1}</div>
      <div class="trending-hashtag">${item.nombre}</div>
    </div>
  `).join('');
}
```

**Ventaja:** Abstracción de colecciones, código más legible

---

## 📋 Resumen de Ejemplos

| Patrón | Línea de Código | Beneficio Principal |
|--------|-----------------|-------------------|
| Factory | `createBottomNavigation()` | Encapsula creación |
| Singleton | `apiRequest()` | Consistencia global |
| Constructor | `showToast()` | Propiedades predecibles |
| Object Literal | `colors = {...}` | Cambios centralizados |
| Adapter | `apiRequest()` | Interface consistente |
| Module | Cada archivo | Privacidad + Organización |
| Facade | `openModal()` | Interface simple |
| Decorator | `createReportCard()` | Funcionalidad dinámica |
| Composite | Estructura card | Jerarquía reutilizable |
| Observer | `addEventListener()` | Reactividad automática |
| Strategy | `showTrending...()` | Algoritmos intercambiables |
| Template Method | `loadReports()` | Estructura predecible |
| State | `getCurrentUser()` | Comportamiento adaptativo |
| Command | `onclick="likeReport()"` | Acciones reutilizables |
| Chain of Resp. | Filtros en cascada | Separación de responsabilidades |
| Mediator | `switchModal()` | Desacoplamiento |
| Iterator | `.map()`, `.filter()` | Acceso a colecciones |

---

**Documento Generado:** 2025-12-03
**Ejemplos de Código:** 17/17 patrones cubiertos
**Estado:** Completo con ejemplos reales
