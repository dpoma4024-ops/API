// ========================================
// SIGMAFORO - FUNCIONALIDAD DE CONFIGURACIÓN
// ========================================

/**
 * Cargar configuración del usuario
 */
async function loadSettings() {
    const user = getCurrentUser();
    
    if (!user || user.type === 'anonimo') {
        return;
    }
    
    try {
        const data = await apiRequest(`settings.php?action=get&user_id=${user.id}`);
        
        if (data.success && data.data.settings) {
            const settings = data.data.settings;
            
            // Cargar valores en los toggles
            document.getElementById('notifNearby').checked = settings.notif_nearby;
            document.getElementById('notifUpdates').checked = settings.notif_updates;
            document.getElementById('notifFollowed').checked = settings.notif_followed;
            document.getElementById('notifReplies').checked = settings.notif_replies;
            document.getElementById('publicProfile').checked = settings.public_profile;
            document.getElementById('showLocation').checked = settings.show_location;
            document.getElementById('anonymousReports').checked = settings.anonymous_reports;
        }
        
        // Cargar email del usuario
        if (user.email) {
            document.getElementById('userEmailSetting').textContent = user.email;
        }
        
    } catch (error) {
        console.error('Error loading settings:', error);
    }
}

/**
 * Guardar configuración
 */
async function saveSettings() {
    const user = getCurrentUser();
    
    if (!user || user.type === 'anonimo') {
        showToast('Los usuarios anónimos no pueden guardar configuración', 'warning');
        return;
    }
    
    const settings = {
        notif_nearby: document.getElementById('notifNearby').checked,
        notif_updates: document.getElementById('notifUpdates').checked,
        notif_followed: document.getElementById('notifFollowed').checked,
        notif_replies: document.getElementById('notifReplies').checked,
        public_profile: document.getElementById('publicProfile').checked,
        show_location: document.getElementById('showLocation').checked,
        anonymous_reports: document.getElementById('anonymousReports').checked
    };
    
    try {
        const data = await apiRequest('settings.php?action=update', {
            method: 'PUT',
            body: JSON.stringify(settings)
        });
        
        if (data.success) {
            showToast('Configuración guardada exitosamente', 'success');
        }
    } catch (error) {
        showToast(error.message || 'Error al guardar configuración', 'error');
    }
}

/**
 * Mostrar modal de cambio de contraseña
 */
function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'changePasswordModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Cambiar Contraseña</h2>
                <button class="close-btn" onclick="closeChangePasswordModal()">&times;</button>
            </div>
            <form onsubmit="handleChangePassword(event)">
                <div class="form-group">
                    <label>Contraseña Actual</label>
                    <input type="password" name="current_password" required>
                </div>
                <div class="form-group">
                    <label>Nueva Contraseña</label>
                    <input type="password" name="new_password" required minlength="6">
                </div>
                <div class="form-group">
                    <label>Confirmar Nueva Contraseña</label>
                    <input type="password" name="confirm_password" required minlength="6">
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeChangePasswordModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Cambiar Contraseña</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeChangePasswordModal();
        }
    });
}

function closeChangePasswordModal() {
    const modal = document.getElementById('changePasswordModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Cambiar contraseña
 */
async function handleChangePassword(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const currentPassword = formData.get('current_password');
    const newPassword = formData.get('new_password');
    const confirmPassword = formData.get('confirm_password');
    
    if (newPassword !== confirmPassword) {
        showToast('Las contraseñas no coinciden', 'error');
        return;
    }
    
    if (newPassword.length < 6) {
        showToast('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    try {
        const data = await apiRequest('settings.php?action=change-password', {
            method: 'PUT',
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });
        
        if (data.success) {
            showToast('Contraseña cambiada exitosamente', 'success');
            closeChangePasswordModal();
        }
    } catch (error) {
        showToast(error.message || 'Error al cambiar contraseña', 'error');
    }
}

/**
 * Mostrar modal de cambio de email
 */
function showChangeEmailModal() {
    const user = getCurrentUser();
    
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.style.display = 'flex';
    modal.id = 'changeEmailModal';
    
    modal.innerHTML = `
        <div class="modal-content">
            <div class="modal-header">
                <h2>Cambiar Email</h2>
                <button class="close-btn" onclick="closeChangeEmailModal()">&times;</button>
            </div>
            <form onsubmit="handleChangeEmail(event)">
                <div class="form-group">
                    <label>Email Actual</label>
                    <input type="email" value="${user.email || ''}" disabled>
                </div>
                <div class="form-group">
                    <label>Nuevo Email</label>
                    <input type="email" name="new_email" required>
                </div>
                <div class="form-group">
                    <label>Contraseña (para confirmar)</label>
                    <input type="password" name="password" required>
                </div>
                <div class="form-actions">
                    <button type="button" class="btn btn-outline" onclick="closeChangeEmailModal()">Cancelar</button>
                    <button type="submit" class="btn btn-primary">Cambiar Email</button>
                </div>
            </form>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            closeChangeEmailModal();
        }
    });
}

function closeChangeEmailModal() {
    const modal = document.getElementById('changeEmailModal');
    if (modal) {
        modal.remove();
    }
}

/**
 * Cambiar email
 */
async function handleChangeEmail(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const newEmail = formData.get('new_email');
    const password = formData.get('password');
    
    try {
        const data = await apiRequest('settings.php?action=change-email', {
            method: 'PUT',
            body: JSON.stringify({
                new_email: newEmail,
                password: password
            })
        });
        
        if (data.success) {
            showToast('Email cambiado exitosamente. Actualiza tu sesión.', 'success');
            closeChangeEmailModal();
            
            // Actualizar usuario en localStorage
            const user = getCurrentUser();
            user.email = newEmail;
            localStorage.setItem('sigmaforo_user', JSON.stringify(user));
            
            // Recargar datos
            document.getElementById('userEmailSetting').textContent = newEmail;
        }
    } catch (error) {
        showToast(error.message || 'Error al cambiar email', 'error');
    }
}

/**
 * Confirmar eliminación de cuenta
 */
function confirmDeleteAccount() {
    if (!confirm('⚠️ ¿Estás SEGURO de que deseas eliminar tu cuenta?\n\nEsta acción es PERMANENTE y no se puede deshacer.\n\n- Se eliminarán todos tus reportes\n- Se eliminarán todos tus comentarios\n- Se perderán todos tus datos\n\n¿Continuar?')) {
        return;
    }
    
    // Segunda confirmación
    const confirmation = prompt('Para confirmar, escribe "ELIMINAR CUENTA" (en mayúsculas):');
    
    if (confirmation !== 'ELIMINAR CUENTA') {
        showToast('Eliminación cancelada', 'info');
        return;
    }
    
    deleteAccount();
}

/**
 * Eliminar cuenta
 */
async function deleteAccount() {
    try {
        const data = await apiRequest('settings.php?action=delete-account', {
            method: 'DELETE'
        });
        
        if (data.success) {
            showToast('Cuenta eliminada. Serás redirigido...', 'success');
            
            // Limpiar localStorage
            localStorage.removeItem('sigmaforo_user');
            localStorage.removeItem('sigmaforo_token');
            
            // Redirigir a index
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 2000);
        }
    } catch (error) {
        showToast(error.message || 'Error al eliminar cuenta', 'error');
    }
}