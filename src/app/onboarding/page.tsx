'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { WelcomeStep } from '@/components/onboarding/WelcomeStep';
import { AboutYouStep } from '@/components/onboarding/AboutYouStep';
import { YourMarriageStep } from '@/components/onboarding/YourMarriageStep';
import { YourHopesStep } from '@/components/onboarding/YourHopesStep';
import { InviteSpouseStep } from '@/components/onboarding/InviteSpouseStep';
import { CovenantMomentStep } from '@/components/onboarding/CovenantMomentStep';
import { ProgressDots } from '@/components/ui/ProgressDots';

export interface OnboardingData {
  firstName?: string;
  lastName?: string;
  gender?: 'male' | 'female';
  weddingDate?: string;
  marriageState?: 'thriving' | 'steady' | 'strained' | 'crisis';
  churchStatus?: 'yes' | 'sometimes' | 'no' | 'exploring';
  hopes?: string[];
  spouseEmail?: string;
  spouseName?: string;
  spouseMessage?: string;
}

const STEP_COUNT = 6;

export default function OnboardingPage() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>({});
  const [saving, setSaving] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const supabase = createClient();

  const canProceed = (): boolean => {
    switch (step) {
      case 0: return true;
      case 1: return !!(data.firstName && data.gender);
      case 2: return !!data.marriageState;
      case 3: return (data.hopes || []).length > 0;
      case 4: return true; // optional
      case 5: return true;
      default: return true;
    }
  };

  const saveOnboardingData = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // ── Check for a pending spouse invitation for this user's email ──
      const { data: pendingInvite } = await supabase
        .from('spouse_invitations')
        .select('invite_token')
        .eq('invitee_email', user.email!)
        .eq('status', 'pending')
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingInvite) {
        // Accept the invitation — the RPC links profiles, couples, partner_ids
        const { data: result } = await supabase.rpc('accept_spouse_invitation', {
          p_token: pendingInvite.invite_token,
          p_accepter_id: user.id,
        });

        if (result?.success) {
          // RPC handled couple linking — just update personal profile fields
          await supabase.from('profiles').update({
            first_name: data.firstName,
            last_name: data.lastName,
            gender: data.gender,
            onboarding_completed: true,
            onboarding_step: STEP_COUNT,
          }).eq('id', user.id);

          router.push('/dashboard');
          return;
        }
        // If RPC failed (e.g. token expired between check and call), fall through
        // to normal couple creation below
      }

      // ── No pending invitation — create a new couple ──

      // Update profile
      await supabase.from('profiles').update({
        first_name: data.firstName,
        last_name: data.lastName,
        gender: data.gender,
        onboarding_completed: true,
        onboarding_step: STEP_COUNT,
        role: 'spouse',
      }).eq('id', user.id);

      // Create couple record
      const { data: couple } = await supabase.from('couples').insert({
        spouse_1_id: user.id,
        wedding_date: data.weddingDate || null,
        status: data.spouseEmail ? 'pending' : 'active',
      }).select().single();

      if (couple) {
        // Link profile to couple
        await supabase.from('profiles').update({
          couple_id: couple.id,
        }).eq('id', user.id);

        // Send spouse invitation if provided
        if (data.spouseEmail) {
          const { data: invite } = await supabase.from('spouse_invitations').insert({
            inviter_id: user.id,
            inviter_name: data.firstName || null,
            couple_id: couple.id,
            invitee_email: data.spouseEmail,
            invitee_name: data.spouseName || null,
            personal_message: data.spouseMessage || null,
          }).select('id').single();

          // Trigger invitation email
          if (invite) {
            supabase.functions.invoke('send-spouse-invite', {
              body: { invitation_id: invite.id },
            }).catch(err => console.log('Invite email note:', err));
          }
        }
      }

      router.push('/dashboard');
    } catch (err) {
      console.error('Error saving onboarding:', err);
    } finally {
      setSaving(false);
    }
  };

  const next = () => {
    if (step < STEP_COUNT - 1) {
      setStep(step + 1);
      containerRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <div className="min-h-screen flex justify-center items-start px-4 py-6" style={{ background: 'var(--bg-primary)' }}>
      <div
        ref={containerRef}
        className="w-full max-w-[480px] rounded-3xl shadow-card overflow-hidden"
        style={{ background: 'var(--bg-card)' }}
      >
        {/* Header */}
        {step > 0 && step < STEP_COUNT - 1 && (
          <div className="px-6 pt-4 flex items-center justify-between">
            <button
              onClick={back}
              className="text-sm border-none bg-transparent cursor-pointer"
              style={{ color: '#A69D90', fontFamily: 'Source Sans 3, sans-serif' }}
            >
              ← Back
            </button>
            <div className="flex items-center gap-2">
              <CleaveLogo size={24} />
              <span className="text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#A69D90' }}>
                Cleave
              </span>
            </div>
            <div className="w-10" />
          </div>
        )}

        {/* Progress */}
        {step > 0 && step < STEP_COUNT - 1 && (
          <ProgressDots current={step - 1} total={STEP_COUNT - 2} />
        )}

        {/* Content */}
        <div className={step === 0 ? 'px-6 py-5 pb-10' : 'px-7 py-2 pb-8'}>
          {step === 0 && <WelcomeStep onNext={next} />}
          {step === 1 && <AboutYouStep data={data} setData={setData} />}
          {step === 2 && <YourMarriageStep data={data} setData={setData} />}
          {step === 3 && <YourHopesStep data={data} setData={setData} />}
          {step === 4 && <InviteSpouseStep data={data} setData={setData} onSkip={next} />}
          {step === 5 && <CovenantMomentStep data={data} onComplete={saveOnboardingData} saving={saving} />}
        </div>

        {/* Continue button */}
        {step > 0 && step < STEP_COUNT - 1 && (
          <div className="px-7 pb-7">
            <button
              onClick={next}
              disabled={!canProceed()}
              className="w-full py-4 rounded-xl text-base font-semibold text-white transition-all"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                background: canProceed()
                  ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                  : '#E8E2D8',
                color: canProceed() ? '#FFF' : '#A69D90',
                cursor: canProceed() ? 'pointer' : 'not-allowed',
                boxShadow: canProceed() ? '0 4px 16px rgba(184, 134, 11, 0.2)' : 'none',
              }}
            >
              {step === 4 && data.spouseEmail ? 'Send Invitation & Continue' : 'Continue'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
