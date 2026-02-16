'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminCard, SectionHeader, GoldButton, OutlineButton, FormField, TextInput, TextArea, Select, PillarBadge, StatusBadge, PILLARS, useSupabase } from './AdminUI';

// ═══════════════════════════════════════
// ASSESSMENT TAB
// ═══════════════════════════════════════
export function AssessmentTab() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const supabase = useSupabase();
  const [form, setForm] = useState({ question_text: '', pillar: 'covenant', question_order: '', anchor_low: 'Strongly Disagree', anchor_high: 'Strongly Agree', is_reverse_scored: false });

  const load = useCallback(async () => {
    const { data } = await supabase.from('assessment_questions').select('*').order('question_order');
    if (data) setQuestions(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openEdit(q: any) {
    setEditing(q);
    setForm({ question_text: q.question_text, pillar: q.pillar, question_order: q.question_order.toString(), anchor_low: q.anchor_low, anchor_high: q.anchor_high, is_reverse_scored: q.is_reverse_scored });
  }

  async function save() {
    if (!editing) return;
    await supabase.from('assessment_questions').update({ ...form, question_order: parseInt(form.question_order) }).eq('id', editing.id);
    setEditing(null); load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;
  if (editing) {
    return (
      <>
        <SectionHeader title="Edit Question" action={<OutlineButton onClick={() => setEditing(null)}>Back</OutlineButton>} />
        <AdminCard>
          <FormField label="Question Text"><TextArea value={form.question_text} onChange={(v) => setForm({ ...form, question_text: v })} rows={3} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Pillar"><Select value={form.pillar} onChange={(v) => setForm({ ...form, pillar: v })} options={PILLARS} /></FormField>
            <FormField label="Order"><TextInput value={form.question_order} onChange={(v) => setForm({ ...form, question_order: v })} type="number" /></FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Low Anchor"><TextInput value={form.anchor_low} onChange={(v) => setForm({ ...form, anchor_low: v })} /></FormField>
            <FormField label="High Anchor"><TextInput value={form.anchor_high} onChange={(v) => setForm({ ...form, anchor_high: v })} /></FormField>
          </div>
          <label className="flex items-center gap-2 mt-2 cursor-pointer">
            <input type="checkbox" checked={form.is_reverse_scored} onChange={(e) => setForm({ ...form, is_reverse_scored: e.target.checked })} />
            <span className="text-sm" style={{ color: '#0F1E2E' }}>Reverse scored</span>
          </label>
          <div className="flex gap-3 mt-4"><GoldButton onClick={save}>Save</GoldButton><OutlineButton onClick={() => setEditing(null)}>Cancel</OutlineButton></div>
        </AdminCard>
      </>
    );
  }

  const grouped = PILLARS.map((p) => ({ ...p, questions: questions.filter((q) => q.pillar === p.value) }));
  return (
    <>
      <SectionHeader title="Assessment Questions" count={questions.length} />
      {grouped.map((g) => (
        <AdminCard key={g.value} className="mb-3">
          <div className="flex items-center gap-2 mb-3"><PillarBadge pillar={g.value} /><span className="text-xs" style={{ color: '#8A9BAA' }}>{g.questions.length} questions</span></div>
          <div className="space-y-2">
            {g.questions.map((q) => (
              <div key={q.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#FAF8F4', border: '1px solid #E0DCD4' }}>
                <div className="flex items-center gap-3 flex-1">
                  <span className="text-xs font-bold w-6" style={{ color: '#C7A23A' }}>#{q.question_order}</span>
                  <span className="text-sm" style={{ color: '#0F1E2E' }}>{q.question_text}</span>
                  {q.is_reverse_scored && <span className="text-xs px-1.5 py-0.5 rounded" style={{ background: '#FDF2F2', color: '#C44536' }}>R</span>}
                </div>
                <OutlineButton onClick={() => openEdit(q)} small>Edit</OutlineButton>
              </div>
            ))}
          </div>
        </AdminCard>
      ))}
    </>
  );
}

// ═══════════════════════════════════════
// EXERCISES TAB
// ═══════════════════════════════════════
export function ExercisesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = useSupabase();

  const CATEGORIES = [
    { value: 'conversation_starter', label: 'Conversation Starter' }, { value: 'date_night', label: 'Date Night' },
    { value: 'prayer', label: 'Prayer' }, { value: 'appreciation', label: 'Appreciation' },
    { value: 'conflict_prevention', label: 'Conflict Prevention' }, { value: 'intimacy_building', label: 'Intimacy Building' },
    { value: 'goal_setting', label: 'Goal Setting' }, { value: 'check_in', label: 'Check-In' },
    { value: 'fun_activity', label: 'Fun Activity' }, { value: 'spiritual_growth', label: 'Spiritual Growth' },
  ];

  const emptyForm = { title: '', description: '', pillar: 'covenant', category: 'conversation_starter', duration_minutes: '20', difficulty: 'medium', icon: '\uD83D\uDCAC', instructions: '[]', scripture_text: '', scripture_reference: '', is_active: true, display_order: '0' };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('couple_exercises').select('*').order('display_order');
    if (data) setItems(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, pillar: item.pillar, category: item.category, duration_minutes: item.duration_minutes?.toString() || '20', difficulty: item.difficulty || 'medium', icon: item.icon, instructions: JSON.stringify(item.instructions || [], null, 2), scripture_text: item.scripture_text || '', scripture_reference: item.scripture_reference || '', is_active: item.is_active, display_order: item.display_order?.toString() || '0' });
    setShowForm(true);
  }

  async function save() {
    let instructions; try { instructions = JSON.parse(form.instructions); } catch { instructions = []; }
    const payload = { ...form, duration_minutes: parseInt(form.duration_minutes) || 20, display_order: parseInt(form.display_order) || 0, instructions };
    if (editing) { await supabase.from('couple_exercises').update(payload).eq('id', editing.id); }
    else { await supabase.from('couple_exercises').insert(payload); }
    setShowForm(false); load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;
  if (showForm) {
    return (
      <>
        <SectionHeader title={editing ? 'Edit Exercise' : 'New Exercise'} action={<OutlineButton onClick={() => setShowForm(false)}>Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Icon"><TextInput value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} /></FormField>
            <FormField label="Pillar"><Select value={form.pillar} onChange={(v) => setForm({ ...form, pillar: v })} options={[...PILLARS, { value: 'fun', label: 'Fun' }]} /></FormField>
            <FormField label="Category"><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={CATEGORIES} /></FormField>
          </div>
          <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} /></FormField>
          <FormField label="Instructions (JSON array)"><TextArea value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} rows={6} /></FormField>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Duration (min)"><TextInput value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} type="number" /></FormField>
            <FormField label="Difficulty"><Select value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep' }]} /></FormField>
            <FormField label="Order"><TextInput value={form.display_order} onChange={(v) => setForm({ ...form, display_order: v })} type="number" /></FormField>
          </div>
          <div className="flex gap-3 mt-4"><GoldButton onClick={save}>{editing ? 'Save' : 'Create'}</GoldButton><OutlineButton onClick={() => setShowForm(false)}>Cancel</OutlineButton></div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Couple Exercises" count={items.length} action={<GoldButton onClick={openNew} small>+ New Exercise</GoldButton>} />
      <div className="space-y-2">
        {items.map((ex) => (
          <AdminCard key={ex.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{ex.icon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{ex.title}</div>
                <div className="flex items-center gap-2 mt-1"><PillarBadge pillar={ex.pillar} /><span className="text-xs" style={{ color: '#8A9BAA' }}>{ex.category.replace('_', ' ')} . {ex.duration_minutes}min</span></div>
              </div>
            </div>
            <div className="flex items-center gap-2"><StatusBadge active={ex.is_active} /><OutlineButton onClick={() => openEdit(ex)} small>Edit</OutlineButton></div>
          </AdminCard>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// GAMES TAB
// ═══════════════════════════════════════
export function GamesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = useSupabase();

  const GAME_TYPES = [
    { value: 'question_cards', label: 'Question Cards' }, { value: 'challenge', label: 'Challenge' },
    { value: 'date_night', label: 'Date Night' }, { value: 'appreciation', label: 'Appreciation' },
    { value: 'would_you_rather', label: 'Would You Rather' }, { value: 'memory', label: 'Memory' },
  ];

  const emptyForm = { title: '', description: '', game_type: 'question_cards', icon: '\uD83C\uDFB2', instructions: '', duration_minutes: '15', difficulty: 'easy', cards: '[]', best_for: '', is_active: true };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('marriage_games').select('*').order('created_at');
    if (data) setItems(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, game_type: item.game_type, icon: item.icon, instructions: item.instructions || '', duration_minutes: item.duration_minutes?.toString() || '15', difficulty: item.difficulty || 'easy', cards: JSON.stringify(item.cards || [], null, 2), best_for: item.best_for || '', is_active: item.is_active });
    setShowForm(true);
  }

  async function save() {
    let cards; try { cards = JSON.parse(form.cards); } catch { cards = []; }
    const payload = { ...form, duration_minutes: parseInt(form.duration_minutes) || 15, cards };
    if (editing) { await supabase.from('marriage_games').update(payload).eq('id', editing.id); }
    else { await supabase.from('marriage_games').insert(payload); }
    setShowForm(false); load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;
  if (showForm) {
    return (
      <>
        <SectionHeader title={editing ? 'Edit Game' : 'New Game'} action={<OutlineButton onClick={() => setShowForm(false)}>Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Icon"><TextInput value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} /></FormField>
            <FormField label="Game Type"><Select value={form.game_type} onChange={(v) => setForm({ ...form, game_type: v })} options={GAME_TYPES} /></FormField>
            <FormField label="Difficulty"><Select value={form.difficulty} onChange={(v) => setForm({ ...form, difficulty: v })} options={[{ value: 'easy', label: 'Easy' }, { value: 'medium', label: 'Medium' }, { value: 'deep', label: 'Deep' }]} /></FormField>
          </div>
          <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} /></FormField>
          <FormField label="Instructions"><TextArea value={form.instructions} onChange={(v) => setForm({ ...form, instructions: v })} rows={4} /></FormField>
          <FormField label="Cards (JSON array)"><TextArea value={form.cards} onChange={(v) => setForm({ ...form, cards: v })} rows={8} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Duration (min)"><TextInput value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} type="number" /></FormField>
            <FormField label="Best For"><TextInput value={form.best_for} onChange={(v) => setForm({ ...form, best_for: v })} placeholder="e.g. date night, car ride" /></FormField>
          </div>
          <div className="flex gap-3 mt-4"><GoldButton onClick={save}>{editing ? 'Save' : 'Create'}</GoldButton><OutlineButton onClick={() => setShowForm(false)}>Cancel</OutlineButton></div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Marriage Games" count={items.length} action={<GoldButton onClick={openNew} small>+ New Game</GoldButton>} />
      <div className="space-y-2">
        {items.map((g) => (
          <AdminCard key={g.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{g.icon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{g.title}</div>
                <div className="text-xs mt-1" style={{ color: '#8A9BAA' }}>{g.game_type.replace('_', ' ')} . {g.duration_minutes}min . {(g.cards || []).length} cards</div>
              </div>
            </div>
            <div className="flex items-center gap-2"><StatusBadge active={g.is_active} /><OutlineButton onClick={() => openEdit(g)} small>Edit</OutlineButton></div>
          </AdminCard>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// CONFLICT TOOLS TAB
// ═══════════════════════════════════════
export function ConflictTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = useSupabase();

  const emptyForm = { title: '', description: '', icon: '\uD83D\uDEE0\uFE0F', urgency: 'medium', duration_minutes: '10', steps: '[]', scripture_text: '', scripture_reference: '', display_order: '0', is_active: true };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('conflict_tools').select('*').order('display_order');
    if (data) setItems(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, icon: item.icon, urgency: item.urgency, duration_minutes: item.duration_minutes?.toString() || '10', steps: JSON.stringify(item.steps || [], null, 2), scripture_text: item.scripture_text || '', scripture_reference: item.scripture_reference || '', display_order: item.display_order?.toString() || '0', is_active: item.is_active });
    setShowForm(true);
  }

  async function save() {
    let steps; try { steps = JSON.parse(form.steps); } catch { steps = []; }
    const payload = { ...form, duration_minutes: parseInt(form.duration_minutes) || 10, display_order: parseInt(form.display_order) || 0, steps };
    if (editing) { await supabase.from('conflict_tools').update(payload).eq('id', editing.id); }
    else { await supabase.from('conflict_tools').insert(payload); }
    setShowForm(false); load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;
  if (showForm) {
    return (
      <>
        <SectionHeader title={editing ? 'Edit Tool' : 'New Conflict Tool'} action={<OutlineButton onClick={() => setShowForm(false)}>Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Icon"><TextInput value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} /></FormField>
            <FormField label="Urgency"><Select value={form.urgency} onChange={(v) => setForm({ ...form, urgency: v })} options={[{ value: 'immediate', label: 'Immediate' }, { value: 'medium', label: 'Medium' }, { value: 'reflective', label: 'Reflective' }]} /></FormField>
            <FormField label="Duration (min)"><TextInput value={form.duration_minutes} onChange={(v) => setForm({ ...form, duration_minutes: v })} type="number" /></FormField>
          </div>
          <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={3} /></FormField>
          <FormField label="Steps (JSON array)"><TextArea value={form.steps} onChange={(v) => setForm({ ...form, steps: v })} rows={10} /></FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Scripture Text"><TextArea value={form.scripture_text} onChange={(v) => setForm({ ...form, scripture_text: v })} rows={2} /></FormField>
            <FormField label="Scripture Reference"><TextInput value={form.scripture_reference} onChange={(v) => setForm({ ...form, scripture_reference: v })} /></FormField>
          </div>
          <div className="flex gap-3 mt-4"><GoldButton onClick={save}>{editing ? 'Save' : 'Create'}</GoldButton><OutlineButton onClick={() => setShowForm(false)}>Cancel</OutlineButton></div>
        </AdminCard>
      </>
    );
  }

  return (
    <>
      <SectionHeader title="Conflict Tools" count={items.length} action={<GoldButton onClick={openNew} small>+ New Tool</GoldButton>} />
      <div className="space-y-2">
        {items.map((t) => (
          <AdminCard key={t.id} className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{t.icon}</span>
              <div>
                <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{t.title}</div>
                <div className="text-xs mt-1" style={{ color: '#8A9BAA' }}>{t.urgency} . {t.duration_minutes}min . {(t.steps || []).length} steps</div>
              </div>
            </div>
            <div className="flex items-center gap-2"><StatusBadge active={t.is_active} /><OutlineButton onClick={() => openEdit(t)} small>Edit</OutlineButton></div>
          </AdminCard>
        ))}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// MILESTONES TAB
// ═══════════════════════════════════════
export function MilestonesTab() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [showForm, setShowForm] = useState(false);
  const supabase = useSupabase();

  const emptyForm = { title: '', description: '', icon: '\uD83C\uDFC6', category: 'devotional', condition_type: 'count', condition_value: '1', is_active: true };
  const [form, setForm] = useState(emptyForm);

  const load = useCallback(async () => {
    const { data } = await supabase.from('milestones').select('*').order('category, condition_value');
    if (data) setItems(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  function openNew() { setEditing(null); setForm(emptyForm); setShowForm(true); }
  function openEdit(item: any) {
    setEditing(item);
    setForm({ title: item.title, description: item.description, icon: item.icon, category: item.category, condition_type: item.condition_type, condition_value: item.condition_value?.toString() || '1', is_active: item.is_active });
    setShowForm(true);
  }

  async function save() {
    const payload = { ...form, condition_value: parseInt(form.condition_value) || 1 };
    if (editing) { await supabase.from('milestones').update(payload).eq('id', editing.id); }
    else { await supabase.from('milestones').insert(payload); }
    setShowForm(false); load();
  }

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;
  if (showForm) {
    return (
      <>
        <SectionHeader title={editing ? 'Edit Milestone' : 'New Milestone'} action={<OutlineButton onClick={() => setShowForm(false)}>Back</OutlineButton>} />
        <AdminCard>
          <div className="grid grid-cols-3 gap-4">
            <FormField label="Icon"><TextInput value={form.icon} onChange={(v) => setForm({ ...form, icon: v })} /></FormField>
            <FormField label="Category"><Select value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={[
              { value: 'devotional', label: 'Devotional' }, { value: 'streak', label: 'Streak' },
              { value: 'assessment', label: 'Assessment' }, { value: 'exercise', label: 'Exercise' },
              { value: 'reset', label: 'Reset' }, { value: 'couple', label: 'Couple' },
            ]} /></FormField>
            <FormField label="Condition Value"><TextInput value={form.condition_value} onChange={(v) => setForm({ ...form, condition_value: v })} type="number" /></FormField>
          </div>
          <FormField label="Title"><TextInput value={form.title} onChange={(v) => setForm({ ...form, title: v })} /></FormField>
          <FormField label="Description"><TextArea value={form.description} onChange={(v) => setForm({ ...form, description: v })} rows={2} /></FormField>
          <div className="flex gap-3 mt-4"><GoldButton onClick={save}>{editing ? 'Save' : 'Create'}</GoldButton><OutlineButton onClick={() => setShowForm(false)}>Cancel</OutlineButton></div>
        </AdminCard>
      </>
    );
  }

  const grouped = ['devotional', 'streak', 'assessment', 'exercise', 'reset', 'couple'].map((cat) => ({
    category: cat, items: items.filter((m) => m.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <>
      <SectionHeader title="Milestones" count={items.length} action={<GoldButton onClick={openNew} small>+ New Milestone</GoldButton>} />
      {grouped.map((g) => (
        <AdminCard key={g.category} className="mb-3">
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#5A6B7A' }}>{g.category}</div>
          <div className="space-y-2">
            {g.items.map((m) => (
              <div key={m.id} className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#FAF8F4', border: '1px solid #E0DCD4' }}>
                <div className="flex items-center gap-3">
                  <span className="text-xl">{m.icon}</span>
                  <div>
                    <div className="text-sm font-medium" style={{ color: '#0F1E2E' }}>{m.title}</div>
                    <div className="text-xs" style={{ color: '#8A9BAA' }}>{m.condition_type}: {m.condition_value}</div>
                  </div>
                </div>
                <OutlineButton onClick={() => openEdit(m)} small>Edit</OutlineButton>
              </div>
            ))}
          </div>
        </AdminCard>
      ))}
    </>
  );
}

// ═══════════════════════════════════════
// USERS TAB
// ═══════════════════════════════════════
export function UsersTab() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('admin_list_profiles');
    if (data) setUsers(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;

  const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
    super_admin: { bg: '#FDF2F2', text: '#C44536' },
    spouse: { bg: '#F0F7EC', text: '#5B8A3C' },
    individual: { bg: '#E3F2FD', text: '#1565C0' },
  };

  return (
    <>
      <SectionHeader title="Users" count={users.length} />
      <div className="space-y-2">
        {users.map((u) => {
          const rc = ROLE_COLORS[u.role] || ROLE_COLORS.individual;
          return (
            <AdminCard key={u.id} className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ background: '#F5ECD7', color: '#B8860B' }}>
                  {(u.first_name || u.email || '?')[0].toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{u.first_name ? u.first_name + ' ' + (u.last_name || '') : 'Not onboarded'}</div>
                  <div className="text-xs" style={{ color: '#8A9BAA' }}>{u.email}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: rc.bg, color: rc.text }}>{u.role}</span>
                {u.onboarding_completed && <span className="text-xs" style={{ color: '#5B8A3C' }}>Onboarded</span>}
              </div>
            </AdminCard>
          );
        })}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// CHURCHES TAB
// ═══════════════════════════════════════
export function ChurchesTab() {
  const [churches, setChurches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = useSupabase();

  const load = useCallback(async () => {
    const { data } = await supabase.from('churches').select('*').order('name');
    if (data) setChurches(data);
    setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;

  return (
    <>
      <SectionHeader title="Churches" count={churches.length} />
      {churches.length === 0 ? (
        <AdminCard><p className="text-sm text-center py-4" style={{ color: '#8A9BAA' }}>No churches registered yet.</p></AdminCard>
      ) : churches.map((ch) => (
        <AdminCard key={ch.id} className="mb-3">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-semibold" style={{ color: '#0F1E2E' }}>{ch.name}</div>
              <div className="text-xs" style={{ color: '#8A9BAA' }}>{ch.denomination || 'No denomination'} . {ch.city || 'No city'}</div>
            </div>
            <StatusBadge active={ch.is_active} />
          </div>
        </AdminCard>
      ))}
    </>
  );
}
