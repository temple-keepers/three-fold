'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';

type PageState = 'loading' | 'show_invite' | 'needs_signup' | 'accepting' | 'accepted' | 'error';

interface InviteInfo {
  inviterName: string;
  inviteeName: string;
  personalMessage: string | null;
  inviteeEmail: string;
}

export default function InvitePage() {
  const [state, setState] = useState<PageState>('loading');
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [error, setError] = useState('');

  // Auth form
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const params = useParams();
  const token = params.token as string;
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => { checkInvite(); }, []);

  async function checkInvite() {
    // Verify the token is valid
    const { data: inv, error: invErr } = await supabase
      .from('spouse_invitations')
      .select('inviter_id, inviter_name, invitee_email, invitee_name, personal_message, status, expires_at')
      .eq('invite_token', token)
      .single();

    if (invErr || !inv) {
      setError('This invitation link is not valid.');
      setState('error');
      return;
    }

    if (inv.status !== 'pending') {
      setError('This invitation has already been accepted.');
      setState('error');
      return;
    }

    if (new Date(inv.expires_at) < new Date()) {
      setError('This invitation has expired. Ask your spouse to send a new one.');
      setState('error');
      return;
    }

    const inviterName = inv.inviter_name || 'Your spouse';

    setInvite({
      inviterName,
      inviteeName: inv.invitee_name || '',
      personalMessage: inv.personal_message,
      inviteeEmail: inv.invitee_email,
    });
    setEmail(inv.invitee_email);

    // Check if user is already logged in
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Already logged in — try to accept directly
      setState('show_invite');
    } else {
      setState('needs_signup');
    }
  }

  async function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      if (mode === 'signup') {
        if (password !== confirmPassword) { setAuthError('Passwords do not match'); setAuthLoading(false); return; }
        if (password.length < 8) { setAuthError('Password must be at least 8 characters'); setAuthLoading(false); return; }
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data.session) {
          setState('show_invite');
        } else {
          // Email confirmation required — for invited users, try to auto-confirm via the invite
          setAuthError('Check your email for a confirmation link, then come back to this page.');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        setState('show_invite');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Something went wrong');
    } finally {
      setAuthLoading(false);
    }
  }

  async function acceptInvitation() {
    setState('accepting');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setState('needs_signup'); return; }

      const { data: result, error: rpcErr } = await supabase.rpc('accept_spouse_invitation', {
        p_token: token,
        p_accepter_id: user.id,
      });

      if (rpcErr) {
        setError(rpcErr.message);
        setState('error');
        return;
      }

      if (!result.success) {
        setError(result.error);
        setState('error');
        return;
      }

      // Check if user has completed onboarding
      const { data: prof } = await supabase.from('profiles').select('onboarding_completed').eq('id', user.id).single();

      setState('accepted');

      // Redirect after a moment
      setTimeout(() => {
        if (prof?.onboarding_completed) {
          router.push('/dashboard');
        } else {
          router.push('/onboarding');
        }
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Something went wrong');
      setState('error');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: t.bgPrimary }}>
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3" style={{ width: 56 }}>
            <CleaveLogo size={56} />
          </div>
          <h1 className="text-2xl font-bold tracking-[0.12em] uppercase m-0" style={{ fontFamily: 'Cinzel, serif', color: t.textPrimary }}>
            Cleave
          </h1>
        </div>

        <div className="rounded-3xl p-8" style={{ background: t.bgCard, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' }}>

          {/* ─── LOADING ─── */}
          {state === 'loading' && (
            <div className="text-center py-8">
              <p className="text-sm" style={{ color: t.textMuted }}>Checking invitation...</p>
            </div>
          )}

          {/* ─── ERROR ─── */}
          {state === 'error' && (
            <div className="text-center py-4">
              <span className="text-4xl block mb-4">😔</span>
              <h2 className="text-xl font-medium mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Invitation Issue
              </h2>
              <p className="text-sm mb-6" style={{ color: t.textMuted, lineHeight: 1.6 }}>{error}</p>
              <a href="/auth" className="text-sm font-semibold no-underline" style={{ color: t.textLink }}>
                Go to sign in →
              </a>
            </div>
          )}

          {/* ─── NEEDS SIGNUP / LOGIN ─── */}
          {state === 'needs_signup' && invite && (
            <>
              <div className="text-center mb-6">
                <span className="text-4xl block mb-3">💍</span>
                <h2 className="text-xl font-medium m-0 mb-1" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                  {invite.inviterName} invited you
                </h2>
                <p className="text-sm m-0" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                  Create your account to join them on Cleave
                </p>
              </div>

              {invite.personalMessage && (
                <div className="rounded-xl p-4 mb-6" style={{ background: t.goldBg, borderLeft: `4px solid ${t.textLink}` }}>
                  <p className="text-sm italic m-0 mb-1" style={{ color: t.textPrimary, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
                    &ldquo;{invite.personalMessage}&rdquo;
                  </p>
                  <p className="text-xs m-0" style={{ color: t.textMuted }}>— {invite.inviterName}</p>
                </div>
              )}

              {/* Auth toggle */}
              <div className="flex mb-5 rounded-xl overflow-hidden" style={{ background: t.bgInput }}>
                {(['signup', 'login'] as const).map(m => (
                  <button
                    key={m}
                    onClick={() => { setMode(m); setAuthError(''); }}
                    className="flex-1 py-3 text-sm font-semibold cursor-pointer border-none transition-all"
                    style={{
                      fontFamily: 'Source Sans 3, sans-serif',
                      background: mode === m ? t.bgCard : 'transparent',
                      color: mode === m ? t.textPrimary : t.textMuted,
                      boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                    }}
                  >
                    {m === 'signup' ? 'Create Account' : 'Sign In'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth}>
                <div className="mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                    style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
                    required
                    minLength={8}
                  />
                </div>

                {mode === 'signup' && (
                  <div className="mb-4">
                    <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={e => setConfirmPassword(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                      style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
                      required
                      minLength={8}
                    />
                  </div>
                )}

                {authError && (
                  <div className="rounded-xl p-3 mb-4" style={{ background: t.redBg }}>
                    <p className="text-xs m-0" style={{ color: t.red }}>{authError}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={authLoading}
                  className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer"
                  style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
                >
                  {authLoading ? 'Please wait...' : mode === 'signup' ? 'Create Account & Accept' : 'Sign In & Accept'}
                </button>
              </form>
            </>
          )}

          {/* ─── SHOW INVITE (logged in, ready to accept) ─── */}
          {state === 'show_invite' && invite && (
            <div className="text-center py-4">
              <span className="text-5xl block mb-4">💍</span>
              <h2 className="text-2xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Join {invite.inviterName}
              </h2>
              <p className="text-sm mb-6" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                {invite.inviterName} wants to strengthen your marriage together on Cleave. Accept to link your accounts and unlock the couple dashboard.
              </p>

              {invite.personalMessage && (
                <div className="rounded-xl p-4 mb-6 text-left" style={{ background: t.goldBg, borderLeft: `4px solid ${t.textLink}` }}>
                  <p className="text-sm italic m-0 mb-1" style={{ color: t.textPrimary, fontFamily: 'Cormorant Garamond, serif', lineHeight: 1.6 }}>
                    &ldquo;{invite.personalMessage}&rdquo;
                  </p>
                  <p className="text-xs m-0" style={{ color: t.textMuted }}>— {invite.inviterName}</p>
                </div>
              )}

              <button
                onClick={acceptInvitation}
                className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer mb-3"
                style={{ fontFamily: 'Source Sans 3, sans-serif', background: 'linear-gradient(135deg, #B8860B, #8B6914)' }}
              >
                Accept Invitation 💛
              </button>
              <p className="text-xs m-0" style={{ color: t.textMuted }}>
                This will link your accounts as a couple
              </p>
            </div>
          )}

          {/* ─── ACCEPTING ─── */}
          {state === 'accepting' && (
            <div className="text-center py-8">
              <span className="text-4xl block mb-3">⏳</span>
              <p className="text-sm" style={{ color: t.textMuted }}>Linking your accounts...</p>
            </div>
          )}

          {/* ─── ACCEPTED ─── */}
          {state === 'accepted' && invite && (
            <div className="text-center py-4">
              <span className="text-5xl block mb-4">🎉</span>
              <h2 className="text-2xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                You&apos;re Linked!
              </h2>
              <p className="text-sm mb-2" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                You and {invite.inviterName} are now connected. Your couple dashboard, shared tools, and exercises are all unlocked.
              </p>
              <p className="text-xs" style={{ color: t.textLight }}>Redirecting you now...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-xs italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-[10px] m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
        </div>
      </div>
    </div>
  );
}
