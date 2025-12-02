# US-135: Pantalla de Historial de Entrenamientos (Mobile)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 4
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario móvil
**Quiero** ver el historial de mis entrenamientos completados
**Para** revisar mi actividad y progreso

---

## Criterios de Aceptación

### WorkoutHistoryScreen

- [x] Header: "Historial" con filtro de fechas
- [x] Lista de workouts: fecha, rutina, duración, resumen, volumen
- [x] Badge con color según duración (verde > 60 min, amarillo 30-60, gris < 30)
- [x] Click → navega a WorkoutDetailScreen
- [x] Filtros: 7 días / 30 días / 90 días / Todo
- [x] Filtro por rutina (dropdown)

### WorkoutDetailScreen

- [x] Header: fecha, duración, rutina
- [x] Notas generales
- [x] Lista de ejercicios con todas las series
- [x] Para cada ejercicio: nombre, RPE, notas, lista de sets
- [x] Resumen: total series, volumen, peso promedio
- [x] Botón "Repetir Rutina" (si es de rutina)

---

## Tareas Técnicas

1. WorkoutHistoryScreen - [1.5h]
2. WorkoutCard - [1h]
3. WorkoutDetailScreen - [2h]
4. Filtros - [1h]
5. Integración API - [1.5h]
6. Styling - [1h]
7. Tests - [1.5h]

---

**Estimación:** 4 SP | 9.5h
