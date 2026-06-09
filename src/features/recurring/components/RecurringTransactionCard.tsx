import { AmountDisplay, Card } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatRecurrenceLabel, type RecurringTransactionWithDetails } from '../types';

interface RecurringTransactionCardProps {
  item: RecurringTransactionWithDetails;
  onPress: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

export function RecurringTransactionCard({
  item,
  onPress,
  onToggle,
}: RecurringTransactionCardProps) {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();
  const isActive = item.isActive !== false;

  const typeConfig = {
    income: { icon: 'trending-up-outline' as const, color: colors.secondary },
    expense: { icon: 'trending-down-outline' as const, color: colors.danger },
    transfer: { icon: 'swap-horizontal-outline' as const, color: colors.primary },
  };

  const config = typeConfig[item.type] || typeConfig.expense;
  const recurrenceLabel = formatRecurrenceLabel(
    item.frequency,
    item.interval,
  );

  const displayName = item.merchant || item.description || 'Recurring Transaction';

  return (
    <Pressable
      onPress={() => onPress(item.id)}
      accessibilityRole="button"
      accessibilityLabel={`Edit recurring transaction: ${displayName}`}
    >
      <Card
        style={[styles.card, !isActive && styles.cardInactive]}
        padding={14}
      >
        <View style={styles.row}>
          {/* Left: Icon + info */}
          <View style={styles.leftSection}>
            <View style={[styles.iconContainer, { backgroundColor: config.color + '15' }]}>
              <Ionicons name={config.icon} size={20} color={config.color} />
            </View>
            <View style={styles.textCol}>
              <Text
                style={[styles.name, { color: colors.text }]}
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <View style={styles.metaRow}>
                <Ionicons name="repeat-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  {recurrenceLabel}
                </Text>
                {item.type === 'transfer' && item.toAccountName && (
                  <>
                    <Text style={[styles.metaDot, { color: colors.textSecondary }]}>·</Text>
                    <Text style={[styles.metaText, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.accountName} → {item.toAccountName}
                    </Text>
                  </>
                )}
              </View>
              <View style={styles.metaRow}>
                <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                <Text style={[styles.metaText, { color: colors.textSecondary }]}>
                  Next: {item.nextRunDate}
                </Text>
              </View>
            </View>
          </View>

          {/* Right: Amount + status */}
          <View style={styles.rightSection}>
            <AmountDisplay
              amount={item.amount}
              type={item.type}
              currency={currency}
              style={styles.amount}
            />
            <Pressable
              onPress={() => onToggle(item.id, isActive)}
              hitSlop={8}
              accessibilityRole="switch"
              accessibilityLabel={isActive ? 'Pause recurring' : 'Resume recurring'}
              accessibilityState={{ checked: isActive }}
            >
              <View style={[
                styles.statusBadge,
                { backgroundColor: isActive ? colors.secondary + '20' : colors.textSecondary + '20' },
              ]}>
                <View style={[
                  styles.statusDot,
                  { backgroundColor: isActive ? colors.secondary : colors.textSecondary },
                ]} />
                <Text style={[
                  styles.statusText,
                  { color: isActive ? colors.secondary : colors.textSecondary },
                ]}>
                  {isActive ? 'Active' : 'Paused'}
                </Text>
              </View>
            </Pressable>
          </View>
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Spacing.two,
  },
  cardInactive: {
    opacity: 0.6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: Spacing.two,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.two,
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontSize: 15,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    fontWeight: '500',
  },
  metaDot: {
    fontSize: 12,
    fontWeight: '700',
  },
  rightSection: {
    alignItems: 'flex-end',
    gap: Spacing.one,
  },
  amount: {
    fontSize: 16,
    fontWeight: '800',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
