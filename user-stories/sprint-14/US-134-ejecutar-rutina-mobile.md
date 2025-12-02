# US-134: Pantalla de Ejecutar Rutina con Historial (Mobile) - CRÍTICA

**Tipo:** user-story
**Prioridad:** critical
**Sprint:** 14
**Story Points:** 10
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario móvil
**Quiero** ejecutar una rutina viendo peso/reps de la última vez y registrar cada serie
**Para** seguir mi progreso y entrenar eficientemente

---

## Contexto

**PANTALLA MÁS CRÍTICA DEL SPRINT**

Esta es la pantalla donde el usuario pasa 45-60 minutos durante su entrenamiento. Debe ser:

- **Intuitiva:** Ver datos históricos claramente
- **Rápida:** Registrar series con mínimos taps
- **Útil:** Timer de descanso, ver últimas series
- **Sin fricción:** Pre-cargado con datos de última vez

---

## Criterios de Aceptación

### Al entrar

- [x] Llamar `POST /api/routines/:id/start` para obtener historial
- [x] Header: nombre rutina, cronómetro en tiempo real, botón "Finalizar"

### Navegación entre ejercicios

- [x] Swiper horizontal o tabs
- [x] Indicador: "Ejercicio 2 de 5"
- [x] Botones "← Anterior" "Siguiente →"

### Vista de Ejercicio Actual

```
┌─────────────────────────────────┐
│ Press Banca (Pecho)             │
│ Ejercicio 1 de 5          [→]  │
├─────────────────────────────────┤
│ 📊 ÚLTIMA VEZ (hace 3 días) ▼  │
│   Serie 1: 12 reps @ 60kg       │
│   Serie 2: 10 reps @ 60kg       │
│   Serie 3: 8 reps @ 60kg        │
│   Promedio: 60kg | Max: 60kg    │
├─────────────────────────────────┤
│ 🎯 TARGET                       │
│   3 × 10 @ 60kg | Descanso: 90s│
├─────────────────────────────────┤
│ ✅ SERIES DE HOY                │
│   ✓ Serie 1: 12 reps @ 62kg    │
│   ✓ Serie 2: 11 reps @ 62kg    │
│                                 │
│   [+ AGREGAR SERIE]             │
├─────────────────────────────────┤
│ RPE: [========--] 8/10          │
│ Notas: Me costó la última...    │
└─────────────────────────────────┘
```

- [x] Sección "ÚLTIMA VEZ" (colapsable)
- [x] Sección "TARGET" de la rutina
- [x] Sección "SERIES DE HOY" con lista + botón agregar
- [x] RPE slider (1-10) al finalizar ejercicio
- [x] Campo notas opcionales

### Modal de Registrar Serie

- [x] Número de serie (auto: "Serie 3")
- [x] Input reps (pre-cargado con lastReps)
- [x] Input peso (pre-cargado con lastWeight)
- [x] Selector kg/lbs
- [x] Timer de descanso (cuenta regresiva, notificación al terminar)
- [x] Notas opcionales
- [x] Botones: "Cancelar", "Guardar Serie"
- [x] Al guardar → POST /api/workouts/:id/exercises/:exerciseId/sets

### Finalizar Entrenamiento

- [x] Modal confirmación: "¿Finalizar entrenamiento?"
- [x] Resumen preliminar: "5 ejercicios, 18 series, 45 min"
- [x] Campo notas generales
- [x] Botón "Finalizar" → PUT /api/workouts/:id/finish
- [x] Navegar a WorkoutSummaryScreen

### Cancelar

- [x] Confirmación: "¿Cancelar? Perderás todo el progreso."
- [x] Eliminar workout y navegar atrás

---

## Tareas Técnicas

1. ExecuteRoutineScreen - [3h]
2. Cronómetro en tiempo real - [1h]
3. Navegación entre ejercicios (swiper) - [1.5h]
4. Sección de historial colapsable - [1h]
5. Modal registrar serie con timers - [2.5h]
6. Timer de descanso con notificación - [1.5h]
7. Integración API (start, add set, finish) - [2h]
8. Pre-carga de datos (lastReps, lastWeight) - [1.5h]
9. Modal finalizar con resumen - [1h]
10. Styling responsive - [2h]
11. Tests - [4.5h]

---

## Definition of Done

- [x] Flujo E2E funciona
- [x] Pre-carga histórica funciona
- [x] Timer de descanso funciona
- [x] Tests > 60% cobertura
- [x] QA exhaustivo
- [x] Code review aprobado

---

**Estimación:** 10 SP | 21.5h (la más alta)
**Última actualización:** 2025-10-22
