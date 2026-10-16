# 📋 Catálogo Maestro de Requerimientos (RF/RNF), Historias de Usuario (HU) y Hoja de Ruta Spec Kit — Eco Alerta

Este documento centraliza **todas las Historias de Usuario (HU), Requisitos Funcionales (RF) y No Funcionales (RNF)** del proyecto **Eco Alerta**, junto con los comandos exactos de `/speckit.specify` para ir generando cada especificación paso a paso en equipo.

---

## 🗺️ Estado de Especificaciones (`specs/`)

| Orden | Directorio Spec | Módulo / Alcance | Estado Spec | Siguiente Fase Recomendada |
| :--- | :--- | :--- | :--- | :--- |
| **001** | [`specs/001-auth-rbac/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/spec.md) | **Módulo 1:** Autenticación, Cuentas y 4 Roles (RBAC) | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `001-auth-rbac` |
| **002** | [`specs/002-reporte-ciudadano/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/002-reporte-ciudadano/spec.md) | **Módulo 2 (Parte A):** Creación de Reporte Ciudadano, GPS, Cámara `< 1.2 MB`, Seguimiento en Home y Soft Delete | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `002-reporte-ciudadano` |
| **003** | [`specs/003-triaje-y-agente-campo/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/003-triaje-y-agente-campo/spec.md) | **Módulo 2 (Parte B):** Triaje Admin, Bolsa de Casos, Toma 1 a 1 por Agente, Verificación In Situ (3 Intentos) y Liberación | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `003-triaje-y-agente-campo` |
| **004** | [`specs/004-saneamiento-y-certificacion/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/004-saneamiento-y-certificacion/spec.md) | **Módulo 2 (Parte C):** Validación de Veracidad con Acreditación de Puntos, Saneamiento Técnico y Doble Certificación Antes vs Después | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `004-saneamiento-y-certificacion` |
| **005** | [`specs/005-tienda-carrito-checkout/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/005-tienda-carrito-checkout/spec.md) | **Módulo 3 (Parte A):** ABM de Catálogo Admin, Tienda Reactiva, Carrito y Checkout con Reserva TTL de 5 Minutos | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `005-tienda-carrito-checkout` |
| **006** | [`specs/006-entrega-colaborador-expiracion/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/006-entrega-colaborador-expiracion/spec.md) | **Módulo 3 (Parte B):** Panel Colaborador de Entrega (`codigoRetiro`) y Expiración de Canjes a los 30 Días | ✅ **Creado** (16/16 checks) | `/speckit.plan` sobre `006-entrega-colaborador-expiracion` |

> 💡 **Nota de uso:** Para cada módulo, el flujo completo en el chat es:
> 1. `/speckit.specify <descripción>` (crea `spec.md`)
> 2. `/speckit.plan` (crea `plan.md` técnico)
> 3. `/speckit.tasks` (crea `tasks.md` con la lista de tareas)
> 4. `/speckit.implement` (programa el código y los tests)

---

## 🔐 MÓDULO 1: AUTENTICACIÓN, MODO INVITADO, CUENTAS Y ROLES (RBAC)
*(Especificado en [`specs/001-auth-rbac/spec.md`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/specs/001-auth-rbac/spec.md))*

### Historias de Usuario de Modo Invitado y Bienvenida (`HU-INV-01 a 03`)
- **HU-INV-01 (Home de Bienvenida para No Logueados):** Como usuario no autenticado (Invitado), al abrir la aplicación quiero ingresar directamente a una página de bienvenida (Home para no logueados) que me explique el funcionamiento de Eco Alerta (cómo reportar focos ambientales, cómo el municipio los verifica y sanea, y cómo ganar y canjear puntos ecológicos), en lugar de ser bloqueado por una pantalla de login.
- **HU-INV-02 (Botón de Registro en Cabecera de Usuario):** Como usuario invitado en el Home, en el espacio superior donde habitualmente se muestra el ícono de avatar y el nombre del vecino logueado, quiero ver un botón destacado que diga **"Regístrate para empezar a usar la app"**, para poder ir al registro o inicio de sesión en cualquier momento con un solo toque.
- **HU-INV-03 (Navegación Libre como Invitado y Bloqueo de Acciones Protegidas - Auth Gate):** Como usuario invitado, quiero poder navegar libremente por la aplicación y explorar el catálogo de productos de la Tienda Ecológica, pero cuando intente realizar una acción que requiera identidad o cuenta de usuario (como **reportar un foco en Cámara**, entrar a **Perfil**, ver historial o **agregar un producto al carrito**), el sistema debe interceptar la acción e invitarme a registrarme o iniciar sesión.

### Requisitos Funcionales de Autenticación y Modo Invitado (`RF-AUT-01 a 08`)
- **RF-AUT-01 (Registro Ciudadano):** Autoregistro bajo rol Ciudadano (`CITIZEN`) solicitando Nombre completo, Correo electrónico y Contraseña (con confirmación). Saldo inicial: `0 puntos`.
- **RF-AUT-02 (Validación de Formulario):** Impedir campos vacíos, validar formato de email, coincidencia exacta de contraseñas, longitud mínima de 6 caracteres y verificar que el email no esté duplicado. Soporte para acceso rápido con Google OAuth.
- **RF-AUT-03 y 04 (Login Multi-Rol y Enrutamiento Dinámico):** Validar credenciales y redirigir según el rol:
  0. *Invitado No Autenticado (`GUEST` / `user === null`):* Ingresa por defecto al navegador principal mostrando el **Home de Bienvenida explicativo** y el catálogo de la tienda en modo lectura.
  1. *Ciudadano (`CITIZEN`):* Home con su nombre, avatar, saldo de puntos reales, botón central de cámara habilitado, métricas y listado de alertas propias.
  2. *Agente de Campo (`AGENT`):* Bolsa general de casos aprobados y bandeja de caso activo asignado (prohibido canjear productos ni autoasignarse puntos con su cuenta operativa).
  3. *Administrador Municipal (`ADMIN`):* Panel de triaje, asignación de prioridad, validación de veracidad con asignación de puntos, certificación final (Antes vs. Después) y ABM de productos/sucursales.
  4. *Colaborador Municipal (`COLLABORATOR` / Operador de Entrega):* Panel de búsqueda de código alfanumérico (`codigoRetiro`) y validación de entrega presencial de premios.
- **RF-AUT-05 (Persistencia y Logout):** Conservar sesión activa localmente (`AsyncStorage`) y permitir cierre de sesión seguro retornando al Home de Bienvenida en modo Invitado.
- **RF-AUT-06 (Home de Bienvenida y CTA de Cabecera para Invitados):** Cuando el usuario no está autenticado (`user === null`), el Home DEBE presentar una guía visual explicativa del funcionamiento de Eco Alerta y reemplazar el bloque de avatar/nombre de usuario por un botón interactivo con el texto **"Regístrate para empezar a usar la app"** que navegue hacia la pantalla de Registro (con opción de ir a Iniciar Sesión).
- **RF-AUT-07 (Navegación en Modo Invitado - Solo Lectura en Tienda):** El usuario invitado DEBE poder recorrer las pestañas públicas y visualizar la Tienda Ecológica (productos, precios en puntos, categorías y buscador), pero NO DEBE poder agregar productos al carrito ni abrir el Checkout.
- **RF-AUT-08 (Guardián de Rutas y Acciones Protegidas - Auth Gate):** Cuando un usuario invitado intente:
  1. Tocar el botón central de **Cámara / Reportar un foco**,
  2. Ingresar a la pestaña **Perfil** o enlace de **Historial**,
  3. Pulsar **"Agregar al Carrito"** en cualquier producto de la Tienda, o
  4. Ejecutar cualquier acción que requiera datos del usuario,
  el sistema DEBE bloquear la ejecución y desplegar un aviso/modal o redirección directa solicitándole que se registre o inicie sesión para continuar.

---

## 🌿 MÓDULO 2: CICLO DE VIDA COMPLETO DEL REPORTE (CIUDADANO, ADMIN Y AGENTE)

### 1. Creación por Ciudadano (`RF-REP-01 a 05`, `HU-03`)
- Selección de categoría (*Microbasural*, *Foco de Dengue*, *Terreno Baldío*, *Otro*).
- Captura de foto en tiempo real o galería comprimida obligatoriamente a `< 1.2 MB` (máx. 1080px).
- Captura de GPS (`latitud`/`longitud`) + `direccion` manual de referencia.
- Se guarda con código único (`REP-2026-XXX`) y estado inicial `PENDIENTE` (`REPORTADO`).
- **Regla de Puntos:** NO se acreditan puntos al enviar el reporte; quedan en revisión hasta que la denuncia sea verificada como real en el terreno.

### 2. Triaje por Administrador (`RF-ADM-01 a 03`, `HU-05`)
- El Admin evalúa reportes iniciales.
- Si es improcedente/broma, lo rechaza (`RECHAZADO` / `CERRADO_FALSO`) con justificación obligatoria (`observacionesAdmin`) y `0 puntos`.
- Si es válido, le asigna `Prioridad` (`BAJA`, `MEDIA`, `ALTA`, `URGENTE`) y lo aprueba (`APROBADO` / `APROBADO_EN_BOLSA`) para que sea visible por todos los agentes de campo del municipio.

### 3. Toma de Caso con Bloqueo 1 a 1 por Agente (`RF-AGE-01 a 04`, `HU-08`)
- Todos los agentes ven la bolsa de casos aprobados ordenados por prioridad (Rojo = Urgente, Naranja = Alta, Verde = Media/Baja) y cercanía, con acceso a navegación en mapa.
- Al pulsar *"Tomar Caso"*, se aplica un **bloqueo transaccional atómico 1 a 1** (`prisma.$transaction`): asigna `agenteId` y pasa a estado `EN_VERIFICACION` (`EN_PROCESO`).
- Un agente con un caso activo NO puede tomar otro en paralelo.

### 4. Verificación In Situ y Protocolo de 3 Intentos por Inaccesibilidad (`RF-AGE-05 a 06`, `HU-09`)
- El agente va al lugar y completa el formulario de verificación con nueva foto (`fotoVerificacionUrl`):
  - **Caso A (Es Real):** Sube foto de contraprueba y pasa a `VERIFICADO_PENDIENTE` para auditoría del Admin.
  - **Caso B (Es Falso en terreno):** Sube foto de descargo marcando falso reporte; el Admin lo cierra (`RECHAZADO`) sin puntos.
  - **Caso C (Es Inaccesible - ej. portón cerrado):** Se registra visita con foto del aviso/sticker municipal. Se permiten hasta **3 intentos en total** (`intentosInaccesible`: 1 visita inicial + 2 envíos adicionales). Al 3.er intento fallido, pasa automáticamente a `CERRADO_INACCESIBLE` para intimación legal municipal sin penalizar al vecino.

### 5. Validación de Veracidad y Acreditación de Puntos por Admin (`RF-ADM-04 a 05`)
- El Admin revisa la verificación del agente.
- Al aprobarla, **asigna los puntos al vecino por "denuncia real confirmada"** según el baremo de prioridad (`BAJA: 50-80`, `MEDIA: 100-150`, `ALTA: 200-300`, `URGENTE: 350-500`) mediante transacción atómica (`prisma.$transaction`), registrando `puntosOtorgados` y pasando el caso a `EN_SANEAMIENTO`.

### 6. Abandono / Liberación de Caso y Desasignación Forzada (`RF-AGE-07`, `RF-ADM-06`, `HU-10`)
- Si un agente sufre un imprevisto y pulsa *"Liberar / Abandonar Caso"* (o si el Admin ejecuta *"Forzar Desasignación"* por inactividad), el caso se desvincula del agente (`agenteId = null`) y vuelve a la bolsa general:
  - Si aún no estaba verificado, vuelve a `APROBADO`.
  - Si **ya había sido verificado y validado** (puntos ya otorgados al vecino), vuelve a la bolsa directamente en estado `EN_SANEAMIENTO` para que el nuevo agente que lo tome salte la etapa de verificación y vaya directo a subir la foto de limpieza.

### 7. Saneamiento y Cierre Técnico por Agente (`RF-AGE-08`, `HU-11`)
- Una vez erradicado el basural o descacharrizado el foco de dengue, el agente captura obligatoriamente la foto del "Después" (`fotoSolucionUrl`) y redacta el informe técnico (`informeSolucion`), pasando el caso a `RESUELTO_TECNICO` y quedando libre para tomar otro caso.

### 8. Doble Validación y Certificación Final por Admin (`RF-ADM-07 a 08`, `HU-07`)
- El Admin ve una pantalla comparativa (**Foto Inicial "Antes" vs. Foto Final "Después"**).
- Si la limpieza es deficiente, pulsa *"Observar / Rechazar Saneamiento"* con notas técnicas (`observacionesAdmin`) y el caso regresa a `EN_SANEAMIENTO`.
- Si aprueba, pasa a `RESUELTO` (`CERRADO_DEFINITIVO`) y notifica al ciudadano.

### 9. Seguimiento en Home y Soft Delete Ciudadano (`RF-REP-06 a 07`, `HU-04`, `HU-VEC01`)
- El vecino ve el progreso de sus casos en el Home/Perfil.
- Una vez que cobró sus puntos, puede eliminar/archivar el reporte de su panel (`ocultarUsuario = true`).
- Esto aplica un **Soft Delete visual**: desaparece de la lista del vecino (incluso si sigue en etapa de saneamiento), pero se conserva íntegro en la base de datos municipal.

---

## 🛒 MÓDULO 3: TIENDA ECOLÓGICA, CARRITO, CHECKOUT CON RESERVA Y ENTREGA (`HU-05 a HU-08`)

### 1. ABM de Catálogo por Admin (`RF-TIE-01`)
- El Admin carga, edita y da de baja lógica (`activo: false`) productos e insumos ecológicos (gorras, botellas reutilizables, bolsas de tela, termos) con su stock físico y valor en puntos para no romper el historial de canjes previos.

### 2. Catálogo, Detalle y Carrito Reactivo (`RF-TIE-02 a 03`, `HU-05 a 07`)
- Grilla de productos activos (`activo: true`) con filtros por categoría y buscador, pantalla de detalle y carrito con suma en vivo: `TotalPuntos = Sumatoria(Cantidad * CostoUnitario)`.
- Si la cantidad baja a `0`, se elimina el ítem. El carrito persiste localmente.
- En el Checkout se revalida el precio en puntos actual del producto en la base de datos para evitar desfases si el Admin editó el valor mientras estaba en el carrito.

### 3. Checkout con Bloqueo Temporal de Stock por 5 Minutos (`RF-TIE-04 a 05`, `HU-08`)
- Valida `PuntosUsuario >= TotalPuntosCarrito` (si no alcanza, bloquea confirmación y muestra *"Puntos insuficientes"*).
- Al iniciar el Checkout, el sistema aplica una **reserva/bloqueo temporal de stock por 5 minutos (TTL)** (`estado: RESERVADO_PENDIENTE`, `bloqueadoHasta: now + 5 min`) para evitar sobreventa si dos vecinos intentan canjear la última unidad disponible al mismo tiempo. Si pasan los 5 min o se cierra la app sin confirmar, el stock se libera automáticamente.
- El vecino selecciona la sucursal/punto de retiro municipal (`Sucursal`, con aviso de disponibilidad a partir de las **48 hs hábiles**).
- Al confirmar, una transacción atómica (`prisma.$transaction`) descuenta los puntos del vecino, descuenta el stock definitivo, vacía el carrito y emite el comprobante con `codigoRetiro` único (ej. `ECO-7894-K`) y `fechaExpiracion` a 30 días.

### 4. Entrega Presencial y Expiración a los 30 Días (`RF-COL-01`, `RF-TIE-06`)
- El Colaborador Municipal (`COLLABORATOR`) o Admin ingresa el `codigoRetiro`, valida el pedido y lo marca como `ENTREGADO` (`fechaEntrega`).
- Si un canje no es retirado pasados **30 días corridos** (`fechaExpiracion`), pasa a estado `CANCELADO` (`EXPIRADO`): el stock físico vuelve a sumarse al inventario municipal, pero **no se reembolsan los puntos** al ciudadano.

---

## ⚙️ REQUISITOS NO FUNCIONALES (RNF) Y SEMILLAS DE PRUEBA

- **RNF-01 (Rendimiento):** Operaciones en almacenamiento local `< 300 ms` y consultas a la API `< 600 ms`.
- **RNF-02 (Optimización Multimedia):** Compresión obligatoria de fotografías de cámara/galería a `< 1.2 MB` (máx. 1080px) antes de guardarlas localmente o subirlas a Supabase Storage.
- **RNF-03 y 04 (Concurrencia y Atomicidad):** Uso de transacciones (`prisma.$transaction`) para toma de casos 1 a 1 entre agentes, acreditación de puntos y reserva de stock de 5 minutos en Checkout.
- **RNF-06 (Patrón Repositorio):** Capa de servicios/repositorios desacoplada que opera contra la API `/server` y mantiene soporte de caché/mocks locales (`AsyncStorage`) para tolerancia a fallos de red.
- **RNF-07 y 08 (Seguridad e Integridad):** Contraseñas hasheadas (`passwordHash`), bajas lógicas en productos (`activo: false`) y reportes (`ocultarUsuario: true`).
- **RNF-09 (Onboarding Sin Fricción y Guardián de Invitado - Auth Gate):** El inicio en frío de la aplicación para usuarios sin sesión activa DEBE aterrizar en el Home de Bienvenida en `< 300 ms` sin exigir login previo, interceptando en `< 100 ms` cualquier intento de acceder a rutas o acciones que requieran identidad del usuario (Cámara/Reporte, Perfil, Agregar al Carrito) sin provocar errores ni pantallas en blanco.
- **Estilo UI:** `StyleSheet.create` por componente consumiendo las variables globales de [`client/src/utils/theme.ts`](file:///c:/Users/raulr/Desktop/uni/2doA%C3%B1o/2doCuatri/aplicaciones%20moviles/EcoAlerta/client/src/utils/theme.ts) (sin Tailwind/NativeWind).
