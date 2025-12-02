# US-010: Get Current User (GET /me)

**Sprint:** 01 - Email/Password Authentication
**ID:** US-010
**Título:** Get Current User (GET /me)

## Descripción

Como usuario autenticado, quiero poder obtener mi información de perfil para mostrarla en la aplicación.

## Criterios de Aceptación

- [ ] Endpoint GET /api/auth/me creado
- [ ] Endpoint protegido con authMiddleware
- [ ] Response 200 con user completo (sin password)
- [ ] Error 401 si no está autenticado
- [ ] Hook useAuth en mobile que llama a /me al cargar app
- [ ] Cargar user en AuthContext si token válido
- [ ] Si falla: limpiar tokens y navegar a login

## Tareas Técnicas

- [ ] Implementar endpoint GET /api/auth/me - [1h]
- [ ] Proteger con authMiddleware - [0.5h]
- [ ] Crear hook useAuth en mobile - [2h]
- [ ] Llamar a /me al iniciar app - [1h]
- [ ] Cargar user en AuthContext - [1h]
- [ ] Manejo de errores - [0.5h]
- [ ] Tests del endpoint - [1h]
- [ ] Tests del hook useAuth - [1h]

## Componentes Afectados

- **backend:** AuthController
- **mobile:** useAuth hook, AuthContext

## Dependencias

- US-008 (authMiddleware)

## Prioridad

high

## Esfuerzo Estimado

5 Story Points
