export type SubscriptionTier = 'trial' | 'starter' | 'pro' | 'team';

export type ScanCategory = 'testing' | 'security' | 'legal' | 'ops';

export type FindingSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type FindingStatus = 'open' | 'in_progress' | 'fixed' | 'dismissed';

export type ProjectStatus = 'pending' | 'scanning' | 'ready' | 'error';

export type ConversationCategory = ScanCategory | 'general';

export interface User {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string;
  github_username?: string;
  subscription_tier: SubscriptionTier;
  trial_ends_at?: string;
  scans_used_this_month: number;
}

export interface Project {
  id: string;
  user_id: string;
  github_repo_url: string;
  github_repo_name: string;
  github_default_branch: string;
  last_scan_at?: string;
  overall_score?: number;
  test_score?: number;
  security_score?: number;
  legal_score?: number;
  ops_score?: number;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export interface ScanFinding {
  id: string;
  project_id: string;
  scan_id: string;
  category: ScanCategory;
  severity: FindingSeverity;
  title: string;
  description: string;
  file_path?: string;
  line_number?: number;
  fix_suggestion?: string;
  status: FindingStatus;
  fixed_at?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  project_id: string;
  user_id: string;
  category: ConversationCategory;
  finding_id?: string;
  title: string;
  status: 'active' | 'resolved';
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: Record<string, unknown>;
  created_at: string;
}

export interface Subscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan: SubscriptionTier;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  limits: {
    projects: number;
    scans_per_month: number;
    messages_per_day: number;
    pr_creation: boolean;
  };
  stripePriceId: string;
  tier: SubscriptionTier;
}
