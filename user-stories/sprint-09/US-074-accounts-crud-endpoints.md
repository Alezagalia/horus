# US-074: Endpoints CRUD de Cuentas

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-074
**Título:** Endpoints CRUD de Cuentas

## Descripción

Como usuario, quiero crear, leer, actualizar y desactivar cuentas, para gestionar mis lugares de dinero (bancos, efectivo, etc.).

## Criterios de Aceptación

- [ ] Endpoint `POST /api/accounts` crea nueva cuenta:
  - Body: name, type, currency, initialBalance, color?, icon?
  - Valida type sea uno de los 4 valores válidos
  - Valida currency sea código ISO 4217 válido
  - Set currentBalance = initialBalance al crear
  - Color e icono opcionales (defaults según tipo)
  - Devuelve cuenta creada con id
- [ ] Endpoint `GET /api/accounts` lista cuentas del usuario:
  - Devuelve solo cuentas con isActive = true
  - Ordenadas por createdAt DESC (más recientes primero)
  - Incluye conteo de transacciones por cuenta
  - Calcula y devuelve saldo total de todas las cuentas (agrupado por moneda)
- [ ] Endpoint `GET /api/accounts/:id` obtiene cuenta específica:
  - Incluye estadísticas: total ingresos, total egresos, última transacción
  - Devuelve 404 si no existe o no pertenece al usuario
- [ ] Endpoint `PUT /api/accounts/:id` actualiza cuenta:
  - Permite actualizar: name, color, icon
  - NO permite actualizar: type, currency, initialBalance (integridad)
  - Si se necesita cambiar initialBalance: recalcular currentBalance
  - Valida ownership
- [ ] Endpoint `PUT /api/accounts/:id/deactivate` desactiva cuenta (soft delete):
  - Valida que no tenga transacciones futuras pendientes
  - Set isActive = false
  - NO elimina físicamente (mantener historial)
  - Devuelve 400 si tiene transacciones (mensaje: "No se puede desactivar cuenta con transacciones. Elimínalas primero.")
- [ ] Validaciones con Zod schemas
- [ ] Response time < 200ms para GET, < 300ms para POST/PUT

## Tareas Técnicas

- [ ] Crear service `accounts.service.ts` con lógica CRUD - [2h]
- [ ] Implementar validaciones con Zod (CreateAccountSchema, UpdateAccountSchema) - [1h]
- [ ] Crear controller `accounts.controller.ts` con endpoints - [1.5h]
- [ ] Implementar lógica de conteo de transacciones - [1h]
- [ ] Implementar cálculo de saldo total por moneda - [1.5h]
- [ ] Tests unitarios del service (>80% coverage) - [2.5h]
- [ ] Tests de integración de endpoints - [2h]
- [ ] Documentación de API en Swagger - [0.5h]

## Componentes Afectados

- **backend:** Accounts service, controller, validators

## Dependencias

- US-073 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
