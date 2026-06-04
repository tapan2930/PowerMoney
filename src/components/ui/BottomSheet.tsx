import React, { useMemo } from 'react';
import { StyleSheet, View, DimensionValue, useWindowDimensions } from 'react-native';
import NativeBottomSheet, { BottomSheetScrollView as NativeBottomSheetScrollView } from '@expo/ui/community/bottom-sheet';
import { useAppTheme } from '@/hooks/useAppTheme';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  height?: DimensionValue;
}

export function BottomSheet({
  visible,
  onClose,
  children,
  height,
}: BottomSheetProps) {
  const { colors } = useAppTheme();
  const { height: windowHeight } = useWindowDimensions();

  // Resolve percentages to absolute pixel heights to avoid circular layout dependencies in native sheets
  const resolvedHeight = useMemo(() => {
    if (height === undefined || height === null) return undefined;
    if (typeof height === 'number') return height;
    if (typeof height === 'string' && height.endsWith('%')) {
      const percentage = parseFloat(height) / 100;
      if (!isNaN(percentage)) {
        return percentage * windowHeight;
      }
    }
    return undefined;
  }, [height, windowHeight]);

  if (!visible) return null;

  return (
    <NativeBottomSheet
      index={0}
      onClose={onClose}
      onDismiss={onClose}
      enablePanDownToClose
      backgroundStyle={{
        backgroundColor: colors.background,
      }}
    >
      <View style={resolvedHeight ? { height: resolvedHeight } : styles.dynamicContentContainer}>
        {children}
      </View>
    </NativeBottomSheet>
  );
}

// Export specialized scroll view to resolve gesture conflicts
export const BottomSheetScrollView = NativeBottomSheetScrollView;

const styles = StyleSheet.create({
  dynamicContentContainer: {
    // Omit flex/height so that the sheet natively sizes to wrap content
  },
});
