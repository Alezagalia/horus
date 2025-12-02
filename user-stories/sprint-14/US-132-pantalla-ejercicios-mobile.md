# US-132: Pantalla de Gestión de Ejercicios (Mobile)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 5
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario móvil
**Quiero** gestionar mi catálogo de ejercicios desde la app
**Para** tener todos mis ejercicios personalizados disponibles

---

## Criterios de Aceptación

- [x] Pantalla `ExercisesScreen` con lista de ejercicios
- [x] Filtros: Todos, por grupo muscular, buscador
- [x] Cada item: icono, nombre, grupo, "Usado en X rutinas"
- [x] Swipe actions: Editar (right), Eliminar (left)
- [x] Modal de Crear/Editar con campos: nombre, grupo muscular, notas
- [x] Validación: nombre único
- [x] Confirmación al eliminar (especialmente si está en rutinas)
- [x] Pull-to-refresh, loading, empty, error states

---

## Tareas Técnicas

1. Crear ExercisesScreen.tsx - [1.5h]
2. ExerciseCard component - [1h]
3. ExerciseFormModal - [1.5h]
4. Filtros y buscador - [1h]
5. Integración API - [1.5h]
6. Swipe actions - [1h]
7. Validaciones - [1h]
8. Styling - [1h]
9. Tests - [1.5h]

---

## Definition of Done

- [x] Código implementado
- [x] Tests > 60% cobertura
- [x] Navegación funciona
- [x] QA en iOS y Android

---

**Estimación:** 5 SP | 10h
