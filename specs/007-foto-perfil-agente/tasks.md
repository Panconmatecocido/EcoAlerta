# Tasks: Fotos de Perfil del Personal y Gestión de Personal por Admin

**Input**: Design documents and specifications from `specs/007-foto-perfil-agente/spec.md`
**Status**: Completed (Integrado en `main`)

## Phase 1: Modelado de Datos y Migración de Base de Datos
- [x] **TASK-007-01**: Modificar `server/prisma/schema.prisma` agregando el campo `fotoPerfilUri String?` en el modelo `User`. (Responsable: Benitez Angel)
- [x] **TASK-007-02**: Crear y aplicar la migración SQL `server/prisma/migrations/20261028223000_agent_profile_photo/migration.sql`. (Responsable: Benitez Angel)
- [x] **TASK-007-03**: Regenerar el cliente Prisma ORM (`prisma generate`) y verificar tipado TypeScript. (Responsable: Benitez Angel)

## Phase 2: Lógica de Backend y Endpoints Administrativos
- [x] **TASK-007-04**: Implementar `server/src/utils/profilePhoto.ts` con validación estricta de Data URI base64 JPEG, verificación de firma mágica `/9j/` y límite `MAX_PROFILE_PHOTO_BYTES` (2 MB). (Responsable: Benitez Angel)
- [x] **TASK-007-05**: Implementar `server/src/utils/password.ts` con utilidades de hashing y verificación de contraseñas de personal municipal (`hashPassword`, `verifyPassword`). (Responsable: Benitez Angel)
- [x] **TASK-007-06**: Crear controlador `server/src/controllers/adminUsers.controller.ts`:
  - `crearCuentaPersonal`: Alta restringida a Admin para roles `AGENT` y `COLLABORATOR` con foto de cámara obligatoria, validación de email duplicado (409) y pertenencia estricta al municipio del admin logueado.
  - `obtenerColaboradores`: Listado de comercios colaboradores del municipio.
  - `cambiarDisponibilidadColaborador`: Actualización del flag de disponibilidad de servicio en el comercio (`PATCH`).
  - `eliminarCuentaPersonal`: Baja transaccional (`$transaction`) con desasignación atómica de casos y liberación de denuncias activas (`agenteId: null`). (Responsable: Benitez Angel)
- [x] **TASK-007-07**: Configurar rutas en `server/src/routes/adminUsers.routes.ts` y montarlas bajo `/api/admin/usuarios` en `server/src/index.ts` protegidas por `requireRole(Role.ADMIN)`. (Responsable: Benitez Angel)
- [x] **TASK-007-08**: Actualizar `server/src/controllers/auth.controller.ts` para devolver `fotoPerfilUri` en `/api/auth/login` y soportar `PATCH /auth/profile` para administradores y ciudadanos. (Responsable: Benitez Angel)

## Phase 3: Interfaz Móvil y Flujos de Personal (Frontend)
- [x] **TASK-007-09**: Actualizar `client/src/services/adminService.ts` con métodos tipados: `crearCuentaPersonal`, `obtenerColaboradores`, `actualizarDisponibilidadColaborador`, `eliminarCuentaPersonal`. (Responsable: Rodriguez Iván)
- [x] **TASK-007-10**: Actualizar `client/src/context/AuthContext.tsx` con método `actualizarPerfilAdmin(nombre, fotoPerfilUri)` y soporte de persistencia de foto de personal. (Responsable: Rodriguez Iván)
- [x] **TASK-007-11**: Diseñar e implementar pantalla `client/src/screens/admin/AdminCuentasPersonalScreen.tsx` con captura obligatoria de foto mediante cámara nativa (bloqueo de selector de galería) e ingreso de datos de personal. (Responsable: Rodriguez Iván / Kuhn Joaquin)
- [x] **TASK-007-12**: Diseñar e implementar pantalla `client/src/screens/admin/AdminColaboradoresScreen.tsx` para gestión de comercios colaboradores y conmutación de estado de atención. (Responsable: Rodriguez Iván / Kuhn Joaquin)
- [x] **TASK-007-13**: Diseñar e implementar pantalla `client/src/screens/admin/AdminUsuariosScreen.tsx` con búsqueda reactiva por nombre/email y filtrado por rol (`AGENT` / `COLLABORATOR`). (Responsable: Rodriguez Iván)
- [x] **TASK-007-14**: Actualizar encabezado de `AgentHomeScreen.tsx` y `CollaboratorHomeScreen.tsx` para renderizar la foto de perfil capturada por el administrador y fallback a avatar alternativo. (Responsable: Rodriguez Iván / Kuhn Joaquin)
- [x] **TASK-007-15**: Actualizar navegación en `client/src/navigation/AdminNavigator.tsx` y accesos en `AdminHomeScreen.tsx`. (Responsable: Rodriguez Iván)

## Phase 4: Calidad de Software, Automatización y Pruebas
- [x] **TASK-007-16**: Implementar pruebas unitarias de validación de fotos en `server/src/__tests__/admin-profile-photo.test.ts`. (Responsable: Benitez Facundo / Benitez Angel)
- [x] **TASK-007-17**: Implementar pruebas de integración de endpoints de gestión de usuarios en `server/src/__tests__/admin-users.test.ts` (20 assertions completas). (Responsable: Benitez Facundo / Benitez Angel)
- [x] **TASK-007-18**: Implementar pruebas de servicio frontend en `client/src/services/__tests__/adminService.test.ts`. (Responsable: Benitez Facundo / Rodriguez Iván)
- [x] **TASK-007-19**: Ejecución integral de suite de regresión (`146 tests passing, 0 failing`). (Responsable: Benitez Facundo)
