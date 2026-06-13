import { StyleSheet } from 'react-native';

export const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    padding: 4,
    borderRadius: 16,
    marginVertical: 12,
  },
  tabBtn: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80,
  },
  cashflowCard: {
    marginHorizontal: 16,
    marginBottom: 24,
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cashflowBalance: {
    fontSize: 32,
    fontWeight: '800',
    marginTop: 8,
  },
  cashflowSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 4,
  },
  progressMetrics: {
    marginTop: 20,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  metricVal: {
    fontSize: 13,
    fontWeight: '700',
  },
  inOutStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F3',
    marginTop: 20,
    paddingTop: 16,
  },
  inOutCol: {
    flex: 1,
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  statVal: {
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  breakdownSection: {
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
  },
  emptyCard: {
    alignItems: 'center',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 12,
  },
  breakdownItem: {
    marginVertical: 6,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  itemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemRight: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemPercent: {
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  barBg: {
    height: 6,
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  chartContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  customRangeSubtitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
    paddingVertical: 4,
  },
  customRangeText: {
    fontSize: 14,
    fontWeight: '700',
  },
  pencilIcon: {
    marginLeft: 6,
  },
  trendHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  trendLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  trendAmount: {
    fontSize: 24,
    fontWeight: '800',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  trendBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  trendCompareCol: {
    alignItems: 'flex-end',
  },
  compareLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  // Custom non-inline layout classes
  chartCardOverflow: {
    overflow: 'hidden',
  },
  trendHeaderWrapper: {
    padding: 16,
    paddingBottom: 0,
  },
  categoryTrendsWrapper: {
    paddingHorizontal: 16,
    marginBottom: 24,
    marginTop: 24,
  },
});
