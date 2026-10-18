# Feature Specification: Panel de Colaborador Municipal para Entrega Presencial y Expiración a los 30 Días

**Feature Branch**: `006-entrega-colaborador-expiracion`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Panel de colaborador municipal para validacion de codigoRetiro entrega presencial y expiracion a los 30 dias"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Búsqueda por Código de Retiro y Confirmación de Entrega Presencial (Priority: P1)

Un vecino se presenta en el mostrador de la Sucursal Municipal con su comprobante de canje (`codigoRetiro`, ej. `ECO-7894-K`). El Colaborador Municipal (`COLLABORATOR`) ingresa el código en su panel operativo, visualiza los datos del vecino, la sucursal de retiro, la vigencia de la orden y el detalle exacto de los productos y cantidades a entregar. Tras entregar los premios en mano, pulsa "Confirmar Entrega Presencial", cambiando el estado del canje a `ENTREGADO` con marca de fecha y hora (`fechaEntrega`).

**Why this priority**: Cierra el ciclo de valor presencial en el municipio asegurando que cada premio se entregue una única vez al vecino correspondiente.

**Independent Test**: Se puede probar iniciando sesión con el rol `COLLABORATOR`, buscando el código de prueba `ECO-7894-K`, verificando el desglose de productos en pantalla, pulsando "Confirmar Entrega" y comprobando que el estado pasa a `ENTREGADO` y el botón de entrega se deshabilita para evitar doble retiro.

**Acceptance Scenarios**:

1. **Given** un Colaborador Municipal autenticado en su panel de entregas y una orden vigente en estado `PENDIENTE_RETIRO` (ej. `ECO-7894-K`), **When** ingresa el código en el buscador, **Then** el sistema muestra el nombre y correo del vecino, la sucursal seleccionada, la fecha de vencimiento y la lista de productos con sus cantidades exactas.
2. **Given** una orden vigente en estado `PENDIENTE_RETIRO` mostrada en pantalla, **When** el Colaborador entrega los productos y pulsa "Confirmar Entrega Presencial", **Then** el sistema actualiza el estado del canje a `ENTREGADO`, registra `fechaEntrega` y muestra el comprobante como completado.
3. **Given** un código de retiro que ya figura en estado `ENTREGADO` o un código inexistente, **When** el Colaborador lo busca en el panel, **Then** el sistema informa claramente que el pedido ya fue retirado previamente (mostrando la fecha de entrega) o que el código no existe, bloqueando cualquier nueva entrega.

---

### User Story 2 - Expiración Automática a los 30 Días Corridos con Devolución de Stock sin Reembolso de Puntos (Priority: P1)

Si un ciudadano confirma un canje pero no se presenta a retirarlo en la sucursal municipal pasados **30 días corridos** (`fechaExpiracion` vencida), la orden pasa a estado `CANCELADO` (expirado por falta de retiro). En ese acto, las unidades físicas de los productos reservados **vuelven a sumarse al stock disponible del inventario municipal**, pero **no se reembolsan los puntos** a la cuenta del ciudadano.

**Why this priority**: Evita que el inventario físico municipal quede inmovilizado indefinidamente en los depósitos por pedidos olvidados y desalienta reservas especulativas.

**Independent Test**: Se puede probar consultando o procesando la orden semilla vencida (> 30 días desde su creación), comprobando que su estado es `CANCELADO` (expirado), que el stock de sus productos se incrementó de vuelta en el inventario, que el saldo de puntos del vecino no recibió reembolso y que el Colaborador no puede entregarla.

**Acceptance Scenarios**:

1. **Given** una orden de canje en `PENDIENTE_RETIRO` cuya `fechaExpiracion` (30 días corridos desde su creación) ya ha sido superada, **When** el sistema evalúa las órdenes vencidas o el Colaborador consulta dicho código, **Then** la orden pasa atómicamente a estado `CANCELADO` (vencido), el stock de cada ítem del pedido se suma nuevamente al inventario de productos del municipio y el saldo de puntos del vecino permanece sin reembolso.
2. **Given** una orden expirada (> 30 días) buscada en el mostrador por el Colaborador Municipal, **When** se visualiza el detalle del código, **Then** el sistema muestra una alerta indicando *"Canje Expirado (superó los 30 días de retiro)"* y mantiene bloqueado el botón de entrega.

---

### User Story 3 - Consulta de Historial de Canjes y Códigos de Retiro por el Ciudadano (Priority: P2)

El vecino consulta desde la pestaña "Canjes" en su Perfil (o desde el enlace "Ver Historial" en la Tienda) todas sus órdenes realizadas, visualizando claramente el `codigoRetiro` para presentar en ventanilla, la sucursal de retiro, el aviso de disponibilidad a partir de 48 hs hábiles y el estado actual (`PENDIENTE_RETIRO`, `ENTREGADO` o `CANCELADO` / Expirado).

**Why this priority**: Permite al vecino tener siempre a mano su código alfanumérico cuando asiste presencialmente a la sede municipal.

**Independent Test**: Se puede probar entrando al Perfil del vecino y verificando en la pestaña "Canjes" que cada orden muestre su código alfanumérico, fecha, puntos utilizados, sucursal y estado actualizado.

**Acceptance Scenarios**:

1. **Given** un ciudadano que ha confirmado al menos un canje, **When** ingresa a la sección "Canjes" en su Perfil, **Then** visualiza la tarjeta de cada orden con su `codigoRetiro` destacado, productos incluidos, sucursal de retiro y estado actual.

---

### Edge Cases

- **Búsqueda de código con minúsculas o espacios (`eco-7894-k `)**: El buscador normaliza automáticamente la entrada convirtiéndola a mayúsculas y recortando espacios laterales antes de consultar.
- **Idempotencia en la devolución de stock por expiración**: Una orden que expira a los 30 días devuelve su stock físico al inventario municipal **una única vez** al transicionar de `PENDIENTE_RETIRO` a `CANCELADO`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-COL-01 - Panel de Búsqueda por Código de Retiro)**: El sistema DEBE proveer al rol Colaborador Municipal (`COLLABORATOR`) y al Administrador un buscador por `codigoRetiro` insensible a mayúsculas/minúsculas que recupere el detalle completo de la orden, datos del vecino, sucursal y lista de ítems (`ItemCanje`).
- **FR-002 (RF-COL-01 - Validación y Confirmación de Entrega)**: El sistema DEBE permitir marcar como `ENTREGADO` únicamente órdenes que se encuentren en estado `PENDIENTE_RETIRO` y cuya `fechaExpiracion` no haya vencido, registrando la marca de tiempo `fechaEntrega`.
- **FR-003 (RF-TIE-06 y RNF-03 - Expiración a los 30 Días Corridos)**: Para toda orden en `PENDIENTE_RETIRO` que supere los `30 días corridos` (`ahora > fechaExpiracion`), el sistema DEBE ejecutar una transacción atómica que: (a) cambie el estado del canje a `CANCELADO`, (b) incremente el `stock` de cada `Producto` según las cantidades de `ItemCanje`, y (c) mantenga sin cambios (`0 puntos reembolsados`) el saldo del ciudadano.
- **FR-004 (RF-TIE-05 y 06 - Historial de Canjes del Ciudadano)**: El sistema DEBE mostrar al ciudadano en su perfil el listado de sus canjes reales con su `codigoRetiro`, sucursal, puntos utilizados, fecha y estado actualizado.
- **FR-005 (RNF-10 - Spinner en Mutaciones de BD y en Búsqueda/Filtros de Canjes)**: Al confirmar la entrega presencial de un canje (`PATCH /api/canjes/:id/entregar`) en la Base de Datos, el sistema DEBE desplegar inmediatamente un spinner bloqueante (`TransactionLoaderModal`) impidiendo volver a presionar el botón hasta recibir el resultado de la transacción (positiva: actualiza a `ENTREGADO` y confirma; negativa: mantiene vista actual y muestra error solicitando reintentar). Asimismo, al buscar por `codigoRetiro` o cambiar filtros/pestañas de historial de canjes, DEBE mostrarse un spinner de carga hasta obtener el resultado.

### Key Entities

- **Comprobante de Retiro (`Canje`)**: Orden identificada por `codigoRetiro` único (`ECO-7894-K`), vinculada al ciudadano, a la sucursal municipal y a sus renglones (`ItemCanje`), con control de vigencia (`fechaExpiracion` a 30 días) y auditoría de entrega (`fechaEntrega`).
- **Colaborador Municipal (`User` con rol `COLLABORATOR`)**: Operador de ventanilla municipal con acceso exclusivo al panel de verificación y entrega de premios ecológicos.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un Colaborador Municipal puede buscar un `codigoRetiro`, verificar la identidad y los productos y registrar la entrega en menos de 20 segundos.
- **SC-002**: El 100% de los intentos de entregar por segunda vez un código ya `ENTREGADO` o un código `CANCELADO` (expirado) son bloqueados por el sistema.
- **SC-003**: El 100% de los canjes que superan los 30 días sin retiro restituyen la totalidad de sus unidades físicas al stock del catálogo municipal y retienen el 100% de los puntos utilizados (0% de reembolso de puntos).

## Assumptions

- El vecino presenta su documento o pantalla de la aplicación con el `codigoRetiro` en la sucursal municipal elegida a partir de las 48 horas hábiles de realizado el canje.
- La evaluación de vencimiento de 30 días se verifica de forma automática al consultar los canjes o buscar un código de retiro, asegurando que ninguna orden vencida pueda ser entregada aunque no haya corrido un proceso programado externo.
