<?php
/**
 * SigmaForo - API de Zonas Seguidas
 * 
 * Endpoints para gestión de zonas seguidas por usuarios
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ========================================
// VERIFICAR SI USUARIO SIGUE UN REPORTE
// ========================================

if ($action === 'is-following' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendSuccess(['is_following' => false]);
        exit;
    }
    
    $reportId = isset($_GET['report_id']) ? intval($_GET['report_id']) : 0;
    
    if (!$reportId) {
        sendError('ID de reporte requerido');
    }
    
    try {
        // Obtener el reporte para verificar ubicación
        $stmt = $db->prepare("
            SELECT id, titulo, ubicacion, latitud, longitud 
            FROM reportes 
            WHERE id = ?
        ");
        $stmt->execute([$reportId]);
        $report = $stmt->fetch();
        
        if (!$report) {
            sendError('Reporte no encontrado', 404);
        }
        
        // Verificar si existe zona seguida para este reporte
        // Buscamos por nombre (título del reporte) o por coordenadas cercanas
        $stmt = $db->prepare("
            SELECT id 
            FROM zonas_seguidas 
            WHERE user_id = ? 
            AND (
                nombre_zona LIKE ? 
                OR (
                    latitud BETWEEN ? - 0.001 AND ? + 0.001 
                    AND longitud BETWEEN ? - 0.001 AND ? + 0.001
                )
            )
            LIMIT 1
        ");
        $stmt->execute([
            $user['user_id'],
            '%' . $report['titulo'] . '%',
            $report['latitud'],
            $report['latitud'],
            $report['longitud'],
            $report['longitud']
        ]);
        
        $isFollowing = $stmt->rowCount() > 0;
        
        sendSuccess([
            'is_following' => $isFollowing,
            'report_id' => $reportId
        ]);
        
    } catch (PDOException $e) {
        logError('Error en is-following: ' . $e->getMessage());
        sendError('Error al verificar seguimiento', 500);
    }
}

// ========================================
// ALTERNAR SEGUIMIENTO (SEGUIR/DEJAR DE SEGUIR)
// ========================================

if ($action === 'toggle-follow' && $method === 'POST') {
    $user = requireAuth();
    
    // Los usuarios anónimos no pueden seguir reportes
    if ($user['user_type'] === 'anonimo') {
        sendError('Los usuarios anónimos no pueden seguir reportes', 403);
    }
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    validateRequired($data, ['report_id', 'report_title', 'latitude', 'longitude', 'location']);
    
    $reportId = intval($data['report_id']);
    $reportTitle = sanitizeString($data['report_title']);
    $latitude = floatval($data['latitude']);
    $longitude = floatval($data['longitude']);
    $location = sanitizeString($data['location']);
    
    try {
        // Verificar si ya existe la zona seguida
        $stmt = $db->prepare("
            SELECT id 
            FROM zonas_seguidas 
            WHERE user_id = ? 
            AND (
                nombre_zona LIKE ? 
                OR (
                    latitud BETWEEN ? - 0.001 AND ? + 0.001 
                    AND longitud BETWEEN ? - 0.001 AND ? + 0.001
                )
            )
            LIMIT 1
        ");
        $stmt->execute([
            $user['user_id'],
            '%' . $reportTitle . '%',
            $latitude,
            $latitude,
            $longitude,
            $longitude
        ]);
        
        $existing = $stmt->fetch();
        
        if ($existing) {
            // Ya existe, eliminar (dejar de seguir)
            $stmt = $db->prepare("DELETE FROM zonas_seguidas WHERE id = ?");
            $stmt->execute([$existing['id']]);
            
            sendSuccess([
                'action' => 'unfollowed',
                'report_id' => $reportId,
                'message' => 'Dejaste de seguir este reporte'
            ]);
        } else {
            // No existe, crear (seguir)
            $stmt = $db->prepare("
                INSERT INTO zonas_seguidas 
                (user_id, nombre_zona, latitud, longitud, radio_km) 
                VALUES (?, ?, ?, ?, 5.0)
            ");
            $stmt->execute([
                $user['user_id'],
                $reportTitle . ' - ' . $location,
                $latitude,
                $longitude
            ]);
            
            $zoneId = $db->lastInsertId();
            
            sendSuccess([
                'action' => 'followed',
                'zone_id' => $zoneId,
                'report_id' => $reportId,
                'message' => 'Ahora sigues este reporte'
            ]);
        }
        
    } catch (PDOException $e) {
        logError('Error en toggle-follow: ' . $e->getMessage());
        sendError('Error al procesar seguimiento: ' . $e->getMessage(), 500);
    }
}

// ========================================
// LISTAR ZONAS SEGUIDAS DEL USUARIO
// ========================================

if ($action === 'list' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendSuccess(['zones' => []]);
        exit;
    }
    
    try {
        $stmt = $db->prepare("
            SELECT 
                z.*,
                (SELECT COUNT(*) 
                 FROM reportes r 
                 WHERE (6371 * acos(
                     cos(radians(?)) * 
                     cos(radians(r.latitud)) * 
                     cos(radians(r.longitud) - radians(?)) + 
                     sin(radians(?)) * 
                     sin(radians(r.latitud))
                 )) <= z.radio_km
                ) as total_reportes_cercanos
            FROM zonas_seguidas z
            WHERE z.user_id = ?
            ORDER BY z.fecha_creacion DESC
        ");
        
        $stmt->execute([
            0, 0, 0, // Coordenadas dummy para el COUNT
            $user['user_id']
        ]);
        
        $zones = $stmt->fetchAll();
        
        sendSuccess([
            'zones' => $zones,
            'total' => count($zones)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en list zones: ' . $e->getMessage());
        sendError('Error al obtener zonas seguidas', 500);
    }
}

// ========================================
// ELIMINAR ZONA SEGUIDA
// ========================================

if ($action === 'delete' && $method === 'DELETE') {
    $user = requireAuth();
    
    $id = isset($_GET['id']) ? intval($_GET['id']) : 0;
    if (!$id) {
        sendError('ID de zona requerido');
    }
    
    try {
        // Verificar que la zona pertenece al usuario
        $stmt = $db->prepare("SELECT user_id FROM zonas_seguidas WHERE id = ?");
        $stmt->execute([$id]);
        $zone = $stmt->fetch();
        
        if (!$zone) {
            sendError('Zona no encontrada', 404);
        }
        
        if ($zone['user_id'] != $user['user_id']) {
            sendError('No tienes permiso para eliminar esta zona', 403);
        }
        
        // Eliminar
        $stmt = $db->prepare("DELETE FROM zonas_seguidas WHERE id = ?");
        $stmt->execute([$id]);
        
        sendSuccess(null, 'Zona eliminada exitosamente');
        
    } catch (PDOException $e) {
        logError('Error en delete zone: ' . $e->getMessage());
        sendError('Error al eliminar zona', 500);
    }
}

// ========================================
// OBTENER NOTIFICACIONES DE ZONAS SEGUIDAS
// ========================================

if ($action === 'notifications' && $method === 'GET') {
    $user = requireAuth();
    
    if ($user['user_type'] === 'anonimo') {
        sendSuccess(['notifications' => []]);
        exit;
    }
    
    try {
        // Obtener reportes en zonas seguidas del usuario
        $stmt = $db->prepare("
            SELECT 
                r.id,
                r.titulo,
                r.contenido,
                r.categoria,
                r.ubicacion,
                r.latitud,
                r.longitud,
                r.fecha_creacion,
                r.estado,
                u.nombre as autor_nombre,
                z.nombre_zona,
                (6371 * acos(
                    cos(radians(z.latitud)) * 
                    cos(radians(r.latitud)) * 
                    cos(radians(r.longitud) - radians(z.longitud)) + 
                    sin(radians(z.latitud)) * 
                    sin(radians(r.latitud))
                )) as distancia_km
            FROM reportes r
            INNER JOIN usuarios u ON r.user_id = u.id
            CROSS JOIN zonas_seguidas z
            WHERE z.user_id = ?
            AND r.user_id != ?
            AND (6371 * acos(
                cos(radians(z.latitud)) * 
                cos(radians(r.latitud)) * 
                cos(radians(r.longitud) - radians(z.longitud)) + 
                sin(radians(z.latitud)) * 
                sin(radians(r.latitud))
            )) <= z.radio_km
            AND r.fecha_creacion >= DATE_SUB(NOW(), INTERVAL 7 DAY)
            ORDER BY r.fecha_creacion DESC
            LIMIT 50
        ");
        
        $stmt->execute([$user['user_id'], $user['user_id']]);
        $notifications = $stmt->fetchAll();
        
        sendSuccess([
            'notifications' => $notifications,
            'total' => count($notifications)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en notifications: ' . $e->getMessage());
        sendError('Error al obtener notificaciones', 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
