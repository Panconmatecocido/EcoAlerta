# Tasks: Acreditación de Puntos, Saneamiento y Certificación Final

**Input**: Design documents from `/specs/004-saneamiento-y-certificacion/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/004-saneamiento-y-certificacion/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/004-saneamiento-y-certificacion/spec.md), `003-triaje-y-agente-campo`

**Tests**: Incluidas según el Principio VII de la Constitución (baremo de puntos, idempotencia de acreditación y flujo Antes vs. Después).

**Organization**: Tareas agrupadas por historia de usuario (`US1`, `US2`, `US3`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo
- **[Story]**: Historia de usuario asociada (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup (Shared Utilities)

**Purpose**: Definir las constantes y validadores del baremo oficial de puntos por prioridad.

- [ ] T001 Crear utilidad `pointsScale.ts` con los rangos oficiales (`BAJA: 50-80`, `MEDIA: 100-150`, `ALTA: 200-300`, `URGENTE: 350-500`) y funciones validadoras en `client/src/utils/pointsScale.ts`

---

## Phase 2: Foundational (Backend Endpoints & Repository Extensions)

**Purpose**: Implementar en `/server` los endpoints transaccionales de acreditación de puntos, cierre técnico y certificación final.

**⚠️ CRITICAL**: Bloqueante para los flujos de Admin y Agente de este módulo.

- [ ] T002 Implementar `validarVeracidad` en el backend con `prisma.$transaction` (verifica `estado === 'VERIFICADO_PENDIENTE'`, `puntosOtorgados === 0`, valida baremo por prioridad, suma `User.puntos` y pasa a `EN_SANEAMIENTO`) en `server/src/controllers/denuncias.controller.ts`
- [ ] T003 Implementar `registrarCierreTecnico` (`EN_SANEAMIENTO` -> `RESUELTO_TECNICO` exigiendo `fotoSolucionUrl` e `informeSolucion`) y `certificarResolucionFinal` (`RESUELTO_TECNICO` -> `RESUELTO` con `fechaResolucion` o retorno a `EN_SANEAMIENTO` con observación) en `server/src/controllers/denuncias.controller.ts`
- [ ] T004 Registrar las rutas `PATCH /api/denuncias/:id/validar-veracidad`, `PATCH /api/denuncias/:id/cierre-tecnico` y `PATCH /api/denuncias/:id/certificar` en `server/src/routes/denuncias.routes.ts`
- [ ] T005 [P] Extender `IFieldAgentRepository`, `RemoteFieldAgentRepository` y `LocalFieldAgentRepository` con el método `enviarCierreTecnico` en `client/src/repositories/agent/IFieldAgentRepository.ts`, `client/src/repositories/agent/RemoteFieldAgentRepository.ts` y `client/src/repositories/agent/LocalFieldAgentRepository.ts`
- [ ] T006 [P] Extender `adminService.ts` con los métodos `validarVeracidadYAcreditarPuntos` y `certificarSaneamientoFinal` en `client/src/services/adminService.ts`

**Checkpoint**: Endpoints y servicios de acreditación, cierre técnico y certificación listos.

---

## Phase 3: User Story 1 - Validación de Veracidad y Acreditación de Puntos por Baremo (Priority: P1) 🎯 MVP

**Goal**: Permitir al `ADMIN` auditar un caso en `VERIFICADO_PENDIENTE`, ver la foto original junto a la contraprueba del agente y aprobar la veracidad asignando los puntos del baremo al ciudadano en una transacción atómica que pasa el caso a `EN_SANEAMIENTO`.

**Independent Test**: Como `ADMIN`, abrir una denuncia en `VERIFICADO_PENDIENTE` con prioridad `ALTA`, ver que el selector sugiere entre `200` y `300` puntos, confirmar `250` puntos y verificar que el reporte pasa a `EN_SANEAMIENTO` y el ciudadano recibe `+250` puntos en su cuenta.

### Implementation for User Story 1

- [ ] T007 [P] [US1] Crear el componente `PointsScaleModal` con `StyleSheet.create` y `theme.ts` que muestra `imagenUrl` vs. `fotoVerificacionUrl` y restringe los puntos al rango de `pointsScale.ts` en `client/src/components/admin/PointsScaleModal.tsx`
- [ ] T008 [US1] Integrar `PointsScaleModal` en `AdminDenunciasScreen` para las denuncias en estado `VERIFICADO_PENDIENTE` en `client/src/screens/admin/AdminDenunciasScreen.tsx`

**Checkpoint**: Acreditación de puntos por denuncia real verificada en funcionamiento.

---

## Phase 4: User Story 2 - Ejecución de Saneamiento y Cierre Técnico por Agente (Priority: P1)

**Goal**: Permitir al `AGENT` encargado de un caso en `EN_SANEAMIENTO` subir la foto del lugar limpio (`fotoSolucionUrl` `< 1.2 MB`) y redactar el `informeSolucion`, pasando el caso a `RESUELTO_TECNICO`.

**Independent Test**: Como `AGENT` con un caso activo en `EN_SANEAMIENTO`, abrir el formulario de cierre técnico, adjuntar foto del "Después" e informe de tareas, enviar y verificar que pasa a `RESUELTO_TECNICO`.

### Implementation for User Story 2

- [ ] T009 [P] [US2] Crear el componente `TechnicalClosureModal` con compresión de foto (`imageCompressor.ts` `< 1.2 MB`) y campo obligatorio `informeSolucion` en `client/src/components/agent/TechnicalClosureModal.tsx`
- [ ] T010 [US2] Integrar `TechnicalClosureModal` en la tarjeta de `"Mi Caso Activo"` cuando `estado === 'EN_SANEAMIENTO'` (incluyendo visualización de observaciones si fue devuelto por el Admin) en `client/src/screens/agente/AgentHomeScreen.tsx`

**Checkpoint**: Cierre técnico con evidencia del "Después" operativo.

---

## Phase 5: User Story 3 - Certificación Final "Antes vs. Después" por Administrador (Priority: P1)

**Goal**: Ofrecer al `ADMIN` una vista comparativa lado a lado ("Antes" vs. "Después" + `informeSolucion`) para certificar el cierre definitivo (`RESUELTO`) o devolver el caso a `EN_SANEAMIENTO` con observaciones.

**Independent Test**: Como `ADMIN`, abrir una denuncia en `RESUELTO_TECNICO`, comparar las fotos Antes y Después y pulsar "Certificar Cierre Definitivo"; comprobar que pasa a `RESUELTO` con `fechaResolucion` y que el ciudadano ya ve el Antes/Después en su historial.

### Implementation for User Story 3

- [ ] T011 [P] [US3] Crear el componente `BeforeAfterAuditModal` con comparativa visual "Antes vs. Después", lectura de `informeSolucion` y botones `"Certificar Cierre Definitivo"` / `"Observar y Devolver a Saneamiento"` en `client/src/components/admin/BeforeAfterAuditModal.tsx`
- [ ] T012 [US3] Integrar `BeforeAfterAuditModal` en `AdminDenunciasScreen` para las denuncias en estado `RESUELTO_TECNICO` en `client/src/screens/admin/AdminDenunciasScreen.tsx`

**Checkpoint**: Ciclo de vida completo del reporte (7 etapas) cerrado de punta a punta.

---

## Phase 6: Polish & Cross-Cutting Concerns (Testing & QA)

**Purpose**: Pruebas unitarias de baremo, pruebas de integración de idempotencia de puntos y checklist manual en Expo Go.

- [ ] T013 [P] Crear pruebas unitarias de `pointsScale.ts` (validación de límites por prioridad) en `client/src/utils/__tests__/pointsScale.test.ts`
- [ ] T014 [P] Crear pruebas de integración para `PATCH /api/denuncias/:id/validar-veracidad` (incremento atómico de puntos, rechazo fuera de baremo e idempotencia ante doble llamada) y `PATCH /api/denuncias/:id/certificar` en `server/src/__tests__/denuncias.certification.test.ts`
- [ ] T015 Ejecutar checklist de verificación manual en Expo Go (Acreditación de puntos por baremo, Cierre técnico del Agente y Certificación Antes vs. Después del Admin) en `specs/004-saneamiento-y-certificacion/checklists/requirements.md`

---

## Dependencies & Execution Order

- **Phase 1 & Phase 2** deben completarse primero.
- **Phase 3 (US1 - Acreditación de Puntos)** habilita el estado `EN_SANEAMIENTO`.
- **Phase 4 (US2 - Cierre Técnico Agente)** habilita el estado `RESUELTO_TECNICO`.
- **Phase 5 (US3 - Certificación Admin)** cierra el ciclo en `RESUELTO`.
- **Phase 6 (Testing)** valida la atomicidad e idempotencia financiera de puntos.
