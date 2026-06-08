import { db } from '../index';
import { accounts, transactions, categories, budgets, tags } from '../schema';
import { desc, eq, sql, and, gte, lte } from 'drizzle-orm';

// Get all accounts and calculate total balance
export async function getAccounts() {
  return await db.select().from(accounts).where(eq(accounts.isArchived, false));
}

// Get recent transactions with categories joined
export async function getRecentTransactions(limit = 10) {
  return await db
    .select({
      id: transactions.id,
      amount: transactions.amount,
      type: transactions.type,
      description: transactions.description,
      merchant: transactions.merchant,
      date: transactions.date,
      notes: transactions.notes,
      categoryName: categories.name,
      categoryIcon: categories.icon,
      categoryColor: categories.color,
      accountName: accounts.name,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .leftJoin(accounts, eq(transactions.accountId, accounts.id))
    .orderBy(desc(transactions.date), desc(transactions.createdAt))
    .limit(limit);
}

// Get total balance, total income, and total expenses for a given period
export async function getFinancialSummary(startDate?: string, endDate?: string) {
  const incomeFilters = [
    eq(transactions.type, 'income'),
    sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
  ];
  const expenseFilters = [
    eq(transactions.type, 'expense'),
    sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
  ];

  if (startDate && endDate) {
    incomeFilters.push(
      sql`${transactions.date} >= ${startDate}`,
      sql`${transactions.date} <= ${endDate}`
    );
    expenseFilters.push(
      sql`${transactions.date} >= ${startDate}`,
      sql`${transactions.date} <= ${endDate}`
    );
  }

  const incomeResult = await db
    .select({ total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...incomeFilters));

  const expenseResult = await db
    .select({ total: sql<number>`sum(${transactions.amount})` })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(and(...expenseFilters));

  const totalIncome = incomeResult[0]?.total ?? 0;
  const totalExpense = expenseResult[0]?.total ?? 0;

  const accountsList = await getAccounts();
  const netBalance = accountsList.reduce((acc, curr) => acc + curr.balance, 0);

  return {
    netBalance,
    totalIncome,
    totalExpense,
    savingsRate: totalIncome > 0 ? ((totalIncome - totalExpense) / totalIncome) * 100 : 0,
  };
}

function formatLocalDate(date: Date): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function getBudgetPeriodDates(period: string, budgetStart?: string | null, budgetEnd?: string | null) {
  const now = new Date();
  let startDateStr = '';
  let endDateStr = '';

  if (period === 'weekly') {
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(now.getFullYear(), now.getMonth(), diff);
    const endOfWeek = new Date(now.getFullYear(), now.getMonth(), diff + 6);
    startDateStr = formatLocalDate(startOfWeek);
    endDateStr = formatLocalDate(endOfWeek);
  } else if (period === 'monthly') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    startDateStr = formatLocalDate(startOfMonth);
    endDateStr = formatLocalDate(endOfMonth);
  } else if (period === 'yearly') {
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31);
    startDateStr = formatLocalDate(startOfYear);
    endDateStr = formatLocalDate(endOfYear);
  } else if (period === 'custom' && budgetStart) {
    startDateStr = budgetStart;
    endDateStr = budgetEnd || formatLocalDate(now);
  }

  return { startDateStr, endDateStr };
}

// Get budgets with current spent amounts
export async function getBudgetsWithSpent() {
  const allBudgets = await db.select().from(budgets).where(eq(budgets.isActive, true));
  const results = [];

  for (const budget of allBudgets) {
    let spent = 0;
    const { startDateStr, endDateStr } = getBudgetPeriodDates(budget.period, budget.startDate, budget.endDate);

    const filters = [
      eq(transactions.type, 'expense'),
      sql`(${categories.name} IS NULL OR ${categories.name} != 'Transfer')`
    ];

    if (budget.categoryId) {
      filters.push(eq(transactions.categoryId, budget.categoryId));
    }

    if (startDateStr) {
      filters.push(gte(transactions.date, startDateStr));
    }
    if (endDateStr) {
      filters.push(lte(transactions.date, endDateStr));
    }

    const expenseSum = await db
      .select({ total: sql<number>`sum(${transactions.amount})` })
      .from(transactions)
      .leftJoin(categories, eq(transactions.categoryId, categories.id))
      .where(and(...filters));

    spent = expenseSum[0]?.total ?? 0;

    results.push({
      ...budget,
      spent,
      progress: budget.amount > 0 ? spent / budget.amount : 0,
    });
  }

  return results;
}
