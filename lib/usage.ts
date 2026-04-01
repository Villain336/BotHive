import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { trialLimits, subscriptionPlans } from '@/lib/stripe';
import type { SubscriptionTier } from '@/lib/types';

interface UsageLimits {
  projects: number;
  scans_per_month: number;
  messages_per_day: number;
  pr_creation: boolean;
}

export function getLimitsForTier(tier: SubscriptionTier): UsageLimits {
  if (tier === 'trial') {
    return trialLimits;
  }
  const plan = subscriptionPlans[tier];
  if (plan) {
    return plan.limits;
  }
  return trialLimits;
}

export async function checkTrialExpired(userId: string): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, trial_ends_at')
    .eq('id', userId)
    .single();

  if (!profile) return true;
  if (profile.subscription_tier !== 'trial') return false;
  if (!profile.trial_ends_at) return false;

  return new Date(profile.trial_ends_at) < new Date();
}

export async function checkScanLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();
  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, scans_used_this_month, trial_ends_at')
    .eq('id', userId)
    .single();

  if (!profile) return { allowed: false, reason: 'Profile not found' };

  const tier = profile.subscription_tier as SubscriptionTier;
  const limits = getLimitsForTier(tier);

  // Check trial expiry
  if (tier === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
    return { allowed: false, reason: 'Your free trial has expired. Upgrade to continue scanning.' };
  }

  // -1 means unlimited
  if (limits.scans_per_month === -1) return { allowed: true };

  if (profile.scans_used_this_month >= limits.scans_per_month) {
    return {
      allowed: false,
      reason: `You've used all ${limits.scans_per_month} scans this month. Upgrade your plan for more.`,
    };
  }

  return { allowed: true };
}

export async function checkMessageLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, trial_ends_at')
    .eq('id', userId)
    .single();

  if (!profile) return { allowed: false, reason: 'Profile not found' };

  const tier = profile.subscription_tier as SubscriptionTier;
  const limits = getLimitsForTier(tier);

  // Check trial expiry
  if (tier === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
    return { allowed: false, reason: 'Your free trial has expired. Upgrade to continue chatting.' };
  }

  // -1 means unlimited
  if (limits.messages_per_day === -1) return { allowed: true };

  // Count today's messages — first get user's conversation IDs, then count messages
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const { data: userConvs } = await supabase
    .from('conversations')
    .select('id')
    .eq('user_id', userId);

  const convIds = (userConvs || []).map((c: { id: string }) => c.id);

  let count = 0;
  if (convIds.length > 0) {
    const { count: msgCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('role', 'user')
      .gte('created_at', todayStart.toISOString())
      .in('conversation_id', convIds);
    count = msgCount ?? 0;
  }

  if (count >= limits.messages_per_day) {
    return {
      allowed: false,
      reason: `You've reached your daily limit of ${limits.messages_per_day} messages. Upgrade for more.`,
    };
  }

  return { allowed: true };
}

export async function checkProjectLimit(userId: string): Promise<{ allowed: boolean; reason?: string }> {
  const supabase = getSupabaseAdmin();

  const { data: profile } = await supabase
    .from('profiles')
    .select('subscription_tier, trial_ends_at')
    .eq('id', userId)
    .single();

  if (!profile) return { allowed: false, reason: 'Profile not found' };

  const tier = profile.subscription_tier as SubscriptionTier;
  const limits = getLimitsForTier(tier);

  if (tier === 'trial' && profile.trial_ends_at && new Date(profile.trial_ends_at) < new Date()) {
    return { allowed: false, reason: 'Your free trial has expired. Upgrade to add projects.' };
  }

  if (limits.projects === -1) return { allowed: true };

  const { count } = await supabase
    .from('projects')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId);

  const projectCount = count ?? 0;

  if (projectCount >= limits.projects) {
    return {
      allowed: false,
      reason: `You've reached your limit of ${limits.projects} projects. Upgrade for more.`,
    };
  }

  return { allowed: true };
}
