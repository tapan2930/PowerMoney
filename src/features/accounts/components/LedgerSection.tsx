import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Card, Button, AmountDisplay } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { TransactionItem } from '../types';
import { styles } from '../styles/accounts.styles';
import { FlashList } from '@shopify/flash-list';

interface LedgerSectionProps {
  transactionsList: TransactionItem[];
  onTransactionPress?: (transaction: TransactionItem) => void;
}

export const LedgerSection: React.FC<LedgerSectionProps> = ({ transactionsList, onTransactionPress }) => {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  const renderItem = useCallback(({ item: tx }: { item: TransactionItem }) => (
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
          <View>
            <Text style={[styles.txMerchant, { color: colors.text }]}>
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
        <Text style={[styles.ledgerTitle, { color: colors.text }]}>Ledger</Text>
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
          <Ionicons name="list-sharp" size={40} color={colors.textSecondary + '60'} />
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>No ledger entries recorded.</Text>
        </Card>
      ) : (
        <FlashList
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
