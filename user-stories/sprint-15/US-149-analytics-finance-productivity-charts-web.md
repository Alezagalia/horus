# US-149: Gráficos de Finanzas y Productividad (Web)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 5
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** visualizaciones claras de mis tendencias de gasto por categoría y mis horarios productivos
**Para** detectar patrones y tomar decisiones informadas sobre dinero y tiempo

---

## Criterios de Aceptación

### 1. Componente `FinanceTrendsChart`

Archivo: `apps/web/src/components/analytics/FinanceTrendsChart.tsx`

```typescript
interface FinanceTrendsChartProps {
  data: FinanceTrends; // tipo de @horus/shared (US-141)
  height?: number; // default 360
  showProjection?: boolean; // default true
}
```

**Diseño:**

- Gráfico de área apilada (`AreaChart` de Recharts) — una serie por categoría.
- Eje X: meses (formato "Ene", "Feb", ..., "Dic '26" para meses que cambian de año).
- Eje Y: monto en moneda local con formato compacto (`12k`, `1.2M`).
- Tooltip muestra: mes, monto por categoría, total del mes.
- Si `projection != null`:
  - Última columna del mes en curso muestra valor actual + indicador de proyección con línea punteada y badge "Proyectado $X".
- Leyenda interactiva: click en una categoría la oculta/muestra.
- Color por categoría tomado de `series[i].color` (fallback paleta neutra si `null`).

### 2. Componente `ProductivityHeatmap`

Archivo: `apps/web/src/components/analytics/ProductivityHeatmap.tsx`

```typescript
interface ProductivityHeatmapProps {
  data: Productivity; // tipo de @horus/shared (US-141)
  cellSize?: number; // default 28
}
```

**Diseño:**

- Grilla 7 filas (días, Lun a Dom) × 24 columnas (horas 0-23).
- Color por intensidad relativa al máximo del dataset (escala azul de 5 niveles).
- Etiquetas de columna: horas (mostrar cada 3: 0, 3, 6, 9, 12, 15, 18, 21).
- Etiquetas de fila: días en formato corto (L, M, X, J, V, S, D).
- Tooltip por celda: "Lunes 10:00 — 8 tareas completadas".
- Borde destacado en la celda con mayor `completed`.

### 3. Componente `ProductivityBars`

Archivo: `apps/web/src/components/analytics/ProductivityBars.tsx`

- Recibe `Productivity` y renderiza 2 mini-charts side-by-side:
  - Barras horizontales por día de semana (`byDayOfWeek`).
  - Barras verticales por hora del día (`byHourOfDay`).
- Día/hora máximo destacado con color primario; el resto en tono neutro.

### 4. Estados

- **Loading**: skeleton del tamaño correcto.
- **Empty**: ilustración + "Aún no hay datos suficientes en este período".
- **Error**: card con retry button.

### 5. Performance

- Render inicial < 100ms con 24 meses × 12 categorías.
- Memorización: `React.memo` + comparación shallow de `data`.

### 6. Tests

- `FinanceTrendsChart`:
  - Renderiza N áreas para N categorías.
  - Muestra badge de proyección cuando `projection != null`.
  - Oculta proyección con `showProjection=false`.
- `ProductivityHeatmap`:
  - Renderiza 168 celdas (7 × 24).
  - Celda con `completed=0` aplica color base.
  - Celda máxima recibe borde destacado.
- `ProductivityBars`:
  - 7 barras en byDayOfWeek, N en byHourOfDay según data.

---

## Tareas Técnicas

1. **`FinanceTrendsChart` con Recharts AreaChart apilado** — [2h]
2. **Lógica de proyección visual (línea punteada + badge)** — [1.5h]
3. **`ProductivityHeatmap` SVG con escala de color** — [2h]
4. **Tooltip y celda destacada en heatmap** — [1h]
5. **`ProductivityBars` con Recharts BarChart** — [1.5h]
6. **Estados loading/empty/error compartidos** — [1h]
7. **Tests unitarios** — [2h]

---

## Definition of Done

- [ ] 3 componentes implementados y exportados
- [ ] Tooltip funcional en los tres
- [ ] Proyección se muestra solo en mes en curso
- [ ] Modo oscuro soportado
- [ ] Tests > 80% cobertura
- [ ] Code review aprobado

---

**Estimación:** 5 SP | 11h
**Bloqueada por:** US-144, US-145, US-147
