import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { api } from '../lib/api'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [udise, setUdise] = useState('')
  const [err, setErr] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState(false)

  function switchMode(m: 'login' | 'register' | 'forgot') {
    setMode(m)
    setErr('')
    setNotice('')
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setNotice('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else if (mode === 'register') await register(email, password, schoolName, udise || undefined)
      else {
        await api.forgotPassword(email)
        setNotice('जर हा Email नोंदणीकृत असेल, तर रीसेट लिंक पाठवली आहे. कृपया तुमचा Email तपासा (Spam फोल्डरही).')
      }
    } catch (e: any) {
      setErr(e.message || 'त्रुटी')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-gradient-to-br from-[#0D2B3E] via-[#1B5E84] to-[#2196C8]">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-full max-w-[390px] p-7 sm:p-9">
        <div className="text-center mb-6">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-[#1B5E84] to-[#2196C8] flex items-center justify-center text-3xl">
            📘
          </div>
          <h1 className="mt-2 text-xl font-bold text-sf">CCE Software</h1>
          <p className="text-xs text-slate-400">सतत सर्वंकष मूल्यमापन</p>
        </div>

        {mode === 'register' && (
          <>
            <Field label="शाळेचे नाव" value={schoolName} onChange={setSchoolName} required />
            <Field label="UDISE कोड (ऐच्छिक)" value={udise} onChange={setUdise} />
          </>
        )}
        <Field label="ईमेल" type="email" value={email} onChange={setEmail} required />
        {mode !== 'forgot' && (
          <Field label="पासवर्ड" type="password" value={password} onChange={setPassword} required />
        )}

        {mode === 'login' && (
          <div className="-mt-2 mb-3 text-right">
            <button
              type="button"
              className="text-xs text-sf font-semibold hover:underline"
              onClick={() => switchMode('forgot')}
            >
              पासवर्ड विसरलात?
            </button>
          </div>
        )}
        {mode === 'forgot' && (
          <p className="text-xs text-slate-500 mb-3">
            नोंदणीकृत Email टाका — आम्ही पासवर्ड रीसेट करण्यासाठी लिंक पाठवू.
          </p>
        )}

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}
        {notice && <p className="text-sm text-green-600 mb-3">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-sf text-white font-semibold hover:bg-sf/90 disabled:opacity-50"
        >
          {busy ? '…' : mode === 'login' ? 'लॉगिन' : mode === 'register' ? 'नोंदणी करा' : 'रीसेट लिंक पाठवा'}
        </button>

        {mode === 'forgot' ? (
          <p className="text-center text-sm text-slate-500 mt-4">
            <button type="button" className="text-sf font-semibold" onClick={() => switchMode('login')}>
              ← लॉगिनला परत जा
            </button>
          </p>
        ) : (
          <p className="text-center text-sm text-slate-500 mt-4">
            {mode === 'login' ? 'नवीन शाळा?' : 'खाते आहे?'}{' '}
            <button
              type="button"
              className="text-sf font-semibold"
              onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
            >
              {mode === 'login' ? 'नोंदणी करा' : 'लॉगिन'}
            </button>
          </p>
        )}
      </form>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-600 mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
      />
    </div>
  )
}
