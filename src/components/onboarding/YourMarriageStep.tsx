'use client';

import type { OnboardingData } from '@/app/onboarding/page';
import { StepWrapper } from '@/components/ui/StepWrapper';
import { Input } from '@/components/ui/Input';
import { RadioCards } from '@/components/ui/RadioCards';

interface Props {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}

export function YourMarriageStep({ data, setData }: Props) {
  return (
    <StepWrapper title="About your marriage" subtitle="This helps us personalise your journey together.">
      <Input
        label="Wedding Date (approximate is fine)"
        type="date"
        value={data.weddingDate || ''}
        onChange={(e) => setData({ ...data, weddingDate: e.target.value })}
      />

      <div className="mb-5">
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: '#7A7062', fontFamily: 'Source Sans 3, sans-serif' }}
        >
          How would you describe things right now?
        </label>
        <RadioCards
          options={[
            { value: 'thriving', label: 'Thriving', icon: '🌿' },
            { value: 'steady', label: 'Steady', icon: '⚓' },
            { value: 'strained', label: 'Strained', icon: '🌧️' },
            { value: 'crisis', label: 'In crisis', icon: '🆘' },
          ]}
          value={data.marriageState}
          onChange={(v) => setData({ ...data, marriageState: v as OnboardingData['marriageState'] })}
        />
      </div>

      <div className="mb-5">
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: '#7A7062', fontFamily: 'Source Sans 3, sans-serif' }}
        >
          Are you part of a church?
        </label>
        <RadioCards
          options={[
            { value: 'yes', label: 'Yes, actively' },
            { value: 'sometimes', label: 'Sometimes' },
            { value: 'no', label: 'Not currently' },
            { value: 'exploring', label: 'Exploring faith' },
          ]}
          value={data.churchStatus}
          onChange={(v) => setData({ ...data, churchStatus: v as OnboardingData['churchStatus'] })}
        />
      </div>
    </StepWrapper>
  );
}
