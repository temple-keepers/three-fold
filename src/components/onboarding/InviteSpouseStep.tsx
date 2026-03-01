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
    <StepWrapper title="Invite your spouse" subtitle="Cleave is designed for two. Invite them now and unlock the full couple experience.">
      {/* Why together — compelling visual */}
      <div
        className="rounded-xl p-5 mb-5"
        style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}
      >
        <div className="flex gap-3 mb-3">
          {[
            { icon: '🔒', label: 'Private answers' },
            { icon: '🤝', label: 'Shared dashboard' },
            { icon: '💬', label: 'Daily questions' },
          ].map(item => (
            <div key={item.label} className="flex-1 text-center">
              <div className="text-lg mb-0.5">{item.icon}</div>
              <div className="text-[10px] font-medium" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                {item.label}
              </div>
            </div>
          ))}
        </div>
        <p
          className="text-xs m-0 text-center"
          style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.5 }}
        >
          Each of you reflects privately, then Cleave brings your insights together. Individual answers stay private until you both respond.
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

      {/* What they receive */}
      <div
        className="rounded-xl p-4 mb-4"
        style={{ background: t.bgAccent, border: `1px solid ${t.border}50` }}
      >
        <p className="text-xs m-0 font-semibold mb-1" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          What they&apos;ll receive:
        </p>
        <p className="text-xs m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.5 }}>
          A warm, personal email from you with a link to create their free account. They&apos;ll be connected to your couple dashboard instantly.
        </p>
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
