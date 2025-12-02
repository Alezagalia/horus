# US-009: Refresh Token Flow

**Sprint:** 01 - Email/Password Authentication
**ID:** US-009
**Título:** Refresh Token Flow

## Descripción

Como usuario, quiero que mi sesión se renueve automáticamente usando el refresh token para no tener que iniciar sesión constantemente.

## Criterios de Aceptación

- [ ] Endpoint POST /api/auth/refresh creado
- [ ] Request body acepta: refreshToken
- [ ] Verificar refreshToken con JWT
- [ ] Si válido: generar nuevo accessToken y nuevo refreshToken
- [ ] Response 200 con: accessToken, refreshToken
- [ ] Error 401 si refreshToken inválido o expirado
- [ ] Interceptor en mobile que detecta 401 y automáticamente llama a /refresh
- [ ] Si refresh exitoso: retry request original con nuevo token
- [ ] Si refresh falla: logout automático y navegar a login

## Tareas Técnicas

- [ ] Implementar endpoint POST /api/auth/refresh - [2h]
- [ ] Verificar refreshToken - [1h]
- [ ] Generar nuevos tokens - [0.5h]
- [ ] Crear interceptor de Axios en mobile - [2.5h]
- [ ] Implementar lógica de retry - [1.5h]
- [ ] Implementar logout automático si refresh falla - [1h]
- [ ] Tests del endpoint - [1h]
- [ ] Tests del interceptor - [1.5h]

## Componentes Afectados

- **backend:** AuthController
- **mobile:** API client, Axios interceptor, AuthContext

## Dependencias

- US-008 (Token Verification)

## Prioridad

high

## Esfuerzo Estimado

6 Story Points
