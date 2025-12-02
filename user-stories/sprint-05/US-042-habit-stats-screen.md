# US-042: Pantalla de Estadísticas de Hábito Individual

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-042
**Título:** Pantalla de Estadísticas de Hábito Individual

## Descripción

Como usuario, quiero ver estadísticas detalladas de un hábito específico, para analizar mi progreso y consistencia a lo largo del tiempo.

## Criterios de Aceptación

- [ ] Nueva pantalla `HabitStatsScreen` accesible desde:
  - Lista de hábitos (tap en hábito → ver estadísticas)
  - Dashboard (tap en "Mejor Racha")
- [ ] Secciones de la pantalla:
  1. **Header:**
     - Nombre del hábito con color de categoría
     - Icono de tipo (CHECK/NUMERIC)
  2. **Cards de Rachas:**
     - Racha actual con badge 🔥
     - Récord personal con badge 🏆
     - Diseño side-by-side
  3. **Tasa de Cumplimiento:**
     - Card con porcentaje general (desde creación)
     - Card con porcentaje últimos 30 días
  4. **Gráfico de Evolución (CHECK):**
     - Calendario visual de últimos 30 días
     - Días completados: verde, días pendientes: rojo, días que no aplican: gris
  5. **Gráfico de Valores (NUMERIC):**
     - Gráfico de línea con valores registrados últimos 30 días
     - Línea de objetivo (targetValue) si está definido
     - Etiquetas: valor promedio, min, max
- [ ] Loading skeleton mientras carga datos
- [ ] Pull-to-refresh actualiza estadísticas
- [ ] Manejo de errores si falla la carga

## Tareas Técnicas

- [ ] Crear pantalla `HabitStatsScreen` con secciones - [2h]
- [ ] Implementar cards de rachas con iconos y badges - [1.5h]
- [ ] Implementar calendario visual con react-native-calendars - [3h]
- [ ] Implementar gráfico de línea para valores numéricos con victory-native - [3h]
- [ ] Integrar con endpoint GET /api/habits/:id/stats (US-038) - [1h]
- [ ] Implementar loading skeleton con react-native-skeleton-placeholder - [1.5h]
- [ ] Navegación desde HabitosScreen y Dashboard - [0.5h]
- [ ] Tests de componentes - [3h]
- [ ] Tests de formateo de datos para gráficos - [1.5h]

## Componentes Afectados

- **mobile:** HabitStatsScreen, Calendar components, Charts

## Dependencias

- US-038 debe estar completa (endpoint de estadísticas de hábito)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
