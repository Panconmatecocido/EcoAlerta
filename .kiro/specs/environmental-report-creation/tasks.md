# Implementation Plan: Creación de Reporte Ambiental

## Overview

Este plan implementa el flujo completo de creación de reporte ambiental: captura de fotografía → formulario → confirmación. Se construye sobre la infraestructura existente (`denunciasService`, `CustomButton`, `Header`, `theme.ts`) sin modificar `denunciasService.ts` ni llamar a `updateUserPoints`.

El orden de implementación sigue las dependencias reales: constantes e infraestructura de tipos → utilidades puras → hook de lógica → componentes UI → pantallas → navegación → tests.

---

## Tasks

- [x] 1. Crear infraestructura de tipos y constantes base
  - [x] 1.1 Crear `src/navigation/types.ts` con `ReportStackParamList` y tipos de props
    - Definir `ReportStackParamList`: `ReportCamera: undefined`, `ReportForm: { fotoUri: string }`, `ReportConfirmation: undefined`
    - Exportar `ReportCameraScreenProps`, `ReportFormScreenProps`, `ReportConfirmationScreenProps` usando `NativeStackScreenProps`
    - _Requisitos: 2.3, 8.1_

  - [x] 1.2 Crear `src/constants/localidades.ts` con el array `LOCALIDADES` y el tipo `Localidad`
    - Incluir exactamente las 15 localidades: Champagnat, Del Viso, Fátima, La Lonja, Luis Lagomarsino, Manuel Alberti, Manzanares, Manzone, Pilar, Pilar Sur, Presidente Derqui, San Francisco, Villa Astolfi, Villa Rosa, Zelaya
    - Usar `as const` para que el tipo sea una unión de literales
    - _Requisitos: 6.11_

- [x] 2. Implementar utilidades de texto y filtrado
  - [x] 2.1 Crear `src/utils/normalizeText.ts` con `normalizeText()` y `filtrarLocalidades()`
    - `normalizeText`: normalización NFD + eliminación de diacríticos + lowercase
    - `filtrarLocalidades(query)`: retorna `[]` si `query.length < 3`; filtra por subcadena normalizada sobre `LOCALIDADES`
    - _Requisitos: 6.2, 6.3, 6.6_

  - [ ]* 2.2 Escribir test de propiedad P5 para `normalizeText` (idempotencia e invarianza de tildes)
    - **Propiedad 5: `normalizeText` produce resultado idempotente e invariante ante tildes**
    - `normalizeText(normalizeText(s)) === normalizeText(s)` para cualquier string
    - Para cualquier par `(a, b)` donde `b` es `a` con tildes reemplazadas por ASCII, `normalizeText(a) === normalizeText(b)`
    - Usar `fast-check`, mínimo 100 iteraciones
    - _Valida: Requisitos 6.3, 6.6_

  - [ ]* 2.3 Escribir tests de propiedad P3 y P4 para `filtrarLocalidades`
    - **Propiedad 3: resultado es subconjunto de `LOCALIDADES` y contiene la query normalizada**
    - **Propiedad 4: retorna vacío para queries de longitud 0, 1 o 2**
    - Usar `fast-check`, mínimo 100 iteraciones por propiedad
    - _Valida: Requisitos 6.2, 6.3, 6.11_

- [x] 3. Implementar función de validación de `calleAltura`
  - [x] 3.1 Crear `src/utils/validateCalleAltura.ts` con `validateCalleAltura(text: string): boolean`
    - Retorna `false` si el string está vacío, sólo contiene whitespace, o no tiene al menos un carácter del conjunto `[0-9]`
    - Retorna `true` en cualquier otro caso
    - Exportar la función para uso en `useReportForm` y en tests
    - _Requisitos: 5.2_

  - [ ]* 3.2 Escribir test de propiedad P2 para `validateCalleAltura`
    - **Propiedad 2: rechaza entradas sin dígito numérico**
    - Generar strings que no contengan dígitos → esperar `false`
    - Generar strings que contengan al menos un dígito → esperar `true`
    - Usar `fast-check`, mínimo 100 iteraciones
    - _Valida: Requisito 5.2_

- [x] 4. Implementar el hook `useReportForm`
  - [x] 4.1 Crear `src/hooks/useReportForm.ts` con estado, validación, envío y control de reintentos
    - Estado interno: `fotoUri`, `gravedad`, `calleAltura`, `localidad`, `localidadInputText`
    - Estado de envío: `isSubmitting`, `retryCount` (0..3), `lastError`
    - `isFormValid`: usa `validateCalleAltura`, verifica `gravedad != null`, `localidad != null && LOCALIDADES.includes(localidad)`, `fotoUri` no vacío
    - Cuando `retryCount === 3`, `isFormValid` retorna `false` independientemente del resto
    - `submit()`: construye `CrearDenunciaPayload` según el mapeo del diseño; usa `AbortController` con timeout de 30 s; si `clienteApi` no acepta señal, usar `Promise.race`; incrementa `retryCount` en fallo (máx. 3); navega a `ReportConfirmation` en éxito
    - `submit()` es no-op si `isSubmitting === true`
    - `reset()`: limpia el estado completo (solo en éxito o cancelación explícita)
    - **NO llamar a `updateUserPoints` bajo ninguna circunstancia**
    - _Requisitos: 7.2, 8.1, 8.2, 8.3, 8.5, 8.6, 9.3, 10.1, 10.2, 10.3, 10.4_

  - [ ]* 4.2 Escribir test de propiedad P1 para `useReportForm` (conservación de URI)
    - **Propiedad 1: la URI capturada se conserva sin modificación**
    - Para cualquier URI no nula y no vacía, el estado del formulario la preserva por igualdad de referencia
    - Usar `fast-check`, mínimo 100 iteraciones
    - _Valida: Requisitos 2.2, 2.3_

  - [ ]* 4.3 Escribir test de propiedad P6 para `isFormValid` (completitud ↔ validez)
    - **Propiedad 6: `isFormValid` es `true` si y sólo si todos los campos son válidos**
    - Generar estados del formulario con fast-check y verificar la bicondicional
    - _Valida: Requisitos 7.2, 4.3, 6.10_

  - [ ]* 4.4 Escribir test de propiedad P7 para `submit` en fallo (preservación de datos)
    - **Propiedad 7: el estado del formulario no cambia tras un envío fallido**
    - Mockear `crearDenuncia` para que lance error; verificar que el estado antes y después es idéntico
    - Usar `fast-check`, mínimo 100 iteraciones
    - _Valida: Requisitos 8.5, 10.1, 10.2_

  - [ ]* 4.5 Escribir test de propiedad P8 para `submit` (no concurrencia)
    - **Propiedad 8: una segunda llamada a `submit()` mientras `isSubmitting=true` es ignorada**
    - Verificar que `crearDenuncia` se llama exactamente una vez aunque `submit()` se invoque dos veces en paralelo
    - _Valida: Requisito 8.2_

  - [ ]* 4.6 Escribir test de propiedad P9 para el límite de reintentos
    - **Propiedad 9: `retryCount` nunca supera 3 y bloquea el formulario al llegar a ese límite**
    - Para cualquier número `n` de fallos consecutivos, `retryCount` al finalizar es `min(n, 3)`
    - Cuando `retryCount === 3`, `isFormValid` retorna `false`
    - _Valida: Requisito 10.3_

- [x] 5. Punto de control intermedio
  - Verificar que todos los tests de las tareas 2, 3 y 4 pasan sin errores.
  - Asegurarse que `validateCalleAltura`, `normalizeText`, `filtrarLocalidades` y `useReportForm` están correctamente exportados y tipados.
  - Preguntar al usuario si hay ajustes antes de continuar con los componentes UI.

- [x] 6. Implementar componentes UI reutilizables
  - [x] 6.1 Crear `src/components/GravedadSelector.tsx`
    - Props: `value: 'LEVE' | 'MODERADA' | 'GRAVE' | null`, `onChange: (g: Gravedad) => void`
    - Renderizar tres chips horizontales; solo uno activo a la vez
    - Colores según tabla del diseño: LEVE → `botonPrincipal`, MODERADA → `textoAdvertencia`, GRAVE → `error`; fondo no seleccionado → `fondoTarjeta`
    - Usar únicamente tokens de `theme.ts`
    - _Requisitos: 4.1, 4.2_

  - [ ]* 6.2 Escribir tests unitarios para `GravedadSelector`
    - Verificar que los tres chips se renderizan
    - Verificar que al seleccionar un chip, sólo ese queda en estado activo
    - _Requisitos: 4.1, 4.2_

  - [x] 6.3 Crear `src/components/LocalidadAutocomplete.tsx`
    - Props: `value: string | null`, `inputText: string`, `onSelect`, `onChangeText`
    - Mostrar dropdown cuando `query.length >= 3` y hay resultados
    - Mostrar "No se encontraron localidades disponibles" cuando la búsqueda no tiene resultados
    - Cerrar dropdown al seleccionar o al perder el foco
    - Llamar `onChangeText` si el usuario edita el texto después de haber seleccionado (invalida selección)
    - _Requisitos: 6.1, 6.2, 6.3, 6.7, 6.8, 6.9_

  - [ ]* 6.4 Escribir tests unitarios para `LocalidadAutocomplete`
    - Verificar que con query `'pil'` se muestran `Pilar` y `Pilar Sur` (Req. 6.4)
    - Verificar que con query `'villa'` se muestran `Villa Astolfi` y `Villa Rosa` (Req. 6.5)
    - Verificar que con query `'fat'` se muestra `Fátima` (Req. 6.6)
    - Verificar que un query sin coincidencias muestra "No se encontraron localidades disponibles" (Req. 6.7)
    - _Requisitos: 6.4, 6.5, 6.6, 6.7_

- [x] 7. Implementar las pantallas nuevas
  - [x] 7.1 Crear `src/screens/citizen/ReportCameraScreen.tsx` (refactor de `ReportScreen.tsx`)
    - Renombrar componente a `ReportCameraScreen`; tipar props con `ReportCameraScreenProps`
    - `takePicture`: navega a `ReportForm` con `{ fotoUri }` en éxito; guarda `captureError` en fallo
    - Estado local `captureError: string | null`; mostrar error inline sin navegar
    - Permiso denegado permanentemente (`canAskAgain=false`): mostrar mensaje + botón `Linking.openSettings()`
    - Mantener todos los estilos y tokens existentes del archivo original
    - _Requisitos: 1.1, 1.2, 1.3, 1.4, 2.1, 2.2, 2.3, 2.4, 2.5_

  - [x] 7.2 Crear `src/screens/citizen/ReportFormScreen.tsx`
    - Recibe `fotoUri` como parámetro de ruta; tipar props con `ReportFormScreenProps`
    - Mostrar miniatura de la foto (mínimo 80×80 dp)
    - Orquestar `GravedadSelector`, `LocalidadAutocomplete`, campo de calle/altura (máx. 100 chars)
    - Consumir `useReportForm(fotoUri)` para todo el estado y lógica de envío
    - `CustomButton` deshabilitado cuando `!isFormValid || isSubmitting`; mostrar `ActivityIndicator` durante envío
    - Mostrar `lastError` inline cuando hay error de envío
    - Mostrar mensajes de validación por campo cuando el usuario intenta enviar con campos incompletos
    - Usar únicamente tokens de `theme.ts`; reutilizar `CustomButton` y `Header`
    - _Requisitos: 3.1, 3.2, 3.3, 4.1, 4.2, 4.3, 5.1, 5.2, 5.3, 5.4, 6.1, 7.1, 7.2, 7.3, 8.1, 8.2, 8.4, 8.5, 8.6, 10.1, 10.2, 10.3_

  - [x] 7.3 Crear `src/screens/citizen/ReportConfirmationScreen.tsx`
    - Mostrar el texto exacto: *"¡Muchas gracias por tu reporte! Si el mismo es correcto, recibirás 600 Eco Points"*
    - Botón "Continuar" que llama a `navigation.getParent()?.navigate('Inicio')`
    - **NO llamar a `updateUserPoints`**
    - Usar únicamente tokens de `theme.ts`; reutilizar `CustomButton` y `Header`
    - _Requisitos: 9.1, 9.2, 9.3, 9.4_

  - [ ]* 7.4 Escribir test de propiedad P10 para `ReportConfirmationScreen` (no modifica `user.points`)
    - **Propiedad 10: el envío exitoso no modifica `user.points` ni llama a `updateUserPoints`**
    - Mockear `AuthContext`; verificar que `updateUserPoints` no fue invocada tras el flujo de confirmación
    - _Valida: Requisito 9.3_

  - [ ]* 7.5 Escribir tests unitarios para `ReportCameraScreen`
    - Verificar que se muestra el mensaje de permiso cuando `permission.granted=false`
    - Verificar que se muestra el botón de Settings cuando `canAskAgain=false`
    - _Requisitos: 1.1, 1.4_

  - [ ]* 7.6 Escribir tests unitarios para `ReportConfirmationScreen`
    - Verificar que el texto exacto del mensaje está presente en pantalla
    - Verificar que presionar "Continuar" invoca `navigation.getParent()?.navigate('Inicio')`
    - _Requisitos: 9.1, 9.4_

- [x] 8. Integrar navegación en `MainNavigator.tsx`
  - [x] 8.1 Agregar `ReportNavigator` en `MainNavigator.tsx` y cambiar el tab `Camara`
    - Importar `ReportCameraScreen`, `ReportFormScreen`, `ReportConfirmationScreen`
    - Crear `ReportStack = createNativeStackNavigator<ReportStackParamList>()`
    - Definir `ReportNavigator` con las tres pantallas (`ReportCamera`, `ReportForm`, `ReportConfirmation`) y `headerShown: false`
    - Cambiar `component={ReportScreen}` a `component={ReportNavigator}` en el tab `"Camara"`
    - Mantener `ReportScreen.tsx` como re-export de `ReportCameraScreen` para no romper importaciones existentes
    - _Requisitos: 2.3, 8.3, 9.4_

- [x] 9. Punto de control final
  - Ejecutar la suite de tests completa con `jest --runInBand` y verificar que todos pasan.
  - Verificar que el tab `Camara` navega correctamente a `ReportCameraScreen` y el flujo completo es funcional.
  - Preguntar al usuario si hay ajustes o correcciones antes de cerrar la feature.

---

## Notes

- Las tareas marcadas con `*` son opcionales y pueden omitirse para un MVP rápido.
- Cada tarea referencia los requisitos específicos para garantizar trazabilidad.
- Los puntos de control (tareas 5 y 9) son obligatorios para validar el progreso incremental.
- `denunciasService.ts` **no debe modificarse** bajo ninguna circunstancia.
- `updateUserPoints` **no debe llamarse** en ninguna de las pantallas o hooks implementados.
- Los tests de propiedad usan `fast-check` con mínimo 100 iteraciones (`numRuns: 100`).
- El formato del tag de referencia para tests de propiedad es: `Feature: environmental-report-creation, Property N: <texto>`.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1", "1.2"] },
    { "id": 1, "tasks": ["2.1", "3.1"] },
    { "id": 2, "tasks": ["2.2", "2.3", "3.2", "4.1"] },
    { "id": 3, "tasks": ["4.2", "4.3", "4.4", "4.5", "4.6", "6.1", "6.3"] },
    { "id": 4, "tasks": ["6.2", "6.4", "7.1", "7.2", "7.3"] },
    { "id": 5, "tasks": ["7.4", "7.5", "7.6", "8.1"] }
  ]
}
```
