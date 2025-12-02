/**
 * HabitFormScreenWrapper - Navigation Wrapper
 * Sprint 3 - US-023
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HabitFormScreen } from './HabitFormScreen';

type RootStackParamList = {
  HabitsList: undefined;
  HabitForm: { habitId?: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HabitForm'>;

export function HabitFormScreenWrapper({ navigation, route }: Props) {
  const { habitId } = route.params;

  const handleSuccess = () => {
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return <HabitFormScreen habitId={habitId} onSuccess={handleSuccess} onCancel={handleCancel} />;
}
