/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        deva: ['"Noto Sans Devanagari"', 'sans-serif'],
      },
      colors: {
        // Themeable tokens driven by CSS variables (see index.css + lib/themes).
        sf: 'rgb(var(--cce-primary) / <alpha-value>)',       // primary (headings/buttons)
        gold: '#C9A227',
        bg: 'rgb(var(--cce-bg) / <alpha-value>)',            // page background
        card: '#ffffff',
        bdr: '#e6e2f5',
        sidebar: 'rgb(var(--cce-sidebar) / <alpha-value>)',  // dark sidebar
        sidebaract: 'rgb(var(--cce-sidebar-active) / <alpha-value>)',
        dot: '#facc15',
      },
      backgroundImage: {
        // Top-bar gradient (themeable).
        topbar: 'var(--cce-topbar)',
      },
    },
  },
  plugins: [],
}
