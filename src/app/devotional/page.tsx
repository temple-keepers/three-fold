'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';
import Image from 'next/image';

const PILLAR_COLORS: Record<string, { bg: string; border: string; text: string; icon: string }> = {
  covenant: { bg: 'var(--pillar-covenant-bg)', border: 'var(--pillar-covenant-text)', text: 'var(--pillar-covenant-text)', icon: '🤝' },
  emotional_safety: { bg: 'var(--pillar-safety-bg)', border: 'var(--pillar-safety-text)', text: 'var(--pillar-safety-text)', icon: '🛡️' },
  communication: { bg: 'var(--pillar-comm-bg)', border: 'var(--pillar-comm-text)', text: 'var(--pillar-comm-text)', icon: '💬' },
  spiritual: { bg: 'var(--pillar-spiritual-bg)', border: 'var(--pillar-spiritual-text)', text: 'var(--pillar-spiritual-text)', icon: '✝️' },
};

const PILLAR_LABELS: Record<string, string> = {
  covenant: 'Covenant Commitment',
  emotional_safety: 'Emotional Safety',
  communication: 'Communication Mastery',
  spiritual: 'Spiritual Alignment',
};

interface Devotional {
  id: string;
  title: string;
  pillar: string;
  scripture_text: string;
  scripture_reference: string;
  reflection: string;
  micro_action: string;
  prayer_prompt: string | null;
  couple_question: string | null;
  publish_date: string;
}

export default function DevotionalPage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [completed, setCompleted] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [streak, setStreak] = useState(0);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadToday();
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisible(true), 100);
  }, [loading]);

  async function loadToday() {
    const today = new Date().toISOString().split('T')[0];

    // Get today's devotional
    const { data: dev } = await supabase
      .from('devotionals')
      .select('*')
      .eq('publish_date', today)
      .eq('is_active', true)
      .single();

    if (dev) {
      setDevotional(dev);

      // Check if already completed
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: completion } = await supabase
          .from('devotional_completions')
          .select('*')
          .eq('profile_id', user.id)
          .eq('devotional_id', dev.id)
          .single();

        if (completion) {
          setCompleted(true);
          setActionDone(completion.action_completed || false);
          setPersonalNote(completion.personal_note || '');
        }

        // Get streak
        const { data: profile } = await supabase
          .from('profiles')
          .select('streak_count')
          .eq('id', user.id)
          .single();

        setStreak(profile?.streak_count || 0);
      }
    }

    setLoading(false);
  }

  async function markAsRead() {
    if (!devotional || completed) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('devotional_completions').insert({
      profile_id: user.id,
      devotional_id: devotional.id,
    });

    setCompleted(true);

    // Check milestones
    const { data: newMilestones } = await supabase.rpc('check_milestones', {
      p_profile_id: user.id,
    });

    if (newMilestones && newMilestones.length > 0) {
      setMilestones(newMilestones);
      setShowCelebration(true);
    }

    // Refresh streak
    const { data: profile } = await supabase
      .from('profiles')
      .select('streak_count')
      .eq('id', user.id)
      .single();

    setStreak(profile?.streak_count || 0);
    setSaving(false);
  }

  async function toggleAction() {
    if (!devotional) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newVal = !actionDone;
    setActionDone(newVal);

    await supabase.from('devotional_completions').update({
      action_completed: newVal,
      action_completed_at: newVal ? new Date().toISOString() : null,
    }).eq('profile_id', user.id).eq('devotional_id', devotional.id);
  }

  async function saveNote() {
    if (!devotional) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('devotional_completions').update({
      personal_note: personalNote,
    }).eq('profile_id', user.id).eq('devotional_id', devotional.id);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <ThreefoldLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading today&apos;s moment...
          </p>
        </div>
      </div>
    );
  }

  if (!devotional) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center rounded-3xl p-10 shadow-card max-w-md" style={{ background: 'var(--bg-card)' }}>
          <ThreefoldLogo size={48} />
          <h2 className="text-2xl font-medium mt-4 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            No devotional today
          </h2>
          <p className="text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Check back tomorrow for your daily covenant moment.
          </p>
          {streak > 0 && (
            <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: t.goldBg }}>
              <span>🔥</span>
              <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                {streak} day streak
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  const pillarStyle = PILLAR_COLORS[devotional.pillar] || PILLAR_COLORS.covenant;

  return (
    <div className="min-h-screen flex justify-center items-start px-4 py-6" style={{ background: 'var(--bg-primary)' }}>
      <div
        className="w-full max-w-[520px] transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(16px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ThreefoldLogo size={28} />
            <span className="text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              Daily Covenant Moment
            </span>
          </div>
          <div className="flex items-center gap-2">
            {streak > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: t.goldBg }}>
                <span className="text-sm">🔥</span>
                <span className="text-xs font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {streak}
                </span>
              </div>
            )}
            <ThemeToggle size="sm" />
          </div>
        </div>

        {/* Main card */}
        <div className="rounded-3xl shadow-card overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          {/* Pillar badge */}
          <div className="px-7 pt-7 pb-0">
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{
                background: pillarStyle.bg,
                color: pillarStyle.text,
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            >
              <span>{pillarStyle.icon}</span>
              {PILLAR_LABELS[devotional.pillar]}
            </div>
          </div>

          {/* Title */}
          <div className="px-7 pt-4 pb-2">
            <h1
              className="text-3xl font-medium mb-0"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.2 }}
            >
              {devotional.title}
            </h1>
          </div>

          {/* Scripture */}
          <div className="px-7 py-5">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'var(--bg-input)', border: `1px solid var(--border)` }}
            >
              <p
                className="text-lg italic m-0 mb-3"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)', lineHeight: 1.7 }}
              >
                &ldquo;{devotional.scripture_text}&rdquo;
              </p>
              <p className="text-xs m-0" style={{ color: '#B8860B', fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
                {devotional.scripture_reference}
              </p>
            </div>
          </div>

          {/* Reflection */}
          <div className="px-7 pb-5">
            <h3
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Reflect
            </h3>
            <p
              className="text-base m-0"
              style={{ fontFamily: 'Source Sans 3, sans-serif', color: 'var(--text-primary)', lineHeight: 1.7 }}
            >
              {devotional.reflection}
            </p>
          </div>

          {/* Micro action */}
          <div className="px-7 pb-5">
            <div
              className="rounded-xl p-5"
              style={{ background: t.goldBg, border: '1px solid rgba(212,168,71,0.13)' }}
            >
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: t.pillarCovenantText, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                ✨ Today&apos;s Action
              </h3>
              <p
                className="text-sm m-0"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}
              >
                {devotional.micro_action}
              </p>

              {completed && (
                <button
                  onClick={toggleAction}
                  className="mt-3 flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all"
                  style={{
                    background: actionDone ? '#5B8A3C' : 'transparent',
                    color: actionDone ? '#FFF' : '#8B6914',
                    border: actionDone ? 'none' : '1.5px solid #B8860B',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  {actionDone ? '✓ Done!' : 'Mark as done'}
                </button>
              )}
            </div>
          </div>

          {/* Prayer prompt */}
          {devotional.prayer_prompt && (
            <div className="px-7 pb-5">
              <div className="rounded-xl p-5" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  🙏 Prayer
                </h3>
                <p
                  className="text-sm italic m-0"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7, fontSize: 16 }}
                >
                  {devotional.prayer_prompt}
                </p>
              </div>
            </div>
          )}

          {/* Couple question */}
          {devotional.couple_question && (
            <div className="px-7 pb-5">
              <div className="rounded-xl p-5" style={{ background: t.pillarSafetyBg, border: `1px solid ${t.pillarSafetyText}20` }}>
                <h3
                  className="text-xs font-semibold uppercase tracking-wider mb-2"
                  style={{ color: t.pillarSafetyText, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  💬 Discuss Together
                </h3>
                <p
                  className="text-sm m-0"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}
                >
                  {devotional.couple_question}
                </p>
              </div>
            </div>
          )}

          {/* Personal note (after completion) */}
          {completed && (
            <div className="px-7 pb-5">
              <h3
                className="text-xs font-semibold uppercase tracking-wider mb-2"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                📝 Your private reflection
              </h3>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                onBlur={saveNote}
                placeholder="Write anything on your heart today... (private to you)"
                rows={3}
                className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y"
                style={{
                  background: t.bgCardHover,
                  borderColor: t.border,
                  borderWidth: '1.5px',
                  color: t.textPrimary,
                  fontFamily: 'Source Sans 3, sans-serif',
                  lineHeight: 1.6,
                }}
              />
            </div>
          )}

          {/* Complete button */}
          <div className="px-7 pb-7">
            {!completed ? (
              <button
                onClick={markAsRead}
                disabled={saving}
                className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer transition-all"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: saving ? '#E8E2D8' : 'linear-gradient(135deg, #B8860B, #8B6914)',
                  boxShadow: saving ? 'none' : '0 4px 16px rgba(184, 134, 11, 0.2)',
                }}
              >
                {saving ? 'Saving...' : "I've read today's moment ✓"}
              </button>
            ) : (
              <div
                className="w-full py-4 rounded-xl text-center text-base font-semibold"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.greenBg,
                  color: t.green,
                  border: `1px solid ${t.green}30`,
                }}
              >
                ✓ Completed today — well done!
              </div>
            )}
          </div>
        </div>

        {/* Milestone celebration modal */}
        {showCelebration && milestones.length > 0 && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: 'rgba(44, 36, 24, 0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div className="rounded-3xl p-8 max-w-sm w-full text-center shadow-card" style={{ background: 'var(--bg-card)' }}>
              <div className="text-5xl mb-4">{milestones[0].icon}</div>
              <h2
                className="text-2xl font-medium mb-2"
                style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
              >
                {milestones[0].title}
              </h2>
              <p
                className="text-sm mb-6"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}
              >
                {milestones[0].description}
              </p>
              <button
                onClick={() => setShowCelebration(false)}
                className="px-8 py-3 rounded-full text-sm font-semibold text-white border-none cursor-pointer"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  boxShadow: '0 4px 16px rgba(184, 134, 11, 0.2)',
                }}
              >
                Keep Going 🔥
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
