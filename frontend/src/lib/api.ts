const TOKEN_KEY = 'cce_token'

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}
export function setToken(t: string | null) {
  if (t) localStorage.setItem(TOKEN_KEY, t)
  else localStorage.removeItem(TOKEN_KEY)
}

/** Stable per-device id (mirrors the original cce_device_id). */
export function deviceId(): string {
  let id = localStorage.getItem('cce_device_id')
  if (!id) {
    id = 'web-' + Math.random().toString(36).slice(2, 10)
    localStorage.setItem('cce_device_id', id)
  }
  return id
}

async function req(path: string, opts: RequestInit = {}): Promise<any> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((opts.headers as Record<string, string>) || {}),
  }
  const tok = getToken()
  if (tok) headers['Authorization'] = 'Bearer ' + tok

  const res = await fetch(path, { ...opts, headers })
  if (!res.ok) {
    let msg = res.statusText
    try {
      const j = await res.json()
      msg = j.message || j.error || msg
    } catch {
      /* ignore */
    }
    throw new ApiError(res.status, msg)
  }
  const txt = await res.text()
  return txt ? JSON.parse(txt) : null
}

export interface AuthResponse {
  token: string
  userId: string
  email: string
  schoolId: string
  role: string
  tier: string
  status: string
  trialDaysLeft: number
}

export interface SyncItem {
  part: string
  key: string
  payload: any
  updatedAt: string
  deleted: boolean
}

export const api = {
  register: (b: {
    email: string
    password: string
    schoolName: string
    udise?: string
  }): Promise<AuthResponse> =>
    req('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ ...b, deviceId: deviceId(), platform: 'both' }),
    }),

  login: (b: { email: string; password: string }): Promise<AuthResponse> =>
    req('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...b, deviceId: deviceId(), platform: 'both' }),
    }),

  me: () => req('/api/auth/me'),

  updateEmail: (b: { newEmail: string; password: string }): Promise<AuthResponse> =>
    req('/api/auth/update-email', { method: 'POST', body: JSON.stringify(b) }),

  updatePassword: (b: { currentPassword: string; newPassword: string }): Promise<null> =>
    req('/api/auth/update-password', { method: 'POST', body: JSON.stringify(b) }),

  forgotPassword: (email: string): Promise<null> =>
    req('/api/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),

  resetPassword: (token: string, newPassword: string): Promise<null> =>
    req('/api/auth/reset-password', { method: 'POST', body: JSON.stringify({ token, newPassword }) }),

  pull: (since?: string): Promise<{ serverTime: string; items: SyncItem[] }> =>
    req('/api/sync/pull' + (since ? `?since=${encodeURIComponent(since)}` : '')),

  push: (
    items: SyncItem[]
  ): Promise<{ serverTime: string; applied: number; rejected: number }> =>
    req('/api/sync/push', { method: 'POST', body: JSON.stringify({ items }) }),

  /** Download an export with the auth header, then trigger a browser save. */
  async downloadStudents(classId?: string) {
    const path = '/api/export/students.xlsx' + (classId ? `?classId=${encodeURIComponent(classId)}` : '')
    const res = await fetch(path, { headers: { Authorization: 'Bearer ' + getToken() } })
    if (!res.ok) throw new ApiError(res.status, 'export failed')
    const blob = await res.blob()
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = classId ? `students-${classId}.xlsx` : 'students-all.xlsx'
    a.click()
    URL.revokeObjectURL(url)
  },
}
