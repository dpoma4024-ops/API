<?php
/**
 * SigmaForo - API de Reportes
 * 
 * Endpoints para gestión de reportes
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

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
        
        // Construir WHERE clause
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
        
        // Ordenamiento
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
    
    if (!$id) {
        sendError('ID de reporte requerido');
    }
    
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
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        // Incrementar vistas (directo sin procedimiento)
        $stmt = $db->prepare("UPDATE reportes SET vistas = vistas + 1 WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(['report' => $report]);
        
    } catch (PDOException $e) {
        logError('Error en get report: ' . $e->getMessage());
        sendError('Error al obtener reporte', 500);
    }
}

// ========================================
// CREAR REPORTE (CON EXTRACCIÓN DE HASHTAGS)
// ========================================

if ($action === 'create' && $method === 'POST') {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($data, ['title', 'content', 'category', 'location']);
    
    $title = sanitizeString($data['title']);
    $content = sanitizeString($data['content']);
    $category = $data['category'];
    $location = sanitizeString($data['location']);
    $lat = isset($data['lat']) ? floatval($data['lat']) : null;
    $lng = isset($data['lng']) ? floatval($data['lng']) : null;
    $imageUrl = isset($data['imageUrl']) ? sanitizeString($data['imageUrl']) : null;
    
    // Validar categoría
    $validCategories = ['seguridad', 'infraestructura', 'vias', 'servicios', 'medio_ambiente'];
    if (!in_array($category, $validCategories)) {
        sendError('Categoría no válida');
    }
    
    try {
        // Iniciar transacción
        $db->beginTransaction();
        
        // 1. Insertar el reporte
        $stmt = $db->prepare("
            INSERT INTO reportes (user_id, titulo, contenido, categoria, ubicacion, latitud, longitud, imagen_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $user['user_id'],
            $title,
            $content,
            $category,
            $location,
            $lat,
            $lng,
            $imageUrl
        ]);
        
        $reportId = $db->lastInsertId();
        
        // 2. Extraer y procesar hashtags
        $hashtags = extractHashtags($title . ' ' . $content);
        
        if (!empty($hashtags)) {
            foreach ($hashtags as $hashtag) {
                // Verificar si el hashtag ya existe
                $stmt = $db->prepare("SELECT id FROM hashtags WHERE nombre = ?");
                $stmt->execute([$hashtag]);
                $existingHashtag = $stmt->fetch();
                
                if ($existingHashtag) {
                    // Hashtag existe, incrementar contador
                    $hashtagId = $existingHashtag['id'];
                    $stmt = $db->prepare("UPDATE hashtags SET contador = contador + 1 WHERE id = ?");
                    $stmt->execute([$hashtagId]);
                } else {
                    // Hashtag nuevo, crear
                    $stmt = $db->prepare("INSERT INTO hashtags (nombre, contador) VALUES (?, 1)");
                    $stmt->execute([$hashtag]);
                    $hashtagId = $db->lastInsertId();
                }
                
                // Relacionar hashtag con reporte
                $stmt = $db->prepare("INSERT INTO reporte_hashtags (reporte_id, hashtag_id) VALUES (?, ?)");
                $stmt->execute([$reportId, $hashtagId]);
            }
        }
        
        // Confirmar transacción
        $db->commit();
        
        // Obtener el reporte completo con hashtags
        $stmt = $db->prepare("
            SELECT 
                r.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo,
                GROUP_CONCAT(h.nombre) as hashtags
            FROM reportes r
            INNER JOIN usuarios u ON r.user_id = u.id
            LEFT JOIN reporte_hashtags rh ON r.id = rh.reporte_id
            LEFT JOIN hashtags h ON rh.hashtag_id = h.id
            WHERE r.id = ?
            GROUP BY r.id
        ");
        $stmt->execute([$reportId]);
        $report = $stmt->fetch();
        
        // Convertir hashtags de string a array
        if ($report && $report['hashtags']) {
            $report['hashtags_array'] = explode(',', $report['hashtags']);
        } else {
            $report['hashtags_array'] = [];
        }
        
        sendSuccess([
            'report' => $report,
            'hashtags_found' => count($hashtags)
        ], 'Reporte creado exitosamente');
        
    } catch (PDOException $e) {
        // Revertir transacción en caso de error
        if ($db->inTransaction()) {
            $db->rollBack();
        }
        logError('Error en create report: ' . $e->getMessage());
        sendError('Error al crear reporte: ' . $e->getMessage(), 500);
    }
}

// ========================================
// ACTUALIZAR REPORTE
// ========================================

if ($action === 'update' && $method === 'PUT') {
    $user = requireAuth();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendError('ID de reporte requerido');
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    try {
        // Verificar que el reporte pertenece al usuario (o es admin)
        $stmt = $db->prepare("SELECT user_id FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        if ($report['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para editar este reporte', 403);
        }
        
        $updates = [];
        $params = [];
        
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
        
        if (isset($data['status']) && $user['user_type'] === 'admin') {
            $updates[] = "estado = ?";
            $params[] = $data['status'];
        }
        
        if (empty($updates)) {
            sendError('No hay campos para actualizar');
        }
        
        $params[] = $id;
        
        $sql = "UPDATE reportes SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
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
    if (!$id) {
        sendError('ID de reporte requerido');
    }
    
    try {
        // Verificar permisos
        $stmt = $db->prepare("SELECT user_id FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        if ($report['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para eliminar este reporte', 403);
        }
        
        $stmt = $db->prepare("DELETE FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        
        // Registrar actividad si es admin
        if ($user['user_type'] === 'admin') {
            $stmt = $db->prepare("
                INSERT INTO registro_actividad (admin_id, accion, tabla_afectada, registro_id, descripcion)
                VALUES (?, 'ELIMINAR_REPORTE', 'reportes', ?, 'Reporte eliminado por administrador')
            ");
            $stmt->execute([$user['user_id'], $id]);
        }
        
        sendSuccess(null, 'Reporte eliminado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete report: ' . $e->getMessage());
        sendError('Error al eliminar reporte', 500);
    }
}

// ========================================
// DAR/QUITAR LIKE
// ========================================

if ($action === 'like' && $method === 'POST') {
    $user = requireAuth();
    
    // Los usuarios anónimos no pueden dar like
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden dar likes', 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    validateRequired($data, ['report_id']);
    
    $reportId = intval($data['report_id']);
    
    try {
        // Verificar si ya existe el like
        $stmt = $db->prepare("SELECT id FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
        $stmt->execute([$user['user_id'], $reportId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            // Quitar like
            $stmt = $db->prepare("DELETE FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
            $stmt->execute([$user['user_id'], $reportId]);
            
            $stmt = $db->prepare("UPDATE reportes SET likes = likes - 1 WHERE id = ?");
            $stmt->execute([$reportId]);
            
            $action = 'unliked';
        } else {
            // Agregar like
            $stmt = $db->prepare("INSERT INTO likes_reportes (user_id, reporte_id) VALUES (?, ?)");
            $stmt->execute([$user['user_id'], $reportId]);
            
            $stmt = $db->prepare("UPDATE reportes SET likes = likes + 1 WHERE id = ?");
            $stmt->execute([$reportId]);
            
            $action = 'liked';
        }
        
        // Obtener total actualizado
        $stmt = $db->prepare("SELECT likes FROM reportes WHERE id = ?");
        $stmt->execute([$reportId]);
        $result = $stmt->fetch();
        
        sendSuccess([
            'action' => $action,
            'total_likes' => $result['likes']
        ]);
        
    } catch (PDOException $e) {
        logError('Error en like: ' . $e->getMessage());
        sendError('Error al procesar like: ' . $e->getMessage(), 500);
    }
}

// ========================================
// MIS REPORTES
// ========================================

if ($action === 'my-reports' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no tienen reportes guardados', 403);
    }
    
    try {
        $status = isset($_GET['status']) ? $_GET['status'] : 'all';
        
        $where = "WHERE r.user_id = ?";
        $params = [$user['user_id']];
        
        if ($status !== 'all') {
            $where .= " AND r.estado = ?";
            $params[] = $status;
        }
        
        $stmt = $db->prepare("
            SELECT 
                r.*,
                (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios
            FROM reportes r
            $where
            ORDER BY r.fecha_creacion DESC
        ");
        $stmt->execute($params);
        
        $reports = $stmt->fetchAll();
        
        sendSuccess(['reports' => $reports]);
        
    } catch (PDOException $e) {
        logError('Error en my-reports: ' . $e->getMessage());
        sendError('Error al obtener mis reportes', 500);
    }
}

// ========================================
// ESTADÍSTICAS DE REPORTES
// ========================================

if ($action === 'stats' && $method === 'GET') {
    try {
        // Total de reportes
        $stmt = $db->query("SELECT COUNT(*) as total FROM reportes");
        $total = $stmt->fetch()['total'];
        
        // Reportes hoy
        $stmt = $db->query("SELECT COUNT(*) as today FROM reportes WHERE DATE(fecha_creacion) = CURDATE()");
        $today = $stmt->fetch()['today'];
        
        // Por estado
        $stmt = $db->query("SELECT estado, COUNT(*) as count FROM reportes GROUP BY estado");
        $byStatus = [];
        while ($row = $stmt->fetch()) {
            $byStatus[$row['estado']] = $row['count'];
        }
        
        // Por categoría
        $stmt = $db->query("SELECT * FROM v_reportes_por_categoria");
        $byCategory = $stmt->fetchAll();
        
        sendSuccess([
            'total' => $total,
            'today' => $today,
            'by_status' => $byStatus,
            'by_category' => $byCategory
        ]);
        
    } catch (PDOException $e) {
        logError('Error en stats: ' . $e->getMessage());
        sendError('Error al obtener estadísticas', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
