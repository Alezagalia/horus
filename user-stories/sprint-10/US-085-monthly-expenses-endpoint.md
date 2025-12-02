# US-085: Endpoint para Obtener Instancias Mensuales de Gastos

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-085
**Título:** Endpoint para Obtener Instancias Mensuales de Gastos

## Descripción

Como usuario, quiero ver los gastos recurrentes del mes actual con su estado (pendiente/pagado), para saber cuáles gastos fijos debo pagar este mes.

## Criterios de Aceptación

- [ ] Endpoint `GET /api/monthly-expenses/:month/:year` - Obtener instancias del mes específico
  - month: 1-12
  - year: YYYY (ej: 2025)
  - Validar formato de parámetros
  - Retornar solo instancias del usuario autenticado
  - Ordenar por status (pendientes primero) y luego por concepto
  - Incluir información de:
    - RecurringExpense relacionado
    - Category relacionada
    - Account (si ya fue pagado)
  - Retorna 200 con array de instancias
- [ ] Endpoint `GET /api/monthly-expenses/current` - Obtener instancias del mes actual (shortcut)
  - Calcula automáticamente mes y año actuales
  - Misma lógica que endpoint anterior
- [ ] Respuesta incluye:
  - id, recurringExpenseId, concept, categoryId, categoryName, categoryIcon, categoryColor
  - month, year, amount, previousAmount
  - status, paidDate, accountId, accountName (si pagado)
  - notes
- [ ] Filtro opcional `?status=pendiente|pagado` para filtrar por estado
- [ ] Si no hay instancias del mes, retornar array vacío (no error)

## Tareas Técnicas

- [ ] Crear endpoint GET /api/monthly-expenses/:month/:year - [2h]
- [ ] Crear endpoint GET /api/monthly-expenses/current - [0.5h]
- [ ] Implementar lógica de query con includes (category, account, recurringExpense) - [1h]
- [ ] Agregar validaciones de parámetros (month 1-12, year válido) - [0.5h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **backend:** Monthly expenses controller, service, validators

## Dependencias

- US-083 (modelos de base de datos)

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
