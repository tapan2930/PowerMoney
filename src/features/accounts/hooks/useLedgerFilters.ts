import { useState, useMemo } from 'react';
import { TransactionItem } from '../types';

export interface LedgerFilters {
  searchQuery: string;
  dateRange: { start: string | null; end: string | null };
  selectedAccountIds: string[];
  selectedType: 'all' | 'income' | 'expense' | 'transfer';
  selectedCategoryIds: string[];
}

export function useLedgerFilters(transactionsList: TransactionItem[]) {
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [selectedType, setSelectedType] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);

  const filteredTransactions = useMemo(() => {
    return transactionsList.filter((tx) => {
      // 1. Search filter (merchant or description)
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase();
        const merchantMatch = tx.merchant?.toLowerCase().includes(query) ?? false;
        const descMatch = tx.description?.toLowerCase().includes(query) ?? false;
        if (!merchantMatch && !descMatch) {
          return false;
        }
      }

      // 2. Date range filter
      if (dateRange.start) {
        if (tx.date < dateRange.start) return false;
      }
      if (dateRange.end) {
        if (tx.date > dateRange.end) return false;
      }

      // 3. Account filter
      if (selectedAccountIds.length > 0) {
        if (!selectedAccountIds.includes(tx.accountId)) return false;
      }

      // 4. Type filter
      if (selectedType !== 'all') {
        if (tx.type !== selectedType) return false;
      }

      // 5. Category filter
      if (selectedCategoryIds.length > 0) {
        if (!tx.categoryId || !selectedCategoryIds.includes(tx.categoryId)) return false;
      }

      return true;
    });
  }, [transactionsList, searchQuery, dateRange, selectedAccountIds, selectedType, selectedCategoryIds]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (searchQuery.trim().length > 0) count++;
    if (dateRange.start || dateRange.end) count++;
    if (selectedAccountIds.length > 0) count++;
    if (selectedType !== 'all') count++;
    if (selectedCategoryIds.length > 0) count++;
    return count;
  }, [searchQuery, dateRange, selectedAccountIds, selectedType, selectedCategoryIds]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setDateRange({ start: null, end: null });
    setSelectedAccountIds([]);
    setSelectedType('all');
    setSelectedCategoryIds([]);
  };

  return {
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
  };
}
