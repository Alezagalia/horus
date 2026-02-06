# 📝 Guía de Uso - Editor de Notas Mejorado con Tablas

## ✨ Nuevas Funcionalidades

El editor de notas de Horus ahora incluye **MDXEditor**, un editor WYSIWYG completo que permite crear y editar contenido rico con tablas interactivas estilo Google Docs o Notion.

---

## 🎯 Características Principales

### 1. **Tablas Interactivas**

#### Crear una Tabla
- Click en el botón **"Insertar Tabla"** (ícono de tabla) en la barra de herramientas
- Especifica el número de filas y columnas
- La tabla se inserta automáticamente en el editor

#### Editar Tablas
- **Agregar fila**: Click derecho en cualquier celda → "Insertar fila arriba/abajo"
- **Agregar columna**: Click derecho en cualquier celda → "Insertar columna izquierda/derecha"
- **Eliminar fila/columna**: Click derecho → "Eliminar fila/columna"
- **Editar contenido**: Click en cualquier celda para escribir directamente
- **Alineación**: Cambiar alineación de columnas (izquierda, centro, derecha)

#### Formato en Celdas
Las celdas soportan:
- **Negrita**, *cursiva*, <u>subrayado</u>
- Enlaces
- Texto enriquecido

---

### 2. **Barra de Herramientas**

La barra de herramientas incluye:

| Herramienta | Descripción |
|-------------|-------------|
| ↶ ↷ | Deshacer / Rehacer |
| **B** *I* <u>U</u> | Negrita, Cursiva, Subrayado |
| Título ▼ | Selector de tipo de bloque (Párrafo, H1, H2, H3, etc.) |
| 🔗 | Crear enlace |
| • 1. | Listas con viñetas / numeradas |
| ⊞ | Insertar tabla |
| ─── | Insertar separador horizontal |

---

### 3. **Atajos de Teclado**

#### Formato de Texto
- `Ctrl + B` → **Negrita**
- `Ctrl + I` → *Cursiva*
- `Ctrl + K` → Crear enlace
- `Ctrl + Z` → Deshacer
- `Ctrl + Y` → Rehacer

#### Encabezados (Markdown Shortcuts)
- `# ` → H1
- `## ` → H2
- `### ` → H3

#### Listas
- `- ` o `* ` → Lista con viñetas
- `1. ` → Lista numerada

#### Otros
- `> ` → Cita (blockquote)
- `---` → Separador horizontal

---

## 🎨 Características de Diseño

### Tablas Estilizadas
Las tablas tienen:
- ✅ Bordes redondeados
- ✅ Encabezados con fondo gris claro
- ✅ Hover effect en filas
- ✅ Celdas seleccionables con resaltado azul
- ✅ Responsive (se adapta a pantallas pequeñas)

### Tema Personalizado
El editor está estilizado para coincidir con el diseño de Horus:
- Colores consistentes
- Tipografía heredada
- Espaciado uniforme
- Toolbar con estilo glassmorphism

---

## 📋 Ejemplo de Uso

### Crear una Nota con Tabla de Seguimiento

```markdown
# Plan de Trabajo - Sprint 15

## Tareas Pendientes

| Tarea | Responsable | Estado | Prioridad |
|-------|-------------|--------|-----------|
| Implementar tablas | Developer | ✅ Completado | Alta |
| Testing | QA Team | 🔄 En progreso | Media |
| Documentación | Tech Writer | ⏳ Pendiente | Baja |

## Notas Adicionales

- Priorizar testing antes de deploy
- Revisar performance del editor
- **Deadline**: Viernes 24/01
```

---

## 🔧 Detalles Técnicos

### Archivos Modificados

1. **`NoteEditor.tsx`** (75 líneas)
   - Reemplaza textarea + preview por MDXEditor
   - Configura plugins: tablas, encabezados, listas, links, etc.
   - Toolbar personalizado

2. **`mdx-editor-custom.css`** (nuevo, 240 líneas)
   - Estilos personalizados para tablas
   - Tema adaptado a Horus
   - Responsive styles

3. **`ResourceCard.tsx`** (actualizado)
   - Mejora el rendering de tablas en preview
   - Componentes personalizados para elementos de tabla

### Peso del Bundle

- **MDXEditor**: ~430 KB (gzipped)
- **Impacto**: El chunk de ResourcesPage aumentó de ~400KB a ~1.3MB (430KB gzipped)
- **Justificación**: Funcionalidad avanzada de edición vale el peso adicional

### Compatibilidad

✅ **Desktop**: Chrome, Firefox, Safari, Edge
✅ **Mobile**: iOS Safari, Chrome Mobile
✅ **Markdown**: Compatible con GitHub Flavored Markdown (GFM)
⚠️ **Legacy browsers**: IE11 no soportado

---

## 🚀 Próximas Mejoras Sugeridas

1. **Templates de Tablas**
   - Tabla de tareas
   - Tabla de gastos
   - Tabla de seguimiento

2. **Importar/Exportar**
   - Importar CSV → Tabla
   - Exportar Tabla → CSV
   - Copiar tabla como Markdown

3. **Funcionalidad Avanzada**
   - Merge de celdas
   - Ordenamiento de columnas
   - Fórmulas simples (suma, promedio)
   - Filtros de tabla

4. **Optimización**
   - Lazy loading del editor
   - Code splitting más agresivo
   - Reducir peso del bundle

---

## 🐛 Troubleshooting

### El editor no carga
- Verifica que `@mdxeditor/editor` esté instalado
- Revisa la consola del navegador para errores
- Intenta limpiar caché: `pnpm clean && pnpm install`

### Las tablas no se muestran correctamente
- Verifica que `mdx-editor-custom.css` esté importado
- Revisa que `remark-gfm` esté instalado para el preview

### Performance issues
- Las notas muy largas (>10,000 caracteres) pueden ser lentas
- Considera dividir notas grandes en múltiples recursos
- El lazy loading del editor mejorará esto en el futuro

---

## 📚 Recursos Adicionales

- [MDXEditor Docs](https://mdxeditor.dev/)
- [Markdown Guide](https://www.markdownguide.org/)
- [GFM Spec](https://github.github.com/gfm/)

---

## ✅ Changelog

### v1.0.0 - 2026-01-20
- ✅ Integración de MDXEditor
- ✅ Soporte completo de tablas interactivas
- ✅ Toolbar personalizado
- ✅ Estilos adaptados a Horus
- ✅ Atajos de teclado
- ✅ Preview mejorado en ResourceCard
- ✅ Build exitoso y type-safe
