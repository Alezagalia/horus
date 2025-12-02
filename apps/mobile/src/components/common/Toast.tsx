/**
 * Toast Component
 * Sprint 2 - US-016, Sprint 3 - US-024
 *
 * Toast notification system with optional action button
 */

import { useEffect } from 'react';
import { Text, StyleSheet, Animated, TouchableOpacity, View } from 'react-native';

interface ToastAction {
  label: string;
  onPress: () => void;
}

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  visible: boolean;
  onHide?: () => void;
  onDismiss?: () => void;
  action?: ToastAction;
  duration?: number;
}

export const Toast = ({
  message,
  type = 'info',
  visible,
  onHide,
  onDismiss,
  action,
  duration = 3000,
}: ToastProps) => {
  const opacity = new Animated.Value(0);
  const handleHide = onHide || onDismiss;

  useEffect(() => {
    if (visible) {
      // Fade in
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      // Auto hide after specified duration
      const timer = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => {
          handleHide?.();
        });
      }, duration);

      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, handleHide, opacity, duration]);

  if (!visible) return null;

  const getIcon = () => {
    if (type === 'success') return '✓';
    if (type === 'error') return '✕';
    return 'ℹ';
  };

  const getBackgroundColor = () => {
    if (type === 'success') return styles.success;
    if (type === 'error') return styles.error;
    return styles.info;
  };

  return (
    <Animated.View style={[styles.container, getBackgroundColor(), { opacity }]}>
      <View style={styles.content}>
        <Text style={styles.icon}>{getIcon()}</Text>
        <Text style={styles.message}>{message}</Text>
      </View>
      {action && (
        <TouchableOpacity style={styles.actionButton} onPress={action.onPress}>
          <Text style={styles.actionText}>{action.label}</Text>
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  success: {
    backgroundColor: '#4CAF50',
  },
  error: {
    backgroundColor: '#F44336',
  },
  info: {
    backgroundColor: '#2196F3',
  },
  icon: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
    marginRight: 12,
  },
  message: {
    flex: 1,
    fontSize: 15,
    color: '#fff',
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginLeft: 12,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
});
