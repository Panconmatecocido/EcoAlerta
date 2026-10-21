# Implementation Plan: Validación de Entrega por Colaborador y Expiración de Canjes

**Branch**: `006-entrega-colaborador-expiracion` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/006-entrega-colaborador-expiracion/spec.md)
**Input**: Feature specification from `/specs/006-entrega-colaborador-expiracion/spec.md`

## Summary

Implementar el cierre del ciclo de recompensas ecológicas:
1. **Panel Operativo del Colaborador Municipal (`COLLABORATOR`)**: Búsqueda de órdenes de canje por código alfanumérico (`codigoRetiro` ej. `ECO-2026-XXXX`), visualización del detalle completo (vecino, DNI/email, sucursal asignada, lista de productos y cantidades, estado y fecha de vencimiento) y **confirmación de entrega presencial** (`PENDIENTE_RETIRO` -> `ENTREGADO` con `fechaEntrega`), bloqueando cualquier doble entrega.
2. **Política de Expiración a los 30 Días (`RF-COL-03`)**: Cuando un canje en `PENDIENTE_RETIRO` supera su `fechaExpiracion` (`createdAt + 30 días`), pasa atómicamente a `CANCELADO`, **restituyendo las unidades físicas al `stock` de cada `Producto` pero SIN devolver los puntos (`totalPuntos`) al ciudadano**.
3. **Historial de Canjes del Ciudadano (`CITIZEN`)**: Vista en el perfil del vecino con todos sus vouchers (`codigoRetiro`), sucursal y horario de retiro, aviso de 48 hs hábiles, fecha de expiración y estado actual (`PENDIENTE_RETIRO`, `ENTREGADO`, `CANCELADO`).

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `@prisma/client` 5.22 (`prisma.$transaction`), `@react-native-async-storage/async-storage`  
**Storage**: PostgreSQL (Supabase) vía Prisma (`Canje`, `ItemCanje`, `Producto`, `Sucursal`, `User`) consumido exclusivamente vía API REST (`RemoteStoreRepository`), sin fallback local en memoria.
**Testing**: Jest / node:test + Supertest + Seed de BD (`server/prisma/seed.ts`) + Checklist manual en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Búsqueda por código `< 250ms`; confirmación de entrega `< 300ms`  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- En la expiración por superar los 30 días (`fechaExpiracion`), está estrictamente prohibido reembolsar puntos al ciudadano (`User.puntos` permanece sin cambios), mientras que el `Producto.stock` sí debe incrementarse con las unidades no retiradas.
- El rol `COLLABORATOR` solo tiene acceso a su panel de búsqueda y entrega de premios.
- En Fase 2, todas las lecturas y mutaciones operan 100% sobre la base de datos PostgreSQL, sin fallback a `LocalStoreRepository`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Extiende `CollaboratorHomeScreen.tsx` (creada en `001`), `ProfileScreen.tsx`, `canjes.controller.ts` y `canjes.routes.ts` (creados en `005`).
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Interfaz del Colaborador y tarjetas de vouchers del ciudadano construidas con `StyleSheet.create` y `theme.ts`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. En Fase 2 `storeRepository` delega directamente a `RemoteStoreRepository` contra Supabase PostgreSQL respetando `municipioId`.
- **Principio IV (RBAC)**: CUMPLE. Exclusivo para `COLLABORATOR` (y consulta propia para `CITIZEN`).
- **Principio VI (Transacciones Atómicas y Expiración 30 Días)**: CUMPLE. La expiración a los 30 días usa `prisma.$transaction` para pasar a `CANCELADO` y restaurar `Producto.stock` sin tocar `User.puntos`.
- **Principio VII (Testing y Seeds)**: CUMPLE. El seed de base de datos (`server/prisma/seed.ts`) incluye los canjes de prueba (`ECO-7894-K`, `ECO-2026-ENTR`, `ECO-2026-EXPD`). Pruebas automatizadas de entrega única y expiración a los 30 días + verificación manual en Expo Go.

## Project Structure

### Documentation (this feature)

```text
specs/006-entrega-colaborador-expiracion/
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
│   │   ├── citizen/
│   │   │   └── CitizenVouchersList.tsx       # [NUEVO] Lista de vouchers de canje del vecino con código, sucursal y estado
│   │   └── collaborator/
│   │       └── VoucherDetailCard.tsx         # [NUEVO] Tarjeta de detalle de orden de retiro para el Colaborador con botón "Confirmar Entrega"
│   ├── repositories/
│   │   └── store/
│   │       ├── IStoreRepository.ts           # [EXTENDER] Métodos getRedemptionByCode, confirmDelivery, getCitizenRedemptions
│   │       ├── RemoteStoreRepository.ts      # [EXTENDER] Conectar GET /api/canjes/codigo/:codigo, PATCH /api/canjes/:codigo/entregar, GET /api/canjes/ciudadano/:id
│   │       └── LocalStoreRepository.ts       # [EXTENDER] Soporte fallback local para búsqueda de código, entrega y expiración 30d
│   └── screens/
│       ├── citizen/
│       │   └── ProfileScreen.tsx             # [EXTENDER] Añadir selector/pestaña "Mis Canjes" mostrando CitizenVouchersList
│       └── collaborator/
│           └── CollaboratorHomeScreen.tsx    # [EXTENDER] Buscador de codigoRetiro, VoucherDetailCard y historial de entregas del día

server/
└── src/
    ├── controllers/
    │   └── canjes.controller.ts              # [EXTENDER] procesarCanjesExpirados30Dias, getCanjeByCodigo, confirmarEntregaCanje, getCanjesByCiudadano
    └── routes/
        └── canjes.routes.ts                  # [EXTENDER] Rutas GET /codigo/:codigoRetiro, PATCH /:codigoRetiro/entregar, GET /ciudadano/:ciudadanoId, POST /procesar-expirados
```

**Structure Decision**: Se reutiliza y extiende `canjes.controller.ts` y `IStoreRepository` creados en `005` para mantener toda la lógica de vouchers y stock cohesiva en un único dominio transaccional.

## Architecture & Implementation Details

### 1. Expiración Atómica a los 30 Días (`procesarCanjesExpirados30Dias`)
- Helper transaccional ejecutado automáticamente antes de consultar un código (`getCanjeByCodigo`), antes de listar canjes del ciudadano (`getCanjesByCiudadano`) y expuesto en `POST /api/canjes/procesar-expirados`:
  - Busca todos los registros en `Canje` donde `estado === 'PENDIENTE_RETIRO'` y `fechaExpiracion < new Date()`.
  - Por cada canje vencido, ejecuta `prisma.$transaction`:
    1. Actualiza `Canje.estado = 'CANCELADO'`.
    2. Por cada `ItemCanje`, incrementa `Producto.stock` (`{ increment: item.cantidad }`).
    3. **Regla Inquebrantable (`RF-COL-03`)**: NO modifica `User.puntos` (los puntos gastados en un canje no retirado en 30 días se pierden por penalización de inasistencia).

### 2. Búsqueda y Entrega por Colaborador (`server/src/controllers/canjes.controller.ts`)
- **`GET /api/canjes/codigo/:codigoRetiro` (`getCanjeByCodigo`)**:
  - Normaliza `codigoRetiro.trim().toUpperCase()`.
  - Ejecuta `procesarCanjesExpirados30Dias()` para asegurar que si el voucher venció hoy, su estado ya refleje `CANCELADO` y el stock haya sido devuelto.
  - Retorna el `Canje` con `ciudadano` (`nombre`, `email`), `sucursal` (`nombre`, `direccion`, `horario`) e `items` (con `producto.titulo`, `cantidad`, `puntosUnitarios`). Si no existe, retorna `404 Not Found`.
- **`PATCH /api/canjes/:codigoRetiro/entregar` (`confirmarEntregaCanje`)**:
  - Verifica que el canje exista.
  - Si `estado === 'ENTREGADO'`, retorna `409 Conflict` (`"Este premio ya fue entregado anteriormente"`).
  - Si `estado === 'CANCELADO'` o `fechaExpiracion < new Date()`, retorna `409 Conflict` (`"El código de retiro ha expirado (plazo de 30 días vencido)"`).
  - Actualiza `estado = 'ENTREGADO'` y `fechaEntrega = new Date()`.

### 3. Pantallas (`CollaboratorHomeScreen.tsx` y `ProfileScreen.tsx`)
- **`CollaboratorHomeScreen.tsx`**:
  - Buscador con input de texto en mayúsculas automáticas (ej. `ECO-2026-0001`), label fuera del input y botón `"Buscar Código"`.
  - Renderiza `VoucherDetailCard` con semáforo visual:
    - Verde (`PENDIENTE_RETIRO` vigente): muestra productos a entregar y habilita el botón `"Confirmar Entrega de Premio"`.
    - Azul/Gris (`ENTREGADO`): muestra fecha de entrega y bloquea el botón.
    - Rojo (`CANCELADO` / Expirado): informa que superó los 30 días, que el stock fue restituido y bloquea la entrega.
- **`ProfileScreen.tsx` (`CitizenVouchersList.tsx`)**:
  - Añade selector de pestaña en el perfil del vecino: `"Mis Reportes"` | `"Mis Canjes"`.
  - Muestra cada canje con su `codigoRetiro` destacado para presentar al Colaborador, la `Sucursal` y dirección de retiro, recordatorio de disponibilidad a partir de las 48 hs hábiles, `fechaExpiracion` y badge de estado.

## Complexity Tracking

> Sin violaciones a la Constitución.
