<?php
/**
 * SigmaForo - API de Autenticación
 * * Endpoints para registro, login y gestión de usuarios
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
$data = json_decode($inputJSON, true) ?? []; // Si no hay JSON, array vacío

// Buscamos la 'action' en la URL ($_GET) O dentro del JSON ($data)
$action = $_GET['action'] ?? ($data['action'] ?? '');

// ========================================
// REGISTRO DE USUARIO
// ========================================

if ($action === 'register' && $method === 'POST') {
    // Ya tenemos $data leído arriba, no necesitamos leerlo de nuevo
    
    // Validar campos requeridos
    validateRequired($data, ['name', 'email', 'password']);
    
    $name = sanitizeString($data['name']);
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    $confirmPassword = isset($data['confirmPassword']) ? $data['confirmPassword'] : ''; // Opcional
    
    // Validar email
    if (!validateEmail($email)) {
        sendError('Email no válido');
    }
    
    // (Opcional) Validar contraseñas coincidan si envían confirmación
    if (!empty($confirmPassword) && $password !== $confirmPassword) {
        sendError('Las contraseñas no coinciden');
    }
    
    // Validar longitud de contraseña
    if (strlen($password) < 6) {
        sendError('La contraseña debe tener al menos 6 caracteres');
    }
    
    try {
        // Verificar si el email ya existe
        $stmt = $db->prepare("SELECT id FROM usuarios WHERE email = ?");
        $stmt->execute([$email]);
        
        if ($stmt->rowCount() > 0) {
            sendError('El email ya está registrado', 409);
        }
        
        // Generar username único
        $username = strtolower(str_replace(' ', '_', $name)) . '_' . substr(uniqid(), -4);
        
        // Hash de contraseña
        $passwordHash = hashPassword($password);
        
        // Insertar usuario
        $stmt = $db->prepare("
            INSERT INTO usuarios (nombre, username, email, password_hash, tipo) 
            VALUES (?, ?, ?, ?, 'registrado')
        ");
        $stmt->execute([$name, $username, $email, $passwordHash]);
        
        $userId = $db->lastInsertId();
        
        // Crear configuración por defecto (si la tabla existe)
        try {
            $stmt = $db->prepare("INSERT INTO configuracion_usuario (user_id) VALUES (?)");
            $stmt->execute([$userId]);
        } catch (PDOException $e) {
            // Ignoramos error si no existe tabla config, para no bloquear registro
        }
        
        // Generar token
        $token = generateToken($userId, 'registrado');
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'name' => $name,
                'username' => $username,
                'email' => $email,
                'type' => 'registrado'
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
    // Usamos $data que leímos arriba
    
    validateRequired($data, ['email', 'password']);
    
    $email = sanitizeString($data['email']);
    $password = $data['password'];
    
    try {
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, password_hash, tipo, is_banned 
            FROM usuarios 
            WHERE email = ?
        ");
        $stmt->execute([$email]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Credenciales incorrectas', 401);
        }
        
        // Verificar si está baneado
        if ($user['is_banned']) {
            sendError('Tu cuenta ha sido suspendida', 403);
        }
        
        // Verificar contraseña
        if (!verifyPassword($password, $user['password_hash'])) {
            sendError('Credenciales incorrectas', 401);
        }
        
        // Actualizar último acceso
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Generar token
        $token = generateToken($user['id'], $user['tipo']);
        
        sendSuccess([
            'user' => [
                'id' => $user['id'],
                'name' => $user['nombre'],
                'username' => $user['username'],
                'email' => $user['email'],
                'type' => $user['tipo']
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
    
    // Verificar código 2FA (simulado)
    if ($code2fa !== '123456') {
        sendError('Código 2FA incorrecto', 401);
    }
    
    try {
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, password_hash, tipo 
            FROM usuarios 
            WHERE email = ? AND tipo = 'admin'
        ");
        $stmt->execute([$email]);
        
        $user = $stmt->fetch();
        
        if (!$user) {
            sendError('Credenciales incorrectas o no eres administrador', 401);
        }
        
        // Verificar contraseña
        if (!verifyPassword($password, $user['password_hash'])) {
            sendError('Credenciales incorrectas', 401);
        }
        
        // Actualizar último acceso
        $stmt = $db->prepare("UPDATE usuarios SET ultimo_acceso = NOW() WHERE id = ?");
        $stmt->execute([$user['id']]);
        
        // Generar token
        $token = generateToken($user['id'], 'admin');
        
        sendSuccess([
            'user' => [
                'id' => $user['id'],
                'name' => $user['nombre'],
                'username' => $user['username'],
                'email' => $user['email'],
                'type' => 'admin'
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
        // Crear usuario anónimo temporal
        $username = 'anonimo_' . uniqid();
        $name = 'Usuario Anónimo';
        
        $stmt = $db->prepare("
            INSERT INTO usuarios (nombre, username, tipo) 
            VALUES (?, ?, 'anonimo')
        ");
        $stmt->execute([$name, $username]);
        
        $userId = $db->lastInsertId();
        
        // Generar token
        $token = generateToken($userId, 'anonimo');
        
        sendSuccess([
            'user' => [
                'id' => $userId,
                'name' => $name,
                'username' => $username,
                'email' => null,
                'type' => 'anonimo'
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
        $stmt = $db->prepare("
            SELECT id, nombre, username, email, tipo, is_banned 
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
        
        sendSuccess([
            'user' => [
                'id' => $userData['id'],
                'name' => $userData['nombre'],
                'username' => $userData['username'],
                'email' => $userData['email'],
                'type' => $userData['tipo']
            ]
        ]);
        
    } catch (PDOException $e) {
        logError('Error en verify: ' . $e->getMessage());
        sendError('Error al verificar token', 500);
    }
}

// ========================================
// OBTENER PERFIL
// ========================================

if ($action === 'profile' && $method === 'GET') {
    $user = requireAuth();
    
    try {
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
// ACTUALIZAR PERFIL
// ========================================

if ($action === 'profile' && $method === 'PUT') {
    $user = requireAuth();
    // Ya tenemos $data leído del input JSON
    
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
// Si ninguna acción coincidió, enviamos error y devolvemos qué acción recibimos para depurar
sendError('Endpoint no encontrado. Action recibida: ' . $action, 404);
?>