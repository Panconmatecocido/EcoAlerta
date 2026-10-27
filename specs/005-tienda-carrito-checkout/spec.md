# Feature Specification: ABM de Catálogo, Tienda Ecológica, Carrito Reactivo y Checkout con Reserva de Stock por 5 Minutos

**Feature Branch**: `005-tienda-carrito-checkout`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "ABM de catalogo tienda ecologica carrito reactivo y checkout con reserva temporal de stock por 5 minutos"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Catálogo Ecológico, Detalle y Carrito Reactivo Persistente (Priority: P1)

El vecino navega la Tienda Ecológica del municipio visualizando únicamente los productos activos (`activo = true`) con su stock disponible y costo en puntos, pudiendo filtrar por categoría o buscar por nombre. Al agregar productos al carrito o modificar sus cantidades (`+` / `-`), el total de puntos se recalcula en vivo (`TotalPuntos = Sumatoria(Cantidad * CostoUnitario)`). Si una cantidad baja a `0`, el ítem se elimina automáticamente. El carrito se conserva aunque el vecino cierre y vuelva a abrir la aplicación.

**Why this priority**: Permite al vecino transformar sus puntos ganados por denuncias reales en recompensas tangibles sustentables con retroalimentación matemática inmediata.

**Independent Test**: Se puede probar agregando distintos productos (Gorra 120 pts, Botella 80 pts, Bolsa 50 pts), incrementando y decrementando cantidades hasta 0, reiniciando la app para comprobar la persistencia del carrito y verificando el cálculo exacto del total de puntos.

**Acceptance Scenarios**:

1. **Given** un ciudadano en la pantalla de Tienda Ecológica, **When** busca o filtra productos, **Then** visualiza únicamente los productos activos (`activo = true`) del municipio con su imagen, título, stock disponible y valor en puntos.
2. **Given** un ciudadano con productos en su carrito, **When** incrementa o disminuye la cantidad de un ítem, **Then** el subtotal y total de puntos se actualizan instantáneamente siguiendo la fórmula `Sumatoria(Cantidad * CostoUnitario)`, y si la cantidad llega a `0`, el producto se remueve del carrito.
3. **Given** un ciudadano cuyo saldo de puntos es menor al total del carrito (`PuntosUsuario < TotalPuntosCarrito`), **When** visualiza el resumen del carrito o intenta avanzar al canje, **Then** el sistema deshabilita la confirmación y muestra claramente el aviso *"Puntos insuficientes"*.

---

### User Story 2 - Checkout con Reserva Temporal de Stock por 5 Minutos (TTL) y Selección de Sucursal (Priority: P1)

Cuando un vecino con puntos suficientes inicia el proceso de Checkout, el sistema verifica el costo en puntos vigente y aplica un **bloqueo/reserva temporal de stock por 5 minutos (TTL)** (`bloqueadoHasta`). Durante esos 5 minutos, esas unidades quedan reservadas para el vecino (evitando sobreventa si otro usuario intenta llevarse el último *Termo Sustentable* con `stock = 1`). El vecino elige la **Sucursal Municipal de retiro** (con aviso de disponibilidad a partir de las **48 hs hábiles**) y confirma el canje: el sistema descuenta atómicamente sus puntos, consolida la baja de stock, vacía el carrito y emite el comprobante con código único (`codigoRetiro`, ej. `ECO-7894-K`). Si pasan los 5 minutos sin confirmar o el vecino cancela, la reserva expira y el stock vuelve a estar disponible para todos.

**Why this priority**: Evita condiciones de carrera y sobreventa de inventario físico municipal cuando múltiples vecinos compiten por productos de stock limitado.

**Independent Test**: Se puede probar iniciando el checkout del *Termo Sustentable* (`stock = 1`) con el Vecino 1, comprobando que el Vecino 2 lo ve agotado/reservado durante los 5 minutos, verificando con temporizadores simulados que tras 5 minutos sin confirmar el stock se libera automáticamente, y finalmente confirmando el canje para obtener el `codigoRetiro`.

**Acceptance Scenarios**:

1. **Given** un producto con `stock = 1` (ej. Termo Sustentable de 500 pts) y dos vecinos con puntos suficientes, **When** el Vecino 1 inicia el Checkout, **Then** el sistema reserva esa unidad por 5 minutos (`bloqueadoHasta = ahora + 5 min`) e impide que el Vecino 2 pueda reservarla mientras el bloqueo esté vigente.
2. **Given** una reserva temporal activa en Checkout, **When** transcurren más de 5 minutos sin confirmar el canje (o el vecino cancela el Checkout), **Then** el sistema libera automáticamente las unidades reservadas devolviéndolas al stock disponible general sin descontar puntos al vecino.
3. **Given** un vecino dentro de la ventana válida de 5 minutos en Checkout que ha seleccionado una Sucursal Municipal activa, **When** pulsa "Confirmar Canje", **Then** el sistema revalida los precios actuales, descuenta atómicamente `TotalPuntos` del saldo del vecino, confirma el descuento de stock, vacía el carrito y muestra el comprobante con `codigoRetiro` único (`ECO-XXXX-X`), aviso de retiro a partir de **48 hs hábiles** y fecha de vencimiento a **30 días corridos**.

---

### User Story 3 - ABM de Catálogo con Baja Lógica por el Administrador (Priority: P2)

El Administrador Municipal gestiona el inventario de premios ecológicos pudiendo dar de alta nuevos productos, editar su título, descripción, stock físico o costo en puntos, y aplicar **baja lógica** (`activo = false`) sobre productos discontinuados para retirarlos de la tienda sin romper ni alterar el historial de canjes previos de los vecinos.

**Why this priority**: Permite al municipio administrar el stock y renovar los insumos ecológicos manteniendo la integridad referencial de todos los comprobantes históricos.

**Independent Test**: Se puede probar desde el perfil Administrador creando un nuevo producto, editando el costo en puntos de uno existente y desactivando otro (`activo = false`), comprobando que desaparece del catálogo ciudadano pero sigue visible en los canjes históricos.

**Acceptance Scenarios**:

1. **Given** un Administrador en el panel de gestión de catálogo, **When** crea un producto nuevo o edita el stock/puntos de uno existente, **Then** los cambios se reflejan inmediatamente en la tienda del municipio.
2. **Given** un producto que posee canjes históricos asociados, **When** el Administrador lo da de baja, **Then** el sistema marca `activo = false` (baja lógica), ocultándolo de la grilla de compra ciudadana pero conservando intactos los registros en el historial de canjes.
3. **Given** un vecino que tenía un producto en su carrito local, **When** el Administrador actualiza el costo en puntos de ese producto antes de que el vecino inicie el Checkout, **Then** el sistema revalida el precio contra el catálogo central al entrar al Checkout e informa el valor actualizado antes de descontar puntos.

---

### Edge Cases

- **Usuario con rol `AGENT` intentando canjear**: Por regla constitucional, los Agentes de Campo no tienen acceso a la tienda ni pueden canjear productos con su cuenta operativa.
- **Usuario Invitado (No Logueado) en la Tienda Ecológica**: El invitado puede ver todos los productos, buscar y filtrar por categoría, pero cuando intenta pulsar *"Agregar al Carrito"* o *"Ver Historial"*, el sistema intercepta la acción y le pide que se registre o inicie sesión.
- **Intento de agregar al carrito más unidades que el stock físico disponible**: El sistema limita la cantidad máxima por ítem al stock disponible real del producto.
- **Eliminación de modalidades de pago en moneda o envío a domicilio**: Todo canje se realiza exclusivamente en Puntos Ecológicos (`100% puntos`) y con retiro presencial en una Sucursal Municipal seleccionada (sin cobro de envío en ARS).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-TIE-01 y RNF-08 - ABM de Catálogo con Baja Lógica)**: El sistema DEBE permitir al Administrador crear, editar (título, descripción, `costoPuntos`, `stock`, `imagenUrl`) y desactivar lógicamente (`activo = false`) productos del catálogo municipal sin eliminar registros físicos.
- **FR-002 (RF-TIE-02 y RF-AUT-07 - Catálogo Activo Visible para Vecinos e Invitados)**: El sistema DEBE listar tanto a los ciudadanos autenticados como a los visitantes invitados únicamente los productos con `activo = true` pertenecientes al municipio, permitiendo búsqueda por texto y filtrado por categoría.
- **FR-003 (RF-TIE-03 - Carrito Reactivo y Persistente)**: El sistema DEBE calcular en tiempo real `TotalPuntos = Sumatoria(Cantidad * CostoUnitario)`, eliminar automáticamente cualquier ítem cuya cantidad llegue a `0`, y persistir el estado del carrito en el almacenamiento local del dispositivo.
- **FR-004 (RF-TIE-03 - Revalidación de Precios en Checkout)**: Al iniciar el Checkout, el sistema DEBE contrastar los costos en puntos del carrito con los valores vigentes en la base de datos para evitar desfases si el Administrador modificó algún precio.
- **FR-005 (RF-TIE-04 - Validación de Saldo Suficiente)**: El sistema DEBE validar `PuntosUsuario >= TotalPuntosCarrito`; en caso de saldo insuficiente, DEBE bloquear el avance o confirmación mostrando el mensaje *"Puntos insuficientes"*.
- **FR-006 (RF-TIE-04 y RNF-03 - Reserva Temporal de Stock por 5 Minutos TTL)**: Al iniciar el Checkout, el sistema DEBE reservar atómicamente el stock de los ítems por un período de `5 minutos` (`estado = RESERVADO_PENDIENTE`, `bloqueadoHasta = ahora + 5 min`), liberando automáticamente el stock si la reserva vence sin confirmarse o es cancelada.
- **FR-007 (RF-TIE-05 - Selección de Sucursal y Confirmación Atómica)**: El sistema DEBE exigir la selección de una `Sucursal` municipal de retiro (informando disponibilidad a partir de **48 hs hábiles**) y, al confirmar dentro de los 5 minutos, ejecutar una transacción atómica que descuente los puntos al vecino, descuente el stock definitivo, pase el canje a `PENDIENTE_RETIRO`, asigne `fechaExpiracion` (+30 días), genere un `codigoRetiro` único (`ECO-XXXX-X`) y vacíe el carrito.
- **FR-008 (RF-AUT-08 - Bloqueo de Carrito para Usuarios Invitados)**: Si un visitante no autenticado (`user === null`) pulsa *"Agregar al Carrito"* o intenta acceder al carrito/historial desde la Tienda, el sistema DEBE impedir la acción y solicitarle que se registre o inicie sesión.
- **FR-009 (RNF-10 - Spinner en Mutaciones de BD y en Filtros de Catálogo)**: Toda acción de escritura en la Base de Datos (ABM de productos Admin, iniciar reserva TTL de 5 minutos en Checkout, confirmar canje definitivo o cancelar reserva) DEBE mostrar inmediatamente un spinner bloqueante (`TransactionLoaderModal`) que impida volver a presionar los botones hasta recibir el estado de la transacción (positiva: continúa el flujo; negativa: mantiene vista actual y muestra error para reintentar). Asimismo, siempre que el usuario cambie un filtro de categoría o búsqueda en la Tienda o en el ABM de Catálogo, DEBE mostrarse un spinner de carga hasta obtener los productos filtrados.
- **FR-010 (RF-TIE-07 - Worker de Liberación de Reservas TTL y Consultas por ID)**: El backend DEBE exponer el endpoint de mantenimiento `POST /api/canjes/liberar-vencidas` para procesar y liberar de forma masiva o periódica todas aquellas órdenes en `RESERVADO_PENDIENTE` cuyo `bloqueadoHasta` haya expirado restituyendo el stock en transacción atómica, junto con endpoints de consulta por identificador `GET /api/productos/:id` y `GET /api/canjes/:id`.

### Key Entities

- **Producto Ecológico (`Producto`)**: Insumo sustentable municipal con título, descripción, costo en puntos (`costoPuntos`), inventario disponible (`stock`), imagen y estado de vigencia (`activo`).
- **Sucursal Municipal (`Sucursal`)**: Punto físico oficial del municipio habilitado para el retiro presencial de premios (nombre, dirección, horario de atención).
- **Orden de Canje (`Canje` e `ItemCanje`)**: Transacción de cambio de puntos por productos con código único de retiro (`codigoRetiro`), total de puntos, estado (`RESERVADO_PENDIENTE`, `PENDIENTE_RETIRO`, `ENTREGADO`, `CANCELADO`), marca de bloqueo temporal (`bloqueadoHasta`), fecha de vencimiento (`fechaExpiracion`) y sucursal de retiro (`sucursalId`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las modificaciones de cantidad en el carrito actualizan el total de puntos en pantalla en menos de 100 ms y persisten localmente en menos de 300 ms.
- **SC-002**: Ante 2 o más usuarios intentando canjear simultáneamente la última unidad en stock (`stock = 1`), el 0% de las operaciones resulta en stock negativo o sobreventa gracias al bloqueo atómico de 5 minutos.
- **SC-003**: El 100% de las reservas de Checkout no confirmadas pasados los `5 minutos` liberan su stock de forma verificable (tanto en ejecución real como mediante pruebas automatizadas con temporizadores simulados).
- **SC-004**: El 100% de los canjes confirmados descuentan exactamente el total de puntos, emiten un `codigoRetiro` único y fijan su vencimiento a 30 días corridos en una sola operación indivisible.

## Assumptions

- El municipio dispone de al menos una sucursal de retiro activa cargada en el padrón (ej. *"Palacio Municipal de Pilar"* y *"Delegación Presidente Derqui"*).
- Los productos entregados son retirados presencialmente por el vecino presentando su `codigoRetiro` a partir de las 48 horas hábiles de confirmado el canje.
