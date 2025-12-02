# US-086: Endpoint para Marcar Gasto Mensual como Pagado

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-086
**Título:** Endpoint para Marcar Gasto Mensual como Pagado

## Descripción

Como usuario, quiero marcar un gasto mensual como pagado ingresando el monto real y la cuenta desde donde pagué, para registrar el pago y que se actualice automáticamente el saldo de mi cuenta.

## Criterios de Aceptación

- [ ] Endpoint `PUT /api/monthly-expenses/:id/pay` - Marcar gasto como pagado
  - Body: { amount, accountId, paidDate?, notes? }
  - Validaciones:
    - amount > 0 (Decimal)
    - accountId existe y pertenece al usuario
    - MonthlyExpenseInstance existe y pertenece al usuario
    - status actual es "pendiente" (no se puede pagar 2 veces)
  - Proceso ATÓMICO (usar Prisma transaction):
    1. Actualizar MonthlyExpenseInstance:
       - status = "pagado"
       - amount = amount recibido
       - accountId = accountId recibido
       - paidDate = paidDate recibido o Date.now()
       - notes = notes recibido (opcional)
    2. Crear Transaction (egreso):
       - type = "egreso"
       - accountId = accountId del pago
       - categoryId = categoryId del gasto
       - amount = amount del pago
       - concept = `{concept} - {Month} {Year}` (ej: "Alquiler - Octubre 2025")
       - date = paidDate
       - notes = notes del gasto
       - userId
    3. Actualizar saldo de Account:
       - currentBalance -= amount
       - Usar row-level locking (`FOR UPDATE`) para evitar race conditions
  - Si hay error en cualquier paso: ROLLBACK completo
  - Retornar 200 con instancia actualizada + transacción creada
- [ ] Validar que account y monthlyExpenseInstance pertenecen al mismo usuario
- [ ] Si paidDate no se provee, usar fecha actual
- [ ] Manejo de errores específicos:
  - 400: Gasto ya está pagado
  - 400: Monto inválido
  - 404: Gasto o cuenta no encontrados
  - 409: Conflicto de concurrencia (cuenta siendo modificada simultáneamente)

## Tareas Técnicas

- [ ] Crear endpoint PUT /api/monthly-expenses/:id/pay - [3h]
- [ ] Implementar transacción atómica con Prisma - [2h]
- [ ] Crear lógica de actualización de saldo con row-locking - [2h]
- [ ] Validar categoría de cuenta y gasto coinciden (opcional) - [0.5h]
- [ ] Escribir tests unitarios (casos de éxito y errores) - [2h]
- [ ] Escribir tests de concurrencia (simular pagos simultáneos) - [1.5h]

## Componentes Afectados

- **backend:** Monthly expenses service, atomic transactions, account balance updates

## Dependencias

- US-083 (modelos de base de datos)
- US-085 (endpoint de obtener instancias)
- Sprint 9 (Transaction y Account models)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
