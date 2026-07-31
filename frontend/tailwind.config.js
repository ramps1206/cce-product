/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        deva: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      colors: {
        // Matched to the original CCE app screenshots.
        sf: '#1e2a78',        // primary indigo (headings/buttons)
        gold: '#C9A227',
        bg: '#f3f1fb',        // light lavender page background
        card: '#ffffff',
        bdr: '#e6e2f5',
        sidebar: '#0c1830',   // dark navy sidebar
        sidebaract: '#16305a',// active nav item
        dot: '#facc15',       // yellow status dot
      },
      backgroundImage: {
        // Purple top-bar gradient used across the app.
        topbar: 'linear-gradient(90deg,#3d2f9e 0%,#5b3fc0 55%,#6d4bd0 100%)',
      },
    },
  },
  plugins: [],
}
