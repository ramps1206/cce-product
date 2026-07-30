import { useState } from 'react'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [schoolName, setSchoolName] = useState('')
  const [udise, setUdise] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setErr('')
    setBusy(true)
    try {
      if (mode === 'login') await login(email, password)
      else await register(email, password, schoolName, udise || undefined)
    } catch (e: any) {
      setErr(e.message || 'त्रुटी')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="h-full flex items-center justify-center bg-gradient-to-br from-[#0D2B3E] via-[#1B5E84] to-[#2196C8]">
      <form onSubmit={submit} className="bg-white rounded-2xl shadow-2xl w-[390px] p-9">
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
        <Field label="पासवर्ड" type="password" value={password} onChange={setPassword} required />

        {err && <p className="text-sm text-red-600 mb-3">{err}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-2.5 rounded-lg bg-sf text-white font-semibold hover:bg-sf/90 disabled:opacity-50"
        >
          {busy ? '…' : mode === 'login' ? 'लॉगिन' : 'नोंदणी करा'}
        </button>

        <p className="text-center text-sm text-slate-500 mt-4">
          {mode === 'login' ? 'नवीन शाळा?' : 'खाते आहे?'}{' '}
          <button
            type="button"
            className="text-sf font-semibold"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setErr('')
            }}
          >
            {mode === 'login' ? 'नोंदणी करा' : 'लॉगिन'}
          </button>
        </p>
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
