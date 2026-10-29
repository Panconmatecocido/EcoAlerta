# Tasks: Tienda Ecológica, Carrito Reactivo y Checkout con Bloqueo Temporal

**Input**: Design documents from `/specs/005-tienda-carrito-checkout/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/005-tienda-carrito-checkout/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/005-tienda-carrito-checkout/spec.md), `001-auth-rbac`

**Tests**: Incluidas según el Principio VII de la Constitución (incluyendo `jest.useFakeTimers()` para el bloqueo de stock de 5 minutos).

**Organization**: Tareas agrupadas por historia de usuario (`US1` a `US4`).

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo
- **[Story]**: Historia de usuario asociada (`[US1]` a `[US4]`)

---

## Phase 1: Setup (Database Seed & Backend Routes Wiring)

**Purpose**: Sembrar productos y sucursales municipales en Prisma y preparar el montaje de rutas en Express.

- [X] T001 Actualizar `server/prisma/seed.ts` para sembrar al menos 4 productos ecológicos (`activo: true`) y 2 sucursales municipales (`Sucursal` con nombre, dirección y horario) asociadas al municipio `MUN-001` en `server/prisma/seed.ts`

---

## Phase 2: Foundational (Backend Controllers & Store Repository)

**Purpose**: Construir los endpoints de catálogo, sucursales y checkout en 2 fases (reserva TTL 5 min + confirmación) y la capa `IStoreRepository`.

**⚠️ CRITICAL**: Bloqueante para la tienda ciudadana, el carrito y el ABM administrativo.

- [X] T002 Crear `productos.controller.ts` con listado público de productos activos (`activo: true`), listado completo para Admin, creación, edición y baja lógica (`activo: false`), más listado/ABM de `Sucursal` en `server/src/controllers/productos.controller.ts`
- [X] T003 Crear `canjes.controller.ts` con `liberarReservasVencidas`, `reservarCanje` (`RESERVADO_PENDIENTE`, `bloqueadoHasta = +5 min` y descuento preventivo de stock en `prisma.$transaction`), `cancelarReserva` y `confirmarCanje` (descuento de `User.puntos`, `codigoRetiro = ECO-2026-XXXX`, `fechaExpiracion = +30 días`, `PENDIENTE_RETIRO`) en `server/src/controllers/canjes.controller.ts`
- [X] T004 Crear las rutas `server/src/routes/productos.routes.ts` y `server/src/routes/canjes.routes.ts` y montarlas en `server/src/index.ts`
- [X] T005 [P] Definir la interfaz `IStoreRepository` y tipos (`StoreProduct`, `StoreBranch`, `ReservationResponse`, `ConfirmRedemptionResponse`) en `client/src/repositories/store/IStoreRepository.ts`
- [X] T006 [P] Implementar `RemoteStoreRepository` y `LocalStoreRepository` (con lógica de reserva temporal de 5 minutos y persistencia en `AsyncStorage`) en `client/src/repositories/store/RemoteStoreRepository.ts`, `client/src/repositories/store/LocalStoreRepository.ts` y `client/src/repositories/store/index.ts`

**Checkpoint**: API `/api/productos`, `/api/sucursales`, `/api/canjes` y `IStoreRepository` listos.

---

## Phase 3: User Story 1 - Exploración de Catálogo Ecológico (Ciudadano e Invitado) (Priority: P1) 🎯 MVP

**Goal**: Mostrar el catálogo de productos activos con su costo en puntos y stock disponible; permitir la vista en Modo Invitado (`user === null`) pero disparar el Auth Gate al pulsar `"Agregar al Carrito"`.

**Independent Test**: Abrir la pestaña Tienda como invitado (`user === null`), ver productos y pulsar "Agregar" (debe abrir el Auth Gate). Luego iniciar sesión como `CITIZEN` y comprobar que permite agregar productos con stock `> 0` y muestra `"Sin Stock"` cuando `stock === 0`.

### Implementation for User Story 1

- [X] T007 [US1] Actualizar `StoreScreen` para cargar productos desde `IStoreRepository.getProducts`, mostrar badge `"Sin Stock"` cuando `stock === 0` e interceptar el botón `"Agregar"` con el Auth Gate si `user === null` en `client/src/screens/citizen/StoreScreen.tsx`

**Checkpoint**: Catálogo conectado a datos reales y protegido para invitados.

---

## Phase 4: User Story 2 - Carrito Reactivo 100% en Puntos y Validación de Saldo/Stock (Priority: P1)

**Goal**: Gestionar ítems en `CartContext` con persistencia en `AsyncStorage`, tope por stock disponible, validación contra `user.puntos` y **eliminación total del costo de envío en dinero (`$2.500 ARS`)**.

**Independent Test**: Agregar varios productos al carrito, incrementar/decrementar cantidades verificando que no supere el stock ni permita avanzar si `totalPoints > user.puntos`, y comprobar que en `CartScreen` no existe ningún cobro en pesos (`ARS`).

### Implementation for User Story 2

- [X] T008 [US2] Actualizar `CartContext` para persistir el carrito en `AsyncStorage` (`@ecoalerta_cart`), validar el límite de `stock` al incrementar unidades y exponer `totalPoints` sin cargos monetarios en `client/src/context/CartContext.tsx`
- [X] T009 [US2] Refactorizar `CartScreen` usando `StyleSheet.create` y `theme.ts` para eliminar el cargo de envío de `$2.500 ARS`, mostrar comparativa `Saldo Actual vs. Total a Canjear` y habilitar/deshabilitar el botón `"Continuar al Canje"` según alcance de puntos y stock en `client/src/screens/citizen/CartScreen.tsx`

**Checkpoint**: Carrito reactivo 100% en puntos operativo.

---

## Phase 5: User Story 3 - Checkout con Reserva Temporal de 5 Minutos, Selección de Sucursal y Voucher (Priority: P1)

**Goal**: Ejecutar la reserva temporal de stock por 5 minutos (`05:00`), permitir elegir la `Sucursal` municipal de retiro (con aviso de disponibilidad a las 48 hs hábiles) y confirmar el canje generando el voucher `ECO-2026-XXXX` con validez de 30 días.

**Independent Test**: Pulsar "Continuar al Canje" en `CartScreen`, ver el reloj regresivo de `05:00`, seleccionar una sucursal y confirmar; verificar que descuenta los puntos del usuario, vacía el carrito y muestra el código `ECO-2026-XXXX` con sucursal, aviso de 48 hs y fecha de vencimiento (+30 días).

### Implementation for User Story 3

- [X] T010 [P] [US3] Crear el componente `CheckoutReservationModal` con `StyleSheet.create` y `theme.ts` que incluye contador regresivo de 5 minutos (`300s`), selector de `Sucursal`, aviso de retiro a partir de 48 hs hábiles y vista final del voucher `ECO-2026-XXXX` en `client/src/components/citizen/CheckoutReservationModal.tsx`
- [X] T011 [US3] Conectar `CartScreen` con `IStoreRepository.reserveCart`, `IStoreRepository.confirmRedemption` y `IStoreRepository.cancelReservation` (al cerrar o expirar el reloj), actualizando el saldo de `AuthContext` tras confirmar en `client/src/screens/citizen/CartScreen.tsx`

**Checkpoint**: Checkout en 2 fases con bloqueo TTL de 5 minutos y generación de voucher completado.

---

## Phase 6: User Story 4 - ABM de Productos, Sucursales y Baja Lógica por Administrador (Priority: P2)

**Goal**: Permitir al `ADMIN` crear/editar productos y sucursales, y desactivar productos mediante baja lógica (`activo = false`) sin romper los canjes históricos.

**Independent Test**: Iniciar sesión como `ADMIN`, abrir la gestión de productos, crear un producto nuevo, editar el stock de otro y desactivar un tercero (`activo = false`); comprobar que el desactivado ya no aparece en la tienda del ciudadano pero conserva su integridad en la base de datos.

### Implementation for User Story 4

- [X] T012 [P] [US4] Crear la pantalla `AdminProductosScreen` con `StyleSheet.create` y `theme.ts` para listar, crear, editar stock/puntos y alternar `activo` (`true`/`false`) de productos y sucursales en `client/src/screens/admin/AdminProductosScreen.tsx`
- [X] T013 [US4] Registrar `AdminProductosScreen` en `AdminNavigator` y agregar tarjeta de acceso en `AdminHomeScreen` en `client/src/navigation/AdminNavigator.tsx` y `client/src/screens/admin/AdminHomeScreen.tsx`

**Checkpoint**: ABM administrativo con baja lógica operativo.

---

## Phase 7: Polish & Cross-Cutting Concerns (Testing with `jest.useFakeTimers()` & QA)

**Purpose**: Validar matemáticamente el bloqueo de stock de 5 minutos, el descuento de puntos y la baja lógica.

- [X] T014 [P] Crear suite de pruebas con `jest.useFakeTimers()` que verifique la reserva de stock por 5 minutos (`300.000 ms`), la restitución automática del stock si no se confirma a tiempo y la confirmación exitosa con descuento de puntos en `server/src/__tests__/canjes.checkout.test.ts`
- [X] T015 [P] Crear pruebas unitarias de `CartContext` / lógica de cálculo de puntos y límite de stock (verificando ausencia de cargos en ARS) en `client/src/context/__tests__/cart.test.ts`
- [X] T016 Ejecutar checklist de verificación manual en Expo Go (Tienda como Invitado + Auth Gate, Carrito 100% en puntos, Reloj de 5 minutos en Checkout, Voucher `ECO-2026-XXXX` y ABM Admin con baja lógica) en `specs/005-tienda-carrito-checkout/checklists/requirements.md`
- [X] T017 [US3] Implementar worker batch POST /api/canjes/liberar-vencidas y endpoints de consulta por ID GET /api/productos/:id y GET /api/canjes/:id para auditoría y saneamiento de reservas expiradas en `server/src/controllers/canjes.controller.ts` y `server/src/controllers/productos.controller.ts`

---

## Dependencies & Execution Order

- **Phase 1 & Phase 2** son prerrequisitos bloqueantes.
- **Phase 3 (US1 - Catálogo)** y **Phase 4 (US2 - Carrito)** preceden a **Phase 5 (US3 - Checkout 5 min)**.
- **Phase 6 (US4 - ABM Admin)** puede ejecutarse en paralelo tras completar Phase 2.
- **Phase 7 (Testing)** certifica el TTL de 5 minutos con `jest.useFakeTimers()`.

## Ajustes de UX posteriores

- [x] T018 [US1] Reemplazar los productos mockeados del carrusel del Inicio por productos de `storeRepository`, manejar estados de carga/error/vacío y alternativas ante imágenes inaccesibles; al pulsar un producto validar rol y stock, agregarlo al carrito y navegar a `Cart` en `client/src/screens/citizen/HomeScreenPrueba/CarruselPrueba.tsx`.
- [x] T019 [US1] Insertar banners de `Anuncios` a ancho completo cada tres filas de productos en la tienda; recalcular posiciones a partir de los resultados filtrados y mostrar un banner debajo del último producto o como única fila cuando no haya resultados, con pruebas unitarias de distribución en `client/src/screens/citizen/StoreScreen.tsx`, `client/src/utils/storeGrid.ts` y `client/src/utils/__tests__/storeGrid.test.ts`.
- [x] T020 [US1] Quitar el engranaje de configuración únicamente del encabezado de la Tienda, manteniendo el espacio reservado para conservar el logo centrado en `client/src/components/Header.tsx` y `client/src/screens/citizen/StoreScreen.tsx`.
- [x] T021 [US1] Quitar la estrella decorativa del saldo de EcoPuntos en la Tienda y ajustar el espaciado del valor en `client/src/screens/citizen/StoreScreen.tsx`.
- [x] T022 [US1] Retirar el bloque duplicado de saldo situado a la izquierda y destacar el saldo junto al acceso al carrito en la parte derecha de la tarjeta superior en `client/src/screens/citizen/StoreScreen.tsx`.
- [x] T023 [US1] Integrar el saldo de EcoPuntos y el acceso al carrito en la parte derecha del encabezado de la Tienda, retirar la tarjeta de saldo independiente y mantener el logo centrado en `client/src/components/Header.tsx` y `client/src/screens/citizen/StoreScreen.tsx`.
- [x] T024 [US1] Agregar separación entre el encabezado y las categorías, y destacar la fila de categorías con un tono verde suave de fondo en `client/src/screens/citizen/StoreScreen.tsx`.
