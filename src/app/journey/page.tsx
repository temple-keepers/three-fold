'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';

const PILLAR_MAP: Record<string, { bg: string; text: string; label: string; icon: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant', icon: '🤝' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, label: 'Emotional Safety', icon: '🛡️' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, label: 'Communication', icon: '💬' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual', icon: '✝️' },
};

interface CompletionDay {
  date: string;
  count: number;
}

interface Assessment {
  score_covenant: number;
  score_emotional_safety: number;
  score_communication: number;
  score_spiritual: number;
  score_overall: number;
  tier: string;
  completed_at: string;
}

export default function JourneyPage() {
  const [profile, setProfile] = useState<any>(null);
  const [completionDays, setCompletionDays] = useState<CompletionDay[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [totalDevotionals, setTotalDevotionals] = useState(0);
  const [totalExercises, setTotalExercises] = useState(0);
  const [totalChallenges, setTotalChallenges] = useState(0);
  const [milestoneCount, setMilestoneCount] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: prof } = await supabase.from('profiles')
      .select('id, first_name, streak_count, longest_streak, current_devotional_day, couple_id')
      .eq('id', user.id).single();
    if (prof) {
      setProfile(prof);
      setLongestStreak(Math.max(prof.longest_streak || 0, prof.streak_count || 0));
    }

    // Devotional completions by date (for calendar)
    const { data: completions } = await supabase
      .from('devotional_completions')
      .select('created_at')
      .eq('profile_id', user.id)
      .order('created_at', { ascending: true });

    if (completions) {
      const byDate = new Map<string, number>();
      for (const c of completions) {
        const d = c.created_at.split('T')[0];
        byDate.set(d, (byDate.get(d) || 0) + 1);
      }
      setCompletionDays(Array.from(byDate.entries()).map(([date, count]) => ({ date, count })));
      setTotalDevotionals(completions.length);
    }

    // Exercises completed
    if (prof?.couple_id) {
      const { count: exCount } = await supabase
        .from('couple_exercise_completions')
        .select('id', { count: 'exact', head: true })
        .eq('couple_id', prof.couple_id);
      setTotalExercises(exCount || 0);
    }

    // Challenges completed
    const { count: chCount } = await supabase
      .from('challenge_enrolments')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id)
      .eq('status', 'completed');
    setTotalChallenges(chCount || 0);

    // Milestones
    const { count: mCount } = await supabase
      .from('user_milestones')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', user.id);
    setMilestoneCount(mCount || 0);

    // Assessment history
    const { data: asses } = await supabase
      .from('assessments')
      .select('score_covenant, score_emotional_safety, score_communication, score_spiritual, score_overall, tier, completed_at')
      .eq('profile_id', user.id)
      .eq('status', 'completed')
      .order('completed_at', { ascending: true });
    if (asses) setAssessments(asses);

    setLoading(false);
  }

  // Build 12-week calendar grid (84 days, from today back)
  function buildCalendarGrid() {
    const today = new Date();
    const days: { date: string; level: number; isToday: boolean; dayOfWeek: number }[] = [];
    const completionMap = new Map(completionDays.map(d => [d.date, d.count]));

    for (let i = 83; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = completionMap.get(dateStr) || 0;
      days.push({
        date: dateStr,
        level: count === 0 ? 0 : count >= 3 ? 3 : count >= 2 ? 2 : 1,
        isToday: i === 0,
        dayOfWeek: d.getDay(),
      });
    }
    return days;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <p className="text-sm" style={{ color: t.textMuted }}>Loading your journey...</p>
      </div>
    );
  }

  const calendar = buildCalendarGrid();
  const latestAssessment = assessments.length > 0 ? assessments[assessments.length - 1] : null;

  const LEVEL_COLORS = [
    t.border,           // 0: no activity
    'rgba(184,134,11,0.3)', // 1: light
    'rgba(184,134,11,0.6)', // 2: medium
    '#B8860B',            // 3: strong
  ];

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-2xl mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
      >
        <TopBar title="Your Journey" subtitle={`${profile?.first_name || 'Friend'}'s progress`} backHref="/dashboard" />

        <div className="px-4 pb-10">

          {/* ─── Stats overview ─── */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { value: totalDevotionals, label: 'Devotionals', icon: '📖' },
              { value: profile?.streak_count || 0, label: 'Current Streak', icon: '🔥' },
              { value: longestStreak, label: 'Longest Streak', icon: '🏆' },
              { value: milestoneCount, label: 'Milestones', icon: '⭐' },
              { value: totalChallenges, label: 'Challenges Done', icon: '💪' },
              { value: totalExercises, label: 'Exercises Done', icon: '✏️' },
            ].map((stat, i) => (
              <div key={i} className="rounded-2xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-xl">{stat.icon}</span>
                <div className="text-2xl font-bold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>

          {/* ─── Activity Calendar (GitHub-style) ─── */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Activity · Last 12 Weeks
              </h2>
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color: t.textMuted }}>Less</span>
                {LEVEL_COLORS.map((color, i) => (
                  <div key={i} className="w-3 h-3 rounded-sm" style={{ background: color }} />
                ))}
                <span className="text-xs" style={{ color: t.textMuted }}>More</span>
              </div>
            </div>

            {/* Calendar grid: 7 rows (days) x 12 columns (weeks) */}
            <div className="flex gap-[3px]">
              {/* Group by week */}
              {Array.from({ length: 12 }, (_, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-[3px] flex-1">
                  {Array.from({ length: 7 }, (_, dayIndex) => {
                    const idx = weekIndex * 7 + dayIndex;
                    const day = calendar[idx];
                    if (!day) return <div key={dayIndex} className="aspect-square rounded-sm" style={{ background: 'transparent' }} />;
                    return (
                      <div
                        key={dayIndex}
                        className="aspect-square rounded-sm transition-colors"
                        title={`${day.date}: ${day.level > 0 ? day.level + ' activities' : 'No activity'}`}
                        style={{
                          background: LEVEL_COLORS[day.level],
                          outline: day.isToday ? `2px solid ${t.textLink}` : 'none',
                          outlineOffset: '-1px',
                        }}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* ─── Pillar Scores ─── */}
          {latestAssessment && (
            <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Your Four Pillars
                </h2>
                <div className="text-xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: Number(latestAssessment.score_overall) >= 3.5 ? t.green : Number(latestAssessment.score_overall) >= 2.5 ? t.textLink : t.red }}>
                  {Number(latestAssessment.score_overall).toFixed(1)}
                </div>
              </div>

              <div className="space-y-3">
                {([
                  { key: 'covenant', score: Number(latestAssessment.score_covenant) },
                  { key: 'emotional_safety', score: Number(latestAssessment.score_emotional_safety) },
                  { key: 'communication', score: Number(latestAssessment.score_communication) },
                  { key: 'spiritual', score: Number(latestAssessment.score_spiritual) },
                ] as const).map((p) => {
                  const pm = PILLAR_MAP[p.key];
                  const color = p.score >= 3.5 ? t.green : p.score >= 2.5 ? t.textLink : t.red;
                  return (
                    <div key={p.key}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{pm.icon}</span>
                          <span className="text-xs font-semibold" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>{pm.label}</span>
                        </div>
                        <span className="text-xs font-bold" style={{ color, fontFamily: 'Source Sans 3, sans-serif' }}>{p.score.toFixed(1)}/5</span>
                      </div>
                      <div className="w-full h-3 rounded-full" style={{ background: t.border }}>
                        <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${(p.score / 5) * 100}%`, background: color }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Assessment trend */}
              {assessments.length > 1 && (
                <div className="mt-5 pt-4" style={{ borderTop: `1px solid ${t.border}` }}>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Score Trend
                  </div>
                  <div className="flex items-end gap-2 h-20">
                    {assessments.map((a, i) => {
                      const score = Number(a.score_overall);
                      const height = (score / 5) * 100;
                      const color = score >= 3.5 ? t.green : score >= 2.5 ? t.textLink : t.red;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <div className="w-full rounded-t-lg transition-all" style={{ height: `${height}%`, background: color, minHeight: 4 }} />
                          <span className="text-[10px]" style={{ color: t.textMuted }}>{new Date(a.completed_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ─── Devotional Progress ─── */}
          <div className="rounded-2xl p-5 mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <h2 className="text-sm font-semibold uppercase tracking-wider m-0 mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
              Devotional Progress
            </h2>
            <div className="flex items-center gap-4 mb-3">
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-xs" style={{ color: t.textMuted }}>Day {profile?.current_devotional_day || 1} of 90</span>
                  <span className="text-xs font-bold" style={{ color: t.textLink }}>{Math.round(((profile?.current_devotional_day || 1) / 90) * 100)}%</span>
                </div>
                <div className="w-full h-3 rounded-full" style={{ background: t.border }}>
                  <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${((profile?.current_devotional_day || 1) / 90) * 100}%`, background: 'linear-gradient(135deg, #B8860B, #8B6914)' }} />
                </div>
              </div>
            </div>

            {/* Pillar breakdown of completed devotionals */}
            <div className="grid grid-cols-4 gap-2 mt-3">
              {Object.entries(PILLAR_MAP).map(([key, pm]) => {
                const completedInPillar = completionDays.length > 0 ? Math.round(totalDevotionals / 4) : 0;
                return (
                  <div key={key} className="text-center p-2 rounded-xl" style={{ background: pm.bg }}>
                    <span className="text-lg">{pm.icon}</span>
                    <div className="text-xs font-semibold mt-0.5" style={{ color: pm.text, fontFamily: 'Source Sans 3, sans-serif' }}>{pm.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ─── No assessment yet prompt ─── */}
          {!latestAssessment && (
            <div className="rounded-2xl p-6 mb-6 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}30` }}>
              <span className="text-3xl">📋</span>
              <h3 className="text-lg font-medium mt-2 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Take Your Assessment
              </h3>
              <p className="text-sm mb-4" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
                Discover your pillar scores and unlock personalized insights on your devotional journey.
              </p>
              <a href="/assessment" className="inline-block px-6 py-3 rounded-full text-sm font-semibold text-white no-underline" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}>
                Start Assessment →
              </a>
            </div>
          )}

          {/* Scripture footer */}
          <div className="text-center py-8">
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
