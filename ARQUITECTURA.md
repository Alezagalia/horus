# Arquitectura de Horus

## Descripción General

Horus es una aplicación de productividad personal que abarca hábitos, tareas, eventos y finanzas. El proyecto está estructurado como un **monorepo** usando pnpm workspaces, permitiendo compartir código eficientemente entre múltiples plataformas.

## Estructura del Proyecto

```
horus/
├── apps/
│   ├── backend/          # API REST - Express + TypeScript + Prisma
│   ├── mobile/           # App móvil - React Native + Expo
│   └── web/              # App web - React + TypeScript
├── packages/
│   └── shared/           # Tipos, schemas y utilidades compartidas
├── user-stories/         # Documentación de sprints y user stories
├── package.json          # Configuración raíz del monorepo
├── pnpm-workspace.yaml   # Definición de workspaces
├── tsconfig.base.json    # Configuración base de TypeScript
├── eslint.config.js      # Configuración de ESLint
├── .prettierrc           # Configuración de Prettier
├── commitlint.config.js  # Validación de mensajes de commit
└── .husky/               # Git hooks
```

## Decisiones de Tecnología

### Monorepo con pnpm Workspaces (ADR-001)

**Decisión:** Utilizar pnpm workspaces para gestionar el monorepo.

**Justificación:**

- Eficiencia de espacio con hard links
- Velocidad superior en instalación de dependencias
- Soporte nativo para workspaces
- Strict mode por defecto previene phantom dependencies

**Estructura de packages:**

- `apps/*` - Aplicaciones (backend, mobile, web)
- `packages/*` - Librerías compartidas (shared)

### Backend: Express + TypeScript + Prisma (ADR-002)

**Stack técnico:**

- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Lenguaje:** TypeScript 5.9+
- **ORM:** Prisma
- **Base de datos:** PostgreSQL

**Justificación:**

- Express es maduro, flexible y tiene gran ecosistema
- TypeScript proporciona type safety y mejor DX
- Prisma ofrece type-safe queries y migraciones automáticas

### Mobile: React Native + Expo

**Stack técnico:**

- **Framework:** React Native
- **Toolchain:** Expo
- **Lenguaje:** TypeScript

**Justificación:**

- Código compartido entre iOS y Android
- Expo simplifica configuración y deployment
- Ecosistema React permite reutilización de conocimiento

### Web: React + TypeScript

**Stack técnico:**

- **Framework:** React
- **Build tool:** Vite (planificado)
- **Lenguaje:** TypeScript

### Shared Package

**Propósito:** Centralizar tipos, schemas y utilidades compartidas entre todas las aplicaciones.

**Contenido:**

- Interfaces y tipos TypeScript
- Schemas de validación (Zod)
- Utilidades comunes
- Constantes compartidas

## Diagrama de Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                         CLIENTES                             │
├─────────────────────┬───────────────────────────────────────┤
│                     │                                       │
│  ┌───────────────┐  │  ┌───────────────┐                   │
│  │   Mobile App  │  │  │    Web App    │                   │
│  │ React Native  │  │  │    React      │                   │
│  │    + Expo     │  │  │  + TypeScript │                   │
│  └───────┬───────┘  │  └───────┬───────┘                   │
│          │          │          │                            │
└──────────┼──────────┴──────────┼────────────────────────────┘
           │                     │
           │    REST API         │
           ▼                     ▼
┌─────────────────────────────────────────────────────────────┐
│                        BACKEND                               │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Express + TypeScript                      │  │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐   │  │
│  │  │ Routes  │  │ Control │  │ Service │  │  Prisma │   │  │
│  │  │         │──│  lers   │──│   s     │──│   ORM   │   │  │
│  │  └─────────┘  └─────────┘  └─────────┘  └────┬────┘   │  │
│  └──────────────────────────────────────────────┼────────┘  │
└──────────────────────────────────────────────────┼──────────┘
                                                   │
                                                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      BASE DE DATOS                           │
│                      PostgreSQL                              │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                    SHARED PACKAGE                            │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │  Types  │  │ Schemas │  │  Utils  │  │Constants│         │
│  └─────────┘  └─────────┘  └─────────┘  └─────────┘         │
│                                                              │
│  Consumido por: Backend, Mobile, Web                         │
└─────────────────────────────────────────────────────────────┘
```

## Convenciones de Código

### TypeScript

**Configuración base (`tsconfig.base.json`):**

- Target: ES2022
- Module: Node16
- Strict mode habilitado
- No implicit any
- No unused locals/parameters

### ESLint

**Reglas principales:**

- `no-console`: warn (excepto warn, error, info)
- `@typescript-eslint/no-explicit-any`: error
- `max-len`: 100 caracteres
- `prefer-const`: error
- `no-var`: error

### Prettier

**Configuración:**

- Print width: 100
- Single quotes: true
- Trailing comma: es5
- Tab width: 2
- Semicolons: true
- End of line: lf

### Nombrado

- **Archivos:** kebab-case (`user-service.ts`)
- **Clases/Interfaces:** PascalCase (`UserService`, `IUserRepository`)
- **Variables/Funciones:** camelCase (`getUserById`, `isActive`)
- **Constantes:** SCREAMING_SNAKE_CASE (`MAX_RETRY_COUNT`)

## Flujo de Trabajo Git

### Conventional Commits

Los mensajes de commit deben seguir el formato:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Tipos permitidos:**

- `feat`: Nueva funcionalidad
- `fix`: Corrección de bug
- `docs`: Documentación
- `style`: Cambios de formato
- `refactor`: Refactorización
- `perf`: Mejora de performance
- `test`: Tests
- `build`: Sistema de build
- `ci`: CI/CD
- `chore`: Mantenimiento
- `revert`: Revertir cambios

**Ejemplos:**

```bash
feat(auth): add JWT token refresh endpoint
fix(habits): correct streak calculation for timezone
docs(api): update endpoint documentation
```

### Git Hooks (Husky)

**pre-commit:**

- Ejecuta `lint-staged`
- ESLint + Prettier en archivos staged

**commit-msg:**

- Valida formato del mensaje con commitlint

### Branching Strategy

```
main
  │
  ├── feature/US-XXX-descripcion
  │
  ├── fix/descripcion-del-bug
  │
  └── hotfix/descripcion-urgente
```

## Scripts Disponibles

### Root (Monorepo)

```bash
# Desarrollo
pnpm dev:backend      # Iniciar backend en modo desarrollo
pnpm dev:mobile       # Iniciar app móvil
pnpm dev:web          # Iniciar app web

# Build
pnpm build            # Build de todos los packages
pnpm build:backend    # Build solo backend
pnpm build:web        # Build solo web
pnpm build:shared     # Build solo shared

# Testing
pnpm test             # Tests de todos los packages
pnpm type-check       # Type check de todos los packages

# Calidad de código
pnpm lint             # Ejecutar ESLint
pnpm lint:fix         # ESLint con auto-fix
pnpm format           # Formatear con Prettier
pnpm format:check     # Verificar formato

# Utilidades
pnpm clean            # Limpiar node_modules
pnpm prepare          # Setup de Husky
```

### Por Package

Cada package (`@horus/backend`, `@horus/mobile`, `@horus/web`, `@horus/shared`) tiene:

```bash
pnpm --filter @horus/<package> dev
pnpm --filter @horus/<package> build
pnpm --filter @horus/<package> test
pnpm --filter @horus/<package> type-check
pnpm --filter @horus/<package> lint
pnpm --filter @horus/<package> format
```

## Módulos del Sistema

Horus está organizado en los siguientes módulos funcionales:

1. **Autenticación:** Registro, login, JWT, refresh tokens
2. **Categorías:** CRUD de categorías para organizar hábitos/tareas
3. **Hábitos:** Gestión de hábitos y seguimiento de cumplimiento
4. **Rachas (Streaks):** Cálculo y visualización de rachas
5. **Estadísticas:** Métricas de progreso y rendimiento
6. **Tareas:** Gestión de tareas con checklists
7. **Eventos:** Calendario y sincronización con Google
8. **Finanzas:** Cuentas, transacciones, gastos recurrentes
9. **Notificaciones:** Recordatorios y alertas

## Requisitos del Sistema

- **Node.js:** >= 18.0.0
- **pnpm:** >= 8.0.0
- **PostgreSQL:** 14+ (para desarrollo local)

## Variables de Entorno

Las variables de entorno se gestionan con archivos `.env`:

- `.env` - Variables por defecto
- `.env.local` - Overrides locales (no committed)
- `.env.development.local` - Desarrollo local
- `.env.test.local` - Tests
- `.env.production.local` - Producción local

**Variables típicas:**

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/horus
JWT_SECRET=your-secret-key
PORT=3000
```
