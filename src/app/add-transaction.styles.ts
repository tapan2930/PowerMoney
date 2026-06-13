import { StyleSheet } from 'react-native';
import { Spacing } from '@/constants/theme';

export const styles = StyleSheet.create({
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
