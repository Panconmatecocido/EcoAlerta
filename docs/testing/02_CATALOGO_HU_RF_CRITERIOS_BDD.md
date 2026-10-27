# 📋 CATÁLOGO MAESTRO DE HISTORIAS DE USUARIO (HU), REQUISITOS FUNCIONALES (RF) Y CRITERIOS DE ACEPTACIÓN BDD (GHERKIN)
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Cátedra:** Testing & Calidad de Software — UNPilar 2026  
**Profesor:** Mg. Pedro Brest  
**Estándar:** Agile User Stories, BDD (Gherkin Specification) & ISO/IEC 25010  
**Versión:** 2.0 (Definitivo sin ambigüedades)  

---

## 🔐 MÓDULO 1: AUTENTICACIÓN, MODO INVITADO, CUENTAS Y ROLES (RBAC)
**Responsable Técnico del Módulo (Corrección de Defectos):** `Dev Módulo 1 (Auth & RBAC)`

---

### HU-INV-01: Home de Bienvenida para Usuario No Logueado (Modo Invitado)
- **Historia de Usuario:**
  > **Como** usuario no autenticado (Invitado),  
  > **quiero** ingresar directamente a un Home de bienvenida explicativo al abrir la aplicación,  
  > **para** conocer cómo funciona el sistema de reportes ambientales y recompensas sin ser obligado a iniciar sesión desde el primer segundo.
- **Reglas de Negocio:**
  - El sistema detecta en el inicio en frío si existe un token guardado en `AsyncStorage`.
  - Si `token === null` o expirado, se monta la vista pública en un tiempo inferior a 300 ms (RNF-09).
  - La pantalla debe presentar 3 tarjetas explicativas ilustradas:
    1. *Reportá:* Cómo fotografiar y geolocalizar focos de basura o dengue.
    2. *Saneamiento:* Cómo el municipio y los inspectores verifican y limpian la zona.
    3. *Ecopuntos:* Cómo acumular puntos y canjear premios en la Tienda Ecológica.

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Acceso directo al Home de Bienvenida en arranque en frío
  Dado que el usuario abre la aplicación por primera vez o sin sesión guardada
  Cuando la aplicación completa la carga inicial en menos de 300 ms
  Entonces se muestra la pantalla Home en "Modo Invitado"
  Y no se presenta ninguna pantalla bloqueante de login
  Y se visualizan las 3 secciones explicativas de EcoAlerta.
```

---

### HU-INV-02: Call to Action (CTA) de Registro en Cabecera de Invitado
- **Historia de Usuario:**
  > **Como** usuario invitado navegando por el Home,  
  > **quiero** visualizar un botón destacado en la cabecera superior que me invite a registrarme,  
  > **para** crear mi cuenta o iniciar sesión cuando decida participar activamente.
- **Reglas de Negocio y Presentación Visual:**
  - En lugar del componente de avatar circular y nombre de usuario logueado, se renderiza un banner/botón interactivo en color primario (`#2E7D32` verde institucional).
  - Texto exacto del botón: `"Regístrate para empezar a usar la app"`.
  - Subtexto complementario o enlace inferior: `"¿Ya tienes cuenta? Inicia sesión"`.
  - Al presionar el botón principal, navega inmediatamente a `RegisterScreen`. Al tocar el enlace secundario, navega a `LoginScreen`.

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Visualización y redirección del CTA de bienvenida para invitados
  Dado que el usuario navega en el Home como Invitado
  Cuando observa la cabecera superior de la aplicación
  Entonces se muestra un botón prominente con el texto "Regístrate para empezar a usar la app"
  Y al presionar dicho botón, la app navega a la pantalla de Registro de Ciudadano en menos de 150 ms.
```

---

### HU-INV-03 & RF-AUT-08: Interceptor y Guardián de Rutas Protegidas (Auth Gate)
- **Historia de Usuario:**
  > **Como** usuario invitado,  
  > **quiero** recorrer libremente la aplicación y ver los productos de la tienda,  
  > **para** explorar el sistema antes de registrarme, sabiendo que si intento reportar un foco o canjear un producto se me solicitará autenticarme.
- **Reglas de Negocio y Puntos de Intercepción:**
  - El usuario puede navegar libremente entre la pestaña **Home** y la pestaña **Tienda Ecológica** (modo lectura).
  - El sistema intercepta de forma reactiva en `< 100 ms` las siguientes 4 acciones:
    1. Presionar el botón central flotante de la barra de navegación: **Cámara / Reportar Foco**.
    2. Presionar el botón **"Agregar al Carrito"** en cualquier tarjeta o detalle de producto.
    3. Presionar la pestaña **Perfil** o el icono de **Historial de Reportes**.
    4. Tocar el icono de **Carrito de Compras** en la cabecera.
- **Mensaje y Presentación en UI:**
  - Se despliega un modal centrado con fondo semitransparente oscuro (`rgba(0,0,0,0.6)`).
  - Título del modal: `"Acción protegida"`.
  - Mensaje exacto: `"Debes registrarte o iniciar sesión para poder reportar focos ambientales y canjear premios ecológicos."`.
  - Botón primario: `"Crear Cuenta"` (navega a `RegisterScreen`).
  - Botón secundario: `"Ya tengo cuenta"` (navega a `LoginScreen`).
  - Botón terciario / cerrar: `"Continuar como Invitado"` (cierra el modal y mantiene al usuario en la pantalla actual).

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Intercepción de intento de reporte por usuario invitado
  Dado que un usuario navega en modo Invitado
  Cuando presiona el botón central de Cámara / Reportar
  Entonces la cámara del dispositivo NO se abre
  Y se despliega en menos de 100 ms el modal "Acción protegida" con el mensaje "Debes registrarte o iniciar sesión para poder reportar focos ambientales y canjear premios ecológicos."
  Y la aplicación no sufre congelamientos ni pantallas en blanco.
```

---

### RF-AUT-01 & RF-AUT-02: Registro Ciudadano con Validaciones Exhaustivas
- **Historia de Usuario:**
  > **Como** vecino de la comunidad,  
  > **quiero** registrarme ingresando mis datos personales,  
  > **para** obtener una cuenta ciudadana con saldo inicial de 0 ecopuntos y comenzar a reportar incidentes.
- **Tabla de Campos, Reglas de Validación y Mensajes de Error Exactos:**

| Campo | Tipo / Entrada | Regla de Validación | Mensaje de Error Exacto | Ubicación y Comportamiento en UI |
| :--- | :--- | :--- | :--- | :--- |
| **Nombre Completo** | Texto (`string`) | Requerido. Mínimo 3 caracteres, máximo 80 caracteres. Solo letras y espacios. | `"El nombre completo es requerido y debe tener al menos 3 caracteres."` | Texto en color rojo `#D32F2F` inmediatamente debajo del campo `input`. El borde del campo cambia a rojo. |
| **Correo Electrónico** | Texto (`string`) | Requerido. Expresión regular RFC 5322: `^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$`. | `"El correo electrónico no es válido."` | Texto en rojo debajo del input al desenfocar o intentar enviar. |
| **Correo Duplicado** | Validación Backend | Si el email ya existe en la base de datos municipal (`users.email`). | `"El correo electrónico ya se encuentra registrado."` | Modal de alerta emergente con botón "Aceptar" y foco devuelto al campo correo. Código HTTP 409 Conflict. |
| **Contraseña** | Clave oculta (`string`) | Requerido. Longitud mínima de 6 caracteres. | `"La contraseña debe tener al menos 6 caracteres."` | Texto en rojo bajo el input de contraseña. |
| **Confirmar Contraseña** | Clave oculta (`string`) | Requerido. Debe coincidir exactamente con el valor del campo `Contraseña`. | `"Las contraseñas no coinciden."` | Texto en rojo debajo del input de confirmación. |

- **Flujo de Ejecución y Feedback Transaccional:**
  1. Al presionar el botón `"Registrarme"`, si hay errores de validación local, se detiene la ejecución inmediatamente y se muestra el primer campo con error.
  2. Si pasa las validaciones locales, se dispara el modal bloqueante `TransactionLoaderModal` con el texto `"Creando tu cuenta de EcoAlerta..."`.
  3. El backend procesa `POST /api/auth/register`, encripta la clave mediante `bcrypt`, crea el usuario con rol `CITIZEN` y saldo `puntos = 0`.
  4. **Éxito (HTTP 201):** Devuelve `{ success: true, token, user }`. Se oculta el spinner, se guarda el token en `AsyncStorage`, se emite un toast verde con `"¡Cuenta creada con éxito! Bienvenido a EcoAlerta"` y redirige al Home de Ciudadano.
  5. **Fallo (HTTP 400 / 409 / 500):** Se oculta el spinner, se preservan todos los campos del formulario intactos (excepto las claves) y se muestra el mensaje retornado por la API en un diálogo de error.

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Registro exitoso de ciudadano (Camino Feliz)
  Dado que el usuario completa el formulario con:
    | Nombre: "Juan Pérez" |
    | Correo: "juan.perez@example.com" |
    | Contraseña: "password123" |
    | Confirmar: "password123" |
  Cuando presiona el botón "Registrarme"
  Entonces se muestra el spinner bloqueante "Creando tu cuenta de EcoAlerta..."
  Y el backend responde con código HTTP 201 Created
  Y se asigna automáticamente el rol "CITIZEN" y un balance inicial de 0 puntos
  Y el usuario aterriza en el Home Ciudadano visualizando su nombre "Juan Pérez" y saldo "0 pts".

Escenario: Intento de registro con contraseñas que no coinciden (Negativo)
  Dado que el usuario completa "password123" en Contraseña y "password999" en Confirmar Contraseña
  Cuando intenta presionar "Registrarme"
  Entonces la solicitud HTTP NO es enviada al servidor
  Y se visualiza el texto en rojo "Las contraseñas no coinciden." debajo del campo de confirmación.
```

---

### RF-AUT-03 & RF-AUT-04: Login Multi-Rol y Enrutamiento Dinámico
- **Historia de Usuario:**
  > **Como** usuario registrado (Ciudadano, Agente de Campo, Administrador o Colaborador),  
  > **quiero** iniciar sesión con mis credenciales,  
  > **para** acceder al panel y herramientas correspondientes a mis privilegios dentro del municipio.
- **Tabla de Enrutamiento y Roles (RBAC):**

| Rol de Usuario | Pantalla de Destino | Capacidades y Restricciones Principales |
| :--- | :--- | :--- |
| **`CITIZEN`** (Ciudadano) | `CitizenHomeScreen` | Visualiza ecopuntos reales, botón de reportar habilitado, historial de reportes propios y catálogo con carrito activo. |
| **`AGENT`** (Inspector de Campo) | `AgentHomeScreen` | Bandeja de incidentes aprobados en bolsa, toma de caso 1 a 1, formulario de verificación in situ e informe de saneamiento. **Prohibido** canjear productos o asignarse puntos. |
| **`ADMIN`** (Administrador Municipal) | `AdminDenunciasScreen` | Bandeja de triaje inicial, asignación de prioridad, acreditación atómica de puntos, panel de certificación comparativa Antes/Después y ABM de productos. |
| **`COLLABORATOR`** (Operador de Entrega) | `CollaboratorDeliveryScreen` | Buscador de `codigoRetiro`, validación de documentos y marcación de retiro presencial de premios ecológicos. |

- **Validación de Credenciales Inválidas:**
  - Si el email no existe o la contraseña es incorrecta:
  - Backend responde: HTTP 401 Unauthorized `{ success: false, message: "Credenciales inválidas" }`.
  - Frontend oculta el spinner y despliega el mensaje exacto: `"El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos."` en un cuadro de advertencia superior.

---

## 🌿 MÓDULO 2: CICLO DE VIDA COMPLETO DEL REPORTE AMBIENTAL

---

### HU-03 & RF-REP-01 a 05: Creación de Reporte Ciudadano con Multimedia y GPS
- **Historia de Usuario:**
  > **Como** ciudadano autenticado,  
  > **quiero** reportar un basural o foco de dengue tomando una foto y capturando mi ubicación GPS,  
  > **para** que el municipio envíe inspectores a verificar y limpiar la zona, acumulando puntos cuando se valide.
- **Tabla de Validaciones de Reporte:**

| Elemento | Regla de Validación | Mensaje de Error Exacto | Comportamiento UI / Backend |
| :--- | :--- | :--- | :--- |
| **Categoría** | Requerido. Debe ser una de: `BASURAL`, `DENGUE`, `TERRENO_BALDIO`, `OTRO`. | `"Debes seleccionar una categoría para el reporte."` | Borde rojo en el selector de categoría. |
| **Fotografía** | Requerido. 1 foto obligatoria tomada con cámara o galería. | `"Es obligatorio adjuntar una fotografía como evidencia."` | Alerta modal informativa. |
| **Tamaño Fotografía** | **Compresión obligatoria a `< 1.2 MB`** y resolución máx. 1080px. Si la imagen procesada supera 1.2 MB. | `"La imagen seleccionada supera el límite de 1.2 MB. Intenta tomar una nueva foto."` | `imageCompressor.ts` procesa el buffer. Si falla, impide el envío. |
| **Ubicación GPS** | Coordenadas obligatorias (`latitud`, `longitud` numéricas no nulas) y `direccion` manual mínima de 5 caracteres. | `"No se pudo obtener la ubicación GPS actual. Activa el servicio de localización."` / `"Ingresa una dirección de referencia de al menos 5 caracteres."` | Botón "Reintentar GPS" y campo de texto con validación inline. |

- **Regla Fundamental de Puntos:**
  - Al crearse el reporte, el estado inicial es `PENDIENTE` (`REPORTADO`).
  - **Saldo de puntos asignado al reporte:** `0 puntos`. No se acredita ningún punto al ciudadano en este momento para prevenir fraudes.

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Creación exitosa de reporte con imagen comprimida (Camino Feliz)
  Dado que un ciudadano con sesión activa completa:
    | Categoría: "BASURAL" |
    | Foto: Captura de cámara (original 4.5 MB) |
    | GPS: Lat -34.4586, Lng -58.9142 |
    | Dirección: "Calle Rivadavia 450, Pilar" |
  Cuando presiona el botón "Enviar Reporte"
  Entonces el módulo cliente comprime automáticamente la foto a 840 KB (< 1.2 MB)
  Y se muestra el TransactionLoaderModal con "Enviando tu reporte ambiental..."
  Y el backend responde con código HTTP 201 Created devolviendo el código "REP-2026-089"
  Y el reporte se guarda en estado "PENDIENTE" con 0 puntos asignados.
```

---

### HU-05 & RF-ADM-01 a 03b: Triaje Administrativo y Control de Disponibilidad
- **Historia de Usuario:**
  > **Como** administrador municipal,  
  > **quiero** evaluar los reportes pendientes para clasificar su prioridad o descartar bromas,  
  > **para** asegurar que los inspectores atiendan incidentes reales organizados por urgencia.
- **Reglas de Negocio:**
  - **Rechazo / Falso Reporte:** El Admin debe ingresar obligatoriamente una justificación en `observacionesAdmin` (mínimo 10 caracteres). Si está vacía, el sistema muestra: `"Debes ingresar el motivo del rechazo del reporte."`. El estado pasa a `RECHAZADO` y se asignan `0 puntos`.
  - **Aprobación en Bolsa:** El Admin selecciona la prioridad entre: `BAJA`, `MEDIA`, `ALTA`, `URGENTE`. Pasa a estado `APROBADO` (visible en bolsa de casos).
  - **Asignación Directa y Control de Disponibilidad (`RF-ADM-03b`):**
    - Si el Admin intenta asignar directamente a un inspector no disponible (`agente.disponible === false`), el sistema rechaza la operación con código HTTP 400 y mensaje exacto: `"Agente no disponible"`.
    - Si no hay ningún agente disponible en el municipio, se despliega: `"No hay inspectores disponibles en el municipio en este momento."`.

---

### HU-08 & RF-AGE-01 a 04: Toma de Caso con Bloqueo Transaccional Atómico (1 a 1)
- **Historia de Usuario:**
  > **Como** agente de campo en servicio,  
  > **quiero** seleccionar un caso aprobado de la bolsa y tomarlo,  
  > **para** desplazarme al lugar a verificar el incidente sin que otro agente tome el mismo caso.
- **Reglas de Negocio y Control de Concurrencia:**
  - La bolsa muestra casos ordenados por severidad: Rojo (`URGENTE`), Naranja (`ALTA`), Amarillo (`MEDIA`), Verde (`BAJA`).
  - Al pulsar `"Tomar Caso"`, se ejecuta una transacción atómica (`prisma.$transaction`):
    - Verifica que el caso siga en estado `APROBADO` o `EN_SANEAMIENTO` (sin agente asignado).
    - Verifica que el agente actual NO tenga ya otro caso activo en estado `EN_VERIFICACION` o `EN_SANEAMIENTO`. Si ya tiene uno activo, el sistema bloquea con: `"Ya tienes un caso activo asignado. Debes completarlo o liberarlo antes de tomar uno nuevo."`.
    - Si dos agentes presionan `"Tomar Caso"` al mismo tiempo sobre el mismo incidente, la transacción del primero tiene éxito (asigna `agenteId`, pasa a `EN_VERIFICACION`), mientras que la del segundo falla inmediatamente con HTTP 409 Conflict y mensaje: `"El caso ya ha sido tomado por otro inspector."`.

---

### HU-09 & RF-AGE-05 a 06: Verificación In Situ y Protocolo de 3 Intentos por Inaccesibilidad
- **Historia de Usuario:**
  > **Como** agente de campo en el lugar del hecho,  
  > **quiero** registrar los resultados de la inspección con fotografía geolocalizada,  
  > **para** constatar la veracidad del foco ambiental o registrar la imposibilidad física de acceder.
- **Tres Vías de Inspección:**
  1. **Caso A — Foco Real Confirmado:**
     - El agente sube foto de contraprueba (`fotoVerificacionUrl`).
     - El caso pasa a estado `VERIFICADO_PENDIENTE`. El agente queda a la espera de validación de puntos por el Admin o continúa con el saneamiento.
  2. **Caso B — Falsa Alarma en Terreno:**
     - El agente sube foto del terreno limpio o sin anomalías y selecciona `"Reporte Falso"`.
     - El caso pasa a `RECHAZADO`, se cierra con 0 puntos y se notifica al ciudadano.
  3. **Caso C — Inaccesibilidad Física (Portón cerrado / Zona inaccesible):**
     - El agente captura foto del sticker o aviso oficial pegado en el portón o acceso (`fotoVerificacionUrl`).
     - Se incrementa el contador `intentosInaccesible` (1, 2 o 3).
     - **Regla de 3 Intentos:**
       - *Intento 1 y 2:* El caso se libera de vuelta a la bolsa con estado `APROBADO`, registrando la visita fallida.
       - *Intento 3:* Al fallar la tercera visita (`intentosInaccesible === 3`), el sistema pasa el caso a estado definitivo `CERRADO_INACCESIBLE`. Se deriva automáticamente a intimación legal municipal sin penalizar el historial del ciudadano.

---

### RF-ADM-04 a 05: Validación de Veracidad y Acreditación Atómica de Ecopuntos
- **Historia de Usuario:**
  > **Como** administrador municipal,  
  > **quiero** auditar la verificación del agente y acreditar los puntos al ciudadano denunciante,  
  > **para** recompensar su compromiso ambiental según la gravedad del problema detectado.
- **Baremo Oficial de Puntos por Prioridad:**

| Prioridad del Incidente | Rango de Ecopuntos Permitido | Valor Nominal Sugerido | Justificación de Impacto Ambiental |
| :---: | :---: | :---: | :--- |
| **`BAJA`** | 50 a 80 puntos | 60 pts | Microbasural menor en vereda o ramas secas. |
| **`MEDIA`** | 100 a 150 puntos | 120 pts | Acumulación de residuos en esquina o zanja. |
| **`ALTA`** | 200 a 300 puntos | 250 pts | Foco de dengue con recipientes y agua estancada. |
| **`URGENTE`** | 350 a 500 puntos | 400 pts | Basural clandestino a cielo abierto o peligro químico. |

- **Regla de Acreditación Atómica (`prisma.$transaction`):**
  - Si el Admin ingresa un valor fuera del rango permitido, el sistema muestra: `"El puntaje para prioridad [X] debe estar comprendido entre [Min] y [Max] puntos."`.
  - La transacción suma `puntos` al registro del `User` ciudadano, crea un movimiento de auditoría en `PuntosHistory`, guarda `puntosOtorgados` en la denuncia y pasa el caso a `EN_SANEAMIENTO`.

---

### HU-10 / RF-AGE-07 & RF-ADM-06: Abandono / Liberación y Desasignación de Caso
- **Reglas de Retorno a Bolsa General:**
  - Si un agente presiona `"Liberar Caso"` por rotura de móvil o emergencia (o el Admin pulsa `"Forzar Desasignación"`):
  - El campo `agenteId` pasa a `null`.
  - **Si el caso NO estaba verificado:** Vuelve a estado `APROBADO`.
  - **Si el caso YA estaba verificado y validado (puntos ya cobrados por el vecino):** Vuelve a la bolsa en estado `EN_SANEAMIENTO`. Cuando un nuevo agente lo tome, el sistema lo dirige directamente a la pantalla de limpieza y foto final, sin exigir reverificar lo ya aprobado.

---

### HU-11 / RF-AGE-08 & RF-ADM-07 a 08: Saneamiento Técnico y Doble Certificación Antes vs Después
- **Saneamiento Técnico por Agente:**
  - Obligatorio subir foto de resolución limpia (`fotoSolucionUrl`) y texto de informe (`informeSolucion` con mínimo 10 caracteres).
  - Pasa a `RESUELTO_TECNICO`. El agente queda libre para tomar otro caso.
- **Doble Certificación por Admin:**
  - La interfaz de auditoría presenta ambas imágenes en paralelo: **Foto Inicial "Antes" (Reporte) vs Foto Final "Después" (Saneamiento)**.
  - **Acción A — Rechazar Saneamiento:** El Admin pulsa `"Observar Limpieza"`, ingresa notas técnicas en `observacionesAdmin` y el caso regresa a `EN_SANEAMIENTO` para que el inspector subsane los residuos faltantes.
  - **Acción B — Certificación Definitiva:** El Admin pulsa `"Certificar y Cerrar Caso"`. Pasa a `RESUELTO` definitivo y se envía notificación push de agradecimiento al vecino.

---

### RF-REP-06 a 07: Soft Delete Ciudadano (Archivado Visual de Denuncias)
- **Regla:** Cuando un ciudadano cobra sus puntos o el caso finaliza, puede pulsar el icono de papelera en su lista de reportes.
- **Comportamiento:** Se actualiza `ocultarUsuario = true`. El reporte desaparece inmediatamente de la lista móvil del vecino, pero permanece 100% visible e intacto en el panel municipal y en los reportes estadísticos de gestión.

---

## 🛒 MÓDULO 3: TIENDA ECOLÓGICA, CARRITO, CHECKOUT CON RESERVA TTL Y ENTREGA

---

### RF-TIE-01: ABM de Catálogo Municipal por Administrador
- El Admin puede crear y actualizar productos (Nombre, Descripción, Categoría, Precio en Ecopuntos, Stock Físico, Imagen URL).
- **Baja Lógica Obligatoria:** No se permite eliminar físicamente un producto de la base de datos si tiene canjes históricos asociados. Se actualiza `activo = false` para retirarlo de la tienda pública sin corromper la integridad referencial.

---

### RF-TIE-02 a 03: Catálogo, Buscador y Carrito Reactivo
- Lista de productos activos (`activo = true`) con buscador en vivo y filtros por categoría.
- Al agregar un ítem, el carrito calcula en tiempo real:  
  $$\text{TotalPuntos} = \sum (\text{Cantidad} \times \text{PrecioUnitarioPuntos})$$
- Si la cantidad seleccionada excede el stock disponible, el botón `+` se deshabilita y muestra un aviso contextual: `"Máximo stock disponible alcanzado"`.
- Los ítems del carrito persisten localmente en `AsyncStorage` ante cierres imprevistos de la aplicación.

---

### HU-08 & RF-TIE-04 a 05: Checkout con Bloqueo Temporal de Stock por 5 Minutos (TTL)
- **Historia de Usuario:**
  > **Como** ciudadano con ecopuntos acumulados,  
  > **quiero** confirmar el canje de mis productos seleccionando un punto de retiro municipal,  
  > **para** asegurar mis artículos durante 5 minutos mientras completo la solicitud sin riesgo de sobreventa.
- **Reglas Críticas de Validación y Concurrencia:**
  1. **Validación de Saldo:** Se evalúa `puntosUsuario >= TotalPuntosCarrito`. Si el saldo es insuficiente, el botón de confirmación se bloquea y se muestra en color rojo: `"Puntos insuficientes. Te faltan [X] puntos para este canje."`.
  2. **Revalidación de Precios en BD:** Antes de confirmar, el backend revalida los precios unitarios actuales en la tabla `Product` para descartar alteraciones locales de precios.
  3. **Reserva Temporal de Stock (TTL de 5 Minutos):**
     - Al abrir la pantalla de Checkout, se registra un bloqueo provisional en la tabla de productos: `estado: RESERVADO_PENDIENTE`, `bloqueadoHasta: now() + 5 minutos`.
     - Si pasan los 5 minutos sin que el usuario confirme, o si el usuario cancela la orden, el sistema libera la reserva y restaura el stock al catálogo público.
  4. **Punto de Retiro Municipal:** El usuario debe seleccionar una sucursal habilitada. La pantalla muestra el aviso destacado: `"Tu pedido estará listo para retiro presencial a partir de las 48 horas hábiles posteriores a la confirmación."`.
  5. **Confirmación Final Atómica (`prisma.$transaction`):**
     - Descuenta los puntos de la cuenta del ciudadano.
     - Reduce definitivamente el inventario físico en stock.
     - Pasa la reserva de `RESERVADO_PENDIENTE` a `CONFIRMADO`.
     - Vacía el carrito local.
     - Genera un código de retiro alfanumérico único en formato: `ECO-XXXX-X` (ej. `ECO-8392-B`).
     - Calcula `fechaExpiracion = now() + 30 días corridos`.

#### Criterios de Aceptación (Gherkin BDD)
```gherkin
Escenario: Canje exitoso con reserva de stock y emisión de código de retiro (Camino Feliz)
  Dado que un ciudadano tiene 500 puntos en su saldo
  Y tiene en su carrito 1 "Botella Térmica" de 250 puntos (stock disponible = 3)
  Cuando accede al Checkout y selecciona la sucursal "Palacio Municipal Pilar"
  Entonces el sistema reserva temporalmente 1 unidad por 5 minutos
  Y al presionar "Confirmar Canje" se descuentan 250 puntos (saldo final: 250 pts)
  Y se emite el comprobante con el código "ECO-4912-K" con vigencia de 30 días
  Y el carrito de compras queda completamente vacío.

Escenario: Intento de canje con saldo de puntos insuficiente (Negativo)
  Dado que un ciudadano posee 80 ecopuntos
  Y tiene en su carrito un producto de 150 ecopuntos
  Cuando ingresa a la vista de Checkout
  Entonces el botón "Confirmar Canje" se encuentra inhabilitado (disabled)
  Y se despliega el mensaje exacto "Puntos insuficientes. Te faltan 70 puntos para este canje."
```

---

### RF-COL-01: Panel de Colaborador y Retiro Presencial de Premios
- **Historia de Usuario:**
  > **Como** colaborador de entrega municipal en la sucursal,  
  > **quiero** buscar los pedidos mediante el código de retiro presentado por el vecino,  
  > **para** validar su identidad, entregar los artículos y actualizar el sistema.
- **Validaciones de Búsqueda:**

| Dato Ingresado | Estado en BD | Mensaje de Error / Feedback en Pantalla |
| :--- | :--- | :--- |
| Código inexistente (ej. `ECO-0000-Z`) | No existe en BD | `"El código de retiro no existe. Por favor, verifica los caracteres con el vecino."` (Banner rojo superior). |
| Pedido ya entregado | `estado === ENTREGADO` | `"Este canje ya fue retirado el día [Fecha] a las [Hora]."` (Banner amarillo advertencia). |
| Pedido expirado | `estado === EXPIRADO` | `"Este canje se encuentra vencido por haber superado el plazo de 30 días corridos."` |
| Código válido y pendiente | `estado === CONFIRMADO` | Muestra tarjeta con Nombre del titular, DNI, lista de productos entregables y botón `"Confirmar Entrega Presencial"`. |

- **Acción de Entrega:** Al presionar `"Confirmar Entrega Presencial"`, el pedido pasa a `ENTREGADO`, se registra `fechaEntrega = now()`, `entregadoPor = collaboratorId` y se emite constancia digital.

---

### RF-TIE-06: Expiración Automática de Canjes a los 30 Días
- Si un pedido con código emitido no es retirado en un plazo de **30 días corridos**:
- El proceso batch / cron actualiza el estado a `EXPIRADO` (`CANCELADO`).
- **Devolución de Stock:** Las unidades físicas reservadas se reincorporan automáticamente al inventario disponible para la venta.
- **Política de Ecopuntos:** **Los puntos NO son reembolsados** a la cuenta del ciudadano (penalización por lucro cesante del stock inmovilizado).

---

## ⚙️ REQUISITOS NO FUNCIONALES (RNF)

| ID | Nombre | Especificación Métrica y Comportamiento Esperado |
| :---: | :--- | :--- |
| **RNF-01** | **Rendimiento y Latencia** | Operaciones de persistencia local en `AsyncStorage` deben completarse en `< 300 ms`. Consultas a la API REST bajo condiciones normales deben responder en `< 600 ms`. |
| **RNF-02** | **Compresión Multimedia** | Toda fotografía capturada por cámara o seleccionada de la galería debe ser procesada por `imageCompressor.ts` reduciendo su peso obligatoriamente a `< 1.2 MB` y dimensiones máximas de 1080px antes de transmitirse al backend. |
| **RNF-03** | **Atomicidad Concurrente** | Las operaciones críticas (toma de caso de agente, acreditación de puntos a ciudadanos y reserva/confirmación de stock en Checkout) deben ejecutarse bajo transacciones atómicas aisladas (`prisma.$transaction`) con rollback automático ante cualquier fallo. |
| **RNF-07** | **Seguridad de Credenciales** | Ninguna contraseña se almacenará en texto plano; deben ser encriptadas con algoritmo `bcrypt` (mínimo salt factor 10). La transmisión de datos debe realizarse mediante HTTPS/TLS con tokens JWT firmados. |
| **RNF-09** | **Onboarding y Guardián de Invitado** | El cold start de la app en modo Invitado debe mostrar el Home en `< 300 ms` sin exigir login previo. El interceptor de rutas protegidas (*Auth Gate*) debe disparar el modal informativo en `< 100 ms`. |
| **RNF-10** | **Feedback Visual y Modal Transaccional Bloqueante** | **1. Mutaciones a BD:** Cualquier petición de escritura a la base de datos (crear reporte, triaje, tomar/liberar caso, verificar, certificar, canjear, entregar) DEBE desplegar de forma reactiva en el ms 0 el componente `TransactionLoaderModal` bloqueando cualquier toque repetido del usuario. Si es exitosa, cierra el modal y muestra confirmación; si falla, cierra el modal manteniendo el formulario intacto y desplegando el error.<br>**2. Listas y Filtros:** Cualquier cambio de chip o pestaña en listas con filtros debe mostrar inmediatamente un `ActivityIndicator` contextual hasta completar el renderizado. |
