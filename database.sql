CREATE DATABASE  IF NOT EXISTS `railway` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci */ /*!80016 DEFAULT ENCRYPTION='N' */;
USE `railway`;
-- MySQL dump 10.13  Distrib 8.0.44, for Win64 (x86_64)
--
-- Host: shuttle.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `archivos_subidos`
--

DROP TABLE IF EXISTS `archivos_subidos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivos_subidos` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nombre_original` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `nombre_guardado` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `ruta` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tipo` enum('imagen_reporte','avatar','otro') COLLATE utf8mb4_unicode_ci DEFAULT 'imagen_reporte',
  `tamanio` int NOT NULL COMMENT 'Tamaño en bytes',
  `fecha_subida` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_fecha` (`fecha_subida`),
  KEY `idx_ruta` (`ruta`),
  CONSTRAINT `archivos_subidos_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `archivos_subidos`
--

LOCK TABLES `archivos_subidos` WRITE;
/*!40000 ALTER TABLE `archivos_subidos` DISABLE KEYS */;
INSERT INTO `archivos_subidos` VALUES (1,7,'FB_IMG_1737354070252.jpg','report_6921c00b805414.96926431_1763819531.jpg','uploads/reportes/report_6921c00b805414.96926431_1763819531.jpg','imagen_reporte',68501,'2025-11-22 13:52:11'),(2,7,'fc3f8526734d2e8a7e1fb62a2c551fc1.jpg','report_6921ca6a347263.80586848_1763822186.jpg','uploads/reportes/report_6921ca6a347263.80586848_1763822186.jpg','imagen_reporte',25534,'2025-11-22 14:36:26'),(3,10,'hqsUnoL7.jpg','report_6921cdd2a1c115.12360820_1763823058.jpg','uploads/reportes/report_6921cdd2a1c115.12360820_1763823058.jpg','imagen_reporte',94741,'2025-11-22 14:50:59'),(4,7,'desktop-wallpaper-anime-scenery-anime-tree.jpg','report_692281417cb862.93479591_1763868993.jpg','uploads/reportes/report_692281417cb862.93479591_1763868993.jpg','imagen_reporte',94405,'2025-11-23 03:36:33'),(5,7,'Wakuri.Kaoruko.full.4323525.jpg','report_6922ee6fa65498.68108116_1763896943.jpg','uploads/reportes/report_6922ee6fa65498.68108116_1763896943.jpg','imagen_reporte',675154,'2025-11-23 11:22:24'),(6,7,'fc3f8526734d2e8a7e1fb62a2c551fc1.jpg','report_69230508685748.21939406_1763902728.jpg','uploads/reportes/report_69230508685748.21939406_1763902728.jpg','imagen_reporte',25534,'2025-11-23 12:58:48'),(7,7,'smash.jpg','report_6923b638ed5b24.93022714_1763948088.jpg','uploads/reportes/report_6923b638ed5b24.93022714_1763948088.jpg','imagen_reporte',33476,'2025-11-24 01:34:49'),(8,7,'Wakuri.Kaoruko.full.4323525.jpg','report_692456400a3479.03990775_1763989056.jpg','uploads/reportes/report_692456400a3479.03990775_1763989056.jpg','imagen_reporte',675154,'2025-11-24 12:57:36'),(9,7,'fc3f8526734d2e8a7e1fb62a2c551fc1.jpg','rblrnxk7dfgmdiqaymt8.jpg','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763990420/sigmaforo/reportes/rblrnxk7dfgmdiqaymt8.jpg','imagen_reporte',25534,'2025-11-24 13:20:21'),(10,7,'xd.jpg','k4stxmczdfcydm6ajyk3.jpg','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763990687/sigmaforo/reportes/k4stxmczdfcydm6ajyk3.jpg','imagen_reporte',49320,'2025-11-24 13:24:48'),(11,7,'desktop-wallpaper-anime-scenery-anime-tree.jpg','rttizxnltdvztloj9jak.jpg','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763994080/sigmaforo/reportes/rttizxnltdvztloj9jak.jpg','imagen_reporte',94405,'2025-11-24 14:21:22'),(12,20,'DiagramaETL.png','ue71sj9momgeiazvyqtd.png','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763998090/sigmaforo/reportes/ue71sj9momgeiazvyqtd.png','imagen_reporte',154280,'2025-11-24 15:28:11'),(13,22,'IMG_20251031_153435 (1).jpg','rbtbd7u19cxtoyeo3oor.jpg','https://res.cloudinary.com/dzclcz5hn/image/upload/v1764014423/sigmaforo/reportes/rbtbd7u19cxtoyeo3oor.jpg','imagen_reporte',1363246,'2025-11-24 20:00:25'),(14,19,'Diseño sin título.jpg','jwlo4zbbco5wjbosneow.jpg','https://res.cloudinary.com/dzclcz5hn/image/upload/v1764016743/sigmaforo/reportes/jwlo4zbbco5wjbosneow.jpg','imagen_reporte',207909,'2025-11-24 20:39:04');
/*!40000 ALTER TABLE `archivos_subidos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `comentarios`
--

DROP TABLE IF EXISTS `comentarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `comentarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `reporte_id` int NOT NULL,
  `user_id` int NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_reporte` (`reporte_id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `comentarios_ibfk_1` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `comentarios_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `comentarios`
--

LOCK TABLES `comentarios` WRITE;
/*!40000 ALTER TABLE `comentarios` DISABLE KEYS */;
INSERT INTO `comentarios` VALUES (6,30,7,'Si ya nos dimos cuenta','2025-11-24 20:13:33');
/*!40000 ALTER TABLE `comentarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `configuracion_usuario`
--

DROP TABLE IF EXISTS `configuracion_usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `configuracion_usuario` (
  `user_id` int NOT NULL,
  `notif_nearby` tinyint(1) DEFAULT '1',
  `notif_updates` tinyint(1) DEFAULT '1',
  `notif_followed` tinyint(1) DEFAULT '1',
  `notif_replies` tinyint(1) DEFAULT '1',
  `public_profile` tinyint(1) DEFAULT '1',
  `show_location` tinyint(1) DEFAULT '1',
  `anonymous_reports` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`user_id`),
  CONSTRAINT `configuracion_usuario_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `configuracion_usuario`
--

LOCK TABLES `configuracion_usuario` WRITE;
/*!40000 ALTER TABLE `configuracion_usuario` DISABLE KEYS */;
INSERT INTO `configuracion_usuario` VALUES (1,1,1,1,1,1,1,0),(2,1,1,1,1,1,1,0),(3,1,1,1,1,1,1,0),(4,1,1,1,1,1,1,0),(6,1,1,1,1,1,1,0),(7,1,1,1,1,1,1,0),(10,1,1,1,1,1,1,0),(19,1,1,1,1,1,1,0),(20,0,0,0,0,0,0,0),(23,1,1,1,1,1,1,0);
/*!40000 ALTER TABLE `configuracion_usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `hashtags`
--

DROP TABLE IF EXISTS `hashtags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `hashtags` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contador` int DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `nombre` (`nombre`),
  KEY `idx_nombre` (`nombre`),
  KEY `idx_contador` (`contador`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `hashtags`
--

LOCK TABLES `hashtags` WRITE;
/*!40000 ALTER TABLE `hashtags` DISABLE KEYS */;
/*!40000 ALTER TABLE `hashtags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `likes_reportes`
--

DROP TABLE IF EXISTS `likes_reportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `likes_reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `reporte_id` int NOT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_like` (`user_id`,`reporte_id`),
  KEY `idx_reporte` (`reporte_id`),
  CONSTRAINT `likes_reportes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `likes_reportes_ibfk_2` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `likes_reportes`
--

LOCK TABLES `likes_reportes` WRITE;
/*!40000 ALTER TABLE `likes_reportes` DISABLE KEYS */;
INSERT INTO `likes_reportes` VALUES (7,7,30,'2025-11-24 20:12:56'),(8,7,31,'2025-11-24 20:58:17');
/*!40000 ALTER TABLE `likes_reportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificaciones`
--

DROP TABLE IF EXISTS `notificaciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificaciones` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `tipo` enum('nearby_incident','incident_status_update','new_incident_in_followed_area','comment','like') COLLATE utf8mb4_unicode_ci NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `reporte_id` int DEFAULT NULL,
  `from_user_id` int DEFAULT NULL,
  `categoria` enum('seguridad','infraestructura','vias','servicios','medio_ambiente') COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `reporte_id` (`reporte_id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`),
  KEY `idx_fecha` (`fecha_creacion`),
  KEY `idx_user_read` (`user_id`,`is_read`),
  KEY `idx_from_user` (`from_user_id`),
  CONSTRAINT `fk_notif_from_user` FOREIGN KEY (`from_user_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL,
  CONSTRAINT `notificaciones_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE,
  CONSTRAINT `notificaciones_ibfk_2` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificaciones`
--

LOCK TABLES `notificaciones` WRITE;
/*!40000 ALTER TABLE `notificaciones` DISABLE KEYS */;
INSERT INTO `notificaciones` VALUES (1,3,'nearby_incident','Nuevo reporte en tu zona','Vandalismo reportado en Parque Central. Se recomienda precaución en la zona.',NULL,NULL,'seguridad','Parque Central',0,'2025-11-21 10:53:18'),(2,3,'incident_status_update','Actualización de incidente','El semáforo en Av. Tacha está siendo reparado. Se espera normalización del tráfico.',NULL,NULL,'infraestructura','Av. Tacha',0,'2025-11-21 10:53:18'),(3,4,'new_incident_in_followed_area','Incidente en zona seguida','Bache peligroso en Av. Rica esquina con Bolognesi. Reportado por múltiples usuarios.',NULL,NULL,'vias','Av. Rica',1,'2025-11-21 10:53:18'),(5,2,'like','Le gustó tu reporte','A david poma le gustó \"Iluminación deficiente en parque\"',NULL,7,'seguridad','Parque de la Familia',0,'2025-11-24 01:36:31'),(6,7,'like','Le gustó tu reporte','A Gomez Gonzales le gustó \"asddasd\"',NULL,10,'servicios','Villa Universitaria, Capanique, Las Peañas, Pocollay, Tacna, 23001, Perú',1,'2025-11-24 02:02:51'),(7,7,'comment','Nuevo comentario en tu reporte','Gomez Gonzales comentó en \"asddasd\"',NULL,10,'servicios','Villa Universitaria, Capanique, Las Peañas, Pocollay, Tacna, 23001, Perú',1,'2025-11-24 02:03:27'),(8,7,'like','Le gustó tu reporte','A Gomez Gonzales le gustó \"asddasd\"',NULL,10,'servicios','Villa Universitaria, Capanique, Las Peañas, Pocollay, Tacna, 23001, Perú',1,'2025-11-24 02:03:36'),(9,18,'comment','Nuevo comentario en tu reporte','Nicolás Arturo comentó en \"Pistas en construcción\"',NULL,20,'infraestructura','845, Calle 28 de Julio, Virgen del Carmen, Tacna, 23001, Perú',0,'2025-11-24 15:25:10'),(10,20,'like','Le gustó tu reporte','A david poma le gustó \"Se cayó un árbol en leguía\"',NULL,7,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',1,'2025-11-24 15:28:40'),(11,20,'comment','Nuevo comentario en tu reporte','david poma comentó en \"Se cayó un árbol en leguía\"',NULL,7,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',1,'2025-11-24 15:29:15'),(12,20,'incident_status_update','Actualización de estado','Tu reporte \"Se cayó un árbol en leguía\" cambió a: En Proceso',NULL,NULL,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',1,'2025-11-24 15:32:03'),(13,7,'new_incident_in_followed_area','Actualización en zona seguida','El reporte \"Se cayó un árbol en leguía\" cambió a: En Proceso',NULL,NULL,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',1,'2025-11-24 15:32:04'),(14,19,'new_incident_in_followed_area','Actualización en zona seguida','El reporte \"Se cayó un árbol en leguía\" cambió a: En Proceso',NULL,NULL,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',0,'2025-11-24 15:32:05'),(15,20,'comment','Nuevo comentario en tu reporte','david poma comentó en \"Se cayó un árbol en leguía\"',NULL,7,'medio_ambiente','498, Avenida Augusto Bernardino Leguía, Asociación Pedro Ruríz Gallo, Jesús María, Tacna, 23001, Perú',0,'2025-11-24 15:38:13'),(16,19,'like','Le gustó tu reporte','A david poma le gustó \"No hay luz en toda la zona de la UNJBG\"',30,7,'servicios','UNJBG, Avenida Miraflores, Urbanización La Rueda, Jesús María, Tacna, 23003, Perú',0,'2025-11-24 20:12:58'),(17,19,'comment','Nuevo comentario en tu reporte','david poma comentó en \"No hay luz en toda la zona de la UNJBG\"',30,7,'servicios','UNJBG, Avenida Miraflores, Urbanización La Rueda, Jesús María, Tacna, 23003, Perú',0,'2025-11-24 20:13:34'),(18,19,'like','Le gustó tu reporte','A david poma le gustó \"Luces de semáforos sincronizados\"',31,7,'infraestructura','Universidad Nacional Jorge Basadre Grohmann, Óvalo Cusco, Monte Verde 1, Jesús María, Tacna, 23003, Perú',0,'2025-11-24 20:58:18');
/*!40000 ALTER TABLE `notificaciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registro_actividad`
--

DROP TABLE IF EXISTS `registro_actividad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registro_actividad` (
  `id` int NOT NULL AUTO_INCREMENT,
  `admin_id` int DEFAULT NULL,
  `accion` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `tabla_afectada` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `registro_id` int DEFAULT NULL,
  `descripcion` text COLLATE utf8mb4_unicode_ci,
  `ip_address` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_admin` (`admin_id`),
  KEY `idx_fecha` (`fecha_creacion`),
  KEY `idx_admin_fecha` (`admin_id`,`fecha_creacion` DESC),
  CONSTRAINT `registro_actividad_ibfk_1` FOREIGN KEY (`admin_id`) REFERENCES `usuarios` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registro_actividad`
--

LOCK TABLES `registro_actividad` WRITE;
/*!40000 ALTER TABLE `registro_actividad` DISABLE KEYS */;
/*!40000 ALTER TABLE `registro_actividad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reporte_hashtags`
--

DROP TABLE IF EXISTS `reporte_hashtags`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reporte_hashtags` (
  `reporte_id` int NOT NULL,
  `hashtag_id` int NOT NULL,
  PRIMARY KEY (`reporte_id`,`hashtag_id`),
  KEY `hashtag_id` (`hashtag_id`),
  CONSTRAINT `reporte_hashtags_ibfk_1` FOREIGN KEY (`reporte_id`) REFERENCES `reportes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `reporte_hashtags_ibfk_2` FOREIGN KEY (`hashtag_id`) REFERENCES `hashtags` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reporte_hashtags`
--

LOCK TABLES `reporte_hashtags` WRITE;
/*!40000 ALTER TABLE `reporte_hashtags` DISABLE KEYS */;
/*!40000 ALTER TABLE `reporte_hashtags` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reportes`
--

DROP TABLE IF EXISTS `reportes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `reportes` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `titulo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `contenido` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `categoria` enum('seguridad','infraestructura','vias','servicios','medio_ambiente') COLLATE utf8mb4_unicode_ci NOT NULL,
  `ubicacion` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `imagen_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `hashtags` text COLLATE utf8mb4_unicode_ci,
  `estado` enum('pendiente','en_revision','en_proceso','resuelto') COLLATE utf8mb4_unicode_ci DEFAULT 'pendiente',
  `vistas` int DEFAULT '0',
  `likes` int DEFAULT '0',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `fecha_actualizacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_categoria` (`categoria`),
  KEY `idx_estado` (`estado`),
  KEY `idx_fecha` (`fecha_creacion`),
  KEY `idx_ubicacion` (`latitud`,`longitud`),
  KEY `idx_estado_fecha` (`estado`,`fecha_creacion` DESC),
  FULLTEXT KEY `idx_search` (`titulo`,`contenido`),
  CONSTRAINT `reportes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reportes`
--

LOCK TABLES `reportes` WRITE;
/*!40000 ALTER TABLE `reportes` DISABLE KEYS */;
INSERT INTO `reportes` VALUES (30,19,'No hay luz en toda la zona de la UNJBG','No hay luz en toda la zona de la universidad y los estudiantes están buscando impresoras para poder imprimir sus documentos.','servicios','UNJBG, Avenida Miraflores, Urbanización La Rueda, Jesús María, Tacna, 23003, Perú',-18.02332313,-70.24922132,NULL,NULL,'pendiente',5,1,'2025-11-24 20:08:07','2025-11-26 19:51:00'),(31,19,'Luces de semáforos sincronizados','Los semáforos que están frente a la puerta de miraflores de la UNJBG están sincronizados, causando confusiones entre peatones y vehículos en no saber quién pasar primero','infraestructura','Universidad Nacional Jorge Basadre Grohmann, Óvalo Cusco, Monte Verde 1, Jesús María, Tacna, 23003, Perú',-18.02328232,-70.24900675,'https://res.cloudinary.com/dzclcz5hn/image/upload/v1764016743/sigmaforo/reportes/jwlo4zbbco5wjbosneow.jpg',NULL,'pendiente',5,1,'2025-11-24 20:39:06','2025-11-26 19:50:38');
/*!40000 ALTER TABLE `reportes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuarios`
--

DROP TABLE IF EXISTS `usuarios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `id` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `email` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `password_hash` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `tipo` enum('admin','registrado','anonimo') COLLATE utf8mb4_unicode_ci DEFAULT 'registrado',
  `avatar_url` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ubicacion` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `biografia` text COLLATE utf8mb4_unicode_ci,
  `is_banned` tinyint(1) DEFAULT '0',
  `ban_reason` text COLLATE utf8mb4_unicode_ci,
  `ban_duration` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ban_date` datetime DEFAULT NULL,
  `fecha_registro` datetime DEFAULT CURRENT_TIMESTAMP,
  `ultimo_acceso` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_username` (`username`),
  KEY `idx_email` (`email`),
  KEY `idx_tipo` (`tipo`),
  KEY `idx_banned` (`is_banned`)
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuarios`
--

LOCK TABLES `usuarios` WRITE;
/*!40000 ALTER TABLE `usuarios` DISABLE KEYS */;
INSERT INTO `usuarios` VALUES (1,'Administrador','admin','admin@sigmaforo.com','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','admin',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-21 10:53:17','2025-11-27 00:33:53'),(2,'Gestión Municipal','gestion_muni','gestion@tacna.gob.pe','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-21 10:53:17','2025-11-21 10:53:17'),(3,'Ciudadano Activo','ciudadano_tca','ciudadano@ejemplo.com','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-21 10:53:17','2025-11-21 10:53:17'),(4,'Reportes Tacna','reportes_tca','reportes@ejemplo.com','$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-21 10:53:17','2025-11-21 10:53:17'),(5,'Usuario Anónimo','anonimo_001',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-21 10:53:17','2025-11-21 10:53:17'),(6,'Usuario Test','usuario_test_0ec4','test_586@test.com','$2y$12$It4pvXKr2EOoLRPzBaOBle.zkFJzxYgqsMD1WYx9qCCqkjjUwunlq','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-22 10:41:11','2025-11-22 10:41:11'),(7,'david poma','david_b14c','david@gmail.com','$2y$12$DlWQgq.AVFq5DuFfhJiViuGfoTO4sGKK3WgKyg3cRDcXsw6zjyGWS','registrado','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763993894/sigmaforo/avatars/zefhhipufmjk8qijxqpw.jpg','Asociación 5 de Diciembre, Los Valientes, Alfonso Ugarte, Coronel Gregorio Albarracín Lanchipa, Tacna, 23003, Perú','xdxdxd',0,NULL,NULL,NULL,'2025-11-22 10:59:10','2025-11-27 00:18:17'),(8,'Usuario Anónimo','anonimo_6921982529aee',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-22 11:01:57','2025-11-22 11:01:57'),(9,'Usuario Anónimo','anonimo_6921a0fcc641a',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-22 11:39:41','2025-11-22 11:39:41'),(10,'Gomez Gonzales','gomez_gonzales_fb0d','gomez@gmail.com','$2y$12$WBLqMpsOopDULum6IQ3z0OaYxad5JCpn6NiuIBJLZT6MmnFUrqAyq','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-22 14:45:49','2025-11-24 02:02:34'),(11,'Usuario Anónimo','anonimo_6922e10c1ba90',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-23 10:25:16','2025-11-23 10:25:16'),(12,'Usuario Anónimo','anonimo_69230d46f2b96',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-23 13:33:59','2025-11-23 13:33:59'),(13,'Usuario Anónimo','anonimo_6923b47b1cc7f',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 01:27:23','2025-11-24 01:27:23'),(14,'Usuario Anónimo','anonimo_69243ca7a877e',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 11:08:24','2025-11-24 11:08:24'),(15,'Usuario Anónimo','anonimo_69243eaf4b567',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 11:17:03','2025-11-24 11:17:03'),(16,'Usuario Anónimo','anonimo_6924583b756c2',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 13:06:03','2025-11-24 13:06:03'),(17,'Usuario Anónimo','anonimo_6924760bc7f2f',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 15:13:16','2025-11-24 15:13:16'),(18,'Usuario Anónimo','anonimo_69247667adce3',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 15:14:48','2025-11-24 15:14:48'),(19,'Nicolás Marin Gonzales','nicolás_marin_gonzales_e4cc','elefantinconpollito34699@gmail.com','$2y$12$dmBoXM9xyav3f2dzmbbKjOwB5MMsQho1EFKq2uECkXwL0fn/IIPOm','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 15:17:44','2025-11-24 20:01:56'),(20,'Nicolás Gonzales','nicolás_arturo_4461','nicomas@gmail.com','$2y$12$3hBXwYCfD/Wp2XtSCTPG8.aLO/K/7we2VyQgSfDjjzuPepPXSqYE.','registrado','https://res.cloudinary.com/dzclcz5hn/image/upload/v1763998510/sigmaforo/avatars/hsdbis7dgqpbe5krhslf.png','845, Calle 28 de Julio, Virgen del Carmen, Tacna, 23001, Perú','Soy estudiando de la UNJBG',0,NULL,NULL,NULL,'2025-11-24 15:24:38','2025-11-24 15:41:41'),(21,'Usuario Anónimo','anonimo_6924b8110b27e',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 19:54:57','2025-11-24 19:54:57'),(22,'Usuario Anónimo','anonimo_6924b81271bfe',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 19:54:58','2025-11-24 19:54:58'),(23,'Samuel','samuel_daf4','sam@gmail.com','$2y$12$LQHdC8p64pqfC3Q4ZSQpnOUU.S78PRp2kslc707Sq.5gdGrWBWAdG','registrado',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 20:07:31','2025-11-24 20:07:31'),(24,'Usuario Anónimo','anonimo_6924bc0ade624',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 20:11:55','2025-11-24 20:11:55'),(25,'Usuario Anónimo','anonimo_6924ce75bc4e0',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-24 21:30:30','2025-11-24 21:30:30'),(26,'Usuario Anónimo','anonimo_6925e3c3d394d',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-25 17:13:40','2025-11-25 17:13:40'),(27,'Usuario Anónimo','anonimo_6925e3c567897',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-25 17:13:41','2025-11-25 17:13:41'),(28,'Usuario Anónimo','anonimo_6925e3c6ced04',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-25 17:13:43','2025-11-25 17:13:43'),(29,'Usuario Anónimo','anonimo_6925e3c84e231',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-25 17:13:44','2025-11-25 17:13:44'),(30,'Usuario Anónimo','anonimo_692621e5a85c3',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-25 21:38:46','2025-11-25 21:38:46'),(31,'Usuario Anónimo','anonimo_692759ea9879c',NULL,NULL,'anonimo',NULL,NULL,NULL,0,NULL,NULL,NULL,'2025-11-26 19:50:02','2025-11-26 19:50:02');
/*!40000 ALTER TABLE `usuarios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Temporary view structure for view `v_almacenamiento_usuarios`
--

DROP TABLE IF EXISTS `v_almacenamiento_usuarios`;
/*!50001 DROP VIEW IF EXISTS `v_almacenamiento_usuarios`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_almacenamiento_usuarios` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `username`,
 1 AS `total_archivos`,
 1 AS `espacio_usado_bytes`,
 1 AS `espacio_usado_mb`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_estadisticas_usuario`
--

DROP TABLE IF EXISTS `v_estadisticas_usuario`;
/*!50001 DROP VIEW IF EXISTS `v_estadisticas_usuario`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_estadisticas_usuario` AS SELECT 
 1 AS `id`,
 1 AS `nombre`,
 1 AS `username`,
 1 AS `email`,
 1 AS `tipo`,
 1 AS `is_banned`,
 1 AS `fecha_registro`,
 1 AS `total_reportes`,
 1 AS `total_likes`,
 1 AS `total_vistas`,
 1 AS `total_comentarios`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_notificaciones_completas`
--

DROP TABLE IF EXISTS `v_notificaciones_completas`;
/*!50001 DROP VIEW IF EXISTS `v_notificaciones_completas`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_notificaciones_completas` AS SELECT 
 1 AS `id`,
 1 AS `user_id`,
 1 AS `tipo`,
 1 AS `titulo`,
 1 AS `descripcion`,
 1 AS `reporte_id`,
 1 AS `from_user_id`,
 1 AS `categoria`,
 1 AS `ubicacion`,
 1 AS `is_read`,
 1 AS `fecha_creacion`,
 1 AS `reporte_titulo`,
 1 AS `reporte_imagen`,
 1 AS `reporte_estado`,
 1 AS `destinatario_nombre`,
 1 AS `destinatario_username`,
 1 AS `remitente_nombre`,
 1 AS `remitente_username`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_reportes_completos`
--

DROP TABLE IF EXISTS `v_reportes_completos`;
/*!50001 DROP VIEW IF EXISTS `v_reportes_completos`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_reportes_completos` AS SELECT 
 1 AS `id`,
 1 AS `user_id`,
 1 AS `titulo`,
 1 AS `contenido`,
 1 AS `categoria`,
 1 AS `ubicacion`,
 1 AS `latitud`,
 1 AS `longitud`,
 1 AS `imagen_url`,
 1 AS `estado`,
 1 AS `vistas`,
 1 AS `likes`,
 1 AS `fecha_creacion`,
 1 AS `fecha_actualizacion`,
 1 AS `autor_nombre`,
 1 AS `autor_username`,
 1 AS `autor_tipo`,
 1 AS `total_comentarios`,
 1 AS `total_likes_reales`*/;
SET character_set_client = @saved_cs_client;

--
-- Temporary view structure for view `v_reportes_por_categoria`
--

DROP TABLE IF EXISTS `v_reportes_por_categoria`;
/*!50001 DROP VIEW IF EXISTS `v_reportes_por_categoria`*/;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `v_reportes_por_categoria` AS SELECT 
 1 AS `categoria`,
 1 AS `total`,
 1 AS `pendientes`,
 1 AS `en_proceso`,
 1 AS `resueltos`,
 1 AS `promedio_likes`,
 1 AS `promedio_vistas`*/;
SET character_set_client = @saved_cs_client;

--
-- Table structure for table `zonas_seguidas`
--

DROP TABLE IF EXISTS `zonas_seguidas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `zonas_seguidas` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL,
  `nombre_zona` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `latitud` decimal(10,8) DEFAULT NULL,
  `longitud` decimal(11,8) DEFAULT NULL,
  `radio_km` decimal(5,2) DEFAULT '5.00',
  `fecha_creacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user` (`user_id`),
  CONSTRAINT `zonas_seguidas_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `usuarios` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zonas_seguidas`
--

LOCK TABLES `zonas_seguidas` WRITE;
/*!40000 ALTER TABLE `zonas_seguidas` DISABLE KEYS */;
INSERT INTO `zonas_seguidas` VALUES (1,7,'Semáforo caído en Av. Tacha - Av. Tacha con Calle Arica',-18.01450000,-70.24950000,5.00,'2025-11-22 13:50:13'),(2,7,'fwe - Residencial Villa del Sol, Jesús María, Tacna, 23003, Perú',-18.01801526,-70.23490906,5.00,'2025-11-23 03:38:01'),(3,19,'Pistas en construcción - 845, Calle 28 de Julio, Virgen del Carmen, Tacna, 23001, Perú',-18.00829439,-70.25366843,5.00,'2025-11-24 15:22:46'),(4,7,'No hay luz en toda la zona de la UNJBG - UNJBG, Avenida Miraflores, Urbanización La Rueda, Jesús María, Tacna, 23003, Perú',-18.02332313,-70.24922132,5.00,'2025-11-24 20:13:43');
/*!40000 ALTER TABLE `zonas_seguidas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Final view structure for view `v_almacenamiento_usuarios`
--

/*!50001 DROP VIEW IF EXISTS `v_almacenamiento_usuarios`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_almacenamiento_usuarios` AS select `u`.`id` AS `id`,`u`.`nombre` AS `nombre`,`u`.`username` AS `username`,count(`a`.`id`) AS `total_archivos`,coalesce(sum(`a`.`tamanio`),0) AS `espacio_usado_bytes`,round(((coalesce(sum(`a`.`tamanio`),0) / 1024) / 1024),2) AS `espacio_usado_mb` from (`usuarios` `u` left join `archivos_subidos` `a` on((`u`.`id` = `a`.`user_id`))) group by `u`.`id`,`u`.`nombre`,`u`.`username` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_estadisticas_usuario`
--

/*!50001 DROP VIEW IF EXISTS `v_estadisticas_usuario`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_estadisticas_usuario` AS select `u`.`id` AS `id`,`u`.`nombre` AS `nombre`,`u`.`username` AS `username`,`u`.`email` AS `email`,`u`.`tipo` AS `tipo`,`u`.`is_banned` AS `is_banned`,`u`.`fecha_registro` AS `fecha_registro`,count(distinct `r`.`id`) AS `total_reportes`,coalesce(sum(`r`.`likes`),0) AS `total_likes`,coalesce(sum(`r`.`vistas`),0) AS `total_vistas`,count(distinct `c`.`id`) AS `total_comentarios` from ((`usuarios` `u` left join `reportes` `r` on((`u`.`id` = `r`.`user_id`))) left join `comentarios` `c` on((`u`.`id` = `c`.`user_id`))) group by `u`.`id` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_notificaciones_completas`
--

/*!50001 DROP VIEW IF EXISTS `v_notificaciones_completas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_notificaciones_completas` AS select `n`.`id` AS `id`,`n`.`user_id` AS `user_id`,`n`.`tipo` AS `tipo`,`n`.`titulo` AS `titulo`,`n`.`descripcion` AS `descripcion`,`n`.`reporte_id` AS `reporte_id`,`n`.`from_user_id` AS `from_user_id`,`n`.`categoria` AS `categoria`,`n`.`ubicacion` AS `ubicacion`,`n`.`is_read` AS `is_read`,`n`.`fecha_creacion` AS `fecha_creacion`,`r`.`titulo` AS `reporte_titulo`,`r`.`imagen_url` AS `reporte_imagen`,`r`.`estado` AS `reporte_estado`,`u_to`.`nombre` AS `destinatario_nombre`,`u_to`.`username` AS `destinatario_username`,`u_from`.`nombre` AS `remitente_nombre`,`u_from`.`username` AS `remitente_username` from (((`notificaciones` `n` left join `reportes` `r` on((`n`.`reporte_id` = `r`.`id`))) join `usuarios` `u_to` on((`n`.`user_id` = `u_to`.`id`))) left join `usuarios` `u_from` on((`n`.`from_user_id` = `u_from`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_reportes_completos`
--

/*!50001 DROP VIEW IF EXISTS `v_reportes_completos`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_reportes_completos` AS select `r`.`id` AS `id`,`r`.`user_id` AS `user_id`,`r`.`titulo` AS `titulo`,`r`.`contenido` AS `contenido`,`r`.`categoria` AS `categoria`,`r`.`ubicacion` AS `ubicacion`,`r`.`latitud` AS `latitud`,`r`.`longitud` AS `longitud`,`r`.`imagen_url` AS `imagen_url`,`r`.`estado` AS `estado`,`r`.`vistas` AS `vistas`,`r`.`likes` AS `likes`,`r`.`fecha_creacion` AS `fecha_creacion`,`r`.`fecha_actualizacion` AS `fecha_actualizacion`,`u`.`nombre` AS `autor_nombre`,`u`.`username` AS `autor_username`,`u`.`tipo` AS `autor_tipo`,(select count(0) from `comentarios` where (`comentarios`.`reporte_id` = `r`.`id`)) AS `total_comentarios`,(select count(0) from `likes_reportes` where (`likes_reportes`.`reporte_id` = `r`.`id`)) AS `total_likes_reales` from (`reportes` `r` join `usuarios` `u` on((`r`.`user_id` = `u`.`id`))) */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;

--
-- Final view structure for view `v_reportes_por_categoria`
--

/*!50001 DROP VIEW IF EXISTS `v_reportes_por_categoria`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = utf8mb4 */;
/*!50001 SET character_set_results     = utf8mb4 */;
/*!50001 SET collation_connection      = utf8mb4_0900_ai_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=`root`@`%` SQL SECURITY DEFINER */
/*!50001 VIEW `v_reportes_por_categoria` AS select `reportes`.`categoria` AS `categoria`,count(0) AS `total`,sum((case when (`reportes`.`estado` = 'pendiente') then 1 else 0 end)) AS `pendientes`,sum((case when (`reportes`.`estado` = 'en_proceso') then 1 else 0 end)) AS `en_proceso`,sum((case when (`reportes`.`estado` = 'resuelto') then 1 else 0 end)) AS `resueltos`,avg(`reportes`.`likes`) AS `promedio_likes`,avg(`reportes`.`vistas`) AS `promedio_vistas` from `reportes` group by `reportes`.`categoria` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-11-26 20:00:03