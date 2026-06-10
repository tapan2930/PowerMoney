import { db } from '@/db';
import { accounts, transactions } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { eq, sql, or, and } from 'drizzle-orm';
import * as DocumentPicker from 'expo-document-picker';
import { useEffect, useState } from 'react';
import { CustomAlert } from '@/components/feedback/CustomAlert';
import { learnCategorizationRule } from '@/utils/categorizer';
import { logger } from '@/utils/logger';
import { parseBankStatement, ParsedTransaction } from '@/utils/pdf-parserv2';
import { Account, Category } from '../types';

interface UseImportStatementProps {
  accountsList: Account[];
  categoriesList: Category[];
  onSuccess: () => void;
}

export interface ImportTransactionItem extends ParsedTransaction {
  selected: boolean;
  sourceType?: 'external' | 'internal';
  sourceAccountId?: string;
}

export function useImportStatement({ accountsList, categoriesList, onSuccess }: UseImportStatementProps) {
  const { llmModelTier, llmStatus } = useAppStore();
  const [importVisible, setImportVisible] = useState(false);
  const [importTransactions, setImportTransactions] = useState<ImportTransactionItem[]>([]);
  const [importAccountId, setImportAccountId] = useState<string>('');
  const [isImportLoading, setIsImportLoading] = useState(false);
  const [activeCategorySelectTxId, setActiveCategorySelectTxId] = useState<string | null>(null);
  const [activeSourceSelectTxId, setActiveSourceSelectTxId] = useState<string | null>(null);

  // Set default target account when accountsList changes
  useEffect(() => {
    if (accountsList.length > 0 && !importAccountId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setImportAccountId(accountsList[0].id);
    }
  }, [accountsList, importAccountId]);

  // Update transaction source account IDs if the main target account changes
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImportTransactions(prev =>
      prev.map(tx => {
        if (tx.sourceType === 'internal' && tx.sourceAccountId === importAccountId) {
          const availableAccounts = accountsList.filter(a => a.id !== importAccountId);
          return {
            ...tx,
            sourceAccountId: availableAccounts.length > 0 ? availableAccounts[0].id : undefined,
          };
        }
        return tx;
      })
    );
  }, [importAccountId, accountsList]);

  const handleImportStatement = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      logger.log('Picked PDF for statement extraction:', file.uri);

      setIsImportLoading(true);
      setImportVisible(true);

      const isReady = llmStatus === 'ready';
      const tierForParser = (llmModelTier === 'ultra' ? 'pro' : llmModelTier) as 'lite' | 'standard' | 'pro' | null;
      const parsed = await parseBankStatement(file.uri, tierForParser, isReady);

      const viewList = parsed.map(tx => ({
        ...tx,
        selected: true,
        sourceType: 'external' as const,
      }));
      setImportTransactions(viewList);

      if (accountsList.length > 0) {
        setImportAccountId(accountsList[0].id);
      }

      setIsImportLoading(false);
    } catch (e) {
      logger.error('Error picking or parsing document:', e);
      setIsImportLoading(false);
      CustomAlert.alert('Error', 'Error extracting transactions from PDF statement. Please make sure it is a digital PDF.');
    }
  };

  const handleConfirmImport = async () => {
    try {
      const selectedTxs = importTransactions.filter(tx => tx.selected);
      if (selectedTxs.length === 0) {
        CustomAlert.alert('Alert', 'Please select at least one transaction to import.');
        return;
      }

      const targetAccId = importAccountId || (accountsList.length > 0 ? accountsList[0].id : null);
      if (!targetAccId) {
        CustomAlert.alert('Alert', 'No target account selected.');
        return;
      }

      setIsImportLoading(true);

      // Fetch existing transactions in target account for duplicate checks
      const existingTxs = await db
        .select()
        .from(transactions)
        .where(
          or(
            eq(transactions.accountId, targetAccId),
            eq(transactions.toAccountId, targetAccId)
          )
        );
      const existingHashes = new Set(existingTxs.map(t => t.importHash).filter(Boolean));

      const balanceAdjustments: Record<string, number> = {};
      balanceAdjustments[targetAccId] = 0;

      const targetAccName = accountsList.find(a => a.id === targetAccId)?.name || 'Account';
      let newlyImportedCount = 0;
      let skippedCount = 0;

      for (const tx of selectedTxs) {
        let isDuplicate = false;
        let matchedTxId: string | null = null;
        const isTransfer = tx.type === 'income' && tx.sourceType === 'internal' && tx.sourceAccountId;

        if (isTransfer) {
          if (tx.importHash && existingHashes.has(tx.importHash)) {
            isDuplicate = true;
          } else {
            // Check potential duplicates for transfer
            const potentialDuplicates = existingTxs.filter(t =>
              t.amount === tx.amount &&
              t.type === 'transfer' &&
              t.accountId === tx.sourceAccountId &&
              t.toAccountId === targetAccId
            );

            for (const pot of potentialDuplicates) {
              const potTime = new Date(pot.date).getTime();
              const txTime = new Date(tx.date).getTime();
              const days = Math.abs((potTime - txTime) / (1000 * 60 * 60 * 24));
              if (days <= 2) {
                isDuplicate = true;
                matchedTxId = pot.id;
                break;
              }
            }
          }
        } else {
          if (tx.importHash && existingHashes.has(tx.importHash)) {
            isDuplicate = true;
          } else {
            // Fallback duplicate detection: match by amount, type, and date (+/- 2 days)
            const potentialDuplicates = existingTxs.filter(t =>
              t.amount === tx.amount &&
              t.type === tx.type &&
              t.accountId === targetAccId
            );

            for (const pot of potentialDuplicates) {
              const potTime = new Date(pot.date).getTime();
              const txTime = new Date(tx.date).getTime();
              const days = Math.abs((potTime - txTime) / (1000 * 60 * 60 * 24));
              if (days <= 2) {
                isDuplicate = true;
                matchedTxId = pot.id;
                break;
              }
            }
          }
        }

        if (isDuplicate) {
          logger.log('Skipping duplicate transaction:', tx.description);
          skippedCount++;
          if (matchedTxId && tx.importHash) {
            // Update the existing transaction's importHash to link it and prevent future duplicates
            await db
              .update(transactions)
              .set({ importHash: tx.importHash })
              .where(eq(transactions.id, matchedTxId));
          }
          continue;
        }

        if (isTransfer) {
          // Create a single transfer transaction
          await db.insert(transactions).values({
            accountId: tx.sourceAccountId!,
            toAccountId: targetAccId,
            categoryId: null, // transfers don't have categories
            type: 'transfer',
            amount: tx.amount,
            description: tx.description || `Transfer to ${targetAccName}`,
            merchant: tx.merchant || null,
            date: tx.date,
            importHash: tx.importHash,
          });

          if (!balanceAdjustments[tx.sourceAccountId!]) {
            balanceAdjustments[tx.sourceAccountId!] = 0;
          }
          balanceAdjustments[tx.sourceAccountId!] -= tx.amount;
          balanceAdjustments[targetAccId] += tx.amount;
        } else {
          // Insert primary transaction
          await db.insert(transactions).values({
            accountId: targetAccId,
            categoryId: tx.categoryId || null,
            type: tx.type,
            amount: tx.amount,
            description: tx.description,
            merchant: tx.merchant,
            date: tx.date,
            importHash: tx.importHash,
          });

          const signedAmt = tx.type === 'expense' ? -tx.amount : tx.amount;
          balanceAdjustments[targetAccId] += signedAmt;
        }

        newlyImportedCount++;

        // Handle learning categorization rules
        const originalRule = importTransactions.find(t => t.importHash === tx.importHash);
        if (!isTransfer && originalRule && originalRule.categoryId !== tx.categoryId && tx.merchant && tx.categoryId) {
          await learnCategorizationRule(tx.merchant, tx.categoryId);
        }
      }

      // Update balances across all affected accounts
      for (const [accId, adjustment] of Object.entries(balanceAdjustments)) {
        if (adjustment === 0) continue;
        await db
          .update(accounts)
          .set({ balance: sql`${accounts.balance} + ${adjustment}` })
          .where(eq(accounts.id, accId));
      }

      setIsImportLoading(false);
      setImportVisible(false);
      CustomAlert.alert(
        'Success',
        `Import complete! Loaded ${newlyImportedCount} new transactions, skipped ${skippedCount} duplicates.`
      );
      onSuccess();
    } catch (e) {
      logger.error('Error confirming import:', e);
      setIsImportLoading(false);
    }
  };

  const toggleTransactionSelection = (importHash: string) => {
    setImportTransactions(prev =>
      prev.map(tx => (tx.importHash === importHash ? { ...tx, selected: !tx.selected } : tx))
    );
  };

  const updateTransactionMerchant = (importHash: string, merchant: string) => {
    setImportTransactions(prev =>
      prev.map(tx => (tx.importHash === importHash ? { ...tx, merchant, description: merchant } : tx))
    );
  };

  const updateTransactionCategory = (importHash: string, categoryId: string) => {
    setImportTransactions(prev =>
      prev.map(tx => (tx.importHash === importHash ? { ...tx, categoryId } : tx))
    );
  };

  const handleSelectCategory = (categoryId: string) => {
    if (!activeCategorySelectTxId) return;
    updateTransactionCategory(activeCategorySelectTxId, categoryId);
    setActiveCategorySelectTxId(null);
  };

  const updateTransactionSourceType = (importHash: string, sourceType: 'external' | 'internal') => {
    setImportTransactions(prev =>
      prev.map(tx => {
        if (tx.importHash === importHash) {
          let defaultSourceAccId = tx.sourceAccountId;
          if (sourceType === 'internal' && !defaultSourceAccId) {
            const availableAccounts = accountsList.filter(a => a.id !== importAccountId);
            if (availableAccounts.length > 0) {
              defaultSourceAccId = availableAccounts[0].id;
            }
          }
          return { ...tx, sourceType, sourceAccountId: defaultSourceAccId };
        }
        return tx;
      })
    );
  };

  const handleSelectSourceAccount = (sourceAccountId: string) => {
    if (!activeSourceSelectTxId) return;
    setImportTransactions(prev =>
      prev.map(tx => (tx.importHash === activeSourceSelectTxId ? { ...tx, sourceAccountId } : tx))
    );
    setActiveSourceSelectTxId(null);
  };

  const setBulkSelection = (importHashes: string[], selected: boolean) => {
    setImportTransactions(prev =>
      prev.map(tx => (tx.importHash && importHashes.includes(tx.importHash) ? { ...tx, selected } : tx))
    );
  };

  return {
    importVisible,
    setImportVisible,
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
  };
}
