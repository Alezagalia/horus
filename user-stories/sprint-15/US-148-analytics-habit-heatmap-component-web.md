# US-148: Componente HabitHeatmap (Web)

**Tipo:** user-story
**Prioridad:** high
**Sprint:** 15
**Story Points:** 4
**Asignado a:** Developer 2
**Estado:** todo

---

## Descripción

**Como** usuario web
**Quiero** un mapa de calor anual de mi adherencia a hábitos estilo GitHub contributions
**Para** identificar visualmente períodos buenos, recaídas y patrones estacionales

---

## Criterios de Aceptación

### 1. Ubicación y API del componente

Archivo: `apps/web/src/components/analytics/HabitHeatmap.tsx`

```typescript
interface HabitHeatmapProps {
  data: HabitHeatmap; // tipo de @horus/shared (US-141)
  cellSize?: number; // default 12
  cellGap?: number; // default 2
  showMonthLabels?: boolean; // default true
  showWeekdayLabels?: boolean; // default true
  showLegend?: boolean; // default true
  onDayClick?: (day: HabitHeatmapDay) => void;
}
```

### 2. Diseño visual

```
       Ene  Feb  Mar  Abr  May  Jun  Jul  Ago  Sep  Oct  Nov  Dic
  Lun  ▢▢▢▢▢▣▣▣▣▦▦▦▦▦▦▦▤▤▤▤▤▣▣▣▣...
  Mar  ▢▣▣▤▤▦▦▦▦▤▤▣▣▢▢▢▢...
  Mié  ▢▢▣▣▦▦▦▤▤▣▢▢...
  Jue  ...
  Vie  ...
  Sáb  ...
  Dom  ...

         Menos  ▢▣▤▦▧  Más
```

- Grilla de 7 filas (días de la semana, lunes a domingo) × 52-53 columnas (semanas).
- Color por `level` (0..4) con escala configurable vía CSS variables:
  - `level 0`: `var(--heatmap-0, #ebedf0)` — gris claro
  - `level 1`: `var(--heatmap-1, #9be9a8)`
  - `level 2`: `var(--heatmap-2, #40c463)`
  - `level 3`: `var(--heatmap-3, #30a14e)`
  - `level 4`: `var(--heatmap-4, #216e39)`
- Soporta dark mode con tema invertido.
- Etiquetas de mes alineadas con la primera semana de cada mes.
- Etiquetas de día de semana a la izquierda (mostrar solo Lun, Mié, Vie para no saturar).

### 3. Tooltip

- Al hacer hover sobre un día: tooltip con `"{N} hábitos cumplidos · {fecha localizada}"`.
- Si `completions === 0`: `"Sin actividad · {fecha localizada}"`.
- Usar Radix Tooltip o implementación nativa simple con `aria-describedby`.

### 4. Accesibilidad

- Cada celda es un `<button>` con `aria-label` descriptivo y `tabindex` navegable.
- Navegación con flechas: ←→ avanza día, ↑↓ avanza semana.
- Focus visible con outline.

### 5. Performance

- Render < 50ms con 366 celdas.
- Memo con `React.memo` y key `data.year`.
- SVG render preferido sobre divs (mejor performance con 366 celdas + scroll).

### 6. Stories / Playground

- Crear archivo `HabitHeatmap.stories.tsx` (si hay Storybook configurado) o página de prueba en `/sandbox/heatmap` para revisión visual con 4 datasets de ejemplo:
  - Año con datos densos
  - Año con datos esparsos
  - Año sin datos (`level: 0` en todos)
  - Año bisiesto

### 7. Tests

- Unitario: renderiza exactamente el número correcto de celdas (365 o 366).
- Unitario: aplica clase de color correcta por `level`.
- Unitario: `onDayClick` se dispara con el día correcto.
- Snapshot test del SVG completo con dataset de prueba.

---

## Tareas Técnicas

1. **Implementar grilla SVG con coordenadas calculadas** — [2h]
2. **Etiquetas de mes y día de semana** — [1h]
3. **Tooltip con Radix** — [1h]
4. **Soporte teclado (navegación con flechas)** — [1h]
5. **Variables CSS para tema light/dark** — [0.5h]
6. **Tests unitarios + snapshot** — [1.5h]
7. **Página/stories de playground** — [1h]

---

## Definition of Done

- [ ] Componente renderiza correctamente años bisiestos y no bisiestos
- [ ] Tooltip muestra info por día
- [ ] Navegación por teclado funcional
- [ ] Modo oscuro soportado
- [ ] Tests > 80% cobertura
- [ ] Performance render < 50ms con 366 celdas
- [ ] Code review aprobado

---

**Estimación:** 4 SP | 8h
**Bloqueada por:** US-143, US-147
