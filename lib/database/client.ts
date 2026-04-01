import { createClient, SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    if (!client) {
      const url = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
      if (url && key) {
        client = createClient(url, key);
      } else {
        throw new Error('Supabase client configuration missing');
      }
    }
    return (client as any)[prop];
  },
});
