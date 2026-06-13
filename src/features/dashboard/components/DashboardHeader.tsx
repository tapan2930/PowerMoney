import React from 'react';
import { View, Text } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui';
import { styles } from '../styles/dashboard.styles';

interface DashboardHeaderProps {
  userName: string | null;
  colors: {
    background: string;
    text: string;
    textSecondary: string;
    primary: string;
  };
}

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({ userName, colors }) => {
  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return 'Good Morning';
    if (hrs < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleChatPress = () => router.push('/chat');
  const handlePreferencesPress = () => router.push('/preferences');

  return (
    <View style={styles.header}>
      <View>
        <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
        <Text style={[styles.name, { color: colors.text }]}>{userName || 'Finance Buddy'}</Text>
      </View>
      <View style={styles.headerActions}>
        <Button
          label=""
          onPress={handleChatPress}
          variant="secondary"
          size="sm"
          leftIcon={<Ionicons name="chatbubble-ellipses" size={20} color={colors.primary} />}
          style={styles.headerButton}
          accessibilityLabel="Open chat"
          accessibilityRole="button"
        />
        <Button
          label=""
          onPress={handlePreferencesPress}
          variant="secondary"
          size="sm"
          leftIcon={<Ionicons name="settings-outline" size={20} color={colors.primary} />}
          style={styles.headerButton}
          accessibilityLabel="Open settings"
          accessibilityRole="button"
        />
      </View>
    </View>
  );
};
