# US-019: Seed de Categorías Default al Registrarse

**Sprint:** 02 - Categories (Backend + Mobile)
**ID:** US-019
**Título:** Seed de Categorías Default al Registrarse

## Descripción

Como usuario nuevo, quiero tener categorías predefinidas al registrarme para poder empezar a usar la app inmediatamente sin configuración.

## Criterios de Aceptación

- [ ] Al registrar usuario: seed automático de categorías default
- [ ] Categorías de Hábitos: Salud 🏃 (verde), Productividad 💼 (azul), Aprendizaje 📚 (naranja), Bienestar 🧘 (violeta)
- [ ] Categorías de Tareas: Personal 🏠 (amarillo), Trabajo 💼 (azul), Compras 🛒 (verde)
- [ ] Categorías de Eventos: Reuniones 🤝 (azul), Personal 🎉 (rosa), Recordatorios ⏰ (naranja)
- [ ] Categorías de Gastos: Alimentación 🍔 (verde), Transporte 🚗 (azul), Hogar 🏠 (naranja), Entretenimiento 🎬 (rosa), Salud 💊 (rojo)
- [ ] Primera categoría de cada scope marcada como default
- [ ] Seed ejecutado en transacción (todo o nada)
- [ ] Si falla seed: no bloquear registro (log error)

## Tareas Técnicas

- [ ] Crear función seedDefaultCategories - [2h]
- [ ] Definir array de categorías default - [1h]
- [ ] Insertar en BD con Prisma - [1h]
- [ ] Marcar primera como default en cada scope - [1h]
- [ ] Integrar en registro de usuario - [1h]
- [ ] Transacción para atomicidad - [1h]
- [ ] Manejo de errores - [0.5h]
- [ ] Tests del seed - [1.5h]

## Componentes Afectados

- **backend:** AuthService, CategoryService, seed function

## Dependencias

- US-014 (Category model)
- Sprint 01 (Register endpoint)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
