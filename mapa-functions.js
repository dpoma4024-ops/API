// ========================================
// SIGMAFORO - FUNCIONALIDAD DE MAPA
// ========================================

let map = null;
let markers = [];
let allReports = [];
let currentCategory = 'all';

/**
 * Inicializar mapa de Leaflet
 */
function initMap() {
    if (map) {
        map.remove();
    }
    
    // Centrar en Tacna, Perú
    map = L.map('mapContainer').setView([-18.0146, -70.2506], 13);
    
    // Agregar capa de OpenStreetMap
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
    }).addTo(map);
    
    // Cargar reportes
    loadMapReports();
}

/**
 * Cargar todos los reportes en el mapa
 */
async function loadMapReports() {
    try {
        const data = await apiRequest('reports.php?action=list&limit=100');
        
        if (data.success) {
            allReports = data.data.reports;
            renderMapMarkers(allReports);
            updateMapStats(allReports);
        }
    } catch (error) {
        console.error('Error loading map reports:', error);
        showToast('Error al cargar reportes en el mapa', 'error');
    }
}

/**
 * Renderizar marcadores en el mapa
 */
function renderMapMarkers(reports) {
    // Limpiar marcadores existentes
    markers.forEach(marker => marker.remove());
    markers = [];
    
    // Filtrar por categoría si no es 'all'
    const filteredReports = currentCategory === 'all' 
        ? reports 
        : reports.filter(r => r.categoria === currentCategory);
    
    // Crear marcadores
    filteredReports.forEach(report => {
        if (!report.latitud || !report.longitud) return;
        
        const color = getCategoryColor(report.categoria);
        
        // Crear icono personalizado
        const icon = L.divIcon({
            className: 'custom-map-marker',
            html: `
                <div style="
                    width: 32px;
                    height: 32px;
                    background-color: ${color};
                    border: 3px solid white;
                    border-radius: 50%;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.4);
                    cursor: pointer;
                "></div>
            `,
            iconSize: [32, 32],
            iconAnchor: [16, 16],
            popupAnchor: [0, -16]
        });
        
        // Crear marcador
        const marker = L.marker([report.latitud, report.longitud], { icon })
            .addTo(map)
            .bindPopup(createPopupContent(report));
        
        // Abrir detalle al hacer click en el marcador
        marker.on('click', () => {
            // También se puede abrir el popup
            marker.openPopup();
        });
        
        markers.push(marker);
    });
    
    // Actualizar contador
    document.getElementById('mapFilterCount').textContent = filteredReports.length;
    
    // Ajustar zoom para mostrar todos los marcadores
    if (markers.length > 0) {
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.1));
    }
}

/**
 * Crear contenido del popup
 */
function createPopupContent(report) {
    const categoryLabel = getCategoryLabel(report.categoria);
    const statusLabel = getStatusLabel(report.estado);
    const categoryColor = getCategoryColor(report.categoria);
    const statusColor = getStatusColor(report.estado);
    
    return `
        <div style="min-width: 250px; font-family: system-ui;">
            <div style="margin-bottom: 8px;">
                <span style="
                    background-color: ${categoryColor};
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                ">${categoryLabel}</span>
                <span style="
                    background-color: ${statusColor};
                    color: white;
                    padding: 3px 10px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    text-transform: uppercase;
                    margin-left: 4px;
                ">${statusLabel}</span>
            </div>
            
            <h3 style="
                margin: 8px 0;
                font-size: 15px;
                color: #111827;
                font-weight: 600;
            ">${report.titulo}</h3>
            
            <p style="
                margin: 8px 0;
                font-size: 13px;
                color: #6b7280;
                line-height: 1.4;
            ">${report.contenido.substring(0, 100)}${report.contenido.length > 100 ? '...' : ''}</p>
            
            <div style="
                margin-top: 8px;
                padding-top: 8px;
                border-top: 1px solid #e5e7eb;
                font-size: 12px;
                color: #9ca3af;
            ">
                <div style="margin-bottom: 4px;">
                    👁 ${report.vistas} vistas • 👍 ${report.likes} likes
                </div>
                <div>
                    📍 ${report.ubicacion}
                </div>
            </div>
            
            <button 
                onclick="window.location.href='reporte-detalle.html?id=${report.id}'" 
                style="
                    width: 100%;
                    margin-top: 12px;
                    padding: 8px 16px;
                    background-color: #3b82f6;
                    color: white;
                    border: none;
                    border-radius: 8px;
                    font-weight: 600;
                    cursor: pointer;
                    font-size: 13px;
                "
                onmouseover="this.style.backgroundColor='#2563eb'"
                onmouseout="this.style.backgroundColor='#3b82f6'"
            >
                Ver Detalles
            </button>
        </div>
    `;
}

/**
 * Filtrar mapa por categoría
 */
function filterMapCategory(category) {
    currentCategory = category;
    
    // Actualizar botones activos
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.category === category) {
            btn.classList.add('active');
        }
    });
    
    // Renderizar marcadores filtrados
    renderMapMarkers(allReports);
}

/**
 * Actualizar estadísticas del mapa
 */
function updateMapStats(reports) {
    document.getElementById('totalMapReports').textContent = reports.length;
    
    // Contar por categoría
    const security = reports.filter(r => r.categoria === 'seguridad').length;
    const infra = reports.filter(r => r.categoria === 'infraestructura').length;
    const vias = reports.filter(r => r.categoria === 'vias').length;
    
    document.getElementById('securityReports').textContent = security;
    document.getElementById('infraReports').textContent = infra;
    document.getElementById('viasReports').textContent = vias;
}

/**
 * Detectar ubicación del usuario
 */
function detectUserLocation() {
    if (!navigator.geolocation) {
        showToast('Tu navegador no soporta geolocalización', 'warning');
        return;
    }
    
    showToast('Detectando tu ubicación...', 'info');
    
    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            // Centrar mapa en ubicación del usuario
            map.setView([latitude, longitude], 15);
            
            // Agregar marcador de usuario
            L.marker([latitude, longitude], {
                icon: L.divIcon({
                    className: 'user-location-marker',
                    html: `
                        <div style="
                            width: 20px;
                            height: 20px;
                            background-color: #3b82f6;
                            border: 3px solid white;
                            border-radius: 50%;
                            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.2);
                        "></div>
                    `,
                    iconSize: [20, 20],
                    iconAnchor: [10, 10]
                })
            }).addTo(map).bindPopup('Tu ubicación').openPopup();
            
            showToast('Ubicación detectada', 'success');
        },
        () => {
            showToast('No se pudo detectar tu ubicación', 'error');
        }
    );
}

/**
 * Buscar dirección en el mapa
 */
async function searchMapLocation() {
    const query = prompt('¿Qué ubicación deseas buscar?');
    
    if (!query) return;
    
    showToast('Buscando ubicación...', 'info');
    
    try {
        const response = await fetch(
            `${API_BASE_URL}/geocoding.php?action=search&q=${encodeURIComponent(query)}`
        );
        const data = await response.json();
        
        if (data.success && data.data.results.length > 0) {
            const result = data.data.results[0];
            const lat = parseFloat(result.lat);
            const lon = parseFloat(result.lon);
            
            map.setView([lat, lon], 15);
            
            L.marker([lat, lon]).addTo(map)
                .bindPopup(`📍 ${result.display_name}`)
                .openPopup();
            
            showToast('Ubicación encontrada', 'success');
        } else {
            showToast('No se encontró la ubicación', 'warning');
        }
    } catch (error) {
        console.error('Error searching location:', error);
        showToast('Error al buscar ubicación', 'error');
    }
}
