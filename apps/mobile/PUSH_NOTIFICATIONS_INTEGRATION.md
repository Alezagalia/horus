# 📱 Guía de Integración: Push Notifications

## Sprint 12 - US-106

Esta guía explica cómo integrar las notificaciones push en la aplicación móvil Horus.

---

## 📦 Componentes Implementados

### 1. Servicio de Push Notifications (`src/services/push-notifications.ts`)

Proporciona funciones para:

- Verificar permisos de notificaciones
- Registrar dispositivo para push notifications
- Configurar canal Android
- Obtener Expo Push Token
- Enviar token al backend
- Gestionar badge count

### 2. Hook `usePushNotifications` (`src/hooks/usePushNotifications.ts`)

Hook React que:

- Registra automáticamente el dispositivo al montar
- Escucha notificaciones recibidas (foreground)
- Maneja tap en notificaciones con deep linking
- Limpia listeners al desmontar

### 3. Hook `useBadgeCount` (`src/hooks/useBadgeCount.ts`)

Hook para actualizar el badge count basado en items pendientes (hábitos, tareas, etc.)

### 4. Componente `NotificationSettings` (`src/components/NotificationSettings.tsx`)

Componente UI para que el usuario configure sus notificaciones push.

### 5. API Client (`src/api/push.api.ts`)

Cliente HTTP para comunicarse con el backend de push notifications.

---

## 🚀 Integración en App.tsx

### Paso 1: Importar el hook

```tsx
import { usePushNotifications } from './src/hooks/usePushNotifications';
```

### Paso 2: Usar el hook en el componente principal

```tsx
export default function App() {
  // Inicializar push notifications
  const { expoPushToken, notification, isRegistered, error } = usePushNotifications();

  useEffect(() => {
    if (isRegistered) {
      console.log('✅ Push notifications habilitadas');
      console.log('📱 Token:', expoPushToken);
    }

    if (error) {
      console.error('❌ Error con push notifications:', error);
    }
  }, [isRegistered, expoPushToken, error]);

  useEffect(() => {
    if (notification) {
      console.log('📬 Nueva notificación:', notification);
      // Opcional: Mostrar toast o actualizar UI
    }
  }, [notification]);

  return (
    // ... resto del componente
  );
}
```

---

## 📊 Integración de Badge Count

### En la screen de Hábitos:

```tsx
import { useBadgeCount } from './src/hooks/useBadgeCount';

function HabitsScreen() {
  const { data: habits } = useHabitsQuery();

  // Actualizar badge automáticamente
  useBadgeCount({
    items: habits?.map(h => ({ id: h.id, completed: h.completedToday })) ?? [],
    autoUpdate: true,
    autoClear: true,
  });

  return (
    // ... UI
  );
}
```

---

## ⚙️ Integración de Settings

### Agregar el componente a la pantalla de configuración:

```tsx
import { NotificationSettings } from './src/components/NotificationSettings';

function SettingsScreen() {
  const handleNotificationsToggled = (enabled: boolean) => {
    console.log('Notificaciones:', enabled ? 'habilitadas' : 'deshabilitadas');
    // Opcional: Actualizar estado global, analytics, etc.
  };

  return (
    <ScrollView>
      {/* ... otros settings ... */}

      <NotificationSettings onNotificationsToggled={handleNotificationsToggled} />

      {/* ... otros settings ... */}
    </ScrollView>
  );
}
```

---

## 🔔 Deep Linking Personalizado

El hook `usePushNotifications` ya incluye deep linking básico. Para personalizarlo:

```tsx
// Editar src/hooks/usePushNotifications.ts

const handleNotificationNavigation = (data: NotificationData) => {
  switch (data.type) {
    case 'habit_reminder':
      navigation.navigate('Habits', {
        highlightHabitId: data.habitId,
        // Agregar más parámetros si es necesario
      });
      break;

    case 'custom_type':
      // Agregar tu lógica de navegación personalizada
      break;
  }
};
```

---

## 🎨 Personalización del Canal Android

Para personalizar el comportamiento de notificaciones en Android:

```tsx
import { setupAndroidNotificationChannel } from './src/services/push-notifications';
import * as Notifications from 'expo-notifications';

// Personalizar al iniciar la app
async function customizeNotificationChannel() {
  await Notifications.setNotificationChannelAsync('habits', {
    name: 'Recordatorios de Hábitos',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 500, 250, 500],
    lightColor: '#FF5722',
    sound: 'notification_sound.wav', // Archivo en assets
  });
}
```

---

## 🧪 Testing

### Testing Manual:

1. **Verificar registro:**

   ```tsx
   const { isRegistered, expoPushToken } = usePushNotifications();
   console.log('Registered:', isRegistered);
   console.log('Token:', expoPushToken);
   ```

2. **Enviar notificación de prueba desde backend:**

   ```bash
   curl -X POST http://localhost:3001/api/push/test \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{
       "title": "Test Notification",
       "body": "This is a test push notification"
     }'
   ```

3. **Verificar navegación:**
   - Tocar la notificación
   - Verificar que navega a la pantalla correcta
   - Verificar que el item se resalta (si aplica)

---

## 🐛 Troubleshooting

### Problema: "Push notifications not available"

**Causa:** Estás usando un emulador o la web.

**Solución:** Usa un dispositivo físico real.

---

### Problema: "Permisos denegados"

**Causa:** Usuario denegó permisos de notificaciones.

**Solución:**

1. Ir a Settings del dispositivo
2. Buscar la app Horus
3. Habilitar notificaciones

O usar el componente `NotificationSettings` que tiene un botón para abrir Settings.

---

### Problema: "Token no se registra en backend"

**Causa:** Error de autenticación o backend no disponible.

**Solución:**

1. Verificar que el backend está corriendo
2. Verificar que el token de autenticación es válido
3. Revisar logs del backend para ver errores

---

### Problema: "Notificaciones no llegan"

**Posibles causas:**

1. Firebase no está configurado correctamente
2. Proyecto Expo no tiene EAS Project ID configurado
3. Token no está registrado en backend
4. Backend no está enviando notificaciones

**Solución:**

1. Verificar `app.json` tiene el plugin de expo-notifications
2. Verificar Firebase está configurado en backend
3. Verificar token está en base de datos (`PushToken` table)
4. Probar endpoint `/api/push/test` desde Postman

---

## 📚 Referencias

- [Expo Notifications Docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Expo Push Notifications Guide](https://docs.expo.dev/push-notifications/overview/)

---

## ✅ Checklist de Integración

- [ ] Hook `usePushNotifications` agregado en App.tsx
- [ ] Badge count configurado en pantalla principal
- [ ] Componente `NotificationSettings` agregado a Settings
- [ ] Deep linking testeado con notificaciones reales
- [ ] Permisos solicitados correctamente
- [ ] Token registrado en backend verificado
- [ ] Notificaciones de prueba recibidas y funcionando
- [ ] Canal Android personalizado (opcional)
- [ ] Sonidos personalizados (opcional)

---

**¡Listo para recibir notificaciones push!** 🎉
