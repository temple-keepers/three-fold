import Link from 'next/link';
import { CleaveLogo } from '@/components/ui/Logo';

/* Landing-page palette (matches src/app/page.tsx) */
const C = {
  navy: '#0F1E2E',
  gold: '#C7A23A',
  goldSoft: '#F5ECD7',
  ivory: '#F4F1EA',
  ivoryDark: '#E8E3D9',
  white: '#FFFFFF',
  textDark: '#2C2418',
  textMid: '#7A7062',
};

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2
        className="text-xl font-medium m-0 mb-3"
        style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textDark }}
      >
        {title}
      </h2>
      <div
        className="text-sm leading-7"
        style={{ fontFamily: 'Source Sans 3, sans-serif', color: C.textMid }}
      >
        {children}
      </div>
    </section>
  );
}

export default function PrivacyPage() {
  return (
    <div style={{ background: C.ivory, minHeight: '100vh' }}>
      {/* Nav */}
      <nav
        className="flex items-center justify-between px-6 py-4 border-b"
        style={{ background: C.white, borderColor: C.ivoryDark }}
      >
        <div className="flex items-center gap-2">
          <CleaveLogo size={24} />
          <span
            className="text-xs font-semibold tracking-wider uppercase"
            style={{ fontFamily: 'Cinzel, serif', color: C.textMid }}
          >
            Cleave
          </span>
        </div>
        <Link
          href="/"
          className="text-xs no-underline"
          style={{ color: C.gold, fontFamily: 'Source Sans 3, sans-serif', fontWeight: 600 }}
        >
          &larr; Back
        </Link>
      </nav>

      {/* Header */}
      <header className="py-10 px-6 text-center" style={{ background: C.navy }}>
        <h1
          className="text-3xl font-medium m-0 mb-2"
          style={{ fontFamily: 'Cormorant Garamond, serif', color: C.ivory }}
        >
          Privacy Policy
        </h1>
        <p className="text-xs m-0" style={{ color: `${C.ivory}80`, fontFamily: 'Source Sans 3, sans-serif' }}>
          Last updated: 1 March 2026
        </p>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Section title="1. Who We Are">
          <p className="m-0 mb-3">
            Cleave is a faith-centred marriage enrichment application designed to help couples grow, communicate,
            and build covenant-strong marriages. For any privacy-related enquiries, please contact us
            at <strong>hello@cleaveapp.com</strong>.
          </p>
        </Section>

        <Section title="2. What Data We Collect">
          <p className="m-0 mb-2">We collect and process the following categories of personal data:</p>
          <ul className="pl-5 mb-0" style={{ lineHeight: 2 }}>
            <li><strong>Account information</strong> &mdash; email address, first name, and authentication credentials (managed by Supabase Auth)</li>
            <li><strong>Profile data</strong> &mdash; gender, date of birth, wedding date, and church affiliation (all optional)</li>
            <li><strong>Marriage health data</strong> &mdash; assessment responses, pillar scores, journal entries, and devotional progress</li>
            <li><strong>Couple interaction data</strong> &mdash; daily question answers, check-in responses, love notes, and exercise completions</li>
            <li><strong>Subscription data</strong> &mdash; Stripe customer ID and subscription status (we never store card numbers or bank details)</li>
            <li><strong>Technical data</strong> &mdash; push notification tokens, device type, and basic usage analytics</li>
          </ul>
        </Section>

        <Section title="3. How We Use Your Data">
          <ul className="pl-5 mb-0" style={{ lineHeight: 2 }}>
            <li>Providing and personalising the Cleave service</li>
            <li>Delivering daily devotionals, couple questions, and personalised content</li>
            <li>Processing payments and managing subscriptions via Stripe</li>
            <li>Sending transactional emails (spouse invitations, account notifications) via Resend</li>
            <li>Delivering push notifications you have opted into (nudges, reminders)</li>
            <li>Generating anonymised, aggregated insights to improve the service</li>
          </ul>
        </Section>

        <Section title="4. Data Storage and Security">
          <p className="m-0 mb-3">
            Your data is stored securely in Supabase, hosted in the EU-West region. All data is encrypted at rest
            and in transit using industry-standard TLS encryption. We implement Row Level Security (RLS) policies
            to ensure that each user can only access their own data. Couple data is shared only between
            linked partners.
          </p>
          <p className="m-0">
            We follow security best practices including regular dependency updates, secure authentication flows,
            and minimal data collection principles.
          </p>
        </Section>

        <Section title="5. Third-Party Services">
          <p className="m-0 mb-2">We use the following trusted third-party services:</p>
          <ul className="pl-5 mb-0" style={{ lineHeight: 2 }}>
            <li><strong>Supabase</strong> &mdash; database hosting, authentication, and serverless functions (EU-West)</li>
            <li><strong>Stripe</strong> &mdash; payment processing (PCI DSS Level 1 compliant)</li>
            <li><strong>Resend</strong> &mdash; transactional email delivery</li>
            <li><strong>Google Fonts</strong> &mdash; typeface delivery (no tracking cookies)</li>
            <li><strong>Vercel</strong> &mdash; application hosting and deployment</li>
          </ul>
          <p className="m-0 mt-3">
            We do not sell, rent, or share your personal data with any third parties for marketing purposes.
          </p>
        </Section>

        <Section title="6. Cookies and Local Storage">
          <p className="m-0 mb-3">
            Cleave uses minimal browser storage. We store a theme preference in localStorage and use
            a Supabase session cookie for authentication. We do not use tracking cookies, advertising pixels,
            or any third-party analytics that track individual users.
          </p>
        </Section>

        <Section title="7. Your Rights Under UK GDPR">
          <p className="m-0 mb-2">Under UK data protection law, you have the right to:</p>
          <ul className="pl-5 mb-0" style={{ lineHeight: 2 }}>
            <li><strong>Access</strong> &mdash; request a copy of the personal data we hold about you</li>
            <li><strong>Rectification</strong> &mdash; correct any inaccurate or incomplete data</li>
            <li><strong>Erasure</strong> &mdash; request deletion of your personal data</li>
            <li><strong>Data portability</strong> &mdash; receive your data in a structured, machine-readable format</li>
            <li><strong>Object</strong> &mdash; object to certain processing of your data</li>
            <li><strong>Withdraw consent</strong> &mdash; withdraw consent at any time where processing is based on consent</li>
          </ul>
          <p className="m-0 mt-3">
            To exercise any of these rights, please email <strong>hello@cleaveapp.com</strong>.
            We aim to respond to all requests within 30 days.
          </p>
        </Section>

        <Section title="8. Data Retention">
          <p className="m-0 mb-3">
            We retain your personal data for as long as your account is active. If you choose to delete your
            account, all associated personal data will be permanently removed within 30 days. Anonymised,
            aggregated data may be retained for service improvement purposes.
          </p>
        </Section>

        <Section title="9. Children">
          <p className="m-0">
            Cleave is designed for married couples and is not intended for use by anyone under the age of 18.
            We do not knowingly collect data from minors.
          </p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p className="m-0">
            We may update this Privacy Policy from time to time. Material changes will be communicated
            via email or an in-app notification. Continued use of Cleave after changes constitutes
            acceptance of the updated policy.
          </p>
        </Section>

        <Section title="11. Contact">
          <p className="m-0">
            For any questions, concerns, or requests regarding this Privacy Policy or your personal data,
            please contact us at <strong>hello@cleaveapp.com</strong>.
          </p>
        </Section>

        {/* Footer verse */}
        <div className="text-center pt-8 mt-8" style={{ borderTop: `1px solid ${C.ivoryDark}` }}>
          <p
            className="text-sm italic m-0"
            style={{ fontFamily: 'Cormorant Garamond, serif', color: C.textMid }}
          >
            &ldquo;Therefore a man shall leave his father and mother and hold fast to his wife.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: `${C.textMid}80` }}>Genesis 2:24</p>
        </div>
      </main>
    </div>
  );
}
