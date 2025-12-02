# US-081: Pantalla CreateTransactionScreen (Ingreso/Egreso)

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-081
**Título:** Pantalla CreateTransactionScreen (Ingreso/Egreso)

## Descripción

Como usuario, quiero registrar ingresos y egresos en mis cuentas, para llevar control de mi flujo de dinero.

## Criterios de Aceptación

- [ ] Nueva pantalla `CreateTransactionScreen` con formulario:
  - Toggle tipo: "Ingreso" (verde) / "Egreso" (rojo)
  - Selector de cuenta (dropdown con cuentas activas)
  - Selector de categoría (solo scope 'gastos')
  - Input de monto (número con 2 decimales, teclado numérico)
  - Campo concepto (requerido, max 200 caracteres)
  - Date picker para fecha (default: hoy)
  - Campo notas (opcional, multilinea)
  - Botón "Registrar [Ingreso/Egreso]" (cambia color según tipo)
- [ ] Validaciones en tiempo real:
  - Monto > 0
  - Concepto no vacío
  - Cuenta y categoría seleccionadas
  - Mostrar errores debajo de campos
- [ ] Integración con endpoint POST /api/transactions (US-075)
- [ ] Loading state en botón mientras se guarda
- [ ] Toast de éxito mostrando nuevo saldo de cuenta
- [ ] Navegación de vuelta a AccountDetailScreen con transacción visible

## Tareas Técnicas

- [ ] Crear pantalla CreateTransactionScreen - [1.5h]
- [ ] Implementar formulario con react-hook-form + Zod validation - [2h]
- [ ] Crear toggle de tipo (ingreso/egreso) con colores - [1h]
- [ ] Implementar selector de cuenta (reutilizar componente) - [0.5h]
- [ ] Implementar selector de categoría (reutilizar del Sprint 2) - [0.5h]
- [ ] Integrar date picker - [1h]
- [ ] Integrar con endpoint POST /api/transactions - [1h]
- [ ] Mostrar saldo actualizado en toast de éxito - [1h]
- [ ] Loading state y error handling - [1h]
- [ ] Tests de componente - [2.5h]

## Componentes Afectados

- **mobile:** CreateTransactionScreen, Form components, Type toggle

## Dependencias

- US-075 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
