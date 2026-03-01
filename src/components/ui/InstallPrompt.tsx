'use client';

import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * Shows a native-feeling install banner for PWA.
 * Only appears when the browser fires the beforeinstallprompt event
 * AND user hasn't dismissed it before.
 */
export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(true);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Already installed?
    const standalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    setIsStandalone(standalone);
    if (standalone) return;

    // Was it dismissed before?
    const wasDismissed = localStorage.getItem('cleave-install-dismissed');
    setDismissed(!!wasDismissed);

    // iOS detection (no beforeinstallprompt)
    const ua = window.navigator.userAgent.toLowerCase();
    setIsIos(/iphone|ipad|ipod/.test(ua) && !(window as any).MSStream);

    // Listen for install prompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setDismissed(false);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      setDismissed(true);
    }
  }

  function handleDismiss() {
    setDismissed(true);
    localStorage.setItem('cleave-install-dismissed', 'true');
  }

  // Don't show if already installed or dismissed
  if (isStandalone || dismissed) return null;

  // iOS: show manual instructions
  if (isIos && !deferredPrompt) {
    return (
      <div
        className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 backdrop-blur-xl animate-slideUp"
        style={{
          background: 'var(--bg-nav)',
          border: '1px solid var(--border-nav)',
          boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
        }}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">📱</div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Source Sans 3, sans-serif' }}>
              Add to Home Screen
            </div>
            <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Tap the share button <span style={{ fontSize: 14 }}>⎋</span> then &quot;Add to Home Screen&quot; for the full app experience.
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-lg border-none bg-transparent cursor-pointer flex-shrink-0"
            style={{ color: 'var(--text-muted)' }}
          >
            ✕
          </button>
        </div>
      </div>
    );
  }

  // Android/Desktop: show install button
  if (!deferredPrompt) return null;

  return (
    <div
      className="fixed bottom-20 left-4 right-4 z-50 rounded-2xl p-4 backdrop-blur-xl animate-slideUp"
      style={{
        background: 'var(--bg-nav)',
        border: '1px solid var(--border-nav)',
        boxShadow: '0 -4px 30px rgba(0,0,0,0.1)',
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0F1E2E, #1A2D40)' }}
        >
          <span className="text-lg">✝</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold" style={{ color: 'var(--text-primary)', fontFamily: 'Source Sans 3, sans-serif' }}>
            Install Cleave
          </div>
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>
            Quick access · Offline ready · Push notifications
          </div>
        </div>
        <button
          onClick={handleInstall}
          className="px-4 py-2 rounded-xl text-xs font-semibold border-none cursor-pointer"
          style={{
            background: 'linear-gradient(135deg, #B8860B, #8B6914)',
            color: 'white',
            fontFamily: 'Source Sans 3, sans-serif',
          }}
        >
          Install
        </button>
        <button
          onClick={handleDismiss}
          className="text-sm border-none bg-transparent cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
