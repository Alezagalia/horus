# US-127: Endpoints CRUD de Rutinas (Backend)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 6
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** poder crear rutinas con múltiples ejercicios ordenados
**Para** organizar mis entrenamientos en plantillas reutilizables

---

## Contexto

Las rutinas son plantillas de entrenamiento que contienen múltiples ejercicios en un orden específico. Cada ejercicio puede tener valores objetivo (target) de series, reps, peso y tiempo de descanso. Estas son solo sugerencias - el usuario puede ajustar en tiempo real al ejecutar.

---

## Criterios de Aceptación

### 1. POST /api/routines - Crear rutina

**Request:**

```json
{
  "name": "Push Day",
  "description": "Rutina de empuje: pecho, hombros, tríceps",
  "exercises": [
    {
      "exerciseId": "ex_123",
      "order": 1,
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60.0,
      "restTime": 90,
      "notes": "Foco en técnica"
    },
    {
      "exerciseId": "ex_456",
      "order": 2,
      "targetSets": 3,
      "targetReps": 12,
      "targetWeight": 40.0,
      "restTime": 60
    }
  ]
}
```

**Validaciones:**

- [x] name obligatorio, max 100 caracteres
- [x] description opcional, max 500 caracteres
- [x] exercises: array con al menos 1 ejercicio
- [x] exerciseId: debe existir y pertenecer al usuario
- [x] order: debe ser secuencial (1, 2, 3...) sin saltos
- [x] targetSets, targetReps, targetWeight, restTime: opcionales, si se proveen validar > 0
- [x] Crear en **transacción atómica**: Routine + N × RoutineExercise

**Response:**

- [x] 201 Created con rutina completa (incluye ejercicios con detalles)
- [x] 400 Bad Request si validación falla
- [x] 404 Not Found si algún exerciseId no existe
- [x] 403 Forbidden si ejercicio no pertenece al usuario

### 2. GET /api/routines - Listar rutinas del usuario

**Response:**

```json
[
  {
    "id": "rt_001",
    "name": "Push Day",
    "description": "Rutina de empuje...",
    "exerciseCount": 5,
    "lastExecuted": "2025-10-20T14:30:00Z",
    "timesExecuted": 12,
    "createdAt": "2025-09-01T10:00:00Z"
  }
]
```

- [x] Retorna solo rutinas del usuario autenticado
- [x] Incluir información resumida:
  - exerciseCount: cantidad de ejercicios en la rutina
  - lastExecuted: fecha de último workout con esta rutina
  - timesExecuted: cantidad de workouts realizados con esta rutina
- [x] Ordenar por lastExecuted DESC (más recientes primero), luego por createdAt DESC
- [x] 200 OK con array (vacío si no tiene rutinas)

### 3. GET /api/routines/:id - Obtener rutina específica con detalles

**Response:**

```json
{
  "id": "rt_001",
  "name": "Push Day",
  "description": "Rutina de empuje...",
  "createdAt": "2025-09-01T10:00:00Z",
  "updatedAt": "2025-09-05T12:00:00Z",
  "exercises": [
    {
      "id": "re_001",
      "exerciseId": "ex_123",
      "exerciseName": "Press Banca",
      "muscleGroup": "Pecho",
      "order": 1,
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60.0,
      "restTime": 90,
      "notes": "Foco en técnica"
    },
    {
      "id": "re_002",
      "exerciseId": "ex_456",
      "exerciseName": "Press Militar",
      "muscleGroup": "Hombros",
      "order": 2,
      "targetSets": 3,
      "targetReps": 12,
      "targetWeight": 40.0,
      "restTime": 60,
      "notes": null
    }
  ],
  "stats": {
    "timesExecuted": 12,
    "lastExecuted": "2025-10-20T14:30:00Z",
    "avgDuration": 52
  }
}
```

- [x] Incluir lista completa de RoutineExercise ordenados por `order`
- [x] Para cada RoutineExercise, incluir detalles del Exercise (name, muscleGroup)
- [x] Incluir estadísticas de uso
- [x] 200 OK con rutina completa
- [x] 404 Not Found si no existe
- [x] 403 Forbidden si no pertenece al usuario

### 4. PUT /api/routines/:id - Editar rutina

**Request:**

```json
{
  "name": "Push Day (Actualizado)",
  "description": "Nueva descripción",
  "exercises": [
    {
      "exerciseId": "ex_123",
      "order": 1,
      "targetSets": 4,
      "targetReps": 8,
      "targetWeight": 65.0,
      "restTime": 120
    }
  ]
}
```

**Lógica:**

- [x] Permitir cambiar: name, description, exercises (lista completa)
- [x] Estrategia de actualización de ejercicios:
  - **Opción simple:** Eliminar todos los RoutineExercise existentes y crear nuevos
  - Más fácil de implementar que hacer diff
  - En transacción atómica
- [x] Validaciones iguales que en POST
- [x] 200 OK con rutina actualizada
- [x] 404 si no existe
- [x] 403 si no pertenece al usuario

### 5. DELETE /api/routines/:id - Eliminar rutina

- [x] Validar ownership
- [x] **Decisión:** Soft delete o eliminar?
  - Si tiene historial de workouts: mantener integridad (onDelete: SetNull en Workout.routineId)
  - RoutineExercise: eliminar (cascade)
- [x] Eliminar RoutineExercise asociados automáticamente (cascade en schema)
- [x] 204 No Content si se elimina
- [x] 404 si no existe
- [x] 403 si no pertenece al usuario

---

## Tareas Técnicas

### Backend

1. **Crear controller routinesController.ts** - [2.5h]
   - Métodos: create, list, getById, update, delete
   - Manejo de transacciones en create y update

2. **Crear service routinesService.ts** - [2h]
   - createRoutine(userId, data): crear Routine + RoutineExercises en transacción
   - getRoutines(userId): listar con stats
   - getRoutineById(id, userId): obtener con ejercicios y stats
   - updateRoutine(id, userId, data): eliminar old + crear new RoutineExercises
   - deleteRoutine(id, userId): eliminar rutina

3. **Definir Zod schemas** - [1h]

   ```typescript
   // shared/schemas/routine.schema.ts
   const routineExerciseSchema = z.object({
     exerciseId: z.string().cuid(),
     order: z.number().int().positive(),
     targetSets: z.number().int().positive().optional().nullable(),
     targetReps: z.number().int().positive().optional().nullable(),
     targetWeight: z.number().positive().optional().nullable(),
     restTime: z.number().int().positive().optional().nullable(),
     notes: z.string().max(500).optional().nullable(),
   });

   export const createRoutineSchema = z
     .object({
       name: z.string().min(1).max(100),
       description: z.string().max(500).optional().nullable(),
       exercises: z.array(routineExerciseSchema).min(1),
     })
     .refine(
       (data) => {
         const orders = data.exercises.map((e) => e.order);
         const expectedOrders = Array.from({ length: orders.length }, (_, i) => i + 1);
         return JSON.stringify(orders.sort()) === JSON.stringify(expectedOrders);
       },
       { message: 'Orders must be sequential starting from 1' }
     );

   export const updateRoutineSchema = createRoutineSchema;
   ```

4. **Crear rutas** - [0.5h]

   ```typescript
   router.post('/', authMiddleware, validateBody(createRoutineSchema), routinesController.create);
   router.get('/', authMiddleware, routinesController.list);
   router.get('/:id', authMiddleware, routinesController.getById);
   router.put('/:id', authMiddleware, validateBody(updateRoutineSchema), routinesController.update);
   router.delete('/:id', authMiddleware, routinesController.delete);
   ```

5. **Implementar lógica de transacciones** - [1.5h]

   ```typescript
   // En service
   async createRoutine(userId: string, data: CreateRoutineInput) {
     return await prisma.$transaction(async (tx) => {
       // 1. Verificar que todos los exercises existen y pertenecen al usuario
       const exerciseIds = data.exercises.map(e => e.exerciseId);
       const exercises = await tx.exercise.findMany({
         where: { id: { in: exerciseIds }, userId }
       });
       if (exercises.length !== exerciseIds.length) {
         throw new Error("Some exercises not found or don't belong to user");
       }

       // 2. Crear routine
       const routine = await tx.routine.create({
         data: {
           userId,
           name: data.name,
           description: data.description
         }
       });

       // 3. Crear routine exercises
       await tx.routineExercise.createMany({
         data: data.exercises.map(e => ({
           routineId: routine.id,
           exerciseId: e.exerciseId,
           order: e.order,
           targetSets: e.targetSets,
           targetReps: e.targetReps,
           targetWeight: e.targetWeight,
           restTime: e.restTime,
           notes: e.notes
         }))
       });

       // 4. Retornar con includes
       return await tx.routine.findUnique({
         where: { id: routine.id },
         include: {
           routineExercises: {
             include: { exercise: true },
             orderBy: { order: 'asc' }
           }
         }
       });
     });
   }
   ```

6. **Tests unitarios** - [2h]
   - Test create: éxito, validación, ejercicio no existe, orden incorrecto
   - Test list: con/sin rutinas, stats correctos
   - Test get: éxito, no existe, no ownership
   - Test update: cambiar ejercicios, validaciones
   - Test delete: éxito

7. **Tests de integración con transacciones** - [2h]
   - Flujo completo: crear → obtener → editar → eliminar
   - Caso: crear rutina con ejercicio que no existe (rollback)
   - Caso: editar agregando/quitando ejercicios

---

## Ejemplos de Uso

### Crear rutina Push/Pull/Legs

```bash
POST /api/routines
Authorization: Bearer <token>

{
  "name": "Push Day",
  "description": "Pecho, hombros, tríceps",
  "exercises": [
    {
      "exerciseId": "ex_press_banca",
      "order": 1,
      "targetSets": 3,
      "targetReps": 10,
      "targetWeight": 60,
      "restTime": 90
    },
    {
      "exerciseId": "ex_press_militar",
      "order": 2,
      "targetSets": 3,
      "targetReps": 12,
      "targetWeight": 40,
      "restTime": 60
    },
    {
      "exerciseId": "ex_fondos",
      "order": 3,
      "targetSets": 3,
      "targetReps": 15,
      "targetWeight": 0,
      "restTime": 60,
      "notes": "Peso corporal"
    }
  ]
}
```

---

## Dependencias

- **US-125** (Modelos) completa
- **US-126** (Ejercicios) completa - necesita ejercicios para crear rutinas

---

## Riesgos

| Riesgo                                               | Probabilidad | Impacto | Mitigación                                                             |
| ---------------------------------------------------- | ------------ | ------- | ---------------------------------------------------------------------- |
| Transacción falla y deja datos inconsistentes        | Baja         | Alto    | Prisma maneja rollback automático, tests exhaustivos                   |
| Usuario edita rutina que está ejecutando actualmente | Baja         | Medio   | No afecta workouts en progreso (usan snapshot de la rutina al iniciar) |

---

## Definition of Done

- [x] Código implementado (controller, service, routes)
- [x] Zod schemas con validación de orden secuencial
- [x] Tests unitarios > 80% cobertura
- [x] Tests de transacciones atómicas
- [x] Code review aprobado
- [x] Documentación de API actualizada
- [x] Validado manualmente: crear rutina con 5+ ejercicios, editar, eliminar
- [x] Deploy a staging exitoso

---

## Notas

- **Decisión de diseño:** Usar estrategia de "delete all + create new" para edición de ejercicios. Es más simple que hacer diff y no afecta historial de workouts (usan IDs de Exercise, no de RoutineExercise).

- **Performance:** Transacciones Prisma son rápidas. Con 10 ejercicios por rutina, creación toma < 100ms.

- **Futuro:** Considerar feature de "duplicar rutina" o "compartir rutina con otros usuarios".

---

**Estimación:** 6 Story Points
**Tiempo estimado:** 11.5 horas
**Última actualización:** 2025-10-22
