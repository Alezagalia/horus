# Horus

Aplicación de productividad personal con seguimiento de hábitos, tareas, calendario y finanzas.

## Estructura del Proyecto

```
horus/
├── apps/
│   ├── backend/     # API REST con Express + Prisma
│   ├── mobile/      # App móvil con React Native + Expo
│   └── web/         # App web con React + Vite
├── packages/
│   └── shared/      # Tipos y utilidades compartidas
└── package.json     # Configuración del monorepo
```

## Requisitos

- Node.js >= 18
- pnpm >= 8
- PostgreSQL >= 14

## Instalación

1. Clonar el repositorio:

```bash
git clone <repository-url>
cd horus
```

2. Instalar dependencias:

```bash
pnpm install
```

3. Configurar variables de entorno (ver sección siguiente)

4. Configurar la base de datos:

```bash
cd apps/backend
npx prisma generate
npx prisma db push
```

## Configuración de Variables de Entorno

### Backend

Crear el archivo `apps/backend/.env` basándose en `.env.example`:

```bash
cp apps/backend/.env.example apps/backend/.env
```

Editar el archivo con tus valores:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/horus?schema=public"

# JWT Configuration
JWT_SECRET="tu-clave-secreta-jwt-cambiar-en-produccion"
JWT_REFRESH_SECRET="tu-clave-secreta-refresh-cambiar-en-produccion"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server
PORT=3000
NODE_ENV="development"
```

#### Variables Requeridas

| Variable             | Descripción                              | Ejemplo                                       |
| -------------------- | ---------------------------------------- | --------------------------------------------- |
| `DATABASE_URL`       | URL de conexión a PostgreSQL             | `postgresql://user:pass@localhost:5432/horus` |
| `JWT_SECRET`         | Clave secreta para firmar access tokens  | String aleatorio de 32+ caracteres            |
| `JWT_REFRESH_SECRET` | Clave secreta para firmar refresh tokens | String aleatorio de 32+ caracteres            |

#### Variables Opcionales

| Variable                 | Descripción                            | Default       |
| ------------------------ | -------------------------------------- | ------------- |
| `JWT_EXPIRES_IN`         | Tiempo de expiración del access token  | `15m`         |
| `JWT_REFRESH_EXPIRES_IN` | Tiempo de expiración del refresh token | `7d`          |
| `PORT`                   | Puerto del servidor                    | `3000`        |
| `NODE_ENV`               | Entorno de ejecución                   | `development` |

#### Generar Claves Seguras

Para generar claves JWT seguras en producción:

```bash
# Usando Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Usando OpenSSL
openssl rand -hex 64
```

## Scripts Disponibles

### Raíz del Monorepo

```bash
# Verificación de tipos
pnpm type-check

# Linting
pnpm lint
pnpm lint:fix

# Formateo
pnpm format
pnpm format:check
```

### Backend

```bash
# Desarrollo
pnpm dev:backend

# Base de datos
cd apps/backend
npx prisma generate    # Generar cliente
npx prisma db push     # Sincronizar schema
npx prisma studio      # UI para explorar datos
```

### Mobile

```bash
pnpm dev:mobile
```

### Web

```bash
pnpm dev:web
```

## Tecnologías

- **Backend**: Express 5, TypeScript, Prisma 7, PostgreSQL, JWT, Zod
- **Mobile**: React Native, Expo, TypeScript
- **Web**: React, Vite, TypeScript
- **Monorepo**: pnpm workspaces
- **Calidad**: ESLint, Prettier, Husky, Commitlint

## Licencia

MIT
