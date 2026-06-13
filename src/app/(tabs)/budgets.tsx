import { Button, Card, SegmentedControl } from '@/components/ui';
import { useAppTheme } from '@/hooks/useAppTheme';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
const AnyFlashList = FlashList as any;
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// Custom Hooks from our feature folder
import { useAddBudget } from '@/features/budgets/hooks/useAddBudget';
import { useAddGoal } from '@/features/budgets/hooks/useAddGoal';
import { Goal, useBudgetsData } from '@/features/budgets/hooks/useBudgetsData';
import { useEditBudget } from '@/features/budgets/hooks/useEditBudget';
import { useEditGoal } from '@/features/budgets/hooks/useEditGoal';

// Sub-components from our feature folder
import { AddBudgetModal } from '@/features/budgets/components/AddBudgetModal';
import { AddGoalModal } from '@/features/budgets/components/AddGoalModal';
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { EditBudgetModal } from '@/features/budgets/components/EditBudgetModal';
import { EditGoalModal } from '@/features/budgets/components/EditGoalModal';
import { GoalCard } from '@/features/budgets/components/GoalCard';

// Styles
import { styles } from '@/features/budgets/styles/budgets.styles';

export default function BudgetsScreen() {
  const { colors } = useAppTheme();

  const [activeTab, setActiveTab] = useState<'budgets' | 'goals'>('budgets');

  // Modals state
  const [addBudgetVisible, setAddBudgetVisible] = useState(false);
  const [addGoalVisible, setAddGoalVisible] = useState(false);
  const [editBudgetVisible, setEditBudgetVisible] = useState(false);
  const [editGoalVisible, setEditGoalVisible] = useState(false);

  // Selected item states
  const [selectedBudget, setSelectedBudget] = useState<any | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);

  // Data Fetching Hook
  const { budgetsList, goalsList, categoriesList, loadData } = useBudgetsData();

  // Focus effect for automatic refresh
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData, activeTab])
  );

  // Form & Action Hooks
  const addBudget = useAddBudget({
    categoriesList,
    onSuccess: () => {
      setAddBudgetVisible(false);
      loadData();
    },
  });

  const addGoal = useAddGoal({
    onSuccess: () => {
      setAddGoalVisible(false);
      loadData();
    },
  });

  const editBudget = useEditBudget({
    budget: selectedBudget,
    onSuccess: () => {
      setEditBudgetVisible(false);
      setSelectedBudget(null);
      loadData();
    },
  });

  const editGoal = useEditGoal({
    goal: selectedGoal,
    onSuccess: () => {
      setEditGoalVisible(false);
      setSelectedGoal(null);
      loadData();
    },
  });

  const handleBudgetPress = (budget: any) => {
    setSelectedBudget(budget);
    setEditBudgetVisible(true);
  };

  const handleGoalPress = (goal: Goal) => {
    setSelectedGoal(goal);
    setEditGoalVisible(true);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Page Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Limits & Targets</Text>
        <Button
          label=""
          onPress={() => (activeTab === 'budgets' ? setAddBudgetVisible(true) : setAddGoalVisible(true))}
          variant="secondary"
          size="sm"
          leftIcon={<Ionicons name="add" size={20} color={colors.primary} />}
          style={styles.headerBtn}
        />
      </View>

      {/* Tabs Selector */}
      <SegmentedControl
        options={[
          { label: 'Budgets', value: 'budgets' },
          { label: 'Goals', value: 'goals' },
        ]}
        selectedValue={activeTab}
        onChange={setActiveTab}
        style={styles.tabsContainer}
      />

      {/* Content List */}
      {activeTab === 'budgets' ? (
        budgetsList.length === 0 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.emptyCard} padding={24}>
              <Ionicons name="pie-chart-outline" size={48} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No spending budgets defined.
              </Text>
            </Card>
          </ScrollView>
        ) : (
          <AnyFlashList
            data={budgetsList}
            renderItem={({ item }: { item: any }) => <BudgetCard budget={item} onPress={() => handleBudgetPress(item)} />}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            estimatedItemSize={110}
          />
        )
      ) : (
        goalsList.length === 0 ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Card style={styles.emptyCard} padding={24}>
              <Ionicons name="trophy-outline" size={48} color={colors.textSecondary + '60'} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                No savings goals created yet.
              </Text>
            </Card>
          </ScrollView>
        ) : (
          <AnyFlashList
            data={goalsList}
            renderItem={({ item }: { item: any }) => <GoalCard goal={item} onPress={() => handleGoalPress(item)} />}
            keyExtractor={(item: any) => item.id}
            contentContainerStyle={styles.scrollContent}
            estimatedItemSize={110}
          />
        )
      )}

      {/* Add Budget Modal */}
      <AddBudgetModal
        visible={addBudgetVisible}
        onClose={() => setAddBudgetVisible(false)}
        categoriesList={categoriesList}
        {...addBudget}
      />

      {/* Add Goal Modal */}
      <AddGoalModal
        visible={addGoalVisible}
        onClose={() => setAddGoalVisible(false)}
        {...addGoal}
      />

      {/* Edit Budget Modal */}
      <EditBudgetModal
        visible={editBudgetVisible}
        onClose={() => {
          setEditBudgetVisible(false);
          setSelectedBudget(null);
        }}
        budget={selectedBudget}
        categoriesList={categoriesList}
        {...editBudget}
      />

      {/* Edit Goal Modal */}
      <EditGoalModal
        visible={editGoalVisible}
        onClose={() => {
          setEditGoalVisible(false);
          setSelectedGoal(null);
        }}
        goal={selectedGoal}
        {...editGoal}
      />
    </SafeAreaView>
  );
}
