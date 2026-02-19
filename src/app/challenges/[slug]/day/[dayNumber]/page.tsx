'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';

/* ─── types ─── */
interface ChallengeDay {
  id: string;
  challenge_id: string;
  day_number: number;
  title: string;
  pillar: string;
  scripture_text: string;
  scripture_reference: string;
  teaching_text: string;
  reflection_prompt: string | null;
  couple_activity: string | null;
  couple_activity_duration_minutes: number | null;
  prayer_prompt: string | null;
}

interface Challenge {
  id: string;
  title: string;
  slug: string;
  duration_days: number;
}

interface Enrolment {
  id: string;
  challenge_id: string;
  status: string;
  current_day: number;
}

const PILLAR_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant', icon: '🤝' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, label: 'Safety', icon: '🛡️' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, label: 'Communication', icon: '💬' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual', icon: '✝️' },
};

export default function ChallengeDayPage({ params }: { params: Promise<{ slug: string; dayNumber: string }> }) {
  const { slug, dayNumber } = use(params);
  const dayNum = parseInt(dayNumber, 10);

  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [day, setDay] = useState<ChallengeDay | null>(null);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [alreadyCompleted, setAlreadyCompleted] = useState(false);
  const [reflectionText, setReflectionText] = useState('');
  const [activityDone, setActivityDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadDay(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadDay() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Load challenge
    const { data: ch } = await supabase
      .from('challenges')
      .select('id, title, slug, duration_days')
      .eq('slug', slug)
      .single();
    if (!ch) { router.push('/challenges'); return; }
    setChallenge(ch);

    // Load day content
    const { data: d } = await supabase
      .from('challenge_days')
      .select('*')
      .eq('challenge_id', ch.id)
      .eq('day_number', dayNum)
      .single();
    if (!d) { router.push('/challenges'); return; }
    setDay(d);

    // Load enrolment
    const { data: enrol } = await supabase
      .from('challenge_enrolments')
      .select('id, challenge_id, status, current_day')
      .eq('profile_id', user.id)
      .eq('challenge_id', ch.id)
      .in('status', ['active', 'completed'])
      .maybeSingle();
    if (enrol) setEnrolment(enrol);

    // Check if already completed
    if (enrol) {
      const { data: comp } = await supabase
        .from('challenge_day_completions')
        .select('reflection_text, activity_completed')
        .eq('enrolment_id', enrol.id)
        .eq('challenge_day_id', d.id)
        .maybeSingle();
      if (comp) {
        setAlreadyCompleted(true);
        setReflectionText(comp.reflection_text || '');
        setActivityDone(comp.activity_completed || false);
      }
    }

    setLoading(false);
  }

  async function completeDay() {
    if (!day || !enrolment || !challenge) return;
    setSaving(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('challenge_day_completions')
      .upsert({
        enrolment_id: enrolment.id,
        challenge_day_id: day.id,
        profile_id: user.id,
        day_number: day.day_number,
        reflection_text: reflectionText || null,
        activity_completed: activityDone,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'enrolment_id,challenge_day_id' });

    // Advance current_day
    const nextDay = Math.min(day.day_number + 1, challenge.duration_days);
    const isComplete = day.day_number === challenge.duration_days;

    await supabase
      .from('challenge_enrolments')
      .update({
        current_day: nextDay,
        ...(isComplete ? { status: 'completed', completed_at: new Date().toISOString() } : {}),
      })
      .eq('id', enrolment.id);

    setSaving(false);
    setSaved(true);
    setAlreadyCompleted(true);
  }

  function goNext() {
    if (!challenge) return;
    if (dayNum < challenge.duration_days) {
      router.push(`/challenges/${slug}/day/${dayNum + 1}`);
    } else {
      router.push('/challenges');
    }
  }

  function goPrev() {
    if (dayNum > 1) {
      router.push(`/challenges/${slug}/day/${dayNum - 1}`);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  if (!day || !challenge) return null;

  const dp = PILLAR_MAP[day.pillar] || PILLAR_MAP.covenant;
  const progressPercent = Math.round((dayNum / challenge.duration_days) * 100);
  const isLastDay = dayNum === challenge.duration_days;

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>

        <TopBar
          title={challenge.title}
          subtitle={`Day ${dayNum} of ${challenge.duration_days}`}
          backHref="/challenges"
          trailing={
            <div className="text-right">
              <div className="text-lg font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}>
                {progressPercent}%
              </div>
            </div>
          }
        />

        {/* Progress bar */}
        <div className="px-4 pt-2 pb-4">
          <div className="flex gap-1">
            {Array.from({ length: challenge.duration_days }, (_, i) => (
              <div
                key={i}
                className="flex-1 h-1.5 rounded-full transition-all duration-500"
                style={{
                  background: i + 1 <= dayNum
                    ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                    : t.border,
                }}
              />
            ))}
          </div>
        </div>

        {/* ─── Main content ─── */}
        <div className="px-4 pb-10">

          {/* Day header */}
          <div className="mb-6">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold" style={{ background: dp.bg, color: dp.text }}>
                {dp.icon}
              </div>
              <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: dp.bg, color: dp.text, fontFamily: 'Source Sans 3, sans-serif' }}>
                {dp.label}
              </span>
            </div>
            <h1 className="text-3xl font-medium m-0 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              {day.title}
            </h1>
            <p className="text-xs m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              Day {dayNum} · ~5 minutes
            </p>
          </div>

          {/* Scripture block */}
          <div className="rounded-2xl p-6 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard, borderLeft: `4px solid ${dp.text}` }}>
            <p className="text-lg italic m-0 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}>
              &ldquo;{day.scripture_text}&rdquo;
            </p>
            <p className="text-sm m-0 font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
              — {day.scripture_reference}
            </p>
          </div>

          {/* Teaching */}
          <div className="mb-8">
            {day.teaching_text.split('\n').map((paragraph, i) => (
              <p key={i} className="text-base m-0 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.85 }}>
                {paragraph}
              </p>
            ))}
          </div>

          {/* ─── Reflection section ─── */}
          {day.reflection_prompt && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">💭</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Reflect
                </h2>
              </div>
              <p className="text-sm m-0 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.7 }}>
                {day.reflection_prompt}
              </p>
              <textarea
                value={reflectionText}
                onChange={(e) => setReflectionText(e.target.value)}
                placeholder="Write your thoughts here (optional)..."
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

          {/* ─── Couple activity ─── */}
          {day.couple_activity && (
            <div className="rounded-2xl p-6 mb-6" style={{ background: t.goldBg, border: `1.5px solid ${t.textLink}20` }}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg">👥</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Do Together
                </h2>
                {day.couple_activity_duration_minutes && (
                  <span className="text-xs px-2.5 py-1 rounded-full ml-auto font-semibold" style={{ background: 'rgba(184,134,11,0.15)', color: t.textLink }}>
                    {day.couple_activity_duration_minutes} min
                  </span>
                )}
              </div>
              <p className="text-sm m-0 mt-3 mb-4" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                {day.couple_activity}
              </p>
              <label className="flex items-center gap-3 cursor-pointer rounded-xl p-3 -mx-1 transition-colors" style={{ background: activityDone ? 'rgba(184,134,11,0.1)' : 'transparent' }}>
                <input
                  type="checkbox"
                  checked={activityDone}
                  onChange={(e) => setActivityDone(e.target.checked)}
                  className="w-5 h-5 rounded flex-shrink-0"
                  style={{ accentColor: '#B8860B' }}
                />
                <span className="text-sm font-medium" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                  {activityDone ? 'You did it together ✓' : 'We did this together'}
                </span>
              </label>
            </div>
          )}

          {/* ─── Prayer ─── */}
          {day.prayer_prompt && (
            <div className="rounded-2xl p-6 mb-8" style={{ background: t.pillarSpiritualBg, border: `1.5px solid ${t.pillarSpiritualText}20` }}>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">🙏</span>
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.pillarSpiritualText, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Pray
                </h2>
              </div>
              <p className="text-base italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.75 }}>
                {day.prayer_prompt}
              </p>
            </div>
          )}

          {/* ─── Action buttons ─── */}
          <div className="space-y-3">
            {/* Complete / Already completed */}
            {!alreadyCompleted ? (
              <button
                onClick={completeDay}
                disabled={saving || !enrolment}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white border-none cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  boxShadow: '0 4px 20px rgba(184,134,11,0.25)',
                  opacity: !enrolment ? 0.5 : 1,
                }}
              >
                {saving ? 'Saving...' : `Complete Day ${dayNum} ✓`}
              </button>
            ) : (
              <div className="w-full py-4 rounded-2xl text-center text-base font-semibold" style={{ background: t.greenBg, color: t.green, border: `1.5px solid ${t.green}30` }}>
                ✓ Day {dayNum} Complete
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3">
              {dayNum > 1 && (
                <button
                  onClick={goPrev}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border-none cursor-pointer"
                  style={{ background: t.bgCard, color: t.textSecondary, boxShadow: t.shadowCard, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  ← Day {dayNum - 1}
                </button>
              )}
              {(alreadyCompleted || saved) && (
                <button
                  onClick={goNext}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold border-none cursor-pointer"
                  style={{ background: t.bgCard, color: t.textLink, boxShadow: t.shadowCard, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  {isLastDay ? 'Back to Challenge →' : `Day ${dayNum + 1} →`}
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
      </div>
    </div>
  );
}
