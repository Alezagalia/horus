# Technical Task #1: Evaluación e Instalación de Librería de Gráficos

**Sprint:** 05 - Estadísticas + Gráficos + Marcado Retroactivo
**ID:** TECH-001
**Título:** Evaluación e Instalación de Librería de Gráficos

## Descripción

Evaluar y seleccionar la mejor librería de gráficos para React Native (victory-native vs react-native-chart-kit vs react-native-svg-charts), instalar la elegida y crear componentes wrapper reutilizables.

## Razón

Las estadísticas requieren múltiples tipos de gráficos (barras, líneas, circular). Es necesario elegir una librería que sea performante, mantenida, y soporte ambas plataformas sin problemas.

## Criterios de evaluación

- Performance en listas con múltiples gráficos
- Facilidad de personalización (colores, estilos)
- Tamaño del bundle
- Documentación y comunidad
- Soporte de TypeScript

## Tareas Técnicas

- [ ] Investigar librerías: victory-native, react-native-chart-kit, recharts - [1h]
- [ ] Crear PoC con gráfico de barras y línea en cada librería - [2h]
- [ ] Evaluar performance y bundle size - [1h]
- [ ] Documentar decisión (mini-ADR) - [0.5h]
- [ ] Instalar librería elegida y dependencias - [0.5h]
- [ ] Crear componentes wrapper: BarChart, LineChart, CircularProgress - [2h]
- [ ] Documentar uso de componentes wrapper - [0.5h]

## Componentes Afectados

- **mobile:** Chart components, Dependencies

## Dependencias

- Ninguna

## Prioridad

high

## Esfuerzo Estimado

2 Story Points

## Decisión Recomendada

`victory-native` (basada en react-native-svg) - buena performance, muy personalizable, TypeScript nativo, comunidad activa.
