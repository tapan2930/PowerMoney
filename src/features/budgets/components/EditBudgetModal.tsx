import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { CustomAlert } from '@/components/feedback/CustomAlert';
import { BottomSheet, BottomSheetScrollView, TextInput, Button, SelectField, SegmentedControl } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { styles } from '../styles/budgets.styles';

interface EditBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  budget: any | null;
  categoriesList: any[];
  name: string;
  setName: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  period: 'monthly' | 'weekly';
  setPeriod: (val: 'monthly' | 'weekly') => void;
  handleUpdateBudget: () => void;
  handleDeleteBudget: () => void;
}

export const EditBudgetModal: React.FC<EditBudgetModalProps> = ({
  visible,
  onClose,
  budget,
  categoriesList,
  name,
  setName,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  period,
  setPeriod,
  handleUpdateBudget,
  handleDeleteBudget,
}) => {
  const { colors } = useAppTheme();

  const categoryOptions = useMemo(() => {
    const list = categoriesList.map((c) => ({
      key: c.id,
      label: c.name,
      icon: c.icon || 'tag-outline',
      color: c.color || undefined,
    }));
    return [{ key: '', label: 'Overall Budget (All Categories)', icon: 'apps-outline' }, ...list];
  }, [categoriesList]);

  const onDeletePress = () => {
    CustomAlert.alert(
      'Delete Budget',
      'Are you sure you want to delete this budget? This action is irreversible.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: handleDeleteBudget,
        },
      ]
    );
  };

  return (
    <BottomSheet visible={visible} onClose={onClose} height="65%">
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Budget</Text>

        <TextInput
          label="Budget Name"
          placeholder="e.g. Dining Out Limit"
          value={name}
          onChangeText={setName}
          isBottomSheetInput
        />

        <TextInput
          label="Limit Amount"
          placeholder="0.00"
          keyboardType="numeric"
          value={amount}
          onChangeText={setAmount}
          isBottomSheetInput
        />

        {categoriesList.length > 0 && (
          <SelectField
            label="Link Category"
            value={categoryId}
            options={categoryOptions}
            onSelect={setCategoryId}
            placeholder="Select category"
            searchable
          />
        )}

        <Text style={[styles.label, { color: colors.textSecondary }]}>Period</Text>
        <SegmentedControl
          options={[
            { label: 'MONTHLY', value: 'monthly' },
            { label: 'WEEKLY', value: 'weekly' },
          ]}
          selectedValue={period}
          onChange={setPeriod}
        />

        <View style={{ gap: 12, marginTop: 24, marginBottom: 40 }}>
          <Button
            label="Save Changes"
            onPress={handleUpdateBudget}
            variant="primary"
            style={{ width: '100%' }}
            accessibilityLabel="Save budget changes"
            accessibilityRole="button"
          />

          <Button
            label="Delete Budget"
            onPress={onDeletePress}
            variant="danger"
            style={{ width: '100%' }}
            accessibilityLabel="Delete budget"
            accessibilityRole="button"
          />
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
