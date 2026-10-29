# 🛡️ PLAN MAESTRO DE TESTING Y ASEGURAMIENTO DE CALIDAD (QA)
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Institución:** Universidad Nacional de Pilar (UNPilar)  
**Cátedra:** Testing & Calidad de Software — Año 2026  
**Profesor Titular:** Mg. Pedro Brest  
**Equipo de Proyecto (5 integrantes):**  
- **Escobar Raul** (Scrum Master / Delivery Lead - DNI: 37.769.126)  
- **Kuhn Joaquin** (Diseñador UI/UX)  
- **Rodriguez Iván** (Desarrollador FrontEnd)  
- **Benitez Angel** (Desarrollador BackEnd)  
- **Benitez Facundo** (Analista de QA)  
**Estándar de Referencia:** IEEE 829 / ISO/IEC/IEEE 29119 & ISO/IEC 25010  
**Cronograma del Proyecto:** 25 de agosto de 2026 (Creación del repositorio GitHub) al 02 de noviembre de 2026 (Entrega Final)  
**Versión del Plan:** 2.0 (Definitivo para Entrega Académica)  
**Fecha de Emisión:** 28 de Octubre de 2026  

---

## 1. 🎯 Introducción, Visión y Objetivos de Calidad

### 1.1 Introducción
El presente Plan Maestro de Pruebas (Test Plan) define la estrategia, alcance, recursos, entornos, procedimientos y métricas que gobernarán el proceso de aseguramiento de la calidad (QA) del sistema **EcoAlerta**. EcoAlerta es una solución de software integral compuesta por un backend transaccional en Node.js/Express con ORM Prisma y una aplicación móvil multiplataforma desarrollada en React Native (Expo). Su propósito es permitir el reporte ciudadano de focos ambientales críticos (microbasurales, focos de dengue, terrenos baldíos abandonados), el triaje administrativo municipal, la fiscalización y saneamiento en terreno por inspectores de campo, la asignación de ecopuntos y su posterior canje por productos sustentables en una tienda municipal con retiro presencial.

### 1.2 Visión de Calidad
Asegurar que la aplicación funcione de manera determinista, robusta y segura, garantizando la consistencia de datos en escenarios de alta concurrencia, la correcta experiencia de usuario (modo invitado sin fricción, feedback bloqueante en mutaciones y fluidez en listas), la total integridad en la asignación de puntos y el estricto cumplimiento de los criterios de aceptación funcionales y no funcionales.

### 1.3 Objetivos de Calidad (Metas Medibles)
1. **Cobertura de Requerimientos:** 100% de los Requisitos Funcionales (RF) y No Funcionales (RNF) especificados deben contar con casos de prueba diseñados y trazados en la Matriz RTM.
2. **Eficacia de Detección de Defectos:** Identificar y registrar el 100% de las anomalías críticas y bloqueantes antes de la entrega final.
3. **Cero Defectos Bloqueantes en Producción:** Ningún defecto de severidad Crítica (S1) o Alta (S2) podrá permanecer abierto al momento del cierre de la fase de pruebas.
4. **Cumplimiento de Rendimiento y Carga:** Validar que los tiempos de respuesta locales sean `< 300 ms` y las operaciones de API `< 600 ms` bajo condiciones nominales (RNF-01).
5. **Integridad de Transacciones Concurrentes:** Garantizar cero condiciones de carrera (*race conditions*) en la toma de casos 1 a 1 de agentes y en la reserva de stock de productos por 5 minutos (TTL).

---

## 2. 🗺️ Alcance de las Pruebas (Scope)

### 2.1 Elementos Dentro del Alcance (In Scope)

#### Módulo 1: Autenticación, Modo Invitado, Cuentas y 4 Roles (RBAC)
- **Modo Invitado (Guest):** Home de bienvenida explicativo (`HU-INV-01`), CTA en cabecera de registro (`HU-INV-02`), navegación libre de catálogo y bloqueo estricto con interceptor/modal (*Auth Gate*) ante acciones que requieran identidad (`HU-INV-03`, `RF-AUT-06`, `RF-AUT-07`, `RF-AUT-08`).
- **Autenticación Ciudadana:** Registro con Nombre, Correo, Contraseña (mínimo 6 caracteres, validación regex, coincidencia y unicidad), saldo inicial de 0 puntos (`RF-AUT-01`, `RF-AUT-02`).
- **Login Multi-Rol y Enrutamiento Dinámico:** Redirección según rol devuelto por JWT/Auth (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`) (`RF-AUT-03`, `RF-AUT-04`).
- **Persistencia de Sesión y Logout Seguro:** Almacenamiento local mediante `AsyncStorage` y retorno limpio a Modo Invitado al cerrar sesión (`RF-AUT-05`).

#### Módulo 2: Ciclo de Vida Completo del Reporte Ambiental
- **Creación de Denuncia por Ciudadano:** Selección de categoría (*Microbasural*, *Foco de Dengue*, *Terreno Baldío*, *Otro*), captura de foto con compresión obligatoria `< 1.2 MB`, captura de coordenadas GPS (`latitud`, `longitud`) y dirección manual. Generación de código único `REP-2026-XXX` y estado inicial `PENDIENTE`. Puntos en estado no acreditado (`RF-REP-01 a 05`, `HU-03`).
- **Triaje y Asignación Municipal por Admin:** Evaluación de reportes, rechazo con justificación obligatoria (`observacionesAdmin`) y 0 puntos, o aprobación en bolsa con prioridad (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`). Validación de disponibilidad de inspectores (`RF-ADM-01 a 03b`, `HU-05`).
- **Bolsa de Casos y Bloqueo 1 a 1 por Agente:** Visualización de incidentes con código de color de prioridad, toma de caso con bloqueo atómico (`prisma.$transaction`) a estado `EN_VERIFICACION` e imposibilidad de tomar casos simultáneos (`RF-AGE-01 a 04`, `HU-08`).
- **Verificación In Situ y Protocolo de 3 Intentos:** Registro de visita con geolocalización y foto de contraprueba:
  - *Caso A (Real):* Foto de foco real -> Pasa a `VERIFICADO_PENDIENTE`.
  - *Caso B (Falso):* Foto de descargo y cierre como rechazo/falso.
  - *Caso C (Inaccesible):* Foto de sticker/aviso municipal, contador de hasta 3 visitas (`intentosInaccesible`). Al 3.er fallo -> Cierre automático a `CERRADO_INACCESIBLE` sin penalización al ciudadano (`RF-AGE-05 a 06`, `HU-09`).
- **Validación de Veracidad y Acreditación de Puntos:** Admin audita verificación del agente. Al confirmar, acredita puntos al ciudadano mediante baremo de prioridad (`BAJA: 50-80`, `MEDIA: 100-150`, `ALTA: 200-300`, `URGENTE: 350-500`) en transacción atómica y pasa a `EN_SANEAMIENTO` (`RF-ADM-04 a 05`).
- **Liberación de Caso y Desasignación:** Retorno a bolsa general; si ya tenía puntos acreditados, retorna directamente a `EN_SANEAMIENTO` (`RF-AGE-07`, `RF-ADM-06`, `HU-10`).
- **Saneamiento Técnico:** Agente limpia el foco, sube foto del "Después" (`fotoSolucionUrl`) y reporte técnico (`informeSolucion`), pasando a `RESUELTO_TECNICO` (`RF-AGE-08`, `HU-11`).
- **Doble Certificación Final por Admin:** Pantalla comparativa "Antes vs Después". Aprobación a `RESUELTO` definitivo o rechazo con observaciones que retorna a `EN_SANEAMIENTO` (`RF-ADM-07 a 08`, `HU-07`).
- **Seguimiento y Soft Delete Ciudadano:** Visualización de avances en móvil y archivado visual (`ocultarUsuario = true`) preservando el registro en la base de datos municipal (`RF-REP-06 a 07`, `HU-04`, `HU-VEC01`).

#### Módulo 3: Tienda Ecológica, Carrito, Checkout y Entrega Presencial
- **ABM de Catálogo Admin:** Carga, edición y baja lógica (`activo = false`) de productos ecológicos con stock físico y precio en puntos (`RF-TIE-01`).
- **Catálogo, Detalle y Carrito Reactivo:** Visualización filtrada por categoría, buscador, cálculo en vivo de totales en puntos y persistencia local del carrito (`RF-TIE-02 a 03`, `HU-05 a 07`).
- **Checkout con Bloqueo de Stock TTL de 5 Minutos:** Validación de saldo de puntos (`puntosUsuario >= totalCarrito`), reserva atómica de stock por 5 minutos (`bloqueadoHasta = now + 5m`), selección de punto de retiro (disponibilidad a 48 hs hábiles), descuento atómico de puntos y stock, vaciado de carrito y generación de `codigoRetiro` con 30 días de validez (`RF-TIE-04 a 05`, `HU-08`).
- **Entrega Presencial Colaborador:** Búsqueda por `codigoRetiro`, validación de identidad del titular y marcación a `ENTREGADO` (`RF-COL-01`).
- **Expiración de Canjes a los 30 Días:** Cancelación de pedidos no retirados, devolución del stock físico al inventario sin reembolso de puntos al usuario (`RF-TIE-06`).

#### Requisitos No Funcionales (RNF) y UI
- **RNF-02:** Compresión de imágenes de cámara/galería a `< 1.2 MB` (máximo 1080px).
- **RNF-09:** Arranque en frío de app `< 300 ms` y disparo de modal Auth Gate en `< 100 ms`.
- **RNF-10:** Bloqueo de UI con spinner transaccional modal (`TransactionLoaderModal`) en mutaciones a BD y spinners en cambios de filtros/chips de listas.

### 2.2 Elementos Fuera del Alcance (Out of Scope)
- Pasarelas de pago con dinero fiduciario (la tienda opera exclusivamente con ecopuntos acumulados).
- Integración con hardware de cámaras térmicas o drones de fiscalización.
- Pruebas de estrés volumétrico extremo (> 100.000 usuarios concurrentes en simulador no provisto por la universidad).

---

## 3. 🏗️ Arquitectura y Estrategia de Pruebas

Se adopta el modelo de la **Pirámide de Pruebas** adaptado a desarrollo ágil y móvil:

```
              / \
             /   \      Pruebas E2E / UI Manuales y Automatizadas
            / E2E \     (Recorridos completos de usuario, Auth Gate, Cámara, Checkout)
           /-------\
          /         \    Pruebas de Integración y API REST
         /   API /   \   (Postman / Supertest / Transacciones Prisma)
        / Integración \
       /---------------\
      /                 \  Pruebas Unitarias (Jest / Node:test)
     /     Unitarias     \ (Validadores regex, lógica de puntos, TTL, formato imágenes)
    /---------------------\
```

### 3.1 Niveles de Prueba
1. **Pruebas Unitarias:** Validación de funciones puras, validadores de formato de email, longitud de contraseñas, escalado de puntos por prioridad, cálculo de subtotales de carrito y compresión de buffers multimedia.
2. **Pruebas de Integración:** Validación de controladores Express contra base de datos de pruebas (SQLite/PostgreSQL en memoria/aislada), verificando transacciones Prisma (`prisma.$transaction`), integridad referencial, bloqueos y rollbacks ante error.
3. **Pruebas de API (Contratos y Endpoints):** Verificación exhaustiva de rutas REST con Postman y Supertest, evaluando códigos de respuesta HTTP (200, 201, 400, 401, 403, 404, 409, 500) y esquemas JSON devueltos.
4. **Pruebas de Interfaz de Usuario (UI) y E2E:** Verificación de navegación en React Native Expo, visualización de pantallas según rol, interacción con modales, selectores y formularios.
5. **Pruebas de Concurrencia y Resiliencia:** Verificación de intentos de toma simultánea del mismo reporte por múltiples agentes y reservas simultáneas de la última unidad de stock en Checkout.
6. **Pruebas de Seguridad y RBAC:** Intentos de acceso a endpoints protegidos de Admin o Agente utilizando tokens con rol Ciudadano o sin token (esperando 401 Unauthorized y 403 Forbidden).

---

## 4. 🚪 Criterios de Entrada, Suspensión, Reanudación y Salida

### 4.1 Criterios de Entrada (Entry Criteria)
- Especificaciones de requerimientos (`specs/BACKLOG_MODULOS_Y_HU.md`) consolidadas.
- Código base del backend compilando sin errores TypeScript (`npm run build`).
- Esquema de base de datos Prisma migrado y con datos semilla de prueba (`npm run prisma:seed`).
- Servidor de testing y cliente Expo levantados en ambiente de prueba.
- Casos de prueba documentados y aprobados en la RTM.

### 4.2 Criterios de Suspensión
- Caída o inaccesibilidad completa del servidor backend o base de datos.
- Bloqueo en el módulo de autenticación que impida obtener tokens válidos.
- Presencia de un bug crítico (S1) que impida el avance de más del 50% de los casos de prueba de un módulo.

### 4.3 Criterios de Reanudación
- Despliegue de hotfix por parte del desarrollador responsable del módulo afectado.
- Verificación de humo (*Smoke Test*) exitosa en el módulo corregido.
- Confirmación de disponibilidad de base de datos y endpoints.

### 4.4 Criterios de Salida (Exit Criteria)
- 100% de los casos de prueba planificados han sido ejecutados.
- Tasa de éxito (*Pass Rate*) superior al 95%.
- 0 defectos de severidad Crítica (S1) o Alta (S2) abiertos.
- Matriz de Trazabilidad (RTM) completamente actualizada con vínculos bidireccionales.
- Evidencias de ejecución compiladas y documentadas.

---

## 5. 🖥️ Ambiente de Pruebas (Test Environment)

| Componente | Especificación Técnica de Pruebas |
| :--- | :--- |
| **Backend Runtime** | Node.js v24.21.0 / TypeScript v5.5.4 |
| **Framework HTTP** | Express v4.21.0 |
| **ORM & Base de Datos** | Prisma ORM v5.22.0 sobre SQLite / PostgreSQL de prueba |
| **Frontend Mobile** | React Native Expo SDK 52, TypeScript, React Navigation |
| **Dispositivos de Prueba** | Emulador Android (Pixel 7 - Android 14), Emulador iOS (iPhone 15 - iOS 17.4), Dispositivo Físico Android vía Expo Go |
| **Herramientas de Test** | Jest v29.7.0, Supertest v7.0.0, Node:test runner, Postman Collection v2.1 |
| **Red & Servicios Mock** | Localhost / Staging IP local con latencia simulada de 50 ms a 300 ms |

---

## 6. 🐛 Gestión de Defectos y Ciclo de Vida del Bug

### 6.1 Clasificación por Severidad
- **S1 — Crítico (Blocker):** Provoca caída de la aplicación, pérdida de datos, corrupción de transacciones o brecha de seguridad (ej. acreditación de puntos duplicada o bypass de rol).
- **S2 — Alto (Major):** Función clave no operativa sin alternativa de trabajo (ej. falla compresión de foto impidiendo el envío del reporte o fallo en el bloqueo de stock).
- **S3 — Medio (Minor):** Error en regla de negocio no crítica o mensaje de error incorrecto pero que no impide completar la tarea (ej. texto de error ambiguo o spinner que no desaparece automáticamente al fallar).
- **S4 — Bajo (Trivial):** Detalle estético, desalineación menor de estilos o typo en un texto explicativo del Home de Bienvenida.

### 6.2 Ciclo de Vida del Defecto
```
[Reportado por QA] ──► [Asignado a Dev del Módulo] ──► [En Corrección/Debug]
                                                               │
                                                               ▼
[Cerrado y Documentado] ◄── [Verificado / Re-test OK] ◄── [Resuelto / Hotfix]
                                     │
                             (Si falla el re-test)
                                     ▼
                            [Reabierto / Bug]
```

### 6.3 📌 POLÍTICA ESTRICTA DE ASIGNACIÓN Y RESPONSABILIDAD
Conforme a la directiva del proyecto:
> **"El responsable de analizar, depurar y corregir los defectos detectados en una funcionalidad o módulo es de forma unívoca el mismo desarrollador que implementó dicho módulo o función."**
> La Matriz de Trazabilidad y la Planilla de Ejecución deben registrar explícitamente el rol del desarrollador asignado para garantizar la rendición de cuentas y trazabilidad hacia atrás (Backward Traceability).

---

## 7. 👥 Matriz de Roles y Responsabilidades (RACI)

Conforme al requerimiento de trazabilidad unívoca de calidad, cada integrante del equipo asume responsabilidades directas en la construcción, prueba y corrección de su área funcional:

| Integrante | Rol Oficial en el Proyecto | Responsabilidades Principales | Responsable Directo de Corrección de Defectos |
| :--- | :--- | :--- | :--- |
| **Escobar Raul** | **Scrum Master** | Coordinación metodológica Scrum, gestión del alcance y cronograma (PMBOK/CPM), elaboración del Plan Maestro IEEE 829 y Matriz RTM. | Coordinación y control de calidad general |
| **Benitez Facundo** | **Analista de QA** | Diseño y ejecución de los 57 casos de prueba, automatización Jest/Supertest, colecciones Postman, bitácora de bugs y regresión. | *N/A (Identifica, Documenta y Verifica re-test)* |
| **Rodriguez Iván** | **Desarrollador FrontEnd** | Desarrollo de pantallas React Native (Expo), Auth Gate, módulo Ciudadano, Tienda, Modales transaccionales y componentes UI. | **Bugs en Módulo 1 (Auth), Módulo 2A (Reportes/Cámara - `BUG-101`), Módulo 3A (Tienda) y UI** |
| **Benitez Angel** | **Desarrollador BackEnd** | API REST Node.js/Express, TypeScript, Prisma ORM, PostgreSQL en Supabase, transacciones ACID, concurrencia y TTL de canjes. | **Bugs en Módulo 2B (Triaje), Módulo 2C (Puntos), Módulo 3A/3B (Checkout/Reserva - `BUG-102`), BD y APIs** |
| **Kuhn Joaquin** | **Diseñador UI/UX** | Wireframes, prototipado Figma, pantallas HomeScreen, arquitectura de información, fluidez visual y evaluación ISO/IEC 25010. | **Bugs de Usabilidad, feedback visual, desalineación estética y accesibilidad** |

---

## 8. ⚠️ Gestión de Riesgos de Calidad y Contingencias

| ID Riesgo | Descripción del Riesgo | Probabilidad | Impacto | Estrategia de Mitigación |
| :---: | :--- | :---: | :---: | :--- |
| **RSK-01** | Fotos de alta resolución tomadas por el usuario exceden el límite de 1.2 MB provocando lentitud o errores 413 en el backend. | Alta | Alto | Pruebas exhaustivas con imágenes RAW de 12 MP forzando el paso por `imageCompressor.ts` hasta verificar tamaño `<= 1.2 MB`. |
| **RSK-02** | Dos agentes intentan tomar el mismo caso aprobado en la bolsa simultáneamente produciendo duplicidad de asignación. | Media | Crítico | Pruebas de estrés y concurrencia ejecutando solicitudes paralelas contra `/api/denuncias/{id}/tomar` validando transacción Prisma aislada. |
| **RSK-03** | Dos usuarios intentan canjear la última unidad de stock al mismo tiempo provocando sobreventa de productos municipales. | Media | Crítico | Pruebas automáticas concurrentes en `/api/canjes/checkout` con stock = 1; verificar que solo uno reserve y el otro reciba error de stock insuficiente. |
| **RSK-04** | Falla en el cron/timeout de 5 minutos dejando el stock bloqueado indefinidamente. | Media | Alto | Test unitario e integración con mock de temporizador (`jest.useFakeTimers()`) verificando que tras 5m 1s el stock retorna al producto. |
| **RSK-05** | Un usuario sin sesión activa logra saltar el Auth Gate e inyectar un reporte o mutar el carrito. | Baja | Crítico | Pruebas de seguridad negativas enviando payloads sin header `Authorization` o con token adulterado hacia todos los endpoints protegidos. |
| **RSK-06** | El usuario presiona repetidamente el botón de confirmación mientras procesa la red, generando duplicidad de denuncias o canjes. | Alta | Alto | Verificación de `TransactionLoaderModal` (RNF-10): el modal bloquea toda la pantalla de forma reactiva en el milisegundo 0 del toque. |

---

## 9. 📦 Entregables del Proceso de Calidad (Testware)
1. **Plan Maestro de Testing (este documento):** Definición metodológica y operativa.
2. **Catálogo de Historias de Usuario (HU), Requisitos Funcionales (RF) y Criterios BDD:** Especificación detallada con sintaxis Gherkin.
3. **Casos de Prueba Específicos:** Documentación de pasos, precondiciones, datos exactos y resultados esperados.
4. **Matriz de Trazabilidad de Requisitos (RTM):** Mapeo bidireccional requisito <-> prueba <-> defecto <-> responsable.
5. **Planilla de Registro de Ejecución y Métricas:** Control de pasados, fallidos y reintentos.
6. **Cronograma Gantt con Estimación PERT/CPM y Semáforos:** Cronograma analítico de tiempos de QA según PMBOK.
7. **Checklists de Calidad (ISO/IEC 25010 y Peer Review):** Listas de verificación de conformidad.
8. **Libro Excel Maestro (`EcoAlerta_Testware_Matriz_Casos_Ejecucion.xlsx`):** Formato idéntico al modelo de cátedra listo para subir a Google Drive.
