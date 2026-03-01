'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import Link from 'next/link';
import { AdminCard } from '@/components/admin/AdminUI';
import { DevotionalsTab } from '@/components/admin/DevotionalsTab';
import { ResetTab } from '@/components/admin/ResetTab';
import { AssessmentTab, ExercisesTab, GamesTab, ConflictTab, MilestonesTab, UsersTab, ChurchesTab } from '@/components/admin/ContentTabs';

type Tab = 'overview' | 'devotionals' | 'reset' | 'assessment' | 'exercises' | 'games' | 'conflict' | 'milestones' | 'users' | 'churches';

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'overview', label: 'Overview', icon: '📊' },
  { key: 'devotionals', label: 'Devotionals', icon: '📖' },
  { key: 'reset', label: '60-Day Reset', icon: '🔄' },
  { key: 'assessment', label: 'Assessment', icon: '📋' },
  { key: 'exercises', label: 'Exercises', icon: '✏️' },
  { key: 'games', label: 'Games', icon: '🎲' },
  { key: 'conflict', label: 'Conflict Tools', icon: '🛠️' },
  { key: 'milestones', label: 'Milestones', icon: '🏆' },
  { key: 'users', label: 'Users', icon: '👥' },
  { key: 'churches', label: 'Churches', icon: '⛪' },
];

interface Stats {
  totalUsers: number;
  totalCouples: number;
  activeCouples: number;
  totalChurches: number;
  devotionalCount: number;
  resetDayCount: number;
  assessmentsTaken: number;
}

export default function AdminConsolePage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    checkAuth();
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail as Tab;
      if (detail) setTab(detail);
    };
    window.addEventListener('admin-nav', handler);
    return () => window.removeEventListener('admin-nav', handler);
  }, []);

  // Close sidebar when tab changes (mobile)
  useEffect(() => { setSidebarOpen(false); }, [tab]);

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { window.location.href = '/auth'; return; }
    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
    if (!profile || profile.role !== 'super_admin') { window.location.href = '/dashboard'; return; }
    setAuthorized(true);
    loadStats();
  }

  async function loadStats() {
    try {
      const { data, error } = await supabase.rpc('admin_get_stats');
      if (error) throw error;
      setStats(data as Stats);
    } catch (err) {
      console.error('Failed to load admin stats:', err);
      setStats({ totalUsers: 0, totalCouples: 0, activeCouples: 0, totalChurches: 0, devotionalCount: 0, resetDayCount: 0, assessmentsTaken: 0 });
    }
    setLoading(false);
  }

  if (!authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F4F1EA' }}>
        <div className="text-center">
          <div className="text-lg" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>Verifying access...</div>
        </div>
      </div>
    );
  }

  const currentTab = TABS.find(t => t.key === tab);

  return (
    <div className="min-h-screen" style={{ background: '#F4F1EA' }}>

      {/* ─── Mobile Top Bar ─── */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 py-3"
        style={{ background: '#0F1E2E' }}>
        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="w-10 h-10 flex items-center justify-center rounded-xl border-none cursor-pointer"
          style={{ background: '#1A2D40', color: '#F4F1EA', fontSize: 20 }}
          aria-label="Toggle menu"
        >
          {sidebarOpen ? '✕' : '☰'}
        </button>
        <div className="flex items-center gap-2">
          <CleaveLogo size={24} />
          <span className="text-sm font-semibold tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: '#F4F1EA' }}>
            ADMIN
          </span>
        </div>
        <div className="w-10" />
      </div>

      <div className="flex">
        {/* ─── Sidebar Overlay (mobile) ─── */}
        {sidebarOpen && (
          <div
            className="md:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ─── Sidebar ─── */}
        <aside
          className={`
            fixed md:sticky top-0 left-0 z-50 md:z-auto
            flex flex-col h-screen overflow-y-auto
            transition-transform duration-200 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
          `}
          style={{ width: 260, background: '#0F1E2E' }}
        >
          <div className="flex items-center justify-between px-4 py-5 border-b" style={{ borderColor: '#1A2D40' }}>
            <div className="flex items-center gap-3">
              <CleaveLogo size={28} />
              <span className="text-sm font-semibold tracking-wider" style={{ fontFamily: 'Cinzel, serif', color: '#F4F1EA' }}>
                ADMIN
              </span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg border-none cursor-pointer"
              style={{ background: '#1A2D40', color: '#8A9BAA', fontSize: 16 }}
            >
              ✕
            </button>
          </div>

          <nav className="flex-1 px-3 py-3 space-y-0.5">
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className="w-full flex items-center gap-3 px-3 py-3 rounded-xl border-none cursor-pointer text-left"
                style={{
                  background: tab === t.key ? '#1A2D40' : 'transparent',
                  color: tab === t.key ? '#F4F1EA' : '#8A9BAA',
                  fontFamily: 'DM Sans, sans-serif',
                  fontSize: 14,
                  fontWeight: tab === t.key ? 600 : 400,
                  transition: 'all 0.15s ease',
                }}
              >
                <span className="text-lg flex-shrink-0">{t.icon}</span>
                {t.label}
              </button>
            ))}
          </nav>

          <div className="px-3 pb-4 border-t pt-3" style={{ borderColor: '#1A2D40' }}>
            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2.5 rounded-xl no-underline hover:opacity-80" style={{ color: '#5A6B7A', fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>
              ← Back to app
            </Link>
          </div>
        </aside>

        {/* ─── Main Content ─── */}
        <main className="flex-1 min-w-0 p-4 md:p-6 overflow-x-hidden">
          <div className="md:hidden flex items-center gap-2 mb-4">
            <span className="text-lg">{currentTab?.icon}</span>
            <h2 className="text-base font-semibold m-0" style={{ fontFamily: 'DM Sans, sans-serif', color: '#0F1E2E' }}>
              {currentTab?.label}
            </h2>
          </div>

          <div className="max-w-5xl mx-auto">
            {tab === 'overview' && <OverviewTab stats={stats} loading={loading} />}
            {tab === 'devotionals' && <DevotionalsTab />}
            {tab === 'reset' && <ResetTab />}
            {tab === 'assessment' && <AssessmentTab />}
            {tab === 'exercises' && <ExercisesTab />}
            {tab === 'games' && <GamesTab />}
            {tab === 'conflict' && <ConflictTab />}
            {tab === 'milestones' && <MilestonesTab />}
            {tab === 'users' && <UsersTab />}
            {tab === 'churches' && <ChurchesTab />}
          </div>
        </main>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// OVERVIEW TAB
// ═══════════════════════════════════════
function OverviewTab({ stats, loading }: { stats: Stats | null; loading: boolean }) {
  if (loading || !stats) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading dashboard...</div>;

  const metrics = [
    { label: 'Total Users', value: stats.totalUsers, icon: '👤', color: '#1565C0' },
    { label: 'Total Couples', value: stats.totalCouples, icon: '💛', color: '#B8860B' },
    { label: 'Active Couples', value: stats.activeCouples, icon: '📈', color: '#5B8A3C' },
    { label: 'Churches', value: stats.totalChurches, icon: '⛪', color: '#5E35B1' },
    { label: 'Devotionals', value: stats.devotionalCount, icon: '📖', color: '#33691E' },
    { label: 'Reset Days', value: stats.resetDayCount, icon: '🔄', color: '#E65100' },
    { label: 'Assessments', value: stats.assessmentsTaken, icon: '📋', color: '#C44536' },
  ];

  return (
    <>
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl md:text-2xl font-medium mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#0F1E2E' }}>
          Welcome to the Admin Console
        </h1>
        <p className="text-sm" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>
          Manage all Cleave content, users, and churches from here.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4 mb-6 md:mb-8">
        {metrics.map((m) => (
          <AdminCard key={m.label}>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl flex items-center justify-center text-lg md:text-xl flex-shrink-0" style={{ background: `${m.color}12` }}>
                {m.icon}
              </div>
              <div className="min-w-0">
                <div className="text-xl md:text-2xl font-bold truncate" style={{ fontFamily: 'DM Sans, sans-serif', color: '#0F1E2E' }}>{m.value}</div>
                <div className="text-[11px] md:text-xs truncate" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>{m.label}</div>
              </div>
            </div>
          </AdminCard>
        ))}
      </div>

      <AdminCard>
        <h3 className="text-base font-medium mb-3" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#0F1E2E' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[
            { label: 'Add Devotional', desc: 'Create new daily content', icon: '📖', tab: 'devotionals' },
            { label: 'Edit Reset Day', desc: 'Update programme content', icon: '🔄', tab: 'reset' },
            { label: 'New Game', desc: 'Add a marriage game', icon: '🎲', tab: 'games' },
            { label: 'New Exercise', desc: 'Create couple exercise', icon: '✏️', tab: 'exercises' },
            { label: 'View Users', desc: 'Browse all users', icon: '👥', tab: 'users' },
            { label: 'New Conflict Tool', desc: 'Add repair tool', icon: '🛠️', tab: 'conflict' },
          ].map((a) => (
            <button
              key={a.label}
              onClick={() => {
                const event = new CustomEvent('admin-nav', { detail: a.tab });
                window.dispatchEvent(event);
              }}
              className="p-3 md:p-4 rounded-xl border cursor-pointer text-left"
              style={{ background: '#FAF8F4', borderColor: '#E0DCD4', fontFamily: 'DM Sans, sans-serif', transition: 'all 0.15s ease' }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#C7A23A'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.borderColor = '#E0DCD4'; }}
            >
              <span className="text-lg md:text-xl mb-1 block">{a.icon}</span>
              <div className="text-xs md:text-sm font-semibold" style={{ color: '#0F1E2E' }}>{a.label}</div>
              <div className="text-[11px] md:text-xs mt-0.5 hidden sm:block" style={{ color: '#8A9BAA' }}>{a.desc}</div>
            </button>
          ))}
        </div>
      </AdminCard>
    </>
  );
}
