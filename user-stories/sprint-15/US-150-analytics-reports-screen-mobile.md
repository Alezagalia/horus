# US-150: Pantalla de Reportes (Mobile)

**Tipo:** user-story
**Prioridad:** medium
**Sprint:** 15
**Story Points:** 5
**Asignado a:** Developer 3
**Estado:** todo

---

## Descripción

**Como** usuario mobile
**Quiero** acceder a una versión condensada de mis reportes desde la app
**Para** consultar mi evolución sin necesidad de abrir la web

---

## Criterios de Aceptación

### 1. Ruta y navegación

- Nueva pantalla `ReportsScreen` registrada en el stack principal.
- Entrada en el tab bar inferior (o menú lateral según convención del proyecto, ver `apps/mobile/src/navigation/`).
- Icono: `BarChart3` (lucide-react-native) o equivalente.

### 2. Estructura

```
┌──────────────────────────────────┐
│ Reportes               [📅 30d ▼]│
├──────────────────────────────────┤
│ ▪ Overview ▪ Hábitos ▪ Finanzas │ ← Segmented control
│   Productividad                   │
├──────────────────────────────────┤
│                                  │
│    < contenido del segmento >    │
│                                  │
│  (Scroll vertical)               │
└──────────────────────────────────┘
```

- Segmented control (4 secciones; **NO** se incluye Comparativo — queda solo en web).
- Selector de rango global en header con presets (7d, 30d, 90d).

### 3. Sección "Overview"

- Lista vertical de 5 cards (Hábitos, Tareas, Finanzas, Workouts, Goals).
- Cada card: ícono + valor principal + métrica secundaria.
- Consume `GET /api/analytics/overview` (US-142).

### 4. Sección "Hábitos"

- Selector de año.
- Heatmap **mensual** (no anual; mobile no tiene ancho suficiente para 53 semanas).
  - Componente nuevo `HabitMonthHeatmap` que muestra **un mes a la vez** con swipe horizontal entre meses.
  - Grilla 7 columnas × 5-6 filas dentro de un mes.
  - Tap en día → modal con detalle (hábitos cumplidos ese día).
- Stats debajo: total año, mejor día, racha más larga.
- Consume `GET /api/analytics/habits/heatmap` (US-143) y filtra en cliente por mes mostrado.

### 5. Sección "Finanzas"

- Selector de N meses (3/6/12).
- Gráfico con **victory-native**: `VictoryStack` de áreas por categoría.
- Lista debajo: top 5 categorías con barra de progreso.
- Proyección del mes actual como card destacada arriba.
- Consume `GET /api/analytics/finance/trends` (US-144).

### 6. Sección "Productividad"

- Heatmap día × hora simplificado:
  - Grilla 7 × 8 (agrupando horas en bins de 3: 0-2, 3-5, 6-8, ..., 21-23) para que entre en pantalla.
  - Tap en celda → "Día X, franja Y horas → N tareas".
- Cards "Tu mejor día" y "Tu mejor franja horaria".
- Consume `GET /api/analytics/productivity` (US-145).

### 7. Estados

- Loading: skeletons usando `react-native-skeleton-placeholder` (o equivalente del proyecto).
- Error: card con retry.
- Empty: ícono + texto.
- Pull-to-refresh en cada sección.

### 8. Performance

- TTI < 1.5s en device de gama media (Android Pixel 4a).
- `FlatList` para overview cards si superan altura de pantalla.

### 9. API client

- Agregar funciones en `apps/mobile/src/api/analytics.api.ts`:
  - `getOverview(from, to)`
  - `getHabitsHeatmap(year)`
  - `getFinanceTrends(months)`
  - `getProductivity(from, to)`
- Hooks de React Query equivalentes en `apps/mobile/src/hooks/analytics/`.

### 10. Tests

- Detox E2E:
  - Navegar a Reports.
  - Cambiar entre 4 segmentos.
  - Cambiar rango.
  - Swipe entre meses en Hábitos.
- Snapshots de los componentes clave.

---

## Tareas Técnicas

1. **`ReportsScreen.tsx` con segmented control y selector de rango** — [2h]
2. **`HabitMonthHeatmap` con swipe entre meses** — [2.5h]
3. **Gráfico de finanzas con victory-native** — [2.5h]
4. **Heatmap de productividad con bins de 3 horas** — [2h]
5. **Cards de overview** — [1h]
6. **API client + hooks React Query** — [1.5h]
7. **Pull-to-refresh y estados** — [1h]
8. **Tests Detox E2E** — [2.5h]

---

## Definition of Done

- [ ] Pantalla accesible desde tab/menú principal
- [ ] 4 segmentos funcionales (Overview, Hábitos, Finanzas, Productividad)
- [ ] Swipe entre meses en Hábitos funciona en iOS y Android
- [ ] Estados loading/error/empty implementados
- [ ] Pull-to-refresh activo
- [ ] E2E test pasa en CI
- [ ] TTI < 1.5s en Pixel 4a
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 15h
**Bloqueada por:** US-142, US-143, US-144, US-145
