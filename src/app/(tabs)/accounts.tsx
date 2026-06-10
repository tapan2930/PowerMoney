import { useAppTheme } from '@/hooks/useAppTheme';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom hooks from our feature folder
import { useAccountsData } from '@/features/accounts/hooks/useAccountsData';
import { useAddAccount } from '@/features/accounts/hooks/useAddAccount';
import { useEditAccount } from '@/features/accounts/hooks/useEditAccount';
import { useLedgerFilters } from '@/features/accounts/hooks/useLedgerFilters';

// Custom sub-components
import { AccountsHeader } from '@/features/accounts/components/AccountsHeader';
import { AccountsView } from '@/features/accounts/components/AccountsView';
import { AddAccountModal } from '@/features/accounts/components/AddAccountModal';
import { EditAccountModal } from '@/features/accounts/components/EditAccountModal';
import { LedgerFilterBar } from '@/features/accounts/components/LedgerFilterBar';
import { LedgerSection } from '@/features/accounts/components/LedgerSection';
import { Account, TransactionItem } from '@/features/accounts/types';

// Styles
import { styles } from '@/features/accounts/styles/accounts.styles';

export default function AccountsScreen() {
  const { colors } = useAppTheme();

  // Data Fetching Hook
  const { accountsList, transactionsList, categoriesList, loadData } = useAccountsData();

  // Filters State Hook
  const {
    searchQuery,
    setSearchQuery,
    dateRange,
    setDateRange,
    selectedAccountIds,
    setSelectedAccountIds,
    selectedType,
    setSelectedType,
    selectedCategoryIds,
    setSelectedCategoryIds,
    filteredTransactions,
    activeFilterCount,
    clearAllFilters,
  } = useLedgerFilters(transactionsList);

  // Focus effect for automatic refresh
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  // Layout View States
  const [viewMode, setViewMode] = useState<'carousel' | 'list'>('carousel');
  const [addAccountVisible, setAddAccountVisible] = useState(false);
  const [editAccountVisible, setEditAccountVisible] = useState(false);

  // Selected item states for editing
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  // Form & Action Hooks
  const addAccount = useAddAccount({
    onSuccess: () => {
      setAddAccountVisible(false);
      loadData();
    },
  });

  const editAccount = useEditAccount({
    account: selectedAccount,
    onSuccess: () => {
      setEditAccountVisible(false);
      setSelectedAccount(null);
      loadData();
    },
  });

  const handleAccountPress = (acc: Account) => {
    setSelectedAccount(acc);
    setEditAccountVisible(true);
  };

  const handleTransactionPress = (tx: TransactionItem) => {
    router.push({
      pathname: '/add-transaction',
      params: { id: tx.id }
    });
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      <AccountsHeader
        viewMode={viewMode}
        onToggleViewMode={() => setViewMode((prev) => (prev === 'carousel' ? 'list' : 'carousel'))}
        onImportPress={() => router.push('/import-statement')}
        onAddAccountPress={() => setAddAccountVisible(true)}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <AccountsView
          accountsList={accountsList}
          viewMode={viewMode}
          onAccountPress={handleAccountPress}
        />
        <LedgerFilterBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          dateRange={dateRange}
          setDateRange={setDateRange}
          accounts={accountsList}
          selectedAccountIds={selectedAccountIds}
          setSelectedAccountIds={setSelectedAccountIds}
          categories={categoriesList}
          selectedCategoryIds={selectedCategoryIds}
          setSelectedCategoryIds={setSelectedCategoryIds}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          activeFilterCount={activeFilterCount}
          clearAllFilters={clearAllFilters}
        />
        <LedgerSection
          transactionsList={filteredTransactions}
          onTransactionPress={handleTransactionPress}
          activeFilterCount={activeFilterCount}
          onClearFilters={clearAllFilters}
        />
      </ScrollView>

      <AddAccountModal
        visible={addAccountVisible}
        onClose={() => setAddAccountVisible(false)}
        {...addAccount}
      />
      <EditAccountModal
        visible={editAccountVisible}
        onClose={() => {
          setEditAccountVisible(false);
          setSelectedAccount(null);
        }}
        account={selectedAccount}
        {...editAccount}
      />
    </SafeAreaView>
  );
}

