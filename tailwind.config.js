/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Rubik', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        sans: ['Assistant', 'IBM Plex Sans Arabic', 'system-ui', '-apple-system', 'Segoe UI', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 8px 25px rgba(234, 179, 8, 0.45)',
      },
    },
  },
  plugins: [],
};
