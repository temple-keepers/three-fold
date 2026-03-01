import Link from 'next/link';
import { CleaveLogo } from '@/components/ui/Logo';

export default function NotFound() {
  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ background: 'var(--bg-primary)' }}
    >
      <div className="text-center max-w-sm">
        <div className="mb-4">
          <CleaveLogo size={48} />
        </div>

        <h1
          className="text-5xl font-medium m-0 mb-2"
          style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-link)' }}
        >
          404
        </h1>

        <h2
          className="text-xl font-medium m-0 mb-3"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-primary)' }}
        >
          Page Not Found
        </h2>

        <p
          className="text-sm mb-6 m-0"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
          }}
        >
          This page doesn&apos;t exist. It may have moved or the link may be incorrect.
        </p>

        <Link
          href="/dashboard"
          className="inline-block px-6 py-3 rounded-2xl text-sm font-semibold text-white no-underline"
          style={{
            fontFamily: 'Source Sans 3, sans-serif',
            background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            boxShadow: '0 4px 16px rgba(184,134,11,0.2)',
          }}
        >
          Back to Dashboard
        </Link>

        <div className="mt-8">
          <p
            className="text-sm italic m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: 'var(--text-muted)' }}
          >
            &ldquo;Therefore a man shall leave his father and mother and hold fast to his wife.&rdquo;
          </p>
          <p
            className="text-xs m-0 mt-1"
            style={{ color: 'var(--text-light)' }}
          >
            Genesis 2:24
          </p>
        </div>
      </div>
    </div>
  );
}
