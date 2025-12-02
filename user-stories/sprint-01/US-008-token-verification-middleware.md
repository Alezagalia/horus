# US-013: Token Verification y Middleware de Auth

**Sprint:** 01 - Email/Password Authentication
**ID:** US-013
**Título:** Token Verification y Middleware de Auth

## Descripción

Como desarrollador del backend, quiero un middleware que verifique tokens JWT para proteger endpoints que requieren autenticación.

## Criterios de Aceptación

- [ ] Middleware authMiddleware creado
- [ ] Lee token del header Authorization: Bearer {token}
- [ ] Verifica token con JWT secret
- [ ] Si token válido: agrega user al request y continúa
- [ ] Si token inválido o expirado: retorna 401 Unauthorized
- [ ] Si no hay token: retorna 401 Unauthorized
- [ ] Middleware aplicable a rutas protegidas con decorador o app.use
- [ ] User ID disponible en req.user para controladores

## Tareas Técnicas

- [ ] Crear middleware authMiddleware - [2h]
- [ ] Verificar token con jsonwebtoken - [1h]
- [ ] Decodificar payload y extraer userId - [0.5h]
- [ ] Cargar user desde BD y agregarlo a req.user - [1h]
- [ ] Manejo de errores (token inválido, expirado) - [1h]
- [ ] Tests del middleware - [1.5h]
- [ ] Documentar uso del middleware - [0.5h]

## Componentes Afectados

- **backend:** authMiddleware, protected routes

## Dependencias

- US-006 y US-007 (login y registro con tokens)

## Prioridad

critical

## Esfuerzo Estimado

4 Story Points
