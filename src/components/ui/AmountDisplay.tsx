import { Colors } from '@/constants/theme';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';
import { AnimatedNumber } from './AnimatedNumber';

export interface AmountDisplayProps {
  amount: number;
  type?: 'income' | 'expense' | 'transfer' | 'neutral';
  currency?: string;
  animate?: boolean;
  style?: any;
  decimals?: number;
}

export function AmountDisplay({
  amount,
  type,
  currency = '',
  animate = true,
  style,
  decimals = 2,
}: AmountDisplayProps) {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  // Auto-detect type if not explicitly passed based on negative/positive values
  const determinedType = type || (amount > 0 ? 'income' : amount < 0 ? 'expense' : 'neutral');
  const absoluteAmount = Math.abs(amount);

  // Get color based on transaction type
  const getColor = () => {
    switch (determinedType) {
      case 'income':
        return colors.secondary; // Emerald
      case 'expense':
        return colors.danger;    // Coral
      case 'transfer':
      case 'neutral':
      default:
        return colors.text;
    }
  };

  // Determine prefix (+ or - or none)
  const prefix = determinedType === 'income' ? '+' : determinedType === 'expense' ? '-' : '';

  // Get currency symbol
  const getCurrencySymbol = (code: string) => {
    switch (code) {
      case 'USD': return '$';
      case 'EUR': return '€';
      case 'GBP': return '£';
      case 'INR': return '₹';
      case 'JPY': return '¥';
      case 'CAD': return '$';
      case 'AUD': return 'A$';
      default: return `${code} `;
    }
  };

  const symbol = getCurrencySymbol(currency);
  const fullPrefix = `${prefix}${symbol}`;

  return (
    <View style={styles.container}>
      {animate ? (
        <AnimatedNumber
          value={absoluteAmount}
          prefix={fullPrefix}
          decimals={decimals}
          style={[styles.text, { color: getColor() }, style]}
        />
      ) : (
        <Text style={[styles.text, { color: getColor() }, style]}>
          {fullPrefix}{absoluteAmount.toFixed(decimals).replace(/\d(?=(\d{3})+\.)/g, '$&,')}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    fontVariant: ['tabular-nums'],
    fontSize: 20,
    fontWeight: '700',
  },
});
