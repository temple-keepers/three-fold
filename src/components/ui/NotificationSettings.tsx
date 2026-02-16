'use client';

import { useState, useEffect } from 'react';
import {
  isPushSupported,
  isPushSubscribed,
  getNotificationPermission,
  requestNotificationPermission,
  subscribeToPush,
  unsubscribeFromPush,
} from '@/lib/push';
import { createClient } from '@/lib/supabase-browser';

interface Prefs {
  daily_devotional_reminder: boolean;
  streak_warnings: boolean;
  milestone_celebrations: boolean;
  spouse_activity: boolean;
  weekly_summary: boolean;
  push_enabled: boolean;
  daily_reminder_time: string;
}

const DEFAULT_PREFS: Prefs = {
  daily_devotional_reminder: true,
  streak_warnings: true,
  milestone_celebrations: true,
  spouse_activity: true,
  weekly_summary: true,
  push_enabled: false,
  daily_reminder_time: '07:00',
};

const PREF_ITEMS: { key: keyof Prefs; label: string; desc: string; icon: string }[] = [
  { key: 'daily_devotional_reminder', label: 'Daily Devotional', desc: 'Morning reminder to read', icon: '📖' },
  { key: 'streak_warnings', label: 'Streak Warnings', desc: "Don't lose your streak", icon: '🔥' },
  { key: 'milestone_celebrations', label: 'Milestones', desc: 'When you earn badges', icon: '🏆' },
  { key: 'spouse_activity', label: 'Spouse Activity', desc: 'When your partner acts', icon: '💑' },
  { key: 'weekly_summary', label: 'Weekly Summary', desc: 'Sunday recap', icon: '📊' },
];

export function NotificationSettings() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [permission, setPermission] = useState<string>('default');
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const supabase = createClient();

  useEffect(() => {
    async function init() {
      setSupported(isPushSupported());
      setPermission(getNotificationPermission() as string);
      setSubscribed(await isPushSubscribed());

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('notification_preferences')
          .select('*')
          .eq('profile_id', user.id)
          .maybeSingle();
        if (data) {
          setPrefs({
            daily_devotional_reminder: data.daily_devotional_reminder ?? true,
            streak_warnings: data.streak_warnings ?? true,
            milestone_celebrations: data.milestone_celebrations ?? true,
            spouse_activity: data.spouse_activity ?? true,
            weekly_summary: data.weekly_summary ?? true,
            push_enabled: data.push_enabled ?? false,
            daily_reminder_time: data.daily_reminder_time?.slice(0, 5) ?? '07:00',
          });
        }
      }
      setLoading(false);
    }
    init();
  }, []);

  async function handleTogglePush() {
    setToggling(true);
    if (subscribed) {
      await unsubscribeFromPush();
      setSubscribed(false);
      setPrefs(p => ({ ...p, push_enabled: false }));
    } else {
      const perm = await requestNotificationPermission();
      setPermission(perm as string);
      if (perm === 'granted') {
        const ok = await subscribeToPush();
        setSubscribed(ok);
        setPrefs(p => ({ ...p, push_enabled: ok }));
      }
    }
    setToggling(false);
  }

  async function updatePref(key: keyof Prefs, value: boolean | string) {
    setPrefs(p => ({ ...p, [key]: value }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('notification_preferences').upsert(
      { profile_id: user.id, [key]: value, updated_at: new Date().toISOString() },
      { onConflict: 'profile_id' }
    );
  }

  if (loading) {
    return (
      <div className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--bg-warm)', border: '1px solid var(--border)' }}>
        <div className="h-4 w-32 rounded" style={{ background: 'var(--border)' }} />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Master push toggle */}
      <div
        className="flex items-center justify-between p-4 rounded-xl"
        style={{ background: 'var(--bg-warm)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-3">
          <span className="text-lg">🔔</span>
          <div>
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Source Sans 3, sans-serif' }}>
              Push Notifications
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              {!supported
                ? 'Not supported on this browser'
                : permission === 'denied'
                ? 'Blocked — enable in browser settings'
                : subscribed
                ? 'Enabled on this device'
                : 'Get reminders and updates'}
            </div>
          </div>
        </div>
        <button
          onClick={handleTogglePush}
          disabled={!supported || permission === 'denied' || toggling}
          className="relative w-12 h-7 rounded-full border-none cursor-pointer transition-all duration-200"
          style={{
            background: subscribed ? 'var(--gold, #C7A23A)' : 'var(--border)',
            opacity: !supported || permission === 'denied' ? 0.4 : 1,
          }}
        >
          <div
            className="absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all duration-200"
            style={{ left: subscribed ? 22 : 2 }}
          />
        </button>
      </div>

      {/* Per-type toggles (only show when subscribed) */}
      {subscribed && (
        <div className="space-y-0.5">
          {PREF_ITEMS.map(item => (
            <div
              key={item.key}
              className="flex items-center justify-between py-3 px-4 rounded-lg"
              style={{ background: 'var(--bg-warm)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">{item.icon}</span>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Source Sans 3, sans-serif' }}>{item.label}</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>{item.desc}</div>
                </div>
              </div>
              <button
                onClick={() => updatePref(item.key, !prefs[item.key])}
                className="relative w-10 h-6 rounded-full border-none cursor-pointer transition-all duration-200"
                style={{ background: prefs[item.key] ? 'var(--green, #5B8A3C)' : 'var(--border)' }}
              >
                <div
                  className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-200"
                  style={{ left: prefs[item.key] as boolean ? 18 : 2 }}
                />
              </button>
            </div>
          ))}

          {/* Reminder time */}
          {prefs.daily_devotional_reminder && (
            <div
              className="flex items-center justify-between py-3 px-4 rounded-lg"
              style={{ background: 'var(--bg-warm)' }}
            >
              <div className="flex items-center gap-2.5">
                <span className="text-sm">⏰</span>
                <div>
                  <div className="text-sm" style={{ color: 'var(--text-primary)', fontFamily: 'Source Sans 3, sans-serif' }}>Reminder Time</div>
                  <div className="text-[10px]" style={{ color: 'var(--text-muted)' }}>When to nudge you</div>
                </div>
              </div>
              <input
                type="time"
                value={prefs.daily_reminder_time}
                onChange={e => updatePref('daily_reminder_time', e.target.value)}
                className="text-sm rounded-lg px-2 py-1 border-none outline-none"
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'Source Sans 3, sans-serif',
                }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
