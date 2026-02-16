/**
 * Theme-aware color tokens.
 * 
 * Use CSS variables via `var(--token)` in styles to automatically
 * switch between light and dark mode. These helpers provide the
 * variable references for inline styles.
 */

export const t = {
  // Backgrounds
  bgPrimary: 'var(--bg-primary)',
  bgCard: 'var(--bg-card)',
  bgCardHover: 'var(--bg-card-hover)',
  bgAccent: 'var(--bg-accent)',
  bgHero: 'var(--bg-hero)',
  bgInput: 'var(--bg-input)',
  bgWarm: 'var(--bg-warm)',
  bgOverlay: 'var(--bg-overlay)',

  // Text
  textPrimary: 'var(--text-primary)',
  textSecondary: 'var(--text-secondary)',
  textMuted: 'var(--text-muted)',
  textLight: 'var(--text-light)',
  textInverse: 'var(--text-inverse)',
  textLink: 'var(--text-link)',

  // Borders
  border: 'var(--border)',
  borderLight: 'var(--border-light)',
  borderFocus: 'var(--border-focus)',

  // Shadows
  shadowCard: 'var(--shadow-card)',
  shadowCardLg: 'var(--shadow-card-lg)',

  // Pillars
  pillarCovenantBg: 'var(--pillar-covenant-bg)',
  pillarCovenantText: 'var(--pillar-covenant-text)',
  pillarSafetyBg: 'var(--pillar-safety-bg)',
  pillarSafetyText: 'var(--pillar-safety-text)',
  pillarCommBg: 'var(--pillar-comm-bg)',
  pillarCommText: 'var(--pillar-comm-text)',
  pillarSpiritualBg: 'var(--pillar-spiritual-bg)',
  pillarSpiritualText: 'var(--pillar-spiritual-text)',

  // Status
  green: 'var(--green)',
  greenBg: 'var(--green-bg)',
  red: 'var(--red)',
  redBg: 'var(--red-bg)',
  goldBg: 'var(--gold-bg)',
} as const;

/** Pillar style map using theme-aware tokens */
export const PILLAR_THEME = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '/icons/pillar-covenant.png', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, icon: '/icons/pillar-emotional-safety.png', label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, icon: '/icons/pillar-communication.png', label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '/icons/pillar-spiritual.png', label: 'Spiritual' },
} as const;

/** Tier config using theme-aware tokens */
export const TIER_THEME = {
  strengthen: { color: t.green, bg: t.greenBg, label: 'Strengthen' },
  repair: { color: t.textLink, bg: t.goldBg, label: 'Repair' },
  restore: { color: t.red, bg: t.redBg, label: 'Restore' },
} as const;
