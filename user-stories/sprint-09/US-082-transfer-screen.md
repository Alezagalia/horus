# US-082: Pantalla de Transferencia entre Cuentas

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-082
**Título:** Pantalla de Transferencia entre Cuentas

## Descripción

Como usuario, quiero transferir dinero entre mis cuentas, para mover fondos sin perder el registro.

## Criterios de Aceptación

- [ ] Nueva pantalla `TransferScreen` con formulario:
  - Selector de cuenta origen (dropdown)
    - Mostrar saldo actual de cada cuenta
    - Filtrar solo cuentas activas con saldo > 0
  - Icono de flecha → indicando dirección
  - Selector de cuenta destino (dropdown)
    - Filtrar cuentas diferentes a origen
    - Mostrar saldo actual
  - Input de monto (número con 2 decimales)
    - Validar que no exceda saldo de cuenta origen
    - Mostrar "Saldo disponible: $X" debajo
  - Campo concepto (default: "Transferencia", editable)
  - Date picker para fecha (default: hoy)
  - Campo notas (opcional)
  - Botón "Transferir"
- [ ] Validaciones:
  - Cuenta origen ≠ cuenta destino
  - Ambas cuentas deben tener misma moneda
  - Monto > 0 y <= saldo de cuenta origen
  - Mostrar errores claros
- [ ] Integración con endpoint POST /api/transactions/transfer (US-076)
- [ ] Loading state mientras se procesa
- [ ] Toast de éxito mostrando nuevos saldos de ambas cuentas
- [ ] Navegación de vuelta a AccountsScreen

## Tareas Técnicas

- [ ] Crear pantalla TransferScreen - [1.5h]
- [ ] Implementar formulario con validaciones - [2h]
- [ ] Implementar selectores de cuenta con filtros - [1.5h]
- [ ] Implementar validación de saldo disponible - [1h]
- [ ] Implementar validación de misma moneda - [1h]
- [ ] Integrar con endpoint POST /api/transactions/transfer - [1h]
- [ ] Mostrar saldos actualizados en toast - [1h]
- [ ] Loading state y error handling - [1h]
- [ ] Tests de componente - [2.5h]

## Componentes Afectados

- **mobile:** TransferScreen, Account selectors, Form components

## Dependencias

- US-076 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
