import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  if (!stripe) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 500 });
  }

  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getSupabaseAdmin();

  try {
    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        const priceId = subscription.items?.data?.[0]?.price?.id;
        let plan = 'starter';
        if (priceId === process.env.STRIPE_PRO_PRICE_ID) plan = 'pro';
        if (priceId === process.env.STRIPE_TEAM_PRICE_ID) plan = 'team';

        await supabase
          .from('subscriptions')
          .upsert({
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            plan,
            status: subscription.status === 'active' ? 'active' : subscription.status,
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
          }, { onConflict: 'stripe_customer_id' });

        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any;
        const customerId = subscription.customer as string;

        await supabase
          .from('subscriptions')
          .update({ status: 'canceled' })
          .eq('stripe_customer_id', customerId);

        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as any;
        const customerId = invoice.customer as string;

        await supabase
          .from('subscriptions')
          .update({ status: 'past_due' })
          .eq('stripe_customer_id', customerId);

        break;
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}
