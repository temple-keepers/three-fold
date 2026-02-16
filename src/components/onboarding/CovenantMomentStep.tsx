'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import type { OnboardingData } from '@/app/onboarding/page';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

interface Props {
  data: OnboardingData;
  onComplete: () => void;
  saving: boolean;
}

const NEXT_STEPS = [
  { icon: '/icons/icon-clipboard.png', title: 'Quick Assessment', desc: 'A short reflection on your four covenant pillars' },
  { icon: '/icons/icon-target.png', title: 'Your Personalised Path', desc: 'Strengthen, Repair, or Restore — matched to where you are' },
  { icon: '/icons/icon-book.png', title: 'Daily Covenant Moments', desc: 'Two-minute daily prompts to stay connected' },
];

export function CovenantMomentStep({ data, onComplete, saving }: Props) {
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    setTimeout(() => setRevealed(true), 400);
  }, []);

  return (
    <div
      className="text-center py-5 px-5 transition-opacity duration-800"
      style={{ opacity: revealed ? 1 : 0 }}
    >
      <div className="mb-5">
        <ThreefoldLogo size={56} />
      </div>

      <h2
        className="text-3xl font-medium mb-2"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.2 }}
      >
        You&apos;re ready{data.firstName ? `, ${data.firstName}` : ''}
      </h2>

      <p
        className="text-base italic mb-8"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#B8860B' }}
      >
        This is the beginning of something meaningful
      </p>

      {/* Scripture */}
      <div
        className="rounded-2xl p-7 mb-7 text-left max-w-md mx-auto"
        style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}
      >
        <p
          className="text-lg italic text-center mb-4 m-0"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}
        >
          &ldquo;Two are better than one, because they have a good reward for their toil. For if they fall,
          one will lift up his fellow.&rdquo;
        </p>
        <p
          className="text-xs text-center m-0"
          style={{ color: t.textMuted }}
        >
          Ecclesiastes 4:9–10
        </p>
      </div>

      {/* What's next */}
      <div className="text-left max-w-md mx-auto mb-8">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
        >
          What happens next
        </h3>

        {NEXT_STEPS.map((item, i) => (
          <div
            key={i}
            className="flex gap-3.5 mb-4 transition-all duration-500"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateX(0)' : 'translateX(-10px)',
              transitionDelay: `${0.3 + i * 0.15}s`,
            }}
          >
            <Image src={item.icon} alt="" width={28} height={28} className="flex-shrink-0 mt-0.5" />
            <div>
              <div
                className="text-base font-semibold mb-0.5"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
              >
                {item.title}
              </div>
              <div
                className="text-sm"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.5 }}
              >
                {item.desc}
              </div>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onComplete}
        disabled={saving}
        className="px-12 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer"
        style={{
          fontFamily: 'Source Sans 3, sans-serif',
          background: saving ? t.border : 'linear-gradient(135deg, #B8860B, #8B6914)',
          boxShadow: saving ? 'none' : '0 4px 20px rgba(184, 134, 11, 0.25)',
          cursor: saving ? 'not-allowed' : 'pointer',
        }}
      >
        {saving ? 'Setting things up...' : 'Enter Your Dashboard ✨'}
      </button>
    </div>
  );
}
