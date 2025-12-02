/**
 * HabitDetailScreenWrapper - Navigation Wrapper
 * Sprint 3 - US-025, US-024
 * Sprint 6 - US-052: Added audit history navigation
 */

import { useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { HabitDetailScreen } from './HabitDetailScreen';
import { Toast } from '../components/common/Toast';
import { updateHabit } from '../api/habits.api';

type RootStackParamList = {
  HabitsList: undefined;
  HabitForm: { habitId?: string };
  HabitDetail: { habitId: string };
  HabitStats: { habitId: string };
  HabitAudit: { habitId: string };
};

type Props = NativeStackScreenProps<RootStackParamList, 'HabitDetail'>;

export function HabitDetailScreenWrapper({ navigation, route }: Props) {
  const { habitId } = route.params;
  const queryClient = useQueryClient();
  const [showUndoToast, setShowUndoToast] = useState(false);
  const undoTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Mutation to reactivate habit (undo delete)
  const reactivateMutation = useMutation({
    mutationFn: () => updateHabit(habitId, { isActive: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] });
      queryClient.invalidateQueries({ queryKey: ['habit', habitId] });
    },
  });

  const handleEdit = () => {
    navigation.navigate('HabitForm', { habitId });
  };

  const handleDelete = () => {
    // Show toast with undo action
    setShowUndoToast(true);

    // Navigate back immediately
    navigation.goBack();

    // Set timer to clear toast after 5 seconds
    undoTimerRef.current = setTimeout(() => {
      setShowUndoToast(false);
    }, 5000);
  };

  const handleUndo = () => {
    // Clear timeout
    if (undoTimerRef.current) {
      clearTimeout(undoTimerRef.current);
    }

    // Hide toast
    setShowUndoToast(false);

    // Reactivate habit
    reactivateMutation.mutate();
  };

  const handleViewStats = () => {
    navigation.navigate('HabitStats', { habitId });
  };

  const handleViewAudit = () => {
    navigation.navigate('HabitAudit', { habitId });
  };

  return (
    <View style={styles.container}>
      <HabitDetailScreen
        habitId={habitId}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onViewStats={handleViewStats}
        onViewAudit={handleViewAudit}
      />
      <Toast
        message="Hábito eliminado"
        type="success"
        visible={showUndoToast}
        onHide={() => setShowUndoToast(false)}
        duration={5000}
        action={{
          label: 'Deshacer',
          onPress: handleUndo,
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
