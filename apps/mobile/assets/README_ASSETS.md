# 🎨 Assets Necesarios para Horus

## ⚠️ IMPORTANTE: Debes crear estos archivos antes de hacer el build

## 📋 Lista de Assets Requeridos

### 1. **icon.png** (OBLIGATORIO)
- **Tamaño:** 1024x1024 px
- **Formato:** PNG con transparencia
- **Uso:** Ícono principal de la app

### 2. **adaptive-icon.png** (OBLIGATORIO)
- **Tamaño:** 1024x1024 px
- **Formato:** PNG con transparencia
- **Uso:** Ícono adaptativo para Android (aparece en launcher)

### 3. **notification-icon.png** (OBLIGATORIO para notificaciones)
- **Tamaño:** 96x96 px
- **Formato:** PNG monocromático (blanco sobre transparente)
- **Uso:** Ícono que aparece en las notificaciones push

### 4. **splash.png** (OBLIGATORIO)
- **Tamaño:** 1284x2778 px (o similar, relación 9:19.5)
- **Formato:** PNG
- **Uso:** Pantalla de carga al abrir la app

### 5. **favicon.png** (OPCIONAL)
- **Tamaño:** 48x48 px
- **Formato:** PNG
- **Uso:** Para la versión web

---

## 🚀 Opción 1: Generador Automático (MÁS FÁCIL)

### A. EasyAppIcon (Recomendado)
1. Ve a: https://easyappicon.com/
2. Sube una imagen cuadrada (puede ser el logo de Horus)
3. Selecciona "Android" y "iOS"
4. Click "Generate"
5. Descarga el ZIP
6. Extrae los archivos a esta carpeta

### B. MakeAppIcon
1. Ve a: https://makeappicon.com/
2. Sube tu imagen
3. Genera todos los tamaños
4. Descarga y extrae aquí

### C. Android Asset Studio
1. Ve a: https://romannurik.github.io/AndroidAssetStudio/
2. Genera ícono para notificaciones (notification-icon.png)
3. Genera ícono de launcher (icon.png, adaptive-icon.png)

---

## 🎨 Opción 2: Crear Manualmente

Si no tienes un logo, puedes crear assets temporales:

### Usando Photoshop/GIMP/Figma:
1. Crea un canvas 1024x1024
2. Diseña un ícono simple (puede ser texto "H" con fondo de color)
3. Exporta como PNG

### Usando PowerPoint/Keynote:
1. Crea slide cuadrado
2. Agrega texto/formas
3. Exporta como PNG
4. Redimensiona con herramienta online

---

## 📦 Opción 3: Assets Temporales de Prueba

Si solo quieres probar rápido, puedes usar imágenes temporales:

### Crear con IA (rápido):
1. Ve a: https://www.bing.com/images/create
2. Prompt: "simple minimalist app icon for productivity app, flat design, blue color"
3. Descarga la imagen generada
4. Usa https://www.iloveimg.com/resize-image para ajustar tamaños

### O descargar placeholders:
1. https://via.placeholder.com/1024x1024/2196F3/ffffff?text=Horus → icon.png
2. https://via.placeholder.com/1024x1024/2196F3/ffffff?text=H → adaptive-icon.png
3. https://via.placeholder.com/96x96/ffffff/000000?text=H → notification-icon.png
4. https://via.placeholder.com/1284x2778/2196F3/ffffff?text=Horus → splash.png

---

## ✅ Checklist de Assets

Una vez que tengas todos los archivos:

- [ ] `icon.png` (1024x1024) - Existe en esta carpeta
- [ ] `adaptive-icon.png` (1024x1024) - Existe en esta carpeta
- [ ] `notification-icon.png` (96x96) - Existe en esta carpeta
- [ ] `splash.png` (1284x2778) - Existe en esta carpeta
- [ ] `favicon.png` (48x48) - Opcional

Verifica con:
```bash
ls -lh assets/
```

Deberías ver:
```
icon.png               (~200-500KB)
adaptive-icon.png      (~200-500KB)
notification-icon.png  (~5-20KB)
splash.png             (~500KB-2MB)
favicon.png            (~5-10KB) [opcional]
```

---

## 🎯 Tips de Diseño

### Para icon.png y adaptive-icon.png:
- Usa colores del tema de Horus (#2196F3 - azul)
- Diseño simple y reconocible
- Evita texto pequeño (no se lee en tamaños chicos)
- Deja margen de seguridad (10% del borde)

### Para notification-icon.png:
- **MUY IMPORTANTE:** Solo blanco sobre fondo transparente
- Silueta simple (Android lo colorea automáticamente)
- No uses grises ni colores (no funcionará)

### Para splash.png:
- Fondo sólido o gradiente suave
- Logo centrado
- Evita elementos en los bordes (recorte en diferentes dispositivos)

---

## 🚨 Errores Comunes

### "Build failed: asset not found"
- Verifica que los nombres sean exactos (minúsculas)
- Verifica que estén en la carpeta correcta (`apps/mobile/assets/`)

### "Notification icon appears as square"
- El notification-icon.png debe ser monocromático (solo blanco)
- No puede tener colores ni grises

### "Icon looks stretched"
- Verifica que sean imágenes cuadradas (mismo ancho y alto)
- No uses JPG, solo PNG

---

## 🔄 Actualizar Assets Después

Si quieres cambiar los assets después:

1. Reemplaza los archivos en esta carpeta
2. Regenera el build:
   ```bash
   eas build --platform android --profile preview --clear-cache
   ```

---

## 💡 Ejemplo Rápido con Placeholder

Para probar rápidamente (SOLO PARA TESTING):

```bash
# Desde esta carpeta (apps/mobile/assets/)

# Descargar placeholders temporales
curl -o icon.png "https://via.placeholder.com/1024x1024/2196F3/ffffff.png?text=Horus"
curl -o adaptive-icon.png "https://via.placeholder.com/1024x1024/2196F3/ffffff.png?text=H"
curl -o notification-icon.png "https://via.placeholder.com/96x96/ffffff/000000.png?text=H"
curl -o splash.png "https://via.placeholder.com/1284x2778/2196F3/ffffff.png?text=Horus"
curl -o favicon.png "https://via.placeholder.com/48x48/2196F3/ffffff.png?text=H"
```

**Nota:** Estos son solo para testing, crea assets profesionales para versión final.

---

¡Buena suerte! 🚀
