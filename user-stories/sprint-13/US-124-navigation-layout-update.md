# Technical Task #1: Actualización de Navegación y Layout

**Sprint:** 13 - Frontend Web Completo
**ID:** TECH-001
**Título:** Actualización de Navegación y Layout
**Tipo:** Infrastructure

## Descripción

Actualizar el componente Layout.tsx para activar todos los links de las nuevas funcionalidades y reorganizar el menú.

## Razón

La navegación debe reflejar todas las nuevas funcionalidades implementadas en el sprint, permitiendo a los usuarios acceder fácilmente a todas las secciones.

## Criterios de Aceptación

### 1. Mover de "Próximamente" a "Productividad"

- [ ] Categorías → /categories
- [ ] Calendario → /calendar
- [ ] Finanzas → /accounts

### 2. Agregar Nueva Sección "Finanzas" en Menú

- [ ] Cuentas → /accounts
- [ ] Gastos Recurrentes → /recurring-expenses
- [ ] Gastos del Mes → /monthly-expenses

### 3. Actualizar Rutas en App.tsx

- [ ] Agregar todas las rutas nuevas:
  - /categories
  - /calendar
  - /accounts
  - /accounts/:id
  - /recurring-expenses
  - /monthly-expenses
- [ ] Configurar ProtectedRoute para todas

### 4. Breadcrumbs (opcional)

- [ ] Agregar breadcrumbs en header de cada página
- [ ] Ejemplo: Inicio > Finanzas > Cuenta Santander
- [ ] Navegación funcional en breadcrumbs

## Tareas Técnicas

- [ ] Actualizar Layout.tsx navigation - [1h]
- [ ] Agregar sección "Finanzas" con subsecciones - [0.5h]
- [ ] Actualizar App.tsx con todas las rutas - [1h]
- [ ] Configurar ProtectedRoute - [0.5h]
- [ ] Implementar breadcrumbs (opcional) - [1.5h]
- [ ] Tests de navegación - [1h]
- [ ] Documentar estructura de navegación - [0.5h]

## Componentes Afectados

- **web:** Layout.tsx, App.tsx, Router, Navigation, Breadcrumbs

## Dependencias

- Todas las US del sprint (deben estar implementadas)

## Prioridad

high

## Esfuerzo Estimado

2 Story Points
