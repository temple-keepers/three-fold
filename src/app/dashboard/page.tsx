'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { DashboardSkeleton } from '@/components/ui/Skeleton';
import { t } from '@/lib/tokens';
import Link from 'next/link';
import Image from 'next/image';

const PILLAR: Record<string,{bg:string;text:string;icon:string;label:string}> = {
  covenant:         {bg:t.pillarCovenantBg, text:t.pillarCovenantText, icon:'/icons/pillar-covenant.png', label:'Covenant'},
  emotional_safety: {bg:t.pillarSafetyBg,   text:t.pillarSafetyText,   icon:'/icons/pillar-emotional-safety.png', label:'Safety'},
  communication:    {bg:t.pillarCommBg,      text:t.pillarCommText,      icon:'/icons/pillar-communication.png', label:'Communication'},
  spiritual:        {bg:t.pillarSpiritualBg, text:t.pillarSpiritualText, icon:'/icons/pillar-spiritual.png', label:'Spiritual'},
};

const NUDGE_ICON: Record<string,string> = { action:'💪', challenge:'🏔️', fun:'🎮', gratitude:'🙏', prayer:'🕊️', question:'💬' };

interface Profile { id:string; first_name:string|null; streak_count:number; streak_last_date:string|null; current_devotional_day:number; longest_streak:number; }
interface Devotional { id:string; day_number:number; title:string; pillar:string; scripture_reference:string; }
interface LoveNudge { id:string; nudge_text:string; category:string; }
interface BibleReading { book:string; scripture_reference:string; }

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile|null>(null);
  const [todayDev, setTodayDev] = useState<Devotional|null>(null);
  const [devDone, setDevDone] = useState(false);
  const [devCount, setDevCount] = useState(0);
  const [nudge, setNudge] = useState<LoveNudge|null>(null);
  const [booksRead, setBooksRead] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [vis, setVis] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { load(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVis(true), 80); }, [loading]);

  async function load() {
    setError(null);
    try {
    const { data:{ user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Profile first (needed for subsequent queries)
    const { data: prof } = await supabase.from('profiles').select('id,first_name,streak_count,streak_last_date,current_devotional_day,longest_streak').eq('id',user.id).single();
    if (!prof) return;
    setProfile(prof);

    // Run remaining queries in parallel
    const day = prof.current_devotional_day || 1;
    const todaySeed = new Date().toISOString().split('T')[0].replace(/-/g,'');
    const nudgeIdx = parseInt(todaySeed) % 47;

    const [devResult, countResult, booksResult, nudgeResult] = await Promise.all([
      supabase.from('devotionals').select('id,day_number,title,pillar,scripture_reference').eq('day_number',day).eq('is_active',true).maybeSingle(),
      supabase.from('devotional_completions').select('*',{count:'exact',head:true}).eq('profile_id',user.id),
      supabase.from('bible_readings').select('book').eq('profile_id',user.id),
      supabase.from('love_nudges').select('id,nudge_text,category').eq('is_active',true).order('created_at').range(nudgeIdx, nudgeIdx),
    ]);

    // Process devotional
    if (devResult.data) {
      setTodayDev(devResult.data);
      const { data: comp } = await supabase.from('devotional_completions').select('id').eq('profile_id',user.id).eq('devotional_id',devResult.data.id).maybeSingle();
      setDevDone(!!comp);
    }

    setDevCount(countResult.count || 0);
    setBooksRead(new Set((booksResult.data||[]).map(r => r.book)).size);
    if (nudgeResult.data?.[0]) setNudge(nudgeResult.data[0]);

    setLoading(false);
    } catch (err) {
      console.error('Failed to load dashboard:', err);
      setError('Failed to load your dashboard. Please check your connection.');
      setLoading(false);
    }
  }

  // DST-safe streak check using date-fns
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,'0')}-${String(yesterday.getDate()).padStart(2,'0')}`;
  const streakAlive = profile?.streak_last_date === todayStr || profile?.streak_last_date === yesterdayStr;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  const progressPct = Math.round((devCount / 90) * 100);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="text-center max-w-sm">
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-medium mb-2 m-0" style={{ fontFamily:'Cormorant Garamond,serif', color: t.textPrimary }}>
            Connection Issue
          </h2>
          <p className="text-sm mb-6 m-0" style={{ fontFamily:'Source Sans 3,sans-serif', color: t.textMuted, lineHeight: 1.6 }}>
            {error}
          </p>
          <button
            onClick={() => { setLoading(true); load(); }}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{ fontFamily:'Source Sans 3,sans-serif', background:'linear-gradient(135deg, #B8860B, #8B6914)' }}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div className="max-w-lg mx-auto px-4 py-5" style={{ opacity:vis?1:0, transform:vis?'none':'translateY(12px)', transition:'all .6s ease' }}>

        {/* ─── HEADER ─── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <CleaveLogo size={28} />
            <div>
              <h1 className="text-lg font-medium m-0" style={{ fontFamily:'Cormorant Garamond,serif', color:t.textPrimary }}>
                {greeting}, {profile?.first_name || 'Friend'}
              </h1>
              <p className="text-[11px] m-0 mt-0.5" style={{ color:t.textMuted, fontFamily:'Source Sans 3,sans-serif' }}>
                Day {profile?.current_devotional_day || 1} of your covenant journey
              </p>
            </div>
          </div>
          <ThemeToggle size="sm" />
        </div>

        {/* ─── STREAK BAR ─── */}
        <div className="rounded-2xl p-4 mb-4" style={{ background:t.bgCard, boxShadow:t.shadowCard }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                {(profile?.streak_count||0) > 0 && streakAlive ? (
                  <Image src="/icons/icon-flame.png" alt="" width={20} height={20} />
                ) : ( <span className="text-base">💤</span> )}
                <span className="text-xl font-bold" style={{ fontFamily:'Source Sans 3,sans-serif', color:(profile?.streak_count||0) > 0 && streakAlive ? t.textLink : t.textMuted }}>
                  {profile?.streak_count || 0}
                </span>
                <span className="text-xs" style={{ color:t.textMuted }}>day streak</span>
              </div>
              <div style={{ width:1, height:20, background:t.border }} />
              <div className="flex items-center gap-1.5">
                <span className="text-xs" style={{ color:t.textMuted }}>Best</span>
                <span className="text-sm font-bold" style={{ color:t.textSecondary }}>{Math.max(profile?.longest_streak||0, profile?.streak_count||0)}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: devDone ? t.greenBg : t.goldBg }}>
              <span className="text-xs font-bold" style={{ color: devDone ? t.green : t.textLink, fontFamily:'Source Sans 3,sans-serif' }}>
                {devDone ? '✓ Done today' : 'Not yet'}
              </span>
            </div>
          </div>
        </div>

        {/* ─── TODAY'S DEVOTIONAL ─── */}
        {!devDone ? (
          <Link href="/devotional" className="block no-underline">
            <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background:t.bgCard, boxShadow:t.shadowCard, border:`1.5px solid ${t.textLink}30` }}>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: todayDev ? PILLAR[todayDev.pillar]?.bg || t.goldBg : t.bgAccent }}>
                  {todayDev && <Image src={PILLAR[todayDev.pillar]?.icon || '/icons/icon-book.png'} alt="" width={28} height={28} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color:t.textLink, fontFamily:'Source Sans 3,sans-serif' }}>
                    Today&apos;s Devotional
                  </div>
                  <div className="text-base font-medium" style={{ fontFamily:'Cormorant Garamond,serif', color:t.textPrimary }}>
                    {todayDev?.title || 'Start your journey'}
                  </div>
                  <div className="text-xs mt-1" style={{ color:t.textMuted }}>{todayDev?.scripture_reference} · Day {todayDev?.day_number}</div>
                </div>
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center" style={{ background:'linear-gradient(135deg,#B8860B,#8B6914)' }}>
                  <span className="text-white text-lg">→</span>
                </div>
              </div>
            </div>
          </Link>
        ) : (
          <div className="rounded-2xl p-4 mb-4" style={{ background:t.bgCard, boxShadow:t.shadowCard, border:`1px solid ${t.green}30` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:t.greenBg }}>
                  <span className="text-lg">✓</span>
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color:t.textPrimary, fontFamily:'Source Sans 3,sans-serif' }}>Devotional complete</div>
                  <div className="text-xs" style={{ color:t.textMuted }}>Day {todayDev?.day_number} · {todayDev?.title}</div>
                </div>
              </div>
              <Link href="/devotional" className="no-underline">
                <span className="text-xs font-semibold" style={{ color:t.textLink }}>Read again →</span>
              </Link>
            </div>
          </div>
        )}

        {/* ─── DAILY TOGETHER ─── */}
        <Link href="/together" className="block no-underline">
          <div className="rounded-2xl p-4 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background:t.bgCard, boxShadow:t.shadowCard, border:`1.5px solid ${t.pillarSafetyText}20` }}>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background:t.pillarSafetyBg }}>
                💬
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-0.5" style={{ color:t.pillarSafetyText, fontFamily:'Source Sans 3,sans-serif' }}>
                  Daily Together
                </div>
                <div className="text-sm font-medium" style={{ fontFamily:'Source Sans 3,sans-serif', color:t.textPrimary }}>
                  Answer today&apos;s couple question
                </div>
                <div className="text-xs mt-0.5" style={{ color:t.textMuted }}>Both answer privately, then reveal together</div>
              </div>
              <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center" style={{ background:t.pillarSafetyBg }}>
                <span style={{ color:t.pillarSafetyText, fontSize:14 }}>→</span>
              </div>
            </div>
          </div>
        </Link>

        {/* ─── LOVE NUDGE ─── */}
        {nudge && (
          <div className="rounded-2xl p-4 mb-4" style={{ background:t.bgCard, boxShadow:t.shadowCard }}>
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg" style={{ background:t.goldBg }}>
                {NUDGE_ICON[nudge.category] || '💡'}
              </div>
              <div className="flex-1">
                <div className="text-[10px] font-bold uppercase tracking-widest mb-1.5" style={{ color:t.textLink, fontFamily:'Source Sans 3,sans-serif' }}>
                  Today&apos;s Love Nudge
                </div>
                <p className="text-sm m-0 leading-relaxed" style={{ fontFamily:'Source Sans 3,sans-serif', color:t.textPrimary }}>
                  {nudge.nudge_text}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* ─── JOURNEY SNAPSHOT ─── */}
        <Link href="/journey" className="block no-underline">
          <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background:t.bgCard, boxShadow:t.shadowCard }}>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">📖</span>
                <span className="text-sm font-semibold" style={{ color:t.textPrimary, fontFamily:'Source Sans 3,sans-serif' }}>Your Journey</span>
              </div>
              <span className="text-xs font-semibold" style={{ color:t.textLink }}>View map →</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full h-2.5 rounded-full" style={{ background:t.border }}>
                  <div className="h-full rounded-full" style={{ width:`${progressPct}%`, background:'linear-gradient(135deg,#B8860B,#8B6914)', transition:'width 1s ease' }} />
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px]" style={{ color:t.textMuted }}>{devCount} of 90 days</span>
                  <span className="text-[10px] font-bold" style={{ color:t.textLink }}>{progressPct}%</span>
                </div>
              </div>
              <div className="text-center pl-3" style={{ borderLeft:`1px solid ${t.border}` }}>
                <div className="text-lg font-bold" style={{ fontFamily:'Cormorant Garamond,serif', color:t.textLink }}>{booksRead}</div>
                <div className="text-[10px]" style={{ color:t.textMuted }}>books</div>
              </div>
            </div>
          </div>
        </Link>

        {/* ─── FOOTER ─── */}
        <div className="text-center py-6">
          <p className="text-sm italic m-0" style={{ fontFamily:'Cormorant Garamond,serif', color:t.textMuted }}>
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-[10px] m-0 mt-1" style={{ color:t.textLight }}>Ecclesiastes 4:12</p>
        </div>

      </div>
    </div>
  );
}
