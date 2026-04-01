export interface DatabaseConfig {
  supabase: {
    url: string;
    anonKey: string;
    serviceRoleKey: string;
  };
}

export const databaseConfig: DatabaseConfig = {
  supabase: {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  },
};

export function validateDatabaseConfig(): void {
  if (!databaseConfig.supabase.url) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL');
  }
  if (!databaseConfig.supabase.serviceRoleKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  }
}
