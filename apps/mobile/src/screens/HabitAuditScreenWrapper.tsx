/**
 * HabitAuditScreenWrapper - Navigation Wrapper
 * Sprint 6 - US-052
 */

import { HabitAuditScreen } from './HabitAuditScreen';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

type RootStackParamList = {
  HabitAudit: { habitId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HabitAudit'>;

export function HabitAuditScreenWrapper({ route }: Props) {
  const { habitId } = route.params;

  return <HabitAuditScreen habitId={habitId} />;
}
