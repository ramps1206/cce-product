import { useEffect, useState } from 'react'
import { listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { STD_NAMES } from '../lib/domain'
import { PageHeader, btnPrimary } from '../components/ui'

interface Weightage {
  a: number // आकारिक (formative)
  b: number // संकलित (summative)
}

// Government-fixed class-group rows. `stds` = individual इयत्ता keys ('1'..'8') a row covers.
interface GroupRow {
  label: string
  stds: string[]
  a: number
  b: number
}

const GOVT_ROWS: GroupRow[] = [
  { label: 'इयत्ता १ ली व २ री', stds: ['1', '2'], a: 70, b: 30 },
  { label: 'इयत्ता ३ री व ४ थी', stds: ['3', '4'], a: 60, b: 40 },
  { label: 'इयत्ता ५ वी व ६ वी', stds: ['5', '6'], a: 50, b: 50 },
  { label: 'इयत्ता ७ वी', stds: ['7'], a: 40, b: 60 },
  { label: 'इयत्ता ८ वी', stds: ['8'], a: 40, b: 60 },
]

const STDS = Object.keys(STD_NAMES) // '1'..'8'

// Default weightage for an individual इयत्ता, taken from the govt class-group it belongs to.
function defaultFor(std: string): Weightage {
  const row = GOVT_ROWS.find((r) => r.stds.includes(std))
  return row ? { a: row.a, b: row.b } : { a: 40, b: 60 }
}

export default function Bharansh() {
  // Editable per-row weightage buffer, keyed by row label.
  const [rows, setRows] = useState<GroupRow[]>(GOVT_ROWS.map((r) => ({ ...r })))
  // Selected इयत्ता for the "apply / save current" controls.
  const [std, setStd] = useState<string>(STDS[0] ?? '1')
  const [saved, setSaved] = useState(false)

  async function load() {
    const items = await listPart('bharansh')
    const map: Record<string, Weightage> = {}
    for (const it of items) {
      const p = it.payload as Partial<Weightage> | null
      map[it.key] = { a: Number(p?.a) || 0, b: Number(p?.b) || 0 }
    }
    // Prefill each row from stored value of its first covered इयत्ता, else govt default.
    setRows(
      GOVT_ROWS.map((r) => {
        const stored = map[r.stds[0]!]
        return stored ? { ...r, a: stored.a, b: stored.b } : { ...r }
      }),
    )
  }

  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  function setCell(label: string, field: keyof Weightage, value: number) {
    setRows((prev) =>
      prev.map((r) => (r.label === label ? { ...r, [field]: value } : r)),
    )
  }

  // Row whose class-group contains the currently selected इयत्ता.
  function rowForStd(s: string): GroupRow {
    return rows.find((r) => r.stds.includes(s)) ?? { ...GOVT_ROWS[0]!, ...defaultFor(s) }
  }

  async function persist(pairs: { std: string; w: Weightage }[]) {
    for (const { std: s, w } of pairs) {
      await putItem('bharansh', s, { a: Number(w.a) || 0, b: Number(w.b) || 0 })
    }
    await load()
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  // 💾 सेव्ह करा — write only the selected इयत्ता's current edits.
  async function saveCurrent() {
    const row = rowForStd(std)
    await persist([{ std, w: { a: row.a, b: row.b } }])
  }

  // 🔄 सर्व इयत्तांना लागू करा — write every इयत्ता from its class-group row.
  async function applyAll() {
    const pairs: { std: string; w: Weightage }[] = []
    for (const r of rows) {
      for (const s of r.stds) pairs.push({ std: s, w: { a: r.a, b: r.b } })
    }
    await persist(pairs)
  }

  return (
    <div>
      <PageHeader title="⚖️ भारांश निश्चिती - इयत्तानिहाय मानक">
        <button onClick={saveCurrent} className={btnPrimary}>
          {saved ? '✓ सेव्ह झाले' : '💾 सेव्ह करा'}
        </button>
      </PageHeader>

      <div className="mb-4 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm text-amber-800">
        📋 महाराष्ट्र शासन निर्धारित भारांश - इयत्तानिहाय आकारिक व संकलित गुण वितरण
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-x-auto max-w-2xl">
        <table className="w-full text-sm min-w-[480px]">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <th className="text-left font-semibold px-4 py-2.5">इयत्ता</th>
              <th className="text-center font-semibold px-4 py-2.5">आकारिक (अ)</th>
              <th className="text-center font-semibold px-4 py-2.5">संकलित (ब)</th>
              <th className="text-center font-semibold px-4 py-2.5">एकूण</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const total = (Number(r.a) || 0) + (Number(r.b) || 0)
              return (
                <tr key={r.label} className="border-t border-bdr">
                  <td className="px-4 py-2.5 font-medium text-slate-700">{r.label}</td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={r.a}
                        onChange={(e) => setCell(r.label, 'a', Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 text-center rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                      />
                      <span className="text-slate-500 text-xs">गुण</span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={r.b}
                        onChange={(e) => setCell(r.label, 'b', Number(e.target.value) || 0)}
                        className="w-20 px-2 py-1.5 text-center rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
                      />
                      <span className="text-slate-500 text-xs">गुण</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-center font-semibold text-sf">{total} गुण</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* इयत्ता selector + apply/save controls */}
      <div className="mt-5 flex flex-wrap items-end gap-3">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">इयत्ता निवडा</label>
          <select
            value={std}
            onChange={(e) => setStd(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
          >
            {STDS.map((s) => (
              <option key={s} value={s}>
                {STD_NAMES[s]}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={applyAll}
          className="px-3 py-2 rounded-lg text-sm border border-sf text-sf hover:bg-sf/5"
        >
          🔄 सर्व इयत्तांना लागू करा
        </button>

        <button onClick={saveCurrent} className={btnPrimary}>
          {saved ? '✓ सेव्ह झाले' : '💾 सेव्ह करा'}
        </button>
      </div>

      <div className="mt-3 text-xs text-slate-500">
        टीप: <b>आकारिक (अ)</b> = सातत्यपूर्ण मूल्यमापन, <b>संकलित (ब)</b> = सत्रांत मूल्यमापन.
        भारांश महाराष्ट्र शासनाने इयत्तानिहाय निर्धारित केला आहे.
      </div>
    </div>
  )
}
