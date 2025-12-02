# US-140: Actualización de Navegación y Menú

**Tipo:** technical-task
**Prioridad:** high
**Sprint:** 14
**Story Points:** 1
**Asignado a:** Developer 1
**Estado:** todo

---

## Descripción

Agregar el módulo de Ejercicios/Fitness al menú de navegación de Mobile y Web para que los usuarios puedan acceder a las nuevas funcionalidades.

---

## Tareas

### Mobile (React Native)

**Layout/Navigation.tsx:**

```typescript
const fitnessRoutes = [
  { name: 'Ejercicios', path: '/exercises', icon: '💪' },
  { name: 'Rutinas', path: '/routines', icon: '📋' },
  { name: 'Entrenar', path: '/train', icon: '🏋️' },
  { name: 'Historial', path: '/workouts', icon: '📊' },
  { name: 'Estadísticas', path: '/stats', icon: '📈' },
];
```

- [x] Agregar sección "Fitness" en el menú principal
- [x] Iconos consistentes con el design system
- [x] Links activos a todas las pantallas nuevas

### Web (React)

**components/Layout.tsx:**

```typescript
const sidebarSections = [
  ...existingSections,
  {
    title: 'Fitness',
    items: [
      { label: 'Ejercicios', path: '/exercises', icon: FitnessCenterIcon },
      { label: 'Rutinas', path: '/routines', icon: ListAltIcon },
      { label: 'Entrenar', path: '/train', icon: PlayArrowIcon },
      { label: 'Historial', path: '/workouts', icon: HistoryIcon },
      { label: 'Estadísticas', path: '/stats', icon: AssessmentIcon },
    ],
  },
];
```

- [x] Agregar sección "Fitness" en sidebar
- [x] Iconos de Material-UI o librería usada

### Rutas

**App.tsx / Routes.tsx:**

```typescript
<Route path="/exercises" element={<ProtectedRoute><ExercisesScreen /></ProtectedRoute>} />
<Route path="/routines" element={<ProtectedRoute><RoutinesScreen /></ProtectedRoute>} />
<Route path="/routines/:id" element={<ProtectedRoute><RoutineDetailScreen /></ProtectedRoute>} />
<Route path="/train/:routineId" element={<ProtectedRoute><ExecuteRoutineScreen /></ProtectedRoute>} />
<Route path="/workouts" element={<ProtectedRoute><WorkoutHistoryScreen /></ProtectedRoute>} />
<Route path="/workouts/:id" element={<ProtectedRoute><WorkoutDetailScreen /></ProtectedRoute>} />
<Route path="/stats" element={<ProtectedRoute><StatsScreen /></ProtectedRoute>} />
```

- [x] Configurar todas las rutas nuevas
- [x] ProtectedRoute para autenticación
- [x] Navegación programática funciona

### Breadcrumbs (opcional)

- [x] Agregar breadcrumbs en headers
- [x] Ejemplo: Inicio > Fitness > Rutina Push Day > Ejecutar

---

## Criterios de Aceptación

- [x] Menú mobile muestra sección "Fitness" con 5 items
- [x] Sidebar web muestra sección "Fitness" con 5 items
- [x] Todos los links funcionan y navegan correctamente
- [x] Rutas protegidas (requieren login)
- [x] Iconos consistentes con design system
- [x] Active state en item seleccionado

---

## Tareas Técnicas

1. **Actualizar Layout Mobile** - [0.5h]
   - Agregar sección en drawer/bottom navigation
2. **Actualizar Layout Web** - [0.5h]
   - Agregar sección en sidebar
3. **Configurar rutas Mobile** - [0.5h]
   - React Navigation stack
4. **Configurar rutas Web** - [0.5h]
   - React Router
5. **Iconos** - [0.5h]
   - Seleccionar y aplicar iconos consistentes
6. **Testing** - [0.5h]
   - Validar navegación funciona

---

## Definition of Done

- [x] Navegación funciona en mobile y web
- [x] Links activos y accesibles
- [x] Rutas protegidas con autenticación
- [x] Iconos aplicados
- [x] Active state funciona
- [x] Code review aprobado
- [x] Deploy a staging

---

**Estimación:** 1 SP | 3h
**Última actualización:** 2025-10-22
