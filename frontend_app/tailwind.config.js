/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        charcoal: {
          950: '#090A0F',
          900: '#0F1017',
          850: '#13141F',
          800: '#181926',
          750: '#1E2030',
          700: '#25273C',
          600: '#343752',
          500: '#484C6E',
        },
        navy: {
          950: '#090A0F',
          900: '#0F1017',
          850: '#13141F',
          800: '#181926',
          700: '#1E2030',
          600: '#25273C',
        },
        brand: {
          50: '#F5F3FF',
          100: '#EDE9FE',
          200: '#DDD6FE',
          300: '#C4B5FD',
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
          700: '#6D28D9',
        },
        vision: {
          cyan: '#38BDF8',
          emerald: '#22C55E',
          amber: '#F59E0B',
          rose: '#EF4444',
          purple: '#8B5CF6',
          lavender: '#C4B5FD',
          card: '#13141F',
          glass: 'rgba(19, 20, 31, 0.95)',
          lightBg: '#F8FAFC',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'vision-blue': '0px 10px 25px rgba(139, 92, 246, 0.2)',
        'vision-glow': '0px 4px 20px rgba(139, 92, 246, 0.35)',
        'vision-card': '0px 20px 27px 0px rgba(0, 0, 0, 0.05)',
        'vision-card-dark': '0px 10px 25px 0px rgba(0, 0, 0, 0.4)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
