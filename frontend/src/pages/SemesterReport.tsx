import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart } from '../lib/store'
import { DEFAULT_BANDS, gradeFor } from '../lib/grades'
import { SUBJECTS, TERMS } from '../lib/subjects'
import { PageHeader, btnGhost } from '../components/ui'

interface Student {
  rollNo?: number
  name?: string
  cls?: string
}

export default function SemesterReport() {
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [evals, setEvals] = useState<Record<string, any>>({})
  const [bands, setBands] = useState(DEFAULT_BANDS)
  const [school, setSchool] = useState<any>({})
  const [cls, setCls] = useState('')
  const [term, setTerm] = useState('1')

  async function load() {
    setStudents((await listPart('students')) as any)
    setEvals(Object.fromEntries((await listPart('evaluations')).map((r) => [r.key, r.payload])))
    setSchool((await getScalar('school')) || {})
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
  const rows = students
    .filter((s) => !cls || s.payload.cls === cls)
    .sort((a, b) => (a.payload.rollNo || 0) - (b.payload.rollNo || 0))

  // Only show subjects that have any marks for this class+term (keeps table tight).
  const activeSubjects = SUBJECTS.filter((sub) =>
    rows.some((s) => evals[`${s.key}::${sub}::${term}`]?.marks !== undefined)
  )

  function gradeCell(studentKey: string, sub: string) {
    const rec = evals[`${studentKey}::${sub}::${term}`]
    if (!rec || rec.marks === undefined) return '—'
    const pct = rec.max > 0 ? Math.round((rec.marks / rec.max) * 100) : 0
    return gradeFor(pct, bands)
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="सत्र अहवाल">
          <button onClick={() => window.print()} className={btnGhost}>
            🖨 प्रिंट
          </button>
        </PageHeader>
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
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">सत्र</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              {TERMS.map((t) => (
                <option key={t.k} value={t.k}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="hidden print:block text-center mb-3">
        <h2 className="text-lg font-bold">{school.name || 'शाळा'}</h2>
        <p className="text-sm">
          सत्र अहवाल — {TERMS.find((t) => t.k === term)?.label} {cls && `| इयत्ता ${cls}`}
        </p>
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-auto">
        <table className="w-full text-sm">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <th className="text-left px-3 py-2">क्र.</th>
              <th className="text-left px-3 py-2">नाव</th>
              {activeSubjects.map((s) => (
                <th key={s} className="px-3 py-2">
                  {s}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={2 + activeSubjects.length} className="text-center text-slate-400 py-8">
                  विद्यार्थी नाहीत
                </td>
              </tr>
            )}
            {rows.map((s) => (
              <tr key={s.key} className="border-t border-bdr">
                <td className="px-3 py-2">{s.payload.rollNo ?? '—'}</td>
                <td className="px-3 py-2 font-medium">{s.payload.name}</td>
                {activeSubjects.map((sub) => (
                  <td key={sub} className="px-3 py-2 text-center font-semibold text-sf">
                    {gradeCell(s.key, sub)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {activeSubjects.length === 0 && rows.length > 0 && (
        <p className="text-slate-400 mt-3 text-sm">या सत्रासाठी अद्याप गुण नोंदवलेले नाहीत.</p>
      )}
    </div>
  )
}
