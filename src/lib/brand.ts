/**
 * Cleave — 2026 Brand Tokens
 * 
 * Source: Brand Board (brand-board.png)
 * All colour, font, and shadow values in one place.
 */

export const brand = {
  // ─── Core Palette ───
  navy: '#0F1E2E',
  navyMid: '#1A2D40',
  navyLight: '#243A50',
  gold: '#C7A23A',
  goldLight: '#D4B45A',
  goldDark: '#A8862E',
  goldSoft: '#F5ECD7',
  ivory: '#F4F1EA',
  ivoryDark: '#E8E3D9',
  burgundy: '#6B2C3E',
  white: '#FFFFFF',

  // ─── Semantic ───
  bg: '#F4F1EA',
  card: '#FFFFFF',
  border: '#E0DCD4',
  borderLight: '#EDE9E2',
  textPrimary: '#0F1E2E',
  textMuted: '#5A6B7A',
  textLight: '#8A9BAA',

  // ─── Pillar Colours ───
  pillars: {
    covenant: '#C7A23A',
    emotional: '#7B5EA7',
    communication: '#3B82A0',
    spiritual: '#5A8A5C',
  },

  // ─── Tier Colours ───
  tiers: {
    strengthen: '#5A8A5C',
    repair: '#C7A23A',
    restore: '#6B2C3E',
  },

  // ─── Fonts ───
  fontDisplay: "'Cinzel', serif",
  fontBody: "'DM Sans', sans-serif",

  // ─── Shadows ───
  shadowCard: '0 8px 40px rgba(15, 30, 46, 0.06), 0 1px 3px rgba(15, 30, 46, 0.04)',
  shadowGold: '0 4px 20px rgba(199, 162, 58, 0.25)',
  shadowNavy: '0 4px 20px rgba(15, 30, 46, 0.2)',

  // ─── Gradients ───
  gradientGold: 'linear-gradient(135deg, #C7A23A, #A8862E)',
  gradientNavy: 'radial-gradient(ellipse at 50% 38%, #1A2D40 0%, #0F1E2E 75%)',
} as const;
