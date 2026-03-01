'use client';

import { useState, useEffect } from 'react';

export function OfflineDetector() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    function goOffline() { setOffline(true); }
    function goOnline() { setOffline(false); }

    if (typeof navigator !== 'undefined' && !navigator.onLine) setOffline(true);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online', goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online', goOnline);
    };
  }, []);

  if (!offline) return null;

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] text-center py-2 px-4"
      style={{
        background: '#e84330',
        color: '#fff',
        fontFamily: 'Source Sans 3, sans-serif',
        fontSize: 13,
        fontWeight: 600,
      }}
    >
      You&apos;re offline. Some features may not work.
    </div>
  );
}
