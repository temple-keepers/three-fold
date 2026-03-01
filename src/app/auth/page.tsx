'use client';

import { Suspense, useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';

type AuthMode = 'login' | 'signup' | 'forgot' | 'update-password';

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: t.bgPrimary }}>
        <p style={{ color: t.textMuted, fontFamily: 'DM Sans, sans-serif' }}>Loading...</p>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}

function AuthContent() {
  const searchParams = useSearchParams();
  const initialMode = (searchParams.get('mode') as AuthMode) || 'signup';

  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();

  // Pick up ?mode=update-password from callback redirect
  useEffect(() => {
    const m = searchParams.get('mode') as AuthMode | null;
    if (m === 'update-password') setMode('update-password');
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          window.location.href = '/onboarding';
        } else {
          setMessage('Check your email for a confirmation link.');
        }
      } else if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      } else if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?type=recovery`,
        });
        if (error) throw error;
        setMessage('Check your email for a password reset link.');
      } else if (mode === 'update-password') {
        if (password !== confirmPassword) { setError('Passwords do not match'); setLoading(false); return; }
        if (password.length < 8) { setError('Password must be at least 8 characters'); setLoading(false); return; }
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setMessage('Password updated successfully! Redirecting...');
        setTimeout(() => { window.location.href = '/dashboard'; }, 2000);
      }
    } catch (err: any) {
      const msg = err.message || 'Something went wrong';
      if (msg.toLowerCase().includes('leaked') || msg.toLowerCase().includes('pwned') || msg.toLowerCase().includes('breached') || msg.toLowerCase().includes('compromised')) {
        setError('This password has appeared in a known data breach. Please choose a different, more secure password.');
      } else if (msg.toLowerCase().includes('weak')) {
        setError('This password is too weak. Please use at least 8 characters with a mix of letters and numbers.');
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const subtitle = {
    signup: 'Begin your covenant journey',
    login: 'Welcome back',
    forgot: 'Reset your password',
    'update-password': 'Choose a new password',
  }[mode];

  const buttonLabel = {
    signup: 'Create Account',
    login: 'Sign In',
    forgot: 'Send Reset Link',
    'update-password': 'Update Password',
  }[mode];

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
      <div className="w-full max-w-md">
        {/* Theme toggle */}
        <div className="flex justify-end mb-4">
          <ThemeToggle size="sm" />
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4" style={{ width: 72 }}>
            <CleaveLogo size={72} />
          </div>
          <h1 className="text-3xl font-bold tracking-[0.14em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: t.textPrimary }}>Cleave</h1>
          <p className="mt-1 text-sm tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C7A23A', fontWeight: 400 }}>Hold Fast</p>
          <p className="mt-3 text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: t.textSecondary }}>
            {subtitle}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: t.bgCard, boxShadow: t.shadowCardLg }}>

          {/* Tabs — only for login/signup */}
          {(mode === 'login' || mode === 'signup') && (
            <div className="flex mb-6 rounded-xl overflow-hidden" style={{ background: t.bgInput }}>
              {(['signup', 'login'] as const).map(m => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setError(''); setMessage(''); }}
                  className="flex-1 py-3 text-sm font-semibold"
                  style={{
                    fontFamily: 'DM Sans, sans-serif',
                    background: mode === m ? '#0F1E2E' : 'transparent',
                    color: mode === m ? '#F4F1EA' : t.textSecondary,
                    borderRadius: '12px',
                  }}
                >
                  {m === 'signup' ? 'Sign Up' : 'Log In'}
                </button>
              ))}
            </div>
          )}

          {/* Back link for forgot / update-password */}
          {(mode === 'forgot' || mode === 'update-password') && (
            <button
              onClick={() => { setMode('login'); setError(''); setMessage(''); }}
              className="text-sm border-none bg-transparent cursor-pointer mb-4 p-0"
              style={{ color: t.textLink, fontFamily: 'DM Sans, sans-serif' }}
            >
              ← Back to Sign In
            </button>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email — show for login, signup, forgot */}
            {mode !== 'update-password' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary, fontFamily: 'DM Sans, sans-serif' }}>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3.5 rounded-xl border text-base outline-none"
                  style={{ background: t.bgInput, borderColor: t.border, color: t.textPrimary, fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
            )}

            {/* Password — show for login, signup, update-password */}
            {mode !== 'forgot' && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary, fontFamily: 'DM Sans, sans-serif' }}>
                  {mode === 'update-password' ? 'New Password' : 'Password'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="At least 8 characters"
                  className="w-full px-4 py-3.5 rounded-xl border text-base outline-none"
                  style={{ background: t.bgInput, borderColor: t.border, color: t.textPrimary, fontFamily: 'DM Sans, sans-serif' }}
                  minLength={8}
                />
                {/* Password requirements — show on signup & update-password */}
                {(mode === 'signup' || mode === 'update-password') && (
                  <div className="mt-2 flex flex-col gap-1">
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: password.length >= 8 ? t.green : t.textMuted, fontSize: 14, lineHeight: 1 }}>
                        {password.length >= 8 ? '✓' : '○'}
                      </span>
                      <span className="text-xs" style={{ color: password.length >= 8 ? t.green : t.textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                        At least 8 characters
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span style={{ color: t.textMuted, fontSize: 14, lineHeight: 1 }}>🛡</span>
                      <span className="text-xs" style={{ color: t.textMuted, fontFamily: 'DM Sans, sans-serif' }}>
                        Checked against known data breaches
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Confirm Password — show for signup, update-password */}
            {(mode === 'signup' || mode === 'update-password') && (
              <div className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary, fontFamily: 'DM Sans, sans-serif' }}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Confirm your password"
                  className="w-full px-4 py-3.5 rounded-xl border text-base outline-none"
                  style={{ background: t.bgInput, borderColor: t.border, color: t.textPrimary, fontFamily: 'DM Sans, sans-serif' }}
                  minLength={8}
                />
              </div>
            )}

            {error && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: t.redBg, color: t.red, border: `1px solid ${t.red}30` }}>{error}</div>}
            {message && <div className="mb-4 p-3 rounded-xl text-sm" style={{ background: t.greenBg, color: t.green, border: `1px solid ${t.green}30` }}>{message}</div>}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl text-sm font-semibold text-white uppercase tracking-wider"
              style={{
                background: loading ? t.border : 'linear-gradient(135deg, #C7A23A, #A8862E)',
                fontFamily: 'DM Sans, sans-serif',
                boxShadow: loading ? 'none' : '0 4px 20px rgba(199, 162, 58, 0.25)',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
            >
              {loading ? 'Please wait...' : buttonLabel}
            </button>

            {/* Forgot password link — only on login mode */}
            {mode === 'login' && (
              <button
                type="button"
                onClick={() => { setMode('forgot'); setError(''); setMessage(''); }}
                className="w-full text-center mt-4 text-sm border-none bg-transparent cursor-pointer p-0"
                style={{ color: t.textLink, fontFamily: 'DM Sans, sans-serif' }}
              >
                Forgot your password?
              </button>
            )}
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: t.textMuted }}>
          Your data is private and encrypted · We never share your information
        </p>
      </div>
    </div>
  );
}
