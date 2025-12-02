# US-137: Páginas de Ejercicios y Rutinas (Web)

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 14
**Story Points:** 6
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** gestionar ejercicios y rutinas desde el navegador
**Para** tener acceso completo sin usar móvil

---

## Criterios de Aceptación

### ExercisesPage (`/exercises`)

- [x] Tabla de ejercicios: Nombre, Grupo Muscular, Usado en X rutinas, Última vez
- [x] Botón "Nuevo Ejercicio"
- [x] Filtros y buscador
- [x] Acciones: Editar, Eliminar
- [x] Modal crear/editar (adaptado a desktop)

### RoutinesPage (`/routines`)

- [x] Grid de cards de rutinas
- [x] Cada card: Nombre, Descripción, X ejercicios, Última vez, Veces ejecutada
- [x] Botón "Nueva Rutina"
- [x] Botón "Iniciar" en cada card
- [x] Click → RoutineDetailPage

### RoutineDetailPage

- [x] Detalles completos de la rutina
- [x] Lista de ejercicios con orden, targets, descanso
- [x] Botón "Iniciar Rutina"
- [x] Botón "Editar Rutina"
- [x] Historial de ejecuciones (últimas 10)

### RoutineFormPage

- [x] Formulario: nombre, descripción
- [x] Sección ejercicios con drag-and-drop (react-beautiful-dnd)
- [x] Botón "Agregar Ejercicio" (modal selector)
- [x] Configurar targets por ejercicio

---

## Tareas Técnicas

1. ExercisesPage - [1.5h]
2. RoutinesPage - [1.5h]
3. RoutineDetailPage - [1h]
4. RoutineFormPage con drag-and-drop - [2.5h]
5. Modales y formularios - [2h]
6. Integración API - [1.5h]
7. Styling responsive - [1.5h]
8. Tests - [2h]

---

**Estimación:** 6 SP | 13.5h
