import { useEffect, useState } from 'react'
import { getScalar, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { PageHeader, btnPrimary } from '../components/ui'

const MONTHS = [
  ['jun', 'जून'], ['jul', 'जुलै'], ['aug', 'ऑगस्ट'], ['sep', 'सप्टेंबर'], ['oct', 'ऑक्टोबर'], ['nov', 'नोव्हेंबर'],
  ['dec', 'डिसेंबर'], ['jan', 'जानेवारी'], ['feb', 'फेब्रुवारी'], ['mar', 'मार्च'], ['apr', 'एप्रिल'], ['may', 'मे'],
]

export default function WorkingDays() {
  const [wd, setWd] = useState<Record<string, number>>({})
  const [saved, setSaved] = useState(false)

  async function load() { setWd((await getScalar('workingDays')) || {}) }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const total = MONTHS.reduce((s, [k]) => s + (Number(wd[k]) || 0), 0)

  async function save() {
    await putScalar('workingDays', wd)
    setSaved(true); setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
  }

  return (
    <div>
      <PageHeader title="📅 कामाचे दिवस">
        <button onClick={save} className={btnPrimary}>{saved ? '✓ सेव्ह झाले' : '💾 सेव्ह करा'}</button>
      </PageHeader>
      <div className="bg-card border border-bdr rounded-2xl p-5 max-w-2xl">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {MONTHS.map(([k, label]) => (
            <div key={k}>
              <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
              <input type="number" min={0} value={wd[k] || ''} onChange={(e) => setWd({ ...wd, [k]: Number(e.target.value) || 0 })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm" />
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm font-semibold text-sf">एकूण कामाचे दिवस: {total}</div>
      </div>
    </div>
  )
}
