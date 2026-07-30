import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { api, setToken, type AuthResponse } from '../lib/api'
import { resetLocal, syncNow } from '../lib/sync'

interface AuthState {
  email: string
  schoolId: string
  role: string
  tier: string
  status: string
  trialDaysLeft: number
}

interface AuthCtx {
  auth: AuthState | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (email: string, password: string, schoolName: string, udise?: string) => Promise<void>
  logout: () => Promise<void>
}

const Ctx = createContext<AuthCtx>(null as any)
const AUTH_KEY = 'cce_auth'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_KEY)
    if (raw) {
      setAuth(JSON.parse(raw))
      // Best-effort background sync on load.
      syncNow().catch(() => {})
    }
    setLoading(false)
  }, [])

  function persist(r: AuthResponse) {
    setToken(r.token)
    const state: AuthState = {
      email: r.email,
      schoolId: r.schoolId,
      role: r.role,
      tier: r.tier,
      status: r.status,
      trialDaysLeft: r.trialDaysLeft,
    }
    localStorage.setItem(AUTH_KEY, JSON.stringify(state))
    setAuth(state)
  }

  async function login(email: string, password: string) {
    const r = await api.login({ email, password })
    persist(r)
    syncNow().catch(() => {})
  }

  async function register(email: string, password: string, schoolName: string, udise?: string) {
    const r = await api.register({ email, password, schoolName, udise })
    persist(r)
  }

  async function logout() {
    setToken(null)
    localStorage.removeItem(AUTH_KEY)
    await resetLocal()
    setAuth(null)
  }

  return <Ctx.Provider value={{ auth, loading, login, register, logout }}>{children}</Ctx.Provider>
}

export const useAuth = () => useContext(Ctx)
