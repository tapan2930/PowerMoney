import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  accountsSlider: {
    paddingHorizontal: 16,
    gap: 12,
    paddingVertical: 12,
  },
  verticalAccountsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  accountCard: {
    width: 260,
    height: 150,
    borderRadius: 24,
    justifyContent: 'space-between',
    marginVertical: 0,
  },
  accountVerticalCard: {
    width: '48%',
    height: 120,
    borderRadius: 20,
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  accCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  accTypeLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  accName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 16,
  },
  accNameVertical: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 8,
  },
  accBalance: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  accBalanceVertical: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  ledgerSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  ledgerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ledgerTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  txRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  txLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  txIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txMerchant: {
    fontSize: 15,
    fontWeight: '600',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalContent: {
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginTop: -10,
    marginBottom: 12,
    paddingLeft: 4,
    lineHeight: 16,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    width: '100%',
    marginBottom: 8,
  },
  optionBtn: {
    flexGrow: 1,
  },
  saveBtn: {
    marginTop: 32,
    marginBottom: 40,
  },
  importModalContainer: {
    flex: 1,
  },
  importHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  importModalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  importModalSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
  },
  importAccountSelector: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  importListContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  importRowCard: {
    gap: 8,
  },
  importRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkboxContainer: {
    padding: 4,
  },
  importRowDate: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
    marginLeft: 8,
  },
  importRowAmount: {
    fontSize: 15,
    fontWeight: '800',
  },
  importRowInputContainer: {
    marginBottom: 0,
  },
  importRowInput: {
    fontSize: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    height: 40,
  },
  categoryDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  categoryDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  categoryDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  categoryDropdownText: {
    fontSize: 13,
    fontWeight: '600',
  },
  importFooter: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  importConfirmBtn: {
    width: '100%',
  },
  categorySelectItemBtn: {
    minWidth: '45%',
    marginVertical: 4,
  },
  sourceSelectorContainer: {
    marginTop: 10,
    gap: 6,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceOptionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sourceOptionBtn: {
    flex: 1,
  },
  sourceDropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 4,
  },
  sourceDropdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sourceDropdownText: {
    fontSize: 13,
    fontWeight: '600',
  },
  importSearchFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  importSearchInputContainer: {
    marginBottom: 0,
  },
  importSearchInput: {
    fontSize: 14,
    height: 40,
  },
  importFilterRow: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 4,
  },
  importFilterBtn: {
    flex: 1,
  },
  bulkSelectRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    marginBottom: 10,
  },
  bulkSelectText: {
    fontSize: 12,
    fontWeight: '600',
  },
  originalDescription: {
    fontSize: 11,
    fontStyle: 'italic',
    marginTop: 2,
  },
  quickBadgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  quickBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  quickBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  compactHeaderDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  compactFilterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  compactFilterChips: {
    flexDirection: 'row',
    gap: 6,
  },
  compactFilterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  compactFilterChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  compactRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
});
