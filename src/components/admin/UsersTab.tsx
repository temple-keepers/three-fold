'use client';

import { useState, useCallback, useEffect } from 'react';
import { AdminCard, SectionHeader, GoldButton, OutlineButton, FormField, TextInput, Select, useSupabase } from './AdminUI';

// ─── Badge colour maps ───
const ROLE_COLORS: Record<string, { bg: string; text: string }> = {
  super_admin: { bg: '#FDF2F2', text: '#C44536' },
  spouse:      { bg: '#F0F7EC', text: '#5B8A3C' },
  individual:  { bg: '#E3F2FD', text: '#1565C0' },
  church_staff:{ bg: '#FFF3E0', text: '#E65100' },
};

const PLAN_COLORS: Record<string, { bg: string; text: string }> = {
  free:          { bg: '#F0EDE6', text: '#7A7062' },
  plus_monthly:  { bg: '#E3F2FD', text: '#1565C0' },
  plus_yearly:   { bg: '#E3F2FD', text: '#1565C0' },
  founding:      { bg: '#F5ECD7', text: '#B8860B' },
};

const PLAN_LABELS: Record<string, string> = {
  free: 'Free', plus_monthly: 'Plus Monthly', plus_yearly: 'Plus Yearly', founding: 'Founding',
};

const ROLE_OPTIONS = [
  { value: '', label: 'All Roles' },
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'individual', label: 'Individual' },
  { value: 'church_staff', label: 'Church Staff' },
];

const PLAN_FILTER_OPTIONS = [
  { value: '', label: 'All Plans' },
  { value: 'free', label: 'Free' },
  { value: 'plus_monthly', label: 'Plus Monthly' },
  { value: 'plus_yearly', label: 'Plus Yearly' },
  { value: 'founding', label: 'Founding' },
];

const ASSIGN_PLAN_OPTIONS = [
  { value: 'free', label: 'Free (remove subscription)' },
  { value: 'plus_monthly', label: 'Covenant Plus — Monthly' },
  { value: 'plus_yearly', label: 'Covenant Plus — Yearly' },
  { value: 'founding', label: 'Founding Member (lifetime)' },
];

const ROLE_ASSIGN_OPTIONS = [
  { value: 'individual', label: 'Individual' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'church_staff', label: 'Church Staff' },
  { value: 'super_admin', label: 'Super Admin' },
];

// ─── Types ───
interface UserRow {
  id: string; email: string; first_name: string | null; last_name: string | null;
  role: string; onboarding_completed: boolean; created_at: string;
  couple_id: string | null; partner_id: string | null;
  plan_type: string | null; sub_status: string | null;
}

interface UserDetail {
  profile: any;
  subscription: any;
  payments: any[];
  stripe_customer: any;
  couple: any;
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════
export function UsersTab() {
  const supabase = useSupabase();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [planFilter, setPlanFilter] = useState('');

  // Detail view state
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<UserDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Current admin id (for self-protection)
  const [adminId, setAdminId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => { if (data.user) setAdminId(data.user.id); });
  }, []);

  // ─── Load users list ───
  const loadUsers = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.rpc('admin_list_profiles_with_subs');
    if (data) setUsers(data);
    setLoading(false);
  }, []);
  useEffect(() => { loadUsers(); }, [loadUsers]);

  // ─── Load user detail ───
  const openDetail = async (userId: string) => {
    setSelectedId(userId);
    setDetailLoading(true);
    const { data } = await supabase.rpc('admin_get_user_details', { target_profile_id: userId });
    if (data) setDetail(data as UserDetail);
    setDetailLoading(false);
  };

  const closeDetail = () => { setSelectedId(null); setDetail(null); };

  // ─── Filter users ───
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    const matchSearch = !q || (u.first_name || '').toLowerCase().includes(q) || (u.last_name || '').toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
    const matchRole = !roleFilter || u.role === roleFilter;
    const userPlan = u.plan_type || 'free';
    const matchPlan = !planFilter || userPlan === planFilter;
    return matchSearch && matchRole && matchPlan;
  });

  if (loading) return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading...</div>;

  // ═══════════════════════════════════════
  // DETAIL VIEW
  // ═══════════════════════════════════════
  if (selectedId) {
    return (
      <UserDetailView
        detail={detail}
        loading={detailLoading}
        adminId={adminId}
        supabase={supabase}
        onBack={closeDetail}
        onRefresh={() => { openDetail(selectedId); loadUsers(); }}
      />
    );
  }

  // ═══════════════════════════════════════
  // LIST VIEW
  // ═══════════════════════════════════════
  return (
    <>
      <SectionHeader title="Users" count={filtered.length} />

      {/* Filters */}
      <AdminCard className="mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <TextInput value={search} onChange={setSearch} placeholder="Search name or email..." />
          <Select value={roleFilter} onChange={setRoleFilter} options={ROLE_OPTIONS} />
          <Select value={planFilter} onChange={setPlanFilter} options={PLAN_FILTER_OPTIONS} />
        </div>
      </AdminCard>

      {/* User rows */}
      <div className="space-y-2">
        {filtered.map((u) => {
          const rc = ROLE_COLORS[u.role] || ROLE_COLORS.individual;
          const plan = u.plan_type || 'free';
          const pc = PLAN_COLORS[plan] || PLAN_COLORS.free;
          return (
            <AdminCard key={u.id} className="cursor-pointer hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between" onClick={() => openDetail(u.id)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0" style={{ background: '#F5ECD7', color: '#B8860B' }}>
                    {(u.first_name || u.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold truncate" style={{ color: '#0F1E2E' }}>
                      {u.first_name ? u.first_name + ' ' + (u.last_name || '') : 'Not onboarded'}
                    </div>
                    <div className="text-xs truncate" style={{ color: '#8A9BAA' }}>{u.email}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: pc.bg, color: pc.text }}>
                    {PLAN_LABELS[plan] || 'Free'}
                  </span>
                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: rc.bg, color: rc.text }}>
                    {u.role.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </AdminCard>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>
            No users match your filters
          </div>
        )}
      </div>
    </>
  );
}

// ═══════════════════════════════════════
// USER DETAIL VIEW
// ═══════════════════════════════════════
function UserDetailView({ detail, loading, adminId, supabase, onBack, onRefresh }: {
  detail: UserDetail | null; loading: boolean; adminId: string | null;
  supabase: any; onBack: () => void; onRefresh: () => void;
}) {
  const [assignPlan, setAssignPlan] = useState('free');
  const [assignRole, setAssignRole] = useState('individual');
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [showDelete, setShowDelete] = useState(false);

  // Sync dropdowns when detail loads
  useEffect(() => {
    if (detail?.subscription?.plan_type) setAssignPlan(detail.subscription.plan_type);
    else setAssignPlan('free');
    if (detail?.profile?.role) setAssignRole(detail.profile.role);
  }, [detail]);

  const flash = (type: 'success' | 'error', msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 4000);
  };

  if (loading || !detail) {
    return <div className="text-center py-20" style={{ color: '#8A9BAA' }}>Loading user details...</div>;
  }

  const p = detail.profile;
  const sub = detail.subscription;
  const isSelf = p.id === adminId;
  const currentPlan = sub?.status === 'active' ? sub.plan_type : 'free';
  const isAdminGranted = sub?.stripe_subscription_id?.startsWith('admin_granted_');

  // ─── Action handlers ───
  const handleAssignPlan = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('admin_assign_subscription', {
        target_profile_id: p.id, new_plan_type: assignPlan,
      });
      if (error) throw error;
      flash('success', `Plan updated to ${PLAN_LABELS[assignPlan]}`);
      onRefresh();
    } catch (err: any) {
      flash('error', err.message || 'Failed to assign plan');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = async () => {
    setActionLoading(true);
    try {
      const { error } = await supabase.rpc('admin_update_user_role', {
        target_profile_id: p.id, new_role: assignRole,
      });
      if (error) throw error;
      flash('success', `Role updated to ${assignRole.replace('_', ' ')}`);
      onRefresh();
    } catch (err: any) {
      flash('error', err.message || 'Failed to update role');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (deleteConfirm !== p.email) return;
    setActionLoading(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId: p.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Delete failed');
      flash('success', 'User deleted');
      setTimeout(onBack, 1500);
    } catch (err: any) {
      flash('error', err.message || 'Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div>
      {/* Back button */}
      <button onClick={onBack} className="mb-4 text-sm border-none bg-transparent cursor-pointer p-0"
        style={{ color: '#C7A23A', fontFamily: 'DM Sans, sans-serif' }}>
        ← Back to Users
      </button>

      {/* Feedback banner */}
      {feedback && (
        <div className="mb-4 p-3 rounded-xl text-sm" style={{
          background: feedback.type === 'success' ? '#F0F7EC' : '#FDF2F2',
          color: feedback.type === 'success' ? '#5B8A3C' : '#C44536',
          border: `1px solid ${feedback.type === 'success' ? '#5B8A3C' : '#C44536'}30`,
          fontFamily: 'DM Sans, sans-serif',
        }}>
          {feedback.msg}
        </div>
      )}

      {/* Header */}
      <AdminCard className="mb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold flex-shrink-0" style={{ background: '#F5ECD7', color: '#B8860B' }}>
            {(p.first_name || p.email || '?')[0].toUpperCase()}
          </div>
          <div>
            <h2 className="text-lg font-semibold m-0" style={{ fontFamily: 'Cormorant Garamond, serif', color: '#0F1E2E' }}>
              {p.first_name ? `${p.first_name} ${p.last_name || ''}` : 'Not onboarded'}
            </h2>
            <div className="text-sm" style={{ color: '#8A9BAA' }}>{p.email}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif' }}>
          <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Role</span><br />{p.role.replace('_', ' ')}</div>
          <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Gender</span><br />{p.gender || '—'}</div>
          <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Joined</span><br />{new Date(p.created_at).toLocaleDateString()}</div>
          <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Streak</span><br />{p.streak_count || 0} days</div>
        </div>
      </AdminCard>

      {/* Couple info */}
      {detail.couple && (
        <AdminCard className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>Couple</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs" style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif' }}>
            <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Partner</span><br />{detail.couple.partner_name || '—'}</div>
            <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Status</span><br />{detail.couple.status}</div>
            <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Wedding</span><br />{detail.couple.wedding_date || '—'}</div>
            <div><span className="font-semibold uppercase tracking-wider" style={{ color: '#8A9BAA' }}>Years</span><br />{detail.couple.years_married ?? '—'}</div>
          </div>
        </AdminCard>
      )}

      {/* Subscription management */}
      <AdminCard className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>Subscription</h3>
        <div className="mb-3 text-sm" style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif' }}>
          Current: <span className="font-semibold" style={{ color: '#0F1E2E' }}>{PLAN_LABELS[currentPlan] || 'Free'}</span>
          {sub?.status && <span className="ml-2 text-xs px-2 py-0.5 rounded-full" style={{
            background: sub.status === 'active' ? '#F0F7EC' : '#FDF2F2',
            color: sub.status === 'active' ? '#5B8A3C' : '#C44536',
          }}>{sub.status}</span>}
          {isAdminGranted && <span className="ml-2 text-xs" style={{ color: '#C7A23A' }}>★ Admin granted</span>}
        </div>
        {sub?.current_period_end && (
          <div className="mb-3 text-xs" style={{ color: '#8A9BAA' }}>
            Expires: {new Date(sub.current_period_end).toLocaleDateString()}
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={assignPlan} onChange={setAssignPlan} options={ASSIGN_PLAN_OPTIONS} />
          </div>
          <GoldButton onClick={handleAssignPlan} disabled={actionLoading || assignPlan === currentPlan} small>
            Assign Plan
          </GoldButton>
        </div>
      </AdminCard>

      {/* Payment history */}
      {detail.payments && detail.payments.length > 0 && (
        <AdminCard className="mb-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>
            Payment History ({detail.payments.length})
          </h3>
          <div className="space-y-2">
            {detail.payments.map((pay: any) => (
              <div key={pay.id} className="flex items-center justify-between text-xs py-2" style={{ borderBottom: '1px solid #F0EDE6' }}>
                <div style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif' }}>
                  {new Date(pay.created_at).toLocaleDateString()} · {pay.plan_type}
                </div>
                <div className="font-semibold" style={{ color: '#0F1E2E' }}>
                  £{(pay.amount_cents / 100).toFixed(2)}
                  <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs" style={{
                    background: pay.status === 'succeeded' ? '#F0F7EC' : '#FDF2F2',
                    color: pay.status === 'succeeded' ? '#5B8A3C' : '#C44536',
                  }}>{pay.status}</span>
                </div>
              </div>
            ))}
          </div>
        </AdminCard>
      )}

      {/* Role management */}
      <AdminCard className="mb-4">
        <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#8A9BAA', fontFamily: 'DM Sans, sans-serif' }}>Role</h3>
        {isSelf && (
          <div className="mb-3 p-2 rounded-lg text-xs" style={{ background: '#FFF3E0', color: '#E65100', fontFamily: 'DM Sans, sans-serif' }}>
            ⚠ This is your account. You cannot demote yourself.
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <Select value={assignRole} onChange={setAssignRole} options={ROLE_ASSIGN_OPTIONS} />
          </div>
          <GoldButton onClick={handleChangeRole} disabled={actionLoading || assignRole === p.role || (isSelf && assignRole !== 'super_admin')} small>
            Update Role
          </GoldButton>
        </div>
      </AdminCard>

      {/* Danger zone — delete user */}
      {!isSelf && (
        <AdminCard className="mb-4" >
          <h3 className="text-sm font-semibold uppercase tracking-wider mb-3" style={{ color: '#C44536', fontFamily: 'DM Sans, sans-serif' }}>Danger Zone</h3>
          {!showDelete ? (
            <OutlineButton onClick={() => setShowDelete(true)} danger>
              Delete this user
            </OutlineButton>
          ) : (
            <div>
              <p className="text-xs mb-3" style={{ color: '#5A6B7A', fontFamily: 'DM Sans, sans-serif', lineHeight: 1.6 }}>
                This will permanently delete the user&apos;s account, all their data, and unlink them from their spouse.
                Type <strong style={{ color: '#C44536' }}>{p.email}</strong> to confirm.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <TextInput value={deleteConfirm} onChange={setDeleteConfirm} placeholder="Type email to confirm" />
                </div>
                <OutlineButton onClick={handleDelete} danger>
                  {actionLoading ? 'Deleting...' : 'Confirm Delete'}
                </OutlineButton>
                <OutlineButton onClick={() => { setShowDelete(false); setDeleteConfirm(''); }}>
                  Cancel
                </OutlineButton>
              </div>
            </div>
          )}
        </AdminCard>
      )}
    </div>
  );
}
