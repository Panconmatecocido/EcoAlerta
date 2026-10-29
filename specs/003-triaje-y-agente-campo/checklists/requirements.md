# Specification & Implementation Quality Checklist: Triaje Administrativo, Toma de Caso 1 a 1, Verificación In Situ (3 Intentos) y Liberación

**Purpose**: Validate specification completeness, automated tests, and Expo Go verification for Module 003
**Created**: 2026-10-15 | **Validated**: 2026-10-18
**Feature**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/003-triaje-y-agente-campo/spec.md)

## Content Quality

- [x] No implementation details (languages, frameworks, APIs)
- [x] Focused on user value and business needs
- [x] Written for non-technical stakeholders
- [x] All mandatory sections completed

## Requirement Completeness

- [x] No [NEEDS CLARIFICATION] markers remain
- [x] Requirements are testable and unambiguous
- [x] Success criteria are measurable
- [x] Success criteria are technology-agnostic (no implementation details)
- [x] All acceptance scenarios are defined
- [x] Edge cases are identified
- [x] Scope is clearly bounded
- [x] Dependencies and assumptions identified

## Feature Readiness

- [x] All functional requirements have clear acceptance criteria
- [x] User scenarios cover primary flows
- [x] Feature meets measurable outcomes defined in Success Criteria
- [x] No implementation details leak into specification

## Implementation & Expo Go Verification Checklist (T015)

- [x] **US1 - Triaje Admin (`AdminDenunciasScreen`)**: Aprobación con selector de `Prioridad` (`URGENTE`, `ALTA`, `MEDIA`, `BAJA`) hacia `APROBADO`, y rechazo exigiendo justificación obligatoria (`observacionesAdmin`) hacia `RECHAZADO` con 0 puntos.
- [x] **US2 - Semáforo de Bolsa y Navegación Mapa (`AgentHomeScreen`)**: Bolsa general ordenada por `PrioritySemaphoreBadge` (Rojo = `URGENTE`, Naranja = `ALTA`, Verde = `MEDIA`/`BAJA`) y botón `"Cómo llegar (Mapa)"` abriendo coordenadas GPS en aplicación de mapas externa.
- [x] **US2 - Toma de Caso con Bloqueo Atómico 1 a 1 (`PATCH /api/denuncias/:id/tomar`)**: Asignación exclusiva a un único agente (`EN_VERIFICACION`), bloqueo visual y transaccional (`409 Conflict`) de segundo caso en paralelo y de colisión entre agentes.
- [x] **US3 - Verificación In Situ y Protocolo de 3 Intentos (`VerificationFormModal` + `PATCH /api/denuncias/:id/verificar`)**: Captura de foto obligatoria (`< 1.2 MB`), Caso A (`REAL` -> `VERIFICADO_PENDIENTE`), Caso B (`FALSO` -> `RECHAZADO`), y Caso C (`INACCESIBLE` incrementando `intentosInaccesible` hasta 3 y pasando automáticamente a `CERRADO_INACCESIBLE` en el 3.er intento).
- [x] **US4 - Liberación y Desasignación Inteligente (`PATCH /api/denuncias/:id/liberar`)**: Botón `"Liberar / Abandonar Caso"` en `AgentHomeScreen` y `"Liberar a Bolsa"` en `AdminDenunciasScreen` / `AdminAgentesScreen`, retornando a `APROBADO` si aún no fue verificado o manteniendo `EN_SANEAMIENTO` si ya había sido validado.
- [x] **US1 - Lógica de alertas administrativas**: Pruebas unitarias verifican que la bandeja incluya `PENDIENTE`, `VERIFICADO_PENDIENTE` y `RESUELTO_TECNICO`, excluya estados sin acción administrativa y calcule correctamente el indicador de no leído.
- [ ] **US1 - Verificación visual de bienvenida y notificaciones (`AdminHomeScreen`)**: En Expo Go, confirmar que la bienvenida usa el nombre del Administrador, que la campana abre la bandeja, que cada fila lleva al filtro correcto y que el indicador de lectura se conserva al volver a abrir la aplicación.
- [ ] **US2 - Encabezado del Agente (`AgentHomeScreen`)**: En Expo Go, confirmar que el encabezado muestra `Agente de campo municipal` y la bienvenida con el nombre del agente, que el botón para salir queda a la derecha y que el estado de servicio aparece debajo con separación visual.

## Notes

- The 16 specification quality criteria and the five existing implementation checks were previously validated. The administrator-alert logic tests and client type check pass; the new visual/persistence flow still requires manual Expo Go verification.
