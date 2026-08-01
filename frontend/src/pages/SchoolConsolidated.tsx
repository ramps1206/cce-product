import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart } from '../lib/store'
import { DEFAULT_BANDS, gradeFor } from '../lib/grades'
import { SUBJECTS, TERMS } from '../lib/subjects'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, btnGhost, btnPrimary } from '../components/ui'

interface Student {
  roll?: string
  name?: string
  classId?: string
}
interface EvalRec {
  marks?: number
  max?: number
}

const GRADE_ORDER = ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'E1', 'E2']

type TermSel = 'annual' | '1' | '2'
type ViewSel = 'summary' | 'detail'

export default function SchoolConsolidated() {
  const { rows: classRows } = useCollection<any>('classes')
  const classMap: Record<string, string> = Object.fromEntries(
    classRows.map((c: any) => [c.key, clsName(c.payload)])
  )
  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [evals, setEvals] = useState<Record<string, EvalRec>>({})
  const [bands, setBands] = useState(DEFAULT_BANDS)
  const [school, setSchool] = useState<any>({})

  const [term, setTerm] = useState<TermSel>('annual')
  const [clsFilter, setClsFilter] = useState('')
  const [view, setView] = useState<ViewSel>('summary')
  const [generated, setGenerated] = useState(false)
  const [snapshot, setSnapshot] = useState<{ term: TermSel; clsFilter: string; view: ViewSel } | null>(null)

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

  /** Subject % for a student in a single term (undefined if no marks). */
  function subjPct(studentKey: string, sub: string, t: string): number | undefined {
    const rec = evals[`${studentKey}::${sub}::${t}`]
    if (!rec || rec.marks === undefined) return undefined
    const max = rec.max ?? 0
    return max > 0 ? (rec.marks / max) * 100 : 0
  }

  /** Overall % across a student's subjects for the chosen term selection. */
  function overallPct(studentKey: string, sel: TermSel): number | undefined {
    const terms = sel === 'annual' ? TERMS.map((t) => t.k) : [sel]
    const subjectAvgs: number[] = []
    for (const sub of SUBJECTS) {
      const parts: number[] = []
      for (const t of terms) {
        const p = subjPct(studentKey, sub, t)
        if (p !== undefined) parts.push(p)
      }
      if (parts.length) subjectAvgs.push(parts.reduce((a, b) => a + b, 0) / parts.length)
    }
    if (!subjectAvgs.length) return undefined
    return subjectAvgs.reduce((a, b) => a + b, 0) / subjectAvgs.length
  }

  // Rows are computed against the snapshot taken at generate time.
  const report = useMemo(() => {
    if (!snapshot) return null
    const { term: selTerm, clsFilter: selCls } = snapshot
    const perClass = classes
      .filter((c) => !selCls || c === selCls)
      .map((cKey) => {
        const clsStudents = students.filter((s) => s.payload.classId === cKey)
        const rows = clsStudents
          .map((s) => ({ student: s, pct: overallPct(s.key, selTerm) }))
          .filter((r) => r.pct !== undefined)
          .map((r) => ({
            student: r.student,
            pct: r.pct as number,
            grade: gradeFor(r.pct as number, bands),
          }))
          .sort((a, b) => b.pct - a.pct)
        const dist: Record<string, number> = {}
        GRADE_ORDER.forEach((g) => (dist[g] = 0))
        rows.forEach((r) => {
          dist[r.grade] = (dist[r.grade] || 0) + 1
        })
        const avg = rows.length ? rows.reduce((a, b) => a + b.pct, 0) / rows.length : 0
        return { cKey, rows, dist, avg, count: rows.length }
      })
      .filter((c) => c.count > 0)

    const totalCount = perClass.reduce((a, c) => a + c.count, 0)
    const schoolAvg = totalCount
      ? perClass.reduce((a, c) => a + c.avg * c.count, 0) / totalCount
      : 0
    const totalDist: Record<string, number> = {}
    GRADE_ORDER.forEach((g) => (totalDist[g] = 0))
    perClass.forEach((c) => GRADE_ORDER.forEach((g) => (totalDist[g] += c.dist[g])))

    return { perClass, totalCount, schoolAvg, totalDist }
  }, [snapshot, students, evals, bands, classes])

  function generate() {
    setSnapshot({ term, clsFilter, view })
    setGenerated(true)
  }

  const termLabel = (t: TermSel) =>
    t === 'annual' ? 'वार्षिक' : TERMS.find((x) => x.k === t)?.label || t

  function exportCsv() {
    if (!report || !snapshot) return
    const lines: string[] = []
    if (snapshot.view === 'summary') {
      lines.push(['वर्ग', 'विद्यार्थी', 'सरासरी %', ...GRADE_ORDER].join(','))
      report.perClass.forEach((c) => {
        lines.push(
          [classMap[c.cKey] || c.cKey, c.count, c.avg.toFixed(1), ...GRADE_ORDER.map((g) => c.dist[g])].join(',')
        )
      })
      lines.push(
        ['एकूण (शाळा)', report.totalCount, report.schoolAvg.toFixed(1), ...GRADE_ORDER.map((g) => report.totalDist[g])].join(',')
      )
    } else {
      lines.push(['वर्ग', 'हजेरी क्र.', 'नाव', 'एकूण %', 'श्रेणी'].join(','))
      report.perClass.forEach((c) => {
        c.rows.forEach((r) => {
          lines.push(
            [
              classMap[c.cKey] || c.cKey,
              r.student.payload.roll ?? '',
              `"${(r.student.payload.name || '').replace(/"/g, '""')}"`,
              r.pct.toFixed(1),
              r.grade,
            ].join(',')
          )
        })
      })
    }
    const blob = new Blob(['﻿' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `shala-nikal-${termLabel(snapshot.term)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="🏆 शाळा एकत्रित निकाल">
          <button onClick={exportCsv} className={btnGhost} disabled={!generated}>
            ⬇ Excel
          </button>
          <button onClick={() => window.print()} className={btnGhost} disabled={!generated}>
            🖨 प्रिंट
          </button>
        </PageHeader>

        <div className="flex flex-wrap items-end gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">सत्र निवडा</label>
            <select
              value={term}
              onChange={(e) => setTerm(e.target.value as TermSel)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[130px]"
            >
              <option value="annual">वार्षिक</option>
              <option value="1">सत्र १</option>
              <option value="2">सत्र २</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">इयत्ता फिल्टर</label>
            <select
              value={clsFilter}
              onChange={(e) => setClsFilter(e.target.value)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[150px]"
            >
              <option value="">सर्व इयत्ता</option>
              {classes.map((c) => (
                <option key={c} value={c}>
                  {classMap[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">दृश्य प्रकार</label>
            <select
              value={view}
              onChange={(e) => setView(e.target.value as ViewSel)}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[170px]"
            >
              <option value="summary">सारांश (वर्गनिहाय)</option>
              <option value="detail">तपशील</option>
            </select>
          </div>
          <button onClick={generate} className={btnPrimary}>
            🔎 निकाल तयार करा
          </button>
        </div>
      </div>

      {!generated && (
        <p className="text-slate-400 text-sm">
          सत्र, इयत्ता व दृश्य प्रकार निवडून “निकाल तयार करा” वर क्लिक करा.
        </p>
      )}

      {generated && report && snapshot && (
        <>
          <div className="text-center mb-4">
            <h2 className="text-lg font-bold text-sf">{school.name || 'शाळा'}</h2>
            <p className="text-sm text-slate-600">
              शाळा एकत्रित निकाल — {termLabel(snapshot.term)}
              {snapshot.clsFilter && classMap[snapshot.clsFilter]
                ? ` | ${classMap[snapshot.clsFilter]}`
                : ''}
              {school.yr ? ` | शैक्षणिक वर्ष ${school.yr}` : ''}
            </p>
          </div>

          {report.perClass.length === 0 && (
            <p className="text-slate-400 text-sm">निवडलेल्या निकषांसाठी कोणतेही गुण नोंदवलेले नाहीत.</p>
          )}

          {snapshot.view === 'summary' && report.perClass.length > 0 && (
            <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
              <table className="w-full text-sm min-w-[720px]">
                <thead className="bg-sf/5 text-sf">
                  <tr>
                    <th className="text-left px-3 py-2">वर्ग</th>
                    <th className="px-3 py-2 text-center">विद्यार्थी</th>
                    <th className="px-3 py-2 text-center">सरासरी %</th>
                    <th className="px-3 py-2 text-center">श्रेणी</th>
                    {GRADE_ORDER.map((g) => (
                      <th key={g} className="px-2 py-2 text-center">
                        {g}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.perClass.map((c) => (
                    <tr key={c.cKey} className="border-t border-bdr">
                      <td className="px-3 py-2 font-medium">{classMap[c.cKey] || c.cKey}</td>
                      <td className="px-3 py-2 text-center">{c.count}</td>
                      <td className="px-3 py-2 text-center font-semibold">{c.avg.toFixed(1)}%</td>
                      <td className="px-3 py-2 text-center font-semibold text-sf">
                        {gradeFor(c.avg, bands)}
                      </td>
                      {GRADE_ORDER.map((g) => (
                        <td key={g} className="px-2 py-2 text-center">
                          {c.dist[g] || '—'}
                        </td>
                      ))}
                    </tr>
                  ))}
                  <tr className="border-t-2 border-sf/30 bg-sf/5 font-semibold">
                    <td className="px-3 py-2">एकूण (शाळा)</td>
                    <td className="px-3 py-2 text-center">{report.totalCount}</td>
                    <td className="px-3 py-2 text-center">{report.schoolAvg.toFixed(1)}%</td>
                    <td className="px-3 py-2 text-center text-sf">{gradeFor(report.schoolAvg, bands)}</td>
                    {GRADE_ORDER.map((g) => (
                      <td key={g} className="px-2 py-2 text-center">
                        {report.totalDist[g] || '—'}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {snapshot.view === 'detail' && report.perClass.length > 0 && (
            <div className="space-y-6">
              {report.perClass.map((c) => (
                <div key={c.cKey} className="bg-card border border-bdr rounded-xl overflow-x-auto break-inside-avoid">
                  <div className="px-4 py-2 bg-sf/5 text-sf font-semibold flex flex-wrap justify-between gap-2">
                    <span>{classMap[c.cKey] || c.cKey}</span>
                    <span className="text-xs font-normal text-slate-600">
                      विद्यार्थी: {c.count} | सरासरी: {c.avg.toFixed(1)}% ({gradeFor(c.avg, bands)})
                    </span>
                  </div>
                  <table className="w-full text-sm min-w-[420px]">
                    <thead className="bg-sf/5 text-sf">
                      <tr>
                        <th className="text-left px-3 py-2">हजेरी क्र.</th>
                        <th className="text-left px-3 py-2">नाव</th>
                        <th className="px-3 py-2 text-center">एकूण %</th>
                        <th className="px-3 py-2 text-center">श्रेणी</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.rows.map((r) => (
                        <tr key={r.student.key} className="border-t border-bdr">
                          <td className="px-3 py-2">{r.student.payload.roll ?? '—'}</td>
                          <td className="px-3 py-2 font-medium">{r.student.payload.name}</td>
                          <td className="px-3 py-2 text-center font-semibold">{r.pct.toFixed(1)}%</td>
                          <td className="px-3 py-2 text-center font-semibold text-sf">{r.grade}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: #fff; }
        }
      `}</style>
    </div>
  )
}
