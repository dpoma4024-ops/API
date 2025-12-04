<?php
/**
 * SigmaForo - Proxy de Geocodificación
 * 
 * Proxy para evitar problemas CORS con Nominatim de OpenStreetMap
 */

define('SIGMAFORO_API', true);
require_once __DIR__ . '/../config/config.php';

setCorsHeaders();

$method = $_SERVER['REQUEST_METHOD'];

// Solo permitir GET
if ($method !== 'GET') {
    sendError('Método no permitido', 405);
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// ========================================
// GEOCODIFICACIÓN INVERSA (Coordenadas -> Dirección)
// ========================================

if ($action === 'reverse') {
    $lat = isset($_GET['lat']) ? floatval($_GET['lat']) : null;
    $lon = isset($_GET['lon']) ? floatval($_GET['lon']) : null;
    
    if ($lat === null || $lon === null) {
        sendError('Latitud y longitud son requeridas');
    }
    
    // Validar rangos válidos
    if ($lat < -90 || $lat > 90 || $lon < -180 || $lon > 180) {
        sendError('Coordenadas inválidas');
    }
    
    try {
        // Configurar contexto para la petición
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: SigmaForo/1.0 (Aplicación de Reportes Ciudadanos)',
                    'Accept: application/json'
                ],
                'timeout' => 5
            ]
        ];
        
        $context = stream_context_create($opts);
        
        // Hacer petición a Nominatim
        $url = "https://nominatim.openstreetmap.org/reverse?lat=$lat&lon=$lon&format=json";
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            // Si falla Nominatim, devolver coordenadas formateadas
            sendSuccess([
                'display_name' => number_format($lat, 4) . ', ' . number_format($lon, 4),
                'address' => [
                    'city' => 'Ubicación',
                    'country' => 'Perú'
                ]
            ]);
            exit;
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Error al procesar respuesta de geocodificación');
        }
        
        sendSuccess($data);
        
    } catch (Exception $e) {
        logError('Error en geocodificación inversa: ' . $e->getMessage());
        
        // Fallback: devolver coordenadas formateadas
        sendSuccess([
            'display_name' => number_format($lat, 4) . ', ' . number_format($lon, 4),
            'address' => [
                'city' => 'Ubicación',
                'country' => 'Perú'
            ]
        ]);
    }
}

// ========================================
// BÚSQUEDA DE UBICACIÓN (Texto -> Coordenadas)
// ========================================

if ($action === 'search') {
    $query = isset($_GET['q']) ? trim($_GET['q']) : '';
    
    if (empty($query)) {
        sendError('Query de búsqueda requerido');
    }
    
    // Limitar longitud de búsqueda
    if (strlen($query) > 200) {
        sendError('Query demasiado largo');
    }
    
    try {
        $opts = [
            'http' => [
                'method' => 'GET',
                'header' => [
                    'User-Agent: SigmaForo/1.0 (Aplicación de Reportes Ciudadanos)',
                    'Accept: application/json'
                ],
                'timeout' => 5
            ]
        ];
        
        $context = stream_context_create($opts);
        
        // URL encode del query
        $encodedQuery = urlencode($query);
        
        // Buscar en Nominatim
        $url = "https://nominatim.openstreetmap.org/search?q=$encodedQuery&format=json&limit=5";
        $response = @file_get_contents($url, false, $context);
        
        if ($response === false) {
            sendSuccess(['results' => []]);
            exit;
        }
        
        $data = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            sendError('Error al procesar respuesta de búsqueda');
        }
        
        sendSuccess(['results' => $data]);
        
    } catch (Exception $e) {
        logError('Error en búsqueda de ubicación: ' . $e->getMessage());
        sendSuccess(['results' => []]);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Acción no válida. Use action=reverse o action=search', 404);

