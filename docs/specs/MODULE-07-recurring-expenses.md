# SPEC-07: Gastos Recurrentes y Mensualidades

**Tipo:** module
**Estado:** draft
**Dominio:** gestión financiera personal
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías), SPEC-06 (Finanzas)

---

## Objetivo

Gestionar gastos que ocurren de forma periódica mensual (servicios, suscripciones, pagos fijos). El sistema genera automáticamente instancias mensuales a partir de plantillas, permitiendo registrar el pago real cuando ocurre.

## Actores

- **Usuario autenticado**: crea plantillas de gastos recurrentes y registra sus pagos.
- **Sistema (cron)**: genera instancias mensuales al inicio de cada mes.

---

## Reglas de Negocio

1. Una `RecurringExpense` es la **plantilla** que define un gasto que se repite mensualmente.
2. El `dueDay` indica el día del mes en que vence el pago (1-31).
3. Al inicio de cada mes, el cron genera `MonthlyExpenseInstance` para cada plantilla activa.
4. Una instancia tiene su propio `amount` (puede diferir de la plantilla) y `previousAmount` para comparar variaciones.
5. Al pagar una instancia, se registra `paidDate`, se cambia `status = pagado` y se crea la transacción correspondiente en la cuenta indicada.
6. Solo se generan instancias para plantillas con `isActive = true`.
7. La constraint única `(recurringExpenseId, month, year)` evita instancias duplicadas.
8. Al desactivar una plantilla, las instancias ya generadas se mantienen.

---

## Modelo de Datos

```prisma
model RecurringExpense {
  id         String                  @id @default(uuid())
  userId     String
  concept    String
  categoryId String?
  currency   String                  // ISO 4217
  dueDay     Int                     // 1-31
  notes      String?
  isActive   Boolean                 @default(true)
  createdAt  DateTime                @default(now())
  updatedAt  DateTime                @updatedAt

  user       User                    @relation(...)
  category   Category?               @relation(...)
  instances  MonthlyExpenseInstance[]
}

model MonthlyExpenseInstance {
  id                  String        @id @default(uuid())
  recurringExpenseId  String
  userId              String
  month               Int           // 1-12
  year                Int
  concept             String
  categoryId          String?
  amount              Float
  previousAmount      Float?
  accountId           String?       // cuenta donde se registra el pago
  paidDate            DateTime?
  status              ExpenseStatus // pendiente | pagado
  notes               String?
  createdAt           DateTime      @default(now())
  updatedAt           DateTime      @updatedAt

  recurringExpense    RecurringExpense @relation(...)
  account             Account?         @relation(...)

  @@unique([recurringExpenseId, month, year])
}

enum ExpenseStatus { pendiente pagado }
```

---

## API Endpoints

### Plantillas — `/api/recurring-expenses`

| Método   | Path   | Descripción               |
| -------- | ------ | ------------------------- |
| `GET`    | `/`    | Listar plantillas activas |
| `GET`    | `/:id` | Obtener plantilla por ID  |
| `POST`   | `/`    | Crear nueva plantilla     |
| `PUT`    | `/:id` | Actualizar plantilla      |
| `DELETE` | `/:id` | Soft delete de plantilla  |

### Instancias mensuales — `/api/monthly-expenses`

| Método | Path       | Descripción                                       |
| ------ | ---------- | ------------------------------------------------- |
| `GET`  | `/`        | Listar instancias del mes (filtrable por mes/año) |
| `GET`  | `/:id`     | Obtener instancia                                 |
| `POST` | `/:id/pay` | Registrar pago de una instancia                   |
| `PUT`  | `/:id`     | Actualizar monto u otros datos de la instancia    |

---

## Criterios de Aceptación

- [ ] El cron genera instancias al inicio de mes para todas las plantillas activas.
- [ ] No se generan instancias duplicadas (constraint único por recurring + mes + año).
- [ ] Al pagar, se crea automáticamente una transacción de egreso en la cuenta indicada.
- [ ] El `previousAmount` se llena con el monto de la instancia del mes anterior.
- [ ] Desactivar una plantilla no afecta las instancias ya generadas.
- [ ] Las instancias solo muestran gastos de plantillas activas en el listado del mes.
- [ ] Un usuario no puede ver o modificar gastos de otro usuario.
