# US-121: Página de Transferencias entre Cuentas (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-121
**Título:** Página de Transferencias entre Cuentas (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero transferir dinero entre mis cuentas, para mover fondos fácilmente desde el navegador.

## Razón

Las transferencias entre cuentas propias son una operación común (ej: mover de efectivo a banco). Esta funcionalidad simplifica el registro de estos movimientos.

## Criterios de Aceptación

### 1. Modal de Transferencia

- [ ] Accesible desde:
  - Botón "Transferir" en AccountsPage (header)
  - Botón "Transferir" en AccountDetailPage (header)
  - Botón "→" en AccountCard (hover)

### 2. Diseño Visual

- [ ] Dos cards lado a lado con flecha →
- [ ] Card Izquierda "Desde":
  - Selector de cuenta origen
  - Mostrar icono, nombre, saldo actual
  - Validar saldo > 0
- [ ] Flecha → en el medio
- [ ] Card Derecha "Hacia":
  - Selector de cuenta destino
  - Mostrar icono, nombre, saldo actual
  - Filtrar cuentas diferentes a origen

### 3. Formulario

- [ ] Input de monto:
  - Number input (2 decimales)
  - Validar que no exceda saldo origen
  - Mostrar "Saldo disponible: $XXX"
- [ ] Campo concepto:
  - Default: "Transferencia"
  - Max 200 caracteres
- [ ] Date picker (default: hoy)
- [ ] Campo notas (opcional)
- [ ] Botones: "Cancelar", "Transferir"

### 4. Validaciones

- [ ] Cuenta origen ≠ cuenta destino
- [ ] Ambas cuentas misma moneda
- [ ] Monto > 0
- [ ] Monto <= saldo origen
- [ ] Mostrar errores en tiempo real

### 5. Integración con Endpoint

- [ ] POST /api/transactions/transfer

### 6. Feedback

- [ ] Spinner mientras procesa
- [ ] Toast de éxito: "Transferencia realizada. {CuentaOrigen}: ${nuevoSaldo1} | {CuentaDestino}: ${nuevoSaldo2}"
- [ ] Error: mostrar mensaje específico

### 7. Actualización Automática

- [ ] Actualizar saldos de ambas cuentas en UI
- [ ] Actualizar lista de transacciones si está abierta
- [ ] Cerrar modal automáticamente

## Tareas Técnicas

- [ ] Crear componente TransferModal - [3h]
- [ ] Implementar diseño dos cards con flecha - [1.5h]
- [ ] Implementar selectores de cuenta con filtros - [1.5h]
- [ ] Implementar validaciones - [1.5h]
- [ ] Integrar con API - [1h]
- [ ] Implementar feedback y actualización UI - [1.5h]
- [ ] Styling - [1.5h]
- [ ] Tests de componente - [2h]
- [ ] Tests E2E - [1.5h]

## Componentes Afectados

- **web:** TransferModal, AccountsPage, AccountDetailPage

## Dependencias

- US-119 y US-120 (cuentas y transacciones)
- Sprint 9 completado (endpoint de transferencias)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
