'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { subscriptionPlans, trialLimits } from '@/lib/stripe';

const plans = [
  {
    name: 'Trial',
    price: 0,
    description: '14-day free trial to explore the platform',
    features: [
      `${trialLimits.projects} project`,
      `${trialLimits.scans_per_month} scans/month`,
      `${trialLimits.messages_per_day} AI messages/day`,
      'All 4 compliance categories',
      'Compliance scorecard',
    ],
    cta: 'Start Free Trial',
    highlighted: false,
  },
  {
    name: subscriptionPlans.starter.name,
    price: subscriptionPlans.starter.price,
    description: subscriptionPlans.starter.description,
    features: subscriptionPlans.starter.features,
    cta: 'Get Started',
    highlighted: false,
  },
  {
    name: subscriptionPlans.pro.name,
    price: subscriptionPlans.pro.price,
    description: subscriptionPlans.pro.description,
    features: subscriptionPlans.pro.features,
    cta: 'Go Pro',
    highlighted: true,
  },
  {
    name: subscriptionPlans.team.name,
    price: subscriptionPlans.team.price,
    description: subscriptionPlans.team.description,
    features: subscriptionPlans.team.features,
    cta: 'Contact Sales',
    highlighted: false,
  },
];

export default function PricingPage() {
  return (
    <div className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Simple, transparent pricing
          </h1>
          <p className="mt-6 text-lg text-muted-foreground">
            Start with a 14-day free trial. Upgrade when you need more projects and features.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {plans.map((plan) => (
            <Card
              key={plan.name}
              className={plan.highlighted ? 'border-primary shadow-lg relative' : ''}
            >
              {plan.highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-primary-foreground text-xs font-medium px-3 py-1 rounded-full">
                    Most Popular
                  </span>
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">${plan.price}</span>
                  {plan.price > 0 && (
                    <span className="text-muted-foreground">/month</span>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </CardContent>
              <CardFooter>
                <Link href="/sign-up" className="w-full">
                  <Button
                    className="w-full"
                    variant={plan.highlighted ? 'default' : 'outline'}
                  >
                    {plan.cta}
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
