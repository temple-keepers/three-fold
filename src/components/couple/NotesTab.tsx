'use client';

import { useState } from 'react';
import { t } from '@/lib/tokens';
import { NOTE_TYPES } from './constants';

interface NotesTabProps {
  profile: any;
  partner: any;
  notes: any[];
  sendLoveNote: (message: string, noteType: string) => void;
}

export function NotesTab({ profile, partner, notes, sendLoveNote }: NotesTabProps) {
  const [noteMessage, setNoteMessage] = useState('');
  const [noteType, setNoteType] = useState('love');

  function handleSend() {
    if (!noteMessage.trim()) return;
    sendLoveNote(noteMessage, noteType);
    setNoteMessage('');
  }

  return (
    <>
      {/* Send note */}
      <div className="rounded-2xl p-5 mb-3" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          Send {partner?.first_name} a note
        </div>

        <div className="flex gap-1.5 mb-3 flex-wrap">
          {Object.entries(NOTE_TYPES).map(([key, nt]) => (
            <button key={key} onClick={() => setNoteType(key)} className="px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-all" style={{ background: noteType === key ? nt.bg : t.bgCardHover, borderColor: noteType === key ? t.textLink : t.border, color: noteType === key ? t.textPrimary : t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
              {nt.icon} {nt.label}
            </button>
          ))}
        </div>

        <textarea value={noteMessage} onChange={e => setNoteMessage(e.target.value)} placeholder={`Write something from the heart...`} rows={3} className="w-full px-4 py-3 rounded-xl border text-sm resize-none outline-none mb-3" style={{ borderColor: t.border, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }} />

        <button onClick={handleSend} disabled={!noteMessage.trim()} className="w-full py-3 rounded-xl text-sm font-semibold text-white border-none cursor-pointer" style={{ fontFamily: 'Source Sans 3, sans-serif', background: noteMessage.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}>
          Send 💌
        </button>
      </div>

      {/* Note history */}
      <div className="rounded-2xl p-5" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
        <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
          Note History
        </div>
        {notes.length === 0 ? (
          <p className="text-sm text-center py-4" style={{ color: t.textMuted }}>No notes yet — send the first one!</p>
        ) : (
          notes.map(n => {
            const nt = NOTE_TYPES[n.note_type] || NOTE_TYPES.love;
            const isMine = n.sender_id === profile?.id;
            return (
              <div key={n.id} className="flex items-start gap-3 mb-4 last:mb-0 p-3 rounded-xl" style={{ background: isMine ? t.bgCardHover : nt.bg }}>
                <span className="text-lg flex-shrink-0">{nt.icon}</span>
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: t.textMuted, fontFamily: 'Source Sans 3, sans-serif' }}>
                    {isMine ? 'You' : partner?.first_name} · {new Date(n.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-sm" style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textPrimary, lineHeight: 1.6 }}>
                    {n.message}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
