'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { t } from '@/lib/tokens';
import Link from 'next/link';

/* ═══════════════════════════════ TYPES ═══════════════════════════════ */
interface Entry {
  id: string; couple_id: string; author_id: string; entry_type: string;
  content: string; emoji: string | null; is_private: boolean;
  read_by_partner: boolean; read_by_partner_at: string | null;
  pinned: boolean; created_at: string;
}
interface Profile { id: string; first_name: string | null; partner_id: string | null; couple_id: string | null; }
interface Partner { id: string; first_name: string | null; }

const ENTRY_TYPES = [
  { key: 'note', label: 'Note', emoji: '📝', color: 'var(--text-link)' },
  { key: 'gratitude', label: 'Gratitude', emoji: '🙏', color: 'var(--green)' },
  { key: 'prayer', label: 'Prayer', emoji: '🕊️', color: 'var(--pillar-spiritual-text)' },
  { key: 'memory', label: 'Memory', emoji: '📸', color: 'var(--pillar-comm-text)' },
  { key: 'letter', label: 'Letter', emoji: '💌', color: 'var(--red)' },
  { key: 'scripture', label: 'Scripture', emoji: '📖', color: 'var(--pillar-covenant-text)' },
];
const TYPE_MAP = Object.fromEntries(ENTRY_TYPES.map(x => [x.key, x]));

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */
export default function JournalPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [vis, setVis] = useState(false);
  const [composing, setComposing] = useState(false);
  const [newType, setNewType] = useState('note');
  const [newContent, setNewContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filter, setFilter] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();
  const router = useRouter();

  const load = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }
    const { data: prof } = await supabase.from('profiles').select('id,first_name,partner_id,couple_id').eq('id', user.id).single();
    if (!prof?.couple_id) { router.push('/dashboard'); return; }
    setProfile(prof);
    if (prof.partner_id) {
      const { data: part } = await supabase.from('profiles').select('id,first_name').eq('id', prof.partner_id).single();
      if (part) setPartner(part);
    }
    const { data: ents } = await supabase.from('journal_entries').select('*').eq('couple_id', prof.couple_id)
      .order('pinned', { ascending: false }).order('created_at', { ascending: false }).limit(100);
    if (ents) {
      setEntries(ents);
      const unread = ents.filter(e => e.author_id !== user.id && !e.read_by_partner);
      for (const entry of unread) {
        await supabase.from('journal_entries').update({ read_by_partner: true, read_by_partner_at: new Date().toISOString() }).eq('id', entry.id);
      }
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { if (!loading) setTimeout(() => setVis(true), 80); }, [loading]);
  useEffect(() => { if (composing && textareaRef.current) textareaRef.current.focus(); }, [composing]);

  async function saveEntry() {
    if (!profile?.couple_id || !newContent.trim()) return;
    setSaving(true);
    const typeInfo = TYPE_MAP[newType];
    const { data } = await supabase.from('journal_entries').insert({
      couple_id: profile.couple_id, author_id: profile.id, entry_type: newType,
      content: newContent.trim(), emoji: typeInfo?.emoji || null, is_private: isPrivate,
    }).select().single();
    if (data) { setEntries(prev => [data, ...prev]); setNewContent(''); setNewType('note'); setIsPrivate(false); setComposing(false); }
    setSaving(false);
  }

  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  async function togglePin(entry: Entry) {
    const p = !entry.pinned;
    await supabase.from('journal_entries').update({ pinned: p }).eq('id', entry.id);
    setEntries(prev => prev.map(e => e.id === entry.id ? { ...e, pinned: p } : e));
  }

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
      <div className="text-center">
        <div className="text-4xl mb-3">📔</div>
        <p className="text-sm" style={{ color: t.textMuted }}>Loading your journal...</p>
      </div>
    </div>
  );

  const filtered = filter ? entries.filter(e => e.entry_type === filter) : entries;

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl" style={{ background: t.bgPrimary, borderBottom: `1px solid ${t.borderLight}` }}>
        <div className="max-w-lg mx-auto flex items-center justify-between px-5 h-14">
          <Link href="/dashboard" className="flex items-center no-underline" style={{ color: t.textMuted }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 18l-6-6 6-6" /></svg>
          </Link>
          <div className="text-center">
            <h1 className="text-sm font-semibold tracking-wider uppercase m-0" style={{ fontFamily: 'Cinzel,serif', color: t.textPrimary, letterSpacing: '0.15em' }}>Our Journal</h1>
            {partner && <p className="text-[10px] m-0" style={{ color: t.textMuted }}>{profile?.first_name} & {partner.first_name}</p>}
          </div>
          <button onClick={() => setComposing(true)} className="w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer" style={{ background: t.goldBg, color: t.textLink }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          </button>
        </div>
      </header>

      <div className="max-w-lg mx-auto px-5 pb-24">
        {/* Stats */}
        <div className="flex items-center gap-5 py-4" style={{ opacity: vis ? 1 : 0, transition: 'opacity .6s ease .1s' }}>
          <Stat n={entries.length} label="entries" />
          <div style={{ width: 1, height: 24, background: t.border }} />
          <Stat n={entries.filter(e => e.author_id === profile?.id).length} label="mine" />
          <div style={{ width: 1, height: 24, background: t.border }} />
          <Stat n={entries.filter(e => e.author_id !== profile?.id).length} label="theirs" />
        </div>

        {/* Filters */}
        <div className="flex gap-1.5 overflow-x-auto pb-3 -mx-1 px-1" style={{ opacity: vis ? 1 : 0, transition: 'opacity .5s ease .2s' }}>
          <Pill label="All" active={!filter} onClick={() => setFilter(null)} />
          {ENTRY_TYPES.map(et => <Pill key={et.key} label={`${et.emoji} ${et.label}`} active={filter === et.key} onClick={() => setFilter(filter === et.key ? null : et.key)} />)}
        </div>

        {/* Empty */}
        {entries.length === 0 && (
          <div className="text-center py-16" style={{ opacity: vis ? 1 : 0, transition: 'opacity .7s ease .3s' }}>
            <div className="text-5xl mb-4">📔</div>
            <h2 className="text-xl mb-2" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textPrimary, fontWeight: 600 }}>Your &ldquo;We&rdquo; Journal</h2>
            <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: t.textSecondary, lineHeight: 1.6 }}>A shared space for gratitude, prayers, memories, and love letters between you and your spouse.</p>
            <button onClick={() => setComposing(true)} className="px-6 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer" style={{ background: '#C7A23A', color: '#0F1E2E' }}>Write Your First Entry</button>
          </div>
        )}

        {/* Timeline */}
        {filtered.length > 0 && (
          <div className="space-y-3 mt-2">
            {filtered.map((entry, i) => {
              const isMine = entry.author_id === profile?.id;
              const ti = TYPE_MAP[entry.entry_type] || TYPE_MAP.note;
              const d = new Date(entry.created_at);
              const ds = isToday(d) ? 'Today' : isYesterday(d) ? 'Yesterday' : d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
              const ts = d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
              return (
                <div key={entry.id} className="rounded-2xl p-4" style={{ background: t.bgCard, border: `1px solid ${entry.pinned ? t.textLink : t.border}`, boxShadow: t.shadowCard, opacity: vis ? 1 : 0, transform: vis ? 'none' : 'translateY(12px)', transition: `all .5s ease ${Math.min(i * 60, 600)}ms` }}>
                  <div className="flex items-center justify-between mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{ti.emoji}</span>
                      <span className="text-xs font-semibold" style={{ color: isMine ? t.textLink : t.green }}>{isMine ? 'You' : partner?.first_name || 'Spouse'}</span>
                      <span className="text-[10px]" style={{ color: t.textLight }}>·</span>
                      <span className="text-[10px]" style={{ color: t.textMuted }}>{ds} {ts}</span>
                      {entry.pinned && <span className="text-[10px]">📌</span>}
                      {entry.is_private && <span className="text-[10px]">🔒</span>}
                    </div>
                    {isMine && (
                      <div className="flex items-center gap-1">
                        {!entry.is_private && entry.read_by_partner && <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ background: t.greenBg, color: t.green }}>Read ✓</span>}
                        <button onClick={() => togglePin(entry)} className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer" style={{ background: 'transparent', color: t.textLight, fontSize: 11 }}>📌</button>
                        <button onClick={() => deleteEntry(entry.id)} className="w-6 h-6 rounded flex items-center justify-center border-none cursor-pointer" style={{ background: 'transparent', color: t.textLight, fontSize: 11 }}>✕</button>
                      </div>
                    )}
                  </div>
                  <p className="text-sm m-0 whitespace-pre-wrap leading-relaxed" style={{ color: t.textPrimary, fontFamily: 'DM Sans,sans-serif' }}>{entry.content}</p>
                </div>
              );
            })}
          </div>
        )}

        <div className="text-center py-10 mt-4">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textLight }}>&ldquo;Let us consider how to stir up one another to love and good works.&rdquo;</p>
          <p className="text-[10px] m-0 mt-1 uppercase tracking-widest" style={{ color: t.textLight }}>Hebrews 10:24</p>
        </div>
      </div>

      {/* Compose Sheet */}
      {composing && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)' }} onClick={() => setComposing(false)}>
          <div className="w-full max-w-lg rounded-t-3xl sm:rounded-3xl p-6 pb-8 sm:pb-6" style={{ background: t.bgCard, boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-5 sm:hidden" style={{ background: t.border }} />
            <h3 className="text-lg mb-4 m-0" style={{ fontFamily: 'Cormorant Garamond,serif', color: t.textPrimary, fontWeight: 600 }}>New Entry</h3>
            <div className="flex gap-2 flex-wrap mb-4">
              {ENTRY_TYPES.map(et => (
                <button key={et.key} onClick={() => setNewType(et.key)} className="px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer" style={{ background: newType === et.key ? t.goldBg : t.bgAccent, color: newType === et.key ? t.textLink : t.textSecondary, border: newType === et.key ? `1px solid ${t.textLink}` : '1px solid transparent' }}>{et.emoji} {et.label}</button>
              ))}
            </div>
            <textarea ref={textareaRef} value={newContent} onChange={e => setNewContent(e.target.value)} placeholder={newType === 'gratitude' ? "I'm grateful for..." : newType === 'prayer' ? 'Lord, we pray for...' : newType === 'memory' ? "I'll never forget when..." : newType === 'letter' ? 'Dear love...' : newType === 'scripture' ? 'A verse on my heart...' : "What's on your heart?"} rows={4} className="w-full p-4 rounded-2xl text-sm outline-none resize-none" style={{ background: t.bgInput, color: t.textPrimary, border: `1px solid ${t.border}`, fontFamily: 'DM Sans,sans-serif' }} />
            <div className="flex items-center justify-between mt-3 mb-5">
              <button onClick={() => setIsPrivate(!isPrivate)} className="flex items-center gap-2 px-3 py-1.5 rounded-lg border-none cursor-pointer text-xs" style={{ background: isPrivate ? t.redBg : t.bgAccent, color: isPrivate ? t.red : t.textMuted }}>{isPrivate ? '🔒 Private (only you)' : '👥 Shared with spouse'}</button>
              <span className="text-xs" style={{ color: t.textLight }}>{newContent.length} chars</span>
            </div>
            <div className="flex gap-3">
              <button onClick={saveEntry} disabled={saving || !newContent.trim()} className="flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer" style={{ background: '#C7A23A', color: '#0F1E2E', opacity: saving || !newContent.trim() ? 0.5 : 1 }}>{saving ? 'Saving...' : '📔 Save Entry'}</button>
              <button onClick={() => { setComposing(false); setNewContent(''); }} className="px-5 py-3 rounded-xl text-sm border-none cursor-pointer" style={{ background: t.bgAccent, color: t.textMuted }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Stat({ n, label }: { n: number; label: string }) {
  return <div className="text-center"><div className="text-lg font-bold" style={{ color: t.textPrimary }}>{n}</div><div className="text-[10px] uppercase tracking-wider" style={{ color: t.textMuted }}>{label}</div></div>;
}
function Pill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return <button onClick={onClick} className="px-3 py-1.5 rounded-full text-xs font-medium border-none cursor-pointer whitespace-nowrap flex-shrink-0" style={{ background: active ? t.goldBg : t.bgCard, color: active ? t.textLink : t.textMuted, border: active ? `1px solid ${t.textLink}` : `1px solid ${t.border}` }}>{label}</button>;
}
function isToday(d: Date) { return d.toDateString() === new Date().toDateString(); }
function isYesterday(d: Date) { return d.toDateString() === new Date(Date.now() - 86400000).toDateString(); }
