# US-017: Eliminar Categoría

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-017
**Título:** Eliminar Categoría

## Descripción

Como usuario, quiero poder eliminar categorías que ya no uso para mantener mi lista organizada.

## Criterios de Aceptación

- [ ] Opción "Eliminar" en bottom sheet de opciones
- [ ] Alert de confirmación: "¿Eliminar '{nombre}'? No se eliminarán los items asociados."
- [ ] Validación backend: no permitir eliminar si tiene items asociados
- [ ] Si tiene items: mostrar error "No se puede eliminar. Tiene {count} {items} asociados."
- [ ] Si no tiene items: soft delete (isActive = false)
- [ ] Soft delete no elimina de BD, solo oculta
- [ ] Toast de éxito: "Categoría eliminada"
- [ ] Actualizar lista automáticamente (desaparece de UI)

## Tareas Técnicas

- [ ] Opción eliminar en bottom sheet - [0.5h]
- [ ] Alert de confirmación - [1h]
- [ ] Validación en backend (check items asociados) - [1.5h]
- [ ] Implementar soft delete - [1h]
- [ ] Integrar con DELETE /api/categories/:id - [1h]
- [ ] Actualización optimista - [1h]
- [ ] Manejo de errores - [1h]
- [ ] Tests - [1.5h]

## Componentes Afectados

- **mobile:** CategoriesScreen, Alert dialog
- **backend:** CategoryController validation

## Dependencias

- US-015 y US-016

## Prioridad

medium

## Esfuerzo Estimado

5 Story Points
