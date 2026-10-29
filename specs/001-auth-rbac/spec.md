# Feature Specification: Modo Invitado, Home de Bienvenida, Autenticación Multi-Rol (RBAC) y Gestión de Sesiones

**Feature Branch**: `001-auth-rbac`

**Created**: 2026-10-15

**Status**: Draft

**Input**: User description: "Autenticacion multi-rol RBAC conectada a Express y Prisma con persistencia local, Home de bienvenida para invitados no logueados con explicacion de la app, navegacion libre de lectura y solicitud de registro al intentar acciones protegidas"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Home de Bienvenida para No Logueados (Modo Invitado) y Botón de Registro en Cabecera (Priority: P1)

Cuando una persona abre Eco Alerta sin haber iniciado sesión (Modo Invitado), la aplicación NO la bloquea en la pantalla de Login, sino que ingresa directamente al **Home de Bienvenida para no logueados**. Esta pantalla le explica de forma clara y visual el funcionamiento de la aplicación (cómo reportar un problema ambiental, cómo el municipio lo verifica y limpia, y cómo sumar puntos para canjear premios ecológicos). Además, en la tarjeta superior donde habitualmente se muestra el nombre y el ícono del usuario logueado, se muestra un botón interactivo que dice **"Regístrate para empezar a usar la app"**, llevándolo al flujo de registro/inicio de sesión cuando decida crear su cuenta.

**Why this priority**: Elimina la barrera de entrada inicial, permite que cualquier vecino conozca el propósito y los premios de Eco Alerta antes de comprometer sus datos personales e incrementa la conversión de registro.

**Independent Test**: Se puede probar abriendo la aplicación sin sesión activa (o tras cerrar sesión) y comprobando que aterriza en el Home de Bienvenida explicativo, que en el lugar del nombre e ícono del usuario figura el botón *"Regístrate para empezar a usar la app"* y que al tocarlo lleva a la pantalla de Registro/Login.

**Acceptance Scenarios**:

1. **Given** un usuario que abre la aplicación sin sesión iniciada (`user === null`), **When** finaliza la carga inicial, **Then** el sistema muestra como pantalla de inicio el **Home de Bienvenida para no logueados** con la explicación del funcionamiento de la app, en lugar de la pantalla de Login.
2. **Given** un usuario invitado en el Home de Bienvenida, **When** observa la tarjeta superior de bienvenida (donde un usuario logueado vería su ícono de perfil, su nombre y sus puntos), **Then** visualiza el botón destacado **"Regístrate para empezar a usar la app"** y al pulsarlo navega hacia la pantalla de Registro (con acceso a Iniciar Sesión).
3. **Given** un usuario invitado que posteriormente inicia sesión o completa su registro como Ciudadano, **When** regresa al Home, **Then** el botón de registro es reemplazado por su ícono de usuario, su nombre real y su saldo de puntos actualizado, mostrando el Home operativo de vecino.

---

### User Story 2 - Navegación en Modo Invitado y Bloqueo de Acciones Protegidas (Auth Gate) (Priority: P1)

Un usuario en Modo Invitado puede recorrer la aplicación de manera exploratoria: puede leer el Home de Bienvenida y navegar hacia la pestaña de **Tienda Ecológica** para ver todos los productos, sus precios en puntos, categorías y buscador. Sin embargo, no puede ejecutar acciones que requieran cuenta o información del usuario: si intenta **reportar un foco ambiental (Cámara)**, entrar a **Perfil**, ver **Historial** o pulsar **"Agregar al Carrito"** en un producto, el sistema bloquea la acción y le solicita que se registre o inicie sesión.

**Why this priority**: Permite vitrinear los premios ecológicos y explorar la plataforma como invitado, protegiendo estrictamente las operaciones transaccionales y personales detrás del registro ciudadano.

**Independent Test**: Se puede probar navegando sin sesión iniciada hacia la Tienda (verificando que los productos se ven pero el botón "Agregar al Carrito" pide registrarse) e intentando tocar el botón central de Cámara o la pestaña Perfil (verificando que solicita registrarse).

**Acceptance Scenarios**:

1. **Given** un usuario en Modo Invitado navegando por la pestaña Tienda, **When** explora el catálogo, filtra por categoría o busca productos, **Then** puede visualizar todos los productos activos y sus costos en puntos en modo lectura.
2. **Given** un usuario en Modo Invitado en la Tienda, **When** pulsa el botón **"Agregar al Carrito"** sobre cualquier producto, **Then** el sistema impide agregar el ítem al carrito y le muestra la solicitud para registrarse o iniciar sesión.
3. **Given** un usuario en Modo Invitado en cualquier pantalla, **When** intenta acceder al botón central de **Cámara (Reportar foco)**, a la pestaña **Perfil** o a cualquier ruta que requiera información del usuario, **Then** el sistema intercepta la navegación y le pide que se registre o inicie sesión para continuar.

---

### User Story 3 - Inicio de Sesión Multi-Rol y Enrutamiento Dinámico (Priority: P1)

Cualquier actor registrado del ecosistema municipal (Ciudadano, Agente de Campo, Administrador Municipal o Colaborador de Entrega) accede a la pantalla de Login, ingresa sus credenciales y el sistema valida su identidad contra el padrón central (o respaldo local ante contingencia de red), dirigiéndolo automáticamente al entorno de trabajo exclusivo de su rol sin exponer funciones no autorizadas.

**Why this priority**: Garantiza el control de acceso basado en roles (RBAC) para los 4 perfiles operativos del municipio una vez autenticados.

**Independent Test**: Se puede probar de forma independiente iniciando sesión con una cuenta de cada uno de los 4 roles preconfigurados y verificando que cada uno aterrice en su panel específico y que las credenciales inválidas sean rechazadas con un mensaje claro.

**Acceptance Scenarios**:

1. **Given** un usuario registrado con rol Ciudadano (`CITIZEN`) en la pantalla de inicio de sesión, **When** ingresa su correo/identificador y contraseña válidos y pulsa "Iniciar Sesión", **Then** el sistema autentica su cuenta y lo redirige al Panel Principal Ciudadano completo (con su nombre, saldo de puntos, cámara de reportes habilitada, carrito activo y perfil).
2. **Given** un usuario registrado con rol Agente de Campo (`AGENT`), **When** inicia sesión con credenciales válidas, **Then** el sistema lo redirige exclusivamente a la Bandeja Operativa de Inspecciones de Campo, sin acceso al carrito de compras ni autoasignación de puntos.
3. **Given** un usuario registrado con rol Administrador Municipal (`ADMIN`), **When** inicia sesión con credenciales válidas, **Then** el sistema lo redirige al Panel de Control y Triaje Municipal.
4. **Given** un usuario registrado con rol Colaborador Municipal (`COLLABORATOR`), **When** inicia sesión con credenciales válidas, **Then** el sistema lo redirige al Panel de Validación de Códigos de Retiro y Entrega de Premios.
5. **Given** cualquier usuario en la pantalla de inicio de sesión, **When** ingresa una contraseña incorrecta o un usuario inexistente, **Then** el sistema impide el acceso y muestra un mensaje descriptivo indicando que las credenciales no son válidas.

---

### User Story 4 - Autoregistro de Vecinos Ciudadanos con Validaciones (Priority: P1)

Un vecino invitado decide crear su cuenta pulsando *"Regístrate para empezar a usar la app"* (o al ser invitado a registrarse tras intentar una acción protegida). Completa el formulario de registro indicando su nombre completo, correo electrónico, contraseña y confirmación de contraseña, quedando dado de alta automáticamente bajo el rol Ciudadano con saldo inicial de 0 puntos.

**Why this priority**: Permite la conversión directa de visitantes invitados en vecinos registrados activos con datos validados e integridad de puntos.

**Independent Test**: Se puede probar pulsando el botón de registro desde el modo invitado, completando el formulario con datos válidos e inválidos, verificando las reglas de validación y comprobando que la nueva cuenta inicie sesión automáticamente con 0 puntos.

**Acceptance Scenarios**:

1. **Given** un vecino invitado en la pantalla de registro, **When** ingresa nombre completo, un correo electrónico con formato válido no registrado previamente, y una contraseña de al menos 6 caracteres que coincide con su confirmación, **Then** el sistema crea la cuenta con rol `CITIZEN`, le asigna `0 puntos` iniciales, inicia su sesión automáticamente y desbloquea todas las funciones ciudadanas (cámara, perfil y carrito).
2. **Given** un vecino en la pantalla de registro, **When** intenta registrarse dejando campos vacíos, con un formato de correo inválido, una contraseña menor a 6 caracteres o contraseñas que no coinciden, **Then** el sistema bloquea el envío y muestra el mensaje de error específico junto al formulario.
3. **Given** un vecino en la pantalla de registro, **When** ingresa un correo electrónico que ya pertenece a otro usuario del municipio, **Then** el sistema rechaza el registro e informa que el correo electrónico ya se encuentra registrado.

---

### User Story 5 - Persistencia de Sesión Activa y Cierre de Sesión por Rol (Priority: P2)

Un usuario que ya inició sesión cierra la aplicación móvil y vuelve a abrirla más tarde; el sistema restaura automáticamente su sesión y lo lleva directo a su panel de rol correspondiente. Cuando decide salir, pulsa "Cerrar Sesión" y confirma la acción para limpiar sus datos locales. El ciudadano regresa al Home de Bienvenida en Modo Invitado, mientras que agentes, administradores y colaboradores regresan a la pantalla de inicio de sesión.

**Why this priority**: Esencial para la experiencia cotidiana en dispositivos móviles y para mantener un destino de salida adecuado a cada tipo de cuenta.

**Independent Test**: Se puede probar iniciando sesión, cerrando y reabriendo la aplicación para comprobar que mantiene la sesión, y luego cerrando sesión para verificar que cada rol vuelve a su pantalla de acceso correspondiente.

**Acceptance Scenarios**:

1. **Given** un usuario con sesión iniciada en cualquier rol, **When** cierra y vuelve a abrir la aplicación móvil, **Then** el sistema recupera su sesión activa en menos de 300 ms y muestra directamente la pantalla principal de su rol.
2. **Given** un ciudadano con sesión activa, **When** selecciona la opción "Cerrar Sesión" y confirma el diálogo de seguridad, **Then** el sistema elimina la sesión almacenada en el dispositivo y redirige al Home de Bienvenida en Modo Invitado.
3. **Given** un agente, administrador o colaborador con sesión activa, **When** selecciona la opción "Cerrar Sesión" y confirma el diálogo de seguridad, **Then** el sistema elimina la sesión almacenada en el dispositivo y redirige a la pantalla de inicio de sesión.

---

### User Story 6 - Acceso Rápido con Cuenta Google y Resiliencia Offline (Priority: P3)

Un ciudadano puede optar por el botón de acceso rápido con Google para ingresar sin escribir una contraseña manual. Asimismo, si el servidor central no responde por falta de conectividad en la zona, el sistema permite autenticar contra el padrón local sincronizado en el dispositivo para garantizar continuidad operativa.

**Why this priority**: Reduce la fricción de entrada para ciudadanos y asegura que las demostraciones y el trabajo en zonas con señal inestable no bloqueen la aplicación.

**Independent Test**: Se puede probar pulsando el botón de acceso con Google desde la pantalla de login/registro y probando el inicio de sesión con cuentas semilla cuando el servidor remoto se encuentra apagado.

**Acceptance Scenarios**:

1. **Given** un vecino en la pantalla de inicio de sesión o registro, **When** pulsa el botón de acceso con Google, **Then** el sistema autentica o provisiona su perfil ciudadano y desbloquea todas las funciones de vecino.
2. **Given** una interrupción temporal de conexión con el servidor central, **When** un usuario previamente sincronizado o de prueba ingresa sus credenciales válidas, **Then** el sistema valida la cuenta mediante el respaldo local sin cerrar ni bloquear la aplicación.

---

### User Story 7 - Alta Administrativa de Agentes y Colaboradores (Priority: P1)

Un administrador municipal autenticado crea cuentas para el personal operativo desde una pantalla dedicada, seleccionando Agente o Colaborador e ingresando nombre, correo y contraseña inicial. Para cada cuenta, también toma una foto de perfil con la cámara; la foto queda asociada y la persona la visualiza al ingresar. Las cuentas quedan asociadas al municipio del administrador; el registro público continúa creando únicamente ciudadanos.

**Independent Test**: Desde el panel de administración, crear una cuenta de Agente y una de Colaborador con una foto tomada en el momento; verificar que pueden iniciar sesión y que cada persona ve su foto en su pantalla principal. Intentar usar la función sin ser administrador debe ser rechazado.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** crea una cuenta válida de Agente o Colaborador, **Then** la cuenta se guarda en el municipio del administrador con el rol seleccionado y puede iniciar sesión en su panel.
2. **Given** un administrador que crea una cuenta, **When** elige una contraseña inicial, **Then** la contraseña se almacena de forma segura y nunca se devuelve en la respuesta de creación.
3. **Given** un usuario que no tiene rol Administrador, **When** intenta crear una cuenta de personal, **Then** el sistema rechaza la solicitud sin crear el usuario.
4. **Given** un administrador que intenta crear una cuenta con un correo existente, datos inválidos o el rol Administrador/Ciudadano, **When** envía el formulario, **Then** el sistema rechaza la solicitud con un mensaje claro y no crea una cuenta.
5. **Given** un administrador que crea una cuenta de Agente o Colaborador, **When** captura una foto con la cámara y completa el alta, **Then** la imagen queda guardada y se muestra a esa persona después de iniciar sesión.
6. **Given** un administrador que intenta crear una cuenta de Agente o Colaborador sin una foto válida, **When** envía el formulario, **Then** el sistema rechaza el alta y permite reintentar la captura.
7. **Given** un Agente o Colaborador autenticado, **When** utiliza la aplicación, **Then** no puede cambiar la foto asignada por el administrador durante el alta.

### User Story 8 - Gestión de Colaboradores y Estado de Servicio (Priority: P1)

El administrador municipal consulta el listado de colaboradores de su municipio, ve su foto y estado de servicio, y puede activar o desactivar su disponibilidad.

**Independent Test**: Desde la pantalla de Colaboradores, verificar que solo aparecen cuentas de Colaborador del municipio, cambiar el estado de una cuenta y confirmar que el nuevo estado queda visible al actualizar la lista.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre Colaboradores, **Then** ve todas las cuentas de colaborador de su municipio, su foto (o avatar alternativo) y si están en servicio.
2. **Given** un colaborador listado, **When** el administrador cambia su estado de servicio, **Then** el cambio se guarda y el nuevo estado se muestra en la lista.
3. **Given** un administrador, **When** consulta colaboradores de otro municipio o intenta cambiar su estado, **Then** esos usuarios no aparecen ni pueden ser modificados.

### User Story 9 - Edición del Perfil del Administrador (Priority: P2)

El administrador actualiza su nombre y foto desde la bienvenida del panel, sin cambiar sus credenciales ni afectar otros datos de la cuenta.

**Independent Test**: Cambiar nombre y foto desde la pantalla principal del administrador, guardar, y verificar que ambos cambios aparecen en la bienvenida y permanecen después de cerrar e iniciar sesión.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la edición de perfil desde su tarjeta de bienvenida, **Then** puede modificar su nombre y tomar o elegir una nueva foto.
2. **Given** un administrador que completa datos válidos, **When** guarda los cambios, **Then** el perfil y la sesión muestran el nombre y la foto actualizados.
3. **Given** un administrador que intenta guardar un nombre inválido o una foto no válida, **When** confirma los cambios, **Then** el sistema informa el error y conserva el perfil previamente guardado.

### User Story 10 - Eliminación de Cuentas de Personal (Priority: P2)

El administrador municipal accede desde Inicio a una pantalla de gestión de cuentas de Agentes y Colaboradores y puede eliminar una cuenta que ya no debe tener acceso. Esta función no agrega una opción a la navegación principal del administrador. Los reportes se conservan; los casos activos del Agente eliminado regresan a la bolsa de trabajo y los reportes históricos conservan su estado sin el vínculo con esa cuenta.

**Independent Test**: Desde la pantalla de cuentas de personal, eliminar una cuenta de Agente con reportes asignados y una cuenta de Colaborador; verificar que no puedan volver a iniciar sesión, que los reportes permanezcan y que los asignados al Agente queden sin asignación.

**Acceptance Scenarios**:

1. **Given** un administrador autenticado, **When** abre la gestión de cuentas de personal, **Then** ve solo Agentes y Colaboradores de su municipio.
2. **Given** una cuenta de personal listada, **When** el administrador solicita eliminarla, **Then** el sistema pide confirmación y explica que la operación es permanente.
3. **Given** una cuenta de Agente con casos activos e históricos asignados, **When** el administrador confirma su eliminación, **Then** la cuenta se elimina, los reportes se conservan, los casos activos vuelven a quedar sin asignación y los históricos conservan su estado sin el vínculo con la cuenta.
4. **Given** un administrador que intenta eliminar una cuenta inexistente, de otro municipio o que no sea Agente ni Colaborador, **When** confirma la operación, **Then** el sistema rechaza la solicitud sin modificar datos.
5. **Given** un usuario que no tiene rol Administrador, **When** intenta eliminar una cuenta de personal, **Then** el sistema rechaza la solicitud.
6. **Given** el panel de administración, **When** el administrador navega entre sus pantallas, **Then** la barra principal muestra únicamente Inicio, Denuncias, Agentes, Catálogo, Personal y Colaboradores; la gestión de cuentas se abre desde Inicio como pantalla secundaria.

---

### Edge Cases

- **Usuario invitado cancela la pantalla de Registro/Login**: Si el invitado fue llevado a la pantalla de Registro o Login pero decide volver atrás sin autenticarse, regresa limpiamente al Home de Bienvenida en Modo Invitado sin quedar atrapado.
- **Espacios en blanco accidentales**: ¿Qué ocurre si el usuario escribe espacios al inicio o final de su correo electrónico? El sistema recorta automáticamente los espacios (`trim`) y normaliza el correo a minúsculas antes de validar.
- **Doble pulsación en botones de envío**: ¿Qué ocurre si el usuario toca repetidamente "Iniciar Sesión" o "Registrarse" mientras se procesa la solicitud? El botón entra en estado de carga (`isLoading`) y se deshabilita hasta recibir respuesta.
- **Caída del servidor durante el Login/Registro**: Si el servidor central excede el tiempo de espera o no está accesible, el sistema utiliza de manera transparente el repositorio local de respaldo e informa el resultado sin cierres inesperados.
- **Intento de autoregistro con rol privilegiado**: Ningún usuario puede seleccionar ni inyectar roles `ADMIN`, `AGENT` o `COLLABORATOR` desde el formulario público de registro; todo autoregistro se fuerza exclusivamente a `CITIZEN`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001 (RF-AUT-01 - Autoregistro Ciudadano)**: El sistema DEBE permitir el autoregistro público únicamente bajo el rol Ciudadano (`CITIZEN`), solicitando Nombre completo, Correo electrónico, Contraseña y Confirmación de contraseña, asignando por defecto el municipio activo y un saldo inicial de `0 puntos`.
- **FR-002 (RF-AUT-02 - Validación de Formularios)**: El sistema DEBE validar antes de enviar que ningún campo obligatorio esté vacío, que el correo electrónico posea un formato estándar válido (`usuario@dominio.ext`), que la contraseña tenga una longitud mínima de `6 caracteres` y que coincida exactamente con el campo de confirmación.
- **FR-003 (RF-AUT-02 - Unicidad de Identidad)**: El sistema DEBE verificar que el correo electrónico no se encuentre duplicado antes de dar de alta un nuevo usuario, devolviendo un mensaje claro en caso de colisión.
- **FR-004 (RF-AUT-03 - Autenticación Multi-Rol)**: El sistema DEBE autenticar credenciales contra el servicio central de usuarios (con soporte de contingencia en almacenamiento local) verificando correo/identificador y contraseña cifrada, y retornando los datos completos del perfil: identificador, nombre, correo, rol, puntos acumulados, estado de disponibilidad y municipio.
- **FR-005 (RF-AUT-04 - Enrutamiento Dinámico por Rol e Invitado)**: El sistema DEBE enrutar la aplicación según el estado de sesión y rol:
  - `GUEST` (No autenticado / `user === null`): Ingresa por defecto al navegador principal mostrando el **Home de Bienvenida explicativo** y acceso de solo lectura a la Tienda y sección informativa.
  - `CITIZEN`: Navegador Principal Ciudadano con todas las acciones desbloqueadas (Inicio personalizado, Perfil, Cámara de Reporte, Tienda con Carrito activo, Más).
  - `AGENT`: Navegador Operativo de Agente de Campo (Bolsa de casos e inspecciones asignadas, sin acceso a canjes de tienda).
  - `ADMIN`: Navegador de Administración Municipal (Métricas, Triaje de Denuncias, Gestión de Agentes y Catálogo).
- **FR-006 (RF-AUT-05 - Foto de Perfil de Agente)**: El administrador DEBE capturar una foto con la cámara al crear una nueva cuenta de Agente. El sistema DEBE requerir una imagen válida, guardarla en el perfil y mostrarla al Agente al iniciar sesión; el Agente no puede cambiarla y los Colaboradores no requieren foto.
  - `COLLABORATOR`: Panel de Operador de Entrega (Búsqueda por código de retiro `codigoRetiro` y confirmación de entrega presencial).
- **FR-006 (RF-AUT-05 - Persistencia y Cierre de Sesión)**: El sistema DEBE conservar localmente la sesión activa del usuario para restaurarla al abrir la aplicación y proveer una acción de cierre de sesión con confirmación que limpie el estado local y regrese al Home de Bienvenida en Modo Invitado.
- **FR-007 (RF-AUT-02 - Acceso Rápido con Google)**: El sistema DEBE ofrecer la opción de acceso rápido mediante cuenta Google para el rol Ciudadano.
- **FR-008 (Seguridad y Semillas de Prueba)**: El sistema DEBE proteger las contraseñas mediante hash seguro y disponer de cuentas de prueba preconfiguradas para los 4 roles (`CITIZEN` con 1250 pts y 50 pts, `AGENT` 1 y 2, `ADMIN` y `COLLABORATOR`) en el municipio `"Pilar"` (`PILAR-BA`). Las credenciales de esas cuentas no DEBEN exponerse ni ofrecerse como accesos rápidos en la pantalla de inicio de sesión.
- **FR-009 (RF-AUT-06 - Home de Bienvenida Explicativo y Botón CTA de Cabecera)**: Cuando el usuario no está autenticado (`user === null`), la pantalla de Inicio DEBE mostrar una guía explicativa del funcionamiento de Eco Alerta y reemplazar el bloque de nombre e ícono del usuario por un botón con la leyenda **"Regístrate para empezar a usar la app"** que redirija al flujo de Registro/Login.
- **FR-010 (RF-AUT-07 y 08 - Guardián de Modo Invitado / Auth Gate)**: Cuando un usuario no autenticado intente realizar cualquier acción que requiera cuenta o datos del usuario —incluyendo abrir **Cámara / Reportar un foco**, entrar a **Perfil**, consultar **Historial** o pulsar **"Agregar al Carrito"** en la Tienda—, el sistema DEBE bloquear la acción y solicitarle que se registre o inicie sesión.
- **FR-011 (RF-AUT-09 - Refresco en Caliente de Perfil y Puntos en DB)**: El sistema DEBE exponer endpoints autenticados `GET /api/auth/me` y `GET /api/auth/perfil` que retornen el perfil y saldo de puntos en tiempo real directamente de la base de datos PostgreSQL, e integrar `recargarPerfilUsuario()` en el cliente para mantener sincronizado el estado local con la base de datos tras canjes, entregas o acreditación de puntos.

### Non-Functional Requirements

- **NFR-001 (RNF-09 - Arranque Inmediato en Modo Invitado y Respuesta del Auth Gate)**: La carga inicial en Modo Invitado DEBE mostrar el Home de Bienvenida en menos de `300 ms` sin exigir credenciales, y la intercepción de acciones protegidas (Auth Gate) DEBE responder en menos de `100 ms` mostrando el aviso o pantalla de registro sin cierres inesperados.
- **NFR-002 (RNF-01 y 06 - Resiliencia y Tiempos de Respuesta)**: Las consultas de autenticación al servidor central DEBEN responder en menos de `600 ms` y conmutar automáticamente al repositorio local en caso de falla de red.
- **NFR-003 (RNF-10 - Bloqueo de UI con Spinner Transaccional en DB)**: Al enviar solicitudes de Registro o Inicio de Sesión a la Base de Datos, el sistema DEBE mostrar un spinner bloqueante (`TransactionLoaderModal` / botón deshabilitado) impidiendo pulsaciones repetidas hasta conocer el estado de la transacción: si es positiva, avanza en el flujo; si es negativa, permanece en el formulario y muestra un mensaje de error invitando a reintentar.

### Key Entities

- **Visitante Invitado (`GUEST` / Sesión Nula)**: Usuario no autenticado que navega la aplicación en modo lectura (Home de Bienvenida y visualización de catálogo de Tienda) sujeto a las restricciones del Guardián de Autenticación (Auth Gate).
- **Municipio**: Entidad organizacional que agrupa usuarios, denuncias, sucursales y catálogo del distrito (ej. `"Municipio de Pilar"`, código `"PILAR-BA"`).
- **Usuario (`User`)**: Persona registrada en la plataforma con nombre completo, correo electrónico único, credencial protegida (`passwordHash`), rol operativo (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`), saldo de puntos (`0` por defecto al registrarse), indicador de disponibilidad en servicio (para agentes), foto de perfil capturada por el administrador para Agentes nuevos y vínculo con su Municipio.
- **Sesión de Usuario**: Estado persistido localmente en el dispositivo del usuario autenticado que mantiene su identidad y rol activos entre reinicios de la aplicación.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de los usuarios que abren la aplicación sin sesión iniciada aterrizan directamente en el Home de Bienvenida explicativo en menos de 300 ms, visualizando el botón *"Regístrate para empezar a usar la app"* en el lugar del nombre e ícono del usuario.
- **SC-002**: El 100% de los intentos de un usuario invitado por reportar un foco, abrir Perfil o agregar un producto al carrito son interceptados de forma segura solicitándole registrarse, mientras mantiene el 100% de visibilidad de lectura sobre el catálogo de productos.
- **SC-003**: Un vecino invitado puede pasar del Home de Bienvenida a completar su registro y desbloquear todas las funciones en menos de 60 segundos.
- **SC-004**: El 100% de los inicios de sesión válidos redirigen al usuario a la vista exclusiva de su rol (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`) en menos de 600 ms con red activa.
- **SC-005**: El 100% de las cuentas ciudadanas creadas mediante autoregistro estándar inician con exactamente `0 puntos` ecológicos.
- **SC-006**: Ante la falta de conexión con el servidor central, el 100% de los usuarios de prueba de los 4 roles pueden autenticarse y navegar sus flujos mediante el respaldo local sin cierres inesperados.

## Assumptions

- Los usuarios no autenticados pueden volver atrás desde la pantalla de Registro o Inicio de Sesión hacia el Home de Bienvenida si desean seguir explorando como invitados.
- Los usuarios con roles `AGENT`, `ADMIN` y `COLLABORATOR` ingresan a través de la opción "Iniciar Sesión" accesible desde el flujo de registro/autenticación.
- El diseño visual del Home de Bienvenida, Login y Registro conserva intacta la estética institucional de Eco Alerta mediante `StyleSheet.create` y las variables globales de `theme.ts`.

## Supplemental guest navigation requirement

**Acceptance scenario**: **Given** un usuario invitado en el navegador principal, **When** pulsa la pestaña **Más**, **Then** se muestra directamente el modal compartido con opciones para registrarse o iniciar sesión, sin abrir la pantalla de opciones. Los usuarios autenticados mantienen la navegación normal a **Más**.

- **FR-012 (Auth Gate desde la pestaña Más)**: Cuando un usuario invitado pulse la pestaña **Más**, el sistema DEBE mostrar directamente el mismo modal compartido de registro/inicio de sesión utilizado por las demás acciones protegidas. Los usuarios autenticados DEBEN poder abrir Más sin cambios en su navegación.
- **FR-013 (RF-AUT-10 - Foto de perfil compartida entre pantallas)**: Cuando un ciudadano cambie su foto de perfil, la imagen seleccionada DEBE guardarse en el perfil local de la sesión y mostrarse tanto en Perfil como en Inicio. Si no hay una foto guardada, Inicio DEBE conservar el avatar predeterminado.
- **FR-014 (RF-AUT-11 - Bandeja de actividad ciudadana)**: El botón de notificaciones del Inicio DEBE abrir una bandeja con el estado actual de cada reporte del ciudadano y sus canjes. Un canje `PENDIENTE_RETIRO` DEBE indicarse como listo para retirar a partir de dos días hábiles después de su creación; antes de ese momento, la bandeja DEBE mostrar la fecha a partir de la cual estará disponible. Los estados de canjes `ENTREGADO` y `CANCELADO` también DEBEN identificarse claramente.
- **FR-015 (RF-AUT-12 - Nombre de la moneda de recompensa)**: En todos los textos visibles de la aplicación que se refieran a la moneda de recompensa ciudadana, el sistema DEBE utilizar el nombre `EcoPuntos` en lugar de `puntos`, `PTS` o `pts`. Los nombres de campos, propiedades y contratos internos existentes no necesitan cambiar.
- **FR-016 (RF-AUT-13 - Saldo en la cabecera del Inicio)**: En el Inicio, el sistema NO DEBE mostrar el engranaje de configuración en la esquina superior derecha. Para ciudadanos autenticados, DEBE mostrar allí su saldo actualizado de EcoPuntos; para invitados, DEBE conservar el espacio de la cabecera sin mostrar un saldo.
- **FR-017 (RF-AUT-14 - Espacio de anuncios en Inicio)**: Entre el carrusel de canjes y la sección de reportes recientes, el sistema DEBE reservar un espacio de ancho completo para anuncios, con altura ligeramente inferior a la tarjeta de bienvenida y una etiqueta visible `Anuncios`.
- **FR-018 (RF-AUT-15 - Contraste de secciones en Inicio)**: Las áreas que contienen el carrusel de canjes y los reportes recientes DEBEN distinguirse del fondo claro de Inicio mediante un tono verde suave, manteniendo el contraste legible de las tarjetas y sus contenidos.
- **FR-019 (RF-AUT-16 - Acciones funcionales de Más)**: Las opciones de Más DEBEN abrir sus funciones correspondientes: Perfil para editar nombre y foto, Notificaciones para consultar reportes y canjes, Ayuda para consultar preguntas frecuentes y Términos y Privacidad para leer las condiciones disponibles.
- **FR-020 (RF-AUT-17 - Edición segura del perfil)**: El ciudadano DEBE poder cambiar su nombre, que deberá persistirse en su cuenta y sesión; también podrá cambiar su foto de perfil. El correo se mostrará como dato de solo lectura y no podrá modificarse desde este flujo.
- **FR-021 (RF-AUT-18 - Información legal provisional)**: Si los términos oficiales no están disponibles, la pantalla de Términos y Privacidad DEBE presentar el contenido como borrador pendiente de revisión municipal/legal, sin presentarlo como texto oficial.
- **FR-022 (RF-AUT-19 - Encabezado institucional en todas las pantallas)**: El sistema DEBE mostrar el encabezado institucional con el logo Eco Alerta en todas las pantallas navegables para invitados y para los roles Ciudadano, Agente, Administrador y Colaborador, incluidas las pantallas secundarias dentro de cada flujo. El encabezado DEBE respetar el área segura del dispositivo y no duplicar el logo dentro de una misma pantalla.
- **FR-023 (RF-AUT-20 - Contraste de la barra de estado del dispositivo)**: Al abrir la aplicación, la barra de estado del dispositivo DEBE mostrar en color oscuro los iconos y textos del sistema (hora, batería, señal y notificaciones), independientemente de la pantalla visible, para conservar su legibilidad sobre la interfaz clara.
- **FR-024 (RF-AUT-21 - Aprovisionamiento administrativo de personal)**: El sistema DEBE permitir únicamente a un Administrador autenticado crear cuentas de Agente (`AGENT`) y Colaborador (`COLLABORATOR`) desde la pantalla de Personal. Cada cuenta DEBE asociarse al municipio del Administrador, requerir nombre, correo válido único y contraseña inicial de al menos 8 caracteres, y proteger la contraseña almacenada. La creación NO DEBE permitir los roles `ADMIN` ni `CITIZEN`; el autoregistro público DEBE continuar limitado a `CITIZEN`.
- **FR-025 (RF-AUT-22 - Foto del Personal)**: Al aprovisionar una nueva cuenta `AGENT` o `COLLABORATOR`, el administrador DEBE tomar una foto con la cámara y el sistema DEBE guardarla como parte del perfil, entregarla al iniciar sesión y mostrarla en la pantalla principal del rol correspondiente. Una imagen ausente o inválida DEBE impedir el alta. El usuario NO DEBE poder cambiar su foto y las cuentas existentes sin imagen DEBEN conservar el acceso con un avatar alternativo.
- **FR-026 (RF-AUT-23 - Gestión de Colaboradores)**: El administrador DEBE poder consultar una pantalla con todos los Colaboradores asociados a su municipio, sus fotos de perfil y su estado de servicio, y cambiar dicho estado. El listado y las actualizaciones DEBEN estar restringidos al municipio autenticado.
- **FR-027 (RF-AUT-24 - Edición del Perfil del Administrador)**: El administrador autenticado DEBE poder actualizar su propio nombre y foto de perfil. El sistema DEBE validar y persistir ambos cambios, y reflejarlos en la sesión activa. Los cambios de perfil NO DEBEN permitir modificar otros usuarios ni credenciales.
- **FR-028 (RF-AUT-25 - Eliminación de Cuentas de Personal)**: El administrador autenticado DEBE poder consultar y eliminar cuentas `AGENT` y `COLLABORATOR` de su municipio desde una pantalla de gestión, con confirmación explícita. La operación DEBE revocar el acceso al eliminar la cuenta y preservar los reportes; los casos activos del Agente eliminado DEBEN quedar sin asignación, mientras que los reportes históricos DEBEN conservar su estado aunque pierdan el vínculo con la cuenta eliminada. No DEBE permitir eliminar ciudadanos, administradores ni cuentas de otro municipio.
- **FR-029 (RF-AUT-26 - Navegación administrativa)**: El panel administrativo DEBE presentar únicamente seis destinos principales: Inicio, Denuncias, Agentes, Catálogo, Personal y Colaboradores. La gestión de eliminación de cuentas DEBE ser accesible desde Inicio como pantalla secundaria, sin añadir un destino a la navegación principal ni dejar espacios vacíos en ella.
- **SC-007**: El 100% de las pulsaciones de invitados sobre **Más** abre el modal de autenticación; el 100% de las pulsaciones de usuarios autenticados mantiene el acceso a la pantalla de opciones.
- **SC-008**: Después de elegir o tomar una foto en Perfil, el 100% de las visitas a Inicio dentro de la sesión muestra esa misma imagen sin reiniciar la aplicación.
- **SC-009**: El botón de notificaciones abre la bandeja y lista los estados actuales de todos los reportes y canjes del ciudadano; cada canje pendiente se identifica correctamente como disponible o pendiente según hayan transcurrido dos días hábiles.
- **SC-010**: Los textos visibles de saldo, precios, acreditaciones, historial y canjes identifican la moneda de recompensa como `EcoPuntos`; las referencias geográficas a puntos de retiro o entrega permanecen sin cambios.
- **SC-011**: En Inicio, ningún usuario ve el engranaje en la esquina superior derecha; los ciudadanos ven su saldo de EcoPuntos en ese lugar y los invitados no ven un saldo.
- **SC-012**: El espacio de anuncios aparece entre el carrusel de canjes y la sección de reportes recientes, ocupa el ancho disponible respetando los márgenes de Inicio y tiene menor altura que la tarjeta de bienvenida.
- **SC-013**: El carrusel de canjes y los reportes recientes se presentan sobre áreas de fondo verde claramente distinguibles del fondo general, sin reducir la legibilidad del contenido.
- **SC-014**: Las cuatro opciones de Más abren su destino funcional y ninguna muestra un mensaje de sección en desarrollo.
- **SC-015**: Un cambio de nombre confirmado se conserva al volver a abrir la aplicación; una entrada vacía o fuera del límite permitido se rechaza sin modificar el perfil.
- **SC-016**: La bandeja de Notificaciones muestra los estados disponibles del ciudadano; Ayuda muestra las preguntas frecuentes y el contenido de Términos identifica claramente su carácter de borrador.
- **SC-017**: El 100% de las pantallas navegables de los cuatro roles y del flujo invitado muestra el logo institucional en su encabezado, sin duplicados y sin quedar oculto por la zona segura del dispositivo.
- **SC-018**: En todas las pantallas de la aplicación, los indicadores de hora, batería, señal y notificaciones de la barra de estado se muestran oscuros y legibles sobre el fondo claro.
- **SC-019**: El 100% de las cuentas de Agente y Colaborador creadas desde Personal quedan en el municipio correcto, guardan contraseña protegida y pueden iniciar sesión en el panel de su rol; los usuarios no administradores no pueden crear estas cuentas.
- **SC-020**: En todas las pantallas principales del Administrador, la navegación muestra exactamente seis opciones (Inicio, Denuncias, Agentes, Catálogo, Personal y Colaboradores); la gestión de cuentas es accesible desde Inicio y no produce un espacio vacío ni una opción adicional en la navegación.
- **SC-021**: Tras confirmar la eliminación, el 100% de las cuentas de personal eliminadas deja de poder iniciar sesión; todos sus reportes permanecen, los casos activos del Agente quedan sin asignación y los históricos conservan su estado.
