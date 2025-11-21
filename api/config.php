<?php
/**
 * SigmaForo - Configuración de Base de Datos
 * 
 * Configuración para conexión con MySQL a través de XAMPP
 */

// Prevenir acceso directo
if (!defined('SIGMAFORO_API')) {
    http_response_code(403);
    die('Acceso directo no permitido');
}

// ========================================
// CONFIGURACIÓN DE BASE DE DATOS
// ========================================

define('DB_HOST', 'localhost');
define('DB_NAME', 'sigmaforo');
define('DB_USER', 'root');
define('DB_PASS', ''); 
define('DB_CHARSET', 'utf8mb4');

// ========================================
// CONFIGURACIÓN DE LA APLICACIÓN
// ========================================

define('JWT_SECRET', 'tu_clave_secreta_super_segura_cambiala_en_produccion');
define('JWT_EXPIRATION', 86400); // 24 horas en segundos

define('UPLOAD_DIR', '../uploads/');
define('MAX_FILE_SIZE', 5242880); // 5MB en bytes
define('ALLOWED_EXTENSIONS', ['jpg', 'jpeg', 'png', 'gif']);

define('ITEMS_PER_PAGE', 10);

// ========================================
// CONFIGURACIÓN DE CORS
// ========================================

$allowed_origins = [
    'http://localhost',
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1'
];

// ========================================
// CLASE DE CONEXIÓN A BASE DE DATOS
// ========================================

class Database {
    private static $instance = null;
    private $conn;
    
    private function __construct() {
        try {
            $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
            $options = [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                PDO::ATTR_EMULATE_PREPARES => false,
                PDO::MYSQL_ATTR_INIT_COMMAND => "SET NAMES " . DB_CHARSET
            ];
            
            $this->conn = new PDO($dsn, DB_USER, DB_PASS, $options);
        } catch(PDOException $e) {
            error_log("Error de conexión: " . $e->getMessage());
            http_response_code(500);
            die(json_encode([
                'success' => false,
                'message' => 'Error de conexión a la base de datos'
            ]));
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->conn;
    }
    
    // Prevenir clonación
    private function __clone() {}
    
    // Prevenir deserialización
    public function __wakeup() {
        throw new Exception("Cannot unserialize singleton");
    }
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Configurar headers CORS
 */
function setCorsHeaders() {
    global $allowed_origins;
    
    $origin = isset($_SERVER['HTTP_ORIGIN']) ? $_SERVER['HTTP_ORIGIN'] : '';
    
    if (in_array($origin, $allowed_origins)) {
        header("Access-Control-Allow-Origin: $origin");
    }
    
    header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
    header("Access-Control-Allow-Headers: Content-Type, Authorization");
    header("Access-Control-Allow-Credentials: true");
    header("Content-Type: application/json; charset=UTF-8");
    
    // Manejar preflight request
    if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
        http_response_code(200);
        exit();
    }
}

/**
 * Respuesta JSON estándar
 */
function sendResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit();
}

/**
 * Respuesta de error
 */
function sendError($message, $statusCode = 400, $details = null) {
    $response = [
        'success' => false,
        'message' => $message
    ];
    
    if ($details !== null) {
        $response['details'] = $details;
    }
    
    sendResponse($response, $statusCode);
}

/**
 * Respuesta de éxito
 */
function sendSuccess($data = null, $message = 'Operación exitosa') {
    $response = [
        'success' => true,
        'message' => $message
    ];
    
    if ($data !== null) {
        $response['data'] = $data;
    }
    
    sendResponse($response, 200);
}

/**
 * Validar campos requeridos
 */
function validateRequired($data, $requiredFields) {
    $missing = [];
    
    foreach ($requiredFields as $field) {
        if (!isset($data[$field]) || empty(trim($data[$field]))) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        sendError('Campos requeridos faltantes: ' . implode(', ', $missing), 400);
    }
}

/**
 * Sanitizar string
 */
function sanitizeString($str) {
    return htmlspecialchars(strip_tags(trim($str)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validar email
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Hash de contraseña
 */
function hashPassword($password) {
    return password_hash($password, PASSWORD_DEFAULT);
}

/**
 * Verificar contraseña
 */
function verifyPassword($password, $hash) {
    return password_verify($password, $hash);
}

/**
 * Generar token JWT simple (para desarrollo)
 */
function generateToken($userId, $userType) {
    $header = base64_encode(json_encode(['typ' => 'JWT', 'alg' => 'HS256']));
    
    $payload = base64_encode(json_encode([
        'user_id' => $userId,
        'user_type' => $userType,
        'exp' => time() + JWT_EXPIRATION
    ]));
    
    $signature = hash_hmac('sha256', "$header.$payload", JWT_SECRET);
    
    return "$header.$payload.$signature";
}

/**
 * Verificar token JWT
 */
function verifyToken($token) {
    if (!$token) {
        return false;
    }
    
    $parts = explode('.', $token);
    if (count($parts) !== 3) {
        return false;
    }
    
    list($header, $payload, $signature) = $parts;
    
    // Verificar firma
    $validSignature = hash_hmac('sha256', "$header.$payload", JWT_SECRET);
    if ($signature !== $validSignature) {
        return false;
    }
    
    // Decodificar payload
    $data = json_decode(base64_decode($payload), true);
    
    // Verificar expiración
    if (isset($data['exp']) && $data['exp'] < time()) {
        return false;
    }
    
    return $data;
}

/**
 * Obtener token del header Authorization
 */
function getBearerToken() {
    $headers = getallheaders();
    
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s+(.*)$/i', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    
    return null;
}

/**
 * Verificar autenticación
 */
function requireAuth() {
    $token = getBearerToken();
    $user = verifyToken($token);
    
    if (!$user) {
        sendError('No autorizado', 401);
    }
    
    return $user;
}

/**
 * Verificar permisos de administrador
 */
function requireAdmin() {
    $user = requireAuth();
    
    if ($user['user_type'] !== 'admin') {
        sendError('Se requieren permisos de administrador', 403);
    }
    
    return $user;
}

/**
 * Subir archivo
 */
function uploadFile($file, $subfolder = 'reportes') {
    if (!isset($file) || $file['error'] !== UPLOAD_ERR_OK) {
        return null;
    }
    
    // Validar tamaño
    if ($file['size'] > MAX_FILE_SIZE) {
        sendError('El archivo es demasiado grande. Máximo ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB');
    }
    
    // Validar extensión
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        sendError('Tipo de archivo no permitido. Solo: ' . implode(', ', ALLOWED_EXTENSIONS));
    }
    
    // Generar nombre único
    $filename = uniqid() . '_' . time() . '.' . $extension;
    $uploadPath = UPLOAD_DIR . $subfolder . '/';
    
    // Crear directorio si no existe
    if (!file_exists($uploadPath)) {
        mkdir($uploadPath, 0755, true);
    }
    
    $fullPath = $uploadPath . $filename;
    
    // Mover archivo
    if (move_uploaded_file($file['tmp_name'], $fullPath)) {
        return $subfolder . '/' . $filename;
    }
    
    return null;
}

/**
 * Logging de errores
 */
function logError($message, $context = []) {
    $log = date('Y-m-d H:i:s') . " - " . $message;
    if (!empty($context)) {
        $log .= " - " . json_encode($context);
    }
    error_log($log . "\n", 3, __DIR__ . '/../logs/app.log');
}

/**
 * Calcular distancia entre dos coordenadas (en km)
 */
function calculateDistance($lat1, $lon1, $lat2, $lon2) {
    $earthRadius = 6371; // km
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    
    return $earthRadius * $c;
}

// ========================================
// INICIALIZACIÓN
// ========================================

// Configurar zona horaria
date_default_timezone_set('America/Lima');

// Configurar reporte de errores (solo para desarrollo)
if ($_SERVER['SERVER_NAME'] === 'localhost') {
    ini_set('display_errors', 1);
    ini_set('display_startup_errors', 1);
    error_reporting(E_ALL);
} else {
    ini_set('display_errors', 0);
    error_reporting(0);
}

// Crear directorio de logs si no existe
if (!file_exists(__DIR__ . '/../logs')) {
    mkdir(__DIR__ . '/../logs', 0755, true);
}

// Crear directorio de uploads si no existe
if (!file_exists(UPLOAD_DIR)) {
    mkdir(UPLOAD_DIR, 0755, true);
}

function extractHashtags($text) {
    preg_match_all('/#([a-zA-Z0-9_áéíóúñÁÉÍÓÚÑ]+)/u', $text, $matches);
    
    if (empty($matches[1])) {
        return [];
    }
    
    $hashtags = array_unique($matches[1]);
    
    $hashtags = array_map(function($tag) {
        $tag = mb_strtolower($tag, 'UTF-8');
        return mb_substr($tag, 0, 50);
    }, $hashtags);
    
    $hashtags = array_filter($hashtags, function($tag) {
        return mb_strlen($tag) >= 3;
    });
    
    return array_values($hashtags);
}