'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { PremiumBadge } from '@/components/ui/PremiumGate';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { useSubscription } from '@/lib/useSubscription';
import { t } from '@/lib/tokens';

/* ─── Pillar theming ─── */
const PILLAR_MAP: Record<string, { bg: string; text: string; label: string }> = {
  covenant:         { bg: t.pillarCovenantBg, text: t.pillarCovenantText, label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg,   text: t.pillarSafetyText,   label: 'Safety' },
  communication:    { bg: t.pillarCommBg,      text: t.pillarCommText,      label: 'Communication' },
  spiritual:        { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, label: 'Spiritual' },
};

const DIFF_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  easy:   { bg: t.greenBg,        text: t.green,             label: 'Easy' },
  medium: { bg: t.goldBg,         text: t.textLink,          label: 'Medium' },
  deep:   { bg: t.pillarSafetyBg, text: t.pillarSafetyText,  label: 'Deep' },
};

/* ─── Types ─── */
interface CardItem {
  q: string;
  set?: number;
  a?: string;
  b?: string;
}

interface Game {
  id: string;
  title: string;
  description: string;
  game_type: string;
  pillar: string | null;
  instructions: string;
  duration_minutes: number;
  difficulty: string | null;
  cards: CardItem[] | null;
  icon: string;
  is_active: boolean;
  best_for: string | null;
  tier_recommended: string[] | null;
  created_at: string;
}

type View = 'list' | 'playing';

/* ─── Helpers ─── */
function shuffleArray<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

/* ═══════════════════════════════════════════════════
   Main Page Component
   ═══════════════════════════════════════════════════ */
export default function GamesPage() {
  const [games, setGames] = useState<Game[]>([]);
  const [view, setView] = useState<View>('list');
  const [activeGame, setActiveGame] = useState<Game | null>(null);
  const [cards, setCards] = useState<CardItem[]>([]);
  const [cardIndex, setCardIndex] = useState(0);
  const [slideDir, setSlideDir] = useState<'left' | 'right' | null>(null);
  const [animating, setAnimating] = useState(false);

  // Timer (for instruction-based games)
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Session tracking
  const [sessionStartedAt, setSessionStartedAt] = useState<string | null>(null);
  const [completed, setCompleted] = useState(false);
  const [enjoyed, setEnjoyed] = useState<boolean | null>(null);
  const [saving, setSaving] = useState(false);

  // Auth & UI
  const [coupleId, setCoupleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();
  const { isPremium } = useSubscription();
  const FREE_GAME_LIMIT = 2;

  /* ─── Load data ─── */
  useEffect(() => { loadGames(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadGames() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/auth'); return; }

      // Get couple_id
      const { data: profile } = await supabase
        .from('profiles')
        .select('couple_id')
        .eq('id', user.id)
        .single();
      if (profile?.couple_id) setCoupleId(profile.couple_id);

      // Fetch active games
      const { data } = await supabase
        .from('marriage_games')
        .select('*')
        .eq('is_active', true)
        .order('created_at');
      if (data) setGames(data);
    } catch (err) {
      console.error('[Games] Failed to load:', err);
    } finally {
      setLoading(false);
    }
  }

  /* ─── Timer logic ─── */
  useEffect(() => {
    if (timerRunning && timerSeconds > 0) {
      timerRef.current = setInterval(() => {
        setTimerSeconds(prev => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setTimerRunning(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [timerRunning]);

  /* ─── Start a game ─── */
  function startGame(game: Game) {
    setActiveGame(game);
    setView('playing');
    setCompleted(false);
    setEnjoyed(null);
    setCardIndex(0);
    setSlideDir(null);
    setAnimating(false);
    setSessionStartedAt(new Date().toISOString());

    if (game.cards && game.cards.length > 0) {
      setCards([...game.cards]);
    } else {
      setCards([]);
      setTimerSeconds(game.duration_minutes * 60);
      setTimerRunning(false);
    }
  }

  /* ─── Card navigation with slide animation ─── */
  const goToCard = useCallback((direction: 'next' | 'prev') => {
    if (animating || !activeGame?.cards) return;
    const maxIdx = cards.length - 1;
    if (direction === 'next' && cardIndex >= maxIdx) return;
    if (direction === 'prev' && cardIndex <= 0) return;

    setAnimating(true);
    setSlideDir(direction === 'next' ? 'left' : 'right');

    setTimeout(() => {
      setCardIndex(prev => direction === 'next' ? prev + 1 : prev - 1);
      setSlideDir(null);
      setAnimating(false);
    }, 280);
  }, [animating, cardIndex, cards.length, activeGame]);

  /* ─── Shuffle cards ─── */
  function handleShuffle() {
    if (!activeGame?.cards) return;
    setAnimating(true);
    setSlideDir('left');
    setTimeout(() => {
      const shuffled = shuffleArray(cards);
      setCards(shuffled);
      setCardIndex(0);
      setSlideDir(null);
      setAnimating(false);
    }, 280);
  }

  /* ─── Complete game ─── */
  async function handleComplete() {
    if (!activeGame || saving) return;
    setSaving(true);
    setCompleted(true);

    try {
      if (coupleId) {
        await supabase.from('game_sessions').insert({
          couple_id: coupleId,
          game_id: activeGame.id,
          started_at: sessionStartedAt,
          completed_at: new Date().toISOString(),
          enjoyed: enjoyed,
        });
      }
    } catch (e) {
      console.error('Error saving game session:', e);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Update enjoyment rating ─── */
  async function setEnjoyedRating(val: boolean) {
    setEnjoyed(val);
    if (!coupleId || !activeGame) return;

    try {
      const { data: sessions } = await supabase
        .from('game_sessions')
        .select('id')
        .eq('couple_id', coupleId)
        .eq('game_id', activeGame.id)
        .order('created_at', { ascending: false })
        .limit(1);
      if (sessions?.[0]) {
        await supabase.from('game_sessions').update({ enjoyed: val }).eq('id', sessions[0].id);
      }
    } catch (e) {
      console.error('Error updating enjoyment:', e);
    }
  }

  /* ─── Exit to list ─── */
  function exitGame() {
    if (timerRef.current) clearInterval(timerRef.current);
    setView('list');
    setActiveGame(null);
    setCards([]);
    setCardIndex(0);
    setCompleted(false);
    setEnjoyed(null);
    setTimerRunning(false);
    setTimerSeconds(0);
    setSessionStartedAt(null);
  }

  /* ═══════════ Loading state ═══════════ */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <div className="text-center">
          <CleaveLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading games...
          </p>
        </div>
      </div>
    );
  }

  /* ═══════════ VIEW 1: Game Selection List ═══════════ */
  if (view === 'list') {
    return (
      <div className="min-h-screen" style={{ background: t.bgPrimary }}>
        <div
          className="max-w-lg mx-auto"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
        >
          <TopBar
            title="Marriage Games"
            subtitle="Fun prompts for you and your spouse"
            backHref="/dashboard"
          />

          <div className="px-4 pb-10 pt-4">
            {games.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-4xl block mb-3">🎲</span>
                <h2 className="text-xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  No games available yet
                </h2>
                <p className="text-sm m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
                  Games are being prepared for you. Check back soon!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {games.map((game, gameIdx) => {
                  const diff = DIFF_COLORS[game.difficulty || 'easy'] || DIFF_COLORS.easy;
                  const pillar = game.pillar ? PILLAR_MAP[game.pillar] : null;
                  const cardCount = game.cards?.length || 0;
                  const isLocked = !isPremium && gameIdx >= FREE_GAME_LIMIT;

                  return (
                    <button
                      key={game.id}
                      onClick={() => isLocked ? undefined : startGame(game)}
                      className="w-full rounded-2xl p-5 text-left cursor-pointer border-none transition-all hover:-translate-y-0.5 active:scale-[0.99]"
                      style={{ background: t.bgCard, boxShadow: t.shadowCard, opacity: isLocked ? 0.6 : 1 }}
                    >
                      <div className="flex items-start gap-4">
                        {/* Icon */}
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl"
                          style={{ background: pillar?.bg || t.goldBg }}
                        >
                          {game.icon}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <div className="text-[15px] font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                              {game.title}
                            </div>
                            {isLocked && <PremiumBadge />}
                          </div>
                          <p
                            className="text-xs m-0 mb-2.5 overflow-hidden"
                            style={{
                              color: t.textMuted,
                              fontFamily: 'Source Sans 3, sans-serif',
                              lineHeight: 1.5,
                              display: '-webkit-box',
                              WebkitLineClamp: 1,
                              WebkitBoxOrient: 'vertical' as const,
                            }}
                          >
                            {game.description}
                          </p>

                          {/* Tags row */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Difficulty badge */}
                            <span
                              className="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full"
                              style={{ background: diff.bg, color: diff.text }}
                            >
                              {diff.label}
                            </span>

                            {/* Game type */}
                            <span
                              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                              style={{ background: t.bgAccent, color: t.textSecondary }}
                            >
                              {game.game_type.replace(/_/g, ' ')}
                            </span>

                            {/* Duration */}
                            <span className="text-[10px]" style={{ color: t.textMuted }}>
                              ~{game.duration_minutes} min
                            </span>

                            {/* Card count */}
                            {cardCount > 0 && (
                              <span className="text-[10px]" style={{ color: t.textMuted }}>
                                {cardCount} cards
                              </span>
                            )}
                          </div>

                          {/* Best for */}
                          {game.best_for && (
                            <div className="mt-2 flex items-center gap-1.5">
                              <span className="text-xs">💡</span>
                              <span className="text-[11px] italic" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                                {game.best_for}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Arrow */}
                        <div
                          className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center mt-1"
                          style={{ background: t.goldBg }}
                        >
                          <span className="text-sm" style={{ color: t.textLink }}>&#8594;</span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Upgrade prompt for free users */}
            {!isPremium && games.length > FREE_GAME_LIMIT && (
              <div className="mt-6">
                <UpgradePrompt feature="All Marriage Games" compact />
              </div>
            )}

            {/* Footer */}
            <div className="text-center py-8">
              <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
                &ldquo;Therefore a man shall leave his father and mother and hold fast to his wife.&rdquo;
              </p>
              <p className="text-[10px] m-0 mt-1" style={{ color: t.textLight }}>Genesis 2:24</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ═══════════ VIEW 2: Playing a Game ═══════════ */
  if (!activeGame) return null;

  const hasCards = cards.length > 0;
  const isLastCard = hasCards && cardIndex === cards.length - 1;
  const currentCard = hasCards ? cards[cardIndex] : null;
  const progressPct = hasCards ? Math.round(((cardIndex + 1) / cards.length) * 100) : 0;
  const pillarTheme = activeGame.pillar ? PILLAR_MAP[activeGame.pillar] : null;
  const accentBg = pillarTheme?.bg || t.goldBg;
  const accentText = pillarTheme?.text || t.textLink;

  // Slide animation style
  const cardStyle: React.CSSProperties = {
    transition: slideDir ? 'transform 0.28s ease, opacity 0.28s ease' : 'none',
    transform: slideDir === 'left'
      ? 'translateX(-40px)'
      : slideDir === 'right'
        ? 'translateX(40px)'
        : 'translateX(0)',
    opacity: slideDir ? 0 : 1,
  };

  /* ─── Completion screen ─── */
  if (completed) {
    return (
      <div className="min-h-screen" style={{ background: t.bgPrimary }}>
        <div className="max-w-lg mx-auto px-4 py-5">
          <div
            className="rounded-3xl p-8 text-center mt-8"
            style={{ background: t.bgCard, boxShadow: t.shadowCardLg, opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
          >
            <span className="text-5xl block mb-4">🎉</span>
            <h2 className="text-2xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              Great time together!
            </h2>
            <p className="text-sm mb-6" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
              You completed &ldquo;{activeGame.title}&rdquo;. Keep investing in your marriage!
            </p>

            {/* Enjoyment rating */}
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Did you both enjoy this?
              </p>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setEnjoyedRating(true)}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer border-none transition-all"
                  style={{
                    background: enjoyed === true ? t.greenBg : t.bgCardHover,
                    border: enjoyed === true ? `2px solid ${t.green}` : `2px solid ${t.border}`,
                    transform: enjoyed === true ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  👍
                </button>
                <button
                  onClick={() => setEnjoyedRating(false)}
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl cursor-pointer border-none transition-all"
                  style={{
                    background: enjoyed === false ? t.redBg : t.bgCardHover,
                    border: enjoyed === false ? `2px solid ${t.red}` : `2px solid ${t.border}`,
                    transform: enjoyed === false ? 'scale(1.1)' : 'scale(1)',
                  }}
                >
                  👎
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2.5">
              <button
                onClick={() => startGame(activeGame)}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold border-none cursor-pointer text-white"
                style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)', boxShadow: '0 4px 20px rgba(184,134,11,0.25)' }}
              >
                Play Again
              </button>
              <button
                onClick={exitGame}
                className="w-full py-3.5 rounded-2xl text-sm font-semibold cursor-pointer"
                style={{ fontFamily: 'Source Sans 3, sans-serif', background: t.bgCardHover, border: `1.5px solid ${t.border}`, color: t.textSecondary }}
              >
                Back to Games
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ─── Card-based game play ─── */
  if (hasCards) {
    return (
      <div className="min-h-screen" style={{ background: t.bgPrimary }}>
        <div
          className="max-w-lg mx-auto"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={exitGame}
              className="flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer"
              style={{ background: t.bgCardHover, color: t.textMuted }}
              aria-label="Exit game"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" /><path d="M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                {activeGame.title}
              </div>
              <div className="text-[11px]" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                Card {cardIndex + 1} of {cards.length}
              </div>
            </div>
            <button
              onClick={handleShuffle}
              className="flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer"
              style={{ background: t.bgCardHover, color: t.textMuted }}
              aria-label="Shuffle cards"
              title="Shuffle cards"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="16 3 21 3 21 8" /><line x1="4" y1="20" x2="21" y2="3" />
                <polyline points="21 16 21 21 16 21" /><line x1="15" y1="15" x2="21" y2="21" />
                <line x1="4" y1="4" x2="9" y2="9" />
              </svg>
            </button>
          </div>

          {/* Progress bar */}
          <div className="px-4 mb-5">
            <div className="w-full h-2 rounded-full" style={{ background: t.border }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%`, background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
              />
            </div>
          </div>

          {/* Card area */}
          <div className="px-4 pb-6">
            <div style={cardStyle}>
              <div
                className="rounded-3xl p-8 min-h-[320px] flex flex-col items-center justify-center text-center"
                style={{ background: t.bgCard, boxShadow: t.shadowCardLg, border: `1.5px solid ${accentBg}` }}
              >
                {/* Pillar tag */}
                {pillarTheme && (
                  <span
                    className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-5"
                    style={{ background: accentBg, color: accentText }}
                  >
                    {pillarTheme.label}
                  </span>
                )}

                {/* Set indicator */}
                {currentCard?.set && (
                  <span className="text-[10px] mb-3" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Set {currentCard.set}
                  </span>
                )}

                {/* Question text */}
                <p
                  className="text-xl m-0 leading-relaxed"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.7 }}
                >
                  {currentCard?.q}
                </p>

                {/* Would-you-rather options */}
                {currentCard?.a && currentCard?.b && (
                  <div className="w-full mt-6 space-y-3">
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ background: t.greenBg, border: `1.5px solid ${t.green}30` }}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: t.green }}>Option A</span>
                      <span className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                        {currentCard.a}
                      </span>
                    </div>
                    <div className="text-center text-xs font-bold" style={{ color: t.textMuted }}>OR</div>
                    <div
                      className="rounded-xl p-4 text-center"
                      style={{ background: t.goldBg, border: `1.5px solid ${t.textLink}30` }}
                    >
                      <span className="text-xs font-bold uppercase tracking-wider block mb-1" style={{ color: t.textLink }}>Option B</span>
                      <span className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                        {currentCard.b}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-5">
              {cardIndex > 0 && (
                <button
                  onClick={() => goToCard('prev')}
                  disabled={animating}
                  className="flex-1 py-4 rounded-2xl text-sm font-semibold cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: t.bgCard,
                    color: t.textSecondary,
                    boxShadow: t.shadowCard,
                    border: `1.5px solid ${t.border}`,
                  }}
                >
                  &#8592; Previous
                </button>
              )}
              {!isLastCard ? (
                <button
                  onClick={() => goToCard('next')}
                  disabled={animating}
                  className="flex-1 py-4 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer active:scale-[0.98]"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                    boxShadow: '0 4px 20px rgba(184,134,11,0.25)',
                  }}
                >
                  Next Card &#8594;
                </button>
              ) : (
                <button
                  onClick={handleComplete}
                  disabled={saving}
                  className="flex-1 py-4 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer active:scale-[0.98]"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #5B8A3C, #3D6B28)',
                    boxShadow: '0 4px 20px rgba(61,107,40,0.25)',
                  }}
                >
                  {saving ? 'Saving...' : 'Complete Game ✓'}
                </button>
              )}
            </div>

            {/* Card dots for small decks */}
            {cards.length <= 20 && (
              <div className="flex items-center justify-center gap-1.5 mt-4">
                {cards.map((_, i) => (
                  <div
                    key={i}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === cardIndex ? 8 : 5,
                      height: i === cardIndex ? 8 : 5,
                      background: i === cardIndex
                        ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                        : i < cardIndex
                          ? t.textMuted
                          : t.border,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  /* ─── Instruction-based game (no cards) ─── */
  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-lg mx-auto"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={exitGame}
            className="flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer"
            style={{ background: t.bgCardHover, color: t.textMuted }}
            aria-label="Exit game"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18" /><path d="M6 6l12 12" />
            </svg>
          </button>
          <div className="text-center">
            <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
              {activeGame.title}
            </div>
            <div className="text-[11px]" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              ~{activeGame.duration_minutes} minutes
            </div>
          </div>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>

        <div className="px-4 pb-10">
          {/* Game icon & title */}
          <div className="text-center mb-6 mt-4">
            <span className="text-5xl block mb-3">{activeGame.icon}</span>
            <h2 className="text-2xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              {activeGame.title}
            </h2>
            {pillarTheme && (
              <span
                className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ background: accentBg, color: accentText }}
              >
                {pillarTheme.label}
              </span>
            )}
          </div>

          {/* Instructions card */}
          <div
            className="rounded-3xl p-7 mb-6"
            style={{ background: t.bgCard, boxShadow: t.shadowCard, borderLeft: `4px solid ${accentText || t.textLink}` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <span className="text-lg">📋</span>
              <h3 className="text-sm font-semibold uppercase tracking-wider m-0" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                How to Play
              </h3>
            </div>
            {activeGame.instructions.split('\n').map((paragraph, i) => (
              <p
                key={i}
                className="text-sm m-0 mb-3 last:mb-0"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.8 }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Timer */}
          <div
            className="rounded-2xl p-6 mb-6 text-center"
            style={{ background: t.bgCard, boxShadow: t.shadowCard }}
          >
            <div
              className="text-4xl font-bold mb-4"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                color: timerSeconds === 0 && !timerRunning && sessionStartedAt
                  ? t.green
                  : t.textPrimary,
              }}
            >
              {timerSeconds === 0 && !timerRunning
                ? 'Time\'s up!'
                : formatTime(timerSeconds)}
            </div>

            {/* Timer progress bar */}
            {timerRunning && activeGame.duration_minutes > 0 && (
              <div className="w-full h-2 rounded-full mb-4" style={{ background: t.border }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: `${(timerSeconds / (activeGame.duration_minutes * 60)) * 100}%`,
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  }}
                />
              </div>
            )}

            <div className="flex gap-3 justify-center">
              {!timerRunning && timerSeconds > 0 && (
                <button
                  onClick={() => setTimerRunning(true)}
                  className="px-8 py-3.5 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                    boxShadow: '0 4px 20px rgba(184,134,11,0.25)',
                  }}
                >
                  Start Timer
                </button>
              )}
              {timerRunning && (
                <button
                  onClick={() => { setTimerRunning(false); if (timerRef.current) clearInterval(timerRef.current); }}
                  className="px-8 py-3.5 rounded-2xl text-sm font-semibold cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: t.bgCardHover,
                    border: `1.5px solid ${t.border}`,
                    color: t.textSecondary,
                  }}
                >
                  Pause
                </button>
              )}
              {!timerRunning && timerSeconds === 0 && (
                <button
                  onClick={() => setTimerSeconds(activeGame.duration_minutes * 60)}
                  className="px-6 py-3 rounded-2xl text-sm font-semibold cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: t.bgCardHover,
                    border: `1.5px solid ${t.border}`,
                    color: t.textSecondary,
                  }}
                >
                  Reset Timer
                </button>
              )}
            </div>
          </div>

          {/* Mark Complete button */}
          <button
            onClick={handleComplete}
            disabled={saving}
            className="w-full py-4 rounded-2xl text-base font-semibold text-white border-none cursor-pointer active:scale-[0.98]"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'linear-gradient(135deg, #5B8A3C, #3D6B28)',
              boxShadow: '0 4px 20px rgba(61,107,40,0.25)',
            }}
          >
            {saving ? 'Saving...' : 'Mark Complete ✓'}
          </button>

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-[10px] m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>
      </div>
    </div>
  );
}
