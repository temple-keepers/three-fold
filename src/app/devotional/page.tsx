'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { ShareMilestone } from '@/components/ui/ShareMilestone';
import { t } from '@/lib/tokens';
import Link from 'next/link';

const PILLAR_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant Commitment', icon: '🤝' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, label: 'Emotional Safety', icon: '🛡️' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, label: 'Communication', icon: '💬' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual Alignment', icon: '✝️' },
};

interface Devotional {
  id: string;
  day_number: number;
  title: string;
  pillar: string;
  scripture_text: string;
  scripture_reference: string;
  reflection: string;
  micro_action: string;
  prayer_prompt: string | null;
  couple_question: string | null;
  word_study_term: string | null;
  word_study_meaning: string | null;
}

function getBibleGatewayUrl(ref: string): string {
  const parts = ref.split(':');
  const bookAndChapter = parts[0].trim();
  const encoded = encodeURIComponent(bookAndChapter);
  return `https://www.biblegateway.com/passage/?search=${encoded}&version=NIV`;
}

export default function DevotionalPage() {
  const [devotional, setDevotional] = useState<Devotional | null>(null);
  const [totalDays, setTotalDays] = useState(0);
  const [currentDay, setCurrentDay] = useState(1);
  const [completed, setCompleted] = useState(false);
  const [actionDone, setActionDone] = useState(false);
  const [personalNote, setPersonalNote] = useState('');
  const [streak, setStreak] = useState(0);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [visible, setVisible] = useState(false);
  const [weakestPillar, setWeakestPillar] = useState<string | null>(null);
  const [pillarScore, setPillarScore] = useState<number | null>(null);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadDevotional(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadDevotional(dayOverride?: number) {
    setError(null);
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Get profile with current_devotional_day
    const { data: profile } = await supabase
      .from('profiles')
      .select('current_devotional_day, streak_count, first_name')
      .eq('id', user.id)
      .single();

    const day = dayOverride || profile?.current_devotional_day || 1;
    setCurrentDay(day);
    setStreak(profile?.streak_count || 0);
    if (profile?.first_name) setUserName(profile.first_name);

    // Get total available days
    const { count } = await supabase
      .from('devotionals')
      .select('id', { count: 'exact', head: true })
      .eq('is_active', true);
    setTotalDays(count || 0);

    // Load assessment for personalization
    const { data: assess } = await supabase
      .from('assessments')
      .select('score_covenant, score_emotional_safety, score_communication, score_spiritual')
      .eq('profile_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (assess) {
      const scores: Record<string, number> = {
        covenant: Number(assess.score_covenant),
        emotional_safety: Number(assess.score_emotional_safety),
        communication: Number(assess.score_communication),
        spiritual: Number(assess.score_spiritual),
      };
      const weakest = Object.entries(scores).sort((a, b) => a[1] - b[1])[0];
      setWeakestPillar(weakest[0]);
      setPillarScore(weakest[1]);
    }

    // Get devotional for this day
    const { data: dev } = await supabase
      .from('devotionals')
      .select('id, day_number, title, pillar, scripture_text, scripture_reference, reflection, micro_action, prayer_prompt, couple_question, word_study_term, word_study_meaning')
      .eq('day_number', day)
      .eq('is_active', true)
      .single();

    if (dev) {
      setDevotional(dev);

      // Check if already completed
      const { data: completion } = await supabase
        .from('devotional_completions')
        .select('action_completed, personal_note')
        .eq('profile_id', user.id)
        .eq('devotional_id', dev.id)
        .maybeSingle();

      if (completion) {
        setCompleted(true);
        setActionDone(completion.action_completed || false);
        setPersonalNote(completion.personal_note || '');
      } else {
        setCompleted(false);
        setActionDone(false);
        setPersonalNote('');
      }
    } else {
      setDevotional(null);
    }

    setLoading(false);
    } catch (err) {
      console.error('Failed to load devotional:', err);
      setError('Failed to load your devotional. Please check your connection and try again.');
      setLoading(false);
    }
  }

  async function markComplete() {
    if (!devotional || completed) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSaving(false); return; }

      // Save completion
      const { error: insertErr } = await supabase.from('devotional_completions').upsert({
        profile_id: user.id,
        devotional_id: devotional.id,
      }, { onConflict: 'profile_id,devotional_id' });

      if (insertErr) {
        console.error('Completion insert error:', insertErr);
        alert('Something went wrong saving your completion. Please try again.');
        setSaving(false);
        return;
      }

      // Advance current_devotional_day
      const nextDay = currentDay + 1;
      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ current_devotional_day: nextDay })
        .eq('id', user.id);

      if (updateErr) {
        console.error('Profile update error:', updateErr);
      }

      setCompleted(true);

      // Check milestones
      try {
        const { data: newMilestones } = await supabase.rpc('check_milestones', {
          p_profile_id: user.id,
        });
        if (newMilestones && newMilestones.length > 0) {
          setMilestones(newMilestones);
          setShowCelebration(true);
        }
      } catch (e) { console.error('Milestone check error:', e); }

      // Refresh streak (the trigger should have updated it)
      const { data: updatedProfile } = await supabase
        .from('profiles')
        .select('streak_count')
        .eq('id', user.id)
        .single();
      setStreak(updatedProfile?.streak_count || 0);

      // Nudge partner that you completed today's devotional
      try {
        fetch('/api/nudge', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'devotional' }),
        });
      } catch { /* non-critical */ }
    } catch (e) {
      console.error('markComplete error:', e);
      alert('Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  async function goToDay(day: number) {
    setLoading(true);
    setVisible(false);
    await loadDevotional(day);
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
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <div className="text-center">
          <CleaveLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading your devotional...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium mb-2 m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            Connection Issue
          </h2>
          <p className="text-sm mb-6 m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => { setLoading(true); loadDevotional(); }}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // All devotionals completed
  if (!devotional && currentDay > totalDays && totalDays > 0) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="text-center rounded-3xl p-10 max-w-md" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            You&apos;ve completed all {totalDays} devotionals!
          </h2>
          <p className="text-sm mb-6" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
            What a journey. More devotionals are on the way — keep building the habit.
          </p>
          {streak > 0 && (
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full" style={{ background: t.goldBg }}>
              <span>🔥</span>
              <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                {streak} day streak
              </span>
            </div>
          )}
          <div className="mt-6">
            <button
              onClick={() => goToDay(1)}
              className="px-6 py-3 rounded-full text-sm font-semibold border-none cursor-pointer"
              style={{ background: t.bgCardHover, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Re-read from Day 1
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!devotional) return null;

  const pillar = PILLAR_MAP[devotional.pillar] || PILLAR_MAP.covenant;
  const progressPercent = Math.round((currentDay / totalDays) * 100);
  const hasNext = currentDay < totalDays;
  const hasPrev = currentDay > 1;

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-2xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
      >
        <TopBar
          title="Daily Devotional"
          subtitle={`Day ${currentDay} of ${totalDays}`}
          backHref="/dashboard"
          trailing={
            <div className="flex items-center gap-2">
              {streak > 0 && (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: t.goldBg }}>
                  <span className="text-sm">🔥</span>
                  <span className="text-xs font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                    {streak}
                  </span>
                </div>
              )}
            </div>
          }
        />

        {/* Progress bar */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
              Progress
            </span>
            <span className="text-xs font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 rounded-full" style={{ background: t.border }}>
            <div
              className="h-full rounded-full transition-all duration-700"
              style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
            />
          </div>
        </div>

        {/* ─── Main content ─── */}
        <div className="px-4 pb-10">

          {/* Day header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: pillar.bg, color: pillar.text }}>
                {pillar.icon}
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: pillar.bg, color: pillar.text, fontFamily: 'Source Sans 3, sans-serif' }}>
                {pillar.label}
              </span>
            </div>
            <h1 className="text-3xl font-medium m-0 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              {devotional.title}
            </h1>
            <p className="text-xs m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              Day {currentDay} · ~5 minutes
            </p>
          </div>

          {/* Scripture */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard, borderLeft: `4px solid ${pillar.text}` }}>
            <p className="text-lg italic m-0 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}>
              &ldquo;{devotional.scripture_text}&rdquo;
            </p>
            <p className="text-sm m-0 font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
              — {devotional.scripture_reference}
            </p>
          </div>

          {/* Word Study */}
          {devotional.word_study_term && devotional.word_study_meaning && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📖</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Word Study
                </h2>
              </div>
              <div className="rounded-xl p-4 mb-3" style={{ background: t.bgAccent }}>
                <span className="text-base font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  &ldquo;{devotional.word_study_term}&rdquo;
                </span>
              </div>
              <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.8 }}>
                {devotional.word_study_meaning}
              </p>
            </div>
          )}

          {/* Read Full Chapter link */}
          <a
            href={getBibleGatewayUrl(devotional.scripture_reference)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between rounded-2xl p-4 mb-6 no-underline transition-all hover:-translate-y-0.5"
            style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px solid ${t.border}` }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: t.pillarSpiritualBg }}>📜</div>
              <div>
                <div className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>Read Full Chapter</div>
                <div className="text-xs" style={{ color: t.textMuted }}>{devotional.scripture_reference} on Bible Gateway · includes original language tools</div>
              </div>
            </div>
            <span className="text-sm flex-shrink-0" style={{ color: t.textLink }}>↗</span>
          </a>

          {/* Personalized insight when this day matches weakest pillar */}
          {weakestPillar && devotional.pillar === weakestPillar && pillarScore !== null && pillarScore < 3.5 && (
            <div className="rounded-2xl p-5 mb-6 flex items-start gap-3" style={{ background: pillar.bg, border: `1.5px solid ${pillar.text}20` }}>
              <span className="text-lg flex-shrink-0">🎯</span>
              <div>
                <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: pillar.text, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Personalised for you
                </div>
                <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                  Your assessment flagged {pillar.label.toLowerCase()} as an area for growth (scored {pillarScore.toFixed(1)}/5). Today&apos;s devotional speaks directly into this — lean in.
                </p>
              </div>
            </div>
          )}

          {/* Reflection / Teaching */}
          <div className="mb-8">
            {devotional.reflection.split('\n').map((paragraph, i) => (
              <p key={i} className="text-base m-0 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.85 }}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* Micro action */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: t.goldBg, border: `1.5px solid ${t.textLink}20` }}>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">✨</span>
              <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                Today&apos;s Action
              </h2>
            </div>
            <p className="text-sm m-0 mt-3 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
              {devotional.micro_action}
            </p>
            {completed && (
              <label className="flex items-center gap-3 cursor-pointer rounded-xl p-3 -mx-1 transition-colors" style={{ background: actionDone ? 'rgba(184,134,11,0.1)' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={actionDone}
                  onChange={toggleAction}
                  className="w-5 h-5 rounded flex-shrink-0"
                  style={{ accentColor: '#B8860B' }}
                />
                <span className="text-sm font-medium" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                  {actionDone ? 'Done! ✓' : 'I did this today'}
                </span>
              </label>
            )}
          </div>

          {/* Prayer */}
          {devotional.prayer_prompt && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.pillarSpiritualBg, border: `1.5px solid ${t.pillarSpiritualText}20` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🙏</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.pillarSpiritualText, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Pray
                </h2>
              </div>
              <p className="text-base italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.75 }}>
                {devotional.prayer_prompt}
              </p>
            </div>
          )}

          {/* Couple question */}
          {devotional.couple_question && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.pillarSafetyBg, border: `1.5px solid ${t.pillarSafetyText}20` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💬</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.pillarSafetyText, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Discuss Together
                </h2>
              </div>
              <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                {devotional.couple_question}
              </p>
            </div>
          )}

          {/* Personal note (after completion) */}
          {completed && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">📝</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Your Reflection
                </h2>
              </div>
              <textarea
                value={personalNote}
                onChange={(e) => setPersonalNote(e.target.value)}
                onBlur={saveNote}
                placeholder="Write anything on your heart today... (private to you)"
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
                style={{
                  background: t.bgInput,
                  border: `1.5px solid ${t.border}`,
                  color: t.textPrimary,
                  fontFamily: 'Source Sans 3, sans-serif',
                  lineHeight: 1.7,
                }}
              />
            </div>
          )}

          {/* ─── Action buttons ─── */}
          <div className="space-y-3">
            {!completed ? (
              <button
                onClick={markComplete}
                disabled={saving}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white border-none cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  boxShadow: '0 4px 20px rgba(184,134,11,0.25)',
                }}
              >
                {saving ? 'Saving...' : `Complete Day ${currentDay} ✓`}
              </button>
            ) : (
              <>
                <div className="w-full py-4 rounded-2xl text-center text-base font-semibold" style={{ background: t.greenBg, color: t.green, border: `1.5px solid ${t.green}30` }}>
                  ✓ Day {currentDay} Complete
                </div>
                {/* What's Next flow */}
                <div className="rounded-2xl p-5 mt-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>What&apos;s next?</div>
                  <div className="space-y-2">
                    <Link href="/together" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-all hover:-translate-y-0.5" style={{ background: t.bgCardHover }}>
                      <span className="text-base">💬</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>Answer today&apos;s couple question</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Both answer privately, then reveal together</div>
                      </div>
                      <span style={{ color: t.textLink }}>→</span>
                    </Link>
                    <Link href="/games" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-all hover:-translate-y-0.5" style={{ background: t.bgCardHover }}>
                      <span className="text-base">🎲</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>Play a marriage game</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Fun prompts for you and your spouse</div>
                      </div>
                      <span style={{ color: t.textLink }}>→</span>
                    </Link>
                    <Link href="/journal" className="flex items-center gap-3 p-3 rounded-xl no-underline transition-all hover:-translate-y-0.5" style={{ background: t.bgCardHover }}>
                      <span className="text-base">📔</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>Write in your journal</div>
                        <div className="text-xs" style={{ color: t.textMuted }}>Capture what God showed you today</div>
                      </div>
                      <span style={{ color: t.textLink }}>→</span>
                    </Link>
                  </div>
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {hasPrev && (
                <button
                  onClick={() => goToDay(currentDay - 1)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border-none cursor-pointer"
                  style={{ background: t.bgCard, color: t.textSecondary, boxShadow: t.shadowCard, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  ← Day {currentDay - 1}
                </button>
              )}
              {completed && hasNext && (
                <button
                  onClick={() => goToDay(currentDay + 1)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border-none cursor-pointer"
                  style={{ background: t.bgCard, color: t.textLink, boxShadow: t.shadowCard, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  Day {currentDay + 1} →
                </button>
              )}
            </div>
          </div>

          {/* Scripture footer */}
          <div className="text-center py-10">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>

        {/* Milestone celebration modal */}
        {showCelebration && milestones.length > 0 && (
          <div
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
            style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          >
            <div className="rounded-3xl p-8 max-w-sm w-full text-center" style={{ background: t.bgCard, boxShadow: t.shadowCardLg }}>
              <div className="text-5xl mb-4">{milestones[0].icon}</div>
              <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                {milestones[0].title}
              </h2>
              <p className="text-sm mb-6" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
                {milestones[0].description}
              </p>
              <div className="flex gap-3 justify-center">
                <button
                  onClick={() => {
                    setShowCelebration(false);
                    setShowShareModal(true);
                  }}
                  className="px-6 py-3 rounded-full text-sm font-semibold border cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'transparent',
                    borderColor: t.textLink,
                    color: t.textLink,
                  }}
                >
                  Share
                </button>
                <button
                  onClick={() => setShowCelebration(false)}
                  className="px-6 py-3 rounded-full text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                    boxShadow: '0 4px 16px rgba(184,134,11,0.2)',
                  }}
                >
                  Keep Going
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Share milestone modal */}
        {showShareModal && milestones.length > 0 && (
          <ShareMilestone
            type={milestones[0].milestone_type === 'streak' ? 'streak' : 'devotional'}
            value={milestones[0].milestone_type === 'streak' ? streak : currentDay}
            title={milestones[0].title}
            subtitle={milestones[0].description}
            userName={userName}
            onClose={() => setShowShareModal(false)}
          />
        )}
      </div>
    </div>
  );
}
