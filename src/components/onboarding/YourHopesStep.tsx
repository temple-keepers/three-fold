'use client';

import type { OnboardingData } from '@/app/onboarding/page';
import { StepWrapper } from '@/components/ui/StepWrapper';

interface Props {
  data: OnboardingData;
  setData: (data: OnboardingData) => void;
}

const HOPES = [
  { value: 'communication', label: 'Better communication', icon: '💬' },
  { value: 'connection', label: 'Deeper connection', icon: '💛' },
  { value: 'trust', label: 'Rebuild trust', icon: '🤝' },
  { value: 'conflict', label: 'Handle conflict well', icon: '🕊️' },
  { value: 'spiritual', label: 'Grow spiritually together', icon: '✝️' },
  { value: 'intimacy', label: 'Restore intimacy', icon: '🔥' },
  { value: 'fun', label: 'Have more fun together', icon: '😊' },
  { value: 'alignment', label: 'Get on the same page', icon: '📖' },
];

export function YourHopesStep({ data, setData }: Props) {
  const toggleHope = (val: string) => {
    const current = data.hopes || [];
    if (current.includes(val)) {
      setData({ ...data, hopes: current.filter((h) => h !== val) });
    } else {
      setData({ ...data, hopes: [...current, val] });
    }
  };

  return (
    <StepWrapper title="What are you hoping for?" subtitle="Choose as many as resonate. There are no wrong answers.">
      <div className="grid grid-cols-2 gap-2.5">
        {HOPES.map((h) => {
          const selected = (data.hopes || []).includes(h.value);
          return (
            <button
              key={h.value}
              onClick={() => toggleHope(h.value)}
              className="py-3.5 px-3 text-left flex items-center gap-2.5 rounded-xl border cursor-pointer transition-all"
              style={{
                background: selected ? '#F5ECD7' : '#FFFDF8',
                borderColor: selected ? '#B8860B' : '#E8E2D8',
                borderWidth: '1.5px',
                transform: selected ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <span className="text-xl">{h.icon}</span>
              <span
                className="text-sm"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  fontWeight: selected ? 700 : 500,
                  color: selected ? '#2C2418' : '#7A7062',
                }}
              >
                {h.label}
              </span>
            </button>
          );
        })}
      </div>
    </StepWrapper>
  );
}
