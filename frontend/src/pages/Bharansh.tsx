import { useEffect, useMemo, useState } from 'react'
import { listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { STD_NAMES, SUBJECTS } from '../lib/domain'
import { PageHeader, btnPrimary } from '../components/ui'

interface BharanshEntry {
  a: number // आकारिक (formative) max marks
  b: number // संकलित (summative) max marks
}

const DEFAULT_A = 40
const DEFAULT_B = 60

const STDS = Object.keys(STD_NAMES) // '1'..'8'

export default function Bharansh() {
  // Selected इयत्ता.
  const [std, setStd] = useState<string>(STDS[0] ?? '1')
  // Full map: `${std}::${subject}` -> { a, b }
  const [data, setData] = useState<Record<string, BharanshEntry>>({})
  // Local per-row edit buffer for the selected इयत्ता, keyed by subject.
  const [rows, setRows] = useState<Record<string, BharanshEntry>>({})
  const [saved, setSaved] = useState(false)

  async function load() {
    const items = await listPart('bharansh')
    const map: Record<string, BharanshEntry> = {}
    for (const it of items) {
      const p = it.payload as Partial<BharanshEntry> | null
      map[it.key] = {
        a: Number(p?.a) || 0,
        b: Number(p?.b) || 0,
      }
    }
    setData(map)
  }

  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  // Rebuild the edit buffer whenever the selected इयत्ता or stored data changes.
  useEffect(() => {
    const next: Record<string, BharanshEntry> = {}
    for (const subject of SUBJECTS) {
      const existing = data[`${std}::${subject}`]
      next[subject] = existing
        ? { a: existing.a, b: existing.b }
        : { a: DEFAULT_A, b: DEFAULT_B }
    }
    setRows(next)
  }, [std, data])

  function setCell(subject: string, field: keyof BharanshEntry, value: number) {
    setRows((prev) => ({
      ...prev,
      [subject]: { ...(prev[subject] ?? { a: DEFAULT_A, b: DEFAULT_B }), [field]: value },
    }))
  }

  const totals = useMemo(() => {
    let totA = 0
    let totB = 0
    for (const subject of SUBJECTS) {
      const r = rows[subject]
      totA += Number(r?.a) || 0
      totB += Number(r?.b) || 0
    }
    return { totA, totB }
  }, [rows])

  async function save() {
    for (const subject of SUBJECTS) {
      const r = rows[subject] ?? { a: DEFAULT_A, b: DEFAULT_B }
      const entry: BharanshEntry = { a: Number(r.a) || 0, b: Number(r.b) || 0 }
      await putItem('bharansh', `${std}::${subject}`, entry)
    }
    await load()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  return (
    <div>
      <PageHeader title="⚖️ भारांश निश्चिती (विषयनिहाय / इयत्तानिहाय)">
        <button onClick={save} className={btnPrimary}>
          {saved ? '✓ सेव्ह झाले' : '💾 भारांश सेव्ह करा'}
        </button>
      </PageHeader>

      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        ⚠️ भारांश म्हणजे प्रत्येक घटकासाठी कमाल गुण. एकूण <b>आकारिक (अ)</b> = formative +{' '}
        <b>संकलित (ब)</b> = summative = एकूण गुण.
      </div>

      {/* इयत्ता selector */}
      <div className="mb-4 flex flex-wrap gap-2">
        {STDS.map((s) => (
          <button
            key={s}
            onClick={() => setStd(s)}
            className={
              'px-3 py-1.5 rounded-lg text-sm border transition ' +
              (s === std
                ? 'bg-sf text-white border-sf'
                : 'bg-card text-sf border-bdr hover:bg-sf/5')
            }
          >
            {STD_NAMES[s]}
          </button>
        ))}
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-x-auto max-w-2xl">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">विषय</th>
              <th className="text-center font-semibold px-4 py-2.5">आकारिक (अ)</th>
              <th className="text-center font-semibold px-4 py-2.5">संकलित (ब)</th>
              <th className="text-center font-semibold px-4 py-2.5">एकूण</th>
            </tr>
          </thead>
          <tbody>
            {SUBJECTS.map((subject) => {
              const r = rows[subject] ?? { a: DEFAULT_A, b: DEFAULT_B }
              const total = (Number(r.a) || 0) + (Number(r.b) || 0)
              return (
                <tr key={subject} className="border-t border-bdr">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{subject}</td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      value={r.a}
                      onChange={(e) => setCell(subject, 'a', Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-center rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                    />
                  </td>
                  <td className="px-4 py-2 text-center">
                    <input
                      type="number"
                      min={0}
                      value={r.b}
                      onChange={(e) => setCell(subject, 'b', Number(e.target.value) || 0)}
                      className="w-20 px-2 py-1.5 text-center rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                    />
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-sf">{total}</td>
                </tr>
              )
            })}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-bdr bg-sf/5 font-semibold text-sf">
              <td className="px-4 py-2.5">एकूण</td>
              <td className="px-4 py-2.5 text-center">{totals.totA}</td>
              <td className="px-4 py-2.5 text-center">{totals.totB}</td>
              <td className="px-4 py-2.5 text-center">{totals.totA + totals.totB}</td>
            </tr>
          </tfoot>
        </table>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        टीप: <b>आकारिक</b> = formative (सातत्यपूर्ण मूल्यमापन), <b>संकलित</b> = summative (सत्रांत
        मूल्यमापन). डीफॉल्ट भारांश: आकारिक {DEFAULT_A} / संकलित {DEFAULT_B}.
      </div>
    </div>
  )
}
