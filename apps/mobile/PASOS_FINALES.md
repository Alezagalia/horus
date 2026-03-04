# 🎯 PASOS FINALES PARA GENERAR EL APK

## ✅ YA COMPLETADO (Automáticamente)

- [x] Dependencias Expo actualizadas a SDK 54
- [x] @types/react-native removido
- [x] Duplicados de React resueltos (pnpm overrides)
- [x] app.json corregido (sin propiedades deprecadas)
- [x] Plugin expo-notifications agregado
- [x] Permisos Android configurados
- [x] Assets temporales creados (icon, splash, notification-icon)

---

## 🔥 PASOS QUE DEBES HACER AHORA (Manual)

### PASO 1: Configurar Firebase (10 minutos)

#### A. Crear Proyecto en Firebase

1. Ve a: https://console.firebase.google.com/
2. Click "Agregar proyecto" (o usa un proyecto existente)
3. Nombre: "Horus" (o el que prefieras)
4. **Desactiva Google Analytics** (no lo necesitas para uso personal)
5. Click "Crear proyecto"
6. Espera a que se cree (~30 segundos)

#### B. Agregar App Android

1. En la página principal del proyecto, click en el ícono **Android** (robot verde)
2. Completa el formulario:
   - **Package name**: `com.horus.app` (¡IMPORTANTE: debe ser exacto!)
   - **App nickname**: `Horus Mobile`
   - **SHA-1 certificate**: Deja en blanco (no necesario para desarrollo)
3. Click "Registrar app"

#### C. Descargar google-services.json

1. Click en "Descargar google-services.json"
2. Guarda el archivo
3. **Mueve el archivo a:** `C:\Desarrollo\Horus2\apps\mobile\google-services.json`

   ```powershell
   # O desde PowerShell:
   Move-Item C:\Users\TU_USUARIO\Downloads\google-services.json C:\Desarrollo\Horus2\apps\mobile\
   ```

4. Verifica que está en el lugar correcto:
   ```powershell
   Test-Path C:\Desarrollo\Horus2\apps\mobile\google-services.json
   # Debe devolver: True
   ```

#### D. Copiar Server Key (Para el Backend)

1. En Firebase Console, click en el ícono ⚙️ (Settings) → "Configuración del proyecto"
2. Ve a la pestaña "Cloud Messaging"
3. **Copia el "Server Key"** (será algo como `AAAA...`)
4. Guárdalo temporalmente (lo usaremos después para el backend)

---

### PASO 2: Instalar y Configurar EAS (5 minutos)

#### A. Instalar EAS CLI

```powershell
npm install -g eas-cli
```

#### B. Login en Expo

```powershell
eas login
```

- Si no tienes cuenta: Se abrirá el navegador para crear una (gratis)
- Si ya tienes cuenta: Ingresa tus credenciales

#### C. Configurar EAS en el Proyecto

```powershell
cd C:\Desarrollo\Horus2\apps\mobile
eas build:configure
```

Cuando pregunte:
- "Would you like to automatically create an EAS project for @horus/mobile?" → **YES**
- "Generate a new Android Keystore?" → **YES**

Esto creará/actualizará tu `eas.json`.

---

### PASO 3: Generar el APK (1 comando, 15-20 min de espera)

```powershell
cd C:\Desarrollo\Horus2\apps\mobile
eas build --platform android --profile preview
```

#### ¿Qué pasará?

1. ✅ EAS comprimirá tu proyecto
2. ✅ Lo subirá a la nube de Expo
3. ✅ Compilará la app completa en un servidor
4. ✅ Generará un APK instalable
5. ⏱️ Tardará ~15-20 minutos

#### Durante la Espera

- Ver progreso en tiempo real: https://expo.dev/accounts/[tu-usuario]/projects/horus/builds
- O simplemente espera a que el comando termine
- El terminal mostrará un link cuando esté listo

#### Resultado

Al finalizar verás algo como:

```
✔ Build finished

https://expo.dev/artifacts/eas/xxxxx.apk
```

**¡COPIA ESE LINK!** Es tu APK descargable.

---

### PASO 4: Instalar el APK en tu Android (5 minutos)

#### Opción A: Descarga Directa en el Móvil

1. **Abre el link del APK en el navegador de tu móvil**
2. Descarga el archivo
3. Si pregunta "¿Permitir descargas de fuentes desconocidas?":
   - Toca "Configuración"
   - Activa "Permitir desde esta fuente"
   - Vuelve atrás
4. Toca el archivo APK descargado
5. Toca "Instalar"
6. ¡Abre la app!

#### Opción B: Transferir desde PC

1. Descarga el APK en tu PC
2. Conecta tu móvil por USB
3. Copia el APK a la carpeta `Downloads` del móvil
4. En el móvil:
   - Abre "Archivos" o "Mis Archivos"
   - Ve a "Descargas"
   - Toca el APK
   - Instala

---

### PASO 5: Configurar Backend para Notificaciones (5 minutos)

#### A. Agregar Firebase Server Key

Edita `C:\Desarrollo\Horus2\apps\backend\.env`:

```env
# Agregar al final:
FIREBASE_SERVER_KEY=tu_server_key_aqui
```

Reemplaza `tu_server_key_aqui` con el Server Key que copiaste de Firebase.

#### B. Reiniciar Backend

```powershell
# Detener el backend actual (Ctrl+C)
# Y reiniciar:
cd C:\Desarrollo\Horus2
pnpm dev:backend
```

---

### PASO 6: Probar Notificaciones (2 minutos)

#### A. Abrir la App

1. Abre Horus en tu móvil
2. Cuando pregunte por permisos de notificación: **ACEPTA**
3. Inicia sesión (o regístrate)

#### B. Enviar Notificación de Prueba

Desde tu PC (con el backend corriendo):

```powershell
# Obtén tu token JWT primero (login en la app web o mobile)
# Luego ejecuta:

curl -X POST http://localhost:3000/api/push/test `
  -H "Authorization: Bearer TU_TOKEN_JWT_AQUI" `
  -H "Content-Type: application/json" `
  -d '{
    \"title\": \"¡Funciona!\",
    \"body\": \"Las notificaciones push están activas\"
  }'
```

#### C. Verificar

- ✅ La notificación debe aparecer en tu móvil
- ✅ Al tocarla, debe abrir la app
- ✅ En segundo plano funciona igual

---

## 🎯 RESUMEN EJECUTIVO

```powershell
# 1. Configurar Firebase (crear proyecto, descargar google-services.json)
Move-Item Downloads\google-services.json C:\Desarrollo\Horus2\apps\mobile\

# 2. Instalar y configurar EAS
npm install -g eas-cli
cd C:\Desarrollo\Horus2\apps\mobile
eas login
eas build:configure

# 3. Generar APK
eas build --platform android --profile preview

# 4. Esperar ~15 min → Descargar APK → Instalar en móvil

# 5. Configurar backend (agregar FIREBASE_SERVER_KEY en .env)

# 6. Probar notificaciones
```

---

## 📊 Checklist Final

- [ ] Firebase proyecto creado
- [ ] google-services.json descargado y movido a `apps/mobile/`
- [ ] Firebase Server Key copiado
- [ ] EAS CLI instalado (`npm install -g eas-cli`)
- [ ] Login en Expo (`eas login`)
- [ ] EAS configurado (`eas build:configure`)
- [ ] Build lanzado (`eas build --platform android --profile preview`)
- [ ] APK descargado del link
- [ ] APK instalado en móvil Android
- [ ] Permisos de notificación aceptados en la app
- [ ] FIREBASE_SERVER_KEY agregado al backend `.env`
- [ ] Backend reiniciado
- [ ] Notificación de prueba enviada y recibida

---

## 🐛 Troubleshooting

### "Build failed" en EAS

```powershell
# Ver logs detallados:
eas build:view --platform android

# Limpiar caché y reintentar:
eas build --platform android --profile preview --clear-cache
```

### "google-services.json not found"

```powershell
# Verificar que existe:
Test-Path C:\Desarrollo\Horus2\apps\mobile\google-services.json

# Si devuelve False, descárgalo de nuevo desde Firebase
```

### "Notificaciones no llegan"

1. ¿El google-services.json está en `apps/mobile/`? → `Test-Path`
2. ¿El FIREBASE_SERVER_KEY está en `apps/backend/.env`?
3. ¿El backend está corriendo? → `pnpm dev:backend`
4. ¿Aceptaste permisos de notificación en el móvil?
5. ¿El token se guardó en la BD? → Revisar tabla `PushToken`

### "APK no instala"

- Verifica que hayas habilitado "Fuentes desconocidas"
- Intenta descargar de nuevo (puede estar corrupto)
- Verifica que tengas espacio en el móvil (~100MB)

---

## 🔄 Actualizar la App Después

Cuando hagas cambios en el código:

```powershell
cd C:\Desarrollo\Horus2\apps\mobile
eas build --platform android --profile preview
```

- Descarga el nuevo APK
- Instala sobre la anterior (no pierdes datos)

---

## 💡 Mejoras Opcionales

### Assets Profesionales

Los assets actuales son temporales (fondo azul con texto).

Para crear profesionales:
1. Ve a: https://easyappicon.com/
2. Sube tu logo
3. Descarga el pack
4. Reemplaza los archivos en `assets/`
5. Regenera el build

### OTA Updates (Actualizaciones sin reinstalar)

```powershell
# Publicar actualización:
eas update --branch production

# Los usuarios recibirán la actualización sin descargar nuevo APK
# (solo funciona para cambios JS, no nativos)
```

---

## ✅ ¡ÉXITO!

Si completaste todos los pasos:
- ✅ Tienes un APK funcional instalado
- ✅ Todas las features de Horus operativas
- ✅ Notificaciones push funcionando
- ✅ Puedes regenerar el APK cuando quieras

**¡Disfruta tu app personal!** 🎉

---

## 📚 Referencias

- EAS Build: https://docs.expo.dev/build/introduction/
- Firebase Setup: https://firebase.google.com/docs/android/setup
- Expo Notifications: https://docs.expo.dev/push-notifications/overview/
- Troubleshooting: Revisa `BUILD_STRATEGIES.md` para más detalles
