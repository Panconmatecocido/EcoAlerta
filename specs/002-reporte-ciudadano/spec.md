# Feature Specification: Creación de Reporte Ambiental por Ciudadano, Seguimiento y Soft Delete

**Feature Branch**: `002-reporte-ciudadano`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Creacion de reporte ambiental por ciudadano con camara comprimida GPS seguimiento en Home y soft delete"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Captura Fotográfica, Geolocalización y Envío de Reporte Ambiental (Priority: P1)

Un vecino detecta un problema ambiental en la vía pública (microbasural, foco de dengue, terreno baldío u otro), abre el botón central de cámara en la aplicación, captura una fotografía en tiempo real (o la selecciona de su galería), el sistema la optimiza automáticamente a menos de 1.2 MB, adjunta sus coordenadas GPS junto con una dirección manual de referencia, elige la categoría y envía el reporte. El reporte recibe un código único (`REP-2026-XXX`) y queda registrado en estado inicial `PENDIENTE` sin acreditar puntos hasta su verificación en terreno.

**Why this priority**: Es la acción nuclear de participación ciudadana que alimenta todo el sistema de gestión ambiental del municipio.

**Independent Test**: Se puede probar abriendo la pestaña central de Cámara con una cuenta ciudadana, tomando una fotografía, completando título, categoría y dirección, enviando el formulario y comprobando que aparece en el listado de denuncias con estado `PENDIENTE` y que el saldo de puntos del vecino no aumentó aún.

**Acceptance Scenarios**:

1. **Given** un ciudadano autenticado en la pantalla de reporte con permisos de cámara y ubicación concedidos, **When** captura o selecciona una fotografía, elige una categoría (*Microbasural*, *Foco de Dengue*, *Terreno Baldío*, *Otro*), ingresa título, descripción y dirección de referencia y pulsa "Enviar Reporte", **Then** el sistema comprime la imagen a menos de 1.2 MB, genera un código único correlativo (`REP-2026-XXX`), guarda el reporte en estado `PENDIENTE` con coordenadas GPS y mantiene el saldo de puntos del ciudadano sin cambios.
2. **Given** un ciudadano en la pantalla de reporte, **When** intenta enviar el reporte sin haber capturado una fotografía, sin seleccionar categoría o dejando la dirección vacía, **Then** el sistema impide el envío y señala los datos obligatorios faltantes.
3. **Given** un ciudadano que deniega el permiso de GPS automático, **When** completa manualmente el campo de dirección de referencia junto con la foto y categoría, **Then** el sistema permite registrar el reporte utilizando la referencia manual sin bloquear al vecino.

---

### User Story 2 - Seguimiento del Estado de Reportes Propios en Home y Perfil (Priority: P2)

El vecino consulta desde su pantalla de Inicio o Perfil la lista de reportes ambientales que ha enviado, visualizando en tiempo real la evolución de cada caso en todos sus estados de ciclo de vida (casos abiertos, en proceso, resueltos y desestimados), junto con los puntos acreditados una vez certificada la resolución.

**Endpoints Oficiales**:
- `GET /api/denuncias/mis-denuncias?ciudadanoId={id}`: Consulta directa de las alertas del vecino autenticado.
- `GET /api/denuncias/ciudadano/:ciudadanoId`: Consulta alternativa parametrizada por identificador de usuario.
- **Resolución Robusta**: El backend resuelve el ciudadano ya sea por su `UUID` de PostgreSQL, por encabezado `x-user-id`, o por correo electrónico del usuario.

**Taxonomía de Estados Soportados para el Vecino**:
1. **Casos Abiertos / Iniciales**:
   - `PENDIENTE`: Reporte recién recibido, a la espera del triaje del Administrador Municipal.
   - `APROBADO`: Aprobado en triaje inicial y puesto a disposición en la bolsa de casos de los agentes de campo.
2. **Casos en Proceso / Operativos**:
   - `EN_VERIFICACION` / `EN_PROCESO`: Agente de campo asignado y desplazándose in situ para inspección.
   - `VERIFICADO_PENDIENTE`: Agente completó la verificación con foto in situ, a la espera de aprobación de veracidad por el Admin.
   - `EN_SANEAMIENTO`: Veracidad validada, puntos ecológicos acreditados preventivamente al vecino y cuadrilla de limpieza trabajando en el lugar.
   - `RESUELTO_TECNICO`: Agente de campo cargó foto del "Después" e informe técnico de limpieza concluida.
3. **Casos Cerrados y Resueltos**:
   - `RESUELTO`: Certificado oficialmente por el Administrador Municipal como remediado con éxito (+puntos acreditados y visibles en el perfil).
4. **Casos Desestimados / Cerrados sin Remediación**:
   - `RECHAZADO`: Reporte desestimado en triaje con justificación obligatoria (`observacionesAdmin`) visible para el ciudadano.
   - `CERRADO_INACCESIBLE`: Reporte cerrado tras 3 visitas infructuosas de verificación por causas de inaccesibilidad geográfica o física.

**Why this priority**: Brinda total transparencia ciudadana sobre el accionar municipal y motiva la participación continua mediante retroalimentación visible y auditable.

**Independent Test**: Se puede probar iniciando sesión con un vecino que posea denuncias en distintos estados (`GET /api/denuncias/mis-denuncias`) y verificando que cada tarjeta muestre su barra y badge de estado actualizada, código, categoría, fecha, observaciones (si fue rechazado) y puntos otorgados.

**Acceptance Scenarios**:

1. **Given** un ciudadano con denuncias creadas en el municipio, **When** accede a su sección "Mis Denuncias" en Perfil o resumen en Inicio, **Then** el cliente solicita `GET /api/denuncias/mis-denuncias` y visualiza únicamente sus propios reportes no archivados (`ocultarUsuario = false`) con su estado actual e insignia de color semántica.
2. **Given** un reporte ciudadano que fue rechazado en triaje o certificado como resuelto, **When** el ciudadano consulta el detalle del reporte, **Then** puede leer las observaciones del administrador o ver los puntos acreditados por su colaboración.
3. **Given** un reporte que atraviesa etapas intermedias (`PENDIENTE` -> `APROBADO` -> `EN_VERIFICACION` -> `EN_SANEAMIENTO` -> `RESUELTO`), **When** el ciudadano refresca su perfil, **Then** la barra de seguimiento refleja el progreso dinámico de 4 etapas (Recibido, Verificación, Limpieza, Saneado).

---

### User Story 3 - Archivado / Soft Delete Visual de Reportes por el Ciudadano (Priority: P3)

Una vez que el ciudadano ya recibió los puntos por su denuncia verificada (o el caso finalizó), decide limpiar su bandeja personal pulsando "Archivar / Ocultar de mi lista". El reporte desaparece de la vista del vecino (`ocultarUsuario = true`), pero permanece intacto en el panel municipal y para los agentes de campo que continúan con el saneamiento.

**Why this priority**: Permite al vecino mantener ordenado su historial personal sin comprometer la trazabilidad legal ni interrumpir las tareas operativas del municipio.

**Independent Test**: Se puede probar pulsando la opción de ocultar/archivar sobre un reporte con puntos ya acreditados en la cuenta del vecino, verificando que desaparece de la lista del ciudadano pero sigue apareciendo en la consulta del Administrador Municipal.

**Acceptance Scenarios**:

1. **Given** un reporte ciudadano cuyos puntos ya fueron acreditados o se encuentra finalizado, **When** el vecino selecciona "Ocultar de mi panel" y confirma la acción, **Then** el reporte se marca con `ocultarUsuario = true` y deja de mostrarse en el listado del vecino.
2. **Given** un reporte ocultado por el vecino que aún se encuentra en etapa de `EN_SANEAMIENTO`, **When** el Administrador o el Agente de Campo consultan sus bandejas operativas, **Then** el reporte continúa completamente visible y operativo hasta su cierre definitivo.

---

### Edge Cases

- **Fotografías de alta resolución (> 10 MB)**: El sistema redimensiona (máximo 1080px de lado mayor) y comprime automáticamente la imagen antes de transmitirla o guardarla para garantizar que nunca supere `1.2 MB`.
- **Pérdida de conectividad al enviar un reporte**: Si el servidor central no está disponible en el momento del envío, el reporte se registra en el repositorio local del dispositivo para no perder la evidencia tomada en la calle.
- **Intento de ocultar un reporte aún en revisión inicial (`PENDIENTE`)**: El sistema informa al vecino que solo puede archivar reportes que ya hayan sido evaluados o cuyos puntos hayan sido acreditados.
- **Usuario Invitado (No Logueado) intentando reportar un foco o abrir Perfil**: Si un visitante en Modo Invitado pulsa el botón de Cámara para reportar un foco o intenta abrir la sección de Perfil/Mis Denuncias, el sistema bloquea la acción y le solicita que se registre o inicie sesión.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-REP-01 - Categorización Ambiental)**: El sistema DEBE permitir al ciudadano clasificar el reporte en una de las categorías oficiales: *Microbasural*, *Foco de Dengue*, *Terreno Baldío* u *Otro*, junto con un título y descripción breve.
- **FR-002 (RF-REP-02 y RNF-02 - Captura y Compresión Fotográfica)**: El sistema DEBE permitir capturar una fotografía con la cámara del dispositivo o seleccionarla de la galería, comprimiéndola obligatoriamente a un tamaño menor a `1.2 MB` (resolución máxima de 1080px) antes de su almacenamiento.
- **FR-003 (RF-REP-03 - Geolocalización Dual)**: El sistema DEBE capturar las coordenadas GPS (`latitud` y `longitud`) del dispositivo cuando el permiso esté activo y exigir una `direccion` manual de referencia legible.
- **FR-004 (RF-REP-04 - Código Único y Estado Inicial)**: El sistema DEBE asignar a cada nuevo reporte un código alfanumérico único (`REP-2026-XXX`), vincularlo al ciudadano autor y a su municipio, e inicializarlo en estado `PENDIENTE`.
- **FR-005 (RF-REP-05 - Regla de Puntos Diferidos)**: El sistema NO DEBE acreditar puntos ecológicos al ciudadano en el momento de crear el reporte; los puntos se mantienen en `0` para ese caso hasta que la denuncia sea verificada en terreno y aprobada por el Administrador.
- **FR-006 (RF-REP-06 - Seguimiento Ciudadano)**: El sistema DEBE mostrar al ciudadano el listado y métricas de sus propios reportes filtrando aquellos marcados como ocultos (`ocultarUsuario = false`).
- **FR-007 (RF-REP-07 y RNF-08 - Soft Delete Ciudadano)**: El sistema DEBE permitir al ciudadano ocultar visualmente de su bandeja un reporte ya validado o finalizado cambiando el indicador `ocultarUsuario = true`, conservando el registro íntegro en la base de datos municipal.
- **FR-008 (RF-AUT-08 - Restricción para Usuarios Invitados)**: El sistema DEBE verificar que el usuario tenga sesión activa antes de permitir abrir la cámara de reportes o consultar el perfil de denuncias; si es un invitado (`user === null`), DEBE solicitarle registrarse para continuar.
- **FR-009 (RNF-10 - Spinner en Mutaciones de BD y en Filtros/Pestañas de Listas)**: Al enviar un nuevo reporte ambiental o al ejecutar el ocultamiento visual (`ocultarUsuario = true`) en la Base de Datos, el sistema DEBE desplegar inmediatamente un spinner bloqueante (`TransactionLoaderModal`) que impida volver a presionar los botones hasta recibir respuesta de la transacción (positiva: continúa el flujo; negativa: mantiene vista actual y pide reintentar). Asimismo, al cambiar entre pestañas o filtros de listado en Perfil/Home, DEBE mostrarse un spinner de carga hasta recibir el resultado.
- **FR-010 (RF-REP-08 - Endpoint Unificado Mis Denuncias y Fallback Silencioso Resiliente)**: El backend DEBE exponer el endpoint autenticado `GET /api/denuncias/mis-denuncias` que retorne las denuncias activas no ocultadas (`ocultarUsuario: false`) del usuario autenticado, y el repositorio de reportes del cliente DEBE implementar un fallback silencioso y resiliente que ante cortes de red o incidencias en el servidor central consulte la caché local (`LocalReportRepository`) sin interrumpir la navegación ni lanzar pantallas rojas de error.
- **FR-011 (RNF-11 - Compatibilidad Expo SDK 58 y React Native 0.88)**: La aplicación móvil DEBE estar construida y configurada bajo la arquitectura de Expo SDK 58 y React Native 0.88, implementando StatusBar Edge-to-Edge nativa y garantizando total interoperabilidad con los dispositivos modernos sin alertas de incompatibilidad en Expo Go.

### Key Entities

- **Denuncia (Reporte Ambiental)**: Registro de alerta ambiental con código único (`REP-2026-XXX`), título, descripción, categoría, estado del ciclo de vida, prioridad, coordenadas GPS (`latitud`, `longitud`), dirección de referencia, URL/URI de fotografía inicial ("Antes"), puntos otorgados, indicador de ocultamiento visual ciudadano (`ocultarUsuario`), autor (`ciudadanoId`) y municipio (`municipioId`).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Un ciudadano puede capturar una foto, completar los datos básicos y enviar un reporte ambiental en menos de 90 segundos.
- **SC-002**: El 100% de las fotografías procesadas por el flujo de reporte pesan menos de `1.2 MB` antes de ser enviadas o persistidas.
- **SC-003**: El 100% de los reportes recién creados se registran con estado `PENDIENTE` y `0 puntos` otorgados inicialmente.
- **SC-004**: El 100% de los reportes archivados por el ciudadano (`ocultarUsuario = true`) desaparecen de la vista del vecino en menos de 300 ms sin perderse de las consultas administrativas del municipio.

## Assumptions

- El dispositivo móvil cuenta con cámara operativa o galería de imágenes accesible mediante los permisos estándar del sistema operativo.
- Cuando el vecino opera sin conexión al servidor central, el repositorio local almacena el reporte y actualiza inmediatamente la lista del vecino manteniendo la experiencia fluida.
