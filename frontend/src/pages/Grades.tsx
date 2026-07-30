import { useEffect, useState } from 'react'
import { getScalar, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { DEFAULT_BANDS, type Band } from '../lib/grades'
import { PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

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

  function update(i: number, patch: Partial<Band>) {
    setBands((b) => b.map((x, idx) => (idx === i ? { ...x, ...patch } : x)))
  }
  function addBand() {
    setBands((b) => [...b, { grade: '', min: 0 }])
  }
  function removeBand(i: number) {
    setBands((b) => b.filter((_, idx) => idx !== i))
  }

  async function save() {
    const clean = bands.filter((b) => b.grade.trim() !== '').sort((a, b) => b.min - a.min)
    await putScalar('settings', { ...settings, gradeBands: clean })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
    syncNow().catch(() => {})
  }

  return (
    <div>
      <PageHeader title="श्रेणी सेटिंग्ज">
        <button onClick={save} className={btnPrimary}>
          {saved ? '✓ जतन झाले' : 'जतन करा'}
        </button>
      </PageHeader>

      <p className="text-sm text-slate-500 mb-4 max-w-xl">
        टक्केवारीनुसार श्रेणी ठरवण्यासाठी किमान टक्केवारी सेट करा. मूल्यमापनात गुणांवरून श्रेणी आपोआप मिळेल.
      </p>

      <div className="max-w-lg">
        <TableCard
          head={
            <>
              <Th>श्रेणी</Th>
              <Th>किमान %</Th>
              <Th> </Th>
            </>
          }
        >
          {bands.map((b, i) => (
            <tr key={i} className="border-t border-bdr">
              <Td>
                <input
                  value={b.grade}
                  onChange={(e) => update(i, { grade: e.target.value })}
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-sm"
                />
              </Td>
              <Td>
                <input
                  type="number"
                  value={b.min}
                  onChange={(e) => update(i, { min: Number(e.target.value) || 0 })}
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-sm"
                />
              </Td>
              <Td>
                <button onClick={() => removeBand(i)} className="text-red-600 hover:underline">
                  हटवा
                </button>
              </Td>
            </tr>
          ))}
        </TableCard>
        <button onClick={addBand} className="mt-3 text-sf text-sm hover:underline">
          + श्रेणी जोडा
        </button>
      </div>
    </div>
  )
}
