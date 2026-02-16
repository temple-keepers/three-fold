'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';
import Link from 'next/link';

const PILLAR_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '🤝', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, icon: '🛡️', label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, icon: '💬', label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '✝️', label: 'Spiritual' },
  fun: { bg: t.goldBg, text: t.textLink, icon: '🎉', label: 'Fun' },
  general: { bg: t.bgPrimary, text: t.textSecondary, icon: '⭐', label: 'General' },
};

const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: t.greenBg, text: t.green },
  medium: { bg: t.goldBg, text: t.textLink },
  deep: { bg: t.pillarSafetyBg, text: t.pillarSafetyText },
};

const NOTE_TYPES: Record<string, { icon: string; label: string; bg: string }> = {
  love: { icon: '❤️', label: 'Love', bg: t.redBg },
  encouragement: { icon: '💪', label: 'Encouragement', bg: t.pillarCommBg },
  gratitude: { icon: '🙏', label: 'Gratitude', bg: t.greenBg },
  prayer: { icon: '✝️', label: 'Prayer', bg: t.pillarSafetyBg },
  apology: { icon: '🕊️', label: 'Apology', bg: t.bgCardHover },
  fun: { icon: '😄', label: 'Fun', bg: t.goldBg },
};

type Tab = 'overview' | 'exercises' | 'checkin' | 'notes' | 'goals';

export default function CoupleDashboard() {
  const [profile, setProfile] = useState<any>(null);
  const [partner, setPartner] = useState<any>(null);
  const [couple, setCouple] = useState<any>(null);
  const [exercises, setExercises] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [checkIn, setCheckIn] = useState<any>(null);
  const [notes, setNotes] = useState<any[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [coupleSummary, setCoupleSummary] = useState<any>(null);
  
  const [tab, setTab] = useState<Tab>('overview');
  const [selectedExercise, setSelectedExercise] = useState<any>(null);
  const [exerciseStep, setExerciseStep] = useState(0);
  
  // Check-in form
  const [ciRating, setCiRating] = useState(0);
  const [ciHighlight, setCiHighlight] = useState('');
  const [ciNeed, setCiNeed] = useState('');
  const [ciGratitude, setCiGratitude] = useState('');
  
  // Love note form
  const [noteMessage, setNoteMessage] = useState('');
  const [noteType, setNoteType] = useState('love');
  
  // Goal form
  const [goalTitle, setGoalTitle] = useState('');
  const [goalPillar, setGoalPillar] = useState('general');
  const [showGoalForm, setShowGoalForm] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) {
      setProfile(prof);
      
      if (prof.partner_id) {
        const { data: part } = await supabase.from('profiles').select('*').eq('id', prof.partner_id).single();
        if (part) setPartner(part);
      }

      if (prof.couple_id) {
        const { data: coup } = await supabase.from('couples').select('*').eq('id', prof.couple_id).single();
        if (coup) setCouple(coup);

        const { data: comps } = await supabase.from('couple_exercise_completions')
          .select('*').eq('couple_id', prof.couple_id).order('completed_at', { ascending: false }).limit(20);
        if (comps) setCompletions(comps);

        const monday = getMonday(new Date()).toISOString().split('T')[0];
        const { data: ci } = await supabase.from('couple_check_ins')
          .select('*').eq('couple_id', prof.couple_id).eq('week_of', monday).maybeSingle();
        if (ci) setCheckIn(ci);

        const { data: ln } = await supabase.from('love_notes')
          .select('*').eq('couple_id', prof.couple_id).order('created_at', { ascending: false }).limit(20);
        if (ln) setNotes(ln);

        const { data: gl } = await supabase.from('couple_goals')
          .select('*').eq('couple_id', prof.couple_id).eq('status', 'active').order('created_at', { ascending: false });
        if (gl) setGoals(gl);

        const { data: cs } = await supabase.from('couple_assessment_summaries')
          .select('*').eq('couple_id', prof.couple_id).order('created_at', { ascending: false }).limit(1).maybeSingle();
        if (cs) setCoupleSummary(cs);
      }
    }

    const { data: exs } = await supabase.from('couple_exercises').select('*').eq('is_active', true).order('display_order');
    if (exs) setExercises(exs);

    setLoading(false);
  }

  function getMonday(d: Date) {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  async function submitCheckIn() {
    if (!profile || !couple || ciRating === 0) return;
    const monday = getMonday(new Date()).toISOString().split('T')[0];
    const isSpouse1 = couple.spouse_1_id === profile.id;

    const updateData: any = {};
    if (isSpouse1) {
      updateData.spouse_1_id = profile.id;
      updateData.spouse_1_connection_rating = ciRating;
      updateData.spouse_1_highlight = ciHighlight;
      updateData.spouse_1_need = ciNeed;
      updateData.spouse_1_gratitude = ciGratitude;
      updateData.spouse_1_submitted_at = new Date().toISOString();
    } else {
      updateData.spouse_2_id = profile.id;
      updateData.spouse_2_connection_rating = ciRating;
      updateData.spouse_2_highlight = ciHighlight;
      updateData.spouse_2_need = ciNeed;
      updateData.spouse_2_gratitude = ciGratitude;
      updateData.spouse_2_submitted_at = new Date().toISOString();
    }

    if (checkIn) {
      const otherSubmitted = isSpouse1 ? checkIn.spouse_2_submitted_at : checkIn.spouse_1_submitted_at;
      if (otherSubmitted) updateData.both_submitted = true;
      await supabase.from('couple_check_ins').update(updateData).eq('id', checkIn.id);
    } else {
      await supabase.from('couple_check_ins').insert({
        couple_id: couple.id,
        week_of: monday,
        ...updateData,
      });
    }
    loadData();
  }

  async function sendLoveNote() {
    if (!profile || !couple || !noteMessage.trim()) return;
    await supabase.from('love_notes').insert({
      couple_id: couple.id,
      sender_id: profile.id,
      message: noteMessage.trim(),
      note_type: noteType,
    });
    setNoteMessage('');
    loadData();
  }

  async function addGoal() {
    if (!profile || !couple || !goalTitle.trim()) return;
    await supabase.from('couple_goals').insert({
      couple_id: couple.id,
      title: goalTitle.trim(),
      pillar: goalPillar,
      created_by: profile.id,
    });
    setGoalTitle('');
    setShowGoalForm(false);
    loadData();
  }

  async function completeGoal(goalId: string) {
    await supabase.from('couple_goals').update({
      status: 'completed',
      completed_at: new Date().toISOString(),
    }).eq('id', goalId);
    loadData();
  }

  async function completeExercise(exerciseId: string) {
    if (!couple || !profile) return;
    await supabase.from('couple_exercise_completions').insert({
      couple_id: couple.id,
      exercise_id: exerciseId,
      initiated_by: profile.id,
    });
    setSelectedExercise(null);
    setExerciseStep(0);
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  if (!couple || !partner) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="rounded-3xl p-10 text-center max-w-md" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <ThreefoldLogo size={56} />
          <h2 className="text-2xl font-medium mt-4 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            Waiting for Your Spouse
          </h2>
          <p className="text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
            The couple dashboard unlocks when both spouses are linked. Once your partner accepts your invitation, this space comes alive.
          </p>
          <Link href="/dashboard">
            <span className="text-sm font-semibold" style={{ color: t.textLink }}>← Back to dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'overview', label: 'Overview', icon: '💛' },
    { key: 'exercises', label: 'Exercises', icon: '✏️' },
    { key: 'checkin', label: 'Check-In', icon: '📋' },
    { key: 'notes', label: 'Notes', icon: '💌' },
    { key: 'goals', label: 'Goals', icon: '🎯' },
  ];

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-2xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><ThreefoldLogo size={28} /></Link>
            <div>
              <h1 className="text-xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                {profile?.first_name} & {partner?.first_name}
              </h1>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>Your shared space</p>
            </div>
          </div>
          {couple?.wedding_date && (
            <div className="text-right">
              <div className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>Married</div>
              <div className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                {new Date(couple.wedding_date).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
              </div>
            </div>
          )}
        </div>

        {/* Tab nav */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {TABS.map(tb => (
            <button
              key={tb.key}
              onClick={() => { setTab(tb.key); setSelectedExercise(null); }}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                background: tab === tb.key ? t.goldBg : t.bgCard,
                borderColor: tab === tb.key ? t.textLink : t.border,
                color: tab === tb.key ? t.textPrimary : t.textMuted,
              }}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ======= OVERVIEW TAB ======= */}
        {tab === 'overview' && (
          <>
            {/* Couple streaks */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                    {profile?.first_name}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>🔥</span>
                    <span className="text-2xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                      {profile?.streak_count || 0}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: t.textMuted }}>day streak</span>
                </div>
                <div className="text-center">
                  <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                    {partner?.first_name}
                  </div>
                  <div className="flex items-center justify-center gap-1.5">
                    <span>🔥</span>
                    <span className="text-2xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                      {partner?.streak_count || 0}
                    </span>
                  </div>
                  <span className="text-xs" style={{ color: t.textMuted }}>day streak</span>
                </div>
              </div>
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-3 gap-2.5 mb-3">
              <button onClick={() => setTab('checkin')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-xl">📋</span>
                <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Check-In</div>
              </button>
              <button onClick={() => setTab('notes')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-xl">💌</span>
                <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Send Note</div>
              </button>
              <button onClick={() => setTab('exercises')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-xl">✏️</span>
                <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Exercise</div>
              </button>
            </div>

            {/* Recent notes */}
            {notes.length > 0 && (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Recent Love Notes
                </div>
                {notes.slice(0, 3).map(n => {
                  const nt = NOTE_TYPES[n.note_type] || NOTE_TYPES.love;
                  const isMine = n.sender_id === profile?.id;
                  return (
                    <div key={n.id} className="flex items-start gap-3 mb-3 last:mb-0">
                      <span className="text-lg">{nt.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs mb-0.5" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                          {isMine ? 'You' : partner?.first_name} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                        <div className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.5 }}>
                          {n.message}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Goals */}
            {goals.length > 0 && (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Active Goals
                </div>
                {goals.slice(0, 3).map(g => {
                  const ps = PILLAR_STYLES[g.pillar] || PILLAR_STYLES.general;
                  return (
                    <div key={g.id} className="flex items-center gap-3 mb-2.5 last:mb-0">
                      <span className="text-sm">{ps.icon}</span>
                      <span className="text-sm flex-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                        {g.title}
                      </span>
                      <button
                        onClick={() => completeGoal(g.id)}
                        className="text-xs px-2.5 py-1 rounded-lg cursor-pointer border-none"
                        style={{ background: t.greenBg, color: t.green, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}
                      >
                        Done ✓
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ======= EXERCISES TAB ======= */}
        {tab === 'exercises' && !selectedExercise && (
          <div className="space-y-2.5">
            {exercises.map(ex => {
              const ps = PILLAR_STYLES[ex.pillar] || PILLAR_STYLES.general;
              const dc = DIFF_COLORS[ex.difficulty] || DIFF_COLORS.easy;
              return (
                <button
                  key={ex.id}
                  onClick={() => { setSelectedExercise(ex); setExerciseStep(0); }}
                  className="w-full rounded-2xl p-5 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5"
                  style={{ background: t.bgCard, boxShadow: t.shadowCard }}
                >
                  <div className="flex items-center gap-3.5">
                    <span className="text-2xl">{ex.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                        {ex.title}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: t.textMuted, lineHeight: 1.5 }}>{ex.description}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: ps.bg, color: ps.text, fontWeight: 600 }}>
                          {ps.label}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: dc.bg, color: dc.text, fontWeight: 600 }}>
                          {ex.difficulty}
                        </span>
                        <span className="text-xs" style={{ color: t.textMuted }}>~{ex.duration_minutes} min</span>
                      </div>
                    </div>
                    <span style={{ color: t.textLink }}>→</span>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        {/* Exercise detail */}
        {tab === 'exercises' && selectedExercise && (
          <div className="rounded-3xl p-7" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <button
              onClick={() => { setSelectedExercise(null); setExerciseStep(0); }}
              className="text-sm border-none bg-transparent cursor-pointer mb-4"
              style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              ← Back
            </button>

            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{selectedExercise.icon}</span>
              <div>
                <h2 className="text-2xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  {selectedExercise.title}
                </h2>
                <div className="text-xs mt-1" style={{ color: t.textMuted }}>
                  ~{selectedExercise.duration_minutes} min · {selectedExercise.frequency_suggestion}
                </div>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-1.5 mb-5">
              {(selectedExercise.instructions || []).map((_: any, i: number) => (
                <div key={i} className="flex-1 h-1.5 rounded-full" style={{ background: i <= exerciseStep ? t.textLink : t.border }} />
              ))}
            </div>

            {/* Current step */}
            {selectedExercise.instructions?.[exerciseStep] && (
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: t.goldBg, color: t.textLink }}>
                    {selectedExercise.instructions[exerciseStep].step}
                  </div>
                  <h3 className="text-lg font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                    {selectedExercise.instructions[exerciseStep].title}
                  </h3>
                </div>
                <p className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                  {selectedExercise.instructions[exerciseStep].text}
                </p>
              </div>
            )}

            {/* Scripture on last step */}
            {exerciseStep === (selectedExercise.instructions?.length || 1) - 1 && selectedExercise.scripture_text && (
              <div className="rounded-xl p-5 mb-5" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                <p className="text-base italic m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}>
                  &ldquo;{selectedExercise.scripture_text}&rdquo;
                </p>
                <p className="text-xs m-0" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
                  {selectedExercise.scripture_reference}
                </p>
              </div>
            )}

            {/* Nav */}
            <div className="flex gap-3">
              {exerciseStep > 0 && (
                <button onClick={() => setExerciseStep(exerciseStep - 1)} className="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  ← Previous
                </button>
              )}
              {exerciseStep < (selectedExercise.instructions?.length || 1) - 1 ? (
                <button onClick={() => setExerciseStep(exerciseStep + 1)} className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}>
                  Next Step →
                </button>
              ) : (
                <button onClick={() => completeExercise(selectedExercise.id)} className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #5B8A3C, #3D6B28)', fontFamily: 'Source Sans 3, sans-serif' }}>
                  Complete Exercise ✓
                </button>
              )}
            </div>
          </div>
        )}

        {/* ======= CHECK-IN TAB ======= */}
        {tab === 'checkin' && (
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

            <button onClick={submitCheckIn} disabled={ciRating === 0} className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: ciRating > 0 ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border, color: ciRating > 0 ? '#FFF' : t.textMuted }}>
              Submit Check-In
            </button>
          </div>
        )}

        {/* ======= NOTES TAB ======= */}
        {tab === 'notes' && (
          <>
            {/* Send note */}
            <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Send {partner?.first_name} a note
              </div>

              <div className="flex gap-1.5 mb-3 flex-wrap">
                {Object.entries(NOTE_TYPES).map(([key, nt]) => (
                  <button key={key} onClick={() => setNoteType(key)} className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all" style={{ background: noteType === key ? nt.bg : t.bgCardHover, borderColor: noteType === key ? t.textLink : t.border, color: noteType === key ? t.textPrimary : t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    {nt.icon} {nt.label}
                  </button>
                ))}
              </div>

              <textarea value={noteMessage} onChange={e => setNoteMessage(e.target.value)} placeholder={`Write something from the heart...`} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />

              <button onClick={sendLoveNote} disabled={!noteMessage.trim()} className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: noteMessage.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}>
                Send 💌
              </button>
            </div>

            {/* Note history */}
            <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Note History
              </div>
              {notes.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: t.textMuted }}>No notes yet — send the first one!</p>
              ) : (
                notes.map(n => {
                  const nt = NOTE_TYPES[n.note_type] || NOTE_TYPES.love;
                  const isMine = n.sender_id === profile?.id;
                  return (
                    <div key={n.id} className="flex items-start gap-3 mb-4 last:mb-0 p-3 rounded-xl" style={{ background: isMine ? t.bgCardHover : nt.bg }}>
                      <span className="text-lg flex-shrink-0">{nt.icon}</span>
                      <div className="flex-1">
                        <div className="text-xs mb-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                          {isMine ? 'You' : partner?.first_name} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <div className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                          {n.message}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* ======= GOALS TAB ======= */}
        {tab === 'goals' && (
          <>
            {/* Add goal */}
            {showGoalForm ? (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="What do you want to work on together?" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {Object.entries(PILLAR_STYLES).map(([key, ps]) => (
                    <button key={key} onClick={() => setGoalPillar(key)} className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border" style={{ background: goalPillar === key ? ps.bg : t.bgCardHover, borderColor: goalPillar === key ? t.textLink : t.border, color: goalPillar === key ? ps.text : t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                      {ps.icon} {ps.label}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setShowGoalForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Cancel</button>
                  <button onClick={addGoal} disabled={!goalTitle.trim()} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: goalTitle.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}>Add Goal</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowGoalForm(true)} className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
                <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>+ Add a Shared Goal</span>
              </button>
            )}

            {/* Goals list */}
            <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              {goals.length === 0 ? (
                <p className="text-sm text-center py-4" style={{ color: t.textMuted }}>No goals yet — set your first shared goal!</p>
              ) : (
                goals.map(g => {
                  const ps = PILLAR_STYLES[g.pillar] || PILLAR_STYLES.general;
                  return (
                    <div key={g.id} className="flex items-center gap-3 mb-3 last:mb-0 p-3 rounded-xl" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                      <span className="text-lg">{ps.icon}</span>
                      <div className="flex-1">
                        <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{g.title}</div>
                        <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                          {ps.label} · Added {new Date(g.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                        </div>
                      </div>
                      <button onClick={() => completeGoal(g.id)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer border-none font-semibold" style={{ background: t.greenBg, color: t.green, fontFamily: 'Source Sans 3, sans-serif' }}>
                        Done ✓
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
        </div>
      </div>
    </div>
  );
}
