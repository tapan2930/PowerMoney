import { BottomSheet, BottomSheetScrollView, Button } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import React from 'react';
import { Text, View } from 'react-native';
import { styles } from '../styles/accounts.styles';
import { Category } from '../types';

interface CategorySelectModalProps {
  visible: boolean;
  onClose: () => void;
  categoriesList: Category[];
  onSelectCategory: (categoryId: string) => void;
}

export const CategorySelectModal: React.FC<CategorySelectModalProps> = ({
  visible,
  onClose,
  categoriesList,
  onSelectCategory,
}) => {
  const { colors } = useAppTheme();

  return (
    <BottomSheet visible={visible} onClose={onClose} height="50%">
      <BottomSheetScrollView style={styles.modalContent} keyboardShouldPersistTaps="handled">
        <Text style={[styles.modalTitle, { color: colors.text }]}>Select Category</Text>
        <View style={styles.optionsRow}>
          {categoriesList.map((c) => (
            <Button
              key={c.id}
              label={`${c.icon || '🏷️'} ${c.name}`}
              onPress={() => onSelectCategory(c.id)}
              variant="outline"
              size="sm"
              style={styles.categorySelectItemBtn}
              accessibilityLabel={`Select category ${c.name}`}
              accessibilityRole="button"
            />
          ))}
        </View>
      </BottomSheetScrollView>
    </BottomSheet>
  );
};
