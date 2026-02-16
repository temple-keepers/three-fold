'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';
import Link from 'next/link';

const PILLAR_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '🤝', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, icon: '🛡️', label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, icon: '💬', label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '✝️', label: 'Spiritual' },
  general: { bg: t.bgPrimary, text: t.textSecondary, icon: '⭐', label: 'General' },
};

const EVENT_TYPE_LABELS: Record<string, string> = {
  marriage_course: '💒 Marriage Course',
  couples_night: '🌙 Couples Night',
  retreat: '⛺ Retreat',
  workshop: '📚 Workshop',
  sermon_series: '🎤 Sermon Series',
  counselling_session: '🤝 Counselling',
  prayer_night: '🙏 Prayer Night',
  social: '🎉 Social',
  other: '📌 Event',
};

type Tab = 'health' | 'events' | 'resources' | 'prayers' | 'team';

export default function ChurchDashboard() {
  const [church, setChurch] = useState<any>(null);
  const [ambassador, setAmbassador] = useState<any>(null);
  const [healthSnapshot, setHealthSnapshot] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [resources, setResources] = useState<any[]>([]);
  const [prayerRequests, setPrayerRequests] = useState<any[]>([]);
  const [ambassadors, setAmbassadors] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);

  const [tab, setTab] = useState<Tab>('health');
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const [showEventForm, setShowEventForm] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState('couples_night');
  const [eventDate, setEventDate] = useState('');
  const [eventLocation, setEventLocation] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  const [showResourceForm, setShowResourceForm] = useState(false);
  const [resTitle, setResTitle] = useState('');
  const [resType, setResType] = useState('announcement');
  const [resContent, setResContent] = useState('');
  const [resPillar, setResPillar] = useState('general');

  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    const { data: amb } = await supabase.from('church_ambassadors')
      .select('*, churches(*)').eq('profile_id', user.id).limit(1).single();

    if (!amb) { setLoading(false); return; }

    setAmbassador(amb);
    setChurch(amb.churches);

    const churchId = amb.church_id;

    await supabase.rpc('generate_church_health_snapshot', { p_church_id: churchId });

    const { data: snap } = await supabase.from('church_health_snapshots')
      .select('*').eq('church_id', churchId).order('snapshot_date', { ascending: false }).limit(1).single();
    if (snap) setHealthSnapshot(snap);

    const { data: evts } = await supabase.from('church_events')
      .select('*').eq('church_id', churchId).eq('is_active', true).order('start_date');
    if (evts) setEvents(evts);

    const { data: res } = await supabase.from('church_resources')
      .select('*').eq('church_id', churchId).eq('is_active', true).order('published_at', { ascending: false });
    if (res) setResources(res);

    const { data: prs } = await supabase.from('prayer_requests')
      .select('*').eq('church_id', churchId).eq('status', 'active').order('created_at', { ascending: false });
    if (prs) setPrayerRequests(prs);

    const { data: team } = await supabase.from('church_ambassadors')
      .select('*, profiles(first_name, last_name, email)').eq('church_id', churchId);
    if (team) setAmbassadors(team);

    const { data: invs } = await supabase.from('ambassador_invitations')
      .select('*').eq('church_id', churchId).eq('status', 'pending');
    if (invs) setInvitations(invs);

    setLoading(false);
  }

  async function createEvent() {
    if (!church || !eventTitle || !eventDate) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('church_events').insert({ church_id: church.id, title: eventTitle, event_type: eventType, description: eventDesc, start_date: eventDate, location: eventLocation, created_by: user?.id });
    setShowEventForm(false); setEventTitle(''); setEventDesc(''); setEventLocation('');
    loadData();
  }

  async function createResource() {
    if (!church || !resTitle) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('church_resources').insert({ church_id: church.id, title: resTitle, resource_type: resType, content: resContent, pillar: resPillar, created_by: user?.id });
    setShowResourceForm(false); setResTitle(''); setResContent('');
    loadData();
  }

  async function sendInvite() {
    if (!church || !inviteEmail) return;
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('ambassador_invitations').insert({ church_id: church.id, invited_by: user?.id, invitee_email: inviteEmail, invitee_name: inviteName });
    setShowInviteForm(false); setInviteEmail(''); setInviteName('');
    loadData();
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <ThreefoldLogo size={48} />
      </div>
    );
  }

  if (!ambassador) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
        <div className="rounded-3xl p-10 text-center max-w-md" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <ThreefoldLogo size={56} />
          <h2 className="text-2xl font-medium mt-4 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
            Church Ambassador Access
          </h2>
          <p className="text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}>
            This dashboard is for church marriage ambassadors. If your church uses Threefold Cord, ask your church admin for an ambassador invitation.
          </p>
          <Link href="/dashboard">
            <span className="text-sm font-semibold" style={{ color: t.textLink }}>← Back to dashboard</span>
          </Link>
        </div>
      </div>
    );
  }

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: 'health', label: 'Health', icon: '📊' },
    { key: 'events', label: 'Events', icon: '📅' },
    { key: 'resources', label: 'Resources', icon: '📚' },
    { key: 'prayers', label: 'Prayers', icon: '🙏' },
    { key: 'team', label: 'Team', icon: '👥' },
  ];

  const h = healthSnapshot;
  const totalTiered = (h?.couples_strengthen || 0) + (h?.couples_repair || 0) + (h?.couples_restore || 0);

  const scoreColor = (s: number) => s >= 3.5 ? t.green : s >= 2.5 ? t.textLink : t.red;

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-3xl mx-auto" style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(12px)', transition: 'all 0.6s ease' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Link href="/dashboard"><ThreefoldLogo size={28} /></Link>
            <div>
              <h1 className="text-xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                {church?.name || 'Church Dashboard'}
              </h1>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>
                Marriage Ministry · {ambassador?.role === 'admin' ? 'Admin' : 'Ambassador'}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)} className="flex-shrink-0 px-4 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border" style={{ fontFamily: 'Source Sans 3, sans-serif', background: tab === tb.key ? t.goldBg : t.bgCard, borderColor: tab === tb.key ? t.textLink : t.border, color: tab === tb.key ? t.textPrimary : t.textMuted }}>
              {tb.icon} {tb.label}
            </button>
          ))}
        </div>

        {/* ===== HEALTH TAB ===== */}
        {tab === 'health' && h && (
          <>
            <div className="grid grid-cols-4 gap-2.5 mb-3">
              {[
                { label: 'Total Couples', value: h.total_couples, icon: '💛' },
                { label: 'Active This Week', value: h.active_couples_this_week, icon: '📈' },
                { label: 'Avg Streak', value: Math.round(h.avg_streak || 0), icon: '🔥' },
                { label: 'In Reset', value: h.couples_in_reset, icon: '🔄' },
              ].map(m => (
                <div key={m.label} className="rounded-xl p-4 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <span className="text-lg">{m.icon}</span>
                  <div className="text-2xl font-bold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{m.value}</div>
                  <div className="text-xs" style={{ color: t.textMuted }}>{m.label}</div>
                </div>
              ))}
            </div>

            <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Pathway Distribution (Anonymised)
              </div>
              {totalTiered > 0 ? (
                <>
                  <div className="flex h-8 rounded-full overflow-hidden mb-3">
                    {h.couples_strengthen > 0 && <div style={{ width: `${(h.couples_strengthen / totalTiered) * 100}%`, background: '#5B8A3C' }} />}
                    {h.couples_repair > 0 && <div style={{ width: `${(h.couples_repair / totalTiered) * 100}%`, background: '#B8860B' }} />}
                    {h.couples_restore > 0 && <div style={{ width: `${(h.couples_restore / totalTiered) * 100}%`, background: '#C44536' }} />}
                  </div>
                  <div className="flex gap-4">
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: '#5B8A3C' }} /><span className="text-xs" style={{ color: t.textSecondary }}>Strengthen: {h.couples_strengthen}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: '#B8860B' }} /><span className="text-xs" style={{ color: t.textSecondary }}>Repair: {h.couples_repair}</span></div>
                    <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ background: '#C44536' }} /><span className="text-xs" style={{ color: t.textSecondary }}>Restore: {h.couples_restore}</span></div>
                  </div>
                </>
              ) : (
                <p className="text-sm text-center py-4" style={{ color: t.textMuted }}>No assessments completed yet</p>
              )}
            </div>

            {h.avg_overall_score && (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex justify-between items-center mb-3">
                  <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Average Pillar Scores</div>
                  <div className="text-lg font-bold" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textLink }}>{Number(h.avg_overall_score).toFixed(1)}</div>
                </div>
                {[
                  { key: 'covenant', score: h.avg_covenant_score },
                  { key: 'emotional_safety', score: h.avg_emotional_safety_score },
                  { key: 'communication', score: h.avg_communication_score },
                  { key: 'spiritual', score: h.avg_spiritual_score },
                ].map(p => {
                  const ps = PILLAR_STYLES[p.key];
                  const score = Number(p.score || 0);
                  return (
                    <div key={p.key} className="flex items-center gap-3 mb-2.5">
                      <span className="text-sm w-5">{ps.icon}</span>
                      <span className="text-xs w-28 flex-shrink-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary }}>{ps.label}</span>
                      <div className="flex-1 h-2.5 rounded-full" style={{ background: t.border }}>
                        <div className="h-full rounded-full" style={{ width: `${(score / 5) * 100}%`, background: scoreColor(score) }} />
                      </div>
                      <span className="text-xs font-bold w-8 text-right" style={{ color: scoreColor(score) }}>{score.toFixed(1)}</span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>This Week&apos;s Engagement</div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Devotionals', value: h.devotionals_completed, icon: '📖' },
                  { label: 'Exercises', value: h.exercises_completed, icon: '✏️' },
                  { label: 'Check-Ins', value: h.check_ins_completed, icon: '📋' },
                ].map(m => (
                  <div key={m.label} className="text-center p-3 rounded-xl" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                    <span>{m.icon}</span>
                    <div className="text-xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{m.value}</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-xl p-4 mt-3" style={{ background: t.goldBg, border: `1px solid ${t.textLink}20` }}>
              <p className="text-xs m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textSecondary, lineHeight: 1.6 }}>
                🔒 <strong>All data is anonymised.</strong> You can see aggregate trends but never individual couple details, scores, or private responses. Couples control their own data.
              </p>
            </div>
          </>
        )}

        {/* ===== EVENTS TAB ===== */}
        {tab === 'events' && (
          <>
            {showEventForm ? (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Create Event</h3>
                <input value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Event title" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <select value={eventType} onChange={e => setEventType(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}>
                  {Object.entries(EVENT_TYPE_LABELS).map(([k, v]) => (<option key={k} value={k}>{v}</option>))}
                </select>
                <input type="datetime-local" value={eventDate} onChange={e => setEventDate(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <input value={eventLocation} onChange={e => setEventLocation(e.target.value)} placeholder="Location" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <textarea value={eventDesc} onChange={e => setEventDesc(e.target.value)} placeholder="Description" rows={3} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <div className="flex gap-2">
                  <button onClick={() => setShowEventForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Cancel</button>
                  <button onClick={createEvent} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}>Create Event</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowEventForm(true)} className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
                <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>+ Create Event</span>
              </button>
            )}

            {events.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-3xl">📅</span>
                <p className="text-sm mt-2" style={{ color: t.textMuted }}>No upcoming events. Create one to engage your couples!</p>
              </div>
            ) : events.map(evt => (
              <div key={evt.id} className="rounded-2xl p-5 mb-2.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex items-start gap-3">
                  <div className="text-center flex-shrink-0 w-14">
                    <div className="text-2xl font-bold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textLink }}>{new Date(evt.start_date).getDate()}</div>
                    <div className="text-xs uppercase" style={{ color: t.textSecondary }}>{new Date(evt.start_date).toLocaleDateString('en-GB', { month: 'short' })}</div>
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{evt.title}</div>
                    <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>{EVENT_TYPE_LABELS[evt.event_type]} · {evt.location || 'TBC'}</div>
                    {evt.description && <p className="text-xs mt-1.5" style={{ color: t.textSecondary, lineHeight: 1.5 }}>{evt.description}</p>}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* ===== RESOURCES TAB ===== */}
        {tab === 'resources' && (
          <>
            {showResourceForm ? (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <h3 className="text-base font-semibold mb-3" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Add Resource</h3>
                <input value={resTitle} onChange={e => setResTitle(e.target.value)} placeholder="Title" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <select value={resType} onChange={e => setResType(e.target.value)} className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}>
                  <option value="announcement">📢 Announcement</option>
                  <option value="article">📄 Article</option>
                  <option value="video">🎬 Video</option>
                  <option value="book_recommendation">📖 Book</option>
                  <option value="counsellor_info">🤝 Counsellor Info</option>
                  <option value="external_link">🔗 External Link</option>
                </select>
                <div className="flex gap-1.5 mb-3 flex-wrap">
                  {Object.entries(PILLAR_STYLES).map(([k, ps]) => (
                    <button key={k} onClick={() => setResPillar(k)} className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border" style={{ background: resPillar === k ? ps.bg : t.bgCardHover, borderColor: resPillar === k ? t.textLink : t.border, color: resPillar === k ? ps.text : t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                      {ps.icon} {ps.label}
                    </button>
                  ))}
                </div>
                <textarea value={resContent} onChange={e => setResContent(e.target.value)} placeholder="Content or description" rows={4} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                <div className="flex gap-2">
                  <button onClick={() => setShowResourceForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Cancel</button>
                  <button onClick={createResource} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}>Publish</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowResourceForm(true)} className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
                <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>+ Add Resource</span>
              </button>
            )}

            {resources.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-3xl">📚</span>
                <p className="text-sm mt-2" style={{ color: t.textMuted }}>No resources yet. Share articles, videos, or announcements with your couples.</p>
              </div>
            ) : resources.map(res => {
              const ps = PILLAR_STYLES[res.pillar] || PILLAR_STYLES.general;
              return (
                <div key={res.id} className="rounded-2xl p-5 mb-2.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: ps.bg, color: ps.text }}>{ps.icon} {ps.label}</span>
                    <span className="text-xs" style={{ color: t.textMuted }}>{new Date(res.published_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{res.title}</div>
                  {res.content && <p className="text-xs mt-1" style={{ color: t.textSecondary, lineHeight: 1.5 }}>{res.content.substring(0, 120)}...</p>}
                </div>
              );
            })}
          </>
        )}

        {/* ===== PRAYERS TAB ===== */}
        {tab === 'prayers' && (
          <>
            <div className="rounded-xl p-4 mb-3" style={{ background: t.pillarSafetyBg, border: `1px solid ${t.pillarSafetyText}20` }}>
              <p className="text-xs m-0" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.pillarSafetyText, lineHeight: 1.6 }}>
                🙏 <strong>Prayer requests from couples in your church.</strong> Some may be anonymous. Pray faithfully and reach out only if they&apos;ve shared their identity.
              </p>
            </div>

            {prayerRequests.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <span className="text-3xl">🙏</span>
                <p className="text-sm mt-2" style={{ color: t.textMuted }}>No active prayer requests. Your couples are covered!</p>
              </div>
            ) : prayerRequests.map(pr => (
              <div key={pr.id} className="rounded-2xl p-5 mb-2.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold" style={{ background: t.goldBg, color: t.textLink }}>{pr.category || 'General'}</span>
                  {pr.is_anonymous && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: t.bgAccent, color: t.textSecondary }}>Anonymous</span>}
                </div>
                <p className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>{pr.request_text}</p>
                <div className="text-xs mt-2" style={{ color: t.textMuted }}>{new Date(pr.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
              </div>
            ))}
          </>
        )}

        {/* ===== TEAM TAB ===== */}
        {tab === 'team' && (
          <>
            <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
              <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Ambassadors</div>
              {ambassadors.map(a => (
                <div key={a.id} className="flex items-center gap-3 mb-3 last:mb-0">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: t.goldBg, color: t.textLink }}>{(a.profiles?.first_name || '?')[0]}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{a.profiles?.first_name} {a.profiles?.last_name}</div>
                    <div className="text-xs" style={{ color: t.textMuted }}>{a.profiles?.email}</div>
                  </div>
                  <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: a.role === 'admin' ? t.goldBg : t.greenBg, color: a.role === 'admin' ? t.textLink : t.green }}>{a.role}</span>
                </div>
              ))}
            </div>

            {invitations.length > 0 && (
              <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Pending Invitations</div>
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center gap-3 mb-2 last:mb-0">
                    <span className="text-lg">💌</span>
                    <div className="flex-1">
                      <div className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{inv.invitee_name || inv.invitee_email}</div>
                      <div className="text-xs" style={{ color: t.textMuted }}>{inv.invitee_email}</div>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full" style={{ background: t.goldBg, color: t.textLink }}>Pending</span>
                  </div>
                ))}
              </div>
            )}

            {ambassador?.role === 'admin' && (
              showInviteForm ? (
                <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <h3 className="text-sm font-semibold mb-3" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Invite Ambassador</h3>
                  <input value={inviteName} onChange={e => setInviteName(e.target.value)} placeholder="Name" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-2" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                  <input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="Email address" type="email" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowInviteForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Cancel</button>
                    <button onClick={sendInvite} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ background: 'linear-gradient(135deg, #B8860B, #8B6914)', fontFamily: 'Source Sans 3, sans-serif' }}>Send Invite</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowInviteForm(true)} className="w-full rounded-2xl p-4 text-center cursor-pointer border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
                  <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>+ Invite Ambassador</span>
                </button>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}
