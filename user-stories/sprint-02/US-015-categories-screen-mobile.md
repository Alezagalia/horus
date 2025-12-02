# US-015: Pantalla de Gestión de Categorías (Mobile)

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-015
**Título:** Pantalla de Gestión de Categorías (Mobile)

## Descripción

Como usuario, quiero ver y gestionar mis categorías desde la app móvil para organizar mis datos según mis necesidades.

## Criterios de Aceptación

- [ ] Pantalla CategoriesScreen accesible desde Settings o menú principal
- [ ] Tabs para filtrar por scope: Hábitos, Tareas, Eventos, Gastos
- [ ] Lista de categorías mostrando: icono (emoji), nombre, color, badge "Default" si aplica
- [ ] Botón FAB "Nueva Categoría" flotante
- [ ] Tap en categoría → abre bottom sheet con opciones: Editar, Marcar como default, Eliminar
- [ ] Categorías default con badge distintivo
- [ ] Ordenamiento: defaults primero, luego alfabético
- [ ] Empty state: "No tienes categorías de {scope}" con ilustración

## Tareas Técnicas

- [ ] Crear CategoriesScreen con tabs - [2h]
- [ ] Crear componente CategoryCard - [1.5h]
- [ ] Implementar bottom sheet de opciones - [1h]
- [ ] Integrar con GET /api/categories - [1h]
- [ ] Implementar filtros por scope - [1h]
- [ ] Implementar ordenamiento - [0.5h]
- [ ] Empty state design - [0.5h]
- [ ] Tests de componente - [1.5h]

## Componentes Afectados

- **mobile:** CategoriesScreen, CategoryCard, BottomSheet

## Dependencias

- US-014 (Backend CRUD)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
