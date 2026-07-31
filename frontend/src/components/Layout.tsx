import { useEffect, useState, type ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getScalar } from '../lib/store'
import { syncNow } from '../lib/sync'

// Top-level navigation, echoing the original app's sidebar.
const NAV_MAIN = [
  { to: '/', label: 'मुखपृष्ठ', icon: '🏠', end: true },
  { to: '/data-entry', label: 'माहिती नोंद', icon: '📁' },
  { to: '/records', label: 'नोंदी', icon: '📝' },
  { to: '/results', label: 'निकाल', icon: '📄' },
  { to: '/nipun', label: 'निपुण महाराष्ट्र', icon: '🎯' },
  { to: '/learning-outcomes', label: 'अध्ययन निष्पत्ती', icon: '📚' },
  { to: '/student-extra', label: 'विद्यार्थी अतिरिक्त माहिती', icon: '📇' },
  { to: '/scholarships', label: 'शिष्यवृत्ती माहिती', icon: '💰', premium: true },
]
const NAV_OTHER = [
  { to: '/promote', label: 'इयत्ता बढती', icon: '⬆️' },
  { to: '/backup', label: 'बॅकअप / Restore', icon: '💾' },
  { to: '/settings', label: 'सेटिंग', icon: '⚙️' },
]

export default function Layout({ children }: { children: ReactNode }) {
  const { auth, logout } = useAuth()
  const [online, setOnline] = useState(navigator.onLine)
  const [syncing, setSyncing] = useState(false)
  const [msg, setMsg] = useState('')
  const [drawer, setDrawer] = useState(false)
  const [school, setSchool] = useState<any>({})

  async function loadSchool() {
    setSchool((await getScalar('school')) || {})
  }
  useEffect(() => {
    loadSchool()
    const on = () => setOnline(true)
    const off = () => setOnline(false)
    const sy = () => loadSchool()
    window.addEventListener('online', on)
    window.addEventListener('offline', off)
    window.addEventListener('cce-synced', sy)
    return () => {
      window.removeEventListener('online', on)
      window.removeEventListener('offline', off)
      window.removeEventListener('cce-synced', sy)
    }
  }, [])

  async function doSync() {
    setSyncing(true)
    setMsg('')
    try {
      const r = await syncNow()
      setMsg(`✓ ${r.pushed}/${r.pulled}`)
      window.dispatchEvent(new Event('cce-synced'))
    } catch (e: any) {
      setMsg(e.message === 'offline' ? '⚠ ऑफलाइन' : '⚠ अयशस्वी')
    } finally {
      setSyncing(false)
      setTimeout(() => setMsg(''), 4000)
    }
  }

  const year = school.yr || '2026-27'

  const navItem = (n: any) => (
    <NavLink
      key={n.to}
      to={n.to}
      end={n.end}
      onClick={() => setDrawer(false)}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-lg text-sm relative ${
          isActive ? 'bg-sidebaract text-white font-semibold' : 'text-white/75 hover:bg-white/10'
        }`
      }
    >
      <span className="w-5 text-center">{n.icon}</span>
      <span className="flex-1">{n.label}</span>
      {n.premium && <span className="text-[9px] bg-orange-500 text-white px-1.5 py-0.5 rounded-full">Premium</span>}
      <span className="w-1.5 h-1.5 rounded-full bg-dot" />
    </NavLink>
  )

  return (
    <div className="flex h-full">
      {drawer && <div className="fixed inset-0 bg-black/40 z-30 md:hidden" onClick={() => setDrawer(false)} />}

      {/* Sidebar */}
      <aside
        className={`print:hidden fixed z-40 inset-y-0 left-0 w-64 bg-sidebar text-white flex flex-col
          transform transition-transform duration-200 md:static md:translate-x-0 md:z-auto
          ${drawer ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center text-sf font-extrabold text-sm shrink-0">
            VS
          </div>
          <div className="min-w-0">
            <div className="text-base font-bold leading-tight">CCE Software</div>
            <div className="text-[10px] text-white/50 leading-tight">आवृत्ती v1.0 | VS Academy</div>
            <div className="text-[10px] text-white/50 leading-tight">mr.Suryawanshi-9403840736</div>
          </div>
          <button className="md:hidden ml-auto text-white/70 text-xl" onClick={() => setDrawer(false)}>✕</button>
        </div>

        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="text-[10px] uppercase tracking-wider text-white/40 px-3 mb-1">मुख्य</div>
          <div className="space-y-1">{NAV_MAIN.map(navItem)}</div>
          <div className="text-[10px] uppercase tracking-wider text-white/40 px-3 mt-4 mb-1">इतर</div>
          <div className="space-y-1">{NAV_OTHER.map(navItem)}</div>
        </nav>

        <button onClick={logout} className="m-3 px-3 py-2 rounded-lg text-sm bg-white/10 hover:bg-white/20">
          बाहेर पडा
        </button>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <header className="print:hidden bg-topbar text-white flex items-center gap-2 px-3 sm:px-5 py-2.5 shadow">
          <button className="md:hidden text-2xl leading-none px-1" onClick={() => setDrawer(true)} aria-label="मेनू">☰</button>
          <div className="w-9 h-9 rounded-full bg-white/15 flex items-center justify-center text-sm font-bold shrink-0">CCE</div>
          <div className="min-w-0">
            <div className="font-bold text-sm sm:text-base truncate max-w-[40vw]">
              {school.name || 'शाळेचे नाव'}
            </div>
            <div className="text-[11px] text-white/70 truncate">माध्यम: {school.med || 'मराठी'} | {year}</div>
          </div>
          <div className="flex items-center gap-2 ml-auto">
            {msg && <span className="hidden sm:inline text-xs text-white/80 whitespace-nowrap">{msg}</span>}
            <button
              onClick={doSync}
              disabled={syncing}
              className="px-3 py-1.5 rounded-full text-xs font-semibold bg-amber-400 text-sf hover:bg-amber-300 disabled:opacity-50 whitespace-nowrap"
              title={online ? 'ऑनलाइन' : 'ऑफलाइन'}
            >
              {syncing ? '…' : '🔄'} <span className="hidden sm:inline">Sync Now</span>
            </button>
            <span className="hidden sm:inline text-xs bg-white/15 px-2.5 py-1 rounded-full whitespace-nowrap">📅 {year}</span>
            <span className="hidden md:inline text-xs bg-white/15 px-2 py-1 rounded-full">EN</span>
            <span className="hidden md:inline text-xs">Admin</span>
            <button onClick={logout} className="text-xs bg-white/15 hover:bg-white/25 px-2.5 py-1 rounded-full whitespace-nowrap">
              बाहेर पडा
            </button>
          </div>
        </header>
        <main className="flex-1 overflow-auto p-4 sm:p-6">{children}</main>
      </div>
    </div>
  )
}
