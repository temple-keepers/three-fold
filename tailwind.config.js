/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Threefold Cord — 2026 Brand Palette
        navy: {
          DEFAULT: '#0F1E2E',
          50: '#E8ECF0',
          100: '#C5CED8',
          200: '#8A9BAA',
          300: '#5A6B7A',
          400: '#3A4F62',
          500: '#243A50',
          600: '#1A2D40',
          700: '#0F1E2E',
          800: '#0A1520',
          900: '#060D14',
        },
        gold: {
          DEFAULT: '#C7A23A',
          50: '#FBF6E8',
          100: '#F5ECD7',
          200: '#E8D49A',
          300: '#D4B45A',
          400: '#C7A23A',
          500: '#A8862E',
          600: '#8A6E24',
          700: '#6B561B',
          800: '#4D3E13',
          900: '#2E250B',
        },
        ivory: {
          DEFAULT: '#F4F1EA',
          dark: '#E8E3D9',
          light: '#FAF8F4',
        },
        burgundy: {
          DEFAULT: '#6B2C3E',
          light: '#8A3D54',
          dark: '#4D1F2D',
        },
        // Semantic aliases
        brand: {
          bg: '#F4F1EA',
          card: '#FFFFFF',
          accent: '#0F1E2E',
          border: '#E0DCD4',
        },
      },
      fontFamily: {
        display: ['Cinzel', 'Cormorant Garamond', 'serif'],
        body: ['DM Sans', 'Source Sans 3', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        'card': '0 8px 40px rgba(15, 30, 46, 0.06), 0 1px 3px rgba(15, 30, 46, 0.04)',
        'card-hover': '0 12px 48px rgba(15, 30, 46, 0.1), 0 2px 6px rgba(15, 30, 46, 0.06)',
        'gold': '0 4px 20px rgba(199, 162, 58, 0.25)',
        'gold-hover': '0 6px 28px rgba(199, 162, 58, 0.35)',
        'navy': '0 4px 20px rgba(15, 30, 46, 0.2)',
      },
    },
  },
  plugins: [],
};
