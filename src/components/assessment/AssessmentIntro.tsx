'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { CleaveLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

interface Props {
  onStart: () => void;
}

const PILLARS = [
  { icon: '/icons/pillar-covenant.png', label: 'Covenant Commitment', desc: 'Your sacred promise and daily choice' },
  { icon: '/icons/pillar-emotional-safety.png', label: 'Emotional Safety', desc: 'Feeling seen, safe, and supported' },
  { icon: '/icons/pillar-communication.png', label: 'Communication Mastery', desc: 'How you listen, express, and resolve' },
  { icon: '/icons/pillar-spiritual.png', label: 'Spiritual Alignment', desc: 'Your shared walk with God' },
];

export function AssessmentIntro({ onStart }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
  }, []);

  return (
    <div
      className="p-8 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
    >
      <div className="text-center mb-8">
        <CleaveLogo size={56} />
        <h1
          className="text-3xl font-medium mt-4 mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.2 }}
        >
          Your Covenant Assessment
        </h1>
        <p
          className="text-base"
          style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}
        >
          An honest reflection on where your marriage stands today — no judgment, just clarity.
        </p>
      </div>

      <div className="w-12 h-px mx-auto mb-8" style={{ background: '#B8860B', opacity: 0.3 }} />

      <div className="mb-8">
        <h3
          className="text-xs font-semibold uppercase tracking-wider mb-4"
          style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
        >
          You&apos;ll reflect on four pillars
        </h3>

        {PILLARS.map((p, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 mb-3.5 p-3.5 rounded-xl transition-all"
            style={{
              background: t.bgInput,
              border: `1px solid ${t.border}`,
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-10px)',
              transitionDelay: `${0.2 + i * 0.1}s`,
            }}
          >
            <Image src={p.icon} alt={p.label} width={32} height={32} className="flex-shrink-0" />
            <div>
              <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{p.label}</div>
              <div className="text-xs mt-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted }}>{p.desc}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-xl p-4 mb-8" style={{ background: t.goldBg, border: `1px solid rgba(212, 168, 71, 0.13)` }}>
        <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
          🔒 <strong>Your answers are completely private.</strong> Your spouse cannot see your individual responses. Only the combined insights appear on your shared dashboard.
        </p>
      </div>

      <div className="text-center">
        <button
          onClick={onStart}
          className="px-10 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            boxShadow: '0 4px 20px rgba(184, 134, 11, 0.25)',
          }}
        >
          Begin Reflection
        </button>
        <p className="text-xs mt-4" style={{ color: t.textMuted }}>20 questions · Takes about 5 minutes</p>
      </div>
    </div>
  );
}
