# US-129: Endpoint para Registrar Series de Entrenamiento

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 6
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** registrar cada serie de cada ejercicio con reps y peso específicos
**Para** llevar un seguimiento detallado de mi entrenamiento

---

## Criterios de Aceptación

### 1. POST /api/workouts/:workoutId/exercises/:exerciseId/sets

**Request:**

```json
{
  "reps": 12,
  "weight": 60.5,
  "weightUnit": "kg",
  "completed": true,
  "restTime": 90,
  "notes": "Buena técnica"
}
```

**Validaciones:**

- [x] Workout existe, pertenece al usuario, NO está finalizado (endTime = null)
- [x] WorkoutExercise existe dentro del workout
- [x] reps > 0 (int)
- [x] weight >= 0 (decimal, puede ser 0 para peso corporal)
- [x] weightUnit: "kg" o "lbs" (default "kg")
- [x] completed: boolean (default true)
- [x] restTime, notes: opcionales

**Lógica:**

- [x] Calcular setNumber automáticamente:
  ```typescript
  const existingSets = await prisma.workoutSet.count({
    where: { workoutExerciseId },
  });
  const setNumber = existingSets + 1;
  ```
- [x] Crear WorkoutSet con timestamp = now()

**Response 201:**

```json
{
  "id": "ws_001",
  "workoutExerciseId": "we_001",
  "setNumber": 1,
  "reps": 12,
  "weight": 60.5,
  "weightUnit": "kg",
  "completed": true,
  "restTime": 90,
  "notes": "Buena técnica",
  "timestamp": "2025-10-22T14:15:30Z"
}
```

### 2. PUT /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId

- [x] Permitir editar: reps, weight, weightUnit, completed, restTime, notes
- [x] Solo si workout NO está finalizado
- [x] 200 OK con set actualizado
- [x] 403 si workout ya finalizado

### 3. DELETE /api/workouts/:workoutId/exercises/:exerciseId/sets/:setId

- [x] Solo si workout NO está finalizado
- [x] **Recalcular setNumber** de sets siguientes:
  ```typescript
  // Si elimino set 2 de 4:
  // Antes: [1, 2, 3, 4]
  // Después: [1, 2, 3] (el 3 pasa a ser 2, el 4 pasa a ser 3)
  const setsToUpdate = await prisma.workoutSet.findMany({
    where: { workoutExerciseId, setNumber: { gt: deletedSet.setNumber } },
  });
  for (const set of setsToUpdate) {
    await prisma.workoutSet.update({
      where: { id: set.id },
      data: { setNumber: set.setNumber - 1 },
    });
  }
  ```
- [x] 204 No Content

### 4. PUT /api/workouts/:workoutId/exercises/:exerciseId

- [x] Body: `{ rpe?, notes? }`
- [x] rpe: 1-10 (validar rango)
- [x] Actualizar WorkoutExercise
- [x] 200 OK

---

## Tareas Técnicas

1. **Endpoints en workoutsController.ts** - [2h]
2. **Lógica de setNumber automático** - [1h]
3. **Recálculo de setNumber al eliminar** - [1h]
4. **Validaciones de workout activo y ownership** - [1h]
5. **Zod schemas** - [0.5h]
6. **Tests unitarios** - [2h]
7. **Tests de edge cases** - [1.5h]

---

## Definition of Done

- [x] Código implementado
- [x] Tests > 80% cobertura
- [x] Tests de edge cases (eliminar set del medio)
- [x] Code review aprobado
- [x] Deploy a staging

---

**Estimación:** 6 SP | 9h
**Última actualización:** 2025-10-22
