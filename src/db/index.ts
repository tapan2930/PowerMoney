import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the SQLite database file
export const expoDb = openDatabaseSync('powermoney.db', {
  enableChangeListener: true, // Enables change listener for reactive UI (if supported/needed)
});

// Safety check: ensure schema migrations are applied correctly
try {
  const tableCheck = expoDb.getAllSync<{ name: string }>(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='recurring_transactions'"
  );
  if (tableCheck.length === 0) {
    console.log('Safety check: recurring_transactions table is missing. Re-creating...');
    
    // Create the table
    expoDb.execSync(`
      CREATE TABLE IF NOT EXISTS \`recurring_transactions\` (
        \`id\` text PRIMARY KEY NOT NULL,
        \`type\` text NOT NULL,
        \`amount\` real NOT NULL,
        \`account_id\` text NOT NULL,
        \`to_account_id\` text,
        \`category_id\` text,
        \`description\` text,
        \`merchant\` text,
        \`frequency\` text NOT NULL,
        \`interval\` integer DEFAULT 1 NOT NULL,
        \`start_date\` text NOT NULL,
        \`end_date\` text,
        \`max_occurrences\` integer,
        \`completed_occurrences\` integer DEFAULT 0 NOT NULL,
        \`next_run_date\` text NOT NULL,
        \`last_run_date\` text,
        \`is_active\` integer DEFAULT 1,
        \`created_at\` text,
        \`updated_at\` text,
        FOREIGN KEY (\`account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE cascade,
        FOREIGN KEY (\`to_account_id\`) REFERENCES \`accounts\`(\`id\`) ON UPDATE no action ON DELETE set null,
        FOREIGN KEY (\`category_id\`) REFERENCES \`categories\`(\`id\`) ON UPDATE no action ON DELETE set null
      );
    `);

    // Add columns to transactions (wrap in try-catch in case they already exist)
    try {
      expoDb.execSync("ALTER TABLE `transactions` ADD `to_account_id` text;");
    } catch (e) {
      console.log('to_account_id column already exists or could not be added:', e);
    }

    try {
      expoDb.execSync("ALTER TABLE `transactions` ADD `recurring_transaction_id` text;");
    } catch (e) {
      console.log('recurring_transaction_id column already exists or could not be added:', e);
    }
  }

  // Ensure preferred_time column exists in recurring_transactions (wrap in try-catch)
  try {
    expoDb.execSync("ALTER TABLE `recurring_transactions` ADD COLUMN `preferred_time` text;");
    console.log('Safety check: added preferred_time column to recurring_transactions');
  } catch (e) {
    // Column already exists
  }

  // Ensure time column exists in transactions (wrap in try-catch)
  try {
    expoDb.execSync("ALTER TABLE `transactions` ADD COLUMN `time` text;");
    console.log('Safety check: added time column to transactions');
  } catch (e) {
    // Column already exists
  }
} catch (e) {
  console.error('Error in database schema safety check:', e);
}

// Create the Drizzle database client
export const db = drizzle(expoDb, { schema });
