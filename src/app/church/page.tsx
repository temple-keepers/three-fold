'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';
import Link from 'next/link';

/* ═══════════ Constants ═══════════ */

const PILLAR_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  covenant:         { bg: t.pillarCovenantBg,  text: t.pillarCovenantText,  icon: '🤝', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg,    text: t.pillarSafetyText,    icon: '🛡️', label: 'Emotional Safety' },
  communication:    { bg: t.pillarCommBg,       text: t.pillarCommText,      icon: '💬', label: 'Communication' },
  spiritual:        { bg: t.pillarSpiritualBg,  text: t.pillarSpiritualText, icon: '✝️', label: 'Spiritual' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  marriage_course:     '💒 Marriage Course',
  couples_night:       '🌙 Couples Night',
  retreat:             '⛺ Retreat',
  workshop:            '📚 Workshop',
  sermon_series:       '🎤 Sermon Series',
  counselling_session: '🤝 Counselling',
  prayer_night:        '🙏 Prayer Night',
  social:              '🎉 Social',
  other:               '📌 Event',
};

const ROLE_OPTIONS = [
  { value: 'pastor',           label: 'Pastor' },
  { value: 'marriage_ministry', label: 'Marriage Ministry Leader' },
  { value: 'elder',            label: 'Elder' },
  { value: 'other',            label: 'Other' },
];

type DashboardTab = 'overview' | 'events' | 'resources' | 'invite';

/* ═══════════ Helper ═══════════ */

function scoreColor(s: number): string {
  if (s >= 3.5) return t.green;
  if (s >= 2.5) return t.textLink;
  return t.red;
}

function scoreBg(s: number): string {
  if (s >= 3.5) return t.greenBg;
  if (s >= 2.5) return t.goldBg;
  return t.redBg;
}

/* ═══════════════════════════════════════════════════════════
   PATH A: Registration / Onboarding Screen
   ═══════════════════════════════════════════════════════════ */

function RegistrationScreen({ profile, onRegistered }: { profile: any; onRegistered: () => void }) {
  const [showForm, setShowForm] = useState(false);
  const [churchName, setChurchName] = useState('');
  const [denomination, setDenomination] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('United Kingdom');
  const [website, setWebsite] = useState('');
  const [role, setRole] = useState('pastor');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const supabase = createClient();

  async function handleSubmit() {
    if (!churchName.trim() || !city.trim() || !country.trim()) {
      setError('Please fill in all required fields.');
      return;
    }
    setSubmitting(true);
    setError('');

    try {
      // 1. Create the church record
      const { data: church, error: churchErr } = await supabase
        .from('churches')
        .insert({
          name: churchName.trim(),
          denomination: denomination.trim() || null,
          city: city.trim(),
          country: country.trim(),
          website: website.trim() || null,
          primary_admin_id: profile.id,
          license_tier: 'free',
          license_status: 'active',
          total_couples: 0,
          avg_health_score: 0,
        })
        .select('id')
        .single();

      if (churchErr || !church) {
        setError('Failed to create church. Please try again.');
        setSubmitting(false);
        return;
      }

      // 2. Create the church_ambassadors link
      const { error: ambErr } = await supabase
        .from('church_ambassadors')
        .insert({
          church_id: church.id,
          profile_id: profile.id,
          role: 'admin',
          status: 'active',
          certified_at: new Date().toISOString(),
        });

      if (ambErr) {
        setError('Church created but failed to link ambassador. Please contact support.');
        setSubmitting(false);
        return;
      }

      // 3. Update profile role to church_staff
      await supabase
        .from('profiles')
        .update({ role: 'church_staff' })
        .eq('id', profile.id);

      onRegistered();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <TopBar title="Church Ambassador" backHref="/dashboard" />

      <div className="max-w-md mx-auto px-4 pb-10">

        {/* Hero */}
        <div className="text-center pt-6 pb-4">
          <ThreefoldLogo size={56} />
          <h1
            className="text-2xl font-medium mt-4 mb-2"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
          >
            Church Ambassador Dashboard
          </h1>
          <p
            className="text-sm m-0"
            style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.7 }}
          >
            See how your congregation&apos;s marriages are really doing.
            Anonymised health metrics, event management, and resource sharing
            &mdash; completely free.
          </p>
        </div>

        {/* Benefits card */}
        <div
          className="rounded-2xl p-5 mb-4"
          style={{ background: t.bgCard, boxShadow: t.shadowCard }}
        >
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
          >
            What you get as an ambassador
          </div>
          {[
            { icon: '📊', text: 'Anonymised marriage health scores for your church' },
            { icon: '📈', text: 'Track engagement across your couples' },
            { icon: '📚', text: 'Share resources and events with your congregation' },
            { icon: '🔔', text: 'Identify when couples may need pastoral support' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-3 mb-3 last:mb-0">
              <span className="text-base flex-shrink-0 mt-0.5">{item.icon}</span>
              <span
                className="text-sm"
                style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.5 }}
              >
                {item.text}
              </span>
            </div>
          ))}
        </div>

        {/* Privacy note */}
        <div
          className="rounded-xl p-4 mb-4"
          style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}
        >
          <p
            className="text-xs m-0"
            style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}
          >
            🔒 <strong>All couple data is fully anonymised.</strong> You will never see individual names, scores, or private conversations. Couples always control their own data.
          </p>
        </div>

        {/* Register / Form */}
        {!showForm ? (
          <button
            onClick={() => setShowForm(true)}
            className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            }}
          >
            Register Your Church
          </button>
        ) : (
          <div
            className="rounded-2xl p-6"
            style={{ background: t.bgCard, boxShadow: t.shadowCard }}
          >
            <h2
              className="text-lg font-medium m-0 mb-4"
              style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
            >
              Register Your Church
            </h2>

            {error && (
              <div
                className="rounded-xl p-3 mb-3 text-xs"
                style={{ background: t.redBg, color: t.red, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                {error}
              </div>
            )}

            {/* Church name */}
            <div className="mb-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Church name *
              </label>
              <input
                type="text"
                value={churchName}
                onChange={e => setChurchName(e.target.value)}
                placeholder="e.g. Grace Community Church"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: `1.5px solid ${t.border}`,
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>

            {/* Denomination */}
            <div className="mb-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Denomination
              </label>
              <input
                type="text"
                value={denomination}
                onChange={e => setDenomination(e.target.value)}
                placeholder="e.g. Baptist, Anglican, Non-denominational"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: `1.5px solid ${t.border}`,
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>

            {/* City */}
            <div className="mb-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                City *
              </label>
              <input
                type="text"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="e.g. London"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: `1.5px solid ${t.border}`,
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>

            {/* Country */}
            <div className="mb-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Country *
              </label>
              <input
                type="text"
                value={country}
                onChange={e => setCountry(e.target.value)}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: `1.5px solid ${t.border}`,
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>

            {/* Website */}
            <div className="mb-3">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Website
              </label>
              <input
                type="url"
                value={website}
                onChange={e => setWebsite(e.target.value)}
                placeholder="https://www.yourchurch.org"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{
                  border: `1.5px solid ${t.border}`,
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: t.bgInput,
                  color: t.textPrimary,
                }}
              />
            </div>

            {/* Your role */}
            <div className="mb-5">
              <label
                className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Your role *
              </label>
              <div className="flex gap-2 flex-wrap">
                {ROLE_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setRole(opt.value)}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: role === opt.value ? t.goldBg : t.bgInput,
                      borderColor: role === opt.value ? t.textLink : t.border,
                      color: role === opt.value ? t.textPrimary : t.textMuted,
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer"
                style={{
                  background: 'transparent',
                  border: `1.5px solid ${t.border}`,
                  color: t.textSecondary,
                  fontFamily: 'Source Sans 3, sans-serif',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting || !churchName.trim() || !city.trim()}
                className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background:
                    churchName.trim() && city.trim()
                      ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                      : t.border,
                }}
              >
                {submitting ? 'Creating...' : 'Register Church'}
              </button>
            </div>
          </div>
        )}

        {/* Scripture */}
        <div className="text-center py-8">
          <p
            className="text-sm italic m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}
          >
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>
            Ecclesiastes 4:12
          </p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   PATH B: Ambassador Dashboard
   ═══════════════════════════════════════════════════════════ */

function AmbassadorDashboard({
  church,
  ambassador,
  initialSnapshot,
}: {
  church: any;
  ambassador: any;
  initialSnapshot: any;
}) {
  const [tab, setTab] = useState<DashboardTab>('overview');
  const [visible, setVisible] = useState(false);
  const [healthSnapshot, setHealthSnapshot] = useState<any>(initialSnapshot);

  // Events state
  const [events, setEvents] = useState<any[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('couples_night');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');
  const [eventSaving, setEventSaving] = useState(false);

  // Resources state
  const [resources, setResources] = useState<any[]>([]);
  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resUrl, setResUrl] = useState('');
  const [resDesc, setResDesc] = useState('');
  const [resSaving, setResSaving] = useState(false);

  // Invite state
  const [inviteCode, setInviteCode] = useState('');
  const [copied, setCopied] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    loadDashboardData();
    setTimeout(() => setVisible(true), 100);
  }, []);

  async function loadDashboardData() {
    if (!church?.id) return;

    // Load events
    const { data: evts } = await supabase
      .from('church_events')
      .select('*')
      .eq('church_id', church.id)
      .order('start_date', { ascending: true });
    if (evts) setEvents(evts);

    // Load resources
    const { data: res } = await supabase
      .from('church_resources')
      .select('*')
      .eq('church_id', church.id)
      .order('created_at', { ascending: false });
    if (res) setResources(res);

    // Generate invite code
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    setInviteCode(`${baseUrl}/join/${church.id}`);
  }

  async function createEvent() {
    if (!church || !eventTitle.trim() || !eventDate) return;
    setEventSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('church_events').insert({
      church_id: church.id,
      title: eventTitle.trim(),
      event_type: eventType,
      description: eventDesc.trim() || null,
      start_date: eventDate,
      location: eventLocation.trim() || null,
      created_by: user?.id,
    });
    setShowEventForm(false);
    setEventTitle('');
    setEventDesc('');
    setEventLocation('');
    setEventDate('');
    setEventSaving(false);
    loadDashboardData();
  }

  async function createResource() {
    if (!church || !resTitle.trim()) return;
    setResSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('church_resources').insert({
      church_id: church.id,
      title: resTitle.trim(),
      url: resUrl.trim() || null,
      content: resDesc.trim() || null,
      created_by: user?.id,
    });
    setShowResourceForm(false);
    setResTitle('');
    setResUrl('');
    setResDesc('');
    setResSaving(false);
    loadDashboardData();
  }

  async function copyInviteLink() {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const input = document.createElement('input');
      input.value = inviteCode;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  const h = healthSnapshot;
  const hasSnapshot = !!h;
  const totalTiered = (h?.couples_strengthen || 0) + (h?.couples_repair || 0) + (h?.couples_restore || 0);

  const TABS: { key: DashboardTab; label: string; icon: string }[] = [
    { key: 'overview',  label: 'Overview',  icon: '📊' },
    { key: 'events',    label: 'Events',    icon: '📅' },
    { key: 'resources', label: 'Resources', icon: '📚' },
    { key: 'invite',    label: 'Invite',    icon: '💌' },
  ];

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <TopBar
        title={church?.name || 'Church Dashboard'}
        subtitle={
          [church?.denomination, 'Marriage Ministry'].filter(Boolean).join(' · ')
        }
        backHref="/dashboard"
      />

      <div
        className="max-w-2xl mx-auto px-4 pb-10"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: 'all 0.6s ease',
        }}
      >
        {/* Tab navigation */}
        <div className="flex gap-1.5 mt-4 mb-4 overflow-x-auto pb-1">
          {TABS.map(tb => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                background: tab === tb.key ? t.goldBg : t.bgCard,
                borderColor: tab === tb.key ? t.textLink : t.border,
                color: tab === tb.key ? t.textPrimary : t.textMuted,
              }}
            >
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ═════════ OVERVIEW TAB ═════════ */}
        {tab === 'overview' && (
          <>
            {/* Key metrics */}
            <div className="grid grid-cols-2 gap-2.5 mb-3">
              {[
                {
                  label: 'Total Couples',
                  value: hasSnapshot ? (h.total_couples ?? 0) : '--',
                  icon: '💛',
                },
                {
                  label: 'Active This Week',
                  value: hasSnapshot ? (h.active_couples_this_week ?? 0) : '--',
                  icon: '📈',
                },
                {
                  label: 'Avg Health Score',
                  value: hasSnapshot && h.avg_overall_score
                    ? Number(h.avg_overall_score).toFixed(1)
                    : '--',
                  icon: '❤️',
                  colored: hasSnapshot && h.avg_overall_score
                    ? scoreColor(Number(h.avg_overall_score))
                    : undefined,
                  coloredBg: hasSnapshot && h.avg_overall_score
                    ? scoreBg(Number(h.avg_overall_score))
                    : undefined,
                },
                {
                  label: 'Average Streak',
                  value: hasSnapshot ? Math.round(h.avg_streak || 0) : '--',
                  icon: '🔥',
                },
              ].map(m => (
                <div
                  key={m.label}
                  className="rounded-2xl p-4 text-center"
                  style={{
                    background: (m as any).coloredBg || t.bgCard,
                    boxShadow: t.shadowCard,
                  }}
                >
                  <span className="text-lg">{m.icon}</span>
                  <div
                    className="text-2xl font-bold mt-1"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      color: (m as any).colored || t.textPrimary,
                    }}
                  >
                    {m.value}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                    {m.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Four Pillar Scores */}
            <div
              className="rounded-2xl p-5 mb-3"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div className="flex justify-between items-center mb-3">
                <div
                  className="text-xs font-semibold uppercase tracking-wider"
                  style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  Pillar Scores
                </div>
                {hasSnapshot && h.avg_overall_score ? (
                  <div
                    className="text-lg font-bold"
                    style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      color: scoreColor(Number(h.avg_overall_score)),
                    }}
                  >
                    {Number(h.avg_overall_score).toFixed(1)}/5
                  </div>
                ) : (
                  <div
                    className="text-sm"
                    style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted }}
                  >
                    --/5
                  </div>
                )}
              </div>

              {hasSnapshot && (h.avg_covenant_score || h.avg_emotional_safety_score || h.avg_communication_score || h.avg_spiritual_score) ? (
                [
                  { key: 'covenant',         score: h.avg_covenant_score },
                  { key: 'emotional_safety', score: h.avg_emotional_safety_score },
                  { key: 'communication',    score: h.avg_communication_score },
                  { key: 'spiritual',        score: h.avg_spiritual_score },
                ].map(p => {
                  const ps = PILLAR_STYLES[p.key];
                  const score = Number(p.score || 0);
                  return (
                    <div key={p.key} className="flex items-center gap-3 mb-2.5 last:mb-0">
                      <span className="text-sm w-5">{ps.icon}</span>
                      <span
                        className="text-xs w-28 flex-shrink-0"
                        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary }}
                      >
                        {ps.label}
                      </span>
                      <div
                        className="flex-1 h-2.5 rounded-full overflow-hidden"
                        style={{ background: t.border }}
                      >
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${(score / 5) * 100}%`,
                            background: scoreColor(score),
                          }}
                        />
                      </div>
                      <span
                        className="text-xs font-bold w-8 text-right"
                        style={{ color: scoreColor(score) }}
                      >
                        {score.toFixed(1)}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p
                    className="text-sm m-0"
                    style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                  >
                    Metrics will appear once your couples start using the app.
                  </p>
                </div>
              )}
            </div>

            {/* Pathway Distribution */}
            <div
              className="rounded-2xl p-5 mb-3"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Pathway Distribution (Anonymised)
              </div>
              {totalTiered > 0 ? (
                <>
                  <div className="flex h-8 rounded-full overflow-hidden mb-3">
                    {h.couples_strengthen > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          width: `${(h.couples_strengthen / totalTiered) * 100}%`,
                          background: '#5B8A3C',
                          minWidth: 28,
                        }}
                      >
                        {h.couples_strengthen}
                      </div>
                    )}
                    {h.couples_repair > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          width: `${(h.couples_repair / totalTiered) * 100}%`,
                          background: '#B8860B',
                          minWidth: 28,
                        }}
                      >
                        {h.couples_repair}
                      </div>
                    )}
                    {h.couples_restore > 0 && (
                      <div
                        className="flex items-center justify-center text-xs font-bold text-white"
                        style={{
                          width: `${(h.couples_restore / totalTiered) * 100}%`,
                          background: '#C44536',
                          minWidth: 28,
                        }}
                      >
                        {h.couples_restore}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-4 flex-wrap">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#5B8A3C' }} />
                      <span className="text-xs" style={{ color: t.textSecondary }}>
                        Strengthen: {h.couples_strengthen}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#B8860B' }} />
                      <span className="text-xs" style={{ color: t.textSecondary }}>
                        Repair: {h.couples_repair}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: '#C44536' }} />
                      <span className="text-xs" style={{ color: t.textSecondary }}>
                        Restore: {h.couples_restore}
                      </span>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-4">
                  <span className="text-2xl block mb-2">📊</span>
                  <p
                    className="text-sm m-0"
                    style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                  >
                    No assessment data yet. As couples complete their assessments, you&apos;ll see anonymised pathway distribution here.
                  </p>
                </div>
              )}
            </div>

            {/* Engagement metrics */}
            <div
              className="rounded-2xl p-5 mb-3"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                This Week&apos;s Engagement
              </div>
              {hasSnapshot ? (
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'Devotionals', value: h.devotionals_completed ?? 0, icon: '📖' },
                    { label: 'Exercises',   value: h.exercises_completed ?? 0,   icon: '✏️' },
                    { label: 'Check-Ins',   value: h.check_ins_completed ?? 0,   icon: '📋' },
                  ].map(m => (
                    <div
                      key={m.label}
                      className="text-center p-3 rounded-xl"
                      style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}
                    >
                      <span className="text-base">{m.icon}</span>
                      <div
                        className="text-xl font-bold mt-0.5"
                        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                      >
                        {m.value}
                      </div>
                      <div className="text-xs" style={{ color: t.textMuted }}>{m.label}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p
                    className="text-sm m-0"
                    style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                  >
                    Engagement data will appear as couples begin their journey.
                  </p>
                </div>
              )}
            </div>

            {/* Privacy notice */}
            <div
              className="rounded-xl p-4"
              style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}
            >
              <p
                className="text-xs m-0"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  color: t.textSecondary,
                  lineHeight: 1.6,
                }}
              >
                🔒 <strong>All data is anonymised.</strong> You can see aggregate trends but never individual couple details, scores, or private responses. Couples control their own data.
              </p>
            </div>
          </>
        )}

        {/* ═════════ EVENTS TAB ═════════ */}
        {tab === 'events' && (
          <>
            {showEventForm ? (
              <div
                className="rounded-2xl p-5 mb-3"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <h3
                  className="text-base font-semibold m-0 mb-3"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                >
                  Create Event
                </h3>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    value={eventTitle}
                    onChange={e => setEventTitle(e.target.value)}
                    placeholder="e.g. Couples Evening"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Type
                  </label>
                  <select
                    value={eventType}
                    onChange={e => setEventType(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  >
                    {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>{v}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Date & time *
                  </label>
                  <input
                    type="datetime-local"
                    value={eventDate}
                    onChange={e => setEventDate(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Location
                  </label>
                  <input
                    type="text"
                    value={eventLocation}
                    onChange={e => setEventLocation(e.target.value)}
                    placeholder="e.g. Main Hall"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Description
                  </label>
                  <textarea
                    value={eventDesc}
                    onChange={e => setEventDesc(e.target.value)}
                    placeholder="What is this event about?"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowEventForm(false); setEventTitle(''); setEventDesc(''); setEventLocation(''); setEventDate(''); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{
                      background: 'transparent',
                      border: `1.5px solid ${t.border}`,
                      color: t.textSecondary,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createEvent}
                    disabled={eventSaving || !eventTitle.trim() || !eventDate}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      background:
                        eventTitle.trim() && eventDate
                          ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                          : t.border,
                    }}
                  >
                    {eventSaving ? 'Creating...' : 'Create Event'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowEventForm(true)}
                className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  border: `1.5px dashed ${t.textLink}40`,
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  + Create Event
                </span>
              </button>
            )}

            {events.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <span className="text-3xl block mb-2">📅</span>
                <p
                  className="text-sm m-0"
                  style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                >
                  No upcoming events. Create one to engage your couples and build community.
                </p>
              </div>
            ) : (
              events.map(evt => (
                <div
                  key={evt.id}
                  className="rounded-2xl p-5 mb-2.5"
                  style={{ background: t.bgCard, boxShadow: t.shadowCard }}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-center flex-shrink-0 w-14">
                      <div
                        className="text-2xl font-bold"
                        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}
                      >
                        {new Date(evt.start_date || evt.event_date).getDate()}
                      </div>
                      <div className="text-xs uppercase" style={{ color: t.textSecondary }}>
                        {new Date(evt.start_date || evt.event_date).toLocaleDateString('en-GB', {
                          month: 'short',
                        })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <div
                        className="text-sm font-semibold"
                        style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                      >
                        {evt.title}
                      </div>
                      <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                        {EVENT_TYPE_LABELS[evt.event_type] || '📌 Event'}
                        {evt.location ? ` · ${evt.location}` : ''}
                      </div>
                      {evt.description && (
                        <p
                          className="text-xs mt-1.5 m-0"
                          style={{ color: t.textSecondary, lineHeight: 1.5 }}
                        >
                          {evt.description}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ═════════ RESOURCES TAB ═════════ */}
        {tab === 'resources' && (
          <>
            {showResourceForm ? (
              <div
                className="rounded-2xl p-5 mb-3"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <h3
                  className="text-base font-semibold m-0 mb-3"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                >
                  Add Resource
                </h3>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Title *
                  </label>
                  <input
                    type="text"
                    value={resTitle}
                    onChange={e => setResTitle(e.target.value)}
                    placeholder="e.g. The Meaning of Marriage by Tim Keller"
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="mb-3">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    URL
                  </label>
                  <input
                    type="url"
                    value={resUrl}
                    onChange={e => setResUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="mb-4">
                  <label
                    className="text-xs font-semibold uppercase tracking-wider block mb-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    Description
                  </label>
                  <textarea
                    value={resDesc}
                    onChange={e => setResDesc(e.target.value)}
                    placeholder="A brief description of this resource"
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                    style={{
                      border: `1.5px solid ${t.border}`,
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: t.bgInput,
                      color: t.textPrimary,
                    }}
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowResourceForm(false); setResTitle(''); setResUrl(''); setResDesc(''); }}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                    style={{
                      background: 'transparent',
                      border: `1.5px solid ${t.border}`,
                      color: t.textSecondary,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createResource}
                    disabled={resSaving || !resTitle.trim()}
                    className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: resTitle.trim()
                        ? 'linear-gradient(135deg, #B8860B, #8B6914)'
                        : t.border,
                    }}
                  >
                    {resSaving ? 'Publishing...' : 'Publish Resource'}
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowResourceForm(true)}
                className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none"
                style={{
                  background: t.bgCard,
                  boxShadow: t.shadowCard,
                  border: `1.5px dashed ${t.textLink}40`,
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  + Add Resource
                </span>
              </button>
            )}

            {resources.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{ background: t.bgCard, boxShadow: t.shadowCard }}
              >
                <span className="text-3xl block mb-2">📚</span>
                <p
                  className="text-sm m-0"
                  style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                >
                  No resources shared yet. Add articles, book recommendations, videos, or links for your couples.
                </p>
              </div>
            ) : (
              resources.map(res => (
                <div
                  key={res.id}
                  className="rounded-2xl p-5 mb-2.5"
                  style={{ background: t.bgCard, boxShadow: t.shadowCard }}
                >
                  <div
                    className="text-sm font-semibold mb-1"
                    style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                  >
                    {res.title}
                  </div>
                  {res.url && (
                    <a
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs inline-block mb-1"
                      style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      {res.url.length > 50 ? res.url.substring(0, 50) + '...' : res.url} &#8599;
                    </a>
                  )}
                  {(res.content || res.description) && (
                    <p
                      className="text-xs m-0 mt-1"
                      style={{ color: t.textSecondary, lineHeight: 1.5 }}
                    >
                      {(res.content || res.description).substring(0, 150)}
                      {(res.content || res.description).length > 150 ? '...' : ''}
                    </p>
                  )}
                  <div className="text-xs mt-2" style={{ color: t.textMuted }}>
                    Added{' '}
                    {new Date(res.created_at || res.published_at).toLocaleDateString('en-GB', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* ═════════ INVITE COUPLES TAB ═════════ */}
        {tab === 'invite' && (
          <>
            <div
              className="rounded-2xl p-6 mb-3"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div className="text-center mb-5">
                <span className="text-4xl block mb-3">💒</span>
                <h2
                  className="text-xl font-medium m-0 mb-2"
                  style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                >
                  Invite Couples
                </h2>
                <p
                  className="text-sm m-0"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    color: t.textMuted,
                    lineHeight: 1.6,
                  }}
                >
                  Share this link with couples in your congregation.
                  When they sign up through this link, their anonymised
                  data will appear on your dashboard.
                </p>
              </div>

              {/* Invite link */}
              <div
                className="rounded-xl p-4 mb-4 flex items-center gap-2"
                style={{ background: t.bgInput, border: `1px solid ${t.border}` }}
              >
                <input
                  readOnly
                  value={inviteCode}
                  className="flex-1 text-xs bg-transparent border-none outline-none"
                  style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 rounded-lg text-xs font-semibold border-none cursor-pointer flex-shrink-0"
                  style={{
                    background: copied ? t.greenBg : t.goldBg,
                    color: copied ? t.green : t.textLink,
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
              </div>

              {/* Share options */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={() => {
                    if (typeof window !== 'undefined' && navigator.share) {
                      navigator.share({
                        title: `Join ${church?.name || 'our church'} on Cleave`,
                        text: 'Strengthen your marriage with daily devotionals, check-ins, and more.',
                        url: inviteCode,
                      }).catch(() => {});
                    } else {
                      copyInviteLink();
                    }
                  }}
                  className="py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                  }}
                >
                  Share Link
                </button>
                <button
                  onClick={() => {
                    const subject = encodeURIComponent(
                      `Join ${church?.name || 'our church'} on Cleave`
                    );
                    const body = encodeURIComponent(
                      `Hi!\n\nWe're using Cleave to strengthen marriages in our church. Join us here:\n\n${inviteCode}\n\nIt's a free app with daily devotionals, couple exercises, and more.`
                    );
                    window.open(`mailto:?subject=${subject}&body=${body}`);
                  }}
                  className="py-3 rounded-xl text-sm font-semibold cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: 'transparent',
                    border: `1.5px solid ${t.border}`,
                    color: t.textSecondary,
                  }}
                >
                  Email Link
                </button>
              </div>
            </div>

            {/* Instructions */}
            <div
              className="rounded-2xl p-5 mb-3"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                How it works
              </div>
              {[
                {
                  step: '1',
                  title: 'Share the link',
                  desc: 'Send the invite link to married couples in your church via email, WhatsApp, or your church bulletin.',
                },
                {
                  step: '2',
                  title: 'Couples sign up',
                  desc: 'Each person creates a free account and invites their spouse to connect.',
                },
                {
                  step: '3',
                  title: 'View anonymised metrics',
                  desc: 'As couples use the app, aggregate health data appears here. No individual details are ever shared.',
                },
              ].map(item => (
                <div key={item.step} className="flex items-start gap-3 mb-4 last:mb-0">
                  <div
                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                    style={{ background: t.goldBg, color: t.textLink }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div
                      className="text-sm font-semibold"
                      style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}
                    >
                      {item.title}
                    </div>
                    <p
                      className="text-xs m-0 mt-0.5"
                      style={{ color: t.textMuted, lineHeight: 1.5 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Suggested announcement */}
            <div
              className="rounded-2xl p-5"
              style={{ background: t.bgCard, boxShadow: t.shadowCard }}
            >
              <div
                className="text-xs font-semibold uppercase tracking-wider mb-3"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Suggested church announcement
              </div>
              <div
                className="rounded-xl p-4"
                style={{ background: t.bgInput, border: `1px solid ${t.border}` }}
              >
                <p
                  className="text-xs m-0 italic"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    color: t.textSecondary,
                    lineHeight: 1.7,
                  }}
                >
                  &ldquo;We&apos;re excited to share Cleave, a free Christian marriage app with daily devotionals, couple exercises, and weekly check-ins.
                  Sign up with our church link and let&apos;s strengthen our marriages together!&rdquo;
                </p>
              </div>
              <button
                onClick={() => {
                  const text = `We're excited to share Cleave, a free Christian marriage app with daily devotionals, couple exercises, and weekly check-ins. Sign up with our church link and let's strengthen our marriages together!\n\n${inviteCode}`;
                  navigator.clipboard.writeText(text).catch(() => {});
                }}
                className="w-full mt-3 py-2.5 rounded-xl text-xs font-semibold border-none cursor-pointer"
                style={{
                  background: t.goldBg,
                  color: t.textLink,
                  fontFamily: 'Source Sans 3, sans-serif',
                }}
              >
                Copy Announcement Text
              </button>
            </div>
          </>
        )}

        {/* Footer */}
        <div className="text-center py-8">
          <p
            className="text-sm italic m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}
          >
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>
            Ecclesiastes 4:12
          </p>
        </div>
      </div>
    </div>
  );
}


/* ═══════════════════════════════════════════════════════════
   MAIN PAGE: Route between Path A and Path B
   ═══════════════════════════════════════════════════════════ */

export default function ChurchPage() {
  const [profile, setProfile] = useState<any>(null);
  const [ambassador, setAmbassador] = useState<any>(null);
  const [church, setChurch] = useState<any>(null);
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    loadInitial();
  }, []);

  async function loadInitial() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push('/auth');
      return;
    }

    // Get profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, first_name, role')
      .eq('id', user.id)
      .single();
    if (prof) setProfile(prof);

    // Check if user is an ambassador
    const { data: amb } = await supabase
      .from('church_ambassadors')
      .select('*, churches(*)')
      .eq('profile_id', user.id)
      .limit(1)
      .maybeSingle();

    if (amb && amb.churches) {
      setAmbassador(amb);
      setChurch(amb.churches);

      // Try to generate/fetch health snapshot
      try {
        await supabase.rpc('generate_church_health_snapshot', {
          p_church_id: amb.church_id,
        });
      } catch {
        // RPC may not exist yet -- that's ok
      }

      const { data: snap } = await supabase
        .from('church_health_snapshots')
        .select('*')
        .eq('church_id', amb.church_id)
        .order('snapshot_date', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (snap) setHealthSnapshot(snap);
    }

    setLoading(false);
  }

  // Loading state
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: t.bgPrimary }}
      >
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  // PATH A: Not an ambassador
  if (!ambassador) {
    return (
      <RegistrationScreen
        profile={profile}
        onRegistered={() => {
          setLoading(true);
          loadInitial();
        }}
      />
    );
  }

  // PATH B: Ambassador dashboard
  return (
    <AmbassadorDashboard
      church={church}
      ambassador={ambassador}
      initialSnapshot={healthSnapshot}
    />
  );
}
