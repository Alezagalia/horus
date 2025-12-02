# US-016: Formulario de Crear/Editar Categoría (Mobile)

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-016
**Título:** Formulario de Crear/Editar Categoría (Mobile)

## Descripción

Como usuario, quiero crear y editar mis propias categorías personalizadas para adaptar la app a mi forma de organizar.

## Criterios de Aceptación

- [ ] Modal CategoryFormModal con campos: nombre, emoji picker, color picker, scope (solo en creación)
- [ ] Emoji picker con emojis predefinidos organizados por categorías
- [ ] Color picker con paleta de 12 colores predefinidos
- [ ] Validación: nombre no vacío, max 50 caracteres, nombre único en scope
- [ ] Preview de cómo se verá la categoría
- [ ] Botones: Cancelar (cierra modal), Guardar (crea/actualiza)
- [ ] Loading state durante request
- [ ] Toast de éxito: "Categoría creada/actualizada"
- [ ] Toast de error con mensaje específico
- [ ] Al crear: actualiza lista automáticamente
- [ ] Al editar: actualiza item en lista

## Tareas Técnicas

- [ ] Crear CategoryFormModal - [3h]
- [ ] Implementar emoji picker - [2h]
- [ ] Implementar color picker - [1.5h]
- [ ] Validaciones frontend - [1h]
- [ ] Preview de categoría - [1h]
- [ ] Integrar con POST /api/categories - [1h]
- [ ] Integrar con PUT /api/categories/:id - [1h]
- [ ] Actualización optimista de lista - [1h]
- [ ] Toast notifications - [0.5h]
- [ ] Tests - [2h]

## Componentes Afectados

- **mobile:** CategoryFormModal, EmojiPicker, ColorPicker

## Dependencias

- US-015 (CategoriesScreen)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
