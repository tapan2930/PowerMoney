import { Button, TextInput, SelectField, DatePickerField } from '@/components/ui';
import { db } from '@/db';
import { accounts, categories, transactions } from '@/db/schema';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Spacing } from '@/constants/theme';
import { Haptics } from '@/utils/haptics';
import { logger } from '@/utils/logger';
import { Ionicons } from '@expo/vector-icons';
import { eq, sql } from 'drizzle-orm';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { CustomAlert } from '@/components/feedback/CustomAlert';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Account {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

export default function AddTransactionScreen() {
  const { colors } = useAppTheme();
  const scheme = useColorScheme();

  const { id } = useLocalSearchParams<{ id?: string }>();
  const [existingTransaction, setExistingTransaction] = useState<any>(null);

  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);

  // Form State
  const [amount, setAmount] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const [merchant, setMerchant] = useState('');
  const [description, setDescription] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const accountOptions = useMemo(() => {
    return accountsList.map(a => ({
      key: a.id,
      label: a.name,
      icon: a.type === 'credit_card' ? 'card-outline' : 'wallet-outline',
    }));
  }, [accountsList]);

  const categoryOptions = useMemo(() => {
    return categoriesList.map(c => ({
      key: c.id,
      label: c.name,
      icon: c.icon || 'tag-outline',
      color: c.color || undefined,
    }));
  }, [categoriesList]);

  useEffect(() => {
    const loadFormData = async () => {
      try {
        const accs = await db.select().from(accounts).where(eq(accounts.isArchived, false));
        setAccountsList(accs as Account[]);

        const cats = await db.select().from(categories);
        setCategoriesList(cats as Category[]);

        if (id) {
          const [tx] = await db.select().from(transactions).where(eq(transactions.id, id));
          if (tx) {
            setExistingTransaction(tx);
            setAmount(tx.amount.toString());
            setType(tx.type as 'income' | 'expense');
            setMerchant(tx.merchant ?? '');
            setDescription(tx.description ?? '');
            setSelectedAccountId(tx.accountId);
            setSelectedCategoryId(tx.categoryId ?? '');
            setDate(tx.date);
          }
        } else {
          if (accs.length > 0) {
            setSelectedAccountId(accs[0].id);
          }
          if (cats.length > 0) {
            setSelectedCategoryId(cats[0].id);
          }
        }
      } catch (e) {
        logger.error('Error loading transaction form data:', e);
      }
    };
    loadFormData();
  }, [id]);

  const handleSubmit = async () => {
    const amt = parseFloat(amount);
    if (!amt || isNaN(amt) || amt <= 0) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please enter a valid amount.');
      return;
    }

    if (!selectedAccountId) {
      Haptics.notification('error');
      CustomAlert.alert('Validation Error', 'Please select a source account.');
      return;
    }

    setIsSubmitting(true);
    try {
      const signedAmt = type === 'expense' ? -amt : amt;

      if (existingTransaction) {
        // UPDATE flow
        const oldAccountId = existingTransaction.accountId;
        const oldAmount = existingTransaction.amount;
        const oldType = existingTransaction.type;
        const oldSignedAmt = oldType === 'expense' ? -oldAmount : oldAmount;
        const newSignedAmt = type === 'expense' ? -amt : amt;

        // Update transaction in database
        await db
          .update(transactions)
          .set({
            accountId: selectedAccountId,
            categoryId: selectedCategoryId || null,
            type: type,
            amount: amt,
            description: description || merchant || 'Logged Transaction',
            merchant: merchant || null,
            date: date,
            updatedAt: new Date().toISOString(),
          })
          .where(eq(transactions.id, existingTransaction.id));

        // Adjust account balances
        if (oldAccountId === selectedAccountId) {
          // Same account balance update
          const diff = newSignedAmt - oldSignedAmt;
          await db
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${diff}` })
            .where(eq(accounts.id, selectedAccountId));
        } else {
          // Different account update
          await db
            .update(accounts)
            .set({ balance: sql`${accounts.balance} - ${oldSignedAmt}` })
            .where(eq(accounts.id, oldAccountId));
          await db
            .update(accounts)
            .set({ balance: sql`${accounts.balance} + ${newSignedAmt}` })
            .where(eq(accounts.id, selectedAccountId));
        }
      } else {
        // INSERT flow
        // 1. Insert transaction
        await db.insert(transactions).values({
          accountId: selectedAccountId,
          categoryId: selectedCategoryId || null,
          type: type,
          amount: amt,
          description: description || merchant || 'Logged Transaction',
          merchant: merchant || null,
          date: date,
        });

        // 2. Update account balance
        await db
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${signedAmt}` })
          .where(eq(accounts.id, selectedAccountId));
      }

      Haptics.notification('success');
      router.back();
    } catch (e) {
      Haptics.notification('error');
      logger.error('Error saving transaction:', e);
      CustomAlert.alert('Error', 'Failed to save transaction.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingTransaction) return;

    CustomAlert.alert(
      'Delete Transaction',
      'Are you sure you want to permanently delete this transaction? This will adjust your account balance.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsSubmitting(true);
            try {
              const oldAccountId = existingTransaction.accountId;
              const oldAmount = existingTransaction.amount;
              const oldType = existingTransaction.type;
              const oldSignedAmt = oldType === 'expense' ? -oldAmount : oldAmount;

              // 1. Delete the transaction from DB
              await db.delete(transactions).where(eq(transactions.id, existingTransaction.id));

              // 2. Revert the effect on account balance
              await db
                .update(accounts)
                .set({ balance: sql`${accounts.balance} - ${oldSignedAmt}` })
                .where(eq(accounts.id, oldAccountId));

              Haptics.notification('success');
              router.back();
            } catch (e) {
              Haptics.notification('error');
              logger.error('Error deleting transaction:', e);
              CustomAlert.alert('Error', 'Failed to delete transaction.');
            } finally {
              setIsSubmitting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Button
          label=""
          onPress={() => router.back()}
          variant="outline"
          size="sm"
          leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
          style={styles.backBtn}
        />
        <Text style={[styles.title, { color: colors.text }]}>
          {existingTransaction ? 'Edit Transaction' : 'Log Transaction'}
        </Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Amount field */}
          <TextInput
            label="Amount"
            placeholder="0.00"
            keyboardType="numeric"
            value={amount}
            onChangeText={setAmount}
            containerStyle={styles.textInputContainer}
          />

          {/* Date Picker Field */}
          <DatePickerField
            label="Transaction Date"
            value={date}
            onChange={setDate}
          />

          {/* Type selector */}
          <View style={styles.selectGroup}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Transaction Type</Text>
            <View style={styles.segmentedControl}>
              {[
                { key: 'expense', label: 'EXPENSE', icon: 'trending-down-outline' },
                { key: 'income', label: 'INCOME', icon: 'trending-up-outline' },
              ].map((opt) => {
                const isSelected = type === opt.key;
                return (
                  <Button
                    key={opt.key}
                    label={opt.label}
                    onPress={() => setType(opt.key as any)}
                    variant={isSelected ? 'primary' : 'outline'}
                    leftIcon={
                      <Ionicons
                        name={opt.icon as any}
                        size={16}
                        color={isSelected ? '#FFFFFF' : colors.textSecondary}
                      />
                    }
                    size="sm"
                    style={styles.segmentedBtn}
                  />
                );
              })}
            </View>
          </View>

          {/* Merchant */}
          <TextInput
            label="Merchant"
            placeholder="e.g. Starbucks, Amazon"
            value={merchant}
            onChangeText={setMerchant}
            containerStyle={styles.textInputContainer}
          />

          {/* Description */}
          <TextInput
            label="Description Notes"
            placeholder="e.g. Weekly groceries"
            value={description}
            onChangeText={setDescription}
            containerStyle={styles.textInputContainer}
          />

          {/* Source Account */}
          {accountsList.length > 0 && (
            <SelectField
              label="Source Account"
              value={selectedAccountId}
              options={accountOptions}
              onSelect={setSelectedAccountId}
              placeholder="Select account"
            />
          )}

          {/* Category Selector */}
          {categoriesList.length > 0 && (
            <SelectField
              label="Category"
              value={selectedCategoryId}
              options={categoryOptions}
              onSelect={setSelectedCategoryId}
              placeholder="Select category"
              searchable
            />
          )}

          {/* Submit Action */}
          <Button
            label={existingTransaction ? 'Save Changes' : 'Save Transaction'}
            onPress={handleSubmit}
            variant="primary"
            loading={isSubmitting}
            style={styles.submitBtn}
          />

          {existingTransaction && (
            <Button
              label="Delete Transaction"
              onPress={handleDelete}
              variant="danger"
              disabled={isSubmitting}
              style={styles.deleteBtn}
              accessibilityLabel="Delete transaction"
              accessibilityRole="button"
            />
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  backBtn: {
    paddingHorizontal: Spacing.two,
    borderRadius: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  headerRightSpacer: {
    width: 40,
  },
  scrollContent: {
    paddingBottom: Spacing.six,
    paddingHorizontal: Spacing.three,
  },
  formContainer: {
    marginVertical: Spacing.two,
    gap: Spacing.four,
  },
  textInputContainer: {
    marginBottom: 0,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: Spacing.one,
    paddingLeft: Spacing.one,
  },
  segmentedControl: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.one,
  },
  segmentedBtn: {
    flex: 1,
  },
  selectGroup: {
    gap: Spacing.two,
  },
  selectorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  selectorItem: {
    flexGrow: 1,
    minWidth: '45%',
  },
  submitBtn: {
    marginTop: Spacing.three,
    alignSelf: 'stretch',
  },
  deleteBtn: {
    marginTop: Spacing.two,
    alignSelf: 'stretch',
  },
});
