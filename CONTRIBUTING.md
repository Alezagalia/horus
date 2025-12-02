# Guía de Contribución

Gracias por tu interés en contribuir a Horus. Esta guía te ayudará a entender el proceso de desarrollo y las convenciones del proyecto.

## Configuración del Entorno

### Requisitos Previos

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- PostgreSQL 14+ (para desarrollo local)
- Git

### Instalación

```bash
# Clonar el repositorio
git clone <repository-url>
cd horus

# Instalar dependencias
pnpm install

# Configurar Git hooks
pnpm prepare
```

### Verificar Instalación

```bash
# Verificar tipos
pnpm type-check

# Ejecutar linting
pnpm lint

# Verificar formato
pnpm format:check
```

## Flujo de Desarrollo

### 1. Crear una Rama

```bash
# Para features
git checkout -b feature/US-XXX-descripcion

# Para bug fixes
git checkout -b fix/descripcion-del-bug
```

### 2. Desarrollar

1. Implementar los cambios
2. Escribir/actualizar tests
3. Ejecutar verificaciones locales:

```bash
pnpm type-check
pnpm lint
pnpm format:check
```

### 3. Commit

Los commits deben seguir [Conventional Commits](https://www.conventionalcommits.org/):

```bash
git add .
git commit -m "feat(module): descripción breve"
```

**Formato:**

```
<type>(<scope>): <description>
```

**Tipos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Solo documentación
- `style`: Cambios de formato (no afectan código)
- `refactor`: Refactorización sin cambio de comportamiento
- `perf`: Mejoras de performance
- `test`: Añadir o modificar tests
- `build`: Cambios en sistema de build
- `ci`: Cambios en CI/CD
- `chore`: Tareas de mantenimiento
- `revert`: Revertir commits previos

**Scopes comunes:**

- `auth`, `habits`, `tasks`, `events`, `finance`
- `mobile`, `web`, `backend`, `shared`
- `api`, `db`, `ui`

**Ejemplos:**

```bash
feat(auth): add password reset endpoint
fix(habits): correct streak calculation
docs(api): update swagger documentation
refactor(shared): extract validation utils
test(tasks): add unit tests for task service
```

### 4. Push y Pull Request

```bash
git push origin feature/US-XXX-descripcion
```

Luego crear Pull Request en GitHub con:

- Descripción clara de los cambios
- Referencia a la User Story (US-XXX)
- Screenshots si hay cambios de UI

## Estándares de Código

### TypeScript

- Usar tipos explícitos, evitar `any`
- Preferir `interface` sobre `type` para objetos
- Usar `const` por defecto, `let` solo cuando sea necesario

```typescript
// Correcto
interface User {
  id: string;
  name: string;
  email: string;
}

const getUserById = async (id: string): Promise<User | null> => {
  // ...
};

// Incorrecto
const getUserById = async (id: any) => {
  // ...
};
```

### Nombrado

| Tipo       | Convención                  | Ejemplo                   |
| ---------- | --------------------------- | ------------------------- |
| Archivos   | kebab-case                  | `user-service.ts`         |
| Clases     | PascalCase                  | `UserService`             |
| Interfaces | PascalCase (con I opcional) | `User`, `IUserRepository` |
| Variables  | camelCase                   | `userName`                |
| Funciones  | camelCase                   | `getUserById`             |
| Constantes | SCREAMING_SNAKE_CASE        | `MAX_RETRIES`             |

### Estructura de Archivos

```
src/
├── controllers/     # Controladores HTTP
├── services/        # Lógica de negocio
├── repositories/    # Acceso a datos
├── middlewares/     # Middlewares Express
├── utils/           # Utilidades
├── types/           # Tipos TypeScript
└── index.ts         # Entry point
```

### Imports

Ordenar imports en grupos:

1. Módulos externos
2. Módulos internos (@horus/\*)
3. Módulos locales relativos

```typescript
// Externos
import express from 'express';
import { z } from 'zod';

// Internos
import { UserSchema } from '@horus/shared';

// Locales
import { userService } from './services/user-service';
import { validateRequest } from './middlewares/validation';
```

## Git Hooks

El proyecto usa Husky para automatizar verificaciones:

### pre-commit

Ejecuta `lint-staged` que:

- Aplica ESLint con auto-fix
- Formatea con Prettier

Si el hook falla, el commit se cancela. Corrige los errores antes de intentar nuevamente.

### commit-msg

Valida que el mensaje siga Conventional Commits. Mensajes inválidos:

```bash
# Incorrecto
git commit -m "fixed bug"
git commit -m "Add new feature"

# Correcto
git commit -m "fix(habits): correct date parsing"
git commit -m "feat(auth): add oauth support"
```

## Testing

### Ejecutar Tests

```bash
# Todos los tests
pnpm test

# Por package
pnpm test:backend
pnpm test:mobile
pnpm test:web
pnpm test:shared
```

### Escribir Tests

- Nombrar archivos: `*.test.ts` o `*.spec.ts`
- Colocar junto al archivo testeado o en carpeta `__tests__/`

## Debugging

### TypeScript

```bash
# Verificar errores de tipos
pnpm type-check

# Con más detalle
pnpm --filter @horus/backend type-check
```

### ESLint

```bash
# Ver errores
pnpm lint

# Auto-fix
pnpm lint:fix
```

## Reportar Bugs

Incluir en el reporte:

1. Descripción clara del problema
2. Pasos para reproducir
3. Comportamiento esperado vs actual
4. Screenshots/logs si aplica
5. Entorno (OS, versiones de Node/pnpm)

## Preguntas

Si tienes dudas:

1. Revisa la documentación en `/user-stories`
2. Consulta `ARQUITECTURA.md`
3. Pregunta al equipo

## Checklist para PR

- [ ] Código sigue las convenciones del proyecto
- [ ] Tests pasan (`pnpm test`)
- [ ] Type check pasa (`pnpm type-check`)
- [ ] Lint pasa (`pnpm lint`)
- [ ] Formato correcto (`pnpm format:check`)
- [ ] Commits siguen Conventional Commits
- [ ] PR tiene descripción clara
- [ ] Referencia User Story si aplica
