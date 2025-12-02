/**
 * HabitsListScreenWrapper - Navigation Wrapper
 * Sprint 3 - US-023, US-025
 */

import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { HabitsListScreen } from './HabitsListScreen';

type RootStackParamList = {
  HabitsList: undefined;
  HabitForm: { habitId?: string };
  HabitDetail: { habitId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HabitsList'>;

export function HabitsListScreenWrapper({ navigation }: Props) {
  const handleCreateHabit = () => {
    navigation.navigate('HabitForm', {});
  };

  const handleHabitPress = (habitId: string) => {
    navigation.navigate('HabitDetail', { habitId });
  };

  return <HabitsListScreen onCreateNew={handleCreateHabit} onHabitPress={handleHabitPress} />;
}
