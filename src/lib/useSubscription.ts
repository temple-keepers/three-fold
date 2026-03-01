'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';

export type PlanTier = 'free' | 'plus_monthly' | 'plus_yearly' | 'founding';

interface Subscription {
  plan_type: PlanTier;
  status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
}

export function useSubscription() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data } = await supabase
        .from('subscriptions')
        .select('plan_type, status, current_period_end, cancel_at_period_end')
        .eq('profile_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      setSubscription(data || { plan_type: 'free', status: 'active', current_period_end: null, cancel_at_period_end: false });
      setLoading(false);
    }
    load();
  }, []);

  const isPremium = subscription?.plan_type !== 'free' && subscription?.status === 'active';
  const isFounding = subscription?.plan_type === 'founding' && subscription?.status === 'active';
  const planLabel = subscription?.plan_type === 'founding' ? 'Founding Member'
    : subscription?.plan_type?.startsWith('plus') ? 'Covenant Plus'
    : 'Covenant Preview';

  return {
    subscription,
    loading,
    isPremium,
    isFounding,
    planLabel,
    tier: subscription?.plan_type || 'free',
  };
}
