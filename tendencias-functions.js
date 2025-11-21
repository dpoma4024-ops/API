// ========================================
// FUNCIONES DE TENDENCIAS - SIGMAFORO
// ========================================

/**
 * Cargar tendencias (top hashtags)
 * @param {number} limit - Número de tendencias a mostrar (default: 5)
 */
async function loadTrending(limit = 5) {
  const container = document.getElementById('trendingList');
  if (!container) return;

  // Mostrar loading skeleton
  showTrendingLoading(container);

  try {
    const data = await apiRequest(`trending.php?action=top&limit=${limit}`);
    
    if (data.success && data.data.trending.length > 0) {
      renderTrending(container, data.data.trending);
    } else {
      showTrendingEmpty(container);
    }
  } catch (error) {
    console.error('Error loading trending:', error);
    showTrendingError(container);
  }
}

/**
 * Renderizar lista de tendencias
 */
function renderTrending(container, trending) {
  container.innerHTML = trending.map((item, index) => {
    const rank = index + 1;
    const hashtag = item.nombre;
    const count = parseInt(item.contador) || 0;
    
    return `
      <div class="trending-item" onclick="viewHashtagReports('${hashtag}')">
        <div class="trending-rank">${rank}</div>
        <div class="trending-content">
          <div class="trending-hashtag">${hashtag}</div>
          <div class="trending-count">
            <strong>${formatNumber(count)}</strong> reportes
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Mostrar estado de carga
 */
function showTrendingLoading(container) {
  container.innerHTML = `
    <div class="trending-loading">
      ${[1, 2, 3, 4, 5].map(() => `
        <div class="trending-skeleton">
          <div class="skeleton-rank"></div>
          <div class="skeleton-content">
            <div class="skeleton-text"></div>
            <div class="skeleton-text short"></div>
          </div>
        </div>
      `).join('')}
    </div>
  `;
}

/**
 * Mostrar estado vacío
 */
function showTrendingEmpty(container) {
  container.innerHTML = `
    <div class="trending-empty">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
      </svg>
      <p>No hay tendencias todavía.<br>Sé el primero en usar hashtags!</p>
    </div>
  `;
}

/**
 * Mostrar error
 */
function showTrendingError(container) {
  container.innerHTML = `
    <div class="trending-empty">
      <p style="color: var(--error);">Error al cargar tendencias</p>
      <button class="btn btn-sm btn-outline" onclick="loadTrending()">
        Reintentar
      </button>
    </div>
  `;
}

/**
 * Ver reportes por hashtag
 */
async function viewHashtagReports(hashtag) {
  // Mostrar modal o redirigir a página de búsqueda
  showToast(`Buscando reportes con #${hashtag}...`, 'info');
  
  try {
    const data = await apiRequest(`trending.php?action=by-hashtag&hashtag=${encodeURIComponent(hashtag)}`);
    
    if (data.success) {
      const reports = data.data.reports;
      
      if (reports.length > 0) {
        // Opción 1: Mostrar en modal
        showHashtagReportsModal(hashtag, reports);
        
        // Opción 2: Filtrar feed actual (si estás en dashboard)
        // filterFeedByHashtag(hashtag, reports);
      } else {
        showToast(`No hay reportes con #${hashtag}`, 'warning');
      }
    }
  } catch (error) {
    console.error('Error loading hashtag reports:', error);
    showToast('Error al cargar reportes', 'error');
  }
}

/**
 * Mostrar modal con reportes de un hashtag
 */
function showHashtagReportsModal(hashtag, reports) {
  // Crear modal dinámicamente
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.style.display = 'flex';
  modal.id = 'hashtagModal';
  
  modal.innerHTML = `
    <div class="modal-content modal-large">
      <div class="modal-header">
        <h2>#${hashtag}</h2>
        <button class="close-btn" onclick="closeHashtagModal()">&times;</button>
      </div>
      <div class="modal-body" style="max-height: 70vh; overflow-y: auto;">
        <p style="color: var(--text-secondary); margin-bottom: 20px;">
          ${reports.length} reportes encontrados
        </p>
        <div class="reports-grid" style="display: flex; flex-direction: column; gap: 16px;">
          ${reports.map(report => createReportCard(report)).join('')}
        </div>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  document.body.style.overflow = 'hidden';
  
  // Cerrar al hacer click fuera
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeHashtagModal();
    }
  });
}

/**
 * Cerrar modal de hashtag
 */
function closeHashtagModal() {
  const modal = document.getElementById('hashtagModal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
}

/**
 * Formatear número con separador de miles
 */
function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toLocaleString();
}

/**
 * Buscar hashtags (autocomplete)
 */
async function searchHashtags(query) {
  if (query.length < 2) return [];
  
  try {
    const data = await apiRequest(`trending.php?action=search&q=${encodeURIComponent(query)}`);
    
    if (data.success) {
      return data.data.results;
    }
  } catch (error) {
    console.error('Error searching hashtags:', error);
  }
  
  return [];
}

/**
 * Actualizar tendencias automáticamente cada X minutos
 */
function startTrendingAutoUpdate(intervalMinutes = 5) {
  // Actualizar inmediatamente
  loadTrending();
  
  // Actualizar cada X minutos
  setInterval(() => {
    loadTrending();
  }, intervalMinutes * 60 * 1000);
}

/**
 * Extraer hashtags de un texto (para validación frontend)
 */
function extractHashtagsFromText(text) {
  const regex = /#([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/gu;
  const matches = text.match(regex);
  
  if (!matches) return [];
  
  // Remover el # y convertir a minúsculas
  return matches.map(tag => tag.substring(1).toLowerCase());
}

/**
 * Resaltar hashtags en un texto
 */
function highlightHashtags(text) {
  return text.replace(
    /#([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/gu,
    '<span class="hashtag-highlight" onclick="viewHashtagReports(\'$1\')">#$1</span>'
  );
}

/**
 * Agregar sugerencias de hashtags mientras el usuario escribe
 */
function setupHashtagSuggestions(textareaId, suggestionsContainerId) {
  const textarea = document.getElementById(textareaId);
  const suggestionsContainer = document.getElementById(suggestionsContainerId);
  
  if (!textarea || !suggestionsContainer) return;
  
  let debounceTimer;
  
  textarea.addEventListener('input', function(e) {
    clearTimeout(debounceTimer);
    
    const text = e.target.value;
    const cursorPosition = e.target.selectionStart;
    
    // Buscar si hay un # antes del cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const hashtagMatch = textBeforeCursor.match(/#([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]*)$/);
    
    if (hashtagMatch) {
      const query = hashtagMatch[1];
      
      debounceTimer = setTimeout(async () => {
        const suggestions = await searchHashtags(query);
        
        if (suggestions.length > 0) {
          showHashtagSuggestions(suggestionsContainer, suggestions, textarea);
        } else {
          suggestionsContainer.innerHTML = '';
          suggestionsContainer.style.display = 'none';
        }
      }, 300);
    } else {
      suggestionsContainer.innerHTML = '';
      suggestionsContainer.style.display = 'none';
    }
  });
}

/**
 * Mostrar sugerencias de hashtags
 */
function showHashtagSuggestions(container, suggestions, textarea) {
  container.innerHTML = suggestions.map(item => `
    <div class="hashtag-suggestion" onclick="insertHashtag('${item.nombre}', '${textarea.id}')">
      <span class="hashtag-name">#${item.nombre}</span>
      <span class="hashtag-count">${item.contador} usos</span>
    </div>
  `).join('');
  
  container.style.display = 'block';
}

/**
 * Insertar hashtag seleccionado
 */
function insertHashtag(hashtag, textareaId) {
  const textarea = document.getElementById(textareaId);
  const text = textarea.value;
  const cursorPosition = textarea.selectionStart;
  
  // Encontrar el inicio del hashtag actual
  const textBeforeCursor = text.substring(0, cursorPosition);
  const hashtagStart = textBeforeCursor.lastIndexOf('#');
  
  // Reemplazar el hashtag incompleto con el seleccionado
  const newText = text.substring(0, hashtagStart) + 
                  '#' + hashtag + ' ' + 
                  text.substring(cursorPosition);
  
  textarea.value = newText;
  
  // Mover cursor después del hashtag insertado
  const newCursorPosition = hashtagStart + hashtag.length + 2;
  textarea.setSelectionRange(newCursorPosition, newCursorPosition);
  textarea.focus();
  
  // Ocultar sugerencias
  const container = document.querySelector('.hashtag-suggestions');
  if (container) {
    container.innerHTML = '';
    container.style.display = 'none';
  }
}

// ========================================
// AUTO-INICIALIZACIÓN
// ========================================

// Iniciar actualización automática al cargar la página
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('trendingList')) {
      startTrendingAutoUpdate(5); // Actualizar cada 5 minutos
    }
  });
} else {
  if (document.getElementById('trendingList')) {
    startTrendingAutoUpdate(5);
  }
}
