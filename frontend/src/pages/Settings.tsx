import { useEffect, useState } from 'react'
import { getScalar, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { importLegacyBlob, type ImportResult } from '../lib/importBlob'
import { Field, PageHeader, btnGhost, btnPrimary } from '../components/ui'
import { THEMES, applyTheme, currentTheme } from '../lib/themes'

interface SchoolProfile {
  name?: string
  udise?: string
  address?: string
  dist?: string
  tal?: string
  phone?: string
  prin?: string
  yr?: string
}

export default function Settings() {
  const [school, setSchool] = useState<SchoolProfile>({})
  const [savedProfile, setSavedProfile] = useState(false)

  const [raw, setRaw] = useState('')
  const [importing, setImporting] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [err, setErr] = useState('')
  const [theme, setTheme] = useState(currentTheme())

  function pickTheme(k: string) {
    applyTheme(k)
    setTheme(k)
  }

  async function load() {
    setSchool((await getScalar('school')) || {})
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault()
    await putScalar('school', school)
    setSavedProfile(true)
    setTimeout(() => setSavedProfile(false), 2500)
    syncNow().catch(() => {})
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (f) setRaw(await f.text())
  }

  async function runImport() {
    setErr('')
    setResult(null)
    setImporting(true)
    try {
      const r = await importLegacyBlob(raw)
      setResult(r)
      window.dispatchEvent(new Event('cce-synced'))
    } catch (e: any) {
      setErr(e.message || 'आयात अयशस्वी')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="सेटिंग्ज" />

      {/* Theme */}
      <div className="bg-card border border-bdr rounded-xl p-5 mb-6">
        <h2 className="font-bold text-sf mb-3">🎨 थीम</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {THEMES.map((t) => (
            <button
              key={t.key}
              onClick={() => pickTheme(t.key)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg border text-sm text-left ${
                theme === t.key ? 'border-sf ring-2 ring-sf/30' : 'border-slate-300 hover:border-sf'
              }`}
            >
              <span className="w-6 h-6 rounded-full shrink-0" style={{ background: t.swatch }} />
              <span className="flex-1">{t.label}</span>
              {theme === t.key && <span className="text-sf">✓</span>}
            </button>
          ))}
        </div>
      </div>

      {/* School profile */}
      <form onSubmit={saveProfile} className="bg-card border border-bdr rounded-xl p-5 mb-6">
        <h2 className="font-bold text-sf mb-4">शाळेची माहिती</h2>
        <div className="grid grid-cols-2 gap-x-4">
          <Field label="शाळेचे नाव" value={school.name || ''} onChange={(v) => setSchool({ ...school, name: v })} />
          <Field label="UDISE कोड" value={school.udise || ''} onChange={(v) => setSchool({ ...school, udise: v })} />
          <Field label="मुख्याध्यापक" value={school.prin || ''} onChange={(v) => setSchool({ ...school, prin: v })} />
          <Field label="शैक्षणिक वर्ष" value={school.yr || ''} onChange={(v) => setSchool({ ...school, yr: v })} />
          <Field label="तालुका" value={school.tal || ''} onChange={(v) => setSchool({ ...school, tal: v })} />
          <Field label="जिल्हा" value={school.dist || ''} onChange={(v) => setSchool({ ...school, dist: v })} />
          <Field label="पत्ता" value={school.address || ''} onChange={(v) => setSchool({ ...school, address: v })} />
          <Field label="दूरध्वनी" value={school.phone || ''} onChange={(v) => setSchool({ ...school, phone: v })} />
        </div>
        <button type="submit" className={btnPrimary + ' mt-2'}>
          {savedProfile ? '✓ जतन झाले' : 'जतन करा'}
        </button>
      </form>

      {/* Legacy import */}
      <div className="bg-card border border-bdr rounded-xl p-5">
        <h2 className="font-bold text-sf mb-1">जुना डेटा आयात करा</h2>
        <p className="text-sm text-slate-500 mb-3">
          जुन्या CCE अ‍ॅपमधील संपूर्ण डेटा येथे आयात करा. जुन्या अ‍ॅपमध्ये ब्राउझर console उघडून हे चालवा:
        </p>
        <pre className="bg-slate-900 text-green-300 text-xs rounded-lg p-3 mb-3 overflow-auto">
copy(localStorage.getItem('cce_v76_data'))
        </pre>
        <p className="text-sm text-slate-500 mb-3">
          मग तो मजकूर खाली पेस्ट करा (किंवा .json फाइल निवडा) आणि "आयात करा" दाबा.
        </p>

        <input type="file" accept=".json,application/json" onChange={onFile} className="mb-3 text-sm" />
        <textarea
          value={raw}
          onChange={(e) => setRaw(e.target.value)}
          placeholder='{"school":{...},"students":[...],...}'
          className="w-full h-32 px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-xs font-mono mb-3"
        />

        <button onClick={runImport} disabled={importing || !raw.trim()} className={btnGhost + ' disabled:opacity-50'}>
          {importing ? 'आयात होत आहे…' : '⬆ आयात करा'}
        </button>

        {err && <p className="text-sm text-red-600 mt-3">{err}</p>}
        {result && (
          <div className="mt-3 text-sm text-green-700">
            ✓ एकूण {result.total} नोंदी आयात झाल्या —{' '}
            {Object.entries(result.perPart)
              .map(([k, v]) => `${k}: ${v}`)
              .join(', ')}
          </div>
        )}
      </div>
    </div>
  )
}
