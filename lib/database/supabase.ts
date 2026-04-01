import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { DatabaseAdapter, DatabaseResult } from './adapter';
import type {
  User,
  Project,
  ScanFinding,
  Conversation,
  ChatMessage,
  Subscription,
} from '../types';
import { databaseConfig } from './config';
import { logAndReturnError } from './error-helper';

export class SupabaseProvider implements DatabaseAdapter {
  private client: SupabaseClient;

  constructor() {
    if (!databaseConfig.supabase.url || !databaseConfig.supabase.serviceRoleKey) {
      throw new Error('Supabase configuration is missing.');
    }

    this.client = createClient(
      databaseConfig.supabase.url,
      databaseConfig.supabase.serviceRoleKey,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  public profiles = {
    getById: async (id: string): Promise<DatabaseResult<User | null>> => {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as User, error: null };
      } catch (error) {
        return logAndReturnError(error, 'profiles.getById');
      }
    },

    update: async (id: string, updates: Partial<User>): Promise<DatabaseResult<User>> => {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as User, error: null };
      } catch (error) {
        return logAndReturnError(error, 'profiles.update');
      }
    },

    updateGitHubToken: async (id: string, token: string, username: string): Promise<DatabaseResult<User>> => {
      try {
        const { data, error } = await this.client
          .from('profiles')
          .update({ github_access_token: token, github_username: username })
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as User, error: null };
      } catch (error) {
        return logAndReturnError(error, 'profiles.updateGitHubToken');
      }
    },
  };

  public projects = {
    getByUserId: async (userId: string): Promise<DatabaseResult<Project[]>> => {
      try {
        const { data, error } = await this.client
          .from('projects')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (error) throw error;
        return { data: (data as Project[]) || [], error: null };
      } catch (error) {
        return logAndReturnError(error, 'projects.getByUserId');
      }
    },

    getById: async (id: string): Promise<DatabaseResult<Project | null>> => {
      try {
        const { data, error } = await this.client
          .from('projects')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as Project, error: null };
      } catch (error) {
        return logAndReturnError(error, 'projects.getById');
      }
    },

    create: async (project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Project>> => {
      try {
        const { data, error } = await this.client
          .from('projects')
          .insert([project])
          .select()
          .single();
        if (error) throw error;
        return { data: data as Project, error: null };
      } catch (error) {
        return logAndReturnError(error, 'projects.create');
      }
    },

    update: async (id: string, updates: Partial<Project>): Promise<DatabaseResult<Project>> => {
      try {
        const { data, error } = await this.client
          .from('projects')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as Project, error: null };
      } catch (error) {
        return logAndReturnError(error, 'projects.update');
      }
    },

    delete: async (id: string): Promise<DatabaseResult<void>> => {
      try {
        const { error } = await this.client.from('projects').delete().eq('id', id);
        if (error) throw error;
        return { data: undefined as unknown as void, error: null };
      } catch (error) {
        return logAndReturnError(error, 'projects.delete');
      }
    },
  };

  public findings = {
    getByProjectId: async (
      projectId: string,
      filters?: { category?: string; severity?: string; status?: string }
    ): Promise<DatabaseResult<ScanFinding[]>> => {
      try {
        let query = this.client
          .from('scan_findings')
          .select('*')
          .eq('project_id', projectId)
          .order('severity', { ascending: true })
          .order('created_at', { ascending: false });

        if (filters?.category) query = query.eq('category', filters.category);
        if (filters?.severity) query = query.eq('severity', filters.severity);
        if (filters?.status) query = query.eq('status', filters.status);

        const { data, error } = await query;
        if (error) throw error;
        return { data: (data as ScanFinding[]) || [], error: null };
      } catch (error) {
        return logAndReturnError(error, 'findings.getByProjectId');
      }
    },

    getById: async (id: string): Promise<DatabaseResult<ScanFinding | null>> => {
      try {
        const { data, error } = await this.client
          .from('scan_findings')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as ScanFinding, error: null };
      } catch (error) {
        return logAndReturnError(error, 'findings.getById');
      }
    },

    createMany: async (findings: Omit<ScanFinding, 'id' | 'created_at'>[]): Promise<DatabaseResult<ScanFinding[]>> => {
      try {
        const { data, error } = await this.client
          .from('scan_findings')
          .insert(findings)
          .select();
        if (error) throw error;
        return { data: (data as ScanFinding[]) || [], error: null };
      } catch (error) {
        return logAndReturnError(error, 'findings.createMany');
      }
    },

    update: async (id: string, updates: Partial<ScanFinding>): Promise<DatabaseResult<ScanFinding>> => {
      try {
        const { data, error } = await this.client
          .from('scan_findings')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as ScanFinding, error: null };
      } catch (error) {
        return logAndReturnError(error, 'findings.update');
      }
    },

    deleteByScanId: async (scanId: string): Promise<DatabaseResult<void>> => {
      try {
        const { error } = await this.client.from('scan_findings').delete().eq('scan_id', scanId);
        if (error) throw error;
        return { data: undefined as unknown as void, error: null };
      } catch (error) {
        return logAndReturnError(error, 'findings.deleteByScanId');
      }
    },
  };

  public conversations = {
    getByProjectId: async (projectId: string): Promise<DatabaseResult<Conversation[]>> => {
      try {
        const { data, error } = await this.client
          .from('conversations')
          .select('*')
          .eq('project_id', projectId)
          .order('updated_at', { ascending: false });
        if (error) throw error;
        return { data: (data as Conversation[]) || [], error: null };
      } catch (error) {
        return logAndReturnError(error, 'conversations.getByProjectId');
      }
    },

    getById: async (id: string): Promise<DatabaseResult<Conversation | null>> => {
      try {
        const { data, error } = await this.client
          .from('conversations')
          .select('*')
          .eq('id', id)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as Conversation, error: null };
      } catch (error) {
        return logAndReturnError(error, 'conversations.getById');
      }
    },

    create: async (conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Conversation>> => {
      try {
        const { data, error } = await this.client
          .from('conversations')
          .insert([conversation])
          .select()
          .single();
        if (error) throw error;
        return { data: data as Conversation, error: null };
      } catch (error) {
        return logAndReturnError(error, 'conversations.create');
      }
    },

    update: async (id: string, updates: Partial<Conversation>): Promise<DatabaseResult<Conversation>> => {
      try {
        const { data, error } = await this.client
          .from('conversations')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as Conversation, error: null };
      } catch (error) {
        return logAndReturnError(error, 'conversations.update');
      }
    },
  };

  public messages = {
    getByConversationId: async (conversationId: string): Promise<DatabaseResult<ChatMessage[]>> => {
      try {
        const { data, error } = await this.client
          .from('messages')
          .select('*')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true });
        if (error) throw error;
        return { data: (data as ChatMessage[]) || [], error: null };
      } catch (error) {
        return logAndReturnError(error, 'messages.getByConversationId');
      }
    },

    create: async (message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<DatabaseResult<ChatMessage>> => {
      try {
        const { data, error } = await this.client
          .from('messages')
          .insert([message])
          .select()
          .single();
        if (error) throw error;
        return { data: data as ChatMessage, error: null };
      } catch (error) {
        return logAndReturnError(error, 'messages.create');
      }
    },
  };

  public subscriptions = {
    getByUserId: async (userId: string): Promise<DatabaseResult<Subscription | null>> => {
      try {
        const { data, error } = await this.client
          .from('subscriptions')
          .select('*')
          .eq('user_id', userId)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as Subscription, error: null };
      } catch (error) {
        return logAndReturnError(error, 'subscriptions.getByUserId');
      }
    },

    create: async (subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Subscription>> => {
      try {
        const { data, error } = await this.client
          .from('subscriptions')
          .insert([subscription])
          .select()
          .single();
        if (error) throw error;
        return { data: data as Subscription, error: null };
      } catch (error) {
        return logAndReturnError(error, 'subscriptions.create');
      }
    },

    update: async (id: string, updates: Partial<Subscription>): Promise<DatabaseResult<Subscription>> => {
      try {
        const { data, error } = await this.client
          .from('subscriptions')
          .update(updates)
          .eq('id', id)
          .select()
          .single();
        if (error) throw error;
        return { data: data as Subscription, error: null };
      } catch (error) {
        return logAndReturnError(error, 'subscriptions.update');
      }
    },

    getByStripeCustomerId: async (customerId: string): Promise<DatabaseResult<Subscription | null>> => {
      try {
        const { data, error } = await this.client
          .from('subscriptions')
          .select('*')
          .eq('stripe_customer_id', customerId)
          .single();
        if (error) {
          if (error.code === 'PGRST116') return { data: null, error: null };
          throw error;
        }
        return { data: data as Subscription, error: null };
      } catch (error) {
        return logAndReturnError(error, 'subscriptions.getByStripeCustomerId');
      }
    },
  };
}
