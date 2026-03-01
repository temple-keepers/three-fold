import { t } from '@/lib/tokens';

export const PILLAR_STYLES: Record<string, { bg: string; text: string; icon: string; label: string }> = {
  covenant: { bg: t.pillarCovenantBg, text: t.pillarCovenantText, icon: '🤝', label: 'Covenant' },
  emotional_safety: { bg: t.pillarSafetyBg, text: t.pillarSafetyText, icon: '🛡️', label: 'Emotional Safety' },
  communication: { bg: t.pillarCommBg, text: t.pillarCommText, icon: '💬', label: 'Communication' },
  spiritual: { bg: t.pillarSpiritualBg, text: t.pillarSpiritualText, icon: '✝️', label: 'Spiritual' },
  fun: { bg: t.goldBg, text: t.textLink, icon: '🎉', label: 'Fun' },
  general: { bg: t.bgPrimary, text: t.textSecondary, icon: '⭐', label: 'General' },
};

export const DIFF_COLORS: Record<string, { bg: string; text: string }> = {
  easy: { bg: t.greenBg, text: t.green },
  medium: { bg: t.goldBg, text: t.textLink },
  deep: { bg: t.pillarSafetyBg, text: t.pillarSafetyText },
};

export const NOTE_TYPES: Record<string, { icon: string; label: string; bg: string }> = {
  love: { icon: '❤️', label: 'Love', bg: t.redBg },
  encouragement: { icon: '💪', label: 'Encouragement', bg: t.pillarCommBg },
  gratitude: { icon: '🙏', label: 'Gratitude', bg: t.greenBg },
  prayer: { icon: '✝️', label: 'Prayer', bg: t.pillarSafetyBg },
  apology: { icon: '🕊️', label: 'Apology', bg: t.bgCardHover },
  fun: { icon: '😄', label: 'Fun', bg: t.goldBg },
};
