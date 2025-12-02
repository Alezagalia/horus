# US-078: Pantalla AccountsScreen con Dashboard

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-078
**Título:** Pantalla AccountsScreen con Dashboard

## Descripción

Como usuario, quiero ver mis cuentas en un dashboard con saldos y resumen financiero, para tener una visión general de mi dinero.

## Criterios de Aceptación

- [ ] Nueva pantalla `AccountsScreen` accesible desde navegación principal
- [ ] Secciones de la pantalla:
  1. **Resumen General (Header):**
     - Card con saldo total de todas las cuentas
     - Agrupado por moneda (ej: ARS $105,500 | USD $1,200)
     - Colores distintivos por moneda
  2. **Lista de Cuentas:**
     - Cards de cuentas con:
       - Icono y nombre
       - Tipo (efectivo, banco, billetera, tarjeta) con badge
       - Saldo actual con formato de moneda
       - Color de fondo según tipo
     - Ordenadas por fecha de creación (más recientes primero)
     - Tap en cuenta → navega a AccountDetailScreen
  3. **Estadísticas del Mes (Footer):**
     - Card con ingresos totales del mes (verde)
     - Card con egresos totales del mes (rojo)
     - Card con balance del mes (verde si positivo, rojo si negativo)
- [ ] FAB "+" para crear nueva cuenta
- [ ] Pull-to-refresh actualiza cuentas y estadísticas
- [ ] Loading states mientras carga datos
- [ ] Empty state si no hay cuentas ("Crea tu primera cuenta")
- [ ] Integración con endpoints:
  - GET /api/accounts (US-074)
  - GET /api/finance/stats (US-077)

## Tareas Técnicas

- [ ] Crear pantalla AccountsScreen con secciones - [2h]
- [ ] Crear componente AccountCard con variantes por tipo - [2.5h]
- [ ] Crear componente TotalBalanceCard (agrupado por moneda) - [1.5h]
- [ ] Crear componentes MonthStatsCard (ingresos/egresos/balance) - [1.5h]
- [ ] Implementar formateo de moneda por código ISO - [1h]
- [ ] Integrar con endpoints de US-074 y US-077 - [1.5h]
- [ ] Implementar navegación a AccountDetailScreen - [0.5h]
- [ ] Loading states y error handling - [1h]
- [ ] Empty state con ilustración - [0.5h]
- [ ] Tests de componente - [3h]

## Componentes Afectados

- **mobile:** AccountsScreen, AccountCard, TotalBalanceCard, MonthStatsCard

## Dependencias

- US-074 y US-077 deben estar completas

## Prioridad

high

## Esfuerzo Estimado

7 Story Points
