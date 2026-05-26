import { ReactNode } from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { Colors, Radius, Typography, Shadows } from '@/tokens';

interface Props {
  label: string;
  active?: boolean;
  onPress?: () => void;
  badge?: number;
}

export function Chip({ label, active = false, onPress, badge }: Props) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={[styles.chip, active ? styles.active : styles.inactive]}
    >
      <Text style={[styles.label, { color: active ? '#fff' : Colors.ink }]}>{label}</Text>
      {badge != null && badge > 0 && (
        <View
          style={[
            styles.badge,
            { backgroundColor: active ? 'rgba(255,255,255,0.25)' : Colors.ice },
          ]}
        >
          <Text style={[styles.badgeText, { color: active ? '#fff' : Colors.vivid }]}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
  },
  active: {
    backgroundColor: Colors.vivid,
    ...Shadows.cta,
  },
  inactive: {
    backgroundColor: 'rgba(255,255,255,0.7)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.9)',
  },
  label: {
    ...Typography.overline,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.sm,
    minWidth: 18,
    alignItems: 'center',
  },
  badgeText: {
    ...Typography.metaStrong,
    fontFamily: 'Inter_700Bold',
  },
});
