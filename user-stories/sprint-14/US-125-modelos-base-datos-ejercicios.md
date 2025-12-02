# US-125: Modelos de Base de Datos para Sistema de Ejercicios

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 14
**Story Points:** 3
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

**Como** desarrollador backend
**Quiero** definir los modelos de base de datos para ejercicios, rutinas y entrenamientos
**Para** poder almacenar toda la información del sistema de fitness

---

## Contexto

Este módulo de ejercicios es completamente independiente de los demás módulos de Horus. Los modelos deben soportar:

- Ejercicios personalizados por usuario
- Rutinas con múltiples ejercicios
- Registro detallado de entrenamientos (series, reps, peso por serie)
- Historial completo para cálculo de progreso

---

## Criterios de Aceptación

### 1. Modelo Exercise

- [x] Campos: id, userId, name, muscleGroup, notes, createdAt, updatedAt
- [x] muscleGroup: valores permitidos ("Pecho", "Espalda", "Piernas", "Hombros", "Brazos", "Core", "Cardio", "Otro")
- [x] name: máximo 100 caracteres, único por usuario
- [x] Índice en userId para queries rápidas
- [x] Relación: User → Exercise (1:N)

### 2. Modelo Routine

- [x] Campos: id, userId, name, description, createdAt, updatedAt
- [x] name: máximo 100 caracteres
- [x] description: text, opcional
- [x] Índice en userId
- [x] Relación: User → Routine (1:N)

### 3. Modelo RoutineExercise (relación N:N)

- [x] Campos: id, routineId, exerciseId, order, targetSets, targetReps, targetWeight, restTime, notes
- [x] order: int para ordenar ejercicios en la rutina (1, 2, 3...)
- [x] targetSets, targetReps: int, opcionales (valores sugeridos)
- [x] targetWeight: decimal, opcional (kg)
- [x] restTime: int (segundos), opcional (ej: 90)
- [x] Unique constraint: [routineId, exerciseId]
- [x] Índice en routineId
- [x] Relaciones: Routine → RoutineExercise (1:N), Exercise → RoutineExercise (1:N)

### 4. Modelo Workout (sesión de entrenamiento)

- [x] Campos: id, userId, routineId, startTime, endTime, notes, createdAt
- [x] routineId: nullable (puede ser entrenamiento libre sin rutina)
- [x] startTime: DateTime (cuando inicia)
- [x] endTime: DateTime, nullable (null si está en progreso)
- [x] notes: text, opcional (notas generales del workout)
- [x] Índice compuesto: [userId, startTime]
- [x] Relaciones: User → Workout (1:N), Routine → Workout (1:N opcional)

### 5. Modelo WorkoutExercise (ejercicios ejecutados en sesión)

- [x] Campos: id, workoutId, exerciseId, order, notes, rpe, createdAt
- [x] order: int (orden de ejecución en el workout)
- [x] rpe: int (1-10), opcional (Rate of Perceived Exertion)
- [x] notes: text, opcional (notas específicas del ejercicio en esa sesión)
- [x] Índice en workoutId
- [x] Relaciones: Workout → WorkoutExercise (1:N), Exercise → WorkoutExercise (1:N)

### 6. Modelo WorkoutSet (series individuales)

- [x] Campos: id, workoutExerciseId, setNumber, reps, weight, weightUnit, completed, restTime, notes, timestamp
- [x] setNumber: int (1, 2, 3... secuencial por ejercicio)
- [x] reps: int (repeticiones realizadas)
- [x] weight: decimal (carga utilizada)
- [x] weightUnit: enum ("kg", "lbs"), default "kg"
- [x] completed: boolean, default true
- [x] restTime: int (segundos), opcional (tiempo de descanso después de esta serie)
- [x] notes: text, opcional
- [x] timestamp: DateTime (cuando se completó la serie)
- [x] Índice en workoutExerciseId
- [x] Relación: WorkoutExercise → WorkoutSet (1:N)

### 7. Migración y Validación

- [x] Migración de Prisma ejecutada sin errores en dev
- [x] Migración ejecutada en staging
- [x] Todas las relaciones funcionan correctamente (verificar con queries de prueba)
- [x] Foreign keys configuradas con cascadas apropiadas
- [x] Seed opcional: 5-10 ejercicios de ejemplo (Press Banca, Sentadilla, Peso Muerto, Dominadas, etc.)

---

## Tareas Técnicas

### Backend

1. **Definir schemas de Prisma** - [2h]
   - Crear schema.prisma con los 6 modelos
   - Definir tipos de datos apropiados (String, Int, Decimal, DateTime)
   - Configurar enums (weightUnit, muscleGroup)

2. **Configurar relaciones y constraints** - [1h]
   - Foreign keys con onDelete apropiados
   - Unique constraints
   - Índices para performance

3. **Crear y ejecutar migración** - [0.5h]
   - `npx prisma migrate dev --name add-fitness-models`
   - Verificar que se ejecuta sin errores

4. **Validar estructura en PostgreSQL** - [0.5h]
   - Conectar con pg admin o CLI
   - Verificar tablas, columnas, índices
   - Hacer queries de prueba

5. **Crear seed opcional** - [1h]
   - Script en `prisma/seeds/exercises.ts`
   - Insertar 10 ejercicios comunes por usuario de prueba
   - Crear 2 rutinas de ejemplo (Push/Pull)

---

## Ejemplo de Schema Prisma

```prisma
model Exercise {
  id           String   @id @default(cuid())
  userId       String
  name         String
  muscleGroup  String?  // "Pecho", "Espalda", etc.
  notes        String?  @db.Text
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt

  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  routineExercises  RoutineExercise[]
  workoutExercises  WorkoutExercise[]

  @@unique([userId, name])
  @@index([userId])
}

model Routine {
  id          String   @id @default(cuid())
  userId      String
  name        String
  description String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  user              User               @relation(fields: [userId], references: [id], onDelete: Cascade)
  routineExercises  RoutineExercise[]
  workouts          Workout[]

  @@index([userId])
}

model RoutineExercise {
  id           String   @id @default(cuid())
  routineId    String
  exerciseId   String
  order        Int
  targetSets   Int?
  targetReps   Int?
  targetWeight Decimal? @db.Decimal(10, 2)
  restTime     Int?     // segundos
  notes        String?  @db.Text

  routine  Routine  @relation(fields: [routineId], references: [id], onDelete: Cascade)
  exercise Exercise @relation(fields: [exerciseId], references: [id], onDelete: Restrict)

  @@unique([routineId, exerciseId])
  @@index([routineId])
}

model Workout {
  id        String    @id @default(cuid())
  userId    String
  routineId String?
  startTime DateTime  @default(now())
  endTime   DateTime?
  notes     String?   @db.Text
  createdAt DateTime  @default(now())

  user             User              @relation(fields: [userId], references: [id], onDelete: Cascade)
  routine          Routine?          @relation(fields: [routineId], references: [id], onDelete: SetNull)
  workoutExercises WorkoutExercise[]

  @@index([userId, startTime])
}

model WorkoutExercise {
  id         String   @id @default(cuid())
  workoutId  String
  exerciseId String
  order      Int
  notes      String?  @db.Text
  rpe        Int?     // 1-10
  createdAt  DateTime @default(now())

  workout     Workout      @relation(fields: [workoutId], references: [id], onDelete: Cascade)
  exercise    Exercise     @relation(fields: [exerciseId], references: [id], onDelete: Restrict)
  workoutSets WorkoutSet[]

  @@index([workoutId])
}

enum WeightUnit {
  kg
  lbs
}

model WorkoutSet {
  id                String     @id @default(cuid())
  workoutExerciseId String
  setNumber         Int
  reps              Int
  weight            Decimal    @db.Decimal(10, 2)
  weightUnit        WeightUnit @default(kg)
  completed         Boolean    @default(true)
  restTime          Int?       // segundos
  notes             String?    @db.Text
  timestamp         DateTime   @default(now())

  workoutExercise WorkoutExercise @relation(fields: [workoutExerciseId], references: [id], onDelete: Cascade)

  @@index([workoutExerciseId])
}
```

---

## Dependencias

- Ninguna (módulo independiente)
- Modelo User ya existe del Sprint 1

---

## Riesgos

| Riesgo                                                | Probabilidad | Impacto | Mitigación                                                                            |
| ----------------------------------------------------- | ------------ | ------- | ------------------------------------------------------------------------------------- |
| Migración falla por conflictos con modelos existentes | Baja         | Medio   | Backup de BD antes de migrar, rollback automático de Prisma                           |
| Índices no optimizan queries esperadas                | Media        | Bajo    | Revisar explain analyze de queries en US-128, agregar índices después si es necesario |

---

## Definition of Done

- [x] Schema de Prisma completo y revisado
- [x] Migraciones ejecutadas exitosamente en dev y staging
- [x] Tablas creadas en PostgreSQL con estructura correcta
- [x] Relaciones funcionan (validado con queries de prueba)
- [x] Seed de ejercicios ejemplo funciona
- [x] Documentación de modelos actualizada en README.md o ARQUITECTURA.md
- [x] Code review aprobado
- [x] No hay warnings de Prisma CLI

---

## Notas

- **Decisión de diseño:** WorkoutSet guarda cada serie individual con su peso y reps específicos (no promedio). Esto permite:
  - Análisis detallado de progreso
  - Ver exactamente qué pasó en cada serie
  - Detectar patrones (ej: siempre falla en serie 3)

- **onDelete behaviors:**
  - Exercise: Restrict (no permitir eliminar si está en rutinas/workouts)
  - Routine → RoutineExercise: Cascade (eliminar configuración de rutina)
  - Workout → WorkoutExercise → WorkoutSet: Cascade (eliminar todo el workout)

- **Performance:** Índices en userId y timestamps críticos para queries de historial

---

**Estimación:** 3 Story Points
**Tiempo estimado:** 5 horas
**Última actualización:** 2025-10-22
