import { AmountDisplay, Button, Card, TextInput } from '@/components/ui';
import { db } from '@/db';
import { accounts as dbAccounts, categories as dbCategories } from '@/db/schema';
import { CategorySelectModal } from '@/features/accounts/components/CategorySelectModal';
import { SourceAccountSelectModal } from '@/features/accounts/components/SourceAccountSelectModal';
import { useImportStatement } from '@/features/accounts/hooks/useImportStatement';
import { styles as accountStyles } from '@/features/accounts/styles/accounts.styles';
import { Account, Category } from '@/features/accounts/types';
import { useAppTheme } from '@/hooks/useAppTheme';
import { useAppStore } from '@/stores/useAppStore';
import { Ionicons } from '@expo/vector-icons';
import { eq } from 'drizzle-orm';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ImportStatementScreen() {
  const { colors } = useAppTheme();
  const { currency } = useAppStore();

  const [accountsList, setAccountsList] = useState<Account[]>([]);
  const [categoriesList, setCategoriesList] = useState<Category[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);

  // Load account and category list
  useEffect(() => {
    const loadData = async () => {
      try {
        const accs = await db.select().from(dbAccounts).where(eq(dbAccounts.isArchived, false));
        setAccountsList(accs as Account[]);

        const cats = await db.select().from(dbCategories);
        setCategoriesList(cats as Category[]);

        setDataLoaded(true);
      } catch (e) {
        console.error('Error loading import statement screen data:', e);
      }
    };
    loadData();
  }, []);

  const importStatement = useImportStatement({
    accountsList,
    categoriesList,
    onSuccess: () => {
      router.back();
    },
  });

  const {
    importTransactions,
    importAccountId,
    setImportAccountId,
    isImportLoading,
    activeCategorySelectTxId,
    setActiveCategorySelectTxId,
    activeSourceSelectTxId,
    setActiveSourceSelectTxId,
    handleImportStatement,
    handleConfirmImport,
    toggleTransactionSelection,
    updateTransactionMerchant,
    handleSelectCategory,
    updateTransactionSourceType,
    handleSelectSourceAccount,
    setBulkSelection,
    updateTransactionCategory,
  } = importStatement;

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'expense' | 'income'>('all');
  const [showSearch, setShowSearch] = useState(false);
  const [targetSelectVisible, setTargetSelectVisible] = useState(false);

  const hasOtherAccounts = accountsList.some((a) => a.id !== importAccountId);

  // Compute filtered list of transactions
  const filteredTransactions = importTransactions.filter((tx) => {
    const matchesSearch = searchQuery
      ? (tx.merchant?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.description?.toLowerCase().includes(searchQuery.toLowerCase()))
      : true;

    const matchesType = typeFilter === 'all'
      ? true
      : tx.type === typeFilter;

    return matchesSearch && matchesType;
  });

  const visibleHashes = filteredTransactions.map((t) => t.importHash).filter((h): h is string => !!h);
  const allVisibleSelected = visibleHashes.length > 0 && filteredTransactions.every((t) => t.selected);

  const handleToggleSelectAll = () => {
    setBulkSelection(visibleHashes, !allVisibleSelected);
  };

  // Helper to render category icons cleanly (avoiding raw string names like "restaurant" inside badges)
  const renderCategoryIcon = (iconName?: string | null, color?: string) => {
    if (!iconName) {
      return <Ionicons name="bookmark-outline" size={12} color={color || colors.textSecondary} />;
    }
    if (iconName.length <= 2) {
      return <Text style={{ fontSize: 12, marginRight: 2 }}>{iconName}</Text>;
    }
    return <Ionicons name={iconName as any} size={12} color={color || colors.textSecondary} style={{ marginRight: 2 }} />;
  };

  if (!dataLoaded) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {isImportLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Extracting transactions offline...
          </Text>
        </View>
      ) : importTransactions.length === 0 ? (
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Button
                label=""
                onPress={() => router.back()}
                variant="outline"
                size="sm"
                leftIcon={<Ionicons name="arrow-back" size={20} color={colors.text} />}
                style={styles.backButton}
              />
              <Text style={[styles.headerTitle, { color: colors.text }]}>Statement Review</Text>
            </View>
          </View>

          {/* Select PDF Placeholder View */}
          <View style={styles.placeholderContainer}>
            <Ionicons name="cloud-upload-outline" size={64} color={colors.primary} style={styles.placeholderIcon} />
            <Text style={[styles.placeholderTitle, { color: colors.text }]}>
              Import Bank Statement
            </Text>
            <Text style={[styles.placeholderSub, { color: colors.textSecondary }]}>
              Upload your digital PDF bank statement. We will parse it completely offline on your device.
            </Text>
            <Button
              label="Select PDF File"
              onPress={handleImportStatement}
              variant="primary"
              style={styles.placeholderBtn}
              leftIcon={<Ionicons name="document-text-outline" size={18} color="#FFF" />}
            />
          </View>
        </View>
      ) : (
        <>
          {/* Compact Screen Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Pressable
                onPress={() => router.back()}
                style={styles.backButton}
                accessibilityLabel="Go back"
                accessibilityRole="button"
              >
                <Ionicons name="arrow-back" size={24} color={colors.text} />
              </Pressable>
              <View style={styles.headerTitleContainer}>
                <Text style={[styles.headerTitle, { color: colors.text }]}>Statement Review</Text>
                <View style={styles.headerSubRow}>
                  <Pressable
                    onPress={() => setTargetSelectVisible(true)}
                    style={({ pressed }) => [
                      accountStyles.compactHeaderDropdown,
                      { backgroundColor: pressed ? colors.border : colors.primary + '15' }
                    ]}
                    accessibilityLabel="Select target account"
                    accessibilityRole="button"
                  >
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                      Target: {accountsList.find((a) => a.id === importAccountId)?.name || 'Select Account'}
                    </Text>
                    <Ionicons name="chevron-down" size={11} color={colors.primary} />
                  </Pressable>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>•</Text>
                  <Text style={[styles.bulletText, { color: colors.textSecondary }]}>
                    Showing {filteredTransactions.length} of {importTransactions.length}
                  </Text>
                </View>
              </View>
            </View>
            <View style={accountStyles.compactRightActions}>
              <Pressable
                onPress={() => setShowSearch(!showSearch)}
                style={[
                  styles.searchIconBtn,
                  { backgroundColor: showSearch ? colors.primary + '15' : 'transparent' }
                ]}
                accessibilityLabel="Toggle search bar"
                accessibilityRole="button"
              >
                <Ionicons name="search" size={18} color={showSearch ? colors.primary : colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* Compact Filter and Select All Row */}
          <View style={accountStyles.compactFilterRow}>
            <View style={accountStyles.compactFilterChips}>
              {(['all', 'expense', 'income'] as const).map((type) => {
                const isSelected = typeFilter === type;
                return (
                  <Pressable
                    key={type}
                    onPress={() => setTypeFilter(type)}
                    style={[
                      accountStyles.compactFilterChip,
                      {
                        borderColor: isSelected ? colors.primary : colors.border,
                        backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                      },
                    ]}
                    accessibilityLabel={`Filter by ${type}`}
                    accessibilityRole="button"
                  >
                    <Text
                      style={[
                        accountStyles.compactFilterChipText,
                        { color: isSelected ? colors.primary : colors.textSecondary },
                      ]}
                    >
                      {type === 'all' ? 'All' : type === 'expense' ? 'Expenses' : 'Income'}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {filteredTransactions.length > 0 && (
              <Pressable
                onPress={handleToggleSelectAll}
                accessibilityLabel="Toggle select all visible"
                accessibilityRole="button"
              >
                <Text style={[styles.selectAllText, { color: colors.primary }]}>
                  {allVisibleSelected ? 'Deselect All' : 'Select All'}
                </Text>
              </Pressable>
            )}
          </View>

          {showSearch && (
            <View style={styles.searchBarContainer}>
              <TextInput
                label=""
                placeholder="Search merchant or description..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                containerStyle={styles.searchTextInputContainer}
                style={styles.searchTextInput}
                isBottomSheetInput={false}
              />
            </View>
          )}

          {/* Transactions List */}
          <View style={[styles.listWrapper, { borderTopColor: colors.border }]}>
            <ScrollView contentContainerStyle={accountStyles.importListContent}>
              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    No matching transactions.
                  </Text>
                </View>
              ) : (
                filteredTransactions.map((tx) => {
                  if (!tx.importHash) return null; // safety check
                  const currentCategory = categoriesList.find((c) => c.id === tx.categoryId);
                  return (
                    <Card key={tx.importHash} style={accountStyles.importRowCard} padding={12}>
                      <View style={accountStyles.importRowHeader}>
                        {/* Selected Checkbox */}
                        <Pressable
                          onPress={() => toggleTransactionSelection(tx.importHash!)}
                          style={accountStyles.checkboxContainer}
                          accessibilityLabel={`Toggle selection for transaction ${tx.merchant || tx.description}`}
                          accessibilityRole="checkbox"
                        >
                          <Ionicons
                            name={tx.selected ? 'checkbox-outline' : 'square-outline'}
                            size={22}
                            color={tx.selected ? colors.primary : colors.textSecondary}
                          />
                        </Pressable>

                        {/* Date and Amount */}
                        <Text style={[accountStyles.importRowDate, { color: colors.textSecondary }]}>{tx.date}</Text>
                        <AmountDisplay
                          amount={tx.amount}
                          type={tx.type}
                          currency={currency}
                          style={accountStyles.importRowAmount}
                        />
                      </View>

                      {/* Editable Merchant Text */}
                      <TextInput
                        label=""
                        value={tx.merchant || ''}
                        onChangeText={(val) => updateTransactionMerchant(tx.importHash!, val)}
                        containerStyle={accountStyles.importRowInputContainer}
                        style={accountStyles.importRowInput}
                      />

                      {/* Original Ledger Text */}
                      <Text style={[accountStyles.originalDescription, { color: colors.textSecondary }]}>
                        Original: {tx.description}
                      </Text>

                      {/* Category Dropdown */}
                      <Pressable
                        onPress={() => setActiveCategorySelectTxId(tx.importHash!)}
                        style={[accountStyles.categoryDropdownButton, { borderColor: colors.border }]}
                        accessibilityLabel={`Select category, current category is ${currentCategory?.name || 'Uncategorized'}`}
                        accessibilityRole="button"
                      >
                        <View style={accountStyles.categoryDropdownLeft}>
                          {renderCategoryIcon(currentCategory?.icon, currentCategory?.color || colors.primary)}
                          <Text style={[accountStyles.categoryDropdownText, { color: colors.text }]}>
                            {currentCategory?.name || 'Uncategorized'}
                          </Text>
                        </View>
                        <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                      </Pressable>

                      {/* Quick Category Badges */}
                      <View style={accountStyles.quickBadgesContainer}>
                        {categoriesList
                          .filter((c) => c.type === tx.type)
                          .slice(0, 3)
                          .map((c) => {
                            const isSelected = tx.categoryId === c.id;
                            return (
                              <Pressable
                                key={c.id}
                                onPress={() => updateTransactionCategory(tx.importHash!, c.id)}
                                style={[
                                  accountStyles.quickBadge,
                                  {
                                    borderColor: isSelected ? colors.primary : colors.border,
                                    backgroundColor: isSelected ? colors.primary + '15' : 'transparent',
                                  },
                                ]}
                                accessibilityLabel={`Assign category ${c.name}`}
                                accessibilityRole="button"
                              >
                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                                  {renderCategoryIcon(c.icon, isSelected ? colors.primary : colors.textSecondary)}
                                  <Text
                                    style={[
                                      accountStyles.quickBadgeText,
                                      { color: isSelected ? colors.primary : colors.text },
                                    ]}
                                  >
                                    {c.name}
                                  </Text>
                                </View>
                              </Pressable>
                            );
                          })}
                      </View>

                      {/* Payment Source Selector (only for positive income transactions) */}
                      {tx.type === 'income' && (
                        <View style={accountStyles.sourceSelectorContainer}>
                          <Text style={[accountStyles.sourceLabel, { color: colors.textSecondary }]}>
                            Payment Source
                          </Text>
                          <View style={accountStyles.sourceOptionsRow}>
                            <Button
                              label="External"
                              onPress={() => updateTransactionSourceType(tx.importHash!, 'external')}
                              variant={(!tx.sourceType || tx.sourceType === 'external') ? 'primary' : 'outline'}
                              size="sm"
                              style={accountStyles.sourceOptionBtn}
                              accessibilityLabel="Select external payment source"
                              accessibilityRole="button"
                            />
                            <Button
                              label="Internal Account"
                              onPress={() => updateTransactionSourceType(tx.importHash!, 'internal')}
                              variant={tx.sourceType === 'internal' ? 'primary' : 'outline'}
                              size="sm"
                              style={accountStyles.sourceOptionBtn}
                              disabled={!hasOtherAccounts}
                              accessibilityLabel="Select internal account payment source"
                              accessibilityRole="button"
                            />
                          </View>
                          {tx.sourceType === 'internal' && (
                            <Pressable
                              onPress={() => setActiveSourceSelectTxId(tx.importHash!)}
                              style={[accountStyles.sourceDropdownButton, { borderColor: colors.border }]}
                              accessibilityLabel={`Select source account, current account is ${accountsList.find((a) => a.id === tx.sourceAccountId)?.name || 'None'
                                }`}
                              accessibilityRole="button"
                            >
                              <View style={accountStyles.sourceDropdownLeft}>
                                <Ionicons name="wallet-outline" size={16} color={colors.primary} />
                                <Text style={[accountStyles.sourceDropdownText, { color: colors.text }]}>
                                  {accountsList.find((a) => a.id === tx.sourceAccountId)?.name || 'Select Account...'}
                                </Text>
                              </View>
                              <Ionicons name="chevron-down" size={16} color={colors.textSecondary} />
                            </Pressable>
                          )}
                        </View>
                      )}
                    </Card>
                  );
                })
              )}
            </ScrollView>
          </View>

          {/* Footer */}
          <View style={[accountStyles.importFooter, { borderTopColor: colors.border }]}>
            <Button
              label={`Import ${importTransactions.filter((t) => t.selected).length} Transactions`}
              onPress={handleConfirmImport}
              variant="primary"
              style={accountStyles.importConfirmBtn}
              accessibilityLabel="Confirm transaction import"
              accessibilityRole="button"
            />
          </View>
        </>
      )}

      {/* Target Account Selector bottom-sheet */}
      <SourceAccountSelectModal
        visible={targetSelectVisible}
        onClose={() => setTargetSelectVisible(false)}
        accountsList={accountsList}
        onSelectAccount={(accId) => {
          setImportAccountId(accId);
          setTargetSelectVisible(false);
        }}
        title="Select Target Account"
      />

      {/* Category Select Modal bottom-sheet */}
      <CategorySelectModal
        visible={activeCategorySelectTxId !== null}
        onClose={() => setActiveCategorySelectTxId(null)}
        categoriesList={categoriesList}
        onSelectCategory={handleSelectCategory}
      />

      {/* Source Account Selector bottom-sheet */}
      <SourceAccountSelectModal
        visible={activeSourceSelectTxId !== null}
        onClose={() => setActiveSourceSelectTxId(null)}
        accountsList={accountsList.filter((a) => a.id !== importAccountId)}
        onSelectAccount={handleSelectSourceAccount}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  backButton: {
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  headerSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  bulletText: {
    fontSize: 11,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  placeholderIcon: {
    marginBottom: 16,
  },
  placeholderTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 8,
  },
  placeholderSub: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  placeholderBtn: {
    width: '100%',
    maxWidth: 240,
  },
  listWrapper: {
    flex: 1,
    borderTopWidth: 1,
  },
  searchIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  searchTextInputContainer: {
    marginBottom: 0,
  },
  searchTextInput: {
    height: 38,
    fontSize: 13,
    paddingVertical: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
  },
  selectAllText: {
    fontSize: 12,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
  },
});
