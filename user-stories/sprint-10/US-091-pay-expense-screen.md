# US-091: Pantalla de Marcar Gasto como Pagado (Mobile)

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-091
**Título:** Pantalla de Marcar Gasto como Pagado (Mobile)

## Descripción

Como usuario de la app móvil, quiero marcar un gasto mensual como pagado ingresando el monto real y seleccionando la cuenta, para registrar el pago y que se actualice el saldo de mi cuenta automáticamente.

## Criterios de Aceptación

- [ ] Pantalla `PayExpenseScreen` implementada (puede ser modal o pantalla completa)
- [ ] Navegación: Desde `MonthlyExpensesScreen` → botón "Marcar como pagado" en gasto pendiente → `PayExpenseScreen`
- [ ] Header: "Pagar Gasto - {Concepto}"
- [ ] Información del gasto (solo lectura):
  - Concepto
  - Categoría (icono + nombre)
  - Mes y año
  - Monto del mes anterior (referencia): "Mes anterior: $50,000"
- [ ] Formulario:
  - **Monto pagado** (input numérico, obligatorio)
    - Autofocus en este campo
    - Teclado numérico decimal
    - Placeholder: previousAmount si existe, sino vacío
  - **Cuenta** (selector, obligatorio)
    - Mostrar cuentas del usuario con saldo actual
    - Selector con icono, nombre y saldo
    - Validar que cuenta tiene saldo suficiente (warning si saldo < monto, pero permitir continuar)
  - **Fecha de pago** (date picker, opcional, default: hoy)
  - **Notas** (textarea, opcional)
    - Placeholder: "Ej: Pagado por transferencia"
- [ ] Botón "Confirmar Pago" (footer fijo)
- [ ] Validaciones:
  - Monto > 0
  - Cuenta seleccionada
- [ ] Al confirmar:
  - PUT /api/monthly-expenses/:id/pay
  - Mostrar loading spinner
  - Si éxito:
    - Navegar de vuelta a MonthlyExpensesScreen
    - Mostrar toast "Gasto pagado correctamente. Saldo actualizado."
  - Si error: mostrar mensaje de error
- [ ] Botón "Cancelar" para cerrar sin guardar
- [ ] Formulario usa React Hook Form + Zod validation

## Tareas Técnicas

- [ ] Crear componente PayExpenseScreen (modal o pantalla) - [2h]
- [ ] Crear formulario con React Hook Form + Zod - [1.5h]
- [ ] Crear selector de cuentas (reutilizar si existe, sino crear) - [1h]
- [ ] Integrar con API PUT /api/monthly-expenses/:id/pay - [1h]
- [ ] Implementar validaciones y warning de saldo insuficiente - [1h]
- [ ] Implementar date picker - [0.5h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **mobile:** PayExpenseScreen, Form components, Account selector

## Dependencias

- US-086 (endpoint de marcar como pagado)
- US-090 (pantalla de gastos mensuales)

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
