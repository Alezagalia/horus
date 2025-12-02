# US-043: Feature de Marcado Retroactivo en Mobile

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-043
**Título:** Feature de Marcado Retroactivo en Mobile

## Descripción

Como usuario, quiero marcar hábitos de días anteriores desde la app móvil, para corregir olvidos y mantener mi historial completo.

## Criterios de Aceptación

- [ ] En `HabitosDiariosScreen`, agregar botón "Marcar día anterior" en header
- [ ] Al tap en botón, abrir bottom sheet con:
  - Selector de fecha (últimos 7 días) con react-native-calendars
  - Lista de hábitos que debían realizarse ese día
  - Checkbox/input para cada hábito (según tipo CHECK/NUMERIC)
  - Botón "Guardar" para confirmar
- [ ] Al guardar:
  - Loading indicator mientras se envían requests al backend
  - Llamar a endpoint POST /api/habits/:id/records/retroactive por cada hábito marcado
  - Mostrar toast de éxito: "Hábitos de [fecha] actualizados"
  - Cerrar bottom sheet
  - Actualizar HabitosDiariosScreen con rachas actualizadas
- [ ] Validaciones:
  - No permitir seleccionar fechas futuras
  - No permitir seleccionar más de 7 días atrás
  - Mostrar mensaje si no hay hábitos para esa fecha
- [ ] Manejo de errores:
  - Si falla algún request, mostrar error específico
  - Mostrar cuáles se guardaron y cuáles fallaron
  - Permitir reintentar

## Tareas Técnicas

- [ ] Agregar botón "Marcar día anterior" en HabitosDiariosScreen header - [0.5h]
- [ ] Crear componente `RetroactiveMarkingSheet` (bottom sheet) - [2h]
- [ ] Implementar selector de fecha con validación de rango - [1.5h]
- [ ] Cargar hábitos que debían realizarse en fecha seleccionada - [1h]
- [ ] Renderizar lista de hábitos con inputs según tipo - [1.5h]
- [ ] Integrar con endpoint POST /api/habits/:id/records/retroactive (US-040) - [1.5h]
- [ ] Implementar lógica de guardado múltiple con Promise.all - [1h]
- [ ] Manejo de errores parciales (algunos éxito, otros fallan) - [1.5h]
- [ ] Actualizar estado de rachas después de guardar - [1h]
- [ ] Tests de componente - [2h]
- [ ] Tests de lógica de guardado - [1.5h]

## Componentes Afectados

- **mobile:** HabitosDiariosScreen, RetroactiveMarkingSheet

## Dependencias

- US-040 debe estar completa (endpoint de marcado retroactivo)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
