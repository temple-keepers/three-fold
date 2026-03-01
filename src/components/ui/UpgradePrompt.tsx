'use client';

import { useState } from 'react';
import { t } from '@/lib/tokens';

interface UpgradePromptProps {
  feature?: string;
  compact?: boolean;
}

export function UpgradePrompt({ feature, compact = false }: UpgradePromptProps) {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleCheckout(plan: 'plus_monthly' | 'plus_yearly' | 'founding') {
    setLoading(plan);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Unable to start checkout. Please try again.');
      }
    } catch {
      alert('Something went wrong. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  if (compact) {
    return (
      <div
        className="rounded-2xl p-5 text-center"
        style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px solid ${t.textLink}20` }}
      >
        <div className="text-2xl mb-2">✦</div>
        <h3
          className="text-base font-medium m-0 mb-1"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
        >
          {feature ? `${feature} requires Covenant Plus` : 'Unlock Premium Features'}
        </h3>
        <p className="text-xs m-0 mb-4" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
          Upgrade to access all games, tools, exercises, and more.
        </p>
        <button
          onClick={() => handleCheckout('plus_monthly')}
          disabled={!!loading}
          className="px-6 py-2.5 rounded-full text-sm font-semibold text-white border-none cursor-pointer"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Loading...' : 'Upgrade \u2014 \u00A34.99/mo'}
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">✦</div>
          <h1
            className="text-3xl font-medium m-0 mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
          >
            Covenant Plus
          </h1>
          <p className="text-sm m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
            Unlock every tool for your marriage journey.
          </p>
        </div>

        {/* Plus Monthly */}
        <div
          className="rounded-2xl p-6 mb-3"
          style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px solid ${t.textLink}30` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold m-0" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Monthly
              </h3>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>Cancel anytime</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                \u00A34.99
              </span>
              <span className="text-xs" style={{ color: t.textMuted }}>/mo</span>
            </div>
          </div>
          <button
            onClick={() => handleCheckout('plus_monthly')}
            disabled={!!loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
              opacity: loading === 'plus_monthly' ? 0.7 : 1,
            }}
          >
            {loading === 'plus_monthly' ? 'Loading...' : 'Start Monthly'}
          </button>
        </div>

        {/* Plus Yearly */}
        <div
          className="rounded-2xl p-6 mb-3 relative"
          style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `2px solid ${t.textLink}` }}
        >
          <div
            className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: t.textLink, color: '#fff', fontFamily: 'Source Sans 3, sans-serif' }}
          >
            SAVE 42%
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold m-0" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Yearly
              </h3>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>Best value</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                \u00A334.99
              </span>
              <span className="text-xs" style={{ color: t.textMuted }}>/yr</span>
            </div>
          </div>
          <button
            onClick={() => handleCheckout('plus_yearly')}
            disabled={!!loading}
            className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
              opacity: loading === 'plus_yearly' ? 0.7 : 1,
            }}
          >
            {loading === 'plus_yearly' ? 'Loading...' : 'Start Yearly'}
          </button>
        </div>

        {/* Founding Member */}
        <div
          className="rounded-2xl p-6 mb-6"
          style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px solid ${t.border}` }}
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-base font-semibold m-0" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Founding Member ✦
              </h3>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>One-time, first 500 couples</p>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                \u00A359.99
              </span>
              <span className="text-xs" style={{ color: t.textMuted }}> once</span>
            </div>
          </div>
          <button
            onClick={() => handleCheckout('founding')}
            disabled={!!loading}
            className="w-full py-3 rounded-xl text-sm font-semibold border cursor-pointer"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'transparent',
              borderColor: t.textLink,
              color: t.textLink,
              opacity: loading === 'founding' ? 0.7 : 1,
            }}
          >
            {loading === 'founding' ? 'Loading...' : 'Become a Founder'}
          </button>
        </div>

        {/* Features list */}
        <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <h3
            className="text-sm font-semibold uppercase tracking-wider m-0 mb-4"
            style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
          >
            What you get
          </h3>
          {[
            'All Marriage Games (5+)',
            'All Conflict Repair Tools',
            '60-Day Cleave Reset',
            'Couple Exercises Library',
            'Weekly Check-ins',
            'Love Notes',
            'Pillar Analytics Over Time',
          ].map(feat => (
            <div key={feat} className="flex items-center gap-3 py-2" style={{ borderBottom: `1px solid ${t.border}30` }}>
              <span className="text-sm" style={{ color: t.green }}>&#x2713;</span>
              <span className="text-sm" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
                {feat}
              </span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-8">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
            &ldquo;Therefore a man shall leave his father and mother and hold fast to his wife.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Genesis 2:24</p>
        </div>
      </div>
    </div>
  );
}
