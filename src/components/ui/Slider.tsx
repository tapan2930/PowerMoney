import React, { useRef, useState } from 'react';
import { View, StyleSheet, Text, PanResponder, useColorScheme, LayoutChangeEvent } from 'react-native';
import { Colors } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';

export interface SliderProps {
  value: number;
  onValueChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  valueFormatter?: (value: number) => string;
  disabled?: boolean;
}

export function Slider({
  value,
  onValueChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  valueFormatter = (val) => `${Math.round(val)}`,
  disabled = false,
}: SliderProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  const [trackWidth, setTrackWidth] = useState(0);
  const lastHapticValue = useRef<number>(value);

  const calculateValueFromGesture = (gestureX: number) => {
    if (trackWidth === 0) return value;
    const percentage = Math.min(Math.max(gestureX / trackWidth, 0), 1);
    const rawVal = min + percentage * (max - min);

    // Apply step
    const steppedVal = Math.round(rawVal / step) * step;
    return Math.min(Math.max(steppedVal, min), max);
  };

  const handleValueChange = (newVal: number) => {
    if (newVal !== value) {
      // Trigger haptic feedback if the value changes by a step
      if (Math.abs(newVal - lastHapticValue.current) >= step) {
        Haptics.selection();
        lastHapticValue.current = newVal;
      }
      onValueChange(newVal);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !disabled,
      onMoveShouldSetPanResponder: () => !disabled,
      onPanResponderGrant: (evt, gestureState) => {
        const locationX = evt.nativeEvent.locationX;
        const newVal = calculateValueFromGesture(locationX);
        handleValueChange(newVal);
      },
      onPanResponderMove: (evt, gestureState) => {
        // locationX in gesture moves can be offset, use moveX compared to track absolute position if possible
        // Simple fallback using relative offset or relative movement works, but locationX is the easiest:
        const newVal = calculateValueFromGesture(evt.nativeEvent.locationX);
        handleValueChange(newVal);
      },
    })
  ).current;

  const onLayout = (event: LayoutChangeEvent) => {
    setTrackWidth(event.nativeEvent.layout.width);
  };

  const percentage = trackWidth > 0 ? (value - min) / (max - min) : 0;
  const thumbPosition = percentage * trackWidth;

  return (
    <View style={[styles.container, disabled && styles.disabled]}>
      {label !== undefined && (
        <View style={styles.header}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.valueText, { color: colors.primary, fontWeight: '700' }]}>
            {valueFormatter(value)}
          </Text>
        </View>
      )}

      <View
        style={styles.sliderTrackWrapper}
        {...panResponder.panHandlers}
        onLayout={onLayout}
      >
        <View style={[styles.track, { backgroundColor: colors.border }]}>
          <View
            style={[
              styles.trackFill,
              {
                width: `${percentage * 100}%`,
                backgroundColor: colors.primary,
              },
            ]}
          />
        </View>
        <View
          style={[
            styles.thumb,
            {
              left: Math.max(0, Math.min(thumbPosition - 10, trackWidth - 20)),
              borderColor: colors.primary,
              backgroundColor: colors.surface,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginVertical: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  valueText: {
    fontSize: 14,
  },
  sliderTrackWrapper: {
    height: 30,
    justifyContent: 'center',
    position: 'relative',
  },
  track: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  trackFill: {
    height: '100%',
  },
  thumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    position: 'absolute',
    elevation: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  disabled: {
    opacity: 0.5,
  },
});
