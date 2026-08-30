/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#2563eb',
          600: '#1d4ed8',
          700: '#1e3a5f',
          800: '#1e2d4a',
          900: '#0f172a',
        },
        saffron: {
          500: '#FF9933',
          600: '#e68a2e',
        },
        govgreen: {
          500: '#138808',
          600: '#0f6e06',
        },
        surface: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
        },
        danger: {
          500: '#dc2626',
          600: '#b91c1c',
        },
        warning: {
          500: '#f59e0b',
          600: '#d97706',
        },
        success: {
          500: '#16a34a',
          600: '#15803d',
        },
      },
    },
  },
  plugins: [],
};
