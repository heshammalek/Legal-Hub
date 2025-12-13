/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./dashboards/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // ألوان مخصصة
        gold: {
          50: '#fefce8',
          100: '#fef9c3',
          200: '#fef08a',
          300: '#fde047',
          400: '#facc15',
          500: '#eab308',
          600: '#ca8a04',
          700: '#a16207',
          800: '#854d0e',
          900: '#713f12',
        },
        navy: {
          50: '#f8fafc',
          100: '#f1f5f9',
          900: '#0f172a',
        }
      },
      fontFamily: {
        sans: ['var(--font-tajawal)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}