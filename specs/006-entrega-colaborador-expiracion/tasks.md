# Tasks: Validación de Entrega por Colaborador y Expiración de Canjes

**Input**: Design documents from `/specs/006-entrega-colaborador-expiracion/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/006-entrega-colaborador-expiracion/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/006-entrega-colaborador-expiracion/spec.md), `001-auth-rbac`, `005-tienda-carrito-checkout`

**Tests**: Incluidas según el Principio VII de la Constitución (entrega única por `codigoRetiro` y expiración a los 30 días con restitución de stock sin reembolso de puntos).

**Organization**: Tareas agrupadas por historia de usuario (`US1`, `US2`, `US3`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo
- **[Story]**: Historia de usuario asociada (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup (Shared UI Components)

**Purpose**: Crear los componentes visuales de tarjeta de orden de retiro para el Colaborador y listado de vouchers para el Ciudadano usando `StyleSheet.create` y `theme.ts`.

- [x] T001 [P] Crear el componente `VoucherDetailCard` con `StyleSheet.create` y `theme.ts` para mostrar datos del ciudadano, sucursal, ítems del canje, estado (`PENDIENTE_RETIRO`, `ENTREGADO`, `CANCELADO`) y botón `"Confirmar Entrega"` en `client/src/components/collaborator/VoucherDetailCard.tsx`
- [x] T002 [P] Crear el componente `CitizenVouchersList` con `StyleSheet.create` y `theme.ts` para mostrar los vouchers del vecino con su `codigoRetiro`, sucursal, horario, aviso de 48 hs hábiles y fecha de vencimiento en `client/src/components/citizen/CitizenVouchersList.tsx`

---

## Phase 2: Foundational (Backend Endpoints & Repository Extensions)

**Purpose**: Extender `canjes.controller.ts` y `IStoreRepository` con búsqueda por código, entrega presencial y expiración a los 30 días.

**⚠️ CRITICAL**: Bloqueante para el panel del Colaborador y la pestaña "Mis Canjes" del Ciudadano.

- [x] T003 Implementar `procesarCanjesExpirados30Dias` (pasa `PENDIENTE_RETIRO` vencidos a `CANCELADO`, incrementa `Producto.stock` en `prisma.$transaction` y **no devuelve puntos** a `User.puntos`), `getCanjeByCodigo`, `confirmarEntregaCanje` y `getCanjesByCiudadano` en `server/src/controllers/canjes.controller.ts`
- [x] T004 Registrar las rutas `GET /api/canjes/codigo/:codigoRetiro`, `PATCH /api/canjes/:codigoRetiro/entregar`, `GET /api/canjes/ciudadano/:ciudadanoId` y `POST /api/canjes/procesar-expirados` en `server/src/routes/canjes.routes.ts`
- [x] T005 Extender `IStoreRepository`, `RemoteStoreRepository` y `LocalStoreRepository` con los métodos `getRedemptionByCode`, `confirmDelivery` y `getCitizenRedemptions` en `client/src/repositories/store/IStoreRepository.ts`, `client/src/repositories/store/RemoteStoreRepository.ts` y `client/src/repositories/store/LocalStoreRepository.ts`

**Checkpoint**: Endpoints de validación de código, entrega y expiración de 30 días listos.

---

## Phase 3: User Story 1 - Búsqueda de Código de Retiro y Confirmación de Entrega (Priority: P1) 🎯 MVP

**Goal**: Permitir al Colaborador Municipal (`COLLABORATOR`) buscar un `codigoRetiro` (`ECO-2026-XXXX`), verificar la identidad del vecino y los productos, y registrar la entrega pasando el canje a `ENTREGADO` con bloqueo de doble entrega.

**Independent Test**: Iniciar sesión como `COLLABORATOR`, ingresar un código `ECO-2026-XXXX` en `PENDIENTE_RETIRO`, ver los productos y pulsar "Confirmar Entrega". Comprobar que pasa a `ENTREGADO` con `fechaEntrega` y que si se vuelve a buscar el mismo código el botón de entrega aparece deshabilitado.

### Implementation for User Story 1

- [x] T006 [US1] Implementar en `CollaboratorHomeScreen` el buscador de `codigoRetiro` (con normalización a mayúsculas y labels fuera del input), integración con `VoucherDetailCard`, confirmación de entrega y resumen de entregas recientes en `client/src/screens/collaborator/CollaboratorHomeScreen.tsx`

**Checkpoint**: Panel del Colaborador Municipal completamente operativo.

---

## Phase 4: User Story 2 - Expiración Automática a los 30 Días con Restitución de Stock y Pérdida de Puntos (Priority: P1)

**Goal**: Garantizar que todo canje no retirado pasados los 30 días (`fechaExpiracion`) pase a `CANCELADO`, devuelva las unidades físicas al `stock` de `Producto` y no reembolse los puntos al ciudadano, informando claramente el motivo tanto al Colaborador como al Ciudadano.

**Independent Test**: Consultar un canje cuya `fechaExpiracion` esté en el pasado; verificar que su estado es `CANCELADO`, que el stock del producto subió en la cantidad correspondiente, que `User.puntos` no subió y que `CollaboratorHomeScreen` impide entregarlo mostrando alerta de código expirado.

### Implementation for User Story 2

- [x] T007 [US2] Añadir visualización explícita de alerta de expiración (+30 días vencidos, stock restituido al inventario municipal, sin reembolso de puntos) en `VoucherDetailCard` y `CitizenVouchersList` en `client/src/components/collaborator/VoucherDetailCard.tsx` y `client/src/components/citizen/CitizenVouchersList.tsx`

**Checkpoint**: Regla de expiración de 30 días visible y auditada en UI y Backend.

---

## Phase 5: User Story 3 - Historial y Estado de Vouchers de Canje para el Ciudadano (Priority: P2)

**Goal**: Permitir que el vecino consulte en su perfil todos sus vouchers (`codigoRetiro`), la sucursal de retiro, la fecha de vencimiento y el estado actual (`PENDIENTE_RETIRO`, `ENTREGADO`, `CANCELADO`).

**Independent Test**: Iniciar sesión como `CITIZEN`, abrir `ProfileScreen`, cambiar a la pestaña `"Mis Canjes"` y verificar que se listan sus vouchers con código `ECO-2026-XXXX`, sucursal y estado actualizado tras la entrega del Colaborador.

### Implementation for User Story 3

- [x] T008 [US3] Agregar selector de pestañas (`"Mis Reportes"` | `"Mis Canjes"`) en `ProfileScreen` e integrar `CitizenVouchersList` conectado a `IStoreRepository.getCitizenRedemptions` en `client/src/screens/citizen/ProfileScreen.tsx`

**Checkpoint**: Trazabilidad de vouchers para el ciudadano completada.

---

## Phase 6: Polish & Cross-Cutting Concerns (Testing & QA)

**Purpose**: Pruebas de integración de entrega única y expiración a los 30 días + checklist manual en Expo Go.

- [x] T009 [P] Crear pruebas de integración para `GET /api/canjes/codigo/:codigoRetiro`, `PATCH /api/canjes/:codigoRetiro/entregar` (rechazo `409` en intento de doble entrega) y `procesarCanjesExpirados30Dias` (verificar `Producto.stock` restaurado y `User.puntos` sin reembolso) en `server/src/__tests__/canjes.collaborator.test.ts`
- [x] T010 Ejecutar checklist de verificación manual en Expo Go (Login `COLLABORATOR`, búsqueda de código válido/inexistente, confirmación de entrega, bloqueo de segunda entrega, canje vencido a los 30 días y pestaña "Mis Canjes" del vecino) en `specs/006-entrega-colaborador-expiracion/checklists/requirements.md`

---

## Phase 7: Phase 2 Alignment (Exclusive DB Consumption & Database Seed)

**Purpose**: Alinear el módulo con los requerimientos de Fase 2: datos directos desde la Base de Datos PostgreSQL (Supabase) sin fallback local, y siembra de órdenes de canje de prueba.

- [x] T011 Suprimir el fallback local en `client/src/repositories/store/index.ts` haciendo que `storeRepository` consuma exclusivamente `RemoteStoreRepository` y propague los errores del servidor a la interfaz de usuario.
- [x] T012 Sembrar directamente en PostgreSQL (`server/prisma/seed.ts`) las órdenes de prueba `ECO-7894-K` (vigente), `ECO-2026-ENTR` (entregado) y `ECO-2026-EXPD` (expirado > 30 días) asociadas al ciudadano `ejemplo@email.com` y sucursales municipales, ejecutando la siembra en la BD.
- [x] T013 [US2] Implementar endpoint POST /api/canjes/procesar-expirados para barrido y ejecución masiva de cancelaciones por expiración de 30 días en `server/src/controllers/canjes.controller.ts`

---

## Dependencies & Execution Order

- **Phase 1 & Phase 2** deben completarse primero (requieren las tablas y controladores base de `005-tienda-carrito-checkout`).
- **Phase 3 (US1 - Entrega Colaborador)** y **Phase 4 (US2 - Expiración 30 días)** conforman el núcleo operativo del módulo.
- **Phase 5 (US3 - Mis Canjes en Perfil)** puede implementarse en paralelo tras Phase 2.
- **Phase 6 (Testing)** cierra la verificación integral del proyecto.
- **Phase 7 (Phase 2 Alignment)** elimina fallbacks simulados y asegura la siembra en PostgreSQL.

