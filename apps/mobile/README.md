# Horus Mobile - React Native + Expo

## 🚧 Status: Pendiente de Configuración

La aplicación móvil de Horus aún requiere la configuración inicial de React Native y Expo.

## 📋 Setup Pendiente (Pre-requisito para US-015 y siguientes)

### 1. Inicializar Expo

```bash
cd apps/mobile
npx create-expo-app@latest . --template blank-typescript
```

### 2. Instalar Dependencias Core

```bash
pnpm add expo expo-status-bar
pnpm add react react-native
pnpm add -D @types/react @types/react-native
```

### 3. Navegación

```bash
pnpm add @react-navigation/native @react-navigation/native-stack
pnpm add @react-navigation/material-top-tabs
pnpm add react-native-screens react-native-safe-area-context
pnpm add react-native-pager-view
```

### 4. State Management & Data Fetching

```bash
pnpm add @tanstack/react-query
pnpm add axios
pnpm add zustand  # Para estado global
```

### 5. UI Components

```bash
pnpm add @gorhom/bottom-sheet
pnpm add react-native-gesture-handler react-native-reanimated
pnpm add react-native-paper  # O el design system elegido
```

### 6. Forms & Validation

```bash
pnpm add react-hook-form
pnpm add zod @hookform/resolvers
```

### 7. Storage

```bash
pnpm add @react-native-async-storage/async-storage
pnpm add expo-secure-store  # Para tokens JWT
```

### 8. Configurar package.json

Actualizar scripts en `apps/mobile/package.json`:

```json
{
  "scripts": {
    "dev": "expo start",
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios",
    "web": "expo start --web",
    "test": "jest",
    "type-check": "tsc --noEmit",
    "lint": "eslint src",
    "lint:fix": "eslint src --fix",
    "format": "prettier --write \"src/**/*.{ts,tsx,js,jsx,json}\""
  }
}
```

### 9. Configurar Variables de Entorno

Crear `apps/mobile/.env`:

```bash
EXPO_PUBLIC_API_URL=http://localhost:3000/api
```

Para desarrollo con dispositivo físico en red local:

```bash
EXPO_PUBLIC_API_URL=http://192.168.1.X:3000/api  # Reemplazar X con IP de tu PC
```

### 10. Estructura de Carpetas (Ya Creada)

```
apps/mobile/src/
├── api/                    # API clients
│   └── categories.api.ts   ✅ Creado en US-015
├── components/             # Componentes reutilizables
│   └── categories/
│       ├── CategoryCard.tsx           ✅ Creado en US-015
│       └── CategoryBottomSheet.tsx    ✅ Creado en US-015
├── screens/                # Pantallas principales
│   └── CategoriesScreen.tsx           ✅ Creado en US-015
├── navigation/             # TODO: Configurar React Navigation
├── hooks/                  # Custom hooks
├── store/                  # Estado global (Zustand)
├── theme/                  # Colores, tipografía, etc.
├── utils/                  # Utilidades
└── types/                  # Types específicos de mobile
```

## 🎯 Componentes Listos (US-015)

Los siguientes componentes ya están creados con su estructura completa, documentados con TODOs, y listos para activarse cuando se configure React Native:

1. **`src/api/categories.api.ts`** - Cliente API para categorías
2. **`src/components/categories/CategoryCard.tsx`** - Card de categoría
3. **`src/components/categories/CategoryBottomSheet.tsx`** - Bottom sheet de opciones
4. **`src/screens/CategoriesScreen.tsx`** - Pantalla principal de categorías

Todos incluyen:

- ✅ Imports de tipos desde `@horus/shared`
- ✅ TypeScript interfaces
- ✅ Documentación detallada
- ✅ Código comentado listo para descomentar
- ✅ Styles con StyleSheet (comentados)
- ⚠️ Throws error explicativo mientras React Native no esté configurado

## 🔧 Próximos Pasos

1. **Ejecutar setup de Expo** (pasos 1-8 arriba)
2. **Descomentar código** en los archivos creados en US-015
3. **Configurar navegación** con React Navigation
4. **Configurar React Query** para data fetching
5. **Probar en emulador** o dispositivo físico

## 📚 Referencias

- [Expo Documentation](https://docs.expo.dev/)
- [React Navigation](https://reactnavigation.org/)
- [TanStack Query (React Query)](https://tanstack.com/query/latest)
- [@gorhom/bottom-sheet](https://gorhom.dev/react-native-bottom-sheet/)

## 🎨 Design System (Por Definir)

Opciones sugeridas:

- React Native Paper
- React Native Elements
- NativeBase
- Custom (Tailwind con NativeWind)

---

**Nota:** Este README se actualizará una vez completado el setup de React Native/Expo en un sprint anterior o US dedicada.
