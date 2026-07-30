/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        deva: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      colors: {
        // Navy/gold theme from the original CCE app.
        sf: '#0F3554',
        gold: '#C9A227',
        bg: '#F7F5EF',
        card: '#ffffff',
        bdr: '#E0D6BC',
      },
    },
  },
  plugins: [],
}
