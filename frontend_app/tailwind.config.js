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
          950: '#0B0B12', // Main page background: Near-black
          900: '#171824', // Sidebar background: Dark charcoal
          850: '#191A27', // Header and toolbar surfaces
          800: '#20212F', // Primary dashboard cards: Lighter charcoal (clearly distinguishable!)
          750: '#252638', // Secondary cards and nested panels
          700: '#343448', // Card borders: Subtle gray-purple
          650: '#3D3E56',
          600: '#484A66',
          500: '#5C5E82',
        },
        navy: {
          950: '#0B0F17',
          900: '#0F172A',
          850: '#131D31',
          800: '#1E293B',
          700: '#334155',
          600: '#475569',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          200: '#BFDBFE',
          300: '#93C5FD',
          400: '#60A5FA',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        vision: {
          cyan: '#0EA5E9',
          emerald: '#10B981',
          amber: '#F59E0B',
          rose: '#EF4444',
          purple: '#64748B',
          card: 'rgba(15, 23, 42, 0.75)',
          glass: 'rgba(11, 15, 23, 0.85)',
          lightBg: '#F8FAFC',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'vision-blue': '0px 4px 14px rgba(37, 99, 235, 0.15)',
        'vision-glow': '0px 4px 14px rgba(37, 99, 235, 0.20)',
        'vision-card': '0px 4px 20px 0px rgba(0, 0, 0, 0.05)',
        'vision-card-dark': '0px 4px 20px 0px rgba(0, 0, 0, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
