/**
 * ChecklistItem Component
 * Sprint 7 - US-063
 *
 * Item de checklist con checkbox y swipe-to-delete
 */

import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, PanResponder } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ChecklistItemProps {
  id: string;
  title: string;
  completed: boolean;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -120;

export const ChecklistItem: React.FC<ChecklistItemProps> = ({
  id,
  title,
  completed,
  onToggle,
  onDelete,
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastSwipeValue = useRef(0);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Solo activar si es un swipe horizontal
        return (
          Math.abs(gestureState.dx) > 10 && Math.abs(gestureState.dx) > Math.abs(gestureState.dy)
        );
      },
      onPanResponderMove: (_, gestureState) => {
        // Solo permitir swipe a la izquierda (valores negativos)
        if (gestureState.dx < 0) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < DELETE_THRESHOLD) {
          // Si el swipe supera el umbral de eliminación, eliminar directamente
          onDelete(id);
        } else if (gestureState.dx < SWIPE_THRESHOLD) {
          // Si supera el umbral de swipe, mantener el botón visible
          Animated.spring(translateX, {
            toValue: SWIPE_THRESHOLD,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
          lastSwipeValue.current = SWIPE_THRESHOLD;
        } else {
          // Si no, volver a la posición original
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 40,
            friction: 8,
          }).start();
          lastSwipeValue.current = 0;
        }
      },
    })
  ).current;

  const handleToggle = () => {
    // Cerrar el swipe si está abierto
    if (lastSwipeValue.current !== 0) {
      Animated.spring(translateX, {
        toValue: 0,
        useNativeDriver: true,
        tension: 40,
        friction: 8,
      }).start();
      lastSwipeValue.current = 0;
    }
    onToggle(id);
  };

  const handleDelete = () => {
    onDelete(id);
  };

  return (
    <View style={styles.container}>
      {/* Delete Button (Background) */}
      <View style={styles.deleteContainer}>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Ionicons name="trash" size={20} color="#FFF" />
          <Text style={styles.deleteText}>Eliminar</Text>
        </TouchableOpacity>
      </View>

      {/* Swipeable Item */}
      <Animated.View
        style={[
          styles.itemContainer,
          {
            transform: [{ translateX }],
          },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={[styles.item, completed && styles.itemCompleted]}
          onPress={handleToggle}
          activeOpacity={0.7}
        >
          {/* Checkbox */}
          <View style={[styles.checkbox, completed && styles.checkboxChecked]}>
            {completed && <Ionicons name="checkmark" size={18} color="#FFF" />}
          </View>

          {/* Title */}
          <Text style={[styles.title, completed && styles.titleCompleted]} numberOfLines={2}>
            {title}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 8,
    height: 56,
  },
  deleteContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D32F2F',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  deleteText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
    marginLeft: 6,
  },
  itemContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#FFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    height: '100%',
  },
  itemCompleted: {
    backgroundColor: '#F5F5F5',
    borderColor: '#CCCCCC',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  checkboxChecked: {
    backgroundColor: '#4CAF50',
    borderColor: '#4CAF50',
  },
  title: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    fontWeight: '500',
  },
  titleCompleted: {
    color: '#999',
    textDecorationLine: 'line-through',
  },
});
