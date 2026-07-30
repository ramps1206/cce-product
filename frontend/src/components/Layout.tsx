import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { syncNow } from '../lib/sync'

const nav = [
  { to: '/', label: 'डॅशबोर्ड', icon: '🏠', end: true },
  { to: '/classes', label: 'वर्ग', icon: '🏫' },
  { to: '/students', label: 'विद्यार्थी', icon: '👧' },
  { to: '/teachers', label: 'शिक्षक', icon: '👩‍🏫' },
  { to: '/attendance', label: 'हजेरी', icon: '📅' },
  { to: '/evaluation', label: 'मूल्यमापन', icon: '📝' },
  { to: '/semester-report', label: 'सत्र अहवाल', icon: '📊' },
  { to: '/report-card', label: 'निकालपत्रक', icon: '🧾' },
  { to: '/grades', label: 'श्रेणी', icon: '🏅' },
  { to: '/scholarships', label: 'शिष्यवृत्ती', icon: '💰' },
  { to: '/general-register', label: 'नोंदवही', icon: '📔' },
  { to: '/settings', label: 'सेटिंग्ज', icon: '⚙️' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
    }
  }, [])

  async function doSync() {
    setSyncing(true)
    setMsg('')
    try {
      const r = await syncNow()
      setMsg(`✓ पाठवले ${r.pushed}, मिळाले ${r.pulled}`)
      window.dispatchEvent(new Event('cce-synced'))
    } catch (e: any) {
      setMsg('⚠ ' + (e.message === 'offline' ? 'ऑफलाइन' : 'सिंक अयशस्वी'))
    } finally {
      setSyncing(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <aside className="w-56 bg-sf text-white flex flex-col">
        <div className="px-5 py-4 border-b border-white/10">
          <div className="text-lg font-bold">CCE Software</div>
          <div className="text-xs text-white/60">सतत सर्वंकष मूल्यमापन</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {nav.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg text-sm ${
                  isActive ? 'bg-gold text-sf font-semibold' : 'text-white/80 hover:bg-white/10'
                }`
              }
            >
              <span>{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
        <button onClick={logout} className="m-3 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20">
          बाहेर पडा
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-14 bg-card border-b border-bdr flex items-center justify-between px-5">
          <div className="flex items-center gap-3 text-sm">
            <span
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${
                online ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
              }`}
            >
              ● {online ? 'ऑनलाइन' : 'ऑफलाइन'}
            </span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-sf/10 text-sf uppercase">{auth?.tier}</span>
            {auth?.tier === 'trial' && (
              <span className="text-xs text-slate-500">ट्रायल: {auth.trialDaysLeft} दिवस शिल्लक</span>
            )}
          </div>
          <div className="flex items-center gap-3">
            {msg && <span className="text-xs text-slate-500">{msg}</span>}
            <button
              onClick={doSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-lg text-sm bg-sf text-white hover:bg-sf/90 disabled:opacity-50"
            >
              {syncing ? 'सिंक…' : '🔄 सिंक'}
            </button>
            <span className="text-xs text-slate-500">{auth?.email}</span>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  )
}
