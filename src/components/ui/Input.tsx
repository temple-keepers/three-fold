'use client';

import { useState } from 'react';

interface InputProps {
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}

export function Input({ label, type = 'text', value, onChange, placeholder, required }: InputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="mb-5">
      {label && (
        <label
          className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
          style={{ color: 'var(--text-secondary)', fontFamily: 'Source Sans 3, sans-serif' }}
        >
          {label}
        </label>
      )}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        className="w-full px-4 py-3.5 rounded-xl border text-base outline-none"
        style={{
          background: 'var(--bg-input)',
          borderColor: focused ? '#B8860B' : 'var(--border)',
          borderWidth: '1.5px',
          color: 'var(--text-primary)',
          fontFamily: 'Source Sans 3, sans-serif',
          transition: 'border-color 0.3s ease',
        }}
      />
    </div>
  );
}
