// ========================================
// ADMIN REPORTS PAGE
// ========================================

let adminReportsData = [];
let filteredAdminReports = [];
let currentPage = 1;
const reportsPerPage = 10;
let selectedReportIds = new Set();
let selectedUserForBan = null;

async function loadAdminReports() {
  try {
    const data = await apiRequest('reports.php?action=list&limit=100');
    
    if (data.success) {
      adminReportsData = data.data.reports;
      filteredAdminReports = [...adminReportsData];
      
      updateReportsCounts();
      renderAdminReportsTable();
    }
  } catch (error) {
    console.error('Error loading admin reports:', error);
    showToast('Error al cargar reportes', 'error');
  }
}

function updateReportsCounts() {
  document.getElementById('totalReportsCount').textContent = adminReportsData.length;
  document.getElementById('pendingReportsCount').textContent = 
    adminReportsData.filter(r => r.status === 'pendiente').length;
}

function filterAdminReports() {
  const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
  const statusFilter = document.getElementById('adminStatusFilter').value;
  const categoryFilter = document.getElementById('adminCategoryFilter').value;
  const sortFilter = document.getElementById('adminSortFilter').value;

  filteredAdminReports = adminReportsData.filter(report => {
    const matchesSearch = report.title.toLowerCase().includes(searchQuery) ||
                         report.content.toLowerCase().includes(searchQuery) ||
                         report.authorName.toLowerCase().includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  // Sort
  filteredAdminReports.sort((a, b) => {
    switch(sortFilter) {
      case 'recent':
        return b.createdAt - a.createdAt;
      case 'oldest':
        return a.createdAt - b.createdAt;
      case 'likes':
        return b.likes - a.likes;
      case 'views':
        return b.views - a.views;
      default:
        return 0;
    }
  });

  currentPage = 1;
  renderAdminReportsTable();
}

function renderAdminReportsTable() {
  const tbody = document.getElementById('adminReportsTableBody');
  if (!tbody) return;

  const start = (currentPage - 1) * reportsPerPage;
  const end = start + reportsPerPage;
  const paginatedReports = filteredAdminReports.slice(start, end);

  tbody.innerHTML = paginatedReports.map(report => `
    <tr>
      <td>
        <input type="checkbox" 
               class="report-checkbox" 
               data-id="${report.id}" 
               ${selectedReportIds.has(report.id) ? 'checked' : ''}
               onchange="toggleReportSelection('${report.id}')">
      </td>
      <td>
        <div class="table-report-info">
          <div class="table-report-title">${report.titulo}</div>
          <div class="table-report-location">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
              <circle cx="12" cy="10" r="3"></circle>
            </svg>
            ${report.ubicacion}
          </div>
        </div>
      </td>
      <td>
        <div class="table-user-info">
          <div class="table-user-avatar">
            ${report.autor_nombre.charAt(0)}
          </div>
          <div>
            <div class="table-user-name">${report.autor_nombre}</div>
            <div class="table-user-username">@${report.autor_username}</div>
          </div>
        </div>
      </td>
      <td>
        <span class="category-badge" style="background-color: ${getCategoryColor(report.categoria)};">
          ${getCategoryLabel(report.categoria)}
        </span>
      </td>
      <td>
        <span class="status-badge" style="background-color: ${getStatusColor(report.estado)};">
          ${getStatusLabel(report.estado)}
        </span>
      </td>
      <td>
        <div class="table-date">${getRelativeTime(report.fecha_creacion)}</div>
      </td>
      <td>
        <div class="table-engagement">
          <span>👁 ${report.vistas}</span>
          <span>👍 ${report.likes}</span>
        </div>
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="viewReportDetail('${report.id}')" title="Ver detalle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          <button class="btn-icon" onclick="approveReport('${report.id}')" title="Aprobar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </button>
          <button class="btn-icon danger" onclick="deleteReportAdmin('${report.id}')" title="Eliminar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
        </div>
      </td>
    </tr>
  `).join('');

  updatePagination();
}

function updatePagination() {
  const totalPages = Math.ceil(filteredAdminReports.length / reportsPerPage);
  const start = (currentPage - 1) * reportsPerPage + 1;
  const end = Math.min(start + reportsPerPage - 1, filteredAdminReports.length);

  document.getElementById('showingCount').textContent = `${start}-${end}`;
  document.getElementById('totalCount').textContent = filteredAdminReports.length;

  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  
  if (prevBtn) prevBtn.disabled = currentPage === 1;
  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;

  const pagesContainer = document.getElementById('paginationPages');
  if (pagesContainer) {
    let pagesHTML = '';
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {
        pagesHTML += `<button class="pagination-page ${i === currentPage ? 'active' : ''}" 
                             onclick="goToPage(${i})">${i}</button>`;
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        pagesHTML += '<span class="pagination-ellipsis">...</span>';
      }
    }
    pagesContainer.innerHTML = pagesHTML;
  }
}

function previousPage() {
  if (currentPage > 1) {
    currentPage--;
    renderAdminReportsTable();
  }
}

function nextPage() {
  const totalPages = Math.ceil(filteredAdminReports.length / reportsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderAdminReportsTable();
  }
}

function goToPage(page) {
  currentPage = page;
  renderAdminReportsTable();
}

function toggleReportSelection(reportId) {
  if (selectedReportIds.has(reportId)) {
    selectedReportIds.delete(reportId);
  } else {
    selectedReportIds.add(reportId);
  }
  updateSelectAllCheckbox();
}

function toggleSelectAll() {
  const checkbox = document.getElementById('selectAllCheckbox');
  const start = (currentPage - 1) * reportsPerPage;
  const end = start + reportsPerPage;
  const currentPageReports = filteredAdminReports.slice(start, end);

  if (checkbox.checked) {
    currentPageReports.forEach(report => selectedReportIds.add(report.id));
  } else {
    currentPageReports.forEach(report => selectedReportIds.delete(report.id));
  }
  
  renderAdminReportsTable();
}

function updateSelectAllCheckbox() {
  const checkbox = document.getElementById('selectAllCheckbox');
  if (!checkbox) return;

  const start = (currentPage - 1) * reportsPerPage;
  const end = start + reportsPerPage;
  const currentPageReports = filteredAdminReports.slice(start, end);
  
  const allSelected = currentPageReports.length > 0 && 
                     currentPageReports.every(r => selectedReportIds.has(r.id));
  checkbox.checked = allSelected;
}

function selectAllReports() {
  filteredAdminReports.forEach(report => selectedReportIds.add(report.id));
  renderAdminReportsTable();
  showToast(`${selectedReportIds.size} reportes seleccionados`, 'info');
}

function bulkApproveReports() {
  if (selectedReportIds.size === 0) {
    showToast('No hay reportes seleccionados', 'warning');
    return;
  }

  if (confirm(`¿Aprobar ${selectedReportIds.size} reportes seleccionados?`)) {
    selectedReportIds.forEach(id => {
      const report = mockReports.find(r => r.id === id);
      if (report) report.status = 'en_proceso';
    });
    
    selectedReportIds.clear();
    loadAdminReports();
    showToast('Reportes aprobados exitosamente', 'success');
  }
}

function bulkDeleteReports() {
  if (selectedReportIds.size === 0) {
    showToast('No hay reportes seleccionados', 'warning');
    return;
  }

  if (confirm(`¿Eliminar permanentemente ${selectedReportIds.size} reportes?`)) {
    selectedReportIds.forEach(id => {
      const index = mockReports.findIndex(r => r.id === id);
      if (index > -1) mockReports.splice(index, 1);
    });
    
    selectedReportIds.clear();
    currentReports = [...mockReports];
    loadAdminReports();
    showToast('Reportes eliminados exitosamente', 'success');
  }
}

function viewReportDetail(reportId) {
  const report = mockReports.find(r => r.id === reportId);
  if (!report) return;

  const content = document.getElementById('reportDetailContent');
  if (!content) return;

  content.innerHTML = `
    <div class="report-detail-view">
      <div class="report-detail-header">
        <div class="report-detail-badges">
          <span class="category-badge" style="background-color: ${getCategoryColor(report.category)};">
            ${getCategoryLabel(report.category)}
          </span>
          <span class="status-badge" style="background-color: ${getStatusColor(report.status)};">
            ${getStatusLabel(report.status)}
          </span>
        </div>
        <div class="report-detail-date">${getRelativeTime(report.createdAt)}</div>
      </div>

      <h2 class="report-detail-title">${report.title}</h2>

      <div class="report-detail-author">
        <div class="avatar">${report.authorName.charAt(0)}</div>
        <div>
          <div class="author-name">${report.authorName}</div>
          <div class="author-username">@${report.authorUsername}</div>
        </div>
      </div>

      <div class="report-detail-content">
        <p>${report.content}</p>
      </div>

      ${report.imageUrl ? `
        <div class="report-detail-image">
          <img src="${report.imageUrl}" alt="${report.title}">
        </div>
      ` : ''}

      <div class="report-detail-location">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        <span>${report.location}</span>
      </div>

      <div class="report-detail-stats">
        <div class="detail-stat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
          </svg>
          <span>${report.views} vistas</span>
        </div>
        <div class="detail-stat">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
          </svg>
          <span>${report.likes} likes</span>
        </div>
      </div>

      <div class="report-detail-actions">
        <button class="btn btn-primary" onclick="approveReport('${report.id}'); closeReportDetailModal();">
          Aprobar Reporte
        </button>
        <button class="btn btn-outline" onclick="markAsFalse('${report.id}'); closeReportDetailModal();">
          Marcar como Falso
        </button>
        <button class="btn btn-danger" onclick="if(confirm('¿Eliminar este reporte?')) { deleteReportAdmin('${report.id}'); closeReportDetailModal(); }">
          Eliminar Reporte
        </button>
      </div>
    </div>
  `;

  openReportDetailModal();
}

function openReportDetailModal() {
  const modal = document.getElementById('reportDetailModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeReportDetailModal() {
  const modal = document.getElementById('reportDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

// ========================================
// ADMIN USERS PAGE
// ========================================

let adminUsersData = [];
let filteredAdminUsers = [];

function loadAdminUsers() {
  // Crear usuarios mock basados en los reportes existentes
  const uniqueAuthors = new Set();
  mockReports.forEach(report => {
    uniqueAuthors.add(JSON.stringify({
      id: report.authorId,
      name: report.authorName,
      username: report.authorUsername
    }));
  });

  adminUsersData = Array.from(uniqueAuthors).map(userStr => {
    const user = JSON.parse(userStr);
    const userReports = mockReports.filter(r => r.authorId === user.id);
    const randomType = Math.random();
    
    return {
      ...user,
      email: `${user.username}@ejemplo.com`,
      type: randomType > 0.9 ? 'admin' : randomType > 0.3 ? 'registrado' : 'anonimo',
      isBanned: Math.random() > 0.9,
      banReason: null,
      joinedDate: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000),
      totalReports: userReports.length,
      totalLikes: userReports.reduce((sum, r) => sum + r.likes, 0),
      totalViews: userReports.reduce((sum, r) => sum + r.views, 0)
    };
  });

  filteredAdminUsers = [...adminUsersData];
  
  updateUsersCounts();
  renderAdminUsersTable();
}

function updateUsersCounts() {
  document.getElementById('totalUsersCount').textContent = adminUsersData.length;
  document.getElementById('bannedUsersCount').textContent = 
    adminUsersData.filter(u => u.isBanned).length;
}

function filterAdminUsers() {
  const searchQuery = document.getElementById('userSearchInput').value.toLowerCase();
  const typeFilter = document.getElementById('userTypeFilter').value;
  const statusFilter = document.getElementById('userStatusFilter').value;
  const sortFilter = document.getElementById('userSortFilter').value;

  filteredAdminUsers = adminUsersData.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery) ||
                         user.email.toLowerCase().includes(searchQuery);
    const matchesType = typeFilter === 'all' || user.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && !user.isBanned) ||
                         (statusFilter === 'banned' && user.isBanned);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Sort
  filteredAdminUsers.sort((a, b) => {
    switch(sortFilter) {
      case 'recent':
        return b.joinedDate - a.joinedDate;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'reports':
        return b.totalReports - a.totalReports;
      default:
        return 0;
    }
  });

  renderAdminUsersTable();
}

function renderAdminUsersTable() {
  const tbody = document.getElementById('adminUsersTableBody');
  if (!tbody) return;

  tbody.innerHTML = filteredAdminUsers.map(user => `
    <tr class="${user.isBanned ? 'banned-user' : ''}">
      <td>
        <div class="table-user-info">
          <div class="table-user-avatar ${user.isBanned ? 'banned' : ''}">
            ${user.name.charAt(0)}
          </div>
          <div>
            <div class="table-user-name">${user.name}</div>
            <div class="table-user-username">@${user.username}</div>
          </div>
        </div>
      </td>
      <td>${user.email}</td>
      <td>
        <span class="user-type-badge ${user.type}">
          ${user.type === 'admin' ? 'Administrador' : user.type === 'registrado' ? 'Registrado' : 'Anónimo'}
        </span>
      </td>
      <td>
        <div class="table-user-stats">
          <span>${user.totalReports} reportes</span>
          <span class="text-muted">${user.totalLikes} likes</span>
        </div>
      </td>
      <td>
        <div class="table-date">${getRelativeTime(user.joinedDate)}</div>
      </td>
      <td>
        ${user.isBanned ? `
          <span class="status-badge" style="background-color: #ef4444;">Baneado</span>
        ` : `
          <span class="status-badge" style="background-color: #22c55e;">Activo</span>
        `}
      </td>
      <td>
        <div class="table-actions">
          <button class="btn-icon" onclick="viewUserDetail('${user.id}')" title="Ver detalle">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
          </button>
          ${!user.isBanned && user.type !== 'admin' ? `
            <button class="btn-icon danger" onclick="openBanUserModal('${user.id}')" title="Banear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
              </svg>
            </button>
          ` : user.isBanned ? `
            <button class="btn-icon" onclick="unbanUser('${user.id}')" title="Desbanear">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
            </button>
          ` : ''}
        </div>
      </td>
    </tr>
  `).join('');

  document.getElementById('showingUsersCount').textContent = filteredAdminUsers.length;
  document.getElementById('totalUsersTableCount').textContent = adminUsersData.length;
}

function viewUserDetail(userId) {
  const user = adminUsersData.find(u => u.id === userId);
  if (!user) return;

  const userReports = mockReports.filter(r => r.authorId === userId);

  const content = document.getElementById('userDetailContent');
  if (!content) return;

  content.innerHTML = `
    <div class="user-detail-view">
      <div class="user-detail-header">
        <div class="user-detail-avatar ${user.isBanned ? 'banned' : ''}">
          ${user.name.charAt(0)}
        </div>
        <div class="user-detail-info">
          <h2>${user.name}</h2>
          <p>@${user.username}</p>
          <p class="user-email">${user.email}</p>
          <span class="user-type-badge ${user.type}">
            ${user.type === 'admin' ? 'Administrador' : user.type === 'registrado' ? 'Registrado' : 'Anónimo'}
          </span>
          ${user.isBanned ? '<span class="status-badge" style="background-color: #ef4444; margin-left: 8px;">Baneado</span>' : ''}
        </div>
      </div>

      <div class="user-detail-stats">
        <div class="user-stat-item">
          <div class="user-stat-value">${user.totalReports}</div>
          <div class="user-stat-label">Reportes</div>
        </div>
        <div class="user-stat-item">
          <div class="user-stat-value">${user.totalLikes}</div>
          <div class="user-stat-label">Likes Recibidos</div>
        </div>
        <div class="user-stat-item">
          <div class="user-stat-value">${user.totalViews}</div>
          <div class="user-stat-label">Vistas Totales</div>
        </div>
        <div class="user-stat-item">
          <div class="user-stat-value">${getRelativeTime(user.joinedDate)}</div>
          <div class="user-stat-label">Miembro desde</div>
        </div>
      </div>

      <div class="user-detail-section">
        <h3>Historial de Reportes (${userReports.length})</h3>
        <div class="user-reports-list">
          ${userReports.length > 0 ? userReports.slice(0, 5).map(report => `
            <div class="user-report-item" onclick="viewReportDetail('${report.id}'); closeUserDetailModal();">
              <div class="user-report-title">${report.title}</div>
              <div class="user-report-meta">
                <span class="category-badge" style="background-color: ${getCategoryColor(report.category)};">
                  ${getCategoryLabel(report.category)}
                </span>
                <span class="status-badge" style="background-color: ${getStatusColor(report.status)};">
                  ${getStatusLabel(report.status)}
                </span>
                <span class="text-muted">${getRelativeTime(report.createdAt)}</span>
              </div>
            </div>
          `).join('') : '<p class="text-muted">No hay reportes</p>'}
        </div>
      </div>

      ${!user.isBanned && user.type !== 'admin' ? `
        <div class="user-detail-actions">
          <button class="btn btn-danger" onclick="openBanUserModal('${user.id}'); closeUserDetailModal();">
            Banear Usuario
          </button>
        </div>
      ` : user.isBanned ? `
        <div class="user-detail-actions">
          <button class="btn btn-primary" onclick="unbanUser('${user.id}'); closeUserDetailModal();">
            Desbanear Usuario
          </button>
        </div>
      ` : ''}
    </div>
  `;

  openUserDetailModal();
}

function openUserDetailModal() {
  const modal = document.getElementById('userDetailModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeUserDetailModal() {
  const modal = document.getElementById('userDetailModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
  }
}

function openBanUserModal(userId) {
  selectedUserForBan = userId;
  const modal = document.getElementById('banUserModal');
  if (modal) {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
}

function closeBanUserModal() {
  selectedUserForBan = null;
  const modal = document.getElementById('banUserModal');
  if (modal) {
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
    const form = modal.querySelector('form');
    if (form) form.reset();
  }
}

function confirmBanUser(event) {
  event.preventDefault();
  if (!selectedUserForBan) return;

  const formData = new FormData(event.target);
  const user = adminUsersData.find(u => u.id === selectedUserForBan);
  
  if (user) {
    user.isBanned = true;
    user.banReason = formData.get('banReason');
    user.banDuration = formData.get('banDuration');
    
    closeBanUserModal();
    renderAdminUsersTable();
    updateUsersCounts();
    showToast(`Usuario ${user.name} ha sido baneado`, 'success');
  }
}

function unbanUser(userId) {
  if (!confirm('¿Desbanear a este usuario?')) return;

  const user = adminUsersData.find(u => u.id === userId);
  if (user) {
    user.isBanned = false;
    user.banReason = null;
    user.banDuration = null;
    
    renderAdminUsersTable();
    updateUsersCounts();
    showToast(`Usuario ${user.name} ha sido desbaneado`, 'success');
  }
}

// ========================================
// ADMIN STATS PAGE
// ========================================

function loadAdminStats() {
  calculateOverviewStats();
  loadTopCategories();
  loadTopUsers();
  loadHotZones();
  calculateResolutionStats();
}

function calculateOverviewStats() {
  const today = new Date();
  const todayStart = new Date(today.setHours(0, 0, 0, 0));
  
  const reportsToday = mockReports.filter(r => r.createdAt >= todayStart).length;
  const totalEngagement = mockReports.reduce((sum, r) => sum + r.likes, 0);
  const activeUsers = adminUsersData.filter(u => !u.isBanned).length;
  const pendingReports = mockReports.filter(r => r.status === 'pendiente').length;

  document.getElementById('statsReportsTotal').textContent = mockReports.length;
  document.getElementById('statsReportsToday').textContent = reportsToday;
  document.getElementById('statsUsersTotal').textContent = adminUsersData.length;
  document.getElementById('statsUsersActive').textContent = activeUsers;
  document.getElementById('statsReportsPending').textContent = pendingReports;
  document.getElementById('statsEngagementTotal').textContent = totalEngagement;
}

function loadTopCategories() {
  const categoryCounts = {};
  mockReports.forEach(report => {
    categoryCounts[report.category] = (categoryCounts[report.category] || 0) + 1;
  });

  const sorted = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('topCategoriesList');
  if (!container) return;

  container.innerHTML = sorted.map(([category, count], index) => `
    <div class="ranking-item">
      <div class="ranking-position">${index + 1}</div>
      <div class="ranking-content">
        <div class="ranking-label">
          <span class="category-badge" style="background-color: ${getCategoryColor(category)};">
            ${getCategoryLabel(category)}
          </span>
        </div>
        <div class="ranking-bar">
          <div class="ranking-bar-fill" style="width: ${(count / mockReports.length) * 100}%; background-color: ${getCategoryColor(category)};"></div>
        </div>
      </div>
      <div class="ranking-value">${count}</div>
    </div>
  `).join('');
}

function loadTopUsers() {
  const sorted = [...adminUsersData]
    .sort((a, b) => b.totalReports - a.totalReports)
    .slice(0, 5);

  const container = document.getElementById('topUsersList');
  if (!container) return;

  container.innerHTML = sorted.map((user, index) => `
    <div class="ranking-item">
      <div class="ranking-position">${index + 1}</div>
      <div class="ranking-content">
        <div class="ranking-label">
          <div class="ranking-user-avatar">${user.name.charAt(0)}</div>
          <div>
            <div class="ranking-user-name">${user.name}</div>
            <div class="ranking-user-meta">${user.totalLikes} likes</div>
          </div>
        </div>
      </div>
      <div class="ranking-value">${user.totalReports}</div>
    </div>
  `).join('');
}

function loadHotZones() {
  const zones = {};
  mockReports.forEach(report => {
    const zone = report.location.split(',')[0].trim();
    zones[zone] = (zones[zone] || 0) + 1;
  });

  const sorted = Object.entries(zones)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const container = document.getElementById('hotZonesList');
  if (!container) return;

  container.innerHTML = sorted.map(([zone, count], index) => `
    <div class="ranking-item">
      <div class="ranking-position">${index + 1}</div>
      <div class="ranking-content">
        <div class="ranking-label">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3"></circle>
          </svg>
          ${zone}
        </div>
      </div>
      <div class="ranking-value">${count}</div>
    </div>
  `).join('');
}

function calculateResolutionStats() {
  const resolved = mockReports.filter(r => r.status === 'resuelto');
  const avgTime = 3.5;
  const fastest = 0.5;
  const slowest = 15;
  const rate = ((resolved.length / mockReports.length) * 100).toFixed(1);

  document.getElementById('avgResolutionTime').textContent = `${avgTime} días`;
  document.getElementById('fastestResolution').textContent = `${fastest} días`;
  document.getElementById('slowestResolution').textContent = `${slowest} días`;
  document.getElementById('resolutionRate').textContent = `${rate}%`;
}

function updateStatsPeriod() {
  const period = document.getElementById('periodFilter').value;
  showToast(`Mostrando estadísticas de: ${period}`, 'info');
  // Aquí podrías filtrar los datos según el período
  loadAdminStats();
}

function initializeCharts() {
  // Simulación de gráficos - en producción usarías Chart.js o similar
  showToast('Los gráficos se cargarían aquí con una librería como Chart.js', 'info');
}

function exportChartData(type) {
  showToast(`Exportando datos de ${type}...`, 'info');
}

function exportData(format) {
  showToast(`Exportando datos en formato ${format.toUpperCase()}...`, 'success');
  
  if (format === 'json') {
    const data = {
      reports: mockReports,
      users: adminUsersData,
      exportDate: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sigmaforo-export-${Date.now()}.json`;
    a.click();
  }
}
