# SPEC-08: Fitness (Ejercicios, Rutinas y Entrenamientos)

**Tipo:** module
**Estado:** draft
**Dominio:** fitness y seguimiento de entrenamiento
**Dependencias:** SPEC-01 (Auth)

---

## Objetivo

Permitir al usuario definir ejercicios, armar rutinas de entrenamiento y registrar cada sesión (workout) con sus series, repeticiones y pesos. Proveer historial y progresión a lo largo del tiempo.

## Actores

- **Usuario autenticado**: crea ejercicios, define rutinas y registra entrenamientos.

---

## Reglas de Negocio

1. Un `Exercise` es una entidad reutilizable; el nombre es único por usuario.
2. Una `Routine` es una plantilla de entrenamiento que agrupa ejercicios ordenados con metas de series/reps/peso.
3. Un ejercicio no puede aparecer dos veces en la misma rutina (constraint único `routineId + exerciseId`).
4. Un `Workout` es una **ejecución real** de una rutina, con `startTime` y `endTime`.
5. Cada ejercicio del workout (`WorkoutExercise`) registra series individuales (`WorkoutSet`) con reps, peso, unidad y estado de completado.
6. El `rpe` (Rate of Perceived Exertion) es un valor de 1-10 opcional por ejercicio ejecutado.
7. Los pesos se registran con unidad: `kg` o `lbs`.
8. Los grupos musculares disponibles: `pecho`, `espalda`, `piernas`, `hombros`, `brazos`, `core`, `cardio`, `otro`.

---

## Modelo de Datos

```prisma
model Exercise {
  id          String    @id @default(uuid())
  userId      String
  name        String
  muscleGroup MuscleGroup
  notes       String?
  createdAt   DateTime  @default(now())

  user              User              @relation(...)
  routineExercises  RoutineExercise[]
  workoutExercises  WorkoutExercise[]

  @@unique([userId, name])
}

model Routine {
  id          String            @id @default(uuid())
  userId      String
  name        String
  description String?
  createdAt   DateTime          @default(now())
  updatedAt   DateTime          @updatedAt

  user        User              @relation(...)
  exercises   RoutineExercise[]
  workouts    Workout[]
}

model RoutineExercise {
  id            String    @id @default(uuid())
  routineId     String
  exerciseId    String
  order         Int
  targetSets    Int?
  targetReps    Int?
  targetWeight  Float?
  restTime      Int?      // segundos
  notes         String?

  routine       Routine   @relation(...)
  exercise      Exercise  @relation(...)

  @@unique([routineId, exerciseId])
}

model Workout {
  id         String            @id @default(uuid())
  userId     String
  routineId  String?
  startTime  DateTime
  endTime    DateTime?
  notes      String?
  createdAt  DateTime          @default(now())

  user       User              @relation(...)
  routine    Routine?          @relation(...)
  exercises  WorkoutExercise[]
}

model WorkoutExercise {
  id         String       @id @default(uuid())
  workoutId  String
  exerciseId String
  order      Int
  notes      String?
  rpe        Int?         // 1-10

  workout    Workout      @relation(...)
  exercise   Exercise     @relation(...)
  sets       WorkoutSet[]
}

model WorkoutSet {
  id                String          @id @default(uuid())
  workoutExerciseId String
  setNumber         Int
  reps              Int?
  weight            Float?
  weightUnit        String          @default("kg") // kg | lbs
  completed         Boolean         @default(false)
  restTime          Int?            // segundos
  notes             String?
  timestamp         DateTime?

  workoutExercise   WorkoutExercise @relation(...)
}

enum MuscleGroup { pecho espalda piernas hombros brazos core cardio otro }
```

---

## API Endpoints

### Ejercicios — `/api/exercises`

| Método   | Path   | Descripción                   |
| -------- | ------ | ----------------------------- |
| `GET`    | `/`    | Listar ejercicios del usuario |
| `GET`    | `/:id` | Obtener ejercicio             |
| `POST`   | `/`    | Crear ejercicio               |
| `PUT`    | `/:id` | Actualizar ejercicio          |
| `DELETE` | `/:id` | Eliminar ejercicio            |

### Rutinas — `/api/routines`

| Método   | Path         | Descripción                            |
| -------- | ------------ | -------------------------------------- |
| `GET`    | `/`          | Listar rutinas                         |
| `GET`    | `/:id`       | Obtener rutina con ejercicios          |
| `POST`   | `/`          | Crear rutina                           |
| `POST`   | `/:id/start` | Iniciar un workout basado en la rutina |
| `PUT`    | `/:id`       | Actualizar rutina                      |
| `DELETE` | `/:id`       | Eliminar rutina                        |

### Workouts — `/api/workouts`

| Método   | Path   | Descripción                             |
| -------- | ------ | --------------------------------------- |
| `GET`    | `/`    | Listar workouts (historial)             |
| `GET`    | `/:id` | Obtener workout con ejercicios y series |
| `PUT`    | `/:id` | Actualizar workout (endTime, notas)     |
| `DELETE` | `/:id` | Eliminar workout                        |

---

## Criterios de Aceptación

- [ ] El nombre de un ejercicio es único por usuario.
- [ ] Un ejercicio no puede estar duplicado en la misma rutina.
- [ ] Iniciar un workout crea una instancia `Workout` con `startTime = now()`.
- [ ] Cada set del workout registra reps, peso y si fue completado.
- [ ] El `rpe` es opcional y acepta valores de 1 a 10.
- [ ] Los pesos admiten unidades `kg` y `lbs`.
- [ ] Un usuario no puede ver o modificar ejercicios/rutinas/workouts de otro usuario.
