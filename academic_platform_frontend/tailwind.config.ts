// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        'arabic': ['El Messiri', 'system-ui', 'sans-serif'],
      },
      animation: {
        'legal-glow': 'legalGlow 2s ease-in-out infinite alternate',
        'gavel-bounce': 'gavelBounce 0.5s ease-in-out',
        'scroll-unroll': 'scrollUnroll 1s ease-out',
      },
      keyframes: {
        legalGlow: {
          '0%': { 'text-shadow': '0 0 20px #fff' },
          '100%': { 'text-shadow': '0 0 30px #ff0080, 0 0 40px #ff0080' }
        },
        gavelBounce: {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '50%': { transform: 'rotate(-10deg)' }
        }
      }
    },
  },
  plugins: [],
}
export default config