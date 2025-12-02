# US-119: Página de Cuentas y Dashboard Financiero (Web)

**Sprint:** 13 - Frontend Web Completo
**ID:** US-119
**Título:** Página de Cuentas y Dashboard Financiero (Web)
**Tipo:** Frontend Web

## Descripción

Como usuario web, quiero ver un dashboard de mis cuentas financieras y crear/editar cuentas, para gestionar mi dinero desde el navegador.

## Razón

La gestión financiera es un módulo clave de Horus. Los usuarios web necesitan poder ver sus cuentas, saldos y crear nuevas cuentas sin depender de la app móvil.

## Criterios de Aceptación

### 1. Página AccountsPage

- [ ] Accesible desde `/accounts`
- [ ] Header: "Finanzas" con botón "Nueva Cuenta"

### 2. Sección 1: Resumen General

- [ ] Card grande mostrando "Saldo Total"
- [ ] Agrupado por moneda:
  - ARS: $XXX,XXX
  - USD: $XXX,XXX
  - EUR: €XXX
- [ ] Colores distintivos por moneda
- [ ] Icono de cada moneda

### 3. Sección 2: Lista de Cuentas

- [ ] Cards de cuentas mostrando:
  - Icono del tipo (efectivo 💵, banco 🏦, billetera 📱, tarjeta 💳)
  - Nombre de la cuenta
  - Tipo (badge)
  - Saldo actual (grande, destacado)
  - Moneda
  - Color de fondo según tipo
- [ ] Grid responsive: 3 col desktop, 2 tablet, 1 mobile
- [ ] Click en cuenta → navega a `/accounts/:id`
- [ ] Hover: botones "Editar" y "Desactivar"

### 4. Sección 3: Estadísticas del Mes

- [ ] 3 Cards:
  - "Ingresos del Mes" (verde)
  - "Egresos del Mes" (rojo)
  - "Balance" (verde/rojo según signo)
- [ ] Iconos distintivos

### 5. Modal de Crear Cuenta

- [ ] Campo nombre (obligatorio, max 100)
- [ ] Selector de tipo (radio/dropdown):
  - Efectivo, Banco, Billetera Digital, Tarjeta
- [ ] Selector de moneda (ARS, USD, EUR, BRL)
- [ ] Input saldo inicial (default 0)
- [ ] Color picker (opcional)
- [ ] Emoji picker (opcional)
- [ ] Botones: "Cancelar", "Crear Cuenta"

### 6. Modal de Editar Cuenta

- [ ] Mismo formulario pero:
  - Tipo NO editable
  - Moneda NO editable
  - Saldo inicial NO editable
- [ ] Permite editar: nombre, color, icono

### 7. Confirmación de Desactivar

- [ ] Dialog: "¿Desactivar '{nombre}'?"
- [ ] Validar que no tenga transacciones futuras

### 8. Integración con Endpoints

- [ ] GET /api/accounts
- [ ] GET /api/finance/stats?month={MM}&year={YYYY}
- [ ] POST /api/accounts
- [ ] PUT /api/accounts/:id
- [ ] PUT /api/accounts/:id/deactivate

### 9. Formateo de Moneda

- [ ] Usar Intl.NumberFormat
- [ ] ARS: $ 1.234,56
- [ ] USD: US$ 1,234.56
- [ ] EUR: € 1.234,56

### 10. Estados

- [ ] Loading: skeleton de cards
- [ ] Empty state
- [ ] Error state

### 11. Actualizar Layout

- [ ] Mover "Finanzas" de "Próximamente" a "Productividad"
- [ ] Activar link `/accounts`

## Tareas Técnicas

- [ ] Crear página AccountsPage.tsx - [2h]
- [ ] Crear componente TotalBalanceCard - [1.5h]
- [ ] Crear componente AccountCard - [2h]
- [ ] Crear componente MonthStatsCards - [2h]
- [ ] Crear componente AccountFormModal - [3h]
- [ ] Implementar formateo de moneda - [1h]
- [ ] Implementar selector de tipo - [1h]
- [ ] Integrar con API - [2.5h]
- [ ] Implementar confirmación desactivar - [1h]
- [ ] Styling responsive - [2.5h]
- [ ] Tests de componentes - [3h]
- [ ] Tests E2E - [2h]
- [ ] Actualizar Layout.tsx - [0.5h]

## Componentes Afectados

- **web:** AccountsPage, AccountCard, TotalBalanceCard, MonthStatsCards, AccountFormModal

## Dependencias

- Sprint 9 completado (endpoints de cuentas)
- TanStack Query configurado

## Prioridad

high

## Esfuerzo Estimado

10 Story Points
