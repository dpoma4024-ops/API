// ========================================
// SIGMAFORO - FUNCIONES DE ADMINISTRACIÓN
// ========================================

// Variables globales
let adminReportsData = [];
let filteredAdminReports = [];
let currentPage = 1;
const reportsPerPage = 10;
let selectedReportIds = new Set();
let selectedUserForBan = null;
let adminUsersData = [];
let filteredAdminUsers = [];

// ========================================
// ADMIN DASHBOARD
// ========================================

async function loadAdminDashboard() {
    try {
        // Cargar estadísticas generales
        const statsResponse = await apiRequest('reports.php?action=stats');
        
        if (statsResponse.success) {
            const stats = statsResponse.data;
            
            // Actualizar quick stats
            document.getElementById('totalReportsAdmin').textContent = stats.total || 0;
            document.getElementById('pendingReportsAdmin').textContent = stats.by_status?.pendiente || 0;
            document.getElementById('urgentReportsAdmin').textContent = stats.by_status?.en_proceso || 0;
            
            // Cargar categorías
            loadCategoryDistribution(stats.by_category || []);
        }
        
        // Cargar conteo de usuarios
        await loadUsersCount();
        
        // Cargar reportes recientes
        await loadRecentReports();
        
        // Cargar actividad reciente
        loadActivityLog();
        
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
        showToast('Error al cargar el dashboard', 'error');
    }
}

async function loadUsersCount() {
    try {
        // Primero intentar con el endpoint de admin
        const response = await apiRequest('admin/users.php?action=count');
        if (response.success) {
            document.getElementById('totalUsersAdmin').textContent = response.data.total || 0;
        }
    } catch (error) {
        // Fallback: contar desde la lista de reportes
        try {
            const reportsResponse = await apiRequest('reports.php?action=list&limit=100');
            if (reportsResponse.success) {
                const uniqueUsers = new Set();
                reportsResponse.data.reports.forEach(report => {
                    uniqueUsers.add(report.user_id);
                });
                document.getElementById('totalUsersAdmin').textContent = uniqueUsers.size;
            } else {
                document.getElementById('totalUsersAdmin').textContent = '0';
            }
        } catch (fallbackError) {
            console.error('Error en fallback de usuarios:', fallbackError);
            document.getElementById('totalUsersAdmin').textContent = '0';
        }
    }
}

async function loadRecentReports() {
    try {
        const response = await apiRequest('reports.php?action=list&status=pendiente&limit=5');
        
        const container = document.getElementById('recentReportsAdmin');
        
        if (response.success && response.data.reports.length > 0) {
            container.innerHTML = response.data.reports.map(report => `
                <div class="admin-list-item" onclick="viewReportDetail('${report.id}')">
                    <div class="admin-list-icon" style="background-color: ${getCategoryColor(report.categoria)};">
                        ${getCategoryIcon(report.categoria)}
                    </div>
                    <div class="admin-list-content">
                        <div class="admin-list-title">${report.titulo}</div>
                        <div class="admin-list-meta">${report.ubicacion} • ${getRelativeTime(report.fecha_creacion)}</div>
                    </div>
                    <div class="admin-list-actions">
                        <button class="btn-icon" onclick="event.stopPropagation(); approveReportQuick('${report.id}')" title="Aprobar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <polyline points="20 6 9 17 4 12"></polyline>
                            </svg>
                        </button>
                    </div>
                </div>
            `).join('');
        } else {
            container.innerHTML = '<p class="empty-state">No hay reportes pendientes</p>';
        }
    } catch (error) {
        console.error('Error loading recent reports:', error);
        document.getElementById('recentReportsAdmin').innerHTML = '<p class="empty-state">Error al cargar reportes</p>';
    }
}

function loadCategoryDistribution(categories) {
    const container = document.getElementById('categoryDistribution');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos disponibles</p>';
        return;
    }
    
    container.innerHTML = categories.map(cat => `
        <div class="category-stat">
            <div class="category-stat-header">
                <div class="category-color" style="background-color: ${getCategoryColor(cat.categoria)}"></div>
                <span>${getCategoryLabel(cat.categoria)}</span>
            </div>
            <div class="category-stat-value">${cat.total}</div>
        </div>
    `).join('');
}

function loadActivityLog() {
    const container = document.getElementById('activityLog');
    
    // Por ahora mostramos actividad estática
    const activities = [
        { type: 'report', user: 'Sistema', action: 'Nuevo reporte creado', time: new Date() },
        { type: 'user', user: 'Sistema', action: 'Usuario registrado', time: new Date(Date.now() - 3600000) },
        { type: 'status', user: 'Administrador', action: 'Estado de reporte actualizado', time: new Date(Date.now() - 7200000) }
    ];
    
    container.innerHTML = activities.map(activity => `
        <div class="activity-log-item">
            <div class="activity-log-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"></circle>
                </svg>
            </div>
            <div class="activity-log-content">
                <strong class="activity-log-user">${activity.user}</strong> ${activity.action}
                <div class="activity-log-time">${getRelativeTime(activity.time)}</div>
            </div>
        </div>
    `).join('');
}

async function approveReportQuick(reportId) {
    if (!confirm('¿Aprobar este reporte?')) return;
    
    try {
        const response = await apiRequest('reports.php?action=update&id=' + reportId, {
            method: 'PUT',
            body: JSON.stringify({ status: 'en_proceso' })
        });
        
        if (response.success) {
            showToast('Reporte aprobado', 'success');
            loadRecentReports();
        } else {
            showToast(response.message || 'Error al aprobar reporte', 'error');
        }
    } catch (error) {
        showToast('Error al aprobar reporte', 'error');
    }
}

// ========================================
// ADMIN REPORTS PAGE
// ========================================

async function loadAdminReports() {
    try {
        const response = await apiRequest('reports.php?action=list&limit=100');
        
        if (response.success) {
            adminReportsData = response.data.reports;
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
        adminReportsData.filter(r => r.estado === 'pendiente').length;
}

function filterAdminReports() {
    const searchQuery = document.getElementById('adminSearchInput').value.toLowerCase();
    const statusFilter = document.getElementById('adminStatusFilter').value;
    const categoryFilter = document.getElementById('adminCategoryFilter').value;
    const sortFilter = document.getElementById('adminSortFilter').value;

    filteredAdminReports = adminReportsData.filter(report => {
        const matchesSearch = report.titulo.toLowerCase().includes(searchQuery) ||
                             report.contenido.toLowerCase().includes(searchQuery) ||
                             report.autor_nombre.toLowerCase().includes(searchQuery);
        const matchesStatus = statusFilter === 'all' || report.estado === statusFilter;
        const matchesCategory = categoryFilter === 'all' || report.categoria === categoryFilter;
        
        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Sort
    filteredAdminReports.sort((a, b) => {
        switch(sortFilter) {
            case 'recent':
                return new Date(b.fecha_creacion) - new Date(a.fecha_creacion);
            case 'oldest':
                return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
            case 'likes':
                return b.likes - a.likes;
            case 'views':
                return b.vistas - a.vistas;
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

    if (paginatedReports.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" style="text-align: center; padding: 40px;">
                    <p class="empty-state">No se encontraron reportes</p>
                </td>
            </tr>
        `;
        return;
    }

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
            <td class="hide-mobile">
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
            <td class="hide-mobile">
                <span class="category-badge" style="background-color: ${getCategoryColor(report.categoria)};">
                    ${getCategoryLabel(report.categoria)}
                </span>
            </td>
            <td>
                <span class="status-badge" style="background-color: ${getStatusColor(report.estado)};">
                    ${getStatusLabel(report.estado)}
                </span>
            </td>
            <td class="hide-mobile">
                <div class="table-date">${getRelativeTime(report.fecha_creacion)}</div>
            </td>
            <td class="hide-mobile">
                <div class="table-engagement">
                    <span> Visualizaciones ${report.vistas}</span>
                    <span> Likes ${report.likes}</span>
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
                    <button class="btn-icon" onclick="changeReportStatus('${report.id}')" title="Cambiar estado">
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
        for (let i = 1; i <= Math.min(totalPages, 5); i++) {
            pagesHTML += `<button class="pagination-page ${i === currentPage ? 'active' : ''}" 
                                 onclick="goToPage(${i})">${i}</button>`;
        }
        if (totalPages > 5) {
            pagesHTML += '<span class="pagination-ellipsis">...</span>';
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

function bulkChangeStatus() {
    if (selectedReportIds.size === 0) {
        showToast('No hay reportes seleccionados', 'warning');
        return;
    }
    
    openChangeStatusModal();
}

function bulkDeleteReports() {
    if (selectedReportIds.size === 0) {
        showToast('No hay reportes seleccionados', 'warning');
        return;
    }

    if (confirm(`¿Eliminar permanentemente ${selectedReportIds.size} reportes?`)) {
        const promises = Array.from(selectedReportIds).map(id => 
            apiRequest(`reports.php?action=delete&id=${id}`, { method: 'DELETE' })
        );
        
        Promise.all(promises)
            .then(() => {
                selectedReportIds.clear();
                loadAdminReports();
                showToast('Reportes eliminados exitosamente', 'success');
            })
            .catch(error => {
                showToast('Error al eliminar reportes', 'error');
            });
    }
}

async function viewReportDetail(reportId) {
    try {
        const response = await apiRequest(`reports.php?action=get&id=${reportId}`);
        
        if (!response.success) {
            showToast('Error al cargar reporte', 'error');
            return;
        }
        
        const report = response.data.report;
        const content = document.getElementById('reportDetailContent');
        
        content.innerHTML = `
            <div class="report-detail-view">
                <div class="report-detail-header">
                    <div class="report-detail-badges">
                        <span class="category-badge" style="background-color: ${getCategoryColor(report.categoria)};">
                            ${getCategoryLabel(report.categoria)}
                        </span>
                        <span class="status-badge" style="background-color: ${getStatusColor(report.estado)};">
                            ${getStatusLabel(report.estado)}
                        </span>
                    </div>
                    <div class="report-detail-date">${getRelativeTime(report.fecha_creacion)}</div>
                </div>

                <h2 class="report-detail-title">${report.titulo}</h2>

                <div class="report-detail-author">
                    <div class="avatar">${report.autor_nombre.charAt(0)}</div>
                    <div>
                        <div class="author-name">${report.autor_nombre}</div>
                        <div class="author-username">@${report.autor_username}</div>
                    </div>
                </div>

                <div class="report-detail-content">
                    <p>${report.contenido}</p>
                </div>

                ${report.imagen_url ? `
                    <div class="report-detail-image">
                        <img src="${report.imagen_url}" alt="${report.titulo}">
                    </div>
                ` : ''}

                <div class="report-detail-location">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                        <circle cx="12" cy="10" r="3"></circle>
                    </svg>
                    <span>${report.ubicacion}</span>
                </div>

                <div class="report-detail-stats">
                    <div class="detail-stat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                        </svg>
                        <span>${report.vistas} vistas</span>
                    </div>
                    <div class="detail-stat">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path>
                        </svg>
                        <span>${report.likes} likes</span>
                    </div>
                </div>

                <div class="report-detail-actions">
                    <button class="btn btn-primary" onclick="changeReportStatus('${report.id}'); closeReportDetailModal();">
                        Cambiar Estado
                    </button>
                    <button class="btn btn-danger" onclick="if(confirm('¿Eliminar este reporte?')) { deleteReportAdmin('${report.id}'); closeReportDetailModal(); }">
                        Eliminar Reporte
                    </button>
                </div>
            </div>
        `;

        openReportDetailModal();
    } catch (error) {
        showToast('Error al cargar detalles del reporte', 'error');
    }
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

function changeReportStatus(reportId) {
    selectedReportIds.clear();
    selectedReportIds.add(reportId);
    openChangeStatusModal();
}

function openChangeStatusModal() {
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    }
}

function closeChangeStatusModal() {
    const modal = document.getElementById('changeStatusModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
    }
}

async function confirmChangeStatus(event) {
    event.preventDefault();
    
    if (selectedReportIds.size === 0) return;
    
    const formData = new FormData(event.target);
    const newStatus = formData.get('newStatus');
    
    const promises = Array.from(selectedReportIds).map(id => 
        apiRequest(`reports.php?action=update&id=${id}`, {
            method: 'PUT',
            body: JSON.stringify({ status: newStatus })
        })
    );
    
    try {
        await Promise.all(promises);
        selectedReportIds.clear();
        closeChangeStatusModal();
        loadAdminReports();
        showToast('Estados actualizados exitosamente', 'success');
    } catch (error) {
        showToast('Error al actualizar estados', 'error');
    }
}

async function deleteReportAdmin(reportId) {
    if (!confirm('¿Eliminar este reporte permanentemente?')) return;
    
    try {
        const response = await apiRequest(`reports.php?action=delete&id=${reportId}`, {
            method: 'DELETE'
        });
        
        if (response.success) {
            showToast('Reporte eliminado', 'success');
            loadAdminReports();
        } else {
            showToast(response.message || 'Error al eliminar', 'error');
        }
    } catch (error) {
        showToast('Error al eliminar reporte', 'error');
    }
}

// ========================================
// ADMIN USERS PAGE
// ========================================

async function loadAdminUsers() {
    try {
        const response = await apiRequest('admin/users.php?action=list');
        
        if (response.success) {
            adminUsersData = response.data.users || [];
            filteredAdminUsers = [...adminUsersData];
            
            updateUsersCounts();
            renderAdminUsersTable();
        } else {
            // Fallback: cargar desde el endpoint de estadísticas
            await loadUsersFromStats();
        }
    } catch (error) {
        console.error('Error loading admin users:', error);
        showToast('Error al cargar usuarios', 'error');
    }
}

async function loadUsersFromStats() {
    try {
        const response = await apiRequest('reports.php?action=list&limit=100');
        if (response.success) {
            const uniqueUsers = new Map();
            
            response.data.reports.forEach(report => {
                if (!uniqueUsers.has(report.user_id)) {
                    uniqueUsers.set(report.user_id, {
                        id: report.user_id,
                        nombre: report.autor_nombre,
                        username: report.autor_username,
                        email: `${report.autor_username}@ejemplo.com`,
                        tipo: report.autor_tipo,
                        is_banned: false,
                        fecha_registro: report.fecha_creacion,
                        total_reportes: 1
                    });
                } else {
                    const user = uniqueUsers.get(report.user_id);
                    user.total_reportes++;
                }
            });
            
            adminUsersData = Array.from(uniqueUsers.values());
            filteredAdminUsers = [...adminUsersData];
            
            updateUsersCounts();
            renderAdminUsersTable();
        }
    } catch (error) {
        console.error('Error loading users from stats:', error);
    }
}

function updateUsersCounts() {
    document.getElementById('totalUsersCount').textContent = adminUsersData.length;
    document.getElementById('bannedUsersCount').textContent = 
        adminUsersData.filter(u => u.is_banned).length;
}

function filterAdminUsers() {
    const searchQuery = document.getElementById('userSearchInput').value.toLowerCase();
    const typeFilter = document.getElementById('userTypeFilter').value;
    const statusFilter = document.getElementById('userStatusFilter').value;
    const sortFilter = document.getElementById('userSortFilter').value;

    filteredAdminUsers = adminUsersData.filter(user => {
        const matchesSearch = user.nombre.toLowerCase().includes(searchQuery) ||
                             user.email.toLowerCase().includes(searchQuery);
        const matchesType = typeFilter === 'all' || user.tipo === typeFilter;
        const matchesStatus = statusFilter === 'all' || 
                             (statusFilter === 'active' && !user.is_banned) ||
                             (statusFilter === 'banned' && user.is_banned);
        
        return matchesSearch && matchesType && matchesStatus;
    });

    // Sort
    filteredAdminUsers.sort((a, b) => {
        switch(sortFilter) {
            case 'recent':
                return new Date(b.fecha_registro) - new Date(a.fecha_registro);
            case 'name':
                return a.nombre.localeCompare(b.nombre);
            case 'reports':
                return (b.total_reportes || 0) - (a.total_reportes || 0);
            default:
                return 0;
        }
    });

    renderAdminUsersTable();
}

function renderAdminUsersTable() {
    const tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;

    if (filteredAdminUsers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    <p class="empty-state">No se encontraron usuarios</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filteredAdminUsers.map(user => `
        <tr class="${user.is_banned ? 'banned-user' : ''}">
            <td>
                <div class="table-user-info">
                    <div class="table-user-avatar ${user.is_banned ? 'banned' : ''}">
                        ${user.nombre.charAt(0)}
                    </div>
                    <div>
                        <div class="table-user-name">${user.nombre}</div>
                        <div class="table-user-username">@${user.username}</div>
                    </div>
                </div>
            </td>
            <td class="hide-mobile">${user.email}</td>
            <td class="hide-mobile">
                <span class="user-type-badge ${user.tipo}">
                    ${user.tipo === 'admin' ? 'Admin' : user.tipo === 'registrado' ? 'Registrado' : 'Anónimo'}
                </span>
            </td>
            <td>
                <div class="table-user-stats">
                    <span>${user.total_reportes || 0} reportes</span>
                </div>
            </td>
            <td class="hide-mobile">
                <div class="table-date">${getRelativeTime(user.fecha_registro)}</div>
            </td>
            <td>
                ${user.is_banned ? `
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
                    ${!user.is_banned && user.tipo !== 'admin' ? `
                        <button class="btn-icon danger" onclick="openBanUserModal('${user.id}')" title="Banear">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <circle cx="12" cy="12" r="10"></circle>
                                <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
                            </svg>
                        </button>
                    ` : user.is_banned ? `
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
    const user = adminUsersData.find(u => u.id == userId);
    if (!user) return;

    const content = document.getElementById('userDetailContent');
    
    content.innerHTML = `
        <div class="user-detail-view">
            <div class="user-detail-header">
                <div class="user-detail-avatar ${user.is_banned ? 'banned' : ''}">
                    ${user.nombre.charAt(0)}
                </div>
                <div class="user-detail-info">
                    <h2>${user.nombre}</h2>
                    <p>@${user.username}</p>
                    <p class="user-email">${user.email}</p>
                    <span class="user-type-badge ${user.tipo}">
                        ${user.tipo === 'admin' ? 'Administrador' : user.tipo === 'registrado' ? 'Registrado' : 'Anónimo'}
                    </span>
                    ${user.is_banned ? '<span class="status-badge" style="background-color: #ef4444; margin-left: 8px;">Baneado</span>' : ''}
                </div>
            </div>

            <div class="user-detail-stats">
                <div class="user-stat-item">
                    <div class="user-stat-value">${user.total_reportes || 0}</div>
                    <div class="user-stat-label">Reportes</div>
                </div>
                <div class="user-stat-item">
                    <div class="user-stat-value">${getRelativeTime(user.fecha_registro)}</div>
                    <div class="user-stat-label">Miembro desde</div>
                </div>
            </div>

            ${!user.is_banned && user.tipo !== 'admin' ? `
                <div class="user-detail-actions">
                    <button class="btn btn-danger" onclick="openBanUserModal('${user.id}'); closeUserDetailModal();">
                        Banear Usuario
                    </button>
                </div>
            ` : user.is_banned ? `
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

async function confirmBanUser(event) {
    event.preventDefault();
    if (!selectedUserForBan) return;

    const formData = new FormData(event.target);
    const banReason = formData.get('banReason');
    const banDuration = formData.get('banDuration');
    
    try {
        const response = await apiRequest(`admin/users.php?action=ban&id=${selectedUserForBan}`, {
            method: 'POST',
            body: JSON.stringify({
                ban_reason: banReason,
                ban_duration: banDuration
            })
        });
        
        if (response.success) {
            closeBanUserModal();
            loadAdminUsers();
            showToast('Usuario baneado exitosamente', 'success');
        } else {
            showToast(response.message || 'Error al banear usuario', 'error');
        }
    } catch (error) {
        // Fallback: actualizar localmente
        const user = adminUsersData.find(u => u.id == selectedUserForBan);
        if (user) {
            user.is_banned = true;
            user.ban_reason = banReason;
            user.ban_duration = banDuration;
            
            closeBanUserModal();
            renderAdminUsersTable();
            updateUsersCounts();
            showToast('Usuario baneado (local)', 'success');
        }
    }
}

async function unbanUser(userId) {
    if (!confirm('¿Desbanear a este usuario?')) return;

    try {
        const response = await apiRequest(`admin/users.php?action=unban&id=${userId}`, {
            method: 'POST'
        });
        
        if (response.success) {
            loadAdminUsers();
            showToast('Usuario desbaneado', 'success');
        } else {
            showToast(response.message || 'Error al desbanear', 'error');
        }
    } catch (error) {
        // Fallback: actualizar localmente
        const user = adminUsersData.find(u => u.id == userId);
        if (user) {
            user.is_banned = false;
            user.ban_reason = null;
            user.ban_duration = null;
            
            renderAdminUsersTable();
            updateUsersCounts();
            showToast('Usuario desbaneado (local)', 'success');
        }
    }
}

// ========================================
// ADMIN STATS PAGE
// ========================================

async function loadAdminStats() {
    try {
        const response = await apiRequest('reports.php?action=stats');
        
        if (response.success) {
            const stats = response.data;
            
            // Overview stats
            document.getElementById('statsReportsTotal').textContent = stats.total || 0;
            document.getElementById('statsReportsToday').textContent = stats.today || 0;
            document.getElementById('statsReportsPending').textContent = stats.by_status?.pendiente || 0;
            
            // Resolution metrics
            const resolved = stats.by_status?.resuelto || 0;
            const inProcess = stats.by_status?.en_proceso || 0;
            const pending = stats.by_status?.pendiente || 0;
            
            document.getElementById('resolvedCount').textContent = resolved;
            document.getElementById('inProcessCount').textContent = inProcess;
            document.getElementById('pendingCount').textContent = pending;
            
            const total = stats.total || 1;
            const rate = ((resolved / total) * 100).toFixed(1);
            document.getElementById('resolutionRate').textContent = rate + '%';
            
            // Load rankings
            loadStatsTopCategories(stats.by_category || []);
            await loadStatsTopUsers();
            loadStatusDistribution(stats.by_status || {});
            
            // Load charts
            createCategoryChart(stats.by_category || []);
            createStatusChart(stats.by_status || {});
        }
        
        // Load users stats
        await loadUsersStatsCount();
        
    } catch (error) {
        console.error('Error loading admin stats:', error);
        showToast('Error al cargar estadísticas', 'error');
    }
}

async function loadUsersStatsCount() {
    try {
        const response = await apiRequest('admin/users.php?action=count');
        if (response.success) {
            document.getElementById('statsUsersTotal').textContent = response.data.total || 0;
            document.getElementById('statsUsersActive').textContent = response.data.active || 0;
            document.getElementById('statsEngagementTotal').textContent = response.data.engagement || 0;
        }
    } catch (error) {
        // Fallback: contar desde reportes
        try {
            const reportsResponse = await apiRequest('reports.php?action=list&limit=100');
            if (reportsResponse.success) {
                const uniqueUsers = new Set();
                let totalLikes = 0;
                reportsResponse.data.reports.forEach(report => {
                    uniqueUsers.add(report.user_id);
                    totalLikes += report.likes || 0;
                });
                document.getElementById('statsUsersTotal').textContent = uniqueUsers.size;
                document.getElementById('statsUsersActive').textContent = uniqueUsers.size;
                document.getElementById('statsEngagementTotal').textContent = totalLikes;
            } else {
                document.getElementById('statsUsersTotal').textContent = '0';
                document.getElementById('statsUsersActive').textContent = '0';
                document.getElementById('statsEngagementTotal').textContent = '0';
            }
        } catch (fallbackError) {
            document.getElementById('statsUsersTotal').textContent = '0';
            document.getElementById('statsUsersActive').textContent = '0';
            document.getElementById('statsEngagementTotal').textContent = '0';
        }
    }
}

function loadStatsTopCategories(categories) {
    const container = document.getElementById('topCategoriesList');
    
    if (!categories || categories.length === 0) {
        container.innerHTML = '<p class="empty-state">No hay datos disponibles</p>';
        return;
    }
    
    const sorted = categories.sort((a, b) => b.total - a.total).slice(0, 5);
    const maxCount = sorted[0]?.total || 1;
    
    container.innerHTML = sorted.map((cat, index) => `
        <div class="ranking-item">
            <div class="ranking-position">${index + 1}</div>
            <div class="ranking-content">
                <div class="ranking-label">
                    <span class="category-badge" style="background-color: ${getCategoryColor(cat.categoria)};">
                        ${getCategoryLabel(cat.categoria)}
                    </span>
                </div>
                <div class="ranking-bar">
                    <div class="ranking-bar-fill" style="width: ${(cat.total / maxCount) * 100}%; background-color: ${getCategoryColor(cat.categoria)};"></div>
                </div>
            </div>
            <div class="ranking-value">${cat.total}</div>
        </div>
    `).join('');
}

async function loadStatsTopUsers() {
    const container = document.getElementById('topUsersList');
    
    try {
        const response = await apiRequest('reports.php?action=list&limit=100');
        
        if (!response.success) {
            container.innerHTML = '<p class="empty-state">No hay datos disponibles</p>';
            return;
        }
        
        // Contar reportes por usuario
        const userCounts = {};
        response.data.reports.forEach(report => {
            if (!userCounts[report.user_id]) {
                userCounts[report.user_id] = {
                    nombre: report.autor_nombre,
                    count: 0
                };
            }
            userCounts[report.user_id].count++;
        });
        
        const sorted = Object.values(userCounts)
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
        
        container.innerHTML = sorted.map((user, index) => `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-label">
                        <div class="ranking-user-avatar">${user.nombre.charAt(0)}</div>
                        <div>
                            <div class="ranking-user-name">${user.nombre}</div>
                        </div>
                    </div>
                </div>
                <div class="ranking-value">${user.count}</div>
            </div>
        `).join('');
    } catch (error) {
        container.innerHTML = '<p class="empty-state">Error al cargar usuarios</p>';
    }
}

function loadStatusDistribution(byStatus) {
    const container = document.getElementById('statusDistribution');
    
    const statuses = [
        { key: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
        { key: 'en_revision', label: 'En Revisión', color: '#3b82f6' },
        { key: 'en_proceso', label: 'En Proceso', color: '#a855f7' },
        { key: 'resuelto', label: 'Resuelto', color: '#22c55e' }
    ];
    
    const total = Object.values(byStatus).reduce((sum, count) => sum + count, 0) || 1;
    
    container.innerHTML = statuses.map((status, index) => {
        const count = byStatus[status.key] || 0;
        return `
            <div class="ranking-item">
                <div class="ranking-position">${index + 1}</div>
                <div class="ranking-content">
                    <div class="ranking-label">
                        <span class="status-badge" style="background-color: ${status.color};">
                            ${status.label}
                        </span>
                    </div>
                    <div class="ranking-bar">
                        <div class="ranking-bar-fill" style="width: ${(count / total) * 100}%; background-color: ${status.color};"></div>
                    </div>
                </div>
                <div class="ranking-value">${count}</div>
            </div>
        `;
    }).join('');
}

function updateStatsPeriod() {
    const period = document.getElementById('periodFilter').value;
    showToast(`Filtrando por: ${period}`, 'info');
    loadAdminStats();
}

function exportData(format) {
    showToast(`Exportando datos en formato ${format.toUpperCase()}...`, 'success');
    
    if (format === 'json') {
        const data = {
            reports: adminReportsData,
            users: adminUsersData,
            exportDate: new Date().toISOString()
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sigmaforo-export-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    } else if (format === 'csv') {
        const csv = convertToCSV(adminReportsData);
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `sigmaforo-reports-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

function convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(row => 
        Object.values(row).map(val => 
            typeof val === 'string' && val.includes(',') ? `"${val}"` : val
        ).join(',')
    );
    
    return [headers, ...rows].join('\n');
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function getCategoryIcon(category) {
    const icons = {
        seguridad: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
        infraestructura: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9"></rect><rect x="14" y="3" width="7" height="5"></rect><rect x="14" y="12" width="7" height="9"></rect><rect x="3" y="16" width="7" height="5"></rect></svg>',
        vias: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line></svg>',
        servicios: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"></path></svg>',
        medio_ambiente: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 8c0 3-2 5-5 5s-5-2-5-5 2-5 5-5 5 2 5 5z"></path><path d="M12 13c-3 0-5 2-5 4v2h10v-2c0-2-2-4-5-4z"></path></svg>'
    };
    return icons[category] || icons.seguridad;
}

// ========================================
// GRÁFICOS CON CHART.JS
// ========================================

let categoryChartInstance = null;
let statusChartInstance = null;

function createCategoryChart(categories) {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (categoryChartInstance) {
        categoryChartInstance.destroy();
    }
    
    if (!categories || categories.length === 0) {
        return;
    }
    
    const labels = categories.map(cat => getCategoryLabel(cat.categoria));
    const data = categories.map(cat => cat.total);
    const colors = categories.map(cat => getCategoryColor(cat.categoria));
    
    categoryChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: data,
                backgroundColor: colors,
                borderColor: '#1a1a1a',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#9ca3af',
                        padding: 15,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12,
                    displayColors: true,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

function createStatusChart(byStatus) {
    const canvas = document.getElementById('statusChart');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // Destruir gráfico anterior si existe
    if (statusChartInstance) {
        statusChartInstance.destroy();
    }
    
    const statuses = [
        { key: 'pendiente', label: 'Pendiente', color: '#f59e0b' },
        { key: 'en_revision', label: 'En Revisión', color: '#3b82f6' },
        { key: 'en_proceso', label: 'En Proceso', color: '#a855f7' },
        { key: 'resuelto', label: 'Resuelto', color: '#22c55e' }
    ];
    
    const labels = statuses.map(s => s.label);
    const data = statuses.map(s => byStatus[s.key] || 0);
    const colors = statuses.map(s => s.color);
    
    statusChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Cantidad de Reportes',
                data: data,
                backgroundColor: colors,
                borderColor: colors,
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: '#1f2937',
                    titleColor: '#ffffff',
                    bodyColor: '#9ca3af',
                    borderColor: '#374151',
                    borderWidth: 1,
                    padding: 12
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#9ca3af',
                        stepSize: 1
                    },
                    grid: {
                        color: '#374151'
                    }
                },
                x: {
                    ticks: {
                        color: '#9ca3af'
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }
    });
}
