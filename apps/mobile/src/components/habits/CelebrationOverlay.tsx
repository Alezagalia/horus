/**
 * CelebrationOverlay Component
 * Sprint 4 - US-034
 *
 * Displays celebration animations when habits are completed:
 * - Confetti animation for streaks > 5 days
 * - Special message for personal records
 * - Celebratory badges and effects
 */

import { useEffect, useRef, useState } from 'react';
import { Text, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface CelebrationOverlayProps {
  visible: boolean;
  celebrationType: 'completion' | 'streak' | 'record';
  streakCount?: number;
  habitName?: string;
  onDismiss: () => void;
}

export const CelebrationOverlay = ({
  visible,
  celebrationType,
  streakCount = 0,
  habitName = '',
  onDismiss,
}: CelebrationOverlayProps) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const [confettiPieces] = useState(() => generateConfetti(30));

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-dismiss after 3 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);

      return () => clearTimeout(timer);
    }

    // Reset animations when not visible
    fadeAnim.setValue(0);
    scaleAnim.setValue(0);
    return undefined;
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  if (!visible) return null;

  const getMessage = () => {
    switch (celebrationType) {
      case 'record':
        return {
          emoji: '🏆',
          title: '¡Nuevo Récord Personal!',
          subtitle: `¡${streakCount} días seguidos! Sigue así`,
        };
      case 'streak':
        return {
          emoji: '🔥',
          title: `¡${streakCount} días de racha!`,
          subtitle: `"${habitName}" va increíble`,
        };
      case 'completion':
      default:
        return {
          emoji: '✨',
          title: '¡Completado!',
          subtitle: 'Sigue así, vas muy bien',
        };
    }
  };

  const message = getMessage();
  const showConfetti = celebrationType === 'streak' || celebrationType === 'record';

  return (
    <TouchableWithoutFeedback onPress={handleDismiss}>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Confetti Animation (only for streak/record) */}
        {showConfetti &&
          confettiPieces.map((piece, index) => (
            <ConfettiPiece key={index} piece={piece} fadeAnim={fadeAnim} />
          ))}

        {/* Celebration Message */}
        <Animated.View
          style={[
            styles.messageContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Text style={styles.emoji}>{message.emoji}</Text>
          <Text style={styles.title}>{message.title}</Text>
          <Text style={styles.subtitle}>{message.subtitle}</Text>
          <Text style={styles.tapToDismiss}>Toca para continuar</Text>
        </Animated.View>
      </Animated.View>
    </TouchableWithoutFeedback>
  );
};

// Helper: Generate random confetti pieces
function generateConfetti(count: number) {
  const colors = ['#FF6B6B', '#4ECDC4', '#FFD93D', '#6BCF7F', '#A29BFE', '#FD79A8'];
  const pieces = [];

  for (let i = 0; i < count; i++) {
    pieces.push({
      x: Math.random() * SCREEN_WIDTH,
      y: -50 - Math.random() * 100,
      color: colors[Math.floor(Math.random() * colors.length)],
      size: 8 + Math.random() * 8,
      rotation: Math.random() * 360,
      duration: 2000 + Math.random() * 1000,
      delay: Math.random() * 500,
    });
  }

  return pieces;
}

// Confetti Piece Component
interface ConfettiPieceProps {
  piece: {
    x: number;
    y: number;
    color: string;
    size: number;
    rotation: number;
    duration: number;
    delay: number;
  };
  fadeAnim: Animated.Value;
}

const ConfettiPiece = ({ piece, fadeAnim }: ConfettiPieceProps) => {
  const fallAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fallAnim, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: piece.duration,
        delay: piece.delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const translateY = fallAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [piece.y, SCREEN_HEIGHT + 50],
  });

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', `${piece.rotation * 4}deg`],
  });

  return (
    <Animated.View
      style={[
        styles.confettiPiece,
        {
          left: piece.x,
          width: piece.size,
          height: piece.size,
          backgroundColor: piece.color,
          opacity: fadeAnim,
          transform: [{ translateY }, { rotate }],
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  confettiPiece: {
    position: 'absolute',
    borderRadius: 4,
  },
  messageContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    maxWidth: SCREEN_WIDTH * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#212121',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 16,
  },
  tapToDismiss: {
    fontSize: 13,
    color: '#999',
    marginTop: 8,
  },
});
