<?php
/**
 * SigmaForo - API de Subida de Archivos
 * 
 * Endpoint para subir imágenes de reportes y avatares
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ========================================
// SUBIR IMAGEN DE REPORTE
// ========================================

if ($action === 'image' && $method === 'POST') {
    $user = requireAuth();
    
    // Verificar que se envió un archivo
    if (!isset($_FILES['image']) || $_FILES['image']['error'] === UPLOAD_ERR_NO_FILE) {
        sendError('No se proporcionó ninguna imagen');
    }
    
    $file = $_FILES['image'];
    
    // Validar que no hay error en la subida
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido por el servidor',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo permitido',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo',
            UPLOAD_ERR_EXTENSION => 'Subida detenida por extensión'
        ];
        
        $message = isset($errorMessages[$file['error']]) 
            ? $errorMessages[$file['error']] 
            : 'Error desconocido al subir archivo';
            
        sendError($message);
    }
    
    // Validar tamaño
    if ($file['size'] > MAX_FILE_SIZE) {
        sendError('El archivo es demasiado grande. Máximo ' . (MAX_FILE_SIZE / 1024 / 1024) . 'MB');
    }
    
    // Validar tipo de archivo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($mimeType, $allowedMimes)) {
        sendError('Tipo de archivo no permitido. Solo se permiten imágenes JPG, PNG y GIF');
    }
    
    // Validar extensión
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ALLOWED_EXTENSIONS)) {
        sendError('Extensión de archivo no permitida. Solo: ' . implode(', ', ALLOWED_EXTENSIONS));
    }
    
    try {
        // Generar nombre único
        $filename = uniqid('report_', true) . '_' . time() . '.' . $extension;
        $uploadPath = UPLOAD_DIR . 'reportes/';
        
        // Crear directorio si no existe
        if (!file_exists($uploadPath)) {
            if (!mkdir($uploadPath, 0755, true)) {
                sendError('Error al crear directorio de subida');
            }
        }
        
        $fullPath = $uploadPath . $filename;
        
        // Mover archivo
        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            sendError('Error al guardar el archivo');
        }
        
        // Optimizar imagen (opcional - requiere GD)
        if (function_exists('imagecreatefromjpeg')) {
            optimizeImage($fullPath, $extension);
        }
        
        // URL relativa para la base de datos
        $imageUrl = 'uploads/reportes/' . $filename;
        
        // Registrar en base de datos (opcional)
        $stmt = $db->prepare("
            INSERT INTO archivos_subidos (user_id, nombre_original, nombre_guardado, ruta, tipo, tamanio)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['user_id'],
            $file['name'],
            $filename,
            $imageUrl,
            'imagen_reporte',
            $file['size']
        ]);
        
        $fileId = $db->lastInsertId();
        
        sendSuccess([
            'file_id' => $fileId,
            'url' => $imageUrl,
            'filename' => $filename,
            'size' => $file['size']
        ], 'Imagen subida exitosamente');
        
    } catch (Exception $e) {
        logError('Error al subir imagen: ' . $e->getMessage());
        sendError('Error al procesar la imagen', 500);
    }
}

// ========================================
// SUBIR AVATAR
// ========================================

if ($action === 'avatar' && $method === 'POST') {
    $user = requireAuth();
    
    // Usuarios anónimos no pueden subir avatar
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden subir avatar', 403);
    }
    
    if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] === UPLOAD_ERR_NO_FILE) {
        sendError('No se proporcionó ninguna imagen');
    }
    
    $file = $_FILES['avatar'];
    
    if ($file['error'] !== UPLOAD_ERR_OK) {
        sendError('Error al subir archivo');
    }
    
    // Validar tamaño (avatares más pequeños: 2MB)
    if ($file['size'] > 2097152) {
        sendError('El avatar es demasiado grande. Máximo 2MB');
    }
    
    // Validar tipo
    $finfo = finfo_open(FILEINFO_MIME_TYPE);
    $mimeType = finfo_file($finfo, $file['tmp_name']);
    finfo_close($finfo);
    
    $allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
    if (!in_array($mimeType, $allowedMimes)) {
        sendError('Tipo de archivo no permitido');
    }
    
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    
    try {
        // Eliminar avatar anterior si existe
        $stmt = $db->prepare("SELECT avatar_url FROM usuarios WHERE id = ?");
        $stmt->execute([$user['user_id']]);
        $userData = $stmt->fetch();
        
        if ($userData && $userData['avatar_url']) {
            $oldPath = '../' . $userData['avatar_url'];
            if (file_exists($oldPath)) {
                unlink($oldPath);
            }
        }
        
        // Subir nuevo avatar
        $filename = 'avatar_' . $user['user_id'] . '_' . time() . '.' . $extension;
        $uploadPath = UPLOAD_DIR . 'avatares/';
        
        if (!file_exists($uploadPath)) {
            mkdir($uploadPath, 0755, true);
        }
        
        $fullPath = $uploadPath . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $fullPath)) {
            sendError('Error al guardar el avatar');
        }
        
        // Redimensionar avatar a 200x200
        if (function_exists('imagecreatefromjpeg')) {
            resizeAvatar($fullPath, $extension, 200, 200);
        }
        
        $avatarUrl = 'uploads/avatares/' . $filename;
        
        // Actualizar en base de datos
        $stmt = $db->prepare("UPDATE usuarios SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$avatarUrl, $user['user_id']]);
        
        sendSuccess([
            'url' => $avatarUrl,
            'filename' => $filename
        ], 'Avatar actualizado exitosamente');
        
    } catch (Exception $e) {
        logError('Error al subir avatar: ' . $e->getMessage());
        sendError('Error al procesar el avatar', 500);
    }
}

// ========================================
// ELIMINAR ARCHIVO
// ========================================

if ($action === 'delete' && $method === 'DELETE') {
    $user = requireAuth();
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (!isset($data['file_id'])) {
        sendError('ID de archivo requerido');
    }
    
    $fileId = intval($data['file_id']);
    
    try {
        // Verificar que el archivo pertenece al usuario o es admin
        $stmt = $db->prepare("SELECT user_id, ruta FROM archivos_subidos WHERE id = ?");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();
        
        if (!$file) {
            sendError('Archivo no encontrado', 404);
        }
        
        if ($file['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para eliminar este archivo', 403);
        }
        
        // Eliminar archivo físico
        $filePath = '../' . $file['ruta'];
        if (file_exists($filePath)) {
            unlink($filePath);
        }
        
        // Eliminar de base de datos
        $stmt = $db->prepare("DELETE FROM archivos_subidos WHERE id = ?");
        $stmt->execute([$fileId]);
        
        sendSuccess(null, 'Archivo eliminado exitosamente');
        
    } catch (Exception $e) {
        logError('Error al eliminar archivo: ' . $e->getMessage());
        sendError('Error al eliminar archivo', 500);
    }
}

// ========================================
// FUNCIONES DE UTILIDAD
// ========================================

/**
 * Optimizar imagen (reducir calidad para web)
 */
function optimizeImage($filepath, $extension) {
    $quality = 85; // 85% de calidad
    
    try {
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                $image = imagecreatefromjpeg($filepath);
                imagejpeg($image, $filepath, $quality);
                imagedestroy($image);
                break;
                
            case 'png':
                $image = imagecreatefrompng($filepath);
                // PNG: 0 (sin compresión) a 9 (máxima compresión)
                imagepng($image, $filepath, 6);
                imagedestroy($image);
                break;
                
            case 'gif':
                // GIF no necesita optimización de calidad
                break;
        }
    } catch (Exception $e) {
        logError('Error al optimizar imagen: ' . $e->getMessage());
    }
}

/**
 * Redimensionar avatar a dimensiones específicas
 */
function resizeAvatar($filepath, $extension, $width, $height) {
    try {
        // Obtener dimensiones originales
        list($origWidth, $origHeight) = getimagesize($filepath);
        
        // Crear imagen según extensión
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                $source = imagecreatefromjpeg($filepath);
                break;
            case 'png':
                $source = imagecreatefrompng($filepath);
                break;
            case 'gif':
                $source = imagecreatefromgif($filepath);
                break;
            default:
                return;
        }
        
        // Crear imagen redimensionada
        $thumb = imagecreatetruecolor($width, $height);
        
        // Preservar transparencia para PNG y GIF
        if ($extension === 'png' || $extension === 'gif') {
            imagealphablending($thumb, false);
            imagesavealpha($thumb, true);
            $transparent = imagecolorallocatealpha($thumb, 255, 255, 255, 127);
            imagefilledrectangle($thumb, 0, 0, $width, $height, $transparent);
        }
        
        // Redimensionar
        imagecopyresampled($thumb, $source, 0, 0, 0, 0, $width, $height, $origWidth, $origHeight);
        
        // Guardar según extensión
        switch ($extension) {
            case 'jpg':
            case 'jpeg':
                imagejpeg($thumb, $filepath, 90);
                break;
            case 'png':
                imagepng($thumb, $filepath, 6);
                break;
            case 'gif':
                imagegif($thumb, $filepath);
                break;
        }
        
        imagedestroy($source);
        imagedestroy($thumb);
        
    } catch (Exception $e) {
        logError('Error al redimensionar imagen: ' . $e->getMessage());
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
