# Instrucciones de Integración - TareasScreen

## Sprint 7 - US-061

Esta guía te ayudará a integrar la pantalla de Tareas en la navegación de la aplicación móvil.

---

## 📦 Archivos Creados

Los siguientes archivos han sido creados y están listos para usar:

1. **`src/api/tasks.api.ts`** - Cliente API para tareas
2. **`src/utils/taskColors.ts`** - Sistema de color semáforo
3. **`src/components/TaskCard.tsx`** - Componente de tarjeta de tarea
4. **`src/components/TaskFilterBar.tsx`** - Barra de filtros
5. **`src/screens/TareasScreen.tsx`** - Pantalla principal de tareas

---

## 🔧 Pasos de Integración

### Paso 1: Agregar a la Navegación

Localiza tu archivo de navegación principal (puede ser `navigation/index.tsx`, `App.tsx`, o similar) y agrega la pantalla de Tareas.

**Ejemplo con React Navigation (Tab Navigator):**

```typescript
import { TareasScreen } from './src/screens/TareasScreen';

// En tu Tab Navigator
<Tab.Screen
  name="Tareas"
  component={TareasScreen}
  options={{
    title: 'Tareas',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="checkbox-outline" size={size} color={color} />
    ),
  }}
/>
```

**Ejemplo con Stack Navigator:**

```typescript
import { TareasScreen } from './src/screens/TareasScreen';

// En tu Stack Navigator
<Stack.Screen
  name="Tareas"
  component={TareasScreen}
  options={{
    title: 'Mis Tareas',
    headerShown: true,
  }}
/>
```

---

### Paso 2: Verificar Configuración de API

Abre `src/api/tasks.api.ts` y verifica que la URL del API sea correcta:

```typescript
const API_URL = 'http://localhost:3001/api'; // Desarrollo local
// o
const API_URL = 'https://tu-backend.com/api'; // Producción
```

**Nota:** El token de autenticación actualmente es dummy. Necesitarás integrarlo con tu sistema de autenticación existente:

```typescript
const getAuthToken = () => {
  // TODO: Implementar obtención de token desde AsyncStorage/SecureStore
  return 'dummy-token-for-development';
};
```

---

### Paso 3: Instalar Dependencias (si es necesario)

Si no tienes instaladas estas dependencias, agrégalas:

```bash
# Expo Vector Icons (probablemente ya instalado)
npx expo install @expo/vector-icons

# Axios para llamadas API
npm install axios
```

---

### Paso 4: Probar la Pantalla

1. Inicia el servidor backend:

   ```bash
   cd apps/backend
   pnpm dev
   ```

2. Inicia la app móvil:

   ```bash
   cd apps/mobile
   npx expo start
   ```

3. Navega a la pantalla de Tareas

4. Verifica:
   - ✅ Se cargan las tareas
   - ✅ Los colores se aplican correctamente según vencimiento
   - ✅ Los filtros funcionan
   - ✅ El checkbox toggle funciona
   - ✅ Pull-to-refresh funciona

---

## 🎨 Sistema de Color Semáforo

El sistema de colores se aplica automáticamente:

| Situación            | Color          | Código    |
| -------------------- | -------------- | --------- |
| Vencida (overdue)    | 🔵 Azul        | `#ADD8E6` |
| Vence en 0-2 días    | 🔴 Rojo pastel | `#FFB3B3` |
| Vence en 3-7 días    | 🟡 Amarillo    | `#FFEB9C` |
| Vence en +7 días     | 🟢 Verde       | `#C6E0B4` |
| Sin fecha            | Blanco         | `#FFFFFF` |
| Completada/Cancelada | Gris           | `#E0E0E0` |

---

## 🔗 Integraciones Pendientes

Las siguientes funcionalidades están preparadas pero requieren las US futuras:

### US-062 - Crear/Editar Tarea

En `TareasScreen.tsx`, línea ~93:

```typescript
const handleCreateTask = () => {
  // TODO: Navigate to CreateTaskScreen when US-062 is implemented
  navigation.navigate('CreateTask');
};
```

### US-063 - Detalle de Tarea

En `TareasScreen.tsx`, línea ~87:

```typescript
const handleTaskPress = (taskId: string) => {
  // TODO: Navigate to TaskDetailScreen when US-063 is implemented
  navigation.navigate('TaskDetail', { taskId });
};
```

**Acción:** Descomentar y configurar rutas cuando implementes US-062 y US-063.

---

## 🐛 Solución de Problemas

### Error: Cannot find module 'axios'

```bash
npm install axios
```

### Error: Ionicons not found

```bash
npx expo install @expo/vector-icons
```

### Las tareas no se cargan

1. Verifica que el backend esté corriendo (`localhost:3001`)
2. Verifica la URL en `tasks.api.ts`
3. Verifica el token de autenticación
4. Revisa la consola para errores de red

### Los colores no se aplican

- Verifica que las tareas tengan `dueDate` configurado
- Revisa la lógica en `utils/taskColors.ts`

---

## 📝 Notas de Implementación

### Filtros

Los filtros se combinan (AND lógico):

- Status + Priority + DateFilter

### Performance

- La lista usa `FlatList` para virtualización
- Pull-to-refresh implementado
- Toggle optimista (actualiza UI antes de respuesta del servidor)

### Estados

- **Loading:** Spinner al cargar inicial
- **Refreshing:** Indicador en pull-to-refresh
- **Toggling:** Spinner individual por tarea durante toggle
- **Empty:** Mensaje cuando no hay tareas

---

## ✅ Checklist de Integración

- [ ] TareasScreen agregada a navegación
- [ ] API URL configurada correctamente
- [ ] Token de autenticación configurado
- [ ] Dependencias instaladas
- [ ] Pantalla probada y funcional
- [ ] Filtros funcionando
- [ ] Toggle funcionando
- [ ] Pull-to-refresh funcionando
- [ ] Empty state mostrándose correctamente
- [ ] Colores del semáforo aplicándose correctamente

---

## 🎯 Próximos Pasos

Después de completar esta integración:

1. **US-062:** Implementar CreateTaskScreen y EditTaskScreen
2. **US-063:** Implementar TaskDetailScreen con checklist
3. Conectar navegación entre pantallas
4. Implementar gestión de autenticación real
5. Agregar manejo de errores con Toast/Snackbar

---

## 📚 Recursos Adicionales

- [React Navigation Docs](https://reactnavigation.org/docs/getting-started)
- [Expo Vector Icons](https://icons.expo.fyi/)
- [Axios Documentation](https://axios-http.com/docs/intro)

---

¿Tienes problemas con la integración? Verifica:

1. Versiones de dependencias
2. Configuración de navegación
3. Logs de consola (tanto mobile como backend)
