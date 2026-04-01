import type {
  Project,
  ScanFinding,
  Conversation,
  ChatMessage,
  Subscription,
  User,
} from '../types';

export type DatabaseResult<T> = {
  data: T;
  error: null;
} | {
  data: null;
  error: Error;
};

export interface DatabaseAdapter {
  profiles: {
    getById(id: string): Promise<DatabaseResult<User | null>>;
    update(id: string, updates: Partial<User>): Promise<DatabaseResult<User>>;
    updateGitHubToken(id: string, token: string, username: string): Promise<DatabaseResult<User>>;
  };

  projects: {
    getByUserId(userId: string): Promise<DatabaseResult<Project[]>>;
    getById(id: string): Promise<DatabaseResult<Project | null>>;
    create(project: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Project>>;
    update(id: string, updates: Partial<Project>): Promise<DatabaseResult<Project>>;
    delete(id: string): Promise<DatabaseResult<void>>;
  };

  findings: {
    getByProjectId(projectId: string, filters?: {
      category?: string;
      severity?: string;
      status?: string;
    }): Promise<DatabaseResult<ScanFinding[]>>;
    getById(id: string): Promise<DatabaseResult<ScanFinding | null>>;
    createMany(findings: Omit<ScanFinding, 'id' | 'created_at'>[]): Promise<DatabaseResult<ScanFinding[]>>;
    update(id: string, updates: Partial<ScanFinding>): Promise<DatabaseResult<ScanFinding>>;
    deleteByScanId(scanId: string): Promise<DatabaseResult<void>>;
  };

  conversations: {
    getByProjectId(projectId: string): Promise<DatabaseResult<Conversation[]>>;
    getById(id: string): Promise<DatabaseResult<Conversation | null>>;
    create(conversation: Omit<Conversation, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Conversation>>;
    update(id: string, updates: Partial<Conversation>): Promise<DatabaseResult<Conversation>>;
  };

  messages: {
    getByConversationId(conversationId: string): Promise<DatabaseResult<ChatMessage[]>>;
    create(message: Omit<ChatMessage, 'id' | 'created_at'>): Promise<DatabaseResult<ChatMessage>>;
  };

  subscriptions: {
    getByUserId(userId: string): Promise<DatabaseResult<Subscription | null>>;
    create(subscription: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>): Promise<DatabaseResult<Subscription>>;
    update(id: string, updates: Partial<Subscription>): Promise<DatabaseResult<Subscription>>;
    getByStripeCustomerId(customerId: string): Promise<DatabaseResult<Subscription | null>>;
  };
}

export default DatabaseAdapter;
