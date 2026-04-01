'use client';

import { create } from 'zustand';
import { User } from './types';
import { supabase } from './database/client';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  initialize: () => Promise<void>;
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
}

export const useAuth = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  error: null,
  setUser: (user) => set({ user }),

  initialize: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          set({
            user: {
              id: profile.id,
              email: session.user.email || '',
              full_name: profile.full_name || '',
              avatar_url: profile.avatar_url || session.user.user_metadata?.avatar_url || '',
              github_username: profile.github_username || '',
              subscription_tier: profile.subscription_tier || 'trial',
              trial_ends_at: profile.trial_ends_at || undefined,
              scans_used_this_month: profile.scans_used_this_month || 0,
            },
            isLoading: false,
          });
          return;
        }
      }

      set({ user: null, isLoading: false });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('Error initializing auth:', message);
      set({ user: null, isLoading: false, error: message });
    }
  },

  signInWithGitHub: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'repo read:user',
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      set({ error: message });
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      set({ user: null, isLoading: false, error: null });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      set({ user: null, isLoading: false, error: message });
    }
  },
}));
