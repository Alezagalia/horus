# US-102: Página de Categorías (CRUD)

**Sprint:** 11 - Frontend Web Base
**ID:** US-102
**Título:** Página de Categorías (CRUD)

## Descripción

Como usuario web, quiero gestionar mis categorías (crear, editar, eliminar), para organizar mejor mis hábitos, tareas y gastos.

## Criterios de Aceptación

- [ ] Página `CategoriesPage` (`/categories`) implementada
- [ ] Header de página:
  - Título: "Categorías"
  - Tabs por scope: Hábitos, Tareas, Eventos, Gastos
  - Botón "Nueva Categoría"
- [ ] Lista de categorías por scope:
  - Icono (emoji)
  - Nombre
  - Color (círculo con el color)
  - Badge "Default" si es categoría por defecto
  - Badge "Inactiva" si isActive = false
  - Botones: Editar, Eliminar/Desactivar, Marcar como default
  - Ordenamiento alfabético
  - Toggle "Mostrar inactivas"
- [ ] Modal de Crear Categoría:
  - Nombre (obligatorio, max 50 caracteres)
  - Icono (emoji picker, obligatorio)
  - Color (color picker con paleta, obligatorio)
  - Scope: auto-seleccionado según tab activo
  - Validaciones: nombre único en el scope
  - Botones: "Guardar" y "Cancelar"
- [ ] Editar categoría:
  - Modal similar a crear, con datos precargados
  - No permitir cambiar scope
- [ ] Eliminar categoría:
  - Modal de confirmación
  - Si tiene hábitos/tareas asociados: mensaje "No se puede eliminar. ¿Desactivar?"
  - Si no tiene items: eliminar permanentemente
  - Si tiene items: soft delete
- [ ] Marcar como default:
  - Solo una categoría default por scope
  - Confirmación si cambia la default actual

## Tareas Técnicas

- [ ] Crear página CategoriesPage - [1h]
- [ ] Implementar tabs por scope - [0.5h]
- [ ] Crear componente CategoryCard - [1h]
- [ ] Crear modal de crear/editar categoría - [1.5h]
- [ ] Implementar emoji picker (librería emoji-picker-react) - [1h]
- [ ] Implementar color picker (librería react-colorful) - [0.5h]
- [ ] Implementar lógica de eliminar/desactivar - [1h]
- [ ] Implementar marcar como default - [0.5h]
- [ ] Integrar con API usando TanStack Query - [1h]
- [ ] Escribir tests - [1h]

## Componentes Afectados

- **web:** CategoriesPage, CategoryCard, CategoryForm, emoji picker, color picker

## Dependencias

- US-096 (MainLayout)
- Backend endpoints de categorías (Sprint 2)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
