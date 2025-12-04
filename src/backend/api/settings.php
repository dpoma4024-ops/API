<?php
/**
 * SigmaForo - API de Configuración de Usuario
 */

define('SIGMAFORO_API', true);
require_once __DIR__ . '/../config/config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? [];

$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// OBTENER CONFIGURACIÓN
// ========================================

if ($action === 'get' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no tienen configuración', 403);
    }
    
    try {
        $stmt = $db->prepare("
            SELECT * FROM configuracion_usuario WHERE user_id = ?
        ");
        $stmt->execute([$user['user_id']]);
        $settings = $stmt->fetch();
        
        if (!$settings) {
            // Crear configuración por defecto
            $stmt = $db->prepare("
                INSERT INTO configuracion_usuario (user_id) VALUES (?)
            ");
            $stmt->execute([$user['user_id']]);
            
            $stmt = $db->prepare("
                SELECT * FROM configuracion_usuario WHERE user_id = ?
            ");
            $stmt->execute([$user['user_id']]);
            $settings = $stmt->fetch();
        }
        
        sendSuccess(['settings' => $settings]);
        
    } catch (PDOException $e) {
        logError('Error en get settings: ' . $e->getMessage());
        sendError('Error al obtener configuración', 500);
    }
}

// ========================================
// ACTUALIZAR CONFIGURACIÓN
// ========================================

if ($action === 'update' && $method === 'PUT') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden guardar configuración', 403);
    }
    
    try {
        $updates = [];
        $params = [];
        
        $validFields = [
            'notif_nearby', 'notif_updates', 'notif_followed', 'notif_replies',
            'public_profile', 'show_location', 'anonymous_reports'
        ];
        
        foreach ($validFields as $field) {
            if (isset($data[$field])) {
                $updates[] = "$field = ?";
                $params[] = $data[$field] ? 1 : 0;
            }
        }
        
        if (empty($updates)) {
            sendError('No hay campos para actualizar');
        }
        
        $params[] = $user['user_id'];
        
        $sql = "UPDATE configuracion_usuario SET " . implode(', ', $updates) . " WHERE user_id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        sendSuccess(null, 'Configuración actualizada exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en update settings: ' . $e->getMessage());
        sendError('Error al actualizar configuración', 500);
    }
}

// ========================================
// CAMBIAR CONTRASEÑA
// ========================================

if ($action === 'change-password' && $method === 'PUT') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden cambiar contraseña', 403);
    }
    
    validateRequired($data, ['current_password', 'new_password']);
    
    $currentPassword = $data['current_password'];
    $newPassword = $data['new_password'];
    
    if (strlen($newPassword) < 6) {
        sendError('La contraseña debe tener al menos 6 caracteres');
    }
    
    try {
        // Verificar contraseña actual
        $stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();
        
        if (!verifyPassword($currentPassword, $userData['password_hash'])) {
            sendError('Contraseña actual incorrecta', 401);
        }
        
        // Actualizar contraseña
        $newPasswordHash = hashPassword($newPassword);
        $stmt = $db->prepare("UPDATE usuarios SET password_hash = ? WHERE id = ?");
        $stmt->execute([$newPasswordHash, $user['user_id']]);
        
        sendSuccess(null, 'Contraseña cambiada exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en change-password: ' . $e->getMessage());
        sendError('Error al cambiar contraseña', 500);
    }
}

// ========================================
// CAMBIAR EMAIL
// ========================================

if ($action === 'change-email' && $method === 'PUT') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden cambiar email', 403);
    }
    
    validateRequired($data, ['new_email', 'password']);
    
    $newEmail = sanitizeString($data['new_email']);
    $password = $data['password'];
    
    if (!validateEmail($newEmail)) {
        sendError('Email no válido');
    }
    
    try {
        // Verificar contraseña
        $stmt = $db->prepare("SELECT password_hash FROM usuarios WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();
        
        if (!verifyPassword($password, $userData['password_hash'])) {
            sendError('Contraseña incorrecta', 401);
        }
        
        // Verificar que el email no esté en uso
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ? AND id != ?");
        $stmt->execute([$newEmail, $user['user_id']]);
        if ($stmt->rowCount() > 0) {
            sendError('El email ya está en uso', 409);
        }
        
        // Actualizar email
        $stmt = $db->prepare("UPDATE usuarios SET email = ? WHERE id = ?");
        $stmt->execute([$newEmail, $user['user_id']]);
        
        sendSuccess(['new_email' => $newEmail], 'Email cambiado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en change-email: ' . $e->getMessage());
        sendError('Error al cambiar email', 500);
    }
}

// ========================================
// ELIMINAR CUENTA
// ========================================

if ($action === 'delete-account' && $method === 'DELETE') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden eliminar cuenta', 403);
    }
    
    try {
        // Eliminar usuario (CASCADE eliminará reportes, comentarios, etc.)
        $stmt = $db->prepare("DELETE FROM usuarios WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        
        sendSuccess(null, 'Cuenta eliminada exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete-account: ' . $e->getMessage());
        sendError('Error al eliminar cuenta', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado. Action: ' . $action, 404);
?>
