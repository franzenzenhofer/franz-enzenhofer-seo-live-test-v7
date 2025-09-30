import type { Config } from 'tailwindcss'

export default {
  content: ['src/**/*.{ts,tsx,html}'],
  theme: {
    extend: {},
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

