# US-147: Página de Reportes en Web

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 6
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** una página dedicada de reportes con secciones por dominio
**Para** explorar y analizar mis datos sin saltar entre páginas

---

## Criterios de Aceptación

### 1. Ruta y navegación

- Nueva ruta `/reports` registrada en `AppRouter`.
- Entrada en el sidebar lateral, debajo de "Dashboard", con icono `BarChart3` (lucide-react).
- Atajo de teclado: `g` luego `r` (siguiendo convención de US-103 keyboard-shortcuts).

### 2. Layout de la página

```
┌──────────────────────────────────────────────────────────────┐
│ Reportes                                  [📅 Rango: 30d ▼] │
├──────────────────────────────────────────────────────────────┤
│ [Overview] [Hábitos] [Finanzas] [Productividad]              │
│ [Comparativo] [Fitness]                                       │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│            < contenido del tab seleccionado >                │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

- Selector de rango global: presets (7d, 30d, 90d, este mes, este año) + custom date picker.
- El rango aplica a Overview, Productividad y Comparativo. Hábitos usa selector de **año** independiente. Finanzas usa selector de **N meses** independiente. Fitness redirige a la página existente de stats de workouts (US-131) o embed simple del overview.

### 3. Tab "Overview"

- 5 cards superiores: Hábitos, Tareas, Finanzas (neto), Workouts, Goals.
- Cada card muestra valor principal + métrica secundaria + indicador (↑/↓/–) si el comparativo está disponible.
- Consume `GET /api/analytics/overview` (US-142).
- Loading: skeletons en las cards.
- Empty state: "Sin datos en este período" con CTA a registrar actividad.

### 4. Tab "Hábitos"

- Selector de año (solo años con datos).
- Componente `HabitHeatmap` (US-148) ocupa el ancho.
- Debajo: 3 stats — Total completitudes, Mejor día, Racha más larga en el año.
- Consume `GET /api/analytics/habits/heatmap` (US-143).

### 5. Tab "Finanzas"

- Selector de N meses (3/6/12/24).
- Gráfico de tendencias (US-149).
- Lista compacta debajo: top 5 categorías por gasto del período + proyección del mes en curso destacada.
- Consume `GET /api/analytics/finance/trends` (US-144).

### 6. Tab "Productividad"

- Heatmap día × hora (US-149).
- Barra horizontal con `byDayOfWeek` y otra con `byHourOfDay`.
- Cards de "Tu mejor día" / "Tu mejor hora".
- Consume `GET /api/analytics/productivity` (US-145).

### 7. Tab "Comparativo"

- Dos selectores de rango (Período actual / Período anterior).
- Botón rápido: "Esta semana vs anterior", "Este mes vs anterior", "Este año vs anterior".
- Tabla de métricas con columnas: Métrica | Actual | Anterior | Δ absoluta | Δ %.
- Color verde si delta favorable (más completitudes, menos gasto), rojo si desfavorable.
- Consume `GET /api/analytics/compare` (US-146).

### 8. Tab "Fitness"

- Embed del componente de workout stats existente (US-131, `stats.routes.ts` → `/api/stats/overview`).
- Si el embed es complejo, simplemente botón "Ver detalle" que redirige a la página existente de Workouts.

### 9. Estados

- **Loading**: skeletons por sección.
- **Error**: card con retry button.
- **Empty**: ilustración + texto contextual.

### 10. Responsividad

- Desktop: layout con sidebar.
- Tablet: tabs en lugar de sidebar de tabs.
- Mobile (≥ 640px): scroll horizontal de tabs.

---

## Tareas Técnicas

1. **Crear `ReportsPage.tsx` con layout y selector de rango global** — [2h]
2. **Hook `useAnalyticsRange()` para compartir rango entre tabs** — [1h]
3. **Tabs con react-router nested routes o estado local** — [1h]
4. **Tab Overview con cards y consumo del endpoint** — [2h]
5. **Tab Comparativo con tabla y presets** — [2.5h]
6. **Tab Fitness con embed o redirect** — [0.5h]
7. **Services en `src/services/analytics.service.ts`** — [1h]
8. **Hooks React Query (`useOverview`, `useCompare`, etc.)** — [1.5h]
9. **Registrar ruta y entrada en sidebar** — [0.5h]
10. **Tests con Playwright (e2e) del flujo principal** — [2h]

---

## Definition of Done

- [ ] `/reports` accesible desde sidebar
- [ ] 6 tabs funcionales (Overview, Hábitos, Finanzas, Productividad, Comparativo, Fitness)
- [ ] Loading/error/empty states implementados
- [ ] Responsive
- [ ] E2E test cubre navegación entre tabs y cambio de rango
- [ ] Lighthouse score ≥ 90 en performance y accessibility
- [ ] Deploy a staging
- [ ] Code review aprobado

---

**Estimación:** 6 SP | 14h
**Bloqueada por:** US-142, US-146
**Bloqueante de:** US-148, US-149
