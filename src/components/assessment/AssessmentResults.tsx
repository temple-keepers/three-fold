'use client';

import { useState, useEffect } from 'react';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

interface Results {
  covenant: number;
  emotional_safety: number;
  communication: number;
  spiritual: number;
  overall: number;
  tier: 'strengthen' | 'repair' | 'restore';
}

interface Props {
  results: Results;
  onContinue: () => void;
}

const TIER_CONFIG = {
  strengthen: {
    title: 'Strengthen',
    icon: '🌿',
    color: '#5B8A3C',
    bgToken: t.greenBg,
    borderColor: '#5B8A3C30',
    message: 'Your marriage has a strong foundation. Threefold Cord will help you build on what\'s working and deepen your connection even further.',
  },
  repair: {
    title: 'Repair',
    icon: '🔧',
    color: '#B8860B',
    bgToken: t.goldBg,
    borderColor: '#B8860B30',
    message: 'There are areas that need attention, but the willingness to be here shows real strength. Your guided pathway will focus on rebuilding together.',
  },
  restore: {
    title: 'Restore',
    icon: '🌅',
    color: '#C44536',
    bgToken: t.redBg,
    borderColor: '#C4453630',
    message: 'Your marriage is going through a difficult season, and that takes courage to face honestly. Your pathway will prioritise safety, stability, and hope.',
  },
};

const PILLAR_LABELS: Record<string, { label: string; icon: string }> = {
  covenant: { label: 'Covenant', icon: '🤝' },
  emotional_safety: { label: 'Emotional Safety', icon: '🛡️' },
  communication: { label: 'Communication', icon: '💬' },
  spiritual: { label: 'Spiritual', icon: '✝️' },
};

function ScoreBar({ label, icon, score, delay }: { label: string; icon: string; score: number; delay: number }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => {
    const tm = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(tm);
  }, [delay]);

  const percentage = (score / 5) * 100;
  const color = score >= 3.5 ? '#5B8A3C' : score >= 2.5 ? '#B8860B' : '#C44536';

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="text-base">{icon}</span>
          <span className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
            {label}
          </span>
        </div>
        <span className="text-sm font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color }}>
          {score.toFixed(1)}
        </span>
      </div>
      <div className="w-full h-3 rounded-full" style={{ background: t.border }}>
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: animated ? `${percentage}%` : '0%',
            background: color,
            transitionDuration: '1s',
            transitionTimingFunction: 'cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </div>
    </div>
  );
}

export function AssessmentResults({ results, onContinue }: Props) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    setTimeout(() => setVisible(true), 200);
  }, []);

  const tier = TIER_CONFIG[results.tier];
  const pillars = [
    { key: 'covenant', score: results.covenant },
    { key: 'emotional_safety', score: results.emotional_safety },
    { key: 'communication', score: results.communication },
    { key: 'spiritual', score: results.spiritual },
  ];

  const sorted = [...pillars].sort((a, b) => b.score - a.score);
  const strongest = sorted[0];
  const weakest = sorted[sorted.length - 1];

  return (
    <div
      className="p-8 transition-all duration-700"
      style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
    >
      <div className="text-center mb-6">
        <ThreefoldLogo size={48} />
        <h2 className="text-3xl font-medium mt-3 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
          Your Results
        </h2>
        <p className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted }}>
          Here&apos;s where you stand across the four pillars
        </p>
      </div>

      {/* Overall score */}
      <div className="text-center rounded-2xl p-6 mb-6" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
        <div
          className="text-5xl font-bold mb-1"
          style={{
            fontFamily: 'Cormorant Garamond, serif',
            color: results.overall >= 3.5 ? '#5B8A3C' : results.overall >= 2.5 ? '#B8860B' : '#C44536',
          }}
        >
          {results.overall.toFixed(1)}
        </div>
        <div className="text-xs uppercase tracking-wider" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted }}>
          Overall Score (out of 5.0)
        </div>
      </div>

      {/* Pillar breakdown */}
      <div className="mb-6">
        {pillars.map((p, i) => (
          <ScoreBar key={p.key} label={PILLAR_LABELS[p.key].label} icon={PILLAR_LABELS[p.key].icon} score={p.score} delay={400 + i * 200} />
        ))}
      </div>

      {/* Tier routing */}
      <div className="rounded-2xl p-5 mb-6" style={{ background: tier.bgToken, border: `1px solid ${tier.borderColor}` }}>
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{tier.icon}</span>
          <div>
            <div className="text-xs uppercase tracking-wider font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary }}>
              Your Pathway
            </div>
            <div className="text-xl font-medium" style={{ fontFamily: 'Cormorant Garamond, serif', color: tier.color }}>
              {tier.title}
            </div>
          </div>
        </div>
        <p className="text-sm m-0 mt-2" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
          {tier.message}
        </p>
      </div>

      {/* Insights */}
      <div className="grid grid-cols-2 gap-3 mb-8">
        <div className="rounded-xl p-4" style={{ background: t.greenBg, border: '1px solid #5B8A3C20' }}>
          <div className="text-lg mb-1">{PILLAR_LABELS[strongest.key].icon}</div>
          <div className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: '#5B8A3C' }}>
            Strongest
          </div>
          <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
            {PILLAR_LABELS[strongest.key].label}
          </div>
        </div>

        <div className="rounded-xl p-4" style={{ background: t.redBg, border: '1px solid #C4453620' }}>
          <div className="text-lg mb-1">{PILLAR_LABELS[weakest.key].icon}</div>
          <div className="text-xs uppercase tracking-wider font-semibold mb-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: '#C44536' }}>
            Needs Focus
          </div>
          <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
            {PILLAR_LABELS[weakest.key].label}
          </div>
        </div>
      </div>

      {/* Privacy note */}
      <div className="rounded-xl p-4 mb-6" style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}>
        <p className="text-xs m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
          🔒 These individual scores are <strong>private to you</strong>. When your spouse completes their
          assessment, you&apos;ll see combined insights on your shared dashboard — but never each other&apos;s
          individual answers.
        </p>
      </div>

      {/* Continue */}
      <div className="text-center">
        <button
          onClick={onContinue}
          className="px-10 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer transition-all hover:-translate-y-0.5"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            boxShadow: '0 4px 20px rgba(184, 134, 11, 0.25)',
          }}
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}
