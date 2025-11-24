<?php
/**
 * SigmaForo - API de Autenticación
 * Endpoints para registro, login y gestión de usuarios
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];

// =================================================================
// 1. CAPTURA DE DATOS INTELIGENTE (JSON + URL)
// =================================================================

// Leemos el cuerpo JSON una sola vez al principio
$inputJSON = file_get_contents('php://input');
$data = json_decode($inputJSON, true) ?? []; 

// Buscamos la 'action' en la URL ($_GET) O dentro del JSON ($data)
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// REGISTRO DE USUARIO
// ========================================

if ($action === 'register' && $method === 'POST') {
    // Ya tenemos $data leído arriba
    
    validateRequired($data, ['name', 'email', 'password']);
    
    $name = sanitizeString($data['name']);
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : '';
    
    if (!validateEmail($email)) {
        sendError('Email no válido');
    }
    
    if (!empty($confirmPassword) && $password !== $confirmPassword) {
        sendError('Las contraseñas no coinciden');
    }
    
    if (strlen($password) < 6) {
        sendError('La contraseña debe tener al menos 6 caracteres');
    }
    
    try {
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            sendError('El email ya está registrado', 409);
        }
        
        $username = strtolower(str_replace(' ', '_', $name)) . '_' . substr(uniqid(), -4);
        $passwordHash = hashPassword($password);
        
        $stmt = $db->prepare("
            INSERT INTO usuarios (nombre, username, email, password_hash, tipo) 
            VALUES (?, ?, ?, ?, 'registrado')
        ");
        $stmt->execute([$name, $username, $email, $passwordHash]);
        
        $userId = $db->lastInsertId();
        
        try {
            $stmt = $db->prepare("INSERT INTO configuracion_usuario (user_id) VALUES (?)");
            $stmt->execute([$userId]);
        } catch (PDOException $e) {
            // Ignoramos error si no existe tabla config
        }
        
        $token = generateToken($userId, 'registrado');
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'type' => 'registrado',
                'avatar_url' => null // Usuario nuevo no tiene avatar
            ],
            'token' => $token
        ], 'Usuario registrado exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en registro: ' . $e->getMessage());
        sendError('Error al registrar usuario: ' . $e->getMessage(), 500);
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
        // MODIFICADO: Se agregó 'avatar_url' al SELECT
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, password_hash, tipo, is_banned, avatar_url 
            FROM usuarios 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Credenciales incorrectas', 401);
        }
        
        if ($user['is_banned']) {
            sendError('Tu cuenta ha sido suspendida', 403);
        }
        
        if (!verifyPassword($password, $user['password_hash'])) {
            sendError('Credenciales incorrectas', 401);
        }
        
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $token = generateToken($user['id'], $user['tipo']);
        
        // MODIFICADO: Se agregó 'avatar_url' a la respuesta
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
// LOGIN ADMINISTRADOR (con 2FA simulado)
// ========================================

if ($action === 'admin-login' && $method === 'POST') {
    validateRequired($data, ['email', 'password', 'code2fa']);
    
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    $code2fa = $data['code2fa'];
    
    if ($code2fa !== '123456') {
        sendError('Código 2FA incorrecto', 401);
    }
    
    try {
        // MODIFICADO: Se agregó 'avatar_url' al SELECT
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, password_hash, tipo, avatar_url 
            FROM usuarios 
            WHERE email = ? AND tipo = 'admin'
        ");
        $stmt->execute([$email]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Credenciales incorrectas o no eres administrador', 401);
        }
        
        if (!verifyPassword($password, $user['password_hash'])) {
            sendError('Credenciales incorrectas', 401);
        }
        
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        $token = generateToken($user['id'], 'admin');
        
        // MODIFICADO: Se agregó 'avatar_url' a la respuesta
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
        
        $stmt = $db->prepare("
            INSERT INTO usuarios (nombre, username, tipo) 
            VALUES (?, ?, 'anonimo')
        ");
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
        // MODIFICADO: Se agregó 'avatar_url' al SELECT
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, tipo, is_banned, avatar_url 
            FROM usuarios 
            WHERE id = ?
        ");
        $stmt->execute([$user['user_id']]);
        
        $userData = $stmt->fetch();
        
        if (!$userData) {
            sendError('Usuario no encontrado', 404);
        }
        
        if ($userData['is_banned']) {
            sendError('Tu cuenta ha sido suspendida', 403);
        }
        
        // MODIFICADO: Se agregó 'avatar_url' a la respuesta
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
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado. Action received: ' . $action, 404);
?>