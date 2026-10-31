# Tasks: Onboarding, categorías y baja de productos

## Phase 1: Onboarding (US1)

- [x] T001 [US1] Crear `client/src/screens/auth/OnboardingPantalla.tsx`
- [x] T002 [P] [US1] Flag `vistoOnboarding` en `client/src/utils/storage.ts`
- [x] T003 [P] [US1] `client/metro.config.js` con soporte `.jfif`
- [x] T004 [US1] Ruta `Onboarding` y primera apertura en `client/src/navigation/AppNavigator.tsx`

## Phase 2: Categorías (US2)

- [x] T005 [P] [US2] Crear `client/src/utils/categoriasProducto.ts`
- [x] T006 [US2] `categoria` en `IStoreRepository`, `RemoteStoreRepository` y `LocalStoreRepository`
- [x] T007 [US2] Selector de categoría en `client/src/screens/admin/AdminProductosScreen.tsx`
- [x] T008 [US2] Validación de categoría en `server/src/controllers/productos.controller.ts`
- [x] T009 [US2] Filtro real en `client/src/screens/citizen/StoreScreen.tsx`

## Phase 3: Eliminar producto (US3)

- [x] T010 [US3] `eliminarProducto` transaccional en `productos.controller.ts`
- [x] T011 [US3] Ruta `DELETE /:id/permanente` en `server/src/routes/productos.routes.ts`
- [x] T012 [US3] `deleteProduct` y `DeleteProductResult` en repositorios
- [x] T013 [US3] Botón "Eliminar" con confirmación en `AdminProductosScreen.tsx`

## Phase 4: Notificaciones (US4)

- [x] T014 [US4] Modelo `Notificacion` en `server/prisma/schema.prisma`
- [x] T015 [P] [US4] `notificaciones.controller.ts` y `notificaciones.routes.ts`, montado en `server/src/index.ts`
- [x] T016 [P] [US4] `client/src/services/notificacionesService.ts`
- [x] T017 [US4] Avisos en `client/src/components/citizen/CitizenNotificationsModal.tsx`

## Phase 5: Imagen de producto y orden de lista (US5, US6)

- [x] T024 [US5] Crear `server/src/utils/supabaseStorage.ts` (subida por API REST de Supabase Storage)
- [x] T025 [US5] `subirImagen` en `server/src/controllers/productos.controller.ts` y ruta `POST /imagen` en `productos.routes.ts`
- [x] T026 [P] [US5] Variables de Supabase en `server/.env.example`
- [x] T027 [P] [US5] Crear `client/src/services/imagenProductoService.ts` (compresión y subida)
- [x] T028 [US5] Selector, vista previa y botones de imagen en `AdminProductosScreen.tsx`
- [x] T029 [US6] Orden de la lista de productos en `AdminProductosScreen.tsx`

## Phase 6: Verificación pendiente

- [x] T030 Crear el bucket público `productos` y configurar las variables de Supabase en `server/.env`
- [x] T031 Verificación manual de subida de imagen en Expo Go y de que la tienda la muestra
- [ ] T032 Tests de `supabaseStorage` (formato inválido, configuración faltante)

- [x] T018 Ejecutar en `server/`: `npx prisma migrate dev --name notificaciones` y `npx prisma generate`
- [ ] T019 Ejecutar `tsc` en `client/` y `server/`
- [ ] T020 Tests de integración de baja con reembolso
- [ ] T021 Tests de validación de categorías
- [x] T022 Verificación manual en Expo Go (onboarding, categorías, baja con reembolso)
- [ ] T023 Actualizar `specs/BACKLOG_MODULOS_Y_HU.md`
