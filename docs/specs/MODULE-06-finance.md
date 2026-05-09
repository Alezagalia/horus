# SPEC-06: Finanzas (Cuentas y Transacciones)

**Tipo:** module
**Estado:** draft
**Dominio:** gestión financiera personal
**Dependencias:** SPEC-01 (Auth), SPEC-02 (Categorías)

---

## Objetivo

Permitir al usuario gestionar sus cuentas financieras (efectivo, banco, billetera digital, tarjeta) y registrar ingresos, egresos y transferencias entre cuentas. El saldo de cada cuenta se actualiza automáticamente con cada transacción.

## Actores

- **Usuario autenticado**: gestiona cuentas y registra movimientos.
- **Sistema**: actualiza saldos automáticamente al crear/modificar/eliminar transacciones.

---

## Reglas de Negocio

1. Los tipos de cuenta son: `efectivo`, `banco`, `billetera_digital`, `tarjeta`.
2. Cada cuenta tiene `initialBalance` (saldo inicial) y `currentBalance` (saldo en tiempo real).
3. El `currentBalance` se recalcula automáticamente al crear, modificar o eliminar transacciones.
4. Una transacción es de tipo `ingreso` o `egreso`.
5. Una **transferencia** entre cuentas genera **2 transacciones** vinculadas por `transferPairId`:
   - Egreso en la cuenta origen.
   - Ingreso en la cuenta destino.
   - Ambas tienen `isTransfer = true`.
6. No se puede eliminar una cuenta que tenga transacciones (ON DELETE RESTRICT).
7. Las cuentas usan soft delete (`isActive`).
8. El módulo de estadísticas (`/api/finance`) provee totales de ingresos/egresos y balance neto.

---

## Modelo de Datos

```prisma
model Account {
  id             String        @id @default(uuid())
  userId         String
  name           String
  type           AccountType   // efectivo | banco | billetera_digital | tarjeta
  currency       String        // ISO 4217 (ej: "MXN", "USD")
  initialBalance Float         @default(0)
  currentBalance Float         @default(0)
  color          String?
  icon           String?
  isActive       Boolean       @default(true)
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  user           User          @relation(...)
  transactions   Transaction[]
  monthlyExpenses MonthlyExpenseInstance[]
}

model Transaction {
  id             String          @id @default(uuid())
  accountId      String
  categoryId     String?
  userId         String
  type           TransactionType // ingreso | egreso
  amount         Float
  concept        String
  date           DateTime
  notes          String?
  isTransfer     Boolean         @default(false)
  targetAccountId String?        // solo para transferencias
  transferPairId  String?        // vincula las 2 transacciones de una transferencia
  createdAt      DateTime        @default(now())
  updatedAt      DateTime        @updatedAt

  account        Account         @relation(...)
  category       Category?       @relation(...)
  user           User            @relation(...)
}

enum AccountType     { efectivo banco billetera_digital tarjeta }
enum TransactionType { ingreso egreso }
```

---

## API Endpoints

### Cuentas — `/api/accounts`

| Método | Path              | Descripción                                      |
| ------ | ----------------- | ------------------------------------------------ |
| `GET`  | `/`               | Listar cuentas activas del usuario               |
| `GET`  | `/:id`            | Obtener cuenta con saldo y últimas transacciones |
| `POST` | `/`               | Crear nueva cuenta                               |
| `PUT`  | `/:id`            | Actualizar datos de la cuenta                    |
| `PUT`  | `/:id/deactivate` | Soft delete (isActive = false)                   |

### Transacciones — `/api/transactions`

| Método   | Path                 | Descripción                                                        |
| -------- | -------------------- | ------------------------------------------------------------------ |
| `GET`    | `/`                  | Listar transacciones (filtrable por cuenta, tipo, rango de fechas) |
| `GET`    | `/:id`               | Obtener transacción                                                |
| `GET`    | `/stats/by-category` | Gastos agrupados por categoría                                     |
| `POST`   | `/`                  | Crear transacción (ingreso o egreso)                               |
| `POST`   | `/transfer`          | Crear transferencia entre cuentas                                  |
| `PUT`    | `/:id`               | Actualizar transacción                                             |
| `PUT`    | `/transfer/:id`      | Actualizar transferencia (ambas transacciones del par)             |
| `DELETE` | `/:id`               | Eliminar transacción (recalcula saldo)                             |

### Estadísticas — `/api/finance`

| Método | Path     | Descripción                                   |
| ------ | -------- | --------------------------------------------- |
| `GET`  | `/stats` | Balance total, ingresos y egresos del período |

---

## Criterios de Aceptación

- [ ] Al crear un ingreso, `currentBalance` de la cuenta aumenta.
- [ ] Al crear un egreso, `currentBalance` de la cuenta disminuye.
- [ ] Al eliminar una transacción, el saldo se revierte.
- [ ] Una transferencia crea exactamente 2 transacciones con el mismo `transferPairId`.
- [ ] Actualizar una transferencia actualiza ambas transacciones del par.
- [ ] No se puede desactivar una cuenta con transacciones activas (o se advierte al usuario).
- [ ] `/stats/by-category` retorna solo egresos, agrupados por categoría con suma total.
- [ ] Un usuario no puede ver o modificar cuentas/transacciones de otro usuario.
