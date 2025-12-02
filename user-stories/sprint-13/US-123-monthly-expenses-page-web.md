# US-123: Página de Gastos Mensuales (Instancias del Mes) (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-123
**Título:** Página de Gastos Mensuales (Instancias del Mes) (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero ver y gestionar los gastos recurrentes del mes actual, para marcarlos como pagados y llevar control desde el navegador.

## Razón

Ver los gastos del mes y marcarlos como pagados es el flujo principal de uso de los gastos recurrentes. Esta funcionalidad permite al usuario controlar sus gastos fijos mensuales.

## Criterios de Aceptación

### 1. Página MonthlyExpensesPage

- [ ] Accesible desde `/monthly-expenses`
- [ ] Header: "Gastos del Mes - {Mes} {Año}"
- [ ] Selector de mes/año (flechas ← →)
- [ ] Botón "Mes Actual"

### 2. Dos Secciones

#### PENDIENTES (arriba, destacada):

- [ ] Lista de gastos con status='pendiente'
- [ ] Cada item muestra:
  - Icono de categoría
  - Concepto
  - Monto: $0 (gris)
  - Referencia: "Mes anterior: $XXX"
  - Badge "Pendiente"
  - Botón "Marcar como Pagado"
- [ ] Si no hay: "🎉 No hay gastos pendientes"

#### PAGADOS (abajo, colapsable):

- [ ] Header "Pagados" con contador
- [ ] Click para expandir/colapsar
- [ ] Lista de gastos con status='pagado'
- [ ] Cada item muestra:
  - Icono de categoría
  - Concepto
  - Monto pagado (verde)
  - Fecha de pago
  - Cuenta usada
  - Badge "Pagado"
  - Botones: "Ver detalles", "Editar", "Deshacer pago"

### 3. Footer: Resumen del Mes

- [ ] Card "Total Pendiente" (estimación)
- [ ] Card "Total Pagado" (real)
- [ ] Card "Diferencia vs mes anterior"

### 4. Modal de Marcar como Pagado

- [ ] Header: "Pagar: {Concepto}"
- [ ] Información del gasto (read-only)
- [ ] Formulario:
  - Input monto (obligatorio)
  - Selector de cuenta (mostrar saldo, warning si saldo < monto)
  - Date picker (default: hoy)
  - Campo notas
- [ ] Botones: "Cancelar", "Confirmar Pago"

### 5. Modal de Editar Gasto Pagado

- [ ] Mismo formulario que marcar
- [ ] Pre-cargado con datos actuales
- [ ] Botón adicional: "Deshacer Pago" (rojo)

### 6. Confirmación de Deshacer Pago

- [ ] Dialog: "¿Deshacer pago de '{concepto}'?"
- [ ] Mostrar impacto en saldo

### 7. Integración con Endpoints

- [ ] GET /api/monthly-expenses/:month/:year
- [ ] GET /api/monthly-expenses/current
- [ ] PUT /api/monthly-expenses/:id/pay
- [ ] PUT /api/monthly-expenses/:id
- [ ] PUT /api/monthly-expenses/:id/undo

### 8. Estados

- [ ] Loading: skeleton
- [ ] Empty state
- [ ] Error state

## Tareas Técnicas

- [ ] Crear página MonthlyExpensesPage.tsx - [2h]
- [ ] Implementar selector de mes/año - [1h]
- [ ] Crear componente MonthlyExpenseCard (pendiente) - [1.5h]
- [ ] Crear componente MonthlyExpensePaidCard (pagado) - [1.5h]
- [ ] Crear sección colapsable de pagados - [1h]
- [ ] Crear footer con resumen - [1.5h]
- [ ] Crear componente PayExpenseModal - [3h]
- [ ] Crear componente EditPaidExpenseModal - [1h]
- [ ] Implementar confirmación deshacer pago - [1h]
- [ ] Integrar con API - [2.5h]
- [ ] Styling - [2.5h]
- [ ] Tests de componentes - [3h]
- [ ] Tests E2E - [2h]

## Componentes Afectados

- **web:** MonthlyExpensesPage, MonthlyExpenseCard, MonthlyExpensePaidCard, PayExpenseModal

## Dependencias

- US-122 (RecurringExpensesPage debe existir)
- Sprint 10 completado (endpoints de gastos mensuales)

## Prioridad

high

## Esfuerzo Estimado

9 Story Points
