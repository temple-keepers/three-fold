'use client';

import type { OnboardingData } from '@/app/onboarding/page';
import { StepWrapper } from '@/components/ui/StepWrapper';
import { Input } from '@/components/ui/Input';
import { RadioCards } from '@/components/ui/RadioCards';

interface Props {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}

export function AboutYouStep({ data, setData }: Props) {
  return (
    <StepWrapper title="Tell us about you" subtitle="Just the basics — nothing invasive, we promise.">
      <Input
        label="First Name"
        value={data.firstName || ''}
        onChange={(e) => setData({ ...data, firstName: e.target.value })}
        placeholder="Your first name"
      />
      <Input
        label="Last Name"
        value={data.lastName || ''}
        onChange={(e) => setData({ ...data, lastName: e.target.value })}
        placeholder="Your last name"
      />
      <div className="mb-5">
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-2.5"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Source Sans 3, sans-serif' }}
        >
          I am
        </label>
        <RadioCards
          options={[
            { value: 'male', label: 'Husband', icon: '👤' },
            { value: 'female', label: 'Wife', icon: '👤' },
          ]}
          value={data.gender}
          onChange={(v) => setData({ ...data, gender: v as 'male' | 'female' })}
        />
      </div>
    </StepWrapper>
  );
}
