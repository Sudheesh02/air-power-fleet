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
          950: '#0B0B12',
          900: '#171824',
          850: '#191A27',
          800: '#20212F',
          700: '#252638',
          600: '#343448',
        },
        brand: {
          50: '#FAF8FF',
          100: '#F0EBFF',
          200: '#E1D6FF',
          300: '#BC83FF', // Secondary accent: Lavender
          400: '#A75DFF',
          500: '#9147FF', // Primary accent: Vibrant purple
          600: '#7B2CFF',
          700: '#6412ED',
        },
        textPalette: {
          primary: '#F5F4FF', // Primary text: Off-white
          secondary: '#A7A8C2', // Secondary text: Muted lavender-gray
          muted: '#7F809E',
        },
        vision: {
          cyan: '#38BDF8',
          emerald: '#22C55E',
          amber: '#F59E0B',
          rose: '#EF4444',
          purple: '#9147FF',
          lavender: '#BC83FF',
          card: '#20212F',
          glass: 'rgba(32, 33, 47, 0.95)',
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
        'vision-blue': '0px 10px 25px rgba(145, 71, 255, 0.2)',
        'vision-glow': '0px 4px 20px rgba(145, 71, 255, 0.35)',
        'vision-card': '0px 20px 27px 0px rgba(0, 0, 0, 0.05)',
        'vision-card-dark': '0px 10px 25px 0px rgba(0, 0, 0, 0.35)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
