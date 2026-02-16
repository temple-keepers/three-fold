'use client';

import { createClient } from '@/lib/supabase-browser';

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;

/**
 * Convert a base64url string to a Uint8Array for the applicationServerKey.
 */
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

/**
 * Register the service worker if not already registered.
 */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[PWA] Service worker registered');
    return reg;
  } catch (err) {
    console.error('[PWA] SW registration failed:', err);
    return null;
  }
}

/**
 * Check current notification permission status.
 */
export function getNotificationPermission(): NotificationPermission | 'unsupported' {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  return Notification.permission;
}

/**
 * Request notification permission from the user.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) return 'unsupported';
  const result = await Notification.requestPermission();
  return result;
}

/**
 * Subscribe to push notifications and save the subscription to Supabase.
 * Returns true if successful.
 */
export async function subscribeToPush(): Promise<boolean> {
  try {
    const reg = await registerServiceWorker();
    if (!reg) return false;

    // Wait for the service worker to be ready
    const swReg = await navigator.serviceWorker.ready;

    // Check for existing subscription
    let subscription = await swReg.pushManager.getSubscription();

    if (!subscription) {
      subscription = await swReg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
    }

    if (!subscription) return false;

    // Extract keys
    const subJson = subscription.toJSON();
    const endpoint = subJson.endpoint!;
    const p256dh = subJson.keys!.p256dh!;
    const auth = subJson.keys!.auth!;

    // Save to Supabase
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    await supabase.from('push_subscriptions').upsert(
      {
        profile_id: user.id,
        endpoint,
        p256dh,
        auth,
        user_agent: navigator.userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'profile_id,endpoint' }
    );

    // Ensure notification_preferences row exists with push enabled
    await supabase.from('notification_preferences').upsert(
      { profile_id: user.id, push_enabled: true },
      { onConflict: 'profile_id' }
    );

    console.log('[PWA] Push subscription saved');
    return true;
  } catch (err) {
    console.error('[PWA] Push subscription failed:', err);
    return false;
  }
}

/**
 * Unsubscribe from push notifications and remove from Supabase.
 */
export async function unsubscribeFromPush(): Promise<boolean> {
  try {
    const swReg = await navigator.serviceWorker.ready;
    const subscription = await swReg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();

      // Remove from database
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('push_subscriptions')
          .delete()
          .eq('profile_id', user.id)
          .eq('endpoint', endpoint);

        await supabase.from('notification_preferences')
          .update({ push_enabled: false })
          .eq('profile_id', user.id);
      }
    }

    console.log('[PWA] Push unsubscribed');
    return true;
  } catch (err) {
    console.error('[PWA] Push unsubscribe failed:', err);
    return false;
  }
}

/**
 * Check if user currently has an active push subscription.
 */
export async function isPushSubscribed(): Promise<boolean> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return false;
  try {
    const swReg = await navigator.serviceWorker.ready;
    const subscription = await swReg.pushManager.getSubscription();
    return !!subscription;
  } catch {
    return false;
  }
}

/**
 * Check if the browser supports push notifications.
 */
export function isPushSupported(): boolean {
  if (typeof window === 'undefined') return false;
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
}
