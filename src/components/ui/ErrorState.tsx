'use client';

import { t } from '@/lib/tokens';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

export function ErrorState({
  title = 'Something went wrong',
  message = 'Please check your connection and try again.',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div
        className="rounded-2xl p-4 flex items-center gap-3"
        style={{ background: t.bgCard, border: `1.5px solid #e8433020`, boxShadow: t.shadowCard }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
          style={{ background: '#e8433010' }}
        >
          ⚠️
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif' }}>
            {title}
          </div>
          <div className="text-xs" style={{ color: t.textMuted }}>{message}</div>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex-shrink-0"
            style={{ background: t.bgAccent, color: t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
          >
            Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
      <div className="text-center max-w-sm">
        <div className="text-4xl mb-4">⚠️</div>
        <h2
          className="text-xl font-medium mb-2 m-0"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}
        >
          {title}
        </h2>
        <p
          className="text-sm mb-6 m-0"
          style={{ fontFamily: 'Source Sans 3, sans-serif', color: t.textMuted, lineHeight: 1.6 }}
        >
          {message}
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-3 rounded-2xl text-sm font-semibold text-white border-none cursor-pointer"
            style={{
              fontFamily: 'Source Sans 3, sans-serif',
              background: 'linear-gradient(135deg, #B8860B, #8B6914)',
              boxShadow: '0 4px 16px rgba(184,134,11,0.2)',
            }}
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

export function OfflineBanner() {
  return (
    <div
      className="fixed top-0 left-0 right-0 z-50 text-center py-2 px-4"
      style={{
        background: '#e84330',
        color: '#fff',
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      You&apos;re offline. Some features may not work.
    </div>
  );
}
