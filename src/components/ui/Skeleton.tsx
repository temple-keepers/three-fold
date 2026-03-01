'use client';

/**
 * Skeleton loading components for perceived performance.
 * Drop-in replacements for content that's still loading.
 */

interface SkeletonProps {
  className?: string;
  style?: React.CSSProperties;
}

export function Skeleton({ className = '', style }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-lg ${className}`}
      style={{
        background: 'var(--bg-card-hover)',
        ...style,
      }}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-3.5"
          style={{ width: i === lines - 1 ? '60%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div
      className={`rounded-2xl p-5 ${className}`}
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-3 mb-4">
        <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
        <div className="flex-1">
          <Skeleton className="h-3 w-24 mb-2" />
          <Skeleton className="h-4 w-48" />
        </div>
      </div>
      <SkeletonText lines={2} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-primary)' }}>
      <div className="max-w-lg mx-auto px-4 py-5">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <Skeleton className="w-7 h-7 rounded-full" />
            <div>
              <Skeleton className="h-5 w-40 mb-1" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
          <Skeleton className="w-8 h-8 rounded-full" />
        </div>

        {/* Streak bar */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Skeleton className="w-20 h-6" />
              <Skeleton className="w-16 h-5" />
            </div>
            <Skeleton className="w-24 h-7 rounded-full" />
          </div>
        </div>

        {/* Devotional card */}
        <SkeletonCard className="mb-4" />

        {/* Together card */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center gap-3.5">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-24 mb-1.5" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
        </div>

        {/* Nudge */}
        <div className="rounded-2xl p-4 mb-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-start gap-3.5">
            <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
            <div className="flex-1">
              <Skeleton className="h-3 w-28 mb-2" />
              <Skeleton className="h-3.5 w-full mb-1" />
              <Skeleton className="h-3.5 w-3/4" />
            </div>
          </div>
        </div>

        {/* Journey */}
        <div className="rounded-2xl p-5 mb-4" style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div className="flex items-center justify-between mb-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
          </div>
          <Skeleton className="h-2.5 w-full rounded-full mb-2" />
          <div className="flex justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-8" />
          </div>
        </div>
      </div>
    </div>
  );
}
