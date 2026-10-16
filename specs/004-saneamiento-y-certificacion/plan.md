# Implementation Plan: Acreditación de Puntos, Saneamiento y Certificación Final

**Branch**: `004-saneamiento-y-certificacion` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/004-saneamiento-y-certificacion/spec.md)
**Input**: Feature specification from `/specs/004-saneamiento-y-certificacion/spec.md`

## Summary

Implementar las etapas 5, 6 y 7 del ciclo de vida del reporte ambiental:
1. **Validación de Veracidad y Acreditación de Puntos por el Administrador (`ADMIN`)**: Revisión de denuncias en `VERIFICADO_PENDIENTE`, asignación de puntos al ciudadano según el baremo oficial por prioridad (`BAJA: 50–80`, `MEDIA: 100–150`, `ALTA: 200–300`, `URGENTE: 350–500`) mediante una transacción atómica que incrementa `User.puntos`, registra `Denuncia.puntosOtorgados` y transiciona el caso a `EN_SANEAMIENTO` (con idempotencia estricta para impedir doble acreditación).
2. **Ejecución de Saneamiento y Cierre Técnico por el Agente (`AGENT`)**: Carga obligatoria de la foto del "Después" (`fotoSolucionUrl`, comprimida a `< 1.2 MB`) y el informe de solución (`informeSolucion`), pasando el caso a `RESUELTO_TECNICO`.
3. **Certificación Final "Antes vs. Después" por el Administrador (`ADMIN`)**: Vista comparativa lado a lado (`imagenUrl` inicial + `fotoVerificacionUrl` vs. `fotoSolucionUrl` + `informeSolucion`) para aprobar el cierre definitivo (`RESUELTO` con `fechaResolucion` y liberación del agente) o rechazar la limpieza devolviendo el caso a `EN_SANEAMIENTO`.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `@prisma/client` 5.22 (`prisma.$transaction`), `expo-image-picker`, `expo-camera`  
**Storage**: PostgreSQL (Supabase) vía Prisma (`model Denuncia`, `model User`)  
**Testing**: Jest + Supertest (validación de rangos de puntos por prioridad, idempotencia contra doble acreditación y flujo `EN_SANEAMIENTO` -> `RESUELTO_TECNICO` -> `RESUELTO`) + Checklist manual en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Acreditación transaccional de puntos `< 300ms`; carga de comparativa Antes/Después `< 500ms`  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- Prohibido acreditar puntos fuera del rango de la prioridad asignada o acreditar puntos más de una vez para la misma denuncia (`puntosOtorgados > 0`).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Extiende `AdminDenunciasScreen.tsx`, `AgentHomeScreen.tsx`, `adminService.ts`, `IFieldAgentRepository.ts` y `server/src/controllers/denuncias.controller.ts`.
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Comparador visual "Antes vs. Después" y selector de baremo de puntos construidos con `StyleSheet.create` y `theme.ts`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. Extiende los repositorios existentes manteniendo el aislamiento por `municipioId`.
- **Principio V (Regla de Puntos y Ciclo de Vida)**: CUMPLE. Los puntos se acreditan **únicamente** al pasar de `VERIFICADO_PENDIENTE` a `EN_SANEAMIENTO` respetando la tabla de baremos oficial.
- **Principio VI (Transacciones Atómicas)**: CUMPLE. `prisma.$transaction` actualiza `Denuncia` y `User.puntos` en una sola unidad atómica verificando `puntosOtorgados === 0`.
- **Principio VII (Testing)**: CUMPLE. Pruebas unitarias/integración de rangos de baremo e idempotencia.

## Project Structure

### Documentation (this feature)

```text
specs/004-saneamiento-y-certificacion/
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
│   │   ├── admin/
│   │   │   ├── PointsScaleModal.tsx          # [NUEVO] Modal de validación de veracidad con baremo guiado por prioridad
│   │   │   └── BeforeAfterAuditModal.tsx     # [NUEVO] Modal comparativo "Antes vs. Después" para certificación final
│   │   └── agent/
│   │       └── TechnicalClosureModal.tsx     # [NUEVO] Modal para subir foto del "Después" (<1.2MB) e informeSolucion
│   ├── repositories/
│   │   └── agent/
│   │       ├── IFieldAgentRepository.ts      # [EXTENDER] Añadir método enviarCierreTecnico
│   │       ├── RemoteFieldAgentRepository.ts # [EXTENDER] Conectar PATCH /api/denuncias/:id/cierre-tecnico
│   │       └── LocalFieldAgentRepository.ts  # [EXTENDER] Soporte offline para cierre técnico
│   ├── screens/
│   │   ├── admin/
│   │   │   └── AdminDenunciasScreen.tsx      # [EXTENDER] Integrar PointsScaleModal (VERIFICADO_PENDIENTE) y BeforeAfterAuditModal (RESUELTO_TECNICO)
│   │   └── agente/
│   │       └── AgentHomeScreen.tsx           # [EXTENDER] Integrar TechnicalClosureModal cuando el caso activo está EN_SANEAMIENTO
│   ├── services/
│   │   └── adminService.ts                   # [EXTENDER] Añadir validarVeracidadYAcreditarPuntos y certificarSaneamientoFinal
│   └── utils/
│       └── pointsScale.ts                    # [NUEVO] Constantes y validador de rangos de puntos por Prioridad (BAJA, MEDIA, ALTA, URGENTE)

server/
└── src/
    ├── controllers/
    │   └── denuncias.controller.ts           # [EXTENDER] validarVeracidad, registrarCierreTecnico, certificarResolucionFinal
    └── routes/
        └── denuncias.routes.ts               # [EXTENDER] Rutas PATCH /:id/validar-veracidad, PATCH /:id/cierre-tecnico, PATCH /:id/certificar
```

**Structure Decision**: Se agregan modales especializados en `client/src/components/admin/` y `client/src/components/agent/` para mantener limpio el código de `AdminDenunciasScreen.tsx` y `AgentHomeScreen.tsx`, compartiendo la lógica del baremo en `pointsScale.ts`.

## Architecture & Implementation Details

### 1. Baremo Oficial de Puntos (`pointsScale.ts` y Backend)
- Escala parametrizada por `Prioridad`:
  - `BAJA`: min `50`, max `80`, sugerido `50`
  - `MEDIA`: min `100`, max `150`, sugerido `100`
  - `ALTA`: min `200`, max `300`, sugerido `250`
  - `URGENTE`: min `350`, max `500`, sugerido `400`
- Función `isValidPointsForPriority(prioridad, puntos): boolean` validada tanto en cliente como en servidor.

### 2. Validación de Veracidad y Acreditación Atómica (`PATCH /api/denuncias/:id/validar-veracidad`)
- Recibe `{ decision: 'APROBAR_VERACIDAD' | 'RECHAZAR_FALSO', puntos?: number, observacionesAdmin?: string }`.
- Si `decision === 'RECHAZAR_FALSO'`: cambia `estado = 'RECHAZADO'`, `puntosOtorgados = 0`, `agenteId = null`, guarda `observacionesAdmin`.
- Si `decision === 'APROBAR_VERACIDAD'`:
  - Verifica que `denuncia.estado === 'VERIFICADO_PENDIENTE'` y `denuncia.puntosOtorgados === 0` (idempotencia).
  - Valida que `puntos` esté dentro del rango de `denuncia.prioridad`.
  - Ejecuta `prisma.$transaction`:
    1. Actualiza `Denuncia`: `estado = 'EN_SANEAMIENTO'`, `puntosOtorgados = puntos`, `observacionesAdmin`.
    2. Actualiza `User` (`where: { id: denuncia.ciudadanoId }`): `puntos: { increment: puntos }`.

### 3. Cierre Técnico del Agente (`PATCH /api/denuncias/:id/cierre-tecnico`)
- Recibe `{ fotoSolucionUrl: string, informeSolucion: string, agenteId: string }`.
- Verifica que la denuncia esté en `EN_SANEAMIENTO` y asignada a `agenteId`.
- Exige `fotoSolucionUrl` no vacío y `informeSolucion.trim().length >= 10`.
- Actualiza `estado = 'RESUELTO_TECNICO'`, `fotoSolucionUrl`, `informeSolucion`.

### 4. Certificación Final Antes vs. Después (`PATCH /api/denuncias/:id/certificar`)
- Recibe `{ decision: 'CERTIFICAR' | 'OBSERVAR_REHACER', observacionesAdmin?: string }`.
- Verifica que la denuncia esté en `RESUELTO_TECNICO`.
- Si `decision === 'CERTIFICAR'`: actualiza `estado = 'RESUELTO'`, `fechaResolucion = new Date()`, `observacionesAdmin` y libera la bandeja activa del agente (`agenteId` se conserva en histórico o la consulta de caso activo filtra solo `EN_VERIFICACION` y `EN_SANEAMIENTO`, permitiendo conservar `agenteId` como autor del saneamiento mientras queda libre para tomar otro caso).
  - *Nota técnica importante*: Como la consulta de caso activo del agente filtra `estado IN ('EN_VERIFICACION', 'EN_SANEAMIENTO')`, al pasar a `RESUELTO_TECNICO` o `RESUELTO` podemos **conservar `agenteId`** en el registro para auditoría y para devolverle el caso si el Admin elige `OBSERVAR_REHACER`!
- Si `decision === 'OBSERVAR_REHACER'`: exige `observacionesAdmin` indicando qué falta limpiar y devuelve `estado = 'EN_SANEAMIENTO'` al mismo agente sin volver a acreditar puntos.

## Complexity Tracking

> Sin violaciones a la Constitución.
