import { db } from '@/db';
import { accounts, transactions } from '@/db/schema';
import { useAppStore } from '@/stores/useAppStore';
import { eq, sql } from 'drizzle-orm';
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
        .where(eq(transactions.accountId, targetAccId));
      const existingHashes = new Set(existingTxs.map(t => t.importHash).filter(Boolean));

      const balanceAdjustments: Record<string, number> = {};
      balanceAdjustments[targetAccId] = 0;

      const targetAccName = accountsList.find(a => a.id === targetAccId)?.name || 'Account';
      let newlyImportedCount = 0;
      let skippedCount = 0;

      for (const tx of selectedTxs) {
        let isDuplicate = false;
        let matchedTxId: string | null = null;

        if (tx.importHash && existingHashes.has(tx.importHash)) {
          isDuplicate = true;
        } else {
          // Fallback duplicate detection: match by amount, type, and date (+/- 2 days)
          const potentialDuplicates = existingTxs.filter(t =>
            t.amount === tx.amount &&
            t.type === tx.type
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

        if (isDuplicate) {
          logger.log('Skipping duplicate transaction in target account:', tx.description);
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
        newlyImportedCount++;

        // Handle learning categorization rules
        const originalRule = importTransactions.find(t => t.importHash === tx.importHash);
        if (originalRule && originalRule.categoryId !== tx.categoryId && tx.merchant && tx.categoryId) {
          await learnCategorizationRule(tx.merchant, tx.categoryId);
        }

        // Handle corresponding source account transaction if internal transfer
        if (tx.type === 'income' && tx.sourceType === 'internal' && tx.sourceAccountId) {
          const transferHash = `transfer_${tx.importHash}`;

          // Fetch existing transactions in source account to check duplicates
          const sourceExistingTxs = await db
            .select()
            .from(transactions)
            .where(eq(transactions.accountId, tx.sourceAccountId));

          let isSourceDuplicate = false;
          let matchedSourceTxId: string | null = null;

          const sourceHashes = new Set(sourceExistingTxs.map(t => t.importHash).filter(Boolean));

          if (sourceHashes.has(transferHash)) {
            isSourceDuplicate = true;
          } else {
            // Fallback duplicate check in source account by date (+/- 2 days), amount, and type === 'expense'
            const sourcePotentials = sourceExistingTxs.filter(t =>
              t.amount === tx.amount &&
              t.type === 'expense'
            );

            for (const pot of sourcePotentials) {
              const potTime = new Date(pot.date).getTime();
              const txTime = new Date(tx.date).getTime();
              const days = Math.abs((potTime - txTime) / (1000 * 60 * 60 * 24));
              if (days <= 2) {
                isSourceDuplicate = true;
                matchedSourceTxId = pot.id;
                break;
              }
            }
          }

          if (isSourceDuplicate) {
            logger.log(`Skipping duplicate transfer in source account (${tx.sourceAccountId}):`, tx.description);
            if (matchedSourceTxId && transferHash) {
              await db
                .update(transactions)
                .set({ importHash: transferHash })
                .where(eq(transactions.id, matchedSourceTxId));
            }
          } else {
            // Create transfer transaction in source account
            await db.insert(transactions).values({
              accountId: tx.sourceAccountId,
              categoryId: tx.categoryId || null,
              type: 'expense',
              amount: tx.amount,
              description: `Transfer to ${targetAccName}${tx.merchant ? ' - ' + tx.merchant : ''}`,
              merchant: tx.merchant || null,
              date: tx.date,
              importHash: transferHash,
            });

            if (!balanceAdjustments[tx.sourceAccountId]) {
              balanceAdjustments[tx.sourceAccountId] = 0;
            }
            balanceAdjustments[tx.sourceAccountId] -= tx.amount;
          }
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
