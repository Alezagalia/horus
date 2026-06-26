# Auditoría de aislamiento por `userId` (S-01.2)

> Auditoría IDOR / broken object-level authorization del backend de Horus.
> Parte del plan de comercialización — Fase 1, P0 ([plan](./comercializacion-plan-implementacion.md), [análisis](./comercializacion-analisis.md) C-01.3).
> Método: 5 auditorías en paralelo sobre los 47 services + controllers, verificadas manualmente contra el código antes de actuar.
> Fecha: 2026-06-24

## Resultado general

El patrón base del proyecto es **seguro**: los controllers toman el `userId` del token (`req.user.id`, nunca del body) y la mayoría de services scopea con `findFirst({ where: { id, userId } })`. Sin embargo, se encontró un **patrón sistemático de IDOR**: cuando una operación recibe **claves foráneas en el body** (`foodId`, `recipeId`, `exerciseId`, `goalId`, `taskId`, `questionId`, `mealPlanId`), esas FKs se insertaban **sin validar que pertenezcan al usuario**. Esto permitía adjuntar/recibir recursos de otro usuario y, al releer, filtrar sus datos (nombres de alimentos, recetas, ejercicios, metas, tareas) mediante enumeración de ids.

## Hallazgos reales corregidos (Clase A — IDOR)

Todos mitigados con un guard central reutilizable: `src/lib/ownership.ts` → `assertOwnership(model, ids, userId)`, que valida por `count` que cada id no nulo pertenezca al usuario y lanza `ForbiddenError` si no.

| Severidad | Archivo                 | Función            | Problema                                                                                                 | Fix                                                  |
| --------- | ----------------------- | ------------------ | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| MEDIA     | recipe.service.ts       | `create`           | `foodId` de ingredientes no validado                                                                     | `assertOwnership('food', …)`                         |
| MEDIA     | recipe.service.ts       | `addIngredient`    | `foodId` no validado                                                                                     | `assertOwnership('food', [foodId])`                  |
| MEDIA     | mealPlan.service.ts     | `addEntry`         | `foodId` y `recipeId` de items no validados                                                              | `assertOwnership('food'/'recipe', …)`                |
| MEDIA     | nutritionLog.service.ts | `upsert`           | `foodId` de items no validado                                                                            | `assertOwnership('food', …)`                         |
| MEDIA     | shoppingList.service.ts | `create`           | `foodId` de items y `mealPlanId` no validados                                                            | `assertOwnership('mealPlan'/'food', …)`              |
| MEDIA     | workoutStats.service.ts | `getExerciseStats` | `findFirst({ id })` solo verificaba existencia, no ownership → filtraba nombre/grupo del ejercicio ajeno | añadido `userId` al `where`                          |
| MEDIA     | weeklyReview.service.ts | `updateReview`     | `questionId`, `focusGoalIds`, `focusTaskIds` del body no validados                                       | `assertOwnership('reviewQuestion'/'goal'/'task', …)` |

## Endurecido (Clase B — defensa en profundidad, no explotable)

| Archivo                | Función    | Nota                                                                                                                                                                                                                                                                   |
| ---------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| transaction.service.ts | `findById` | El `transferPair` se leía con `findUnique({ id })`. En la práctica `transferPairId` siempre apunta a otra transacción del mismo usuario (ambas patas se crean con su `userId`), por lo que no era explotable. Cambiado a `findFirst({ id, userId })` por consistencia. |

## Revisado y seguro (sin cambios)

- **task / habit / habitMoment / activity** `update`/`delete`: usan `update({ where: { id } })` tras un `findFirst({ id, userId })` previo que lanza `NotFound` si el recurso no es del usuario. No explotable (la verificación corta antes). _Hardening opcional futuro_: añadir `userId` al `where` del update para defensa en profundidad / evitar TOCTOU teórico.
- **account / budget / recurringExpense / savings-goal / event / goal (CRUD propio)**: validan ownership correctamente.
- **checklist / habitRecord / habitProgress**: validan el recurso padre (taskId / habitId) contra `userId`.
- **push / calendarConnection / notification / timeline / stats / analytics / sync (Google/Microsoft)**: scopean por `userId`; sin endpoints que acepten ids de recurso sin validar.

## Cobertura de tests

- `src/lib/ownership.test.ts` (4 tests): ownership OK, rechazo de id ajeno (`ForbiddenError`), de-dup + ignorar null, no-op sin ids.
- Suite backend completa: **113 tests en verde**.

## Deuda relacionada (fuera de alcance de S-01.2)

- El `type-check` global arroja ~115 errores **pre-existentes** (mocks de Prisma con tipos estrictos en `task.service.test.ts` y `weeklyReview.service.test.ts`). No introducidos por esta auditoría. Recomendado: ticket aparte.
- Hardening opcional Clase B (añadir `userId` a los `where` de update/delete que ya tienen check previo).
