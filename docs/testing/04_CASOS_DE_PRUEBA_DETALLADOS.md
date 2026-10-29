# 🧪 ESPECIFICACIÓN DETALLADA DE CASOS DE PRUEBA (TEST CASES)
## Proyecto: EcoAlerta — Aplicación Móvil de Gestión Ambiental Ciudadana y Tienda de Recompensas
**Cátedra:** Testing & Calidad de Software — UNPilar 2026  
**Profesor:** Mg. Pedro Brest  
**Equipo de Proyecto (5 integrantes):**  
- **Escobar Raul** (Scrum Master - Aprobador y Auditor de Testware)  
- **Benitez Facundo** (Analista de QA - Diseñador y Ejecutor de Casos de Prueba)  
- **Rodriguez Iván** (Desarrollador FrontEnd - Pantallas Móviles y Corrección de Bugs UI)  
- **Benitez Angel** (Desarrollador BackEnd - API REST, Concurrencia y Corrección de Bugs Server)  
- **Kuhn Joaquin** (Diseñador UI/UX - Maquetación y Usabilidad)  
**Estándar:** IEEE 829 / ISO/IEC/IEEE 29119 Test Documentation  
**Versión:** 2.0 (Exactitud Milimétrica sin Ambigüedades)  

---

## 🔐 MÓDULO 1: AUTENTICACIÓN, MODO INVITADO, CUENTAS Y ROLES (RBAC)
**Responsables Técnicos de Corrección:** **Rodriguez Iván** (FrontEnd) / **Benitez Angel** (BackEnd)

---

### CP-RF-AUT-01-01: Registro Ciudadano Exitoso (Camino Feliz)
- **ID Requisito / HU:** `RF-AUT-01` / `HU-01`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest / Jest
- **Precondiciones:**
  1. Base de datos operativa con esquema Prisma migrado.
  2. No existe en la base de datos ningún usuario con el correo `"ciudadano.valido@ecoalerta.gob.ar"`.
- **Datos de Prueba:**
  ```json
  {
    "nombre": "Carlos Alberto Gómez",
    "email": "ciudadano.valido@ecoalerta.gob.ar",
    "password": "PasswordEco2026!"
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar una petición `POST` al endpoint `/api/auth/register` con el payload de datos de prueba en el cuerpo (JSON).
  2. Verificar el tiempo de respuesta del servidor.
  3. Inspeccionar el código de respuesta HTTP.
  4. Inspeccionar el cuerpo de la respuesta JSON.
  5. Consultar la tabla `User` en la base de datos mediante Prisma Studio o cliente SQL.
- **Resultado Esperado:**
  1. Código HTTP devuelto: `201 Created`.
  2. Cuerpo de la respuesta:
     ```json
     {
       "success": true,
       "message": "Usuario registrado exitosamente",
       "token": "[JWT_TOKEN_VALIDO]",
       "user": {
         "id": "uuid-generado",
         "nombre": "Carlos Alberto Gómez",
         "email": "ciudadano.valido@ecoalerta.gob.ar",
         "rol": "CITIZEN",
         "puntos": 0
       }
     }
     ```
  3. En la base de datos se crea el registro con: `rol = "CITIZEN"`, `puntos = 0`, y la contraseña se encuentra encriptada (`passwordHash` con hash bcrypt no legible).
  4. En la interfaz móvil: Despliegue de `TransactionLoaderModal` durante la petición; al recibir 201, se oculta el modal, se muestra toast de bienvenida y se redirige a `CitizenHomeScreen`.
- **Resultado Real:** Pasó de forma idéntica al resultado esperado.
- **Estado:** **Pasó**
- **Postcondiciones:** El usuario existe en BD y puede iniciar sesión inmediatamente.

---

### CP-RF-AUT-01-02: Rechazo de Registro por Correo Electrónico Duplicado (Negativa)
- **ID Requisito / HU:** `RF-AUT-02` / `HU-01`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Negativa) / Integración | **Herramienta:** Postman / Jest
- **Precondiciones:**
  1. Existe previamente en la base de datos un usuario registrado con el correo `"vecino.registrado@pilar.gob.ar"`.
- **Datos de Prueba:**
  ```json
  {
    "nombre": "Esteban Quito",
    "email": "vecino.registrado@pilar.gob.ar",
    "password": "ClaveSegura123!"
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/auth/register` con el correo duplicado.
  2. Analizar el código de estado y el mensaje de error de la API.
- **Resultado Esperado:**
  1. Código HTTP devuelto: `409 Conflict` (o `400 Bad Request` según middleware con código Prisma P2002).
  2. Cuerpo de la respuesta:
     ```json
     {
       "success": false,
       "message": "El correo electrónico ya se encuentra registrado."
     }
     ```
  3. En la UI móvil: Se oculta el spinner y se despliega un diálogo modal de alerta con título `"Registro Fallido"` y mensaje exacto: `"El correo electrónico ya se encuentra registrado."`. No se navega de pantalla y los datos quedan en el formulario.
- **Resultado Real:** Pasó según especificación.
- **Estado:** **Pasó**
- **Postcondiciones:** No se insertan registros duplicados en la tabla `User`.

---

### CP-RF-AUT-02-01: Validación de Formato de Email Regex en Formulario Móvil (UI)
- **ID Requisito / HU:** `RF-AUT-02`
- **Prioridad:** Alta
- **Tipo de Prueba:** UI / Validación | **Herramienta:** Jest (Testing Library) / Manual
- **Precondiciones:**
  1. Pantalla `RegisterScreen` abierta en dispositivo o emulador.
- **Datos de Prueba:**
  - Caso Inválido A: `"juanperez"` (sin arroba ni dominio).
  - Caso Inválido B: `"juan@com"` (sin TLD de dos letras).
  - Caso Inválido C: `"juan@dominio."` (punto al final sin extensión).
- **Pasos a Ejecutar:**
  1. Escribir en el campo `Correo Electrónico` el valor `"juanperez"`.
  2. Hacer clic fuera del campo (desenfocar / blur) o presionar `"Registrarme"`.
- **Resultado Esperado:**
  1. El campo `Correo Electrónico` cambia su color de borde a `#D32F2F` (rojo).
  2. Inmediatamente debajo del campo se muestra en texto rojo el mensaje exacto:
     `"El correo electrónico no es válido."`
  3. La petición HTTP hacia el servidor NO es disparada (validación en cliente antes de red).
- **Resultado Real:** Pasó satisfactoriamente.
- **Estado:** **Pasó**
- **Postcondiciones:** El formulario permanece en pantalla hasta que se ingrese un email válido.

---

### CP-RF-AUT-02-02: Validación de Discrepancia entre Contraseñas (UI)
- **ID Requisito / HU:** `RF-AUT-02`
- **Prioridad:** Alta
- **Tipo de Prueba:** UI / Validación | **Herramienta:** Jest / Manual
- **Precondiciones:** Pantalla `RegisterScreen` montada.
- **Datos de Prueba:**
  - Campo `Contraseña`: `"VerdeEco2026"`
  - Campo `Confirmar Contraseña`: `"VerdeEco2025"` (un carácter diferente).
- **Pasos a Ejecutar:**
  1. Ingresar `"VerdeEco2026"` en `Contraseña`.
  2. Ingresar `"VerdeEco2025"` en `Confirmar Contraseña`.
  3. Presionar el botón `"Registrarme"`.
- **Resultado Esperado:**
  1. No se envía ninguna solicitud al servidor.
  2. El borde del campo `Confirmar Contraseña` se torna rojo.
  3. Mensaje exacto en texto rojo bajo el input:
     `"Las contraseñas no coinciden."`
- **Resultado Real:** Pasó sin anomalías.
- **Estado:** **Pasó**
- **Postcondiciones:** No se altera el estado de la app.

---

### CP-RF-AUT-03-01: Login Exitoso con Credenciales Válidas y Emisión de JWT
- **ID Requisito / HU:** `RF-AUT-03`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Existe usuario con email `"maria.agente@pilar.gob.ar"`, clave encriptada de `"ClaveAgente1!"`, rol `AGENT`.
- **Datos de Prueba:**
  ```json
  {
    "identifier": "maria.agente@pilar.gob.ar",
    "password": "ClaveAgente1!"
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/auth/login` con el payload de datos.
  2. Verificar status code y tiempo de respuesta (< 600 ms).
  3. Decodificar el token JWT retornado y validar su contenido.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Respuesta JSON:
     ```json
     {
       "success": true,
       "token": "[JWT_SECRET_SIGNATURE]",
       "user": {
         "id": "uuid-agente",
         "nombre": "María Inspector",
         "email": "maria.agente@pilar.gob.ar",
         "rol": "AGENT"
       }
     }
     ```
  3. El token decodificado contiene `{ id, email, rol: "AGENT" }` y tiempo de expiración vigente.
- **Resultado Real:** Pasó correctamente.
- **Estado:** **Pasó**
- **Postcondiciones:** Token almacenado en cliente para autorizar peticiones subsiguientes.

---

### CP-RF-AUT-03-02: Login Fallido por Contraseña Incorrecta (Negativa)
- **ID Requisito / HU:** `RF-AUT-03`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Negativa) | **Herramienta:** Postman / Supertest
- **Precondiciones:** Existe usuario `"admin@pilar.gob.ar"`.
- **Datos de Prueba:**
  ```json
  {
    "identifier": "admin@pilar.gob.ar",
    "password": "ClaveEquivocada999"
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/auth/login`.
- **Resultado Esperado:**
  1. Código HTTP: `401 Unauthorized`.
  2. Respuesta JSON:
     ```json
     {
       "success": false,
       "message": "Credenciales inválidas"
     }
     ```
  3. En la interfaz móvil: Se oculta el spinner y se muestra un banner superior en rojo con el texto exacto:
     `"El correo electrónico o la contraseña son incorrectos. Por favor, verifica tus datos."`
- **Resultado Real:** Pasó según lo proyectado.
- **Estado:** **Pasó**
- **Postcondiciones:** Ninguna sesión es iniciada; el almacenamiento local permanece vacío.

---

### CP-RF-AUT-06-01: Arranque en Frío en Modo Invitado y Rendimiento (RNF-09)
- **ID Requisito / HU:** `HU-INV-01` / `RF-AUT-06` / `RNF-09`
- **Prioridad:** Alta
- **Tipo de Prueba:** UI / Rendimiento | **Herramienta:** Jest (RNTL) / Profiler
- **Precondiciones:**
  1. Aplicación instalada limpiamente; `AsyncStorage` vacío (`token === null`).
- **Pasos a Ejecutar:**
  1. Lanzar la aplicación desde estado frío (inicio de ciclo de vida).
  2. Medir el tiempo transcurrido desde el montaje inicial hasta el renderizado completo del Home.
- **Resultado Esperado:**
  1. El tiempo de renderizado es estrictamente inferior a `300 ms`.
  2. La vista desplegada es `CitizenHomeScreen` en Modo Invitado.
  3. No se visualiza pantalla intermedia de login ni alertas de sesión caducada.
  4. Se muestran las 3 tarjetas de onboarding explicativo: *Reportá*, *Saneamiento*, *Ecopuntos*.
- **Resultado Real:** Renderizado en 185 ms.
- **Estado:** **Pasó**
- **Postcondiciones:** Usuario en contexto de navegación pública.

---

### CP-RF-AUT-08-01: Intercepción Auth Gate al Presionar Cámara / Reportar Foco (Seguridad)
- **ID Requisito / HU:** `HU-INV-03` / `RF-AUT-08` / `RNF-09`
- **Prioridad:** Alta
- **Tipo de Prueba:** Seguridad / UI | **Herramienta:** Jest / Manual
- **Precondiciones:**
  1. Usuario navegando en Modo Invitado.
- **Pasos a Ejecutar:**
  1. En la barra de navegación inferior, presionar el botón central flotante con ícono de cámara: `"Reportar"`.
  2. Medir el tiempo de despliegue del modal protector.
- **Resultado Esperado:**
  1. El hardware de la cámara NO es invocado ni se solicitan permisos del sistema operativo.
  2. En un tiempo inferior a `100 ms`, se despliega el modal centrado con fondo oscuro:
     - Título: `"Acción protegida"`
     - Mensaje literal: `"Debes registrarte o iniciar sesión para poder reportar focos ambientales y canjear premios ecológicos."`
     - Botón 1: `"Crear Cuenta"` (al presionarlo abre `RegisterScreen`).
     - Botón 2: `"Ya tengo cuenta"` (al presionarlo abre `LoginScreen`).
     - Botón 3: `"Continuar como Invitado"` (al presionarlo cierra el modal).
- **Resultado Real:** Modal desplegado en 42 ms sin abrir hardware.
- **Estado:** **Pasó**
- **Postcondiciones:** La aplicación permanece estable sin crasheos.

---

### CP-RF-AUT-08-02: Intercepción Auth Gate al Pulsar "Agregar al Carrito" en Tienda
- **ID Requisito / HU:** `HU-INV-03` / `RF-AUT-08`
- **Prioridad:** Alta
- **Tipo de Prueba:** Seguridad / UI | **Herramienta:** Jest / Manual
- **Precondiciones:**
  1. Usuario invitado navegando en la pestaña `Tienda Ecológica`.
- **Pasos a Ejecutar:**
  1. Tocar una tarjeta de producto (ej. `"Gorra de Algodón Reciclado"`).
  2. Presionar el botón verde `"Agregar al Carrito"`.
- **Resultado Esperado:**
  1. El ítem NO se agrega al carrito local ni se incrementa el contador de la cabecera.
  2. Se despliega inmediatamente el modal `"Acción protegida"` con el mensaje exacto:
     `"Debes registrarte o iniciar sesión para poder reportar focos ambientales y canjear premios ecológicos."`
- **Resultado Real:** Pasó sin fallos.
- **Estado:** **Pasó**
- **Postcondiciones:** El carrito permanece con 0 artículos.

---

## 🌿 MÓDULO 2: CICLO DE VIDA DEL REPORTE AMBIENTAL
**Responsables Técnicos de Corrección:**
- Creación, Cámara y GPS: **Rodriguez Iván** (FrontEnd) / **Kuhn Joaquin** (UI/UX)
- Triaje, Asignación y Visitas: **Benitez Angel** (BackEnd) / **Rodriguez Iván** (FrontEnd)
- Puntos, Saneamiento y Certificación: **Benitez Angel** (BackEnd)

---

### CP-RF-REP-01-01: Creación Exitosa de Reporte Ciudadano con GPS y Multimedia (Camino Feliz)
- **ID Requisito / HU:** `HU-03` / `RF-REP-01` / `RF-REP-04`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Ciudadano con sesión activa y token válido en cabecera `Authorization: Bearer [TOKEN]`.
- **Datos de Prueba:**
  ```json
  {
    "categoria": "BASURAL",
    "descripcion": "Microbasural clandestino con neumáticos en zanja comunitaria.",
    "fotoUrl": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
    "latitud": -34.45862,
    "longitud": -58.91421,
    "direccion": "Calle Las Palmeras 1230, Villa Morra, Pilar"
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/denuncias` con el payload indicado.
- **Resultado Esperado:**
  1. Código HTTP: `201 Created`.
  2. Cuerpo de la respuesta:
     ```json
     {
       "success": true,
       "message": "Reporte creado exitosamente",
       "data": {
         "id": "uuid-reporte",
         "codigo": "REP-2026-0045",
         "categoria": "BASURAL",
         "estado": "PENDIENTE",
         "puntosOtorgados": 0,
         "creadoEn": "2026-10-26T20:00:00.000Z"
       }
     }
     ```
  3. En la base de datos: Se crea el registro con `estado = "PENDIENTE"`, `puntosOtorgados = 0` y `agenteId = null`.
  4. En la interfaz móvil: Se visualiza el `TransactionLoaderModal` con `"Enviando tu reporte ambiental..."`. Al recibir 201, se cierra el modal y se muestra un banner verde: `"¡Reporte recibido! Gracias por cuidar tu barrio. Código: REP-2026-0045"`.
- **Resultado Real:** Pasó de acuerdo a lo especificado.
- **Estado:** **Pasó**
- **Postcondiciones:** El reporte queda en estado PENDIENTE a la espera de triaje del Admin.

---

### CP-RF-REP-02-01: Compresión de Imagen de Alta Resolución a Buffer `< 1.2 MB` (RNF-02)
- **ID Requisito / HU:** `RF-REP-02` / `RNF-02`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Unitario / Rendimiento | **Herramienta:** Jest
- **Precondiciones:**
  1. Archivo de imagen simulado en memoria con tamaño original de `4.85 MB` (resolución 4000x3000px).
- **Pasos a Ejecutar:**
  1. Invocar la función `compressImage(fileBuffer, { maxSizeMB: 1.2, maxWidth: 1080 })` del módulo `imageCompressor.ts`.
  2. Medir el peso del buffer resultante y sus dimensiones en píxeles.
- **Resultado Esperado:**
  1. El peso del buffer comprimido es estrictamente inferior a `1.2 MB` (1.258.291 bytes).
  2. El ancho máximo no excede los `1080px`.
  3. La relación de aspecto se mantiene inalterada sin deformación visual.
- **Resultado Real:** Tamaño resultante: 865 KB (0.84 MB). Ancho: 1080px.
- **Estado:** **Pasó**
- **Postcondiciones:** La imagen está lista para transmisión segura sin provocar sobrecarga de red.

---

### CP-RF-REP-06-01: Soft Delete Visual de Reporte por Ciudadano (Archivado)
- **ID Requisito / HU:** `HU-VEC01` / `RF-REP-06` / `RF-REP-07`
- **Prioridad:** Media
- **Tipo de Prueba:** Funcional / BD | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Existe un reporte `"REP-2026-0012"` perteneciente al ciudadano `user-1`.
  2. El caso ya fue saneado y los puntos fueron cobrados por el vecino.
- **Pasos a Ejecutar:**
  1. El ciudadano presiona el icono de papelera / archivar en la tarjeta del reporte.
  2. Se envía la solicitud `PATCH /api/denuncias/REP-2026-0012/ocultar` con el token de `user-1`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Respuesta JSON: `{ "success": true, "message": "Reporte archivado de tu lista" }`.
  3. En la base de datos: El registro físico NO se elimina. El campo `ocultarUsuario` pasa de `false` a `true`.
  4. En la app móvil del ciudadano: El ítem desaparece de la pantalla `MisReportesScreen`.
  5. En el panel del Administrador: El reporte se sigue visualizando completo para fines de auditoría estadística municipal.
- **Resultado Real:** Registro archivado visualmente sin eliminación física.
- **Estado:** **Pasó**
- **Postcondiciones:** Integridad de datos históricos preservada.

---

### CP-RF-ADM-01-01: Triaje Administrativo — Aprobación en Bolsa General con Prioridad
- **ID Requisito / HU:** `HU-05` / `RF-ADM-01`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0020"` en estado `PENDIENTE`.
  2. Usuario con rol `ADMIN` autenticado.
- **Datos de Prueba:**
  ```json
  {
    "accion": "APROBAR",
    "prioridad": "ALTA",
    "observacionesAdmin": "Foco verificado preliminarmente por cercanía a escuela provincial."
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/denuncias/REP-2026-0020/triaje`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. El estado del reporte cambia a `APROBADO`.
  3. El campo `prioridad` queda configurado en `ALTA`.
  4. El reporte ingresa de inmediato a la bolsa general visible por todos los inspectores de campo.
- **Resultado Real:** Pasó según lo planificado.
- **Estado:** **Pasó**
- **Postcondiciones:** Reporte disponible para toma de inspectores.

---

### CP-RF-ADM-02-01: Triaje Administrativo — Rechazo de Reporte Improcedente con Motivo
- **ID Requisito / HU:** `HU-05` / `RF-ADM-02`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Negativa de Negocio) | **Herramienta:** Postman / Supertest
- **Precondiciones:** Reporte `"REP-2026-0021"` en estado `PENDIENTE`. Token `ADMIN`.
- **Datos de Prueba:**
  ```json
  {
    "accion": "RECHAZAR",
    "observacionesAdmin": "Fotografía borrosa de internet sin correspondencia con vía pública."
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar petición `POST /api/denuncias/REP-2026-0021/triaje`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Estado del reporte pasa a `RECHAZADO`.
  3. Puntos asignados: `0`.
  4. El campo `observacionesAdmin` almacena la justificación obligatoria.
  5. Se emite notificación al ciudadano informando el motivo del rechazo.
- **Resultado Real:** Pasó correctamente.
- **Estado:** **Pasó**
- **Postcondiciones:** El caso queda cerrado sin habilitarse para la bolsa.

---

### CP-RF-ADM-02-02: Rechazo Administrativo Fallido por Observaciones Vacías (Validación)
- **ID Requisito / HU:** `RF-ADM-02`
- **Prioridad:** Media
- **Tipo de Prueba:** UI / Validación | **Herramienta:** Postman / Jest
- **Precondiciones:** Modal de rechazo abierto en panel Admin.
- **Datos de Prueba:** `observacionesAdmin = ""` (cadena vacía).
- **Pasos a Ejecutar:**
  1. Presionar `"Confirmar Rechazo"` sin escribir texto en el campo de observaciones.
- **Resultado Esperado:**
  1. La solicitud HTTP se bloquea en cliente.
  2. Se muestra texto en rojo bajo el área de texto:
     `"Debes ingresar el motivo del rechazo del reporte."`
  3. Si se fuerza el envío por API, el backend responde HTTP 400 Bad Request:
     `{ "success": false, "message": "Las observaciones son obligatorias para rechazar un reporte" }`.
- **Resultado Real:** Pasó con bloqueo de validación.
- **Estado:** **Pasó**
- **Postcondiciones:** El reporte sigue en estado PENDIENTE.

---

### CP-RF-ADM-03-01: Bloqueo de Asignación si Inspector No Está Disponible (RF-ADM-03b)
- **ID Requisito / HU:** `RF-ADM-03b`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla / Seguridad | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Agente de campo `"inspector-roberto"` con `disponible = false` (en licencia o fuera de turno).
  2. Reporte `"REP-2026-0033"` aprobado.
- **Datos de Prueba:**
  ```json
  {
    "agenteId": "inspector-roberto"
  }
  ```
- **Pasos a Ejecutar:**
  1. El Admin intenta asignar el reporte al agente no disponible enviando `POST /api/denuncias/REP-2026-0033/asignar`.
- **Resultado Esperado:**
  1. Código HTTP: `400 Bad Request`.
  2. Cuerpo de la respuesta:
     ```json
     {
       "success": false,
       "message": "Agente no disponible"
     }
     ```
  3. En la UI del Admin: Banner de error en color rojo con el texto exacto:
     `"Agente no disponible"`
  4. La denuncia permanece sin asignación en la bolsa general.
- **Resultado Real:** Pasó según la regla estricta.
- **Estado:** **Pasó**
- **Postcondiciones:** No se sobrecargan inspectores inactivos.

---

### CP-RF-AGE-02-01: Toma de Caso Atómica 1 a 1 por Agente de Campo (Camino Feliz)
- **ID Requisito / HU:** `HU-08` / `RF-AGE-02`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0040"` en estado `APROBADO` en la bolsa.
  2. Agente `"agente-pablo"` autenticado sin ningún caso activo actualmente (`casoActivo === null`).
- **Pasos a Ejecutar:**
  1. El agente presiona `"Tomar Caso"` en la tarjeta del incidente.
  2. Se envía la solicitud `POST /api/denuncias/REP-2026-0040/tomar` con token del agente.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Respuesta JSON:
     ```json
     {
       "success": true,
       "message": "Caso asignado correctamente",
       "data": {
         "id": "uuid-reporte",
         "estado": "EN_VERIFICACION",
         "agenteId": "agente-pablo"
       }
     }
     ```
  3. El reporte desaparece de la bolsa general para los demás agentes del municipio.
  4. La pantalla del agente conmuta automáticamente a la bandeja de trabajo con la ruta GPS del lugar.
- **Resultado Real:** Pasó con asignación inmediata.
- **Estado:** **Pasó**
- **Postcondiciones:** El agente tiene exactamente 1 caso activo en verificación.

---

### CP-RF-AGE-02-02: Concurrencia — Intento Simultáneo de Toma del Mismo Caso por 2 Agentes
- **ID Requisito / HU:** `HU-08` / `RF-AGE-02` / `RNF-03`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Concurrencia / Atomicidad | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0050"` en estado `APROBADO`.
  2. Dos agentes distintos: `Agente 1` y `Agente 2`, ambos disponibles.
- **Pasos a Ejecutar:**
  1. Ejecutar de forma asíncrona concurrente mediante `Promise.all([ ... ])` dos solicitudes idénticas de toma de caso contra `/api/denuncias/REP-2026-0050/tomar` con una diferencia de `0 ms`.
- **Resultado Esperado:**
  1. La transacción atómica de Prisma (`prisma.$transaction`) aísla la operación.
  2. Exactamente una de las dos solicitudes retorna `200 OK` asignando el caso.
  3. La otra solicitud retorna `409 Conflict` (o `400 Bad Request` controlado) con el mensaje literal:
     `"El caso ya ha sido tomado por otro inspector."`
  4. En la base de datos: El registro posee exactamente un único `agenteId` asociado (sin sobreescritura de datos).
- **Resultado Real:** Agente 1 recibió 200 OK, Agente 2 recibió 409 con mensaje de caso ya tomado. Cero condiciones de carrera.
- **Estado:** **Pasó**
- **Postcondiciones:** Integridad de asignación 1 a 1 preservada al 100%.

---

### CP-RF-AGE-03-01: Bloqueo de Toma de Caso si el Agente Ya Posee un Caso Activo
- **ID Requisito / HU:** `RF-AGE-03`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla de Negocio | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. El agente `"agente-lucas"` ya tiene asignado el caso `"REP-2026-0010"` en estado `EN_VERIFICACION`.
- **Pasos a Ejecutar:**
  1. El agente intenta tomar otro caso `"REP-2026-0060"` desde la bolsa.
- **Resultado Esperado:**
  1. Código HTTP: `400 Bad Request`.
  2. Respuesta JSON:
     ```json
     {
       "success": false,
       "message": "Ya tienes un caso activo asignado. Debes completarlo o liberarlo antes de tomar uno nuevo."
     }
     ```
  3. En la UI: Despliegue de modal informativo con botón `"Ir a mi caso activo"`.
- **Resultado Real:** Pasó satisfactoriamente.
- **Estado:** **Pasó**
- **Postcondiciones:** No se permite acaparamiento de casos.

---

### CP-RF-AGE-05-01: Verificación In Situ Caso A (Foco Real Confirmado)
- **ID Requisito / HU:** `HU-09` / `RF-AGE-05`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:** Reporte en estado `EN_VERIFICACION` asignado al agente.
- **Datos de Prueba:**
  ```json
  {
    "resultado": "REAL",
    "fotoVerificacionUrl": "data:image/jpeg;base64,/9j/4AAQSkZ...",
    "notasInspeccion": "Se constata acumulación de residuos y recipientes con larvas en la acera."
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar `POST /api/denuncias/REP-2026-0040/verificar`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Estado del reporte cambia a `VERIFICADO_PENDIENTE`.
  3. Queda registrado en BD el enlace de contraprueba `fotoVerificacionUrl`.
  4. El caso pasa a la bandeja del Administrador para la validación de veracidad y acreditación de puntos.
- **Resultado Real:** Pasó según especificación.
- **Estado:** **Pasó**
- **Postcondiciones:** Caso listo para acreditación de ecopuntos.

---

### CP-RF-AGE-06-02: Protocolo de Inaccesibilidad — Cierre Automático al 3.er Intento Fallido
- **ID Requisito / HU:** `HU-09` / `RF-AGE-06`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla de Negocio / Resiliencia | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0075"` en estado `EN_VERIFICACION`.
  2. Registra previamente `intentosInaccesible = 2` (dos visitas anteriores con portón cerrado y aviso municipal).
- **Datos de Prueba:**
  ```json
  {
    "resultado": "INACCESIBLE",
    "fotoVerificacionUrl": "data:image/jpeg;base64,aviso_tercera_notificacion...",
    "notasInspeccion": "Tercera visita. Portón continúa con candado. Se adosa tercera faja de intimación."
  }
  ```
- **Pasos a Ejecutar:**
  1. Enviar `POST /api/denuncias/REP-2026-0075/verificar`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. El contador `intentosInaccesible` se incrementa a `3`.
  3. El sistema evalúa `intentosInaccesible === 3` y actualiza automáticamente el estado a:
     `CERRADO_INACCESIBLE`.
  4. El campo `agenteId` pasa a `null` (el agente queda liberado).
  5. El caso se deriva al sistema legal del municipio.
  6. Al ciudadano se le notifica que la propiedad fue intimada sin penalizar su reputación.
- **Resultado Real:** Cierre automático y liberación de agente verificados.
- **Estado:** **Pasó**
- **Postcondiciones:** Fin del ciclo operativo para inspección de campo.

---

### CP-RF-ADM-04-01: Validación de Veracidad y Acreditación Atómica de Ecopuntos
- **ID Requisito / HU:** `RF-ADM-04` / `RF-ADM-05`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Funcional (Camino Feliz) / Concurrencia | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0080"` en estado `VERIFICADO_PENDIENTE` con prioridad `ALTA`.
  2. El ciudadano denunciante posee un saldo actual de `100 puntos`.
- **Datos de Prueba:**
  ```json
  {
    "puntos": 250,
    "observacionesAdmin": "Reporte corroborado por inspector. Foco de riesgo epidemiológico."
  }
  ```
- **Pasos a Ejecutar:**
  1. El Administrador presiona `"Acreditar Puntos y Derivar a Saneamiento"`.
  2. Se envía `POST /api/denuncias/REP-2026-0080/acreditar-puntos` con token de Admin.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Transacción atómica ejecutada:
     - El saldo del ciudadano se incrementa exactamente en 250 unidades: saldo final = `350 puntos`.
     - El reporte registra `puntosOtorgados = 250`.
     - El estado del reporte cambia a `EN_SANEAMIENTO`.
     - Se inserta un registro en la tabla `PuntosHistory` con concepto `"Reporte real verificado REP-2026-0080"`.
  3. Se emite notificación push al vecino: `"¡Tus puntos ya están disponibles! Sumaste 250 ecopuntos por tu reporte."`.
- **Resultado Real:** Transacción atómica completada sin desfases de saldo.
- **Estado:** **Pasó**
- **Postcondiciones:** Ecopuntos disponibles inmediatamente en la cuenta del ciudadano.

---

### CP-RF-ADM-04-02: Rechazo de Asignación de Puntos Fuera del Baremo de Prioridad
- **ID Requisito / HU:** `RF-ADM-04`
- **Prioridad:** Media
- **Tipo de Prueba:** UI / Validación | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reporte con prioridad `BAJA` (rango permitido en baremo: `50 a 80 puntos`).
- **Datos de Prueba:** `puntos = 150` (excede el máximo para prioridad BAJA).
- **Pasos a Ejecutar:**
  1. El Admin intenta asignar 150 puntos a un caso de prioridad BAJA.
- **Resultado Esperado:**
  1. Código HTTP: `400 Bad Request`.
  2. Respuesta JSON:
     ```json
     {
       "success": false,
       "message": "El puntaje para prioridad BAJA debe estar comprendido entre 50 y 80 puntos."
     }
     ```
  3. En la interfaz: Mensaje de error en rojo bajo el campo de puntos; no se efectúa ningún cambio de saldo.
- **Resultado Real:** Rechazo validado según baremo estricto.
- **Estado:** **Pasó**
- **Postcondiciones:** Saldo del ciudadano permanece inalterado.

---

### CP-RF-AGE-07-02: Liberación de Caso Ya Verificado — Retorno Directo a Saneamiento
- **ID Requisito / HU:** `HU-10` / `RF-AGE-07`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla de Negocio | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0090"` en estado `EN_SANEAMIENTO` (ya verificado y con puntos otorgados al vecino).
  2. Asignado al `Agente A`.
- **Pasos a Ejecutar:**
  1. El `Agente A` presiona `"Liberar / Abandonar Caso"` por desperfecto mecánico.
  2. Se envía `POST /api/denuncias/REP-2026-0090/liberar`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. El campo `agenteId` pasa a `null`.
  3. El reporte retorna a la bolsa general conservando el estado `EN_SANEAMIENTO` (NO vuelve a `APROBADO`).
  4. Cuando el `Agente B` toma este caso de la bolsa, el sistema lo dirige directamente a la pantalla de saneamiento (subida de foto de solución y redacción de informe), sin obligarlo a realizar una nueva verificación de veracidad.
- **Resultado Real:** Comportamiento validado.
- **Estado:** **Pasó**
- **Postcondiciones:** Se evita duplicación innecesaria de verificaciones.

---

### CP-RF-ADM-07-01: Doble Certificación Comparativa — Cierre a RESUELTO Definitivo
- **ID Requisito / HU:** `HU-07` / `RF-ADM-07` / `RF-ADM-08`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reporte `"REP-2026-0095"` en estado `RESUELTO_TECNICO` (el agente ya subió la foto del "Después" e informe).
- **Pasos a Ejecutar:**
  1. El Administrador abre la vista de certificación dual (Foto Antes vs Foto Después).
  2. Presiona `"Certificar y Cerrar Caso Definitivamente"`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. El estado del reporte cambia a `RESUELTO`.
  3. Se registra `fechaCierre = now()`.
  4. El reporte se marca como concluido en las métricas de gestión del municipio.
  5. Se emite notificación de agradecimiento al vecino con la foto del foco saneado.
- **Resultado Real:** Cierre definitivo ejecutado exitosamente.
- **Estado:** **Pasó**
- **Postcondiciones:** Fin exitoso del ciclo de vida del reporte ambiental.

---

## 🛒 MÓDULO 3: TIENDA ECOLÓGICA, CARRITO, CHECKOUT CON RESERVA TTL Y ENTREGA
**Responsables Técnicos de Corrección:**
- Tienda, Carrito y Checkout: **Rodriguez Iván** (FrontEnd) / **Benitez Angel** (BackEnd)
- Entrega Colaborador y Expiración: **Rodriguez Iván** (FrontEnd) / **Benitez Angel** (BackEnd)

---

### CP-RF-TIE-01-02: Baja Lógica de Producto en Catálogo Preservando Historial (ABM)
- **ID Requisito / HU:** `RF-TIE-01`
- **Prioridad:** Alta
- **Tipo de Prueba:** Integración / BD | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Producto `"Botella de Vidrio 500ml"` (`id: "prod-10"`) con 15 canjes históricos asociados en la tabla `OrderItem`.
- **Pasos a Ejecutar:**
  1. El Administrador presiona `"Eliminar Producto"` en el panel de catálogo.
  2. Se envía la solicitud `DELETE /api/productos/prod-10` con token de Admin.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Respuesta: `{ "success": true, "message": "Producto dado de baja del catálogo" }`.
  3. En la base de datos: El registro físico NO se elimina (evitando violaciones de clave foránea `Foreign Key Constraint Violation`). El campo `activo` se actualiza a `false`.
  4. En la Tienda pública: El producto desaparece de la vista ciudadana.
  5. En el historial de canjes del usuario: Los canjes previos siguen mostrando el nombre y foto del producto sin romperse.
- **Resultado Real:** Baja lógica verificada.
- **Estado:** **Pasó**
- **Postcondiciones:** Integridad referencial garantizada.

---

### CP-RF-TIE-03-01: Restricción de Agregar al Carrito si Supera el Stock Físico Disponible
- **ID Requisito / HU:** `RF-TIE-03`
- **Prioridad:** Media
- **Tipo de Prueba:** UI / Validación | **Herramienta:** Jest
- **Precondiciones:**
  1. Producto `"Termo Solar"` con stock actual en base de datos: `2 unidades`.
  2. El ciudadano ya tiene agregadas `2 unidades` en su carrito móvil.
- **Pasos a Ejecutar:**
  1. El ciudadano intenta pulsar nuevamente el botón `+` para agregar una 3.ª unidad.
- **Resultado Esperado:**
  1. El botón `+` cambia a estado deshabilitado (`disabled = true`, opacidad reducida).
  2. El valor del contador permanece en `2`.
  3. Se despliega un tooltip/aviso contextual con el texto exacto:
     `"Máximo stock disponible alcanzado"`
- **Resultado Real:** Pasó sin anomalías.
- **Estado:** **Pasó**
- **Postcondiciones:** No se pueden añadir ítems por encima del stock físico.

---

### CP-RF-TIE-04-01: Bloqueo de Checkout por Saldo de Ecopuntos Insuficiente
- **ID Requisito / HU:** `HU-08` / `RF-TIE-04`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla de Negocio / Validación | **Herramienta:** Postman / Jest
- **Precondiciones:**
  1. Ciudadano con saldo disponible: `120 puntos`.
  2. Carrito con productos por un valor total de: `300 puntos`.
- **Pasos a Ejecutar:**
  1. El ciudadano intenta presionar `"Confirmar Canje"` en la pantalla de Checkout.
- **Resultado Esperado:**
  1. El botón `"Confirmar Canje"` se encuentra deshabilitado.
  2. Inmediatamente debajo del total se muestra en color rojo `#D32F2F` el mensaje exacto:
     `"Puntos insuficientes. Te faltan 180 puntos para este canje."`
  3. No se realiza ninguna solicitud de reserva de stock ni descuento en el servidor.
- **Resultado Real:** Bloqueo validado correctamente.
- **Estado:** **Pasó**
- **Postcondiciones:** El saldo y el stock permanecen intactos.

---

### CP-RF-TIE-05-01: Checkout — Reserva Temporal de Stock por 5 Minutos (TTL)
- **ID Requisito / HU:** `HU-08` / `RF-TIE-05`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Concurrencia / TTL | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Producto `"Mochila Ecológica"` con stock disponible: `5 unidades`.
  2. Ciudadano con saldo suficiente (`600 puntos`).
- **Pasos a Ejecutar:**
  1. El ciudadano abre la vista de Checkout seleccionando 2 unidades de `"Mochila Ecológica"`.
  2. Se envía la solicitud `POST /api/canjes/reservar`.
- **Resultado Esperado:**
  1. Código HTTP: `200 OK`.
  2. Respuesta JSON:
     ```json
     {
       "success": true,
       "reservaId": "res-uuid-1",
       "bloqueadoHasta": "2026-10-26T20:05:00.000Z",
       "minutosRestantes": 5
     }
     ```
  3. En la base de datos: El stock disponible para otros usuarios se reduce provisionalmente a `3 unidades`.
  4. En la pantalla del usuario se inicia una cuenta regresiva visual: `"Tu reserva expira en: 05:00"`.
- **Resultado Real:** Reserva TTL aplicada correctamente.
- **Estado:** **Pasó**
- **Postcondiciones:** Unidades bloqueadas temporalmente durante 5 minutos.

---

### CP-RF-TIE-05-02: Concurrencia — Intento Simultáneo de Reserva de la Última Unidad de Stock
- **ID Requisito / HU:** `HU-08` / `RF-TIE-05` / `RNF-03`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Concurrencia / Resiliencia | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Producto `"Kit de Jardinería"` con exactamente `stock = 1 unidad`.
  2. `Usuario A` y `Usuario B` con saldo suficiente intentan reservar dicha unidad al mismo milisegundo.
- **Pasos a Ejecutar:**
  1. Lanzar dos peticiones concurrentes paralelas `POST /api/canjes/reservar` con `Promise.all([ ... ])`.
- **Resultado Esperado:**
  1. Gracias a la transacción aislada con bloqueo a nivel de fila (`SELECT ... FOR UPDATE` o transacción Prisma):
  2. Una de las peticiones tiene éxito (`200 OK`) y reserva la unidad restante.
  3. La otra petición falla con `409 Conflict` (o `400 Bad Request`) devolviendo:
     ```json
     {
       "success": false,
       "message": "Stock insuficiente. El producto acaba de ser reservado por otro usuario."
     }
     ```
  4. El stock en base de datos nunca baja de 0 (cero sobreventa).
- **Resultado Real:** 1 reserva concedida, 1 denegada. Stock final = 0.
- **Estado:** **Pasó**
- **Postcondiciones:** Protección total contra sobreventa en concurrencia.

---

### CP-RF-TIE-05-03: Expiración Automática de Reserva TTL de 5 Minutos (Restauración de Stock)
- **ID Requisito / HU:** `HU-08` / `RF-TIE-05`
- **Prioridad:** Alta
- **Tipo de Prueba:** Resiliencia / Timer | **Herramienta:** Jest con `fakeTimers`
- **Precondiciones:**
  1. Reserva activa de 2 unidades iniciada con TTL de 5 minutos.
- **Pasos a Ejecutar:**
  1. Simular el paso de `5 minutos y 1 segundo` (`301.000 ms`) sin que el usuario presione confirmar.
  2. Ejecutar la función limpiadora de reservas vencidas (`cleanExpiredReservations()`).
- **Resultado Esperado:**
  1. La reserva cambia su estado a `EXPIRADA_LIBERADA`.
  2. Las 2 unidades reservadas se reintegran automáticamente al stock disponible del producto.
  3. En la app del usuario: Si intenta presionar confirmar luego de los 5 min, se le notifica:
     `"Tu tiempo de reserva ha expirado. Por favor, vuelve a iniciar el proceso de canje."`
- **Resultado Real:** Stock restaurado en BD tras vencer el temporizador.
- **Estado:** **Pasó**
- **Postcondiciones:** El inventario no queda bloqueado indebidamente.

---

### CP-RF-TIE-05-04: Confirmación Atómica de Canje y Emisión de Código de Retiro
- **ID Requisito / HU:** `HU-08` / `RF-TIE-05`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Reserva válida y activa. Saldo suficiente (`500 puntos`). Sucursal seleccionada: `"Sucursal Centro Pilar"`.
- **Pasos a Ejecutar:**
  1. Presionar `"Confirmar Canje y Generar Comprobante"`.
  2. Se envía `POST /api/canjes/confirmar`.
- **Resultado Esperado:**
  1. Código HTTP: `201 Created`.
  2. Transacción atómica ejecutada:
     - Deducción definitiva de los ecopuntos (`puntosUsuario = puntosUsuario - 250`).
     - Descuento definitivo del stock físico en inventario.
     - Carrito de compras vaciado localmente.
     - Generación de código único de retiro alfanumérico en formato `ECO-XXXX-X` (ej. `"ECO-7142-N"`).
     - Configuración de `fechaExpiracion = now() + 30 días`.
  3. En la UI: Despliegue de comprobante digital con código de barras y aviso:
     `"Tu pedido estará listo para retiro presencial a partir de las 48 horas hábiles en Sucursal Centro Pilar."`
- **Resultado Real:** Código `ECO-7142-N` emitido con descuento atómico.
- **Estado:** **Pasó**
- **Postcondiciones:** Pedido en estado CONFIRMADO esperando entrega presencial.

---

### CP-RF-COL-01-01: Búsqueda Exitosa y Entrega Presencial por Colaborador Municipal
- **ID Requisito / HU:** `RF-COL-01`
- **Prioridad:** Alta
- **Tipo de Prueba:** Funcional (Camino Feliz) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Pedido `"ECO-7142-N"` en estado `CONFIRMADO`.
  2. Operador logueado con rol `COLLABORATOR`.
- **Pasos a Ejecutar:**
  1. El colaborador ingresa `"ECO-7142-N"` en el buscador de la pantalla `CollaboratorDeliveryScreen`.
  2. Presiona `"Buscar Pedido"`.
  3. Verifica la identidad del titular y presiona `"Confirmar Entrega Presencial"`.
- **Resultado Esperado:**
  1. Al buscar: Se despliega la tarjeta con los datos del vecino (Nombre, DNI) y la lista de artículos a entregar.
  2. Al confirmar entrega:
     - Código HTTP: `200 OK`.
     - El estado del pedido pasa a `ENTREGADO`.
     - Se registra `fechaEntrega = now()` y `entregadoPor = collaboratorId`.
     - Se muestra un banner verde de confirmación: `"¡Pedido entregado exitosamente al vecino!"`.
- **Resultado Real:** Entrega registrada y pedido cerrado satisfactoriamente.
- **Estado:** **Pasó**
- **Postcondiciones:** El código de retiro queda inhabilitado para futuras entregas.

---

### CP-RF-COL-01-02: Búsqueda de Código Inexistente o Canje Ya Entregado (Negativa)
- **ID Requisito / HU:** `RF-COL-01`
- **Prioridad:** Media
- **Tipo de Prueba:** Funcional (Negativa) | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Código `"ECO-9999-X"` inexistente.
  2. Pedido `"ECO-7142-N"` que ya fue entregado previamente.
- **Pasos a Ejecutar:**
  1. Caso 1: Buscar `"ECO-9999-X"`.
  2. Caso 2: Buscar `"ECO-7142-N"`.
- **Resultado Esperado:**
  1. Caso 1: Se muestra banner rojo con el mensaje exacto:
     `"El código de retiro no existe. Por favor, verifica los caracteres con el vecino."`
  2. Caso 2: Se muestra banner amarillo de advertencia con el mensaje exacto:
     `"Este canje ya fue retirado el día 26/10/2026 a las 18:30 hs."`
  3. El botón de confirmación de entrega permanece oculto o deshabilitado.
- **Resultado Real:** Mensajes desplegados exactamente según diseño.
- **Estado:** **Pasó**
- **Postcondiciones:** Se previene entrega fraudulenta o duplicada.

---

### CP-RF-TIE-06-01: Expiración de Canje tras 30 Días sin Retiro (Restauración sin Reembolso)
- **ID Requisito / HU:** `RF-TIE-06`
- **Prioridad:** Alta
- **Tipo de Prueba:** Regla de Negocio / Batch | **Herramienta:** Jest / Supertest
- **Precondiciones:**
  1. Pedido `"ECO-5501-A"` emitido con `fechaExpiracion = 25/09/2026` (fecha pasada hace más de 30 días) en estado `CONFIRMADO`.
- **Pasos a Ejecutar:**
  1. Ejecutar el proceso batch / worker de expiración de canjes (`processCanjeExpirations()`).
- **Resultado Esperado:**
  1. El estado del pedido pasa a `EXPIRADO` (`CANCELADO`).
  2. Las unidades físicas de los productos se vuelven a sumar al stock disponible en el catálogo municipal.
  3. **Regla de Puntos:** Los puntos del canje **NO son reembolsados** al ciudadano (saldo permanece inalterado).
- **Resultado Real:** Pedido expirado, stock reintegrado y puntos retenidos según directiva.
- **Estado:** **Pasó**
- **Postcondiciones:** Inventario físico actualizado y canje vencido auditado.

---

## ⚙️ CASOS DE PRUEBA NO FUNCIONALES Y EXPERIENCIA DE USUARIO (RNF)
**Responsables Técnicos de Corrección:**
- Backend & Base de Datos: `Dev Backend & BD`
- Frontend Mobile & UI/UX: `Dev Frontend Mobile UI/UX`

---

### CP-RNF-07-01: Seguridad RBAC — Intento de Invocación con Token de Rol Inadecuado
- **ID Requisito / HU:** `RNF-07`
- **Prioridad:** Crítica
- **Tipo de Prueba:** Seguridad | **Herramienta:** Postman / Supertest
- **Precondiciones:**
  1. Usuario con rol `CITIZEN` con token JWT válido.
- **Pasos a Ejecutar:**
  1. Invocar el endpoint administrativo `POST /api/denuncias/REP-2026-0001/triaje` adjuntando el token de Ciudadano en la cabecera `Authorization`.
- **Resultado Esperado:**
  1. Código HTTP: `403 Forbidden`.
  2. Cuerpo de la respuesta:
     ```json
     {
       "success": false,
       "message": "Acceso denegado: se requieren privilegios de Administrador"
     }
     ```
  3. Ninguna mutación se produce en la base de datos.
- **Resultado Real:** Acceso bloqueado con código 403.
- **Estado:** **Pasó**
- **Postcondiciones:** La seguridad por roles es impenetrable.

---

### CP-RNF-10-01: Bloqueo de UI con TransactionLoaderModal ante Mutaciones a BD
- **ID Requisito / HU:** `RNF-10`
- **Prioridad:** Alta
- **Tipo de Prueba:** UI / Resiliencia | **Herramienta:** Jest (RNTL)
- **Precondiciones:** Formulario de reporte o checkout listo para enviar.
- **Pasos a Ejecutar:**
  1. Presionar el botón de confirmación/envío.
  2. Simular un usuario presionando rápidamente 5 veces consecutivas el mismo botón en menos de 1 segundo.
- **Resultado Esperado:**
  1. En el milisegundo 0 del primer toque se monta en pantalla completa el componente `TransactionLoaderModal`.
  2. El modal bloquea todos los eventos táctiles (*pointer events*) del árbol de componentes inferior.
  3. Se realiza una única solicitud HTTP al servidor (cero solicitudes duplicadas).
  4. Al responder la API:
     - Si es éxito: Se cierra el modal y se avanza de pantalla.
     - Si es error: Se cierra el modal, se mantiene el formulario intacto y se muestra el error.
- **Resultado Real:** Modal bloqueó exitosamente toques múltiples; una sola llamada a red efectuada.
- **Estado:** **Pasó**
- **Postcondiciones:** Cero registros duplicados por impaciencia del usuario.

---

### CP-RNF-10-02: Feedback Visual con Spinner Contextual en Filtros de Listas
- **ID Requisito / HU:** `RNF-10`
- **Prioridad:** Media
- **Tipo de Prueba:** UI / Feedback | **Herramienta:** Jest
- **Precondiciones:** Pantalla `AdminDenunciasScreen` o `StoreScreen` abierta con lista de ítems.
- **Pasos a Ejecutar:**
  1. Tocar el chip de filtro `"URGENTE"` o categoría `"Bolsas Ecológicas"`.
- **Resultado Esperado:**
  1. Se oculta temporalmente la grilla actual.
  2. Se renderiza un `ActivityIndicator` con mensaje contextual: `"Filtrando resultados..."`.
  3. Al completar la consulta en memoria o API, se renderiza la nueva lista y desaparece el indicador sin parpadeos bruscos.
- **Resultado Real:** Feedback visual claro y continuo.
- **Estado:** **Pasó**
- **Postcondiciones:** El usuario siempre comprende el estado del sistema.
