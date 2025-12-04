<?php
/**
 * SigmaForo - API de Comentarios
 * Endpoints para gestión de comentarios en reportes
 * VERSIÓN ACTUALIZADA CON NOTIFICACIONES
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ========================================
// LISTAR COMENTARIOS DE UN REPORTE
// ========================================

if ($action === 'list' && $method === 'GET') {
    $reportId = isset($_GET['report_id']) ? intval($_GET['report_id']) : 0;
    
    if (!$reportId) {
        sendError('ID de reporte requerido');
    }
    
    try {
        $stmt = $db->prepare("
            SELECT 
                c.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo
            FROM comentarios c
            INNER JOIN usuarios u ON c.user_id = u.id
            WHERE c.reporte_id = ?
            ORDER BY c.fecha_creacion ASC
        ");
        $stmt->execute([$reportId]);
        
        $comments = $stmt->fetchAll();
        
        sendSuccess([
            'comments' => $comments,
            'total' => count($comments)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en list comments: ' . $e->getMessage());
        sendError('Error al obtener comentarios', 500);
    }
}

// ========================================
// CREAR COMENTARIO (CON NOTIFICACIONES) 🔔
// ========================================

if ($action === 'create' && $method === 'POST') {
    $user = requireAuth();
    
    // Los usuarios anónimos no pueden comentar
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden comentar', 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($data, ['report_id', 'content']);
    
    $reportId = intval($data['report_id']);
    $content = sanitizeString($data['content']);
    
    if (strlen($content) < 3) {
        sendError('El comentario debe tener al menos 3 caracteres');
    }
    
    if (strlen($content) > 1000) {
        sendError('El comentario no puede exceder 1000 caracteres');
    }
    
    try {
        // Verificar que el reporte existe y obtener info del autor
        $stmt = $db->prepare("SELECT id, user_id, titulo, categoria, ubicacion FROM reportes WHERE id = ?");
        $stmt->execute([$reportId]);
        $report = $stmt->fetch();
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        // Insertar comentario
        $stmt = $db->prepare("
            INSERT INTO comentarios (reporte_id, user_id, contenido)
            VALUES (?, ?, ?)
        ");
        $stmt->execute([$reportId, $user['user_id'], $content]);
        
        $commentId = $db->lastInsertId();
        
        // Solo notificar si el comentario NO es del autor del reporte
        if ($report['user_id'] != $user['user_id']) {
            // Obtener nombre del usuario que comenta
            $stmt = $db->prepare("SELECT nombre FROM usuarios WHERE id = ?");
            $stmt->execute([$user['user_id']]);
            $commenterData = $stmt->fetch();
            
            // Crear notificación
            $stmt = $db->prepare("
                INSERT INTO notificaciones 
                (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion, from_user_id)
                VALUES (?, 'comment', ?, ?, ?, ?, ?, ?)
            ");
            $stmt->execute([
                $report['user_id'],
                'Nuevo comentario en tu reporte',
                $commenterData['nombre'] . ' comentó en "' . substr($report['titulo'], 0, 50) . '"',
                $reportId,
                $report['categoria'],
                $report['ubicacion'],
                $user['user_id']
            ]);
        }
        
        // Obtener el comentario completo
        $stmt = $db->prepare("
            SELECT 
                c.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo
            FROM comentarios c
            INNER JOIN usuarios u ON c.user_id = u.id
            WHERE c.id = ?
        ");
        $stmt->execute([$commentId]);
        $comment = $stmt->fetch();
        
        sendSuccess(['comment' => $comment], 'Comentario publicado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en create comment: ' . $e->getMessage());
        sendError('Error al crear comentario: ' . $e->getMessage(), 500);
    }
}

// ========================================
// ACTUALIZAR COMENTARIO
// ========================================

if ($action === 'update' && $method === 'PUT') {
    $user = requireAuth();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendError('ID de comentario requerido');
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    validateRequired($data, ['content']);
    
    $content = sanitizeString($data['content']);
    
    try {
        // Verificar que el comentario pertenece al usuario
        $stmt = $db->prepare("SELECT user_id FROM comentarios WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch();
        
        if (!$comment) {
            sendError('Comentario no encontrado', 404);
        }
        
        if ($comment['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para editar este comentario', 403);
        }
        
        // Actualizar
        $stmt = $db->prepare("UPDATE comentarios SET contenido = ? WHERE id = ?");
        $stmt->execute([$content, $id]);
        
        sendSuccess(null, 'Comentario actualizado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en update comment: ' . $e->getMessage());
        sendError('Error al actualizar comentario', 500);
    }
}

// ========================================
// ELIMINAR COMENTARIO
// ========================================

if ($action === 'delete' && $method === 'DELETE') {
    $user = requireAuth();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendError('ID de comentario requerido');
    }
    
    try {
        // Verificar permisos
        $stmt = $db->prepare("SELECT user_id FROM comentarios WHERE id = ?");
        $stmt->execute([$id]);
        $comment = $stmt->fetch();
        
        if (!$comment) {
            sendError('Comentario no encontrado', 404);
        }
        
        if ($comment['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para eliminar este comentario', 403);
        }
        
        // Eliminar
        $stmt = $db->prepare("DELETE FROM comentarios WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(null, 'Comentario eliminado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete comment: ' . $e->getMessage());
        sendError('Error al eliminar comentario', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
