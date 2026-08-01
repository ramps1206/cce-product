import { useEffect, useState } from 'react'
import { getScalar, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { DEFAULT_BANDS, MEANINGS, type Band } from '../lib/grades'
import { PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

/** श्रेणी chip colors matching the original app. */
function chipClass(grade: string): string {
  switch (grade) {
    case 'A+':
    case 'A':
      return 'bg-green-100 text-green-800'
    case 'B+':
    case 'B':
      return 'bg-blue-100 text-blue-800'
    case 'C+':
    case 'C':
      return 'bg-amber-100 text-amber-800'
    case 'D':
      return 'bg-orange-100 text-orange-800'
    case 'E1':
    case 'E2':
      return 'bg-red-100 text-red-800'
    default:
      return 'bg-slate-100 text-slate-700'
  }
}

/** Compute "min-max%" range from consecutive band mins (sorted desc). */
function rangeFor(sorted: Band[], i: number): string {
  const min = sorted[i].min
  const max = i === 0 ? 100 : sorted[i - 1].min - 1
  return `${min}-${max}%`
}

export default function Grades() {
  const [bands, setBands] = useState<Band[]>(DEFAULT_BANDS)
  const [settings, setSettings] = useState<any>({})
  const [saved, setSaved] = useState(false)

  async function load() {
    const s = (await getScalar('settings')) || {}
    setSettings(s)
    setBands(s.gradeBands?.length ? s.gradeBands : DEFAULT_BANDS)
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  function updateMin(grade: string, min: number) {
    setBands((b) => b.map((x) => (x.grade === grade ? { ...x, min } : x)))
  }

  async function save() {
    const clean = [...bands].sort((a, b) => b.min - a.min)
    await putScalar('settings', { ...settings, gradeBands: clean })
    setSettings((s: any) => ({ ...s, gradeBands: clean }))
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  const sorted = [...bands].sort((a, b) => b.min - a.min)

  return (
    <div>
      <PageHeader title="📊 श्रेणी सारणी">
        <button onClick={save} className={btnPrimary}>
          {saved ? '✓ जतन झाले' : 'जतन करा'}
        </button>
      </PageHeader>

      <p className="text-sm text-slate-500 mb-4 max-w-xl">
        टक्केवारीनुसार श्रेणी ठरवली जाते. प्रत्येक श्रेणीची किमान टक्केवारी खाली संपादित करता येते.
      </p>

      <div className="max-w-2xl">
        <TableCard
          head={
            <>
              <Th>श्रेणी</Th>
              <Th>टक्केवारी</Th>
              <Th>अर्थ</Th>
            </>
          }
        >
          {sorted.map((b, i) => (
            <tr key={b.grade} className="border-t border-bdr">
              <Td>
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-full text-sm font-semibold ${chipClass(
                    b.grade
                  )}`}
                >
                  {b.grade}
                </span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-slate-600 w-20">{rangeFor(sorted, i)}</span>
                  <input
                    type="number"
                    value={b.min}
                    onChange={(e) => updateMin(b.grade, Number(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded border border-slate-300 text-sm"
                  />
                </div>
              </Td>
              <Td>{MEANINGS[b.grade] || '-'}</Td>
            </tr>
          ))}
        </TableCard>
      </div>
    </div>
  )
}
