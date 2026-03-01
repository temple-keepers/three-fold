'use client';

import { useState } from 'react';
import { t } from '@/lib/tokens';

interface CheckInTabProps {
  submitCheckIn: (rating: number, highlight: string, need: string, gratitude: string) => void;
}

export function CheckInTab({ submitCheckIn }: CheckInTabProps) {
  const [ciRating, setCiRating] = useState(0);
  const [ciHighlight, setCiHighlight] = useState('');
  const [ciNeed, setCiNeed] = useState('');
  const [ciGratitude, setCiGratitude] = useState('');

  function handleSubmit() {
    if (ciRating === 0) return;
    submitCheckIn(ciRating, ciHighlight, ciNeed, ciGratitude);
  }

  return (
    <div className="rounded-3xl p-7" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
      <div className="text-center mb-6">
        <span className="text-3xl">📋</span>
        <h2 className="text-2xl font-medium mt-2 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
          Weekly Check-In
        </h2>
        <p className="text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
          A private reflection revealed to your spouse only after both submit
        </p>
      </div>

      {/* Connection rating */}
      <div className="mb-5">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          How connected did you feel this week?
        </label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map(n => (
            <button key={n} onClick={() => setCiRating(n)} className="flex-1 py-3 rounded-xl text-center cursor-pointer transition-all" style={{ background: ciRating === n ? t.goldBg : t.bgCardHover, border: `1.5px solid ${ciRating === n ? t.textLink : t.border}`, fontFamily: 'Source Sans 3, sans-serif', fontSize: 18, fontWeight: 700, color: ciRating === n ? t.textLink : t.textMuted }}>
              {n}
            </button>
          ))}
        </div>
        <div className="flex justify-between text-xs mt-1.5" style={{ color: t.textMuted }}>
          <span>Disconnected</span><span>Very connected</span>
        </div>
      </div>

      {/* Highlight */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          A highlight from this week
        </label>
        <textarea value={ciHighlight} onChange={e => setCiHighlight(e.target.value)} placeholder="What was a good moment between us?" rows={2} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
      </div>

      {/* Need */}
      <div className="mb-4">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          Something I need from you this week
        </label>
        <textarea value={ciNeed} onChange={e => setCiNeed(e.target.value)} placeholder="Be specific and kind..." rows={2} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
      </div>

      {/* Gratitude */}
      <div className="mb-6">
        <label className="text-xs font-semibold uppercase tracking-wider block mb-2" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          Something I&apos;m grateful for about you
        </label>
        <textarea value={ciGratitude} onChange={e => setCiGratitude(e.target.value)} placeholder="What do I appreciate about you?" rows={2} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
      </div>

      <div className="rounded-xl p-4 mb-5" style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}>
        <p className="text-xs m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
          🔒 Your answers are <strong>private until both of you submit</strong>. Then you&apos;ll see each other&apos;s responses together.
        </p>
      </div>

      <button onClick={handleSubmit} disabled={ciRating === 0} className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: ciRating > 0 ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border, color: ciRating > 0 ? '#FFF' : t.textMuted }}>
        Submit Check-In
      </button>
    </div>
  );
}
