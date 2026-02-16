'use client';

import type { OnboardingData } from '@/app/onboarding/page';
import { StepWrapper } from '@/components/ui/StepWrapper';
import { Input } from '@/components/ui/Input';
import { t } from '@/lib/tokens';

interface Props {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
  onSkip?: () => void;
}

export function InviteSpouseStep({ data, setData, onSkip }: Props) {
  return (
    <StepWrapper title="Invite your spouse" subtitle="This works best together. Send them a personal invitation.">
      <div
        className="rounded-xl p-5 mb-6"
        style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}
      >
        <p
          className="text-sm m-0"
          style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}
        >
          💡 <strong>Why together?</strong> Threefold Cord gives each of you a private space for honest reflection,
          then brings your insights together on a shared dashboard. Your individual answers stay private.
        </p>
      </div>

      <Input
        label="Their Email Address"
        type="email"
        value={data.spouseEmail || ''}
        onChange={(e) => setData({ ...data, spouseEmail: e.target.value })}
        placeholder="partner@email.com"
      />

      <Input
        label="Their First Name"
        value={data.spouseName || ''}
        onChange={(e) => setData({ ...data, spouseName: e.target.value })}
        placeholder="So we can personalise their invite"
      />

      <div className="mb-5">
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
        >
          Add a personal note (optional)
        </label>
        <textarea
          value={data.spouseMessage || ''}
          onChange={(e) => setData({ ...data, spouseMessage: e.target.value })}
          placeholder="Hey love, I found something I think could really help us grow together..."
          rows={3}
          className="w-full px-4 py-3.5 rounded-xl border text-base outline-none resize-y"
          style={{
            background: t.bgInput,
            borderColor: t.border,
            borderWidth: '1.5px',
            color: t.textPrimary,
            fontFamily: 'Source Sans 3, sans-serif',
            lineHeight: 1.6,
          }}
        />
      </div>

      <button
        onClick={() => {
          setData({ ...data, spouseEmail: '', spouseName: '', spouseMessage: '' });
          onSkip?.();
        }}
        className="w-full py-3 rounded-xl text-sm border border-dashed cursor-pointer mt-1"
        style={{
          fontFamily: 'Source Sans 3, sans-serif',
          color: t.textMuted,
          background: 'transparent',
          borderColor: t.border,
        }}
      >
        I&apos;d prefer to invite them later →
      </button>
    </StepWrapper>
  );
}
