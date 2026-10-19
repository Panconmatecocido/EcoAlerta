# Requirements Document

## Introduction

Esta funcionalidad permite al ciudadano registrar un problema ambiental desde la aplicación móvil EcoAlerta. El flujo comprende la captura de una fotografía del problema, la carga de un formulario con datos de ubicación y gravedad, el envío del reporte al servidor mediante `denunciasService.crearDenuncia`, y la presentación de una confirmación que informa al usuario que, si el reporte es correcto, recibirá 600 Eco Points.

La solución se construye sobre la infraestructura existente del proyecto:

- **Cámara**: `expo-camera` con `CameraView` y `useCameraPermissions`, ya usada en `ReportScreen`.
- **Almacenamiento de imágenes**: el servidor recibe la foto como parte de un `FormData` multipart a través del endpoint `POST /api/denuncias`. La referencia a la imagen se conserva en el campo `fotoUrl` de la respuesta `DenunciaCiudadano`.
- **Servicio de reportes**: `denunciaService.crearDenuncia` en `src/services/denunciasService.ts`.
- **Autenticación**: `useAuth` del `AuthContext`; el usuario autenticado está disponible en `user`.
- **Eco Points**: el campo `user.points` del `AuthContext` y la función `updateUserPoints` permiten actualizar los puntos locales; sin embargo, el backend no acredita puntos automáticamente al crear el reporte — los puntos se otorgan sólo cuando el reporte es validado por un agente. El cliente **no debe acreditar puntos automáticamente**.
- **Navegación**: `ReportScreen` está registrada en `MainNavigator` como tab `"Camara"` de la barra inferior. Se extiende con una pantalla de formulario adicional registrada en el mismo stack de navegación.
- **Componentes reutilizables**: `CustomButton`, `Header`, `BarraEstadoDenuncia` y los tokens de diseño de `theme.ts` (`COLORS`, `SPACING`, `BORDER_RADIUS`, `ICON_SIZE`).
- **Prevención de duplicados**: el cliente controla el estado de envío para evitar múltiples llamadas ante un doble toque; la deduplicación definitiva recae en el servidor.

## Glossary

- **Sistema**: la aplicación móvil EcoAlerta (cliente React Native / Expo).
- **Ciudadano**: usuario autenticado con rol `citizen`.
- **Reporte**: registro de un problema ambiental compuesto por fotografía, gravedad, calle y altura, y localidad. Corresponde al tipo `DenunciaCiudadano` devuelto por el servidor.
- **Fotografía de Evidencia**: imagen capturada por la cámara del dispositivo, identificada por su URI local hasta el momento del envío.
- **Formulario de Reporte**: pantalla que aparece tras capturar la fotografía y contiene los campos de gravedad, calle y altura, y localidad.
- **Gravedad**: nivel de impacto ambiental del problema reportado. Valores posibles: `LEVE`, `MODERADA`, `GRAVE`.
- **Localidad**: una de las 15 localidades predefinidas del partido de Pilar, seleccionada mediante autocompletado.
- **Autocompletado de Localidad**: componente de búsqueda que filtra la lista de localidades permitidas a medida que el Ciudadano escribe.
- **Eco Points**: puntos ecológicos acumulados en `user.points`. Se otorgan al Ciudadano cuando el servidor valida el reporte como correcto; no se acreditan automáticamente al enviarlo.
- **Servicio_Denuncias**: módulo `denunciaService` en `src/services/denunciasService.ts`.
- **Pantalla_Camara**: pantalla `ReportScreen` existente en `src/screens/citizen/ReportScreen.tsx`.
- **Pantalla_Formulario**: nueva pantalla de formulario que se navega desde `Pantalla_Camara` tras obtener la `Fotografía de Evidencia`.
- **Pantalla_Confirmacion**: pantalla o modal que muestra el mensaje de éxito tras el envío correcto del reporte.

---

## Requirements

### Requisito 1: Solicitud de permiso de cámara

**Historia de usuario:** Como Ciudadano, quiero que la aplicación me solicite permiso para usar la cámara de forma clara, para entender por qué se necesita ese acceso.

#### Criterios de aceptación

1. CUANDO el Ciudadano accede a la `Pantalla_Camara` y el permiso de cámara no ha sido concedido, EL Sistema DEBERÁ mostrar un mensaje indicando que el acceso a la cámara es necesario para fotografiar problemas ambientales, junto con un botón para solicitar el permiso.
2. CUANDO el Ciudadano otorga el permiso de cámara, EL Sistema DEBERÁ mostrar la vista de cámara activa en un plazo máximo de 1 segundo.
3. CUANDO el Ciudadano deniega el permiso de cámara en el diálogo del sistema, EL Sistema DEBERÁ mantener la pantalla de solicitud de permiso sin navegar ni mostrar la cámara.
4. SI el sistema operativo indica que el permiso de cámara fue denegado permanentemente, ENTONCES EL Sistema DEBERÁ mostrar un mensaje de error e incluir un botón que abra la configuración del dispositivo para que el Ciudadano pueda restablecerlo manualmente.

---

### Requisito 2: Captura de la fotografía de evidencia

**Historia de usuario:** Como Ciudadano, quiero tomar una fotografía del problema ambiental directamente desde la aplicación, para que quede registrada como evidencia del reporte.

#### Criterios de aceptación

1. MIENTRAS el permiso de cámara está concedido, EL Sistema DEBERÁ mostrar la vista de cámara activa con un botón de captura renderizado y habilitado para interacción.
2. CUANDO el Ciudadano presiona el botón de captura, EL Sistema DEBERÁ tomar la fotografía y conservar en memoria una URI local no nula y no vacía correspondiente a la imagen capturada, sin descartarla hasta que el flujo de creación del reporte concluya o sea cancelado.
3. CUANDO la captura de la fotografía se completa exitosamente, EL Sistema DEBERÁ navegar a la `Pantalla_Formulario` pasando la URI de la `Fotografía de Evidencia` como parámetro.
4. SI la captura de la fotografía falla por un error del dispositivo, ENTONCES EL Sistema DEBERÁ mostrar un mensaje de error indicando que la captura no pudo completarse y permanecer en la `Pantalla_Camara` sin navegar.
5. SI el permiso de cámara no está concedido, ENTONCES EL Sistema DEBERÁ mostrar un mensaje indicando que el acceso a la cámara es necesario para registrar evidencia y NO DEBERÁ mostrar la vista de cámara activa.

---

### Requisito 3: Visualización de la fotografía capturada en el formulario

**Historia de usuario:** Como Ciudadano, quiero ver la foto que tomé antes de completar el formulario, para confirmar que la imagen corresponde al problema que quiero reportar.

#### Criterios de aceptación

1. CUANDO la `Pantalla_Formulario` se carga con una URI de `Fotografía de Evidencia` no nula y no vacía, EL Sistema DEBERÁ mostrar una miniatura de al menos 80×80 dp de la imagen capturada.
2. MIENTRAS el Ciudadano completa el formulario, EL Sistema DEBERÁ mantener visible la miniatura de la `Fotografía de Evidencia`, sin reemplazarla ni ocultarla.
3. SI la `Pantalla_Formulario` se carga sin una URI de `Fotografía de Evidencia`, ENTONCES EL Sistema DEBERÁ mostrar un mensaje indicando que no hay imagen disponible y no mostrará miniatura alguna.

---

### Requisito 4: Selección de la gravedad del problema

**Historia de usuario:** Como Ciudadano, quiero indicar qué tan grave es el problema ambiental que estoy reportando, para que el municipio pueda priorizar su atención.

#### Criterios de aceptación

1. CUANDO la `Pantalla_Formulario` se carga, EL Sistema DEBERÁ presentar un selector con las opciones de gravedad `LEVE`, `MODERADA` y `GRAVE`, permitiendo únicamente una opción seleccionada a la vez.
2. CUANDO el Ciudadano selecciona una opción de gravedad, EL Sistema DEBERÁ registrar esa selección en el estado del formulario y mostrar la opción elegida en un estado visualmente distinguible del resto de las opciones no seleccionadas.
3. MIENTRAS no se haya seleccionado ninguna opción de gravedad, EL Sistema DEBERÁ deshabilitar el botón de confirmación de envío y mostrar una indicación visible de que la selección de gravedad es obligatoria.

---

### Requisito 5: Ingreso de calle y altura

**Historia de usuario:** Como Ciudadano, quiero ingresar la calle y altura donde ocurre el problema, para que el municipio pueda ubicarlo con precisión.

#### Criterios de aceptación

1. THE `Pantalla_Formulario` DEBERÁ mostrar un campo de texto combinado para ingresar la calle y la altura, con una capacidad máxima de 100 caracteres.
2. MIENTRAS el campo de calle y altura esté vacío, contenga sólo espacios en blanco, o no contenga al menos un carácter numérico, EL Sistema DEBERÁ considerar el formulario como incompleto e impedir el envío.
3. CUANDO el Ciudadano ingresa texto en el campo de calle y altura, EL Sistema DEBERÁ almacenar ese valor en el estado del formulario.
4. SI el Ciudadano intenta ingresar texto que supere los 100 caracteres en el campo de calle y altura, ENTONCES EL Sistema DEBERÁ rechazar los caracteres adicionales y mostrar un mensaje indicando que se alcanzó el límite máximo permitido.

---

### Requisito 6: Selección de localidad mediante autocompletado

**Historia de usuario:** Como Ciudadano, quiero seleccionar la localidad del problema a partir de una lista predefinida con búsqueda por texto, para asegurarme de ingresar una ubicación válida.

#### Criterios de aceptación

1. THE `Pantalla_Formulario` DEBERÁ mostrar un campo de autocompletado para la selección de localidad.
2. CUANDO el Ciudadano ingresa menos de 3 caracteres en el campo de autocompletado, EL Sistema DEBERÁ ocultar la lista de sugerencias y no mostrar ningún resultado.
3. CUANDO el Ciudadano ingresa 3 o más caracteres en el campo de autocompletado, EL Sistema DEBERÁ mostrar todas las localidades de la lista permitida cuyo nombre contenga el texto ingresado, ignorando diferencias de mayúsculas, minúsculas y tildes.
4. CUANDO el Ciudadano escribe `pil`, EL Sistema DEBERÁ mostrar `Pilar` y `Pilar Sur` como sugerencias.
5. CUANDO el Ciudadano escribe `villa`, EL Sistema DEBERÁ mostrar `Villa Astolfi` y `Villa Rosa` como sugerencias.
6. CUANDO el Ciudadano escribe `fat`, EL Sistema DEBERÁ mostrar `Fátima` como sugerencia.
7. CUANDO el Ciudadano escribe 3 o más caracteres que no coinciden con ninguna localidad permitida, EL Sistema DEBERÁ mostrar el mensaje "No se encontraron localidades disponibles".
8. CUANDO el Ciudadano selecciona una localidad de la lista de sugerencias, EL Sistema DEBERÁ registrar esa localidad en el estado del formulario, mostrar el nombre de la localidad seleccionada en el campo de texto y cerrar la lista desplegable.
9. CUANDO el Ciudadano modifica el texto del campo de autocompletado después de haber seleccionado una localidad, EL Sistema DEBERÁ eliminar la localidad del estado del formulario y mantener el texto modificado visible en el campo, hasta que el Ciudadano seleccione una nueva opción válida de la lista.
10. MIENTRAS no exista una localidad válida seleccionada de la lista, EL Sistema DEBERÁ deshabilitar el control de envío de modo que no sea accionable.
11. THE Sistema DEBERÁ utilizar exclusivamente las siguientes 15 localidades como opciones válidas: Champagnat, Del Viso, Fátima, La Lonja, Luis Lagomarsino, Manuel Alberti, Manzanares, Manzone, Pilar, Pilar Sur, Presidente Derqui, San Francisco, Villa Astolfi, Villa Rosa, Zelaya.

---

### Requisito 7: Validación del formulario antes del envío

**Historia de usuario:** Como Ciudadano, quiero que la aplicación me indique claramente si falta información antes de enviar el reporte, para corregirlo sin perder los datos ya ingresados.

#### Criterios de aceptación

1. CUANDO el Ciudadano intenta confirmar el envío con uno o más campos obligatorios incompletos, EL Sistema DEBERÁ mostrar un mensaje de error que identifique por nombre cada campo faltante o inválido (Fotografía de Evidencia, Gravedad, Calle y Altura, Localidad), sin borrar los datos ya ingresados.
2. MIENTRAS todos los campos obligatorios están completos y válidos — `Fotografía de Evidencia` adjunta, gravedad seleccionada, calle y altura con al menos 3 caracteres y un dígito numérico, y localidad seleccionada de la lista — EL Sistema DEBERÁ habilitar el botón de confirmación de envío. En cualquier otro estado, el botón DEBERÁ permanecer deshabilitado.
3. SI el Ciudadano intenta confirmar el envío sin tener ninguna fotografía adjunta en el estado del formulario, ENTONCES EL Sistema DEBERÁ impedir el envío y mostrar un mensaje indicando que se requiere una fotografía.

---

### Requisito 8: Envío del reporte al servidor

**Historia de usuario:** Como Ciudadano, quiero que el reporte se envíe al servidor con toda la información que ingresé, para que el municipio pueda gestionarlo correctamente.

#### Criterios de aceptación

1. CUANDO el Ciudadano confirma el envío con el formulario válido — fotografía adjunta, gravedad seleccionada, calle y altura completada, y localidad seleccionada — EL Sistema DEBERÁ llamar a `Servicio_Denuncias.crearDenuncia` con la URI de la `Fotografía de Evidencia`, la gravedad, la calle y altura, y la localidad seleccionada.
2. MIENTRAS el envío está en curso, EL Sistema DEBERÁ deshabilitar el botón de confirmación y mostrar un indicador de carga para impedir envíos duplicados.
3. CUANDO el servidor responde con un resultado exitoso, EL Sistema DEBERÁ navegar a la `Pantalla_Confirmacion`.
4. SI el servidor responde con un error durante el envío, ENTONCES EL Sistema DEBERÁ mostrar un mensaje de error indicando que el envío no pudo completarse, habilitar nuevamente el botón de confirmación y no navegar a la `Pantalla_Confirmacion`.
5. SI el envío falla por cualquier motivo, ENTONCES EL Sistema DEBERÁ conservar la URI de la `Fotografía de Evidencia` y todos los datos del formulario para permitir un reintento sin que el Ciudadano deba volver a completar el formulario.
6. SI el servidor no responde en un plazo de 30 segundos, ENTONCES EL Sistema DEBERÁ tratar la operación como fallida y aplicar el comportamiento del criterio 4.

---

### Requisito 9: Confirmación exitosa del reporte

**Historia de usuario:** Como Ciudadano, quiero recibir una confirmación clara de que mi reporte fue registrado, para saber que la información fue recibida correctamente.

#### Criterios de aceptación

1. CUANDO el servidor confirma el registro exitoso del reporte, EL Sistema DEBERÁ mostrar la `Pantalla_Confirmacion` con un mensaje de éxito que indique que el reporte fue recibido y que los Eco Points se otorgarán únicamente si el reporte es validado como correcto.
2. CUANDO la `Pantalla_Confirmacion` es mostrada, EL Sistema DEBERÁ presentar de forma visible el aviso condicional de puntos, de modo que la condición de validación sea legible en pantalla sin necesidad de desplazamiento.
3. IF el Ciudadano envía el reporte y la operación de envío finaliza sin error del servidor, THEN EL Sistema NO DEBERÁ modificar el saldo de Eco Points mostrado al Ciudadano como consecuencia directa de ese envío.
4. CUANDO el Ciudadano presiona la acción de continuar en la `Pantalla_Confirmacion`, EL Sistema DEBERÁ navegar de regreso a la pantalla `Inicio` en un plazo máximo de 2 segundos.
5. IF el servidor retorna un error al intentar registrar el reporte, THEN EL Sistema DEBERÁ mostrar un mensaje de error indicando que el reporte no pudo ser registrado y permitir al Ciudadano reintentar el envío o cancelar la operación.

---

### Requisito 10: Prevención de pérdida de datos durante el flujo

**Historia de usuario:** Como Ciudadano, quiero que mis datos y la fotografía no se pierdan si hay un error durante el proceso, para no tener que repetir todo el flujo desde el inicio.

#### Criterios de aceptación

1. THE Sistema DEBERÁ mantener en memoria la URI de la `Fotografía de Evidencia` y los valores del formulario durante todo el flujo de creación del reporte, desde la captura hasta el envío exitoso o hasta que el Ciudadano cancele explícitamente el flujo mediante un control de cancelación dedicado en la interfaz.
2. SI ocurre un error de red, un timeout de más de 30 segundos, o una respuesta de error del servidor durante el envío, ENTONCES EL Sistema DEBERÁ conservar la URI de la `Fotografía de Evidencia` y los datos del formulario, e informar al Ciudadano que sus datos están preservados y puede reintentar.
3. THE Sistema DEBERÁ limitar a 3 el número de reintentos consecutivos de envío dentro de la misma sesión. Si se alcanza el límite, EL Sistema DEBERÁ mostrar un mensaje indicando que no es posible completar el envío en este momento.
4. EL Sistema DEBERÁ limpiar el estado del formulario y la `Fotografía de Evidencia` únicamente cuando el servidor confirme el registro exitoso del reporte o cuando el Ciudadano cancele explícitamente el flujo.
