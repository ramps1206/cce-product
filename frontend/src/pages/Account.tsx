import { useEffect, useState } from 'react'
import { getScalar } from '../lib/store'
import { useAuth } from '../context/AuthContext'
import { getToken } from '../lib/api'
import { PageHeader, Field, btnPrimary, btnGhost } from '../components/ui'

const PIN_FLAG = 'cce_pin_set'

export default function Account() {
  const { auth } = useAuth()
  const [phone, setPhone] = useState('')

  // Password change form (no backend yet — shows a graceful "coming soon" notice).
  const [showPwd, setShowPwd] = useState(false)
  const [curPwd, setCurPwd] = useState('')
  const [newPwd, setNewPwd] = useState('')
  const [confirmPwd, setConfirmPwd] = useState('')
  const [pwdNotice, setPwdNotice] = useState('')

  // Quick PIN unlock.
  const [pinSet, setPinSet] = useState(localStorage.getItem(PIN_FLAG) === '1')
  const [showPin, setShowPin] = useState(false)
  const [pin, setPin] = useState('')
  const [pinBusy, setPinBusy] = useState(false)
  const [pinMsg, setPinMsg] = useState('')
  const [pinErr, setPinErr] = useState('')

  useEffect(() => {
    let alive = true
    getScalar('school')
      .then((s) => {
        if (alive && s && typeof s.phone === 'string') setPhone(s.phone)
      })
      .catch(() => {})
    return () => {
      alive = false
    }
  }, [])

  function submitPwd(e: React.FormEvent) {
    e.preventDefault()
    setPwdNotice('हे वैशिष्ट्य लवकरच येत आहे 🚧')
  }

  async function submitPin(e: React.FormEvent) {
    e.preventDefault()
    setPinErr('')
    setPinMsg('')
    if (!/^\d{4}$/.test(pin)) {
      setPinErr('कृपया 4-अंकी PIN टाका.')
      return
    }
    setPinBusy(true)
    try {
      const res = await fetch('/api/auth/set-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer ' + getToken(),
        },
        body: JSON.stringify({ pin }),
      })
      if (!res.ok) throw new Error('set-pin failed')
      localStorage.setItem(PIN_FLAG, '1')
      setPinSet(true)
      setShowPin(false)
      setPin('')
      setPinMsg('✅ Quick PIN Unlock सेट झाले.')
    } catch {
      setPinErr('PIN सेट करता आले नाही. पुन्हा प्रयत्न करा.')
    } finally {
      setPinBusy(false)
    }
  }

  function removePin() {
    localStorage.removeItem(PIN_FLAG)
    setPinSet(false)
    setShowPin(false)
    setPin('')
    setPinErr('')
    setPinMsg('Quick PIN Unlock काढले.')
  }

  return (
    <div>
      <PageHeader title="🔐 खाते सुरक्षा (Account Security)" />

      {/* Section 1: Credentials + password change */}
      <div className="bg-card border border-bdr rounded-xl p-5 mb-4 max-w-[520px]">
        <Field label="नोंदणीकृत Email" value={auth?.email ?? ''} onChange={() => {}} />
        <Field label="नोंदणीकृत मोबाईल" value={phone} onChange={() => {}} />

        <p className="text-xs text-slate-500 mt-1 mb-3">
          🔑 पासवर्ड बदलण्यासाठी सध्याचा पासवर्ड आवश्यक असेल.
        </p>

        {!showPwd ? (
          <button
            type="button"
            className={btnPrimary}
            onClick={() => {
              setShowPwd(true)
              setPwdNotice('')
            }}
          >
            🔑 पासवर्ड बदला
          </button>
        ) : (
          <form onSubmit={submitPwd} className="mt-2">
            <Field label="सध्याचा पासवर्ड" type="password" value={curPwd} onChange={setCurPwd} />
            <Field label="नवीन पासवर्ड" type="password" value={newPwd} onChange={setNewPwd} />
            <Field
              label="नवीन पासवर्ड पुन्हा"
              type="password"
              value={confirmPwd}
              onChange={setConfirmPwd}
            />
            {pwdNotice && (
              <p className="text-xs text-amber-600 mb-2">{pwdNotice}</p>
            )}
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary}>
                बदला
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setShowPwd(false)
                  setCurPwd('')
                  setNewPwd('')
                  setConfirmPwd('')
                  setPwdNotice('')
                }}
              >
                रद्द
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Section 2: Quick PIN Unlock */}
      <div className="bg-card border border-bdr rounded-xl p-5 max-w-[520px]">
        <h2 className="text-lg font-bold text-sf mb-2">⚡ Quick PIN Unlock</h2>
        <p className="text-xs text-slate-500 mb-3">
          📌 फक्त याच डिव्हाइसवर काम करते — Email + Password ऐवजी 4-अंकी PIN टाकून पटकन Login करता येईल.
        </p>

        <p className="text-sm font-semibold mb-3">
          {pinSet ? '✅ Quick PIN Unlock सुरू आहे' : 'सेट करा'}
        </p>

        {!showPin ? (
          <div className="flex gap-2">
            <button
              type="button"
              className={btnPrimary}
              onClick={() => {
                setShowPin(true)
                setPin('')
                setPinErr('')
                setPinMsg('')
              }}
            >
              {pinSet ? 'PIN बदला' : 'PIN सेट करा'}
            </button>
            {pinSet && (
              <button type="button" className={btnGhost} onClick={removePin}>
                काढा
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={submitPin} className="mt-1">
            <Field
              label="4-अंकी PIN"
              type="password"
              value={pin}
              onChange={(v) => setPin(v.replace(/\D/g, '').slice(0, 4))}
              placeholder="••••"
            />
            {pinErr && <p className="text-xs text-red-600 mb-2">{pinErr}</p>}
            <div className="flex gap-2">
              <button type="submit" className={btnPrimary} disabled={pinBusy}>
                {pinBusy ? 'सेव करत आहे…' : 'जतन करा'}
              </button>
              <button
                type="button"
                className={btnGhost}
                onClick={() => {
                  setShowPin(false)
                  setPin('')
                  setPinErr('')
                }}
              >
                रद्द
              </button>
            </div>
          </form>
        )}

        {pinMsg && <p className="text-xs text-green-600 mt-3">{pinMsg}</p>}
      </div>
    </div>
  )
}
