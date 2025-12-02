# E2E Tests with Detox

Sprint 12 - US-111: Tests E2E en Mobile con Detox

## Configuración

### Requisitos Previos

**Para iOS:**

- macOS
- Xcode 15+
- iOS Simulator
- CocoaPods

**Para Android:**

- Android Studio
- Android SDK (API 34)
- Emulador Android configurado

### Instalación

```bash
# Instalar dependencias
pnpm install

# Para iOS: Instalar pods
cd ios && pod install && cd ..
```

## Ejecutar Tests

### Android

```bash
# 1. Iniciar emulador Android
# Abrir Android Studio > AVD Manager > Start Pixel_7_API_34

# 2. Build de la app
pnpm build:e2e:android

# 3. Ejecutar tests
pnpm test:e2e:android
```

### iOS

```bash
# 1. Build de la app
pnpm build:e2e:ios

# 2. Ejecutar tests
pnpm test:e2e:ios
```

### Ejecutar un test específico

```bash
# Android
detox test --configuration android.emu.debug e2e/auth.e2e.ts

# iOS
detox test --configuration ios.sim.debug e2e/auth.e2e.ts
```

## Estructura de Tests

```
e2e/
├── jest.config.js       # Configuración de Jest para Detox
├── setup.ts             # Setup global de tests
├── auth.e2e.ts          # Tests de autenticación
├── habits.e2e.ts        # Tests de hábitos
├── tasks.e2e.ts         # Tests de tareas
└── notifications.e2e.ts # Tests de notificaciones
```

## Tests Implementados

### 1. Authentication Flow (`auth.e2e.ts`)

- ✅ Registro de usuario
- ✅ Login con credenciales válidas
- ✅ Login con credenciales inválidas
- ✅ Validación de formularios
- ✅ Logout

### 2. Habits Flow (`habits.e2e.ts`)

- ✅ Crear hábito CHECK
- ✅ Crear hábito NUMERIC
- ✅ Ver hábitos del día
- ✅ Marcar hábito como completado
- ✅ Actualizar progreso de hábito numérico
- ✅ Ver estadísticas
- ✅ Ver calendario de completados
- ✅ Filtrar por categoría

### 3. Tasks Flow (`tasks.e2e.ts`)

- ✅ Crear tarea con checklist
- ✅ Validación de campos requeridos
- ✅ Marcar tarea como completada
- ✅ Completar items de checklist
- ✅ Filtrar por prioridad (HIGH, MEDIUM, LOW)
- ✅ Filtrar por categoría
- ✅ Ordenar por fecha de vencimiento
- ✅ Ordenar por prioridad
- ✅ Editar tarea
- ✅ Eliminar tarea

### 4. Notifications Flow (`notifications.e2e.ts`)

- ✅ Configurar notificación para hábito
- ✅ Configurar notificación para tarea
- ✅ Simular recepción de notificación
- ✅ Verificar deep linking
- ✅ Permisos de notificaciones
- ✅ Preferencias de notificaciones
- ✅ Programación de notificaciones diarias
- ✅ Agrupar notificaciones

## Test IDs (testID)

Para que los tests funcionen, los componentes deben tener `testID` configurados:

### Autenticación

- `auth-container`
- `login-email-input`
- `login-password-input`
- `login-submit-button`
- `register-link`
- `register-screen`
- `register-name-input`
- `register-email-input`
- `register-password-input`
- `register-confirm-password-input`
- `register-submit-button`

### Navegación Principal

- `main-tabs`
- `tab-habits`
- `tab-tasks`
- `tab-events`
- `tab-finances`
- `tab-profile`

### Hábitos

- `habits-screen`
- `habits-list`
- `habit-card`
- `habit-check-button`
- `create-habit-button`
- `habit-form`
- `habit-name-input`
- `habit-type-CHECK`
- `habit-type-NUMERIC`

### Tareas

- `tasks-screen`
- `tasks-list`
- `task-card`
- `task-checkbox`
- `create-task-button`
- `task-form`
- `task-title-input`
- `task-priority-HIGH`

### Notificaciones

- `habit-notification-toggle`
- `habit-notification-time-picker`
- `notification-settings`

## Troubleshooting

### Android

**Error: No emulator found**

```bash
# Crear AVD
avdmanager create avd -n Pixel_7_API_34 -k "system-images;android-34;google_apis;x86_64"
```

**Error: Build failed**

```bash
# Limpiar build
cd android && ./gradlew clean && cd ..
```

### iOS

**Error: Simulator not found**

```bash
# Listar simuladores disponibles
xcrun simctl list devices
```

**Error: Pod install failed**

```bash
cd ios
pod deintegrate
pod install
cd ..
```

## CI/CD

Los tests E2E se ejecutan automáticamente en GitHub Actions:

- En cada push a `main` o `develop`
- En cada Pull Request
- Solo si hay cambios en `apps/mobile/**` o `packages/shared/**`

Ver: `.github/workflows/mobile-e2e-tests.yml`

## Mejores Prácticas

1. **Test IDs estables:** Usar testID en lugar de texto que puede cambiar
2. **Tests independientes:** Cada test debe ser independiente
3. **Cleanup:** Limpiar datos de prueba después de cada test
4. **Timeouts:** Usar timeouts adecuados para acciones async
5. **Mock de backend:** Usar datos de prueba o staging environment

## Recursos

- [Detox Documentation](https://wix.github.io/Detox/)
- [Jest Documentation](https://jestjs.io/)
- [Expo + Detox Guide](https://docs.expo.dev/guides/detox/)
