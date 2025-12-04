# ARQUITECTURA DE CONTENIDO - SigmaForo

Fecha: 2025-12-04

Documento que describe la arquitectura de contenido del proyecto SigmaForo: modelos de contenido, taxonomías, plantillas, ciclo de vida editorial, mapeo a la API y recomendaciones.

**Resumen rápido**
- Contenido principal: *Reportes ciudadanos* (objetos ricos: título, descripción, imágenes, ubicación, hashtags, estado).
- Actores: *Usuarios* (anónimo / registrado / admin) que crean, interactúan y moderan contenido.
- Canal de publicación: frontend (HTML + JS) consume API REST en `/api/*` y muestra plantillas: feed, detalle, mapa, admin.

---

**1. Modelos de contenido (Content Types)**

- **Reporte (report)**
  - Propósito: Registro de un incidente/observación ciudadana.
  - Campos principales:
    - `id`, `user_id`, `titulo`, `contenido`, `categoria`, `estado`, `ubicacion`, `latitud`, `longitud`, `imagen_url`, `vistas`, `likes`, `hashtags_array`, `fecha_creacion`, `fecha_actualizacion`
  - Relaciones: pertenece a `usuario`; tiene muchos `comentarios`; puede referenciar `archivos_subidos`.
  - Endpoint principal: `POST /api/reports.php?action=create`, `GET /api/reports.php?action=list`, `GET /api/reports.php?action=get`.

- **Usuario (user)**
  - Propósito: actor que crea y modera contenido.
  - Campos: `id`, `nombre`, `email`, `username`, `password_hash`, `tipo` (admin/registrado/anonimo), `avatar_url`, `ubicacion`, `biografia`, `is_banned`, `fecha_registro`.
  - Endpoints: `auth.php` (login/register/profile), `users.php` (list/ban/unban).

- **Comentario (comment)**
  - Campos: `id`, `reporte_id`, `user_id`, `contenido`, `fecha_creacion`.
  - Endpoint: `comments.php?action=create`, `comments.php?action=list`.

- **Archivo Subido (uploaded_file)**
  - Campos: `id`, `user_id`, `nombre_original`, `ruta`, `tipo` (imagen_reporte/avatar/otro), `tamanio`, `fecha_subida`.
  - Endpoint de subida: `uploads.php?action=image`.

- **Notificación (notification)**
  - Campos: `id`, `user_id`, `tipo`, `titulo`, `descripcion`, `reporte_id`, `is_read`, `fecha_creacion`.
  - Endpoint: `notifications.php?action=list|count|mark-read|mark-all-read`.

- **Hashtag / Tendencia**
  - Representación: tabla/estructura para conteo (trending) y relación con `reportes` por `hashtags_array`.
  - Endpoint: `trending.php?action=top`

- **Zona / Área (zone)**
  - Uso para filtros geográficos y agrupar reportes; endpoint: `zones.php`.

---

**2. Taxonomías y vocabularios**

- **Categorías (category)**: seguridad, infraestructura, vías, servicios, medio_ambiente, etc. (enum en DB).
- **Estados de contenido (status)**: pendiente, en_revision, en_proceso, resuelto.
- **Hashtags**: libre, indexados para trending.
- **Zonas/Áreas**: geográficas (pueden tener nombre y polígonos si se extiende).
- **Roles de usuario**: anonimo, registrado, admin.

---

**3. Mapeo a la base de datos y API**

- `reportes` ↔ API: `reports.php`
- `usuarios` ↔ API: `auth.php`, `users.php`
- `comentarios` ↔ API: `comments.php`
- `archivos_subidos` ↔ API: `uploads.php`
- `notificaciones` ↔ API: `notifications.php`
- `tendencias` ↔ API: `trending.php`
- `configuracion_usuario` ↔ API: `settings.php`

Ejemplo de representación JSON de un `reporte` (response de la API):

```json
{
  "id": 123,
  "user_id": 7,
  "titulo": "Bache grande en Av. Principal",
  "contenido": "Un bache que representa riesgo en la cuadra 5...",
  "categoria": "vias",
  "estado": "pendiente",
  "ubicacion": "Av. Principal 123",
  "latitud": -18.0146,
  "longitud": -70.2506,
  "imagen_url": "https://res.cloudinary.com/.../report.jpg",
  "hashtags_array": ["bache","vias"],
  "vistas": 42,
  "likes": 7,
  "fecha_creacion": "2025-11-24T20:00:00Z"
}
```

---

**4. Plantillas y componentes de contenido (UI mapping)**

- **Feed / Lista de reportes** (dashboard.html)
  - Componente: `report-card` (avatar, author, time, categoria badge, estado badge, title, excerpt, image, location, stats, actions)
  - Data source: `GET /api/reports.php?action=list` (paginated)

- **Detalle de reporte** (reporte-detalle.html)
  - Componente: `report-detail` (header badges, full content, image gallery, map, comments list, actions)
  - Data source: `GET /api/reports.php?action=get&id=...` and `GET /api/comments.php?action=list&report_id=...`

- **Mapa popup** (mapa.html)
  - Componente: `map-marker-popup` (mini card similar a `report-card` but compacto)
  - Data source: same `reports.php?action=list`

- **Admin table** (admin-reports.html)
  - Componente: `admin-report-row` (checkbox, title, author, status, category, stats, actions)
  - Data source: `reports.php?action=list&limit=...` + server-side filtering

- **Card de tendencias** (sidebar / modal)
  - Componente: `trending-item` (rank, hashtag, count)
  - Data source: `trending.php?action=top`

- **Profile & My Reports**
  - `profile-summary`, `user-report-list`
  - Data sources: `auth.php?action=profile`, `reports.php?action=my-reports`

- **Modales**
  - `create-report-modal`, `login-modal`, `register-modal`, `change-status-modal`
  - Acción → API y luego re-render del componente afectado

---

**5. Ciclo de vida del contenido (Editorial workflow)**

- **Creación**
  - Actor: registrado (o anónimo con limitaciones)
  - UI: `create-report-modal` → validación client-side → `uploads.php` (imagen) → `reports.php?action=create`

- **Moderación / Revisión**
  - Actor: admin
  - Estado de objeto: `pendiente` → admin puede `aprobar` (estado -> en_proceso/resuelto) o `marcar_como_falso` o `eliminar`.
  - UI: admin dashboard, bulk actions (select multiple)

- **Publicación**
  - Tras aprobación el reporte se muestra en el feed público (ya se publica instantáneamente al crear, pero su estado controla visibilidad de acciones de moderación).

- **Actualización / Edición**
  - Autor o admin puede editar; cambios actualizan `fecha_actualizacion`.
  - API: `reports.php?action=update&id=...` (PUT)

- **Eliminación / Archivado**
  - Admin puede eliminar permanentemente (`DELETE`), o realizar soft-delete (no implementado por defecto).

- **Notificaciones**
  - Eventos: nuevo comentario, cambio de estado, like, nuevo reporte en zona seguida.
  - Emisión: `notifications.php` registra y consulta notificaciones; frontend muestra badge y dropdown.

---

**6. Reglas de contenido y validaciones**

- Campos obligatorios: `titulo`, `contenido`, `categoria`, `ubicacion`.
- Imagen: tipo image/*, tamaño ≤ 5MB.
- Hashtags: extracción/normalización en frontend/backend (lowercase, sin espacios).
- Geo: lat/lng opcionales pero permiten geolocalización y mapeo; si faltan, mostrar coordenadas o texto de ubicación.
- Moderación: admin puede cambiar `estado` y borrar contenido.

---

**7. SEO, metadatos y social previews**

- Metadata por recurso `reporte`: `meta title` = `${titulo} - SigmaForo`, `meta description` = primer 160 chars de `contenido`, `og:image` = `imagen_url` si existe, `canonical` = URL detalle.
- Rutas amigables: usar `reporte-detalle.html?id=...` (si se migra a SSR o a routing limpio, usar `/reportes/:id` para SEO mejor).

---

**8. Búsqueda, filtrado y ordenación**

- Búsqueda full-text simple se hace con `reports.php?action=list&search=...`.
- Filtrado por `categoria`, `estado`, `zona`.
- Orden por `fecha_creacion`, `likes`, `vistas`.
- Paginación en backend (recommended) con `limit` y `offset`.

---

**9. Métricas y analítica de contenido**

- Eventos a rastrear: creación de reporte, views, likes, comentarios, shares, conversiones (registro luego de ver landing).
- Guardar métricas mínimas: `vistas`, `likes`, `total_comentarios` (ya presentes).
- Recomendar: integrar Google Analytics/Measurement/own telemetry para métricas agregadas y trending detection.

---

**10. Mejores prácticas y recomendaciones**

- Añadir **versionado** o audit trail para `reportes` (quién editó qué y cuándo).
- Implementar **soft-delete** en `reportes` y `comentarios` para auditoría.
- Añadir **scheduled publishing** si se requiere contenido programado.
- Normalizar hashtags y crear tabla relacional `report_hashtags` para consultas y trending más eficientes.
- Añadir **excerpt** y `meta_description` en `reportes` para mejorar SEO y compartir en redes.
- Añadir `alt` text obligatorio para imágenes subidas (UI debe pedirlo) y guardarlo en `archivos_subidos`.
- Considerar un **Headless CMS** (Strapi, Directus) si el volumen editorial crece; permitiría flujos editoriales y ACL más ricos.
- Mejorar búsqueda con motor (ElasticSearch/MeiliSearch) si el dataset crece.

---

**11. Mapa rápido de responsabilidad (quién hace qué)**

- Autor (usuario registrado): crear, editar sus reportes, comentar, dar like.
- Anónimo: crear con limitaciones, ver contenido.
- Admin: moderar, aprobar, cambiar estado, banear usuarios, eliminar contenido.
- Sistema: extraer hashtags, enviar notificaciones, almacenar métricas.

---

**12. ¿Qué puedo hacer ahora? (Siguientes pasos recomendados)**
- Si quieres, genero un **diagrama ER** simple para las tablas relacionadas con contenido.
- Puedo añadir un **módulo de versionado** en `reports.php` con esquema SQL propuesto.
- Puedo proponer una **migración** para normalizar hashtags (crear `hashtags` y `report_hashtags`).

---

Archivo generado: `ARQUITECTURA_CONTENIDO.md`

¿Quieres que genere el ER diagram o el script de migración para normalizar hashtags ahora?  
Si sí, dime si prefieres SQL (MySQL) o una descripción visual (ASCII/Markdown).