'use client';

import { useState } from 'react';

const C = {
  navy: '#0F1E2E',
  navyMid: '#1A2D40',
  gold: '#C7A23A',
  goldDark: '#A8862E',
  goldSoft: '#F5ECD7',
  ivory: '#F4F1EA',
  white: '#FFFFFF',
  muted: '#8A9BAA',
  green: '#5B8A3C',
  purple: '#5E35B1',
  blue: '#1565C0',
  sage: '#33691E',
  textDark: '#2C2418',
  textMid: '#7A7062',
};

const SCREENS = [
  {
    id: 'devotional',
    label: 'Daily Devotional',
    icon: '📖',
    content: <DevotionalScreen />,
  },
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '📊',
    content: <DashboardScreen />,
  },
  {
    id: 'games',
    label: 'Games',
    icon: '🎲',
    content: <GamesScreen />,
  },
  {
    id: 'couple',
    label: 'Couple',
    icon: '💍',
    content: <CoupleScreen />,
  },
];

export function AppDemo() {
  const [active, setActive] = useState('devotional');
  const screen = SCREENS.find(s => s.id === active)!;

  return (
    <section className="py-20 md:py-28 px-6" style={{ background: C.navy }}>
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
            Inside Cleave
          </span>
          <h2 className="text-3xl md:text-4xl font-medium mt-4 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.ivory, lineHeight: 1.3 }}>
            See what your marriage journey looks like
          </h2>
          <p className="text-base max-w-xl mx-auto" style={{ color: C.muted, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.7 }}>
            A daily rhythm of scripture, connection, and intentional growth — right in your pocket.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-12">
          {/* Tab buttons — horizontal on mobile, vertical on desktop */}
          <div className="flex lg:flex-col gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0">
            {SCREENS.map(s => (
              <button
                key={s.id}
                onClick={() => setActive(s.id)}
                className="flex items-center gap-3 px-5 py-3.5 rounded-xl text-left whitespace-nowrap border-none cursor-pointer transition-all flex-shrink-0"
                style={{
                  background: active === s.id ? `${C.gold}18` : 'transparent',
                  border: active === s.id ? `1px solid ${C.gold}30` : '1px solid transparent',
                  fontFamily: 'Source Sans 3, sans-serif',
                  minWidth: 'fit-content',
                }}
              >
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-semibold" style={{ color: active === s.id ? C.gold : C.muted }}>
                  {s.label}
                </span>
              </button>
            ))}
          </div>

          {/* Phone frame */}
          <div className="flex-1 flex justify-center w-full">
            <div className="relative" style={{ width: 320, maxWidth: '100%' }}>
              {/* Phone bezel */}
              <div className="rounded-[2.5rem] p-3" style={{ background: '#1A1A2E', boxShadow: '0 25px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(199,162,58,0.1)' }}>
                {/* Notch */}
                <div className="flex justify-center mb-2">
                  <div className="w-24 h-5 rounded-full" style={{ background: '#111' }} />
                </div>
                {/* Screen */}
                <div className="rounded-[1.5rem] overflow-hidden" style={{ background: C.ivory, minHeight: 520 }}>
                  {screen.content}
                </div>
                {/* Home indicator */}
                <div className="flex justify-center mt-2">
                  <div className="w-28 h-1 rounded-full" style={{ background: '#555' }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ═══════════════════════════════════════
// MOCK APP SCREENS
// ═══════════════════════════════════════

function DevotionalScreen() {
  return (
    <div className="p-5">
      {/* Status bar */}
      <div className="flex items-center justify-between mb-5">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: C.muted }}>Today&apos;s Devotional</span>
        <div className="flex items-center gap-1.5">
          <span className="text-sm">🔥</span>
          <span className="text-xs font-bold" style={{ color: C.gold }}>7 day streak</span>
        </div>
      </div>

      {/* Pillar tag */}
      <div className="inline-block px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider mb-4" style={{ background: `${C.purple}15`, color: C.purple }}>
        Emotional Safety
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold m-0 mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
        The Courage to Be Known
      </h3>

      {/* Scripture */}
      <div className="rounded-xl p-4 mb-4" style={{ background: C.goldSoft, border: `1px solid ${C.gold}20` }}>
        <p className="text-sm italic m-0 mb-1.5" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.6 }}>
          &ldquo;Be completely humble and gentle; be patient, bearing with one another in love.&rdquo;
        </p>
        <p className="text-[10px] font-semibold uppercase tracking-wider m-0" style={{ color: C.goldDark }}>
          Ephesians 4:2
        </p>
      </div>

      {/* Reflection preview */}
      <p className="text-sm m-0 mb-5" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.7 }}>
        Vulnerability isn&apos;t weakness — it&apos;s the foundation of true intimacy. Today, share one thing with your spouse that you&apos;ve been holding back...
      </p>

      {/* Action */}
      <div className="rounded-xl p-4 mb-4" style={{ background: C.white, border: `1px solid #E8E3D9` }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.green }}>
          ✦ Micro Action
        </div>
        <p className="text-xs m-0" style={{ color: C.textDark, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
          Before bed tonight, tell your spouse: &ldquo;One thing I&apos;ve been wanting to share with you is...&rdquo;
        </p>
      </div>

      {/* Couple question */}
      <div className="rounded-xl p-4" style={{ background: `${C.blue}08`, border: `1px solid ${C.blue}15` }}>
        <div className="text-[10px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: C.blue }}>
          💬 Couple Question
        </div>
        <p className="text-xs m-0" style={{ color: C.textDark, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.5 }}>
          When do you feel most emotionally safe with me?
        </p>
      </div>
    </div>
  );
}

function DashboardScreen() {
  return (
    <div className="p-5">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[10px] uppercase tracking-wider m-0 mb-0.5" style={{ color: C.muted }}>Welcome back</p>
          <h3 className="text-lg font-semibold m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}>
            Denise & Duane
          </h3>
        </div>
        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.goldSoft }}>
          <span className="text-sm">💍</span>
        </div>
      </div>

      {/* Streak card */}
      <div className="rounded-xl p-4 mb-4 flex items-center justify-between" style={{ background: `linear-gradient(135deg, ${C.navy}, ${C.navyMid})` }}>
        <div>
          <p className="text-[10px] uppercase tracking-wider m-0 mb-1" style={{ color: C.gold }}>Current Streak</p>
          <p className="text-2xl font-bold m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.ivory }}>
            7 <span className="text-sm font-normal" style={{ color: C.muted }}>days</span>
          </p>
        </div>
        <div className="flex gap-1">
          {['M','T','W','T','F','S','S'].map((d, i) => (
            <div key={i} className="w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold"
              style={{ background: i < 7 ? `${C.gold}25` : 'transparent', color: i < 7 ? C.gold : C.muted, border: i >= 7 ? `1px solid ${C.muted}30` : 'none' }}>
              {i < 7 ? '✓' : d}
            </div>
          ))}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { icon: '📖', label: "Today's\nDevotional", bg: C.goldSoft, color: '#8B6914' },
          { icon: '📋', label: 'Assessment\nResults', bg: `${C.purple}12`, color: C.purple },
          { icon: '🎲', label: 'Marriage\nGames', bg: `${C.blue}10`, color: C.blue },
          { icon: '🛠️', label: 'Repair\nTools', bg: `${C.green}12`, color: C.green },
        ].map((a, i) => (
          <div key={i} className="rounded-xl p-4 text-center" style={{ background: a.bg }}>
            <span className="text-xl block mb-1">{a.icon}</span>
            <span className="text-[10px] font-semibold leading-tight whitespace-pre-line" style={{ color: a.color, fontFamily: 'Source Sans 3, sans-serif' }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Milestones */}
      <div className="rounded-xl p-4" style={{ background: C.white, border: '1px solid #E8E3D9' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-3" style={{ color: C.muted }}>Recent Milestones</p>
        <div className="flex gap-3">
          {[
            { icon: '🔥', label: '7-Day Streak' },
            { icon: '📖', label: 'First Devotional' },
            { icon: '💬', label: 'First Response' },
          ].map((m, i) => (
            <div key={i} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: C.goldSoft }}>
                <span className="text-sm">{m.icon}</span>
              </div>
              <span className="text-[8px] text-center font-medium" style={{ color: C.textMid, maxWidth: 60 }}>{m.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GamesScreen() {
  return (
    <div className="p-5">
      <h3 className="text-lg font-semibold m-0 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}>
        Marriage Games
      </h3>
      <p className="text-xs m-0 mb-5" style={{ color: C.muted, fontFamily: 'DM Sans, sans-serif' }}>
        Fun, meaningful games that spark connection
      </p>

      <div className="space-y-3">
        {[
          { icon: '❤️', title: 'Love Language Express', type: 'Card Game', duration: '15 min', desc: 'Draw cards and express love in your partner\'s language.', color: '#E91E63', free: true },
          { icon: '🔥', title: 'The Hot Seat', type: 'Question Game', duration: '20 min', desc: 'Take turns answering increasingly deep questions.', color: '#FF5722', free: true },
          { icon: '🗺️', title: 'Dream Builders', type: 'Vision Game', duration: '25 min', desc: 'Map out your shared dreams and future together.', color: C.blue, free: false },
          { icon: '⏰', title: 'Memory Lane', type: 'Story Game', duration: '15 min', desc: 'Rediscover forgotten moments from your journey.', color: C.purple, free: false },
          { icon: '🎯', title: 'Know Your Spouse', type: 'Quiz Game', duration: '10 min', desc: 'How well do you really know each other?', color: C.sage, free: false },
        ].map((g, i) => (
          <div key={i} className="rounded-xl p-4 flex items-start gap-3" style={{ background: C.white, border: '1px solid #E8E3D9' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${g.color}12` }}>
              <span className="text-lg">{g.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-sm font-semibold" style={{ color: C.textDark, fontFamily: 'Source Sans 3, sans-serif' }}>{g.title}</span>
                {!g.free && <span className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase" style={{ background: C.goldSoft, color: '#8B6914' }}>Plus</span>}
              </div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px]" style={{ color: C.muted }}>{g.type}</span>
                <span className="text-[10px]" style={{ color: C.muted }}>·</span>
                <span className="text-[10px]" style={{ color: C.muted }}>{g.duration}</span>
              </div>
              <p className="text-[11px] m-0" style={{ color: C.textMid, lineHeight: 1.4 }}>{g.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CoupleScreen() {
  return (
    <div className="p-5">
      {/* Couple header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex -space-x-3">
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2" style={{ background: C.goldSoft, color: C.goldDark, borderColor: C.ivory, zIndex: 1 }}>D</div>
          <div className="w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold border-2" style={{ background: `${C.purple}15`, color: C.purple, borderColor: C.ivory }}>D</div>
        </div>
        <div>
          <h3 className="text-base font-semibold m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}>Denise & Duane</h3>
          <p className="text-[10px] m-0" style={{ color: C.muted }}>Linked · Covenant Journey</p>
        </div>
      </div>

      {/* Pillar scores */}
      <div className="rounded-xl p-4 mb-4" style={{ background: C.white, border: '1px solid #E8E3D9' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-3" style={{ color: C.muted }}>Your Pillar Scores</p>
        {[
          { label: 'Covenant', score: 4.2, color: '#D4B45A', width: '84%' },
          { label: 'Emotional Safety', score: 3.6, color: '#B39DDB', width: '72%' },
          { label: 'Communication', score: 3.9, color: '#64B5F6', width: '78%' },
          { label: 'Spiritual', score: 4.5, color: '#81C784', width: '90%' },
        ].map((p, i) => (
          <div key={i} className="mb-2.5 last:mb-0">
            <div className="flex justify-between text-[10px] mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif' }}>
              <span style={{ color: C.textDark, fontWeight: 600 }}>{p.label}</span>
              <span style={{ color: p.color, fontWeight: 700 }}>{p.score}/5</span>
            </div>
            <div className="h-2 rounded-full" style={{ background: '#F0EDE6' }}>
              <div className="h-full rounded-full transition-all" style={{ width: p.width, background: p.color }} />
            </div>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: '💌', label: 'Love Note' },
          { icon: '📝', label: 'Check-In' },
          { icon: '🎯', label: 'Goals' },
        ].map((a, i) => (
          <div key={i} className="rounded-xl py-3 text-center" style={{ background: C.white, border: '1px solid #E8E3D9' }}>
            <span className="text-lg block mb-0.5">{a.icon}</span>
            <span className="text-[10px] font-semibold" style={{ color: C.textMid }}>{a.label}</span>
          </div>
        ))}
      </div>

      {/* Exercises preview */}
      <div className="rounded-xl p-4" style={{ background: C.white, border: '1px solid #E8E3D9' }}>
        <p className="text-[10px] font-semibold uppercase tracking-wider m-0 mb-3" style={{ color: C.muted }}>Couple Exercises</p>
        {[
          { icon: '🗣️', title: 'Active Listening Practice', pillar: 'Communication', duration: '15 min' },
          { icon: '🙏', title: 'Pray Together Prompt', pillar: 'Spiritual', duration: '10 min' },
        ].map((e, i) => (
          <div key={i} className="flex items-center gap-3 py-2.5" style={{ borderTop: i > 0 ? '1px solid #F0EDE6' : 'none' }}>
            <span className="text-base">{e.icon}</span>
            <div className="flex-1">
              <p className="text-xs font-semibold m-0" style={{ color: C.textDark }}>{e.title}</p>
              <p className="text-[10px] m-0" style={{ color: C.muted }}>{e.pillar} · {e.duration}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
