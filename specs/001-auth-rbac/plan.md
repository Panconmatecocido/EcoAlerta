# Implementation Plan: Autenticación Multi-Rol RBAC y Modo Invitado

**Branch**: `001-auth-rbac` | **Date**: 2026-04-15 | **Spec**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/spec.md)
**Input**: Feature specification from `/specs/001-auth-rbac/spec.md`

## Summary

Implementar el flujo de **Modo Invitado (Guest Welcome Home)** y el sistema de **Autenticación Multi-Rol (RBAC)** conectado a Express y Prisma (`PostgreSQL` en Supabase) con persistencia local y soporte offline mediante el Patrón Repositorio (`IAuthRepository`). La aplicación iniciará sin bloqueo de login mostrando el Home de Bienvenida explicativo con el botón `"Regístrate para empezar a usar la app"` en el bloque de usuario, permitiendo explorar la tienda en modo lectura e interceptando acciones protegidas (Cámara/Reportar, Perfil, Historial y Agregar al Carrito) mediante un **Auth Gate** que redirige al registro/login. Una vez autenticado, `AppNavigator` enrutará dinámicamente a los 4 roles (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`).

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend Expo SDK 57 / React 19 / React Native 0.86.2, Backend Node.js + Express 4.19)  
**Primary Dependencies**: `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`, `@react-native-async-storage/async-storage`, `@prisma/client` 5.22, `cors`, `dotenv`  
**Storage**: PostgreSQL (Supabase) vía Prisma ORM en `server/` + `AsyncStorage` (`@ecoalerta_user`, `@ecoalerta_token`) en `client/`  
**Testing**: Jest + Supertest (Backend API y Repositorios) + Checklist de pruebas manuales en Expo Go  
**Target Platform**: Android / iOS vía Expo Go y Web (React Native Web)  
**Project Type**: Mobile App + REST API Monorepo (`client/` + `server/`)  
**Performance Goals**: Arranque en Modo Invitado o restauración de sesión `< 200ms` desde `AsyncStorage`; respuesta de `/api/auth/*` `< 500ms`  
**Constraints**:
- Prohibido usar Tailwind/NativeWind; estilos exclusivamente con `StyleSheet.create` y `client/src/utils/theme.ts`.
- Prohibido borrar o recrear desde cero las pantallas existentes; se extienden `AppNavigator.tsx`, `MainNavigator.tsx`, `AuthContext.tsx`, `Bienvenidapuntos.tsx`, `IncioHome.tsx`, `LoginScreen.tsx` y `RegisterScreen.tsx`.
- Nuevos ciudadanos inician estrictamente con `puntos = 0`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Principio I (Preservación de Código)**: CUMPLE. Reutiliza `AuthContext.tsx`, `AppNavigator.tsx`, `MainNavigator.tsx`, `Bienvenidapuntos.tsx`, `IncioHome.tsx`, `LoginScreen.tsx`, `RegisterScreen.tsx` y `server/src/controllers/auth.controller.ts`.
- **Principio II (`StyleSheet` + `theme.ts`)**: CUMPLE. Todos los nuevos componentes (sección explicativa de bienvenida, botón `"Regístrate para empezar a usar la app"`, modal Auth Gate y `CollaboratorHomeScreen`) usarán `StyleSheet.create` y `COLORS`, `SPACING`, `TYPOGRAPHY`, `RADIUS`, `SHADOWS` de `client/src/utils/theme.ts`.
- **Principio III (Patrón Repositorio y Multi-Tenancy)**: CUMPLE. Se crea `IAuthRepository` con `RemoteAuthRepository` (`/api/auth/login`, `/api/auth/register`) y `LocalAuthRepository` (fallback en `AsyncStorage`), vinculando usuarios al `Municipio` (`MUN-001` por defecto).
- **Principio IV (RBAC 4 Roles + Modo Invitado)**: CUMPLE. Soporta estado `user === null` (Invitado) y los 4 roles (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`).
- **Principio V (Regla de Puntos Cero Inicial)**: CUMPLE. `POST /api/auth/register` y `schema.prisma` inicializan `puntos = 0`.
- **Principio VII (Testing)**: CUMPLE. Incluye pruebas automatizadas de validación de formularios, Auth Gate y endpoints `/api/auth/*` + checklist manual Expo Go.

## Project Structure

### Documentation (this feature)

```text
specs/001-auth-rbac/
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
│   │   └── common/
│   │       └── AuthGateModal.tsx             # [NUEVO] Modal reutilizable para interceptar acciones de invitados
│   ├── context/
│   │   └── AuthContext.tsx                   # [EXTENDER] Integrar IAuthRepository, rol COLLABORATOR y helper requireAuth
│   ├── navigation/
│   │   ├── AppNavigator.tsx                  # [EXTENDER] Iniciar en MainNavigator para invitados + flujo AuthStack + CollaboratorNavigator
│   │   ├── MainNavigator.tsx                 # [EXTENDER] Interceptar tabs Report y Profile con AuthGate cuando user === null
│   │   └── CollaboratorNavigator.tsx         # [NUEVO] Navegador dedicado para el rol COLLABORATOR
│   ├── repositories/
│   │   └── auth/
│   │       ├── IAuthRepository.ts            # [NUEVO] Contrato de repositorio de autenticación
│   │       ├── RemoteAuthRepository.ts       # [NUEVO] Implementación HTTP contra /server
│   │       ├── LocalAuthRepository.ts        # [NUEVO] Implementación fallback local con AsyncStorage
│   │       └── index.ts                      # [NUEVO] Factory/selector de repositorio
│   ├── screens/
│   │   ├── auth/
│   │   │   ├── LoginScreen.tsx               # [EXTENDER] Validaciones RF-AUT-02, acceso rápido demo 4 roles y botón volver al Home Invitado
│   │   │   └── RegisterScreen.tsx            # [EXTENDER] Validaciones RF-AUT-01/02 (confirmPassword, >= 6 chars, email único, puntos = 0)
│   │   ├── citizen/
│   │   │   └── HomeScreenPrueba/
│   │   │       ├── Bienvenidapuntos.tsx      # [EXTENDER] Mostrar botón "Regístrate para empezar a usar la app" si user === null
│   │   │       └── IncioHome.tsx             # [EXTENDER] Guía explicativa de 3 pasos para invitados (Reporta -> Verifica -> Canjea)
│   │   └── collaborator/
│   │       └── CollaboratorHomeScreen.tsx    # [NUEVO] Pantalla base del Colaborador Municipal (conectada en 006)
│   └── utils/
│       └── validators.ts                     # [NUEVO] Funciones puras de validación de email, password y registro

server/
├── prisma/
│   ├── schema.prisma                         # [LISTO] Enum Role con CITIZEN, AGENT, ADMIN, COLLABORATOR y puntos @default(0)
│   └── seed.ts                               # [EXTENDER] Incluir usuario semilla COLLABORATOR y asegurar puntos iniciales coherentes
└── src/
    ├── controllers/
    │   └── auth.controller.ts                # [EXTENDER] Añadir registerUser (puntos=0, municipio por defecto, 409 email duplicado) y login 4 roles
    └── routes/
        └── auth.routes.ts                    # [EXTENDER] Registrar POST /api/auth/register junto a POST /api/auth/login
```

**Structure Decision**: Se mantiene la arquitectura Monorepo (`client/` + `server/`). En `client/src/` se introduce la carpeta `repositories/auth/` para cumplir con `RNF-06` sin romper los servicios actuales, y se extiende la navegación existente para permitir que `MainNavigator` sea la vista inicial tanto para `CITIZEN` como para usuarios no autenticados (`user === null`).

## Architecture & Implementation Details

### 1. Backend (`/server`) y Base de Datos
- **Migración y Seed (`server/prisma/`)**:
  - Verificar sincronización de `schema.prisma` (`Role.COLLABORATOR` y `puntos @default(0)`).
  - Actualizar `server/prisma/seed.ts` para incluir al menos 1 cuenta por cada uno de los 4 roles (`ciudadano@ecoalerta.com`, `agente1@ecoalerta.com`, `admin@ecoalerta.com`, `colaborador@ecoalerta.com`) asociadas al municipio `MUN-001`.
- **Controlador `server/src/controllers/auth.controller.ts`**:
  - `register`: Validar presencia de `nombre`, `email`, `password` (`>= 6` caracteres) y formato de email. Verificar en Prisma si `email` existe (retornar `409 Conflict` con mensaje claro). Obtener el municipio por defecto (`MUN-001`) y crear el usuario con `rol: 'CITIZEN'` y `puntos: 0`.
  - `login`: Buscar usuario por `email` (case-insensitive `trim().toLowerCase()`), validar contraseña y retornar `{ token, user: { id, nombre, email, rol, puntos, municipioId } }`.

### 2. Capa de Repositorio (`client/src/repositories/auth/`)
- **`IAuthRepository`**:
  - `login(email: string, password: string): Promise<AuthResponse>`
  - `register(data: RegisterDTO): Promise<AuthResponse>`
  - `getCurrentSession(): Promise<User | null>`
  - `clearSession(): Promise<void>`
- **`RemoteAuthRepository`**: Consume `POST /api/auth/login` y `POST /api/auth/register` usando la URL base configurada en `client/src/services/api.ts`, y persiste la sesión en `AsyncStorage`.
- **`LocalAuthRepository`**: Fallback con usuarios semilla locales (incluyendo los 4 roles) y registro en `AsyncStorage` cuando `/server` no está alcanzable (modo offline/demo).

### 3. Modo Invitado (`user === null`) y Auth Gate
- **`Bienvenidapuntos.tsx`**:
  - Si `user === null`, reemplazar el bloque de avatar/nombre/puntos por un botón destacado estilizado con `COLORS.primary` (`#568b29`) y `COLORS.headerBg` (`#daeab9`) cuyo texto e ícono digan exactamente `"Regístrate para empezar a usar la app"`. Al pulsarlo, navega a la pantalla `Register` (con opción de cambiar a `Login`).
- **`IncioHome.tsx`**:
  - Si `user === null`, renderizar una tarjeta explicativa de bienvenida ("¿Cómo funciona Eco Alerta?") con los 3 pasos: 1) Reporta focos ambientales, 2) El municipio verifica y sanea, 3) Suma puntos y canjea premios ecológicos.
- **`AuthGateModal.tsx` y `MainNavigator.tsx`**:
  - En `MainNavigator.tsx`, interceptar el evento `tabPress` de las pestañas `Report` (Cámara) y `Profile` cuando `user === null`: ejecutar `e.preventDefault()` y mostrar `AuthGateModal` (o navegar al stack de `Auth` con parámetro de retorno).
  - En `StoreScreen.tsx` (coordinado con `005`), permitir visualizar el catálogo pero interceptar el botón `"Agregar al Carrito"` con el mismo Auth Gate si `user === null`.

### 4. Enrutamiento RBAC en `AppNavigator.tsx`
- Cuando `isLoading` termina:
  - Si `user === null`: Muestra el stack público con `MainNavigator` (en Modo Invitado) + pantallas modales `Login` y `Register`.
  - Si `user.rol === 'CITIZEN'`: Muestra `MainNavigator` con todas las funciones desbloqueadas.
  - Si `user.rol === 'AGENT'`: Muestra `AgentNavigator`.
  - Si `user.rol === 'ADMIN'`: Muestra `AdminNavigator`.
  - Si `user.rol === 'COLLABORATOR'`: Muestra `CollaboratorNavigator`.

## Complexity Tracking

> No existen violaciones a la Constitución. Toda la complejidad se resuelve extendiendo la arquitectura actual de React Navigation y Express/Prisma.
