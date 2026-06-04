import { drizzle } from 'drizzle-orm/expo-sqlite';
import { openDatabaseSync } from 'expo-sqlite';
import * as schema from './schema';

// Open the SQLite database file
export const expoDb = openDatabaseSync('powermoney.db', {
  enableChangeListener: true, // Enables change listener for reactive UI (if supported/needed)
});

// Create the Drizzle database client
export const db = drizzle(expoDb, { schema });
