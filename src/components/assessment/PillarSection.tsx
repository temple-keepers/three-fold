'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tokens';

interface Question {
  id: string;
  pillar: string;
  question_text: string;
  question_order: number;
}

interface PillarGroup {
  pillar: string;
  label: string;
  icon: string;
  description: string;
  questions: Question[];
}

interface Props {
  group: PillarGroup;
  responses: Record<string, number>;
  onResponse: (questionId: string, score: number) => void;
  onNext: () => void;
  onPrev: () => void;
  isFirst: boolean;
  isLast: boolean;
  allAnswered: boolean;
  submitting: boolean;
}

const SCORE_LABELS = [
  { value: 1, label: 'Rarely' },
  { value: 2, label: 'Sometimes' },
  { value: 3, label: 'Often' },
  { value: 4, label: 'Usually' },
  { value: 5, label: 'Always' },
];

export function PillarSection({
  group,
  responses,
  onResponse,
  onNext,
  onPrev,
  isFirst,
  isLast,
  allAnswered,
  submitting,
}: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(false);
    const tm = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(tm);
  }, [group.pillar]);

  return (
    <div
      className="p-7 transition-all duration-500"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(12px)',
      }}
    >
      {/* Pillar header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">{group.icon}</span>
          <h2
            className="text-2xl font-medium m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
          >
            {group.label}
          </h2>
        </div>
        <p
          className="text-sm m-0"
          style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.5 }}
        >
          {group.description}
        </p>
      </div>

      <div className="w-full h-px mb-6" style={{ background: t.border }} />

      {/* Questions */}
      {group.questions.map((q, qi) => {
        const selectedScore = responses[q.id];

        return (
          <div key={q.id} className="mb-7">
            <p
              className="text-base mb-4 m-0"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                color: t.textPrimary,
                lineHeight: 1.6,
                fontWeight: 500,
              }}
            >
              <span style={{ color: t.textLink, fontWeight: 700, marginRight: 8 }}>
                {qi + 1}.
              </span>
              {q.question_text}
            </p>

            {/* Score buttons */}
            <div className="flex gap-2">
              {SCORE_LABELS.map((s) => {
                const isSelected = selectedScore === s.value;
                return (
                  <button
                    key={s.value}
                    onClick={() => onResponse(q.id, s.value)}
                    className="flex-1 py-3 rounded-xl text-center cursor-pointer transition-all"
                    style={{
                      background: isSelected ? t.goldBg : t.bgCardHover,
                      border: `1.5px solid ${isSelected ? t.textLink : t.border}`,
                      transform: isSelected ? 'scale(1.03)' : 'scale(1)',
                    }}
                  >
                    <div
                      className="text-lg font-semibold"
                      style={{
                        fontFamily: 'Source Sans 3, sans-serif',
                        color: isSelected ? t.textLink : t.textSecondary,
                      }}
                    >
                      {s.value}
                    </div>
                    <div
                      className="text-xs mt-0.5"
                      style={{
                        fontFamily: 'Source Sans 3, sans-serif',
                        color: isSelected ? t.textLink : t.textMuted,
                        fontWeight: isSelected ? 600 : 400,
                      }}
                    >
                      {s.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Navigation */}
      <div className="flex gap-3 mt-8">
        {!isFirst && (
          <button
            onClick={onPrev}
            className="flex-1 py-4 rounded-xl text-base font-semibold cursor-pointer transition-all"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'transparent',
              border: `1.5px solid ${t.border}`,
              color: t.textSecondary,
            }}
          >
            ← Previous
          </button>
        )}

        <button
          onClick={onNext}
          disabled={!allAnswered || submitting}
          className="flex-1 py-4 rounded-xl text-base font-semibold text-white transition-all"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            background: allAnswered
              ? 'linear-gradient(135deg, #B8860B, #8B6914)'
              : t.border,
            color: allAnswered ? '#FFF' : t.textMuted,
            cursor: allAnswered && !submitting ? 'pointer' : 'not-allowed',
            boxShadow: allAnswered ? '0 4px 16px rgba(184, 134, 11, 0.2)' : 'none',
            border: 'none',
          }}
        >
          {submitting
            ? 'Calculating...'
            : isLast
            ? 'Complete Assessment'
            : 'Next Pillar →'}
        </button>
      </div>
    </div>
  );
}
