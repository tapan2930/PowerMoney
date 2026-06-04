import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { Card, ProgressBar } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { Goal } from '../hooks/useBudgetsData';
import { styles } from '../styles/budgets.styles';

interface GoalCardProps {
  goal: Goal;
  onPress: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({ goal, onPress }) => {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();
  const progress = goal.targetAmount > 0 ? goal.currentAmount / goal.targetAmount : 0;

  return (
    <Pressable
      onPress={onPress}
      accessibilityLabel={`Edit savings goal ${goal.name}`}
      accessibilityRole="button"
    >
      <Card style={styles.progressCard} padding={16}>
        <View style={styles.cardHeader}>
          <Text style={[styles.cardName, { color: colors.text }]}>{goal.name}</Text>
          <Text style={[styles.cardRatio, { color: colors.secondary }]}>
            {Math.round(progress * 100)}%
          </Text>
        </View>

        <ProgressBar progress={progress} style={styles.progressBar} />

        <View style={styles.cardFooter}>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Saved:{' '}
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {currency === 'USD' ? '$' : ''}
              {goal.currentAmount.toFixed(2)}
            </Text>
          </Text>
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            Target:{' '}
            <Text style={{ color: colors.text, fontWeight: '700' }}>
              {currency === 'USD' ? '$' : ''}
              {goal.targetAmount}
            </Text>
          </Text>
        </View>
        
        {goal.deadline && (
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.dateText, { color: colors.textSecondary }]}>
              Deadline: {goal.deadline}
            </Text>
          </View>
        )}
      </Card>
    </Pressable>
  );
};
