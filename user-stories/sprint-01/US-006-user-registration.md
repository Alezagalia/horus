# US-011: User Registration (Backend + Mobile)

**Sprint:** 01 - Email/Password Authentication
**ID:** US-011
**Título:** User Registration (Backend + Mobile)

## Descripción

Como usuario nuevo, quiero poder registrarme en la aplicación con email y contraseña para crear mi cuenta y comenzar a usar Horus.

## Criterios de Aceptación

- [ ] Endpoint POST /api/auth/register creado
- [ ] Request body acepta: name, email, password
- [ ] Validaciones: email válido, password mínimo 8 caracteres, name no vacío
- [ ] Email debe ser único (no se permiten duplicados)
- [ ] Password hasheada con bcrypt (salt rounds: 12)
- [ ] Usuario creado en base de datos con modelo User (Prisma)
- [ ] Tokens generados: accessToken (JWT, exp 15min) y refreshToken (exp 7 días)
- [ ] Response 201 con: user (sin password), accessToken, refreshToken
- [ ] Error 400 si email ya existe
- [ ] Error 400 si validaciones fallan
- [ ] Pantalla de registro en mobile con campos: name, email, password, confirm password
- [ ] Validación frontend: passwords coinciden, email válido
- [ ] Loading state durante request
- [ ] Navegación a Home screen después de registro exitoso
- [ ] Tokens guardados en SecureStore (mobile)

## Tareas Técnicas

- [ ] Crear modelo User en Prisma - [1h]
- [ ] Crear migración de base de datos - [0.5h]
- [ ] Implementar endpoint POST /api/auth/register - [2h]
- [ ] Crear servicio de auth con bcrypt - [1.5h]
- [ ] Generar JWT tokens (access + refresh) - [1.5h]
- [ ] Validar inputs con Zod - [1h]
- [ ] Crear pantalla RegisterScreen en mobile - [2h]
- [ ] Integrar con API en mobile - [1h]
- [ ] Guardar tokens en SecureStore - [1h]
- [ ] Tests unitarios del endpoint - [2h]
- [ ] Tests de componente RegisterScreen - [1.5h]

## Componentes Afectados

- **backend:** AuthController, AuthService, User model, JWT service
- **mobile:** RegisterScreen, AuthContext, API client
- **database:** User table

## Dependencias

- Sprint 0 completado (infraestructura)

## Prioridad

critical

## Esfuerzo Estimado

8 Story Points
