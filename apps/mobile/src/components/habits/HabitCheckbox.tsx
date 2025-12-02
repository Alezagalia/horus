/**
 * HabitCheckbox Component
 * Sprint 4 - US-033, US-034
 *
 * Large tactile checkbox for marking CHECK habits as completed/incomplete
 * Includes animation, haptic feedback, and celebration effects
 */

import { TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';

interface HabitCheckboxProps {
  checked: boolean;
  onToggle: () => void;
  color?: string;
  disabled?: boolean;
  onCelebrate?: () => void; // Called when checked becomes true (US-034)
}

export const HabitCheckbox = ({
  checked,
  onToggle,
  color = '#4CAF50',
  disabled = false,
  onCelebrate,
}: HabitCheckboxProps) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(checked ? 1 : 0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const prevCheckedRef = useRef(checked);

  useEffect(() => {
    // Animate check icon
    Animated.spring(checkAnim, {
      toValue: checked ? 1 : 0,
      useNativeDriver: true,
      tension: 80,
      friction: 7,
    }).start();

    // US-034: Celebration effect when checking (not unchecking)
    if (checked && !prevCheckedRef.current) {
      // Scale up animation (celebration)
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.3,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Glow effect
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start();

      // Trigger celebration callback
      onCelebrate?.();
    }

    prevCheckedRef.current = checked;
  }, [checked]);

  const handlePress = () => {
    if (disabled) return;

    // Haptic feedback would go here

    // Scale animation on press
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onToggle();
  };

  const checkIconStyle = {
    transform: [
      { scale: checkAnim },
      {
        rotate: checkAnim.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        }),
      },
    ],
  };

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['rgba(76, 175, 80, 0)', 'rgba(76, 175, 80, 0.4)'],
  });

  return (
    <Animated.View
      style={[
        styles.container,
        {
          shadowColor: glowColor,
          shadowOpacity: glowAnim,
          shadowRadius: glowAnim.interpolate({
            inputRange: [0, 1],
            outputRange: [0, 20],
          }),
        },
      ]}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          style={[
            styles.checkbox,
            checked && styles.checkboxChecked,
            { borderColor: color, backgroundColor: checked ? color : '#fff' },
            disabled && styles.disabled,
          ]}
          onPress={handlePress}
          disabled={disabled}
          activeOpacity={0.7}
        >
          <Animated.Text style={[styles.checkIcon, checkIconStyle]}>
            {checked ? '✓' : ''}
          </Animated.Text>
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    elevation: 3,
  },
  checkbox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    borderWidth: 0,
  },
  checkIcon: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
  },
  disabled: {
    opacity: 0.5,
  },
});
