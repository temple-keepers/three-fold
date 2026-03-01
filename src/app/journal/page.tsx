'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { TopBar } from '@/components/ui/TopBar';
import { t } from '@/lib/tokens';

/* ═══════════════════════════════ CONSTANTS ═══════════════════════════════ */

const MOODS: { emoji: string; label: string }[] = [
  { emoji: '\u{1F64F}', label: 'Grateful' },
  { emoji: '\u{1F54A}\uFE0F', label: 'Peaceful' },
  { emoji: '\u{1F4AA}', label: 'Struggling' },
  { emoji: '\u{1F305}', label: 'Hopeful' },
  { emoji: '\u{1F60A}', label: 'Joyful' },
  { emoji: '\u{1F914}', label: 'Reflective' },
];

const ENTRY_TYPES: { key: string; label: string; icon: string }[] = [
  { key: 'reflection', label: 'Reflection', icon: '\u{1F4AD}' },
  { key: 'prayer', label: 'Prayer', icon: '\u{1F64F}' },
  { key: 'gratitude', label: 'Gratitude', icon: '\u{1F64C}' },
  { key: 'note', label: 'Note', icon: '\u{1F4DD}' },
];

const ENTRY_TYPE_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  reflection: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '\u{1F4AD}' },
  prayer: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '\u{1F64F}' },
  gratitude: { bg: t.greenBg, text: t.green, icon: '\u{1F64C}' },
  note: { bg: t.goldBg, text: t.textLink, icon: '\u{1F4DD}' },
};

/* ═══════════════════════════════ TYPES ═══════════════════════════════ */

interface JournalEntry {
  id: string;
  couple_id: string;
  author_id: string;
  entry_type: string;
  content: string;
  emoji: string | null;
  is_private: boolean;
  read_by_partner: boolean;
  read_by_partner_at: string | null;
  pinned: boolean;
  created_at: string;
  updated_at: string;
}

interface Profile {
  id: string;
  first_name: string | null;
  couple_id: string | null;
  partner_id: string | null;
}

interface Partner {
  id: string;
  first_name: string | null;
}

type JournalTab = 'mine' | 'partner';

/* ═══════════════════════════════ HELPERS ═══════════════════════════════ */

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const entryDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = today.getTime() - entryDay.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text;
  return text.slice(0, max).trimEnd() + '\u2026';
}

/* ═══════════════════════════════ PAGE ═══════════════════════════════ */

export default function JournalPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [partner, setPartner] = useState<Partner | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [partnerEntries, setPartnerEntries] = useState<JournalEntry[]>([]);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formEmoji, setFormEmoji] = useState<string | null>(null);
  const [formType, setFormType] = useState('reflection');
  const [formContent, setFormContent] = useState('');
  const [formPrivate, setFormPrivate] = useState(true);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [editSaved, setEditSaved] = useState(false);
  const editSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // List state
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [tab, setTab] = useState<JournalTab>('mine');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Page state
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(false);

  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (!loading) setTimeout(() => setVisible(true), 100); }, [loading]);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.push('/auth'); return; }

    // Profile
    const { data: prof } = await supabase
      .from('profiles')
      .select('id, first_name, couple_id, partner_id')
      .eq('id', user.id)
      .single();

    if (!prof) return;
    setProfile(prof);

    // Partner
    if (prof.partner_id) {
      const { data: part } = await supabase
        .from('profiles')
        .select('id, first_name')
        .eq('id', prof.partner_id)
        .single();
      if (part) setPartner(part);
    }

    // My entries
    if (prof.couple_id) {
      const { data: myEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('couple_id', prof.couple_id)
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (myEntries) setEntries(myEntries);

      // Partner's shared entries
      if (prof.partner_id) {
        const { data: partEntries } = await supabase
          .from('journal_entries')
          .select('*')
          .eq('couple_id', prof.couple_id)
          .eq('author_id', prof.partner_id)
          .eq('is_private', false)
          .order('created_at', { ascending: false });
        if (partEntries) setPartnerEntries(partEntries);
      }
    } else {
      // Solo user without couple -- load by author_id only
      const { data: myEntries } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('author_id', user.id)
        .order('created_at', { ascending: false });
      if (myEntries) setEntries(myEntries);
    }

    setLoading(false);
  }

  /* ─── Create Entry ─── */
  async function saveEntry() {
    if (!profile || !formContent.trim()) return;
    setSaving(true);

    try {
      const coupleId = profile.couple_id;
      if (!coupleId) {
        setSaving(false);
        return;
      }

      await supabase.from('journal_entries').insert({
        couple_id: coupleId,
        author_id: profile.id,
        entry_type: formType,
        content: formContent.trim(),
        emoji: formEmoji,
        is_private: formPrivate,
      });

      // Reset form
      setFormContent('');
      setFormEmoji(null);
      setFormType('reflection');
      setFormPrivate(true);
      setShowForm(false);
      await loadData();
    } catch (err) {
      console.error('Error saving journal entry:', err);
    } finally {
      setSaving(false);
    }
  }

  /* ─── Edit Entry (inline save on blur) ─── */
  function startEdit(entry: JournalEntry) {
    setEditingId(entry.id);
    setEditContent(entry.content);
    setEditSaved(false);
  }

  const handleEditBlur = useCallback(async () => {
    if (!editingId || !editContent.trim()) return;

    await supabase
      .from('journal_entries')
      .update({ content: editContent.trim(), updated_at: new Date().toISOString() })
      .eq('id', editingId);

    setEditSaved(true);
    if (editSaveTimer.current) clearTimeout(editSaveTimer.current);
    editSaveTimer.current = setTimeout(() => setEditSaved(false), 2500);

    // Update local state
    setEntries(prev =>
      prev.map(e => e.id === editingId ? { ...e, content: editContent.trim(), updated_at: new Date().toISOString() } : e)
    );
  }, [editingId, editContent]);

  function finishEdit() {
    handleEditBlur();
    setEditingId(null);
    setEditContent('');
  }

  /* ─── Delete Entry ─── */
  async function deleteEntry(id: string) {
    await supabase.from('journal_entries').delete().eq('id', id);
    setDeleteConfirmId(null);
    setExpandedId(null);
    setEntries(prev => prev.filter(e => e.id !== id));
  }

  /* ─── Toggle Pin ─── */
  async function togglePin(entry: JournalEntry) {
    const newPinned = !entry.pinned;
    await supabase.from('journal_entries').update({ pinned: newPinned }).eq('id', entry.id);
    setEntries(prev =>
      prev.map(e => e.id === entry.id ? { ...e, pinned: newPinned } : e)
    );
  }

  /* ─── Mark Partner Entry as Read ─── */
  async function markAsRead(entry: JournalEntry) {
    if (entry.read_by_partner) return;
    await supabase.from('journal_entries').update({
      read_by_partner: true,
      read_by_partner_at: new Date().toISOString(),
    }).eq('id', entry.id);
    setPartnerEntries(prev =>
      prev.map(e => e.id === entry.id ? { ...e, read_by_partner: true, read_by_partner_at: new Date().toISOString() } : e)
    );
  }

  /* ─── Filtering & Sorting ─── */
  const filteredEntries = filterType
    ? entries.filter(e => e.entry_type === filterType)
    : entries;

  const pinnedEntries = filteredEntries.filter(e => e.pinned);
  const unpinnedEntries = filteredEntries.filter(e => !e.pinned);

  /* ─── Loading State ─── */
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <div className="text-center">
          <ThreefoldLogo size={48} />
          <p className="mt-4 text-sm" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
            Loading your journal...
          </p>
        </div>
      </div>
    );
  }

  /* ─── Entry Card Renderer ─── */
  function renderEntry(entry: JournalEntry, isPartner = false) {
    const isExpanded = expandedId === entry.id;
    const isEditing = editingId === entry.id;
    const isDeleting = deleteConfirmId === entry.id;
    const typeStyle = ENTRY_TYPE_STYLES[entry.entry_type] || ENTRY_TYPE_STYLES.note;

    return (
      <div
        key={entry.id}
        className="rounded-2xl p-5 mb-3 transition-all cursor-pointer"
        style={{ background: t.bgCard, boxShadow: t.shadowCard }}
        onClick={() => {
          if (!isExpanded && !isEditing) {
            setExpandedId(entry.id);
            if (isPartner) markAsRead(entry);
          }
        }}
      >
        {/* Header Row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            {entry.emoji && <span className="text-lg">{entry.emoji}</span>}
            <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              {relativeDate(entry.created_at)}
            </span>
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: typeStyle.bg, color: typeStyle.text, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              {typeStyle.icon} {entry.entry_type}
            </span>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            {entry.pinned && <span className="text-xs" title="Pinned">{'\u{1F4CC}'}</span>}
            <span className="text-xs" title={entry.is_private ? 'Private' : 'Shared with spouse'}>
              {entry.is_private ? '\u{1F512}' : '\u{1F441}\uFE0F'}
            </span>
          </div>
        </div>

        {/* Content */}
        {isEditing ? (
          <div onClick={e => e.stopPropagation()}>
            <textarea
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              onBlur={handleEditBlur}
              rows={6}
              autoFocus
              className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y mb-2"
              style={{
                background: t.bgInput,
                border: `1.5px solid ${t.border}`,
                color: t.textPrimary,
                fontFamily: 'Source Sans 3, sans-serif',
                lineHeight: 1.7,
              }}
            />
            <div className="flex items-center justify-between">
              <span
                className="text-xs"
                style={{
                  color: editSaved ? t.green : 'transparent',
                  fontFamily: 'Source Sans 3, sans-serif',
                  transition: 'color 0.3s',
                }}
              >
                Saved {'\u2713'}
              </span>
              <button
                onClick={finishEdit}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer"
                style={{ background: t.goldBg, color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <p
            className="text-sm m-0 whitespace-pre-wrap"
            style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.7 }}
          >
            {isExpanded ? entry.content : truncate(entry.content, 100)}
          </p>
        )}

        {/* Expanded Actions (own entries only) */}
        {isExpanded && !isEditing && !isPartner && (
          <div
            className="flex items-center gap-2 mt-4 pt-3 flex-wrap"
            style={{ borderTop: `1px solid ${t.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => startEdit(entry)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none"
              style={{ background: t.goldBg, color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Edit
            </button>
            <button
              onClick={() => togglePin(entry)}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none"
              style={{ background: t.bgAccent, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              {entry.pinned ? 'Unpin' : 'Pin'}
            </button>
            {isDeleting ? (
              <div className="flex items-center gap-1.5 ml-auto">
                <span className="text-xs" style={{ color: t.red, fontFamily: 'Source Sans 3, sans-serif' }}>Delete?</span>
                <button
                  onClick={() => deleteEntry(entry.id)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none"
                  style={{ background: t.redBg, color: t.red, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  Yes
                </button>
                <button
                  onClick={() => setDeleteConfirmId(null)}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none"
                  style={{ background: t.bgAccent, color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  No
                </button>
              </div>
            ) : (
              <button
                onClick={() => setDeleteConfirmId(entry.id)}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg cursor-pointer border-none ml-auto"
                style={{ background: t.redBg, color: t.red, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Delete
              </button>
            )}
            <button
              onClick={() => setExpandedId(null)}
              className="text-xs px-2 py-1.5 rounded-lg cursor-pointer border-none"
              style={{ background: 'transparent', color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Collapse
            </button>
          </div>
        )}

        {/* Expanded: collapse for partner entries */}
        {isExpanded && !isEditing && isPartner && (
          <div
            className="flex items-center justify-end mt-4 pt-3"
            style={{ borderTop: `1px solid ${t.border}` }}
            onClick={e => e.stopPropagation()}
          >
            <button
              onClick={() => setExpandedId(null)}
              className="text-xs px-2 py-1.5 rounded-lg cursor-pointer border-none"
              style={{ background: 'transparent', color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}
            >
              Collapse
            </button>
          </div>
        )}
      </div>
    );
  }

  /* ═══════════════════════════════ RENDER ═══════════════════════════════ */

  return (
    <div className="min-h-screen" style={{ background: t.bgPrimary }}>
      <div
        className="max-w-lg mx-auto"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? 'none' : 'translateY(12px)',
          transition: 'all .6s ease',
        }}
      >
        <TopBar
          title="Journal"
          subtitle="Your personal reflections"
          backHref="/dashboard"
          trailing={
            <button
              onClick={() => { setShowForm(!showForm); setExpandedId(null); }}
              className="text-xs font-semibold px-3 py-1.5 rounded-lg border-none cursor-pointer"
              style={{
                background: showForm ? t.bgAccent : 'linear-gradient(135deg, #B8860B, #8B6914)',
                color: showForm ? t.textMuted : '#FFF',
                fontFamily: 'Source Sans 3, sans-serif',
              }}
            >
              {showForm ? 'Cancel' : '+ New Entry'}
            </button>
          }
        />

        <div className="px-4 pb-10">

          {/* ═══ NEW ENTRY FORM ═══ */}
          {showForm && (
            <div
              className="rounded-2xl p-6 mb-5"
              style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px solid ${t.textLink}20` }}
            >
              {/* Emoji / Mood selector */}
              <div className="mb-4">
                <label
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  How are you feeling?
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {MOODS.map(m => (
                    <button
                      key={m.emoji}
                      onClick={() => setFormEmoji(formEmoji === m.emoji ? null : m.emoji)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all"
                      style={{
                        background: formEmoji === m.emoji ? t.goldBg : t.bgAccent,
                        borderColor: formEmoji === m.emoji ? t.textLink : t.border,
                        color: formEmoji === m.emoji ? t.textPrimary : t.textMuted,
                        fontFamily: 'Source Sans 3, sans-serif',
                      }}
                    >
                      {m.emoji} {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Entry Type selector */}
              <div className="mb-4">
                <label
                  className="text-xs font-semibold uppercase tracking-wider block mb-2"
                  style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                >
                  Entry type
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {ENTRY_TYPES.map(et => {
                    const etStyle = ENTRY_TYPE_STYLES[et.key] || ENTRY_TYPE_STYLES.note;
                    return (
                      <button
                        key={et.key}
                        onClick={() => setFormType(et.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all"
                        style={{
                          background: formType === et.key ? etStyle.bg : t.bgAccent,
                          borderColor: formType === et.key ? t.textLink : t.border,
                          color: formType === et.key ? t.textPrimary : t.textMuted,
                          fontFamily: 'Source Sans 3, sans-serif',
                        }}
                      >
                        {et.icon} {et.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Content textarea */}
              <div className="mb-4">
                <textarea
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  placeholder="What's on your heart today?"
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-y"
                  style={{
                    background: t.bgInput,
                    border: `1.5px solid ${t.border}`,
                    color: t.textPrimary,
                    fontFamily: 'Source Sans 3, sans-serif',
                    lineHeight: 1.7,
                  }}
                />
              </div>

              {/* Privacy toggle */}
              <div className="mb-5">
                <button
                  onClick={() => setFormPrivate(!formPrivate)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm cursor-pointer border transition-all w-full"
                  style={{
                    background: formPrivate ? t.bgAccent : t.pillarSafetyBg,
                    borderColor: formPrivate ? t.border : t.pillarSafetyText + '40',
                    color: t.textPrimary,
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  <span className="text-base">{formPrivate ? '\u{1F512}' : '\u{1F441}\uFE0F'}</span>
                  <span className="font-semibold">{formPrivate ? 'Private' : 'Shared with spouse'}</span>
                  <span className="text-xs ml-auto" style={{ color: t.textMuted }}>
                    {formPrivate ? 'Only you can see this' : 'Your spouse can read this'}
                  </span>
                </button>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setShowForm(false);
                    setFormContent('');
                    setFormEmoji(null);
                    setFormType('reflection');
                    setFormPrivate(true);
                  }}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold cursor-pointer"
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
                  onClick={saveEntry}
                  disabled={!formContent.trim() || saving}
                  className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                  style={{
                    fontFamily: 'Source Sans 3, sans-serif',
                    background: formContent.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border,
                    color: formContent.trim() ? '#FFF' : t.textMuted,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Entry'}
                </button>
              </div>
            </div>
          )}

          {/* ═══ TABS: My Journal / From Partner ═══ */}
          {partner && (
            <div className="flex gap-1.5 mb-4">
              <button
                onClick={() => { setTab('mine'); setExpandedId(null); setFilterType(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: tab === 'mine' ? t.goldBg : t.bgCard,
                  borderColor: tab === 'mine' ? t.textLink : t.border,
                  color: tab === 'mine' ? t.textPrimary : t.textMuted,
                }}
              >
                {'\u{1F4D4}'} My Journal
              </button>
              <button
                onClick={() => { setTab('partner'); setExpandedId(null); setFilterType(null); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold cursor-pointer border transition-all"
                style={{
                  fontFamily: 'Source Sans 3, sans-serif',
                  background: tab === 'partner' ? t.pillarSafetyBg : t.bgCard,
                  borderColor: tab === 'partner' ? t.pillarSafetyText + '60' : t.border,
                  color: tab === 'partner' ? t.textPrimary : t.textMuted,
                }}
              >
                {'\u{1F48C}'} From {partner.first_name}
                {partnerEntries.filter(e => !e.read_by_partner).length > 0 && (
                  <span
                    className="ml-1.5 inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold"
                    style={{ background: t.red, color: '#FFF' }}
                  >
                    {partnerEntries.filter(e => !e.read_by_partner).length}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* ═══ MY JOURNAL TAB ═══ */}
          {tab === 'mine' && (
            <>
              {/* Filter pills */}
              {entries.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <button
                    onClick={() => setFilterType(null)}
                    className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all"
                    style={{
                      background: filterType === null ? t.goldBg : t.bgAccent,
                      borderColor: filterType === null ? t.textLink : t.border,
                      color: filterType === null ? t.textPrimary : t.textMuted,
                      fontFamily: 'Source Sans 3, sans-serif',
                    }}
                  >
                    All
                  </button>
                  {ENTRY_TYPES.map(et => {
                    const count = entries.filter(e => e.entry_type === et.key).length;
                    if (count === 0) return null;
                    const etStyle = ENTRY_TYPE_STYLES[et.key] || ENTRY_TYPE_STYLES.note;
                    return (
                      <button
                        key={et.key}
                        onClick={() => setFilterType(filterType === et.key ? null : et.key)}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all"
                        style={{
                          background: filterType === et.key ? etStyle.bg : t.bgAccent,
                          borderColor: filterType === et.key ? t.textLink : t.border,
                          color: filterType === et.key ? t.textPrimary : t.textMuted,
                          fontFamily: 'Source Sans 3, sans-serif',
                        }}
                      >
                        {et.icon} {et.label} ({count})
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Pinned section */}
              {pinnedEntries.length > 0 && (
                <div className="mb-2">
                  <div
                    className="text-xs font-semibold uppercase tracking-wider mb-2.5 flex items-center gap-1.5"
                    style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                  >
                    <span>{'\u{1F4CC}'}</span> Pinned
                  </div>
                  {pinnedEntries.map(entry => renderEntry(entry))}
                </div>
              )}

              {/* Unpinned entries */}
              {unpinnedEntries.length > 0 && (
                <div>
                  {pinnedEntries.length > 0 && (
                    <div
                      className="text-xs font-semibold uppercase tracking-wider mb-2.5"
                      style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
                    >
                      Recent
                    </div>
                  )}
                  {unpinnedEntries.map(entry => renderEntry(entry))}
                </div>
              )}

              {/* Empty state */}
              {entries.length === 0 && !showForm && (
                <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <div className="text-4xl mb-3">{'\u{1F4D4}'}</div>
                  <h3
                    className="text-lg font-medium mb-2"
                    style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                  >
                    Your journal is empty
                  </h3>
                  <p
                    className="text-sm m-0 mb-5"
                    style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                  >
                    Start writing to capture what God is showing you. Your reflections, prayers, and gratitude all in one place.
                  </p>
                  <button
                    onClick={() => setShowForm(true)}
                    className="px-6 py-3 rounded-full text-sm font-semibold text-white border-none cursor-pointer"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: 'linear-gradient(135deg, #B8860B, #8B6914)',
                      boxShadow: '0 4px 16px rgba(184,134,11,0.2)',
                    }}
                  >
                    Write Your First Entry
                  </button>
                </div>
              )}

              {/* Filtered empty state */}
              {entries.length > 0 && filteredEntries.length === 0 && (
                <div className="rounded-2xl p-6 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <p className="text-sm m-0" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    No {filterType} entries yet.
                  </p>
                </div>
              )}
            </>
          )}

          {/* ═══ PARTNER TAB ═══ */}
          {tab === 'partner' && (
            <>
              {partnerEntries.length > 0 ? (
                partnerEntries.map(entry => renderEntry(entry, true))
              ) : (
                <div className="rounded-2xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
                  <div className="text-4xl mb-3">{'\u{1F48C}'}</div>
                  <h3
                    className="text-lg font-medium mb-2"
                    style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
                  >
                    No shared entries yet
                  </h3>
                  <p
                    className="text-sm m-0"
                    style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.6 }}
                  >
                    When {partner?.first_name || 'your spouse'} shares journal entries, they&apos;ll appear here.
                  </p>
                </div>
              )}
            </>
          )}

          {/* Footer */}
          <div className="text-center py-8">
            <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
              &ldquo;A cord of three strands is not quickly broken.&rdquo;
            </p>
            <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
          </div>
        </div>
      </div>
    </div>
  );
}
