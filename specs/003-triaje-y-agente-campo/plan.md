# Implementation Plan: Triaje Administrativo, Toma de Caso 1 a 1 y Verificación de Agente en Terreno

**Branch**: `003-triaje-y-agente-campo` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/003-triaje-y-agente-campo/spec.md)
**Input**: Feature specification from `/specs/003-triaje-y-agente-campo/spec.md`

## Summary

Implementar el flujo de **Triaje Inicial por el Administrador Municipal (`ADMIN`)** y la **Operación de Campo del Agente (`AGENT`)**: aprobación a la bolsa general con asignación de prioridad (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`) o rechazo justificado (`RECHAZADO` con `observacionesAdmin` y 0 puntos), visualización de la bolsa ordenada por criticidad con enlace a navegación GPS externa, **bloqueo transaccional atómico 1 a 1** al tomar un caso (`EN_VERIFICACION` con restricción de 1 solo caso activo por agente), **verificación in situ** con los 3 escenarios posibles (*Caso A: Real* -> `VERIFICADO_PENDIENTE`, *Caso B: Falso* -> `RECHAZADO`, *Caso C: Inaccesible* con protocolo de hasta 3 intentos `intentosInaccesible` -> `CERRADO_INACCESIBLE`) y **liberación/desasignación inteligente** a la bolsa (`APROBADO` o conservando `EN_SANEAMIENTO`).

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `@prisma/client` 5.22 (`prisma.$transaction`), `expo-image-picker`, `expo-camera`, React Native `Linking` (para abrir Google Maps / Waze con `latitud,longitud`)  
**Storage**: PostgreSQL (Supabase) vía Prisma (`model Denuncia` y `model User`) + caché local vía `IFieldAgentRepository` y `adminService.ts`  
**Testing**: Jest + Supertest (concurrencia de toma de caso 1 a 1, protocolo de 3 intentos de inaccesibilidad y preservación de estado al liberar) + Checklist manual en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Transacción atómica de toma de caso `< 300ms`; actualización de bolsa de casos `< 400ms`  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- El Agente (`AGENT`) tiene estrictamente prohibido ver o acceder a la tienda de canjes o autoasignarse puntos.
- Un Agente no puede tener más de 1 caso activo (`EN_VERIFICACION` o `EN_SANEAMIENTO`) simultáneamente.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Reutiliza y extiende `AdminDenunciasScreen.tsx`, `AdminAgentesScreen.tsx`, `AgentHomeScreen.tsx`, `adminService.ts`, `denuncias.controller.ts` y `agentes.controller.ts`.
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Semáforo de prioridades (Rojo = `URGENTE`, Naranja = `ALTA`, Verde = `MEDIA`/`BAJA`) estilizado con `StyleSheet.create` y `theme.ts`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. Crea `IFieldAgentRepository` y extiende `adminService.ts` filtrando casos por `municipioId`.
- **Principio IV (RBAC)**: CUMPLE. `AgentNavigator` aísla al agente de cualquier flujo de canje de productos.
- **Principio V (Ciclo de Vida y Bloqueo 1 a 1)**: CUMPLE. Implementa los estados `APROBADO`, `EN_VERIFICACION`, `VERIFICADO_PENDIENTE`, `CERRADO_INACCESIBLE` y el protocolo de 3 intentos (`intentosInaccesible`).
- **Principio VI (Transacciones Atómicas)**: CUMPLE. Usa `prisma.$transaction` con verificación condicional de estado y de casos activos del agente.
- **Principio VII (Testing)**: CUMPLE. Incluye pruebas de concurrencia/atomicidad y protocolo de 3 intentos.

## Project Structure

### Documentation (this feature)

```text
specs/003-triaje-y-agente-campo/
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
│   │   ├── common/
│   │   │   └── TransactionLoaderModal.tsx    # [NUEVO] Modal bloqueante con spinner (RNF-10) para todas las mutaciones en BD
│   │   └── agent/
│   │       ├── PrioritySemaphoreBadge.tsx    # [NUEVO] Badge semáforo (Rojo=URGENTE, Naranja=ALTA, Verde=MEDIA/BAJA)
│   │       └── VerificationFormModal.tsx     # [NUEVO] Modal de verificación in situ (Caso A Real, Caso B Falso, Caso C Inaccesible 1..3)
│   ├── repositories/
│   │   └── agent/
│   │       ├── IFieldAgentRepository.ts      # [NUEVO] Contrato de repositorio para bolsa de casos, toma 1 a 1 y verificación
│   │       ├── RemoteFieldAgentRepository.ts # [NUEVO] Implementación HTTP contra /api/denuncias
│   │       ├── LocalFieldAgentRepository.ts  # [NUEVO] Fallback local en AsyncStorage
│   │       └── index.ts                      # [NUEVO] Selector de repositorio
│   ├── screens/
│   │   ├── admin/
│   │   │   ├── AdminDenunciasScreen.tsx      # [EXTENDER] Triaje inicial (Aprobar con Prioridad -> APROBADO, Rechazar con motivo -> RECHAZADO) y botón Desasignar Agente
│   │   │   └── AdminAgentesScreen.tsx        # [EXTENDER] Visualizar caso activo de cada agente y opción de liberar caso
│   │   └── agente/
│   │       └── AgentHomeScreen.tsx           # [EXTENDER] Pestañas "Bolsa de Casos" (ordenada por prioridad + GPS externo) y "Mi Caso Activo" (Tomar, Verificar A/B/C, Liberar)
│   └── services/
│       └── adminService.ts                   # [EXTENDER] Métodos triajeDenuncia y liberarCasoAgente

server/
└── src/
    ├── controllers/
    │   └── denuncias.controller.ts           # [EXTENDER] triajeDenuncia, getBolsaCasos, tomarCasoAtomico, verificarInSitu (A/B/C + 3 intentos), liberarCaso
    └── routes/
        └── denuncias.routes.ts               # [EXTENDER] Rutas PATCH /:id/triaje, GET /bolsa, PATCH /:id/tomar, PATCH /:id/verificar, PATCH /:id/liberar
```

**Structure Decision**: Se extienden `AdminDenunciasScreen.tsx` y `AgentHomeScreen.tsx` junto con `server/src/controllers/denuncias.controller.ts`, modularizando el formulario de verificación en `VerificationFormModal.tsx` y el acceso a datos del agente en `client/src/repositories/agent/`.

## Architecture & Implementation Details

### 1. Triaje Administrativo (`PATCH /api/denuncias/:id/triaje`)
- Recibe `{ accion: 'APROBAR' | 'RECHAZAR', prioridad?: Prioridad, observacionesAdmin?: string }`.
- Si `accion === 'RECHAZAR'`: exige `observacionesAdmin` no vacío (`400 Bad Request` si falta). Cambia `estado = 'RECHAZADO'`, `puntosOtorgados = 0`.
- Si `accion === 'APROBAR'`: exige `prioridad` (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`). Cambia `estado = 'APROBADO'`, `prioridad`, `agenteId = null` (entra a la bolsa general del municipio).

### 1.1 Asignación Directa de Agente (`PATCH /api/denuncias/:id/asignar`)
- Recibe `{ agenteId: string }`.
- Valida disponibilidad estricta:
  1. Si no hay inspectores disponibles en el municipio o el agente objetivo tiene `disponible === false`, rechaza la asignación con `409 Conflict` y el mensaje `"Agente no disponible"`.
  2. Si el agente ya tiene un caso activo en curso (`EN_VERIFICACION` o `EN_SANEAMIENTO`), rechaza con `409 Conflict` (`"El agente ya tiene un caso activo"`).
  3. En la interfaz (`AdminDenunciasScreen`), si no hay agentes disponibles se bloquea la apertura del modal alertando al Administrador. Dentro del modal, los agentes no disponibles se muestran deshabilitados.

### 2. Bolsa de Casos y Toma Atómica 1 a 1 (`GET /api/denuncias/bolsa` y `PATCH /api/denuncias/:id/tomar`)
- **Bolsa (`GET /api/denuncias/bolsa`)**: Retorna denuncias con `estado IN ('APROBADO')` o aquellas liberadas tras verificación (`estado === 'EN_SANEAMIENTO'` y `agenteId === null`), ordenadas por peso de prioridad (`URGENTE` > `ALTA` > `MEDIA` > `BAJA`) y antigüedad (`createdAt ASC`).
- **Toma Atómica (`PATCH /api/denuncias/:id/tomar`)**:
  - Ejecuta `prisma.$transaction`:
    1. Verifica que el `agenteId` no tenga otra denuncia en `estado IN ('EN_VERIFICACION', 'EN_SANEAMIENTO')`. Si ya tiene una, retorna `409 Conflict` (`"Ya tienes un caso activo asignado"`).
    2. Actualiza la denuncia usando condición atómica (`where: { id, agenteId: null, estado: { in: ['APROBADO', 'EN_SANEAMIENTO'] } }`):
       - Si estaba en `APROBADO`, pasa a `estado: 'EN_VERIFICACION'` y `agenteId`.
       - Si estaba en `EN_SANEAMIENTO` (fue liberada tras verificarse), conserva `estado: 'EN_SANEAMIENTO'` y asigna el nuevo `agenteId`.
    3. Si otro agente la tomó milisegundos antes, retorna `409 Conflict` (`"Este caso acaba de ser tomado por otro agente"`).

### 3. Verificación In Situ y Protocolo de 3 Intentos (`PATCH /api/denuncias/:id/verificar`)
- Recibe `{ resultado: 'REAL' | 'FALSO' | 'INACCESIBLE', fotoVerificacionUrl: string, observaciones?: string, agenteId: string }`.
- Exige `fotoVerificacionUrl` obligatoria.
- **Caso A (`REAL`)**: Actualiza `estado = 'VERIFICADO_PENDIENTE'`, `fotoVerificacionUrl`, `fechaVerificacion = new Date()`.
- **Caso B (`FALSO`)**: Actualiza `estado = 'RECHAZADO'`, `fotoVerificacionUrl`, `observacionesAdmin = observaciones || 'Falso reporte verificado en terreno'`, `puntosOtorgados = 0`, `agenteId = null` (libera al agente).
- **Caso C (`INACCESIBLE`)**:
  - Incrementa `intentosInaccesible = denuncia.intentosInaccesible + 1` y guarda `fotoVerificacionUrl` (foto del aviso/sticker).
  - Si `intentosInaccesible < 3`: mantiene el caso en `EN_VERIFICACION` (o devuelve a `APROBADO` con contador preservado para próxima visita) informando `"Intento X de 3 registrado"`.
  - Si `intentosInaccesible >= 3`: cambia automáticamente a `estado = 'CERRADO_INACCESIBLE'`, libera al agente (`agenteId = null`) y no penaliza al ciudadano.

### 4. Liberación / Desasignación Inteligente (`PATCH /api/denuncias/:id/liberar`)
- Puede ser invocado por el propio Agente o por el Admin (`AdminDenunciasScreen` / `AdminAgentesScreen`).
- Si la denuncia estaba en `EN_VERIFICACION` (aún no verificada): vuelve a `estado = 'APROBADO'` y `agenteId = null`.
- Si la denuncia estaba en `EN_SANEAMIENTO` (ya verificada y con puntos acreditados): mantiene `estado = 'EN_SANEAMIENTO'` y pone `agenteId = null` para que otro agente tome directamente la limpieza sin repetir la verificación ni duplicar puntos.

### 5. Métricas, Candidatos Geodésicos y Geotracking
- **Dashboard de Métricas (`GET /api/denuncias/metricas`)**:
  - Agrupa y totaliza en tiempo real los reportes registrados según los 8 estados del ciclo de vida ambiental (`PENDIENTE`, `APROBADO`, `EN_VERIFICACION`, `VERIFICADO_PENDIENTE`, `EN_SANEAMIENTO`, `RESUELTO`, `RECHAZADO`, `CERRADO_INACCESIBLE`).
- **Candidatos por Proximidad Haversine (`GET /api/denuncias/:id/agentes-disponibles`)**:
  - Filtra agentes del municipio con `disponible === true` y calcula `distanciaMetros` geodésica entre las coordenadas del foco ambiental y la posición GPS del inspector para sugerir candidatos óptimos.
- **Geotracking y Alta de Agentes (`PATCH /api/agentes/me/ubicacion`, `POST /api/agentes`)**:
  - Permite a los agentes de campo reportar su ubicación en tiempo real (`latitudActual`, `longitudActual`, `ubicacionActualizadaEn`) y al Administrador dar de alta nuevos inspectores municipales con credenciales seguras.

## Complexity Tracking

> Sin violaciones a la Constitución.
