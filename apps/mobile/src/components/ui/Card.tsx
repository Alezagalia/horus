import { ReactNode } from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors, Radius, Spacing, Shadows } from '@/tokens';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  padding?: number;
  radius?: number;
  /** Use solid white instead of glass (e.g. AccountCard) */
  solid?: boolean;
}

export function Card({
  children,
  style,
  padding = Spacing.lg,
  radius = Radius['3xl'],
  solid = false,
}: Props) {
  if (solid) {
    return <View style={[styles.solid, { padding, borderRadius: radius }, style]}>{children}</View>;
  }

  return (
    <View style={[styles.wrapper, { borderRadius: radius }, Shadows.card, style]}>
      <BlurView intensity={70} tint="light" style={[styles.blur, { borderRadius: radius }]}>
        <View style={[styles.inner, { padding, borderRadius: radius }]}>{children}</View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  blur: { overflow: 'hidden' },
  inner: { backgroundColor: 'transparent' },
  solid: {
    backgroundColor: Colors.surfaceSolid,
    borderWidth: 1,
    borderColor: Colors.line,
    ...Shadows.account,
  },
});
