/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      boxShadow: {
        glow: '0 8px 25px rgba(234, 179, 8, 0.45)',
      },
    },
  },
  plugins: [],
};
