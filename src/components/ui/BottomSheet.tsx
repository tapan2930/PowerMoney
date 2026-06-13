import { useAppTheme } from '@/hooks/useAppTheme';
import NativeBottomSheet, { BottomSheetScrollView as NativeBottomSheetScrollView } from '@expo/ui/community/bottom-sheet';
import React, { useMemo, useState, useEffect } from 'react';
import { DimensionValue, StyleSheet, useWindowDimensions, View } from 'react-native';

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

  // Internal state to track if the sheet should be mounted/rendered in the JSX tree
  const [isMounted, setIsMounted] = useState(visible);

  // Sync visible prop to isMounted
  useEffect(() => {
    if (visible) {
      setIsMounted(true);
    }
  }, [visible]);

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

  const handleClose = () => {
    // When the sheet finishes closing or is dismissed, we unmount it
    setIsMounted(false);
    if (visible) {
      onClose();
    }
  };

  // If not visible and not mounted, don't render anything
  if (!isMounted) return null;

  return (
    <NativeBottomSheet
      index={visible ? 0 : -1}
      onClose={handleClose}
      onDismiss={handleClose}
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
