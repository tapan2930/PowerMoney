import { SegmentedControl } from '@/components/ui/SegmentedControl';
import React from 'react';
import { StyleSheet, View } from 'react-native';

export interface FilterTypeSectionProps {
  type: 'all' | 'income' | 'expense' | 'transfer';
  onChange: (type: 'all' | 'income' | 'expense' | 'transfer') => void;
}

export function FilterTypeSection({ type, onChange }: FilterTypeSectionProps) {
  const typeOptions = [
    { label: 'All', value: 'all' },
    { label: 'Income', value: 'income' },
    { label: 'Expense', value: 'expense' },
    { label: 'Transfer', value: 'transfer' },
  ] as const;

  return (
    <View style={styles.container}>
      <SegmentedControl
        options={typeOptions as any}
        selectedValue={type}
        onChange={onChange}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
});
