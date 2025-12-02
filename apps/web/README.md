# Horus Web Application

Modern web application built with Vite, React, TypeScript and Tailwind CSS.

## Tech Stack

- **Vite 6.0+** - Fast build tool and dev server
- **React 18.3+** - UI library
- **TypeScript 5.6+** - Type safety
- **React Router 7.0+** - Client-side routing
- **TanStack Query 5.0+** - Server state management
- **Zustand 4.0+** - Client state management
- **Shadcn/ui** - Component library based on Radix UI
- **Tailwind CSS 4.0+** - Utility-first CSS framework

## Prerequisites

- Node.js 18+
- pnpm 8+

## Setup

1. Install dependencies from monorepo root:

```bash
pnpm install
```

2. Create `.env.local` file:

```bash
cp .env.example .env.local
```

3. Configure environment variables in `.env.local`

## Development

Start the development server:

```bash
pnpm dev
```

The application will be available at http://localhost:5173

## Build

Build for production:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## Code Quality

Type checking:

```bash
pnpm type-check
```

Linting:

```bash
pnpm lint
pnpm lint:fix  # Auto-fix issues
```

Formatting:

```bash
pnpm format
```

## Project Structure

```
apps/web/
├── src/
│   ├── components/     # Reusable UI components
│   ├── lib/            # Utilities and configurations
│   ├── hooks/          # Custom React hooks
│   ├── pages/          # Page components
│   ├── routes/         # Routing configuration
│   ├── stores/         # Zustand stores
│   ├── styles/         # Global styles
│   ├── App.tsx         # Root component
│   └── main.tsx        # Application entry point
├── public/             # Static assets
├── index.html          # HTML template
├── vite.config.ts      # Vite configuration
├── tailwind.config.js  # Tailwind configuration
└── tsconfig.json       # TypeScript configuration
```

## Features

- Hot Module Replacement (HMR)
- Path aliases (@/)
- Code splitting and tree shaking
- TypeScript strict mode
- ESLint + Prettier
- Responsive design with Tailwind
- Dark mode support
- Component library with Shadcn/ui

## Sprint 11 - US-094

This setup includes:

- ✅ Vite configuration with HMR and optimizations
- ✅ React Router with protected routes setup
- ✅ TanStack Query with dev tools
- ✅ Zustand for global state
- ✅ Shadcn/ui components base
- ✅ Tailwind CSS with design system
- ✅ ESLint and Prettier configured
- ✅ Path aliases configured
- ✅ TypeScript strict mode
