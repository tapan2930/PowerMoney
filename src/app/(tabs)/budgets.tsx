import React, { useState, useCallback } from 'react';
import { View, ScrollView, Text, Pressable } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppStore } from '@/stores/useAppStore';
import { Card, Button } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/hooks/useAppTheme';

// Custom Hooks from our feature folder
import { useBudgetsData, Goal } from '@/features/budgets/hooks/useBudgetsData';
import { useAddBudget } from '@/features/budgets/hooks/useAddBudget';
import { useAddGoal } from '@/features/budgets/hooks/useAddGoal';
import { useEditBudget } from '@/features/budgets/hooks/useEditBudget';
import { useEditGoal } from '@/features/budgets/hooks/useEditGoal';

// Sub-components from our feature folder
import { BudgetCard } from '@/features/budgets/components/BudgetCard';
import { GoalCard } from '@/features/budgets/components/GoalCard';
import { AddBudgetModal } from '@/features/budgets/components/AddBudgetModal';
import { AddGoalModal } from '@/features/budgets/components/AddGoalModal';
import { EditBudgetModal } from '@/features/budgets/components/EditBudgetModal';
import { EditGoalModal } from '@/features/budgets/components/EditGoalModal';

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
      <View style={[styles.tabsContainer, { backgroundColor: colors.border + '30' }]}>
        <Pressable
          onPress={() => setActiveTab('budgets')}
          style={[styles.tabButton, activeTab === 'budgets' && { backgroundColor: colors.surface }]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'budgets' ? colors.primary : colors.textSecondary },
            ]}
          >
            Budgets
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('goals')}
          style={[styles.tabButton, activeTab === 'goals' && { backgroundColor: colors.surface }]}
        >
          <Text
            style={[
              styles.tabLabel,
              { color: activeTab === 'goals' ? colors.primary : colors.textSecondary },
            ]}
          >
            Goals
          </Text>
        </Pressable>
      </View>

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
          <FlashList
            data={budgetsList}
            renderItem={({ item }) => <BudgetCard budget={item} onPress={() => handleBudgetPress(item)} />}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.scrollContent}
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
          <FlashList
            data={goalsList}
            renderItem={({ item }) => <GoalCard goal={item} onPress={() => handleGoalPress(item)} />}
            keyExtractor={(item) => item.id}
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
