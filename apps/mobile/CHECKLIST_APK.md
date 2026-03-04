# ✅ Checklist para Generar APK con Notificaciones

## 📋 Pre-Build (Obligatorio)

### 1. Dependencias y Compatibilidad

- [ ] **Actualizar paquetes Expo**
  ```bash
  cd apps/mobile
  npx expo install --check --fix
  ```

- [ ] **Remover @types/react-native**
  ```bash
  pnpm remove @types/react-native
  ```

- [ ] **Resolver duplicados de React**
  ```bash
  # En raíz del proyecto
  pnpm add -w react@19.1.0 react-dom@19.1.0
  ```

- [ ] **Agregar overrides en package.json**
  ```json
  {
    "pnpm": {
      "overrides": {
        "react": "19.1.0",
        "react-native-safe-area-context": "5.6.2"
      }
    }
  }
  ```

- [ ] **Reinstalar todo**
  ```bash
  pnpm install
  ```

### 2. Assets (Obligatorio)

- [ ] **Crear directorio assets**
  ```bash
  mkdir -p assets
  ```

- [ ] **Generar assets con herramienta online**
  - Ir a: https://makeappicon.com/ o https://romannurik.github.io/AndroidAssetStudio/
  - Subir logo de Horus (si tienes) o crear uno simple
  - Descargar pack de assets

- [ ] **Colocar assets en carpeta**
  - `assets/icon.png` (1024x1024) - Ícono de la app
  - `assets/adaptive-icon.png` (1024x1024) - Ícono adaptativo Android
  - `assets/notification-icon.png` (96x96) - Ícono de notificaciones
  - `assets/splash.png` (1284x2778) - Pantalla de carga
  - `assets/favicon.png` (48x48) - Para web

### 3. Firebase (Obligatorio para Notificaciones Push)

- [ ] **Crear/Abrir proyecto Firebase**
  - Ir a: https://console.firebase.google.com/
  - Crear proyecto "Horus" o usar existente

- [ ] **Agregar app Android**
  - Package name: `com.horus.app`
  - Nickname: "Horus Android"

- [ ] **Descargar google-services.json**
  - Descargar desde Firebase Console
  - Colocar en `apps/mobile/google-services.json`

- [ ] **Habilitar Cloud Messaging**
  - Firebase Console → Project Settings → Cloud Messaging
  - Copiar Server Key (necesario para backend)

### 4. Configuración de app.json

- [ ] **Hacer backup**
  ```bash
  cp app.json app.json.backup
  ```

- [ ] **Usar versión corregida**
  ```bash
  cp app.json.fixed app.json
  ```

- [ ] **Verificar propiedades críticas**
  - `expo.android.package`: "com.horus.app"
  - `expo.android.googleServicesFile`: "./google-services.json"
  - Plugin `expo-notifications` presente
  - Sin propiedades deprecadas (entryPoint, useNextNotificationsApi)

### 5. EAS Setup (Si usas Alternativa 1)

- [ ] **Instalar EAS CLI**
  ```bash
  npm install -g eas-cli
  ```

- [ ] **Login en Expo**
  ```bash
  eas login
  ```

- [ ] **Configurar EAS**
  ```bash
  cd apps/mobile
  eas build:configure
  ```

- [ ] **Obtener Project ID**
  ```bash
  eas project:info
  ```

- [ ] **Agregar Project ID a app.json**
  ```json
  {
    "expo": {
      "extra": {
        "eas": {
          "projectId": "tu-project-id-aqui"
        }
      }
    }
  }
  ```

### 6. Verificación Final

- [ ] **Ejecutar doctor**
  ```bash
  npx expo-doctor
  ```

  Objetivo: ✅ Máximo 2-3 warnings (assets opcionales)

- [ ] **Verificar archivos críticos existen**
  ```bash
  # Deben existir:
  apps/mobile/google-services.json
  apps/mobile/assets/icon.png
  apps/mobile/assets/adaptive-icon.png
  apps/mobile/assets/notification-icon.png
  apps/mobile/assets/splash.png
  ```

---

## 🚀 Build (Elige tu alternativa)

### Opción A: EAS Build (Recomendado)

- [ ] **Build de Preview (APK)**
  ```bash
  eas build --platform android --profile preview
  ```

- [ ] **Esperar build (~15 minutos)**
  - Ver progreso: https://expo.dev/accounts/[tu-usuario]/projects/horus/builds

- [ ] **Descargar APK**
  - Copiar link del build exitoso
  - Descargar en PC o directamente en móvil

### Opción B: Build Local

- [ ] **Instalar Android Studio**
  - Descargar de: https://developer.android.com/studio
  - Instalar SDK 34

- [ ] **Configurar variables**
  ```powershell
  setx ANDROID_HOME "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"
  ```

- [ ] **Generar proyecto Android**
  ```bash
  npx expo prebuild --platform android
  ```

- [ ] **Build Debug**
  ```bash
  cd android
  ./gradlew assembleDebug
  ```

- [ ] **APK generado en**
  ```
  android/app/build/outputs/apk/debug/app-debug.apk
  ```

---

## 📱 Testing

### 1. Instalación

- [ ] **Transferir APK a móvil**
  - Por cable USB
  - Por email/Drive/WhatsApp
  - Desde navegador del móvil

- [ ] **Habilitar instalación de apps desconocidas**
  - Settings → Security → Unknown sources

- [ ] **Instalar APK**

### 2. Testing de Funcionalidad Básica

- [ ] App abre correctamente
- [ ] Login/registro funciona
- [ ] Navegación entre pantallas fluida
- [ ] Datos se cargan del backend

### 3. Testing de Notificaciones

- [ ] **Verificar permisos**
  - App solicita permiso de notificaciones al abrir
  - Aceptar permiso

- [ ] **Verificar registro en backend**
  ```bash
  # Verificar en logs del backend que se registró el token
  # O consultar tabla PushToken en BD
  ```

- [ ] **Enviar notificación de prueba**
  ```bash
  curl -X POST https://tu-backend.com/api/push/test \
    -H "Authorization: Bearer TU_TOKEN" \
    -H "Content-Type: application/json" \
    -d '{
      "title": "Test Notification",
      "body": "Testing Horus push notifications",
      "data": {
        "type": "test"
      }
    }'
  ```

- [ ] **Verificar recepción**
  - Con app en foreground: notificación aparece en pantalla
  - Con app en background: notificación en notification tray
  - Al tocar notificación: app abre correctamente

- [ ] **Verificar deep linking**
  - Enviar notificación con data.type específico
  - Verificar que navega a la pantalla correcta

### 4. Testing de Funcionalidades Específicas

- [ ] **Hábitos**
  - Crear hábito
  - Marcar como completado
  - Ver estadísticas

- [ ] **Tareas**
  - Crear tarea
  - Agregar checklist
  - Completar tarea

- [ ] **Finanzas**
  - Ver cuentas
  - Registrar transacción
  - Ver gastos mensuales

- [ ] **Entrenamientos**
  - Ver rutinas
  - Ejecutar entrenamiento
  - Ver historial

---

## 🐛 Troubleshooting

### Problema: "Build failed en EAS"

**Solución:**

```bash
# Ver logs detallados
eas build:view --platform android

# Común: falta google-services.json
# Verificar que existe y está en la raíz de mobile/
```

### Problema: "APK no instala"

**Solución:**

```bash
# Verificar firma digital
# En build local, asegurar que usaste assembleDebug (no requiere firma)

# Si persiste, generar nuevo build
eas build --platform android --profile preview --clear-cache
```

### Problema: "Notificaciones no llegan"

**Solución:**

1. Verificar google-services.json está configurado
2. Verificar token se guardó en backend (tabla PushToken)
3. Verificar backend tiene Firebase Admin SDK configurado
4. Verificar permisos de notificaciones en el móvil
5. Probar enviar notificación desde Firebase Console directamente

### Problema: "App crashea al abrir"

**Solución:**

```bash
# Ver logs en tiempo real
adb logcat | grep Horus

# O usar Sentry (ya configurado)
# Ver crashes en: sentry.io
```

### Problema: "Duplicados de React persisten"

**Solución:**

```bash
# Limpiar todo y reinstalar
cd ../..
rm -rf node_modules
rm -rf apps/*/node_modules
rm -rf packages/*/node_modules
pnpm install
```

---

## 📊 Métricas de Éxito

### Build exitoso si:

- ✅ APK generado sin errores
- ✅ APK instala en dispositivo Android
- ✅ App abre sin crashes
- ✅ Login funciona
- ✅ Notificaciones se reciben correctamente
- ✅ Deep linking funciona
- ✅ Todas las pantallas principales accesibles

### Listo para distribución beta si:

- ✅ Todo lo anterior +
- ✅ Testing en múltiples dispositivos Android (diferentes versiones)
- ✅ Notificaciones testeadas exhaustivamente
- ✅ Performance aceptable (sin lag notable)
- ✅ Backend en producción estable
- ✅ Sentry configurado para monitoring

---

## 🎉 ¡Éxito!

Si completaste todos los checks, tienes:

✅ APK funcional con notificaciones push
✅ App lista para testing beta
✅ Pipeline de build establecido

**Próximos pasos:**

1. Distribución interna (TestFlight/Firebase App Distribution)
2. Gather feedback
3. Iterar
4. Preparar para Google Play Store

---

## 📞 Soporte

- 📖 Documentación completa: `BUILD_STRATEGIES.md`
- 🔧 Corrección rápida: `fix-deps.ps1` (Windows) o `fix-deps.sh` (Mac/Linux)
- 🌐 Expo Forums: https://forums.expo.dev
- 💬 Discord Expo: https://chat.expo.dev
