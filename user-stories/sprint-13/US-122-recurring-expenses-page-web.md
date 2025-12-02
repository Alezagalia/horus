# US-122: Página de Gastos Recurrentes (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-122
**Título:** Página de Gastos Recurrentes (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero gestionar mis plantillas de gastos recurrentes mensuales, para configurar mis gastos fijos desde el navegador.

## Razón

Los gastos recurrentes (alquiler, servicios, suscripciones) son un patrón común. Configurarlos como plantillas evita tener que ingresarlos manualmente cada mes.

## Criterios de Aceptación

### 1. Página RecurringExpensesPage

- [ ] Accesible desde `/recurring-expenses`
- [ ] Header: "Gastos Recurrentes Mensuales" con botón "Nueva Plantilla"
- [ ] Descripción: "Configura tus gastos fijos mensuales. Se generarán automáticamente cada mes."

### 2. Lista de Plantillas

- [ ] Cards mostrando:
  - Icono de categoría
  - Concepto del gasto
  - Categoría (nombre)
  - Moneda (badge)
  - Estado: "Activa" (verde) / "Inactiva" (gris)
- [ ] Ordenadas alfabéticamente
- [ ] Hover: "Editar", "Desactivar/Activar"

### 3. Modal de Nueva Plantilla

- [ ] Campo concepto (obligatorio, max 100)
- [ ] Selector de categoría (scope 'gastos')
- [ ] Selector de moneda (ARS, USD, EUR, BRL)
- [ ] Nota: "El monto se ingresará cada mes al pagar el gasto"
- [ ] Botones: "Cancelar", "Crear"

### 4. Modal de Editar Plantilla

- [ ] Mismo formulario
- [ ] Permite editar: concepto, categoría, moneda
- [ ] Nota: "Editar NO afectará instancias ya generadas"

### 5. Toggle Activar/Desactivar

- [ ] Click en "Desactivar" → confirmar
- [ ] Click en "Activar" → sin confirmación

### 6. Integración con Endpoints

- [ ] GET /api/recurring-expenses
- [ ] POST /api/recurring-expenses
- [ ] PUT /api/recurring-expenses/:id
- [ ] DELETE /api/recurring-expenses/:id (soft delete)

### 7. Filtro

- [ ] Toggle "Mostrar inactivas" (default: ocultas)

### 8. Estados

- [ ] Loading: skeleton
- [ ] Empty state
- [ ] Error state

## Tareas Técnicas

- [ ] Crear página RecurringExpensesPage.tsx - [2h]
- [ ] Crear componente RecurringExpenseCard - [1.5h]
- [ ] Crear componente RecurringExpenseFormModal - [2.5h]
- [ ] Implementar toggle activar/desactivar - [1h]
- [ ] Integrar con API - [2h]
- [ ] Implementar filtro de inactivos - [1h]
- [ ] Styling - [2h]
- [ ] Tests de componentes - [2.5h]
- [ ] Tests E2E - [1.5h]

## Componentes Afectados

- **web:** RecurringExpensesPage, RecurringExpenseCard, RecurringExpenseFormModal

## Dependencias

- Sprint 10 completado (endpoints de gastos recurrentes)
- TanStack Query configurado

## Prioridad

high

## Esfuerzo Estimado

7 Story Points
