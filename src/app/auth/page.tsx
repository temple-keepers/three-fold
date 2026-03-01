'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { ThreefoldLogo } from '@/components/ui/Logo';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { t } from '@/lib/tokens';

export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const supabase = createClient();

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
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

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
            <ThreefoldLogo size={72} />
          </div>
          <h1 className="text-3xl font-bold tracking-[0.14em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: t.textPrimary }}>Cleave</h1>
          <p className="mt-1 text-sm tracking-[0.15em] uppercase" style={{ fontFamily: 'Cinzel, serif', color: '#C7A23A', fontWeight: 400 }}>Hold Fast</p>
          <p className="mt-3 text-sm" style={{ fontFamily: 'DM Sans, sans-serif', color: t.textSecondary }}>
            {mode === 'signup' ? 'Begin your covenant journey' : 'Welcome back'}
          </p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-8" style={{ background: t.bgCard, boxShadow: t.shadowCardLg }}>
          {/* Tabs */}
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

          <form onSubmit={handleSubmit}>
            {[
              { label: 'Email', type: 'email', value: email, set: setEmail, placeholder: 'your@email.com', show: true },
              { label: 'Password', type: 'password', value: password, set: setPassword, placeholder: 'At least 8 characters', show: true },
              { label: 'Confirm Password', type: 'password', value: confirmPassword, set: setConfirmPassword, placeholder: 'Confirm your password', show: mode === 'signup' },
            ].filter(f => f.show).map(field => (
              <div key={field.label} className="mb-4">
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: t.textSecondary, fontFamily: 'DM Sans, sans-serif' }}>{field.label}</label>
                <input
                  type={field.type}
                  value={field.value}
                  onChange={(e) => field.set(e.target.value)}
                  required
                  placeholder={field.placeholder}
                  className="w-full px-4 py-3.5 rounded-xl border text-base outline-none"
                  style={{ background: t.bgInput, borderColor: t.border, color: t.textPrimary, fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
            ))}

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
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create Account' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 text-xs" style={{ color: t.textMuted }}>
          Your data is private and encrypted · We never share your information
        </p>
      </div>
    </div>
  );
}
