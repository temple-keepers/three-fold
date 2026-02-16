'use client';

interface RadioOption {
  value: string;
  label: string;
  icon?: string;
}

interface RadioCardsProps {
  options: RadioOption[];
  value?: string;
  onChange: (value: string) => void;
  columns?: number;
}

export function RadioCards({ options, value, onChange, columns = 2 }: RadioCardsProps) {
  return (
    <div className="grid gap-3 mb-5" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className="py-4 px-3.5 text-center rounded-xl border cursor-pointer transition-all"
            style={{
              background: selected ? 'var(--pillar-covenant-bg)' : 'var(--bg-input)',
              borderColor: selected ? '#B8860B' : 'var(--border)',
              borderWidth: '1.5px',
              transform: selected ? 'scale(1.02)' : 'scale(1)',
            }}
          >
            {opt.icon && <div className="text-2xl mb-1.5">{opt.icon}</div>}
            <div
              className="text-sm"
              style={{
                fontFamily: 'Source Sans 3, sans-serif',
                fontWeight: selected ? 700 : 500,
                color: selected ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              {opt.label}
            </div>
          </button>
        );
      })}
    </div>
  );
}
