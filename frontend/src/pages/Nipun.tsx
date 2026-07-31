import { useEffect, useMemo, useState } from 'react'
import { listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, TableCard, Td, Th } from '../components/ui'

interface Student {
  roll?: string
  name?: string
  classId?: string
}
interface NipunRec {
  reading?: string
  math?: string
}

// Foundational Literacy & Numeracy ladders (NIPUN Bharat), highest = निपुण.
const READING = ['सुरुवात', 'अक्षर', 'शब्द', 'वाक्य', 'परिच्छेद', 'गोष्ट']
const MATH = ['सुरुवात', 'संख्याज्ञान', 'बेरीज', 'वजाबाकी', 'गुणाकार', 'भागाकार']

const isNipun = (r?: NipunRec) =>
  !!r && r.reading === READING[READING.length - 1] && r.math === MATH[MATH.length - 1]

export default function Nipun() {
  const { rows: classRows } = useCollection<any>('classes')
  const classMap: Record<string,string> = Object.fromEntries(classRows.map((c: any) => [c.key, clsName(c.payload)]))
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [recs, setRecs] = useState<Record<string, NipunRec>>({})
  const [cls, setCls] = useState('')

  async function load() {
    setStudents((await listPart('students')) as any)
    setRecs(Object.fromEntries((await listPart('nipun')).map((r) => [r.key, r.payload || {}])))
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const classes = classRows.map((c: any) => c.key) as string[]
  const shown = students
    .filter((s) => !cls || s.payload.classId === cls)
    .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0))

  const nipunCount = shown.filter((s) => isNipun(recs[s.key])).length

  async function update(studentKey: string, patch: Partial<NipunRec>) {
    const next = { ...(recs[studentKey] || {}), ...patch }
    setRecs((r) => ({ ...r, [studentKey]: next }))
    await putItem('nipun', studentKey, next)
    syncNow().catch(() => {})
  }

  return (
    <div>
      <PageHeader title="निपुण भारत (पायाभूत साक्षरता व संख्याज्ञान)" />

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग</label>
          <select
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[120px]"
          >
            <option value="">सर्व</option>
            {classes.map((c) => (
              <option key={c} value={c}>{classMap[c]}</option>
            ))}
          </select>
        </div>
        {shown.length > 0 && (
          <div className="text-sm text-slate-600">
            निपुण विद्यार्थी: <span className="font-semibold text-sf">{nipunCount}</span> / {shown.length}
          </div>
        )}
      </div>

      <TableCard
        head={
          <>
            <Th>क्र.</Th>
            <Th>नाव</Th>
            <Th>वाचन स्तर</Th>
            <Th>गणित स्तर</Th>
            <Th>स्थिती</Th>
          </>
        }
      >
        {shown.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center text-slate-400 py-8">
              विद्यार्थी नाहीत
            </td>
          </tr>
        )}
        {shown.map((s) => {
          const rec = recs[s.key] || {}
          const nipun = isNipun(rec)
          return (
            <tr key={s.key} className="border-t border-bdr hover:bg-slate-50">
              <Td>{s.payload.roll ?? '—'}</Td>
              <Td className="font-medium">{s.payload.name}</Td>
              <Td>
                <LevelSelect value={rec.reading} options={READING} onChange={(v) => update(s.key, { reading: v })} />
              </Td>
              <Td>
                <LevelSelect value={rec.math} options={MATH} onChange={(v) => update(s.key, { math: v })} />
              </Td>
              <Td>
                {nipun ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ निपुण</span>
                ) : rec.reading || rec.math ? (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">प्रगतीपथावर</span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                )}
              </Td>
            </tr>
          )
        })}
      </TableCard>
    </div>
  )
}

function LevelSelect({
  value,
  options,
  onChange,
}: {
  value?: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value)}
      className="px-2 py-1 rounded border border-slate-300 text-sm bg-white"
    >
      <option value="">—</option>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  )
}
