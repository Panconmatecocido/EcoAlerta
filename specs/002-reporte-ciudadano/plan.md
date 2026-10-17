# Implementation Plan: Creación y Seguimiento de Reportes Ciudadanos

**Branch**: `002-reporte-ciudadano` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/002-reporte-ciudadano/spec.md)
**Input**: Feature specification from `/specs/002-reporte-ciudadano/spec.md`

## Summary

Implementar el flujo completo de creación, seguimiento y baja lógica visual de reportes ambientales para el rol Ciudadano (`CITIZEN`), respetando el bloqueo de Auth Gate para invitados (`user === null`). Incluye captura fotográfica por cámara o galería con compresión obligatoria a `< 1.2 MB` (resolución máxima `1080px`), obtención de coordenadas GPS (`latitud`, `longitud`) combinadas con dirección manual de referencia, generación de código correlativo único (`REP-2026-XXX`), estado inicial `PENDIENTE` con **0 puntos acreditados al momento del envío**, visualización en tiempo real de los estados del ciclo de vida y borrado lógico visual (`ocultarUsuario = true`) que conserva el registro para el Municipio.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `expo-camera`, `expo-image-picker`, `expo-location`, `expo-image-manipulator` (o compresión integrada con `quality` y redimensionado a `1080px`), `@prisma/client` 5.22  
**Storage**: PostgreSQL (Supabase) vía Prisma (`model Denuncia`) + caché local en `AsyncStorage` vía `IReportRepository`  
**Testing**: Jest (compresión de imagen, generación de código `REP-2026-XXX`, regla de 0 puntos iniciales y `ocultarUsuario`) + Checklist manual en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Compresión de foto `< 1.5s`; creación de reporte `< 1s`; carga de historial del vecino `< 500ms`  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- Prohibido acreditar puntos al crear el reporte (`puntosOtorgados = 0` y saldo del vecino intacto hasta que el Admin valide la verificación del Agente en el módulo `004`).
- Prohibido hacer `DELETE` físico de denuncias cuando el ciudadano las elimina de su historial; solo se actualiza `ocultarUsuario = true`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Extiende `client/src/screens/citizen/ReportScreen.tsx`, `ProfileScreen.tsx`, `HomeScreenPrueba/FotosPuntos.tsx`, `server/src/controllers/denuncias.controller.ts` y `server/src/routes/denuncias.routes.ts`.
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Formularios con labels fuera de los inputs, paleta verde institucional y badges semánticos por estado en `StyleSheet.create`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. Introduce `IReportRepository` (`RemoteReportRepository` + `LocalReportRepository`) y asocia cada denuncia al `municipioId` del ciudadano.
- **Principio IV (RBAC + Auth Gate)**: CUMPLE. Si `user === null`, intentar acceder a `ReportScreen` o `ProfileScreen` activa el Auth Gate definido en `001`.
- **Principio V (Regla de Puntos Cero al Reportar)**: CUMPLE. `POST /api/denuncias` guarda la denuncia en `PENDIENTE` sin sumar puntos al ciudadano.
- **Principio VI (Integridad y Baja Lógica)**: CUMPLE. `PATCH /api/denuncias/:id/ocultar` marca `ocultarUsuario = true` sin eliminar la fila en PostgreSQL.
- **Principio VII (Testing)**: CUMPLE. Pruebas automatizadas de backend/repositorio + checklist manual en Expo Go.

## Project Structure

### Documentation (this feature)

```text
specs/002-reporte-ciudadano/
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
│   │       └── ReportStatusBadge.tsx         # [NUEVO] Badge reutilizable con colores e íconos para los 9 estados de Denuncia
│   ├── repositories/
│   │   └── reports/
│   │       ├── IReportRepository.ts          # [NUEVO] Contrato de repositorio de denuncias ciudadanas
│   │       ├── RemoteReportRepository.ts     # [NUEVO] Implementación HTTP contra /api/denuncias
│   │       ├── LocalReportRepository.ts      # [NUEVO] Fallback local en AsyncStorage
│   │       └── index.ts                      # [NUEVO] Selector de repositorio de denuncias
│   ├── screens/
│   │   └── citizen/
│   │       ├── ReportScreen.tsx              # [EXTENDER] Categorías oficiales, compresión <1.2MB, GPS + dirección manual, envío con 0 puntos
│   │       ├── ProfileScreen.tsx             # [EXTENDER] Historial de reportes propios, modal de detalle (motivo rechazo / antes-después) y botón Ocultar
│   │       └── HomeScreenPrueba/
│   │           └── FotosPuntos.tsx           # [EXTENDER] Resumen de alertas recientes del ciudadano o destacadas para invitado
│   └── utils/
│       └── imageCompressor.ts                # [NUEVO] Utilidad para comprimir y redimensionar fotos a max 1080px y < 1.2 MB

server/
└── src/
    ├── controllers/
    │   └── denuncias.controller.ts           # [EXTENDER] POST /api/denuncias (0 puntos, código REP-2026-XXX), GET mis-denuncias (ocultarUsuario: false), PATCH /:id/ocultar
    └── routes/
        └── denuncias.routes.ts               # [EXTENDER] Rutas ciudadanas de listado propio y baja lógica visual
```

**Structure Decision**: Se extiende el controlador `denuncias.controller.ts` en `server/` y las pantallas `ReportScreen.tsx` y `ProfileScreen.tsx` en `client/`, añadiendo `client/src/repositories/reports/` para desacoplar las llamadas HTTP y `client/src/utils/imageCompressor.ts` para garantizar `RNF-01` (`< 1.2 MB`).

## Architecture & Implementation Details

### 1. Backend (`/server/src/controllers/denuncias.controller.ts`)
- **`POST /api/denuncias` (`createDenuncia`)**:
  - Validar campos obligatorios: `categoria` (`Microbasural`, `Foco de Dengue`, `Terreno Baldío`, `Otro`), `descripcion`, `imagenUrl`, `direccion`, `ciudadanoId` y coordenadas (`latitud`, `longitud` cuando estén disponibles o con fallback justificado).
  - Generar código correlativo único con formato `REP-2026-XXX` (consultando el último correlativo o usando secuencia segura).
  - Crear registro en `Denuncia` con `estado: 'PENDIENTE'`, `puntosOtorgados: 0`, `ocultarUsuario: false`.
  - **Importante (RF-REP-05)**: Eliminar cualquier incremento de puntos al usuario en `createDenuncia`. El saldo de `User.puntos` permanece sin cambios hasta la validación del Admin en `004`.
- **`GET /api/denuncias/ciudadano/:ciudadanoId` (`getDenunciasByCiudadano`)**:
  - Retornar todas las denuncias donde `ciudadanoId` coincida y `ocultarUsuario === false`, ordenadas por `createdAt DESC`.
  - Incluir campos de trazabilidad: `codigo`, `estado`, `prioridad`, `observacionesAdmin`, `puntosOtorgados`, `imagenUrl`, `fotoSolucionUrl`, `informeSolucion`, `createdAt`, `fechaResolucion`.
- **`PATCH /api/denuncias/:id/ocultar` (`hideDenunciaForCitizen`)**:
  - Verificar que la denuncia pertenezca al `ciudadanoId` solicitante.
  - Actualizar exclusivamente `ocultarUsuario: true`. La denuncia sigue apareciendo en `GET /api/denuncias` para `ADMIN` y `AGENT`.

### 2. Compresión de Imagen (`client/src/utils/imageCompressor.ts`)
- Configurar captura con `expo-image-picker` / `expo-camera` restringiendo calidad inicial (`quality: 0.7`) y redimensionando el lado mayor a `1080px`.
- Verificar el tamaño del archivo resultante (`fileSize`); si supera `1.2 MB` (`1,258,291 bytes`), aplicar un segundo pase de compresión o rechazar antes de enviar para cumplir `RNF-01`.

### 3. Pantallas Ciudadanas (`ReportScreen.tsx` y `ProfileScreen.tsx`)
- **`ReportScreen.tsx`**:
  - Selector visual de las 4 categorías (`Microbasural`, `Foco de Dengue`, `Terreno Baldío`, `Otro`).
  - Captura de foto con vista previa, indicador de peso (`< 1.2 MB`) y opción de volver a tomar.
  - Captura automática de GPS con `expo-location` (manejando denegación de permisos sin crashear y permitiendo ingresar `direccion` manual obligatoria).
  - Al enviar exitosamente: mostrar alerta/modal confirmando el código `REP-2026-XXX` y explicando que **los puntos se acreditarán cuando el municipio verifique la denuncia en el terreno**.
- **`ProfileScreen.tsx` y `ReportStatusBadge.tsx`**:
  - Mostrar los 9 estados posibles con etiquetas legibles para el vecino (ej. `PENDIENTE` -> "En Revisión", `APROBADO` -> "Aprobado en Bolsa", `EN_VERIFICACION` -> "Agente en Camino", `EN_SANEAMIENTO` -> "En Limpieza (+Puntos)", `RESUELTO` -> "Saneado y Certificado", `RECHAZADO` -> "Desestimado", `CERRADO_INACCESIBLE` -> "Cerrado por Inaccesibilidad").
  - Botón `"Eliminar de mi vista"` con confirmación que invoca `PATCH /api/denuncias/:id/ocultar`.

## Complexity Tracking

> Sin violaciones a la Constitución.
