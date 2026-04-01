import { subscriptionPlans, trialLimits } from '@/lib/stripe';

describe('subscriptionPlans', () => {
  it('has exactly 3 plans (starter, pro, team)', () => {
    const keys = Object.keys(subscriptionPlans);
    expect(keys).toHaveLength(3);
    expect(keys).toEqual(expect.arrayContaining(['starter', 'pro', 'team']));
  });

  it('starter plan has price 29 and tier starter', () => {
    expect(subscriptionPlans.starter.price).toBe(29);
    expect(subscriptionPlans.starter.tier).toBe('starter');
  });

  it('pro plan has price 79 and pr_creation enabled', () => {
    expect(subscriptionPlans.pro.price).toBe(79);
    expect(subscriptionPlans.pro.limits.pr_creation).toBe(true);
  });

  it('team plan has price 199 and unlimited projects (-1)', () => {
    expect(subscriptionPlans.team.price).toBe(199);
    expect(subscriptionPlans.team.limits.projects).toBe(-1);
  });
});

describe('trialLimits', () => {
  it('has 14 days, 1 project, 3 scans, and 10 messages', () => {
    expect(trialLimits.duration_days).toBe(14);
    expect(trialLimits.projects).toBe(1);
    expect(trialLimits.scans_per_month).toBe(3);
    expect(trialLimits.messages_per_day).toBe(10);
  });
});
