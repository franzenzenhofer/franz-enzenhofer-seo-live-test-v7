import type { Config } from 'tailwindcss'

export default {
  content: ['src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {
      keyframes: {
        // Slow breathe so pending rules read as "still working", not stuck.
        pendingPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.45' },
        },
      },
      animation: {
        pending: 'pendingPulse 2.2s ease-in-out infinite',
      },
    },
    fontSize: {
      'xs': ['12px', '16px'],  // Minimum 12px
      'sm': ['14px', '20px'],
      'base': ['16px', '24px'],
      'lg': ['18px', '28px'],
      'xl': ['20px', '28px'],
      '2xl': ['24px', '32px'],
    }
  },
  plugins: [],
} satisfies Config
