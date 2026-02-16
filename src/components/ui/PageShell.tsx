'use client';

import { ThreefoldLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import Link from 'next/link';

interface Props {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backHref?: string;
  maxWidth?: string;
}

/**
 * Shared page wrapper that ensures:
 * - Theme-aware background
 * - Consistent header with back nav, title, and dark mode toggle
 * - Max-width container
 */
export function PageShell({ children, title, subtitle, backHref = '/dashboard', maxWidth = 'max-w-2xl' }: Props) {
  return (
    <div className="min-h-screen px-4 py-6" style={{ background: 'var(--bg-primary)' }}>
      <div className={`${maxWidth} mx-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Link href={backHref}><ThreefoldLogo size={28} /></Link>
            <div>
              <h1 className="text-xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}>
                {title}
              </h1>
              {subtitle && (
                <p className="text-xs m-0" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
              )}
            </div>
          </div>
          <ThemeToggle size="sm" />
        </div>
        {children}
      </div>
    </div>
  );
}
