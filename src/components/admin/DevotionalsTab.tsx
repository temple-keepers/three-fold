'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminCard, SectionHeader, GoldButton, OutlineButton, FormField, TextInput, TextArea, Select, PillarBadge, StatusBadge, PILLARS, useSupabase } from './AdminUI';

export function DevotionalsTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = useSupabase();

  const emptyForm = { publish_date: '', title: '', pillar: 'covenant', scripture_text: '', scripture_reference: '', reflection: '', micro_action: '', prayer_prompt: '', couple_question: '', is_active: true };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('devotionals').select('*').order('publish_date', { ascending: false });
    if (data) setItems(data);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ publish_date: item.publish_date, title: item.title, pillar: item.pillar, scripture_text: item.scripture_text, scripture_reference: item.scripture_reference, reflection: item.reflection, micro_action: item.micro_action, prayer_prompt: item.prayer_prompt || '', couple_question: item.couple_question || '', is_active: item.is_active });
    setShowForm(true);
  }

  async function save() {
    if (editing) { await supabase.from('devotionals').update(form).eq('id', editing.id); }
    else { await supabase.from('devotionals').insert(form); }
    setShowForm(false); load();
  }

  async function toggleActive(item: any) {
    await supabase.from('devotionals').update({ is_active: !item.is_active }).eq('id', item.id);
    load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading devotionals...</div>;

  if (showForm) {
    return (
      <>
        <SectionHeader title={editing ? 'Edit Devotional' : 'New Devotional'} action={<OutlineButton onClick={() => setShowForm(false)}>← Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Publish Date"><TextInput value={form.publish_date} onChange={(v) => setForm({ ...form, publish_date: v })} type="date" /></FormField>
            <FormField label="Pillar"><Select value={form.pillar} onChange={(v) => setForm({ ...form, pillar: v })} options={PILLARS} /></FormField>
          </div>
          <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} placeholder="Devotional title" /></FormField>
          <FormField label="Scripture Text"><TextArea value={form.scripture_text} onChange={(v) => setForm({ ...form, scripture_text: v })} placeholder="The scripture passage..." rows={3} /></FormField>
          <FormField label="Scripture Reference"><TextInput value={form.scripture_reference} onChange={(v) => setForm({ ...form, scripture_reference: v })} placeholder="e.g. Ephesians 4:32" /></FormField>
          <FormField label="Reflection"><TextArea value={form.reflection} onChange={(v) => setForm({ ...form, reflection: v })} placeholder="The reflection text..." rows={5} /></FormField>
          <FormField label="Micro Action"><TextArea value={form.micro_action} onChange={(v) => setForm({ ...form, micro_action: v })} placeholder="Today's actionable step..." rows={3} /></FormField>
          <FormField label="Prayer Prompt (optional)"><TextArea value={form.prayer_prompt} onChange={(v) => setForm({ ...form, prayer_prompt: v })} rows={3} /></FormField>
          <FormField label="Couple Question (optional)"><TextArea value={form.couple_question} onChange={(v) => setForm({ ...form, couple_question: v })} rows={2} /></FormField>
          <div className="flex items-center gap-4 mt-4">
            <GoldButton onClick={save}>{editing ? 'Save Changes' : 'Create Devotional'}</GoldButton>
            <OutlineButton onClick={() => setShowForm(false)}>Cancel</OutlineButton>
          </div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Devotionals" count={items.length} action={<GoldButton onClick={openNew} small>+ New Devotional</GoldButton>} />
      <div className="space-y-2">
        {items.map((d) => (
          <AdminCard key={d.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="text-center w-16 flex-shrink-0">
                <div className="text-sm font-bold" style={{ color: '#0F1E2E' }}>{new Date(d.publish_date + 'T00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}</div>
              </div>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{d.title}</div>
                <div className="flex items-center gap-2 mt-1"><PillarBadge pillar={d.pillar} /><span className="text-xs" style={{ color: '#8A9BAA' }}>{d.scripture_reference}</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <StatusBadge active={d.is_active} />
              <OutlineButton onClick={() => openEdit(d)} small>Edit</OutlineButton>
              <OutlineButton onClick={() => toggleActive(d)} small>{d.is_active ? 'Deactivate' : 'Activate'}</OutlineButton>
            </div>
          </AdminCard>
        ))}
      </div>
    </>
  );
}
