# SPEC-04: Tareas

**Tipo:** module
**Estado:** draft
**Dominio:** gestión de tareas y checklist
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías)

---

## Objetivo

Permitir al usuario crear y gestionar tareas con prioridad, fecha de vencimiento, checklist de sub-ítems y control de estado. Las tareas vencidas sin acción se archivan automáticamente por el sistema.

## Actores

- **Usuario autenticado**: gestiona sus tareas.
- **Sistema (cron)**: archiva tareas vencidas automáticamente.

---

## Reglas de Negocio

1. Una tarea tiene prioridad: `alta`, `media` o `baja`.
2. Los estados posibles son: `pendiente → en_progreso → completada | cancelada`.
3. Al completar una tarea se registra `completedAt`.
4. Al cancelar una tarea se requiere `cancelReason` y se registra `canceledAt`.
5. Una tarea puede tener un checklist de sub-ítems (`TaskChecklistItem`); cada ítem tiene posición para reordenamiento.
6. Las tareas usan soft delete (`isActive`).
7. Las tareas tienen `orderPosition` para ordenamiento manual dentro de la lista.
8. El cron archiva tareas vencidas (pasada la `dueDate`) que aún están en `pendiente` o `en_progreso`.

---

## Modelo de Datos

```prisma
model Task {
  id            String          @id @default(uuid())
  userId        String
  categoryId    String?
  title         String
  description   String?
  priority      Priority        // alta | media | baja
  status        TaskStatus      // pendiente | en_progreso | completada | cancelada
  dueDate       DateTime?
  completedAt   DateTime?
  canceledAt    DateTime?
  cancelReason  String?
  archivedAt    DateTime?
  orderPosition Int             @default(0)
  isActive      Boolean         @default(true)
  createdAt     DateTime        @default(now())
  updatedAt     DateTime        @updatedAt

  user          User            @relation(...)
  category      Category?       @relation(...)
  checklist     TaskChecklistItem[]
}

model TaskChecklistItem {
  id        String   @id @default(uuid())
  taskId    String
  title     String
  completed Boolean  @default(false)
  position  Int      @default(0)

  task      Task     @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

enum Priority   { alta media baja }
enum TaskStatus { pendiente en_progreso completada cancelada }
```

---

## API Endpoints

**Base path:** `/api/tasks`

| Método   | Path                         | Descripción                                    |
| -------- | ---------------------------- | ---------------------------------------------- |
| `GET`    | `/`                          | Listar tareas (filtrable por status, priority) |
| `GET`    | `/:id`                       | Obtener tarea con checklist                    |
| `POST`   | `/`                          | Crear nueva tarea                              |
| `POST`   | `/:id/toggle`                | Alternar estado de la tarea                    |
| `PUT`    | `/:id`                       | Actualizar tarea                               |
| `PUT`    | `/:taskId/checklist/:itemId` | Actualizar ítem del checklist                  |
| `PUT`    | `/:taskId/checklist/reorder` | Reordenar ítems del checklist                  |
| `POST`   | `/:taskId/checklist`         | Agregar ítem al checklist                      |
| `DELETE` | `/:id`                       | Soft delete de tarea                           |
| `DELETE` | `/:taskId/checklist/:itemId` | Eliminar ítem del checklist                    |

---

## Criterios de Aceptación

- [ ] Al completar una tarea, `status = completada` y `completedAt` se registra automáticamente.
- [ ] Cancelar una tarea requiere `cancelReason`.
- [ ] Los ítems del checklist se pueden reordenar; el orden se persiste.
- [ ] El cron archiva tareas vencidas sin acción (marca `archivedAt`).
- [ ] Un usuario no puede ver o modificar tareas de otro usuario.
- [ ] El filtro por status en el listado es opcional (sin filtro retorna todas las activas).
