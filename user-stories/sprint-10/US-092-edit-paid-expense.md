# US-092: Pantalla de Editar Gasto Pagado (Mobile)

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-092
**Título:** Pantalla de Editar Gasto Pagado (Mobile)

## Descripción

Como usuario de la app móvil, quiero poder editar un gasto que ya marqué como pagado en caso de haberme equivocado, para corregir el monto o la cuenta sin tener que deshacerlo y volver a marcarlo.

## Criterios de Aceptación

- [ ] Navegación: Desde `MonthlyExpensesScreen` → click en gasto pagado → modal con opciones → "Editar"
- [ ] Reutilizar `PayExpenseScreen` pero en modo edición
- [ ] Pre-cargar datos del gasto pagado:
  - amount
  - accountId (cuenta seleccionada)
  - paidDate
  - notes
- [ ] Permitir editar todos los campos
- [ ] Botón "Guardar Cambios" en lugar de "Confirmar Pago"
- [ ] Al guardar:
  - PUT /api/monthly-expenses/:id
  - Mostrar loading spinner
  - Si éxito:
    - Navegar de vuelta
    - Mostrar toast "Gasto actualizado correctamente"
  - Si error: mostrar mensaje
- [ ] Opción adicional: "Deshacer pago"
  - Botón secundario (texto rojo)
  - Confirmar con alert: "¿Seguro que quieres deshacer el pago? Esto revertirá el saldo de la cuenta."
  - Si confirma: PUT /api/monthly-expenses/:id/undo
  - Si éxito: navegar de vuelta + toast "Pago deshecho. Saldo revertido."

## Tareas Técnicas

- [ ] Adaptar PayExpenseScreen para modo edición - [1.5h]
- [ ] Integrar con API PUT /api/monthly-expenses/:id - [0.5h]
- [ ] Crear botón "Deshacer pago" con confirmación - [1h]
- [ ] Integrar con API PUT /api/monthly-expenses/:id/undo - [0.5h]
- [ ] Escribir tests - [1h]

## Componentes Afectados

- **mobile:** PayExpenseScreen (modo edición), confirmation dialogs

## Dependencias

- US-087 (endpoint de editar/deshacer pago)
- US-091 (pantalla de marcar como pagado)

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
