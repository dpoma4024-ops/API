<?php
/**
 * SigmaForo - API de Administración de Usuarios
 * Endpoints exclusivos para administradores
 */

define('SIGMAFORO_API', true);
require_once '../config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// Leer datos
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? [];
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// VERIFICAR PERMISOS DE ADMINISTRADOR
// ========================================
$admin = requireAdmin();

// ========================================
// LISTAR TODOS LOS USUARIOS
// ========================================
if ($action === 'list' && $method === 'GET') {
    try {
        $stmt = $db->prepare("
            SELECT 
                u.*,
                COUNT(DISTINCT r.id) as total_reportes,
                COALESCE(SUM(r.likes), 0) as total_likes,
                COALESCE(SUM(r.vistas), 0) as total_vistas
            FROM usuarios u
            LEFT JOIN reportes r ON u.id = r.user_id
            WHERE u.tipo != 'anonimo'
            GROUP BY u.id
            ORDER BY u.fecha_registro DESC
        ");
        
        $stmt->execute();
        $users = $stmt->fetchAll();
        
        // No enviar password_hash
        foreach ($users as &$user) {
            unset($user['password_hash']);
        }
        
        sendSuccess([
            'users' => $users,
            'total' => count($users)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en list users: ' . $e->getMessage());
        sendError('Error al obtener usuarios', 500);
    }
}

// ========================================
// CONTAR USUARIOS
// ========================================
if ($action === 'count' && $method === 'GET') {
    try {
        // Total usuarios
        $stmt = $db->query("SELECT COUNT(*) as total FROM usuarios WHERE tipo != 'anonimo'");
        $total = $stmt->fetch()['total'];
        
        // Usuarios activos (no baneados)
        $stmt = $db->query("SELECT COUNT(*) as active FROM usuarios WHERE tipo != 'anonimo' AND is_banned = FALSE");
        $active = $stmt->fetch()['active'];
        
        // Engagement total (likes + comentarios)
        $stmt = $db->query("SELECT 
            (SELECT COALESCE(SUM(likes), 0) FROM reportes) + 
            (SELECT COUNT(*) FROM comentarios) as engagement
        ");
        $engagement = $stmt->fetch()['engagement'];
        
        sendSuccess([
            'total' => $total,
            'active' => $active,
            'engagement' => $engagement
        ]);
        
    } catch (PDOException $e) {
        logError('Error en count users: ' . $e->getMessage());
        sendError('Error al contar usuarios', 500);
    }
}

// ========================================
// OBTENER USUARIO POR ID
// ========================================
if ($action === 'get' && $method === 'GET') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        sendError('ID de usuario requerido');
    }
    
    try {
        $stmt = $db->prepare("
            SELECT 
                u.*,
                COUNT(DISTINCT r.id) as total_reportes,
                COALESCE(SUM(r.likes), 0) as total_likes,
                COALESCE(SUM(r.vistas), 0) as total_vistas
            FROM usuarios u
            LEFT JOIN reportes r ON u.id = r.user_id
            WHERE u.id = ?
            GROUP BY u.id
        ");
        
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Usuario no encontrado', 404);
        }
        
        // No enviar password_hash
        unset($user['password_hash']);
        
        sendSuccess(['user' => $user]);
        
    } catch (PDOException $e) {
        logError('Error en get user: ' . $e->getMessage());
        sendError('Error al obtener usuario', 500);
    }
}

// ========================================
// BANEAR USUARIO
// ========================================
if ($action === 'ban' && $method === 'POST') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        sendError('ID de usuario requerido');
    }
    
    validateRequired($data, ['ban_reason', 'ban_duration']);
    
    $banReason = sanitizeString($data['ban_reason']);
    $banDuration = $data['ban_duration'];
    
    try {
        // Verificar que el usuario existe y no es admin
        $stmt = $db->prepare("SELECT id, tipo FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Usuario no encontrado', 404);
        }
        
        if ($user['tipo'] === 'admin') {
            sendError('No se puede banear a un administrador', 403);
        }
        
        // Banear usuario
        $stmt = $db->prepare("
            UPDATE usuarios 
            SET is_banned = TRUE,
                ban_reason = ?,
                ban_duration = ?,
                ban_date = NOW()
            WHERE id = ?
        ");
        
        $stmt->execute([$banReason, $banDuration, $id]);
        
        sendSuccess(null, 'Usuario baneado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en ban user: ' . $e->getMessage());
        sendError('Error al banear usuario', 500);
    }
}

// ========================================
// DESBANEAR USUARIO
// ========================================
if ($action === 'unban' && $method === 'POST') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        sendError('ID de usuario requerido');
    }
    
    try {
        $stmt = $db->prepare("
            UPDATE usuarios 
            SET is_banned = FALSE,
                ban_reason = NULL,
                ban_duration = NULL,
                ban_date = NULL
            WHERE id = ?
        ");
        
        $stmt->execute([$id]);
        
        sendSuccess(null, 'Usuario desbaneado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en unban user: ' . $e->getMessage());
        sendError('Error al desbanear usuario', 500);
    }
}

// ========================================
// ELIMINAR USUARIO
// ========================================
if ($action === 'delete' && $method === 'DELETE') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        sendError('ID de usuario requerido');
    }
    
    try {
        // Verificar que no sea admin
        $stmt = $db->prepare("SELECT tipo FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Usuario no encontrado', 404);
        }
        
        if ($user['tipo'] === 'admin') {
            sendError('No se puede eliminar a un administrador', 403);
        }
        
        // Eliminar usuario (CASCADE eliminará sus reportes, comentarios, etc.)
        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(null, 'Usuario eliminado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete user: ' . $e->getMessage());
        sendError('Error al eliminar usuario', 500);
    }
}

// ========================================
// CAMBIAR TIPO DE USUARIO
// ========================================
if ($action === 'change-type' && $method === 'PUT') {
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    
    if (!$id) {
        sendError('ID de usuario requerido');
    }
    
    validateRequired($data, ['new_type']);
    
    $newType = $data['new_type'];
    
    if (!in_array($newType, ['admin', 'registrado', 'anonimo'])) {
        sendError('Tipo de usuario no válido');
    }
    
    try {
        $stmt = $db->prepare("UPDATE usuarios SET tipo = ? WHERE id = ?");
        $stmt->execute([$newType, $id]);
        
        sendSuccess(null, 'Tipo de usuario actualizado');
        
    } catch (PDOException $e) {
        logError('Error en change-type: ' . $e->getMessage());
        sendError('Error al cambiar tipo de usuario', 500);
    }
}

// ========================================
// ESTADÍSTICAS DE USUARIOS
// ========================================
if ($action === 'stats' && $method === 'GET') {
    try {
        // Usuarios por tipo
        $stmt = $db->query("
            SELECT tipo, COUNT(*) as count 
            FROM usuarios 
            WHERE tipo != 'anonimo'
            GROUP BY tipo
        ");
        $byType = $stmt->fetchAll(PDO::FETCH_KEY_PAIR);
        
        // Usuarios registrados por mes (últimos 6 meses)
        $stmt = $db->query("
            SELECT 
                DATE_FORMAT(fecha_registro, '%Y-%m') as month,
                COUNT(*) as count
            FROM usuarios
            WHERE fecha_registro >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
            AND tipo != 'anonimo'
            GROUP BY DATE_FORMAT(fecha_registro, '%Y-%m')
            ORDER BY month ASC
        ");
        $byMonth = $stmt->fetchAll();
        
        // Usuarios más activos
        $stmt = $db->query("
            SELECT 
                u.id,
                u.nombre,
                u.username,
                COUNT(r.id) as total_reportes
            FROM usuarios u
            INNER JOIN reportes r ON u.id = r.user_id
            WHERE u.tipo != 'anonimo'
            GROUP BY u.id
            ORDER BY total_reportes DESC
            LIMIT 10
        ");
        $topActive = $stmt->fetchAll();
        
        sendSuccess([
            'by_type' => $byType,
            'by_month' => $byMonth,
            'top_active' => $topActive
        ]);
        
    } catch (PDOException $e) {
        logError('Error en stats: ' . $e->getMessage());
        sendError('Error al obtener estadísticas', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================
sendError('Endpoint no encontrado. Action: ' . $action, 404);
?>

