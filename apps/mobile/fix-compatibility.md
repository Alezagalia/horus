# 🔧 Guía de Corrección de Compatibilidad - Horus Mobile

## Problemas Detectados y Soluciones

### 1. Actualizar Dependencias de Expo SDK 54

```bash
cd apps/mobile
npx expo install --check --fix
```

Esto actualizará automáticamente:
- expo (54.0.25 → 54.0.33)
- expo-auth-session (7.0.9 → 7.0.10)
- expo-constants (18.0.10 → 18.0.13)
- expo-device (8.0.9 → 8.0.10)
- expo-notifications (0.32.13 → 0.32.16) ✅ CRÍTICO PARA NOTIFICACIONES
- expo-status-bar (3.0.8 → 3.0.9)
- expo-web-browser (15.0.9 → 15.0.10)
- babel-preset-expo (54.0.7 → 54.0.10)

### 2. Resolver Duplicados de React

**Problema:** Conflicto entre React 18.3.1 (root) y React 19.1.0 (mobile)

**Solución:** Forzar React 19.1.0 en todo el workspace

```bash
# En la raíz del monorepo
pnpm add -w react@19.1.0 react-dom@19.1.0
```

Luego agregar en `apps/mobile/package.json`:

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

Y ejecutar:

```bash
pnpm install
```

### 3. Remover Dependencia Innecesaria

```bash
cd apps/mobile
pnpm remove @types/react-native
```

(Los tipos ya vienen con react-native)

### 4. Corregir app.json

Remover propiedades deprecadas y agregar plugin de notificaciones:

**ANTES:**
```json
{
  "expo": {
    "entryPoint": "./index.js",  // ❌ DEPRECADO
    "android": {
      "useNextNotificationsApi": true  // ❌ DEPRECADO en SDK 54
    }
  }
}
```

**DESPUÉS:**
```json
{
  "expo": {
    "scheme": "horus",
    "plugins": [
      "expo-web-browser",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png",
          "color": "#2196F3",
          "sounds": [],
          "mode": "production"
        }
      ]
    ]
  }
}
```

### 5. Crear Assets Faltantes

```bash
cd apps/mobile

# Crear directorio assets si no existe
mkdir -p assets

# Opciones:
# A) Copiar de otro proyecto
# B) Generar con herramientas online
# C) Crear temporalmente con comandos
```

Assets requeridos:
- `assets/icon.png` (1024x1024)
- `assets/adaptive-icon.png` (1024x1024)
- `assets/splash.png` (1284x2778 o similar)
- `assets/favicon.png` (48x48)

### 6. Configurar Firebase para Notificaciones Push

**Para Android:**

1. Ir a Firebase Console → Tu proyecto
2. Descargar `google-services.json`
3. Colocar en `apps/mobile/google-services.json`

4. Agregar plugin en `app.json`:

```json
{
  "expo": {
    "plugins": [
      "@react-native-firebase/app",
      [
        "expo-notifications",
        {
          "icon": "./assets/notification-icon.png"
        }
      ]
    ],
    "android": {
      "googleServicesFile": "./google-services.json"
    }
  }
}
```

### 7. Verificación Final

```bash
npx expo-doctor
```

Debería mostrar: ✅ All checks passed!

---

## 🚀 Comandos de Ejecución

### Desarrollo Local
```bash
pnpm dev:mobile
```

### Build APK para Testing
```bash
eas build --platform android --profile preview
```

### Build AAB para Producción
```bash
eas build --platform android --profile production
```
