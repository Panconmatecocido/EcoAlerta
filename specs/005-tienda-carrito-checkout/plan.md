# Implementation Plan: Tienda Ecológica, Carrito Reactivo y Checkout con Bloqueo Temporal

**Branch**: `005-tienda-carrito-checkout` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/005-tienda-carrito-checkout/spec.md)
**Input**: Feature specification from `/specs/005-tienda-carrito-checkout/spec.md`

## Summary

Implementar la **Tienda Ecológica y Flujo de Canje** conectada a PostgreSQL vía Prisma (`Producto`, `Sucursal`, `Canje`, `ItemCanje`) y al Patrón Repositorio (`IStoreRepository`):
1. **Catálogo Ciudadano e Invitado**: Listado de productos con `activo === true`, mostrando costo en puntos y stock disponible. En **Modo Invitado (`user === null`)**, el catálogo es 100% navegable pero pulsar `"Agregar al Carrito"` dispara el **Auth Gate** solicitando registro/login.
2. **Carrito Reactivo (`CartContext.tsx`)**: Persistencia en `AsyncStorage`, validación de `cantidad <= stock` y `totalPuntos <= user.puntos`, **eliminando cualquier recargo de envío en dinero (`$2.500 ARS`)** para que el canje sea 100% en puntos con retiro presencial.
3. **Checkout en 2 Fases con Bloqueo Temporal de 5 Minutos (TTL)**:
   - *Fase 1 (`POST /api/canjes/reservar`)*: Reserva stock atómicamente (`RESERVADO_PENDIENTE`, `bloqueadoHasta = now + 5 min`) y muestra un temporizador regresivo (`05:00`) mientras el vecino elige la `Sucursal` municipal de retiro (con aviso de disponibilidad a las 48 hs hábiles). Si expira el TTL o el usuario cancela, se libera el stock automáticamente.
   - *Fase 2 (`POST /api/canjes/confirmar`)*: Dentro de la ventana de 5 minutos, descuenta `totalPuntos` de `User.puntos`, genera el `codigoRetiro` único (`ECO-2026-XXXX`), fija `fechaExpiracion = now + 30 días` y pasa a `PENDIENTE_RETIRO`.
4. **ABM Administrativo de Productos y Sucursales (`ADMIN`)**: Creación, edición de stock/precio y **baja lógica estricta (`activo: false`)** de productos y sucursales sin romper el historial de canjes.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `@prisma/client` 5.22 (`prisma.$transaction`), `@react-native-async-storage/async-storage`  
**Storage**: PostgreSQL (Supabase) vía Prisma (`Producto`, `Sucursal`, `Canje`, `ItemCanje`, `User`) + `AsyncStorage` (`@ecoalerta_cart`)  
**Testing**: Jest con `jest.useFakeTimers()` (para el bloqueo de stock de 5 minutos y liberación por expiración) + Supertest + Checklist manual en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Reserva transaccional de stock `< 300ms`; confirmación de checkout `< 300ms`; recálculo reactivo de carrito `< 16ms` (60fps)  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- Prohibido cobrar o mostrar costos de envío en moneda (`ARS`); el carrito opera únicamente con puntos ambientales y retiro presencial en `Sucursal`.
- Prohibido ejecutar `DELETE` físico sobre `Producto` cuando tiene historial o desde el ABM; siempre aplicar baja lógica (`activo = false`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Reutiliza y extiende `StoreScreen.tsx`, `CartScreen.tsx`, `CartContext.tsx`, `AdminHomeScreen.tsx` y `AdminNavigator.tsx`.
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Todos los componentes de tienda, modal de checkout con temporizador `05:00` y pantalla de ABM Admin usan `StyleSheet.create` y `theme.ts`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. Introduce `IStoreRepository` (`RemoteStoreRepository` + `LocalStoreRepository`) y filtra productos y sucursales por `municipioId`.
- **Principio IV (RBAC + Modo Invitado)**: CUMPLE. Invitados ven productos pero son interceptados por el Auth Gate al intentar agregar al carrito; Agentes no tienen acceso a la tienda.
- **Principio VI (Transacciones Atómicas, Bloqueo 5m y Baja Lógica)**: CUMPLE. `prisma.$transaction` gestiona la reserva de 5 minutos (`bloqueadoHasta`), liberación perezosa/activa de reservas vencidas, confirmación de puntos y baja lógica `activo = false`.
- **Principio VII (Testing con `jest.useFakeTimers()`)**: CUMPLE. Incluye suite dedicada con `jest.useFakeTimers()` para probar la expiración del bloqueo de 5 minutos.

## Project Structure

### Documentation (this feature)

```text
specs/005-tienda-carrito-checkout/
├── spec.md              # Especificación de requisitos e historias de usuario
├── plan.md              # Este archivo de plan técnico
├── tasks.md             # Lista de tareas ejecutables ordenadas por dependencias
└── checklists/
    └── requirements.md  # Checklist de calidad (16/16 validado)
```

### Source Code (repository root)

```text
client/
├── src/
│   ├── components/
│   │   └── citizen/
│   │       └── CheckoutReservationModal.tsx  # [NUEVO] Modal de Checkout con temporizador 05:00, selector de Sucursal (aviso 48hs) y voucher ECO-2026-XXXX
│   ├── context/
│   │   └── CartContext.tsx                   # [EXTENDER] Persistencia en AsyncStorage, límite de stock y eliminación de costo de envío en ARS
│   ├── navigation/
│   │   └── AdminNavigator.tsx                # [EXTENDER] Añadir ruta AdminProductosScreen para el ABM de catálogo y sucursales
│   ├── repositories/
│   │   └── store/
│   │       ├── IStoreRepository.ts           # [NUEVO] Contrato de repositorio para productos, sucursales y checkout en 2 fases
│   │       ├── RemoteStoreRepository.ts      # [NUEVO] Implementación HTTP contra /api/productos, /api/sucursales y /api/canjes
│   │       ├── LocalStoreRepository.ts       # [NUEVO] Fallback local con soporte de reserva TTL de 5 minutos
│   │       └── index.ts                      # [NUEVO] Selector de repositorio
│   └── screens/
│       ├── admin/
│       │   ├── AdminHomeScreen.tsx           # [EXTENDER] Acceso directo al ABM de Productos y Sucursales
│       │   └── AdminProductosScreen.tsx      # [NUEVO] Pantalla de ABM de productos y sucursales con baja lógica (activo: false)
│       └── citizen/
│           ├── StoreScreen.tsx               # [EXTENDER] Consumir IStoreRepository, indicador "Sin Stock" y Auth Gate para invitados
│           └── CartScreen.tsx                # [EXTENDER] Eliminar cargo de envío ARS, validar puntos/stock e iniciar reserva de 5 minutos

server/
├── prisma/
│   └── seed.ts                               # [EXTENDER] Sembrar productos ecológicos y sucursales municipales iniciales
└── src/
    ├── controllers/
    │   ├── productos.controller.ts           # [NUEVO] CRUD de Productos y Sucursales con baja lógica (activo: false)
    │   └── canjes.controller.ts              # [NUEVO] reservarCanje (TTL 5m), cancelarReserva, confirmarCanje (voucher ECO-2026-XXXX + 30 días), liberarReservasVencidas
    ├── routes/
    │   ├── productos.routes.ts               # [NUEVO] Rutas /api/productos y /api/sucursales
    │   └── canjes.routes.ts                  # [NUEVO] Rutas /api/canjes/reservar, /api/canjes/:id/confirmar, /api/canjes/:id/cancelar-reserva
    └── index.ts                              # [EXTENDER] Montar /api/productos, /api/sucursales y /api/canjes
```

**Structure Decision**: Se crean `productos.controller.ts` y `canjes.controller.ts` en `server/src/controllers/` para separar claramente el dominio de tienda/canjes del de denuncias, y en `client/src/` se añade `repositories/store/` junto con `AdminProductosScreen.tsx` y `CheckoutReservationModal.tsx`.

## Architecture & Implementation Details

### 1. Liberación Automática de Reservas Vencidas (`liberarReservasVencidas`)
- Helper transaccional que se ejecuta antes de listar productos o iniciar una nueva reserva (y disponible por endpoint/cron):
  - Busca todos los `Canje` con `estado === 'RESERVADO_PENDIENTE'` y `bloqueadoHasta < new Date()`.
  - Por cada uno, en `prisma.$transaction`: restaura `stock: { increment: item.cantidad }` en cada `Producto` de sus `ItemCanje` y cambia el `Canje` a `estado = 'CANCELADO'`.
- Esto garantiza exactitud matemática del stock sin depender de procesos externos frágiles, siendo 100% testeable con `jest.useFakeTimers()`.

### 2. Checkout en 2 Fases (`server/src/controllers/canjes.controller.ts`)
- **Fase 1 - `POST /api/canjes/reservar`**:
  - Primero ejecuta `liberarReservasVencidas()`.
  - Verifica que el usuario tenga rol `CITIZEN` y `user.puntos >= totalPuntos`.
  - En `prisma.$transaction`:
    1. Verifica que cada `Producto` esté `activo === true` y tenga `stock >= cantidad`. Si alguno no alcanza, aborta con `409 Conflict` detallando el producto sin stock.
    2. Decrementa preventivamente `Producto.stock` por cada ítem.
    3. Crea el registro `Canje` en estado `RESERVADO_PENDIENTE` con `bloqueadoHasta = new Date(Date.now() + 5 * 60 * 1000)` y sus `ItemCanje`.
- **Fase 2 - `POST /api/canjes/:id/confirmar`**:
  - Recibe `{ sucursalId: string, ciudadanoId: string }`.
  - Verifica que el `Canje` esté en `RESERVADO_PENDIENTE`, pertenezca a `ciudadanoId` y que `new Date() <= canje.bloqueadoHasta`. Si ya venció, ejecuta la liberación de stock y retorna `410 Gone` (`"El tiempo de reserva de 5 minutos ha expirado"`).
  - Verifica que `Sucursal` exista y esté activa.
  - En `prisma.$transaction`:
    1. Descuenta `totalPuntos` de `User.puntos` (`decrement: canje.totalPuntos`).
    2. Genera `codigoRetiro` único (`ECO-2026-XXXX`) y actualiza `Canje` a `estado = 'PENDIENTE_RETIRO'`, `sucursalId`, `bloqueadoHasta = null`, `fechaExpiracion = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)`.

### 3. Carrito Reactivo y UI (`CartContext.tsx`, `StoreScreen.tsx`, `CartScreen.tsx`)
- En `CartContext.tsx`: persistir `items` en `AsyncStorage` (`@ecoalerta_cart`), impedir que `quantity` supere `product.stock` y calcular `totalPoints` sin cargos en ARS.
- En `StoreScreen.tsx`: si `user === null`, mostrar el catálogo completo pero al pulsar `"Agregar"` abrir `AuthGateModal`.
- En `CartScreen.tsx`: eliminar la fila de `"Envío: $2.500"`, mostrar saldo actual del vecino vs. `totalPoints`, y al pulsar `"Iniciar Canje"` llamar a `reservarCanje` abriendo `CheckoutReservationModal` con el reloj regresivo `05:00` y el selector de `Sucursal` (informando disponibilidad a partir de las 48 hs hábiles).

## Complexity Tracking

> Sin violaciones a la Constitución.
