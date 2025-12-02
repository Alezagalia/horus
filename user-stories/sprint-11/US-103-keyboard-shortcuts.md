# Technical Task #1: Sistema de Atajos de Teclado Global

**Sprint:** 11 - Frontend Web Base
**ID:** TECH-001
**Título:** Sistema de Atajos de Teclado Global
**Tipo:** Infrastructure

## Descripción

Implementar un sistema global de atajos de teclado (keyboard shortcuts) que funcione en toda la aplicación, permitiendo a power users navegar y ejecutar acciones rápidamente sin usar el mouse.

## Razón

Los atajos de teclado son una feature clave para aplicaciones web productivas. Mejoran significativamente la experiencia de usuarios avanzados y diferencian la app de competidores.

## Atajos a Implementar

**Globales (disponibles en toda la app):**

- `?` - Mostrar modal con ayuda de atajos
- `/` - Focus en búsqueda (si hay input de búsqueda en la página)
- `g h` - Navegar a Dashboard (home)
- `g t` - Navegar a Hábitos del Día (today)
- `g m` - Navegar a Mis Hábitos (my habits)
- `g k` - Navegar a Tareas (tasks)
- `g c` - Navegar a Categorías (categories)
- `Esc` - Cerrar modal abierto

**En listas (hábitos, tareas):**

- `j` - Seleccionar siguiente item
- `k` - Seleccionar item anterior
- `Space` - Marcar/desmarcar completado
- `n` - Nuevo item (hábito o tarea)
- `e` - Editar item seleccionado
- `d` - Eliminar item seleccionado
- `Enter` - Abrir detalles del item seleccionado

**En formularios:**

- `Cmd/Ctrl + Enter` - Guardar formulario
- `Esc` - Cancelar y cerrar formulario

## Tareas Técnicas

- [ ] Instalar librería `react-hotkeys-hook` - [0.5h]
- [ ] Crear hook `useKeyboardShortcuts()` - [1h]
- [ ] Crear componente `KeyboardShortcutsHelp` (modal con lista) - [1h]
- [ ] Implementar navegación global (g + tecla) - [1h]
- [ ] Implementar navegación en listas (j, k) - [1h]
- [ ] Implementar acciones (Space, n, e, d, Enter) - [1.5h]
- [ ] Implementar modal de ayuda (?) - [0.5h]
- [ ] Prevenir conflictos con inputs - [0.5h]
- [ ] Documentar atajos en README - [0.5h]
- [ ] Tests de integración - [1.5h]

## Componentes Afectados

- **web:** Keyboard shortcuts system, help modal, all pages

## Dependencias

- US-094 (Setup del proyecto)

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
