// SigmaForo - Reporte Detalle Logic

let currentReport = null;
let currentReportId = null;
let currentComments = [];
let reportMap = null;
let isFollowing = false;

// ========================================
// INITIALIZATION
// ========================================

// CORRECCIÓN 5: Asegurar que se llame a loadUserData al cargar la página
// Ya existe en el DOMContentLoaded pero verificar que esté:

document.addEventListener('DOMContentLoaded', function() {
  // Verificar autenticación
  if (!isAuthenticated()) {
    showToast('Debes iniciar sesión para ver este reporte', 'error');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 2000);
    return;
  }

  // Cargar datos del usuario - IMPORTANTE
  loadUserData();

  // Get report ID from URL
  const urlParams = new URLSearchParams(window.location.search);
  currentReportId = urlParams.get('id');
  
  if (!currentReportId) {
    showToast('No se especificó un reporte', 'error');
    setTimeout(() => {
      window.location.href = 'dashboard.html';
    }, 2000);
    return;
  }
  
  // Load report data
  loadReportDetail();
  loadComments();
  checkIfFollowing();
  
  // Setup comment form visibility based on user type
  const user = getCurrentUser();
  if (!user || user.type === 'anonimo') {
    document.getElementById('commentFormContainer').innerHTML = `
      <div class="info-banner">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="16" x2="12" y2="12"></line>
          <line x1="12" y1="8" x2="12.01" y2="8"></line>
        </svg>
        <div>
          <strong>Necesitas estar registrado para comentar</strong>
          <p><a href="index.html">Inicia sesión</a> o <a href="index.html">regístrate</a> para participar en la conversación.</p>
        </div>
      </div>
    `;
  }
});

// ========================================
// CORRECCIONES PARA REPORTE-DETALLE.JS
// ========================================

// CORRECCIÓN 1: Cargar correctamente el usuario en el navbar
// Reemplazar la función loadUserData() existente con esta:

function loadUserData() {
  const user = getCurrentUser();
  if (!user) {
    // Si no hay usuario, redirigir al login
    window.location.href = 'index.html';
    return;
  }

  // Actualizar nombre de usuario en navbar
  const userNameElements = document.querySelectorAll('#userName');
  const userInitialElements = document.querySelectorAll('#userInitial');

  userNameElements.forEach(el => {
    el.textContent = user.name || 'Usuario';
  });

  userInitialElements.forEach(el => {
    const initial = user.name ? user.name.charAt(0).toUpperCase() : 'U';
    el.textContent = initial;
  });

  // Ocultar opciones de menú según tipo de usuario
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
// LOAD REPORT DETAIL
// ========================================

async function loadReportDetail() {
  try {
    const data = await apiRequest(`reports.php?action=get&id=${currentReportId}`);
    
    if (data.success) {
      currentReport = data.data.report;
      renderReportDetail(currentReport);
      initReportMap(currentReport);
      loadNearbyReports(currentReport);
    }
  } catch (error) {
    showToast('Error al cargar el reporte', 'error');
    console.error(error);
  }
}

function renderReportDetail(report) {
  // Avatar
  document.getElementById('reportDetailAvatar').textContent = report.autor_nombre.charAt(0).toUpperCase();
  
  // Author info
  document.getElementById('reportDetailAuthorName').textContent = report.autor_nombre;
  document.getElementById('reportDetailAuthorUsername').textContent = '@' + report.autor_username;
  document.getElementById('reportDetailTime').textContent = getRelativeTime(report.fecha_creacion);
  
  // Badges
  const categoryBadge = document.getElementById('reportDetailCategory');
  categoryBadge.textContent = getCategoryLabel(report.categoria);
  categoryBadge.style.backgroundColor = getCategoryColor(report.categoria);
  
  const statusBadge = document.getElementById('reportDetailStatus');
  statusBadge.textContent = getStatusLabel(report.estado);
  statusBadge.style.backgroundColor = getStatusColor(report.estado);
  
  // Content
  document.getElementById('reportDetailTitle').textContent = report.titulo;
  document.getElementById('reportDetailDescription').textContent = report.contenido;
  
  // Image
  const imageContainer = document.getElementById('reportDetailImageContainer');
  if (report.imagen_url) {
    imageContainer.innerHTML = `
      <img src="${report.imagen_url}" 
           alt="${report.titulo}" 
           class="report-detail-image" 
           loading="lazy"
           onerror="this.parentElement.style.display='none'">
    `;
    imageContainer.style.display = 'flex';
  } else {
    imageContainer.style.display = 'none';
  }
  
  // Location
  document.getElementById('reportDetailLocation').textContent = report.ubicacion;
  
  // Stats
  document.getElementById('reportDetailViews').textContent = report.vistas;
  document.getElementById('reportDetailLikes').textContent = report.likes;
  document.getElementById('reportDetailCommentsCount').textContent = report.total_comentarios || 0;
  
  // Timeline
  renderStatusTimeline(report);
  
  // Update page title
  document.title = report.titulo + ' - SigmaForo';
}

function renderStatusTimeline(report) {
  const timeline = document.getElementById('statusTimeline');
  
  const statuses = [
    { status: 'pendiente', label: 'Reportado', time: report.fecha_creacion },
  ];
  
  if (report.estado === 'en_revision' || report.estado === 'en_proceso' || report.estado === 'resuelto') {
    statuses.push({ status: 'en_revision', label: 'En Revisión', time: null });
  }
  
  if (report.estado === 'en_proceso' || report.estado === 'resuelto') {
    statuses.push({ status: 'en_proceso', label: 'En Proceso', time: null });
  }
  
  if (report.estado === 'resuelto') {
    statuses.push({ status: 'resuelto', label: 'Resuelto', time: null });
  }
  
  timeline.innerHTML = statuses.map((item, index) => {
    const isActive = index === statuses.length - 1;
    return `
      <div class="timeline-item">
        <div class="timeline-dot" style="${isActive ? 'background: ' + getStatusColor(item.status) : ''}">
          ${isActive ? `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="3">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          ` : ''}
        </div>
        <div class="timeline-content">
          <h4>${item.label}</h4>
          <p>${item.time ? getRelativeTime(item.time) : 'Pendiente'}</p>
        </div>
      </div>
    `;
  }).join('');
}

// ========================================
// MAP
// ========================================

function initReportMap(report) {
  const container = document.getElementById('reportDetailMap');
  if (!container || !window.L || !report.latitud || !report.longitud) return;
  
  if (reportMap) {
    reportMap.remove();
  }
  
  reportMap = L.map(container).setView([report.latitud, report.longitud], 15);
  
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap'
  }).addTo(reportMap);
  
  const color = getCategoryColor(report.categoria);
  
  const marker = L.marker([report.latitud, report.longitud], {
    icon: L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    })
  }).addTo(reportMap);
  
  marker.bindPopup(`
    <div style="font-family: system-ui; min-width: 200px;">
      <strong style="color: #111827;">${report.titulo}</strong>
      <p style="margin: 8px 0 0; color: #6b7280; font-size: 13px;">${report.ubicacion}</p>
    </div>
  `).openPopup();
}

// ========================================
// COMMENTS
// ========================================

async function loadComments() {
  try {
    const data = await apiRequest(`comments.php?action=list&report_id=${currentReportId}`);
    
    if (data.success) {
      currentComments = data.data.comments;
      renderComments(currentComments);
      
      // Update counts
      document.getElementById('commentsCount').textContent = currentComments.length;
      document.getElementById('reportDetailCommentsCount').textContent = currentComments.length;
    }
  } catch (error) {
    console.error('Error loading comments:', error);
  }
}

function renderComments(comments) {
  const container = document.getElementById('commentsList');
  const user = getCurrentUser();
  
  if (comments.length === 0) {
    container.innerHTML = `
      <div class="empty-comments">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
        <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
      </div>
    `;
    return;
  }
  
  container.innerHTML = comments.map(comment => {
    const isOwner = user && comment.user_id === user.id;
    const canDelete = isOwner || isAdmin();
    
    return `
      <div class="comment-item" id="comment-${comment.id}">
        <div class="comment-header">
          <div class="comment-author">
            <div class="comment-avatar">${comment.autor_nombre.charAt(0).toUpperCase()}</div>
            <div class="comment-author-info">
              <h4>${comment.autor_nombre}</h4>
              <p>@${comment.autor_username} • ${getRelativeTime(comment.fecha_creacion)}</p>
            </div>
          </div>
          ${canDelete ? `
            <div class="comment-actions">
              <button class="btn-icon" onclick="deleteComment('${comment.id}')" title="Eliminar">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"></polyline>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                </svg>
              </button>
            </div>
          ` : ''}
        </div>
        <div class="comment-content">${comment.contenido}</div>
      </div>
    `;
  }).join('');
}

async function submitComment() {
  const textarea = document.getElementById('commentInput');
  const content = textarea.value.trim();
  
  if (!content) {
    showToast('Escribe un comentario', 'warning');
    return;
  }
  
  if (content.length < 3) {
    showToast('El comentario debe tener al menos 3 caracteres', 'warning');
    return;
  }
  
  try {
    const data = await apiRequest('comments.php?action=create', {
      method: 'POST',
      body: JSON.stringify({
        report_id: currentReportId,
        content: content
      })
    });
    
    if (data.success) {
      showToast('Comentario publicado', 'success');
      textarea.value = '';
      updateCharCount();
      loadComments();
    }
  } catch (error) {
    showToast(error.message || 'Error al publicar comentario', 'error');
  }
}

async function deleteComment(commentId) {
  if (!confirm('¿Eliminar este comentario?')) return;
  
  try {
    const data = await apiRequest(`comments.php?action=delete&id=${commentId}`, {
      method: 'DELETE'
    });
    
    if (data.success) {
      showToast('Comentario eliminado', 'success');
      loadComments();
    }
  } catch (error) {
    showToast(error.message || 'Error al eliminar comentario', 'error');
  }
}

function updateCharCount() {
  const textarea = document.getElementById('commentInput');
  const count = document.getElementById('charCount');
  if (textarea && count) {
    count.textContent = textarea.value.length;
  }
}

// ========================================
// INTERACTIONS
// ========================================

async function handleDetailLike() {
  if (!canVote()) {
    showToast('Los usuarios anónimos no pueden dar likes', 'warning');
    return;
  }
  
  try {
    const data = await apiRequest('reports.php?action=like', {
      method: 'POST',
      body: JSON.stringify({ report_id: currentReportId })
    });
    
    if (data.success) {
      document.getElementById('reportDetailLikes').textContent = data.data.total_likes;
      showToast(data.data.action === 'liked' ? 'Like agregado' : 'Like removido', 'success');
    }
  } catch (error) {
    showToast(error.message || 'Error al procesar like', 'error');
  }
}

// CORRECCIÓN 3: Sistema de seguimiento con base de datos
// Reemplazar checkIfFollowing() con:

async function checkIfFollowing() {
  const user = getCurrentUser();
  if (!user || user.type === 'anonimo') {
    isFollowing = false;
    updateFollowButton();
    return;
  }

  try {
    const data = await apiRequest(`zones.php?action=is-following&report_id=${currentReportId}`);
    if (data.success) {
      isFollowing = data.data.is_following;
      updateFollowButton();
    }
  } catch (error) {
    console.error('Error checking follow status:', error);
    isFollowing = false;
    updateFollowButton();
  }
}

// CORRECCIÓN 4: Función toggleFollow con guardado en BD
// Reemplazar toggleFollow() con:

async function toggleFollow() {
  const user = getCurrentUser();
  
  if (!user || user.type === 'anonimo') {
    showToast('Debes iniciar sesión para seguir reportes', 'warning');
    return;
  }

  if (!currentReport) {
    showToast('Error: No se pudo cargar el reporte', 'error');
    return;
  }

  try {
    const data = await apiRequest('zones.php?action=toggle-follow', {
      method: 'POST',
      body: JSON.stringify({
        report_id: currentReportId,
        report_title: currentReport.titulo,
        latitude: currentReport.latitud,
        longitude: currentReport.longitud,
        location: currentReport.ubicacion
      })
    });
    
    if (data.success) {
      isFollowing = data.data.action === 'followed';
      updateFollowButton();
      
      showToast(
        isFollowing ? 'Ahora sigues este reporte' : 'Dejaste de seguir este reporte',
        'success'
      );
    }
  } catch (error) {
    showToast(error.message || 'Error al procesar seguimiento', 'error');
  }
}

function updateFollowButton() {
  const btn = document.getElementById('followBtn');
  const text = document.getElementById('followBtnText');
  
  if (isFollowing) {
    btn.classList.add('following');
    text.textContent = 'Siguiendo';
  } else {
    btn.classList.remove('following');
    text.textContent = 'Seguir Reporte';
  }
}

// ========================================
// SHARE
// ========================================

function copyReportLink() {
  const url = window.location.href;
  
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('Enlace copiado al portapapeles', 'success');
    }).catch(() => {
      fallbackCopyText(url);
    });
  } else {
    fallbackCopyText(url);
  }
}

function fallbackCopyText(text) {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();
  
  try {
    document.execCommand('copy');
    showToast('Enlace copiado', 'success');
  } catch (err) {
    showToast('No se pudo copiar el enlace', 'error');
  }
  
  document.body.removeChild(textarea);
}

function shareOnTwitter() {
  if (!currentReport) return;
  
  const text = `${currentReport.titulo} - Reportado en SigmaForo`;
  const url = window.location.href;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
  
  window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareOnWhatsApp() {
  if (!currentReport) return;
  
  const text = `${currentReport.titulo} - ${currentReport.ubicacion}\n\nVer más: ${window.location.href}`;
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
  
  window.open(whatsappUrl, '_blank');
}

function openShareModal() {
  showToast('Usa los botones de compartir en la barra lateral', 'info');
}

// ========================================
// NEARBY REPORTS
// ========================================

async function loadNearbyReports(report) {
  try {
    const data = await apiRequest(`reports.php?action=list&category=${report.categoria}&limit=5`);
    
    if (data.success) {
      const nearby = data.data.reports
        .filter(r => r.id != currentReportId)
        .slice(0, 3);
      
      renderNearbyReports(nearby);
    }
  } catch (error) {
    console.error('Error loading nearby reports:', error);
  }
}

function renderNearbyReports(reports) {
  const container = document.getElementById('nearbyReports');
  
  if (reports.length === 0) {
    container.innerHTML = '<p style="color: var(--text-secondary); font-size: 14px;">No hay reportes similares cercanos</p>';
    return;
  }
  
  container.innerHTML = reports.map(report => `
    <div class="nearby-report-item" onclick="window.location.href='reporte-detalle.html?id=${report.id}'">
      <h4 class="nearby-report-title">${report.titulo}</h4>
      <div class="nearby-report-meta">
        <span>${getCategoryLabel(report.categoria)}</span>
        <span>${getRelativeTime(report.fecha_creacion)}</span>
      </div>
    </div>
  `).join('');
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

document.addEventListener('keydown', function(e) {
  // Ctrl/Cmd + Enter to submit comment
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    const textarea = document.getElementById('commentInput');
    if (textarea === document.activeElement) {
      submitComment();
    }
  }
  
  // L to like
  if (e.key === 'l' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
    handleDetailLike();
  }
  
  // F to follow
  if (e.key === 'f' && document.activeElement.tagName !== 'TEXTAREA' && document.activeElement.tagName !== 'INPUT') {
    toggleFollow();
  }
});
