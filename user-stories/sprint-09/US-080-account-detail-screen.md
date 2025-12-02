# US-080: Pantalla AccountDetailScreen con Transacciones

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-080
**Título:** Pantalla AccountDetailScreen con Transacciones

## Descripción

Como usuario, quiero ver el detalle de una cuenta con su historial de transacciones, para hacer seguimiento de movimientos de esa cuenta.

## Criterios de Aceptación

- [ ] Nueva pantalla `AccountDetailScreen` accesible desde tap en AccountCard
- [ ] Secciones de la pantalla:
  1. **Header:**
     - Nombre e icono de la cuenta (editable con tap)
     - Tipo y moneda
     - Saldo actual destacado (grande, centrado)
  2. **Estadísticas:**
     - Total ingresos (verde)
     - Total egresos (rojo)
     - Última transacción (fecha relativa)
  3. **Lista de Transacciones:**
     - TransactionListItem con:
       - Icono de categoría con color
       - Concepto de la transacción
       - Fecha (formato relativo: "Hoy", "Ayer", "3 días atrás")
       - Monto con signo (+ verde para ingreso, - rojo para egreso)
       - Badge "Transferencia" si isTransfer = true
     - Ordenadas por fecha DESC (más recientes primero)
     - Infinite scroll o paginación (cargar 20 por vez)
     - Tap en transacción → navega a EditTransactionScreen
  4. **Acciones:**
     - FAB "+" para agregar transacción (ingreso o egreso)
     - Botón "Transferir" en header
     - Botón "Editar cuenta" (nombre, color, icono)
- [ ] Pull-to-refresh actualiza cuenta y transacciones
- [ ] Loading states mientras carga
- [ ] Empty state si no hay transacciones ("No hay movimientos aún")
- [ ] Integración con endpoints:
  - GET /api/accounts/:id (US-074)
  - GET /api/transactions?accountId=X (US-075)

## Tareas Técnicas

- [ ] Crear pantalla AccountDetailScreen con secciones - [2h]
- [ ] Crear componente TransactionListItem con variantes - [2h]
- [ ] Implementar edición in-place de nombre de cuenta - [1h]
- [ ] Implementar infinite scroll o paginación - [1.5h]
- [ ] Implementar formateo de fechas relativas - [0.5h]
- [ ] Integrar con endpoints de US-074 y US-075 - [1.5h]
- [ ] Implementar navegación a create/edit transaction - [1h]
- [ ] Loading states y error handling - [1h]
- [ ] Empty state - [0.5h]
- [ ] Tests de componente - [3h]

## Componentes Afectados

- **mobile:** AccountDetailScreen, TransactionListItem, infinite scroll

## Dependencias

- US-074 y US-075 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
