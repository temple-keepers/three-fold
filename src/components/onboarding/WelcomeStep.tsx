'use client';

import { useState, useEffect } from 'react';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div
      className="text-center py-10 px-5 transition-all duration-800"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      <div className="mb-6">
        <ThreefoldLogo size={72} />
      </div>

      <h1
        className="text-4xl font-medium mb-2"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.2 }}
      >
        Threefold Cord
      </h1>

      <p
        className="text-lg italic mb-8"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: '#B8860B' }}
      >
        A cord of three strands is not quickly broken
      </p>

      <div className="w-16 h-px mx-auto mb-8" style={{ background: '#B8860B', opacity: 0.4 }} />

      <p
        className="text-base mb-3 max-w-md mx-auto"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.7 }}
      >
        Welcome. You&apos;re here because your marriage matters — and that already says something powerful.
      </p>

      <p
        className="text-sm mb-10 max-w-md mx-auto"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.7 }}
      >
        This is a safe space to grow, repair, and thrive together — rooted in covenant, built for real life.
      </p>

      <button
        onClick={onNext}
        className="px-12 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5"
        style={{
          fontFamily: 'Source Sans 3, sans-serif',
          background: 'linear-gradient(135deg, #B8860B, #8B6914)',
          boxShadow: '0 4px 20px rgba(184, 134, 11, 0.25)',
          letterSpacing: '0.02em',
        }}
      >
        Begin Your Journey
      </button>

      <p className="text-xs mt-6" style={{ color: t.textMuted }}>
        Takes about 5 minutes · Everything is private
      </p>
    </div>
  );
}
