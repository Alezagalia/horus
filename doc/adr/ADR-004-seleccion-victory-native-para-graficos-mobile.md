# ADR-004: Selección de Victory Native para Gráficos en Mobile

**Fecha:** 2025-01-21
**Estado:** Aceptado
**Contexto:** US-044 - Evaluación e Instalación de Librería de Gráficos
**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo

## Contexto y Problema

Las funcionalidades de estadísticas en la aplicación móvil (Sprint 5) requieren múltiples tipos de gráficos:

- Gráficos circulares de progreso (completion rate)
- Gráficos de barras (evolución últimos 7 días)
- Gráficos de líneas (valores numéricos en el tiempo)
- Calendarios de heat map (últimos 30 días)

Es necesario seleccionar una librería de gráficos que sea:

- Performante en listas con múltiples gráficos
- Fácil de personalizar (colores, estilos)
- Con bundle size razonable
- Bien documentada y mantenida
- Con soporte completo de TypeScript
- Compatible con React Native y Expo

## Decisión

Seleccionamos **Victory Native v37** (basada en react-native-svg) como librería de gráficos.

**Instalación:**

```bash
pnpm add victory-native@^37.0.2 react-native-svg@15.15.0
```

**Nota importante:** Victory Native v41 (última versión) tuvo problemas de compatibilidad de tipos con TypeScript. La versión v37 es estable y completamente funcional.

## Alternativas Consideradas

### 1. Victory Native v41

**Pros:**

- Versión más reciente
- Mejoras de performance
- Nuevas características

**Contras:**

- ❌ Problemas de tipos TypeScript con callbacks
- ❌ Incompatibilidad con tipos de datos en `VictoryBar`
- ❌ Documentación de tipos incompleta

**Decisión:** Rechazada por problemas de tipos. Downgrade a v37.

### 2. react-native-chart-kit

**Pros:**

- Bundle size más pequeño (~200KB)
- API simple
- Buena documentación

**Contras:**

- Menos flexible para personalización avanzada
- Menos tipos de gráficos disponibles
- Menos mantenida (última actualización hace 1 año)
- No usa react-native-svg (usa Canvas)

**Decisión:** Rechazada por menor flexibilidad.

### 3. react-native-svg-charts

**Pros:**

- Basada en react-native-svg
- Buena performance
- Altamente personalizable

**Contras:**

- Menos documentación
- Comunidad más pequeña
- API más compleja
- Requiere más código boilerplate

**Decisión:** Rechazada por menor comunidad y documentación.

### 4. Recharts

**Pros:**

- Muy popular en React web
- Excelente documentación
- API declarativa

**Contras:**

- No optimizada para React Native
- Problemas de performance en mobile
- Bundle size grande

**Decisión:** Rechazada por no ser específica de React Native.

## Justificación

Victory Native v37 fue seleccionada porque:

1. **Performance:** Basada en react-native-svg, renderiza de forma nativa con buena performance
2. **Flexibilidad:** API declarativa muy flexible para personalizaciones
3. **Tipos de gráficos:** Soporta todos los tipos que necesitamos (VictoryBar, VictoryLine, VictoryPie, VictoryArea)
4. **TypeScript:** Soporte completo en v37 (sin los problemas de v41)
5. **Comunidad:** Amplia comunidad, bien mantenida, documentación completa
6. **Experiencia:** Formspree (maintainers) tiene experiencia con React Native
7. **Bundle size:** Razonable (~400KB), aceptable para las capacidades que ofrece
8. **Compatibilidad:** Funciona perfectamente con Expo y react-native-svg

## Consecuencias

### Positivas

- ✅ Componentes de gráficos reutilizables y consistentes
- ✅ Personalización avanzada con estilos y temas
- ✅ API declarativa fácil de mantener
- ✅ Documentación completa con ejemplos
- ✅ Soporte TypeScript estable en v37

### Negativas

- ⚠️ Bundle size ~400KB (más grande que chart-kit)
- ⚠️ No podemos usar v41 por problemas de tipos
- ⚠️ Requiere eslint-disable para `any` en algunos callbacks debido a tipos de v37

### Neutras

- 📝 Necesitamos crear componentes wrapper para reutilización
- 📝 Curva de aprendizaje inicial para API de Victory

## Componentes Wrapper Creados

Para facilitar el uso y mantener consistencia, se crearon los siguientes wrappers:

1. **CircularProgress** (`components/stats/CircularProgress.tsx`)
   - Gráfico circular de progreso con porcentaje
   - Colores dinámicos: Verde (>80%), Amarillo (50-80%), Rojo (<50%)
   - Usado en: HomeScreen (completion rate de hoy)

2. **WeeklyChart** (`components/stats/WeeklyChart.tsx`)
   - Gráfico de barras para últimos 7 días
   - Muestra porcentaje de completitud diaria
   - Eje X con nombres de días (L, M, M, J, V, S, D)
   - Usado en: HomeScreen (evolución semanal)

3. **NumericValuesChart** (`components/stats/NumericValuesChart.tsx`)
   - Gráfico de líneas para hábitos numéricos
   - Muestra valores en el tiempo con línea de objetivo
   - Área sombreada bajo la línea
   - Usado en: HabitStatsScreen (evolución valores numéricos)

4. **CalendarHeatmap** (`components/stats/CalendarHeatmap.tsx`)
   - NO usa Victory Native (componente custom con react-native core)
   - Grid de días con color coding
   - Usado en: HabitStatsScreen (últimos 30 días)

## Notas de Implementación

### Problema de Tipos en v37

En VictoryBar, los callbacks de estilo requieren `any` debido a incompatibilidad de tipos:

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

Esto es aceptable porque:

- Solo afecta callbacks internos
- No expone `any` en APIs públicas de nuestros wrappers
- Es temporal hasta que Victory actualice tipos

### Upgrade Path

Cuando Victory Native v41+ estabilice sus tipos TypeScript:

1. Actualizar a última versión
2. Remover eslint-disable comments
3. Actualizar tipos en callbacks
4. Re-testear todos los gráficos

## Referencias

- Victory Native: https://formidable.com/open-source/victory/docs/native/
- react-native-svg: https://github.com/software-mansion/react-native-svg
- Issue de tipos v41: (experiencia propia durante desarrollo)

## Relación con User Stories

- US-041: Dashboard con CircularProgress y WeeklyChart
- US-042: Estadísticas de hábito con NumericValuesChart
- US-044: Esta tarea técnica (evaluación e instalación)
