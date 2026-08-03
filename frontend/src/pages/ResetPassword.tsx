import { useState } from 'react'
import { api } from '../lib/api'

/**
 * Password-reset landing page. Opened from the emailed link
 * (…/reset?token=XYZ). Lets the user set a new password using that token,
 * then bounces them to the login screen. Rendered in the unauthenticated
 * route tree.
 */
export default function ResetPassword() {
  const token = new URLSearchParams(window.location.search).get('token') || ''
  const [newPwd, setNewPwd] = useState('')
  const [confirm, setConfirm] = useState('')
  const [err, setErr] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    if (!token) {
      setErr('अवैध किंवा गहाळ रीसेट लिंक. कृपया पुन्हा “पासवर्ड विसरलात?” वापरा.')
      return
    }
    if (newPwd.length < 6) {
      setErr('नवीन पासवर्ड किमान 6 अक्षरांचा हवा.')
      return
    }
    if (newPwd !== confirm) {
      setErr('पासवर्ड जुळत नाहीत.')
      return
    }
    setBusy(true)
    try {
      await api.resetPassword(token, newPwd)
      setDone(true)
    } catch (e: any) {
      setErr(
        e?.status === 400
          ? 'ही रीसेट लिंक अवैध आहे किंवा तिची मुदत संपली आहे. कृपया नवीन लिंक मागवा.'
          : e?.message || 'पासवर्ड रीसेट करता आला नाही.'
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-[#0D2B3E] via-[#1B5E84] to-[#2196C8]">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[390px] p-7 sm:p-9">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1B5E84] to-[#2196C8] flex items-center justify-center text-3xl">
            🔑
          </div>
          <h1 className="mt-2 text-xl font-bold text-sf">नवीन पासवर्ड सेट करा</h1>
        </div>

        {done ? (
          <div className="text-center">
            <p className="text-green-600 font-semibold mb-4">✅ पासवर्ड बदलला!</p>
            <a
              href="/login"
              className="inline-block w-full py-2.5 rounded-lg bg-sf text-white font-semibold hover:bg-sf/90"
            >
              लॉगिन करा
            </a>
          </div>
        ) : (
          <form onSubmit={submit}>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">नवीन पासवर्ड</label>
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-600 mb-1.5">नवीन पासवर्ड पुन्हा</label>
              <input
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                required
              />
            </div>

            {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full py-2.5 rounded-lg bg-sf text-white font-semibold hover:bg-sf/90 disabled:opacity-50"
            >
              {busy ? '…' : 'पासवर्ड बदला'}
            </button>
            <p className="text-center text-sm text-slate-500 mt-4">
              <a href="/login" className="text-sf font-semibold">← लॉगिनला परत जा</a>
            </p>
          </form>
        )}
      </div>
    </div>
  )
}
