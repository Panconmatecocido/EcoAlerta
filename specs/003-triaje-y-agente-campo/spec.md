# Feature Specification: Triaje Administrativo, Toma de Caso 1 a 1, Verificación In Situ (3 Intentos) y Liberación

**Feature Branch**: `003-triaje-y-agente-campo`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Triaje admin toma de caso 1 a 1 por agente verificacion in situ con protocolo de 3 intentos y liberacion"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Triaje Inicial y Asignación de Prioridad por el Administrador (Priority: P1)

El Administrador Municipal revisa la bandeja de reportes recién enviados por los vecinos (`PENDIENTE`). Si detecta una broma o reporte inválido, lo rechaza (`RECHAZADO`) ingresando una justificación obligatoria y otorgando 0 puntos. Si el reporte es procedente, le asigna un nivel de prioridad (`BAJA`, `MEDIA`, `ALTA` o `URGENTE`) y lo aprueba (`APROBADO`) para que ingrese inmediatamente a la bolsa general de casos disponible para los agentes de campo del municipio.

**Why this priority**: Filtra el ruido operativo antes de movilizar inspectores en la calle y clasifica la urgencia sanitaria o ambiental de cada alerta.

**Independent Test**: Se puede probar ingresando como Administrador, tomando un reporte en estado `PENDIENTE`, aprobándolo con prioridad `URGENTE` y comprobando que pasa a la bolsa de agentes, y rechazando otro reporte verificando que exige motivo obligatorio.

**Acceptance Scenarios**:

1. **Given** un reporte en estado `PENDIENTE` en el panel del Administrador, **When** el Administrador selecciona una prioridad (`BAJA`, `MEDIA`, `ALTA` o `URGENTE`) y pulsa "Aprobar a Bolsa", **Then** el reporte cambia su estado a `APROBADO` con la prioridad elegida y se vuelve visible en la bolsa general de los agentes del municipio.
2. **Given** un reporte improcedente en estado `PENDIENTE`, **When** el Administrador pulsa "Rechazar", ingresa el motivo obligatorio en observaciones y confirma, **Then** el reporte pasa a estado `RECHAZADO` con `0 puntos` otorgados.
3. **Given** un Administrador intentando rechazar un reporte, **When** deja vacío el campo de justificación, **Then** el sistema impide confirmar el rechazo hasta que ingrese el motivo.

---

### User Story 2 - Bolsa General y Toma de Caso con Bloqueo Atómico 1 a 1 por Agente (Priority: P1)

Los Agentes de Campo en servicio consultan la bolsa general de casos aprobados (`APROBADO` o `EN_SANEAMIENTO` sin agente), ordenados visualmente por criticidad (Rojo = Urgente, Naranja = Alta, Verde = Media/Baja) y distancia. Al pulsar "Tomar Caso", el sistema aplica un bloqueo atómico 1 a 1 que asigna el caso en exclusividad al agente (`EN_VERIFICACION`) e impide que otro inspector lo tome al mismo tiempo o que el mismo agente tome un segundo caso en paralelo.

**Why this priority**: Evita que dos inspectores municipales se desplacen simultáneamente al mismo punto geográfico y garantiza dedicación exclusiva caso por caso.

**Independent Test**: Se puede probar con dos cuentas de Agente intentando tomar el mismo caso de la bolsa: el primero obtiene la asignación exclusiva y el segundo recibe aviso de que el caso ya fue tomado; además, el primer agente no puede tomar otro caso mientras tenga uno activo.

**Acceptance Scenarios**:

1. **Given** un Agente de Campo disponible y sin casos activos en curso, **When** pulsa "Tomar Caso" sobre un reporte `APROBADO` de la bolsa general, **Then** el sistema le asigna el caso exclusivamente (`agenteId`), cambia el estado a `EN_VERIFICACION` y lo retira de la bolsa disponible para otros agentes.
2. **Given** dos Agentes de Campo que pulsan "Tomar Caso" sobre el mismo reporte casi simultáneamente, **Then** el sistema asigna el caso únicamente al primero en procesarse atómicamente y rechaza la segunda solicitud informando que el caso ya fue asignado a otro inspector.
3. **Given** un Agente de Campo que ya posee un caso activo asignado, **When** intenta pulsar "Tomar Caso" en otro reporte de la bolsa, **Then** el sistema bloquea la acción e informa que debe finalizar o liberar su caso actual antes de tomar uno nuevo.

---

### User Story 3 - Verificación In Situ y Protocolo de 3 Intentos por Inaccesibilidad (Priority: P1)

El Agente de Campo llega a la ubicación del reporte y registra el resultado de su inspección presencial subiendo obligatoriamente una fotografía de evidencia (`fotoVerificacionUrl`):
- **Caso A (Es Real):** Sube foto de contraprueba y el caso pasa a `VERIFICADO_PENDIENTE` para que el Administrador valide la veracidad y acredite los puntos al vecino.
- **Caso B (Es Falso en terreno):** Sube foto del lugar limpio/inexistente marcando falso reporte; pasa a `RECHAZADO` sin puntos.
- **Caso C (Es Inaccesible - ej. terreno cerrado con candado):** Sube foto del aviso/sticker municipal dejado en puerta e incrementa el contador de intentos (`intentosInaccesible`). Se permiten hasta **3 intentos en total**; al cumplirse el 3.er intento fallido, el caso pasa automáticamente a `CERRADO_INACCESIBLE` para intimación legal municipal sin penalizar al vecino denunciante.

**Why this priority**: Resuelve la problemática real del trabajo municipal en calle diferenciando alertas verdaderas, falsas alarmas y domicilios/terrenos cerrados con respaldo legal fotográfico.

**Independent Test**: Se puede probar desde la vista del Agente con un caso activo ejecutando los 3 caminos (Real, Falso e Inaccesible en su intento 1, 2 y 3) y verificando las transiciones de estado y el conteo de intentos.

**Acceptance Scenarios**:

1. **Given** un Agente con un caso en `EN_VERIFICACION`, **When** selecciona "Confirmar que es Real" y adjunta la foto de verificación en terreno, **Then** el reporte guarda `fotoVerificacionUrl` y pasa a estado `VERIFICADO_PENDIENTE`.
2. **Given** un Agente con un caso en `EN_VERIFICACION`, **When** constata que la denuncia es falsa en el lugar, adjunta la foto de descargo y marca "Falso en Terreno", **Then** el reporte pasa a `RECHAZADO` con `0 puntos` y el agente queda libre para tomar otro caso.
3. **Given** un Agente frente a un predio inaccesible con `intentosInaccesible < 2`, **When** selecciona "Lugar Inaccesible" y sube la foto del aviso municipal, **Then** el contador `intentosInaccesible` se incrementa en `1` y el caso queda registrado con la visita para una próxima inspección.
4. **Given** un reporte que ya cuenta con `2` intentos fallidos de acceso (`intentosInaccesible = 2`), **When** el Agente registra el 3.er intento fallido con su foto de aviso, **Then** el contador llega a `3`, el estado cambia automáticamente a `CERRADO_INACCESIBLE` y el agente queda liberado de la orden.

---

### User Story 4 - Abandono / Liberación de Caso y Desasignación Forzada (Priority: P2)

Si un Agente sufre un imprevisto en la calle y pulsa "Liberar / Abandonar Caso" (o si el Administrador ejecuta "Forzar Desasignación" por inactividad), el caso se desvincula del agente y regresa a la bolsa general conservando la etapa alcanzada: si aún no estaba verificado regresa a `APROBADO`, pero si ya había sido verificado y validado con puntos otorgados al vecino, regresa directamente en estado `EN_SANEAMIENTO` para que el próximo agente salte la etapa de verificación y vaya directo a realizar la limpieza.

**Why this priority**: Garantiza que ningún reporte quede estancado si un inspector tiene una emergencia, fin de turno o desperfecto del vehículo.

**Independent Test**: Se puede probar liberando un caso en etapa `EN_VERIFICACION` (debe volver a `APROBADO` sin agente) y liberando otro en etapa `EN_SANEAMIENTO` (debe permanecer en `EN_SANEAMIENTO` sin agente listo para ser tomado por otro inspector).

**Acceptance Scenarios**:

1. **Given** un caso asignado en estado `EN_VERIFICACION` (aún no validado), **When** el Agente pulsa "Liberar Caso" o el Administrador fuerza su desasignación, **Then** `agenteId` pasa a vacío (`null`), el estado regresa a `APROBADO` y el caso vuelve a mostrarse en la bolsa general para ser verificado por otro agente.
2. **Given** un caso asignado que ya fue validado y se encuentra en `EN_SANEAMIENTO`, **When** el Agente lo libera o es desasignado por el Administrador, **Then** `agenteId` pasa a vacío (`null`) pero el estado se conserva en `EN_SANEAMIENTO`, permitiendo que el siguiente agente que lo tome vaya directamente al formulario de saneamiento sin repetir la verificación ni duplicar puntos.

---

### Edge Cases

- **Agente fuera de servicio (`disponible = false`)**: Un agente que desactiva su interruptor de "En Servicio" no puede tomar casos nuevos de la bolsa hasta volver a activarse.
- **Intento de subir verificación sin fotografía**: El sistema exige obligatoriamente adjuntar la fotografía de contraprueba/aviso antes de confirmar cualquiera de los tres resultados de verificación.
- **Compresión de fotografías del agente**: Todas las fotos tomadas por el agente en terreno se comprimen a menos de `1.2 MB` antes de enviarse.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-ADM-01 a 03 - Triaje Administrativo)**: El sistema DEBE permitir al Administrador evaluar reportes `PENDIENTE` para: (a) aprobarlos asignando prioridad (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`) pasando a estado `APROBADO`, o (b) rechazarlos pasando a `RECHAZADO` exigiendo justificación obligatoria en `observacionesAdmin`.
- **FR-002 (RF-AGE-01 a 02 - Bolsa Ordenada por Criticidad)**: El sistema DEBE mostrar a los agentes de campo la bolsa de casos disponibles (`APROBADO` y `EN_SANEAMIENTO` sin agente asignado) destacando visualmente la prioridad (Urgente/Alta en tonos de alerta, Media en advertencia, Baja en verde institucional) y su ubicación/distancia.
- **FR-003 (RF-AGE-03 a 04 y RNF-03 - Bloqueo Atómico 1 a 1)**: El sistema DEBE ejecutar la toma de caso mediante una operación atómica que verifique que el reporte no tenga agente asignado y que el agente solicitante no posea otro caso activo en curso.
- **FR-004 (RF-AGE-05 - Verificación In Situ)**: El sistema DEBE permitir al agente asignado registrar el resultado de su inspección adjuntando `fotoVerificacionUrl` (< 1.2 MB) y seleccionando entre: *Es Real* (`VERIFICADO_PENDIENTE`), *Es Falso* (`RECHAZADO`) o *Es Inaccesible*.
- **FR-005 (RF-AGE-06 - Protocolo de 3 Intentos por Inaccesibilidad)**: Ante cada registro de *Es Inaccesible* con foto de aviso municipal, el sistema DEBE incrementar `intentosInaccesible` en `1`; si el contador alcanza `3`, el sistema DEBE cambiar automáticamente el estado a `CERRADO_INACCESIBLE` y liberar al agente.
- **FR-006 (RF-AGE-07 y RF-ADM-06 - Liberación y Desasignación Inteligente)**: El sistema DEBE permitir tanto al agente asignado como al Administrador desvincular al agente (`agenteId = null`), retornando el caso a `APROBADO` si aún no fue validado, o manteniéndolo en `EN_SANEAMIENTO` si la veracidad y los puntos ya habían sido aprobados.
- **FR-007 (RNF-10 - Spinner en Mutaciones de BD y en Cambio de Filtros de Listas)**:
  - Toda acción que envíe una solicitud de escritura a la Base de Datos (Triaje Admin, Tomar Caso, Verificar In Situ y Liberar/Desasignar Caso) DEBE mostrar inmediatamente un modal bloqueante con spinner (`TransactionLoaderModal`) que impida dobles pulsaciones hasta recibir el estado de la transacción: si es positiva, actualiza el estado local, cambia de vista y muestra la confirmación sin demora; si es negativa, mantiene la vista actual y muestra una alerta de error invitando a reintentar.
  - Siempre que el Administrador o el Agente cambien un filtro de lista (`TODAS`, `PENDIENTE`, `APROBADO`, etc., prioridad o pestaña), el área del listado DEBE mostrar inmediatamente un spinner de carga (`ActivityIndicator`) indicando que está filtrando hasta obtener el resultado.

### Key Entities

- **Orden de Inspección / Denuncia en Campo**: Caso ambiental con prioridad asignada, agente responsable (`agenteId`), fotografía de verificación (`fotoVerificacionUrl`), contador de intentos de acceso (`intentosInaccesible` de 0 a 3) y observaciones de auditoría (`observacionesAdmin`).
- **Agente de Campo (`User` con rol `AGENT`)**: Inspector municipal con estado de disponibilidad (`disponible`) y restricción operativa de máximo 1 caso activo en simultáneo.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Ante peticiones simultáneas de múltiples agentes sobre el mismo reporte, el 100% de las asignaciones resultan en un único agente asignado sin condiciones de carrera ni sobrescrituras.
- **SC-002**: Ningún agente de campo puede tener más de `1` caso en estado activo (`EN_VERIFICACION` o `EN_SANEAMIENTO`) al mismo tiempo.
- **SC-003**: El 100% de los casos que registran su 3.er intento de inaccesibilidad transicionan automáticamente a `CERRADO_INACCESIBLE` sin requerir cálculo manual del inspector.
- **SC-004**: El 100% de los casos liberados cuando ya estaban en `EN_SANEAMIENTO` conservan dicho estado y no vuelven a la etapa de verificación inicial.
- **SC-005 (RNF-10)**: El 100% de las mutaciones en BD despliegan `TransactionLoaderModal` en `< 50ms` bloqueando botones repetidos y resolviendo la transición de pantalla + cartel de confirmación o error inmediatamente al finalizar la transacción.

## Assumptions

- Los agentes de campo utilizan sus propios dispositivos móviles con cámara habilitada para documentar las actas y stickers de aviso en puerta.
- Cuando un caso en `intentosInaccesible` (intento 1 o 2) se libera o queda en espera de segunda/tercera visita, conserva intacto su historial de intentos acumulados.
