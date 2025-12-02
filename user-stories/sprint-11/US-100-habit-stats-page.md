# US-100: Página de Estadísticas de Hábito Individual

**Sprint:** 11 - Frontend Web Base
**ID:** US-100
**Título:** Página de Estadísticas de Hábito Individual

## Descripción

Como usuario web, quiero ver las estadísticas detalladas de un hábito específico, para analizar mi progreso y motivarme a mantener la racha.

## Criterios de Aceptación

- [ ] Página `HabitStatsPage` (`/habits/:id/stats`) implementada
- [ ] Header de página:
  - Nombre del hábito (grande)
  - Icono y color de categoría
  - Botón "Volver" → /habits
- [ ] Sección "Rachas":
  - Card "Racha Actual": número grande con 🔥 emoji
  - Card "Récord Personal": número grande con 🏆 emoji
  - Comparación visual: barra de progreso racha actual vs récord
- [ ] Sección "Tasa de Cumplimiento":
  - Porcentaje general (desde creación)
  - Porcentaje últimos 30 días
  - Porcentaje últimos 7 días
  - Progress bars visuales
- [ ] Sección "Evolución":
  - Gráfico de barras: últimos 30 días
    - Eje X: fechas
    - Eje Y: completado (verde) o no (gris)
    - Librería: Recharts
  - Para hábitos NUMERIC: gráfico de línea con valores
- [ ] Sección "Calendario":
  - Vista de calendario mensual con indicadores visuales
  - Días completados: círculo verde
  - Días no completados: círculo rojo
  - Días sin hábito programado: vacío
  - Click en día: tooltip con detalles
- [ ] Loading state mientras carga estadísticas
- [ ] Integración con GET /api/habits/:id/stats

## Tareas Técnicas

- [ ] Crear página HabitStatsPage - [1h]
- [ ] Implementar sección de rachas - [0.5h]
- [ ] Implementar sección de tasa de cumplimiento - [0.5h]
- [ ] Implementar gráfico de evolución (Recharts) - [2h]
- [ ] Implementar calendario con indicadores - [1.5h]
- [ ] Integrar con API usando TanStack Query - [1h]
- [ ] Estilos y responsive - [1h]
- [ ] Escribir tests - [1.5h]

## Componentes Afectados

- **web:** HabitStatsPage, charts, calendar components

## Dependencias

- US-099 (página de lista de hábitos con navegación)
- Backend endpoints de estadísticas (Sprint 5)

## Prioridad

medium

## Esfuerzo Estimado

4 Story Points
