# US-079: Pantalla CreateAccountScreen

**Sprint:** 09 - Cuentas + Transacciones
**ID:** US-079
**Título:** Pantalla CreateAccountScreen

## Descripción

Como usuario, quiero crear nuevas cuentas desde la app, para registrar todos mis lugares de dinero.

## Criterios de Aceptación

- [ ] Nueva pantalla `CreateAccountScreen` con formulario:
  - Campo nombre (requerido, max 100 caracteres)
  - Selector de tipo (Efectivo, Banco, Billetera Digital, Tarjeta) con iconos
  - Selector de moneda (ARS, USD, EUR, BRL - principales para MVP)
  - Input de saldo inicial (número con 2 decimales)
  - Color picker con paleta predefinida (opcional, default según tipo)
  - Emoji picker para icono (opcional, default según tipo)
  - Botón "Crear Cuenta"
- [ ] Defaults según tipo seleccionado:
  - Efectivo: 💵 verde
  - Banco: 🏦 azul
  - Billetera Digital: 📱 morado
  - Tarjeta: 💳 naranja
- [ ] Validaciones en tiempo real:
  - Nombre no vacío
  - Saldo inicial >= 0
  - Tipo y moneda seleccionados
  - Mostrar errores debajo de campos
- [ ] Integración con endpoint POST /api/accounts (US-074)
- [ ] Loading state en botón mientras se crea
- [ ] Toast de éxito después de crear
- [ ] Navegación de vuelta a AccountsScreen con nueva cuenta visible

## Tareas Técnicas

- [ ] Crear pantalla CreateAccountScreen - [1.5h]
- [ ] Implementar formulario con react-hook-form + Zod validation - [2h]
- [ ] Crear componente AccountTypePicker con iconos - [1.5h]
- [ ] Crear componente CurrencyPicker - [1h]
- [ ] Implementar color picker simple (paleta de 12 colores) - [1h]
- [ ] Implementar emoji picker o selector de iconos predefinidos - [1h]
- [ ] Integrar con endpoint POST /api/accounts - [1h]
- [ ] Loading state y error handling - [1h]
- [ ] Tests de componente - [2.5h]

## Componentes Afectados

- **mobile:** CreateAccountScreen, AccountTypePicker, CurrencyPicker, Form components

## Dependencias

- US-074 debe estar completa

## Prioridad

high

## Esfuerzo Estimado

4 Story Points
