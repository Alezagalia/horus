# US-034: Animaciones y Celebraciones al Completar Hábitos

**Sprint:** 04 - Marcar Hábitos + Sistema de Rachas
**ID:** US-034
**Título:** Animaciones y Celebraciones al Completar Hábitos

## Descripción

Como usuario, quiero ver animaciones y celebraciones motivadoras cuando completo un hábito, para sentirme recompensado y motivado a seguir con mi progreso.

## Criterios de Aceptación

- [ ] Al completar hábito CHECK: animación de check con escala y color (verde)
- [ ] Al completar hábito NUMERIC (alcanzar targetValue): animación de progreso completo (100%)
- [ ] Si racha > 5 días: mostrar animación de confetti (efecto visual)
- [ ] Si racha es récord personal (longestStreak actualizado): mensaje de celebración especial
- [ ] Feedback háptico diferenciado:
  - Completado normal: impacto ligero (light impact)
  - Racha > 5: impacto medio (medium impact)
  - Récord personal: notificación de éxito (notification success)
- [ ] Animaciones no bloquean UI (pueden cancelarse con tap)
- [ ] Celebraciones solo se muestran 1 vez por hábito al momento de completarlo (no al recargar)

## Tareas Técnicas

- [ ] Implementar animación de check con react-native-reanimated - [1h]
- [ ] Implementar confetti con lottie-react-native o react-native-confetti-cannon - [2h]
- [ ] Configurar feedback háptico con expo-haptics - [0.5h]
- [ ] Crear lógica para detectar récord personal y racha > 5 - [1h]
- [ ] Implementar sistema de "celebración vista" para no repetir - [1h]
- [ ] Tests de animaciones - [1h]

## Componentes Afectados

- **mobile:** HabitosDiariosScreen, Animation components, Haptics

## Dependencias

- US-033 debe estar completa

## Prioridad

medium

## Esfuerzo Estimado

3 Story Points
