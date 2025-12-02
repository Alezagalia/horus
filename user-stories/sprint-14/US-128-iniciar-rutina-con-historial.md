# US-128: Endpoint para Iniciar Rutina con Historial de Última Ejecución

**Tipo:** user-story
**Prioridad:** critical
**Sprint:** 14
**Story Points:** 8
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** que al iniciar una rutina el sistema me muestre peso y reps de la última vez que la hice
**Para** saber desde dónde continuar y registrar progreso fácilmente

---

## Contexto

**Esta es la User Story más crítica y compleja del sprint.** El valor diferencial del sistema está en mostrar automáticamente los datos de la última ejecución al iniciar una rutina. Esto permite:

- **Progresión lineal:** Usuario ve "última vez hice 60kg" → intenta 62.5kg
- **Sin memorizar:** No necesita recordar qué peso usó hace 3 días
- **Motivación:** Ve su progreso automáticamente

### Flujo esperado:

1. Usuario selecciona rutina "Push Day"
2. Backend busca el último Workout completado de esa rutina
3. Para cada ejercicio, extrae las series de la última vez
4. Calcula: peso promedio, peso máximo, reps promedio
5. Retorna todo esto pre-cargado para que el usuario ajuste

---

## Criterios de Aceptación

### 1. POST /api/routines/:id/start - Iniciar sesión de entrenamiento

**Request:**

```bash
POST /api/routines/rt_push_day/start
Authorization: Bearer <token>
```

**Proceso interno:**

**Paso 1:** Validaciones

- [x] Rutina existe y pertenece al usuario
- [x] Usuario NO tiene otro workout activo (endTime = null)
  - Si tiene workout activo: retornar 409 Conflict "Ya tienes un entrenamiento en progreso. Finalízalo primero."

**Paso 2:** Crear nuevo Workout

- [x] Crear registro en Workout:
  ```typescript
  {
    userId,
    routineId: req.params.id,
    startTime: new Date(),
    endTime: null,
    notes: null
  }
  ```

**Paso 3:** Buscar último Workout completado de esta rutina ⚠️ CRÍTICO

- [x] Query:
  ```typescript
  const lastWorkout = await prisma.workout.findFirst({
    where: {
      userId,
      routineId,
      endTime: { not: null }, // Solo completados
      id: { not: newWorkoutId }, // Excluir el que acabamos de crear
    },
    orderBy: { startTime: 'desc' },
    include: {
      workoutExercises: {
        include: {
          exercise: true,
          workoutSets: {
            orderBy: { setNumber: 'asc' },
          },
        },
      },
    },
  });
  ```

**Paso 4:** Para cada ejercicio de la rutina, extraer datos históricos

- [x] Iterar por cada RoutineExercise de la rutina
- [x] Buscar el ejercicio correspondiente en lastWorkout.workoutExercises
- [x] Si existe (ya se hizo antes):
  - Extraer todas las series (workoutSets)
  - Calcular estadísticas:
    ```typescript
    lastWorkoutData = {
      date: lastWorkout.startTime,
      lastReps: sets[sets.length - 1].reps, // Última serie
      lastWeight: sets[sets.length - 1].weight,
      lastWeightUnit: sets[sets.length - 1].weightUnit,
      avgReps: average(sets.map((s) => s.reps)),
      avgWeight: average(sets.map((s) => s.weight)),
      maxWeight: max(sets.map((s) => s.weight)),
      totalSets: sets.length,
      allSets: sets.map((s) => ({ setNumber: s.setNumber, reps: s.reps, weight: s.weight })),
    };
    ```
- [x] Si NO existe (primera vez haciendo este ejercicio):
  ```typescript
  lastWorkoutData = null;
  ```

**Paso 5:** Crear WorkoutExercise (sin sets aún)

- [x] Para cada RoutineExercise, crear WorkoutExercise:
  ```typescript
  await prisma.workoutExercise.create({
    data: {
      workoutId: newWorkout.id,
      exerciseId: routineExercise.exerciseId,
      order: routineExercise.order,
      notes: null,
      rpe: null,
    },
  });
  ```

**Response 201 Created:**

```json
{
  "workout": {
    "id": "wo_new_123",
    "routineId": "rt_push_day",
    "routineName": "Push Day",
    "startTime": "2025-10-22T14:00:00Z",
    "endTime": null
  },
  "exercises": [
    {
      "workoutExerciseId": "we_001",
      "exerciseId": "ex_press_banca",
      "exerciseName": "Press Banca",
      "muscleGroup": "Pecho",
      "order": 1,
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60.0,
      "restTime": 90,
      "notes": "Foco en técnica",
      "lastWorkoutData": {
        "date": "2025-10-19T15:30:00Z",
        "lastReps": 8,
        "lastWeight": 60.0,
        "lastWeightUnit": "kg",
        "avgReps": 10,
        "avgWeight": 60.0,
        "maxWeight": 60.0,
        "totalSets": 3,
        "allSets": [
          { "setNumber": 1, "reps": 12, "weight": 60.0 },
          { "setNumber": 2, "reps": 10, "weight": 60.0 },
          { "setNumber": 3, "reps": 8, "weight": 60.0 }
        ]
      },
      "sets": []
    },
    {
      "workoutExerciseId": "we_002",
      "exerciseId": "ex_press_militar",
      "exerciseName": "Press Militar",
      "muscleGroup": "Hombros",
      "order": 2,
      "targetSets": 3,
      "targetReps": 12,
      "targetWeight": 40.0,
      "restTime": 60,
      "notes": null,
      "lastWorkoutData": null,
      "sets": []
    }
  ]
}
```

### 2. Casos especiales

**Si rutina nunca se ejecutó:**

- [x] lastWorkoutData = null para todos los ejercicios
- [x] Usar targetSets/targetReps/targetWeight de RoutineExercise como guía

**Si ejercicio es nuevo en la rutina:**

- [x] lastWorkoutData = null para ese ejercicio específico
- [x] Otros ejercicios sí tendrán historial

**Si usuario tiene workout activo:**

- [x] Retornar 409 Conflict
- [x] Mensaje: "Ya tienes un entrenamiento en progreso iniciado a las {startTime}. Finalízalo o cancélalo primero."
- [x] Incluir workoutId activo en response

---

## Tareas Técnicas

### Backend

1. **Crear endpoint POST /api/routines/:id/start** - [2h]
   - Route, controller, service
   - Validaciones de rutina y workout activo

2. **Implementar lógica de búsqueda de último workout** - [3h]
   - Query compleja con múltiples joins
   - Prisma includes: Workout → WorkoutExercise → WorkoutSet → Exercise
   - Optimización: limitar a últimos 90 días (performance)
   - Manejo de caso null (primera ejecución)

3. **Calcular estadísticas de última vez** - [1.5h]
   - Funciones helper: average, max
   - Extraer última serie
   - Agrupar sets por ejercicio
   - Formatear response

4. **Crear Workout y WorkoutExercise en transacción** - [1h]

   ```typescript
   await prisma.$transaction(async (tx) => {
     // 1. Crear Workout
     const workout = await tx.workout.create({ ... });

     // 2. Crear WorkoutExercise para cada RoutineExercise
     await tx.workoutExercise.createMany({
       data: routineExercises.map(re => ({ ... }))
     });

     // 3. Retornar con includes
     return await tx.workout.findUnique({
       where: { id: workout.id },
       include: { ... }
     });
   });
   ```

5. **Validación de workout activo** - [0.5h]
   - Query para buscar workout con endTime = null
   - Si existe, retornar error claro

6. **Tests unitarios con mocks de historial** - [2h]
   - Test: primera ejecución (sin historial)
   - Test: segunda ejecución (con historial)
   - Test: rutina con ejercicio nuevo
   - Test: ya tiene workout activo (error 409)

7. **Tests de integración E2E** - [2.5h]
   - Flujo: crear rutina → ejecutar → finalizar → iniciar de nuevo → verificar historial
   - Verificar que lastWorkoutData es correcto
   - Verificar cálculos de avg, max

---

## Optimización de Performance

### Query Optimization

**Problema:** Query con múltiples joins puede ser lento con mucho historial.

**Soluciones:**

1. **Índices:** Ya existen en userId, startTime
2. **Limitar búsqueda:** Solo últimos 90 días
3. **Select específico:** No traer campos innecesarios

```typescript
const lastWorkout = await prisma.workout.findFirst({
  where: {
    userId,
    routineId,
    endTime: { not: null },
    startTime: { gte: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000) }, // Últimos 90 días
  },
  orderBy: { startTime: 'desc' },
  take: 1,
  select: {
    id: true,
    startTime: true,
    workoutExercises: {
      select: {
        exerciseId: true,
        exercise: {
          select: { id: true, name: true, muscleGroup: true },
        },
        workoutSets: {
          select: { setNumber: true, reps: true, weight: true, weightUnit: true },
          orderBy: { setNumber: 'asc' },
        },
      },
    },
  },
});
```

**Target performance:** < 500ms incluso con 50+ workouts históricos

---

## Ejemplos de Response

### Primera ejecución (sin historial)

```json
{
  "workout": { "id": "wo_123", "startTime": "2025-10-22T14:00:00Z" },
  "exercises": [
    {
      "exerciseName": "Press Banca",
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60,
      "lastWorkoutData": null,
      "sets": []
    }
  ]
}
```

### Segunda ejecución (con historial)

```json
{
  "workout": { "id": "wo_456", "startTime": "2025-10-22T14:00:00Z" },
  "exercises": [
    {
      "exerciseName": "Press Banca",
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60,
      "lastWorkoutData": {
        "date": "2025-10-19T15:30:00Z",
        "lastReps": 8,
        "lastWeight": 60.0,
        "avgWeight": 60.0,
        "maxWeight": 60.0,
        "allSets": [
          { "setNumber": 1, "reps": 12, "weight": 60 },
          { "setNumber": 2, "reps": 10, "weight": 60 },
          { "setNumber": 3, "reps": 8, "weight": 60 }
        ]
      },
      "sets": []
    }
  ]
}
```

---

## Dependencias

- **US-125** (Modelos) completa
- **US-127** (Rutinas) completa

---

## Riesgos

| Riesgo                                            | Probabilidad | Impacto | Mitigación                                                       |
| ------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------- |
| Query lenta con mucho historial                   | Media        | Alto    | Limitar a 90 días, índices, select específico, pruebas de carga  |
| Lógica de cálculo incorrecta                      | Media        | Alto    | Tests exhaustivos con datos conocidos, code review estricto      |
| Edge case: rutina editada (ejercicios diferentes) | Media        | Medio   | Buscar por exerciseId (no por order), manejar null correctamente |

---

## Definition of Done

- [x] Código implementado
- [x] Query de historial optimizada (< 500ms validado con 50+ workouts)
- [x] Cálculos de estadísticas correctos (validados con tests)
- [x] Tests unitarios > 85% cobertura (crítico)
- [x] Tests E2E validando flujo: crear → ejecutar → finalizar → iniciar → verificar historial
- [x] Code review aprobado por 2 personas
- [x] Documentación con ejemplos de response
- [x] Deploy a staging exitoso
- [x] QA manual: ejecutar rutina 3 veces y verificar que historial es correcto

---

## Notas

**Decisión clave:** Retornar `allSets` completo (todas las series de la última vez), no solo promedios. Esto permite al frontend mostrar:

- "Última vez: 12-10-8 reps @ 60kg"
- Usuario puede ver si hizo pyramiding, drop sets, etc.

**Alternativa descartada:** Retornar solo último peso/reps. No da suficiente contexto.

**Futuro:** Considerar mostrar últimas 3 ejecuciones para ver tendencia.

---

**Estimación:** 8 Story Points (la más alta del backend)
**Tiempo estimado:** 12.5 horas
**Última actualización:** 2025-10-22
