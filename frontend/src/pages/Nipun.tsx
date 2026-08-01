import { useEffect, useMemo, useState } from 'react'
import { listPart, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'
import { PageHeader, btnPrimary, btnGhost } from '../components/ui'

/* ------------------------------------------------------------------ */
/* Domain model                                                        */
/* ------------------------------------------------------------------ */

interface Student {
  roll?: string
  name?: string
  classId?: string
}

/** A single foundational-literacy / numeracy skill chart. */
interface Skill {
  key: string
  label: string
  /** Ordered assessment levels; the LAST level == निपुण (mastery). */
  levels: string[]
}

/** Per-student, per-skill assessment record (stored in the 'nipun' MAP part). */
interface NipunRec {
  status?: string
  date?: string
}

// Three-point checkpoint ladder shared by every skill chart.
const LEVELS = ['प्रारंभिक', 'प्रगतीपथावर', 'निपुण'] as const
const MASTERY = LEVELS[LEVELS.length - 1] // 'निपुण'
const PROGRESS = LEVELS[1] // 'प्रगतीपथावर'

const SKILLS: Skill[] = [
  { key: 'marathi-read-recog', label: 'मराठी वाचन (ओळख)', levels: [...LEVELS] },
  { key: 'marathi-read-word', label: 'मराठी वाचन (शब्द/वाक्य)', levels: [...LEVELS] },
  { key: 'marathi-write', label: 'मराठी लेखन', levels: [...LEVELS] },
  { key: 'math-number', label: 'गणित - संख्याज्ञान', levels: [...LEVELS] },
  { key: 'math-basic-ops', label: 'गणित - मूलभूत क्रिया (बेरीज/वजाबाकी)', levels: [...LEVELS] },
  { key: 'math-mul-div', label: 'गणित - गुणाकार/भागाकार', levels: [...LEVELS] },
  { key: 'english-read', label: 'इंग्रजी वाचन', levels: [...LEVELS] },
]

/** Composite MAP key for a student's status on one skill. */
const recKey = (studentKey: string, skillKey: string) => `${studentKey}::${skillKey}`

function today(): string {
  return new Date().toISOString().slice(0, 10)
}

const btnGold = 'px-3 py-2 rounded-lg text-sm bg-gold text-white hover:bg-gold/90'

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

type Tab = 'chart' | 'review'

export default function Nipun() {
  const { rows: classRows } = useCollection<any>('classes')
  const classMap = useMemo(
    () => Object.fromEntries(classRows.map((c: any) => [c.key, clsName(c.payload)])),
    [classRows]
  ) as Record<string, string>

  const [students, setStudents] = useState<{ key: string; payload: Student }[]>([])
  const [recs, setRecs] = useState<Record<string, NipunRec>>({})
  const [tab, setTab] = useState<Tab>('chart')

  async function load() {
    setStudents((await listPart('students')) as { key: string; payload: Student }[])
    setRecs(
      Object.fromEntries(
        (await listPart('nipun')).map((r) => [r.key, (r.payload || {}) as NipunRec])
      )
    )
  }
  useEffect(() => {
    load()
    const h = () => load()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  async function setStatus(studentKey: string, skillKey: string, status: string, date: string) {
    const k = recKey(studentKey, skillKey)
    const payload: NipunRec = { status, date }
    setRecs((r) => ({ ...r, [k]: payload }))
    await putItem('nipun', k, payload)
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  function studentsOf(classId: string): { key: string; payload: Student }[] {
    return students
      .filter((s) => s.payload.classId === classId)
      .sort((a, b) => (Number(a.payload.roll) || 0) - (Number(b.payload.roll) || 0))
  }

  return (
    <div>
      <PageHeader title="निपुण महाराष्ट्र" />

      {/* Inner tabs */}
      <div className="flex gap-2 mb-5 print:hidden">
        <TabBtn active={tab === 'chart'} onClick={() => setTab('chart')}>
          📋 कौशल्य तपशील तक्ता
        </TabBtn>
        <TabBtn active={tab === 'review'} onClick={() => setTab('review')}>
          📊 अध्ययन क्षमता पडताळणी
        </TabBtn>
      </div>

      {tab === 'chart' ? (
        <SkillChartTab
          classMap={classMap}
          classKeys={classRows.map((c: any) => c.key)}
          recs={recs}
          studentsOf={studentsOf}
          setStatus={setStatus}
        />
      ) : (
        <ReviewTab
          classMap={classMap}
          classKeys={classRows.map((c: any) => c.key)}
          recs={recs}
          studentsOf={studentsOf}
        />
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab 1 — कौशल्य तपशील तक्ता                                          */
/* ------------------------------------------------------------------ */

function SkillChartTab({
  classMap,
  classKeys,
  recs,
  studentsOf,
  setStatus,
}: {
  classMap: Record<string, string>
  classKeys: string[]
  recs: Record<string, NipunRec>
  studentsOf: (classId: string) => { key: string; payload: Student }[]
  setStatus: (studentKey: string, skillKey: string, status: string, date: string) => void
}) {
  const [cls, setCls] = useState('')
  const [skillKey, setSkillKey] = useState('')
  const [date, setDate] = useState(today())
  const [built, setBuilt] = useState<{ cls: string; skillKey: string } | null>(null)

  const skill = SKILLS.find((s) => s.key === built?.skillKey)
  const rows = built ? studentsOf(built.cls) : []

  return (
    <div>
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3 mb-5 print:hidden">
        <Select label="वर्ग निवडा" value={cls} onChange={setCls}>
          <option value="">— निवडा —</option>
          {classKeys.map((c) => (
            <option key={c} value={c}>{classMap[c]}</option>
          ))}
        </Select>

        <Select label="कौशल्य (तक्ता)" value={skillKey} onChange={setSkillKey}>
          <option value="">— निवडा —</option>
          {SKILLS.map((s) => (
            <option key={s.key} value={s.key}>{s.label}</option>
          ))}
        </Select>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">दिनांक</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>

        <button
          className={btnGold}
          disabled={!cls || !skillKey}
          onClick={() => setBuilt({ cls, skillKey })}
        >
          🔄 तक्ता तयार करा
        </button>

        <div className="ml-auto flex gap-2">
          <button className={btnPrimary} onClick={() => window.dispatchEvent(new Event('cce-synced'))}>
            💾 सर्व सेव्ह करा
          </button>
          <button className={btnGhost} onClick={() => window.print()}>
            🖨 वर्ग प्रिंट (A4)
          </button>
        </div>
      </div>

      {!built || !skill ? (
        <EmptyState icon="🎯" text="वर्ग निवडा व तक्ता तयार करा" />
      ) : (
        <>
          <div className="mb-3 text-sm text-slate-600 print:block">
            <span className="font-semibold text-sf">{classMap[built.cls]}</span>
            {' · '}
            <span className="font-semibold">{skill.label}</span>
            {' · दिनांक: '}
            {date}
          </div>

          <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[560px]">
              <thead className="bg-sf/5 text-sf">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">क्र.</th>
                  <th className="text-left font-semibold px-4 py-2.5">नाव</th>
                  {skill.levels.map((lv) => (
                    <th key={lv} className="text-center font-semibold px-3 py-2.5">{lv}</th>
                  ))}
                  <th className="text-center font-semibold px-4 py-2.5">स्थिती</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={skill.levels.length + 3} className="text-center text-slate-400 py-8">
                      विद्यार्थी नाहीत
                    </td>
                  </tr>
                )}
                {rows.map((s) => {
                  const rec = recs[recKey(s.key, skill.key)] || {}
                  return (
                    <tr key={s.key} className="border-t border-bdr hover:bg-slate-50">
                      <td className="px-4 py-2.5">{s.payload.roll ?? '—'}</td>
                      <td className="px-4 py-2.5 font-medium">{s.payload.name}</td>
                      {skill.levels.map((lv) => {
                        const active = rec.status === lv
                        return (
                          <td key={lv} className="px-3 py-2 text-center">
                            <button
                              onClick={() => setStatus(s.key, skill.key, lv, date)}
                              className={
                                'w-full px-2 py-1 rounded-md text-xs border transition ' +
                                (active
                                  ? lv === MASTERY
                                    ? 'bg-green-600 text-white border-green-600'
                                    : lv === PROGRESS
                                      ? 'bg-amber-500 text-white border-amber-500'
                                      : 'bg-slate-500 text-white border-slate-500'
                                  : 'bg-white text-slate-500 border-slate-300 hover:border-sf')
                              }
                            >
                              {active ? '●' : '○'}
                            </button>
                          </td>
                        )
                      })}
                      <td className="px-4 py-2.5 text-center">
                        {rec.status === MASTERY ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">✓ निपुण</span>
                        ) : rec.status ? (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">अपेक्षित</span>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tab 2 — अध्ययन क्षमता पडताळणी                                       */
/* ------------------------------------------------------------------ */

function ReviewTab({
  classMap,
  classKeys,
  recs,
  studentsOf,
}: {
  classMap: Record<string, string>
  classKeys: string[]
  recs: Record<string, NipunRec>
  studentsOf: (classId: string) => { key: string; payload: Student }[]
}) {
  const [cls, setCls] = useState('')
  const [date, setDate] = useState(today())
  const [built, setBuilt] = useState<string | null>(null)

  const rows = built ? studentsOf(built) : []

  function summarise(studentKey: string): { nipun: number; progress: number; total: number } {
    let nipun = 0
    let progress = 0
    for (const sk of SKILLS) {
      const rec = recs[recKey(studentKey, sk.key)]
      if (!rec?.status) continue
      if (rec.status === MASTERY) nipun++
      else if (rec.status === PROGRESS) progress++
    }
    return { nipun, progress, total: SKILLS.length }
  }

  return (
    <div>
      <div className="flex flex-wrap items-end gap-3 mb-5 print:hidden">
        <Select label="वर्ग निवडा" value={cls} onChange={setCls}>
          <option value="">— निवडा —</option>
          {classKeys.map((c) => (
            <option key={c} value={c}>{classMap[c]}</option>
          ))}
        </Select>

        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">दिनांक</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
          />
        </div>

        <button className={btnGold} disabled={!cls} onClick={() => setBuilt(cls)}>
          🔄 एकत्रित निकाल तयार करा
        </button>

        <div className="ml-auto flex gap-2">
          <button className={btnGhost} onClick={() => window.print()}>
            🖨 वर्ग प्रिंट (A4)
          </button>
        </div>
      </div>

      {!built ? (
        <EmptyState icon="📊" text="वर्ग निवडा व एकत्रित निकाल तयार करा" />
      ) : (
        <>
          <div className="mb-3 text-sm text-slate-600 print:block">
            <span className="font-semibold text-sf">{classMap[built]}</span>
            {' · दिनांक: '}
            {date}
            {' · एकूण कौशल्ये: '}
            {SKILLS.length}
          </div>

          <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead className="bg-sf/5 text-sf">
                <tr>
                  <th className="text-left font-semibold px-4 py-2.5">क्र.</th>
                  <th className="text-left font-semibold px-4 py-2.5">नाव</th>
                  <th className="text-center font-semibold px-4 py-2.5">निपुण</th>
                  <th className="text-center font-semibold px-4 py-2.5">प्रगतीपथावर</th>
                  <th className="text-center font-semibold px-4 py-2.5">एकूण प्रगती</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={5} className="text-center text-slate-400 py-8">
                      विद्यार्थी नाहीत
                    </td>
                  </tr>
                )}
                {rows.map((s) => {
                  const sum = summarise(s.key)
                  const pct = Math.round((sum.nipun / sum.total) * 100)
                  return (
                    <tr key={s.key} className="border-t border-bdr hover:bg-slate-50">
                      <td className="px-4 py-2.5">{s.payload.roll ?? '—'}</td>
                      <td className="px-4 py-2.5 font-medium">{s.payload.name}</td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          {sum.nipun} / {sum.total}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
                          {sum.progress}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-2 rounded-full bg-slate-200 overflow-hidden">
                            <div className="h-full bg-sf" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-slate-500 w-9 text-right">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

function TabBtn({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={
        'px-4 py-2 rounded-lg text-sm font-semibold border transition ' +
        (active ? 'bg-sf text-white border-sf' : 'bg-white text-sf border-bdr hover:bg-sf/5')
      }
    >
      {children}
    </button>
  )
}

function Select({
  label,
  value,
  onChange,
  children,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  children: React.ReactNode
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm min-w-[160px]"
      >
        {children}
      </select>
    </div>
  )
}

function EmptyState({ icon, text }: { icon: string; text: string }) {
  return (
    <div className="bg-card border border-bdr rounded-xl py-16 flex flex-col items-center justify-center text-center">
      <div className="text-5xl mb-3">{icon}</div>
      <div className="text-slate-500 text-sm">{text}</div>
    </div>
  )
}
