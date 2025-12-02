# US-090: Pantalla de Gastos Mensuales (Instancias del Mes) (Mobile)

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-090
**Título:** Pantalla de Gastos Mensuales (Instancias del Mes) (Mobile)

## Descripción

Como usuario de la app móvil, quiero ver todos los gastos recurrentes del mes actual separados por pendientes y pagados, para saber qué gastos fijos me faltan pagar este mes.

## Criterios de Aceptación

- [ ] Pantalla `MonthlyExpensesScreen` implementada
- [ ] Navegación: Desde `AccountsScreen` → botón "Gastos del Mes" → `MonthlyExpensesScreen`
- [ ] Header: "Gastos Mensuales - {Mes} {Año}"
- [ ] Selector de mes/año (arrows ← →) para navegar entre meses
- [ ] Dos secciones:
  1. **PENDIENTES** (arriba):
     - Lista de gastos con status = "pendiente"
     - Cada item muestra:
       - Icono de categoría
       - Concepto del gasto
       - amount = $0 (texto gris)
       - previousAmount (referencia del mes anterior)
       - Badge "Pendiente" (amarillo)
     - Botón "Marcar como pagado" en cada item
     - Si no hay: mensaje "No hay gastos pendientes 🎉"
  2. **PAGADOS** (abajo, colapsable):
     - Lista de gastos con status = "pagado"
     - Cada item muestra:
       - Icono de categoría
       - Concepto del gasto
       - amount pagado (texto verde)
       - Fecha de pago
       - Cuenta desde donde se pagó
       - Badge "Pagado" (verde)
     - Click en item: ver detalles (modal o nueva pantalla)
     - Si no hay: mensaje "No has pagado ningún gasto aún"
- [ ] Footer: Resumen del mes:
  - Total pendiente: suma de previousAmount de pendientes (estimación)
  - Total pagado: suma de amount de pagados
  - Diferencia vs mes anterior
- [ ] Pull-to-refresh
- [ ] Loading y error states

## Tareas Técnicas

- [ ] Crear componente MonthlyExpensesScreen - [2.5h]
- [ ] Crear selector de mes/año con flechas - [1h]
- [ ] Crear componente MonthlyExpenseCard (item de lista) - [1.5h]
- [ ] Integrar con API GET /api/monthly-expenses/:month/:year - [1h]
- [ ] Implementar lógica de separación pendientes/pagados - [0.5h]
- [ ] Crear footer con resumen (totales) - [1h]
- [ ] Implementar sección colapsable de pagados - [0.5h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **mobile:** MonthlyExpensesScreen, MonthlyExpenseCard, Month selector

## Dependencias

- US-085 (endpoint de instancias mensuales)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
