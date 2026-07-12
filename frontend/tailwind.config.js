/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        codenza: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
        },
        ink: {
          900: '#0f172a',
          800: '#1e293b',
          700: '#334155',
        },
      },
      boxShadow: {
        soft: '0 24px 80px rgba(15, 23, 42, 0.10)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
