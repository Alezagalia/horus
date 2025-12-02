# US-033: Mejorar HabitosDiariosScreen con Marcado Interactivo

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-033
**Título:** Mejorar HabitosDiariosScreen con Marcado Interactivo

## Descripción

Como usuario, quiero marcar mis hábitos del día directamente desde la pantalla principal de hábitos diarios, para registrar mi progreso de forma rápida y sin fricciones.

## Criterios de Aceptación

- [ ] **Hábitos CHECK**:
  - Checkbox grande y táctil (min 44x44pt) para marcar completado/pendiente
  - Al marcar completado: animación de check con feedback háptico
  - Estado se actualiza inmediatamente en UI (optimistic update)
- [ ] **Hábitos NUMERIC**:
  - Input para ingresar valor registrado (teclado numérico)
  - Botones +/- para incremento rápido (ej: +1 vaso de agua)
  - Barra de progreso visual mostrando valorActual/targetValue
  - Auto-completado cuando alcanza targetValue (con animación)
  - Placeholder muestra valor anterior o unidad (ej: "0/8 vasos")
- [ ] Cada tarjeta de hábito muestra:
  - Racha actual con badge visual (🔥 X días) si racha > 0
  - Color de categoría
  - Icono de tipo (CHECK o NUMERIC)
  - Estado de completitud
- [ ] Agrupación por momento del día se mantiene (mañana, tarde, noche, todo el día)
- [ ] Pull-to-refresh actualiza todos los hábitos del día
- [ ] Loading states mientras se guardan cambios en backend
- [ ] Manejo de errores con Snackbar/Toast si falla el marcado

## Tareas Técnicas

- [ ] Crear componente `HabitCheckbox` para hábitos CHECK - [1h]
- [ ] Crear componente `HabitNumericInput` para hábitos NUMERIC - [2h]
- [ ] Implementar barra de progreso con animación - [1h]
- [ ] Integrar con endpoints de marcado (US-029, US-032) - [2h]
- [ ] Implementar optimistic updates con TanStack Query - [1.5h]
- [ ] Agregar badge de racha con animación - [1h]
- [ ] Implementar feedback háptico con Haptics API - [0.5h]
- [ ] Manejo de errores y loading states - [1h]
- [ ] Tests de componentes con React Native Testing Library - [2h]

## Componentes Afectados

- **mobile:** HabitosDiariosScreen, HabitCheckbox, HabitNumericInput, HabitCard

## Dependencias

- US-029 y US-032 deben estar completas
- Componente HabitCard del Sprint 3

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
