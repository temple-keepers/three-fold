'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { AssessmentIntro } from '@/components/assessment/AssessmentIntro';
import { PillarSection } from '@/components/assessment/PillarSection';
import { AssessmentResults } from '@/components/assessment/AssessmentResults';

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

const PILLAR_META: Record<string, { label: string; icon: string; description: string }> = {
  covenant: {
    label: 'Covenant Commitment',
    icon: '🤝',
    description: 'How deeply you hold and honour the sacred promise you made to each other.',
  },
  emotional_safety: {
    label: 'Emotional Safety',
    icon: '🛡️',
    description: 'How safe, seen, and supported you feel in your most vulnerable moments.',
  },
  communication: {
    label: 'Communication Mastery',
    icon: '💬',
    description: 'How well you listen, express, and resolve conflict together.',
  },
  spiritual: {
    label: 'Spiritual Alignment',
    icon: '✝️',
    description: 'How connected you are in faith, prayer, and spiritual direction as a couple.',
  },
};

const PILLAR_ORDER = ['covenant', 'emotional_safety', 'communication', 'spiritual'];

type Phase = 'intro' | 'questions' | 'results';

export default function AssessmentPage() {
  const [phase, setPhase] = useState<Phase>('intro');
  const [pillarGroups, setPillarGroups] = useState<PillarGroup[]>([]);
  const [currentPillar, setCurrentPillar] = useState(0);
  const [responses, setResponses] = useState<Record<string, number>>({});
  const [assessmentId, setAssessmentId] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  // Load questions
  useEffect(() => {
    async function loadQuestions() {
      try {
        const { data: questions } = await supabase
          .from('assessment_questions')
          .select('*')
          .eq('is_active', true)
          .order('question_order');

        if (questions) {
          const groups: PillarGroup[] = PILLAR_ORDER.map((pillar) => ({
            pillar,
            ...PILLAR_META[pillar],
            questions: questions.filter((q) => q.pillar === pillar),
          }));
          setPillarGroups(groups);
        }
      } catch (err) {
        console.error('[Assessment] Failed to load questions:', err);
      } finally {
        setLoading(false);
      }
    }
    loadQuestions();
  }, []);

  const startAssessment = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get couple_id
    const { data: profile } = await supabase
      .from('profiles')
      .select('couple_id')
      .eq('id', user.id)
      .single();

    const { data: assessment } = await supabase
      .from('assessments')
      .insert({
        profile_id: user.id,
        couple_id: profile?.couple_id || null,
        assessment_type: 'initial',
      })
      .select()
      .single();

    if (assessment) {
      setAssessmentId(assessment.id);
      setPhase('questions');
    }
  };

  const handleResponse = (questionId: string, score: number) => {
    setResponses((prev) => ({ ...prev, [questionId]: score }));
  };

  const currentGroup = pillarGroups[currentPillar];
  const allCurrentAnswered = currentGroup?.questions.every((q) => responses[q.id] !== undefined) || false;
  const totalQuestions = pillarGroups.reduce((sum, g) => sum + g.questions.length, 0);
  const answeredCount = Object.keys(responses).length;

  const nextPillar = async () => {
    if (currentPillar < pillarGroups.length - 1) {
      setCurrentPillar(currentPillar + 1);
    } else {
      // All pillars done — submit
      await submitAssessment();
    }
  };

  const prevPillar = () => {
    if (currentPillar > 0) setCurrentPillar(currentPillar - 1);
  };

  const submitAssessment = async () => {
    if (!assessmentId) return;
    setSubmitting(true);

    try {
      // Save all responses
      const responseRows = Object.entries(responses).map(([questionId, score]) => ({
        assessment_id: assessmentId,
        question_id: questionId,
        score,
      }));

      await supabase.from('assessment_responses').insert(responseRows);

      // Call the scoring function
      const { data, error } = await supabase.rpc('complete_assessment', {
        p_assessment_id: assessmentId,
      });

      if (error) throw error;

      setResults(data);
      setPhase('results');
    } catch (err) {
      console.error('Assessment submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-primary)' }}>
        <div className="text-center">
          <CleaveLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif' }}>
            Preparing your assessment...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-start px-4 py-6" style={{ background: 'var(--bg-primary)' }}>
      <div className="w-full max-w-[520px]">
        {/* Header */}
        {phase === 'questions' && (
          <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <CleaveLogo size={24} />
                <span className="text-sm" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-muted)' }}>
                  Covenant Assessment
                </span>
              </div>
              <span className="text-xs" style={{ color: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif' }}>
                {answeredCount} of {totalQuestions}
              </span>
            </div>

            {/* Overall progress bar */}
            <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--border)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${(answeredCount / totalQuestions) * 100}%`,
                  background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                }}
              />
            </div>

            {/* Pillar tabs */}
            <div className="flex gap-2 mt-4">
              {pillarGroups.map((group, i) => {
                const pillarAnswered = group.questions.filter((q) => responses[q.id] !== undefined).length;
                const pillarComplete = pillarAnswered === group.questions.length;
                const isCurrent = i === currentPillar;

                return (
                  <button
                    key={group.pillar}
                    onClick={() => setCurrentPillar(i)}
                    className="flex-1 py-2.5 rounded-xl text-center transition-all"
                    style={{
                      background: isCurrent ? 'var(--pillar-covenant-bg)' : pillarComplete ? 'var(--green-bg)' : 'var(--bg-input)',
                      border: `1.5px solid ${isCurrent ? '#B8860B' : pillarComplete ? 'var(--green)' : 'var(--border)'}`,
                      cursor: 'pointer',
                    }}
                  >
                    <span className="text-lg">{group.icon}</span>
                    <div
                      className="text-xs mt-0.5"
                      style={{
                        fontFamily: 'Source Sans 3, sans-serif',
                        fontWeight: isCurrent ? 700 : 500,
                        color: isCurrent ? 'var(--text-primary)' : 'var(--text-muted)',
                      }}
                    >
                      {pillarAnswered}/{group.questions.length}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="rounded-3xl shadow-card overflow-hidden" style={{ background: 'var(--bg-card)' }}>
          {phase === 'intro' && <AssessmentIntro onStart={startAssessment} />}

          {phase === 'questions' && currentGroup && (
            <PillarSection
              group={currentGroup}
              responses={responses}
              onResponse={handleResponse}
              onNext={nextPillar}
              onPrev={prevPillar}
              isFirst={currentPillar === 0}
              isLast={currentPillar === pillarGroups.length - 1}
              allAnswered={allCurrentAnswered}
              submitting={submitting}
            />
          )}

          {phase === 'results' && results && (
            <AssessmentResults
              results={results}
              onContinue={() => router.push('/dashboard')}
            />
          )}
        </div>
      </div>
    </div>
  );
}
