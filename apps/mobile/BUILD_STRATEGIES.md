# 📱 Estrategias para Generar APK con Notificaciones - Horus

## 🎯 Comparación de Alternativas

| Característica | Alternativa 1: EAS Build | Alternativa 2: Local Build | Alternativa 3: Expo Go |
|----------------|-------------------------|----------------------------|------------------------|
| **Complejidad** | ⭐⭐ Media | ⭐⭐⭐⭐ Alta | ⭐ Baja |
| **Tiempo Setup** | 30-60 min | 2-4 horas | 10 min |
| **Notificaciones Push** | ✅ Completas | ✅ Completas | ❌ Solo dev |
| **Build en Cloud** | ✅ Sí | ❌ No | N/A |
| **Costo** | Gratis tier | Gratis | Gratis |
| **APK Instalable** | ✅ Sí | ✅ Sí | ❌ No |
| **Producción Ready** | ✅ Sí | ✅ Sí | ❌ No |
| **Requiere Android Studio** | ❌ No | ✅ Sí | ❌ No |

---

## 🏆 **ALTERNATIVA 1: EAS Build (RECOMENDADA)**

### ✅ Ventajas
- Build en la nube (no requiere Android Studio)
- Configuración más simple
- Integración automática con Firebase
- Soporte oficial de Expo
- CI/CD integrado
- OTA Updates disponibles

### ❌ Desventajas
- Requiere cuenta Expo
- Límites en tier gratuito (30 builds/mes)
- Dependencia de internet

### 🚀 Implementación Paso a Paso

#### 1. **Instalar EAS CLI**

```bash
npm install -g eas-cli
```

#### 2. **Login en Expo**

```bash
eas login
```

#### 3. **Configurar Proyecto**

```bash
cd apps/mobile
eas build:configure
```

Esto creará/actualizará `eas.json`.

#### 4. **Corregir Compatibilidad** (CRÍTICO)

```bash
# Actualizar dependencias
npx expo install --check --fix

# Remover duplicados
pnpm remove @types/react-native

# En la raíz del proyecto
pnpm add -w react@19.1.0 react-dom@19.1.0

# Reinstalar
pnpm install
```

#### 5. **Crear Assets Mínimos**

Si no tienes assets, crea imágenes temporales:

```bash
# En apps/mobile/assets/

# Usar cualquier imagen 1024x1024 como:
# - icon.png
# - adaptive-icon.png
# - notification-icon.png

# Y 1284x2778 como:
# - splash.png
```

**Tip:** Usa https://makeappicon.com/ para generar todos los assets.

#### 6. **Configurar Firebase**

```bash
# 1. Ve a Firebase Console → Proyecto → Configuración del proyecto
# 2. Descarga google-services.json
# 3. Colócalo en apps/mobile/google-services.json
```

#### 7. **Reemplazar app.json**

```bash
# Backup del actual
cp app.json app.json.backup

# Usar el corregido
cp app.json.fixed app.json
```

Editar `app.json` y agregar tu EAS Project ID:

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

Para obtener tu Project ID:

```bash
eas project:info
```

#### 8. **Build de Preview (APK)**

```bash
eas build --platform android --profile preview
```

Este comando:
- Sube tu código a EAS
- Compila en la nube
- Genera un APK descargable
- Tiempo estimado: 10-20 minutos

#### 9. **Descargar e Instalar**

Una vez completo, obtendrás un link para descargar el APK:

```
https://expo.dev/artifacts/eas/xxxxx.apk
```

Transfiere el APK a tu dispositivo Android e instala.

#### 10. **Testing de Notificaciones**

```bash
# Desde el backend
curl -X POST http://tu-backend.com/api/push/test \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Testing push notifications"
  }'
```

### 📋 Checklist Final

- [ ] `eas-cli` instalado globalmente
- [ ] Login en cuenta Expo
- [ ] `eas.json` configurado
- [ ] Dependencias actualizadas (`npx expo install --check --fix`)
- [ ] Duplicados de React resueltos
- [ ] Assets creados (icon, splash, etc.)
- [ ] `google-services.json` presente
- [ ] `app.json` corregido (sin propiedades deprecadas)
- [ ] EAS Project ID configurado
- [ ] Build exitoso
- [ ] APK descargado e instalado
- [ ] Notificaciones testeadas

---

## 🛠️ **ALTERNATIVA 2: Build Local con Android Studio**

### ✅ Ventajas
- Control total del proceso
- Sin límites de builds
- Debugging nativo más fácil
- No requiere internet para build

### ❌ Desventajas
- Setup complejo (Android Studio, SDK, JDK, Gradle)
- Requiere ~20GB de espacio
- Configuración manual de Firebase
- Proceso largo (primera vez)

### 🚀 Implementación

#### 1. **Instalar Prerrequisitos**

**Windows:**

```powershell
# Instalar Chocolatey (package manager)
Set-ExecutionPolicy Bypass -Scope Process -Force
iex ((New-Object System.Net.WebClient).DownloadString('https://chocolatey.org/install.ps1'))

# Instalar JDK 17
choco install -y openjdk17

# Descargar e instalar Android Studio
# https://developer.android.com/studio
```

#### 2. **Configurar Android Studio**

1. Abrir Android Studio
2. SDK Manager → Install:
   - Android SDK Platform 34
   - Android SDK Build-Tools 34.0.0
   - Android SDK Platform-Tools
   - Android Emulator

3. Configurar variables de entorno:

```powershell
# Windows - Agregar a PATH
setx ANDROID_HOME "C:\Users\TU_USUARIO\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"
```

#### 3. **Preparar Proyecto**

```bash
cd apps/mobile

# Corregir dependencias (igual que Alternativa 1)
npx expo install --check --fix
pnpm remove @types/react-native

# Generar carpeta android/
npx expo prebuild --platform android
```

Esto crea la carpeta `android/` con el proyecto nativo.

#### 4. **Configurar Firebase Manualmente**

```bash
# Copiar google-services.json
cp google-services.json android/app/google-services.json
```

Editar `android/app/build.gradle` y agregar:

```gradle
apply plugin: 'com.google.gms.google-services'
```

#### 5. **Build Local**

```bash
cd android

# Debug APK
./gradlew assembleDebug

# Release APK (requiere signing)
./gradlew assembleRelease
```

El APK estará en:
```
android/app/build/outputs/apk/debug/app-debug.apk
```

#### 6. **Signing para Release**

Crear keystore:

```bash
keytool -genkeypair -v -storetype PKCS12 \
  -keystore horus-release-key.keystore \
  -alias horus-key-alias \
  -keyalg RSA -keysize 2048 -validity 10000
```

Configurar en `android/gradle.properties`:

```properties
HORUS_UPLOAD_STORE_FILE=horus-release-key.keystore
HORUS_UPLOAD_KEY_ALIAS=horus-key-alias
HORUS_UPLOAD_STORE_PASSWORD=tu_password
HORUS_UPLOAD_KEY_PASSWORD=tu_password
```

Y en `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file(HORUS_UPLOAD_STORE_FILE)
            storePassword HORUS_UPLOAD_STORE_PASSWORD
            keyAlias HORUS_UPLOAD_KEY_ALIAS
            keyPassword HORUS_UPLOAD_KEY_PASSWORD
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

#### 7. **Build Release Firmado**

```bash
cd android
./gradlew assembleRelease
```

APK firmado en:
```
android/app/build/outputs/apk/release/app-release.apk
```

### ⚠️ Problemas Comunes

**Error: SDK not found**
```bash
# Configurar ANDROID_HOME correctamente
export ANDROID_HOME=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools
```

**Error: Gradle version**
```bash
cd android
./gradlew wrapper --gradle-version=8.3
```

**Error: Java version**
```bash
# Usar Java 17
export JAVA_HOME=/path/to/jdk-17
```

---

## 📱 **ALTERNATIVA 3: Expo Go (Solo Testing Rápido)**

### ✅ Ventajas
- Setup instantáneo (0 configuración)
- Ideal para desarrollo rápido
- Hot reload ultrarrápido
- No requiere build

### ❌ Desventajas
- ❌ **NO soporta Firebase Cloud Messaging** (solo Expo Push)
- ❌ No genera APK instalable
- ❌ Limitado a paquetes incluidos en Expo Go
- ❌ No apto para producción

### 🚀 Implementación (Solo Testing)

#### 1. **Instalar Expo Go**

Desde Google Play Store, instalar **Expo Go**.

#### 2. **Iniciar Dev Server**

```bash
cd apps/mobile
pnpm dev
```

Escanea el QR con Expo Go.

#### 3. **Limitaciones de Notificaciones**

```typescript
// En Expo Go, solo puedes usar Expo Push Notifications
// NO Firebase Cloud Messaging

// Esto funcionará:
import * as Notifications from 'expo-notifications';
await Notifications.scheduleNotificationAsync({
  content: {
    title: "Test",
    body: "Local notification"
  },
  trigger: { seconds: 5 }
});

// Esto NO funcionará:
// - Firebase Admin SDK
// - Custom notification channels
// - FCM tokens
```

### 🔄 Migrar de Expo Go a Build Real

Para pasar de Expo Go a APK real:

```bash
# 1. Usar Alternativa 1 (EAS Build)
eas build --platform android --profile preview

# O Alternativa 2 (Local)
npx expo prebuild --platform android
cd android && ./gradlew assembleDebug
```

---

## 🎯 **¿Cuál Alternativa Elegir?**

### Para **Producción** → **Alternativa 1 (EAS Build)**
- App lista para usuarios reales
- Notificaciones push completas
- Actualizaciones OTA
- Menos problemas de configuración

### Para **Desarrollo Local Intensivo** → **Alternativa 2 (Local Build)**
- Debugging profundo
- Modificaciones nativas
- Sin depender de internet
- Control total

### Para **Prototipado Rápido** → **Alternativa 3 (Expo Go)**
- Testing de UI
- Validación de flujos
- Desarrollo de features no-nativas
- **NO para testing de notificaciones push**

---

## 📊 Tabla de Decisión

| Tu necesidad | Alternativa recomendada |
|--------------|------------------------|
| "Quiero testear en mi celular YA" | Alternativa 3 (Expo Go) |
| "Necesito APK con notificaciones funcionales" | Alternativa 1 (EAS Build) |
| "Quiero builds ilimitados sin internet" | Alternativa 2 (Local) |
| "Preparar para Google Play Store" | Alternativa 1 (EAS Build) |
| "Desarrollo de módulos nativos" | Alternativa 2 (Local) |
| "Testing de CI/CD" | Alternativa 1 (EAS Build) |

---

## 🔥 Quick Start (Alternativa 1)

```bash
# 1. Instalar CLI
npm install -g eas-cli

# 2. Login
eas login

# 3. Ir al proyecto
cd apps/mobile

# 4. Corregir dependencias
npx expo install --check --fix
pnpm remove @types/react-native

# 5. Configurar EAS
eas build:configure

# 6. Reemplazar app.json
cp app.json.fixed app.json

# 7. Build APK
eas build --platform android --profile preview

# 8. Esperar link de descarga (~15 min)
# 9. Descargar e instalar APK
# 10. ¡Profit! 🎉
```

---

## 🆘 Soporte

Si encuentras errores durante el build:

1. **Revisar logs**: `eas build:view --platform android`
2. **Limpiar caché**: `pnpm clean && pnpm install`
3. **Verificar doctor**: `npx expo-doctor`
4. **Foros Expo**: https://forums.expo.dev
5. **Discord Expo**: https://chat.expo.dev

---

## 📚 Referencias

- [EAS Build Docs](https://docs.expo.dev/build/introduction/)
- [Expo Notifications Guide](https://docs.expo.dev/push-notifications/overview/)
- [Firebase Setup](https://docs.expo.dev/push-notifications/fcm-credentials/)
- [Android Local Builds](https://docs.expo.dev/build-reference/local-builds/)
