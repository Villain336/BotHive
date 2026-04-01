'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth';
import { subscriptionPlans } from '@/lib/stripe';
import { CreditCard } from 'lucide-react';

export default function BillingPage() {
  const { user } = useAuth();

  const handleUpgrade = async (plan: string) => {
    try {
      const res = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error('Checkout error', e);
    }
  };

  const handleManage = async () => {
    try {
      const res = await fetch('/api/billing/portal', { method: 'POST' });
      const { url } = await res.json();
      if (url) window.location.href = url;
    } catch (e) {
      console.error('Portal error', e);
    }
  };

  const currentTier = user?.subscription_tier || 'trial';

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Billing</h1>
      <p className="text-muted-foreground mb-8">Manage your subscription and billing</p>

      <Card className="mb-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Current Plan
              </CardTitle>
              <CardDescription>Your active subscription</CardDescription>
            </div>
            <Badge className="capitalize text-lg px-3 py-1">{currentTier}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentTier === 'trial' ? (
            <p className="text-sm text-muted-foreground">
              You are on the 14-day free trial.
              {user?.trial_ends_at && ` Trial ends ${new Date(user.trial_ends_at).toLocaleDateString()}.`}
            </p>
          ) : (
            <Button onClick={handleManage} variant="outline">
              Manage Subscription
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Object.entries(subscriptionPlans).map(([key, plan]) => (
          <Card key={key} className={currentTier === plan.tier ? 'border-primary' : ''}>
            <CardHeader>
              <CardTitle>{plan.name}</CardTitle>
              <CardDescription>{plan.description}</CardDescription>
              <div className="mt-2">
                <span className="text-3xl font-bold">${plan.price}</span>
                <span className="text-muted-foreground">/mo</span>
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm mb-4">
                {plan.features.map((f) => (
                  <li key={f}>- {f}</li>
                ))}
              </ul>
              {currentTier === plan.tier ? (
                <Button disabled className="w-full">Current Plan</Button>
              ) : (
                <Button onClick={() => handleUpgrade(key)} className="w-full">
                  Upgrade to {plan.name}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
