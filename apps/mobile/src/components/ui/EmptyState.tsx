import { ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Card } from '@/components/ui/Card';
import { Colors, Spacing, Radius } from '@/tokens';

interface Props {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

/**
 * Estado vacío unificado: cada lista sin datos es una oportunidad de enseñar
 * la app — siempre que se pueda, pasar `ctaLabel`/`onCta` con la acción de
 * creación correspondiente.
 */
export function EmptyState({ icon, title, subtitle, ctaLabel, onCta }: Props) {
  return (
    <Card solid style={styles.card}>
      {icon ? <View style={styles.icon}>{icon}</View> : null}
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      {ctaLabel && onCta ? (
        <TouchableOpacity style={styles.cta} onPress={onCta} activeOpacity={0.85}>
          <Text style={styles.ctaText}>{ctaLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    paddingVertical: Spacing['2xl'],
    gap: Spacing.sm,
  },
  icon: {
    marginBottom: 2,
  },
  title: {
    fontFamily: 'Inter_600SemiBold',
    fontSize: 14,
    color: Colors.ink,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter_400Regular',
    fontSize: 13,
    lineHeight: 18,
    color: Colors.muted,
    textAlign: 'center',
    maxWidth: 280,
  },
  cta: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.vivid,
    borderRadius: Radius.pill,
    paddingVertical: 10,
    paddingHorizontal: Spacing.xl,
  },
  ctaText: {
    fontFamily: 'Inter_700Bold',
    fontSize: 13,
    color: '#fff',
  },
});
