'use client';

import { useState, useEffect } from 'react';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

const PILLARS = [
  { icon: '🤝', label: 'Covenant', color: t.pillarCovenantText, bg: t.pillarCovenantBg, desc: 'The promise that holds everything' },
  { icon: '🛡️', label: 'Emotional Safety', color: t.pillarSafetyText, bg: t.pillarSafetyBg, desc: 'Where vulnerability meets trust' },
  { icon: '💬', label: 'Communication', color: t.pillarCommText, bg: t.pillarCommBg, desc: 'Being truly heard and known' },
  { icon: '✝️', label: 'Spiritual', color: t.pillarSpiritualText, bg: t.pillarSpiritualBg, desc: 'Growing together toward God' },
];

const FEATURES = [
  { icon: '📖', text: 'Daily Devotionals' },
  { icon: '💡', text: 'Couple Questions' },
  { icon: '🎲', text: 'Marriage Games' },
  { icon: '🛠️', text: 'Repair Tools' },
];

export function WelcomeStep({ onNext }: { onNext: () => void }) {
  const [visible, setVisible] = useState(false);
  const [pillarsVisible, setPillarsVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  useEffect(() => {
    setTimeout(() => setVisible(true), 100);
    setTimeout(() => setPillarsVisible(true), 600);
    setTimeout(() => setFeaturesVisible(true), 1200);
  }, []);

  return (
    <div
      className="text-center py-8 px-4 transition-all duration-700"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(20px)',
      }}
    >
      {/* Logo + Brand */}
      <div className="mb-5">
        <ThreefoldLogo size={72} />
      </div>

      <h1
        className="text-4xl font-medium mb-1.5"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.2 }}
      >
        Cleave
      </h1>

      <p
        className="text-sm tracking-[0.15em] uppercase mb-6"
        style={{ fontFamily: 'Cinzel, serif', color: '#C7A23A', fontWeight: 400 }}
      >
        Hold Fast
      </p>

      {/* Warm welcome */}
      <p
        className="text-base mb-2 max-w-sm mx-auto"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.7 }}
      >
        Your marriage was designed for more than surviving.
      </p>
      <p
        className="text-sm mb-6 max-w-sm mx-auto"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.7 }}
      >
        Cleave helps you grow, repair, and thrive together — rooted in covenant, built for real life.
      </p>

      {/* 4 Pillars — animated reveal */}
      <div
        className="grid grid-cols-2 gap-2.5 mb-6 max-w-sm mx-auto transition-all duration-700"
        style={{
          opacity: pillarsVisible ? 1 : 0,
          transform: pillarsVisible ? 'translateY(0)' : 'translateY(16px)',
        }}
      >
        {PILLARS.map((p, i) => (
          <div
            key={p.label}
            className="rounded-xl p-3 text-center transition-all duration-500"
            style={{
              background: p.bg,
              transitionDelay: `${i * 100}ms`,
              opacity: pillarsVisible ? 1 : 0,
              transform: pillarsVisible ? 'scale(1)' : 'scale(0.9)',
            }}
          >
            <div className="text-xl mb-1">{p.icon}</div>
            <div
              className="text-xs font-semibold"
              style={{ fontFamily: 'Source Sans 3, sans-serif', color: p.color }}
            >
              {p.label}
            </div>
            <div
              className="text-[10px] mt-0.5"
              style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.3 }}
            >
              {p.desc}
            </div>
          </div>
        ))}
      </div>

      {/* Feature highlights — animated */}
      <div
        className="flex justify-center gap-4 mb-8 transition-all duration-700"
        style={{
          opacity: featuresVisible ? 1 : 0,
          transform: featuresVisible ? 'translateY(0)' : 'translateY(12px)',
        }}
      >
        {FEATURES.map((f, i) => (
          <div
            key={f.text}
            className="text-center transition-all duration-400"
            style={{
              opacity: featuresVisible ? 1 : 0,
              transitionDelay: `${i * 80}ms`,
            }}
          >
            <div className="text-lg mb-0.5">{f.icon}</div>
            <div
              className="text-[10px] font-medium"
              style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              {f.text}
            </div>
          </div>
        ))}
      </div>

      {/* CTA */}
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

      <p className="text-xs mt-5" style={{ color: t.textMuted }}>
        Takes about 3 minutes · Everything is private
      </p>
    </div>
  );
}
