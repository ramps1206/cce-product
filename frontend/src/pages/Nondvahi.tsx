import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart } from '../lib/store'
import { DEFAULT_BANDS, gradeFor } from '../lib/grades'
import { SUBJECTS, TERMS } from '../lib/subjects'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, btnGhost } from '../components/ui'

interface Student {
  roll?: string
  name?: string
  classId?: string
}
interface EvalRec {
  marks?: number
  max?: number
}

/**
 * Splits the stored total marks into standard CCE आकारिक (40%) + संकलित (60%)
 * components. The data model stores a single {marks, max} per subject::term,
 * so आकारिक/संकलित are derived from that एकूण value.
 */
function splitMarks(marks: number) {
  const aakarik = Math.round(marks * 0.4)
  const sankalit = marks - aakarik
  return { aakarik, sankalit, total: marks }
}

export default function Nondvahi() {
  const { rows: classRows } = useCollection<any>('classes')
  const classMap: Record<string, string> = Object.fromEntries(
    classRows.map((c: any) => [c.key, clsName(c.payload)])
  )
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [evals, setEvals] = useState<Record<string, EvalRec>>({})
  const [bands, setBands] = useState(DEFAULT_BANDS)
  const [school, setSchool] = useState<any>({})
  const [cls, setCls] = useState('')
  const [studentKey, setStudentKey] = useState('')

  async function load() {
    setStudents((await listPart('students')) as any)
    setEvals(Object.fromEntries((await listPart('evaluations')).map((r) => [r.key, r.payload || {}])))
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

  const classes = classRows.map((c: any) => c.key) as string[]

  const classStudents = useMemo(
    () =>
      students
        .filter((s) => !cls || s.payload.classId === cls)
        .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0)),
    [students, cls]
  )

  const student = students.find((s) => s.key === studentKey)

  // Only subjects that have any marks (either term) for this student.
  const activeSubjects = useMemo(() => {
    if (!studentKey) return [] as string[]
    return SUBJECTS.filter((sub) =>
      TERMS.some((t) => evals[`${studentKey}::${sub}::${t.k}`]?.marks !== undefined)
    )
  }, [studentKey, evals])

  function termData(sub: string, term: string) {
    const rec = evals[`${studentKey}::${sub}::${term}`]
    if (!rec || rec.marks === undefined) return null
    const marks = rec.marks ?? 0
    const max = rec.max ?? 0
    const pct = max > 0 ? Math.round((marks / max) * 100) : 0
    return { ...splitMarks(marks), pct, grade: gradeFor(pct, bands) }
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="📖 नोंदवही (सातत्यपूर्ण सर्वंकष नोंदपत्र)">
          <button onClick={() => window.print()} className={btnGhost}>
            🖨 प्रिंट
          </button>
        </PageHeader>

        <div className="mb-4 rounded-xl border border-bdr bg-gold/10 px-4 py-3 text-sm text-slate-700">
          📖 विद्यार्थीनिहाय साधनिहाय गुण नोंदवही — सत्र १ व सत्र २ चे सर्व गुण एकाच पानावर
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग</label>
            <select
              value={cls}
              onChange={(e) => {
                setCls(e.target.value)
                setStudentKey('')
              }}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[140px]"
            >
              <option value="">सर्व</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {classMap[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">विद्यार्थी</label>
            <select
              value={studentKey}
              onChange={(e) => setStudentKey(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[200px]"
            >
              <option value="">— विद्यार्थी निवडा —</option>
              {classStudents.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.payload.roll ? `${s.payload.roll}. ` : ''}
                  {s.payload.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {!student && (
        <p className="text-slate-400 text-sm">नोंदवही पाहण्यासाठी वर्ग व विद्यार्थी निवडा.</p>
      )}

      {student && (
        <>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-sf">{school.name || 'शाळा'}</h2>
            <p className="text-sm text-slate-600">
              नोंदवही — {student.payload.name}
              {student.payload.classId && classMap[student.payload.classId]
                ? ` | ${classMap[student.payload.classId]}`
                : ''}
              {student.payload.roll ? ` | हजेरी क्र. ${student.payload.roll}` : ''}
            </p>
          </div>

          <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[820px]">
              <thead className="bg-sf/5 text-sf">
                <tr>
                  <th className="text-left px-3 py-2 align-bottom" rowSpan={2}>
                    विषय
                  </th>
                  <th className="px-3 py-2 text-center border-l border-bdr" colSpan={4}>
                    सत्र १
                  </th>
                  <th className="px-3 py-2 text-center border-l border-bdr" colSpan={4}>
                    सत्र २
                  </th>
                </tr>
                <tr>
                  <th className="px-2 py-1.5 text-center border-l border-bdr font-medium">आकारिक</th>
                  <th className="px-2 py-1.5 text-center font-medium">संकलित</th>
                  <th className="px-2 py-1.5 text-center font-medium">एकूण</th>
                  <th className="px-2 py-1.5 text-center font-medium">श्रेणी</th>
                  <th className="px-2 py-1.5 text-center border-l border-bdr font-medium">आकारिक</th>
                  <th className="px-2 py-1.5 text-center font-medium">संकलित</th>
                  <th className="px-2 py-1.5 text-center font-medium">एकूण</th>
                  <th className="px-2 py-1.5 text-center font-medium">श्रेणी</th>
                </tr>
              </thead>
              <tbody>
                {activeSubjects.length === 0 && (
                  <tr>
                    <td colSpan={9} className="text-center text-slate-400 py-8">
                      या विद्यार्थ्याचे अद्याप गुण नोंदवलेले नाहीत.
                    </td>
                  </tr>
                )}
                {activeSubjects.map((sub) => {
                  const t1 = termData(sub, '1')
                  const t2 = termData(sub, '2')
                  return (
                    <tr key={sub} className="border-t border-bdr">
                      <td className="px-3 py-2 font-medium">{sub}</td>
                      <td className="px-2 py-2 text-center border-l border-bdr">{t1 ? t1.aakarik : '—'}</td>
                      <td className="px-2 py-2 text-center">{t1 ? t1.sankalit : '—'}</td>
                      <td className="px-2 py-2 text-center font-semibold">{t1 ? t1.total : '—'}</td>
                      <td className="px-2 py-2 text-center font-semibold text-sf">{t1 ? t1.grade : '—'}</td>
                      <td className="px-2 py-2 text-center border-l border-bdr">{t2 ? t2.aakarik : '—'}</td>
                      <td className="px-2 py-2 text-center">{t2 ? t2.sankalit : '—'}</td>
                      <td className="px-2 py-2 text-center font-semibold">{t2 ? t2.total : '—'}</td>
                      <td className="px-2 py-2 text-center font-semibold text-sf">{t2 ? t2.grade : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 12mm; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  )
}
