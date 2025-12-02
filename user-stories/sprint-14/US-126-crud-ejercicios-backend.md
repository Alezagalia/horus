# US-126: Endpoints CRUD de Ejercicios (Backend)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 5
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** usuario
**Quiero** poder crear, listar, editar y eliminar mis ejercicios personalizados
**Para** tener un catálogo de ejercicios adaptado a mi entrenamiento

---

## Contexto

Los usuarios necesitan crear su propio catálogo de ejercicios. No hay catálogo predefinido global - cada usuario gestiona sus propios ejercicios. Esto permite máxima flexibilidad y personalización.

---

## Criterios de Aceptación

### 1. POST /api/exercises - Crear ejercicio

- [x] Body: `{ name, muscleGroup?, notes? }`
- [x] Validar name obligatorio (Zod)
- [x] Validar name único por usuario (no duplicados)
- [x] muscleGroup: validar que sea uno de: "Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Cardio", "Otro", null
- [x] notes: opcional, max 500 caracteres
- [x] Asignar userId del usuario autenticado
- [x] Retorna 201 Created con ejercicio creado
- [x] Retorna 400 si validación falla
- [x] Retorna 409 si name ya existe para ese usuario

### 2. GET /api/exercises - Listar ejercicios del usuario

- [x] Query params opcionales:
  - `?muscleGroup={group}` - filtrar por grupo muscular
  - `?search={term}` - buscar por nombre (case-insensitive, partial match)
- [x] Retorna solo ejercicios del usuario autenticado
- [x] Ordenar alfabéticamente por nombre (ASC)
- [x] Incluir contador de uso:
  - Veces usado en rutinas activas
  - Veces usado en workouts
  - Última vez usado (fecha)
- [x] Retorna 200 OK con array de ejercicios
- [x] Retorna array vacío si no tiene ejercicios

### 3. GET /api/exercises/:id - Obtener ejercicio específico

- [x] Validar que ejercicio existe
- [x] Validar ownership (pertenece al usuario autenticado)
- [x] Incluir estadísticas:
  - Veces usado en rutinas
  - Veces ejecutado en workouts
  - Última ejecución (fecha + datos de última serie)
  - Récord personal (peso máximo histórico)
- [x] Retorna 200 OK con ejercicio completo
- [x] Retorna 404 Not Found si no existe
- [x] Retorna 403 Forbidden si no pertenece al usuario

### 4. PUT /api/exercises/:id - Editar ejercicio

- [x] Body: `{ name?, muscleGroup?, notes? }`
- [x] Validar ownership
- [x] Permitir cambiar: name, muscleGroup, notes
- [x] Si cambia name: validar que siga siendo único
- [x] Retorna 200 OK con ejercicio actualizado
- [x] Retorna 404 si no existe
- [x] Retorna 403 si no pertenece al usuario
- [x] Retorna 409 si nuevo name ya existe

### 5. DELETE /api/exercises/:id - Eliminar ejercicio

- [x] Validar ownership
- [x] **CRÍTICO:** Validar que no esté en rutinas activas
  - Si está en RoutineExercise: retornar 409 Conflict
  - Mensaje: "No se puede eliminar. Está en X rutinas. Elimínalo de las rutinas primero."
- [x] Si está solo en historial de workouts: permitir eliminar
  - Considerar soft delete o mantener referencia (onDelete: Restrict en schema)
- [x] Retorna 204 No Content si se elimina
- [x] Retorna 404 si no existe
- [x] Retorna 403 si no pertenece al usuario
- [x] Retorna 409 si está en uso

---

## Tareas Técnicas

### Backend

1. **Crear controller exercisesController.ts** - [2h]

   ```typescript
   export const exercisesController = {
     create: async (req, res) => { ... },
     list: async (req, res) => { ... },
     getById: async (req, res) => { ... },
     update: async (req, res) => { ... },
     delete: async (req, res) => { ... }
   }
   ```

2. **Crear service exercisesService.ts** - [1.5h]
   - Lógica de negocio separada del controller
   - Funciones: createExercise, getExercises, getExerciseById, updateExercise, deleteExercise
   - Función auxiliar: checkExerciseInUse (para validar antes de delete)

3. **Definir Zod schemas** - [0.5h]

   ```typescript
   // shared/schemas/exercise.schema.ts
   export const muscleGroups = [
     'Pecho',
     'Espalda',
     'Piernas',
     'Hombros',
     'Brazos',
     'Core',
     'Cardio',
     'Otro',
   ] as const;

   export const createExerciseSchema = z.object({
     name: z.string().min(1).max(100),
     muscleGroup: z.enum(muscleGroups).optional().nullable(),
     notes: z.string().max(500).optional().nullable(),
   });

   export const updateExerciseSchema = createExerciseSchema.partial();

   export const exerciseFiltersSchema = z.object({
     muscleGroup: z.enum(muscleGroups).optional(),
     search: z.string().optional(),
   });
   ```

4. **Crear rutas** - [0.5h]

   ```typescript
   // routes/exercises.ts
   router.post('/', authMiddleware, validateBody(createExerciseSchema), exercisesController.create);
   router.get('/', authMiddleware, exercisesController.list);
   router.get('/:id', authMiddleware, exercisesController.getById);
   router.put(
     '/:id',
     authMiddleware,
     validateBody(updateExerciseSchema),
     exercisesController.update
   );
   router.delete('/:id', authMiddleware, exercisesController.delete);
   ```

5. **Implementar validación de uso en rutinas** - [1h]
   - Query para verificar si Exercise está en RoutineExercise
   - Contar rutinas que lo usan
   - Si count > 0: retornar error 409

6. **Tests unitarios de endpoints** - [2h]
   - Test create: éxito, validación, duplicado
   - Test list: sin filtros, con filtros, búsqueda
   - Test get: éxito, no existe, no ownership
   - Test update: éxito, duplicado de nombre
   - Test delete: éxito, en uso (409), no existe

7. **Tests de integración** - [1.5h]
   - Flujo completo: crear → listar → editar → eliminar
   - Caso: intentar eliminar ejercicio en rutina
   - Caso: búsqueda por nombre

---

## Endpoints Documentación (Swagger)

```yaml
/api/exercises:
  post:
    summary: Crear nuevo ejercicio
    tags: [Exercises]
    security: [bearerAuth]
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required: [name]
            properties:
              name: { type: string, maxLength: 100 }
              muscleGroup: { type: string, enum: [Pecho, Espalda, ...] }
              notes: { type: string, maxLength: 500 }
    responses:
      201:
        description: Ejercicio creado
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/Exercise'
      400: { description: Validación fallida }
      409: { description: Nombre duplicado }

  get:
    summary: Listar ejercicios del usuario
    tags: [Exercises]
    security: [bearerAuth]
    parameters:
      - in: query
        name: muscleGroup
        schema: { type: string }
      - in: query
        name: search
        schema: { type: string }
    responses:
      200:
        description: Lista de ejercicios
        content:
          application/json:
            schema:
              type: array
              items: { $ref: '#/components/schemas/Exercise' }
```

---

## Ejemplos de Requests/Responses

### Crear ejercicio

```bash
POST /api/exercises
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Press Banca",
  "muscleGroup": "Pecho",
  "notes": "Con barra olímpica"
}

# Response 201
{
  "id": "ex_123abc",
  "userId": "user_xyz",
  "name": "Press Banca",
  "muscleGroup": "Pecho",
  "notes": "Con barra olímpica",
  "createdAt": "2025-10-22T10:00:00Z",
  "updatedAt": "2025-10-22T10:00:00Z"
}
```

### Listar con filtros

```bash
GET /api/exercises?muscleGroup=Pecho&search=press
Authorization: Bearer <token>

# Response 200
[
  {
    "id": "ex_123abc",
    "name": "Press Banca",
    "muscleGroup": "Pecho",
    "usedInRoutines": 2,
    "usedInWorkouts": 15,
    "lastUsed": "2025-10-20T14:30:00Z"
  },
  {
    "id": "ex_456def",
    "name": "Press Militar",
    "muscleGroup": "Hombros",
    "usedInRoutines": 1,
    "usedInWorkouts": 8,
    "lastUsed": "2025-10-19T16:00:00Z"
  }
]
```

### Intentar eliminar ejercicio en uso

```bash
DELETE /api/exercises/ex_123abc
Authorization: Bearer <token>

# Response 409 Conflict
{
  "error": "Cannot delete exercise",
  "message": "Este ejercicio está en 2 rutinas. Elimínalo de las rutinas primero.",
  "routineCount": 2,
  "routines": [
    { "id": "rt_001", "name": "Push Day" },
    { "id": "rt_002", "name": "Full Body" }
  ]
}
```

---

## Dependencias

- **US-125 (Modelos de BD)** debe estar completa
- authMiddleware debe existir (del Sprint 1)
- Zod y validación middleware configurados

---

## Riesgos

| Riesgo                                                   | Probabilidad | Impacto | Mitigación                                                               |
| -------------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------ |
| Rendimiento lento al listar con muchos ejercicios (100+) | Baja         | Bajo    | Índice en userId ya existe, agregar paginación en futuro si es necesario |
| Usuarios eliminan ejercicio sin querer                   | Media        | Medio   | Validación de uso en rutinas previene pérdida de datos críticos          |

---

## Definition of Done

- [x] Código implementado (controller, service, routes)
- [x] Zod schemas en `shared/schemas/exercise.schema.ts`
- [x] Tests unitarios > 80% cobertura
- [x] Tests de integración pasando
- [x] Code review aprobado
- [x] Documentación de API actualizada (Swagger)
- [x] Endpoint funciona en Postman/Insomnia
- [x] Deploy a staging exitoso
- [x] QA manual: crear, editar, eliminar (con caso de uso en rutina)

---

## Notas

- **Decisión:** No hay catálogo global de ejercicios. Cada usuario crea los suyos. Esto simplifica permisos y permite máxima personalización.
- **Futuro:** Considerar feature de "compartir ejercicio" o "catálogo comunitario" en Sprint posterior.
- **Performance:** Con índice en userId, queries de listado serán rápidas incluso con 500+ ejercicios.

---

**Estimación:** 5 Story Points
**Tiempo estimado:** 9 horas
**Última actualización:** 2025-10-22
