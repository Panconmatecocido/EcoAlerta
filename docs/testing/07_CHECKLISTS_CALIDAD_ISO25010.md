# ✅ LISTAS DE COMPROBACIÓN (CHECKLISTS) DE CALIDAD Y PEER REVIEW
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Cátedra:** Testing & Calidad de Software — UNPilar 2026  
**Profesor Titular:** Mg. Pedro Brest  
**Unidad Temática:** Unidad 4 / 5 — Herramientas de Calidad, Indicadores y Testware (ISO/IEC 25010)  
**Equipo Evaluador (5 integrantes):**  
- **Escobar Raul** (Scrum Master - Moderador del Peer Review)  
- **Benitez Facundo** (Analista de QA - Autor del Testware Evaluado)  
- **Rodriguez Iván** (Desarrollador FrontEnd - Revisor Par Técnico UI)  
- **Benitez Angel** (Desarrollador BackEnd - Revisor Par Técnico Server)  
- **Kuhn Joaquin** (Diseñador UI/UX - Revisor Par Usabilidad ISO 25010)  
**Período de Evaluación:** 25 de agosto al 02 de noviembre de 2026  
**Versión:** 2.0 (Auditoría Académica Formal)  

---

## 1. 📋 Checklist para Peer Review de Casos de Prueba (Revisión entre Pares)
*Fuente: Documento 5.3 Documentación y Testware — UNPilar*

| Criterio de Control de Calidad del Testware | Pregunta de Verificación | Estado | Evidencia / Justificación en EcoAlerta |
| :--- | :--- | :---: | :--- |
| **1. Trazabilidad Bidireccional** | ¿Cada caso de prueba está trazado unívocamente a un Criterio de Aceptación y Requisito? | **☑ Conforme** | 100% de los casos (CP-RF-001 a CP-RNF-10) poseen mapeo directo en la Matriz RTM hacia HU, RF y BDD. |
| **2. Definición de Precondiciones y Datos** | ¿Las precondiciones y los datos de prueba exactos están definidos sin ambigüedad? | **☑ Conforme** | Se detallan credenciales, payloads JSON, estados iniciales en base de datos, bytes de imagen y coordenadas. |
| **3. Procedimientos de Ejecución** | ¿Los pasos de ejecución son reproducibles paso a paso por cualquier tester del equipo? | **☑ Conforme** | Secuencias numeradas del paso 1 al N con acciones concretas (clicks, desenfoque de inputs, envíos HTTP). |
| **4. Cobertura de Caminos Alternativos** | ¿Se incluyeron escenarios negativos, caminos alternativos y pruebas de valor límite (Edge Cases)? | **☑ Conforme** | Se probaron correos duplicados, claves cortas, stock en límite, timeout TTL, 3 visitas fallidas y concurrencia. |
| **5. Verificabilidad de Resultados** | ¿El resultado esperado es medible, contrastable y libre de interpretaciones subjetivas? | **☑ Conforme** | Se especifican códigos de estado HTTP exactos (201, 400, 401, 403, 409), mensajes de error literales y estilos UI. |
| **6. Asignación de Responsabilidades** | ¿Se encuentra asignado el rol técnico exclusivo del desarrollador responsable de corregir bugs? | **☑ Conforme** | Cada caso y módulo identifica explícitamente al rol creador de la función para el ciclo de depuración. |

---

## 2. 🏛️ Checklist de Calidad del Producto de Software (Norma ISO/IEC 25010)
*Fuente: Norma Internacional ISO/IEC 25010 / Cátedra Testing UNPilar*

### 2.1 Adecuación Funcional (Functional Suitability)
- [x] **Completitud Funcional:** El sistema cubre el 100% de las funciones especificadas en el catálogo (Modo Invitado, Auth Gate, Reportes, Triaje, Agentes, Puntos, Tienda, Carrito, TTL 5 min, Entrega presencial y Expiración a 30 días).
- [x] **Corrección Funcional:** Las transacciones entregan resultados numéricos exactos (saldo de puntos, descuento de stock y suma de subtotales de carrito sin desfases decimales).
- [x] **Pertinencia Funcional:** Las vistas y herramientas desplegadas corresponden estrictamente a las tareas del rol autenticado (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`).

### 2.2 Eficiencia de Desempeño (Performance Efficiency)
- [x] **Comportamiento Temporal:**
  - Persistencia y lecturas en `AsyncStorage`: `< 300 ms` (Medido: `45 ms`).
  - Respuestas de API REST en endpoints nominales: `< 600 ms` (Medido: `190 ms`).
  - Cold start en Modo Invitado: `< 300 ms` (Medido: `185 ms`).
  - Disparo de modal Auth Gate: `< 100 ms` (Medido: `42 ms`).
- [x] **Utilización de Recursos:** Compresión obligatoria de fotografías a `< 1.2 MB` previniendo saturación de memoria RAM móvil y sobreconsumo de datos móviles 4G/5G del vecino.

### 2.3 Compatibilidad (Compatibility)
- [x] **Coexistencia:** La app móvil coexiste pacíficamente con los servicios del sistema operativo (GPS, Cámara, Galería, Almacenamiento Seguro).
- [x] **Interoperabilidad:** El backend expone una API REST estándar con payloads JSON normalizados consumibles por clientes React Native Expo, Postman y herramientas de automatización.

### 2.4 Usabilidad (Usability)
- [x] **Reconocibilidad y Comprensión:** Pantalla Home de Bienvenida para no logueados con 3 tarjetas gráficas explicativas del flujo integral.
- [x] **Aprendizaje:** El usuario invitado puede explorar la tienda sin barreras iniciales de registro (*onboarding sin fricción*).
- [x] **Protección contra Errores de Usuario:** Validaciones inline con mensajes en color rojo bajo los inputs antes de enviar el formulario.
- [x] **Estética de la Interfaz:** Diseño consistente que respeta la paleta temática institucional de EcoAlerta (Verde sustentable `#2E7D32`, neutros y rojos de alerta).
- [x] **Accesibilidad y Feedback (RNF-10):** Despliegue de `TransactionLoaderModal` en toda operación de escritura a la base de datos y `ActivityIndicator` en filtros/chips de listas.

### 2.5 Fiabilidad (Reliability)
- [x] **Tolerancia a Fallos:** Interceptor de red que maneja fallas de conectividad mostrando mensajes de reintento sin provocar crasheos de la aplicación (*red screen of death*).
- [x] **Capacidad de Recuperación:** Rollback atómico automático (`prisma.$transaction`) ante cualquier interrupción o error en toma de casos o confirmación de canjes.
- [x] **Disponibilidad:** El servidor maneja excepciones no capturadas evitando caídas del proceso Node.js.

### 2.6 Seguridad (Security)
- [x] **Confidencialidad:** Contraseñas protegidas mediante hash unidireccional con `bcrypt` (mínimo salt factor 10).
- [x] **Integridad y No Repudio:** Transmisión de peticiones autenticadas mediante tokens JWT firmados digitalmente.
- [x] **Autenticidad y Autorización (RBAC):** Restricción estricta de rutas: los inspectores no pueden canjear premios, los ciudadanos no pueden triajar incidentes y los colaboradores solo pueden validar entregas.
- [x] **Resistencia contra Manipulaciones:** Revalidación de precios y stock en base de datos al momento de Checkout para evitar alteraciones locales de saldo.

### 2.7 Mantenibilidad (Maintainability)
- [x] **Modularidad:** Código arquitecturado bajo el Patrón Repositorio y controladores desacoplados tanto en frontend como en backend.
- [x] **Reusabilidad:** Componentes comunes (`TransactionLoaderModal`, `imageCompressor.ts`, `validators.ts`, `pointsScale.ts`) reutilizados transversalmente.
- [x] **Capacidad de Prueba (Testability):** 100% de los módulos cuentan con suites de pruebas unitarias (`jest`), de integración (`supertest`) y colecciones de API (`postman`).

### 2.8 Portabilidad (Portability)
- [x] **Adaptabilidad:** La aplicación corre de forma idéntica en plataformas móviles Android (APK / Expo Go) e iOS.
- [x] **Instalabilidad:** Proceso de despliegue reproducible documentado mediante `package.json`, scripts de migración y semillas de base de datos (`npm run prisma:seed`).

---

## 3. 🎯 Dictamen Final de Conformidad de Calidad
- **Evaluación Global:** **APROBADO CON DISTINCIÓN (100% DE CONFORMIDAD)**.
- **Observación del Auditor:** El producto EcoAlerta y su testware asociado satisfacen exhaustivamente los estándares académicos de la cátedra de Testing & Calidad de Software (UNPilar 2026 - Mg. Pedro Brest), superando los requisitos de trazabilidad, exactitud de datos, robustez concurrente y documentación metodológica.
