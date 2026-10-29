# 📊 PLANILLA DE REGISTRO DE EJECUCIÓN Y MÉTRICAS DE PROGRESO DE QA
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Cátedra:** Testing & Calidad de Software — UNPilar 2026  
**Profesor:** Mg. Pedro Brest  
**Equipo de Proyecto (5 integrantes):**  
- **Escobar Raul** (Scrum Master - Auditor y Control de Avance)  
- **Benitez Facundo** (Analista de QA - Diseñador y Ejecutor de Pruebas)  
- **Rodriguez Iván** (Desarrollador FrontEnd - Resolución de BUG-101 y UI)  
- **Benitez Angel** (Desarrollador BackEnd - Resolución de BUG-102 y BD)  
- **Kuhn Joaquin** (Diseñador UI/UX - Validación Visual y Usabilidad)  
**Estándar:** IEEE 829 / ISO 29119 Test Execution Reporting  
**Período del Proyecto:** 25 de agosto de 2026 al 02 de noviembre de 2026  
**Fecha de Corte de Ejecución:** 28 de Octubre de 2026  

---

## 1. 📈 Tablero Ejecutivo de Métricas de Calidad

### Resumen General de Requerimientos y Cobertura
- **Total Requerimientos Especificados:** 68 (47 Requisitos Funcionales y Casos de HU + 21 Requisitos No Funcionales y Criterios Técnicos).
- **Total Casos de Prueba Diseñados:** 57 Casos de Prueba Principales.
- **Total Casos de Prueba Ejecutados:** 57 Casos de Prueba (100% Cobertura de Ejecución).
- **Casos con Estado "Pasó" (Pass):** 55 Casos (96.5% Pass Rate).
- **Casos con Estado "Falló" (Fail):** 2 Casos iniciales (3.5% Fail Rate -> corregidos en ciclo de re-test).
- **Casos Bloqueados:** 0 Casos.
- **Casos No Ejecutados:** 0 Casos.

### Estado de Defectos (Bug Tracker)
- **Defectos Detectados Totales:** 2 defectos (`BUG-101` y `BUG-102`).
- **Defectos Críticos (S1) / Altos (S2) Abiertos:** 0 (Cero defectos bloqueantes en release).
- **Defectos Corregidos y Verificados:** 2 (100% de resolución de anomalías detectadas).

---

## 2. 📋 Planilla Maestra de Ejecución de Pruebas

| ID Caso | Fecha Ejecución | Ejecutado Por (Rol) | Estado | Prioridad | Herramienta | Reintentos / Fallos | Evidencia / Log | Observaciones y Hallazgos | Responsable Corrección Bug (Rol) |
| :--- | :---: | :--- | :---: | :---: | :---: | :---: | :--- | :--- | :--- |
| `CP-RF-AUT-01-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261024-01` | Registro nominal 201 Created con rol CITIZEN y 0 pts. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-01-02` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261024-02` | Rechazo 409 Conflict con mensaje exacto de duplicidad. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-02-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-JEST-VAL-01` | Regex RFC 5322 bloquea inputs sin formato y pinta borde rojo. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-02-02` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-JEST-VAL-02` | Discrepancia detectada; mensaje "Las contraseñas no coinciden." | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-02-03` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-JEST-VAL-03` | Longitud < 6 bloqueada con mensaje específico. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-03-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261024-03` | Login 200 OK emitiendo JWT con expiración de 7 días. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-03-02` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261024-04` | 401 Unauthorized ante password errónea con banner rojo. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-04-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Manual | 0 | `E2E-NAV-ROLES-01` | Enrutamiento dinámico a pantalla de cada rol verificado. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-05-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-ASYNC-STORE-01`| Persistencia en AsyncStorage validada tras reinicio simulado. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-06-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Profiler| 0 | `PERF-COLD-START-01` | Cold start en 185 ms (< 300 ms SLA) en Modo Invitado. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-06-02` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Manual / Expo | 0 | `UI-CTA-HEADER-01` | Botón verde de cabecera navega fluidamente a registro. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-07-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Manual / Expo | 0 | `UI-GUEST-STORE-01` | Catálogo explorable por invitados sin permitir compra. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-08-01` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Manual | 0 | `SEC-AUTH-GATE-01` | Botón Cámara interceptado en 42 ms con modal protegido. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-08-02` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Manual | 0 | `SEC-AUTH-GATE-02` | Botón "Agregar al Carrito" interceptado con modal protegido. | Rodriguez Iván / Benitez Angel |
| `CP-RF-AUT-08-03` | 24/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Manual | 0 | `SEC-AUTH-GATE-03` | Pestaña Perfil interceptada con modal protegido. | Rodriguez Iván / Benitez Angel |
| `CP-RF-REP-01-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-01` | Reporte 201 Created emitiendo código `REP-2026-0045`. | Rodriguez Iván (FrontEnd) |
| `CP-RF-REP-02-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Jest | 1 (BUG-101) | `TEST-COMPRESS-01` | Foto 4.85 MB comprimida a 865 KB (< 1.2 MB). Fix verificado. | Rodriguez Iván (FrontEnd) |
| `CP-RF-REP-03-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-02` | Rechazo si lat/long es nulo o dirección < 5 caracteres. | Rodriguez Iván (FrontEnd) |
| `CP-RF-REP-04-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Prisma | 0 | `TEST-DB-STATUS-01` | Verificado estado inicial PENDIENTE y 0 puntos en BD. | Rodriguez Iván (FrontEnd) |
| `CP-RF-REP-06-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-03` | Soft delete: `ocultarUsuario = true` preservado en BD municipal. | Rodriguez Iván (FrontEnd) |
| `CP-RF-ADM-01-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-04` | Triaje: Aprobado con prioridad ALTA ingresando a la bolsa. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-02-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-05` | Triaje: Rechazado con motivo justificado y 0 ecopuntos. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-02-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-06` | Rechazo bloqueado si observaciones están vacías. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-03-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-07` | HTTP 400 "Agente no disponible" si disponible = false. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-01-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Manual | 0 | `UI-BOLSA-CASOS-01` | Casos en bolsa ordenados por prioridad (Rojo, Naranja, Verde). | Benitez Angel (BackEnd) |
| `CP-RF-AGE-02-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Postman | 0 | `LOG-API-20261025-08` | Toma de caso atómica 1 a 1 pasando a EN_VERIFICACION. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-02-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Jest / Parallel | 0 | `CONC-TOMA-CASO-01` | 2 agentes concurrentes: 1 éxito (200), 1 conflicto (409). | Benitez Angel (BackEnd) |
| `CP-RF-AGE-03-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-09` | Bloqueo al intentar tomar 2 casos simultáneos. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-05-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-10` | Caso A Real: Foto contraprueba y pasa a VERIFICADO_PENDIENTE. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-05-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-11` | Caso B Falso: Foto descargo y cierre como rechazo en terreno. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-06-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-12` | Caso C Inaccesible: Foto sticker y contador incrementa a 1 y 2. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-06-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Supertest| 0 | `TEST-3-INTENTOS-01`| Cierre automático a CERRADO_INACCESIBLE al 3.er fallo. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-04-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Postman | 0 | `LOG-API-20261025-13` | Acreditación atómica de 250 pts según baremo ALTA (200-300). | Benitez Angel (BackEnd) |
| `CP-RF-ADM-04-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-14` | Rechazo al intentar asignar 150 pts a prioridad BAJA (máx 80). | Benitez Angel (BackEnd) |
| `CP-RF-AGE-07-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-15` | Liberación de caso no verificado retorna a bolsa en APROBADO. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-07-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-REASIGN-01` | Liberación de caso verificado retorna en EN_SANEAMIENTO. | Benitez Angel (BackEnd) |
| `CP-RF-AGE-08-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-16` | Saneamiento: Subida de foto solución y pasa a RESUELTO_TECNICO. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-07-01` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261025-17` | Doble certificación: Aprobación final a RESUELTO definitivo. | Benitez Angel (BackEnd) |
| `CP-RF-ADM-07-02` | 25/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261025-18` | Certificación observada: Retorna caso a EN_SANEAMIENTO. | Benitez Angel (BackEnd) |
| `CP-RF-TIE-01-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261026-01` | ABM catálogo: Creación y edición de producto con puntos y stock. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-01-02` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Prisma | 0 | `TEST-BAJA-LOGICA-01`| Baja lógica (activo = false) preserva canjes históricos. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-02-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest | 0 | `TEST-CART-SUM-01` | Suma en vivo: TotalPuntos = Sum(Cantidad * Precio). | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-03-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Jest | 0 | `TEST-CART-LIMIT-01` | Deshabilita botón + al llegar al stock físico disponible. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-04-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman / Jest | 0 | `LOG-API-20261026-02` | Bloqueo si puntosUsuario < total: "Puntos insuficientes". | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-04-02` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Supertest| 0 | `TEST-REVALIDA-01` | Revalidación de precio en BD al abrir Checkout. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-05-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Jest / Supertest| 0 | `TEST-TTL-RESERVA-01`| Reserva provisional por 5 minutos TTL y cuenta regresiva. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-05-02` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Jest / Parallel | 1 (BUG-102) | `CONC-CHECKOUT-01` | Intento concurrente en stock = 1. Fix verificado con Prisma lock. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-05-03` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Timers | 0 | `TEST-EXPIRE-TTL-01` | Al minuto 5:01 la reserva expira y el stock vuelve a catálogo. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-05-04` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Postman | 0 | `LOG-API-20261026-03` | Canje confirmado: Descuento atómico y código `ECO-7142-N`. | Rodriguez Iván / Benitez Angel |
| `CP-RF-COL-01-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Postman | 0 | `LOG-API-20261026-04` | Colaborador busca código y confirma entrega presencial. | Rodriguez Iván / Benitez Angel |
| `CP-RF-COL-01-02` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Postman | 0 | `LOG-API-20261026-05` | Alertas en banner ante código no existente o ya entregado. | Rodriguez Iván / Benitez Angel |
| `CP-RF-TIE-06-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Supertest| 0 | `TEST-BATCH-EXPIRE-01`| A los 30 días pedido EXPIRADO: Stock se reintegra sin reembolso. | Rodriguez Iván / Benitez Angel |
| `CP-RNF-01-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest / Profiler| 0 | `PERF-LATENCY-01` | Lectura local en 45 ms (< 300 ms) y API en 190 ms (< 600 ms). | Benitez Angel (BackEnd) |
| `CP-RNF-02-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Jest | 0 | `TEST-COMPRESS-RAW-01`| Compresión de imágenes raw a buffer < 1.2 MB garantizada. | Rodriguez Iván (FrontEnd) |
| `CP-RNF-07-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Crítica | Postman / Supertest| 0 | `SEC-RBAC-AUDIT-01`| 403 Forbidden al intentar ejecutar triaje con token Citizen. | Rodriguez Iván / Benitez Angel |
| `CP-RNF-10-01` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Alta | Jest (RNTL) | 0 | `UI-LOCK-MODAL-01` | `TransactionLoaderModal` bloquea 5 clics rápidos seguidos. | Rodriguez Iván / Kuhn Joaquin |
| `CP-RNF-10-02` | 26/10/2026 | Benitez Facundo (QA) | **Pasó** | Media | Jest / Manual | 0 | `UI-SPINNER-CHIPS-01`| `ActivityIndicator` contextual desplegado en filtros de listas. | Rodriguez Iván / Kuhn Joaquin |

---

## 3. 🔍 Registro Histórico de Defectos Corregidos (Bugs Auditados)

### Defecto BUG-101
- **Caso Asociado:** `CP-RF-REP-02-01` | **Módulo:** Módulo 2A (Reporte Ciudadano)
- **Severidad:** S2 (Alta) | **Prioridad de Corrección:** Alta
- **Descripción:** Imágenes de galería en formato PNG con resolución mayor a 12 MP sobrepasaban los 1.2 MB tras el primer pase de compresión (quedaban en 1.35 MB) debido a factor de compresión estático.
- **Detectado por:** Benitez Facundo (Analista de QA)
- **Responsable de Corrección:** **Rodriguez Iván** (Desarrollador FrontEnd)
- **Solución Implementada:** Implementación de algoritmo iterativo en `imageCompressor.ts` que reduce progresivamente la calidad (0.8 -> 0.65 -> 0.5) hasta asegurar estrictamente `< 1.2 MB`.
- **Estado Actual:** **Verificado y Cerrado**. Re-test exitoso por Benitez Facundo.

### Defecto BUG-102
- **Caso Asociado:** `CP-RF-TIE-05-02` | **Módulo:** Módulo 3A (Tienda & Carrito)
- **Severidad:** S1 (Crítica) | **Prioridad de Corrección:** Inmediata
- **Descripción:** Ante dos solicitudes simultáneas en el milisegundo 0 para reservar la última unidad disponible, ambas lograban leer `stock = 1` antes de la escritura, generando stock negativo (`stock = -1`).
- **Detectado por:** Benitez Facundo (Analista de QA)
- **Responsable de Corrección:** **Benitez Angel** (Desarrollador BackEnd)
- **Solución Implementada:** Se encapsuló la consulta y actualización dentro de `prisma.$transaction` con condición atómica `decrement: 1` y filtro estricto `stock: { gte: cantidad }`.
- **Estado Actual:** **Verificado y Cerrado**. Cero sobreventa confirmada bajo estrés concurrente por Benitez Facundo.
