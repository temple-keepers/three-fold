import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role client for webhook handling (no user session)
function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(request: Request) {
  const body = await request.text();
  const sig = request.headers.get('stripe-signature');

  if (!sig) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = getAdminClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const profileId = session.metadata?.profile_id;
        const planType = session.metadata?.plan_type;

        if (!profileId || !planType) break;

        if (session.mode === 'payment') {
          // One-time founding member payment
          await supabase.from('subscriptions').upsert({
            profile_id: profileId,
            plan_type: planType,
            status: 'active',
            current_period_start: new Date().toISOString(),
            current_period_end: new Date('2099-12-31').toISOString(), // lifetime
            updated_at: new Date().toISOString(),
          }, { onConflict: 'profile_id' });

          // Log payment
          if (session.payment_intent && typeof session.payment_intent === 'string') {
            await supabase.from('payments').insert({
              profile_id: profileId,
              stripe_payment_intent_id: session.payment_intent,
              amount_cents: session.amount_total || 0,
              currency: session.currency || 'gbp',
              status: 'succeeded',
              plan_type: planType,
            });
          }
        } else if (session.mode === 'subscription' && session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id;

          // Fetch the full subscription to get period details
          const sub = await stripe.subscriptions.retrieve(subscriptionId);

          await supabase.from('subscriptions').upsert({
            profile_id: profileId,
            stripe_subscription_id: subscriptionId,
            stripe_price_id: sub.items.data[0]?.price.id,
            plan_type: planType,
            status: 'active',
            current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            cancel_at_period_end: sub.cancel_at_period_end,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'profile_id' });
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        if (subscriptionId) {
          const sub = await stripe.subscriptions.retrieve(subscriptionId);
          const { data: existing } = await supabase
            .from('subscriptions')
            .select('id, profile_id')
            .eq('stripe_subscription_id', subscriptionId)
            .maybeSingle();

          if (existing) {
            await supabase.from('subscriptions').update({
              status: 'active',
              current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
              current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString(),
            }).eq('id', existing.id);

            // Log payment
            if (invoice.payment_intent && typeof invoice.payment_intent === 'string') {
              await supabase.from('payments').insert({
                profile_id: existing.profile_id,
                stripe_payment_intent_id: invoice.payment_intent,
                amount_cents: invoice.amount_paid || 0,
                currency: invoice.currency || 'gbp',
                status: 'succeeded',
                plan_type: sub.metadata?.plan_type,
              });
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object;
        const subscriptionId = typeof invoice.subscription === 'string'
          ? invoice.subscription
          : invoice.subscription?.id;

        if (subscriptionId) {
          await supabase.from('subscriptions')
            .update({ status: 'past_due', updated_at: new Date().toISOString() })
            .eq('stripe_subscription_id', subscriptionId);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const sub = event.data.object;
        const { data: existing } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('stripe_subscription_id', sub.id)
          .maybeSingle();

        if (existing) {
          const statusMap: Record<string, string> = {
            active: 'active',
            past_due: 'past_due',
            canceled: 'canceled',
            incomplete: 'incomplete',
            trialing: 'trialing',
          };

          await supabase.from('subscriptions').update({
            status: statusMap[sub.status] || sub.status,
            cancel_at_period_end: sub.cancel_at_period_end,
            current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          }).eq('id', existing.id);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const sub = event.data.object;
        await supabase.from('subscriptions')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', sub.id);
        break;
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
