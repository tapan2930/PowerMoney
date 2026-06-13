import { CustomAlert } from '@/components/feedback/CustomAlert';
import { BottomSheet, BottomSheetScrollView, Button, DatePickerField, TextInput } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import React from 'react';
import { Text, View } from 'react-native';
import { Goal } from '../hooks/useBudgetsData';
import { styles } from '../styles/budgets.styles';

interface EditGoalModalProps {
  visible: boolean;
  onClose: () => void;
  goal: Goal | null;
  name: string;
  setName: (val: string) => void;
  targetAmount: string;
  setTargetAmount: (val: string) => void;
  currentAmount: string;
  setCurrentAmount: (val: string) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  handleUpdateGoal: () => void;
  handleToggleCompleted: (completed: boolean) => void;
  handleDeleteGoal: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  visible,
  onClose,
  goal,
  name,
  setName,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  deadline,
  setDeadline,
  handleUpdateGoal,
  handleToggleCompleted,
  handleDeleteGoal,
}) => {
  const { colors } = useAppTheme();

  const onDeletePress = () => {
    CustomAlert.alert(
      'Delete Savings Goal',
      'Are you sure you want to delete this savings goal? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDeleteGoal,
        },
      ]
    );
  };

  const onToggleCompletePress = () => {
    const isCompleted = goal?.isCompleted ?? false;
    CustomAlert.alert(
      isCompleted ? 'Mark Active' : 'Mark Completed',
      isCompleted
        ? 'Do you want to move this savings goal back to active targets?'
        : 'Do you want to mark this goal as completed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isCompleted ? 'Make Active' : 'Complete',
          onPress: () => handleToggleCompleted(!isCompleted),
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} >
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Savings Goal</Text>

        <TextInput
          label="Goal Name"
          placeholder="e.g. New Macbook Pro"
          value={name}
          onChangeText={setName}
          isBottomSheetInput
        />

        <TextInput
          label="Target Amount"
          placeholder="0.00"
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={setTargetAmount}
          isBottomSheetInput
        />

        <TextInput
          label="Current Savings"
          placeholder="0.00"
          keyboardType="numeric"
          value={currentAmount}
          onChangeText={setCurrentAmount}
          isBottomSheetInput
        />

        <DatePickerField
          label="Deadline Date"
          value={deadline}
          onChange={setDeadline}
        />

        <View style={{ gap: 12, marginTop: 24, marginBottom: 40 }}>
          <Button
            label="Save Changes"
            onPress={handleUpdateGoal}
            variant="primary"
            style={{ width: '100%' }}
            accessibilityLabel="Save goal changes"
            accessibilityRole="button"
          />

          <View style={{ flexDirection: 'row', gap: 12 }}>
            <Button
              label={goal?.isCompleted ? "Make Active" : "Complete"}
              onPress={onToggleCompletePress}
              variant="outline"
              style={{ flex: 1 }}
              accessibilityLabel="Toggle goal completion"
              accessibilityRole="button"
            />

            <Button
              label="Delete"
              onPress={onDeletePress}
              variant="danger"
              style={{ flex: 1 }}
              accessibilityLabel="Delete goal"
              accessibilityRole="button"
            />
          </View>
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
