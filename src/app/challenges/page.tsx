'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';

/* ─── types ─── */
interface Challenge {
  id: string;
  title: string;
  slug: string;
  description: string;
  icon: string;
  duration_days: number;
  pillar: string;
  difficulty: string;
  is_featured: boolean;
}

interface ChallengeDay {
  id: string;
  day_number: number;
  title: string;
  pillar: string;
  scripture_reference: string;
}

interface Enrolment {
  id: string;
  challenge_id: string;
  status: string;
  current_day: number;
  started_at: string;
  completed_at: string | null;
}

interface Completion {
  challenge_day_id: string;
  day_number: number;
}

const PILLAR_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant', icon: '🤝' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, label: 'Safety', icon: '🛡️' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, label: 'Communication', icon: '💬' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual', icon: '✝️' },
  mixed: { bg: t.goldBg, text: t.textLink, label: 'All Pillars', icon: '💛' },
};

export default function ChallengesPage() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [days, setDays] = useState<ChallengeDay[]>([]);
  const [enrolment, setEnrolment] = useState<Enrolment | null>(null);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadChallenges(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadChallenges() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: ch } = await supabase
      .from('challenges')
      .select('*')
      .eq('is_active', true)
      .order('display_order');
    if (ch) setChallenges(ch);

    const { data: enrol } = await supabase
      .from('challenge_enrolments')
      .select('*')
      .eq('profile_id', user.id)
      .in('status', ['active', 'completed'])
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (enrol) {
      setEnrolment(enrol);
      const enrolled = ch?.find(c => c.id === enrol.challenge_id);
      if (enrolled) {
        setSelectedChallenge(enrolled);
        await loadChallengeDays(enrolled.id, user.id);
      }
    } else if (ch && ch.length === 1) {
      setSelectedChallenge(ch[0]);
      await loadChallengeDays(ch[0].id, user.id);
    }

    setLoading(false);
  }

  async function loadChallengeDays(challengeId: string, userId?: string) {
    const { data: d } = await supabase
      .from('challenge_days')
      .select('id, day_number, title, pillar, scripture_reference')
      .eq('challenge_id', challengeId)
      .order('day_number');
    if (d) setDays(d);

    if (userId) {
      const { data: comps } = await supabase
        .from('challenge_day_completions')
        .select('challenge_day_id, day_number')
        .eq('profile_id', userId);
      if (comps) setCompletions(comps);
    }
  }

  async function joinChallenge() {
    if (!selectedChallenge) return;
    setJoining(true);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', user.id)
      .single();

    const { data: enrol } = await supabase
      .from('challenge_enrolments')
      .insert({
        challenge_id: selectedChallenge.id,
        profile_id: user.id,
        couple_id: profile?.couple_id || null,
      })
      .select()
      .single();

    if (enrol) {
      setEnrolment(enrol);
      // Navigate straight to Day 1
      router.push(`/challenges/${selectedChallenge.slug}/day/1`);
    }
    setJoining(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  const completedDays = new Set(completions.map(c => c.day_number));
  const currentDay = enrolment?.current_day || 1;
  const progressPercent = selectedChallenge
    ? Math.round((completedDays.size / selectedChallenge.duration_days) * 100)
    : 0;
  const isEnrolled = !!enrolment;
  const isCompleted = enrolment?.status === 'completed';

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>

        <TopBar
          title="Challenges"
          subtitle={isEnrolled && selectedChallenge ? `${selectedChallenge.title} · Day ${currentDay}` : 'Short programmes to strengthen your marriage'}
          backHref="/dashboard"
          trailing={isEnrolled && selectedChallenge ? (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}>
                {progressPercent}%
              </div>
              <div className="text-xs" style={{ color: t.textMuted }}>complete</div>
            </div>
          ) : undefined}
        />

        {/* ─── Challenge list (when no specific one selected) ─── */}
        {!selectedChallenge && challenges.map(ch => {
          const pillar = PILLAR_MAP[ch.pillar] || PILLAR_MAP.mixed;
          return (
            <button
              key={ch.id}
              onClick={() => {
                setSelectedChallenge(ch);
                loadChallengeDays(ch.id);
              }}
              className="w-full rounded-2xl p-5 mb-3 text-left cursor-pointer transition-all hover:-translate-y-0.5"
              style={{ background: t.bgCard, boxShadow: t.shadowCard, border: ch.is_featured ? `1.5px solid ${t.textLink}40` : 'none' }}
            >
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0" style={{ background: pillar.bg }}>
                  {ch.icon}
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{ch.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{ch.duration_days} days · {pillar.label}</div>
                  <div className="text-sm mt-1.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.5 }}>{ch.description.slice(0, 100)}...</div>
                </div>
              </div>
            </button>
          );
        })}

        {/* ─── Selected Challenge View ─── */}
        {selectedChallenge && (
          <>
            {/* Hero card — not enrolled yet */}
            {!isEnrolled && (
              <div className="rounded-3xl p-8 text-center mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="text-5xl mb-4">{selectedChallenge.icon}</div>
                <h2 className="text-2xl font-medium mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  {selectedChallenge.title}
                </h2>
                <p className="text-sm mb-2 max-w-md mx-auto" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}>
                  {selectedChallenge.description}
                </p>
                <div className="flex items-center justify-center gap-4 mb-6">
                  <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.goldBg, color: t.textLink }}>
                    {selectedChallenge.duration_days} days
                  </span>
                  <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: (PILLAR_MAP[selectedChallenge.pillar] || PILLAR_MAP.mixed).bg, color: (PILLAR_MAP[selectedChallenge.pillar] || PILLAR_MAP.mixed).text }}>
                    {(PILLAR_MAP[selectedChallenge.pillar] || PILLAR_MAP.mixed).icon} {(PILLAR_MAP[selectedChallenge.pillar] || PILLAR_MAP.mixed).label}
                  </span>
                </div>

                {/* Preview days */}
                <div className="text-left mb-6">
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    What you&apos;ll cover
                  </div>
                  {days.map(d => {
                    const dp = PILLAR_MAP[d.pillar] || PILLAR_MAP.mixed;
                    return (
                      <div key={d.id} className="flex items-center gap-3 py-2.5" style={{ borderBottom: `1px solid ${t.border}` }}>
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: dp.bg, color: dp.text }}>
                          {d.day_number}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{d.title}</div>
                          <div className="text-xs" style={{ color: t.textMuted }}>{d.scripture_reference}</div>
                        </div>
                        <span className="text-sm">{dp.icon}</span>
                      </div>
                    );
                  })}
                </div>

                <button
                  onClick={joinChallenge}
                  disabled={joining}
                  className="px-10 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)', boxShadow: '0 4px 20px rgba(184,134,11,0.25)' }}
                >
                  {joining ? 'Joining...' : 'Start Challenge'}
                </button>
              </div>
            )}

            {/* Completed banner */}
            {isCompleted && (
              <div className="rounded-2xl p-6 mb-4 text-center" style={{ background: t.greenBg, border: `1px solid ${t.green}30` }}>
                <div className="text-3xl mb-2">🎉</div>
                <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.green }}>
                  Challenge Complete!
                </h3>
                <p className="text-sm" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  You finished the {selectedChallenge.title}. Well done — keep the momentum going.
                </p>
              </div>
            )}

            {/* Progress bar (enrolled) */}
            {isEnrolled && (
              <div className="rounded-2xl p-4 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Progress</span>
                  <span className="text-xs font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>{completedDays.size}/{selectedChallenge.duration_days}</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: t.border }}>
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${progressPercent}%`, background: 'linear-gradient(135deg, #B8860B, #8B6914)' }} />
                </div>
              </div>
            )}

            {/* Day cards (enrolled) — tapping navigates to full page */}
            {isEnrolled && days.map(day => {
              const done = completedDays.has(day.day_number);
              const isCurrent = !isCompleted && day.day_number === currentDay;
              const isLocked = !isCompleted && day.day_number > currentDay;
              const dp = PILLAR_MAP[day.pillar] || PILLAR_MAP.mixed;

              return (
                <button
                  key={day.id}
                  onClick={() => {
                    if (!isLocked) {
                      router.push(`/challenges/${selectedChallenge.slug}/day/${day.day_number}`);
                    }
                  }}
                  disabled={isLocked}
                  className="w-full rounded-2xl p-4 mb-2.5 text-left cursor-pointer transition-all"
                  style={{
                    background: done ? t.greenBg : t.bgCard,
                    boxShadow: isCurrent ? t.shadowCardLg : t.shadowCard,
                    border: done ? `1px solid ${t.green}30` : isCurrent ? `2px solid ${t.textLink}` : `1px solid ${t.border}`,
                    opacity: isLocked ? 0.45 : 1,
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-sm font-bold"
                      style={{
                        background: done ? t.greenBg : dp.bg,
                        color: done ? t.green : dp.text,
                        border: `1px solid ${done ? t.green : dp.text}25`,
                      }}
                    >
                      {done ? '✓' : day.day_number}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                        {day.title}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                        {day.scripture_reference} · {dp.label}
                      </div>
                    </div>
                    {isCurrent && !done && (
                      <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.goldBg, color: t.textLink }}>Today</span>
                    )}
                    {done && (
                      <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.greenBg, color: t.green }}>Done ✓</span>
                    )}
                    {isLocked && (
                      <span className="text-sm" style={{ color: t.textMuted }}>🔒</span>
                    )}
                  </div>
                </button>
              );
            })}

            {/* Scripture footer */}
            <div className="text-center py-6">
              <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>&ldquo;A cord of three strands is not quickly broken.&rdquo;</p>
              <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
