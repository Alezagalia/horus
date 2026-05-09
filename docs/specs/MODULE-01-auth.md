# SPEC-01: Autenticación y Usuarios

**Tipo:** module
**Estado:** draft
**Dominio:** transversal
**Dependencias:** ninguna

---

## Objetivo

Gestionar el ciclo de vida de la sesión del usuario: registro, login, renovación de tokens y logout. Proveer identidad segura para todos los demás módulos del sistema.

## Actores

- **Usuario no autenticado**: puede registrarse y hacer login
- **Usuario autenticado**: puede consultar sus datos, renovar token y cerrar sesión

---

## Reglas de Negocio

1. El email debe ser único en el sistema.
2. La contraseña se almacena hasheada con bcrypt (salt rounds: 12).
3. El sistema emite dos tokens tras login/registro:
   - `accessToken`: JWT con expiración de 15 minutos.
   - `refreshToken`: JWT con expiración de 7 días, almacenado en BD.
4. El `refreshToken` permite renovar el `accessToken` sin re-autenticación.
5. Al hacer logout, el `refreshToken` se invalida en BD.
6. Las rutas de registro y login tienen rate limiting para prevenir ataques de fuerza bruta.
7. La respuesta de login/registro nunca expone el hash de la contraseña.

---

## Modelo de Datos

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  name         String
  password     String    // bcrypt hash
  refreshToken String?
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  // Relaciones (cascade delete hacia todos los módulos)
  habits       Habit[]
  tasks        Task[]
  events       Event[]
  accounts     Account[]
  // ...resto de relaciones
}
```

---

## API Endpoints

**Base path:** `/api/auth`

| Método | Path        | Auth              | Descripción                            |
| ------ | ----------- | ----------------- | -------------------------------------- |
| `POST` | `/register` | No (rate-limited) | Registrar nuevo usuario                |
| `POST` | `/login`    | No (rate-limited) | Login con email + password             |
| `POST` | `/refresh`  | No (rate-limited) | Renovar accessToken                    |
| `GET`  | `/me`       | Bearer JWT        | Obtener perfil del usuario autenticado |
| `POST` | `/logout`   | Bearer JWT        | Invalidar refreshToken                 |

### POST /register

**Body:**

```json
{ "name": "string", "email": "string", "password": "string (min 8 chars)" }
```

**Response 201:**

```json
{ "user": { "id", "name", "email" }, "accessToken": "...", "refreshToken": "..." }
```

**Errores:** `400` email ya existe | `400` validación falla

### POST /login

**Body:**

```json
{ "email": "string", "password": "string" }
```

**Response 200:**

```json
{ "user": { "id", "name", "email" }, "accessToken": "...", "refreshToken": "..." }
```

**Errores:** `401` credenciales inválidas

### POST /refresh

**Body:**

```json
{ "refreshToken": "string" }
```

**Response 200:**

```json
{ "accessToken": "..." }
```

**Errores:** `401` token inválido o expirado

---

## Criterios de Aceptación

- [ ] El registro crea un usuario con password hasheada y retorna ambos tokens.
- [ ] El login con credenciales incorrectas retorna 401 (sin revelar cuál campo falló).
- [ ] El accessToken expira a los 15 minutos.
- [ ] El refreshToken permite obtener un nuevo accessToken sin login.
- [ ] El logout invalida el refreshToken (no puede usarse más).
- [ ] El endpoint `/me` retorna datos del usuario sin exponer la contraseña.
- [ ] Rate limiting activo en register, login y refresh.
- [ ] Mobile almacena tokens en `expo-secure-store`.
