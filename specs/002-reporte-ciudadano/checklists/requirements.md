# Specification Quality Checklist: Creación de Reporte Ambiental por Ciudadano, Seguimiento y Soft Delete

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-15
**Feature**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/002-reporte-ciudadano/spec.md)

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

## Notes

- All 16 quality criteria passed on first validation pass.
- Ready for `/speckit.plan`.

## UX regression checklist (pending device verification)

- [ ] Con cámara concedida y lista en ReportScreen, pulsar el botón central inferior y verificar que captura una foto; verificar que la galería sigue disponible.
- [ ] Conceder permiso GPS, usar la ubicación y comprobar que el mapa y el pin se centran en la posición del dispositivo.
- [ ] Ajustar el pin y verificar la sugerencia de dirección/localidad; editar la dirección y confirmar que las coordenadas corresponden al pin.
- [ ] Denegar el permiso GPS, seleccionar un punto en el mapa y enviar con una dirección ingresada manualmente.
- [ ] Verificar que la pantalla de permisos mantiene el encabezado arriba y controles de cámara/galería claramente separados.
- [ ] Abrir Perfil después de crear un reporte y verificar que el reporte aparece y permanece visible mientras se resuelven consultas independientes de perfil o canjes.
- [ ] Verificar que los encabezados de permisos y formulario de Reporte no muestran el engranaje y conservan el logo centrado.
