# SPEC-05: Eventos y Calendario

**Tipo:** module
**Estado:** draft
**Dominio:** gestión de eventos y agenda
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías), INTEGRATION-01 (Google Calendar), INTEGRATION-02 (Microsoft Calendar)

---

## Objetivo

Permitir al usuario crear y gestionar eventos en su calendario personal, con soporte para eventos de todo el día, recurrentes (RFC 5545 rrule) y sincronización bidireccional con Google Calendar y Microsoft Calendar.

## Actores

- **Usuario autenticado**: crea, edita y elimina eventos.
- **Sistema (sync)**: sincroniza eventos con proveedores externos de calendario.

---

## Reglas de Negocio

1. Un evento tiene fecha/hora de inicio y fin. Si `isAllDay = true`, se ignoran las horas.
2. Los eventos recurrentes se definen mediante una regla `rrule` (RFC 5545).
3. Las instancias de eventos recurrentes tienen una `self-relation` (`recurringEventId`) apuntando al evento padre.
4. Al sincronizar con Google Calendar, el `googleEventId` es único a nivel de sistema.
5. Un evento puede estar vinculado a una `CalendarConnection` (Google o Microsoft).
6. Los eventos usan soft delete con `archivedAt`.
7. El sistema rastrea reintentos de sincronización fallidos (`syncRetryCount`, `syncNextRetryAt`, `syncLastError`).
8. El estado de un evento: `pendiente`, `completado`, `cancelado`.
9. Los recordatorios se configuran en minutos antes del evento (`reminderMinutes`).

---

## Modelo de Datos

```prisma
model Event {
  id                  String              @id @default(uuid())
  userId              String
  categoryId          String?
  title               String
  description         String?
  location            String?
  startDateTime       DateTime
  endDateTime         DateTime
  isAllDay            Boolean             @default(false)
  isRecurring         Boolean             @default(false)
  rrule               String?             // RFC 5545 rrule string
  recurringEventId    String?             // self-relation: apunta al evento padre
  status              EventStatus         // pendiente | completado | cancelado
  completedAt         DateTime?
  canceledAt          DateTime?
  archivedAt          DateTime?
  syncWithGoogle      Boolean             @default(false)
  googleEventId       String?             @unique
  reminderMinutes     Int?
  notificationSent    Boolean             @default(false)
  syncRetryCount      Int                 @default(0)
  syncNextRetryAt     DateTime?
  syncLastError       String?
  calendarConnectionId String?
  externalEventId     String?
  createdAt           DateTime            @default(now())
  updatedAt           DateTime            @updatedAt

  user                User                @relation(...)
  category            Category?           @relation(...)
  parentEvent         Event?              @relation("RecurringEvents", fields: [recurringEventId], references: [id])
  childEvents         Event[]             @relation("RecurringEvents")
  calendarConnection  CalendarConnection? @relation(...)
}

model CalendarConnection {
  id             String           @id @default(uuid())
  userId         String
  provider       CalendarProvider // GOOGLE | MICROSOFT
  email          String
  accessToken    String
  refreshToken   String?
  tokenExpiresAt DateTime?
  lastSyncAt     DateTime?
  syncCursor     String?
  isActive       Boolean          @default(true)
  createdAt      DateTime         @default(now())

  user           User             @relation(...)
  events         Event[]

  @@unique([userId, provider])
}

model SyncSetting {
  id                      String    @id @default(uuid())
  userId                  String    @unique
  googleCalendarEnabled   Boolean   @default(false)
  googleAccessToken       String?
  googleRefreshToken      String?
  googleTokenExpiresAt    DateTime?
  lastSyncAt              DateTime?
}

enum EventStatus      { pendiente completado cancelado }
enum CalendarProvider { GOOGLE MICROSOFT }
```

---

## API Endpoints

**Base path:** `/api/events`

| Método   | Path   | Descripción                                    |
| -------- | ------ | ---------------------------------------------- |
| `GET`    | `/`    | Listar eventos (filtrable por rango de fechas) |
| `GET`    | `/:id` | Obtener evento por ID                          |
| `POST`   | `/`    | Crear nuevo evento                             |
| `PUT`    | `/:id` | Actualizar evento                              |
| `DELETE` | `/:id` | Soft delete (archivedAt)                       |

**Sync / Connections:** ver `INTEGRATION-01` y `INTEGRATION-02`

---

## Criterios de Aceptación

- [ ] Un evento `isAllDay` no requiere hora específica.
- [ ] Los eventos recurrentes se expanden correctamente según su `rrule`.
- [ ] Al crear un evento con `syncWithGoogle = true`, se sincroniza al proveedor correspondiente.
- [ ] El `googleEventId` es único; no se crean duplicados al sincronizar.
- [ ] Eliminar un evento recurrente puede eliminar solo la instancia o toda la serie.
- [ ] Los errores de sincronización quedan registrados en `syncLastError`.
- [ ] Un usuario no puede ver o modificar eventos de otro usuario.
