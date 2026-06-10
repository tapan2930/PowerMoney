import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { CustomAlert } from '@/components/feedback/CustomAlert';

interface SectionTitleWithInfoProps {
  title: string;
  info: string;
  style?: any;
}

export function SectionTitleWithInfo({ title, info, style }: SectionTitleWithInfoProps) {
  const { colors } = useAppTheme();

  const handleInfoPress = () => {
    CustomAlert.alert(title, info, [{ text: 'Got it' }]);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
      <Pressable
        onPress={handleInfoPress}
        accessibilityRole="button"
        accessibilityLabel={`Info about ${title}`}
        hitSlop={8}
        style={({ pressed }) => [styles.infoButton, { opacity: pressed ? 0.5 : 1 }]}
      >
        <Ionicons name="information-circle-outline" size={18} color={colors.textSecondary} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
  },
  infoButton: {
    padding: 2,
  },
});
