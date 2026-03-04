# 🚨 SOLUCIÓN AL PROBLEMA DE BUILD

## ❌ Problema Identificado

EAS Build **no puede resolver** la dependencia `@horus/shared` del workspace de pnpm.

**Error:** "Unknown error in Prepare project phase"
**Causa:** Monorepo con `@horus/shared` como dependencia de workspace
**Intentos fallidos:**
- Build normal ❌
- Build con --clear-cache ❌
- Configurar Node.js version ❌
- Agregar .easignore ❌

---

## ✅ SOLUCIONES DISPONIBLES

### 🏆 **Opción A: Build Local (RECOMENDADA)**

**Ventajas:**
- ✅ Funciona inmediatamente con el monorepo
- ✅ No requiere configuración adicional
- ✅ Más rápido de implementar (15 min)
- ✅ No depende de servicios externos

**Desventajas:**
- ⚠️ Requiere Android Studio (~4GB)
- ⚠️ Usa tu computadora para compilar (~10 min)

**Requisitos:**
1. Android Studio instalado
2. Android SDK 34
3. JDK 17

**Paso a paso:**

```powershell
# 1. Instalar Android Studio (si no lo tienes)
# Descargar de: https://developer.android.com/studio
# Durante instalación, instalar Android SDK y JDK

# 2. Ejecutar script de build
cd C:\Desarrollo\Horus2\apps\mobile
.\build-local.ps1

# 3. Esperar ~10-15 min
# APK estará en: android\app\build\outputs\apk\debug\app-debug.apk

# 4. Instalar en móvil
# - Opción 1: Copiar APK manualmente
# - Opción 2: adb install android\app\build\outputs\apk\debug\app-debug.apk
```

---

### 🔧 **Opción B: Configurar EAS para Monorepo**

**Ventajas:**
- ✅ Builds en la nube
- ✅ No requiere Android Studio

**Desventajas:**
- ⚠️ Requiere modificar estructura del proyecto
- ⚠️ Más complejo
- ⚠️ Puede causar conflictos con desarrollo local

**Paso a paso:**

```powershell
cd C:\Desarrollo\Horus2\apps\mobile

# Ejecutar script de configuración
.\fix-monorepo-eas.ps1

# Esto hará:
# 1. Copiar @horus/shared inline a src/_shared
# 2. Actualizar package.json (remover workspace dependency)
# 3. Actualizar tsconfig.json (apuntar a local)

# Luego build con EAS
eas build --platform android --profile preview

# Para revertir después:
Copy-Item package.json.backup package.json
Copy-Item tsconfig.json.backup tsconfig.json
Remove-Item -Recurse src\_shared
```

---

### 🌐 **Opción C: Expo Go (TESTING RÁPIDO)**

**Solo para probar la app, NO para notificaciones push**

```powershell
cd C:\Desarrollo\Horus2\apps\mobile
pnpm dev

# Escanear QR con Expo Go app
# Limitación: No funcionan notificaciones Firebase
```

---

## 🎯 **¿Cuál Elegir?**

| Necesidad | Opción Recomendada |
|-----------|-------------------|
| "Quiero el APK HOY" | **Opción A** (Build Local) |
| "No quiero instalar Android Studio" | **Opción B** (Configurar EAS) |
| "Solo quiero probar rápido (sin notis)" | **Opción C** (Expo Go) |
| "Tengo experiencia con Android" | **Opción A** (Build Local) |
| "Primera vez con React Native" | **Opción B** (Configurar EAS) |

**Mi recomendación personal: Opción A (Build Local)**
- Más confiable
- Funciona siempre con monorepos
- Útil para debugging nativo

---

## 📊 Comparación Detallada

### Opción A: Build Local

```
Tiempo setup: 30 min (instalar Android Studio)
Tiempo build: 10-15 min
Complejidad: Media
Éxito garantizado: 95%
Requisitos: Android Studio, ~4GB espacio

Paso 1: Instalar Android Studio        [████████░░] 30 min
Paso 2: Ejecutar build-local.ps1       [██████████] 2 min
Paso 3: Compilar (automático)          [████████░░] 10 min
Paso 4: Instalar APK en móvil          [██████████] 2 min
                                       ───────────────────
                                       TOTAL: ~45 min
```

### Opción B: Configurar EAS

```
Tiempo setup: 10 min
Tiempo build: 15-20 min
Complejidad: Alta
Éxito garantizado: 70%
Requisitos: Ninguno extra

Paso 1: Ejecutar fix-monorepo-eas.ps1  [██████████] 2 min
Paso 2: Build con EAS                  [████████░░] 20 min
Paso 3: Descargar APK                  [██████████] 2 min
Paso 4: Instalar en móvil              [██████████] 2 min
                                       ───────────────────
                                       TOTAL: ~25 min
```

---

## 🚀 Quick Start (Opción A)

Si tienes Android Studio instalado:

```powershell
cd C:\Desarrollo\Horus2\apps\mobile
.\build-local.ps1
```

Si NO tienes Android Studio:

```powershell
# 1. Descargar Android Studio
Start-Process "https://developer.android.com/studio"

# 2. Instalar (aceptar defaults)
# 3. Abrir Android Studio una vez
# 4. Ir a Tools → SDK Manager
# 5. Instalar: Android SDK Platform 34, Build-Tools 34.0.0

# 6. Configurar PATH
$env:ANDROID_HOME = "C:\Users\$env:USERNAME\AppData\Local\Android\Sdk"
$env:PATH += ";$env:ANDROID_HOME\platform-tools"

# 7. Ejecutar build
cd C:\Desarrollo\Horus2\apps\mobile
.\build-local.ps1
```

---

## 🆘 Troubleshooting

### "Android Studio not found"
```powershell
# Verificar instalación
$env:ANDROID_HOME
# Debe mostrar: C:\Users\...\AppData\Local\Android\Sdk
```

### "SDK not found"
```powershell
# Abrir Android Studio → Tools → SDK Manager
# Instalar Android SDK Platform 34
```

### "Gradle build failed"
```powershell
# Limpiar y reintentar
cd android
./gradlew clean
./gradlew assembleDebug
```

### "EAS build sigue fallando"
```powershell
# Usar Opción A (Build Local)
# Es más confiable para monorepos
```

---

## 📞 Soporte

Si ninguna opción funciona:

1. **Foro Expo:** https://forums.expo.dev/
2. **Discord Expo:** https://chat.expo.dev
3. **GitHub Issue:** https://github.com/expo/expo/issues

Menciona:
- Build ID fallido: `5385b535-a8f4-4859-8a86-795d5db4a27a`
- Error: "Unknown error in Prepare project"
- Setup: Monorepo pnpm con workspace dependency
- SDK: Expo 54

---

## ✅ Próximos Pasos

**Elige tu opción:**

```powershell
# Opción A (Recomendada)
cd C:\Desarrollo\Horus2\apps\mobile
.\build-local.ps1

# Opción B
cd C:\Desarrollo\Horus2\apps\mobile
.\fix-monorepo-eas.ps1
eas build --platform android --profile preview

# Opción C (Solo testing)
cd C:\Desarrollo\Horus2\apps\mobile
pnpm dev
```

**Después del build exitoso:**
1. Instalar APK en móvil
2. Configurar backend (FIREBASE_SERVER_KEY)
3. Probar notificaciones

---

**Tiempo total estimado (Opción A):** 45 minutos
**Tiempo total estimado (Opción B):** 25 minutos (si funciona)

**Mi recomendación:** Empieza con Opción A. Es más confiable y aprenderás sobre builds nativos.
