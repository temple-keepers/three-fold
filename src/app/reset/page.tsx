'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';
import { useSubscription } from '@/lib/useSubscription';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';

const PHASE_CONFIG = [
  { number: 1, icon: '⚓', color: t.pillarSafetyText, bg: t.pillarSafetyBg, label: 'Stabilise' },
  { number: 2, icon: '💬', color: t.pillarCommText, bg: t.pillarCommBg, label: 'Communication' },
  { number: 3, icon: '💛', color: t.textLink, bg: t.goldBg, label: 'Closeness' },
  { number: 4, icon: '✝️', color: t.pillarSpiritualText, bg: t.pillarSpiritualBg, label: 'Alignment' },
];

const DAY_TYPE_ICONS: Record<string, string> = {
  teaching: '📖',
  exercise: '✏️',
  reflection: '💭',
  couple_activity: '👥',
  rest: '☁️',
  review: '📊',
  game: '🎲',
  conflict_tool: '🛠️',
};

export default function ResetPage() {
  const [enrolment, setEnrolment] = useState<any>(null);
  const [phases, setPhases] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);
  const [enrolling, setEnrolling] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { isPremium, loading: subLoading } = useSubscription();

  useEffect(() => { loadReset(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadReset() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single();

    if (profile?.couple_id) {
      const { data: enrol } = await supabase
        .from('reset_enrolments')
        .select('*')
        .eq('couple_id', profile.couple_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      if (enrol) setEnrolment(enrol);

      const { data: comps } = await supabase
        .from('reset_day_completions')
        .select('*')
        .eq('profile_id', user.id);
      if (comps) setCompletions(comps);
    }

    const { data: ph } = await supabase.from('reset_phases').select('*').order('phase_number');
    if (ph) setPhases(ph);

    const { data: wk } = await supabase.from('reset_weeks').select('*').order('week_number');
    if (wk) setWeeks(wk);

    const { data: dy } = await supabase.from('reset_days').select('*').order('day_number');
    if (dy) setDays(dy);

    setLoading(false);
  }

  async function startReset() {
    setEnrolling(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase.from('profiles').select('couple_id').eq('id', user.id).single();
    if (!profile?.couple_id) return;

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + 60);

    const { data: enrol } = await supabase.from('reset_enrolments').insert({
      couple_id: profile.couple_id,
      start_date: new Date().toISOString().split('T')[0],
      expected_end_date: endDate.toISOString().split('T')[0],
    }).select().single();

    if (enrol) {
      setEnrolment(enrol);
      await supabase.from('couples').update({
        reset_started_at: new Date().toISOString(),
        reset_phase: 1,
      }).eq('id', profile.couple_id);
    }
    setEnrolling(false);
  }

  async function completeDay(resetDayId: string, dayNumber: number) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !enrolment) return;

    const { data } = await supabase.from('reset_day_completions').upsert({
      enrolment_id: enrolment.id,
      profile_id: user.id,
      reset_day_id: resetDayId,
      day_number: dayNumber,
      teaching_read: true,
      completed_at: new Date().toISOString(),
    }, { onConflict: 'enrolment_id,profile_id,reset_day_id' }).select().single();

    if (data) {
      setCompletions([...completions.filter(c => c.reset_day_id !== resetDayId), data]);
      await supabase.from('reset_enrolments').update({ current_day: dayNumber }).eq('id', enrolment.id);
    }
  }

  if (loading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <CleaveLogo size={48} />
      </div>
    );
  }

  if (!isPremium) {
    return <UpgradePrompt feature="60-Day Cleave Reset" />;
  }

  const completedDays = new Set(completions.map(c => c.day_number));
  const currentDay = enrolment?.current_day || 1;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
        <TopBar
          title="60-Day Cleave Reset"
          subtitle={enrolment ? `Day ${currentDay} of 60` : 'Your structured pathway to transformation'}
          backHref="/dashboard"
          trailing={enrolment ? (
            <div className="text-right">
              <div className="text-lg font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}>
                {Math.round((completedDays.size / 60) * 100)}%
              </div>
              <div className="text-xs" style={{ color: t.textMuted }}>complete</div>
            </div>
          ) : undefined}
        />

        {/* Enrol CTA if not enrolled */}
        {!enrolment && (
          <div className="rounded-3xl p-8 text-center mb-6" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <CleaveLogo size={56} />
            <h2 className="text-2xl font-medium mt-4 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              Begin Your 60-Day Reset
            </h2>
            <p className="text-sm mb-6 max-w-md mx-auto" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}>
              A structured journey through four phases: Stabilise → Strengthen Communication → Rebuild Closeness → Covenant Alignment.
            </p>

            {/* Phase overview */}
            <div className="grid grid-cols-2 gap-3 mb-6 max-w-md mx-auto">
              {PHASE_CONFIG.map(p => (
                <div key={p.number} className="rounded-xl p-3 text-left" style={{ background: p.bg, border: `1px solid ${p.color}20` }}>
                  <span className="text-lg">{p.icon}</span>
                  <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: p.color }}>Phase {p.number}</div>
                  <div className="text-sm font-medium" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{p.label}</div>
                </div>
              ))}
            </div>

            <button
              onClick={startReset}
              disabled={enrolling}
              className="px-10 py-4 rounded-full text-base font-semibold text-white border-none cursor-pointer"
              style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)', boxShadow: '0 4px 20px rgba(184,134,11,0.25)' }}
            >
              {enrolling ? 'Starting...' : 'Start the Reset'}
            </button>
          </div>
        )}

        {/* Phase progress bar */}
        {enrolment && (
          <div className="rounded-2xl p-4 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex gap-2">
              {PHASE_CONFIG.map(p => {
                const phase = phases.find(ph => ph.phase_number === p.number);
                if (!phase) return null;
                const phaseComplete = days.filter(d => d.day_number >= phase.start_day && d.day_number <= phase.end_day)
                  .every(d => completedDays.has(d.day_number));
                const phaseCurrent = currentDay >= phase.start_day && currentDay <= phase.end_day;

                return (
                  <div key={p.number} className="flex-1 text-center">
                    <div
                      className="h-2 rounded-full mb-2"
                      style={{
                        background: phaseComplete ? p.color : phaseCurrent ? `${p.color}40` : t.border,
                      }}
                    />
                    <span className="text-sm">{p.icon}</span>
                    <div className="text-xs mt-0.5" style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      fontWeight: phaseCurrent ? 700 : 500,
                      color: phaseCurrent ? p.color : t.textMuted,
                    }}>
                      {p.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Day detail view */}
        {selectedDay && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 px-4" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}>
            <div className="rounded-3xl p-7 max-w-lg w-full max-h-[85vh] overflow-y-auto" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Day {selectedDay.day_number} · {DAY_TYPE_ICONS[selectedDay.content_type]} {selectedDay.content_type.replace('_', ' ')}
                  </span>
                  <h2 className="text-2xl font-medium mt-1 m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                    {selectedDay.title}
                  </h2>
                </div>
                <button onClick={() => setSelectedDay(null)} className="text-xl cursor-pointer border-none bg-transparent" style={{ color: t.textMuted }}>✕</button>
              </div>

              {/* Teaching */}
              {selectedDay.teaching_text && (
                <div className="mb-5">
                  <p className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                    {selectedDay.teaching_text}
                  </p>
                </div>
              )}

              {/* Scripture */}
              {selectedDay.scripture_text && (
                <div className="rounded-xl p-5 mb-5" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                  <p className="text-base italic m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}>
                    &ldquo;{selectedDay.scripture_text}&rdquo;
                  </p>
                  <p className="text-xs m-0" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
                    {selectedDay.scripture_reference}
                  </p>
                </div>
              )}

              {/* Exercise */}
              {selectedDay.exercise_title && (
                <div className="rounded-xl p-5 mb-5" style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span>{selectedDay.is_couple_exercise ? '👥' : '✏️'}</span>
                    <h3 className="text-sm font-semibold m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}>
                      {selectedDay.exercise_title}
                    </h3>
                    {selectedDay.exercise_duration_minutes && (
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: `${t.textLink}20`, color: t.textLink }}>
                        {selectedDay.exercise_duration_minutes} min
                      </span>
                    )}
                  </div>
                  <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                    {selectedDay.exercise_instructions}
                  </p>
                </div>
              )}

              {/* Reflection */}
              {selectedDay.reflection_prompt && (
                <div className="mb-5">
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    💭 Reflect
                  </h3>
                  <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                    {selectedDay.reflection_prompt}
                  </p>
                </div>
              )}

              {/* Discussion */}
              {selectedDay.discussion_question && (
                <div className="rounded-xl p-4 mb-5" style={{ background: t.pillarSafetyBg, border: `1px solid ${t.pillarSafetyText}20` }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.pillarSafetyText, fontFamily: 'Source Sans 3, sans-serif' }}>
                    💬 Discuss Together
                  </h3>
                  <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                    {selectedDay.discussion_question}
                  </p>
                </div>
              )}

              {/* Complete button */}
              {enrolment && !completedDays.has(selectedDay.day_number) ? (
                <button
                  onClick={() => { completeDay(selectedDay.id, selectedDay.day_number); setSelectedDay(null); }}
                  className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)', boxShadow: '0 4px 16px rgba(184,134,11,0.2)' }}
                >
                  Mark Day {selectedDay.day_number} Complete ✓
                </button>
              ) : completedDays.has(selectedDay.day_number) ? (
                <div className="w-full py-4 rounded-xl text-center text-base font-semibold" style={{ background: t.greenBg, color: t.green, border: `1px solid ${t.green}30` }}>
                  ✓ Completed
                </div>
              ) : null}
            </div>
          </div>
        )}

        {/* Weeks & Days Grid */}
        {weeks.map(week => {
          const weekDays = days.filter(d => d.week_id === week.id);
          const phase = phases.find(p => p.id === week.phase_id);
          const phaseConfig = PHASE_CONFIG.find(p => p.number === phase?.phase_number);

          return (
            <div key={week.id} className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-lg">{phaseConfig?.icon}</span>
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                    {week.title}
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{week.theme}</div>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-1.5">
                {weekDays.map(day => {
                  const done = completedDays.has(day.day_number);
                  const isCurrent = enrolment && day.day_number === currentDay;
                  const isLocked = enrolment && day.day_number > currentDay + 1;

                  return (
                    <button
                      key={day.id}
                      onClick={() => !isLocked && setSelectedDay(day)}
                      disabled={isLocked}
                      className="aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 cursor-pointer border transition-all"
                      style={{
                        background: done ? t.greenBg : isCurrent ? t.goldBg : t.bgCardHover,
                        borderColor: done ? `${t.green}40` : isCurrent ? t.textLink : t.border,
                        borderWidth: isCurrent ? '2px' : '1px',
                        opacity: isLocked ? 0.4 : 1,
                        cursor: isLocked ? 'not-allowed' : 'pointer',
                      }}
                    >
                      <span className="text-xs" style={{ fontFamily: 'Source Sans 3, sans-serif', fontWeight: 700, color: done ? t.green : isCurrent ? t.textLink : t.textSecondary }}>
                        {day.day_number}
                      </span>
                      <span className="text-xs">
                        {done ? '✓' : DAY_TYPE_ICONS[day.content_type] || '📖'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
