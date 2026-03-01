'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { CleaveLogo } from '@/components/ui/Logo';
import { t } from '@/lib/tokens';
import Link from 'next/link';

export function SoloInviteScreen({ profile, couple }: { profile: any; couple: any }) {
  const [spouseEmail, setSpouseEmail] = useState('');
  const [spouseName, setSpouseName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [pendingInvite, setPendingInvite] = useState<any>(null);
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [resending, setResending] = useState(false);
  const [resent, setResent] = useState(false);
  const [editing, setEditing] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (profile?.id) checkPending();
  }, [profile?.id]);

  async function checkPending() {
    const { data } = await supabase
      .from('spouse_invitations')
      .select('*')
      .eq('inviter_id', profile.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setPendingInvite(data);
      const baseUrl = window.location.origin;
      setInviteLink(`${baseUrl}/invite/${data.invite_token}`);
    }
  }

  async function sendInvite() {
    if (!spouseEmail.trim() || !profile) return;
    setSending(true);
    try {
      // Create couple if none exists
      let coupleId = couple?.id;
      if (!coupleId) {
        const { data: newCouple } = await supabase.from('couples').insert({
          spouse_1_id: profile.id,
          status: 'pending',
        }).select('id').single();
        if (newCouple) {
          coupleId = newCouple.id;
          await supabase.from('profiles').update({ couple_id: coupleId }).eq('id', profile.id);
        }
      }

      const { data: invite } = await supabase.from('spouse_invitations').insert({
        inviter_id: profile.id,
        inviter_name: profile.first_name || null,
        couple_id: coupleId,
        invitee_email: spouseEmail.trim(),
        invitee_name: spouseName.trim() || null,
        personal_message: message.trim() || null,
      }).select('id, invite_token').single();

      if (invite) {
        supabase.functions.invoke('send-spouse-invite', {
          body: { invitation_id: invite.id },
        }).catch(() => {});

        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/invite/${invite.invite_token}`);
        setSent(true);
        setPendingInvite(invite);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function resendInvite() {
    if (!pendingInvite) return;
    setResending(true);
    try {
      await supabase.functions.invoke('send-spouse-invite', {
        body: { invitation_id: pendingInvite.id },
      });
      setResent(true);
      setTimeout(() => setResent(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setResending(false);
    }
  }

  function startEditing() {
    if (!pendingInvite) return;
    setSpouseEmail(pendingInvite.invitee_email || '');
    setSpouseName(pendingInvite.invitee_name || '');
    setMessage(pendingInvite.personal_message || '');
    setEditing(true);
  }

  async function saveEdit() {
    if (!spouseEmail.trim() || !pendingInvite) return;
    setSending(true);
    try {
      // Cancel the old invitation
      await supabase.from('spouse_invitations')
        .update({ status: 'cancelled' })
        .eq('id', pendingInvite.id);

      // Create a new invitation with updated details
      const coupleId = couple?.id || pendingInvite.couple_id;
      const { data: invite } = await supabase.from('spouse_invitations').insert({
        inviter_id: profile.id,
        inviter_name: profile.first_name || null,
        couple_id: coupleId,
        invitee_email: spouseEmail.trim(),
        invitee_name: spouseName.trim() || null,
        personal_message: message.trim() || null,
      }).select('id, invite_token').single();

      if (invite) {
        supabase.functions.invoke('send-spouse-invite', {
          body: { invitation_id: invite.id },
        }).catch(() => {});

        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/invite/${invite.invite_token}`);
        setPendingInvite(invite);
      }
      setEditing(false);
      setSent(true);
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const input = document.createElement('input');
      input.value = inviteLink;
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      document.body.removeChild(input);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="min-h-screen px-4 py-6" style={{ background: t.bgPrimary }}>
      <div className="max-w-md mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Link href="/dashboard"><CleaveLogo size={28} /></Link>
          <div>
            <h1 className="text-xl font-medium m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              Couple Space
            </h1>
            <p className="text-xs m-0" style={{ color: t.textMuted }}>Invite your spouse to begin</p>
          </div>
        </div>

        {/* If there's already a pending invite */}
        {pendingInvite && !sent && !editing ? (
          <div className="rounded-3xl p-8" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">💌</span>
              <h2 className="text-xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Invitation Sent
              </h2>
              <p className="text-sm m-0" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                Waiting for <strong>{pendingInvite.invitee_name || pendingInvite.invitee_email}</strong> to accept.
                Share the link below if they didn&apos;t get the email.
              </p>
            </div>

            <div className="rounded-xl p-4 mb-4 flex items-center gap-2" style={{ background: t.bgInput, border: `1px solid ${t.border}` }}>
              <input
                readOnly
                value={inviteLink}
                className="flex-1 text-xs bg-transparent border-none outline-none"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              />
              <button
                onClick={copyLink}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex-shrink-0"
                style={{ background: copied ? t.greenBg : t.goldBg, color: copied ? t.green : t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>

            {/* Resend / Edit buttons */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={resendInvite}
                disabled={resending}
                className="flex-1 py-3 rounded-xl text-sm font-semibold border-none cursor-pointer"
                style={{ background: resent ? t.greenBg : t.goldBg, color: resent ? t.green : t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                {resending ? 'Sending...' : resent ? 'Email Sent ✓' : 'Resend Email'}
              </button>
              <button
                onClick={startEditing}
                className="flex-1 py-3 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Edit Invitation
              </button>
            </div>

            <p className="text-xs text-center" style={{ color: t.textLight }}>
              Expires {new Date(pendingInvite.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' })}
            </p>
          </div>
        ) : pendingInvite && editing ? (
          /* Edit invitation form */
          <div className="rounded-3xl p-8" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">✏️</span>
              <h2 className="text-xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Edit Invitation
              </h2>
              <p className="text-sm m-0" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                Update the details and we&apos;ll send a fresh invitation.
              </p>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Their email *
              </label>
              <input
                type="email"
                value={spouseEmail}
                onChange={e => setSpouseEmail(e.target.value)}
                placeholder="spouse@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Their first name
              </label>
              <input
                type="text"
                value={spouseName}
                onChange={e => setSpouseName(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Personal message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hey love, I found this app for us..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setEditing(false)}
                className="flex-1 py-4 rounded-xl text-sm font-semibold cursor-pointer"
                style={{ background: 'transparent', border: `1.5px solid ${t.border}`, color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                Cancel
              </button>
              <button
                onClick={saveEdit}
                disabled={!spouseEmail.trim() || sending}
                className="flex-1 py-4 rounded-xl text-sm font-semibold text-white border-none cursor-pointer"
                style={{ fontFamily: 'Source Sans 3, sans-serif', background: spouseEmail.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}
              >
                {sending ? 'Sending...' : 'Update & Resend 💌'}
              </button>
            </div>
          </div>
        ) : sent ? (
          <div className="rounded-3xl p-8 text-center" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <span className="text-5xl block mb-4">✅</span>
            <h2 className="text-xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
              Invitation Sent!
            </h2>
            <p className="text-sm mb-5" style={{ color: t.textMuted, lineHeight: 1.6 }}>
              We&apos;ve sent an email to <strong>{spouseEmail}</strong>. You can also share this link directly:
            </p>
            <div className="rounded-xl p-4 mb-4 flex items-center gap-2" style={{ background: t.bgInput, border: `1px solid ${t.border}` }}>
              <input
                readOnly
                value={inviteLink}
                className="flex-1 text-xs bg-transparent border-none outline-none"
                style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}
              />
              <button
                onClick={copyLink}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold border-none cursor-pointer flex-shrink-0"
                style={{ background: copied ? t.greenBg : t.goldBg, color: copied ? t.green : t.textLink, fontFamily: 'Source Sans 3, sans-serif' }}
              >
                {copied ? 'Copied ✓' : 'Copy'}
              </button>
            </div>
            <Link href="/dashboard">
              <span className="text-sm font-semibold" style={{ color: t.textLink }}>← Back to dashboard</span>
            </Link>
          </div>
        ) : (
          /* Invite form */
          <div className="rounded-3xl p-8" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
            <div className="text-center mb-6">
              <span className="text-4xl block mb-3">💑</span>
              <h2 className="text-xl font-medium m-0 mb-2" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textPrimary }}>
                Better Together
              </h2>
              <p className="text-sm m-0" style={{ color: t.textMuted, lineHeight: 1.6 }}>
                Invite your spouse to unlock shared tools, couple exercises, love notes, and the Together dashboard.
              </p>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Their email *
              </label>
              <input
                type="email"
                value={spouseEmail}
                onChange={e => setSpouseEmail(e.target.value)}
                placeholder="spouse@email.com"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Their first name
              </label>
              <input
                type="text"
                value={spouseName}
                onChange={e => setSpouseName(e.target.value)}
                placeholder="Optional"
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold uppercase tracking-wider block mb-1.5" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
                Personal message
              </label>
              <textarea
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Hey love, I found this app for us..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none outline-none"
                style={{ border: `1.5px solid ${t.border}`, fontFamily: 'Source Sans 3, sans-serif', background: t.bgInput, color: t.textPrimary }}
              />
            </div>

            <button
              onClick={sendInvite}
              disabled={!spouseEmail.trim() || sending}
              className="w-full py-4 rounded-xl text-base font-semibold text-white border-none cursor-pointer mb-3"
              style={{ fontFamily: 'Source Sans 3, sans-serif', background: spouseEmail.trim() ? 'linear-gradient(135deg, #B8860B, #8B6914)' : t.border }}
            >
              {sending ? 'Sending...' : 'Send Invitation 💌'}
            </button>

            <div className="text-center">
              <Link href="/dashboard">
                <span className="text-xs" style={{ color: t.textMuted }}>Skip for now</span>
              </Link>
            </div>
          </div>
        )}

        {/* What they'll get */}
        <div className="rounded-2xl p-5 mt-4" style={{ background: t.bgCard, boxShadow: t.shadowCard }}>
          <div className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: t.textSecondary, fontFamily: 'Source Sans 3, sans-serif' }}>
            What unlocks when you&apos;re linked
          </div>
          {[
            { icon: '📋', label: 'Weekly check-ins — reflect privately, reveal together' },
            { icon: '💌', label: 'Love notes — send encouragement any time' },
            { icon: '✏️', label: 'Couple exercises — guided conversations for 2' },
            { icon: '🎯', label: 'Shared goals — grow intentionally together' },
            { icon: '📊', label: 'Together dashboard — see your joint progress' },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-3 mb-2.5 last:mb-0">
              <span className="text-base">{item.icon}</span>
              <span className="text-sm" style={{ color: t.textPrimary, fontFamily: 'Source Sans 3, sans-serif', lineHeight: 1.5 }}>{item.label}</span>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="text-center py-6">
          <p className="text-sm italic m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: t.textMuted }}>
            &ldquo;A cord of three strands is not quickly broken.&rdquo;
          </p>
          <p className="text-xs m-0 mt-1" style={{ color: t.textLight }}>Ecclesiastes 4:12</p>
        </div>
      </div>
    </div>
  );
}
