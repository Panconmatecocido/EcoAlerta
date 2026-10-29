# Feature Specification: Fotos de Perfil del Personal

**Feature Branch**: `007-foto-perfil-agente`

**Created**: 2026-10-28

**Status**: Draft

**Input**: User description: "Me gustaria que se pueda visualizar una foto de perfil para el agente. Pero solo la pueda tomar el administrador al momento del registro."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Capturar la Foto del Personal al Crear su Cuenta (Priority: P1)

El administrador toma una foto con la cámara durante el alta de una cuenta de Agente o Colaborador. La foto queda asociada al perfil creado y el alta no se completa si falta una imagen válida.

**Why this priority**: La captura durante el registro asegura que la identidad visual del personal municipal sea proporcionada exclusivamente por el administrador y evita cuentas sin la información requerida.

**Independent Test**: Un administrador crea una cuenta de cada rol con una foto tomada en el momento y verifica que cada perfil conserva la imagen; intenta crear cuentas sin foto y comprueba que se le solicita capturarla.

**Acceptance Scenarios**:

1. **Given** un administrador selecciona el rol Agente o Colaborador, **When** toma una foto con la cámara y crea una cuenta válida, **Then** la foto queda asociada a la persona.
2. **Given** un administrador intenta crear una cuenta de Agente o Colaborador sin foto, **When** envía el formulario, **Then** la cuenta no se crea y se informa que debe tomar una foto.
3. **Given** el administrador cambia el rol seleccionado, **When** vuelve a tomar una foto, **Then** solo esa nueva captura queda asociada a la cuenta creada.

### User Story 2 - Ver la Foto en el Perfil del Personal (Priority: P1)

Al iniciar sesión, el Agente ve su foto de perfil en el encabezado de su pantalla principal y el Colaborador la ve en su tarjeta de identificación. Si una cuenta existente aún no tiene foto, la aplicación muestra un avatar alternativo.

**Why this priority**: Hace visible la identidad del personal capturada por el municipio sin impedir el acceso a cuentas existentes.

**Independent Test**: Iniciar sesión con cuentas nuevas de Agente y Colaborador y verificar que aparece su foto; iniciar sesión con cuentas antiguas sin foto y verificar que aparece el avatar alternativo.

**Acceptance Scenarios**:

1. **Given** un Agente con una foto registrada, **When** inicia sesión, **Then** ve esa foto en el encabezado de su pantalla principal.
2. **Given** un Colaborador con una foto registrada, **When** inicia sesión, **Then** ve esa foto en su pantalla principal.
3. **Given** una cuenta preexistente de Agente o Colaborador sin una foto registrada, **When** inicia sesión, **Then** ve un avatar alternativo y puede usar el resto de la aplicación.
4. **Given** un Agente o Colaborador autenticado, **When** utiliza la aplicación, **Then** no tiene una acción para tomar, cambiar o cargar su foto.

## Edge Cases

- Si el administrador deniega el permiso de cámara, la cuenta de personal no se crea y se informa cómo habilitar el permiso.
- Si la captura o el procesamiento de la imagen falla, se informa el error y se conservan los demás datos del formulario para reintentar.
- Si la imagen excede el tamaño permitido o no es válida, el alta se rechaza sin guardar una cuenta incompleta.
- Las cuentas de Agente o Colaborador ya existentes sin foto continúan pudiendo iniciar sesión y muestran el avatar alternativo.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: El sistema DEBE permitir que únicamente un administrador autenticado capture la foto de perfil de un Agente o Colaborador durante la creación de su cuenta.
- **FR-002**: El sistema DEBE requerir una foto válida para completar el alta de nuevas cuentas de Agente y Colaborador.
- **FR-003**: El formulario DEBE ofrecer captura mediante cámara y no permitir elegir una imagen de galería para este flujo.
- **FR-004**: El sistema DEBE guardar la foto junto con el perfil del Agente o Colaborador y recuperarla al iniciar sesión.
- **FR-005**: La aplicación DEBE mostrar la foto guardada en la pantalla principal del rol correspondiente y mostrar un avatar alternativo cuando no haya una foto disponible.
- **FR-006**: El sistema NO DEBE permitir que el Agente o Colaborador cambie su foto de perfil desde su sesión.
- **FR-008**: El sistema DEBE rechazar imágenes inválidas o que superen el tamaño permitido, sin crear la cuenta.

### Key Entities *(include if feature involves data)*

- **Perfil de usuario**: Identidad municipal que incluye el rol y, para nuevos Agentes, una foto capturada al crear la cuenta.
- **Foto de perfil**: Imagen asociada al Agente, proporcionada por un administrador autenticado durante el alta y visible al iniciar sesión.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: El 100% de las nuevas cuentas de Agente y Colaborador creadas por administradores tiene una foto válida asociada.
- **SC-002**: El personal con una foto registrada la visualiza al iniciar sesión y cargar su pantalla principal.
- **SC-003**: Las cuentas preexistentes sin foto siguen pudiendo iniciar sesión y completar sus flujos sin errores.
- **SC-004**: Los intentos de alta de personal sin foto o con una imagen inválida no crean una cuenta.

## Assumptions

- La cámara del dispositivo del administrador es el único origen permitido de la foto en el formulario de alta.
- La foto es obligatoria para nuevas cuentas de Agentes y Colaboradores; las cuentas existentes conservan compatibilidad y muestran un avatar alternativo.
- La captura, compresión y almacenamiento se realizan durante el alta y no se agrega una función posterior de edición de la foto.
