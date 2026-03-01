'use client';

import { useSubscription } from '@/lib/useSubscription';
import { UpgradePrompt } from '@/components/ui/UpgradePrompt';
import { t } from '@/lib/tokens';

interface PremiumGateProps {
  children: React.ReactNode;
  /** Feature name shown in the upgrade prompt */
  feature?: string;
  /** Number of free items to show before gating (e.g. 2 free games) */
  freeLimit?: number;
  /** Current index of the item (used with freeLimit) */
  currentIndex?: number;
  /** Use compact inline prompt instead of full-page */
  compact?: boolean;
  /** Show a teaser (blurred children) instead of completely hiding */
  teaser?: boolean;
  /** Completely hide children for non-premium users */
  hide?: boolean;
}

/**
 * Wraps premium content. Shows upgrade prompt if user is on free tier.
 *
 * Usage:
 *   <PremiumGate feature="Marriage Games">
 *     <GameContent />
 *   </PremiumGate>
 *
 *   <PremiumGate freeLimit={2} currentIndex={gameIndex} feature="This game">
 *     <GamePlay />
 *   </PremiumGate>
 */
export function PremiumGate({
  children,
  feature,
  freeLimit,
  currentIndex,
  compact = false,
  teaser = false,
  hide = false,
}: PremiumGateProps) {
  const { isPremium, loading } = useSubscription();

  // Still loading subscription status — show children to avoid flash
  if (loading) return <>{children}</>;

  // Premium users always see content
  if (isPremium) return <>{children}</>;

  // Free users: check if within free limit
  if (freeLimit !== undefined && currentIndex !== undefined) {
    if (currentIndex < freeLimit) return <>{children}</>;
  }

  // Free user, content is gated
  if (hide) return null;

  if (teaser) {
    return (
      <div className="relative">
        <div style={{ filter: 'blur(6px)', pointerEvents: 'none', userSelect: 'none' as const, opacity: 0.5 }}>
          {children}
        </div>
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <UpgradePrompt feature={feature} compact />
        </div>
      </div>
    );
  }

  return <UpgradePrompt feature={feature} compact={compact} />;
}

/**
 * Hook for programmatic premium checks.
 * Returns a function to check if an action is allowed.
 */
export function usePremiumCheck() {
  const { isPremium, loading } = useSubscription();

  function requirePremium(featureName?: string): boolean {
    if (loading || isPremium) return true;
    return false;
  }

  return { isPremium, loading, requirePremium };
}

/**
 * Small inline lock badge for list items
 */
export function PremiumBadge() {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
      style={{
        background: `${t.textLink}15`,
        color: t.textLink,
        fontFamily: 'Source Sans 3, sans-serif',
      }}
    >
      <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zM12 17c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>
      Plus
    </span>
  );
}
