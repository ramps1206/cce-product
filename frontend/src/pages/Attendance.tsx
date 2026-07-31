import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart, putItem, putScalar } from '../lib/store'
import { syncNow } from '../lib/sync'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, TableCard, Td, Th } from '../components/ui'

const MONTHS = [
  { k: 'jun', label: 'जून' },
  { k: 'jul', label: 'जुलै' },
  { k: 'aug', label: 'ऑगस्ट' },
  { k: 'sep', label: 'सप्टेंबर' },
  { k: 'oct', label: 'ऑक्टोबर' },
  { k: 'nov', label: 'नोव्हेंबर' },
  { k: 'dec', label: 'डिसेंबर' },
  { k: 'jan', label: 'जानेवारी' },
  { k: 'feb', label: 'फेब्रुवारी' },
  { k: 'mar', label: 'मार्च' },
  { k: 'apr', label: 'एप्रिल' },
  { k: 'may', label: 'मे' },
]

interface Student {
  roll?: string
  name?: string
  classId?: string
}

export default function Attendance() {
  const { rows: classRows } = useCollection<any>('classes')
  const classMap: Record<string,string> = Object.fromEntries(classRows.map((c: any) => [c.key, clsName(c.payload)]))
  const [month, setMonth] = useState('jun')
  const [cls, setCls] = useState('')
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [working, setWorking] = useState<Record<string, number>>({})
  const [present, setPresent] = useState<Record<string, number>>({}) // key = `${studentKey}::${month}`

  async function load() {
    setStudents((await listPart('students')) as any)
    setWorking((await getScalar('workingDays')) || {})
    const att = await listPart('attendance')
    const map: Record<string, number> = {}
    att.forEach((a) => (map[a.key] = a.payload?.present ?? 0))
    setPresent(map)
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

  const wd = working[month] || 0

  async function saveWorking(v: number) {
    const next = { ...working, [month]: v }
    setWorking(next)
    await putScalar('workingDays', next)
    syncNow().catch(() => {})
  }

  async function savePresent(studentKey: string, v: number) {
    const key = `${studentKey}::${month}`
    setPresent((p) => ({ ...p, [key]: v }))
    await putItem('attendance', key, { present: v })
    syncNow().catch(() => {})
  }

  return (
    <div>
      <PageHeader title="हजेरी" />

      <div className="flex flex-wrap items-end gap-4 mb-5">
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">महिना</label>
          <select
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          >
            {MONTHS.map((m) => (
              <option key={m.k} value={m.k}>
                {m.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग</label>
          <select
            value={cls}
            onChange={(e) => setCls(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          >
            <option value="">सर्व</option>
            {classes.map((c) => (
              <option key={c} value={c}>{classMap[c]}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">कामकाजाचे दिवस</label>
          <input
            type="number"
            min={0}
            value={wd || ''}
            onChange={(e) => saveWorking(Number(e.target.value) || 0)}
            className="w-28 px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>
      </div>

      <TableCard
        head={
          <>
            <Th>क्र.</Th>
            <Th>नाव</Th>
            <Th>उपस्थित दिवस</Th>
            <Th>टक्केवारी</Th>
          </>
        }
      >
        {shown.length === 0 && (
          <tr>
            <td colSpan={4} className="text-center text-slate-400 py-8">
              विद्यार्थी नाहीत
            </td>
          </tr>
        )}
        {shown.map((s) => {
          const p = present[`${s.key}::${month}`] ?? 0
          const pct = wd > 0 ? Math.round((p / wd) * 100) : 0
          return (
            <tr key={s.key} className="border-t border-bdr hover:bg-slate-50">
              <Td>{s.payload.roll ?? '—'}</Td>
              <Td className="font-medium">{s.payload.name}</Td>
              <Td>
                <input
                  type="number"
                  min={0}
                  max={wd || undefined}
                  value={p || ''}
                  onChange={(e) => savePresent(s.key, Number(e.target.value) || 0)}
                  className="w-24 px-2 py-1 rounded border border-slate-300 text-sm"
                />
              </Td>
              <Td className={pct >= 75 ? 'text-green-700' : pct > 0 ? 'text-amber-700' : 'text-slate-400'}>
                {pct}%
              </Td>
            </tr>
          )
        })}
      </TableCard>
    </div>
  )
}
