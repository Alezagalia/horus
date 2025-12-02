# US-075: Endpoints de Transacciones (Ingresos y Egresos)

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-075
**Título:** Endpoints de Transacciones (Ingresos y Egresos)

## Descripción

Como usuario, quiero registrar ingresos y egresos en mis cuentas, para llevar un control de mi flujo de dinero.

## Criterios de Aceptación

- [ ] Endpoint `POST /api/transactions` crea nueva transacción:
  - Body: accountId, categoryId, type, amount, concept, date, notes?
  - Valida accountId existe y pertenece al usuario
  - Valida categoryId existe y es de scope 'gastos'
  - Valida amount > 0
  - Valida date no sea más de 1 año en futuro
  - Al crear:
    - Si type = 'ingreso': currentBalance += amount
    - Si type = 'egreso': currentBalance -= amount
  - Actualiza Account.currentBalance en transacción atómica
  - Devuelve transacción creada + cuenta actualizada
- [ ] Endpoint `GET /api/transactions` lista transacciones del usuario:
  - Query params opcionales: accountId, categoryId, type, from (fecha), to (fecha)
  - Ordenadas por date DESC (más recientes primero)
  - Paginación: limit (default 50, max 100), offset
  - Incluye categoría y cuenta denormalizadas
  - Devuelve también totales: totalIngresos, totalEgresos, balance del rango
- [ ] Endpoint `GET /api/transactions/:id` obtiene transacción específica:
  - Incluye todos los detalles
  - Si es transferencia: incluye transacción vinculada (transferPair)
  - Devuelve 404 si no existe o no pertenece al usuario
- [ ] Endpoint `PUT /api/transactions/:id` actualiza transacción:
  - Permite actualizar: amount, concept, date, notes, categoryId
  - NO permite cambiar: type, accountId (integridad)
  - Al cambiar amount:
    - Revertir impacto anterior: restar/sumar amount viejo
    - Aplicar nuevo impacto: sumar/restar amount nuevo
    - Actualizar Account.currentBalance en transacción atómica
  - Valida ownership
  - Si es transferencia: actualizar también transacción vinculada (mantener consistencia)
- [ ] Endpoint `DELETE /api/transactions/:id` elimina transacción:
  - Revertir impacto en saldo:
    - Si ingreso: currentBalance -= amount
    - Si egreso: currentBalance += amount
  - Actualizar Account.currentBalance en transacción atómica
  - Si es transferencia: eliminar también transacción vinculada
  - Elimina físicamente (hard delete)
- [ ] Validaciones con Zod schemas
- [ ] Response time < 200ms para GET, < 400ms para POST/PUT/DELETE (incluye actualización de saldo)

## Tareas Técnicas

- [ ] Crear service `transactions.service.ts` con lógica CRUD - [3h]
- [ ] Implementar función updateAccountBalance(accountId, delta) - [1.5h]
- [ ] Implementar validaciones con Zod - [1.5h]
- [ ] Crear controller `transactions.controller.ts` - [2h]
- [ ] Implementar filtros (accountId, categoryId, type, rango fechas) - [2h]
- [ ] Implementar paginación - [1h]
- [ ] Implementar cálculo de totales en rango - [1.5h]
- [ ] Usar transacciones Prisma para atomicidad (crear Transaction + update Account) - [2h]
- [ ] Tests unitarios del service (>80% coverage) - [3h]
- [ ] Tests de integración de endpoints - [3h]
- [ ] Tests de integridad de saldos (crítico) - [2h]
- [ ] Documentación de API - [1h]

## Componentes Afectados

- **backend:** Transactions service, controller, validators, atomic transactions

## Dependencias

- US-074 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
