import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Typography } from '@/tokens';

interface Props {
  progress: number; // 0–1
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
  label?: string;
  sublabel?: string;
  /** 'light' for inside hero cards, 'dark' for light backgrounds */
  theme?: 'light' | 'dark';
}

export function ProgressRing({
  progress,
  size = 90,
  strokeWidth = 9,
  color,
  trackColor,
  label,
  sublabel,
  theme = 'dark',
}: Props) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - Math.min(progress, 1));

  const resolvedColor = color ?? (theme === 'light' ? Colors.ceilLight : Colors.vivid);
  const resolvedTrack =
    trackColor ?? (theme === 'light' ? 'rgba(255,255,255,0.18)' : 'rgba(79,107,176,0.12)');
  const textColor = theme === 'light' ? '#fff' : Colors.deep;

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size} style={styles.svg}>
        {/* Track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedTrack}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={resolvedColor}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      {/* Center content */}
      <View style={styles.center}>
        {label && (
          <Text style={[styles.label, Typography.displaySm, { color: textColor }]}>{label}</Text>
        )}
        {sublabel && (
          <Text style={[styles.sublabel, Typography.micro, { color: textColor, opacity: 0.7 }]}>
            {sublabel}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  svg: { position: 'absolute', top: 0, left: 0 },
  center: { alignItems: 'center' },
  label: { fontFamily: 'Inter_700Bold', textAlign: 'center' },
  sublabel: { fontFamily: 'Inter_500Medium', textAlign: 'center', marginTop: 1 },
});
