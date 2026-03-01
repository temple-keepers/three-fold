'use client';

import { t } from '@/lib/tokens';
import { PILLAR_STYLES, DIFF_COLORS } from './constants';

interface ExercisesTabProps {
  exercises: any[];
  selectedExercise: any;
  setSelectedExercise: (ex: any) => void;
  exerciseStep: number;
  setExerciseStep: (step: number) => void;
  completeExercise: (exerciseId: string) => void;
}

export function ExercisesTab({
  exercises,
  selectedExercise,
  setSelectedExercise,
  exerciseStep,
  setExerciseStep,
  completeExercise,
}: ExercisesTabProps) {
  if (!selectedExercise) {
    return (
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
    );
  }

  // Exercise detail view
  return (
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
  );
}
