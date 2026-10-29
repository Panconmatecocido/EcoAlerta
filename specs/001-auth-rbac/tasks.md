# Tasks: Autenticación Multi-Rol RBAC y Modo Invitado

**Input**: Design documents from `/specs/001-auth-rbac/`
**Prerequisites**: [plan.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/plan.md), [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/spec.md)

**Tests**: Incluidas según el Principio VII de la Constitución (pruebas unitarias/integración y checklist manual en Expo Go).

**Organization**: Tareas agrupadas por historia de usuario para permitir implementación y validación incremental sin romper el código existente.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Ejecutable en paralelo (archivos distintos, sin dependencias bloqueantes)
- **[Story]**: Historia de usuario asociada (`[US1]` a `[US6]`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Sincronizar esquema Prisma, datos semilla de los 4 roles y utilidades de validación compartidas.

- [x] T001 Sincronizar el cliente Prisma y verificar `enum Role` (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`) y `puntos @default(0)` en `server/prisma/schema.prisma`
- [x] T002 Actualizar las cuentas semilla para incluir los 4 roles (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`) vinculados al municipio `PILAR-BA` en `server/prisma/seed.ts`
- [x] T003 [P] Crear funciones puras de validación (`validateEmail`, `validatePassword`, `validateRegistrationForm`) en `client/src/utils/validators.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Endpoints de backend `/api/auth/*` y capa de repositorio `IAuthRepository` en el cliente.

**⚠️ CRITICAL**: Ninguna historia de usuario puede completarse antes de cerrar esta fase.

- [x] T004 Extender el controlador de autenticación con `register` (`puntos: 0`, validación de email único `409 Conflict`, asociación a `PILAR-BA`) y soporte de 4 roles en `server/src/controllers/auth.controller.ts`
- [x] T005 Registrar el endpoint `POST /api/auth/register` junto a `POST /api/auth/login` en `server/src/routes/auth.routes.ts`
- [x] T006 [P] Definir la interfaz `IAuthRepository` y tipos `AuthUser`, `LoginDTO`, `RegisterDTO`, `AuthResponse` (incluyendo rol `COLLABORATOR`) en `client/src/repositories/auth/IAuthRepository.ts`
- [x] T007 [P] Implementar `RemoteAuthRepository` conectado a `/api/auth/login` y `/api/auth/register` en `client/src/repositories/auth/RemoteAuthRepository.ts`
- [x] T008 [P] Implementar `LocalAuthRepository` con `AsyncStorage` y cuentas fallback de los 4 roles para tolerancia offline en `client/src/repositories/auth/LocalAuthRepository.ts`
- [x] T009 Crear el selector de repositorio con fallback controlado y conectarlo a `AuthContext` en `client/src/repositories/auth/index.ts` y `client/src/context/AuthContext.tsx`

**Checkpoint**: API `/api/auth/*` y `AuthContext` con `IAuthRepository` listos y soportando estado `user === null` (Invitado) y los 4 roles.

---

## Phase 3: User Story 1 - Bienvenida e Inicio en Modo Invitado (Priority: P1) 🎯 MVP

**Goal**: Iniciar la app directamente en el Home de Bienvenida cuando `user === null`, explicando el funcionamiento de Eco Alerta y mostrando el botón `"Regístrate para empezar a usar la app"` en el lugar de la tarjeta de usuario.

**Independent Test**: Abrir la app sin sesión iniciada; verificar que carga `HomeScreen` (`IncioHome`) sin redirigir al Login, muestra la guía de funcionamiento y el botón `"Regístrate para empezar a usar la app"`, el cual lleva a `RegisterScreen`.

### Implementation for User Story 1

- [x] T010 [US1] Modificar `AppNavigator` para que cuando `user === null` renderice `MainNavigator` como ruta inicial y exponga `Login` y `Register` como pantallas accesibles bajo demanda en `client/src/navigation/AppNavigator.tsx`
- [x] T011 [P] [US1] Actualizar `Bienvenidapuntos` para que cuando `user === null` reemplace el nombre/ícono/puntos del usuario por el botón `"Regístrate para empezar a usar la app"` usando `StyleSheet.create` y `theme.ts` en `client/src/screens/citizen/HomeScreenPrueba/Bienvenidapuntos.tsx`
- [x] T012 [P] [US1] Añadir la sección explicativa de bienvenida ("¿Cómo funciona Eco Alerta?" en 3 pasos: Reporta, Verifica, Canjea) visible para invitados en `client/src/screens/citizen/HomeScreenPrueba/IncioHome.tsx`

**Checkpoint**: La app inicia en Modo Invitado con su guía explicativa y botón de llamada a la acción en la cabecera.

---

## Phase 4: User Story 2 - Navegación de Invitado y Bloqueo de Acciones (Auth Gate) (Priority: P1)

**Goal**: Permitir que el invitado explore la app y vea el catálogo de productos, pero interceptar cualquier intento de reportar un foco, abrir perfil/historial o agregar productos al carrito solicitando registrarse o iniciar sesión.

**Independent Test**: Como invitado (`user === null`), navegar a la pestaña Tienda y ver productos; luego pulsar el botón central de Cámara/Reportar, la pestaña Perfil o "Agregar al Carrito" y comprobar que aparece el Auth Gate invitando a registrarse.

### Implementation for User Story 2

- [x] T013 [P] [US2] Crear el componente `AuthGateModal` (y helper en `AuthContext`) estilizado con `StyleSheet.create` y `theme.ts` que explica que se requiere cuenta y ofrece botones `"Registrarme"` e `"Iniciar Sesión"` en `client/src/components/common/AuthGateModal.tsx`
- [x] T014 [US2] Interceptar los eventos `tabPress` de las pestañas `Report` (Cámara), `Profile` y rutas de usuario en `MainNavigator` cuando `user === null` para disparar el Auth Gate en `client/src/navigation/MainNavigator.tsx`
- [x] T015 [US2] Asegurar que `StoreScreen` permita listar y filtrar productos por categoría cuando `user === null`, pero dispare el Auth Gate al pulsar el botón de agregar/canjear producto en `client/src/screens/citizen/StoreScreen.tsx`

**Checkpoint**: Modo Invitado y Auth Gate operando de extremo a extremo.

---

## Phase 5: User Story 3 - Autoregistro Ciudadano con Validación Estricta (Priority: P1)

**Goal**: Permitir que un invitado se registre como `CITIZEN` con `puntos = 0` validando campos obligatorios, formato de email, contraseña `>= 6` caracteres y coincidencia de confirmación.

**Independent Test**: Desde el botón `"Regístrate para empezar a usar la app"`, completar el formulario en `RegisterScreen` con datos válidos y verificar que el usuario ingresa como `CITIZEN` con `0 puntos` y ve su nombre e ícono en el Home.

### Implementation for User Story 3

- [x] T016 [US3] Actualizar `RegisterScreen` para incluir campo de confirmación de contraseña, validaciones con `validators.ts`, mensajes de error claros bajo cada input (labels fuera de los inputs) y conexión a `AuthContext.register` en `client/src/screens/auth/RegisterScreen.tsx`
- [x] T017 [US3] Mostrar errores del servidor (`409 Conflict` por correo duplicado) y redirigir automáticamente al Home Ciudadano autenticado tras el registro exitoso en `client/src/screens/auth/RegisterScreen.tsx`

**Checkpoint**: Autoregistro ciudadano completo con saldo inicial en 0 puntos.

---

## Phase 6: User Story 4 - Login Multi-Rol y Enrutamiento Dinámico RBAC (Priority: P1)

**Goal**: Autenticar usuarios y redirigirlos automáticamente a la interfaz de su rol (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`).

**Independent Test**: Iniciar sesión con cada una de las 4 cuentas semilla y comprobar que cada rol aterriza en su navegador exclusivo sin acceso a pantallas de otros roles.

### Implementation for User Story 4

- [x] T018 [P] [US4] Crear la pantalla base `CollaboratorHomeScreen` (con header institucional y cierre de sesión, lista para extender en `006`) en `client/src/screens/collaborator/CollaboratorHomeScreen.tsx`
- [x] T019 [P] [US4] Crear el navegador `CollaboratorNavigator` para el rol `COLLABORATOR` en `client/src/navigation/CollaboratorNavigator.tsx`
- [x] T020 [US4] Conectar el enrutamiento condicional de los 4 roles (`CITIZEN` -> `MainNavigator`, `AGENT` -> `AgentNavigator`, `ADMIN` -> `AdminNavigator`, `COLLABORATOR` -> `CollaboratorNavigator`) en `client/src/navigation/AppNavigator.tsx`
- [x] T021 [US4] Actualizar `LoginScreen` con validaciones de formato, botón de acceso a Google OAuth / Demo de los 4 roles y botón para volver al Home de Invitado en `client/src/screens/auth/LoginScreen.tsx`

**Checkpoint**: Enrutamiento RBAC de los 4 roles operativo.

---

## Phase 7: User Story 5 & 6 - Persistencia de Sesión, Logout y Acceso Rápido (Priority: P2/P3)

**Goal**: Mantener la sesión activa en `AsyncStorage` al cerrar y reabrir la app, y permitir cerrar sesión limpiando el almacenamiento local y regresando al Home de Invitado.

**Independent Test**: Iniciar sesión, recargar la app en Expo Go y verificar que mantiene la sesión; luego pulsar "Cerrar Sesión" y verificar que regresa al Home de Bienvenida en Modo Invitado (`user === null`).

### Implementation for User Story 5 & 6

- [x] T022 [US5] Garantizar la hidratación de sesión (`@ecoalerta_user`, `@ecoalerta_token`) al iniciar `AuthProvider` y la limpieza total en `logout()` retornando al estado `user === null` en `client/src/context/AuthContext.tsx`
- [x] T023 [P] [US5] Verificar en Expo Go que el logout ciudadano vuelva al Home invitado y que los roles agente, administrador y colaborador vuelvan a Login; probar los `SafeAreaView` de los paneles en `client/src/screens/agente/AgentHomeScreen.tsx`, `client/src/screens/admin/AdminHomeScreen.tsx` y `client/src/screens/collaborator/CollaboratorHomeScreen.tsx`
- [x] T027 [US5] Implementar endpoints GET /api/auth/me y GET /api/auth/perfil en el backend y recargarPerfilUsuario() en AuthContext para refresco en tiempo real de perfil y puntos en base de datos en `server/src/controllers/auth.controller.ts` y `client/src/context/AuthContext.tsx`

---

## Phase 8: Polish & Cross-Cutting Concerns (Testing & QA)

**Purpose**: Pruebas unitarias/integración y validación final contra la Constitución.

- [x] T024 [P] Crear pruebas unitarias de validaciones de formulario (`validateEmail`, `validatePassword`, `validateRegistrationForm`) y `LocalAuthRepository` en `client/src/utils/__tests__/validators.test.ts`
- [x] T025 [P] Crear pruebas de integración para `POST /api/auth/register` (`puntos = 0`, `409` duplicado) y `POST /api/auth/login` (4 roles) en `server/src/__tests__/auth.test.ts`
- [x] T026 Ejecutar checklist de verificación manual en Expo Go (Modo Invitado, registro e inicio de sesión directos, filtros de categoría, Auth Gate en Cámara/Perfil/Tienda, Registro con 0 puntos, Login 4 roles y Logout) documentando resultados en `specs/001-auth-rbac/checklists/requirements.md`

---

## Dependencies & Execution Order

- **Phase 1 (Setup)** → bloquea **Phase 2 (Foundational)**.
- **Phase 2 (Foundational)** → bloquea todas las historias de usuario (`US1` a `US6`).
- **Phase 3 (US1 - Modo Invitado)** y **Phase 4 (US2 - Auth Gate)** deben ejecutarse primero como MVP de entrada a la aplicación.
- **Phase 5 (US3 - Registro)** y **Phase 6 (US4 - Login 4 Roles)** pueden ejecutarse en paralelo tras completar Phase 2.
- **Phase 7 (US5/US6)** y **Phase 8 (Testing)** cierran el módulo.

## Ajustes de UX posteriores

- [x] T028 [US2] Interceptar la pestaña **Más** en modo invitado para mostrar directamente el `AuthGateModal`, sin navegar a `MasScreen`; mantener el comportamiento original para sesiones activas en `client/src/navigation/MainNavigator.tsx`.
- [x] T029 [US5] Compartir y persistir la URI de foto de perfil en la sesión autenticada y mostrarla en el avatar del Home ciudadano activo (`HomeScreenPrueba/Bienvenidapuntos`), manteniendo el avatar predeterminado si no se configuró foto en `client/src/context/AuthContext.tsx`, `client/src/interfaces/user.ts`, `client/src/screens/citizen/ProfileScreen.tsx`, `client/src/screens/citizen/HomeScreenPrueba/Bienvenidapuntos.tsx` y `client/src/screens/citizen/HomeScreen.tsx`.
- [x] T030 [US5] Conectar el botón de notificaciones del Inicio a una bandeja que muestra estados actuales de reportes y canjes, incluida la disponibilidad de retiro calculada tras dos días hábiles; validar el cálculo de fechas en pruebas unitarias en `client/src/screens/citizen/HomeScreenPrueba/IncioHome.tsx`, `client/src/components/citizen/CitizenNotificationsModal.tsx`, `client/src/utils/citizenNotifications.ts` y `client/src/utils/__tests__/citizenNotifications.test.ts`.
- [x] T031 [US5] Unificar la terminología visible de la moneda de recompensa como `EcoPuntos` en Inicio, Perfil, reportes, tienda, carrito, canjes, auditoría y asignación de recompensas, conservando los nombres internos de datos y referencias a puntos geográficos.
- [x] T032 [US5] Reemplazar en la cabecera del Inicio el engranaje por el saldo de EcoPuntos para ciudadanos autenticados y quitar la duplicación del saldo en la tarjeta de bienvenida, conservando el espacio alineado para invitados en `client/src/components/Header.tsx`, `client/src/screens/citizen/HomeScreenPrueba/IncioHome.tsx` y `client/src/screens/citizen/HomeScreenPrueba/Bienvenidapuntos.tsx`.
- [x] T033 [US5] Agregar entre el carrusel de canjes y la sección de reportes recientes un espacio de ancho completo y altura inferior para futuros anuncios, con la etiqueta visible `Anuncios`, en `client/src/screens/citizen/HomeScreenPrueba/IncioHome.tsx`.
- [x] T034 [US5] Aplicar un fondo verde suave a las secciones del carrusel de canjes y reportes recientes para distinguirlas del fondo de Inicio, conservando las tarjetas blancas legibles mediante el token de color compartido en `client/src/utils/theme.ts`, `client/src/screens/citizen/HomeScreenPrueba/CarruselPrueba.tsx` y `client/src/screens/citizen/HomeScreenPrueba/FotosPuntos.tsx`.
- [x] T035 [US5] Conectar Editar Perfil con la pantalla de Perfil y permitir editar y persistir el nombre ciudadano en el servidor y sesión, manteniendo correo como solo lectura y reutilizando la edición existente de foto en `client/src/screens/citizen/MasScreen.tsx`, `client/src/screens/citizen/ProfileScreen.tsx`, `client/src/context/AuthContext.tsx`, `server/src/controllers/auth.controller.ts` y `server/src/routes/auth.routes.ts`.
- [x] T036 [US5] Conectar Notificaciones de Más a la bandeja real de reportes/canjes y reemplazar los avisos simulados de Ayuda y Términos por una pantalla de preguntas frecuentes y un borrador de condiciones claramente pendiente de revisión en `client/src/screens/citizen/MasScreen.tsx`.
- [x] T037 [US5] Validar mediante pruebas que la actualización del nombre se limita a la identidad autenticada y rechaza valores inválidos en `server/src/__tests__/admin-auth.test.ts`.
- [x] T038 [US5] Unificar la presencia del encabezado institucional con logo en las pantallas de Perfil, Más, Carrito, Agente, Colaborador y secciones administrativas, respetando las áreas seguras y retirando el logo duplicado del encabezado del Colaborador en `client/src/screens/citizen/ProfileScreen.tsx`, `MasScreen.tsx`, `CartScreen.tsx`, `client/src/screens/agente/AgentHomeScreen.tsx`, `client/src/screens/collaborator/CollaboratorHomeScreen.tsx` y `client/src/screens/admin/`.
- [x] T039 [US5] Configurar globalmente los iconos y textos de la barra de estado del dispositivo en color oscuro al abrir la app para que hora, batería, señal y notificaciones sean legibles sobre las pantallas claras en `client/App.tsx`.
- [x] T040 [US5] Corregir el destino del cierre de sesión del Colaborador para volver a la pantalla de Login directamente y mostrar un error explícito si falla la limpieza de sesión en `client/src/screens/collaborator/CollaboratorHomeScreen.tsx`.
