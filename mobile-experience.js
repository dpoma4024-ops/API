// ========================================
// MOBILE EXPERIENCE - JAVASCRIPT
// ========================================

/**
 * Inicializar experiencia móvil
 */
function initMobileExperience() {
  if (window.innerWidth <= 768) {
    createBottomNavigation();
    createFloatingActionButton();
    createTrendingButton();
    createReportInfoButton();
    initMobileModals();
  }
}

/**
 * Crear navegación inferior (Bottom Nav)
 */
function createBottomNavigation() {
  // Verificar si ya existe
  if (document.querySelector('.mobile-bottom-nav')) return;

  const currentPage = window.location.pathname.split('/').pop() || 'dashboard.html';
  
  const bottomNav = document.createElement('div');
  bottomNav.className = 'mobile-bottom-nav';
  
  const notificationCount = document.querySelector('.notification-badge')?.textContent || '0';
  
  bottomNav.innerHTML = `
    <div class="mobile-bottom-nav-content">
      <a href="dashboard.html" class="mobile-nav-item ${currentPage.includes('dashboard') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
        </svg>
        <span>Inicio</span>
      </a>
      
      <a href="mapa.html" class="mobile-nav-item ${currentPage.includes('mapa') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>Mapa</span>
      </a>
      
      <a href="alertas.html" class="mobile-nav-item ${currentPage.includes('alertas') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
        </svg>
        <span>Alertas</span>
        ${notificationCount !== '0' ? `<span class="mobile-nav-badge">${notificationCount}</span>` : ''}
      </a>
      
      <a href="mis-reportes.html" class="mobile-nav-item ${currentPage.includes('mis-reportes') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
        </svg>
        <span>Mis Reportes</span>
      </a>
      
      <a href="perfil.html" class="mobile-nav-item ${currentPage.includes('perfil') ? 'active' : ''}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
          <circle cx="12" cy="7" r="4"></circle>
        </svg>
        <span>Perfil</span>
      </a>
    </div>
  `;
  
  document.body.appendChild(bottomNav);
}

/**
 * Crear botón flotante de acción (FAB)
 */
function createFloatingActionButton() {
  // Verificar si ya existe
  if (document.querySelector('.mobile-fab')) return;

  // Solo mostrar en páginas específicas
  const currentPage = window.location.pathname.split('/').pop();
  const showFabPages = ['dashboard.html', 'mapa.html', 'mis-reportes.html'];
  
  if (!showFabPages.some(page => currentPage.includes(page))) return;

  const fab = document.createElement('button');
  fab.className = 'mobile-fab';
  fab.setAttribute('aria-label', 'Crear reporte');
  
  fab.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  `;
  
  fab.addEventListener('click', () => {
    openCreateReportModal();
  });
  
  document.body.appendChild(fab);
}

/**
 * Crear botón de tendencias (solo en dashboard y mapa)
 */
function createTrendingButton() {
  // Verificar si ya existe
  if (document.querySelector('.mobile-trending-btn')) return;

  const currentPage = window.location.pathname.split('/').pop();
  const showTrendingPages = ['dashboard.html', 'mapa.html'];
  
  if (!showTrendingPages.some(page => currentPage.includes(page))) return;

  const btn = document.createElement('button');
  btn.className = 'mobile-trending-btn';
  btn.setAttribute('aria-label', 'Ver tendencias');
  
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
    </svg>
  `;
  
  btn.addEventListener('click', openTrendingModal);
  
  document.body.appendChild(btn);
}

/**
 * Crear botón de info del reporte (solo en reporte-detalle)
 */
function createReportInfoButton() {
  const currentPage = window.location.pathname.split('/').pop();
  
  if (!currentPage.includes('reporte-detalle')) return;
  if (document.querySelector('.mobile-report-info-btn')) return;

  const btn = document.createElement('button');
  btn.className = 'mobile-report-info-btn';
  btn.setAttribute('aria-label', 'Ver información');
  
  btn.innerHTML = `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <circle cx="12" cy="12" r="10"></circle>
      <line x1="12" y1="16" x2="12" y2="12"></line>
      <line x1="12" y1="8" x2="12.01" y2="8"></line>
    </svg>
  `;
  
  btn.addEventListener('click', openReportInfoModal);
  
  document.body.appendChild(btn);
}

/**
 * Abrir modal de tendencias
 */
function openTrendingModal() {
  let modal = document.getElementById('mobileTrendingModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mobileTrendingModal';
    modal.className = 'mobile-trending-modal';
    
    modal.innerHTML = `
      <div class="mobile-trending-drawer">
        <div class="mobile-trending-header">
          <h2>Tendencias</h2>
          <button class="mobile-trending-close" onclick="closeTrendingModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div class="mobile-trending-tabs">
          <button class="mobile-trending-tab active" onclick="switchTrendingTab(this, 'trending')">
            Tendencias
          </button>
          <button class="mobile-trending-tab" onclick="switchTrendingTab(this, 'stats')">
            Estadísticas
          </button>
        </div>
        
        <div id="mobileTrendingContent">
          <!-- El contenido se cargará dinámicamente -->
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer click en el fondo
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeTrendingModal();
      }
    });
  }
  
  loadTrendingContent('trending');
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/**
 * Cerrar modal de tendencias
 */
function closeTrendingModal() {
  const modal = document.getElementById('mobileTrendingModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Cambiar tab en el modal de tendencias
 */
function switchTrendingTab(button, type) {
  // Actualizar tabs activas
  document.querySelectorAll('.mobile-trending-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  button.classList.add('active');
  
  // Cargar contenido
  loadTrendingContent(type);
}

/**
 * Cargar contenido del modal de tendencias
 */
async function loadTrendingContent(type) {
  const container = document.getElementById('mobileTrendingContent');
  
  if (type === 'trending') {
    // Copiar contenido de tendencias
    const trendingList = document.getElementById('trendingList');
    if (trendingList) {
      container.innerHTML = `
        <div class="trending-card" style="background: transparent; border: none; padding: 0;">
          ${trendingList.innerHTML}
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
          <p>Cargando tendencias...</p>
        </div>
      `;
      // Intentar cargar tendencias
      await loadTrending(5);
      const newTrendingList = document.getElementById('trendingList');
      if (newTrendingList) {
        container.innerHTML = `
          <div class="trending-card" style="background: transparent; border: none; padding: 0;">
            ${newTrendingList.innerHTML}
          </div>
        `;
      }
    }
  } else if (type === 'stats') {
    // Copiar estadísticas
    const statsCard = document.querySelector('.stats-card');
    if (statsCard) {
      container.innerHTML = statsCard.outerHTML.replace('stats-card', 'stats-card').replace(/background[^;]+;/g, 'background: transparent;').replace(/border[^;]+;/g, 'border: none;');
    } else {
      container.innerHTML = `
        <div class="empty-state" style="padding: 40px 20px;">
          <p>No hay estadísticas disponibles</p>
        </div>
      `;
    }
  }
}

/**
 * Abrir modal de info del reporte
 */
function openReportInfoModal() {
  let modal = document.getElementById('mobileReportInfoModal');
  
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'mobileReportInfoModal';
    modal.className = 'mobile-report-info-modal';
    
    modal.innerHTML = `
      <div class="mobile-report-info-drawer">
        <div class="mobile-trending-header">
          <h2>Información</h2>
          <button class="mobile-trending-close" onclick="closeReportInfoModal()">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        
        <div id="mobileReportInfoContent">
          <!-- El contenido se cargará dinámicamente -->
        </div>
      </div>
    `;
    
    document.body.appendChild(modal);
    
    // Cerrar al hacer click en el fondo
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeReportInfoModal();
      }
    });
  }
  
  loadReportInfoContent();
  modal.classList.add('show');
  document.body.style.overflow = 'hidden';
}

/**
 * Cerrar modal de info del reporte
 */
function closeReportInfoModal() {
  const modal = document.getElementById('mobileReportInfoModal');
  if (modal) {
    modal.classList.remove('show');
    document.body.style.overflow = 'auto';
  }
}

/**
 * Cargar contenido del sidebar en el modal
 */
function loadReportInfoContent() {
  const container = document.getElementById('mobileReportInfoContent');
  const sidebar = document.querySelector('.report-sidebar');
  
  if (sidebar) {
    // Clonar el contenido del sidebar
    const sidebarClone = sidebar.cloneNode(true);
    
    // Remover estilos de posición sticky
    sidebarClone.style.position = 'static';
    sidebarClone.style.top = 'auto';
    
    container.innerHTML = '';
    container.appendChild(sidebarClone);
  } else {
    container.innerHTML = `
      <div class="empty-state" style="padding: 40px 20px;">
        <p>No hay información adicional</p>
      </div>
    `;
  }
}

/**
 * Inicializar modales móviles
 */
function initMobileModals() {
  // Prevenir scroll cuando los modales están abiertos
  document.addEventListener('touchmove', (e) => {
    const trendingModal = document.getElementById('mobileTrendingModal');
    const reportInfoModal = document.getElementById('mobileReportInfoModal');
    
    if (trendingModal?.classList.contains('show') || reportInfoModal?.classList.contains('show')) {
      const target = e.target;
      const isInsideDrawer = target.closest('.mobile-trending-drawer') || target.closest('.mobile-report-info-drawer');
      
      if (!isInsideDrawer) {
        e.preventDefault();
      }
    }
  }, { passive: false });
}

/**
 * Actualizar badge de notificaciones en bottom nav
 */
function updateMobileNotificationBadge(count) {
  const badge = document.querySelector('.mobile-bottom-nav .mobile-nav-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

/**
 * Manejar cambios de orientación
 */
window.addEventListener('orientationchange', () => {
  setTimeout(() => {
    if (window.innerWidth <= 768) {
      initMobileExperience();
    } else {
      // Limpiar elementos móviles si se rota a landscape en tablet
      const bottomNav = document.querySelector('.mobile-bottom-nav');
      const fab = document.querySelector('.mobile-fab');
      const trendingBtn = document.querySelector('.mobile-trending-btn');
      const reportInfoBtn = document.querySelector('.mobile-report-info-btn');
      
      if (bottomNav) bottomNav.remove();
      if (fab) fab.remove();
      if (trendingBtn) trendingBtn.remove();
      if (reportInfoBtn) reportInfoBtn.remove();
    }
  }, 200);
});

/**
 * Manejar resize
 */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    if (window.innerWidth <= 768) {
      initMobileExperience();
    }
  }, 250);
});

/**
 * Inicializar al cargar la página
 */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initMobileExperience);
} else {
  initMobileExperience();
}

/**
 * Swipe para cerrar modales
 */
function addSwipeToClose(modal, drawer) {
  let startY = 0;
  let currentY = 0;
  let isDragging = false;

  drawer.addEventListener('touchstart', (e) => {
    startY = e.touches[0].clientY;
    isDragging = true;
  }, { passive: true });

  drawer.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    
    currentY = e.touches[0].clientY;
    const deltaY = currentY - startY;
    
    if (deltaY > 0) {
      drawer.style.transform = `translateY(${deltaY}px)`;
    }
  }, { passive: true });

  drawer.addEventListener('touchend', () => {
    if (!isDragging) return;
    
    const deltaY = currentY - startY;
    
    if (deltaY > 100) {
      // Cerrar modal
      if (modal.id === 'mobileTrendingModal') {
        closeTrendingModal();
      } else if (modal.id === 'mobileReportInfoModal') {
        closeReportInfoModal();
      }
    } else {
      // Volver a la posición original
      drawer.style.transform = 'translateY(0)';
    }
    
    isDragging = false;
    startY = 0;
    currentY = 0;
  });
}

// Agregar swipe cuando se creen los modales
const originalOpenTrending = openTrendingModal;
openTrendingModal = function() {
  originalOpenTrending();
  setTimeout(() => {
    const modal = document.getElementById('mobileTrendingModal');
    const drawer = modal?.querySelector('.mobile-trending-drawer');
    if (modal && drawer) {
      addSwipeToClose(modal, drawer);
    }
  }, 100);
};

const originalOpenReportInfo = openReportInfoModal;
openReportInfoModal = function() {
  originalOpenReportInfo();
  setTimeout(() => {
    const modal = document.getElementById('mobileReportInfoModal');
    const drawer = modal?.querySelector('.mobile-report-info-drawer');
    if (modal && drawer) {
      addSwipeToClose(modal, drawer);
    }
  }, 100);
};
