'use client';

import { useRouter } from 'next/navigation';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

interface Props {
  title: string;
  subtitle?: string;
  backHref?: string;      // If set, shows a back arrow
  showBack?: boolean;     // override to show/hide back arrow
  trailing?: React.ReactNode;  // custom right-side content
  showThemeToggle?: boolean;
  sticky?: boolean;
  transparent?: boolean;
}

export function TopBar({
  title,
  subtitle,
  backHref,
  showBack = true,
  trailing,
  showThemeToggle = true,
  sticky = true,
  transparent = false,
}: Props) {
  const router = useRouter();

  return (
    <header
      className={`${sticky ? 'sticky top-0 z-40' : 'relative z-10'} backdrop-blur-xl`}
      style={{
        background: transparent ? 'transparent' : 'var(--bg-nav)',
        borderBottom: transparent ? 'none' : '1px solid var(--border-nav)',
      }}
    >
      <div className="max-w-2xl mx-auto flex items-center justify-between px-4 h-14">
        {/* Left side: back + title */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {showBack && (
            <button
              onClick={() => backHref ? router.push(backHref) : router.back()}
              className="flex items-center justify-center w-8 h-8 rounded-lg border-none bg-transparent cursor-pointer flex-shrink-0 -ml-1"
              style={{ color: 'var(--text-muted)' }}
              aria-label="Go back"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
          )}
          <div className="min-w-0">
            <h1
              className="text-base font-semibold m-0 truncate"
              style={{
                fontFamily: 'Cormorant Garamond, serif',
                color: 'var(--text-primary)',
                fontSize: subtitle ? '15px' : '17px',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                className="text-[11px] m-0 truncate"
                style={{ color: 'var(--text-muted)', fontFamily: 'Source Sans 3, sans-serif' }}
              >
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Right side: custom trailing content + theme toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {trailing}
          {showThemeToggle && <ThemeToggle size="sm" />}
        </div>
      </div>
    </header>
  );
}
