export function ProgressDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex gap-2 justify-center py-4">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="h-2 rounded-full transition-all duration-400"
          style={{
            width: i === current ? 24 : 8,
            background: i === current ? '#B8860B' : i < current ? 'var(--pillar-covenant-bg)' : 'var(--border)',
          }}
        />
      ))}
    </div>
  );
}
