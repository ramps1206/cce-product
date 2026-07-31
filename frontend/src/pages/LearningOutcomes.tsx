import { useEffect, useMemo, useState } from 'react'
import { listPart, putItem } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { syncNow } from '../lib/sync'
import { clsName, STD_NAMES } from '../lib/domain'
import { PageHeader, btnGhost } from '../components/ui'
import loData from '../lib/loData.json'

type LoItem = { code: string; text: string }
type SubjectDef = { label: string; items: LoItem[] }
const DATA = loData as Record<string, Record<string, SubjectDef>>

const loKey = (studentKey: string, std: string, subj: string) => `${studentKey}::${std}::${subj}`

export default function LearningOutcomes() {
  const { rows: classRows } = useCollection<any>('classes')
  const [students, setStudents] = useState<any[]>([])
  const [levels, setLevels] = useState<Record<string, number>>({})
  const [std, setStd] = useState('1')
  const [subj, setSubj] = useState('mar')
  const [classId, setClassId] = useState('')

  async function load() {
    setStudents(await listPart('students'))
    const lo = await listPart('lo')
    setLevels(Object.fromEntries(lo.map((r) => [r.key, r.payload?.level ?? 0])))
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const subjects = useMemo(() => Object.entries(DATA[std] || {}).map(([k, v]) => ({ key: k, label: v.label })), [std])
  useEffect(() => {
    if (!subjects.find((s) => s.key === subj)) setSubj(subjects[0]?.key || 'mar')
  }, [std]) // eslint-disable-line

  const items = DATA[std]?.[subj]?.items || []

  // Classes (तुकडी) of the chosen standard.
  const stdClasses = classRows.filter((c) => String(c.payload.std) === std)
  useEffect(() => {
    if (!stdClasses.find((c) => c.key === classId)) setClassId(stdClasses[0]?.key || '')
  }, [std, classRows]) // eslint-disable-line

  const shown = students
    .filter((s) => s.payload.classId === classId)
    .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0))

  async function setLevel(studentKey: string, n: number) {
    const key = loKey(studentKey, std, subj)
    const cur = levels[key] || 0
    const next = cur === n ? 0 : n // click same → deselect
    setLevels((l) => ({ ...l, [key]: next }))
    await putItem('lo', key, { level: next })
    syncNow().catch(() => {})
  }

  return (
    <div>
      <div className="print:hidden">
        <PageHeader title="📚 अध्ययन निष्पत्ती">
          <button onClick={() => window.print()} className={btnGhost}>🖨 वर्ग प्रिंट (A4)</button>
        </PageHeader>

        {/* Class (इयत्ता) tabs */}
        <div className="flex flex-wrap gap-1 border-b border-bdr mb-2">
          {Object.keys(STD_NAMES).map((k) => (
            <button key={k} onClick={() => setStd(k)}
              className={`px-3 py-1.5 text-sm rounded-t-lg ${std === k ? 'bg-sf text-white font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}>
              इयत्ता {STD_NAMES[k]}
            </button>
          ))}
        </div>
        {/* Subject tabs */}
        <div className="flex flex-wrap gap-1 mb-3">
          {subjects.map((s) => (
            <button key={s.key} onClick={() => setSubj(s.key)}
              className={`px-3 py-1 text-sm rounded-lg ${subj === s.key ? 'bg-gold/20 text-sf font-semibold border border-gold' : 'text-slate-600 hover:bg-slate-100'}`}>
              {s.label}
            </button>
          ))}
        </div>
        {/* तुकडी */}
        <div className="mb-3">
          <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग (तुकडी) निवडा</label>
          <select value={classId} onChange={(e) => setClassId(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[180px]">
            {stdClasses.length === 0 && <option value="">— तुकडी नाही —</option>}
            {stdClasses.map((c) => <option key={c.key} value={c.key}>{clsName(c.payload)}</option>)}
          </select>
          <span className="ml-3 text-sm text-slate-500">एकूण अध्ययन निष्पत्ती: {items.length} | {shown.length} विद्यार्थी</span>
        </div>

        <p className="text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
          📌 विद्यार्थी ज्या अध्ययन निष्पत्तीवर क्लिक करेल, ती व त्यापूर्वीच्या सर्व साध्य (हिरव्या) समजल्या जातील. पुन्हा त्याच क्रमांकावर क्लिक केल्यास निवड रद्द होईल.
        </p>
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
        <table className="text-sm">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <th className="px-3 py-2 sticky left-0 bg-sf/5">अ.क्र.</th>
              <th className="px-3 py-2 text-left sticky left-12 bg-sf/5 min-w-[160px]">विद्यार्थ्याचे नाव</th>
              {items.map((it, i) => (
                <th key={it.code} className="px-2 py-2 text-center" title={`${it.code} - ${it.text}`}>{i + 1}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={2 + items.length} className="text-center text-slate-400 py-8">या तुकडीत विद्यार्थी नाहीत</td></tr>}
            {shown.map((s, ri) => {
              const lvl = levels[loKey(s.key, std, subj)] || 0
              return (
                <tr key={s.key} className="border-t border-bdr">
                  <td className="px-3 py-2 text-center sticky left-0 bg-white">{ri + 1}</td>
                  <td className="px-3 py-2 font-medium sticky left-12 bg-white whitespace-nowrap">{s.payload.name}</td>
                  {items.map((it, i) => {
                    const n = i + 1
                    const achieved = n <= lvl
                    return (
                      <td key={it.code} className="px-1 py-1.5 text-center">
                        <button
                          onClick={() => setLevel(s.key, n)}
                          title={`${it.code} - ${it.text}`}
                          className={`w-7 h-7 rounded-full text-xs border transition ${
                            achieved ? 'bg-green-500 text-white border-green-600' : 'bg-white text-slate-500 border-slate-300 hover:border-sf'
                          }`}
                        >
                          {n}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
