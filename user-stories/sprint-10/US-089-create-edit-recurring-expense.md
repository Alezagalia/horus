# US-089: Pantalla de Crear/Editar Plantilla de Gasto Recurrente (Mobile)

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-089
**Título:** Pantalla de Crear/Editar Plantilla de Gasto Recurrente (Mobile)

## Descripción

Como usuario de la app móvil, quiero poder crear o editar una plantilla de gasto recurrente, para configurar mis gastos fijos (alquiler, servicios, suscripciones).

## Criterios de Aceptación

- [ ] Pantalla `CreateRecurringExpenseScreen` implementada (reutilizable para crear y editar)
- [ ] Navegación:
  - Crear: Desde `RecurringExpensesScreen` → botón "+" → `CreateRecurringExpenseScreen`
  - Editar: Desde `RecurringExpensesScreen` → swipe right en item → `CreateRecurringExpenseScreen` (con datos precargados)
- [ ] Formulario con campos:
  - **Concepto** (input text, obligatorio, max 100 caracteres)
    - Placeholder: "Ej: Alquiler, Netflix, Gimnasio"
  - **Categoría** (selector, obligatorio)
    - Mostrar solo categorías de tipo "gastos"
    - Selector con icono y color de categoría
  - **Moneda** (selector, obligatorio, default: ARS)
    - Opciones: ARS, USD, EUR, BRL
- [ ] Botón "Guardar" (footer fijo)
- [ ] Validaciones en frontend:
  - Concepto: no vacío, max 100 caracteres
  - Categoría: seleccionada
  - Moneda: seleccionada
- [ ] Al guardar:
  - Crear: POST /api/recurring-expenses
  - Editar: PUT /api/recurring-expenses/:id
  - Mostrar loading spinner en botón
  - Si éxito: navegar de vuelta a RecurringExpensesScreen + mostrar toast "Gasto creado"
  - Si error: mostrar mensaje de error
- [ ] Formulario usa React Hook Form + Zod validation
- [ ] Keyboard-aware scroll (teclado no tapa inputs)

## Tareas Técnicas

- [ ] Crear componente CreateRecurringExpenseScreen - [2h]
- [ ] Crear formulario con React Hook Form + Zod - [1.5h]
- [ ] Crear selector de categorías (reutilizar si existe) - [1h]
- [ ] Crear selector de moneda - [0.5h]
- [ ] Integrar con API POST y PUT - [1h]
- [ ] Implementar validaciones y manejo de errores - [1h]
- [ ] Escribir tests de componente - [1h]

## Componentes Afectados

- **mobile:** CreateRecurringExpenseScreen, Form components, Category selector

## Dependencias

- US-084 (endpoints CRUD de plantillas)
- US-088 (pantalla de lista)

## Prioridad

high

## Esfuerzo Estimado

3 Story Points
