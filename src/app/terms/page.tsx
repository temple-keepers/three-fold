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

export default function TermsPage() {
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
          Terms of Service
        </h1>
        <p className="text-xs m-0" style={{ color: `${C.ivory}80`, fontFamily: 'Source Sans 3, sans-serif' }}>
          Last updated: 1 March 2026
        </p>
      </header>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-6 py-10">
        <Section title="1. Acceptance of Terms">
          <p className="m-0">
            By accessing or using Cleave, you agree to be bound by these Terms of Service.
            If you do not agree to these terms, please do not use the application.
            These terms apply to all users, including both free and paid subscribers.
          </p>
        </Section>

        <Section title="2. Description of Service">
          <p className="m-0">
            Cleave is a faith-centred marriage enrichment application that provides daily devotionals,
            couple questions, marriage games, conflict repair tools, and other features designed to
            help married couples grow together. The service is available as a free tier (Covenant Preview)
            and as paid subscriptions (Covenant Plus) with additional features.
          </p>
        </Section>

        <Section title="3. Account Registration">
          <p className="m-0 mb-3">
            To use Cleave, you must create an account with a valid email address. You are responsible
            for maintaining the confidentiality of your account credentials and for all activity that
            occurs under your account. You agree to provide accurate and complete information during
            registration and to keep this information up to date.
          </p>
          <p className="m-0">
            Each person may only maintain one account. Accounts are personal and may not be shared
            or transferred to another person.
          </p>
        </Section>

        <Section title="4. Subscription Plans and Billing">
          <p className="m-0 mb-2">Cleave offers the following plans:</p>
          <ul className="pl-5 mb-3" style={{ lineHeight: 2 }}>
            <li><strong>Covenant Preview (Free)</strong> &mdash; access to core features including daily devotionals, couple questions, and limited games and tools</li>
            <li><strong>Covenant Plus Monthly</strong> &mdash; full access to all features, billed monthly</li>
            <li><strong>Covenant Plus Yearly</strong> &mdash; full access to all features, billed annually at a discounted rate</li>
            <li><strong>Founding Member</strong> &mdash; lifetime access via a one-time payment (limited availability)</li>
          </ul>
          <p className="m-0 mb-3">
            All payments are processed securely through Stripe. You may cancel your subscription at any
            time through your account settings. Upon cancellation, you will retain access to paid features
            until the end of your current billing period. Refunds are handled in accordance with
            applicable consumer protection laws.
          </p>
        </Section>

        <Section title="5. Acceptable Use">
          <p className="m-0 mb-2">You agree not to:</p>
          <ul className="pl-5 mb-0" style={{ lineHeight: 2 }}>
            <li>Use Cleave for any unlawful purpose or in violation of any applicable laws</li>
            <li>Harass, abuse, or harm another person through the couple-linking or messaging features</li>
            <li>Attempt to gain unauthorised access to other users&apos; accounts or data</li>
            <li>Use automated tools, bots, or scrapers to access or extract data from the service</li>
            <li>Interfere with or disrupt the integrity or performance of the service</li>
            <li>Impersonate any person or entity, or misrepresent your affiliation</li>
          </ul>
        </Section>

        <Section title="6. User Content">
          <p className="m-0 mb-3">
            You retain ownership of all content you create within Cleave, including journal entries,
            love notes, check-in responses, and daily question answers. By using the service, you grant
            Cleave a limited licence to store, process, and display your content back to you and your
            linked partner as part of the service.
          </p>
          <p className="m-0">
            We do not publicly share, sell, or use your personal content for any purpose other than
            providing the service. Individual answers to couple questions remain private until both
            partners have responded.
          </p>
        </Section>

        <Section title="7. Couple Linking">
          <p className="m-0">
            Cleave allows you to link your account with your spouse via an email invitation.
            Linking is consent-based &mdash; both parties must actively accept the connection.
            Either party may unlink their account at any time through their profile settings.
            Unlinking does not delete individual account data but does remove access to shared
            couple features and history.
          </p>
        </Section>

        <Section title="8. Intellectual Property">
          <p className="m-0">
            All content provided by Cleave, including devotionals, exercises, games, assessments,
            and educational materials, is the intellectual property of Cleave and is protected by
            copyright law. You may not reproduce, distribute, or create derivative works from this
            content without prior written permission.
          </p>
        </Section>

        <Section title="9. Disclaimer">
          <p className="m-0 mb-3">
            Cleave is a marriage enrichment tool and is <strong>not a substitute for professional
            counselling, therapy, or medical advice</strong>. If you or your spouse are experiencing
            serious marital difficulties, domestic abuse, or mental health challenges, we strongly
            encourage you to seek help from qualified professionals.
          </p>
          <p className="m-0">
            The service is provided &ldquo;as is&rdquo; without warranties of any kind, either express
            or implied. We do not guarantee that the service will be uninterrupted, error-free, or
            that it will meet your specific expectations or needs.
          </p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p className="m-0">
            To the fullest extent permitted by law, Cleave shall not be liable for any indirect,
            incidental, special, consequential, or punitive damages arising out of or relating to
            your use of the service. Our total liability for any claim arising from or relating to
            these terms shall not exceed the amount you have paid to us in the twelve months preceding
            the claim.
          </p>
        </Section>

        <Section title="11. Governing Law">
          <p className="m-0">
            These Terms of Service are governed by and construed in accordance with the laws of
            England and Wales. Any disputes arising from these terms shall be subject to the
            exclusive jurisdiction of the courts of England and Wales.
          </p>
        </Section>

        <Section title="12. Changes to These Terms">
          <p className="m-0">
            We reserve the right to modify these Terms of Service at any time. Material changes
            will be communicated via email or in-app notification at least 14 days before taking
            effect. Continued use of Cleave after changes constitutes acceptance of the updated terms.
          </p>
        </Section>

        <Section title="13. Contact">
          <p className="m-0">
            For any questions or concerns regarding these Terms of Service, please contact us
            at <strong>hello@cleaveapp.com</strong>.
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
