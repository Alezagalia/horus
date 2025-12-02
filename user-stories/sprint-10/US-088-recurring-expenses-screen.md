# US-088: Pantalla de Plantillas de Gastos Recurrentes (Mobile)

**Sprint:** 10 - Gastos Recurrentes Mensuales
**ID:** US-088
**Título:** Pantalla de Plantillas de Gastos Recurrentes (Mobile)

## Descripción

Como usuario de la app móvil, quiero ver una lista de todas mis plantillas de gastos recurrentes con opciones para crear, editar y eliminar, para gestionar mis gastos fijos mensuales.

## Criterios de Aceptación

- [ ] Pantalla `RecurringExpensesScreen` implementada
- [ ] Navegación: Desde `AccountsScreen` → botón "Gastos Recurrentes" → `RecurringExpensesScreen`
- [ ] Header: "Gastos Recurrentes Mensuales"
- [ ] Lista de plantillas de gastos mostrando:
  - Icono de categoría
  - Concepto del gasto (ej: "Alquiler", "Netflix")
  - Nombre de categoría
  - Badge con moneda (ARS, USD)
  - Indicador visual si está inactivo
- [ ] Botón flotante "+" para crear nueva plantilla
- [ ] Swipe actions en cada item:
  - Swipe right: Editar (icono lápiz)
  - Swipe left: Eliminar/Desactivar (icono trash)
- [ ] Estado vacío: Si no hay plantillas, mostrar mensaje "No tienes gastos recurrentes configurados" + botón "Crear primero"
- [ ] Pull-to-refresh para recargar lista
- [ ] Loading state mientras carga datos
- [ ] Error state si falla carga de datos
- [ ] Ordenamiento alfabético por concepto
- [ ] Toggle opcional: "Mostrar inactivos" (default: ocultos)

## Tareas Técnicas

- [ ] Crear componente RecurringExpensesScreen - [2h]
- [ ] Crear componente RecurringExpenseCard (item de lista) - [1.5h]
- [ ] Integrar con API GET /api/recurring-expenses - [1h]
- [ ] Implementar swipe actions (react-native-swipeable o similar) - [1.5h]
- [ ] Implementar estados vacío, loading, error - [1h]
- [ ] Configurar navegación - [0.5h]
- [ ] Escribir tests de componente - [1.5h]

## Componentes Afectados

- **mobile:** RecurringExpensesScreen, RecurringExpenseCard, swipe actions

## Dependencias

- US-084 (endpoints CRUD de plantillas)

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
