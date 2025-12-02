<?php
/**
 * SigmaForo - API de Reportes
 * Endpoints para gestión de reportes
 * VERSIÓN ACTUALIZADA CON NOTIFICACIONES
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Leer el input una sola vez para todo el archivo
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? []; 

// Detectar acción desde URL o desde el cuerpo JSON
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// LISTAR REPORTES
// ========================================

if ($action === 'list' && $method === 'GET') {
    try {
        $page = isset($_GET['page']) ? max(1, intval($_GET['page'])) : 1;
        $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : ITEMS_PER_PAGE;
        $offset = ($page - 1) * $limit;
        
        $category = isset($_GET['category']) ? $_GET['category'] : null;
        $status = isset($_GET['status']) ? $_GET['status'] : null;
        $search = isset($_GET['search']) ? $_GET['search'] : null;
        $sort = isset($_GET['sort']) ? $_GET['sort'] : 'recent';
        
        $where = [];
        $params = [];
        
        if ($category && $category !== 'all') {
            $where[] = "r.categoria = ?";
            $params[] = $category;
        }
        
        if ($status && $status !== 'all') {
            $where[] = "r.estado = ?";
            $params[] = $status;
        }
        
        if ($search) {
            $where[] = "(r.titulo LIKE ? OR r.contenido LIKE ? OR u.nombre LIKE ?)";
            $searchTerm = "%$search%";
            $params[] = $searchTerm;
            $params[] = $searchTerm;
            $params[] = $searchTerm;
        }
        
        $whereClause = !empty($where) ? "WHERE " . implode(" AND ", $where) : "";
        
        $orderBy = match($sort) {
            'oldest' => 'r.fecha_creacion ASC',
            'likes' => 'r.likes DESC',
            'views' => 'r.vistas DESC',
            default => 'r.fecha_creacion DESC'
        };
        
        // Contar total
        $countSql = "SELECT COUNT(*) as total FROM reportes r INNER JOIN usuarios u ON r.user_id = u.id $whereClause";
        $stmt = $db->prepare($countSql);
        $stmt->execute($params);
        $total = $stmt->fetch()['total'];
        
        // Obtener reportes
        $sql = "
            SELECT 
                r.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo,
                (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios
            FROM reportes r
            INNER JOIN usuarios u ON r.user_id = u.id
            $whereClause
            ORDER BY $orderBy
            LIMIT $limit OFFSET $offset
        ";
        
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        $reports = $stmt->fetchAll();
        
        // Procesar hashtags
        foreach ($reports as &$report) {
            $report['hashtags_array'] = !empty($report['hashtags']) ? explode(',', $report['hashtags']) : [];
        }
        
        sendSuccess([
            'reports' => $reports,
            'pagination' => [
                'current_page' => $page,
                'per_page' => $limit,
                'total' => $total,
                'total_pages' => ceil($total / $limit)
            ]
        ]);
        
    } catch (PDOException $e) {
        logError('Error en list reports: ' . $e->getMessage());
        sendError('Error al obtener reportes', 500);
    }
}

// ========================================
// OBTENER REPORTE POR ID
// ========================================

if ($action === 'get' && $method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) sendError('ID de reporte requerido');
    
    try {
        $stmt = $db->prepare("
            SELECT 
                r.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo,
                (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios
            FROM reportes r
            INNER JOIN usuarios u ON r.user_id = u.id
            WHERE r.id = ?
        ");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) sendError('Reporte no encontrado', 404);
        
        $stmt = $db->prepare("UPDATE reportes SET vistas = vistas + 1 WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(['report' => $report]);
        
    } catch (PDOException $e) {
        logError('Error en get report: ' . $e->getMessage());
        sendError('Error al obtener reporte', 500);
    }
}

// ========================================
// CREAR REPORTE (Con Hashtags y Transacción)
// ========================================

if ($action === 'create' && $method === 'POST') {
    $user = requireAuth();
    
    validateRequired($data, ['title', 'content', 'category', 'location']);
    
    $title = sanitizeString($data['title']);
    $content = sanitizeString($data['content']);
    $category = $data['category'];
    $location = sanitizeString($data['location']);
    $lat = isset($data['lat']) ? floatval($data['lat']) : null;
    $lng = isset($data['lng']) ? floatval($data['lng']) : null;
    $imageUrl = isset($data['imageUrl']) ? sanitizeString($data['imageUrl']) : null;
    
    $validCategories = ['seguridad', 'infraestructura', 'vias', 'servicios', 'medio_ambiente'];
    if (!in_array($category, $validCategories)) sendError('Categoría no válida');
    
    try {
        $db->beginTransaction();
        
        // 1. Insertar reporte
        $stmt = $db->prepare("
            INSERT INTO reportes (user_id, titulo, contenido, categoria, ubicacion, latitud, longitud, imagen_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([$user['user_id'], $title, $content, $category, $location, $lat, $lng, $imageUrl]);
        $reportId = $db->lastInsertId();
        
        // 2. Extraer y procesar hashtags
        $hashtags = extractHashtags($title . ' ' . $content);
        $hashtagsStr = !empty($hashtags) ? implode(',', $hashtags) : null;
        
        if ($hashtagsStr) {
            $stmt = $db->prepare("UPDATE reportes SET hashtags = ? WHERE id = ?");
            $stmt->execute([$hashtagsStr, $reportId]);
        }
        
        if (!empty($hashtags)) {
            foreach ($hashtags as $hashtag) {
                $stmt = $db->prepare("SELECT id FROM hashtags WHERE nombre = ?");
                $stmt->execute([$hashtag]);
                $existingHashtag = $stmt->fetch();
                
                if ($existingHashtag) {
                    $hashtagId = $existingHashtag['id'];
                    $stmt = $db->prepare("UPDATE hashtags SET contador = contador + 1 WHERE id = ?");
                    $stmt->execute([$hashtagId]);
                } else {
                    $stmt = $db->prepare("INSERT INTO hashtags (nombre, contador) VALUES (?, 1)");
                    $stmt->execute([$hashtag]);
                    $hashtagId = $db->lastInsertId();
                }
                
                $stmt = $db->prepare("INSERT INTO reporte_hashtags (reporte_id, hashtag_id) VALUES (?, ?)");
                $stmt->execute([$reportId, $hashtagId]);
            }
        }
        
        $db->commit();
        
        // Obtener reporte final
        $stmt = $db->prepare("SELECT * FROM reportes WHERE id = ?");
        $stmt->execute([$reportId]);
        $report = $stmt->fetch();
        
        sendSuccess([
            'report' => $report,
            'hashtags_found' => count($hashtags)
        ], 'Reporte creado exitosamente');
        
    } catch (PDOException $e) {
        if ($db->inTransaction()) $db->rollBack();
        logError('Error en create report: ' . $e->getMessage());
        sendError('Error al crear reporte', 500);
    }
}

// ========================================
// ACTUALIZAR REPORTE (CON NOTIFICACIONES) 
// ========================================

if ($action === 'update' && $method === 'PUT') {
    $user = requireAuth();
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) sendError('ID de reporte requerido');
    
    try {
        // Obtener datos del reporte actual
        $stmt = $db->prepare("SELECT user_id, estado FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) sendError('Reporte no encontrado', 404);
        
        if ($report['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para editar este reporte', 403);
        }
        
        $updates = [];
        $params = [];
        
        // Guardar el estado anterior para detectar cambios
        $oldStatus = $report['estado'];
        $statusChanged = false;
        $newStatus = null;
        
        if (isset($data['title'])) { 
            $updates[] = "titulo = ?"; 
            $params[] = sanitizeString($data['title']); 
        }
        if (isset($data['content'])) { 
            $updates[] = "contenido = ?"; 
            $params[] = sanitizeString($data['content']); 
        }
        if (isset($data['category'])) { 
            $updates[] = "categoria = ?"; 
            $params[] = $data['category']; 
        }
        if (isset($data['location'])) { 
            $updates[] = "ubicacion = ?"; 
            $params[] = sanitizeString($data['location']); 
        }
        
        // Solo admin puede cambiar estado
        if (isset($data['status']) && $user['user_type'] === 'admin') { 
            $updates[] = "estado = ?"; 
            $newStatus = $data['status'];
            $params[] = $newStatus;
            $statusChanged = ($oldStatus !== $newStatus);
        }
        
        if (empty($updates)) sendError('No hay campos para actualizar');
        
        $params[] = $id;
        $sql = "UPDATE reportes SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        // CREAR NOTIFICACIONES DE CAMBIO DE ESTADO (NUEVO)
        if ($statusChanged && $newStatus) {
            // Obtener datos completos del reporte actualizado
            $stmt = $db->prepare("SELECT * FROM reportes WHERE id = ?");
            $stmt->execute([$id]);
            $updatedReport = $stmt->fetch();
            
            if ($updatedReport) {
                $statusLabels = [
                    'pendiente' => 'Pendiente',
                    'en_revision' => 'En Revisión',
                    'en_proceso' => 'En Proceso',
                    'resuelto' => 'Resuelto'
                ];
                
                // 1. Notificar al autor del reporte
                $stmt = $db->prepare("
                    INSERT INTO notificaciones 
                    (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion)
                    VALUES (?, 'incident_status_update', ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $updatedReport['user_id'],
                    'Actualización de estado',
                    'Tu reporte "' . substr($updatedReport['titulo'], 0, 50) . '" cambió a: ' . $statusLabels[$newStatus],
                    $id,
                    $updatedReport['categoria'],
                    $updatedReport['ubicacion']
                ]);
                
                // 2. Notificar a usuarios que siguen la zona (OPCIONAL)
                if ($updatedReport['latitud'] && $updatedReport['longitud']) {
                    $stmt = $db->prepare("
                        SELECT DISTINCT z.user_id 
                        FROM zonas_seguidas z
                        WHERE z.user_id != ?
                        AND (6371 * acos(
                            cos(radians(z.latitud)) * 
                            cos(radians(?)) * 
                            cos(radians(?) - radians(z.longitud)) + 
                            sin(radians(z.latitud)) * 
                            sin(radians(?))
                        )) <= z.radio_km
                    ");
                    $stmt->execute([
                        $updatedReport['user_id'],
                        $updatedReport['latitud'],
                        $updatedReport['longitud'],
                        $updatedReport['latitud']
                    ]);
                    $followers = $stmt->fetchAll();
                    
                    foreach ($followers as $follower) {
                        $stmt = $db->prepare("
                            INSERT INTO notificaciones 
                            (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion)
                            VALUES (?, 'new_incident_in_followed_area', ?, ?, ?, ?, ?)
                        ");
                        $stmt->execute([
                            $follower['user_id'],
                            'Actualización en zona seguida',
                            'El reporte "' . substr($updatedReport['titulo'], 0, 50) . '" cambió a: ' . $statusLabels[$newStatus],
                            $id,
                            $updatedReport['categoria'],
                            $updatedReport['ubicacion']
                        ]);
                    }
                }
            }
        }
        
        sendSuccess(null, 'Reporte actualizado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en update report: ' . $e->getMessage());
        sendError('Error al actualizar reporte', 500);
    }
}

// ========================================
// ELIMINAR REPORTE
// ========================================

if ($action === 'delete' && $method === 'DELETE') {
    $user = requireAuth();
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) sendError('ID de reporte requerido');
    
    try {
        $stmt = $db->prepare("SELECT user_id FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) sendError('Reporte no encontrado', 404);
        
        if ($report['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para eliminar este reporte', 403);
        }
        
        $stmt = $db->prepare("DELETE FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(null, 'Reporte eliminado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete report: ' . $e->getMessage());
        sendError('Error al eliminar reporte', 500);
    }
}

// ========================================
// DAR/QUITAR LIKE (CON NOTIFICACIONES) 🔔
// ========================================

if ($action === 'like' && $method === 'POST') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') sendError('Los usuarios anónimos no pueden dar likes', 403);
    
    validateRequired($data, ['report_id']);
    $reportId = intval($data['report_id']);
    
    try {
        // Obtener info del reporte
        $stmt = $db->prepare("SELECT user_id, titulo, categoria, ubicacion FROM reportes WHERE id = ?");
        $stmt->execute([$reportId]);
        $report = $stmt->fetch();
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        $stmt = $db->prepare("SELECT id FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
        $stmt->execute([$user['user_id'], $reportId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            // QUITAR LIKE
            $stmt = $db->prepare("DELETE FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
            $stmt->execute([$user['user_id'], $reportId]);
            $stmt = $db->prepare("UPDATE reportes SET likes = GREATEST(0, likes - 1) WHERE id = ?");
            $stmt->execute([$reportId]);
            $newAction = 'unliked';
        } else {
            // DAR LIKE
            $stmt = $db->prepare("INSERT INTO likes_reportes (user_id, reporte_id) VALUES (?, ?)");
            $stmt->execute([$user['user_id'], $reportId]);
            $stmt = $db->prepare("UPDATE reportes SET likes = likes + 1 WHERE id = ?");
            $stmt->execute([$reportId]);
            $newAction = 'liked';
            
            // 🔔 CREAR NOTIFICACIÓN (NUEVO)
            if ($report['user_id'] != $user['user_id']) {
                $stmt = $db->prepare("SELECT nombre FROM usuarios WHERE id = ?");
                $stmt->execute([$user['user_id']]);
                $likerData = $stmt->fetch();
                
                $stmt = $db->prepare("
                    INSERT INTO notificaciones 
                    (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion, from_user_id)
                    VALUES (?, 'like', ?, ?, ?, ?, ?, ?)
                ");
                $stmt->execute([
                    $report['user_id'],
                    'Le gustó tu reporte',
                    'A ' . $likerData['nombre'] . ' le gustó "' . substr($report['titulo'], 0, 50) . '"',
                    $reportId,
                    $report['categoria'],
                    $report['ubicacion'],
                    $user['user_id']
                ]);
            }
        }
        
        $stmt = $db->prepare("SELECT likes FROM reportes WHERE id = ?");
        $stmt->execute([$reportId]);
        $result = $stmt->fetch();
        
        sendSuccess([
            'action' => $newAction,
            'total_likes' => $result['likes']
        ]);
        
    } catch (PDOException $e) {
        logError('Error en like: ' . $e->getMessage());
        sendError('Error al procesar like', 500);
    }
}

// ========================================
// MIS REPORTES (Versión Corregida: Incluye datos de usuario)
// ========================================

if ($action === 'my-reports' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no tienen reportes guardados', 403);
    }
    
    try {
        $status = isset($_GET['status']) ? $_GET['status'] : 'all';
        
        // Usamos alias 'r' para reportes
        $where = "WHERE r.user_id = ?";
        $params = [$user['user_id']];
        
        if ($status !== 'all') {
            $where .= " AND r.estado = ?";
            $params[] = $status;
        }
        
        // CAMBIO CRÍTICO AQUÍ: Agregamos JOIN usuarios y los campos u.nombre, u.username
        $stmt = $db->prepare("
            SELECT 
                r.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo,
                (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios
            FROM reportes r
            INNER JOIN usuarios u ON r.user_id = u.id
            $where
            ORDER BY r.fecha_creacion DESC
        ");
        
        $stmt->execute($params);
        $reports = $stmt->fetchAll();
        
        // Procesar hashtags
        foreach ($reports as &$report) {
            $report['hashtags_array'] = !empty($report['hashtags']) ? explode(',', $report['hashtags']) : [];
        }
        
        sendSuccess(['reports' => $reports]);
        
    } catch (PDOException $e) {
        logError('Error en my-reports: ' . $e->getMessage());
        sendError('Error al obtener mis reportes', 500);
    }
}

// ========================================
// ESTADÍSTICAS
// ========================================

if ($action === 'stats' && $method === 'GET') {
    try {
        $stmt = $db->query("SELECT COUNT(*) as total FROM reportes");
        $total = $stmt->fetch()['total'];
        
        $stmt = $db->query("SELECT COUNT(*) as today FROM reportes WHERE DATE(fecha_creacion) = CURDATE()");
        $today = $stmt->fetch()['today'];
        
        $stmt = $db->query("SELECT estado, COUNT(*) as count FROM reportes GROUP BY estado");
        $byStatus = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        try {
            $stmt = $db->query("SELECT * FROM v_reportes_por_categoria");
            $byCategory = $stmt->fetchAll();
        } catch (Exception $e) {
            $byCategory = [];
        }
        
        sendSuccess([
            'total' => $total,
            'today' => $today,
            'by_status' => $byStatus,
            'by_category' => $byCategory
        ]);
        
    } catch (PDOException $e) {
        sendError('Error stats', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado. Acción: ' . $action, 404);
?> 
