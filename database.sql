-- ========================================
-- BASE DE DATOS railway
-- Sistema de Reportes Ciudadanos
-- ========================================

-- Crear base de datos
CREATE DATABASE IF NOT EXISTS railway CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE railway;

-- ========================================
-- TABLA: usuarios
-- ========================================
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE,
    password_hash VARCHAR(255),
    tipo ENUM('admin', 'registrado', 'anonimo') DEFAULT 'registrado',
    avatar_url VARCHAR(255),
    ubicacion VARCHAR(255),
    biografia TEXT,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason TEXT,
    ban_duration VARCHAR(20),
    ban_date DATETIME,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    ultimo_acceso DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_tipo (tipo),
    INDEX idx_banned (is_banned)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: reportes
-- ========================================
CREATE TABLE IF NOT EXISTS reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    contenido TEXT NOT NULL,
    categoria ENUM('seguridad', 'infraestructura', 'vias', 'servicios', 'medio_ambiente') NOT NULL,
    ubicacion VARCHAR(255) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    imagen_url VARCHAR(255),
    estado ENUM('pendiente', 'en_revision', 'en_proceso', 'resuelto') DEFAULT 'pendiente',
    vistas INT DEFAULT 0,
    likes INT DEFAULT 0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_categoria (categoria),
    INDEX idx_estado (estado),
    INDEX idx_fecha (fecha_creacion),
    INDEX idx_ubicacion (latitud, longitud),
    FULLTEXT INDEX idx_search (titulo, contenido)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: hashtags
-- ========================================
CREATE TABLE IF NOT EXISTS hashtags (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(50) UNIQUE NOT NULL,
    contador INT DEFAULT 0,
    INDEX idx_nombre (nombre),
    INDEX idx_contador (contador)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: reporte_hashtags (relación muchos a muchos)
-- ========================================
CREATE TABLE IF NOT EXISTS reporte_hashtags (
    reporte_id INT NOT NULL,
    hashtag_id INT NOT NULL,
    PRIMARY KEY (reporte_id, hashtag_id),
    FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
    FOREIGN KEY (hashtag_id) REFERENCES hashtags(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: notificaciones
-- ========================================
CREATE TABLE IF NOT EXISTS notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    tipo ENUM('nearby_incident', 'incident_status_update', 'new_incident_in_followed_area', 'comment', 'like') NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT NOT NULL,
    reporte_id INT,
    categoria ENUM('seguridad', 'infraestructura', 'vias', 'servicios', 'medio_ambiente'),
    ubicacion VARCHAR(255),
    is_read BOOLEAN DEFAULT FALSE,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: likes_reportes
-- ========================================
CREATE TABLE IF NOT EXISTS likes_reportes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    reporte_id INT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_like (user_id, reporte_id),
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
    INDEX idx_reporte (reporte_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: comentarios
-- ========================================
CREATE TABLE IF NOT EXISTS comentarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    reporte_id INT NOT NULL,
    user_id INT NOT NULL,
    contenido TEXT NOT NULL,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (reporte_id) REFERENCES reportes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_reporte (reporte_id),
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: configuracion_usuario
-- ========================================
CREATE TABLE IF NOT EXISTS configuracion_usuario (
    user_id INT PRIMARY KEY,
    notif_nearby BOOLEAN DEFAULT TRUE,
    notif_updates BOOLEAN DEFAULT TRUE,
    notif_followed BOOLEAN DEFAULT TRUE,
    notif_replies BOOLEAN DEFAULT TRUE,
    public_profile BOOLEAN DEFAULT TRUE,
    show_location BOOLEAN DEFAULT TRUE,
    anonymous_reports BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: zonas_seguidas
-- ========================================
CREATE TABLE IF NOT EXISTS zonas_seguidas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nombre_zona VARCHAR(255) NOT NULL,
    latitud DECIMAL(10, 8),
    longitud DECIMAL(11, 8),
    radio_km DECIMAL(5, 2) DEFAULT 5.0,
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- TABLA: registro_actividad (para auditoría)
-- ========================================
CREATE TABLE IF NOT EXISTS registro_actividad (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT,
    accion VARCHAR(100) NOT NULL,
    tabla_afectada VARCHAR(50),
    registro_id INT,
    descripcion TEXT,
    ip_address VARCHAR(45),
    fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (admin_id) REFERENCES usuarios(id) ON DELETE SET NULL,
    INDEX idx_admin (admin_id),
    INDEX idx_fecha (fecha_creacion)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========================================
-- INSERTAR DATOS DE PRUEBA
-- ========================================

-- Usuario Administrador
INSERT INTO usuarios (nombre, username, email, password_hash, tipo) VALUES
('Administrador', 'admin', 'admin@sigmaforo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin');
-- Password: password

-- Usuarios de prueba
INSERT INTO usuarios (nombre, username, email, password_hash, tipo) VALUES
('Gestión Municipal', 'gestion_muni', 'gestion@tacna.gob.pe', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'registrado'),
('Ciudadano Activo', 'ciudadano_tca', 'ciudadano@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'registrado'),
('Reportes Tacna', 'reportes_tca', 'reportes@ejemplo.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'registrado'),
('Usuario Anónimo', 'anonimo_001', NULL, NULL, 'anonimo');

-- Hashtags
INSERT INTO hashtags (nombre, contador) VALUES
('TacnaSegura', 1234),
('BachesPeligrosos', 892),
('TacnaVigilante', 567),
('FaltaDeAgua', 445),
('IluminacionPública', 321);

-- Reportes de prueba
INSERT INTO reportes (user_id, titulo, contenido, categoria, ubicacion, latitud, longitud, imagen_url, estado, vistas, likes) VALUES
(2, 'Semáforo caído en Av. Tacha', 'INFRAESTRUCTURA ⚠️ ¡Alerta! El semáforo en la intersección de Av. Tacha con Calle Arica está caído debido al fuerte viento, se requiere intervención urgente para evitar accidentes. #TacnaSegura', 'infraestructura', 'Av. Tacha con Calle Arica', -18.0145, -70.2495, 'https://images.unsplash.com/photo-1595856898575-9d187bd32fd6?w=400', 'en_proceso', 45, 120),
(3, 'Vandalismo en parque central', 'SEGURIDAD 🚨 Vandalismo en el parque central! Han dañado varios bancos y carteles informativos durante la noche. Por favor, más vigilancia. #TacnaVigilante', 'seguridad', 'Parque Central', -18.0056, -70.2444, 'https://images.unsplash.com/photo-1667884578193-75c66111b00b?w=400', 'en_revision', 89, 234),
(4, 'Bache peligroso en Av. Rica', 'VÍAS 🚧 Bache peligroso en Av. Rica esquina con Bolognesi. Ya ha causado varios accidentes menores. Necesitamos reparación urgente.', 'vias', 'Av. Rica con Bolognesi', -18.0087, -70.2401, 'https://images.unsplash.com/photo-1724015652877-9423e464fc0d?w=400', 'pendiente', 156, 389),
(3, 'Falta de agua en sector norte', 'SERVICIOS 🚰 Llevamos 12 horas sin agua en el sector norte de la ciudad. Necesitamos que EPS Tacna intervenga urgentemente.', 'servicios', 'Sector Norte - Av. Industrial', -17.9987, -70.2556, NULL, 'en_proceso', 203, 456),
(4, 'Acumulación de basura en zona residencial', 'MEDIO AMBIENTE 🌱 Acumulación crítica de basura en Calle Zela. Hace 5 días que no pasa el camión recolector. Mal olor y riesgo sanitario.', 'medio_ambiente', 'Calle Zela con Av. San Martín', -18.0125, -70.2478, NULL, 'pendiente', 178, 312),
(2, 'Iluminación deficiente en parque', 'SEGURIDAD 🚨 Alumbrado público apagado en Parque de la Familia. Zona oscura que representa riesgo para transeúntes en horas nocturnas.', 'seguridad', 'Parque de la Familia', -18.0198, -70.2523, NULL, 'en_revision', 92, 167),
(3, 'Rotura de tubería en vía pública', 'INFRAESTRUCTURA ⚠️ Tubería rota en Av. Bolognesi causando inundación en la pista. El agua corre por varias cuadras afectando el tránsito.', 'infraestructura', 'Av. Bolognesi altura cuadra 8', -18.0067, -70.2489, NULL, 'en_proceso', 267, 543),
(4, 'Señalización borrada en cruce', 'VÍAS 🚧 Las líneas de señalización en el cruce de Av. Legado Cabrejos están totalmente borradas. Causa confusión y riesgo de accidentes.', 'vias', 'Av. Legado Cabrejos con Calle Apurímac', -18.0113, -70.2435, NULL, 'pendiente', 134, 278);

-- Notificaciones de prueba
INSERT INTO notificaciones (user_id, tipo, titulo, descripcion, reporte_id, categoria, ubicacion, is_read) VALUES
(3, 'nearby_incident', 'Nuevo reporte en tu zona', 'Vandalismo reportado en Parque Central. Se recomienda precaución en la zona.', 2, 'seguridad', 'Parque Central', FALSE),
(3, 'incident_status_update', 'Actualización de incidente', 'El semáforo en Av. Tacha está siendo reparado. Se espera normalización del tráfico.', 1, 'infraestructura', 'Av. Tacha', FALSE),
(4, 'new_incident_in_followed_area', 'Incidente en zona seguida', 'Bache peligroso en Av. Rica esquina con Bolognesi. Reportado por múltiples usuarios.', 3, 'vias', 'Av. Rica', TRUE);

-- Configuración de usuarios
INSERT INTO configuracion_usuario (user_id, notif_nearby, notif_updates, notif_followed, notif_replies, public_profile, show_location, anonymous_reports) VALUES
(1, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
(2, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
(3, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE),
(4, TRUE, TRUE, TRUE, TRUE, TRUE, TRUE, FALSE);

-- ========================================
-- VISTAS ÚTILES
-- ========================================

-- Vista: Reportes con información del usuario
CREATE OR REPLACE VIEW v_reportes_completos AS
SELECT 
    r.*,
    u.nombre as autor_nombre,
    u.username as autor_username,
    u.tipo as autor_tipo,
    (SELECT COUNT(*) FROM comentarios WHERE reporte_id = r.id) as total_comentarios,
    (SELECT COUNT(*) FROM likes_reportes WHERE reporte_id = r.id) as total_likes_reales
FROM reportes r
INNER JOIN usuarios u ON r.user_id = u.id;

-- Vista: Estadísticas por usuario
CREATE OR REPLACE VIEW v_estadisticas_usuario AS
SELECT 
    u.id,
    u.nombre,
    u.username,
    u.email,
    u.tipo,
    u.is_banned,
    u.fecha_registro,
    COUNT(DISTINCT r.id) as total_reportes,
    COALESCE(SUM(r.likes), 0) as total_likes,
    COALESCE(SUM(r.vistas), 0) as total_vistas,
    COUNT(DISTINCT c.id) as total_comentarios
FROM usuarios u
LEFT JOIN reportes r ON u.id = r.user_id
LEFT JOIN comentarios c ON u.id = c.user_id
GROUP BY u.id;

-- Vista: Reportes por categoría
CREATE OR REPLACE VIEW v_reportes_por_categoria AS
SELECT 
    categoria,
    COUNT(*) as total,
    SUM(CASE WHEN estado = 'pendiente' THEN 1 ELSE 0 END) as pendientes,
    SUM(CASE WHEN estado = 'en_proceso' THEN 1 ELSE 0 END) as en_proceso,
    SUM(CASE WHEN estado = 'resuelto' THEN 1 ELSE 0 END) as resueltos,
    AVG(likes) as promedio_likes,
    AVG(vistas) as promedio_vistas
FROM reportes
GROUP BY categoria;

-- ========================================
-- PROCEDIMIENTOS ALMACENADOS
-- ========================================

DELIMITER $$

-- Procedimiento: Crear reporte
CREATE PROCEDURE sp_crear_reporte(
    IN p_user_id INT,
    IN p_titulo VARCHAR(255),
    IN p_contenido TEXT,
    IN p_categoria VARCHAR(50),
    IN p_ubicacion VARCHAR(255),
    IN p_latitud DECIMAL(10,8),
    IN p_longitud DECIMAL(11,8),
    IN p_imagen_url VARCHAR(255)
)
BEGIN
    INSERT INTO reportes (user_id, titulo, contenido, categoria, ubicacion, latitud, longitud, imagen_url)
    VALUES (p_user_id, p_titulo, p_contenido, p_categoria, p_ubicacion, p_latitud, p_longitud, p_imagen_url);
    
    SELECT LAST_INSERT_ID() as reporte_id;
END$$

-- Procedimiento: Dar like a reporte
CREATE PROCEDURE sp_toggle_like(
    IN p_user_id INT,
    IN p_reporte_id INT
)
BEGIN
    DECLARE v_existe INT;
    
    SELECT COUNT(*) INTO v_existe FROM likes_reportes 
    WHERE user_id = p_user_id AND reporte_id = p_reporte_id;
    
    IF v_existe > 0 THEN
        DELETE FROM likes_reportes WHERE user_id = p_user_id AND reporte_id = p_reporte_id;
        UPDATE reportes SET likes = likes - 1 WHERE id = p_reporte_id;
        SELECT 'unliked' as resultado, (SELECT likes FROM reportes WHERE id = p_reporte_id) as total_likes;
    ELSE
        INSERT INTO likes_reportes (user_id, reporte_id) VALUES (p_user_id, p_reporte_id);
        UPDATE reportes SET likes = likes + 1 WHERE id = p_reporte_id;
        SELECT 'liked' as resultado, (SELECT likes FROM reportes WHERE id = p_reporte_id) as total_likes;
    END IF;
END$$

-- Procedimiento: Incrementar vistas
CREATE PROCEDURE sp_incrementar_vistas(
    IN p_reporte_id INT
)
BEGIN
    UPDATE reportes SET vistas = vistas + 1 WHERE id = p_reporte_id;
END$$

-- Procedimiento: Banear usuario
CREATE PROCEDURE sp_banear_usuario(
    IN p_user_id INT,
    IN p_admin_id INT,
    IN p_ban_reason TEXT,
    IN p_ban_duration VARCHAR(20)
)
BEGIN
    UPDATE usuarios 
    SET is_banned = TRUE, 
        ban_reason = p_ban_reason, 
        ban_duration = p_ban_duration,
        ban_date = NOW()
    WHERE id = p_user_id;
    
    INSERT INTO registro_actividad (admin_id, accion, tabla_afectada, registro_id, descripcion)
    VALUES (p_admin_id, 'BANEAR_USUARIO', 'usuarios', p_user_id, p_ban_reason);
END$$

-- Procedimiento: Desbanear usuario
CREATE PROCEDURE sp_desbanear_usuario(
    IN p_user_id INT,
    IN p_admin_id INT
)
BEGIN
    UPDATE usuarios 
    SET is_banned = FALSE, 
        ban_reason = NULL, 
        ban_duration = NULL,
        ban_date = NULL
    WHERE id = p_user_id;
    
    INSERT INTO registro_actividad (admin_id, accion, tabla_afectada, registro_id, descripcion)
    VALUES (p_admin_id, 'DESBANEAR_USUARIO', 'usuarios', p_user_id, 'Usuario desbaneado');
END$$

DELIMITER ;

-- ========================================
-- TRIGGERS
-- ========================================

DELIMITER $$

-- Trigger: Actualizar contador de hashtags
CREATE TRIGGER tr_after_reporte_hashtag_insert
AFTER INSERT ON reporte_hashtags
FOR EACH ROW
BEGIN
    UPDATE hashtags SET contador = contador + 1 WHERE id = NEW.hashtag_id;
END$$

CREATE TRIGGER tr_after_reporte_hashtag_delete
AFTER DELETE ON reporte_hashtags
FOR EACH ROW
BEGIN
    UPDATE hashtags SET contador = contador - 1 WHERE id = OLD.hashtag_id;
END$$

DELIMITER ;

-- ========================================
-- ÍNDICES ADICIONALES PARA PERFORMANCE
-- ========================================

ALTER TABLE reportes ADD INDEX idx_estado_fecha (estado, fecha_creacion DESC);
ALTER TABLE notificaciones ADD INDEX idx_user_read (user_id, is_read);
ALTER TABLE registro_actividad ADD INDEX idx_admin_fecha (admin_id, fecha_creacion DESC);

-- ========================================
-- FINALIZADO
-- ========================================

SELECT 'Base de datos sigmaforo creada exitosamente!' as mensaje;
SELECT COUNT(*) as total_usuarios FROM usuarios;
SELECT COUNT(*) as total_reportes FROM reportes;
SELECT COUNT(*) as total_notificaciones FROM notificaciones;

-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------
-------------------------------------------------------------------------------------------------
-- ========================================
-- ACTUALIZACIONES DE BASE DE DATOS PARA SUBIDA DE IMÁGENES
-- ========================================

USE railway;

-- Tabla para registrar archivos subidos
CREATE TABLE IF NOT EXISTS archivos_subidos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    nombre_original VARCHAR(255) NOT NULL,
    nombre_guardado VARCHAR(255) NOT NULL,
    ruta VARCHAR(500) NOT NULL,
    tipo ENUM('imagen_reporte', 'avatar', 'otro') DEFAULT 'imagen_reporte',
    tamanio INT NOT NULL COMMENT 'Tamaño en bytes',
    fecha_subida TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    INDEX idx_user (user_id),
    INDEX idx_tipo (tipo),
    INDEX idx_fecha (fecha_subida)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columna avatar_url a la tabla usuarios si no existe
ALTER TABLE usuarios 
ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500) NULL COMMENT 'Ruta del avatar del usuario';

-- Índice para búsquedas por ruta de archivo
CREATE INDEX idx_ruta ON archivos_subidos(ruta);

-- Vista para obtener estadísticas de almacenamiento por usuario
CREATE OR REPLACE VIEW v_almacenamiento_usuarios AS
SELECT 
    u.id,
    u.nombre,
    u.username,
    COUNT(a.id) as total_archivos,
    COALESCE(SUM(a.tamanio), 0) as espacio_usado_bytes,
    ROUND(COALESCE(SUM(a.tamanio), 0) / 1024 / 1024, 2) as espacio_usado_mb
FROM usuarios u
LEFT JOIN archivos_subidos a ON u.id = a.user_id
GROUP BY u.id, u.nombre, u.username;