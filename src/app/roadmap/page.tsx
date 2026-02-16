'use client';

import { useState, useEffect } from 'react';
import { t } from '@/lib/tokens';
import Link from 'next/link';

/* ═══════════════════════════════ ROADMAP DATA ═══════════════════════════════ */
interface Phase { title: string; subtitle: string; icon: string; status: 'live' | 'building' | 'planned'; features: Feature[]; }
interface Feature { name: string; desc: string; icon: string; status: 'live' | 'building' | 'planned'; }

const ROADMAP: Phase[] = [
  {
    title: 'Foundation', subtitle: 'Where you are now', icon: '🏛️', status: 'live',
    features: [
      { name: 'Daily Covenant Moments', desc: 'Scripture-led devotionals across all 4 pillars with micro-actions, prayer prompts, and couple questions', icon: '📖', status: 'live' },
      { name: 'Covenant Assessment', desc: 'Discover your marriage health across Covenant, Safety, Communication, and Spiritual pillars', icon: '📋', status: 'live' },
      { name: 'Personalised Pathway', desc: 'Automatically routed to Strengthen, Repair, or Restore based on your assessment scores', icon: '🧭', status: 'live' },
      { name: 'Couple Linking', desc: 'Invite your spouse and share your journey together with linked accounts', icon: '💑', status: 'live' },
      { name: 'Streak & Milestone Tracking', desc: 'Build consistency with daily streaks, activity heatmaps, and milestone badges', icon: '🔥', status: 'live' },
      { name: 'Conflict Repair Tools', desc: 'Emergency toolkit with timeout protocol, active listening, repair conversation, and prayer together', icon: '🛠️', status: 'live' },
      { name: 'Marriage Games', desc: 'Fun connection activities — question cards, date night ideas, appreciation swaps', icon: '🎲', status: 'live' },
      { name: '60-Day Threefold Reset', desc: '4-phase structured transformation across all pillars with daily teaching, exercises, and reflection', icon: '🔄', status: 'live' },
      { name: 'Church Ambassador Dashboard', desc: 'Church leaders see anonymous health trends and can support couples in their congregation', icon: '⛪', status: 'live' },
      { name: 'Push Notifications', desc: 'Morning devotional reminders, streak warnings, and spouse activity alerts', icon: '🔔', status: 'live' },
    ],
  },
  {
    title: 'Connection', subtitle: 'Building daily habits', icon: '💛', status: 'building',
    features: [
      { name: 'Love Nudges', desc: 'Daily push prompts with questions, gratitude challenges, and micro-actions to keep your marriage top of mind', icon: '💌', status: 'live' },
      { name: '"We" Journal', desc: 'Shared private diary for gratitude, prayers, memories, and love letters — your spouse sees when you leave something', icon: '📔', status: 'live' },
      { name: 'Daily Check-In', desc: '2-minute Marriage Temperature score with a single reflection and a micro-action served back to you', icon: '🌡️', status: 'planned' },
      { name: 'If-Then Plan Builder', desc: 'Create "If [trigger], then [response]" plans together — reminded at the right moments', icon: '⚡', status: 'planned' },
      { name: 'Weekly Pulse Report', desc: 'Sunday evening summary of your week — devotionals, games, temperature trend, strongest pillar', icon: '📊', status: 'planned' },
    ],
  },
  {
    title: 'Depth', subtitle: 'Growing together', icon: '🌿', status: 'planned',
    features: [
      { name: 'Two-Player Mini Tools', desc: '1–3 minute exercises for both spouses: "One Word Each", "Appreciation Swap", "3 Things I Noticed"', icon: '🤝', status: 'planned' },
      { name: 'Anniversary & Date Intelligence', desc: 'Countdown to your anniversary, personalised date night ideas based on your pillar scores', icon: '💍', status: 'planned' },
      { name: 'Conflict Pattern Insights', desc: 'See trends over time: "You tend to rate lower on Sundays" or "Safety score up 18% this month"', icon: '📈', status: 'planned' },
      { name: 'Couple Goals', desc: 'Set and track shared goals: "We\'ll pray together 5 times this week" with progress tracking', icon: '🎯', status: 'planned' },
      { name: 'Love Language Integration', desc: 'Discover and apply each other\'s love languages with tailored daily suggestions', icon: '💝', status: 'planned' },
    ],
  },
  {
    title: 'Community', subtitle: 'Beyond your couple', icon: '🌍', status: 'planned',
    features: [
      { name: 'Church Cohort Pods', desc: 'Optional small groups of 3–5 couples doing the Reset or devotionals together (private by default)', icon: '👥', status: 'planned' },
      { name: 'Mentoring Matching', desc: 'Connect thriving couples with those on the Repair or Restore pathway for encouragement', icon: '🤲', status: 'planned' },
      { name: 'Seasonal Challenges', desc: '7-Day Honour Week, 14-Day Gratitude Challenge, Advent Marriage series, and more', icon: '🏆', status: 'planned' },
      { name: 'Threefold Renewal Conference', desc: 'Annual virtual or in-person event with workshops, worship, and couple testimonies', icon: '🎪', status: 'planned' },
      { name: 'Ambassador Training', desc: 'Certification programme for church marriage champions with resources and a leadership dashboard', icon: '🎓', status: 'planned' },
    ],
  },
  {
    title: 'Intelligence', subtitle: 'Your marriage, understood', icon: '🧠', status: 'planned',
    features: [
      { name: 'Pre-emptive Prompts', desc: '"Tonight is a high-stress window. Want to do a 2-minute reset first?" — based on your patterns', icon: '🔮', status: 'planned' },
      { name: 'Time-to-Repair Tracking', desc: 'Measure how quickly you return to peace after conflict — and watch it improve over time', icon: '⏱️', status: 'planned' },
      { name: 'Skill Ladders', desc: 'Level 1–5 communication, safety, and spiritual skills with practical exercises at each level', icon: '📶', status: 'planned' },
      { name: 'AI Marriage Coach', desc: 'Conversational guidance rooted in scripture and clinical best practice — not a replacement for counselling, but a daily companion', icon: '🤖', status: 'planned' },
      { name: 'Quarterly Marriage Report', desc: 'Comprehensive PDF report of your pillar scores, growth areas, milestones, and recommendations', icon: '📑', status: 'planned' },
    ],
  },
];

const STATUS_STYLE = {
  live: { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Live' },
  building: { bg: 'var(--gold-bg)', color: 'var(--text-link)', label: 'Building' },
  planned: { bg: 'var(--bg-accent)', color: 'var(--text-muted)', label: 'Planned' },
};

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function RoadmapPage() {
  const [vis, setVis] = useState(false);
  const [expanded, setExpanded] = useState<number>(0);

  useEffect(() => { setTimeout(() => setVis(true), 80); }, []);

  const totalFeatures = ROADMAP.reduce((sum, p) => sum + p.features.length, 0);
  const liveFeatures = ROADMAP.reduce((sum, p) => sum + p.features.filter(f => f.status === 'live').length, 0);

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: t.bgPrimary, borderBottom: `1px solid ${t.borderLight}` }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/dashboard" className="flex items-center no-underline" style={{ color: t.textMuted }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <h1 className="text-sm font-semibold tracking-wider uppercase m-0" style={{ fontFamily: 'Cinzel,serif', color: t.textPrimary, letterSpacing: '0.15em' }}>Roadmap</h1>
          <div className="w-5" />
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pb-24">
        {/* Hero */}
        <div className="text-center py-8" style={{ opacity: vis ? 1 : 0, transition: 'opacity .7s ease .1s' }}>
          <div className="text-4xl mb-3">🗺️</div>
          <h2 className="text-2xl mb-2" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textPrimary, fontWeight: 600 }}>What&apos;s Coming</h2>
          <p className="text-sm max-w-xs mx-auto" style={{ color: t.textSecondary, lineHeight: 1.6 }}>
            Threefold Cord is growing with you. Here&apos;s every feature we&apos;re building — and what&apos;s already live.
          </p>
          <div className="flex items-center justify-center gap-2 mt-4">
            <div className="h-2 flex-1 max-w-[200px] rounded-full overflow-hidden" style={{ background: t.bgAccent }}>
              <div className="h-full rounded-full" style={{ width: `${(liveFeatures / totalFeatures) * 100}%`, background: 'var(--green)', transition: 'width 1.5s ease .5s' }} />
            </div>
            <span className="text-xs font-semibold" style={{ color: t.green }}>{liveFeatures}/{totalFeatures} live</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          {ROADMAP.map((phase, pi) => {
            const isOpen = expanded === pi;
            const st = STATUS_STYLE[phase.status];
            const phaseLive = phase.features.filter(f => f.status === 'live').length;
            return (
              <div key={pi} className="rounded-2xl overflow-hidden" style={{ background: t.bgCard, border: `1px solid ${isOpen ? t.textLink : t.border}`, boxShadow: t.shadowCard, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(12px)', transition: `all .5s ease ${200 + pi * 100}ms` }}>
                {/* Phase header */}
                <button onClick={() => setExpanded(isOpen ? -1 : pi)} className="w-full flex items-center gap-4 p-4 border-none cursor-pointer text-left" style={{ background: 'transparent' }}>
                  <span className="text-2xl">{phase.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-semibold" style={{ color: t.textPrimary, fontFamily: 'Cormorant Garamond,serif' }}>{phase.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold" style={{ background: st.bg, color: st.color }}>{st.label}</span>
                    </div>
                    <p className="text-xs m-0 mt-0.5" style={{ color: t.textMuted }}>{phase.subtitle}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: t.textSecondary }}>{phaseLive}/{phase.features.length}</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.textMuted} strokeWidth="2" strokeLinecap="round" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform .3s ease' }}><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </button>

                {/* Features */}
                {isOpen && (
                  <div className="px-4 pb-4 space-y-2">
                    {phase.features.map((feat, fi) => {
                      const fs = STATUS_STYLE[feat.status];
                      return (
                        <div key={fi} className="flex items-start gap-3 p-3 rounded-xl" style={{ background: t.bgWarm, border: `1px solid ${t.borderLight}` }}>
                          <span className="text-lg flex-shrink-0 mt-0.5">{feat.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="text-sm font-semibold" style={{ color: t.textPrimary }}>{feat.name}</span>
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ background: fs.bg, color: fs.color }}>{fs.label}</span>
                            </div>
                            <p className="text-xs m-0" style={{ color: t.textSecondary, lineHeight: 1.5 }}>{feat.desc}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center py-10 mt-4" style={{ opacity: vis ? 1 : 0, transition: 'opacity .7s ease .8s' }}>
          <div className="p-6 rounded-2xl" style={{ background: t.bgCard, border: `1px solid ${t.border}` }}>
            <div className="text-3xl mb-3">💡</div>
            <h3 className="text-base mb-2" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textPrimary, fontWeight: 600 }}>Have a suggestion?</h3>
            <p className="text-sm mb-0" style={{ color: t.textSecondary, lineHeight: 1.6 }}>
              We build Threefold Cord for real marriages. If there&apos;s something you need, we want to hear it.
            </p>
          </div>
        </div>

        {/* Scripture */}
        <div className="text-center pb-8">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textLight }}>&ldquo;For I know the plans I have for you — plans to prosper you and not to harm you, plans to give you hope and a future.&rdquo;</p>
          <p className="text-[10px] m-0 mt-1 uppercase tracking-widest" style={{ color: t.textLight }}>Jeremiah 29:11</p>
        </div>
      </div>
    </div>
  );
}
