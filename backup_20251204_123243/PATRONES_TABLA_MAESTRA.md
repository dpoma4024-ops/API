# TABLA MAESTRA: TODOS LOS 17 PATRONES DE DISEÑO

## Tabla Completa (Clasificación Gang of Four)

| ID | CLASIFICACIÓN | PATRÓN | ARCHIVO | LÍNEA | DESCRIPCIÓN | CÓDIGO EJEMPLO |
|---|---|---|---|---|---|---|
| 1 | 🔵 CREACIONAL | Factory | mobile-experience.js | 14-77 | Crea componentes UI dinámicamente | `createBottomNavigation()` |
| 2 | 🔵 CREACIONAL | Singleton | app.js | 49-78 | Única instancia de peticiones API | `apiRequest(endpoint, options)` |
| 3 | 🔵 CREACIONAL | Constructor | app.js | 268-295 | Inicializa elementos con propiedades | `document.createElement('div')` |
| 4 | 🔵 CREACIONAL | Object Literal | app.js | 318-328 | Mapeos reutilizables de configuración | `const colors = {...}` |
| 5 | 🟢 ESTRUCTURAL | Adapter | app.js | 49-78 | Adapta fetch() a apiRequest() | Headers + Auth automáticos |
| 6 | 🟢 ESTRUCTURAL | Module | Todos (*.js) | - | Encapsula datos + funciones por módulo | Variables privadas del módulo |
| 7 | 🟢 ESTRUCTURAL | Facade | app.js | 213-240 | Interfaz simple para operaciones complejas | `openModal()`, `closeModal()` |
| 8 | 🟢 ESTRUCTURAL | Decorator | app.js | 503-572 | Añade decoraciones dinámicas | Avatares + badges + estilos |
| 9 | 🟢 ESTRUCTURAL | Composite | app.js | 501-605 | Compone reportes = header + content + footer | Estructura jerárquica de componentes |
| 10 | 🔴 COMPORTAMIENTO | Observer | app.js | 255-263 | Elementos observan y reaccionan a eventos | `window.onclick`, `addEventListener()` |
| 11 | 🔴 COMPORTAMIENTO | Strategy | tendencias-functions.js | 47-80 | Estrategias diferentes de renderizado | `showTrendingLoading()` vs `showTrendingEmpty()` |
| 12 | 🔴 COMPORTAMIENTO | Template Method | app.js | 430-470 | Estructura fija de algoritmo con variaciones | Verificar → Cargar → Renderizar → Error |
| 13 | 🔴 COMPORTAMIENTO | State | localStorage | - | Comportamiento cambia por estado usuario | User Type: anónimo/registrado/admin |
| 14 | 🔴 COMPORTAMIENTO | Command | HTML | - | Encapsula acciones como objetos invocables | `onclick="likeReport(id)"` |
| 15 | 🔴 COMPORTAMIENTO | Chain of Responsibility | admin-functions.js | 208-270 | Cadena de filtros: búsqueda → estado → categoría | Filter → Filter → Filter |
| 16 | 🔴 COMPORTAMIENTO | Mediator | app.js | 213-240 | Centraliza comunicación entre componentes | `switchModal(from, to)` |
| 17 | 🔴 COMPORTAMIENTO | Iterator | admin-functions.js | 250-290 | Acceso secuencial a colecciones | `.map()`, `.filter()` sobre reportes |

---

## Tabla por Tipo de Patrón

### 🔵 CREACIONALES (4)

| Patrón | Ubicación | Propósito | Ventaja |
|--------|-----------|----------|---------|
| Factory | mobile-experience.js:14 | Crear componentes | Encapsula lógica de creación |
| Singleton | app.js:49 | Única instancia de API | Consistencia global |
| Constructor | app.js:268 | Inicializar elementos | Propiedades predecibles |
| Object Literal | app.js:318 | Mapeos configurables | Reutilizable y mantenible |

### 🟢 ESTRUCTURALES (5)

| Patrón | Ubicación | Propósito | Ventaja |
|--------|-----------|----------|---------|
| Adapter | app.js:49 | Normalizar API | Interface consistente |
| Module | Todos | Encapsular datos | Privacidad + Organización |
| Facade | app.js:213 | Simplificar operaciones | Interface simple |
| Decorator | app.js:503 | Añadir comportamiento | Flexibilidad sin cambios |
| Composite | app.js:501 | Composición jerárquica | Estructura escalable |

### 🔴 COMPORTAMIENTO (8)

| Patrón | Ubicación | Propósito | Ventaja |
|--------|-----------|----------|---------|
| Observer | app.js:255 | Reactividad a eventos | Desacoplamiento |
| Strategy | tendencias-functions.js:47 | Algoritmos intercambiables | Flexibilidad |
| Template Method | app.js:430 | Estructura de algoritmo | Predictibilidad |
| State | localStorage | Comportamiento por estado | Adaptabilidad |
| Command | HTML eventos | Encapsular acciones | Reutilizable |
| Chain of Responsibility | admin-functions.js:208 | Procesamiento en cadena | Separación de responsabilidades |
| Mediator | app.js:213 | Comunicación centralizada | Desacoplamiento |
| Iterator | admin-functions.js:250 | Acceso secuencial | Abstracción de colecciones |

---

## Matriz de Relaciones

```
┌─────────────────────────────────────────────────────────────────┐
│ DEPENDENCIAS Y RELACIONES ENTRE PATRONES                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Factory ──────────┐                                            │
│  Constructor ──────┼──> Module (encapsula creación)             │
│  Singleton ────────┘                                            │
│                                                                  │
│  Adapter ─────────────> Singleton (comunica vía API)            │
│                                                                  │
│  Facade ─────────────> Adapter (simplifica uso de API)          │
│                                                                  │
│  Decorator ────┐                                                │
│  Composite ────┼──> Observer (reacciona a cambios)              │
│  Strategy ─────┘                                                │
│                                                                  │
│  State ─────────────> Command (ejecuta según estado)            │
│                                                                  │
│  Template Method ──> Chain of Responsibility (estructura)       │
│                                                                  │
│  Mediator ─────────> Observer (comunica componentes)            │
│                                                                  │
│  Iterator ─────────> Strategy (múltiples formas de iterar)      │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Análisis de Densidad por Archivo

```
app.js (1307 líneas)
├─ Patrones implementados: 13
├─ Densidad: 1 patrón por ~100 líneas
├─ Complejidad: MUY ALTA ⚠️ (Consolidar en módulos)
└─ Criticidad: CENTRAL ✓

admin-functions.js (1366 líneas)
├─ Patrones implementados: 4
├─ Densidad: 1 patrón por ~340 líneas
├─ Complejidad: MEDIA
└─ Criticidad: MODERADA

mobile-experience.js (514 líneas)
├─ Patrones implementados: 4
├─ Densidad: 1 patrón por ~130 líneas
├─ Complejidad: MEDIA
└─ Criticidad: ESPECÍFICA (móvil)

tendencias-functions.js (349 líneas)
├─ Patrones implementados: 2
├─ Densidad: 1 patrón por ~175 líneas
├─ Complejidad: BAJA
└─ Criticidad: ESPECÍFICA

notifications.js (347 líneas)
├─ Patrones implementados: 3
├─ Densidad: 1 patrón por ~115 líneas
├─ Complejidad: MEDIA
└─ Criticidad: IMPORTANTE

Otros archivos
├─ Patrones implementados: 1 cada uno (Module)
├─ Densidad: BAJA
├─ Complejidad: BAJA
└─ Criticidad: ESPECÍFICA
```

---

## Flujo de Patrones en una Petición HTTP

```
Usuario hace clic
    ↓
Command Pattern (onclick="...")
    ↓
Mediator (switchModal si es necesario)
    ↓
State Pattern (¿usuario autenticado?)
    ↓
Facade (showToast "Procesando...")
    ↓
Singleton: apiRequest() ──→ Adapter (Normaliza fetch)
    ↓
Observer Pattern (Respuesta llega)
    ↓
Strategy Pattern (¿Qué renderizar?)
    ↓
Template Method (Cargar → Procesar → Renderizar)
    ↓
Composite Pattern (Actualizar estructura DOM)
    ↓
Decorator Pattern (Aplicar estilos dinámicos)
    ↓
Module Pattern (Guardar estado privado)
    ↓
Iterator Pattern (map/filter sobre resultados)
    ↓
Usuario ve cambios
```

---

## Matriz de Interacción

```
                 | Factory | Singleton | Adapter | Module | Observer | State |
                 |---------|-----------|---------|--------|----------|-------|
Factory          |    -    |     ✓     |    ✓    |   ✓    |    ✓     |   -   |
Singleton        |    ✓    |     -     |    ✓    |   ✓    |    ✓     |   -   |
Adapter          |    ✓    |     ✓     |    -    |   ✓    |    ✓     |   -   |
Module           |    ✓    |     ✓     |    ✓    |   -    |    ✓     |   ✓   |
Facade           |    -    |     -     |    ✓    |   ✓    |    -     |   -   |
Decorator        |    -    |     -     |    -    |   ✓    |    ✓     |   -   |
Composite        |    ✓    |     -     |    -    |   ✓    |    ✓     |   -   |
Observer         |    ✓    |     ✓     |    ✓    |   ✓    |    -     |   ✓   |
Strategy         |    -    |     -     |    -    |   ✓    |    -     |   ✓   |
Template Method  |    -    |     -     |    -    |   ✓    |    ✓     |   ✓   |
Command          |    -    |     -     |    -    |   -    |    -     |   ✓   |
Chain of Resp.   |    -    |     -     |    -    |   ✓    |    -     |   -   |
Mediator         |    -    |     -     |    -    |   ✓    |    ✓     |   -   |
Iterator         |    -    |     -     |    -    |   ✓    |    -     |   -   |

✓ = Interactúan frecuentemente
- = No se utilizan juntos típicamente
```

---

## Hoja de Referencia Rápida

```
¿CÓMO crear un objeto?
  → Usa Factory o Constructor Pattern

¿CÓMO mantener una única instancia?
  → Usa Singleton Pattern

¿CÓMO normalizar una interfaz externa?
  → Usa Adapter Pattern

¿CÓMO encapsular datos privados?
  → Usa Module Pattern

¿CÓMO simplificar operaciones complejas?
  → Usa Facade Pattern

¿CÓMO añadir funcionalidad dinámicamente?
  → Usa Decorator Pattern

¿CÓMO reaccionar a eventos?
  → Usa Observer Pattern

¿CÓMO usar algoritmos intercambiables?
  → Usa Strategy Pattern

¿CÓMO definir estructura de un proceso?
  → Usa Template Method Pattern

¿CÓMO adaptar comportamiento a estado?
  → Usa State Pattern

¿CÓMO encapsular acciones?
  → Usa Command Pattern

¿CÓMO procesar a través de filtros?
  → Usa Chain of Responsibility Pattern

¿CÓMO centralizar comunicación?
  → Usa Mediator Pattern

¿CÓMO acceder a colecciones?
  → Usa Iterator Pattern

¿CÓMO componer jerarquías?
  → Usa Composite Pattern
```

---

## Estadísticas Finales

- **Total de patrones:** 17
- **Patrones únicos:** 17 (sin repeticiones)
- **Archivos analizados:** 9
- **Líneas de código:** ~6,500
- **Densidad promedio:** 1 patrón por ~380 líneas
- **Archivo más denso:** app.js (13 patrones en 1307 líneas)
- **Patrón más usado:** Module Pattern (en todos los archivos)
- **Tipo más frecuente:** Comportamiento (8 patrones = 47%)

---

**Documento Generado:** 2025-12-03
**Versión:** 2.0 (Tabla Maestra)
**Estado:** Análisis Completo
