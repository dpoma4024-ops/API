<?php
/**
 * SigmaForo - API de Subida de Archivos
 * Versión Cloudinary (Persistente)
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
    
    // Validar errores nativos de PHP
    if ($file['error'] !== UPLOAD_ERR_OK) {
        $errorMessages = [
            UPLOAD_ERR_INI_SIZE => 'El archivo excede el tamaño máximo permitido por el servidor',
            UPLOAD_ERR_FORM_SIZE => 'El archivo excede el tamaño máximo permitido',
            UPLOAD_ERR_PARTIAL => 'El archivo se subió parcialmente',
            UPLOAD_ERR_NO_TMP_DIR => 'Falta carpeta temporal',
            UPLOAD_ERR_CANT_WRITE => 'Error al escribir el archivo',
            UPLOAD_ERR_EXTENSION => 'Subida detenida por extensión'
        ];
        $message = isset($errorMessages[$file['error']]) ? $errorMessages[$file['error']] : 'Error desconocido';
        sendError($message);
    }
    
    // Validar tamaño (La función uploadFile también lo hace, pero doble check no daña)
    if ($file['size'] > MAX_FILE_SIZE) {
        sendError('El archivo es demasiado grande. Máximo 5MB');
    }
    
    try {
        // --- CAMBIO CLAVE: Enviar a Cloudinary en lugar de disco local ---
        // La función uploadFile (en config.php) se encarga de la magia
        $secureUrl = uploadFile($file, 'reportes');

        if (!$secureUrl) {
            sendError('Error al subir la imagen a la nube');
        }
        
        // Generamos un nombre lógico para guardar en la BD
        $filename = basename($secureUrl); 
        
        // Registrar en base de datos (Tu lógica original)
        $stmt = $db->prepare("
            INSERT INTO archivos_subidos (user_id, nombre_original, nombre_guardado, ruta, tipo, tamanio)
            VALUES (?, ?, ?, ?, ?, ?)
        ");
        $stmt->execute([
            $user['user_id'],
            $file['name'],
            $filename,
            $secureUrl, // Guardamos la URL completa de Cloudinary
            'imagen_reporte',
            $file['size']
        ]);
        
        $fileId = $db->lastInsertId();
        
        sendSuccess([
            'file_id' => $fileId,
            'url' => $secureUrl, // Retornamos la URL de la nube
            'filename' => $filename,
            'size' => $file['size']
        ], 'Imagen subida exitosamente a la nube');
        
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
    
    try {
        // --- CAMBIO CLAVE: Subir a Cloudinary ---
        $secureUrl = uploadFile($file, 'avatars');

        if (!$secureUrl) {
            sendError('Error al guardar el avatar en la nube');
        }
        
        // Actualizar en base de datos
        // Nota: Ya no necesitamos borrar el archivo local antiguo (unlink) porque no existe.
        $stmt = $db->prepare("UPDATE usuarios SET avatar_url = ? WHERE id = ?");
        $stmt->execute([$secureUrl, $user['user_id']]);
        
        sendSuccess([
            'url' => $secureUrl,
            'filename' => basename($secureUrl)
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
        // Verificar permisos
        $stmt = $db->prepare("SELECT user_id, ruta FROM archivos_subidos WHERE id = ?");
        $stmt->execute([$fileId]);
        $file = $stmt->fetch();
        
        if (!$file) {
            sendError('Archivo no encontrado', 404);
        }
        
        if ($file['user_id'] != $user['user_id'] && $user['user_type'] !== 'admin') {
            sendError('No tienes permiso para eliminar este archivo', 403);
        }
        
        // NOTA: Para eliminar de Cloudinary se requiere una API distinta (Admin API).
        // Por ahora, solo eliminamos el registro de la base de datos.
        // La imagen quedará "huérfana" en Cloudinary, lo cual es seguro.
        
        $stmt = $db->prepare("DELETE FROM archivos_subidos WHERE id = ?");
        $stmt->execute([$fileId]);
        
        sendSuccess(null, 'Archivo eliminado exitosamente');
        
    } catch (Exception $e) {
        logError('Error al eliminar archivo: ' . $e->getMessage());
        sendError('Error al eliminar archivo', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
?>