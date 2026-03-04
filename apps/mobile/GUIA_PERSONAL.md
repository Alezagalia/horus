# 📱 Guía Simplificada - APK para Uso Personal

## 🎯 Objetivo
Generar un APK instalable en tu Android con todas las funcionalidades, incluyendo notificaciones push.

---

## ⚡ Paso a Paso (30 minutos)

### **1. Preparación Inicial (5 min)**

```powershell
# Instalar EAS CLI (solo una vez)
npm install -g eas-cli

# Ir al proyecto mobile
cd apps\mobile

# Ejecutar corrección automática
.\fix-deps.ps1
```

### **2. Crear Assets Básicos (5 min)**

**Opción A: Usar generador online (más fácil)**

1. Ve a: https://easyappicon.com/
2. Sube cualquier imagen cuadrada (puede ser el logo de Horus o algo temporal)
3. Genera todos los tamaños
4. Descarga el ZIP
5. Extrae los archivos a `apps\mobile\assets\`

**Opción B: Crear temporales manualmente**

Si solo quieres probar rápido, usa imágenes temporales:

```powershell
# En apps/mobile/assets/
# Puedes usar cualquier imagen PNG y renombrarla:
# - icon.png (1024x1024)
# - adaptive-icon.png (1024x1024)
# - notification-icon.png (96x96)
# - splash.png (1284x2778)
# - favicon.png (48x48)

# Tip: Usa la misma imagen para icon y adaptive-icon
# Usa una más pequeña para notification-icon
```

### **3. Configurar Firebase (10 min)**

#### A. Crear Proyecto Firebase

1. Ve a: https://console.firebase.google.com/
2. Click en "Agregar proyecto"
3. Nombre: "Horus" (o el que quieras)
4. Desactiva Google Analytics (no lo necesitas para uso personal)
5. Click "Crear proyecto"

#### B. Agregar App Android

1. En la página del proyecto, click en ícono Android
2. Package name: `com.horus.app` (importante: debe ser exacto)
3. App nickname: "Horus Mobile"
4. Click "Registrar app"

#### C. Descargar Configuración

1. Descarga el archivo `google-services.json`
2. Colócalo en: `C:\Desarrollo\Horus2\apps\mobile\google-services.json`

#### D. Activar Cloud Messaging (Para notificaciones)

1. En Firebase Console → Configuración del proyecto (ícono ⚙️)
2. Cloud Messaging (tab)
3. Copia el "Server Key" (lo necesitarás para el backend después)

### **4. Actualizar app.json (2 min)**

```powershell
# Hacer backup del actual
Copy-Item app.json app.json.backup

# Usar el corregido
Copy-Item app.json.fixed app.json
```

**Opcional:** Si quieres cambiar el nombre de la app:

Edita `app.json` y cambia:
```json
{
  "expo": {
    "name": "Horus Personal",  // 👈 Cambia esto
    "slug": "horus"
  }
}
```

### **5. Login y Configurar EAS (3 min)**

```powershell
# Login en Expo (crea cuenta gratis si no tienes)
eas login

# Configurar proyecto
eas build:configure
```

Cuando pregunte:
- "Generate a new Android Keystore?" → **YES** (para uso personal está bien)
- Guarda las credenciales que te muestra

### **6. Generar APK (1 comando, 15 min de espera)**

```powershell
# Generar APK de prueba (perfecto para uso personal)
eas build --platform android --profile preview
```

Esto hará:
- ✅ Subir tu código a EAS
- ✅ Compilar la app en la nube
- ✅ Generar APK instalable
- ⏱️ Tarda ~15-20 minutos

Mientras esperas, puedes ver el progreso en:
https://expo.dev/accounts/[tu-usuario]/projects/horus/builds

### **7. Descargar e Instalar (2 min)**

Una vez terminado:

1. **Copiar el link del APK** que te da EAS
2. **Abrir en tu móvil** (puedes enviarte el link por WhatsApp/email)
3. **Descargar APK**
4. **Habilitar instalación de fuentes desconocidas** si te lo pide
5. **Instalar**
6. **¡Listo!** 🎉

### **8. Configurar Backend (5 min)**

Para que las notificaciones funcionen, configura el backend:

```bash
# En apps/backend/.env
# Agrega el Server Key de Firebase:

FIREBASE_SERVER_KEY=tu_server_key_aqui
```

Reinicia el backend:

```bash
pnpm dev:backend
```

### **9. Probar Notificaciones (2 min)**

```bash
# Enviar notificación de prueba desde el backend
curl -X POST http://localhost:3000/api/push/test \
  -H "Authorization: Bearer TU_TOKEN_JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "¡Funciona!",
    "body": "Las notificaciones están activas"
  }'
```

---

## 🎨 Personalización Opcional

### Cambiar colores de la app

Edita `app.json`:

```json
{
  "expo": {
    "primaryColor": "#2196F3",  // Color principal
    "notification": {
      "color": "#FF5722"  // Color de notificaciones
    }
  }
}
```

### Agregar tu logo

Reemplaza los archivos en `assets/` con tus propias imágenes.

---

## 🔄 Actualizar la App (Cuando hagas cambios)

```powershell
# Simplemente vuelve a generar el APK:
eas build --platform android --profile preview

# Descarga el nuevo APK e instala sobre la anterior
# Los datos se mantienen (no pierdes nada)
```

---

## 📤 Compartir con Amigos/Familia

Si quieres compartir la app:

**Opción 1: Enviar APK directamente**
- Descarga el APK
- Envía por WhatsApp/email/Drive
- Ellos lo instalan igual que tú

**Opción 2: Firebase App Distribution (más profesional)**

```powershell
# Generar link de distribución
eas build --platform android --profile preview --auto-submit

# Envía el link que genera
```

---

## ⚠️ Consideraciones Importantes

### Seguridad

Para uso personal:
- ✅ APK debug está bien
- ✅ No necesitas ofuscar código
- ⚠️ No compartas en lugares públicos (es tu app personal)

### Backend

Asegúrate que el backend esté accesible:
- **Desarrollo local:** Usa tu IP local (192.168.x.x)
- **Producción:** Usa Railway/Heroku/etc (ya lo tienes en Railway)

En `apps/mobile/.env`:
```bash
# Para testing en casa
EXPO_PUBLIC_API_URL=http://192.168.0.205:3000/api

# Para uso fuera de casa (usar tu backend en Railway)
EXPO_PUBLIC_API_URL=https://tu-backend.railway.app/api
```

### Notificaciones

- ✅ Funcionan en segundo plano
- ✅ Funcionan con app cerrada
- ⚠️ Requieren conexión a internet (obvio)
- ⚠️ El backend debe estar corriendo

---

## 🐛 Problemas Comunes

### "Build failed"

```powershell
# Ver qué falló
eas build:view --platform android

# Solución común: limpiar caché
eas build --platform android --profile preview --clear-cache
```

### "Notificaciones no llegan"

1. ¿Está el google-services.json en el proyecto? ✅
2. ¿Configuraste el Server Key en el backend? ✅
3. ¿Diste permisos de notificación en el móvil? ✅
4. ¿El backend está corriendo? ✅

### "App crashea"

```powershell
# Ver logs en tiempo real
adb logcat | findstr Horus
```

---

## 💡 Tips Pro

### 1. Alias de terminal

Agrega en tu `.bashrc` o `.zshrc`:

```bash
alias horus-build="cd ~/Horus/apps/mobile && eas build --platform android --profile preview"
```

### 2. Notificaciones de prueba rápidas

Crea un script `test-notification.sh`:

```bash
#!/bin/bash
curl -X POST http://localhost:3000/api/push/test \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "body": "Notification test"
  }'
```

### 3. Desarrollo más rápido

Para cambios de UI (sin notificaciones):
```bash
# Usa Expo Go para ver cambios instantáneos
pnpm dev:mobile
```

Para probar notificaciones:
```bash
# Regenera APK completo
eas build --platform android --profile preview
```

---

## 📊 Checklist Rápido

- [ ] `eas-cli` instalado
- [ ] Script `fix-deps.ps1` ejecutado
- [ ] Assets creados (icon, splash, etc.)
- [ ] Firebase proyecto creado
- [ ] `google-services.json` descargado y colocado
- [ ] `app.json.fixed` → `app.json` copiado
- [ ] `eas login` hecho
- [ ] `eas build:configure` ejecutado
- [ ] Build lanzado con `eas build --platform android --profile preview`
- [ ] APK descargado e instalado
- [ ] Backend configurado con Firebase Server Key
- [ ] Notificación de prueba enviada y recibida

---

## 🎉 ¡Listo!

Ahora tienes:
- ✅ APK instalable en tu Android
- ✅ Todas las funcionalidades operativas
- ✅ Notificaciones push funcionando
- ✅ Proceso para actualizar cuando quieras

**Disfruta tu app personal!** 🚀
