# US-099: Página de Mis Hábitos (Lista Completa + Crear/Editar)

**Sprint:** 11 - Frontend Web Base
**ID:** US-099
**Título:** Página de Mis Hábitos (Lista Completa + Crear/Editar)

## Descripción

Como usuario web, quiero ver la lista completa de mis hábitos y poder crear, editar o eliminar hábitos, para gestionar mi configuración de hábitos desde el navegador.

## Criterios de Aceptación

- [ ] Página `HabitsListPage` (`/habits`) implementada
- [ ] Header de página:
  - Título: "Mis Hábitos"
  - Botón "Nuevo Hábito" → abre modal/página de crear hábito
  - Input de búsqueda (filtrar por nombre)
  - Filtros: dropdown por categoría, toggle "Mostrar inactivos"
- [ ] Lista de hábitos en cards/tabla:
  - Icono y color de categoría
  - Nombre del hábito
  - Tipo: CHECK o NUMERIC (badge)
  - Periodicidad: "Diario", "Semanal (L,M,V)", etc.
  - Momento del día
  - Racha actual
  - Botones de acción: Editar, Desactivar/Eliminar
  - Ordenamiento: por nombre, por racha, por fecha de creación
  - Hábitos inactivos con opacidad reducida
- [ ] Modal/Página de Crear Hábito:
  - Formulario con campos:
    - Nombre (input text, obligatorio)
    - Descripción (textarea, opcional)
    - Categoría (select, obligatorio)
    - Tipo: CHECK o NUMERIC (radio buttons)
    - Si NUMERIC: Target value + Unit
    - Periodicidad: Diaria, Semanal, Mensual, Personalizada
    - Momento del día
    - Color
  - Validaciones: nombre no vacío, categoría seleccionada
  - Botones: "Guardar" y "Cancelar"
- [ ] Editar hábito:
  - Click en "Editar" → abre modal con formulario precargado
  - Guarda cambios con PUT /api/habits/:id
- [ ] Desactivar hábito:
  - Click en "Desactivar" → modal de confirmación
  - DELETE /api/habits/:id (soft delete)
- [ ] Atajos de teclado:
  - `n`: nuevo hábito
  - `e`: editar hábito seleccionado
  - `d`: desactivar hábito seleccionado
  - `/`: focus en búsqueda

## Tareas Técnicas

- [ ] Crear página HabitsListPage - [1.5h]
- [ ] Crear componente HabitCard/Row para lista - [1h]
- [ ] Implementar filtros y búsqueda - [1.5h]
- [ ] Crear modal/página CreateHabitPage - [2.5h]
- [ ] Crear formulario de hábito con React Hook Form + Zod - [2h]
- [ ] Implementar lógica de editar hábito - [1h]
- [ ] Implementar lógica de desactivar hábito - [0.5h]
- [ ] Integrar con API usando TanStack Query - [1.5h]
- [ ] Implementar atajos de teclado - [1h]
- [ ] Escribir tests - [2h]

## Componentes Afectados

- **web:** HabitsListPage, CreateHabitPage, HabitForm, filters

## Dependencias

- US-096 (MainLayout)
- Backend endpoints de hábitos (Sprint 3)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
