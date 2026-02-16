'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';
import Image from 'next/image';
import Link from 'next/link';

const DIFFICULTY_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: 'var(--green-bg)', text: 'var(--green)' },
  medium: { bg: 'var(--gold-bg)', text: 'var(--text-link)' },
  deep: { bg: 'var(--pillar-safety-bg)', text: 'var(--pillar-safety-text)' },
};

export default function GamesPage() {
  const [games, setGames] = useState<any[]>([]);
  const [selectedGame, setSelectedGame] = useState<any>(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('marriage_games').select('*').eq('is_active', true);
      if (data) setGames(data);
      setLoading(false);
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  // Card game view
  if (selectedGame) {
    const cards = selectedGame.cards || [];
    const currentCard = cards[cardIndex];

    return (
      <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
        <div className="max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => { setSelectedGame(null); setCardIndex(0); }} className="text-sm border-none bg-transparent cursor-pointer" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              ← Back to games
            </button>
            <div className="flex items-center gap-3">
              {cards.length > 0 && (
                <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                  {cardIndex + 1} of {cards.length}
                </span>
              )}
              <ThemeToggle size="sm" />
            </div>
          </div>

          <div className="rounded-3xl overflow-hidden" style={{ background: t.bgCard, boxShadow: t.shadowCardLg }}>
            <div className="p-7">
              <div className="flex items-center gap-3 mb-4">
                <Image src="/icons/icon-dice.png" alt="" width={36} height={36} />
                <h1 className="text-2xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  {selectedGame.title}
                </h1>
              </div>

              {(!cards.length || cardIndex === 0) && (
                <div className="rounded-xl p-4 mb-5" style={{ background: t.goldBg, border: `1px solid ${t.textLink}15` }}>
                  <p className="text-sm m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
                    {selectedGame.instructions}
                  </p>
                </div>
              )}

              {currentCard && (
                <div className="rounded-2xl p-8 text-center min-h-[200px] flex items-center justify-center" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                  <p className="text-lg m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary, lineHeight: 1.6 }}>
                    {currentCard.q || currentCard.prompt}
                  </p>
                </div>
              )}

              {!cards.length && (
                <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                  <p className="text-base m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}>
                    {selectedGame.description}
                  </p>
                </div>
              )}

              {cards.length > 0 && (
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setCardIndex(Math.max(0, cardIndex - 1))}
                    disabled={cardIndex === 0}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: cardIndex === 0 ? t.textLight : t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    ← Previous
                  </button>
                  <button
                    onClick={() => setCardIndex(Math.min(cards.length - 1, cardIndex + 1))}
                    disabled={cardIndex === cards.length - 1}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white cursor-pointer border-none"
                    style={{ background: cardIndex === cards.length - 1 ? t.border : 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Next Card →
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Games list
  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <TopBar title="Marriage Games" subtitle="Fun ways to connect and rediscover each other" backHref="/dashboard" />
      <div className="max-w-2xl mx-auto px-4 py-4">

        <div className="space-y-3">
          {games.map(game => {
            const diff = DIFFICULTY_COLORS[game.difficulty] || DIFFICULTY_COLORS.easy;
            return (
              <button
                key={game.id}
                onClick={() => setSelectedGame(game)}
                className="w-full rounded-2xl p-5 text-left cursor-pointer transition-all hover:-translate-y-0.5 border-none"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.goldBg }}>
                    <Image src="/icons/icon-dice.png" alt="" width={28} height={28} />
                  </div>
                  <div className="flex-1">
                    <div className="text-base font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                      {game.title}
                    </div>
                    <div className="text-xs mt-1" style={{ color: t.textMuted, lineHeight: 1.5 }}>
                      {game.description}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: diff.bg, color: diff.text, fontWeight: 600 }}>
                        {game.difficulty}
                      </span>
                      <span className="text-xs" style={{ color: t.textMuted }}>
                        ~{game.duration_minutes} min
                      </span>
                      {game.best_for && (
                        <span className="text-xs" style={{ color: t.textMuted }}>
                          · Best for {game.best_for}
                        </span>
                      )}
                    </div>
                  </div>
                  <span style={{ color: t.textLink }}>→</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
