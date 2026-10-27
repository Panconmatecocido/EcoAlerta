# Feature Specification: Validación de Veracidad con Acreditación de Puntos, Saneamiento por Agente y Certificación Antes vs. Después

**Feature Branch**: `004-saneamiento-y-certificacion`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Validacion de veracidad con acreditacion de puntos saneamiento por agente y certificacion Antes vs Despues por admin"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Validación de Veracidad y Acreditación Atómica de Puntos al Vecino por el Admin (Priority: P1)

El Administrador Municipal revisa los casos en los que el Agente de Campo ya constató en el lugar que el problema ambiental es real (`VERIFICADO_PENDIENTE` con su `fotoVerificacionUrl`). Al aprobar la veracidad, el Administrador selecciona la cantidad de puntos a otorgar al vecino dentro del baremo oficial según la prioridad del caso (`BAJA: 50-80 pts`, `MEDIA: 100-150 pts`, `ALTA: 200-300 pts`, `URGENTE: 350-500 pts`). El sistema acredita atómicamente los puntos en la cuenta del vecino, registra `puntosOtorgados` y avanza el caso a la etapa de `EN_SANEAMIENTO`.

**Why this priority**: Es el corazón del sistema de incentivos de Eco Alerta: garantiza que el vecino reciba sus puntos exactamente cuando se comprueba en terreno que su alerta era real, sin esperar a que termine la obra pesada de limpieza.

**Independent Test**: Se puede probar desde el panel del Administrador abriendo un reporte en `VERIFICADO_PENDIENTE`, aprobando su veracidad con un monto dentro del baremo (ej. 120 puntos para prioridad Media) y comprobando que el saldo del vecino aumenta inmediatamente en 120 puntos y el reporte pasa a `EN_SANEAMIENTO`.

**Acceptance Scenarios**:

1. **Given** un reporte en estado `VERIFICADO_PENDIENTE` con evidencia fotográfica del agente, **When** el Administrador aprueba la veracidad seleccionando un puntaje válido dentro del rango de su prioridad (`BAJA: 50-80`, `MEDIA: 100-150`, `ALTA: 200-300`, `URGENTE: 350-500`), **Then** el sistema suma atómicamente esos puntos al saldo del ciudadano autor, guarda el monto en `puntosOtorgados`, registra `fechaVerificacion` y cambia el estado del reporte a `EN_SANEAMIENTO`.
2. **Given** un Administrador validando un reporte en `VERIFICADO_PENDIENTE`, **When** intenta asignar una cantidad de puntos fuera del baremo correspondiente a la prioridad del caso, **Then** el sistema restringe la selección al rango permitido para mantener la equidad de la economía de puntos.
3. **Given** un reporte cuyos puntos ya fueron acreditados al pasar a `EN_SANEAMIENTO`, **When** el caso sufre reasignaciones posteriores entre agentes o rechazos de limpieza, **Then** el sistema garantiza que los puntos NO se vuelvan a acreditar por duplicado ni se descuenten al vecino.

---

### User Story 2 - Ejecución de Saneamiento y Cierre Técnico por el Agente de Campo (Priority: P1)

Una vez que la cuadrilla o el Agente de Campo erradica el microbasural o descacharriza el foco de dengue sobre un caso en `EN_SANEAMIENTO`, el agente captura obligatoriamente la fotografía del estado limpio posterior ("Después", `fotoSolucionUrl` comprimida a `< 1.2 MB`) y redacta el informe técnico de lo actuado (`informeSolucion`). Al enviarlo, el caso pasa a `RESUELTO_TECNICO` para auditoría del Administrador y el agente queda inmediatamente libre para tomar un nuevo caso de la bolsa.

**Why this priority**: Documenta con evidencia fehaciente e informe escrito la resolución física del problema ambiental en la vía pública y libera la capacidad operativa del inspector.

**Independent Test**: Se puede probar con un Agente de Campo que tiene asignado un caso en `EN_SANEAMIENTO`, adjuntando la foto del "Después" y el texto del informe técnico, enviándolo y verificando que el estado pasa a `RESUELTO_TECNICO` y el agente queda disponible para tomar otro caso.

**Acceptance Scenarios**:

1. **Given** un Agente de Campo con un caso asignado en estado `EN_SANEAMIENTO`, **When** adjunta la fotografía obligatoria de limpieza (`fotoSolucionUrl`) y completa el `informeSolucion`, **Then** el sistema comprime la foto a menos de 1.2 MB, actualiza el estado a `RESUELTO_TECNICO` y libera al agente para que pueda tomar otro caso.
2. **Given** un Agente de Campo intentando cerrar técnicamente un caso en `EN_SANEAMIENTO`, **When** omite la fotografía del "Después" o deja vacío el informe técnico, **Then** el sistema bloquea el envío e indica que ambos elementos son obligatorios para certificar la limpieza.

---

### User Story 3 - Doble Validación y Certificación Comparativa ("Antes vs. Después") por el Admin (Priority: P1)

El Administrador Municipal accede a la bandeja de casos en `RESUELTO_TECNICO` y visualiza una pantalla comparativa lado a lado: la **Foto Inicial "Antes"** (`imagenUrl` / `fotoVerificacionUrl`) frente a la **Foto Final "Después"** (`fotoSolucionUrl`), junto con el informe técnico del agente.
- Si el Administrador observa que la limpieza fue parcial o deficiente, pulsa *"Observar / Rechazar Saneamiento"* ingresando notas técnicas obligatorias (`observacionesAdmin`), devolviendo el caso a estado `EN_SANEAMIENTO` para que sea repasado.
- Si la limpieza es satisfactoria, pulsa *"Certificar y Cerrar Caso"*, pasando el reporte a `RESUELTO` (`CERRADO_DEFINITIVO`) y registrando la `fechaResolucion`.

**Why this priority**: Asegura un control de calidad municipal de doble firma antes de dar por erradicado un foco infeccioso o basural ante el vecino.

**Independent Test**: Se puede probar como Administrador abriendo el comparador Antes/Después de un caso en `RESUELTO_TECNICO`: primero observándolo para comprobar que regresa a `EN_SANEAMIENTO` con las notas técnicas, y luego aprobándolo para comprobar que queda en estado final `RESUELTO`.

**Acceptance Scenarios**:

1. **Given** un reporte en estado `RESUELTO_TECNICO`, **When** el Administrador abre el detalle de certificación, **Then** visualiza en pantalla comparativa la fotografía del "Antes", la fotografía del "Después" y el informe técnico redactado por el agente.
2. **Given** un Administrador revisando la comparativa Antes/Después, **When** aprueba la calidad de la limpieza y pulsa "Certificar Cierre Definitivo", **Then** el caso cambia a estado `RESUELTO`, registra `fechaResolucion` y queda visible como resuelto en el panel del vecino.
3. **Given** un Administrador que detecta residuos restantes en la foto del "Después", **When** pulsa "Observar / Rechazar Saneamiento", escribe las observaciones técnicas y confirma, **Then** el caso regresa a estado `EN_SANEAMIENTO` conservando las observaciones para que sea intervenido nuevamente.

---

### Edge Cases

- **Fallo de red o corte durante la acreditación de puntos**: La actualización del estado a `EN_SANEAMIENTO` y la suma de puntos al ciudadano se ejecutan como una única transacción indivisible; si falla un paso, se revierte el otro para evitar inconsistencias.
- **Rechazo de saneamiento cuando el agente original ya tomó otro caso**: Si el Administrador rechaza el saneamiento (`RESUELTO_TECNICO` -> `EN_SANEAMIENTO`) y el agente original ya se encuentra ocupado con otro caso o fuera de turno, el caso vuelve a la bolsa en estado `EN_SANEAMIENTO` (`agenteId = null`) para que cualquier agente disponible lo tome y repase la limpieza.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-ADM-04 y 05 - Validación de Veracidad y Baremo de Puntos)**: El sistema DEBE permitir al Administrador validar reportes en `VERIFICADO_PENDIENTE` asignando puntos al vecino según la escala oficial por prioridad:
  - `BAJA`: `50 a 80 puntos`
  - `MEDIA`: `100 a 150 puntos`
  - `ALTA`: `200 a 300 puntos`
  - `URGENTE`: `350 a 500 puntos`
- **FR-002 (RNF-03 y 04 - Transacción Atómica de Puntos e Idempotencia)**: El sistema DEBE acreditar los puntos al ciudadano e incrementar su saldo dentro de una única transacción atómica junto con el cambio de estado a `EN_SANEAMIENTO`, impidiendo que un mismo reporte acredite puntos más de una vez.
- **FR-003 (RF-AGE-08 - Saneamiento y Cierre Técnico)**: El sistema DEBE exigir al Agente de Campo adjuntar la fotografía final (`fotoSolucionUrl` comprimida a `< 1.2 MB`) y redactar el `informeSolucion` para pasar un caso de `EN_SANEAMIENTO` a `RESUELTO_TECNICO`, liberando inmediatamente la disponibilidad operativa del agente.
- **FR-004 (RF-ADM-07 - Vista Comparativa Antes vs. Después)**: El sistema DEBE presentar al Administrador una interfaz comparativa que contraste visualmente la evidencia inicial ("Antes") con la evidencia de solución ("Después") y el informe técnico del inspector.
- **FR-005 (RF-ADM-08 - Certificación Final u Observación de Saneamiento)**: El sistema DEBE permitir al Administrador: (a) certificar definitivamente el arreglo pasando el caso a `RESUELTO` con marca de tiempo `fechaResolucion`, o (b) observar/rechazar el saneamiento con notas obligatorias en `observacionesAdmin`, regresando el caso a `EN_SANEAMIENTO`.
- **FR-006 (RNF-10 - Spinner en Mutaciones de BD y en Filtros de Listas)**: Toda acción que escriba en la Base de Datos (Validar Veracidad y Acreditar Puntos, Enviar Cierre Técnico de Saneamiento, Certificar u Observar Saneamiento) DEBE desplegar inmediatamente un spinner bloqueante (`TransactionLoaderModal`) impidiendo pulsaciones repetidas hasta conocer el estado de la transacción (positiva: actualiza estado local, avanza y confirma; negativa: conserva formulario/vista y pide reintentar). Asimismo, al cambiar cualquier filtro de estado en el listado de denuncias (`VERIFICADO_PENDIENTE`, `EN_SANEAMIENTO`, `RESUELTO_TECNICO`, `RESUELTO`), DEBE mostrarse un spinner de carga hasta obtener los resultados filtrados.

### Key Entities

- **Acreditación por Veracidad (`Denuncia.puntosOtorgados` + `User.puntos`)**: Reconocimiento en puntos ecológicos transferido atómicamente al ciudadano cuando el Administrador valida la constatación presencial del agente.
- **Expediente de Saneamiento (`fotoSolucionUrl`, `informeSolucion`, `fechaResolucion`)**: Conjunto de evidencias técnicas del "Después" que respaldan el cierre definitivo de la alerta ambiental.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las validaciones de veracidad acreditan los puntos al vecino y actualizan el estado a `EN_SANEAMIENTO` en una sola operación atómica en menos de 600 ms.
- **SC-002**: El 0% de los reportes puede otorgar puntos por duplicado ante reintentos de red, liberaciones de agente o rechazos posteriores de limpieza.
- **SC-003**: El 100% de los cierres técnicos (`RESUELTO_TECNICO`) cuentan obligatoriamente con fotografía del "Después" (`< 1.2 MB`) e informe técnico completo.
- **SC-004**: El Administrador puede comparar las fotografías Antes vs. Después y emitir su dictamen (Certificar u Observar) en menos de 30 segundos por caso.

## Assumptions

- Los puntos otorgados al vecino en la etapa 5 (`VERIFICADO_PENDIENTE` -> `EN_SANEAMIENTO`) son definitivos por haber reportado un hecho real constatado en terreno, independientemente de cuánto demore luego la cuadrilla municipal en completar el saneamiento físico.
