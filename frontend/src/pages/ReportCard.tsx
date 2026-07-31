import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { DEFAULT_BANDS, gradeFor } from '../lib/grades'
import { SUBJECTS, TERMS } from '../lib/subjects'
import { PageHeader, btnGhost } from '../components/ui'

interface Student {
  rollNo?: number
  name?: string
  cls?: string
}

const MONTH_KEYS = ['jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'jan', 'feb', 'mar', 'apr', 'may']

export default function ReportCard() {
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [evals, setEvals] = useState<Record<string, any>>({})
  const [att, setAtt] = useState<Record<string, any>>({})
  const [working, setWorking] = useState<Record<string, number>>({})
  const [notes, setNotes] = useState<Record<string, any>>({})
  const [bands, setBands] = useState(DEFAULT_BANDS)
  const [school, setSchool] = useState<any>({})

  const [cls, setCls] = useState('')
  const [studentKey, setStudentKey] = useState('')
  const [remark, setRemark] = useState('')

  async function load() {
    setStudents((await listPart('students')) as any)
    const toMap = (arr: { key: string; payload: any }[]) =>
      Object.fromEntries(arr.map((r) => [r.key, r.payload]))
    setEvals(toMap(await listPart('evaluations')))
    setAtt(toMap(await listPart('attendance')))
    setNotes(toMap(await listPart('descriptiveNotes')))
    setWorking((await getScalar('workingDays')) || {})
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
  const classStudents = students
    .filter((s) => !cls || s.payload.cls === cls)
    .sort((a, b) => (a.payload.rollNo || 0) - (b.payload.rollNo || 0))
  const student = students.find((s) => s.key === studentKey)

  useEffect(() => {
    setRemark(notes[`${studentKey}::report`]?.text || '')
  }, [studentKey, notes])

  // Attendance rollup
  let present = 0
  let totalWorking = 0
  for (const m of MONTH_KEYS) {
    totalWorking += Number(working[m]) || 0
    present += Number(att[`${studentKey}::${m}`]?.present) || 0
  }
  const attPct = totalWorking > 0 ? Math.round((present / totalWorking) * 100) : 0

  // Only subjects with any marks for this student
  const subjectRows = SUBJECTS.map((sub) => {
    const cells = TERMS.map((t) => {
      const rec = evals[`${studentKey}::${sub}::${t.k}`]
      if (!rec || rec.marks === undefined) return null
      const pct = rec.max > 0 ? Math.round((rec.marks / rec.max) * 100) : 0
      return { marks: rec.marks, max: rec.max, pct, grade: gradeFor(pct, bands) }
    })
    return { sub, cells }
  }).filter((r) => r.cells.some(Boolean))

  async function saveRemark() {
    await putItem('descriptiveNotes', `${studentKey}::report`, { text: remark })
    syncNow().catch(() => {})
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="निकालपत्रक">
          {student && (
            <button onClick={() => window.print()} className={btnGhost}>
              🖨 प्रिंट
            </button>
          )}
        </PageHeader>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग</label>
            <select
              value={cls}
              onChange={(e) => {
                setCls(e.target.value)
                setStudentKey('')
              }}
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
            <label className="block text-xs font-semibold text-slate-600 mb-1">विद्यार्थी</label>
            <select
              value={studentKey}
              onChange={(e) => setStudentKey(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[180px]"
            >
              <option value="">— निवडा —</option>
              {classStudents.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.payload.rollNo ? s.payload.rollNo + '. ' : ''}
                  {s.payload.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!student ? (
        <p className="text-slate-400">निकालपत्रक पाहण्यासाठी विद्यार्थी निवडा.</p>
      ) : (
        <div className="bg-card border border-bdr rounded-xl p-6 max-w-3xl">
          <div className="text-center border-b border-bdr pb-3 mb-4">
            <h2 className="text-lg font-bold text-sf">{school.name || 'शाळा'}</h2>
            <p className="text-sm text-slate-500">
              निकालपत्रक — {school.yr || ''} {cls && `| इयत्ता ${cls}`}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm mb-5">
            <div>
              <span className="text-slate-500">नाव: </span>
              <span className="font-medium">{student.payload.name}</span>
            </div>
            <div>
              <span className="text-slate-500">हजेरी क्रमांक: </span>
              <span className="font-medium">{student.payload.rollNo ?? '—'}</span>
            </div>
          </div>

          <div className="overflow-x-auto mb-5">
          <table className="w-full text-sm border border-bdr min-w-[440px]">
            <thead className="bg-sf/5 text-sf">
              <tr>
                <th className="text-left px-3 py-2 border-b border-bdr">विषय</th>
                {TERMS.map((t) => (
                  <th key={t.k} className="px-3 py-2 border-b border-bdr" colSpan={2}>
                    {t.label}
                  </th>
                ))}
              </tr>
              <tr className="text-xs">
                <th className="px-3 py-1 border-b border-bdr"></th>
                {TERMS.map((t) => (
                  <>
                    <th key={t.k + 'g'} className="px-3 py-1 border-b border-bdr">
                      गुण
                    </th>
                    <th key={t.k + 's'} className="px-3 py-1 border-b border-bdr">
                      श्रेणी
                    </th>
                  </>
                ))}
              </tr>
            </thead>
            <tbody>
              {subjectRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-slate-400 py-6">
                    या विद्यार्थ्यासाठी गुण नोंदवलेले नाहीत
                  </td>
                </tr>
              )}
              {subjectRows.map((r) => (
                <tr key={r.sub} className="border-b border-bdr">
                  <td className="px-3 py-2 font-medium">{r.sub}</td>
                  {r.cells.map((c, i) => (
                    <>
                      <td key={i + 'm'} className="px-3 py-2 text-center">
                        {c ? `${c.marks}/${c.max}` : '—'}
                      </td>
                      <td key={i + 'g'} className="px-3 py-2 text-center font-semibold text-sf">
                        {c ? c.grade : '—'}
                      </td>
                    </>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          </div>

          <div className="text-sm mb-4">
            <span className="text-slate-500">एकूण हजेरी: </span>
            <span className="font-medium">
              {present}/{totalWorking} ({attPct}%)
            </span>
          </div>

          <div className="mb-2">
            <label className="block text-xs font-semibold text-slate-600 mb-1">शेरा</label>
            <textarea
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              onBlur={saveRemark}
              rows={2}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm print:border-0"
              placeholder="वर्गशिक्षकाचा शेरा…"
            />
          </div>
        </div>
      )}
    </div>
  )
}
