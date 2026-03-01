'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';
import Link from 'next/link';

const PILLAR_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual' },
};

const CATEGORY_ICONS: Record<string, string> = {
  connection: '💛',
  memory: '📸',
  deep: '🌊',
  faith: '✝️',
  fun: '🎉',
  dream: '✨',
  gratitude: '🙏',
  conflict: '🕊️',
  intimacy: '🔥',
  growth: '🌱',
};

const REACTION_EMOJIS = ['❤️', '😊', '🤔', '🙏', '😢'];

interface DailyQuestion {
  id: string;
  day_number: number;
  question_text: string;
  category: string;
  pillar: string | null;
  follow_up: string | null;
}

interface QuestionResponse {
  id: string;
  couple_id: string;
  question_id: string;
  responder_id: string;
  response: string;
  created_at: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  couple_id: string | null;
  partner_id: string | null;
  streak_count: number;
}

interface PreviousDayEntry {
  question: DailyQuestion;
  myResponse: QuestionResponse | null;
  partnerResponse: QuestionResponse | null;
  date: string;
}

function getTodayDayNumber(): number {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
  const num = parseInt(dateStr, 10);
  return (num % 90) + 1;
}

function getTodayDateString(): string {
  return new Date().toISOString().split('T')[0];
}

export default function DailyTogetherPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Profile | null>(null);
  const [question, setQuestion] = useState<DailyQuestion | null>(null);
  const [myResponse, setMyResponse] = useState<QuestionResponse | null>(null);
  const [partnerResponse, setPartnerResponse] = useState<QuestionResponse | null>(null);
  const [previousDays, setPreviousDays] = useState<PreviousDayEntry[]>([]);
  const [showPrevious, setShowPrevious] = useState(false);

  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [nudgeSent, setNudgeSent] = useState(false);
  const [reactions, setReactions] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadData() {
    setError(null);
    try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Load profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, first_name, couple_id, partner_id, streak_count')
      .eq('id', user.id)
      .single();
    if (!prof) { setLoading(false); return; }
    setProfile(prof);

    // Load partner
    if (prof.partner_id) {
      const { data: part } = await supabase
        .from('profiles')
        .select('id, first_name, couple_id, partner_id, streak_count')
        .eq('id', prof.partner_id)
        .single();
      if (part) setPartner(part);
    }

    // Get today's question via deterministic rotation
    const dayNumber = getTodayDayNumber();
    const { data: q } = await supabase
      .from('daily_couple_questions')
      .select('id, day_number, question_text, category, pillar, follow_up')
      .eq('day_number', dayNumber)
      .single();
    if (q) setQuestion(q);

    // Check for existing responses today
    if (q && prof.couple_id) {
      const todayStr = getTodayDateString();

      const { data: responses } = await supabase
        .from('couple_question_responses')
        .select('id, couple_id, question_id, responder_id, response, created_at')
        .eq('couple_id', prof.couple_id)
        .eq('question_id', q.id)
        .gte('created_at', `${todayStr}T00:00:00`)
        .lt('created_at', `${todayStr}T23:59:59.999`);

      if (responses) {
        const mine = responses.find(r => r.responder_id === user.id);
        const theirs = responses.find(r => r.responder_id !== user.id);
        if (mine) setMyResponse(mine);
        if (theirs) setPartnerResponse(theirs);
      }

      // Load previous days (last 5 completed Q&As)
      await loadPreviousDays(prof.couple_id, user.id, q.id);
    }

    setLoading(false);
    } catch (err) {
      console.error('Failed to load daily question:', err);
      setError('Failed to load your daily question. Please check your connection.');
      setLoading(false);
    }
  }

  async function loadPreviousDays(coupleId: string, userId: string, todayQuestionId: string) {
    // Get recent responses for this couple, excluding today's question
    const { data: recentResponses } = await supabase
      .from('couple_question_responses')
      .select('id, couple_id, question_id, responder_id, response, created_at')
      .eq('couple_id', coupleId)
      .neq('question_id', todayQuestionId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (!recentResponses || recentResponses.length === 0) return;

    // Group by question_id
    const grouped = new Map<string, QuestionResponse[]>();
    for (const r of recentResponses) {
      const existing = grouped.get(r.question_id) || [];
      existing.push(r);
      grouped.set(r.question_id, existing);
    }

    // Get unique question IDs (up to 5)
    const questionIds = Array.from(grouped.keys()).slice(0, 5);
    if (questionIds.length === 0) return;

    // Fetch question details
    const { data: questions } = await supabase
      .from('daily_couple_questions')
      .select('id, day_number, question_text, category, pillar, follow_up')
      .in('id', questionIds);

    if (!questions) return;

    const questionMap = new Map(questions.map(q => [q.id, q]));

    const entries: PreviousDayEntry[] = [];
    for (const qId of questionIds) {
      const q = questionMap.get(qId);
      const resps = grouped.get(qId);
      if (!q || !resps) continue;

      const myResp = resps.find(r => r.responder_id === userId) || null;
      const partnerResp = resps.find(r => r.responder_id !== userId) || null;

      // Only show entries where both have answered
      if (myResp && partnerResp) {
        entries.push({
          question: q,
          myResponse: myResp,
          partnerResponse: partnerResp,
          date: new Date(myResp.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        });
      }
    }

    setPreviousDays(entries);
  }

  async function submitAnswer() {
    if (!answerText.trim() || !question || !profile?.couple_id || submitting) return;
    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setSubmitting(false); return; }

      const { data: inserted, error } = await supabase
        .from('couple_question_responses')
        .insert({
          couple_id: profile.couple_id,
          question_id: question.id,
          responder_id: user.id,
          response: answerText.trim(),
        })
        .select('id, couple_id, question_id, responder_id, response, created_at')
        .single();

      if (error) {
        console.error('Submit error:', error);
        alert('Something went wrong. Please try again.');
        setSubmitting(false);
        return;
      }

      if (inserted) {
        setMyResponse(inserted);
        setAnswerText('');

        // Check if partner already answered today
        const todayStr = getTodayDateString();
        const { data: partnerResp } = await supabase
          .from('couple_question_responses')
          .select('id, couple_id, question_id, responder_id, response, created_at')
          .eq('couple_id', profile.couple_id)
          .eq('question_id', question.id)
          .neq('responder_id', user.id)
          .gte('created_at', `${todayStr}T00:00:00`)
          .lt('created_at', `${todayStr}T23:59:59.999`)
          .maybeSingle();

        if (partnerResp) {
          setPartnerResponse(partnerResp);
        } else {
          // Partner hasn't answered yet — nudge them
          try {
            fetch('/api/nudge', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'together' }),
            });
          } catch { /* non-critical */ }
        }
      }
    } catch (e) {
      console.error('submitAnswer error:', e);
      alert('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNudge() {
    setNudgeSent(true);
    try {
      await fetch('/api/nudge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'together' }),
      });
    } catch (e) {
      console.error('Nudge failed:', e);
    }
    setTimeout(() => setNudgeSent(false), 3000);
  }

  function toggleReaction(emoji: string) {
    setReactions(prev => {
      const next = new Set(prev);
      if (next.has(emoji)) next.delete(emoji);
      else next.add(emoji);
      // Persist to localStorage so reactions survive page reloads
      if (question) {
        const key = `cleave-reactions-${getTodayDateString()}-${question.id}`;
        try { localStorage.setItem(key, JSON.stringify(Array.from(next))); } catch {}
      }
      return next;
    });
  }

  // Restore persisted reactions when question loads
  useEffect(() => {
    if (question) {
      const key = `cleave-reactions-${getTodayDateString()}-${question.id}`;
      try {
        const saved = localStorage.getItem(key);
        if (saved) setReactions(new Set(JSON.parse(saved)));
      } catch {}
    }
  }, [question?.id]);

  // ─── Loading state ───
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <div className="text-center">
          <ThreefoldLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading your daily question...
          </p>
        </div>
      </div>
    );
  }

  // ─── Error state ───
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium mb-2 m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            Connection Issue
          </h2>
          <p className="text-sm mb-6 m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => { setLoading(true); loadData(); }}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // ─── No couple (solo user) ───
  if (!profile?.partner_id) {
    return (
      <div className="min-h-screen" style={{ background: t.bgPrimary }}>
        <TopBar title="Daily Together" backHref="/dashboard" />
        <div className="max-w-lg mx-auto px-4 py-10">
          <div className="rounded-3xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <span className="text-5xl block mb-4">💑</span>
            <h2 className="text-2xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              Better Together
            </h2>
            <p className="text-sm m-0 mb-6" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
              Daily Together is a shared experience. Both you and your spouse answer
              the same question privately, then reveal your answers together.
            </p>
            <Link href="/couple">
              <span
                className="inline-block px-8 py-3 rounded-full text-sm font-semibold text-white no-underline cursor-pointer"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  boxShadow: '0 4px 16px rgba(184,134,11,0.2)',
                }}
              >
                Invite Your Spouse
              </span>
            </Link>
          </div>

          <div className="text-center py-8">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>
      </div>
    );
  }

  if (!question) return null;

  const pillar = question.pillar ? PILLAR_STYLES[question.pillar] : null;
  const categoryIcon = CATEGORY_ICONS[question.category] || '💬';
  const partnerName = partner?.first_name || 'your spouse';
  const bothAnswered = !!myResponse && !!partnerResponse;
  const iAnswered = !!myResponse;

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-lg mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(12px)',
          transition: 'all 0.6s ease',
        }}
      >
        <TopBar
          title="Daily Together"
          subtitle={`Day ${question.day_number} of 90`}
          backHref="/dashboard"
        />

        <div className="px-4 pb-10 pt-4">

          {/* ═══════════ STATE C: Both Answered — REVEAL ═══════════ */}
          {bothAnswered && (
            <>
              {/* Celebratory header */}
              <div className="text-center mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-4" style={{ background: t.goldBg }}>
                  <span className="text-lg">💛</span>
                  <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                    You&apos;ve both answered!
                  </span>
                </div>
              </div>

              {/* Question card */}
              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  borderLeft: pillar ? `4px solid ${pillar.text}` : `4px solid ${t.textLink}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{categoryIcon}</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: pillar ? pillar.bg : t.goldBg,
                      color: pillar ? pillar.text : t.textLink,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    {question.category}
                  </span>
                  {pillar && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: pillar.bg, color: pillar.text, fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      {pillar.label}
                    </span>
                  )}
                </div>
                <p className="text-lg m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.6 }}>
                  {question.question_text}
                </p>
              </div>

              {/* My answer */}
              <div
                className="rounded-2xl p-5 mb-3"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  borderLeft: `4px solid ${t.textLink}`,
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {profile?.first_name || 'You'}
                </div>
                <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                  {myResponse.response}
                </p>
              </div>

              {/* Partner's answer */}
              <div
                className="rounded-2xl p-5 mb-5"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  borderLeft: `4px solid ${t.green}`,
                }}
              >
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.green, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {partnerName}
                </div>
                <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                  {partnerResponse.response}
                </p>
              </div>

              {/* Follow-up / Discuss Together card */}
              {question.follow_up && (
                <div className="rounded-2xl p-5 mb-5" style={{ background: t.pillarSafetyBg, border: `1.5px solid ${t.pillarSafetyText}20` }}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-lg">💬</span>
                    <h3 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.pillarSafetyText, fontFamily: 'Source Sans 3, sans-serif' }}>
                      Discuss Together
                    </h3>
                  </div>
                  <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                    {question.follow_up}
                  </p>
                </div>
              )}

              {/* Emoji reactions */}
              <div className="flex items-center justify-center gap-3 mb-6">
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => toggleReaction(emoji)}
                    className="w-11 h-11 rounded-full flex items-center justify-center text-lg cursor-pointer border-none transition-all"
                    style={{
                      background: reactions.has(emoji) ? t.goldBg : t.bgCard,
                      boxShadow: reactions.has(emoji) ? '0 2px 8px rgba(184,134,11,0.2)' : t.shadowCard,
                      transform: reactions.has(emoji) ? 'scale(1.15)' : 'scale(1)',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}

          {/* ═══════════ STATE B: Answered, Waiting ═══════════ */}
          {iAnswered && !bothAnswered && (
            <>
              {/* Answered badge */}
              <div className="flex items-center justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full" style={{ background: t.greenBg, border: `1.5px solid ${t.green}30` }}>
                  <span className="text-sm font-semibold" style={{ color: t.green, fontFamily: 'Source Sans 3, sans-serif' }}>
                    You&apos;ve answered ✓
                  </span>
                </div>
              </div>

              {/* Question card */}
              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  borderLeft: pillar ? `4px solid ${pillar.text}` : `4px solid ${t.textLink}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{categoryIcon}</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: pillar ? pillar.bg : t.goldBg,
                      color: pillar ? pillar.text : t.textLink,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    {question.category}
                  </span>
                </div>
                <p className="text-lg m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.6 }}>
                  {question.question_text}
                </p>
              </div>

              {/* My answer (muted) */}
              <div className="rounded-2xl p-5 mb-5" style={{ background: t.bgCard, boxShadow: t.shadowCard, opacity: 0.85 }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Your Answer
                </div>
                <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                  {myResponse.response}
                </p>
              </div>

              {/* Waiting indicator */}
              <div className="rounded-2xl p-5 mb-5 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex items-center justify-center gap-2 mb-3">
                  {/* Pulsing dot */}
                  <span
                    className="inline-block w-2.5 h-2.5 rounded-full"
                    style={{
                      background: t.textLink,
                      animation: 'pulse-dot 1.5s ease-in-out infinite',
                    }}
                  />
                  <span className="text-sm font-semibold" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Waiting for {partnerName}...
                  </span>
                </div>
                <p className="text-xs m-0 mb-4" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Their answer will appear here once they submit
                </p>
                <button
                  onClick={handleNudge}
                  disabled={nudgeSent}
                  className="px-6 py-2.5 rounded-full text-sm font-semibold border-none cursor-pointer transition-all"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: nudgeSent ? t.greenBg : t.goldBg,
                    color: nudgeSent ? t.green : t.textLink,
                  }}
                >
                  {nudgeSent ? 'Nudge sent!' : `Nudge ${partnerName} 💬`}
                </button>
              </div>
            </>
          )}

          {/* ═══════════ STATE A: Not Yet Answered ═══════════ */}
          {!iAnswered && (
            <>
              {/* Question card */}
              <div
                className="rounded-2xl p-6 mb-5"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  borderLeft: pillar ? `4px solid ${pillar.text}` : `4px solid ${t.textLink}`,
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">{categoryIcon}</span>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full capitalize"
                    style={{
                      background: pillar ? pillar.bg : t.goldBg,
                      color: pillar ? pillar.text : t.textLink,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    {question.category}
                  </span>
                  {pillar && (
                    <span
                      className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: pillar.bg, color: pillar.text, fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      {pillar.label}
                    </span>
                  )}
                </div>
                <p className="text-xl m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.6 }}>
                  {question.question_text}
                </p>
                {question.follow_up && (
                  <p className="text-xs m-0 mt-3 italic" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.5 }}>
                    Hint: {question.follow_up}
                  </p>
                )}
              </div>

              {/* Answer textarea */}
              <div className="rounded-2xl p-5 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <textarea
                  value={answerText}
                  onChange={e => setAnswerText(e.target.value)}
                  placeholder="Share your heart..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
                  style={{
                    background: t.bgInput,
                    border: `1.5px solid ${t.border}`,
                    color: t.textPrimary,
                    fontFamily: 'Source Sans 3, sans-serif',
                    lineHeight: 1.7,
                  }}
                />
                <div className="flex items-center gap-2 mt-3 px-1">
                  <span className="text-sm">🔒</span>
                  <p className="text-xs m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Your answer is private until {partnerName} answers too
                  </p>
                </div>
              </div>

              {/* Submit button */}
              <button
                onClick={submitAnswer}
                disabled={!answerText.trim() || submitting}
                className="w-full py-4 rounded-2xl text-base font-semibold text-white border-none cursor-pointer transition-all active:scale-[0.98]"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: answerText.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border,
                  boxShadow: answerText.trim() ? '0 4px 20px rgba(184,134,11,0.25)' : 'none',
                  color: answerText.trim() ? '#FFF' : t.textMuted,
                }}
              >
                {submitting ? 'Submitting...' : 'Submit My Answer'}
              </button>
            </>
          )}

          {/* ═══════════ Previous Days (collapsible) ═══════════ */}
          {previousDays.length > 0 && (
            <div className="mt-8">
              <button
                onClick={() => setShowPrevious(!showPrevious)}
                className="w-full flex items-center justify-between px-5 py-4 rounded-2xl cursor-pointer border-none transition-all"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <span className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Previous Days
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.goldBg, color: t.textLink, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
                    {previousDays.length}
                  </span>
                </div>
                <span
                  className="text-sm transition-transform"
                  style={{
                    color: t.textMuted,
                    transform: showPrevious ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease',
                  }}
                >
                  ▾
                </span>
              </button>

              {showPrevious && (
                <div className="mt-3 space-y-3">
                  {previousDays.map((entry, idx) => {
                    const entryPillar = entry.question.pillar ? PILLAR_STYLES[entry.question.pillar] : null;
                    const entryCatIcon = CATEGORY_ICONS[entry.question.category] || '💬';
                    return (
                      <div key={idx} className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                        {/* Date + category */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                            {entry.date}
                          </span>
                          <span className="text-xs">{entryCatIcon}</span>
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize"
                            style={{
                              background: entryPillar ? entryPillar.bg : t.goldBg,
                              color: entryPillar ? entryPillar.text : t.textLink,
                              fontFamily: 'Source Sans 3, sans-serif',
                            }}
                          >
                            {entry.question.category}
                          </span>
                        </div>

                        {/* Question */}
                        <p className="text-sm font-medium m-0 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.5 }}>
                          {entry.question.question_text}
                        </p>

                        {/* Both responses side by side on larger, stacked on mobile */}
                        <div className="space-y-2">
                          <div className="rounded-xl p-3" style={{ background: t.bgCardHover, borderLeft: `3px solid ${t.textLink}` }}>
                            <div className="text-xs font-semibold mb-1" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                              {profile?.first_name || 'You'}
                            </div>
                            <p className="text-xs m-0" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
                              {entry.myResponse?.response}
                            </p>
                          </div>
                          <div className="rounded-xl p-3" style={{ background: t.bgCardHover, borderLeft: `3px solid ${t.green}` }}>
                            <div className="text-xs font-semibold mb-1" style={{ color: t.green, fontFamily: 'Source Sans 3, sans-serif' }}>
                              {partnerName}
                            </div>
                            <p className="text-xs m-0" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
                              {entry.partnerResponse?.response}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>
      </div>

      {/* CSS-only pulsing dot animation */}
      <style jsx>{`
        @keyframes pulse-dot {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.4;
            transform: scale(0.75);
          }
        }
      `}</style>
    </div>
  );
}
