# US-087: Endpoint para Editar/Deshacer Pago de Gasto Mensual

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-087
**Título:** Endpoint para Editar/Deshacer Pago de Gasto Mensual

## Descripción

Como usuario, quiero poder editar un gasto que ya marqué como pagado (monto o cuenta) en caso de error, para corregir información sin tener que borrarlo y crearlo de nuevo.

## Criterios de Aceptación

- [ ] Endpoint `PUT /api/monthly-expenses/:id` - Editar instancia de gasto
  - Body: { amount?, accountId?, paidDate?, notes?, status? }
  - Solo se puede editar si status actual es "pagado"
  - Permitir cambiar: amount, accountId, paidDate, notes
  - Si se cambia amount o accountId: proceso ATÓMICO:
    1. Buscar Transaction asociada (concepto coincide + fecha coincide + account coincide)
    2. Si se encuentra:
       - Revertir saldo de cuenta original: `currentBalance += transactionAmount`
       - Eliminar Transaction vieja
    3. Crear nueva Transaction con datos actualizados
    4. Actualizar saldo de cuenta nueva: `currentBalance -= newAmount`
    5. Actualizar MonthlyExpenseInstance con nuevos valores
  - Si solo se cambia notes: actualizar directamente sin afectar Transaction
  - Retornar 200 con instancia actualizada
- [ ] Endpoint `PUT /api/monthly-expenses/:id/undo` - Deshacer pago
  - Cambiar status de "pagado" a "pendiente"
  - Revertir saldo de cuenta: `currentBalance += amount`
  - Eliminar Transaction asociada
  - Limpiar campos: accountId = null, paidDate = null, amount = 0
  - Mantener notes (opcional)
  - Retornar 200 con instancia actualizada
- [ ] Validaciones:
  - Solo se puede editar/deshacer si status = "pagado"
  - accountId debe existir y pertenecer al usuario
  - Transacción atómica para evitar inconsistencias

## Tareas Técnicas

- [ ] Crear endpoint PUT /api/monthly-expenses/:id (actualización) - [2.5h]
- [ ] Crear endpoint PUT /api/monthly-expenses/:id/undo - [1.5h]
- [ ] Implementar lógica de reversión de saldo y eliminación de Transaction - [2h]
- [ ] Implementar búsqueda de Transaction asociada - [1h]
- [ ] Escribir tests (casos de éxito y errores, rollback) - [2h]

## Componentes Afectados

- **backend:** Monthly expenses service, transaction reversal logic

## Dependencias

- US-086 (marcar como pagado)

## Prioridad

medium

## Esfuerzo Estimado

5 Story Points
