import Link from 'next/link';
import Image from 'next/image';
import { ThreefoldLogo } from '@/components/ui/Logo';

/* ═══════════════════════════════════════════════════════════════
   LANDING PAGE — Threefold Cord
   Aspirational · Premium · Covenant-Strong
   ═══════════════════════════════════════════════════════════════ */

const C = {
  navy: '#0F1E2E',
  navyMid: '#1A2D40',
  gold: '#C7A23A',
  goldDark: '#A8862E',
  goldSoft: '#F5ECD7',
  ivory: '#F4F1EA',
  ivoryDark: '#E8E3D9',
  burgundy: '#6B2C3E',
  white: '#FFFFFF',
  muted: '#8A9BAA',
  green: '#5B8A3C',
  greenBg: '#F0F7EC',
  purple: '#5E35B1',
  purpleBg: '#EDE7F6',
  blue: '#1565C0',
  blueBg: '#E3F2FD',
  sage: '#33691E',
  sageBg: '#F0F7EC',
  textDark: '#2C2418',
  textMid: '#7A7062',
};

const PILLARS = [
  { icon: '/icons/pillar-covenant.png', label: 'Covenant', desc: 'The unbreakable promise at the centre of your marriage. Not a contract — a sacred bond.', bg: C.goldSoft, color: '#8B6914' },
  { icon: '/icons/pillar-emotional-safety.png', label: 'Emotional Safety', desc: 'The freedom to be fully known without fear. Where vulnerability meets unconditional acceptance.', bg: C.purpleBg, color: C.purple },
  { icon: '/icons/pillar-communication.png', label: 'Communication', desc: 'More than talking — truly hearing each other. The bridge between two hearts.', bg: C.blueBg, color: C.blue },
  { icon: '/icons/pillar-spiritual.png', label: 'Spiritual Intimacy', desc: 'Growing toward God together. The third strand that makes the cord unbreakable.', bg: C.sageBg, color: C.sage },
];

const FEATURES = [
  { icon: '/icons/icon-clipboard.png', title: 'Covenant Assessment', desc: 'Discover your marriage pathway in 5 minutes. Personalised to your relationship.', free: true },
  { icon: '/icons/icon-book.png', title: 'Daily Devotionals', desc: 'Scripture-rooted moments that transform your marriage one day at a time.', free: true },
  { icon: '/icons/icon-dice.png', title: 'Marriage Games', desc: 'Fun, meaningful games that spark connection and rediscovery.', free: '2 free' },
  { icon: '/icons/icon-tools.png', title: 'Conflict Repair Tools', desc: 'Step-by-step guides for when things get hard. Because every couple needs these.', free: '2 free' },
  { icon: '/icons/icon-reset.png', title: '60-Day Threefold Reset', desc: 'A structured 4-phase transformation. Teaching, exercises, and couple activities.', free: false },
  { icon: '/icons/icon-heart.png', title: 'Couple Dashboard', desc: 'Link with your spouse. Track progress together. Send love notes.', free: true },
];

const STEPS = [
  { num: '01', title: 'Take the Assessment', desc: 'Answer 20 honest questions across four pillars. Get your personalised pathway — Strengthen, Repair, or Restore.', icon: '/icons/icon-clipboard.png' },
  { num: '02', title: 'Grow Daily Together', desc: 'Read your covenant moment each morning. Build a streak. Play games. Use tools when you need them.', icon: '/icons/icon-book.png' },
  { num: '03', title: 'Transform Your Marriage', desc: 'Start the 60-Day Reset. Four phases of structured growth that take you from where you are to where God designed you to be.', icon: '/icons/icon-reset.png' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ background: C.ivory }}>

      {/* ═══════════════════ HERO ═══════════════════ */}
      <section className="relative overflow-hidden" style={{ background: C.navy, minHeight: '100vh' }}>
        {/* Atmosphere layers */}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 30%, rgba(26,45,64,0.9) 0%, transparent 70%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 25% 20%, rgba(199,162,58,0.05) 0%, transparent 50%)' }} />
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 75% 80%, rgba(107,44,62,0.04) 0%, transparent 45%)' }} />
        <div className="absolute inset-0 pointer-events-none" style={{ opacity: 0.008, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 1px,#F4F1EA 1px,#F4F1EA 2px),repeating-linear-gradient(90deg,transparent,transparent 1px,#F4F1EA 1px,#F4F1EA 2px)', backgroundSize: '5px 5px' }} />

        {/* Nav bar */}
        <nav className="relative z-10 flex items-center justify-between max-w-6xl mx-auto px-6 py-5">
          <div className="flex items-center gap-3">
            <ThreefoldLogo size={36} />
            <span className="text-sm font-semibold tracking-[0.15em] uppercase hidden sm:inline" style={{ fontFamily: 'Cinzel, serif', color: C.ivory }}>
              Threefold Cord
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/auth" className="text-sm no-underline px-5 py-2.5 rounded-full transition-all hover:opacity-80" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
              Sign In
            </Link>
            <Link href="/auth" className="text-sm no-underline px-5 py-2.5 rounded-full transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}>
              Start Free
            </Link>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex flex-col items-center justify-center text-center px-6 pt-16 pb-28 md:pt-24 md:pb-36">
          <div className="mb-8" style={{ filter: 'drop-shadow(0 4px 30px rgba(199,162,58,0.2))' }}>
            <ThreefoldLogo size={100} />
          </div>

          <h1 className="text-4xl md:text-6xl font-bold tracking-[0.12em] uppercase max-w-4xl" style={{ fontFamily: 'Cinzel, serif', color: C.ivory, lineHeight: 1.1 }}>
            Covenant-Strong Marriages
          </h1>

          <div className="flex items-center gap-4 mt-4 mb-8">
            <div className="w-12 h-px" style={{ background: C.gold, opacity: 0.4 }} />
            <span className="text-lg md:text-xl tracking-[0.3em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: C.gold, fontWeight: 400 }}>
              For Life
            </span>
            <div className="w-12 h-px" style={{ background: C.gold, opacity: 0.4 }} />
          </div>

          <p className="text-base md:text-lg max-w-xl mx-auto mb-12" style={{ fontFamily: 'DM Sans, sans-serif', color: C.ivory, opacity: 0.6, lineHeight: 1.8 }}>
            A faith-centred movement equipping husbands and wives to grow, repair, and thrive together. Built on four pillars. Rooted in scripture. Designed for real marriages.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Link href="/auth" className="px-10 py-4 rounded-full text-sm font-semibold uppercase tracking-wider no-underline hover:-translate-y-0.5 transition-transform" style={{ fontFamily: 'Source Sans 3, sans-serif', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy, boxShadow: '0 4px 24px rgba(199,162,58,0.3)', letterSpacing: '0.12em' }}>
              Start Free Today
            </Link>
            <a href="#founding" className="px-10 py-4 rounded-full text-sm font-semibold uppercase tracking-wider no-underline transition-all hover:border-opacity-60" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.gold, border: `1.5px solid ${C.gold}40`, letterSpacing: '0.12em' }}>
              Become a Founding Member
            </a>
          </div>

          <p className="text-xs mt-16 tracking-wider uppercase" style={{ color: C.ivory, opacity: 0.15, letterSpacing: '0.2em' }}>
            Private · Encrypted · Faith-Rooted
          </p>
        </div>

        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-24" style={{ background: `linear-gradient(transparent, ${C.ivory})` }} />
      </section>

      {/* ═══════════════════ SOCIAL PROOF BAR ═══════════════════ */}
      <section className="py-6 border-b" style={{ background: C.white, borderColor: C.ivoryDark }}>
        <div className="max-w-5xl mx-auto px-6 flex flex-wrap items-center justify-center gap-x-8 gap-y-2 text-center">
          {['Faith-Centred', 'Built for Real Couples', 'Used by Churches Across the UK', 'Scripture-Rooted'].map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: C.gold }} />
              <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.1em' }}>{t}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════ THE PROBLEM ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.white }}>
        <div className="max-w-3xl mx-auto text-center">
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
            The Reality
          </span>
          <h2 className="text-3xl md:text-4xl font-medium mt-4 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
            Good intentions aren&apos;t enough to build a lasting marriage
          </h2>
          <p className="text-base md:text-lg mb-6" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.8 }}>
            Most couples don&apos;t need crisis intervention — they need daily investment. Small, consistent deposits of attention, honesty, and faith that compound over years. But life gets in the way. Routines calcify. Conversations stay shallow. The drift happens so slowly you don&apos;t notice until you feel like strangers.
          </p>
          <p className="text-base md:text-lg" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.8 }}>
            Threefold Cord exists because your marriage was designed for more than surviving. It was designed for <strong style={{ color: C.textDark }}>covenant — the kind of love that&apos;s chosen daily, strengthened intentionally, and anchored in something unshakeable.</strong>
          </p>
        </div>
      </section>

      {/* ═══════════════════ HOW IT WORKS ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.ivory }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
              How It Works
            </span>
            <h2 className="text-3xl md:text-4xl font-medium mt-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
              Three steps to a covenant-strong marriage
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center md:text-left">
                <div className="flex items-center justify-center md:justify-start gap-4 mb-4">
                  <span className="text-3xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: `${C.gold}40` }}>{step.num}</span>
                  <Image src={step.icon} alt="" width={36} height={36} />
                </div>
                <h3 className="text-lg font-semibold mb-2" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.textDark }}>{step.title}</h3>
                <p className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.7 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOUR PILLARS ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.white }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
              The Foundation
            </span>
            <h2 className="text-3xl md:text-4xl font-medium mt-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
              Built on four pillars
            </h2>
            <p className="text-base mt-4 max-w-2xl mx-auto" style={{ color: C.textMid, fontFamily: 'DM Sans, sans-serif', lineHeight: 1.7 }}>
              Every devotional, game, exercise, and tool in Threefold Cord maps to one of these pillars — giving your growth real structure and direction.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            {PILLARS.map((p, i) => (
              <div key={i} className="rounded-2xl p-6 md:p-8 transition-all hover:-translate-y-1" style={{ background: p.bg, border: `1px solid ${p.color}15` }}>
                <div className="flex items-center gap-4 mb-3">
                  <Image src={p.icon} alt="" width={36} height={36} />
                  <h3 className="text-lg font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: p.color }}>{p.label}</h3>
                </div>
                <p className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.7 }}>{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ FEATURES ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.ivory }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
              Everything You Need
            </span>
            <h2 className="text-3xl md:text-4xl font-medium mt-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
              Tools for every season of marriage
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => (
              <div key={i} className="rounded-2xl p-6 transition-all hover:-translate-y-1" style={{ background: C.white, boxShadow: '0 2px 16px rgba(44,36,24,0.04)', border: `1px solid ${C.ivoryDark}` }}>
                <div className="flex items-center justify-between mb-4">
                  <Image src={f.icon} alt="" width={32} height={32} />
                  {f.free === true ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: C.greenBg, color: C.green }}>Free</span>
                  ) : f.free === false ? (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: C.goldSoft, color: '#8B6914' }}>Plus</span>
                  ) : (
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full uppercase tracking-wider" style={{ background: C.greenBg, color: C.green }}>{String(f.free)}</span>
                  )}
                </div>
                <h3 className="text-base font-semibold mb-1.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.textDark }}>{f.title}</h3>
                <p className="text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: C.textMid, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ PRICING ═══════════════════ */}
      <section id="founding" className="py-20 md:py-28 px-6" style={{ background: C.white }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
              Pricing
            </span>
            <h2 className="text-3xl md:text-4xl font-medium mt-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.3 }}>
              Invest in your marriage
            </h2>
            <p className="text-base mt-4 max-w-lg mx-auto" style={{ color: C.textMid, fontFamily: 'DM Sans, sans-serif' }}>
              Less than a coffee a week. More than most couples invest in a lifetime.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {/* FREE */}
            <div className="rounded-2xl p-7 flex flex-col" style={{ background: C.ivory, border: `1px solid ${C.ivoryDark}` }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif' }}>Covenant Preview</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}>Free</span>
              </div>
              <p className="text-xs mb-6" style={{ color: C.textMid }}>Forever. No credit card needed.</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {['Full Covenant Assessment', 'Daily Devotionals + Streaks', '2 Marriage Games', '2 Conflict Repair Tools', 'Couple Linking', 'Milestones & Badges', 'Push Notifications'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.textDark }}>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="block text-center py-3 rounded-xl text-sm font-semibold no-underline transition-all hover:-translate-y-0.5" style={{ background: C.ivoryDark, color: C.textDark, fontFamily: 'Source Sans 3, sans-serif' }}>
                Start Free
              </Link>
            </div>

            {/* FOUNDING MEMBER — highlighted */}
            <div className="rounded-2xl p-7 flex flex-col relative" style={{ background: C.navy, border: `2px solid ${C.gold}`, boxShadow: '0 8px 40px rgba(199,162,58,0.15)' }}>
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy }}>
                Limited · Founding Member
              </div>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2 mt-2" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif' }}>Lifetime Access</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.ivory }}>£59.99</span>
                <span className="text-sm" style={{ color: C.muted }}>one-time</span>
              </div>
              <p className="text-xs mb-6" style={{ color: C.muted }}>First 500 couples only. Never pay again.</p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {['Everything in Free, plus:', 'All Marriage Games (5+)', 'All Conflict Repair Tools', '60-Day Threefold Reset', 'Couple Exercises Library', 'Weekly Check-ins', 'Love Notes', 'Pillar Analytics', 'Founding Member Badge ✦', 'Lifetime access — forever'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.ivory }}>
                    <span style={{ color: C.gold, fontWeight: 700, fontSize: 14 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?plan=founding" className="block text-center py-3.5 rounded-xl text-sm font-semibold no-underline uppercase tracking-wider transition-all hover:-translate-y-0.5" style={{ background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy, fontFamily: 'Source Sans 3, sans-serif', boxShadow: '0 4px 16px rgba(199,162,58,0.25)', letterSpacing: '0.08em' }}>
                Claim Your Spot
              </Link>
            </div>

            {/* PLUS */}
            <div className="rounded-2xl p-7 flex flex-col" style={{ background: C.ivory, border: `1px solid ${C.ivoryDark}` }}>
              <div className="text-xs font-semibold uppercase tracking-widest mb-2" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif' }}>Covenant Plus</div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}>£4.99</span>
                <span className="text-sm" style={{ color: C.textMid }}>/month</span>
              </div>
              <p className="text-xs mb-6" style={{ color: C.textMid }}>or £34.99/year <span style={{ color: C.green, fontWeight: 600 }}>(save 42%)</span></p>
              <ul className="space-y-2.5 flex-1 mb-6">
                {['Everything in Free, plus:', 'All Marriage Games (5+)', 'All Conflict Repair Tools', '60-Day Threefold Reset', 'Couple Exercises Library', 'Weekly Check-ins', 'Love Notes', 'Pillar Analytics Over Time'].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.textDark }}>
                    <span style={{ color: C.green, fontWeight: 700, fontSize: 14 }}>✓</span> {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth?plan=plus" className="block text-center py-3 rounded-xl text-sm font-semibold no-underline transition-all hover:-translate-y-0.5" style={{ background: C.ivoryDark, color: C.textDark, fontFamily: 'Source Sans 3, sans-serif' }}>
                Upgrade to Plus
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOR CHURCHES ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.navy }}>
        <div className="max-w-4xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
                For Churches
              </span>
              <h2 className="text-3xl md:text-4xl font-medium mt-4 mb-6" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.ivory, lineHeight: 1.3 }}>
                See how your congregation&apos;s marriages are really doing
              </h2>
              <p className="text-base mb-6" style={{ fontFamily: 'DM Sans, sans-serif', color: C.muted, lineHeight: 1.8 }}>
                The Church Ambassador Dashboard gives pastors and marriage ministry leaders anonymised health metrics, event management, and resource sharing — completely free. Because healthy marriages build healthy churches.
              </p>
              <ul className="space-y-3 mb-8">
                {['Anonymised marriage health scores', 'Track engagement across your couples', 'Share resources and events', 'Identify when couples may need support', 'Completely free for churches'].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.ivory }}>
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: C.gold }} />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/auth" className="inline-block px-8 py-3.5 rounded-full text-sm font-semibold no-underline uppercase tracking-wider transition-all hover:-translate-y-0.5" style={{ fontFamily: 'Source Sans 3, sans-serif', border: `1.5px solid ${C.gold}50`, color: C.gold, letterSpacing: '0.1em' }}>
                Register Your Church
              </Link>
            </div>

            <div className="rounded-2xl p-6" style={{ background: C.navyMid, border: `1px solid ${C.gold}15` }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-4" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif' }}>
                Church Health Dashboard
              </div>
              {/* Mock dashboard metrics */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: 'Active Couples', value: '34', color: C.ivory },
                  { label: 'Avg Health Score', value: '3.8', color: C.green },
                  { label: 'Devotionals This Week', value: '127', color: C.gold },
                  { label: 'Couples in Reset', value: '6', color: C.purple },
                ].map((m, i) => (
                  <div key={i} className="rounded-xl p-3" style={{ background: `${C.navy}80` }}>
                    <div className="text-xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: m.color }}>{m.value}</div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: C.muted }}>{m.label}</div>
                  </div>
                ))}
              </div>
              {/* Mock pillar bars */}
              <div className="space-y-2">
                {[
                  { label: 'Covenant', width: '76%', color: '#D4B45A' },
                  { label: 'Emotional Safety', width: '62%', color: '#B39DDB' },
                  { label: 'Communication', width: '71%', color: '#64B5F6' },
                  { label: 'Spiritual', width: '83%', color: '#81C784' },
                ].map((bar, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-[10px] mb-0.5" style={{ color: C.muted, fontFamily: 'Source Sans 3, sans-serif' }}>
                      <span>{bar.label}</span>
                      <span>{bar.width.replace('%', '')}%</span>
                    </div>
                    <div className="h-2 rounded-full" style={{ background: `${C.navy}` }}>
                      <div className="h-full rounded-full" style={{ width: bar.width, background: bar.color, transition: 'width 1s ease' }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════ SCRIPTURE + FUTURE TESTIMONIALS ═══════════════════ */}
      <section className="py-20 md:py-28 px-6" style={{ background: C.ivory }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="w-16 h-px mx-auto mb-8" style={{ background: C.gold, opacity: 0.3 }} />
          <blockquote className="text-2xl md:text-3xl italic mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark, lineHeight: 1.5 }}>
            &ldquo;Though one may be overpowered, two can defend themselves. A cord of three strands is not quickly broken.&rdquo;
          </blockquote>
          <p className="text-sm font-semibold uppercase tracking-widest" style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', letterSpacing: '0.15em' }}>
            Ecclesiastes 4:12
          </p>
          <div className="w-16 h-px mx-auto mt-8 mb-12" style={{ background: C.gold, opacity: 0.3 }} />

          <p className="text-sm" style={{ color: C.textMid, fontFamily: 'DM Sans, sans-serif' }}>
            Testimonials coming soon from founding couples and partner churches.
          </p>
        </div>
      </section>

      {/* ═══════════════════ FINAL CTA ═══════════════════ */}
      <section className="py-20 md:py-28 px-6 relative overflow-hidden" style={{ background: C.navy }}>
        <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 50% 50%, rgba(199,162,58,0.06) 0%, transparent 60%)' }} />
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <ThreefoldLogo size={56} />
          <h2 className="text-3xl md:text-4xl font-medium mt-6 mb-4" style={{ fontFamily: 'Cormorant Garamond, serif', color: C.ivory, lineHeight: 1.3 }}>
            Your marriage deserves more than surviving
          </h2>
          <p className="text-base mb-10" style={{ fontFamily: 'DM Sans, sans-serif', color: C.muted, lineHeight: 1.8 }}>
            Start with the free Covenant Assessment. Discover your pathway. Build something unbreakable — together.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/auth" className="px-10 py-4 rounded-full text-sm font-semibold uppercase tracking-wider no-underline hover:-translate-y-0.5 transition-transform" style={{ fontFamily: 'Source Sans 3, sans-serif', background: `linear-gradient(135deg, ${C.gold}, ${C.goldDark})`, color: C.navy, boxShadow: '0 4px 24px rgba(199,162,58,0.3)', letterSpacing: '0.12em' }}>
              Start Free Today
            </Link>
            <a href="#founding" className="px-10 py-4 rounded-full text-sm font-semibold uppercase tracking-wider no-underline transition-all" style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.gold, border: `1.5px solid ${C.gold}40`, letterSpacing: '0.12em' }}>
              Founding Member — £59.99
            </a>
          </div>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="py-10 px-6 border-t" style={{ background: C.white, borderColor: C.ivoryDark }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ThreefoldLogo size={24} />
            <span className="text-xs font-semibold tracking-wider uppercase" style={{ fontFamily: 'Cinzel, serif', color: C.textMid }}>Threefold Cord</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/auth" className="text-xs no-underline" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif' }}>Sign In</Link>
            <span className="text-xs" style={{ color: C.ivoryDark }}>·</span>
            <Link href="/auth" className="text-xs no-underline" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif' }}>Get Started</Link>
            <span className="text-xs" style={{ color: C.ivoryDark }}>·</span>
            <span className="text-xs" style={{ color: C.textMid, fontFamily: 'Source Sans 3, sans-serif' }}>hello@threefoldcord.app</span>
          </div>
          <p className="text-[10px]" style={{ color: `${C.textMid}80` }}>
            © {new Date().getFullYear()} Threefold Cord. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
