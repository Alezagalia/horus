# US-018: Marcar Categoría como Default

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-018
**Título:** Marcar Categoría como Default

## Descripción

Como usuario, quiero marcar una categoría como default para que se preseleccione automáticamente al crear nuevos items.

## Criterios de Aceptación

- [ ] Opción "Marcar como Default" en bottom sheet
- [ ] Si ya hay una default en ese scope: mostrar confirmación "¿Reemplazar '{nombreActual}' como default?"
- [ ] Solo una categoría default por scope
- [ ] Al marcar como default: actualizar BD y UI
- [ ] Badge "Default" visible en la categoría marcada
- [ ] Badge removido de la anterior default
- [ ] Toast de éxito: "{nombre} es ahora la categoría default de {scope}"

## Tareas Técnicas

- [ ] Opción "Marcar como Default" en bottom sheet - [0.5h]
- [ ] Confirmación si ya existe default - [1h]
- [ ] Integrar con PUT /api/categories/:id/set-default - [1h]
- [ ] Actualizar UI (badges) - [1.5h]
- [ ] Tests - [1h]

## Componentes Afectados

- **mobile:** CategoriesScreen, CategoryCard
- **backend:** CategoryController set-default logic

## Dependencias

- US-015

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
