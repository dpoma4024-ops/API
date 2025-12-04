// ========================================
// SIGMAFORO - FUNCIONALIDAD DE PERFIL
// ========================================

/**
 * Cargar datos del perfil
 */
async function loadProfileData() {
    const user = getCurrentUser();
    
    if (!user || user.type === 'anonimo') {
        return;
    }
    
    try {
        const data = await apiRequest('auth.php?action=profile');
        
        if (data.success && data.data.profile) {
            const profile = data.data.profile;
            
            // 1. Actualizar información del perfil
            document.getElementById('profileName').textContent = profile.nombre;
            document.getElementById('profileEmail').textContent = profile.email || 'No especificado';
            
            // --- LÓGICA MEJORADA DE AVATAR (CORREGIDA PARA QUE SEA REDONDA) ---
            const avatarContainer = document.querySelector('.profile-avatar-large');
            // Limpiamos contenido previo
            avatarContainer.innerHTML = '';

            if (profile.avatar_url) {
                // Si tiene foto, ponemos la imagen y LE AGREGAMOS border-radius: 50%
                avatarContainer.innerHTML = `<img src="${profile.avatar_url}" alt="Avatar" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;">`;
                avatarContainer.style.backgroundColor = 'transparent';
                avatarContainer.style.border = '4px solid white';
            } else {
                // Si no, ponemos la letra inicial (Lógica original)
                avatarContainer.innerHTML = `<span id="profileInitial">${profile.nombre.charAt(0).toUpperCase()}</span>`;
                avatarContainer.style.backgroundColor = ''; // Color por defecto
                avatarContainer.style.border = '4px solid white';
            }
            // -------------------------------
            
            const typeLabels = {
                'admin': 'Administrador',
                'registrado': 'Usuario Registrado',
                'anonimo': 'Usuario Anónimo'
            };
            document.getElementById('profileType').textContent = typeLabels[profile.tipo] || profile.tipo;
            
            // 2. Actualizar estadísticas
            document.getElementById('userReportsCount').textContent = profile.total_reportes || 0;
            document.getElementById('userLikesReceived').textContent = profile.total_likes || 0;
            document.getElementById('userViews').textContent = profile.total_vistas || 0;
            
            // 3. Pre-llenar formulario de edición
            document.getElementById('editName').value = profile.nombre;
            document.getElementById('editEmail').value = profile.email || '';
            document.getElementById('editUsername').value = profile.username || '';
            document.getElementById('editLocation').value = profile.ubicacion || '';
            document.getElementById('editBio').value = profile.biografia || '';
            
            // 4. Cargar actividad
            loadUserActivity();
        }
    } catch (error) {
        console.error('Error loading profile:', error);
        showToast('Error al cargar perfil', 'error');
    }
}

/**
 * Habilitar edición de perfil
 */
function enableEditProfile() {
    // Habilitar campos
    document.getElementById('editName').disabled = false;
    document.getElementById('editUsername').disabled = false;
    document.getElementById('editLocation').disabled = false;
    document.getElementById('editBio').disabled = false;
    // Email solo se cambia con modal especial
    
    // Mostrar acciones
    document.getElementById('profileFormActions').style.display = 'flex';
    
    showToast('Ahora puedes editar tu perfil', 'info');
}

/**
 * Cancelar edición
 */
function cancelEditProfile() {
    // Deshabilitar campos
    document.getElementById('editName').disabled = true;
    document.getElementById('editUsername').disabled = true;
    document.getElementById('editLocation').disabled = true;
    document.getElementById('editBio').disabled = true;
    
    // Ocultar acciones
    document.getElementById('profileFormActions').style.display = 'none';
    
    // Recargar datos originales para deshacer cambios no guardados
    loadProfileData();
}

/**
 * Guardar perfil
 */
async function saveProfile(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    
    const profileData = {
        name: formData.get('name'),
        ubicacion: formData.get('location'),
        biografia: formData.get('bio')
    };
    
    try {
        const data = await apiRequest('auth.php?action=profile', {
            method: 'PUT',
            body: JSON.stringify(profileData)
        });
        
        if (data.success) {
            showToast('Perfil actualizado exitosamente', 'success');
            
            // Actualizar usuario en localStorage
            const user = getCurrentUser();
            user.name = profileData.name;
            localStorage.setItem('sigmaforo_user', JSON.stringify(user));
            
            // Recargar datos visuales
            loadProfileData();
            
            // Deshabilitar edición
            cancelEditProfile();
        }
    } catch (error) {
        showToast(error.message || 'Error al actualizar perfil', 'error');
    }
}

/**
 * Cargar actividad reciente
 */
async function loadUserActivity() {
    const container = document.getElementById('userActivity');
    
    try {
        // Obtener últimos reportes del usuario
        const data = await apiRequest('reports.php?action=my-reports');
        
        if (data.success) {
            const reports = data.data.reports.slice(0, 5);
            
            if (reports.length === 0) {
                container.innerHTML = '<p style="color: var(--text-muted);">No hay actividad reciente</p>';
                return;
            }
            
            container.innerHTML = reports.map(report => `
                <div class="activity-item">
                    <div class="activity-icon">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                            <circle cx="12" cy="10" r="3"></circle>
                        </svg>
                    </div>
                    <div class="activity-content">
                        <div class="activity-title">Reporte creado</div>
                        <div class="activity-description">${report.titulo}</div>
                        <div class="activity-time">${getRelativeTime(report.fecha_creacion)}</div>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error loading activity:', error);
        container.innerHTML = '<p style="color: var(--text-muted);">Error al cargar actividad</p>';
    }
}