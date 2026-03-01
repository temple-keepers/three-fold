import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
});

export const PLANS = {
  plus_monthly: {
    name: 'Covenant Plus (Monthly)',
    price: 499, // pence
    currency: 'gbp',
    interval: 'month' as const,
    features: [
      'All Marriage Games (5+)',
      'All Conflict Repair Tools',
      '60-Day Cleave Reset',
      'Couple Exercises Library',
      'Weekly Check-ins',
      'Love Notes',
      'Pillar Analytics Over Time',
    ],
  },
  plus_yearly: {
    name: 'Covenant Plus (Yearly)',
    price: 3499, // pence
    currency: 'gbp',
    interval: 'year' as const,
    features: [
      'Everything in Monthly',
      'Save 42% vs monthly',
    ],
  },
  founding: {
    name: 'Founding Member',
    price: 5999, // pence
    currency: 'gbp',
    interval: null, // one-time
    features: [
      'Lifetime access',
      'Everything in Plus',
      'Founding Member Badge',
      'Never pay again',
    ],
  },
} as const;

export type PlanType = keyof typeof PLANS;
