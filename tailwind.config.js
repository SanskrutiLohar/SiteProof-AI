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
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
          950: '#0f172a',
        },
        construction: {
          amber: '#f59e0b',
          emerald: '#10b981',
          rose: '#ef4444',
          cyan: '#06b6d4',
          slate: '#334155',
        }
      },
      boxShadow: {
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
        'glow-brand': '0 0 20px -5px rgba(59, 130, 246, 0.5)',
        'glow-emerald': '0 0 20px -5px rgba(16, 185, 129, 0.5)',
        'glow-amber': '0 0 20px -5px rgba(245, 158, 11, 0.5)',
      }
    },
  },
  plugins: [],
}
