# US-097: Dashboard (Home) con Resumen de Hábitos y Tareas

**Sprint:** 11 - Frontend Web Base
**ID:** US-097
**Título:** Dashboard (Home) con Resumen de Hábitos y Tareas

## Descripción

Como usuario web, quiero ver un resumen general de mis hábitos y tareas del día al entrar a la app, para tener una vista rápida de qué debo hacer hoy.

## Criterios de Aceptación

- [ ] Página `DashboardPage` (`/`) implementada
- [ ] Layout de cards con grid responsive:
  - Desktop: 2 columnas
  - Tablet: 1 columna
- [ ] Card "Hábitos de Hoy":
  - Título: "Hábitos de Hoy"
  - Porcentaje de cumplimiento circular (ej: 3/5 = 60%)
  - Lista de hábitos del día (max 5, luego "ver más")
  - Cada hábito con checkbox, nombre, icono categoría, badge racha
  - Botón "Ver todos" → navega a /habits/today
- [ ] Card "Tareas Próximas":
  - Título: "Tareas Próximas"
  - Lista de tareas con dueDate en próximos 7 días (max 5)
  - Cada tarea con checkbox, título, badge prioridad, due date relativo
  - Botón "Ver todas" → navega a /tasks
- [ ] Card "Racha Más Larga":
  - Título: "Tu Mejor Racha"
  - Nombre del hábito con la racha más larga
  - Número de días (grande, destacado)
  - 🔥 emoji animado
- [ ] Card "Estadísticas Rápidas":
  - Hábitos activos: X
  - Tareas pendientes: X
  - Tareas vencidas: X (rojo si >0)
- [ ] Loading states mientras carga datos
- [ ] Empty states si no hay hábitos/tareas
- [ ] Refresh automático con TanStack Query (staleTime: 5 minutos)
- [ ] Botón manual de refresh

## Tareas Técnicas

- [ ] Crear página DashboardPage - [1h]
- [ ] Crear componente Card reutilizable - [0.5h]
- [ ] Implementar card de Hábitos de Hoy - [1.5h]
- [ ] Implementar card de Tareas Próximas - [1h]
- [ ] Implementar card de Racha Más Larga - [0.5h]
- [ ] Implementar card de Estadísticas - [0.5h]
- [ ] Integrar con API usando TanStack Query - [1.5h]
- [ ] Implementar loading y empty states - [0.5h]
- [ ] Estilos responsive - [0.5h]
- [ ] Escribir tests - [1h]

## Componentes Afectados

- **web:** DashboardPage, Card components, summary widgets

## Dependencias

- US-096 (MainLayout)
- Backend endpoints de hábitos y tareas (Sprints 3-7)

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
