# US-084: Endpoints CRUD de Plantillas de Gastos Recurrentes

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-084
**Título:** Endpoints CRUD de Plantillas de Gastos Recurrentes

## Descripción

Como usuario, quiero poder crear, listar, editar y eliminar plantillas de gastos recurrentes, para configurar mis gastos fijos mensuales (alquiler, servicios, suscripciones).

## Criterios de Aceptación

- [ ] Endpoint `POST /api/recurring-expenses` - Crear plantilla de gasto recurrente
  - Validar campos obligatorios: concept, categoryId, currency
  - amount siempre es 0 en la plantilla
  - isActive default true
  - Categoría debe ser de tipo "gastos"
  - Validar que categoryId pertenece al usuario
  - Retorna 201 con la plantilla creada
- [ ] Endpoint `GET /api/recurring-expenses` - Listar plantillas del usuario
  - Filtro opcional: `?activeOnly=true` (default: true)
  - Ordenar por concepto alfabéticamente
  - Incluir información de categoría relacionada
  - Retorna 200 con array de plantillas
- [ ] Endpoint `GET /api/recurring-expenses/:id` - Obtener plantilla específica
  - Validar que la plantilla pertenece al usuario autenticado
  - Incluir categoría relacionada
  - Retorna 200 con la plantilla o 404 si no existe
- [ ] Endpoint `PUT /api/recurring-expenses/:id` - Editar plantilla
  - Permitir cambiar: concept, categoryId, currency
  - No permitir cambiar amount (siempre 0)
  - Validar que categoría es de tipo "gastos"
  - Retorna 200 con plantilla actualizada
- [ ] Endpoint `DELETE /api/recurring-expenses/:id` - Desactivar plantilla (soft delete)
  - Set isActive = false
  - Las instancias ya generadas NO se eliminan
  - Retorna 204 No Content
- [ ] Validaciones con Zod schemas
- [ ] Middleware authMiddleware protegiendo todos los endpoints
- [ ] Manejo de errores consistente (400, 401, 404, 500)

## Tareas Técnicas

- [ ] Crear controller `recurringExpensesController.ts` con CRUD completo - [3h]
- [ ] Crear service `recurringExpensesService.ts` con lógica de negocio - [2h]
- [ ] Definir Zod schemas para validación (createRecurringExpenseSchema, updateRecurringExpenseSchema) - [1h]
- [ ] Crear rutas en `routes/recurringExpenses.ts` - [0.5h]
- [ ] Escribir tests unitarios de endpoints - [2h]

## Componentes Afectados

- **backend:** Recurring expenses controller, service, validators, routes

## Dependencias

- US-083 (modelos de base de datos)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
