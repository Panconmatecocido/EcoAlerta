# Specification Quality Checklist: Modo Invitado, Home de Bienvenida, Autenticación Multi-Rol (RBAC) y Gestión de Sesiones

**Purpose**: Validate specification completeness and quality before proceeding to planning
**Created**: 2026-10-15
**Feature**: [spec.md](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/spec.md)

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

- Updated on 2026-10-15 with Guest Mode (`HU-INV-01` to `HU-INV-03`, `RF-AUT-06` to `RF-AUT-08`, `RNF-09`).
- All 16 quality criteria passed. Ready for `/speckit.plan`.

## Feature verification

- Automated client tests: passed (6 tests, including validators and `LocalAuthRepository`).
- Client TypeScript check (`npx tsc --noEmit`): passed.
- Server authentication integration tests: passed (4 tests).
- Manual Expo Go checklist: passed. The user manually verified guest Home and auth CTAs, category filters (including "Otros"), Auth Gate, zero-point registration, duplicate/invalid credential feedback, login for all four roles, agent/admin safe-area layouts, session persistence, and role-specific logout destinations.

## UX regression checklist (pending device verification)

- [x] As a guest, tap **Más** and verify that the shared register/login modal opens immediately without navigating to the options screen.
- [x] As an authenticated user, tap **Más** and verify that the options screen opens normally.
- [x] As a citizen, tap the Home notification bell and verify that current report statuses and redemption availability are listed, including the two-business-day pickup rule.
- [ ] As a citizen, verify that the Home header shows the EcoPuntos balance instead of the settings gear, and that the balance is not duplicated in the welcome card.
- [ ] Verify that the Home displays a full-width `Anuncios` banner slot between the redemption carousel and recent reports, with slightly less height than the welcome card.
- [ ] Verify that the redemption carousel and recent reports have a soft green section background and that their white cards remain legible.
