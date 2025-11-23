<?php
/**
 * SigmaForo - API de Notificaciones
 * 
 * Endpoints para gestión de notificaciones de usuarios
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Leer datos JSON
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? [];

// Detectar acción
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// LISTAR NOTIFICACIONES DEL USUARIO
// ========================================

if ($action === 'list' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendSuccess(['notifications' => [], 'total' => 0, 'unread' => 0]);
        exit;
    }
    
    $onlyUnread = isset($_GET['unread']) && $_GET['unread'] === 'true';
    $limit = isset($_GET['limit']) ? min(50, max(1, intval($_GET['limit']))) : 20;
    
    try {
        $where = "WHERE n.user_id = ?";
        $params = [$user['user_id']];
        
        if ($onlyUnread) {
            $where .= " AND n.is_read = FALSE";
        }
        
        // Obtener notificaciones
        $stmt = $db->prepare("
            SELECT 
                n.*,
                r.titulo as reporte_titulo,
                r.imagen_url as reporte_imagen,
                u.nombre as autor_nombre,
                u.username as autor_username
            FROM notificaciones n
            LEFT JOIN reportes r ON n.reporte_id = r.id
            LEFT JOIN usuarios u ON n.from_user_id = u.id
            $where
            ORDER BY n.fecha_creacion DESC
            LIMIT ?
        ");
        
        $params[] = $limit;
        $stmt->execute($params);
        $notifications = $stmt->fetchAll();
        
        // Contar no leídas
        $stmt = $db->prepare("
            SELECT COUNT(*) as unread 
            FROM notificaciones 
            WHERE user_id = ? AND is_read = FALSE
        ");
        $stmt->execute([$user['user_id']]);
        $unreadCount = $stmt->fetch()['unread'];
        
        sendSuccess([
            'notifications' => $notifications,
            'total' => count($notifications),
            'unread' => $unreadCount
        ]);
        
    } catch (PDOException $e) {
        logError('Error en list notifications: ' . $e->getMessage());
        sendError('Error al obtener notificaciones', 500);
    }
}

// ========================================
// CONTAR NOTIFICACIONES NO LEÍDAS
// ========================================

if ($action === 'count' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendSuccess(['unread' => 0]);
        exit;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT COUNT(*) as unread 
            FROM notificaciones 
            WHERE user_id = ? AND is_read = FALSE
        ");
        $stmt->execute([$user['user_id']]);
        $unreadCount = $stmt->fetch()['unread'];
        
        sendSuccess(['unread' => $unreadCount]);
        
    } catch (PDOException $e) {
        logError('Error en count notifications: ' . $e->getMessage());
        sendError('Error al contar notificaciones', 500);
    }
}

// ========================================
// MARCAR NOTIFICACIÓN COMO LEÍDA
// ========================================

if ($action === 'mark-read' && $method === 'PUT') {
    $user = requireAuth();
    
    $notificationId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$notificationId) {
        sendError('ID de notificación requerido');
    }
    
    try {
        // Verificar que la notificación pertenece al usuario
        $stmt = $db->prepare("SELECT user_id FROM notificaciones WHERE id = ?");
        $stmt->execute([$notificationId]);
        $notification = $stmt->fetch();
        
        if (!$notification) {
            sendError('Notificación no encontrada', 404);
        }
        
        if ($notification['user_id'] != $user['user_id']) {
            sendError('No tienes permiso para modificar esta notificación', 403);
        }
        
        // Marcar como leída
        $stmt = $db->prepare("UPDATE notificaciones SET is_read = TRUE WHERE id = ?");
        $stmt->execute([$notificationId]);
        
        sendSuccess(null, 'Notificación marcada como leída');
        
    } catch (PDOException $e) {
        logError('Error en mark-read: ' . $e->getMessage());
        sendError('Error al marcar notificación', 500);
    }
}

// ========================================
// MARCAR TODAS COMO LEÍDAS
// ========================================

if ($action === 'mark-all-read' && $method === 'PUT') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no tienen notificaciones', 403);
    }
    
    try {
        $stmt = $db->prepare("
            UPDATE notificaciones 
            SET is_read = TRUE 
            WHERE user_id = ? AND is_read = FALSE
        ");
        $stmt->execute([$user['user_id']]);
        
        $affected = $stmt->rowCount();
        
        sendSuccess([
            'marked' => $affected
        ], 'Todas las notificaciones marcadas como leídas');
        
    } catch (PDOException $e) {
        logError('Error en mark-all-read: ' . $e->getMessage());
        sendError('Error al marcar notificaciones', 500);
    }
}

// ========================================
// ELIMINAR NOTIFICACIÓN
// ========================================

if ($action === 'delete' && $method === 'DELETE') {
    $user = requireAuth();
    
    $notificationId = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$notificationId) {
        sendError('ID de notificación requerido');
    }
    
    try {
        // Verificar pertenencia
        $stmt = $db->prepare("SELECT user_id FROM notificaciones WHERE id = ?");
        $stmt->execute([$notificationId]);
        $notification = $stmt->fetch();
        
        if (!$notification) {
            sendError('Notificación no encontrada', 404);
        }
        
        if ($notification['user_id'] != $user['user_id']) {
            sendError('No tienes permiso para eliminar esta notificación', 403);
        }
        
        // Eliminar
        $stmt = $db->prepare("DELETE FROM notificaciones WHERE id = ?");
        $stmt->execute([$notificationId]);
        
        sendSuccess(null, 'Notificación eliminada');
        
    } catch (PDOException $e) {
        logError('Error en delete notification: ' . $e->getMessage());
        sendError('Error al eliminar notificación', 500);
    }
}

// ========================================
// CREAR NOTIFICACIÓN (USO INTERNO)
// ========================================

if ($action === 'create' && $method === 'POST') {
    // Este endpoint es para uso interno del sistema
    // No requiere autenticación de usuario final
    
    validateRequired($data, ['user_id', 'tipo', 'titulo', 'descripcion']);
    
    $userId = intval($data['user_id']);
    $tipo = $data['tipo'];
    $titulo = sanitizeString($data['titulo']);
    $descripcion = sanitizeString($data['descripcion']);
    $reporteId = isset($data['reporte_id']) ? intval($data['reporte_id']) : null;
    $categoria = isset($data['categoria']) ? $data['categoria'] : null;
    $ubicacion = isset($data['ubicacion']) ? sanitizeString($data['ubicacion']) : null;
    $fromUserId = isset($data['from_user_id']) ? intval($data['from_user_id']) : null;
    
    try {
        $stmt = $db->prepare("
            INSERT INTO notificaciones 
            (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion, from_user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ");
        
        $stmt->execute([
            $userId,
            $tipo,
            $titulo,
            $descripcion,
            $reporteId,
            $categoria,
            $ubicacion,
            $fromUserId
        ]);
        
        $notificationId = $db->lastInsertId();
        
        sendSuccess([
            'notification_id' => $notificationId
        ], 'Notificación creada exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en create notification: ' . $e->getMessage());
        sendError('Error al crear notificación', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado. Action: ' . $action, 404);
