import { createClient } from '@/lib/supabase-server';
import { stripe, PLANS, PlanType } from '@/lib/stripe';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { plan } = await request.json() as { plan: PlanType };
    if (!plan || !PLANS[plan]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const origin = request.headers.get('origin') || 'https://cleaveapp.com';

    // Get or create Stripe customer
    let stripeCustomerId: string;

    const { data: existing } = await supabase
      .from('stripe_customers')
      .select('stripe_customer_id')
      .eq('profile_id', user.id)
      .maybeSingle();

    if (existing?.stripe_customer_id) {
      stripeCustomerId = existing.stripe_customer_id;
    } else {
      const customer = await stripe.customers.create({
        email: user.email,
        metadata: { profile_id: user.id },
      });
      stripeCustomerId = customer.id;

      await supabase.from('stripe_customers').insert({
        profile_id: user.id,
        stripe_customer_id: stripeCustomerId,
      });
    }

    // Create checkout session
    if (plan === 'founding') {
      // One-time payment
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'payment',
        line_items: [{
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.name,
              description: 'Lifetime access to Cleave — Founding Member',
            },
            unit_amount: planConfig.price,
          },
          quantity: 1,
        }],
        success_url: `${origin}/profile?checkout=success&plan=${plan}`,
        cancel_url: `${origin}/profile?checkout=cancel`,
        metadata: {
          profile_id: user.id,
          plan_type: plan,
        },
      });

      return NextResponse.json({ url: session.url });
    } else {
      // Subscription
      const session = await stripe.checkout.sessions.create({
        customer: stripeCustomerId,
        mode: 'subscription',
        line_items: [{
          price_data: {
            currency: planConfig.currency,
            product_data: {
              name: planConfig.name,
              description: `Covenant Plus — ${planConfig.interval === 'month' ? 'Monthly' : 'Yearly'} subscription`,
            },
            unit_amount: planConfig.price,
            recurring: {
              interval: planConfig.interval!,
            },
          },
          quantity: 1,
        }],
        success_url: `${origin}/profile?checkout=success&plan=${plan}`,
        cancel_url: `${origin}/profile?checkout=cancel`,
        metadata: {
          profile_id: user.id,
          plan_type: plan,
        },
      });

      return NextResponse.json({ url: session.url });
    }
  } catch (err) {
    console.error('Checkout error:', err);
    return NextResponse.json({ error: 'Failed to create checkout session' }, { status: 500 });
  }
}
