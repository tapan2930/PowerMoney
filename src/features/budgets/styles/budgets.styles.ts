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
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 16,
    marginVertical: 12,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 14,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 80,
  },
  listContainer: {
    paddingHorizontal: 16,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  progressCard: {
    marginVertical: 6,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardName: {
    fontSize: 16,
    fontWeight: '700',
  },
  cardRatio: {
    fontSize: 16,
    fontWeight: '800',
  },
  progressBar: {
    marginVertical: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  footerText: {
    fontSize: 13,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    paddingTop: 8,
    gap: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '500',
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
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  budgetRight: {
    flex: 1,
    gap: 4,
  },
  budgetPeriodBadge: {
    fontSize: 9,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    overflow: 'hidden',
  },
  amountBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  amountLabel: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  amountVal: {
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  limitVal: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
});
