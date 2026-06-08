import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Haptics } from '@/utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { useEffect } from 'react';
import { LayoutChangeEvent, Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

export interface SegmentedControlOption<T extends string> {
  label: string;
  value: T;
  icon?: string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentedControlOption<T>[];
  selectedValue: T;
  onChange: (value: T) => void;
  style?: StyleProp<ViewStyle>;
  haptic?: boolean;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onChange,
  style,
  haptic = true,
}: SegmentedControlProps<T>) {
  const { colors } = useAppTheme();
  const activeIndex = options.findIndex((opt) => opt.value === selectedValue);
  const animatedIndex = useSharedValue(activeIndex >= 0 ? activeIndex : 0);
  const containerWidth = useSharedValue(0);

  useEffect(() => {
    if (activeIndex >= 0) {
      animatedIndex.value = withSpring(activeIndex, {
        damping: 45,
        stiffness: 300,
      });
    }
  }, [activeIndex]);

  const handleLayout = (event: LayoutChangeEvent) => {
    containerWidth.value = event.nativeEvent.layout.width;
  };

  const handlePress = (value: T) => {
    if (haptic) {
      Haptics.selection();
    }
    onChange(value);
  };

  const indicatorStyle = useAnimatedStyle(() => {
    // Spacing.one * 2 accounts for container padding (left + right)
    const paddingOffset = Spacing.one * 2;
    const availableWidth = Math.max(0, containerWidth.value - paddingOffset);
    const tabWidth = options.length > 0 ? availableWidth / options.length : 0;
    return {
      width: tabWidth,
      transform: [
        {
          translateX: animatedIndex.value * tabWidth,
        },
      ],
    };
  });

  return (
    <View
      onLayout={handleLayout}
      style={[
        styles.container,
        { backgroundColor: colors.border + '30' },
        style,
      ]}
    >
      {/* Background sliding indicator */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: colors.surface },
          indicatorStyle,
        ]}
      />

      {/* Tab buttons */}
      {options.map((option) => {
        const isSelected = option.value === selectedValue;
        return (
          <Pressable
            key={option.value}
            onPress={() => handlePress(option.value)}
            style={styles.tabButton}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            accessibilityLabel={`Select ${option.label}`}
          >
            <View style={styles.tabContent}>
              {option.icon && (
                <Ionicons
                  name={option.icon as any}
                  size={16}
                  color={isSelected ? colors.primary : colors.textSecondary}
                  style={styles.tabIcon}
                />
              )}
              <Text
                style={[
                  styles.tabLabel,
                  { color: isSelected ? colors.primary : colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: Spacing.one,
    borderRadius: 16,
    position: 'relative',
    alignItems: 'center',
  },
  indicator: {
    position: 'absolute',
    top: Spacing.one,
    bottom: Spacing.one,
    left: Spacing.one,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIcon: {
    marginRight: 6,
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
});
