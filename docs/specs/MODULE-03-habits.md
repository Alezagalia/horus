# SPEC-03: Hábitos

**Tipo:** module
**Estado:** draft
**Dominio:** hábitos y tracking diario
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías)

---

## Objetivo

Permitir al usuario definir hábitos personales con frecuencia configurable, registrar su cumplimiento diario (check o valor numérico), visualizar estadísticas de racha y progreso, y recibir recordatorios.

## Actores

- **Usuario autenticado**: gestiona sus hábitos y registra cumplimiento.
- **Sistema (cron)**: auto-completa hábitos pendientes y envía notificaciones.

---

## Reglas de Negocio

1. Un hábito puede ser de tipo `CHECK` (completado/no) o `NUMERIC` (valor numérico con unidad y meta).
2. La periodicidad puede ser `DAILY`, `WEEKLY`, `MONTHLY` o `CUSTOM` (días específicos de la semana).
3. Solo puede existir un `HabitRecord` por hábito + usuario + fecha (constraint único).
4. Las operaciones de marcar un hábito crean o actualizan el record del día (upsert).
5. El sistema mantiene `currentStreak` y `longestStreak` automáticamente.
6. Un hábito eliminado usa soft delete (`isActive = false`); puede reactivarse.
7. Cada cambio al hábito genera un registro en `HabitAudit` con el campo modificado, valor anterior y nuevo.
8. Las notificaciones se configuran por hábito individual (`NotificationSetting`), con hora específica.
9. Es posible marcar cumplimiento de forma retroactiva (fechas pasadas).
10. Los hábitos tienen un `order` para personalizar la visualización; puede reordenarse.
11. El `timeOfDay` clasifica cuándo ejecutar el hábito (mañana, tarde, noche, etc.).

---

## Modelo de Datos

```prisma
model Habit {
  id                String      @id @default(uuid())
  userId            String
  categoryId        String?
  name              String
  description       String?
  type              HabitType   // CHECK | NUMERIC
  targetValue       Float?      // solo para NUMERIC
  unit              String?     // ej: "vasos", "minutos"
  periodicity       Periodicity // DAILY | WEEKLY | MONTHLY | CUSTOM
  weekDays          Int[]       // 0=Dom ... 6=Sab (para CUSTOM)
  timeOfDay         TimeOfDay   @default(ANYTIME)
  reminderTime      String?     // "HH:mm"
  color             String?
  order             Int         @default(0)
  isActive          Boolean     @default(true)
  currentStreak     Int         @default(0)
  longestStreak     Int         @default(0)
  lastCompletedDate DateTime?

  user              User        @relation(...)
  category          Category?   @relation(...)
  records           HabitRecord[]
  audits            HabitAudit[]
  notification      NotificationSetting?
}

model HabitRecord {
  id        String   @id @default(uuid())
  habitId   String
  userId    String
  date      DateTime @db.Date
  completed Boolean  @default(false)
  value     Float?   // para tipo NUMERIC
  notes     String?

  @@unique([habitId, userId, date])
}

model HabitAudit {
  id           String    @id @default(uuid())
  habitId      String
  userId       String
  changeType   String    // CREATED | UPDATED | DELETED | REACTIVATED
  fieldChanged String?
  oldValue     String?
  newValue     String?
  reason       String?
  createdAt    DateTime  @default(now())
}

model NotificationSetting {
  id       String  @id @default(uuid())
  habitId  String  @unique
  userId   String
  enabled  Boolean @default(true)
  time     String  // "HH:mm"
}

enum HabitType    { CHECK NUMERIC }
enum Periodicity  { DAILY WEEKLY MONTHLY CUSTOM }
enum TimeOfDay    { AYUNO MANANA MEDIA_MANANA TARDE MEDIA_TARDE NOCHE ANTES_DORMIR ANYTIME }
```

---

## API Endpoints

**Base path:** `/api/habits`

| Método   | Path                        | Descripción                          |
| -------- | --------------------------- | ------------------------------------ |
| `GET`    | `/`                         | Listar hábitos activos del usuario   |
| `GET`    | `/stats`                    | Estadísticas globales de hábitos     |
| `GET`    | `/:id`                      | Obtener hábito por ID                |
| `GET`    | `/:id/stats`                | Estadísticas de un hábito específico |
| `GET`    | `/:id/audit`                | Historial de cambios del hábito      |
| `GET`    | `/:id/records`              | Records por rango de fechas          |
| `GET`    | `/:id/records/:date`        | Record de una fecha específica       |
| `GET`    | `/:id/history`              | Historial paginado de records        |
| `POST`   | `/`                         | Crear nuevo hábito                   |
| `POST`   | `/:id/reactivate`           | Reactivar hábito eliminado           |
| `POST`   | `/:id/records`              | Crear/actualizar record (upsert)     |
| `POST`   | `/:id/records/retroactive`  | Marcar cumplimiento en fecha pasada  |
| `PUT`    | `/reorder`                  | Reordenar lista de hábitos           |
| `PUT`    | `/:id`                      | Actualizar hábito                    |
| `PUT`    | `/:id/notifications`        | Configurar notificaciones del hábito |
| `PUT`    | `/:id/daily/:date`          | Marcar hábito para fecha específica  |
| `PUT`    | `/:id/daily/:date/progress` | Actualizar valor numérico del día    |
| `DELETE` | `/:id`                      | Soft delete del hábito               |

---

## Criterios de Aceptación

- [ ] Solo puede existir un record por hábito por fecha (upsert en vez de insert duplicado).
- [ ] La racha (`currentStreak`) se recalcula al marcar/desmarcar un hábito.
- [ ] Un hábito NUMERIC requiere `targetValue` y `unit`.
- [ ] El historial de auditoría registra todos los cambios con campo, valor anterior y nuevo.
- [ ] La reactivación de un hábito crea un registro en `HabitAudit` con `changeType = REACTIVATED`.
- [ ] Los hábitos se pueden reordenar; el orden se persiste en BD.
- [ ] Las notificaciones se envían a la hora configurada si `enabled = true`.
- [ ] El listado diario filtra por periodicidad y `weekDays` según la fecha consultada.
- [ ] Un usuario no puede ver o modificar hábitos de otro usuario.
