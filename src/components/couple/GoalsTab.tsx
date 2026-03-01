'use client';

import { useState } from 'react';
import { t } from '@/lib/tokens';
import { PILLAR_STYLES } from './constants';

interface GoalsTabProps {
  goals: any[];
  addGoal: (title: string, pillar: string) => void;
  completeGoal: (goalId: string) => void;
}

export function GoalsTab({ goals, addGoal, completeGoal }: GoalsTabProps) {
  const [goalTitle, setGoalTitle] = useState('');
  const [goalPillar, setGoalPillar] = useState('general');
  const [showGoalForm, setShowGoalForm] = useState(false);

  function handleAddGoal() {
    if (!goalTitle.trim()) return;
    addGoal(goalTitle, goalPillar);
    setGoalTitle('');
    setShowGoalForm(false);
  }

  return (
    <>
      {/* Add goal */}
      {showGoalForm ? (
        <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <input value={goalTitle} onChange={e => setGoalTitle(e.target.value)} placeholder="What do you want to work on together?" className="w-full px-4 py-3 rounded-xl border text-sm outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />
          <div className="flex gap-1.5 mb-3 flex-wrap">
            {Object.entries(PILLAR_STYLES).map(([key, ps]) => (
              <button key={key} onClick={() => setGoalPillar(key)} className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border" style={{ background: goalPillar === key ? ps.bg : t.bgCardHover, borderColor: goalPillar === key ? t.textLink : t.border, color: goalPillar === key ? ps.text : t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                {ps.icon} {ps.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowGoalForm(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer" style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>Cancel</button>
            <button onClick={handleAddGoal} disabled={!goalTitle.trim()} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: goalTitle.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}>Add Goal</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowGoalForm(true)} className="w-full rounded-2xl p-4 mb-3 text-center cursor-pointer border-none" style={{ background: t.bgCard, boxShadow: t.shadowCard, border: `1.5px dashed ${t.textLink}40` }}>
          <span className="text-sm font-semibold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>+ Add a Shared Goal</span>
        </button>
      )}

      {/* Goals list */}
      <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
        {goals.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: t.textMuted }}>No goals yet — set your first shared goal!</p>
        ) : (
          goals.map(g => {
            const ps = PILLAR_STYLES[g.pillar] || PILLAR_STYLES.general;
            return (
              <div key={g.id} className="flex items-center gap-3 mb-3 last:mb-0 p-3 rounded-xl" style={{ background: t.bgCardHover, border: `1px solid ${t.border}` }}>
                <span className="text-lg">{ps.icon}</span>
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>{g.title}</div>
                  <div className="text-xs mt-0.5" style={{ color: t.textMuted }}>
                    {ps.label} · Added {new Date(g.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
                <button onClick={() => completeGoal(g.id)} className="text-xs px-3 py-1.5 rounded-lg cursor-pointer border-none font-semibold" style={{ background: t.greenBg, color: t.green, fontFamily: 'Source Sans 3, sans-serif' }}>
                  Done ✓
                </button>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
