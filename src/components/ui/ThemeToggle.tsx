'use client';

import { useTheme } from '@/lib/theme';

export function ThemeToggle({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const { resolved, toggle } = useTheme();
  const dim = size === 'sm' ? 32 : 40;
  const iconSize = size === 'sm' ? 16 : 20;

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${resolved === 'light' ? 'dark' : 'light'} mode`}
      className="relative flex items-center justify-center rounded-full border-none cursor-pointer transition-all hover:scale-105"
      style={{
        width: dim,
        height: dim,
        background: resolved === 'dark'
          ? 'rgba(199,162,58,0.12)'
          : 'rgba(15,30,46,0.06)',
      }}
    >
      {/* Sun */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={resolved === 'light' ? '#B8860B' : 'transparent'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          opacity: resolved === 'light' ? 1 : 0,
          transform: resolved === 'light' ? 'rotate(0deg) scale(1)' : 'rotate(90deg) scale(0.5)',
          transition: 'all 0.3s ease',
        }}
      >
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
      {/* Moon */}
      <svg
        width={iconSize}
        height={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke={resolved === 'dark' ? '#D4B45A' : 'transparent'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          position: 'absolute',
          opacity: resolved === 'dark' ? 1 : 0,
          transform: resolved === 'dark' ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0.5)',
          transition: 'all 0.3s ease',
        }}
      >
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    </button>
  );
}
