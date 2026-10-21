# Tasks: Triaje Administrativo, Toma de Caso 1 a 1 y Verificación de Agente en Terreno

**Input**: Design documents from `/specs/003-triaje-y-agente-campo/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/003-triaje-y-agente-campo/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/003-triaje-y-agente-campo/spec.md), `001-auth-rbac`, `002-reporte-ciudadano`

**Tests**: Incluidas según el Principio VII de la Constitución (atomicidad 1 a 1, protocolo de 3 intentos y liberación inteligente).

**Organization**: Tareas agrupadas por historia de usuario (`US1` a `US4`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo
- **[Story]**: Historia de usuario asociada (`[US1]` a `[US4]`)

---

## Phase 1: Setup (Shared UI Components)

**Purpose**: Componentes visuales de semáforo de prioridad y modal de verificación en terreno con `StyleSheet.create` y `theme.ts`.

- [X] T001 [P] Crear el componente `PrioritySemaphoreBadge` (Rojo = `URGENTE`, Naranja = `ALTA`, Verde = `MEDIA`/`BAJA`) en `client/src/components/agent/PrioritySemaphoreBadge.tsx` y el modal bloqueante reutilizable `TransactionLoaderModal` (`RNF-10`) en `client/src/components/common/TransactionLoaderModal.tsx`
- [X] T002 [P] Crear el componente `VerificationFormModal` para capturar la foto obligatoria (`< 1.2 MB`) y seleccionar entre Caso A (`REAL`), Caso B (`FALSO`) o Caso C (`INACCESIBLE` mostrando intento `X/3`) con bloqueo transaccional en `client/src/components/agent/VerificationFormModal.tsx`

---

## Phase 2: Foundational (Backend Endpoints & Field Agent Repository)

**Purpose**: Implementar endpoints transaccionales en `/server` y el repositorio `IFieldAgentRepository` en `client/`.

**⚠️ CRITICAL**: Bloqueante para las pantallas de Admin y Agente.

- [X] T003 Implementar los controladores `triajeDenuncia` (`APROBADO` con prioridad o `RECHAZADO` con `observacionesAdmin` obligatorio), `getBolsaCasos` (ordenado por prioridad), `tomarCasoAtomico` (transacción 1 a 1 en `prisma.$transaction`), `verificarInSitu` (Casos A/B/C y regla de 3 intentos `intentosInaccesible` -> `CERRADO_INACCESIBLE`) y `liberarCaso` en `server/src/controllers/denuncias.controller.ts`
- [X] T004 Registrar las rutas `PATCH /api/denuncias/:id/triaje`, `GET /api/denuncias/bolsa`, `PATCH /api/denuncias/:id/tomar`, `PATCH /api/denuncias/:id/verificar` y `PATCH /api/denuncias/:id/liberar` en `server/src/routes/denuncias.routes.ts`
- [X] T005 [P] Definir la interfaz `IFieldAgentRepository` y métodos (`getBolsaCasos`, `getMiCasoActivo`, `tomarCaso`, `enviarVerificacion`, `liberarCaso`) en `client/src/repositories/agent/IFieldAgentRepository.ts`
- [X] T006 [P] Implementar `RemoteFieldAgentRepository` y `LocalFieldAgentRepository` en `client/src/repositories/agent/RemoteFieldAgentRepository.ts`, `client/src/repositories/agent/LocalFieldAgentRepository.ts` y `client/src/repositories/agent/index.ts`
- [X] T007 Extender `adminService.ts` con las funciones `triajeDenuncia` y `liberarCasoAgente` en `client/src/services/adminService.ts`

**Checkpoint**: Backend transaccional y repositorios de Admin/Agente listos.

---

## Phase 3: User Story 1 - Triaje Inicial de Reportes por Administrador (Priority: P1) 🎯 MVP

**Goal**: Permitir al `ADMIN` evaluar reportes en estado `PENDIENTE`, aprobándolos hacia la bolsa (`APROBADO`) con una prioridad (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`) o rechazándolos (`RECHAZADO`) con justificación obligatoria (`observacionesAdmin`) y 0 puntos.

**Independent Test**: Como `ADMIN` en `AdminDenunciasScreen`, aprobar un reporte `PENDIENTE` con prioridad `URGENTE` (verificar que pasa a `APROBADO`) y rechazar otro exigiendo escribir motivo (verificar que pasa a `RECHAZADO` con 0 puntos).

### Implementation for User Story 1

- [X] T008 [US1] Actualizar `AdminDenunciasScreen` para filtrar reportes en `PENDIENTE` y añadir modal de Triaje con selector de `Prioridad` (al aprobar) y campo obligatorio de `observacionesAdmin` (al rechazar) en `client/src/screens/admin/AdminDenunciasScreen.tsx`

**Checkpoint**: Triaje administrativo operativo.

---

## Phase 4: User Story 2 - Bolsa de Casos con Prioridad y Toma de Caso con Bloqueo 1 a 1 (Priority: P1)

**Goal**: Mostrar a los agentes la bolsa de casos ordenados por semáforo de prioridad con botón para abrir navegación GPS externa, y permitir tomar un único caso a la vez mediante bloqueo atómico 1 a 1.

**Independent Test**: Iniciar sesión como `AGENT`, ver la bolsa ordenada (`URGENTE` primero), abrir la ubicación en el mapa externo y pulsar "Tomar Caso". Verificar que el caso pasa a "Mi Caso Activo" (`EN_VERIFICACION`), desaparece de la bolsa de otros agentes y el botón "Tomar Caso" se bloquea mientras tenga ese caso activo.

### Implementation for User Story 2

- [X] T009 [US2] Actualizar `AgentHomeScreen` para mostrar la "Bolsa de Casos" ordenada por `PrioritySemaphoreBadge`, botón `"Cómo llegar (Mapa)"` (usando `Linking.openURL` con `latitud,longitud`) y botón `"Tomar Caso"` con estado de carga transaccional en `client/src/screens/agente/AgentHomeScreen.tsx`
- [X] T010 [US2] Implementar la vista/pestaña `"Mi Caso Activo"` en `AgentHomeScreen` y deshabilitar la toma de nuevos casos mientras el agente tenga un caso en `EN_VERIFICACION` o `EN_SANEAMIENTO` en `client/src/screens/agente/AgentHomeScreen.tsx`

**Checkpoint**: Bolsa de casos y bloqueo 1 a 1 en funcionamiento.

---

## Phase 5: User Story 3 - Verificación In Situ y Protocolo de 3 Intentos por Inaccesibilidad (Priority: P1)

**Goal**: Permitir al agente completar la verificación en terreno subiendo foto de contraprueba y eligiendo Caso A (`REAL` -> `VERIFICADO_PENDIENTE`), Caso B (`FALSO` -> `RECHAZADO`) o Caso C (`INACCESIBLE` -> suma intento hasta 3 y al 3.º pasa a `CERRADO_INACCESIBLE`).

**Independent Test**: Con un caso en `EN_VERIFICACION`, abrir `VerificationFormModal` y probar los 3 caminos: A) pasa a `VERIFICADO_PENDIENTE`; B) pasa a `RECHAZADO`; C) al registrar 3 intentos de inaccesibilidad con foto del aviso, cambia automáticamente a `CERRADO_INACCESIBLE`.

### Implementation for User Story 3

- [X] T011 [US3] Integrar `VerificationFormModal` dentro de la tarjeta de `"Mi Caso Activo"` en `AgentHomeScreen`, conectándolo a `IFieldAgentRepository.enviarVerificacion` y mostrando el contador de intentos de inaccesibilidad (`intentosInaccesible / 3`) en `client/src/screens/agente/AgentHomeScreen.tsx`

**Checkpoint**: Verificación in situ y protocolo de 3 intentos operativos.

---

## Phase 6: User Story 4 - Liberación y Desasignación Inteligente de Caso a la Bolsa (Priority: P2)

**Goal**: Permitir que el Agente libere su caso activo o que el Admin lo desasigne, devolviéndolo a `APROBADO` si aún no fue verificado, o manteniéndolo en `EN_SANEAMIENTO` (sin `agenteId`) si ya había sido verificado y acreditado.

**Independent Test**: Liberar un caso en `EN_VERIFICACION` desde `AgentHomeScreen` (verificar que vuelve a la bolsa como `APROBADO`) y desasignar desde `AdminDenunciasScreen` un caso en `EN_SANEAMIENTO` (verificar que sigue en `EN_SANEAMIENTO` disponible para que otro agente lo tome).

### Implementation for User Story 4

- [X] T012 [US4] Añadir botón `"Liberar Caso"` con confirmación en `"Mi Caso Activo"` dentro de `AgentHomeScreen` conectado a `IFieldAgentRepository.liberarCaso` en `client/src/screens/agente/AgentHomeScreen.tsx`
- [X] T013 [P] [US4] Añadir acción `"Desasignar / Liberar a la Bolsa"` para el Administrador en `client/src/screens/admin/AdminDenunciasScreen.tsx` y `client/src/screens/admin/AdminAgentesScreen.tsx`

**Checkpoint**: Liberación y reasignación sin pérdida de trazabilidad lista.

---

## Phase 7: Polish & Cross-Cutting Concerns (Testing & QA)

**Purpose**: Pruebas automatizadas de concurrencia 1 a 1, regla de 3 intentos y liberación inteligente + verificación en Expo Go.

- [X] T014 [P] Crear pruebas de integración para `PATCH /api/denuncias/:id/tomar` (bloqueo 1 a 1 y rechazo `409` de segundo caso paralelo), `PATCH /api/denuncias/:id/verificar` (transición a `CERRADO_INACCESIBLE` en el 3.er intento) y `PATCH /api/denuncias/:id/liberar` en `server/src/__tests__/denuncias.agent.test.ts`
- [X] T015 Ejecutar checklist de verificación manual en Expo Go (Triaje Admin, Semáforo de bolsa, Mapa externo, Toma 1 a 1, Verificación A/B/C y Liberación) en `specs/003-triaje-y-agente-campo/checklists/requirements.md`

---

## Dependencies & Execution Order

- **Phase 1 & Phase 2** son prerrequisitos bloqueantes.
- **Phase 3 (US1 - Triaje Admin)** alimenta la bolsa de casos para **Phase 4 (US2 - Toma 1 a 1)**.
- **Phase 5 (US3 - Verificación In Situ)** y **Phase 6 (US4 - Liberación)** operan sobre el caso tomado en `US2`.
- **Phase 7 (Testing)** certifica las reglas transaccionales del módulo.
