'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';

interface NavItem {
  href: string;
  label: string;
  icon: string;         // path to custom PNG icon
  activeIcon?: string;  // optional alternate for active state
  matchPaths: string[]; // pathnames that should highlight this tab
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Home',
    icon: '/icons/icon-heart.png',
    matchPaths: ['/dashboard'],
  },
  {
    href: '/devotional',
    label: 'Devotional',
    icon: '/icons/icon-book.png',
    matchPaths: ['/devotional'],
  },
  {
    href: '/games',
    label: 'Games',
    icon: '/icons/icon-dice.png',
    matchPaths: ['/games'],
  },
  {
    href: '/emergency',
    label: 'Tools',
    icon: '/icons/icon-tools.png',
    matchPaths: ['/emergency'],
  },
  {
    href: '/profile',
    label: 'Profile',
    icon: '/icons/icon-star.png',
    matchPaths: ['/profile', '/couple', '/church'],
  },
];

// Pages where the bottom nav should be hidden
const HIDDEN_PATHS = [
  '/auth',
  '/onboarding',
  '/assessment',
  '/admin',
  '/',           // landing page
];

export function BottomNav() {
  const pathname = usePathname();

  // Hide on certain pages
  if (!pathname) return null;
  if (HIDDEN_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))) return null;

  return (
    <>
      {/* Spacer to prevent content from being hidden behind the nav */}
      <div className="h-[72px] sm:h-[80px]" />

      {/* The actual nav bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 backdrop-blur-xl"
        style={{
          background: 'var(--bg-nav)',
          borderTop: '1px solid var(--border-nav)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className="max-w-lg mx-auto flex items-center justify-around px-2 h-[64px] sm:h-[68px]">
          {NAV_ITEMS.map(item => {
            const isActive = item.matchPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center gap-0.5 no-underline relative group"
                style={{ minWidth: 52, textDecoration: 'none' }}
              >
                {/* Active indicator dot */}
                {isActive && (
                  <div
                    className="absolute -top-2.5 w-1 h-1 rounded-full"
                    style={{ background: 'var(--text-link)' }}
                  />
                )}
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200"
                  style={{
                    background: isActive ? 'var(--nav-active-bg)' : 'transparent',
                    transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  }}
                >
                  <Image
                    src={item.icon}
                    alt=""
                    width={22}
                    height={22}
                    style={{
                      opacity: isActive ? 1 : 0.5,
                      filter: isActive ? 'none' : 'grayscale(40%)',
                      transition: 'all 0.2s ease',
                    }}
                  />
                </div>
                <span
                  className="text-[10px] font-semibold leading-none transition-colors duration-200"
                  style={{
                    color: isActive ? 'var(--text-link)' : 'var(--text-muted)',
                    fontFamily: 'Source Sans 3, sans-serif',
                  }}
                >
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
