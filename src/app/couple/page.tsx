'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';
import Link from 'next/link';

import { SoloInviteScreen } from '@/components/couple/SoloInviteScreen';
import { OverviewTab } from '@/components/couple/OverviewTab';
import { ExercisesTab } from '@/components/couple/ExercisesTab';
import { CheckInTab } from '@/components/couple/CheckInTab';
import { NotesTab } from '@/components/couple/NotesTab';
import { GoalsTab } from '@/components/couple/GoalsTab';
import { PremiumBadge } from '@/components/ui/PremiumGate';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { useSubscription } from '@/lib/useSubscription';

type Tab = 'overview' | 'exercises' | 'checkin' | 'notes' | 'goals';

const TABS: { key: Tab; label: string; icon: string; premium: boolean }[] = [
  { key: 'overview', label: 'Overview', icon: '💛', premium: false },
  { key: 'exercises', label: 'Exercises', icon: '✏️', premium: true },
  { key: 'checkin', label: 'Check-In', icon: '📋', premium: true },
  { key: 'notes', label: 'Notes', icon: '💌', premium: true },
  { key: 'goals', label: 'Goals', icon: '🎯', premium: false },
];

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

  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { isPremium, loading: subLoading } = useSubscription();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  function getMonday(d: Date) {
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

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

  async function submitCheckIn(ciRating: number, ciHighlight: string, ciNeed: string, ciGratitude: string) {
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
      await supabase.from('couple_check_ins').insert({ couple_id: couple.id, week_of: monday, ...updateData });
    }
    loadData();
  }

  async function sendLoveNote(message: string, noteType: string) {
    if (!profile || !couple || !message.trim()) return;
    await supabase.from('love_notes').insert({
      couple_id: couple.id,
      sender_id: profile.id,
      message: message.trim(),
      note_type: noteType,
    });
    loadData();
  }

  async function addGoal(title: string, pillar: string) {
    if (!profile || !couple || !title.trim()) return;
    await supabase.from('couple_goals').insert({
      couple_id: couple.id,
      title: title.trim(),
      pillar,
      created_by: profile.id,
    });
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
    return <SoloInviteScreen profile={profile} couple={couple} />;
  }

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
          {TABS.map(tb => {
            const isLocked = tb.premium && !isPremium && !subLoading;
            return (
              <button
                key={tb.key}
                onClick={() => { setTab(tb.key); setSelectedExercise(null); }}
                className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all flex items-center gap-1"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: tab === tb.key ? t.goldBg : t.bgCard,
                  borderColor: tab === tb.key ? t.textLink : t.border,
                  color: tab === tb.key ? t.textPrimary : t.textMuted,
                }}
              >
                {tb.icon} {tb.label}
                {isLocked && <PremiumBadge />}
              </button>
            );
          })}
        </div>

        {tab === 'overview' && (
          <OverviewTab profile={profile} partner={partner} notes={notes} goals={goals} setTab={setTab} completeGoal={completeGoal} />
        )}

        {tab === 'exercises' && (
          isPremium || subLoading ? (
            <ExercisesTab
              exercises={exercises}
              selectedExercise={selectedExercise}
              setSelectedExercise={setSelectedExercise}
              exerciseStep={exerciseStep}
              setExerciseStep={setExerciseStep}
              completeExercise={completeExercise}
            />
          ) : (
            <UpgradePrompt feature="Couple Exercises" compact />
          )
        )}

        {tab === 'checkin' && (
          isPremium || subLoading ? (
            <CheckInTab submitCheckIn={submitCheckIn} />
          ) : (
            <UpgradePrompt feature="Weekly Check-In" compact />
          )
        )}

        {tab === 'notes' && (
          isPremium || subLoading ? (
            <NotesTab profile={profile} partner={partner} notes={notes} sendLoveNote={sendLoveNote} />
          ) : (
            <UpgradePrompt feature="Love Notes" compact />
          )
        )}

        {tab === 'goals' && (
          <GoalsTab goals={goals} addGoal={addGoal} completeGoal={completeGoal} />
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
