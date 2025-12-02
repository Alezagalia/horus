# US-041: Dashboard Mejorado con Estadísticas Visuales

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** US-041
**Título:** Dashboard Mejorado con Estadísticas Visuales

## Descripción

Como usuario, quiero ver un dashboard visual con mi progreso del día y tendencias, para tener una visión rápida de mi desempeño y mantenerme motivado.

## Criterios de Aceptación

- [ ] HomeScreen renovado con 3 cards principales:
  1. **Card "Hoy":**
     - Circular progress bar mostrando % de cumplimiento del día
     - Texto: "X de Y hábitos completados"
     - Color dinámico: verde (>80%), amarillo (50-80%), rojo (<50%)
  2. **Card "Mejor Racha":**
     - Muestra hábito con racha más larga activa
     - Badge: 🔥 X días
     - Tap para ir a estadísticas de ese hábito
  3. **Card "Evolución":**
     - Gráfico de barras de últimos 7 días
     - Eje X: días de la semana (L, M, M, J, V, S, D)
     - Eje Y: porcentaje de cumplimiento (0-100%)
     - Barras con color según rango
- [ ] Pull-to-refresh actualiza todas las estadísticas
- [ ] Loading states mientras carga datos del backend
- [ ] Manejo de errores si falla la carga (retry button)
- [ ] Animación smooth al entrar a la pantalla (fade-in)
- [ ] Tap en Card "Hoy" navega a HabitosDiariosScreen

## Tareas Técnicas

- [ ] Crear componente `StatsCard` reutilizable con variantes - [2h]
- [ ] Implementar `CircularProgress` con react-native-svg - [2h]
- [ ] Implementar gráfico de barras con victory-native o react-native-chart-kit - [3h]
- [ ] Integrar con endpoint GET /api/habits/stats (US-037) - [1h]
- [ ] Implementar lógica de colores dinámicos por porcentaje - [1h]
- [ ] Implementar pull-to-refresh con RefreshControl - [1h]
- [ ] Loading states y error states - [1.5h]
- [ ] Navegación al tap en cards - [0.5h]
- [ ] Tests de componentes con React Native Testing Library - [3h]
- [ ] Tests de lógica de colores y formateo de datos - [1.5h]

## Componentes Afectados

- **mobile:** HomeScreen, StatsCard, CircularProgress, BarChart

## Dependencias

- US-037 debe estar completa (endpoint de estadísticas)

## Prioridad

high

## Esfuerzo Estimado

8 Story Points
