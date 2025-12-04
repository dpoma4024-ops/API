<?php
/**
 * SigmaForo - API de Tendencias
 * 
 * Endpoints para obtener hashtags trending
 */

define('SIGMAFORO_API', true);
require_once 'config.php';

setCorsHeaders();

$db = Database::getInstance()->getConnection();
$method = $_SERVER['REQUEST_METHOD'];
$action = isset($_GET['action']) ? $_GET['action'] : '';

// ========================================
// OBTENER TOP HASHTAGS TRENDING
// ========================================

if ($action === 'top' && $method === 'GET') {
    $limit = isset($_GET['limit']) ? min(10, max(1, intval($_GET['limit']))) : 5;
    
    try {
        // QUERY SIMPLIFICADA - Retorna hashtags directamente
        $stmt = $db->prepare("
            SELECT 
                h.id,
                h.nombre,
                h.contador,
                (SELECT COUNT(DISTINCT rh.reporte_id) 
                 FROM reporte_hashtags rh 
                 WHERE rh.hashtag_id = h.id) as reportes_vinculados
            FROM hashtags h
            WHERE h.contador > 0
            ORDER BY h.contador DESC
            LIMIT ?
        ");
        
        $stmt->execute([$limit]);
        $trending = $stmt->fetchAll();
        
        sendSuccess([
            'trending' => $trending,
            'total' => count($trending)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en trending: ' . $e->getMessage());
        sendError('Error al obtener tendencias: ' . $e->getMessage(), 500);
    }
}

// ========================================
// OBTENER REPORTES POR HASHTAG
// ========================================

if ($action === 'by-hashtag' && $method === 'GET') {
    $hashtag = isset($_GET['hashtag']) ? trim($_GET['hashtag']) : '';
    
    if (empty($hashtag)) {
        sendError('Hashtag requerido');
    }
    
    // Remover # si lo tiene
    $hashtag = ltrim($hashtag, '#');
    
    try {
        // Obtener ID del hashtag
        $stmt = $db->prepare("SELECT id, contador FROM hashtags WHERE nombre = ?");
        $stmt->execute([$hashtag]);
        $hashtagData = $stmt->fetch();
        
        if (!$hashtagData) {
            sendSuccess([
                'hashtag' => $hashtag,
                'reports' => [],
                'total' => 0
            ]);
            exit;
        }
        
        // Obtener reportes con ese hashtag
        $stmt = $db->prepare("
            SELECT 
                r.*,
                u.nombre as autor_nombre,
                u.username as autor_username,
                u.tipo as autor_tipo,
                (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios
            FROM reportes r
            INNER JOIN reporte_hashtags rh ON r.id = rh.reporte_id
            INNER JOIN usuarios u ON r.user_id = u.id
            WHERE rh.hashtag_id = ?
            ORDER BY r.fecha_creacion DESC
            LIMIT 20
        ");
        $stmt->execute([$hashtagData['id']]);
        
        $reports = $stmt->fetchAll();
        
        sendSuccess([
            'hashtag' => $hashtag,
            'hashtag_count' => $hashtagData['contador'],
            'reports' => $reports,
            'total' => count($reports)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en by-hashtag: ' . $e->getMessage());
        sendError('Error al obtener reportes por hashtag: ' . $e->getMessage(), 500);
    }
}

// ========================================
// BUSCAR HASHTAGS
// ========================================

if ($action === 'search' && $method === 'GET') {
    $query = isset($_GET['q']) ? trim($_GET['q']) : '';
    
    if (empty($query) || strlen($query) < 2) {
        sendSuccess(['results' => []]);
        exit;
    }
    
    // Remover # si lo tiene
    $query = ltrim($query, '#');
    
    try {
        $stmt = $db->prepare("
            SELECT 
                id,
                nombre,
                contador
            FROM hashtags
            WHERE nombre LIKE ?
            ORDER BY contador DESC
            LIMIT 10
        ");
        
        $stmt->execute(['%' . $query . '%']);
        $results = $stmt->fetchAll();
        
        sendSuccess([
            'results' => $results,
            'total' => count($results)
        ]);
        
    } catch (PDOException $e) {
        logError('Error en search hashtags: ' . $e->getMessage());
        sendError('Error al buscar hashtags: ' . $e->getMessage(), 500);
    }
}

// ========================================
// ENDPOINT NO ENCONTRADO
// ========================================

sendError('Endpoint no encontrado', 404);
