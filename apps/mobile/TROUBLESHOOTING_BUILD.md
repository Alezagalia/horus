# 🔧 Troubleshooting - Build Failures

## ❌ Error Actual: "Unknown error in Prepare project"

Este error ocurre durante la fase de preparación del build en EAS. Causas comunes:

### 1. **Problema con Monorepo (MÁS PROBABLE)**

EAS tiene problemas con workspaces de pnpm cuando hay dependencias complejas.

**Solución:**
```powershell
# Opción A: Build con caché limpio (YA INTENTANDO)
eas build --platform android --profile preview --clear-cache

# Opción B: Si falla, usar Node.js específico
# Copiar eas.json.monorepo-fix a eas.json
Copy-Item eas.json.monorepo-fix eas.json
eas build --platform android --profile preview
```

### 2. **Problema con Plugins Nativos**

Algún plugin puede no ser compatible con SDK 54 o EAS.

**Diagnóstico:**
```powershell
# Ver qué plugins se están instalando
cat app.json | Select-String "plugins" -Context 0,5
```

**Solución:**
Comentar plugins temporalmente en `app.json` para identificar cuál falla:
```json
{
  "expo": {
    "plugins": [
      "expo-web-browser"
      // Comentar temporalmente:
      // ["expo-notifications", {...}]
    ]
  }
}
```

### 3. **Problema con Dependencias del Workspace**

La dependencia `@horus/shared` puede causar problemas.

**Solución:**
Crear un `.easignore` en `apps/mobile/`:
```
../../packages/shared/node_modules/
../../node_modules/
```

---

## 🔍 Ver Logs Detallados del Build

### Desde CLI:
```powershell
eas build:list --platform=android --limit=1
# Copiar el ID del build
# Abrir en navegador el URL de "Logs"
```

### Desde Web:
1. Ir a: https://expo.dev/accounts/alezagalia/projects/horus/builds
2. Click en el build más reciente
3. Ver la pestaña "Build logs"
4. Buscar líneas con "ERROR" o "FAIL"

---

## 🛠️ Soluciones Alternativas

### Alternativa 1: Profile "development"

```powershell
eas build --platform android --profile development
```

Diferencias:
- Más permisivo con errores
- APK más grande
- Incluye dev tools

### Alternativa 2: Build Local (Sin EAS)

Si EAS sigue fallando, puedes hacer build local:

```powershell
# Instalar Android Studio primero
# Luego:
npx expo prebuild --platform android
cd android
./gradlew assembleDebug
```

APK estará en: `android/app/build/outputs/apk/debug/app-debug.apk`

### Alternativa 3: Simplificar el Proyecto

Temporalmente mover mobile fuera del monorepo:

```powershell
# Copiar mobile a ubicación temporal
cp -r apps/mobile C:\temp\horus-mobile
cd C:\temp\horus-mobile

# Copiar shared inline
mkdir src\shared
cp -r ../../packages/shared/src/* src/shared/

# Actualizar package.json (remover workspace dependency)
# Cambiar "@horus/shared": "workspace:*" por paths relativos

# Build
eas build --platform android --profile preview
```

---

## 📊 Checklist de Diagnóstico

Antes de reportar el error, verifica:

- [ ] `npx expo-doctor` - Sin errores críticos
- [ ] `eas whoami` - Logueado correctamente
- [ ] `Test-Path google-services.json` - Archivo existe
- [ ] Assets en `assets/` - Todos presentes
- [ ] `eas build:list` - Ver builds anteriores
- [ ] Logs del build - Revisados en web

---

## 🚀 Comandos Útiles

```powershell
# Ver todos los builds
eas build:list --platform=android

# Ver build específico
eas build:view

# Cancelar build en progreso
eas build:cancel

# Ver configuración actual
eas config

# Verificar credenciales
eas credentials

# Limpiar todo y empezar de cero
eas build:configure --clear
```

---

## 💡 Logs Comunes de Errores

### "Task :app:processPreviewReleaseGoogleServices FAILED"
→ Problema con google-services.json
→ Verificar que package_name sea "com.horus.app"

### "ENOENT: no such file or directory"
→ Archivo faltante en el build
→ Verificar .gitignore y .easignore

### "Plugin 'X' not found"
→ Plugin no compatible
→ Remover temporalmente del app.json

### "Metro bundler failed"
→ Error en código JavaScript
→ Verificar que `pnpm dev:mobile` funcione localmente

### "Gradle build failed"
→ Error nativo Android
→ Verificar compatibilidad de dependencias nativas

---

## 🆘 Última Opción: Support de Expo

Si nada funciona:

1. Ir a: https://forums.expo.dev/
2. Crear post con:
   - Build ID: `7c48a4d9-e5d9-4a82-8a59-bec151e5fea0`
   - Error: "Unknown error in Prepare project"
   - SDK: 54
   - Tipo: Monorepo con pnpm

O Discord de Expo: https://chat.expo.dev

---

## ✅ Próximos Pasos

1. **Esperar resultado del build actual** (con --clear-cache)
2. **Si falla:** Ver logs detallados en web
3. **Si falla:** Intentar Alternativa 1 (profile development)
4. **Si falla:** Intentar Alternativa 2 (build local)
5. **Si todo falla:** Contactar support de Expo

---

**Tiempo estimado para resolver:** 30-60 minutos
**Probabilidad de éxito:** 80% con clear-cache, 95% con alternativas
