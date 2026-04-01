import Stripe from 'stripe';
import type { SubscriptionPlan } from './types';

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
      typescript: true,
    })
  : null;

export const subscriptionPlans: Record<string, SubscriptionPlan> = {
  starter: {
    id: 'starter-monthly',
    name: 'Starter',
    description: 'For individual developers getting started',
    price: 29,
    interval: 'month',
    features: [
      'Up to 3 projects',
      'Unlimited repo scans',
      '50 AI chat messages/day',
      'All 4 compliance categories',
      'Export compliance reports',
    ],
    limits: {
      projects: 3,
      scans_per_month: -1,
      messages_per_day: 50,
      pr_creation: false,
    },
    stripePriceId: process.env.STRIPE_STARTER_PRICE_ID || '',
    tier: 'starter',
  },
  pro: {
    id: 'pro-monthly',
    name: 'Pro',
    description: 'For serious builders shipping to production',
    price: 79,
    interval: 'month',
    features: [
      'Up to 10 projects',
      'Unlimited scans & messages',
      'Auto-fix with PR creation',
      'Priority AI responses',
      'Advanced security scanning',
      'Custom compliance rules',
    ],
    limits: {
      projects: 10,
      scans_per_month: -1,
      messages_per_day: -1,
      pr_creation: true,
    },
    stripePriceId: process.env.STRIPE_PRO_PRICE_ID || '',
    tier: 'pro',
  },
  team: {
    id: 'team-monthly',
    name: 'Team',
    description: 'For teams and organizations',
    price: 199,
    interval: 'month',
    features: [
      'Unlimited projects',
      'Everything in Pro',
      'Team member management',
      'Shared compliance dashboard',
      'Priority support',
      'Custom integrations',
    ],
    limits: {
      projects: -1,
      scans_per_month: -1,
      messages_per_day: -1,
      pr_creation: true,
    },
    stripePriceId: process.env.STRIPE_TEAM_PRICE_ID || '',
    tier: 'team',
  },
};

export const trialLimits = {
  projects: 1,
  scans_per_month: 3,
  messages_per_day: 10,
  pr_creation: false,
  duration_days: 14,
};
