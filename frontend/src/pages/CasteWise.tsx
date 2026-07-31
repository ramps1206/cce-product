import { useEffect, useMemo, useState } from 'react'
import { getScalar, listPart } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { STD_NAMES } from '../lib/domain'
import { PageHeader, btnGhost, btnPrimary } from '../components/ui'

// Map the student caste field to the report's category columns.
const CATS: { key: string; match: string[] }[] = [
  { key: 'SC', match: ['अनु.जाती (SC)'] },
  { key: 'ST', match: ['अनु.जमाती (ST)'] },
  { key: 'VJ/NT', match: ['NT-A', 'NT-B', 'NT-C', 'NT-D', 'VJA'] },
  { key: 'OBC', match: ['OBC', 'SBC'] },
  { key: 'OPEN', match: ['खुला (Open)'] },
]
const catOf = (caste?: string) => CATS.find((c) => c.match.includes(caste || ''))?.key || 'OPEN'

interface Cell { boys: number; girls: number }
const empty = (): Record<string, Cell> => Object.fromEntries(CATS.map((c) => [c.key, { boys: 0, girls: 0 }]))

export default function CasteWise() {
  const { rows: classRows } = useCollection<any>('classes')
  const [students, setStudents] = useState<any[]>([])
  const [school, setSchool] = useState<any>({})

  async function load() {
    setStudents(await listPart('students'))
    setSchool((await getScalar('school')) || {})
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const rows = useMemo(() => {
    const classes = [...classRows].sort(
      (a, b) => Number(a.payload.std) - Number(b.payload.std) || String(a.payload.div).localeCompare(b.payload.div)
    )
    return classes.map((c) => {
      const counts = empty()
      students
        .filter((s) => s.payload.classId === c.key)
        .forEach((s) => {
          const cell = counts[catOf(s.payload.caste)]
          if (s.payload.gender === 'मुलगी') cell.girls++
          else cell.boys++
        })
      return { std: c.payload.std, counts }
    })
  }, [classRows, students])

  const totals = useMemo(() => {
    const t = empty()
    rows.forEach((r) => CATS.forEach((c) => { t[c.key].boys += r.counts[c.key].boys; t[c.key].girls += r.counts[c.key].girls }))
    return t
  }, [rows])

  const rowTotals = (counts: Record<string, Cell>) => {
    const boys = CATS.reduce((s, c) => s + counts[c.key].boys, 0)
    const girls = CATS.reduce((s, c) => s + counts[c.key].girls, 0)
    return { boys, girls, total: boys + girls }
  }

  function downloadCSV() {
    const head = ['इयत्ता', ...CATS.flatMap((c) => [`${c.key} मुले`, `${c.key} मुली`]), 'एकूण मुले', 'एकूण मुली', 'एकूण']
    const lines = rows.map((r) => {
      const rt = rowTotals(r.counts)
      return [STD_NAMES[String(r.std)] || r.std, ...CATS.flatMap((c) => [r.counts[c.key].boys, r.counts[c.key].girls]), rt.boys, rt.girls, rt.total].join(',')
    })
    const blob = new Blob(['﻿' + [head.join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'caste-wise.csv'
    a.click()
  }

  const gt = rowTotals(totals)

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="📊 इयत्ता / जात निहाय विद्यार्थी">
          <button onClick={downloadCSV} className={btnGhost}>⬇ Excel/CSV</button>
          <button onClick={() => window.print()} className={btnPrimary}>🖨 प्रिंट</button>
        </PageHeader>
      </div>

      {/* School info bar */}
      <div className="bg-card border border-bdr rounded-xl px-4 py-3 mb-4 grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div><span className="text-slate-500">🏫 शाळेचे नाव:</span> <b>{school.name || '—'}</b></div>
        <div><span className="text-slate-500">🆔 UDISE:</span> <b>{school.udise || '—'}</b></div>
        <div><span className="text-slate-500">📍 तालुका/जिल्हा:</span> <b>{[school.tal, school.dist].filter(Boolean).join(' / ') || '—'}</b></div>
        <div><span className="text-slate-500">📅 शैक्षणिक वर्ष:</span> <b>{school.yr || '—'}</b></div>
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
        <table className="w-full text-sm text-center min-w-[760px]">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <th className="px-3 py-2" rowSpan={2}>अ.क्र.</th>
              <th className="px-3 py-2 text-left" rowSpan={2}>इयत्ता</th>
              {CATS.map((c) => <th key={c.key} className="px-3 py-2 border-l border-bdr" colSpan={2}>{c.key}</th>)}
              <th className="px-3 py-2 border-l border-bdr" colSpan={3}>एकूण</th>
            </tr>
            <tr className="text-xs">
              {CATS.map((c) => <><th key={c.key + 'b'} className="px-2 py-1 border-l border-bdr">मुले</th><th key={c.key + 'g'} className="px-2 py-1">मुली</th></>)}
              <th className="px-2 py-1 border-l border-bdr">मुले</th><th className="px-2 py-1">मुली</th><th className="px-2 py-1">एकूण</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && <tr><td colSpan={4 + CATS.length * 2} className="py-8 text-slate-400">वर्ग/विद्यार्थी नाहीत</td></tr>}
            {rows.map((r, i) => {
              const rt = rowTotals(r.counts)
              return (
                <tr key={i} className="border-t border-bdr">
                  <td className="px-3 py-2">{i + 1}</td>
                  <td className="px-3 py-2 text-left font-medium">इयत्ता {STD_NAMES[String(r.std)] || r.std}</td>
                  {CATS.map((c) => <><td key={c.key + 'b'} className="px-2 py-2 border-l border-bdr">{r.counts[c.key].boys}</td><td key={c.key + 'g'} className="px-2 py-2">{r.counts[c.key].girls}</td></>)}
                  <td className="px-2 py-2 border-l border-bdr">{rt.boys}</td><td className="px-2 py-2">{rt.girls}</td><td className="px-2 py-2 font-bold">{rt.total}</td>
                </tr>
              )
            })}
            {rows.length > 0 && (
              <tr className="border-t-2 border-bdr bg-sf/5 font-bold text-sf">
                <td className="px-3 py-2" colSpan={2}>🏫 एकूण</td>
                {CATS.map((c) => <><td key={c.key + 'b'} className="px-2 py-2 border-l border-bdr">{totals[c.key].boys}</td><td key={c.key + 'g'} className="px-2 py-2">{totals[c.key].girls}</td></>)}
                <td className="px-2 py-2 border-l border-bdr">{gt.boys}</td><td className="px-2 py-2">{gt.girls}</td><td className="px-2 py-2">{gt.total}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
