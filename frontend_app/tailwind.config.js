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
        navy: {
          950: '#060B26',
          900: '#0B1437',
          850: '#0E1B4D',
          800: '#111C44',
          700: '#1B2559',
          600: '#2B3674',
        },
        brand: {
          50: '#EBF3FF',
          100: '#D6E7FF',
          200: '#ADCFFF',
          300: '#85B7FF',
          400: '#3D8CFF',
          500: '#0075FF',
          600: '#005CE6',
          700: '#0047B3',
        },
        vision: {
          cyan: '#00D5FF',
          emerald: '#01B574',
          amber: '#FFB547',
          rose: '#EE5D50',
          purple: '#7551FF',
          card: 'rgba(15, 23, 42, 0.75)',
          glass: 'rgba(6, 11, 40, 0.78)',
          lightBg: '#F4F7FE',
          lightCard: '#FFFFFF',
          lightBorder: '#E2E8F0',
        }
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      boxShadow: {
        'vision-blue': '0px 20px 27px rgba(0, 117, 255, 0.18)',
        'vision-glow': '0px 4px 20px rgba(0, 117, 255, 0.35)',
        'vision-card': '0px 20px 27px 0px rgba(0, 0, 0, 0.05)',
        'vision-card-dark': '0px 20px 27px 0px rgba(0, 0, 0, 0.25)',
      },
      backdropBlur: {
        'xs': '2px',
      }
    },
  },
  plugins: [],
}
