# US-139: Página de Historial y Estadísticas (Web)

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 14
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** ver mi historial y estadísticas en el navegador
**Para** analizar mi progreso con pantalla grande

---

## Criterios de Aceptación

### WorkoutHistoryPage (`/workouts`)

- [x] Tabla de workouts: Fecha, Rutina, Duración, Ejercicios, Series, Volumen
- [x] Filtros: Fechas, Por rutina
- [x] Paginación
- [x] Click → WorkoutDetailPage

### WorkoutDetailPage (`/workouts/:id`)

- [x] Header: fecha, duración, rutina
- [x] Tabla de ejercicios con todas las series
- [x] Resumen con métricas
- [x] Botón "Repetir Rutina"

### StatsPage (`/stats`)

- [x] Tabs: General / Por Ejercicio
- [x] Dashboard con cards de métricas
- [x] Gráficos (react-chartjs-2 o recharts):
  - Línea (evolución peso)
  - Barras (volumen semanal)
  - Dona (distribución muscular)
- [x] Selector ejercicio para stats individuales
- [x] Selector de periodo

---

## Tareas Técnicas

1. WorkoutHistoryPage - [1.5h]
2. WorkoutDetailPage - [1h]
3. StatsPage con tabs - [2h]
4. Gráficos con recharts - [2.5h]
5. Integración API - [1.5h]
6. Styling responsive - [1.5h]
7. Tests - [1.5h]

---

**Estimación:** 5 SP | 11.5h
