// SigmaForo - Main Application Logic with Backend Integration
// MODIFICADO: Sistema de subida de imágenes implementado

// ========================================
// CONFIGURATION
// ========================================

// Point to the backend API folder. Using an absolute path ensures fetch
// requests reach the PHP endpoints after the repository was reorganized.
const API_BASE_URL = '/src/backend/api';

if (typeof L !== 'undefined') {
  delete L.Icon.Default.prototype._getIconUrl;
  
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'libs/leaflet/images/marker-icon-2x.png',
    iconUrl: 'libs/leaflet/images/marker-icon.png',
    shadowUrl: 'libs/leaflet/images/marker-shadow.png',
  });
}

// ========================================
// AUTHENTICATION & USER MANAGEMENT
// ========================================

function isAuthenticated() {
  return localStorage.getItem('sigmaforo_token') !== null;
}

function getToken() {
  return localStorage.getItem('sigmaforo_token');
}

function getCurrentUser() {
  const userData = localStorage.getItem('sigmaforo_user');
  return userData ? JSON.parse(userData) : null;
}

function saveUser(user, token) {
  localStorage.setItem('sigmaforo_user', JSON.stringify(user));
  localStorage.setItem('sigmaforo_token', token);
}

function logout() {
  localStorage.removeItem('sigmaforo_user');
  localStorage.removeItem('sigmaforo_token');
  window.location.href = 'index.html';
}

// API Request Helper
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE_URL}/${endpoint}`;
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  try {
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || 'Error en la petición');
    }
    
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

// ========================================
// AUTHENTICATION HANDLERS
// ========================================

async function handleRegister(event) {
  event.preventDefault();
  const formData = new FormData(event.target);
  
  const password = formData.get('password');
  const confirmPassword = formData.get('confirmPassword');

  if (password !== confirmPassword) {
    showToast('Las contraseñas no coinciden', 'error');
    return;
  }

  try {
    const data = await apiRequest('auth.php?action=register', {
      method: 'POST',
      body: JSON.stringify({
        name: formData.get('name'),
        email: formData.get('email'),
        password: password,
        confirmPassword: confirmPassword
      })
    });
    
    if (data.success) {
      saveUser(data.data.user, data.data.token);
      showToast('¡Cuenta creada exitosamente!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showToast(error.message || 'Error al registrar usuario', 'error');
  }
}

async function handleLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const data = await apiRequest('auth.php?action=login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password')
      })
    });
    
    if (data.success) {
      saveUser(data.data.user, data.data.token);
      showToast('¡Bienvenido de vuelta!', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showToast(error.message || 'Credenciales incorrectas', 'error');
  }
}

async function handleAdminLogin(event) {
  event.preventDefault();
  const formData = new FormData(event.target);

  try {
    const data = await apiRequest('auth.php?action=admin-login', {
      method: 'POST',
      body: JSON.stringify({
        email: formData.get('email'),
        password: formData.get('password'),
        code2fa: formData.get('code2fa')
      })
    });
    
    if (data.success) {
      saveUser(data.data.user, data.data.token);
      showToast('Acceso administrativo concedido', 'success');
      setTimeout(() => {
        window.location.href = 'admin-dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showToast(error.message || 'Error al iniciar sesión como admin', 'error');
  }
}

async function loginAnonymous() {
  try {
    const data = await apiRequest('auth.php?action=anonymous', {
      method: 'POST'
    });
    
    if (data.success) {
      saveUser(data.data.user, data.data.token);
      showToast('Acceso anónimo concedido', 'success');
      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 1000);
    }
  } catch (error) {
    showToast(error.message || 'Error al iniciar sesión anónima', 'error');
  }
}

// Verificar permisos según tipo de usuario
function canComment() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo';
}

function canVote() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo';
}

function canEditProfile() {
  const user = getCurrentUser();
  return user && user.type !== 'anonimo';
}

function canEditOwnReports() {
  const user = getCurrentUser();
  return user && user.type === 'registrado';
}

function canDeleteOwnReports() {
  const user = getCurrentUser();
  return user && user.type === 'registrado';
}

function isAdmin() {
  const user = getCurrentUser();
  return user && user.type === 'admin';
}

function canModerateContent() {
  return isAdmin();
}

function canAccessStats() {
  return isAdmin();
}

// ========================================
// MODAL MANAGEMENT
// ========================================

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

// Close modal on outside click
window.onclick = function(event) {
  if (event.target.classList.contains('modal')) {
    event.target.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
};

// ========================================
// TOAST NOTIFICATIONS
// ========================================

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;

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

  setTimeout(() => {
    toast.classList.add('show');
  }, 10);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => {
      container.removeChild(toast);
    }, 300);
  }, 3000);
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getRelativeTime(dateString) {
  const date = new Date(dateString);
  const seconds = Math.floor((new Date() - date) / 1000);
  const intervals = {
    año: 31536000,
    mes: 2592000,
    semana: 604800,
    día: 86400,
    hora: 3600,
    minuto: 60,
  };

  for (const [name, secondsInterval] of Object.entries(intervals)) {
    const interval = Math.floor(seconds / secondsInterval);
    if (interval >= 1) {
      return `Hace ${interval} ${name}${interval > 1 ? 's' : ''}`;
    }
  }
  return 'Justo ahora';
}

function getCategoryColor(category) {
  const colors = {
    seguridad: '#dc2626',
    infraestructura: '#ea580c',
    vias: '#ca8a04',
    servicios: '#2563eb',
    medio_ambiente: '#16a34a',
  };
  return colors[category] || '#6b7280';
}

function getCategoryLabel(category) {
  const labels = {
    seguridad: 'Seguridad',
    infraestructura: 'Infraestructura',
    vias: 'Vías',
    servicios: 'Servicios',
    medio_ambiente: 'Medio Ambiente',
  };
  return labels[category] || 'Otro';
}

function getStatusLabel(status) {
  const labels = {
    pendiente: 'Pendiente',
    en_revision: 'En Revisión',
    en_proceso: 'En Proceso',
    resuelto: 'Resuelto',
  };
  return labels[status] || status;
}

function getStatusColor(status) {
  const colors = {
    pendiente: '#6b7280',
    en_revision: '#eab308',
    en_proceso: '#3b82f6',
    resuelto: '#22c55e',
  };
  return colors[status] || '#6b7280';
}

// ========================================
// USER DATA LOADING (Modificada para Fotos)
// ========================================

function loadUserData() {
  const user = getCurrentUser();
  if (!user) return;

  // 1. Actualizar Nombres
  const userNameElements = document.querySelectorAll('#userName');
  userNameElements.forEach(el => {
    el.textContent = user.name;
  });

  // 2. Actualizar Avatar (Foto o Letra)
  // Buscamos todos los elementos donde solía ir la inicial
  const userInitialElements = document.querySelectorAll('#userInitial');

  userInitialElements.forEach(el => {
    // Limpiamos cualquier contenido previo
    el.innerHTML = '';

    if (user.avatar_url) {
      // OPCIÓN A: El usuario tiene foto
      // Insertamos una etiqueta <img> que ocupe todo el espacio
      el.innerHTML = `<img src="${user.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
      
      // Ajustes estéticos al contenedor padre (para quitar el color de fondo de la letra)
      el.style.backgroundColor = 'transparent';
      el.style.display = 'block'; // Aseguramos que se comporte como bloque para la imagen
      
      // Si el contenedor padre tiene la clase 'avatar', le quitamos el fondo también
      if(el.parentElement && el.parentElement.classList.contains('avatar')) {
          el.parentElement.style.backgroundColor = 'transparent';
      }

    } else {
      // OPCIÓN B: No tiene foto (Comportamiento original)
      el.textContent = user.name.charAt(0).toUpperCase();
      // Centramos el texto por si acaso se desajustó
      el.style.display = 'flex';
      el.style.alignItems = 'center';
      el.style.justifyContent = 'center';
    }
  });

  // 3. Ocultar opciones de menú según tipo de usuario
  if (user.type === 'anonimo') {
    const menuPerfil = document.getElementById('menuPerfil');
    const menuReportes = document.getElementById('menuReportes');
    const menuConfig = document.getElementById('menuConfig');
    
    if (menuPerfil) menuPerfil.style.display = 'none';
    if (menuReportes) menuReportes.style.display = 'none';
    if (menuConfig) menuConfig.style.display = 'none';
  }
}

// ========================================
// REPORTS MANAGEMENT
// ========================================

let currentReports = [];
let currentFilter = 'all';

async function loadReports() {
  const container = document.getElementById('reportsFeed');
  if (!container) return;

  const user = getCurrentUser();
  let html = '';

  // Mostrar nota informativa para usuarios anónimos
  if (user && user.type === 'anonimo') {
    html += `
      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Modo Anónimo Activo</strong>
          <p>Puedes reportar incidentes y consultar el mapa, pero no puedes votar, comentar ni editar reportes. <a href="index.html">Regístrate</a> para acceder a todas las funcionalidades.</p>
        </div>
      </div>
    `;
  }

  try {
    const data = await apiRequest('reports.php?action=list');
    
    if (data.success) {
      currentReports = data.data.reports;
      
      if (currentReports.length === 0) {
        html += '<div class="empty-state">No hay reportes para mostrar</div>';
      } else {
        html += currentReports.map(report => createReportCard(report)).join('');
      }
      
      container.innerHTML = html;
    }
  } catch (error) {
    container.innerHTML = html + '<div class="empty-state">Error al cargar reportes</div>';
    showToast('Error al cargar reportes', 'error');
  }
}

function createReportCard(report) {
  const categoryColor = getCategoryColor(report.categoria);
  const relativeTime = getRelativeTime(report.fecha_creacion);
  const statusLabel = getStatusLabel(report.estado);
  const statusColor = getStatusColor(report.estado);
  const user = getCurrentUser();
  const canVoteBtn = canVote();
  const canCommentBtn = canComment();
  const isOwnReport = user && report.user_id === user.id;
  const canEdit = isOwnReport && canEditOwnReports();
  const canDelete = isOwnReport && canDeleteOwnReports();
  const canModerate = isAdmin();

  // --- NUEVA LÓGICA DE AVATAR ---
  // Verificamos si el reporte trae la foto del autor (autor_avatar)
  let avatarHTML;
  // Nota: En reports.php le pusimos alias 'autor_avatar' a la columna u.avatar_url
  if (report.autor_avatar) {
      // Si hay foto: Ponemos imagen y quitamos el fondo de color
      avatarHTML = `<img src="${report.autor_avatar}" alt="${report.autor_nombre}" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
  } else {
      // Si no hay foto: Ponemos la inicial
      avatarHTML = `<span>${report.autor_nombre.charAt(0).toUpperCase()}</span>`;
  }
  // -----------------------------

  return `
    <article class="report-card" id="report-${report.id}" onclick="openReportDetail(${report.id}, event)" style="cursor: pointer;">
      <div class="report-header">
        <div class="report-author">
          
          <div class="avatar" style="${report.autor_avatar ? 'background-color: transparent;' : ''}">
            ${avatarHTML}
          </div>

          <div class="author-info">
            <div class="author-name">${report.autor_nombre}</div>
            <div class="author-username">@${report.autor_username}</div>
          </div>
        </div>
        <div class="report-meta">
          <span class="report-time">${relativeTime}</span>
          ${canModerate || canEdit || canDelete ? `
            <button class="report-menu-btn" onclick="toggleReportMenu('${report.id}', event)">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="5" r="1"></circle>
                <circle cx="12" cy="19" r="1"></circle>
              </svg>
            </button>
            <div class="report-dropdown" id="menu-${report.id}">
              ${canEdit ? `<button class="dropdown-item" onclick="editReport('${report.id}', event)">Editar</button>` : ''}
              ${canDelete ? `<button class="dropdown-item" onclick="deleteReport('${report.id}', event)">Eliminar</button>` : ''}
              ${canModerate ? `
                <button class="dropdown-item" onclick="approveReport('${report.id}', event)">Aprobar</button>
                <button class="dropdown-item" onclick="markAsFalse('${report.id}', event)">Marcar como falso</button>
                <button class="dropdown-item danger" onclick="deleteReportAdmin('${report.id}', event)">Eliminar (Admin)</button>
              ` : ''}
            </div>
          ` : ''}
        </div>
      </div>

      <div class="report-content">
        <div class="report-categories">
          <span class="category-badge" style="background-color: ${categoryColor};">
            ${getCategoryLabel(report.categoria)}
          </span>
          <span class="status-badge" style="background-color: ${statusColor};">
            ${statusLabel}
          </span>
        </div>

        <h3 class="report-title">${report.titulo}</h3>
        <p class="report-description">${report.contenido}</p>

        ${report.hashtags_array && report.hashtags_array.length > 0 ? `
          <div class="report-hashtags">
            ${report.hashtags_array.map(tag => 
              `<span class="hashtag-badge" onclick="viewHashtagReports('${tag}', event)">#${tag}</span>`
            ).join('')}
          </div>
        ` : ''}

        ${report.imagen_url ? `
          <div class="report-image">
            <img src="${report.imagen_url}" alt="${report.titulo}" loading="lazy">
          </div>
        ` : ''}

        <div class="report-location">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          <span>${report.ubicacion}</span>
        </div>
      </div>

      <div class="report-footer">
        <div class="report-stats">
          <button class="stat-btn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span>${report.vistas}</span>
          </button>
          <button class="stat-btn ${canVoteBtn ? '' : 'disabled'}" onclick="likeReport(${report.id}, event)" ${canVoteBtn ? '' : 'disabled'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
            </svg>
            <span id="likes-${report.id}">${report.likes}</span>
          </button>
          <button class="stat-btn ${canCommentBtn ? '' : 'disabled'}" ${canCommentBtn ? '' : 'disabled'}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>${report.total_comentarios || 0}</span>
          </button>
        </div>
        <button class="share-btn">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
            <polyline points="16 6 12 2 8 6"></polyline>
            <line x1="12" y1="2" x2="12" y2="15"></line>
          </svg>
        </button>
      </div>
    </article>
  `;
}

async function likeReport(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!canVote()) {
    showToast('Los usuarios anónimos no pueden votar', 'warning');
    return;
  }
  
  try {
    const data = await apiRequest('reports.php?action=like', {
      method: 'POST',
      body: JSON.stringify({ report_id: reportId })
    });
    
    if (data.success) {
      const likesElement = document.getElementById(`likes-${reportId}`);
      if (likesElement) {
        likesElement.textContent = data.data.total_likes;
      }
      showToast(data.data.action === 'liked' ? '¡Like agregado!' : 'Like removido', 'success');
    }
  } catch (error) {
    showToast(error.message || 'Error al procesar like', 'error');
  }
}

async function filterReports() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;

  const query = searchInput.value.toLowerCase();
  
  try {
    const url = query ? `reports.php?action=list&search=${encodeURIComponent(query)}` : 'reports.php?action=list';
    const data = await apiRequest(url);
    
    if (data.success) {
      currentReports = data.data.reports;
      
      const container = document.getElementById('reportsFeed');
      if (container) {
        if (currentReports.length === 0) {
          container.innerHTML = '<div class="empty-state">No se encontraron reportes</div>';
        } else {
          container.innerHTML = currentReports.map(report => createReportCard(report)).join('');
        }
      }
    }
  } catch (error) {
    showToast('Error al filtrar reportes', 'error');
  }
}

// ========================================
// CREATE REPORT (MODIFICADO - SUBIDA DE IMÁGENES)
// ========================================

let mapPickerInstance = null;
let selectedMarker = null;
let selectedCoords = { lat: -18.0146, lng: -70.2506 };

function openCreateReportModal() {
  const modal = document.getElementById('createReportModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
      initMapPicker();
      setupHashtagSuggestions('reportDescription', 'hashtagSuggestions');
    }, 300);
  }
}

function closeCreateReportModal() {
  const modal = document.getElementById('createReportModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    
    if (mapPickerInstance) {
      mapPickerInstance.remove();
      mapPickerInstance = null;
    }
    
    // Limpiar preview de imagen
    const previewContainer = document.getElementById('imagePreview');
    if (previewContainer) {
      previewContainer.innerHTML = '';
      previewContainer.style.display = 'none';
    }
  }
}

function initMapPicker() {
  const container = document.getElementById('mapPicker');
  if (!container || !window.L) return;
  if (mapPickerInstance) return;

  mapPickerInstance = L.map(container).setView([selectedCoords.lat, selectedCoords.lng], 13);

  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(mapPickerInstance);

  selectedMarker = L.marker([selectedCoords.lat, selectedCoords.lng], {
    draggable: true
  }).addTo(mapPickerInstance);

  selectedMarker.on('dragend', function(e) {
    const pos = e.target.getLatLng();
    selectedCoords = { lat: pos.lat, lng: pos.lng };
    reverseGeocode(pos.lat, pos.lng);
  });

  mapPickerInstance.on('click', function(e) {
    selectedCoords = { lat: e.latlng.lat, lng: e.latlng.lng };
    selectedMarker.setLatLng(e.latlng);
    reverseGeocode(e.latlng.lat, e.latlng.lng);
  });

  reverseGeocode(selectedCoords.lat, selectedCoords.lng);
}

function reverseGeocode(lat, lng) {
  // NUEVA VERSIÓN: Usa el proxy PHP en lugar de llamada directa a Nominatim
  
  const url = `${API_BASE_URL}/geocoding.php?action=reverse&lat=${lat}&lon=${lng}`;
  
  fetch(url)
    .then(response => response.json())
    .then(data => {
      if (data.success && data.data) {
        const address = data.data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        const input = document.getElementById('locationInput');
        if (input) {
          input.value = address;
        }
      } else {
        // Fallback: mostrar coordenadas
        const input = document.getElementById('locationInput');
        if (input) {
          input.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
        }
      }
    })
    .catch(error => {
      console.log('Error en geocodificación, usando coordenadas:', error);
      // Fallback: mostrar coordenadas
      const input = document.getElementById('locationInput');
      if (input) {
        input.value = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      }
    });
}

function detectLocation() {
  if (!navigator.geolocation) {
    showToast('Geolocalización no soportada', 'error');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      selectedCoords = { lat: latitude, lng: longitude };
      
      if (mapPickerInstance && selectedMarker) {
        mapPickerInstance.setView([latitude, longitude], 15);
        selectedMarker.setLatLng([latitude, longitude]);
        reverseGeocode(latitude, longitude);
      }
      
      showToast('Ubicación detectada', 'success');
    },
    () => {
      showToast('No se pudo obtener la ubicación', 'error');
    }
  );
}

// *** FUNCIÓN MODIFICADA: handleCreateReport con subida de imágenes ***
async function handleCreateReport(event) {
  event.preventDefault();
  const form = event.target;
  const formData = new FormData(form);

  // Validar campos requeridos
  const title = formData.get('title');
  const description = formData.get('description');
  const category = formData.get('category');
  const location = formData.get('location');

  if (!title || !description || !category || !location) {
    showToast('Por favor completa todos los campos requeridos', 'warning');
    return;
  }

  // Mostrar loading
  const submitBtn = form.querySelector('button[type="submit"]');
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="animation: spin 1s linear infinite;"><circle cx="12" cy="12" r="10"></circle></svg> Publicando...';

  try {
    let imageUrl = null;

    // Si hay imagen, subirla primero
    const imageFile = formData.get('image');
    if (imageFile && imageFile.size > 0) {
      showToast('Subiendo imagen...', 'info');
      
      const imageFormData = new FormData();
      imageFormData.append('image', imageFile);

      const uploadResponse = await fetch(`${API_BASE_URL}/uploads.php?action=image`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${getToken()}`
        },
        body: imageFormData
      });

      const uploadData = await uploadResponse.json();

      if (!uploadData.success) {
        throw new Error(uploadData.message || 'Error al subir imagen');
      }

      imageUrl = uploadData.data.url;
      showToast('Imagen subida correctamente', 'success');
    }

    // Crear el reporte con la URL de la imagen (si existe)
    const reportData = {
      title: title,
      content: description,
      category: category,
      location: location,
      lat: selectedCoords.lat,
      lng: selectedCoords.lng,
      imageUrl: imageUrl
    };

    const data = await apiRequest('reports.php?action=create', {
      method: 'POST',
      body: JSON.stringify(reportData)
    });
    
    if (data.success) {
      closeCreateReportModal();
      showToast('¡Reporte publicado exitosamente!', 'success');
      
      if (window.location.pathname.includes('dashboard.html')) {
        loadReports();
        loadStats();
      }
      
      form.reset();
    }
  } catch (error) {
    showToast(error.message || 'Error al crear reporte', 'error');
  } finally {
    // Restaurar botón
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

// *** NUEVA FUNCIÓN: Preview de imagen ***
function previewImage(input) {
  const previewContainer = document.getElementById('imagePreview');
  if (!previewContainer) return;

  // Limpiar preview anterior
  previewContainer.innerHTML = '';

  if (input.files && input.files[0]) {
    const file = input.files[0];

    // Validar tamaño (5MB)
    if (file.size > 5242880) {
      showToast('La imagen es demasiado grande. Máximo 5MB', 'error');
      input.value = '';
      previewContainer.style.display = 'none';
      return;
    }

    // Validar tipo
    if (!file.type.match('image.*')) {
      showToast('El archivo debe ser una imagen', 'error');
      input.value = '';
      previewContainer.style.display = 'none';
      return;
    }

    const reader = new FileReader();

    reader.onload = function(e) {
      previewContainer.innerHTML = `
        <div style="position: relative; display: inline-block;">
          <img src="${e.target.result}" alt="Preview" style="max-width: 100%; max-height: 200px; border-radius: 8px;">
          <button 
            type="button" 
            onclick="removeImagePreview()" 
            style="position: absolute; top: 8px; right: 8px; background: rgba(0,0,0,0.7); color: white; border: none; border-radius: 50%; width: 28px; height: 28px; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 16px;"
            title="Eliminar imagen"
          >
            ×
          </button>
          <div style="margin-top: 8px; font-size: 12px; color: var(--text-muted);">
            ${file.name} (${(file.size / 1024).toFixed(1)} KB)
          </div>
        </div>
      `;
      previewContainer.style.display = 'block';
    };

    reader.readAsDataURL(file);
  } else {
    previewContainer.style.display = 'none';
  }
}

// *** NUEVA FUNCIÓN: Eliminar preview de imagen ***
function removeImagePreview() {
  const input = document.querySelector('input[name="image"]');
  if (input) {
    input.value = '';
  }
  
  const previewContainer = document.getElementById('imagePreview');
  if (previewContainer) {
    previewContainer.innerHTML = '';
    previewContainer.style.display = 'none';
  }
}

// ========================================
// STATS
// ========================================

async function loadStats() {
  try {
    const data = await apiRequest('reports.php?action=stats');
    
    if (data.success) {
      const stats = data.data;
      
      const totalElement = document.getElementById('totalReports');
      const todayElement = document.getElementById('reportsToday');
      const inProgressElement = document.getElementById('inProgress');

      if (totalElement) totalElement.textContent = stats.total || 0;
      if (todayElement) todayElement.textContent = stats.today || 0;
      if (inProgressElement) {
        const inProgress = stats.by_status?.en_proceso || 0;
        inProgressElement.textContent = inProgress;
      }
    }
  } catch (error) {
    console.error('Error loading stats:', error);
  }
}

// ========================================
// TRENDING (Mock for now)
// ========================================

function loadTrending() {
  const container = document.getElementById('trendingList');
  if (!container) return;

  // Mock data - se puede conectar a la BD después
  const mockTrending = [
    { hashtag: 'TacnaSegura', count: 1234 },
    { hashtag: 'BachesPeligrosos', count: 892 },
    { hashtag: 'TacnaVigilante', count: 567 },
    { hashtag: 'FaltaDeAgua', count: 445 },
    { hashtag: 'IluminacionPública', count: 321 },
  ];

  container.innerHTML = mockTrending.map((item, index) => `
    <div class="trending-item">
      <div class="trending-rank">${index + 1}</div>
      <div class="trending-content">
        <div class="trending-hashtag">#${item.hashtag}</div>
        <div class="trending-count">${item.count.toLocaleString()} reportes</div>
      </div>
    </div>
  `).join('');
}

// ========================================
// NOTIFICATIONS (Mock for now)
// ========================================

function toggleNotifications() {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) {
        const isShowing = dropdown.classList.toggle('show');
        
        // Si se abre el dropdown, cargar notificaciones
        if (isShowing) {
            renderHeaderNotifications();
        }
    }
}

function markAllAsRead() {
  showToast('Todas las notificaciones marcadas como leídas', 'success');
  loadNotifications();
}

function toggleUserMenu() {
  const dropdown = document.getElementById('userDropdown');
  if (dropdown) {
    dropdown.classList.toggle('show');
  }
}

// ========================================
// ADMIN FUNCTIONS
// ========================================

function toggleReportMenu(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  const menu = document.getElementById(`menu-${reportId}`);
  if (menu) {
    menu.classList.toggle('show');
  }
}

async function approveReport(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!isAdmin()) {
    showToast('No tienes permisos para esta acción', 'error');
    return;
  }
  
  try {
    await apiRequest(`reports.php?action=update&id=${reportId}`, {
      method: 'PUT',
      body: JSON.stringify({ status: 'en_proceso' })
    });
    
    showToast('Reporte aprobado', 'success');
    loadReports();
  } catch (error) {
    showToast(error.message || 'Error al aprobar reporte', 'error');
  }
}

async function markAsFalse(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!isAdmin()) {
    showToast('No tienes permisos para esta acción', 'error');
    return;
  }
  
  if (confirm('¿Marcar este reporte como falso/duplicado?')) {
    try {
      await apiRequest(`reports.php?action=update&id=${reportId}`, {
        method: 'PUT',
        body: JSON.stringify({ status: 'resuelto' })
      });
      
      showToast('Reporte marcado como falso', 'success');
      loadReports();
    } catch (error) {
      showToast(error.message || 'Error al marcar reporte', 'error');
    }
  }
}

async function deleteReportAdmin(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  if (!isAdmin()) {
    showToast('No tienes permisos para esta acción', 'error');
    return;
  }
  
  if (confirm('¿Eliminar este reporte permanentemente?')) {
    try {
      await apiRequest(`reports.php?action=delete&id=${reportId}`, {
        method: 'DELETE'
      });
      
      showToast('Reporte eliminado por administrador', 'success');
      loadReports();
    } catch (error) {
      showToast(error.message || 'Error al eliminar reporte', 'error');
    }
  }
}

function editReport(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  showToast('Función de edición próximamente', 'info');
}

async function deleteReport(reportId, event) {
  if (event) {
    event.stopPropagation();
  }
  
  const user = getCurrentUser();
  
  if (!canDeleteOwnReports()) {
    showToast('Los usuarios anónimos no pueden eliminar reportes', 'warning');
    return;
  }
  
  if (confirm('¿Eliminar este reporte?')) {
    try {
      await apiRequest(`reports.php?action=delete&id=${reportId}`, {
        method: 'DELETE'
      });
      
      showToast('Reporte eliminado', 'success');
      loadReports();
    } catch (error) {
      showToast(error.message || 'Error al eliminar reporte', 'error');
    }
  }
}

// ========================================
// ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {
  if (!isAdmin()) return;

  try {
    const data = await apiRequest('reports.php?action=stats');
    
    if (data.success) {
      const stats = data.data;
      
      document.getElementById('totalReportsAdmin').textContent = stats.total || 0;
      document.getElementById('pendingReportsAdmin').textContent = stats.by_status?.pendiente || 0;
      document.getElementById('totalUsersAdmin').textContent = 3; // Mock
      document.getElementById('urgentReportsAdmin').textContent = stats.by_category?.find(c => c.categoria === 'seguridad')?.total || 0;
    }
    
    // Load recent reports
    const reportsData = await apiRequest('reports.php?action=list&status=pendiente&limit=5');
    if (reportsData.success) {
      loadRecentPendingReports(reportsData.data.reports);
    }
    
  } catch (error) {
    console.error('Error loading admin dashboard:', error);
  }
}

function loadRecentPendingReports(reports) {
  const container = document.getElementById('recentReportsAdmin');
  if (!container) return;

  if (reports.length === 0) {
    container.innerHTML = '<div class="empty-state">No hay reportes pendientes</div>';
    return;
  }

  container.innerHTML = reports.map(report => `
    <div class="admin-list-item">
      <div class="admin-list-icon" style="background-color: ${getCategoryColor(report.categoria)};">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
      </div>
      <div class="admin-list-content">
        <div class="admin-list-title">${report.titulo}</div>
        <div class="admin-list-meta">
          ${report.autor_nombre} • ${getRelativeTime(report.fecha_creacion)}
        </div>
      </div>
      <div class="admin-list-actions">
        <button class="btn-icon" onclick="approveReport('${report.id}')" title="Aprobar">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </button>
      </div>
    </div>
  `).join('');
}

// ========================================
// OPEN REPORT DETAIL
// ========================================

function openReportDetail(reportId, event) {
  // Prevent navigation if clicking on interactive elements
  if (event) {
    const target = event.target;
    if (target.closest('button') || target.closest('a') || target.closest('.report-menu-btn')) {
      event.stopPropagation();
      return;
    }
  }
  
  window.location.href = `reporte-detalle.html?id=${reportId}`;
}

// ========================================
// CLOSE DROPDOWNS ON OUTSIDE CLICK
// ========================================

document.addEventListener('click', function(event) {
  if (!event.target.closest('.notification-wrapper')) {
    const dropdown = document.getElementById('notificationDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }

  if (!event.target.closest('.user-menu')) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) dropdown.classList.remove('show');
  }
  
  if (!event.target.closest('.report-menu-btn') && !event.target.closest('.report-dropdown')) {
    document.querySelectorAll('.report-dropdown').forEach(menu => {
      menu.classList.remove('show');
    });
  }
});

// ========================================
// FUNCIÓN PARA SUBIR AVATAR
// ========================================

async function uploadAvatar(input) {
  // Validar que haya archivo seleccionado
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  
  // Validar tamaño antes de enviar (2MB)
  if (file.size > 2 * 1024 * 1024) {
      showToast('La imagen es muy pesada (Máx 2MB)', 'error');
      return;
  }

  const formData = new FormData();
  formData.append('avatar', file); // 'avatar' es la key que espera uploads.php

  // Mostrar indicador de carga
  showToast('Subiendo foto de perfil...', 'info');

  try {
    // Llamada a la API (Endpoint que creamos en uploads.php)
    // Nota: Al usar FormData, NO ponemos headers Content-Type manualmente
    const response = await fetch(`${API_BASE_URL}/uploads.php?action=avatar`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${getToken()}`
        },
        body: formData
    });

    const data = await response.json();

    if (data.success) {
      // 1. Actualizamos los datos locales del usuario con la nueva URL
      const currentUser = getCurrentUser();
      currentUser.avatar_url = data.data.url; 
      saveUser(currentUser, getToken());

      // 2. Refrescamos la pantalla para ver la foto nueva al instante
      loadUserData();
      
      showToast('¡Foto actualizada con éxito!', 'success');
    } else {
        throw new Error(data.message || 'Error al subir imagen');
    }

  } catch (error) {
    console.error(error);
    showToast(error.message || 'Error de conexión', 'error');
  }
  
  // Limpiar el input para permitir subir la misma foto de nuevo si falla
  input.value = '';
}