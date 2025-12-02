# US-024: Eliminar Hábito

**Sprint:** 03 - Habits CRUD (Backend + Mobile)
**ID:** US-024
**Título:** Eliminar Hábito

## Descripción

Como usuario, quiero poder eliminar hábitos que ya no quiero seguir para mantener mi lista limpia.

## Criterios de Aceptación

- [ ] Botón "Eliminar" en HabitDetailScreen o swipe action en HabitCard
- [ ] Alert de confirmación: "¿Eliminar '{nombre}'? Se mantendrá el historial pero no aparecerá en tu lista."
- [ ] Soft delete (isActive = false)
- [ ] Toast de éxito: "Hábito eliminado"
- [ ] Hábito desaparece de la lista
- [ ] Opción "Deshacer" en toast (durante 5 segundos)

## Tareas Técnicas

- [ ] Botón/swipe eliminar - [1h]
- [ ] Alert de confirmación - [1h]
- [ ] Integrar con DELETE /api/habits/:id - [1h]
- [ ] Soft delete backend - [0.5h]
- [ ] Toast con "Deshacer" - [1.5h]
- [ ] Tests - [1h]

## Componentes Afectados

- **mobile:** HabitDetailScreen, HabitCard, Alert, Toast

## Dependencias

- US-022 y US-023

## Prioridad

medium

## Esfuerzo Estimado

4 Story Points
