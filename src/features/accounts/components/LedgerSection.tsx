import { AmountDisplay, Button, Card } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { router } from 'expo-router';
import React, { useCallback } from 'react';
import { Pressable, Text, View, StyleSheet } from 'react-native';
import { styles } from '../styles/accounts.styles';
import { TransactionItem } from '../types';

const AnyFlashList = FlashList as any;

interface LedgerSectionProps {
  transactionsList: TransactionItem[];
  onTransactionPress?: (transaction: TransactionItem) => void;
  activeFilterCount?: number;
  onClearFilters?: () => void;
}

export const LedgerSection: React.FC<LedgerSectionProps> = ({
  transactionsList,
  onTransactionPress,
  activeFilterCount = 0,
  onClearFilters,
}) => {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  const renderItem: ListRenderItem<TransactionItem> = useCallback(({ item: tx }) => (
    <Pressable
      onPress={() => onTransactionPress?.(tx)}
      accessibilityLabel={`Edit transaction with amount ${tx.amount}`}
      accessibilityRole="button"
    >
      <Card style={styles.txRow} padding={12}>
        <View style={styles.txLeft}>
          <View style={[styles.txIconBg, { backgroundColor: (tx.categoryColor || colors.primary) + '15' }]}>
            <Ionicons
              name={(tx.categoryIcon || 'cart') as any}
              size={20}
              color={tx.categoryColor || colors.primary}
            />
          </View>
          <View style={styles.txTextCol}>
            <Text style={[styles.txMerchant, { color: colors.text }]} numberOfLines={1} ellipsizeMode="tail">
              {tx.merchant || tx.description || 'Transaction'}
            </Text>
            <Text style={[styles.txDate, { color: colors.textSecondary }]}>{tx.date}</Text>
          </View>
        </View>
        <AmountDisplay amount={tx.amount} type={tx.type} currency={currency} style={styles.txAmount} />
      </Card>
    </Pressable>
  ), [colors.primary, colors.text, colors.textSecondary, currency, onTransactionPress]);

  const keyExtractor = useCallback((tx: TransactionItem) => tx.id, []);

  return (
    <View style={styles.ledgerSection}>
      <View style={styles.ledgerHeader}>
        <Text style={[styles.ledgerTitle, { color: colors.text }]}>Transactions</Text>
        <Button
          label="Log Transaction"
          onPress={() => router.push('/add-transaction')}
          size="sm"
          variant="primary"
          accessibilityLabel="Log a new transaction"
          accessibilityRole="button"
        />
      </View>

      {transactionsList.length === 0 ? (
        <Card style={styles.emptyCard} padding={24}>
          <Ionicons
            name={activeFilterCount > 0 ? 'filter-outline' : 'list-sharp'}
            size={40}
            color={colors.textSecondary + '60'}
          />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {activeFilterCount > 0
              ? 'No transactions found matching your filters.'
              : 'No ledger entries recorded.'}
          </Text>
          {activeFilterCount > 0 && onClearFilters && (
            <Button
              label="Clear Filters"
              onPress={onClearFilters}
              size="sm"
              variant="outline"
              style={localStyles.clearFiltersBtn}
              accessibilityLabel="Clear all active filters"
              accessibilityRole="button"
            />
          )}
        </Card>
      ) : (
        <AnyFlashList
          data={transactionsList}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          estimatedItemSize={70}
          scrollEnabled={false}
        />
      )}
    </View>
  );
};

const localStyles = StyleSheet.create({
  clearFiltersBtn: {
    marginTop: 12,
  },
});

