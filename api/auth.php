<?php
/**
 * SigmaForo - API de Autenticación
 * Endpoints para registro, login, gestión de usuarios y PERFIL
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// =================================================================
// 1. CAPTURA DE DATOS INTELIGENTE (JSON + URL)
// =================================================================
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? []; 
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// REGISTRO DE USUARIO
// ========================================
if ($action === 'register' && $method === 'POST') {
    validateRequired($data, ['name', 'email', 'password']);
    
    $name = sanitizeString($data['name']);
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : '';
    
    if (!validateEmail($email)) sendError('Email no válido');
    if (!empty($confirmPassword) && $password !== $confirmPassword) sendError('Las contraseñas no coinciden');
    if (strlen($password) < 6) sendError('La contraseña debe tener al menos 6 caracteres');
    
    try {
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        if ($stmt->rowCount() > 0) sendError('El email ya está registrado', 409);
        
        $username = strtolower(str_replace(' ', '_', $name)) . '_' . substr(uniqid(), -4);
        $passwordHash = hashPassword($password);
        
        $stmt = $db->prepare("INSERT INTO usuarios (nombre, username, email, password_hash, tipo) VALUES (?, ?, ?, ?, 'registrado')");
        $stmt->execute([$name, $username, $email, $passwordHash]);
        $userId = $db->lastInsertId();
        
        try {
            $stmt = $db->prepare("INSERT INTO configuracion_usuario (user_id) VALUES (?)");
            $stmt->execute([$userId]);
        } catch (PDOException $e) {}
        
        $token = generateToken($userId, 'registrado');
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'type' => 'registrado',
                'avatar_url' => null
            ],
            'token' => $token
        ], 'Usuario registrado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en registro: ' . $e->getMessage());
        sendError('Error al registrar usuario', 500);
    }
}

// ========================================
// LOGIN DE USUARIO
// ========================================
if ($action === 'login' && $method === 'POST') {
    validateRequired($data, ['email', 'password']);
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    
    try {
        $stmt = $db->prepare("SELECT id, nombre, username, email, password_hash, tipo, is_banned, avatar_url FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) sendError('Credenciales incorrectas', 401);
        if ($user['is_banned']) sendError('Tu cuenta ha sido suspendida', 403);
        if (!verifyPassword($password, $user['password_hash'])) sendError('Credenciales incorrectas', 401);
        
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $token = generateToken($user['id'], $user['tipo']);
        
        sendSuccess([
            'user' => [
                'id' => $user['id'],
                'name' => $user['nombre'],
                'username' => $user['username'],
                'email' => $user['email'],
                'type' => $user['tipo'],
                'avatar_url' => $user['avatar_url']
            ],
            'token' => $token
        ], 'Login exitoso');
        
    } catch (PDOException $e) {
        logError('Error en login: ' . $e->getMessage());
        sendError('Error al iniciar sesión', 500);
    }
}

// ========================================
// LOGIN ADMINISTRADOR
// ========================================
if ($action === 'admin-login' && $method === 'POST') {
    validateRequired($data, ['email', 'password', 'code2fa']);
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    $code2fa = $data['code2fa'];
    
    if ($code2fa !== '123456') sendError('Código 2FA incorrecto', 401);
    
    try {
        $stmt = $db->prepare("SELECT id, nombre, username, email, password_hash, tipo, avatar_url FROM usuarios WHERE email = ? AND tipo = 'admin'");
        $stmt->execute([$email]);
        $user = $stmt->fetch();
        
        if (!$user) sendError('Credenciales incorrectas', 401);
        if (!verifyPassword($password, $user['password_hash'])) sendError('Credenciales incorrectas', 401);
        
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $token = generateToken($user['id'], 'admin');
        
        sendSuccess([
            'user' => [
                'id' => $user['id'],
                'name' => $user['nombre'],
                'username' => $user['username'],
                'email' => $user['email'],
                'type' => 'admin',
                'avatar_url' => $user['avatar_url']
            ],
            'token' => $token
        ], 'Acceso administrativo concedido');
        
    } catch (PDOException $e) {
        logError('Error en admin-login: ' . $e->getMessage());
        sendError('Error al iniciar sesión', 500);
    }
}

// ========================================
// LOGIN ANÓNIMO
// ========================================
if ($action === 'anonymous' && $method === 'POST') {
    try {
        $username = 'anonimo_' . uniqid();
        $name = 'Usuario Anónimo';
        $stmt = $db->prepare("INSERT INTO usuarios (nombre, username, tipo) VALUES (?, ?, 'anonimo')");
        $stmt->execute([$name, $username]);
        $userId = $db->lastInsertId();
        $token = generateToken($userId, 'anonimo');
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'name' => $name,
                'username' => $username,
                'email' => null,
                'type' => 'anonimo',
                'avatar_url' => null
            ],
            'token' => $token
        ], 'Acceso anónimo concedido');
    } catch (PDOException $e) {
        logError('Error en login anónimo: ' . $e->getMessage());
        sendError('Error al crear sesión anónima', 500);
    }
}

// ========================================
// VERIFICAR TOKEN
// ========================================
if ($action === 'verify' && $method === 'GET') {
    $user = requireAuth();
    try {
        $stmt = $db->prepare("SELECT id, nombre, username, email, tipo, is_banned, avatar_url FROM usuarios WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();
        
        if (!$userData) sendError('Usuario no encontrado', 404);
        if ($userData['is_banned']) sendError('Tu cuenta ha sido suspendida', 403);
        
        sendSuccess([
            'user' => [
                'id' => $userData['id'],
                'name' => $userData['nombre'],
                'username' => $userData['username'],
                'email' => $userData['email'],
                'type' => $userData['tipo'],
                'avatar_url' => $userData['avatar_url']
            ]
        ]);
    } catch (PDOException $e) {
        logError('Error en verify: ' . $e->getMessage());
        sendError('Error al verificar token', 500);
    }
}

// ========================================
// OBTENER PERFIL (¡RESTAURADO!)
// ========================================
if ($action === 'profile' && $method === 'GET') {
    $user = requireAuth();
    
    try {
        // Nota: Incluimos u.* que ya trae avatar_url
        $stmt = $db->prepare("
            SELECT 
                u.*,
                (SELECT COUNT(*) FROM reportes WHERE user_id = u.id) as total_reportes,
                (SELECT COALESCE(SUM(likes), 0) FROM reportes WHERE user_id = u.id) as total_likes,
                (SELECT COALESCE(SUM(vistas), 0) FROM reportes WHERE user_id = u.id) as total_vistas
            FROM usuarios u
            WHERE u.id = ?
        ");
        $stmt->execute([$user['user_id']]);
        
        $profile = $stmt->fetch();
        
        if (!$profile) {
            sendError('Usuario no encontrado', 404);
        }
        
        // No enviar datos sensibles
        unset($profile['password_hash']);
        
        sendSuccess(['profile' => $profile]);
        
    } catch (PDOException $e) {
        logError('Error en profile: ' . $e->getMessage());
        sendError('Error al obtener perfil', 500);
    }
}

// ========================================
// ACTUALIZAR PERFIL (¡RESTAURADO!)
// ========================================
if ($action === 'profile' && $method === 'PUT') {
    $user = requireAuth();
    // Usamos $data global
    
    try {
        $updates = [];
        $params = [];
        
        if (isset($data['name'])) {
            $updates[] = "nombre = ?";
            $params[] = sanitizeString($data['name']);
        }
        
        if (isset($data['ubicacion'])) {
            $updates[] = "ubicacion = ?";
            $params[] = sanitizeString($data['ubicacion']);
        }
        
        if (isset($data['biografia'])) {
            $updates[] = "biografia = ?";
            $params[] = sanitizeString($data['biografia']);
        }
        
        if (empty($updates)) {
            sendError('No hay campos para actualizar');
        }
        
        $params[] = $user['user_id'];
        
        $sql = "UPDATE usuarios SET " . implode(', ', $updates) . " WHERE id = ?";
        $stmt = $db->prepare($sql);
        $stmt->execute($params);
        
        sendSuccess(null, 'Perfil actualizado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en update profile: ' . $e->getMessage());
        sendError('Error al actualizar perfil', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================
sendError('Endpoint no encontrado. Action received: ' . $action, 404);
?>