# US-023: Formulario de Crear/Editar Hábito (Mobile)

**Sprint:** 03 - Habits CRUD (Backend + Mobile)
**ID:** US-023
**Título:** Formulario de Crear/Editar Hábito (Mobile)

## Descripción

Como usuario, quiero crear y editar hábitos personalizados para adaptarlos a mis necesidades específicas.

## Criterios de Aceptación

- [ ] Screen HabitFormScreen (full screen, no modal)
- [ ] Header: "Nuevo Hábito" o "Editar Hábito" con botón "Guardar"
- [ ] Campo nombre (text input, obligatorio, max 100 caracteres)
- [ ] Campo descripción (textarea, opcional)
- [ ] Selector de categoría (muestra categorías de scope 'habitos')
- [ ] Selector de tipo: CHECK (checkbox simple) / NUMERIC (meta numérica)
- [ ] Si NUMERIC: campos targetValue (number) y unit (texto, ej: "vasos", "km")
- [ ] Selector de periodicidad: Diario, Semanal, Mensual, Personalizado
- [ ] Si Semanal: checkboxes de días (L M X J V S D)
- [ ] Si Personalizado: "Cada X días" (number input)
- [ ] Selector de momento del día: Mañana, Tarde, Noche, Cualquier momento
- [ ] Time picker para recordatorio (opcional)
- [ ] Color picker (opcional, default de categoría)
- [ ] Validaciones frontend
- [ ] Preview del hábito en tiempo real
- [ ] Loading state durante guardado
- [ ] Toast de éxito al guardar
- [ ] Navegación a HabitsListScreen después de guardar

## Tareas Técnicas

- [ ] Crear HabitFormScreen - [4h]
- [ ] Implementar selector de tipo - [1h]
- [ ] Implementar selector de periodicidad - [2h]
- [ ] Implementar checkboxes de días - [1h]
- [ ] Implementar time picker - [1.5h]
- [ ] Validaciones frontend - [1.5h]
- [ ] Preview del hábito - [1.5h]
- [ ] Integrar con POST/PUT /api/habits - [1.5h]
- [ ] Tests - [2h]

## Componentes Afectados

- **mobile:** HabitFormScreen, TypeSelector, PeriodicitySelector, TimePicker

## Dependencias

- US-022 (HabitsListScreen)

## Prioridad

critical

## Esfuerzo Estimado

10 Story Points
