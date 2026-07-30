import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { DEFAULT_BANDS, gradeFor } from '../lib/grades'
import { SUBJECTS, TERMS } from '../lib/subjects'
import { PageHeader, TableCard, Td, Th } from '../components/ui'

interface Student {
  rollNo?: number
  name?: string
  cls?: string
}
interface EvalRec {
  marks?: number
  max?: number
}

const evalKey = (studentKey: string, subject: string, term: string) =>
  `${studentKey}::${subject}::${term}`

export default function Evaluation() {
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [evals, setEvals] = useState<Record<string, EvalRec>>({})
  const [bands, setBands] = useState(DEFAULT_BANDS)

  const [cls, setCls] = useState('')
  const [subject, setSubject] = useState(SUBJECTS[0])
  const [term, setTerm] = useState('1')
  const [max, setMax] = useState(100)

  async function load() {
    setStudents((await listPart('students')) as any)
    const ev = await listPart('evaluations')
    const map: Record<string, EvalRec> = {}
    ev.forEach((e) => (map[e.key] = e.payload || {}))
    setEvals(map)
    const s = (await getScalar('settings')) || {}
    setBands(s.gradeBands?.length ? s.gradeBands : DEFAULT_BANDS)
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const classes = useMemo(
    () => Array.from(new Set(students.map((s) => s.payload.cls).filter(Boolean))) as string[],
    [students]
  )
  const shown = students
    .filter((s) => !cls || s.payload.cls === cls)
    .sort((a, b) => (a.payload.rollNo || 0) - (b.payload.rollNo || 0))

  async function saveMarks(studentKey: string, marks: number) {
    const key = evalKey(studentKey, subject, term)
    const rec = { marks, max }
    setEvals((e) => ({ ...e, [key]: rec }))
    await putItem('evaluations', key, rec)
    syncNow().catch(() => {})
  }

  return (
    <div>
      <PageHeader title="मूल्यमापन" />

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <Select label="वर्ग" value={cls} onChange={setCls} options={[['', 'सर्व'], ...classes.map((c) => [c, c] as [string, string])]} />
        <Select label="विषय" value={subject} onChange={setSubject} options={SUBJECTS.map((s) => [s, s])} />
        <Select label="सत्र" value={term} onChange={setTerm} options={TERMS.map((t) => [t.k, t.label])} />
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">एकूण गुण</label>
          <input
            type="number"
            min={1}
            value={max}
            onChange={(e) => setMax(Number(e.target.value) || 100)}
            className="w-28 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>
      </div>

      <TableCard
        head={
          <>
            <Th>क्र.</Th>
            <Th>नाव</Th>
            <Th>गुण</Th>
            <Th>टक्केवारी</Th>
            <Th>श्रेणी</Th>
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
          const rec = evals[evalKey(s.key, subject, term)]
          const marks = rec?.marks ?? 0
          const m = rec?.max ?? max
          const pct = m > 0 ? Math.round((marks / m) * 100) : 0
          const hasMarks = rec?.marks !== undefined
          return (
            <tr key={s.key} className="border-t border-bdr hover:bg-slate-50">
              <Td>{s.payload.rollNo ?? '—'}</Td>
              <Td className="font-medium">{s.payload.name}</Td>
              <Td>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min={0}
                    max={max}
                    value={hasMarks ? marks : ''}
                    onChange={(e) => saveMarks(s.key, Number(e.target.value) || 0)}
                    className="w-20 px-2 py-1 rounded border border-slate-300 text-sm"
                  />
                  <span className="text-slate-400 text-xs">/ {max}</span>
                </div>
              </Td>
              <Td>{hasMarks ? `${pct}%` : '—'}</Td>
              <Td className="font-semibold text-sf">{hasMarks ? gradeFor(pct, bands) : '—'}</Td>
            </tr>
          )
        })}
      </TableCard>
    </div>
  )
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: [string, string][]
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[120px]"
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
    </div>
  )
}
