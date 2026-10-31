# Feature Specification: Onboarding, categorías y baja de productos

**Feature Branch**: `008-onboarding-categorias-baja-productos`
**Status**: Implementado y verificado manualmente en Expo Go (pendientes: `tsc` y tests automatizados)
**Input**: Tarjetas de bienvenida en la primera apertura, categoría en productos del administrador, eliminación de productos con reembolso de puntos y notificación al ciudadano.

## User Scenarios & Testing

### User Story 1 - Tarjetas de bienvenida (Priority: P1)

Al abrir la app por primera vez, el usuario invitado ve un carrusel de 3 tarjetas ("Detectá y reportá", "Transformá tu entorno", "Sumá puntos y canjeá") que explica el propósito de Eco Alerta.

**Acceptance Scenarios**:

1. **Given** la primera apertura sin sesión, **When** inicia la app, **Then** se muestra el onboarding.
2. **Given** el onboarding visible, **When** pasan 4 segundos sin interacción, **Then** avanza solo; tras una interacción manual el avance automático se detiene.
3. **Given** una tarjeta que no es la última, **When** el usuario toca "Omitir", **Then** va al Registro.
4. **Given** la última tarjeta, **Then** "Omitir" no se muestra y aparecen "Crear una cuenta" y "Ya tengo cuenta".
5. **Given** que ya vio el onboarding, **When** reabre la app, **Then** no se vuelve a mostrar.

### User Story 2 - Categoría de producto (Priority: P1)

El administrador asigna una categoría al crear o editar un producto, y el ciudadano filtra la tienda por esa categoría.

**Acceptance Scenarios**:

1. **Given** el formulario de producto, **Then** se puede elegir una categoría (Hogar, Limpieza, Cuidado Personal, Papelería, Otros); por defecto "Otros".
2. **Given** una categoría inválida enviada al servidor, **Then** responde 400.
3. **Given** la tienda, **When** se selecciona un filtro, **Then** se listan solo los productos de esa categoría.

### User Story 3 - Eliminar producto con reembolso (Priority: P1)

El administrador elimina un producto. Si hay canjes pendientes de retiro, se devuelven los puntos a cada usuario afectado.

**Acceptance Scenarios**:

1. **Given** un producto sin canjes, **When** se elimina, **Then** se borra definitivamente.
2. **Given** canjes en `PENDIENTE_RETIRO`, **When** se elimina, **Then** se reembolsa `puntos × cantidad`, se quita el ítem y, si el canje queda vacío, pasa a `CANCELADO`.
3. **Given** un producto con historial de canjes entregados o cancelados, **When** se elimina, **Then** se da de baja (`activo=false`) en vez de borrarse.
4. **Given** el botón "Eliminar", **Then** se pide confirmación que explica el reembolso.

### User Story 4 - Aviso persistente al ciudadano (Priority: P2)

El usuario reembolsado recibe una notificación con una breve explicación y disculpa, visible en su modal de notificaciones.

**Acceptance Scenarios**:

1. **Given** un reembolso, **Then** se crea una `Notificacion` para ese usuario en la misma transacción.
2. **Given** el modal de notificaciones, **When** se abre, **Then** se consultan y muestran los avisos del sistema.

### User Story 5 - Imagen de producto en Supabase Storage (Priority: P2)

El administrador adjunta una foto al crear o editar un producto. La app la sube al storage de Supabase y guarda la URL pública, que la tienda muestra.

**Acceptance Scenarios**:

1. **Given** el formulario de producto, **When** el admin toca "Adjuntar imagen" y elige una foto, **Then** se comprime, se sube y se muestra una vista previa.
2. **Given** un producto con imagen, **Then** el admin puede "Cambiar imagen" o "Quitar".
3. **Given** que se guarda el producto, **Then** `imagenUrl` contiene la URL pública del bucket y la tienda la muestra.
4. **Given** un formato distinto de JPG, PNG o WEBP, **Then** el servidor responde 400.
5. **Given** que faltan las variables de Supabase, **Then** el servidor responde un error claro de almacenamiento no configurado.

### User Story 6 - Orden de la lista de administración (Priority: P3)

La lista de productos del admin prioriza los activos con stock, luego los activos sin stock y al final los dados de baja.

### Edge Cases

- Falla la lectura del flag de onboarding: se asume "visto" para no bloquear el ingreso.
- Canjes `RESERVADO_PENDIENTE`: no se reembolsa porque aún no se descontaron puntos.
- Si algún paso de la baja falla, la transacción se revierte completa.

## Requirements

### Functional Requirements

- **FR-001**: El onboarding se muestra solo a invitados que no lo vieron.
- **FR-002**: El carrusel es deslizable con paginación y avance automático cada 4 s.
- **FR-003**: Indicadores de página donde el activo cambia de ancho y color.
- **FR-004**: "Omitir" visible salvo en la última tarjeta.
- **FR-005**: Botones finales "Crear una cuenta" y "Ya tengo cuenta".
- **FR-006**: El flag `vistoOnboarding` se guarda en AsyncStorage.
- **FR-007**: Los estilos usan exclusivamente `COLORS` del tema.
- **FR-008**: El producto tiene un campo `categoria`.
- **FR-009**: El formulario de admin ofrece selector de categoría.
- **FR-010**: El servidor valida la categoría al crear y actualizar.
- **FR-011**: La tienda filtra por la categoría real.
- **FR-012**: El admin dispone de un botón "Eliminar" con confirmación.
- **FR-013**: `DELETE /api/productos/:id/permanente` elimina o da de baja el producto.
- **FR-014**: Se reembolsa a los canjes `PENDIENTE_RETIRO` que incluyan el producto.
- **FR-015**: Los canjes que queden sin ítems pasan a `CANCELADO`.
- **FR-016**: Toda la baja ocurre en una única transacción.
- **FR-017**: Se crea una `Notificacion` por usuario reembolsado.
- **FR-018**: `GET /api/notificaciones` devuelve los avisos del usuario.
- **FR-019**: El modal de notificaciones muestra los avisos.
- **FR-020**: `deleteProduct` devuelve `{eliminado, mensaje}`.
- **FR-021**: Los repositorios local y remoto implementan `deleteProduct` y `categoria`.
- **FR-022**: El formulario de producto permite adjuntar, cambiar y quitar la imagen, con vista previa.
- **FR-023**: El cliente comprime la imagen (menos de 1,2 MB) antes de subirla.
- **FR-024**: `POST /api/productos/imagen` recibe `{ imagen }` (data URI) y devuelve `{ data: { url } }`.
- **FR-025**: El servidor acepta solo JPG, PNG y WEBP y los sube al bucket de Supabase Storage configurado.
- **FR-026**: La configuración usa `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` y `SUPABASE_STORAGE_BUCKET` (por defecto `productos`).
- **FR-027**: La lista de admin ordena: activos con stock, activos sin stock, dados de baja.

### Key Entities

- **Producto**: incluye `categoria` y `activo`.
- **Notificacion**: usuario, mensaje, `leida`, fecha.
- **Canje / ItemCanje**: se reembolsan o cancelan en la baja.

## Success Criteria

- **SC-001**: Un usuario nuevo ve el onboarding una sola vez.
- **SC-002**: Todo producto tiene una categoría válida.
- **SC-003**: Tras eliminar un producto, los puntos de los canjes pendientes quedan devueltos exactamente.
- **SC-004**: Cada usuario reembolsado recibe su aviso.
- **SC-005**: Un fallo en la baja no deja datos a medias.

## Assumptions

- El reembolso por baja de producto es una excepción al Principio VI de la Constitución (los canjes vencidos a 30 días no reembolsan). No altera esa regla.
- No hay push ni contador de no leídas; el campo `leida` no se usa aún.
- Los endpoints de productos siguen sin guardas de rol, como el resto.
- Requiere migración de Prisma para la tabla `notificaciones`.
- El bucket de Storage debe existir y ser público; el servidor usa la clave `service_role`, que nunca va en el cliente.
- Las imágenes reemplazadas o quitadas no se borran del bucket.
- El endpoint de subida no tiene control de rol, igual que el resto de `/api/productos`.
