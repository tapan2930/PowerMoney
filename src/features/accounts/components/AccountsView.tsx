import { View, ScrollView, Text, Pressable } from 'react-native';
import { GradientCard, AmountDisplay } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Account } from '../types';
import { styles } from '../styles/accounts.styles';

interface AccountsViewProps {
  accountsList: Account[];
  viewMode: 'carousel' | 'list';
  onAccountPress?: (account: Account) => void;
}

function getGradientColors(baseColor: string | null, defaultPrimary: string): string[] {
  const color = baseColor || defaultPrimary;
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const shift = (c: number) => Math.min(255, Math.max(0, Math.round(c * 1.25)));
  const r2 = shift(r);
  const g2 = shift(g);
  const b2 = shift(b);

  const toHex = (c: number) => c.toString(16).padStart(2, '0');
  const color2 = `#${toHex(r2)}${toHex(g2)}${toHex(b2)}`;

  return [color, color2];
}

export const AccountsView: React.FC<AccountsViewProps> = ({ accountsList, viewMode, onAccountPress }) => {
  const { colors } = useAppTheme();

  if (viewMode === 'carousel') {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.accountsSlider}>
        {accountsList.map((acc) => (
          <Pressable
            key={acc.id}
            onPress={() => onAccountPress?.(acc)}
            accessibilityLabel={`Edit account ${acc.name}`}
            accessibilityRole="button"
          >
            <GradientCard
              colors={getGradientColors(acc.color, colors.primary)}
              style={styles.accountCard}
              padding={16}
            >
              <View style={styles.accCardHeader}>
                <Ionicons name={acc.type === 'credit_card' ? 'card' : 'wallet-sharp'} size={24} color="#FFFFFF" />
                <Text style={styles.accTypeLabel}>{acc.type.toUpperCase().replace('_', ' ')}</Text>
              </View>
              <Text style={styles.accName}>{acc.name}</Text>
              <AmountDisplay amount={acc.balance} currency={acc.currency} style={styles.accBalance} />
            </GradientCard>
          </Pressable>
        ))}
      </ScrollView>
    );
  }

  return (
    <View style={styles.verticalAccountsList}>
      {accountsList.map((acc) => (
        <Pressable
          key={acc.id}
          onPress={() => onAccountPress?.(acc)}
          style={{ width: '48%' }}
          accessibilityLabel={`Edit account ${acc.name}`}
          accessibilityRole="button"
        >
          <GradientCard
            colors={getGradientColors(acc.color, colors.primary)}
            style={styles.accountVerticalCard}
            padding={16}
          >
            <View style={styles.accCardHeader}>
              <Ionicons name={acc.type === 'credit_card' ? 'card' : 'wallet-sharp'} size={24} color="#FFFFFF" />
              <Text style={styles.accTypeLabel}>{acc.type.toUpperCase().replace('_', ' ')}</Text>
            </View>
            <View>
              <Text style={styles.accNameVertical}>{acc.name}</Text>
              <AmountDisplay amount={acc.balance} currency={acc.currency} style={styles.accBalanceVertical} />
            </View>
          </GradientCard>
        </Pressable>
      ))}
    </View>
  );
};
