# US-120: Página de Gestión de Transacciones (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-120
**Título:** Página de Gestión de Transacciones (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero ver y gestionar mis transacciones (ingresos y egresos), para llevar control de mi flujo de dinero desde el navegador.

## Razón

Las transacciones son el corazón del módulo financiero. Los usuarios necesitan registrar y visualizar sus movimientos de dinero de forma rápida y clara.

## Criterios de Aceptación

### 1. Página AccountDetailPage

- [ ] Accesible desde `/accounts/:id`
- [ ] Header:
  - Nombre de cuenta (editable inline)
  - Icono y tipo
  - Saldo actual (grande)
  - Moneda
  - Botones: "Nueva Transacción", "Transferir", "← Volver"

### 2. Tabs

- [ ] Tab "Todas" (default)
- [ ] Tab "Ingresos" (type=ingreso)
- [ ] Tab "Egresos" (type=egreso)
- [ ] Tab "Transferencias" (isTransfer=true)

### 3. Lista de Transacciones

- [ ] Tabla/Lista mostrando:
  - Fecha (DD MMM YYYY)
  - Categoría (icono + nombre)
  - Concepto
  - Monto (+ verde ingresos, - rojo egresos)
  - Badge "Transferencia" si aplica
- [ ] Ordenadas por fecha DESC
- [ ] Paginación: 50 por página
- [ ] Click en transacción → modal de editar
- [ ] Hover: "Editar", "Eliminar"

### 4. Filtros

- [ ] Rango de fechas
- [ ] Categoría (multiselect)
- [ ] Tipo
- [ ] Botón "Limpiar filtros"

### 5. Modal de Nueva Transacción

- [ ] Toggle tipo: "Ingreso" / "Egreso"
- [ ] Selector de cuenta (pre-seleccionada)
- [ ] Selector de categoría (scope 'gastos')
- [ ] Input monto (2 decimales, obligatorio)
- [ ] Campo concepto (obligatorio, max 200)
- [ ] Date picker (default: hoy)
- [ ] Campo notas (opcional)
- [ ] Botones: "Cancelar", "Guardar"

### 6. Modal de Editar Transacción

- [ ] Mismo formulario pero:
  - Tipo NO editable
  - Cuenta NO editable
- [ ] Permite editar: monto, categoría, concepto, fecha, notas
- [ ] Si es transferencia: advertencia

### 7. Confirmación de Eliminación

- [ ] Dialog: "¿Eliminar transacción de {monto}?"
- [ ] Si es transferencia: advertencia
- [ ] Mostrar impacto en saldo

### 8. Integración con Endpoints

- [ ] GET /api/transactions?accountId={id}&from={date}&to={date}
- [ ] POST /api/transactions
- [ ] PUT /api/transactions/:id
- [ ] DELETE /api/transactions/:id

### 9. Actualización Optimista

- [ ] Al crear/editar/eliminar: actualizar UI inmediatamente
- [ ] Revertir si falla request
- [ ] Mostrar saldo actualizado

### 10. Estados

- [ ] Loading: skeleton
- [ ] Empty state
- [ ] Error state

## Tareas Técnicas

- [ ] Crear página AccountDetailPage.tsx - [2h]
- [ ] Crear componente TransactionList - [2.5h]
- [ ] Crear componente TransactionItem - [1.5h]
- [ ] Crear componente TransactionFormModal - [3.5h]
- [ ] Implementar tabs y filtros - [2h]
- [ ] Implementar paginación - [2h]
- [ ] Implementar edición inline nombre - [1h]
- [ ] Integrar con API - [2.5h]
- [ ] Implementar actualización optimista - [2h]
- [ ] Implementar confirmación eliminación - [1h]
- [ ] Styling - [2.5h]
- [ ] Tests de componentes - [3h]
- [ ] Tests E2E - [2h]

## Componentes Afectados

- **web:** AccountDetailPage, TransactionList, TransactionItem, TransactionFormModal

## Dependencias

- US-119 (AccountsPage debe existir)
- Sprint 9 completado (endpoints de transacciones)

## Prioridad

high

## Esfuerzo Estimado

10 Story Points
