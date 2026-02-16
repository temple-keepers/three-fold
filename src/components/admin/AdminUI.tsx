'use client';

import { createClient } from '@/lib/supabase-browser';

// ─── Shared Constants ───
export const PILLARS = [
  { value: 'covenant', label: 'Covenant' },
  { value: 'emotional_safety', label: 'Emotional Safety' },
  { value: 'communication', label: 'Communication' },
  { value: 'spiritual', label: 'Spiritual' },
];

export const PILLAR_COLORS: Record<string, string> = {
  covenant: '#B8860B', emotional_safety: '#5E35B1', communication: '#1565C0',
  spiritual: '#33691E', fun: '#E65100', general: '#7A7062',
};

// ─── Shared UI Components ───
export function AdminCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl p-5 ${className}`} style={{ boxShadow: '0 2px 12px rgba(44,36,24,0.04)' }}>
      {children}
    </div>
  );
}

export function SectionHeader({ title, count, action }: { title: string; count?: number; action?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-2">
        <h2 className="text-lg font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#0F1E2E' }}>{title}</h2>
        {count !== undefined && (
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: '#F5ECD7', color: '#B8860B', fontWeight: 600 }}>{count}</span>
        )}
      </div>
      {action}
    </div>
  );
}

export function GoldButton({ children, onClick, disabled, small }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; small?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      className={`${small ? 'px-3 py-1.5 text-xs' : 'px-5 py-2.5 text-sm'} rounded-xl font-semibold text-white border-none cursor-pointer`}
      style={{ fontFamily: 'DM Sans, sans-serif', background: disabled ? '#E8E2D8' : 'linear-gradient(135deg, #C7A23A, #A8862E)', cursor: disabled ? 'not-allowed' : 'pointer' }}>
      {children}
    </button>
  );
}

export function OutlineButton({ children, onClick, small, danger }: { children: React.ReactNode; onClick: () => void; small?: boolean; danger?: boolean }) {
  return (
    <button onClick={onClick}
      className={`${small ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm'} rounded-xl font-semibold cursor-pointer`}
      style={{ fontFamily: 'DM Sans, sans-serif', background: 'transparent', border: `1.5px solid ${danger ? '#C44536' : '#E0DCD4'}`, color: danger ? '#C44536' : '#5A6B7A' }}>
      {children}
    </button>
  );
}

export function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif' }}>{label}</label>
      {children}
    </div>
  );
}

export function TextInput({ value, onChange, placeholder, type = 'text' }: { value: string; onChange: (v: string) => void; placeholder?: string; type?: string }) {
  return (
    <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
      style={{ background: '#FAF8F4', borderColor: '#E0DCD4', color: '#0F1E2E', fontFamily: 'DM Sans, sans-serif' }} />
  );
}

export function TextArea({ value, onChange, placeholder, rows = 4 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return (
    <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none resize-y"
      style={{ background: '#FAF8F4', borderColor: '#E0DCD4', color: '#0F1E2E', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }} />
  );
}

export function Select({ value, onChange, options }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[] }) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)}
      className="w-full px-4 py-3 rounded-xl border text-sm outline-none"
      style={{ background: '#FAF8F4', borderColor: '#E0DCD4', color: '#0F1E2E', fontFamily: 'DM Sans, sans-serif' }}>
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}

export function PillarBadge({ pillar }: { pillar: string }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: `${PILLAR_COLORS[pillar] || '#7A7062'}18`, color: PILLAR_COLORS[pillar] || '#7A7062' }}>
      {pillar.replace('_', ' ')}
    </span>
  );
}

export function StatusBadge({ active }: { active: boolean }) {
  return (
    <span className="text-xs px-2 py-0.5 rounded-full font-semibold"
      style={{ background: active ? '#F0F7EC' : '#FDF2F2', color: active ? '#5B8A3C' : '#C44536' }}>
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export function useSupabase() {
  return createClient();
}
