'use client';

import { useEffect } from 'react';
import { registerServiceWorker } from '@/lib/push';

/**
 * Invisible component that registers the service worker on mount.
 * Place in the root layout.
 */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    registerServiceWorker();
  }, []);

  return null;
}
