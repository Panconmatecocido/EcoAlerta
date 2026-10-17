<!--
# Sync Impact Report
- Version change: 1.0.0 -> 1.1.0
- Principle III updated: Prohibits NativeWind/Tailwind CSS; enforces per-component StyleSheet.create consuming centralized tokens in theme.ts.
- Principles defined:
  - Principle I: Spec-Driven & Non-Destructive Continuity (NON-NEGOTIABLE)
  - Principle II: Decoupled Repository Pattern & Dual-Mode Resilience (RNF-06)
  - Principle III: Design System, Curved Header & Per-Component StyleSheet
  - Principle IV: Multi-Tenancy, Atomic Concurrency & Data Integrity
  - Principle V: Strict 9-Stage Report Lifecycle & Verity Protocol
  - Principle VI: Ecological Store, 5-Minute TTL Checkout & Branch Fulfillment
  - Principle VII: Test-Driven Quality Gates, Seeds & Expo Verification
- Follow-up TODOs: None.
-->

# Eco Alerta Constitution

## Core Principles

### I. Spec-Driven & Non-Destructive Continuity (NON-NEGOTIABLE)
Every single change, enhancement, and new module in Eco Alerta MUST strictly follow the Spec-Driven Development (SDD) methodology via GitHub Spec Kit. Existing working code in both the React Native/Expo client and the Express/Prisma server is considered sacred and MUST NOT be rewritten from scratch, deleted, or broken. All specifications (`/speckit.specify`), architectural plans (`/speckit.plan`), and task breakdowns (`/speckit.tasks`) MUST reuse, integrate with, and cleanly extend existing endpoints, screens, components, contexts, and database models.

### II. Decoupled Repository Pattern & Dual-Mode Resilience (RNF-06)
The Frontend mobile application MUST interact with the data layer strictly through decoupled service/repository abstractions (`IRepository`). The architecture MUST support seamless switching and graceful fallback between:
1. `RemoteRepository`: Connects directly to the Express/Node.js REST API in `/server` powered by PostgreSQL (Supabase) via Prisma ORM.
2. `LocalMockRepository`: Operates against local persistent cache (`AsyncStorage`) and deterministic mock fixtures.
This guarantees high availability, rapid offline-capable UI development, isolated unit testing, and full network fault tolerance.

### III. Design System, Curved Header & Per-Component StyleSheet
The user interface MUST be built with React Native (Expo) and TypeScript using vanilla `StyleSheet.create` scoped per component, strictly consuming the centralized design tokens and semantic palette from `client/src/utils/theme.ts` (`COLORS`, `SPACING`, `BORDER_RADIUS`, `ICON_SIZE`). **NativeWind / Tailwind CSS is strictly prohibited** to prevent build friction and maintain 100% compatibility with existing screens and wireframe layouts. All screens MUST uphold the visual identity of Eco Alerta:
- Reusable Institutional Curved Header: Border bottom radius 36px, notification bell at the top-left, centered leaf logo with "ECO ALERTA" title, and settings gear at the top-right.
- Input Design: Flat wireframe inputs with external top labels and rounded border radius.
- Mandatory Semantic Palette in `theme.ts`:
  - `fondoAplicacion` (`#f7fdf1`): Fondo general de pantallas.
  - `superficieTarjeta` (`#ffffff`) y `fondoTarjeta` (`#f4faec`): Tarjetas y contenedores.
  - `fondoEncabezado` (`#daeab9`): Fondo del encabezado curvo.
  - `iconoActivoInferior` (`#81b846`): Iconos activos de tab bar e indicadores.
  - `camaraInferior` (`#679a33`): Botón central flotante de cámara.
  - `botonPrincipal` (`#568b29`): Botón de acción principal.
  - `iconoPrincipal` (`#406a1d`): Iconografía corporativa.
  - `textoVerde` (`#42731c`): Texto destacado y títulos intermedios.
  - `textoLogo` (`#035828`): Color corporativo del logo Eco Alerta.
  - `textoVerdeOscuro` (`#0e2a0c`): Texto oscuro de alto contraste y títulos.
  - `textoPeligro` / `fondoPeligro` (`#d32f2f` / `#fdeded`): Acciones destructivas / error.
  - `textoAdvertencia` / `fondoAdvertencia` (`#ed6c02` / `#fff4e5`): Prioridad media / pendientes.

### IV. Multi-Tenancy, Atomic Concurrency & Data Integrity
The backend is structured under a strict Multi-Tenant model partitioned by Municipality (`Municipio`). All queries and data modifications MUST respect the tenant boundary (`municipioId`).
- Atomic Concurrency: High-contention operations (1-to-1 agent case locks, citizen point awards, and checkout stock deductions) MUST be executed within database transactions (`prisma.$transaction`).
- Data Preservation: Hard deletes are strictly prohibited in core domains. Catalog items use logical deletion (`activo: false`) to safeguard exchange history. Citizen reports use visual soft-delete (`ocultarUsuario: true`) so cases remain fully auditable in the municipal backoffice.
- Security: Passwords MUST always be hashed with industry-standard cryptographic functions (`passwordHash`).

### V. Strict 9-Stage Report Lifecycle & Verity Protocol
Every environmental report progresses through a deterministic, auditable 9-stage lifecycle:
1. Citizen Creation: Category selection (*Microbasural*, *Foco Dengue*, *Terreno Baldío*, *Otro*), GPS capture (`latitud`/`longitud`) + manual reference (`direccion`), photo capture compressed to `< 1.2 MB`. Initial state: `PENDIENTE`. **0 points awarded upfront**.
2. Admin Triage: Evaluation by Municipal Admin. If fake/invalid: rejected (`RECHAZADO`) with mandatory justification and 0 points. If legitimate: assigned priority (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`) and approved (`APROBADO`) to the municipal pool.
3. 1-to-1 Agent Lock: Field agents browse approved cases. Tapping "Tomar Caso" triggers an atomic lock: state moves to `EN_VERIFICACION` and assigns `agenteId`. An agent with an active case cannot take another.
4. In-Situ Verification & 3-Attempt Protocol: The agent inspects the site and uploads verification photo (`fotoVerificacionUrl`):
   - Case A (Real): Moves to `VERIFICADO_PENDIENTE` for Admin verification audit.
   - Case B (False on site): Moves to `RECHAZADO` with agent discharge photo.
   - Case C (Inaccessible, e.g. closed gate): Agent logs notice photo, incrementing `intentosInaccesible` (up to 3 total). On 3rd failed attempt, moves to `CERRADO_INACCESIBLE` for municipal legal action without penalizing the citizen.
5. Verity Validation & Point Crediting: Admin verifies the agent's findings. Upon approval, points are awarded to the citizen via atomic transaction according to the priority schedule (`[BAJA: 50-80, MEDIA: 100-150, ALTA: 200-300, URGENTE: 350-500]`), and the case moves to `EN_SANEAMIENTO`.
6. Case Release & Reassignment: If an agent abandons a case (or admin forces reassignment), it returns to the pool:
   - If not yet verified: returns to `APROBADO`.
   - If already verified and points credited: returns directly to `EN_SANEAMIENTO` so the next agent skips verification and proceeds straight to cleanup.
7. Agent Sanitation & Technical Resolution: The agent cleans the site, uploads the mandatory "After" photo (`fotoSolucionUrl`) and technical report (`informeSolucion`), moving the case to `RESUELTO_TECNICO`. The agent becomes available again.
8. Dual Certification by Admin: Admin evaluates the "Before" vs "After" side-by-side comparison. If substandard: observed with notes and returned to `EN_SANEAMIENTO`. If approved: moves to `RESUELTO` (`CERRADO_DEFINITIVO`) and citizen is notified.
9. Home Tracking & Citizen Soft Delete: Citizens track live progress. Once points are credited, the citizen may archive the card from their feed (`ocultarUsuario = true`). The record remains intact in municipal records.

### VI. Ecological Store, 5-Minute TTL Checkout & Branch Fulfillment
The points-for-rewards economy guarantees stock consistency and zero overselling:
- Reactive Cart: Live recalculation of points `TotalPuntos = Sum(Cantidad * CostoUnitario)`. Quantities reduced to 0 are removed. Cart persists in local storage.
- 5-Minute Stock Lock (TTL): When proceeding to Checkout, an atomic lock reserves physical stock for 5 minutes (`bloqueadoHasta`). If unconfirmed after 5 minutes or abandoned, stock is automatically released.
- Point Validation: Prevents checkout if `PuntosUsuario < TotalPuntosCarrito`. The points cost is re-verified against the database at the instant of confirmation.
- Pickup Protocol: Users select a municipal branch (`Sucursal`), with guaranteed availability from 48 business hours post-order. Emits unique alphanumeric `codigoRetiro` (e.g. `ECO-7894-K`).
- Delivery & Expiration: A municipal operator (`COLLABORATOR` / Admin) verifies the code and marks the order as `ENTREGADO`. Orders uncollected after 30 calendar days are marked `CANCELADO` (`EXPIRADO`): stock returns to inventory, but points are non-refundable.

### VII. Test-Driven Quality Gates, Seeds & Expo Verification
All specifications and code contributions MUST adhere to a test-first discipline:
- Frontend Testing: Jest + React Native Testing Library. Unit tests for Cart and Checkout MUST simulate time expiration using `jest.useFakeTimers()`.
- Backend Testing: Integration tests using Supertest against Prisma endpoints.
- Seed Data Contract: The official seed (`server/prisma/seed.ts`) and frontend mock data MUST include:
  - Municipality: Pilar (`codigo: "PILAR-BA"`).
  - 4 Roles: Citizen 1 (Joaquín, 1250 pts), Citizen 2 (50 pts, tests insufficient funds), Agent 1 & Agent 2 (concurrent lock & release testing), Admin 1 (triage & dual certification), Collaborator 1 (order fulfillment).
  - Reports in all lifecycle stages (Pending, Approved, In Verification, In Sanitation, 2nd Attempt Inaccessible, Technical Resolution with Before/After, and Soft-Deleted).
  - Catalog: Reusable bag (40 pts), Eco bottle (100 pts), Eco cap (80 pts), Sustainable thermos (500 pts, stock = 1 for TTL concurrency), and 1 inactive product.
  - Redemptions: 1 pending pickup (`ECO-7894-K`), 1 delivered, 1 expired (>30 days).

### VIII. Guest Mode, Welcome Home & Progressive Auth Gate (RF-AUT-06 a 08)
Unauthenticated visitors (`user === null`, Guest Mode) MUST NOT be blocked at the Login screen upon launching the application. Instead:
- **Guest Welcome Home:** The app boots directly into the Guest Welcome Home screen explaining how Eco Alerta works (reporting environmental hazards, municipal verification, earning eco-points, and redeeming sustainable rewards).
- **Header CTA Replacement:** In the welcome card where the logged-in user's avatar icon and name normally appear, Guest Mode MUST render an interactive call-to-action button labeled **"Regístrate para empezar a usar la app"** that navigates to the Registration/Login flow.
- **Read-Only Exploration & Auth Gate:** Guests can freely browse the Welcome Home and view products in the Ecological Store, but CANNOT add items to the cart, report hazards via Camera, or open Profile/History. Attempting any action or route that requires user identity MUST be intercepted by an Auth Gate prompting the visitor to register or log in.

## Technical Constraints & Performance Standards (RNF)

- **RNF-01 (Performance & Latency):** Local storage operations (`AsyncStorage`) MUST execute in `< 300 ms`. Backend API endpoints MUST respond in `< 600 ms` under standard network conditions.
- **RNF-02 (Multimedia Optimization):** All photos captured from the camera or picked from the gallery MUST be compressed to `< 1.2 MB` (maximum 1080px resolution) before uploading to Supabase Storage or saving locally.
- **RNF-03 (Concurrency & Locking):** All case assignment, point transfers, and stock reservation workflows MUST use `prisma.$transaction` with appropriate isolation levels to prevent race conditions.
- **RNF-04 (Atomic Point Distribution):** Point crediting must be executed atomically alongside report state transitions, ensuring points cannot be duplicated or lost.
- **RNF-05 (Mobile Platform Support):** Application MUST run seamlessly across Android and iOS on Expo SDK 57 (React Native 0.86+, React 19).
- **RNF-06 (Decoupled Services):** Direct `fetch` calls inside React UI components are strictly forbidden. All requests must go through designated service modules (`api.ts`, `adminService.ts`, `reportService.ts`, `storeService.ts`).
- **RNF-07 (Security & Encryption):** Passwords MUST never be stored in plain text. JWT/Session tokens must be securely stored.
- **RNF-08 (Auditing & Soft Deletes):** Timestamps (`creadoEn`, `actualizadoEn`, `fechaVerificacion`, `fechaResolucion`) and audit logs MUST be captured for every administrative state change.
- **RNF-09 (Frictionless Guest Onboarding & Auth Gate Latency):** Cold start for unauthenticated users MUST land on the Guest Welcome Home in `< 300 ms`, and Auth Gate interceptions on protected actions (Camera, Profile, Add to Cart) MUST trigger in `< 100 ms` without crashes.

## Development Workflow & Spec Kit Quality Gates

The engineering team adheres strictly to the following 4-step Spec Kit lifecycle:
1. **Specify (`/speckit.specify`):** Generate/update feature specs in `.specify/` without writing business code. Ensure user stories (HU) and functional requirements (RF) map 1:1 to the constitution.
2. **Plan (`/speckit.plan`):** Produce the technical implementation plan, defining file diffs, interfaces, and architecture without altering application files.
3. **Tasks (`/speckit.tasks`):** Break down the plan into small, dependency-ordered, testable tasks.
4. **Implement (`/speckit.implement`):** Execute tasks sequentially, running tests and verifying UI in Expo Go after each phase.

### Git Branching & PR Rules
- Feature branches MUST follow the convention: `feat/<module-name>` or `fix/<bug-name>`.
- Merges to `main` require a clean PR, passing automated tests, and verification that no existing functionality has regressed.
- Database changes MUST use non-destructive Prisma migrations (`prisma migrate dev`).

## Governance

1. **Constitutional Primacy:** This Constitution is the authoritative standard for all architectural, coding, design, and testing decisions. No feature plan or pull request that violates these principles may be accepted.
2. **Amendment Procedure:** Amendments require unanimous consensus of the core development team, a formal proposal detailing rationale and backwards-compatibility analysis, and an explicit version bump.
3. **Versioning Policy:**
   - **MAJOR (X.0.0):** Incompatible governance shifts, architectural overhauls, or breaking model deletions.
   - **MINOR (1.X.0):** Addition of new modules, principles, roles, or non-destructive schema extensions.
   - **PATCH (1.0.X):** Refinements, wording clarifications, and bug fixes in documentation.
4. **Compliance Verification:** Prior to merging any Spec Kit task, the implementer must verify adherence to Principles I through VIII.

**Version**: 1.2.0 | **Ratified**: 2026-10-14 | **Last Amended**: 2026-10-15
