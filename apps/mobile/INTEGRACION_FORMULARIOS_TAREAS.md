# Instrucciones de Integración - Formularios de Tareas (US-062)

## Archivos Creados

### 1. Esquemas de Validación

- **`src/utils/taskValidation.ts`**
  - Schemas Zod para validación de formularios
  - `createTaskSchema`: Validación para crear tareas
  - `editTaskSchema`: Validación para editar tareas (incluye validación de cancelReason)

### 2. Componentes Reutilizables

- **`src/components/PriorityPicker.tsx`**
  - Selector visual de prioridad con 3 opciones
  - Iconos y colores distintivos (Alta: rojo, Media: amarillo, Baja: verde)

- **`src/components/CategoryPicker.tsx`**
  - Selector de categoría con modal
  - **NOTA:** Actualmente usa datos mock. Reemplazar con API real cuando esté disponible

- **`src/components/StatusPicker.tsx`**
  - Selector de estado usando @react-native-picker/picker
  - Solo para EditTaskScreen

### 3. Pantallas de Formularios

- **`src/screens/CreateTaskScreen.tsx`**
  - Formulario completo para crear tareas
  - Validación en tiempo real con Zod
  - DateTimePicker con toggle "Sin fecha"

- **`src/screens/EditTaskScreen.tsx`**
  - Formulario pre-poblado para editar tareas
  - Incluye todos los campos de CreateTaskScreen
  - Selector de estado adicional
  - Campo condicional de "Razón de Cancelación" (aparece solo si status === 'cancelada')
  - Botón de eliminación con confirmación

## Dependencias Necesarias

Asegúrate de tener instaladas las siguientes dependencias:

```bash
# React Native Community DateTimePicker
npm install @react-native-community/datetimepicker

# React Native Picker
npm install @react-native-picker/picker

# Zod (ya instalado en @horus/shared)
# Axios (ya configurado en tasks.api.ts)
# Expo Vector Icons (incluido con Expo)
```

## Integración con Navegación

### 1. Agregar Rutas al Navigator

En tu archivo de navegación principal (ej: `src/navigation/AppNavigator.tsx`):

```typescript
import { CreateTaskScreen } from '../screens/CreateTaskScreen';
import { EditTaskScreen } from '../screens/EditTaskScreen';

// Dentro del Stack.Navigator
<Stack.Screen
  name="CreateTask"
  component={CreateTaskScreen}
  options={{ title: 'Nueva Tarea' }}
/>
<Stack.Screen
  name="EditTask"
  component={EditTaskScreen}
  options={{ title: 'Editar Tarea' }}
/>
```

### 2. Navegación desde TareasScreen

El FAB en TareasScreen ya navega a CreateTaskScreen:

```typescript
navigation.navigate('CreateTask');
```

Para editar una tarea desde TaskCard:

```typescript
navigation.navigate('EditTask', { taskId: task.id });
```

## Integración con API Real

### CategoryPicker - Reemplazar Datos Mock

En `src/components/CategoryPicker.tsx`, línea 45-64:

**Actualmente (Mock):**

```typescript
const loadCategories = async () => {
  try {
    setLoading(true);
    // Mock data
    const mockCategories: Category[] = [
      { id: '1', name: 'Trabajo', icon: 'briefcase', color: '#2196F3', scope: 'tareas' },
      // ...
    ];
    setCategories(mockCategories);
  } catch (error) {
    console.error('Error loading categories:', error);
  } finally {
    setLoading(false);
  }
};
```

**Reemplazar con (cuando API esté lista):**

```typescript
import { getCategories } from '../api/categories.api'; // Crear este archivo

const loadCategories = async () => {
  try {
    setLoading(true);
    const data = await getCategories({ scope: 'tareas' });
    setCategories(data);
  } catch (error) {
    console.error('Error loading categories:', error);
  } finally {
    setLoading(false);
  }
};
```

## Flujo de Uso

### Crear Nueva Tarea

1. Usuario hace tap en FAB (+) en TareasScreen
2. Se abre CreateTaskScreen
3. Usuario completa formulario:
   - Título (obligatorio, max 200 caracteres)
   - Descripción (opcional)
   - Categoría (obligatoria)
   - Prioridad (obligatoria, default: media)
   - Fecha de vencimiento (opcional, con toggle "Sin fecha")
4. Validación en tiempo real muestra errores
5. Usuario presiona "Crear Tarea"
6. Si validación OK: API call → Alert de éxito → Regreso a TareasScreen
7. Si error: Alert con mensaje de error

### Editar Tarea Existente

1. Usuario hace tap en TaskCard
2. Se abre EditTaskScreen con datos pre-poblados
3. Usuario edita campos según necesidad
4. Usuario puede cambiar estado:
   - Si selecciona "Cancelada" → Aparece campo obligatorio "Razón de Cancelación"
   - Si cambia de "Cancelada" a otro estado → Campo de razón desaparece
5. Usuario presiona "Guardar Cambios" o "Eliminar Tarea"
6. Para eliminar: Se muestra Alert de confirmación
7. Si confirmación OK: API call → Alert de éxito → Regreso a TareasScreen

## Validaciones Implementadas

### CreateTaskSchema

- **title**: Requerido, min 1 carácter, max 200, se hace trim
- **description**: Opcional
- **categoryId**: Requerido, debe ser UUID válido
- **priority**: Enum ['alta', 'media', 'baja']
- **dueDate**: Opcional, si existe debe ser hoy o posterior

### EditTaskSchema

- Extiende CreateTaskSchema
- **status**: Enum ['pendiente', 'en_progreso', 'completada', 'cancelada']
- **cancelReason**: Opcional, max 200 caracteres
- **Refinement**: Si status === 'cancelada', cancelReason es obligatorio

## Estados de Carga

Ambas pantallas manejan 3 estados:

1. **Loading inicial** (solo EditTaskScreen): Spinner mientras carga datos
2. **Submitting**: Desactiva botón de guardar, muestra spinner
3. **Deleting** (solo EditTaskScreen): Desactiva ambos botones, muestra spinner en botón eliminar

## Manejo de Errores

- **Errores de validación**: Se muestran debajo de cada campo en rojo
- **Errores de API**: Alert con mensaje del servidor o mensaje genérico
- **Error al cargar tarea** (EditTaskScreen): Alert + navegación automática de regreso

## Consideraciones de UX

1. **DateTimePicker**: Diferencias entre iOS (inline) y Android (modal)
2. **Toggle "Sin fecha"**: Al activar, limpia el campo dueDate
3. **Contador de caracteres**: En título y razón de cancelación
4. **Auto-focus**: Campo título en CreateTaskScreen
5. **ScrollView**: Para teclado en pantallas pequeñas
6. **Confirmación de eliminación**: Dos pasos (Alert → Confirmación)
7. **Validación en tiempo real**: Se ejecuta antes del submit
8. **Mensajes en español**: Todos los textos localizados

## Próximos Pasos

1. **Implementar API de categorías** y reemplazar mock data en CategoryPicker
2. **Actualizar TareasScreen** para recargar lista después de crear/editar/eliminar
3. **Agregar navegación** desde TaskCard a EditTaskScreen
4. **Considerar react-hook-form** si se requieren formularios más complejos en el futuro
5. **Tests unitarios** para esquemas de validación
6. **Tests de integración** para flujos completos de creación/edición

## Notas Técnicas

- **Platform handling**: Se usa `Platform.OS` para comportamiento específico de iOS/Android
- **Type safety**: Todos los tipos importados desde `tasks.api.ts`
- **Zod integration**: Errores parseados y mapeados a campos específicos
- **ActivityIndicator**: Se usa para estados de carga en lugar de texto
- **Alert.alert**: Patrón nativo para confirmaciones y mensajes de éxito/error
