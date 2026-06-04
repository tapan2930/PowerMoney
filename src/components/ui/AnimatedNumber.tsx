import { Colors } from '@/constants/theme';
import { useEffect } from 'react';
import { StyleSheet, TextInput, useColorScheme } from 'react-native';
import Animated, {
  useAnimatedProps,
  useDerivedValue,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export interface AnimatedNumberProps {
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  style?: any;
}

export function AnimatedNumber({
  value,
  prefix = '',
  suffix = '',
  decimals = 2,
  style,
}: AnimatedNumberProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const animatedValue = useSharedValue(value);

  useEffect(() => {
    animatedValue.value = withTiming(value, {
      duration: 300,
      easing: Easing.out(Easing.quad),
    });
  }, [value]);

  const formattedText = useDerivedValue(() => {
    const rawValue = animatedValue.value;
    const formatted = rawValue.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,');
    return `${prefix}${formatted}${suffix}`;
  });

  const animatedProps = useAnimatedProps(() => {
    return {
      text: formattedText.value,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      style={[
        styles.text,
        { color: colors.text },
        style,
      ]}
      animatedProps={animatedProps}
      // Provide a default fallback value for initial render/web
      defaultValue={`${prefix}${value.toFixed(decimals)}${suffix}`}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
    fontSize: 24,
    fontWeight: 'bold',
    padding: 0,
    margin: 0,
  },
});
