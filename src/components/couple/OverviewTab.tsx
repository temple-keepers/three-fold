'use client';

import { t } from '@/lib/tokens';
import { NOTE_TYPES, PILLAR_STYLES } from './constants';

type Tab = 'overview' | 'exercises' | 'checkin' | 'notes' | 'goals';

interface OverviewTabProps {
  profile: any;
  partner: any;
  notes: any[];
  goals: any[];
  setTab: (tab: Tab) => void;
  completeGoal: (goalId: string) => void;
}

export function OverviewTab({ profile, partner, notes, goals, setTab, completeGoal }: OverviewTabProps) {
  return (
    <>
      {/* Couple streaks */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
              {profile?.first_name}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span>🔥</span>
              <span className="text-2xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                {profile?.streak_count || 0}
              </span>
            </div>
            <span className="text-xs" style={{ color: t.textMuted }}>day streak</span>
          </div>
          <div className="text-center">
            <div className="text-sm font-semibold mb-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
              {partner?.first_name}
            </div>
            <div className="flex items-center justify-center gap-1.5">
              <span>🔥</span>
              <span className="text-2xl font-bold" style={{ color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}>
                {partner?.streak_count || 0}
              </span>
            </div>
            <span className="text-xs" style={{ color: t.textMuted }}>day streak</span>
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        <button onClick={() => setTab('checkin')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <span className="text-xl">📋</span>
          <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Check-In</div>
        </button>
        <button onClick={() => setTab('notes')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <span className="text-xl">💌</span>
          <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Send Note</div>
        </button>
        <button onClick={() => setTab('exercises')} className="rounded-xl p-3 text-center cursor-pointer border-none transition-all hover:-translate-y-0.5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <span className="text-xl">✏️</span>
          <div className="text-xs font-semibold mt-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>Exercise</div>
        </button>
      </div>

      {/* Recent notes */}
      {notes.length > 0 && (
        <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
            Recent Love Notes
          </div>
          {notes.slice(0, 3).map(n => {
            const nt = NOTE_TYPES[n.note_type] || NOTE_TYPES.love;
            const isMine = n.sender_id === profile?.id;
            return (
              <div key={n.id} className="flex items-start gap-3 mb-3 last:mb-0">
                <span className="text-lg">{nt.icon}</span>
                <div className="flex-1">
                  <div className="text-xs mb-0.5" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    {isMine ? 'You' : partner?.first_name} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </div>
                  <div className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.5 }}>
                    {n.message}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Goals */}
      {goals.length > 0 && (
        <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
            Active Goals
          </div>
          {goals.slice(0, 3).map(g => {
            const ps = PILLAR_STYLES[g.pillar] || PILLAR_STYLES.general;
            return (
              <div key={g.id} className="flex items-center gap-3 mb-2.5 last:mb-0">
                <span className="text-sm">{ps.icon}</span>
                <span className="text-sm flex-1" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary }}>
                  {g.title}
                </span>
                <button
                  onClick={() => completeGoal(g.id)}
                  className="text-xs px-2.5 py-1 rounded-lg cursor-pointer border-none"
                  style={{ background: t.greenBg, color: t.green, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}
                >
                  Done ✓
                </button>
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
