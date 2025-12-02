# 📊 Chart Components - Guía de Uso

**Sprint 5** - Componentes de Gráficos Reutilizables
**Librería:** Victory Native v37.3.6 + react-native-svg

Esta guía documenta los componentes wrapper de gráficos creados para el proyecto Horus mobile.

---

## 📦 Instalación

Los componentes ya están instalados en el proyecto con las siguientes dependencias:

```bash
pnpm add victory-native@^37.0.2 react-native-svg@15.15.0
```

**Nota:** Usamos Victory Native v37 (no v41) por estabilidad de tipos TypeScript. Ver ADR-004 para detalles.

---

## 🎨 Componentes Disponibles

### 1. CircularProgress

Gráfico circular de progreso para mostrar porcentajes con colores dinámicos.

**Ubicación:** `src/components/stats/CircularProgress.tsx`

**Props:**

```typescript
interface CircularProgressProps {
  percentage: number; // 0-100
  size?: number; // Default: 120px
  strokeWidth?: number; // Default: 12px
}
```

**Características:**

- Colores dinámicos basados en porcentaje:
  - 🟢 Verde (≥80%): `#4CAF50`
  - 🟡 Amarillo (50-79%): `#FFC107`
  - 🔴 Rojo (<50%): `#F44336`
- Texto central con porcentaje grande
- Basado en react-native-svg (NO usa Victory)
- Animación suave de progreso

**Ejemplo de uso:**

```typescript
import { CircularProgress } from '@/components/stats/CircularProgress';

// En HomeScreen - Completion rate de hoy
<CircularProgress percentage={completionRateToday.percentage} />

// Con tamaño personalizado
<CircularProgress
  percentage={75}
  size={150}
  strokeWidth={16}
/>
```

**Usado en:**

- HomeScreen (US-041): Tarjeta "Hoy" con completion rate diario

---

### 2. WeeklyChart

Gráfico de barras para mostrar evolución de los últimos 7 días.

**Ubicación:** `src/components/stats/WeeklyChart.tsx`

**Props:**

```typescript
interface WeeklyChartProps {
  data: Array<{
    date: string; // ISO date string (YYYY-MM-DD)
    completed: number; // Hábitos completados
    total: number; // Hábitos totales
    percentage: number; // 0-100
  }>;
}
```

**Características:**

- Eje X: Días de la semana (D, L, M, M, J, V, S)
- Eje Y: Porcentaje de completitud (0-100%)
- Barras coloreadas dinámicamente:
  - 🟢 Verde (≥80%)
  - 🟡 Amarillo (50-79%)
  - 🔴 Rojo (<50%)
- Grid suave con líneas punteadas
- Responsive width (adapta a pantalla)

**Ejemplo de uso:**

```typescript
import { WeeklyChart } from '@/components/stats/WeeklyChart';

// En HomeScreen - Tarjeta "Evolución"
const { last7Days } = stats;

<WeeklyChart data={last7Days} />
```

**Datos esperados (ejemplo):**

```typescript
[
  { date: '2025-01-21', completed: 8, total: 10, percentage: 80 },
  { date: '2025-01-20', completed: 10, total: 10, percentage: 100 },
  { date: '2025-01-19', completed: 5, total: 10, percentage: 50 },
  // ... resto de días
];
```

**Usado en:**

- HomeScreen (US-041): Tarjeta "Evolución (últimos 7 días)"

---

### 3. NumericValuesChart

Gráfico de líneas para mostrar valores numéricos de hábitos en el tiempo.

**Ubicación:** `src/components/stats/NumericValuesChart.tsx`

**Props:**

```typescript
interface NumericValuesChartProps {
  data: Array<{
    date: string; // ISO date string
    value: number | null;
  }>;
  targetValue?: number; // Meta del hábito
  unit?: string; // Unidad (ej: "km", "litros")
  averageValue?: number | null;
  minValue?: number | null;
  maxValue?: number | null;
}
```

**Características:**

- Línea azul para valores registrados
- Área sombreada bajo la línea
- Línea roja punteada para objetivo (si existe)
- Labels con unidades
- Estadísticas de resumen (promedio, min, max)
- Filtra automáticamente valores null
- Responsive width

**Ejemplo de uso:**

```typescript
import { NumericValuesChart } from '@/components/stats/NumericValuesChart';

// En HabitStatsScreen - Para hábitos NUMERIC
<NumericValuesChart
  data={habitStats.last30DaysValues}
  targetValue={habit.targetValue}
  unit={habit.unit}
  averageValue={habitStats.averageValue}
  minValue={habitStats.minValue}
  maxValue={habitStats.maxValue}
/>
```

**Datos esperados (ejemplo):**

```typescript
data: [
  { date: '2025-01-01', value: 5 },
  { date: '2025-01-02', value: null }, // día no registrado
  { date: '2025-01-03', value: 7 },
  { date: '2025-01-04', value: 8 },
  // ...
];
```

**Usado en:**

- HabitStatsScreen (US-042): Gráfico de evolución para hábitos numéricos

---

### 4. CalendarHeatmap

Grid de calendario mostrando últimos 30 días con color coding.

**Ubicación:** `src/components/stats/CalendarHeatmap.tsx`

**Props:**

```typescript
interface CalendarHeatmapProps {
  data: Array<{
    date: string; // ISO date string
    completed: boolean;
    shouldComplete: boolean; // Si debía completarse según periodicidad
  }>;
}
```

**Características:**

- Grid de días agrupados por semanas
- Colores:
  - 🟢 Verde (`#4CAF50`): Completado
  - 🔴 Rojo (`#F44336`): No completado (pero debía)
  - ⚪ Gris (`#E0E0E0`): No aplicable (según periodicidad)
- Labels con número de día
- Leyenda explicativa
- Scroll horizontal para ver todo el mes
- **NO usa Victory Native** (componente custom con React Native core)

**Ejemplo de uso:**

```typescript
import { CalendarHeatmap } from '@/components/stats/CalendarHeatmap';

// En HabitStatsScreen - Para hábitos CHECK
<CalendarHeatmap data={habitStats.last30DaysData} />
```

**Datos esperados (ejemplo):**

```typescript
data: [
  { date: '2025-01-21', completed: true, shouldComplete: true }, // Verde
  { date: '2025-01-20', completed: false, shouldComplete: true }, // Rojo
  { date: '2025-01-19', completed: false, shouldComplete: false }, // Gris
  // ...
];
```

**Usado en:**

- HabitStatsScreen (US-042): Visualización de últimos 30 días para hábitos CHECK

---

## 🎯 Patrones de Uso

### Colores Consistentes

Todos los componentes usan el mismo esquema de colores para porcentajes:

```typescript
const getColor = (percentage: number): string => {
  if (percentage >= 80) return '#4CAF50'; // Verde - Excelente
  if (percentage >= 50) return '#FFC107'; // Amarillo - Regular
  return '#F44336'; // Rojo - Necesita mejorar
};
```

### Responsive Design

Los gráficos se adaptan al ancho de pantalla:

```typescript
const screenWidth = Dimensions.get('window').width;
const chartWidth = screenWidth - 64; // Padding horizontal
```

### Loading States

Envolver gráficos con estados de carga:

```typescript
{isLoading ? (
  <ActivityIndicator size="large" color="#2196F3" />
) : (
  <WeeklyChart data={last7Days} />
)}
```

### Empty States

Manejar casos sin datos:

```typescript
{data.length === 0 ? (
  <Text style={styles.noDataText}>No hay datos suficientes</Text>
) : (
  <NumericValuesChart data={data} />
)}
```

---

## ⚙️ Configuración de Victory Native

### Tema Global

Los componentes usan `VictoryTheme.material` como base, con personalizaciones:

```typescript
<VictoryChart
  theme={VictoryTheme.material}
  width={chartWidth}
  height={200}
  padding={{ top: 20, bottom: 40, left: 50, right: 20 }}
>
  {/* ... */}
</VictoryChart>
```

### Ejes Personalizados

```typescript
<VictoryAxis
  style={{
    axis: { stroke: '#E0E0E0' },
    tickLabels: { fontSize: 10, fill: '#666' },
    grid: { stroke: '#F5F5F5', strokeDasharray: '4, 4' },
  }}
/>
```

### Nota sobre Tipos TypeScript

En v37, algunos callbacks requieren `any` debido a tipos incompatibles:

```typescript
<VictoryBar
  style={{
    data: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fill: (d: any) => d.datum.fill,
    },
  }}
/>
```

Esto es temporal y se corregirá al actualizar a una versión futura de Victory Native con tipos mejorados.

---

## 🧪 Testing

### Testing Manual

Los componentes fueron testeados manualmente en:

- HomeScreen con datos reales de API
- HabitStatsScreen con diferentes tipos de hábitos
- Diferentes tamaños de pantalla (iPhone SE, iPhone 14 Pro, iPad)

### Testing Visual

Verificar:

- Colores correctos según porcentaje
- Responsive en diferentes pantallas
- Performance con múltiples gráficos en lista
- Animaciones suaves

---

## 📚 Referencias

- **Victory Native Documentation:** https://formidable.com/open-source/victory/docs/native/
- **react-native-svg Documentation:** https://github.com/software-mansion/react-native-svg
- **ADR-004:** Decisión de selección de Victory Native
- **US-041:** Dashboard con CircularProgress y WeeklyChart
- **US-042:** Pantalla de estadísticas con NumericValuesChart y CalendarHeatmap

---

## 🔄 Upgrade Path

Cuando Victory Native v41+ estabilice sus tipos:

1. Actualizar dependencia:

   ```bash
   pnpm update victory-native@latest
   ```

2. Remover eslint-disable comments en WeeklyChart

3. Actualizar tipos en callbacks:

   ```typescript
   fill: (d: { datum: { fill: string } }) => d.datum.fill;
   ```

4. Re-testear todos los gráficos

5. Actualizar esta documentación

---

## 💡 Tips de Performance

1. **Memoization:** Usar `useMemo` para datos de gráficos:

   ```typescript
   const chartData = useMemo(() =>
     data.map(item => ({ ... })),
     [data]
   );
   ```

2. **FlatList con gráficos:** Si tienes múltiples gráficos en lista, usa `removeClippedSubviews`:

   ```typescript
   <FlatList
     removeClippedSubviews
     maxToRenderPerBatch={3}
     windowSize={5}
   />
   ```

3. **Bundle size:** Victory Native añade ~400KB. Si no necesitas gráficos complejos, considera componentes custom como CalendarHeatmap.

---

**Última actualización:** 2025-01-21 (Sprint 5 - US-044)
