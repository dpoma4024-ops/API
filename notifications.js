// ========================================
// SIGMAFORO - SISTEMA DE NOTIFICACIONES
// ========================================

/**
 * Cargar notificaciones del usuario autenticado
 * @param {boolean} onlyUnread - Si solo queremos las no leídas
 * @param {number} limit - Límite de notificaciones a cargar
 */
async function loadNotifications(onlyUnread = false, limit = 20) {
    try {
        const url = `${API_BASE_URL}/notifications.php?action=list&unread=${onlyUnread}&limit=${limit}`;
        const data = await apiRequest(url);
        
        if (data.success && data.data) {
            return data.data; // ✅ Camino feliz
        } else {
            console.warn('API response not successful:', data);
            // Si la API responde pero success es false, devolvemos vacío para no romper el JS
            return { notifications: [], total: 0, unread: 0 };
        }
    } catch (error) {
        console.error('Error loading notifications:', error);
        return { notifications: [], total: 0, unread: 0 };
    }
}

/**
 * Obtener contador de notificaciones no leídas
 */
async function getUnreadCount() {
    try {
        const data = await apiRequest('notifications.php?action=count');
        
        if (data.success) {
            return data.data.unread;
        }
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Actualizar badge de notificaciones en el navbar
 */
async function updateNotificationBadge() {
    const badge = document.querySelector('.notification-badge');
    if (!badge) return;
    
    const count = await getUnreadCount();
    
    if (count > 0) {
        badge.textContent = count > 99 ? '99+' : count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

/**
 * Renderizar notificaciones en el dropdown del header
 */
async function renderHeaderNotifications() {
    const container = document.getElementById('notificationList');
    if (!container) return;
    
    const result = await loadNotifications(false, 5);
    const notifications = result.notifications;
    
    if (notifications.length === 0) {
        container.innerHTML = `
            <div class="empty-state" style="padding: 40px 20px; text-align: center; color: var(--text-muted);">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin: 0 auto 12px; opacity: 0.3;">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                </svg>
                <p>No hay notificaciones</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notifications.map(notif => createNotificationHTML(notif)).join('');
    
    // Actualizar badge
    updateNotificationBadge();
}

/**
 * Crear HTML para una notificación
 */
function createNotificationHTML(notif) {
    const iconMap = {
        'comment': '💬',
        'like': '👍',
        'incident_status_update': '🔄',
        'new_incident_in_followed_area': '📍',
        'nearby_incident': '⚠️'
    };
    
    const icon = iconMap[notif.tipo] || '🔔';
    const unreadClass = notif.is_read ? '' : 'unread';
    
    // Determinar URL de acción
    let actionUrl = 'alertas.html';
    if (notif.reporte_id) {
        actionUrl = `reporte-detalle.html?id=${notif.reporte_id}`;
    }
    
    return `
        <div class="notification-item ${unreadClass}" 
             onclick="handleNotificationClick(${notif.id}, '${actionUrl}')">
            <div class="notification-icon" style="background-color: rgba(59, 130, 246, 0.1);">
                <span style="font-size: 20px;">${icon}</span>
            </div>
            <div class="notification-content">
                <div class="notification-title">${notif.titulo}</div>
                <div class="notification-description">${notif.descripcion}</div>
                <div class="notification-time">${getRelativeTime(notif.fecha_creacion)}</div>
            </div>
        </div>
    `;
}

/**
 * Manejar click en notificación
 */
async function handleNotificationClick(notificationId, redirectUrl) {
    // Marcar como leída
    await markNotificationAsRead(notificationId);
    
    // Redirigir
    if (redirectUrl) {
        window.location.href = redirectUrl;
    }
}

/**
 * Marcar notificación como leída
 */
async function markNotificationAsRead(notificationId) {
    try {
        await apiRequest(`notifications.php?action=mark-read&id=${notificationId}`, {
            method: 'PUT'
        });
        
        // Actualizar UI
        updateNotificationBadge();
        
    } catch (error) {
        console.error('Error marking notification as read:', error);
    }
}

/**
 * Marcar todas las notificaciones como leídas
 */
async function markAllAsRead() {
    try {
        const data = await apiRequest('notifications.php?action=mark-all-read', {
            method: 'PUT'
        });
        
        if (data.success) {
            showToast('Todas las notificaciones marcadas como leídas', 'success');
            
            // Actualizar UI
            await renderHeaderNotifications();
            
            // Si estamos en alertas.html, recargar
            if (window.location.pathname.includes('alertas.html')) {
                loadAlerts();
            }
        }
        
    } catch (error) {
        console.error('Error marking all as read:', error);
        showToast('Error al marcar notificaciones', 'error');
    }
}

/**
 * Eliminar notificación
 */
async function deleteNotification(notificationId) {
    if (!confirm('¿Eliminar esta notificación?')) return;
    
    try {
        const data = await apiRequest(`notifications.php?action=delete&id=${notificationId}`, {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Notificación eliminada', 'success');
            
            // Recargar notificaciones
            if (window.location.pathname.includes('alertas.html')) {
                loadAlerts();
            } else {
                renderHeaderNotifications();
            }
        }
        
    } catch (error) {
        console.error('Error deleting notification:', error);
        showToast('Error al eliminar notificación', 'error');
    }
}

/**
 * FUNCIONES PARA CREAR NOTIFICACIONES (Uso interno del sistema)
 */

/**
 * Crear notificación cuando alguien comenta en un reporte
 */
async function notifyNewComment(reporteId, authorId, commentAuthorId, commentAuthorName) {
    // No notificar si el autor del comentario es el mismo que el autor del reporte
    if (authorId === commentAuthorId) return;
    
    try {
        // Obtener info del reporte
        const reportData = await apiRequest(`reports.php?action=get&id=${reporteId}`);
        if (!reportData.success) return;
        
        const reporte = reportData.data.report;
        
        await apiRequest('notifications.php?action=create', {
            method: 'POST',
            body: JSON.stringify({
                user_id: authorId,
                tipo: 'comment',
                titulo: 'Nuevo comentario en tu reporte',
                descripcion: `${commentAuthorName} comentó: "${reporte.titulo}"`,
                reporte_id: reporteId,
                categoria: reporte.categoria,
                ubicacion: reporte.ubicacion,
                from_user_id: commentAuthorId
            })
        });
        
    } catch (error) {
        console.error('Error creating comment notification:', error);
    }
}

/**
 * Crear notificación cuando alguien da like a un reporte
 */
async function notifyNewLike(reporteId, authorId, likerUserId, likerUserName) {
    // No notificar si el usuario se da like a sí mismo
    if (authorId === likerUserId) return;
    
    try {
        const reportData = await apiRequest(`reports.php?action=get&id=${reporteId}`);
        if (!reportData.success) return;
        
        const reporte = reportData.data.report;
        
        await apiRequest('notifications.php?action=create', {
            method: 'POST',
            body: JSON.stringify({
                user_id: authorId,
                tipo: 'like',
                titulo: 'Le gustó tu reporte',
                descripcion: `A ${likerUserName} le gustó tu reporte: "${reporte.titulo}"`,
                reporte_id: reporteId,
                categoria: reporte.categoria,
                ubicacion: reporte.ubicacion,
                from_user_id: likerUserId
            })
        });
        
    } catch (error) {
        console.error('Error creating like notification:', error);
    }
}

/**
 * Crear notificación cuando cambia el estado de un reporte seguido
 */
async function notifyStatusChange(reporteId, newStatus) {
    try {
        const reportData = await apiRequest(`reports.php?action=get&id=${reporteId}`);
        if (!reportData.success) return;
        
        const reporte = reportData.data.report;
        
        // Obtener usuarios que siguen este reporte (zonas seguidas)
        // Por ahora, notificamos al autor del reporte
        const statusLabels = {
            'pendiente': 'Pendiente',
            'en_revision': 'En Revisión',
            'en_proceso': 'En Proceso',
            'resuelto': 'Resuelto'
        };
        
        await apiRequest('notifications.php?action=create', {
            method: 'POST',
            body: JSON.stringify({
                user_id: reporte.user_id,
                tipo: 'incident_status_update',
                titulo: 'Actualización de estado',
                descripcion: `Tu reporte "${reporte.titulo}" cambió a: ${statusLabels[newStatus]}`,
                reporte_id: reporteId,
                categoria: reporte.categoria,
                ubicacion: reporte.ubicacion
            })
        });
        
    } catch (error) {
        console.error('Error creating status change notification:', error);
    }
}

/**
 * Auto-actualizar notificaciones cada 30 segundos
 */
function startNotificationPolling() {
    // Actualizar inmediatamente
    updateNotificationBadge();
    
    // Actualizar cada 30 segundos
    setInterval(() => {
        updateNotificationBadge();
        
        // Si el dropdown está abierto, actualizar también
        const dropdown = document.getElementById('notificationDropdown');
        if (dropdown && dropdown.classList.contains('show')) {
            renderHeaderNotifications();
        }
    }, 30000); // 30 segundos
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Iniciar polling de notificaciones cuando cargue la página
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startNotificationPolling);
} else {
    startNotificationPolling();
}
