'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';
import Link from 'next/link';
import Image from 'next/image';

interface Profile {
  id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  streak_count: number;
  streak_last_date: string | null;
  couple_id: string | null;
  partner_id: string | null;
  onboarding_completed: boolean;
}

interface PartnerInfo {
  id: string;
  first_name: string | null;
  last_name: string | null;
  streak_count: number;
  last_active_at: string | null;
}

interface Couple {
  id: string;
  spouse_1_id: string;
  spouse_2_id: string | null;
  status: string;
  tier: string | null;
  wedding_date: string | null;
  reset_started_at: string | null;
  reset_phase: number | null;
  subscription_status: string;
}

interface Assessment {
  id: string;
  score_covenant: number;
  score_emotional_safety: number;
  score_communication: number;
  score_spiritual: number;
  score_overall: number;
  tier: string;
  completed_at: string;
}

interface Devotional {
  id: string;
  title: string;
  pillar: string;
  scripture_reference: string;
}

interface Milestone {
  milestone_id: string;
  unlocked_at: string;
  seen: boolean;
  milestones: {
    title: string;
    icon: string;
    description: string;
    category: string;
  };
}

interface SpouseInvitation {
  id: string;
  invitee_email: string;
  invitee_name: string | null;
  status: string;
}

const PILLAR_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '/icons/pillar-covenant.png', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, icon: '/icons/pillar-emotional-safety.png', label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, icon: '/icons/pillar-communication.png', label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '/icons/pillar-spiritual.png', label: 'Spiritual' },
};

const TIER_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  strengthen: { color: t.green, bg: t.greenBg, label: 'Strengthen' },
  repair: { color: t.textLink, bg: t.goldBg, label: 'Repair' },
  restore: { color: t.red, bg: t.redBg, label: 'Restore' },
};

export default function DashboardPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<PartnerInfo | null>(null);
  const [couple, setCouple] = useState<Couple | null>(null);
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [todayDevotional, setTodayDevotional] = useState<Devotional | null>(null);
  const [devotionalDone, setDevotionalDone] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [invitation, setInvitation] = useState<SpouseInvitation | null>(null);
  const [devotionalCount, setDevotionalCount] = useState(0);
  const [isAmbassador, setIsAmbassador] = useState(false);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadDashboard();
  }, []);

  useEffect(() => {
    if (!loading) setTimeout(() => setVisible(true), 100);
  }, [loading]);

  async function loadDashboard() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: prof } = await supabase.from('profiles').select('*').eq('id', user.id).single();
    if (prof) {
      setProfile(prof);
      if (prof.partner_id) {
        const { data: part } = await supabase.from('profiles').select('id, first_name, last_name, streak_count, last_active_at').eq('id', prof.partner_id).single();
        if (part) setPartner(part);
      }
      if (prof.couple_id) {
        const { data: coup } = await supabase.from('couples').select('*').eq('id', prof.couple_id).single();
        if (coup) setCouple(coup);
      }
      const { data: assess } = await supabase.from('assessments').select('*').eq('profile_id', user.id).eq('status', 'completed').order('completed_at', { ascending: false }).limit(1).maybeSingle();
      if (assess) setAssessment(assess);
      const { data: inv } = await supabase.from('spouse_invitations').select('*').eq('inviter_id', user.id).eq('status', 'pending').limit(1).maybeSingle();
      if (inv) setInvitation(inv);
      const { data: miles } = await supabase.from('user_milestones').select('*, milestones(*)').eq('profile_id', user.id).order('unlocked_at', { ascending: false }).limit(5);
      if (miles) setMilestones(miles);
      const { count } = await supabase.from('devotional_completions').select('*', { count: 'exact', head: true }).eq('profile_id', user.id);
      setDevotionalCount(count || 0);
      const { data: amb } = await supabase.from('church_ambassadors').select('id').eq('profile_id', user.id).limit(1).maybeSingle();
      setIsAmbassador(!!amb);
    }

    const today = new Date().toISOString().split('T')[0];
    const { data: dev } = await supabase.from('devotionals').select('*').eq('publish_date', today).eq('is_active', true).maybeSingle();
    if (dev) {
      setTodayDevotional(dev);
      const { data: comp } = await supabase.from('devotional_completions').select('id').eq('profile_id', user.id).eq('devotional_id', dev.id).maybeSingle();
      setDevotionalDone(!!comp);
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <div className="text-center">
          <ThreefoldLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading your dashboard...
          </p>
        </div>
      </div>
    );
  }

  const streakAlive = profile?.streak_last_date === new Date().toISOString().split('T')[0] ||
    profile?.streak_last_date === new Date(Date.now() - 86400000).toISOString().split('T')[0];

  const greetingHour = new Date().getHours();
  const greeting = greetingHour < 12 ? 'Good morning' : greetingHour < 18 ? 'Good afternoon' : 'Good evening';

  const tierKey = assessment?.tier || couple?.tier || 'strengthen';
  const tier = TIER_CONFIG[tierKey] || TIER_CONFIG.strengthen;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-2xl mx-auto transition-all duration-700"
        style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <ThreefoldLogo size={32} />
            <div>
              <h1 className="text-xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                {greeting}, {profile?.first_name || 'Friend'}
              </h1>
              <p className="text-xs m-0 mt-0.5" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                Your covenant journey
              </p>
            </div>
          </div>
          <ThemeToggle size="sm" />
        </div>

        {/* Streak & Stats Bar */}
        <div className="rounded-2xl p-5 mb-4 flex items-center justify-between" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="flex items-center gap-1.5">
                {(profile?.streak_count || 0) > 0 && streakAlive ? (
                  <Image src="/icons/icon-flame.png" alt="" width={22} height={22} />
                ) : (
                  <span className="text-lg">💤</span>
                )}
                <span className="text-2xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: (profile?.streak_count || 0) > 0 && streakAlive ? t.textLink : t.textMuted }}>
                  {profile?.streak_count || 0}
                </span>
              </div>
              <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>day streak</span>
            </div>

            <div style={{ width: 1, height: 32, background: t.border }} />

            <div className="text-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{devotionalCount}</span>
              <br />
              <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>devotionals</span>
            </div>

            <div style={{ width: 1, height: 32, background: t.border }} />

            <div className="text-center">
              <span className="text-2xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{milestones.length}</span>
              <br />
              <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>milestones</span>
            </div>
          </div>

          {(assessment?.tier || couple?.tier) && (
            <div className="flex items-center gap-2 px-3.5 py-2 rounded-xl" style={{ background: tier.bg, border: `1px solid ${tier.color}30` }}>
              <div>
                <div className="text-xs" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Pathway</div>
                <div className="text-sm font-bold" style={{ color: tier.color, fontFamily: 'Source Sans 3, sans-serif' }}>{tier.label}</div>
              </div>
            </div>
          )}
        </div>

        {/* Spouse Status */}
        {!partner && invitation && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1px solid ${t.textLink}20` }}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Image src="/icons/icon-envelope.png" alt="" width={24} height={24} />
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                    Invitation sent to {invitation.invitee_name || invitation.invitee_email}
                  </div>
                  <div className="text-xs" style={{ color: t.textMuted }}>Waiting for them to join — the journey is better together</div>
                </div>
              </div>
              <span className="text-xs px-3 py-1 rounded-full" style={{ background: t.goldBg, color: t.textLink, fontWeight: 600, fontFamily: 'Source Sans 3, sans-serif' }}>Pending</span>
            </div>
          </div>
        )}

        {partner && (
          <Link href="/couple" className="block no-underline">
            <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1px solid ${t.green}20` }}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/icons/icon-heart.png" alt="" width={24} height={24} />
                  <div>
                    <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Linked with {partner.first_name}</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>{partner.streak_count > 0 ? `On a ${partner.streak_count}-day streak too` : 'Encourage them to start their streak'}</div>
                  </div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.greenBg, color: t.green }}>Open →</span>
              </div>
            </div>
          </Link>
        )}

        {/* Today's Devotional */}
        <Link href="/devotional" className="block no-underline">
          <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: todayDevotional ? PILLAR_STYLES[todayDevotional.pillar]?.bg || t.goldBg : t.bgAccent }}>
                  {todayDevotional ? (
                    <Image src={PILLAR_STYLES[todayDevotional.pillar]?.icon || '/icons/icon-book.png'} alt="" width={28} height={28} />
                  ) : (
                    <Image src="/icons/icon-book.png" alt="" width={28} height={28} />
                  )}
                </div>
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Today&apos;s Covenant Moment</div>
                  <div className="text-base font-medium" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>{todayDevotional?.title || 'No devotional today'}</div>
                  {todayDevotional && (
                    <div className="text-xs mt-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>{todayDevotional.scripture_reference}</div>
                  )}
                </div>
              </div>
              <div>
                {devotionalDone ? (
                  <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.greenBg, color: t.green }}>✓ Done</span>
                ) : todayDevotional ? (
                  <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.goldBg, color: t.textLink }}>Read →</span>
                ) : null}
              </div>
            </div>
          </div>
        </Link>

        {/* Assessment Card */}
        {assessment ? (
          <div className="rounded-2xl p-5 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="flex items-center justify-between mb-4">
              <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Your Four Pillars</div>
              <div className="text-lg font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: assessment.score_overall >= 3.5 ? t.green : assessment.score_overall >= 2.5 ? t.textLink : t.red }}>
                {assessment.score_overall.toFixed(1)}
              </div>
            </div>
            <div className="space-y-2.5">
              {[
                { key: 'covenant', score: assessment.score_covenant },
                { key: 'emotional_safety', score: assessment.score_emotional_safety },
                { key: 'communication', score: assessment.score_communication },
                { key: 'spiritual', score: assessment.score_spiritual },
              ].map((p) => {
                const style = PILLAR_STYLES[p.key];
                const color = p.score >= 3.5 ? t.green : p.score >= 2.5 ? t.textLink : t.red;
                return (
                  <div key={p.key} className="flex items-center gap-3">
                    <Image src={style.icon} alt="" width={20} height={20} />
                    <span className="text-xs w-28 flex-shrink-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary }}>{style.label}</span>
                    <div className="flex-1 h-2.5 rounded-full" style={{ background: t.border }}>
                      <div className="h-full rounded-full" style={{ width: `${(p.score / 5) * 100}%`, background: color, transition: 'width 1s ease' }} />
                    </div>
                    <span className="text-xs font-bold w-8 text-right" style={{ fontFamily: 'Source Sans 3, sans-serif', color }}>{p.score.toFixed(1)}</span>
                  </div>
                );
              })}
            </div>
            <Link href="/assessment" className="block mt-4 text-center">
              <span className="text-xs font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>Retake Assessment →</span>
            </Link>
          </div>
        ) : (
          <Link href="/assessment" className="block no-underline">
            <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: t.goldBg }}>
                  <Image src="/icons/icon-clipboard.png" alt="" width={28} height={28} />
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Take Your Covenant Assessment</div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>5 minutes · Discover your pathway (Strengthen, Repair, or Restore)</div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold ml-auto" style={{ background: t.goldBg, color: t.textLink }}>Start →</span>
              </div>
            </div>
          </Link>
        )}

        {/* Milestones */}
        {milestones.length > 0 && (
          <div className="rounded-2xl p-5 mb-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Recent Milestones</div>
            <div className="flex gap-3 overflow-x-auto pb-1">
              {milestones.map((m) => (
                <div key={m.milestone_id} className="flex-shrink-0 w-24 text-center p-3 rounded-xl" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                  <div className="text-2xl mb-1">{m.milestones.icon}</div>
                  <div className="text-xs font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{m.milestones.title}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 60-Day Reset */}
        <Link href="/reset" className="block no-underline">
          <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1px solid ${t.textLink}20` }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `linear-gradient(135deg, ${t.goldBg}, ${t.pillarSafetyBg})` }}>
                <Image src="/icons/icon-reset.png" alt="" width={28} height={28} />
              </div>
              <div className="flex-1">
                <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>60-Day Threefold Reset</div>
                <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>Structured transformation · 4 phases · Teaching, exercises & couple activities</div>
              </div>
              <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.goldBg, color: t.textLink }}>Explore →</span>
            </div>
          </div>
        </Link>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
            { href: '/journal', emoji: '📔', label: 'Our Journal', sub: 'Shared diary' },
            { href: '/couple', emoji: '💑', label: 'Couple', sub: 'Partnership' },
            { href: '/assessment', emoji: '📋', label: 'Assessment', sub: 'Check your pillars' },
            { href: '/roadmap', emoji: '🗺️', label: 'Roadmap', sub: "What's coming" },
          ].map(item => (
            <Link key={item.href} href={item.href} className="no-underline">
              <div className="rounded-2xl p-4 text-center cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-2xl block">{item.emoji}</span>
                <div className="text-sm font-semibold mt-1.5" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{item.label}</div>
                <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{item.sub}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Church Ambassador */}
        {isAmbassador && (
          <Link href="/church" className="block no-underline">
            <div className="rounded-2xl p-5 mb-4 cursor-pointer transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1px solid ${t.pillarSafetyText}20` }}>
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: t.pillarSafetyBg }}>
                  <Image src="/icons/icon-church.png" alt="" width={28} height={28} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Church Dashboard</div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>View anonymised health metrics, manage events & resources</div>
                </div>
                <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ background: t.pillarSafetyBg, color: t.pillarSafetyText }}>Open →</span>
              </div>
            </div>
          </Link>
        )}

        {/* Scripture footer */}
        <div className="text-center py-6">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>&ldquo;A cord of three strands is not quickly broken.&rdquo;</p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
        </div>
      </div>
    </div>
  );
}
