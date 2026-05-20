# Horus — Feature Backlog

> Documento generado como insumo de planificación.
> Organizado por prioridad estimada y área de valor.
> Última actualización: 2026-05-19

---

## Contexto

Horus tiene una ventaja única: **ve toda la vida del usuario simultáneamente** — hábitos, finanzas, fitness, calendario, tareas y conocimiento en un solo sistema. El diferenciador no es hacer más cosas, sino **conectar mejor lo que ya existe**.

---

## Prioridad Alta — Cierran brechas evidentes

### F-01 · Presupuestos mensuales por categoría

Los datos de transacciones y gastos recurrentes ya existen. Falta la capa de control presupuestario.

- Presupuesto mensual definido por categoría (Comida, Transporte, Ocio, etc.)
- Indicador visual de progreso: gastado vs presupuestado
- Alerta configurable al alcanzar el 80% y el 100% del presupuesto
- Comparativo histórico mes a mes

---

### F-02 · Metas y Objetivos (Goals)

El sistema rastrea acciones (hábitos, tareas) pero no tiene _destino_. Un módulo de metas da coherencia a todo el sistema.

- Crear objetivo con fecha límite y descripción
- Vincular hábitos y tareas existentes al objetivo
- Progreso automático calculado desde los ítems vinculados
- OKRs personales: objetivo → key results medibles
- Vista de progreso global de todas las metas activas

---

### F-03 · Revisión Semanal / Check-in

Pantalla guiada de cierre de semana que integra todos los módulos.

- Resumen automático: hábitos cumplidos, tareas completadas, balance financiero
- Preguntas de reflexión configurables
- Planificación de la semana siguiente (tareas prioritarias + hábitos foco)
- Historial de revisiones anteriores
- Exportación del resumen como texto/PDF

---

### F-04 · Precio en Horas de Vida

Por cada transacción, mostrar su equivalente en tiempo de vida del usuario.

- El usuario configura su valor/hora una vez
- Debajo de cada monto: _"Equivale a 4.2 horas de tu vida"_
- Filtro en historial de transacciones ordenado por "costo en tiempo"
- Cambia la percepción del gasto de forma visceral y duradera

---

## Prioridad Media — Incrementan valor diferencial

### F-05 · Diario Personal / Journal

Entradas diarias con contexto emocional y búsqueda.

- Texto libre por día + estado de ánimo (escala o emojis)
- Prompts opcionales diarios ("¿Qué salió bien hoy?", "¿Qué cambiarías?")
- Búsqueda en entradas pasadas por texto o estado de ánimo
- Correlación futura con métricas de hábitos y finanzas

---

### F-06 · Modo Focus / Pomodoro integrado con Tareas

Timer de enfoque vinculado a las tareas existentes.

- Seleccionar una tarea → iniciar ciclo Pomodoro (25/5 min configurable)
- Bloqueo de notificaciones durante el foco
- Registro de sesiones de trabajo por tarea
- Estadística de "tiempo real invertido" acumulado por tarea y por semana
- Histórico de sesiones de foco

---

### F-07 · Reportes y Tendencias

Los datos ya existen. Falta la superficie analítica para leerlos.

- Heatmap anual de hábitos (estilo GitHub contributions)
- Tendencia de gasto mensual por categoría con proyección
- Días y horarios más productivos de la semana
- Métricas de fitness: volumen, frecuencia, progresión de carga
- Comparativo entre períodos (esta semana vs semana pasada, este mes vs mes pasado)

---

### F-08 · Etiquetas libres (Tags)

Las categorías son por scope (hábitos/tareas/gastos). Faltan tags cruzados y libres.

- Tags libres en cualquier ítem: `#trabajo`, `#urgente`, `#esperando`, `#proyecto-x`
- Filtro por tag en cada módulo
- Vista unificada cross-módulo: todos los ítems con tag `#proyecto-x`
- Autocompletado de tags al escribir

---

### F-09 · Anti-hábitos / Quit Tracking

Rastrear lo que el usuario quiere _dejar de hacer_, no solo hacer más.

- "Días sin fumar", "Días sin redes sociales", "Días sin alcohol"
- Racha de abstinencia con visualización igual que hábitos positivos
- Registro de recaídas sin culpa: reinicia el contador con nota opcional
- Estadística de frecuencia antes vs después de empezar el tracking

---

### F-10 · Modo Sprint Personal

Período de máximo enfoque con objetivo central declarado.

- Definir sprint de 7 a 21 días con un objetivo principal
- Dashboard simplificado durante el sprint: solo lo relacionado al objetivo
- Hábitos no relacionados en gris (visibles pero secundarios)
- Check-in diario de 3 preguntas (qué avancé, qué me bloqueó, qué haré mañana)
- Retrospectiva automática al finalizar: completado vs comprometido

---

### F-11 · Rueda de Vida + Revisión Trimestral

Visión holística del crecimiento personal en múltiples dimensiones.

- 8 ejes evaluables: Salud · Finanzas · Relaciones · Carrera · Crecimiento · Ocio · Propósito · Entorno
- Autopuntuación 1-10 por eje cada trimestre
- Radar chart con superposición de períodos anteriores
- Pregunta de cierre: _"¿Las áreas que bajaron fue una elección consciente?"_
- Exportable como imagen para journaling externo

---

## Prioridad Diferencial — Ideas con alto potencial único

### F-12 · Motor de Correlaciones Personales

La función que ninguna otra app puede ofrecer: cruzar datos de todos los módulos.

- Análisis automático después de 60 días de datos
- Correlaciones detectadas entre módulos (ej: gasto elevado → baja adherencia a hábitos)
- Notificación de patrón detectado: _"Los lunes después de semanas con más de 6hs de reuniones, completás el 30% menos de tareas"_
- Panel de insights activos e historial de patrones detectados
- Sin IA requerida: correlaciones estadísticas simples sobre datos propios

---

### F-13 · Carta a tu Futuro Yo

Pacto personal sellado en el tiempo.

- Editor de carta libre con fecha de apertura (mínimo 30 días en el futuro)
- Al llegar la fecha: notificación y apertura de la carta
- Comparativa automática: métricas del día en que se escribió vs métricas actuales
- Adjunto de foto opcional (bloqueada hasta la fecha de apertura)
- Historial de cartas pasadas como línea de tiempo de versiones del usuario

---

### F-14 · Deuda de Vida

Superficie para confrontar lo que el usuario sabe que debería resolver.

- Detección automática de: tareas reprogramadas 3+ veces, hábitos con racha rota > 2 semanas sin eliminar, gastos recurrentes sin revisión en 6+ meses
- Dashboard de "Deuda activa" con antigüedad de cada ítem
- Decisión obligatoria por cada ítem: **Comprometer fecha · Delegar · Eliminar**
- Sin zona gris: no se puede cerrar la pantalla sin decidir

---

### F-15 · Pactos con Consecuencias Reales

Accountability con stakes financieros autodefinidos.

- Crear un pacto: _"Si no cumplo [condición] en [período], transfiero $[monto] a [cuenta de ahorro / categoría bloqueada]"_
- Ejecución automática de la transferencia al vencimiento si no se cumplió
- Requiere confirmación manual de cumplimiento (sin trampa automática)
- Historial de pactos: cumplidos vs ejecutados (con monto pagado)
- Basado en economía conductual: el dolor de la pérdida > el placer de la ganancia

---

### F-16 · Arqueología Personal

Los datos del usuario presentados como narrativa, no como métricas.

- Vista de línea de tiempo cronológica de todos los módulos
- _"Hace 1 año empezaste a correr"_, _"Hace 6 meses alcanzaste tu primera meta de ahorro"_
- Notificaciones de aniversarios: _"Hoy hace 1 año completaste tu primer mes perfecto de hábitos"_
- Filtros por módulo o por período
- El pasado como fuente de motivación, no solo el presente

---

## Prioridad Baja — Nichos específicos

### F-17 · Planificador de Comidas / Nutrición

Complemento natural del módulo de fitness.

- Menú semanal configurable con platos y días
- Macro tracking básico (calorías, proteína, carbohidratos, grasa)
- Lista de compras generada automáticamente desde el menú de la semana
- Vinculación con gastos: la compra semanal registrada como transacción

---

### F-18 · Lista de Deseos / Wishlist

Separado de tareas — cosas que el usuario quiere comprar, ver, leer, visitar.

- Ítems con precio estimado, prioridad y categoría
- Vinculación a presupuesto: _"Ahorrando $X/mes, lo podés comprar en Y meses"_
- Estado: deseado → ahorrando → comprado
- Separa el deseo de la ejecución, reduce compras impulsivas

---

### F-19 · Modo Viaje

Adaptación automática del sistema cuando el usuario viaja.

- Detección manual o por cambio de timezone
- Sugerencia de hábitos a suspender vs mantener
- Vista de calendario ajustada a timezone local
- Modo simplificado: solo hábitos críticos y tareas urgentes visibles

---

### F-20 · Contador de Vida / Perspectiva temporal

Visualizaciones de tiempo que generan perspectiva y urgencia positiva.

- Semanas de vida en grid (inspirado en "Your Life in Weeks" de Tim Urban)
- Countdown a fechas significativas definidas por el usuario
- _"Te quedan aproximadamente X sábados hasta los 80 años"_
- Diseño contemplativo, no ansioso — para reflexión, no alarma

---

## Resumen por módulo nuevo requerido

| Feature               | Módulo nuevo | Integra con existente       |
| --------------------- | ------------ | --------------------------- |
| F-01 Presupuestos     | Budgets      | Finanzas, Categorías        |
| F-02 Metas            | Goals        | Hábitos, Tareas             |
| F-03 Revisión semanal | WeeklyReview | Todos                       |
| F-04 Precio en horas  | —            | Finanzas (inline)           |
| F-05 Diario           | Journal      | Hábitos (mood correlations) |
| F-06 Pomodoro         | Focus        | Tareas                      |
| F-07 Reportes         | Analytics    | Todos                       |
| F-08 Tags             | Tags         | Hábitos, Tareas, Recursos   |
| F-09 Anti-hábitos     | —            | Hábitos (tipo nuevo)        |
| F-10 Sprint           | Sprint       | Hábitos, Tareas             |
| F-11 Rueda de vida    | LifeWheel    | —                           |
| F-12 Correlaciones    | Insights     | Todos (lectura)             |
| F-13 Carta futuro yo  | TimeCapsule  | Métricas generales          |
| F-14 Deuda de vida    | LifeDebt     | Hábitos, Tareas, Finanzas   |
| F-15 Pactos           | Pacts        | Finanzas, Hábitos           |
| F-16 Arqueología      | Timeline     | Todos (lectura)             |
| F-17 Nutrición        | Nutrition    | Fitness, Finanzas           |
| F-18 Wishlist         | Wishlist     | Finanzas                    |
| F-19 Modo viaje       | —            | Calendario, Hábitos         |
| F-20 Contador vida    | LifeClock    | —                           |

---

## Roadmap sugerido

```
Q3 2026   F-01 Presupuestos · F-04 Precio en horas · F-08 Tags
Q4 2026   F-02 Metas · F-03 Revisión semanal · F-07 Reportes
Q1 2027   F-12 Correlaciones · F-14 Deuda de vida · F-10 Sprint
Q2 2027   F-13 Carta futuro yo · F-15 Pactos · F-16 Arqueología
Backlog   F-05 Diario · F-06 Pomodoro · F-09 Anti-hábitos · F-11 Rueda
          F-17 Nutrición · F-18 Wishlist · F-19 Viaje · F-20 Contador
```

---

_Para convertir cualquier feature en especificación funcional completa (modelo de datos, pantallas, API endpoints), indicar el código F-XX correspondiente._
