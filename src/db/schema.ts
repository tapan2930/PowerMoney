import { sqliteTable, text, real, integer, primaryKey } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Accounts (bank accounts, credit cards, cash, etc.)
export const accounts = sqliteTable('accounts', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  name: text('name').notNull(),
  type: text('type', { enum: ['bank', 'credit_card', 'cash', 'savings', 'investment', 'other'] }).notNull(),
  balance: real('balance').notNull().default(0),
  currency: text('currency').notNull().default('USD'),
  color: text('color'), // hex color for UI
  icon: text('icon'),   // icon name
  isArchived: integer('is_archived', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Categories (hierarchical — parent/child)
export const categories = sqliteTable('categories', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  name: text('name').notNull(),
  icon: text('icon'),
  color: text('color'),
  type: text('type', { enum: ['income', 'expense'] }).notNull(),
  parentId: text('parent_id'), // References categories.id (self-referential)
  sortOrder: integer('sort_order').default(0),
  isSystem: integer('is_system', { mode: 'boolean' }).default(false), // pre-built categories
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Tags (user-defined labels)
export const tags = sqliteTable('tags', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  name: text('name').notNull().unique(),
  color: text('color'),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Transactions (income/expense records)
export const transactions = sqliteTable('transactions', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: text('to_account_id').references(() => accounts.id, { onDelete: 'set null' }), // destination account for transfers
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  description: text('description'),
  merchant: text('merchant'),              // original merchant name from statement
  date: text('date').notNull(),            // ISO 8601 date YYYY-MM-DD
  notes: text('notes'),
  isRecurring: integer('is_recurring', { mode: 'boolean' }).default(false),
  recurringTransactionId: text('recurring_transaction_id'), // links to the recurring rule that generated this
  importHash: text('import_hash'),         // hash to prevent duplicate imports
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Recurring Transactions (templates that generate real transactions on schedule)
export const recurringTransactions = sqliteTable('recurring_transactions', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  type: text('type', { enum: ['income', 'expense', 'transfer'] }).notNull(),
  amount: real('amount').notNull(),
  accountId: text('account_id').notNull().references(() => accounts.id, { onDelete: 'cascade' }),
  toAccountId: text('to_account_id').references(() => accounts.id, { onDelete: 'set null' }), // for transfers
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'set null' }),
  description: text('description'),
  merchant: text('merchant'),

  // Recurrence Rule
  frequency: text('frequency', { enum: ['daily', 'weekly', 'monthly', 'yearly'] }).notNull(),
  interval: integer('interval').notNull().default(1),   // e.g. 2 = every 2 weeks
  startDate: text('start_date').notNull(),               // ISO YYYY-MM-DD
  endDate: text('end_date'),                             // NULL = no end date
  maxOccurrences: integer('max_occurrences'),             // NULL = unlimited
  completedOccurrences: integer('completed_occurrences').notNull().default(0),
  nextRunDate: text('next_run_date').notNull(),           // next scheduled execution date
  lastRunDate: text('last_run_date'),                     // last time a transaction was generated

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Transaction-Tag junction table
export const transactionTags = sqliteTable('transaction_tags', {
  transactionId: text('transaction_id').notNull().references(() => transactions.id, { onDelete: 'cascade' }),
  tagId: text('tag_id').notNull().references(() => tags.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.transactionId, t.tagId] }),
}));

// Budgets
export const budgets = sqliteTable('budgets', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  name: text('name').notNull(),
  amount: real('amount').notNull(), // budget limit
  period: text('period', { enum: ['weekly', 'monthly', 'yearly', 'custom'] }).notNull(),
  startDate: text('start_date'),
  endDate: text('end_date'),
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }), // NULL = overall budget
  color: text('color'),
  icon: text('icon'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// Savings Goals
export const goals = sqliteTable('goals', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  name: text('name').notNull(),
  targetAmount: real('target_amount').notNull(),
  currentAmount: real('current_amount').notNull().default(0),
  deadline: text('deadline'),
  icon: text('icon'),
  color: text('color'),
  isCompleted: integer('is_completed', { mode: 'boolean' }).default(false),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
  updatedAt: text('updated_at').$defaultFn(() => new Date().toISOString()),
});

// AI Chat History
export const chatMessages = sqliteTable('chat_messages', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  role: text('role', { enum: ['user', 'assistant', 'system'] }).notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// App Settings (key-value store)
export const settings = sqliteTable('settings', {
  key: text('key').primaryKey(),
  value: text('value'),
});

// Categorization Rules
export const categorizationRules = sqliteTable('categorization_rules', {
  id: text('id').primaryKey().$defaultFn(() => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)),
  keyword: text('keyword').notNull(),       // merchant keyword pattern (e.g. "STARBUCKS")
  categoryId: text('category_id').references(() => categories.id, { onDelete: 'cascade' }),
  isUserDefined: integer('is_user_defined', { mode: 'boolean' }).default(false),
  priority: integer('priority').default(0),  // higher = checked first
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Relations for easier Drizzle querying
export const accountsRelations = relations(accounts, ({ many }) => ({
  transactions: many(transactions, { relationName: 'transaction_source_account' }),
  incomingTransfers: many(transactions, { relationName: 'transaction_dest_account' }),
  recurringTransactions: many(recurringTransactions),
}));

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'category_hierarchy',
  }),
  children: many(categories, {
    relationName: 'category_hierarchy',
  }),
  transactions: many(transactions),
  budgets: many(budgets),
}));

export const transactionsRelations = relations(transactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [transactions.accountId],
    references: [accounts.id],
    relationName: 'transaction_source_account',
  }),
  toAccount: one(accounts, {
    fields: [transactions.toAccountId],
    references: [accounts.id],
    relationName: 'transaction_dest_account',
  }),
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
  recurringTransaction: one(recurringTransactions, {
    fields: [transactions.recurringTransactionId],
    references: [recurringTransactions.id],
  }),
  tags: many(transactionTags),
}));

export const transactionTagsRelations = relations(transactionTags, ({ one }) => ({
  transaction: one(transactions, {
    fields: [transactionTags.transactionId],
    references: [transactions.id],
  }),
  tag: one(tags, {
    fields: [transactionTags.tagId],
    references: [tags.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const recurringTransactionsRelations = relations(recurringTransactions, ({ one, many }) => ({
  account: one(accounts, {
    fields: [recurringTransactions.accountId],
    references: [accounts.id],
  }),
  toAccount: one(accounts, {
    fields: [recurringTransactions.toAccountId],
    references: [accounts.id],
  }),
  category: one(categories, {
    fields: [recurringTransactions.categoryId],
    references: [categories.id],
  }),
  generatedTransactions: many(transactions),
}));
