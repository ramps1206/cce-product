// Theme presets — set CSS variables consumed by tailwind tokens (index.css).
export interface Theme {
  key: string
  label: string
  primary: string       // "R G B"
  sidebar: string
  sidebarActive: string
  bg: string
  topbar: string        // full CSS gradient
  swatch: string        // hex for the picker chip
}

export const THEMES: Theme[] = [
  {
    key: 'navygold', label: 'नेव्ही-गोल्ड (मूळ)',
    primary: '30 42 120', sidebar: '12 24 48', sidebarActive: '22 48 90', bg: '243 241 251',
    topbar: 'linear-gradient(90deg,#3d2f9e 0%,#5b3fc0 55%,#6d4bd0 100%)', swatch: '#5b3fc0',
  },
  {
    key: 'emerald', label: 'हिरवा (Emerald)',
    primary: '6 95 70', sidebar: '6 30 24', sidebarActive: '6 78 59', bg: '240 250 245',
    topbar: 'linear-gradient(90deg,#065f46 0%,#059669 55%,#10b981 100%)', swatch: '#059669',
  },
  {
    key: 'maroon', label: 'मरून (Maroon)',
    primary: '124 24 40', sidebar: '38 10 14', sidebarActive: '109 22 36', bg: '251 244 245',
    topbar: 'linear-gradient(90deg,#7c1828 0%,#a01e32 55%,#c02540 100%)', swatch: '#a01e32',
  },
  {
    key: 'teal', label: 'टील (Teal)',
    primary: '14 74 92', sidebar: '6 26 32', sidebarActive: '15 61 74', bg: '240 249 250',
    topbar: 'linear-gradient(90deg,#0e4a5c 0%,#0e7490 55%,#0891b2 100%)', swatch: '#0e7490',
  },
  {
    key: 'slate', label: 'स्लेट (Slate)',
    primary: '30 41 59', sidebar: '15 23 42', sidebarActive: '30 41 59', bg: '244 246 249',
    topbar: 'linear-gradient(90deg,#1e293b 0%,#334155 55%,#475569 100%)', swatch: '#334155',
  },
  {
    key: 'sunset', label: 'सूर्यास्त (Sunset)',
    primary: '154 52 18', sidebar: '43 16 8', sidebarActive: '124 45 18', bg: '253 247 242',
    topbar: 'linear-gradient(90deg,#9a3412 0%,#ea580c 55%,#f97316 100%)', swatch: '#ea580c',
  },
]

const KEY = 'cce_theme'

export function applyTheme(themeKey: string) {
  const t = THEMES.find((x) => x.key === themeKey) || THEMES[0]
  const r = document.documentElement.style
  r.setProperty('--cce-primary', t.primary)
  r.setProperty('--cce-sidebar', t.sidebar)
  r.setProperty('--cce-sidebar-active', t.sidebarActive)
  r.setProperty('--cce-bg', t.bg)
  r.setProperty('--cce-topbar', t.topbar)
  localStorage.setItem(KEY, t.key)
}

export function currentTheme(): string {
  return localStorage.getItem(KEY) || 'navygold'
}

/** Apply the saved theme on startup. */
export function initTheme() {
  applyTheme(currentTheme())
}
