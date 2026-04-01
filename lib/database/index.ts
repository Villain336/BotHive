import { validateDatabaseConfig } from './config';
import type { DatabaseAdapter } from './adapter';
import type { DatabaseResult } from './adapter';

let databaseProvider: DatabaseAdapter | null = null;

export async function initializeDatabase(): Promise<void> {
  try {
    validateDatabaseConfig();
    const { SupabaseProvider } = await import('./supabase');
    databaseProvider = new SupabaseProvider();
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export function getDatabaseAdapter(): DatabaseAdapter {
  if (!databaseProvider) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return databaseProvider;
}

export function getDatabase(): DatabaseAdapter {
  return getDatabaseAdapter();
}

export type { DatabaseResult, DatabaseAdapter };
export { initializeDatabase as init };
