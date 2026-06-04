import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { BottomSheet, BottomSheetScrollView, TextInput, Button, SelectField } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { styles } from '../styles/budgets.styles';

interface AddBudgetModalProps {
  visible: boolean;
  onClose: () => void;
  categoriesList: any[];
  name: string;
  setName: (val: string) => void;
  amount: string;
  setAmount: (val: string) => void;
  categoryId: string;
  setCategoryId: (val: string) => void;
  period: 'monthly' | 'weekly';
  setPeriod: (val: 'monthly' | 'weekly') => void;
  handleAddBudget: () => void;
}

export const AddBudgetModal: React.FC<AddBudgetModalProps> = ({
  visible,
  onClose,
  categoriesList,
  name,
  setName,
  amount,
  setAmount,
  categoryId,
  setCategoryId,
  period,
  setPeriod,
  handleAddBudget,
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

  return (
    <BottomSheet visible={visible} onClose={onClose} height="60%">
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Add Budget</Text>

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
        <View style={styles.optionsRow}>
          {(['monthly', 'weekly'] as const).map((p) => {
            const isSelected = period === p;
            return (
              <Button
                key={p}
                label={p.toUpperCase()}
                onPress={() => setPeriod(p)}
                variant={isSelected ? 'primary' : 'outline'}
                size="sm"
                style={styles.optionBtn}
                accessibilityLabel={`Select ${p} period`}
                accessibilityRole="button"
              />
            );
          })}
        </View>

        <Button
          label="Save Budget"
          onPress={handleAddBudget}
          variant="primary"
          style={styles.saveBtn}
          accessibilityLabel="Save budget"
          accessibilityRole="button"
        />
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
