// ========================================
// SIGMAFORO - FUNCIONALIDAD MIS REPORTES
// ========================================

let myReportsData = [];
let currentStatusFilter = 'all';

/**
 * Cargar mis reportes
 */
async function loadMyReports() {
    const user = getCurrentUser();
    
    if (!user || user.type === 'anonimo') {
        showToast('Los usuarios anónimos no tienen reportes guardados', 'warning');
        return;
    }
    
    const container = document.getElementById('myReportsList');
    container.innerHTML = '<div class="empty-state">Cargando tus reportes...</div>';
    
    try {
        const data = await apiRequest('reports.php?action=my-reports');
        
        if (data.success) {
            myReportsData = data.data.reports;
            renderMyReports();
            updateMyReportsStats();
        }
    } catch (error) {
        console.error('Error loading my reports:', error);
        container.innerHTML = '<div class="empty-state">Error al cargar reportes</div>';
        showToast('Error al cargar tus reportes', 'error');
    }
}

/**
 * Filtrar mis reportes por estado
 */
function filterMyReports(status) {
    currentStatusFilter = status;
    
    // Actualizar chips activos
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.classList.remove('active');
        if (chip.dataset.status === status) {
            chip.classList.add('active');
        }
    });
    
    renderMyReports();
}

/**
 * Renderizar mis reportes
 */
function renderMyReports() {
    const container = document.getElementById('myReportsList');
    
    // Filtrar por estado
    const filtered = currentStatusFilter === 'all' 
        ? myReportsData 
        : myReportsData.filter(r => r.estado === currentStatusFilter);
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                </svg>
                <p>No tienes reportes en esta categoría</p>
                <button class="btn btn-primary" onclick="openCreateReportModal()">Crear primer reporte</button>
            </div>
        `;
        return;
    }
    
    container.innerHTML = filtered.map(report => createReportCard(report)).join('');
}

/**
 * Actualizar estadísticas de mis reportes
 */
function updateMyReportsStats() {
    const total = myReportsData.length;
    const pendientes = myReportsData.filter(r => r.estado === 'pendiente').length;
    const enProceso = myReportsData.filter(r => r.estado === 'en_proceso').length;
    const resueltos = myReportsData.filter(r => r.estado === 'resuelto').length;
    const enRevision = myReportsData.filter(r => r.estado === 'en_revision').length;
    
    // Actualizar contadores en chips
    document.getElementById('countAllReports').textContent = total;
    document.getElementById('countPendiente').textContent = pendientes;
    document.getElementById('countRevision').textContent = enRevision;
    document.getElementById('countProceso').textContent = enProceso;
    document.getElementById('countResuelto').textContent = resueltos;
    
    // Actualizar estadísticas sidebar
    document.getElementById('totalMyReports').textContent = total;
    document.getElementById('pendingReports').textContent = pendientes;
    document.getElementById('processingReports').textContent = enProceso;
    document.getElementById('resolvedReports').textContent = resueltos;
    
    // Calcular métricas
    const totalViews = myReportsData.reduce((sum, r) => sum + r.vistas, 0);
    const totalLikes = myReportsData.reduce((sum, r) => sum + r.likes, 0);
    const avgEngagement = total > 0 
        ? (((totalLikes + totalViews) / total) / 10).toFixed(1) 
        : 0;
    
    document.getElementById('totalViews').textContent = totalViews;
    document.getElementById('totalLikes').textContent = totalLikes;
    document.getElementById('avgEngagement').textContent = avgEngagement + '%';
}