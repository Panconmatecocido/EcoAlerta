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
  - `COLLABORATOR`: Panel de Operador de Entrega (Búsqueda por código de retiro `codigoRetiro` y confirmación de entrega presencial).
- **FR-006 (RF-AUT-05 - Persistencia y Cierre de Sesión)**: El sistema DEBE conservar localmente la sesión activa del usuario para restaurarla al abrir la aplicación y proveer una acción de cierre de sesión con confirmación que limpie el estado local y regrese al Home de Bienvenida en Modo Invitado.
- **FR-007 (RF-AUT-02 - Acceso Rápido con Google)**: El sistema DEBE ofrecer la opción de acceso rápido mediante cuenta Google para el rol Ciudadano.
- **FR-008 (Seguridad y Semillas de Prueba)**: El sistema DEBE proteger las contraseñas mediante hash seguro y disponer de cuentas de prueba preconfiguradas para los 4 roles (`CITIZEN` con 1250 pts y 50 pts, `AGENT` 1 y 2, `ADMIN` y `COLLABORATOR`) en el municipio `"Pilar"` (`PILAR-BA`).
- **FR-009 (RF-AUT-06 - Home de Bienvenida Explicativo y Botón CTA de Cabecera)**: Cuando el usuario no está autenticado (`user === null`), la pantalla de Inicio DEBE mostrar una guía explicativa del funcionamiento de Eco Alerta y reemplazar el bloque de nombre e ícono del usuario por un botón con la leyenda **"Regístrate para empezar a usar la app"** que redirija al flujo de Registro/Login.
- **FR-010 (RF-AUT-07 y 08 - Guardián de Modo Invitado / Auth Gate)**: Cuando un usuario no autenticado intente realizar cualquier acción que requiera cuenta o datos del usuario —incluyendo abrir **Cámara / Reportar un foco**, entrar a **Perfil**, consultar **Historial** o pulsar **"Agregar al Carrito"** en la Tienda—, el sistema DEBE bloquear la acción y solicitarle que se registre o inicie sesión.

### Non-Functional Requirements

- **NFR-001 (RNF-09 - Arranque Inmediato en Modo Invitado y Respuesta del Auth Gate)**: La carga inicial en Modo Invitado DEBE mostrar el Home de Bienvenida en menos de `300 ms` sin exigir credenciales, y la intercepción de acciones protegidas (Auth Gate) DEBE responder en menos de `100 ms` mostrando el aviso o pantalla de registro sin cierres inesperados.
- **NFR-002 (RNF-01 y 06 - Resiliencia y Tiempos de Respuesta)**: Las consultas de autenticación al servidor central DEBEN responder en menos de `600 ms` y conmutar automáticamente al repositorio local en caso de falla de red.

### Key Entities

- **Visitante Invitado (`GUEST` / Sesión Nula)**: Usuario no autenticado que navega la aplicación en modo lectura (Home de Bienvenida y visualización de catálogo de Tienda) sujeto a las restricciones del Guardián de Autenticación (Auth Gate).
- **Municipio**: Entidad organizacional que agrupa usuarios, denuncias, sucursales y catálogo del distrito (ej. `"Municipio de Pilar"`, código `"PILAR-BA"`).
- **Usuario (`User`)**: Persona registrada en la plataforma con nombre completo, correo electrónico único, credencial protegida (`passwordHash`), rol operativo (`CITIZEN`, `AGENT`, `ADMIN`, `COLLABORATOR`), saldo de puntos (`0` por defecto al registrarse), indicador de disponibilidad en servicio (para agentes) y vínculo con su Municipio.
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
