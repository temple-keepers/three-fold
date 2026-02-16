'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminCard, SectionHeader, GoldButton, OutlineButton, FormField, TextInput, TextArea, Select, useSupabase } from './AdminUI';

const TYPE_ICONS: Record<string, string> = {
  teaching: '📖', reflection: '💭', exercise: '✏️', couple_activity: '👥',
  rest: '☁️', review: '📊', game: '🎲', conflict_tool: '🛠️',
};

const CONTENT_TYPES = [
  { value: 'teaching', label: 'Teaching' }, { value: 'reflection', label: 'Reflection' },
  { value: 'exercise', label: 'Exercise' }, { value: 'couple_activity', label: 'Couple Activity' },
  { value: 'rest', label: 'Rest' }, { value: 'review', label: 'Review' },
  { value: 'game', label: 'Game' }, { value: 'conflict_tool', label: 'Conflict Tool' },
];

export function ResetTab() {
  const [phases, setPhases] = useState<any[]>([]);
  const [weeks, setWeeks] = useState<any[]>([]);
  const [days, setDays] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDay, setEditingDay] = useState<any | null>(null);
  const [expandedWeek, setExpandedWeek] = useState<string | null>(null);
  const supabase = useSupabase();

  const [form, setForm] = useState({
    title: '', content_type: 'teaching', teaching_text: '', scripture_text: '', scripture_reference: '',
    exercise_title: '', exercise_instructions: '', exercise_duration_minutes: '',
    is_couple_exercise: false, reflection_prompt: '', discussion_question: '',
  });

  const load = useCallback(async () => {
    const [{ data: ph }, { data: wk }, { data: dy }] = await Promise.all([
      supabase.from('reset_phases').select('*').order('phase_number'),
      supabase.from('reset_weeks').select('*').order('week_number'),
      supabase.from('reset_days').select('*').order('day_number'),
    ]);
    if (ph) setPhases(ph);
    if (wk) setWeeks(wk);
    if (dy) setDays(dy);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  function openEdit(day: any) {
    setEditingDay(day);
    setForm({
      title: day.title, content_type: day.content_type, teaching_text: day.teaching_text || '',
      scripture_text: day.scripture_text || '', scripture_reference: day.scripture_reference || '',
      exercise_title: day.exercise_title || '', exercise_instructions: day.exercise_instructions || '',
      exercise_duration_minutes: day.exercise_duration_minutes?.toString() || '',
      is_couple_exercise: day.is_couple_exercise || false, reflection_prompt: day.reflection_prompt || '',
      discussion_question: day.discussion_question || '',
    });
  }

  async function saveDay() {
    if (!editingDay) return;
    await supabase.from('reset_days').update({
      ...form,
      exercise_duration_minutes: form.exercise_duration_minutes ? parseInt(form.exercise_duration_minutes) : null,
      exercise_title: form.exercise_title || null, exercise_instructions: form.exercise_instructions || null,
      scripture_text: form.scripture_text || null, reflection_prompt: form.reflection_prompt || null,
      discussion_question: form.discussion_question || null,
    }).eq('id', editingDay.id);
    setEditingDay(null);
    load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;

  if (editingDay) {
    return (
      <>
        <SectionHeader title={`Edit Day ${editingDay.day_number}: ${editingDay.title}`} action={<OutlineButton onClick={() => setEditingDay(null)}>← Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></FormField>
            <FormField label="Content Type"><Select value={form.content_type} onChange={(v) => setForm({ ...form, content_type: v })} options={CONTENT_TYPES} /></FormField>
          </div>
          <FormField label="Teaching Text"><TextArea value={form.teaching_text} onChange={(v) => setForm({ ...form, teaching_text: v })} rows={6} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Scripture Text"><TextArea value={form.scripture_text} onChange={(v) => setForm({ ...form, scripture_text: v })} rows={3} /></FormField>
            <FormField label="Scripture Reference"><TextInput value={form.scripture_reference} onChange={(v) => setForm({ ...form, scripture_reference: v })} /></FormField>
          </div>
          <FormField label="Exercise Title"><TextInput value={form.exercise_title} onChange={(v) => setForm({ ...form, exercise_title: v })} /></FormField>
          <FormField label="Exercise Instructions"><TextArea value={form.exercise_instructions} onChange={(v) => setForm({ ...form, exercise_instructions: v })} rows={4} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (minutes)"><TextInput value={form.exercise_duration_minutes} onChange={(v) => setForm({ ...form, exercise_duration_minutes: v })} type="number" /></FormField>
            <FormField label="Couple Exercise">
              <label className="flex items-center gap-2 py-3 cursor-pointer">
                <input type="checkbox" checked={form.is_couple_exercise} onChange={(e) => setForm({ ...form, is_couple_exercise: e.target.checked })} />
                <span className="text-sm" style={{ color: '#0F1E2E' }}>This is a couple exercise</span>
              </label>
            </FormField>
          </div>
          <FormField label="Reflection Prompt"><TextArea value={form.reflection_prompt} onChange={(v) => setForm({ ...form, reflection_prompt: v })} rows={3} /></FormField>
          <FormField label="Discussion Question"><TextArea value={form.discussion_question} onChange={(v) => setForm({ ...form, discussion_question: v })} rows={2} /></FormField>
          <div className="flex gap-3 mt-4">
            <GoldButton onClick={saveDay}>Save Day</GoldButton>
            <OutlineButton onClick={() => setEditingDay(null)}>Cancel</OutlineButton>
          </div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="60-Day Reset Content" count={days.length} />
      {weeks.map((week) => {
        const weekDays = days.filter((d) => d.week_id === week.id);
        const phase = phases.find((p) => p.id === week.phase_id);
        const expanded = expandedWeek === week.id;
        return (
          <AdminCard key={week.id} className="mb-3">
            <button onClick={() => setExpandedWeek(expanded ? null : week.id)} className="w-full flex items-center justify-between border-none bg-transparent cursor-pointer text-left p-0">
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{week.title}</div>
                <div className="text-xs mt-0.5" style={{ color: '#8A9BAA' }}>Phase {phase?.phase_number}: {phase?.title} · {week.theme} · {weekDays.length} days</div>
              </div>
              <span style={{ color: '#8A9BAA' }}>{expanded ? '▲' : '▼'}</span>
            </button>
            {expanded && (
              <div className="mt-4 space-y-2">
                {weekDays.map((day) => (
                  <div key={day.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#FAF8F4', border: '1px solid #E0DCD4' }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-bold w-8" style={{ color: '#C7A23A' }}>D{day.day_number}</span>
                      <span>{TYPE_ICONS[day.content_type] || '📄'}</span>
                      <div>
                        <div className="text-sm font-medium" style={{ color: '#0F1E2E' }}>{day.title}</div>
                        <div className="text-xs" style={{ color: '#8A9BAA' }}>{day.content_type.replace('_', ' ')} · {day.scripture_reference}{day.is_couple_exercise && ' · 👥 couple'}</div>
                      </div>
                    </div>
                    <OutlineButton onClick={() => openEdit(day)} small>Edit</OutlineButton>
                  </div>
                ))}
              </div>
            )}
          </AdminCard>
        );
      })}
    </>
  );
}
