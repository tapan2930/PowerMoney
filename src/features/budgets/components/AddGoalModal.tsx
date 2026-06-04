import React from 'react';
import { BottomSheet, BottomSheetScrollView, TextInput, Button, DatePickerField } from '@/components/ui';
import { Text } from 'react-native';
import { useAppTheme } from '@/hooks/useAppTheme';
import { styles } from '../styles/budgets.styles';

interface AddGoalModalProps {
  visible: boolean;
  onClose: () => void;
  name: string;
  setName: (val: string) => void;
  targetAmount: string;
  setTargetAmount: (val: string) => void;
  currentAmount: string;
  setCurrentAmount: (val: string) => void;
  deadline: string;
  setDeadline: (val: string) => void;
  handleAddGoal: () => void;
}

export const AddGoalModal: React.FC<AddGoalModalProps> = ({
  visible,
  onClose,
  name,
  setName,
  targetAmount,
  setTargetAmount,
  currentAmount,
  setCurrentAmount,
  deadline,
  setDeadline,
  handleAddGoal,
}) => {
  const { colors } = useAppTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} height="65%">
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>New Savings Goal</Text>

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
          label="Current Savings (Optional)"
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

        <Button
          label="Create Goal"
          onPress={handleAddGoal}
          variant="primary"
          style={styles.saveBtn}
          accessibilityLabel="Create savings goal"
          accessibilityRole="button"
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
