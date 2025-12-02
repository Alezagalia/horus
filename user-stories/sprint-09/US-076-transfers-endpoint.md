# US-076: Endpoint de Transferencias entre Cuentas

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-076
**Título:** Endpoint de Transferencias entre Cuentas

## Descripción

Como usuario, quiero transferir dinero entre mis propias cuentas, para mover fondos sin perder el registro de movimiento.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/transactions/transfer` crea transferencia:
  - Body: fromAccountId, toAccountId, amount, concept, date, notes?
  - Valida ambas cuentas existen y pertenecen al usuario
  - Valida cuentas sean diferentes (no transferir a misma cuenta)
  - Valida ambas cuentas tengan misma moneda (validación simple para MVP)
  - Valida amount > 0
  - Crea 2 transacciones vinculadas en transacción atómica:
    1. Egreso en fromAccount:
       - type = 'egreso'
       - amount = monto
       - isTransfer = true
       - targetAccountId = toAccountId
       - transferPairId = ID de transacción 2
    2. Ingreso en toAccount:
       - type = 'ingreso'
       - amount = monto
       - isTransfer = true
       - targetAccountId = fromAccountId
       - transferPairId = ID de transacción 1
  - Actualiza saldos de ambas cuentas:
    - fromAccount.currentBalance -= amount
    - toAccount.currentBalance += amount
  - Devuelve ambas transacciones creadas
- [ ] Al editar transferencia (PUT /api/transactions/:id donde isTransfer = true):
  - Actualizar ambas transacciones vinculadas
  - Recalcular saldos de ambas cuentas
  - Mantener consistencia total
- [ ] Al eliminar transferencia (DELETE /api/transactions/:id donde isTransfer = true):
  - Eliminar ambas transacciones vinculadas
  - Revertir saldos de ambas cuentas
- [ ] Usar transacción Prisma para garantizar atomicidad (todo o nada)
- [ ] Si falla alguna parte, hacer rollback completo

## Tareas Técnicas

- [ ] Implementar createTransfer() en transactions.service.ts - [2.5h]
- [ ] Validar cuentas y moneda - [1h]
- [ ] Crear 2 transacciones vinculadas en transacción Prisma - [2h]
- [ ] Actualizar saldos de ambas cuentas atómicamente - [1.5h]
- [ ] Implementar updateTransfer() con sincronización de pair - [2h]
- [ ] Implementar deleteTransfer() con eliminación de pair - [1h]
- [ ] Tests unitarios de transferencias - [3h]
- [ ] Tests de integridad (rollback si falla) - [2h]
- [ ] Tests de edge cases (misma cuenta, monedas diferentes) - [1.5h]
- [ ] Documentación de API - [0.5h]

## Componentes Afectados

- **backend:** Transactions service, Atomic transactions, Transfer logic

## Dependencias

- US-075 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
