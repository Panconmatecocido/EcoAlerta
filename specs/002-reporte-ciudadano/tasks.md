# Tasks: Creación y Seguimiento de Reportes Ciudadanos

**Input**: Design documents from `/specs/002-reporte-ciudadano/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/002-reporte-ciudadano/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/002-reporte-ciudadano/spec.md), `001-auth-rbac`

**Tests**: Incluidas según el Principio VII de la Constitución.

**Organization**: Tareas organizadas por historia de usuario (`US1`, `US2`, `US3`) para entrega incremental.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo
- **[Story]**: Historia de usuario asociada (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup (Shared Utilities & Components)

**Purpose**: Utilidades de compresión de imágenes (`< 1.2 MB`) y badges semánticos para estados de denuncia.

- [X] T001 [P] Crear utilidad de compresión y validación de tamaño de imagen (`max 1080px`, `< 1.2 MB`) en `client/src/utils/imageCompressor.ts`
- [X] T002 [P] Crear componente `ReportStatusBadge` con `StyleSheet.create` y colores de `theme.ts` para representar todos los estados de `EstadoDenuncia` en `client/src/components/citizen/ReportStatusBadge.tsx`

---

## Phase 2: Foundational (Backend Endpoints & Repository Pattern)

**Purpose**: Actualizar endpoints de `/api/denuncias` para respetar la regla de 0 puntos al crear, filtro `ocultarUsuario: false` y patrón `IReportRepository`.

**⚠️ CRITICAL**: Bloqueante para las pantallas de creación, seguimiento y baja lógica.

- [X] T003 Actualizar `createDenuncia` en el backend para generar código `REP-2026-XXX`, guardar `direccion`, `latitud`, `longitud`, `estado: 'PENDIENTE'`, `puntosOtorgados: 0` y **no sumar puntos** al crear el reporte en `server/src/controllers/denuncias.controller.ts`
- [X] T004 Añadir controladores `getDenunciasByCiudadano` (filtrando `ocultarUsuario: false`) y `hideDenunciaForCitizen` (`PATCH /api/denuncias/:id/ocultar` que cambia `ocultarUsuario: true` sin borrar el registro) en `server/src/controllers/denuncias.controller.ts`
- [X] T005 Registrar las rutas `GET /api/denuncias/ciudadano/:ciudadanoId` y `PATCH /api/denuncias/:id/ocultar` en `server/src/routes/denuncias.routes.ts`
- [X] T006 [P] Definir la interfaz `IReportRepository` y DTOs (`CreateReportDTO`, `CitizenReport`) en `client/src/repositories/reports/IReportRepository.ts`
- [X] T007 [P] Implementar `RemoteReportRepository` y `LocalReportRepository` (con caché en `AsyncStorage`) en `client/src/repositories/reports/RemoteReportRepository.ts`, `client/src/repositories/reports/LocalReportRepository.ts` y `client/src/repositories/reports/index.ts`

**Checkpoint**: API `/api/denuncias` y `IReportRepository` listos con regla de 0 puntos iniciales y soporte de ocultamiento lógico.

---

## Phase 3: User Story 1 - Creación de Reporte Ambiental Geolocalizado (Priority: P1) 🎯 MVP

**Goal**: Permitir al ciudadano autenticado enviar un reporte con categoría (`Microbasural`, `Foco de Dengue`, `Terreno Baldío`, `Otro`), foto comprimida `< 1.2 MB`, GPS y dirección manual, recibiendo código `REP-2026-XXX` en estado `PENDIENTE` (0 puntos iniciales) y bloqueando a invitados con el Auth Gate.

**Independent Test**: Como ciudadano autenticado, abrir `ReportScreen`, seleccionar categoría, tomar/elegir foto, capturar GPS, escribir dirección manual y enviar. Verificar que se crea con código `REP-2026-XXX`, estado `PENDIENTE` y que el saldo de puntos del usuario permanece en `0`.

### Implementation for User Story 1

- [X] T008 [US1] Verificar e integrar la protección Auth Gate dentro de `ReportScreen` por si un usuario invitado (`user === null`) accede a la ruta directamente en `client/src/screens/citizen/ReportScreen.tsx`
- [X] T009 [US1] Actualizar el formulario de `ReportScreen` con selector de las 4 categorías oficiales, labels fuera de los inputs, captura de foto integrada con `imageCompressor.ts` (`< 1.2 MB`) y captura de GPS (`expo-location`) + campo obligatorio de `direccion` manual en `client/src/screens/citizen/ReportScreen.tsx`
- [X] T010 [US1] Conectar el envío de `ReportScreen` a `IReportRepository.createReport`, mostrando modal de éxito con el código `REP-2026-XXX` e informando que los puntos quedan en revisión hasta la verificación en terreno en `client/src/screens/citizen/ReportScreen.tsx`

**Checkpoint**: Creación de reportes ciudadanos operativa y validada.

---

## Phase 4: User Story 2 - Seguimiento en Tiempo Real del Estado de Mis Reportes (Priority: P1)

**Goal**: Mostrar al ciudadano el listado de sus reportes con código `REP-2026-XXX`, fecha, categoría, `ReportStatusBadge`, motivo de rechazo (`observacionesAdmin` si fue `RECHAZADO`), puntos ganados (`puntosOtorgados`) y comparativa Antes/Después cuando esté `RESUELTO`.

**Independent Test**: Abrir `ProfileScreen` (y resumen en `HomeScreen`), visualizar los reportes propios en distintos estados y abrir el detalle de un reporte rechazado o resuelto para ver la observación del Admin o la foto del Después.

### Implementation for User Story 2

- [X] T011 [US2] Actualizar `ProfileScreen` para cargar los reportes del ciudadano desde `IReportRepository.getCitizenReports`, renderizando cada tarjeta con `ReportStatusBadge`, código `REP-2026-XXX` y puntos acreditados en `client/src/screens/citizen/ProfileScreen.tsx`
- [X] T012 [US2] Añadir modal/vista de detalle del reporte en `ProfileScreen` que muestre `observacionesAdmin` cuando el estado es `RECHAZADO` y la comparativa `imagenUrl` (Antes) vs. `fotoSolucionUrl` + `informeSolucion` (Después) cuando el estado es `RESUELTO` en `client/src/screens/citizen/ProfileScreen.tsx`
- [X] T013 [P] [US2] Actualizar el bloque de reportes recientes en el Home Ciudadano para reflejar los reportes reales del vecino autenticado en `client/src/screens/citizen/HomeScreenPrueba/FotosPuntos.tsx`

**Checkpoint**: Trazabilidad completa de estados visible para el ciudadano.

---

## Phase 5: User Story 3 - Eliminación Lógica Visual en el Historial Ciudadano (Priority: P2)

**Goal**: Permitir que el vecino oculte un reporte de su historial personal (`ocultarUsuario = true`) sin borrarlo de la base de datos municipal.

**Independent Test**: En `ProfileScreen`, pulsar "Ocultar de mi historial" sobre un reporte, confirmar la acción y comprobar que desaparece de la lista del ciudadano pero sigue apareciendo en `GET /api/denuncias` del Administrador.

### Implementation for User Story 3

- [X] T014 [US3] Agregar botón `"Ocultar de mi historial"` con diálogo de confirmación en cada tarjeta/detalle de reporte en `ProfileScreen`, invocando `IReportRepository.hideReportForCitizen` y actualizando el estado local en `client/src/screens/citizen/ProfileScreen.tsx`

**Checkpoint**: Baja lógica visual (`ocultarUsuario = true`) funcionando sin pérdida de datos municipales.

---

## Phase 6: Polish & Cross-Cutting Concerns (Testing & QA)

**Purpose**: Pruebas unitarias/integración y verificación manual en Expo Go.

- [X] T015 [P] Crear pruebas unitarias para `imageCompressor.ts` (límite `< 1.2 MB`) y `LocalReportRepository` en `client/src/utils/__tests__/imageCompressor.test.ts`
- [X] T016 [P] Crear pruebas de integración para `POST /api/denuncias` (verificar `puntosOtorgados === 0` y saldo del vecino sin cambios) y `PATCH /api/denuncias/:id/ocultar` (`ocultarUsuario === true` pero registro existente en DB) en `server/src/__tests__/denuncias.citizen.test.ts`
- [X] T017 Ejecutar checklist de verificación manual en Expo Go (creación con foto y GPS, denegación de permiso GPS con dirección manual, 0 puntos al enviar, visualización de estados y ocultamiento lógico) en `specs/002-reporte-ciudadano/checklists/requirements.md`
- [X] T018 [US2] Implementar endpoint unificado GET /api/denuncias/mis-denuncias en backend y fallback resiliente en RemoteReportRepository/LocalReportRepository ante errores de red o servidor en `server/src/controllers/denuncias.controller.ts` y `client/src/repositories/reports/index.ts`
- [X] T019 [P] Verificar que la arquitectura cliente existente usa Expo SDK 58 y React Native 0.88 y es compatible con StatusBar Edge-to-Edge y Expo Go en `client/package.json` y `client/app.json`

---

## Dependencies & Execution Order

- **Phase 1 & Phase 2** deben completarse antes de iniciar las historias `US1`, `US2` y `US3`.
- **Phase 3 (US1 - Creación)** es el MVP del módulo.
- **Phase 4 (US2 - Seguimiento)** y **Phase 5 (US3 - Baja Lógica Visual)** se construyen sobre `ProfileScreen.tsx` de forma secuencial.
- **Phase 6 (Testing)** valida las reglas críticas de negocio (`0 puntos al crear` y `ocultarUsuario = true`).

## Ajustes de UX posteriores

- [x] T020 [US1] Agregar mapa con pin seleccionable/arrastrable, región inicial de Pilar, GPS opcional y sugerencia editable mediante geocodificación inversa; instalar `react-native-maps` compatible con Expo SDK 58 en `client/package.json`, `client/package-lock.json` y `client/src/screens/citizen/ReportScreen.tsx`.
- [x] T021 [US1] Reutilizar el botón central de cámara para capturar cuando ReportScreen esté activa y la cámara lista; mantener la galería y quitar el obturador duplicado de la vista previa en `client/src/screens/citizen/ReportScreen.tsx`.
- [x] T022 [US2] Separar los estados de carga de reportes y canjes, estabilizar el efecto de foco frente a actualizaciones del perfil y mostrar cada pestaña al completar su propia consulta en `client/src/screens/citizen/ProfileScreen.tsx`.
- [x] T023 [US1] Ajustar la pantalla inicial de permisos de cámara para ubicar el encabezado en la parte superior y separar las acciones de cámara y galería en `client/src/screens/citizen/ReportScreen.tsx`.
