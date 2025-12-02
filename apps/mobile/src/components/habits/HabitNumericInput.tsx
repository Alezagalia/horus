/**
 * HabitNumericInput Component
 * Sprint 4 - US-033, US-034
 *
 * Input component for NUMERIC habits with:
 * - +/- buttons for quick increment/decrement
 * - Direct numeric input
 * - Progress bar showing current/target
 * - Auto-completion animation when target is reached
 * - Celebration callback for US-034
 */

import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';

interface HabitNumericInputProps {
  value: number;
  targetValue?: number;
  unit?: string;
  onIncrement: () => void;
  onDecrement: () => void;
  onValueChange: (value: number) => void;
  disabled?: boolean;
  color?: string;
  onCelebrate?: () => void; // Called when target is reached (US-034)
}

export const HabitNumericInput = ({
  value,
  targetValue,
  unit = '',
  onIncrement,
  onDecrement,
  onValueChange,
  disabled = false,
  color = '#2196F3',
  onCelebrate,
}: HabitNumericInputProps) => {
  const [inputValue, setInputValue] = useState(value.toString());
  const [showCompleted, setShowCompleted] = useState(false);
  const progressAnim = useRef(new Animated.Value(0)).current;
  const completeAnim = useRef(new Animated.Value(0)).current;
  const prevCompletedRef = useRef(false);

  const progressPercentage = targetValue ? Math.min(100, (value / targetValue) * 100) : 0;
  const isCompleted = targetValue ? value >= targetValue : false;

  useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  useEffect(() => {
    // Animate progress bar
    Animated.spring(progressAnim, {
      toValue: progressPercentage,
      useNativeDriver: false,
      tension: 50,
      friction: 7,
    }).start();
  }, [progressPercentage]);

  useEffect(() => {
    // Show completion animation when target is reached
    if (isCompleted && !showCompleted) {
      setShowCompleted(true);
      // Haptic feedback would go here

      // US-034: Trigger celebration when first completing (not on reload)
      if (!prevCompletedRef.current) {
        onCelebrate?.();
      }

      Animated.sequence([
        Animated.timing(completeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(completeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => setShowCompleted(false));
    }

    prevCompletedRef.current = isCompleted;
  }, [isCompleted]);

  const handleIncrement = () => {
    if (disabled) return;
    // Haptic feedback would go here
    onIncrement();
  };

  const handleDecrement = () => {
    if (disabled) return;
    if (value > 0) {
      // Haptic feedback would go here
      onDecrement();
    }
  };

  const handleInputChange = (text: string) => {
    setInputValue(text);
    const numValue = parseFloat(text);
    if (!isNaN(numValue) && numValue >= 0) {
      onValueChange(numValue);
    }
  };

  const handleBlur = () => {
    // Reset to current value if input is invalid
    if (inputValue === '' || isNaN(parseFloat(inputValue))) {
      setInputValue(value.toString());
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.container}>
      {/* Controls Row */}
      <View style={styles.controlsRow}>
        {/* Decrement Button */}
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={handleDecrement}
          disabled={disabled || value <= 0}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>−</Text>
        </TouchableOpacity>

        {/* Value Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            value={inputValue}
            onChangeText={handleInputChange}
            onBlur={handleBlur}
            keyboardType="numeric"
            editable={!disabled}
            selectTextOnFocus
          />
          {targetValue && (
            <Text style={styles.targetText}>
              / {targetValue} {unit}
            </Text>
          )}
        </View>

        {/* Increment Button */}
        <TouchableOpacity
          style={[styles.button, disabled && styles.disabled]}
          onPress={handleIncrement}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>+</Text>
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      {targetValue && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBarBackground}>
            <Animated.View
              style={[styles.progressBarFill, { width: progressWidth, backgroundColor: color }]}
            />
          </View>
          <Text style={styles.progressPercentage}>{Math.round(progressPercentage)}%</Text>
        </View>
      )}

      {/* Completion Badge (animated) */}
      {showCompleted && (
        <Animated.View
          style={[
            styles.completionBadge,
            {
              opacity: completeAnim,
              transform: [
                {
                  scale: completeAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.completionText}>🎉 ¡Objetivo alcanzado!</Text>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  controlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#2196F3',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 12,
  },
  input: {
    fontSize: 32,
    fontWeight: '700',
    color: '#212121',
    textAlign: 'center',
    minWidth: 60,
    paddingHorizontal: 8,
  },
  targetText: {
    fontSize: 18,
    color: '#666',
    marginLeft: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercentage: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    minWidth: 45,
    textAlign: 'right',
  },
  completionBadge: {
    backgroundColor: '#4CAF50',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginTop: 8,
    alignSelf: 'center',
  },
  completionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
