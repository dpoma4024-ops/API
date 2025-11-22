<?php
/**
 * SigmaForo - API de Reportes
 * Endpoints para gestión de reportes
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// =================================================================
// 1. TRADUCTOR JSON UNIVERSAL (Corrección Crítica)
// =================================================================
// Leemos el input una sola vez para todo el archivo
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
    // Usamos $data global
    
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
// ACTUALIZAR REPORTE
// ========================================

if ($action === 'update' && $method === 'PUT') {
    $user = requireAuth();
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) sendError('ID de reporte requerido');
    
    try {
        $stmt = $db->prepare("SELECT user_id FROM reportes WHERE id = ?");
        $stmt->execute([$id]);
        $report = $stmt->fetch();
        
        if (!$report) sendError('Reporte no encontrado', 404);
        
        if ($report['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para editar este reporte', 403);
        }
        
        $updates = [];
        $params = [];
        
        if (isset($data['title'])) { $updates[] = "titulo = ?"; $params[] = sanitizeString($data['title']); }
        if (isset($data['content'])) { $updates[] = "contenido = ?"; $params[] = sanitizeString($data['content']); }
        if (isset($data['category'])) { $updates[] = "categoria = ?"; $params[] = $data['category']; }
        if (isset($data['location'])) { $updates[] = "ubicacion = ?"; $params[] = sanitizeString($data['location']); }
        if (isset($data['status']) && $user['user_type'] === 'admin') { $updates[] = "estado = ?"; $params[] = $data['status']; }
        
        if (empty($updates)) sendError('No hay campos para actualizar');
        
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
        
        if ($user['user_type'] === 'admin') {
             // Log de admin opcional
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
    
    if ($user['user_type'] === 'anonimo') sendError('Los usuarios anónimos no pueden dar likes', 403);
    
    validateRequired($data, ['report_id']);
    $reportId = intval($data['report_id']);
    
    try {
        $stmt = $db->prepare("SELECT id FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
        $stmt->execute([$user['user_id'], $reportId]);
        $exists = $stmt->fetch();
        
        if ($exists) {
            $stmt = $db->prepare("DELETE FROM likes_reportes WHERE user_id = ? AND reporte_id = ?");
            $stmt->execute([$user['user_id'], $reportId]);
            $stmt = $db->prepare("UPDATE reportes SET likes = GREATEST(0, likes - 1) WHERE id = ?");
            $stmt->execute([$reportId]);
            $newAction = 'unliked';
        } else {
            $stmt = $db->prepare("INSERT INTO likes_reportes (user_id, reporte_id) VALUES (?, ?)");
            $stmt->execute([$user['user_id'], $reportId]);
            $stmt = $db->prepare("UPDATE reportes SET likes = likes + 1 WHERE id = ?");
            $stmt->execute([$reportId]);
            $newAction = 'liked';
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
// MIS REPORTES (Aquí está lo que faltaba)
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
        
        // Procesar hashtags también para mis reportes
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