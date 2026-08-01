import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { countPart, listPart } from '../lib/store'
import { useCollection } from '../lib/useCollection'
import { clsName } from '../lib/domain'

interface Counts { students: number; classes: number; teachers: number; evals: number }

const QUICK = [
  { to: '/report-card', label: 'निकाल', icon: '📊' },
  { to: '/students', label: 'विद्यार्थी यादी', icon: '🪪' },
  { to: '/general-register', label: 'जनरल रजिस्टर', icon: '📖' },
  { to: '/scholarships', label: 'शिष्यवृत्ती व योजना', icon: '🎓' },
  { to: '/nipun', label: 'निपुण महाराष्ट्र', icon: '🎯' },
  { to: '/evaluation', label: 'मूल्यमापन', icon: '📝' },
  { to: '/semester-report', label: 'सत्र अहवाल', icon: '🧾' },
  { to: '/attendance', label: 'हजेरी', icon: '📅' },
]

// त्वरित कार्ये — ~16 colored quick-action cards.
const ACTIONS: { to: string; label: string; icon: string; bg: string }[] = [
  { to: '/school', label: 'शाळा माहिती', icon: '🏫', bg: 'bg-indigo-50 border-indigo-200' },
  { to: '/teachers', label: 'शिक्षक', icon: '👩‍🏫', bg: 'bg-emerald-50 border-emerald-200' },
  { to: '/classes', label: 'वर्ग', icon: '🏫', bg: 'bg-orange-50 border-orange-200' },
  { to: '/students', label: 'विद्यार्थी', icon: '👧', bg: 'bg-pink-50 border-pink-200' },
  { to: '/bharansh', label: 'भारांश', icon: '⚖️', bg: 'bg-amber-50 border-amber-200' },
  { to: '/working-days', label: 'कामाचे दिवस', icon: '📅', bg: 'bg-sky-50 border-sky-200' },
  { to: '/records', label: 'नोंदी सत्र १', icon: '📝', bg: 'bg-teal-50 border-teal-200' },
  { to: '/records', label: 'नोंदी सत्र २', icon: '📗', bg: 'bg-cyan-50 border-cyan-200' },
  { to: '/results', label: 'प्रगती पत्रक', icon: '📄', bg: 'bg-violet-50 border-violet-200' },
  { to: '/nipun', label: 'निपुण', icon: '🎯', bg: 'bg-rose-50 border-rose-200' },
  { to: '/learning-outcomes', label: 'अध्ययन निष्पत्ती', icon: '📚', bg: 'bg-lime-50 border-lime-200' },
  { to: '/backup', label: 'Backup/Restore', icon: '💾', bg: 'bg-slate-50 border-slate-200' },
  { to: '/settings', label: 'License/पेमेंट', icon: '💳', bg: 'bg-green-50 border-green-200' },
  { to: '/settings', label: 'सेटिंग्ज', icon: '⚙️', bg: 'bg-fuchsia-50 border-fuchsia-200' },
  { to: '/students', label: 'विद्यार्थी यादी', icon: '🪪', bg: 'bg-blue-50 border-blue-200' },
  { to: '/results', label: 'शाळा प्रिंट', icon: '🖨️', bg: 'bg-yellow-50 border-yellow-200' },
]

// Software वापरण्याचे टप्पे — 11 ordered steps, each linking to its tab.
const STEP_LINKS = ['/school', '/teachers', '/classes', '/students', '/bharansh', '/working-days', '/evaluation', '/evaluation', '/results', '/nipun', '/learning-outcomes']
const STEPS: string[] = [
  '🏫 शाळा माहिती भरा (शाळेचे नाव, UDISE, मुख्याध्यापक, माध्यम, शैक्षणिक वर्ष नोंदवा)',
  '👩‍🏫 शिक्षक माहिती जोडा',
  '🏫 वर्ग व तुकडी तयार करा',
  '👧 विद्यार्थी यादी भरा (CSV इम्पोर्ट किंवा एकेक)',
  '⚖️ भारांश निश्चित करा',
  '📅 कामाचे दिवस नोंदवा',
  '📝 गुणनोंदी करा (सत्र १)',
  '📗 गुणनोंदी करा (सत्र २)',
  '📄 प्रगती पत्रक तयार करा',
  '🎯 निपुण महाराष्ट्र नोंदवा',
  '📚 अध्ययन निष्पत्ती नोंदवा',
]

type Bucket = { color: string; bar: string }
function bucket(pct: number): Bucket {
  if (pct >= 80) return { color: 'text-green-600', bar: 'bg-green-500' }
  if (pct >= 50) return { color: 'text-orange-500', bar: 'bg-orange-400' }
  if (pct >= 1) return { color: 'text-blue-600', bar: 'bg-blue-500' }
  return { color: 'text-slate-400', bar: 'bg-slate-300' }
}

interface ClassProgress {
  key: string
  name: string
  std: number
  count: number
  evalPct: number
  notePct: number
  attPct: number
}

export default function Dashboard() {
  const [c, setC] = useState<Counts>({ students: 0, classes: 0, teachers: 0, evals: 0 })

  const { rows: classRows } = useCollection('classes')
  const { rows: studentRows } = useCollection('students')

  // Map parts: we only need the keys (prefixed `${studentKey}::…`).
  const [evalKeys, setEvalKeys] = useState<Set<string>>(new Set())
  const [noteKeys, setNoteKeys] = useState<Set<string>>(new Set())
  const [attKeys, setAttKeys] = useState<Set<string>>(new Set())

  async function refresh() {
    setC({
      students: await countPart('students'),
      classes: await countPart('classes'),
      teachers: await countPart('teachers'),
      evals: (await listPart('evaluations')).length,
    })
    setEvalKeys(new Set((await listPart('evaluations')).map((r) => r.key)))
    setNoteKeys(new Set((await listPart('descriptiveNotes')).map((r) => r.key)))
    setAttKeys(new Set((await listPart('attendance')).map((r) => r.key)))
  }
  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  const alerts: string[] = []
  if (c.students === 0) alerts.push('अद्याप विद्यार्थी जोडलेले नाहीत — “विद्यार्थी” मध्ये नोंद करा')
  if (c.classes === 0) alerts.push('अद्याप वर्ग जोडलेले नाहीत — “वर्ग” मध्ये नोंद करा')
  if (c.students > 0 && c.evals === 0) alerts.push(`${c.students} विद्यार्थ्यांची सत्र १ गुणनोंदी अजून सुरू नाही`)
  if (alerts.length === 0) alerts.push('सर्व काही अद्ययावत आहे ✅')

  // Per-class + school-wide progress.
  const { perClass, schoolEval, schoolNote, schoolAtt } = useMemo(() => {
    const has = (set: Set<string>, sk: string) => {
      const prefix = `${sk}::`
      for (const k of set) if (k.startsWith(prefix)) return true
      return false
    }

    const byClass = new Map<string, string[]>()
    for (const s of studentRows) {
      const cid = String((s.payload as any)?.classId ?? '')
      if (!byClass.has(cid)) byClass.set(cid, [])
      byClass.get(cid)!.push(s.key)
    }

    let totEval = 0
    let totNote = 0
    let totAtt = 0
    const total = studentRows.length
    for (const s of studentRows) {
      if (has(evalKeys, s.key)) totEval++
      if (has(noteKeys, s.key)) totNote++
      if (has(attKeys, s.key)) totAtt++
    }

    const perClass: ClassProgress[] = classRows
      .map((cls) => {
        const std = Number((cls.payload as any)?.std) || 0
        const members = byClass.get(String(cls.key)) ?? []
        const count = members.length
        let e = 0
        let n = 0
        let a = 0
        for (const m of members) {
          if (has(evalKeys, m)) e++
          if (has(noteKeys, m)) n++
          if (has(attKeys, m)) a++
        }
        const pct = (v: number) => (count ? Math.round((v / count) * 100) : 0)
        return {
          key: cls.key,
          name: clsName(cls.payload),
          std,
          count,
          evalPct: pct(e),
          notePct: pct(n),
          attPct: pct(a),
        }
      })
      .sort((x, y) => x.std - y.std || x.name.localeCompare(y.name))

    const spct = (v: number) => (total ? Math.round((v / total) * 100) : 0)
    return {
      perClass,
      schoolEval: spct(totEval),
      schoolNote: spct(totNote),
      schoolAtt: spct(totAtt),
    }
  }, [classRows, studentRows, evalKeys, noteKeys, attKeys])

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-sf flex items-center gap-2">🏠 मुखपृष्ठ</h1>

      {/* Needs Attention */}
      <div className="bg-card border border-bdr rounded-2xl p-5">
        <div className="font-bold text-sf mb-3">🔔 आजचे लक्ष <span className="text-slate-400 font-normal text-sm">(Needs Attention)</span></div>
        <div className="space-y-2">
          {alerts.map((a, i) => (
            <div key={i} className="flex items-center justify-between bg-amber-50 border border-amber-200 rounded-lg px-4 py-2.5 text-sm">
              <span>{a}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat value={c.students} label="विद्यार्थी" icon="👧" color="border-t-indigo-500" />
        <Stat value={c.classes} label="वर्ग" icon="🏫" color="border-t-orange-400" />
        <Stat value={c.teachers} label="शिक्षक" icon="👩‍🏫" color="border-t-green-500" />
        <Stat value={c.evals} label="गुणनोंदी" icon="📝" color="border-t-teal-500" />
      </div>

      {/* Quick access */}
      <div>
        <div className="font-bold text-slate-600 mb-3">जलद प्रवेश <span className="text-slate-400 font-normal text-sm">(Quick Access)</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK.map((q) => (
            <Link
              key={q.to}
              to={q.to}
              className="bg-card border border-bdr rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:border-sf hover:shadow-md transition text-center"
            >
              <span className="text-2xl text-sf">{q.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{q.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* License banner */}
      <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700 font-medium">
        ✅ आपला परवाना सक्रिय आहे
      </div>

      {/* त्वरित कार्ये — quick actions grid */}
      <div>
        <div className="font-bold text-sf mb-3">⚡ त्वरित कार्ये <span className="text-slate-400 font-normal text-sm">— एका क्लिकवर</span></div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {ACTIONS.map((a, i) => (
            <Link
              key={`${a.to}-${i}`}
              to={a.to}
              className={`${a.bg} border rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:shadow-md transition text-center`}
            >
              <span className="text-2xl">{a.icon}</span>
              <span className="text-sm font-semibold text-slate-700">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>

      {/* कार्य प्रगती नकाशा */}
      <div>
        <div className="font-bold text-sf mb-3">📊 कार्य प्रगती नकाशा <span className="text-slate-400 font-normal text-sm">— वर्गनिहाय स्थिती</span></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Summary label="गुणनोंदी" pct={schoolEval} />
          <Summary label="वर्णनात्मक नोंदी" pct={schoolNote} />
          <Summary label="हजेरी" pct={schoolAtt} />
        </div>

        <div className="bg-card border border-bdr rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 text-slate-500 text-left">
                <th className="px-4 py-2.5 font-semibold">वर्ग</th>
                <th className="px-4 py-2.5 font-semibold text-center">विद्यार्थी</th>
                <th className="px-4 py-2.5 font-semibold">गुणनोंदी</th>
                <th className="px-4 py-2.5 font-semibold">वर्णनात्मक</th>
                <th className="px-4 py-2.5 font-semibold">हजेरी</th>
              </tr>
            </thead>
            <tbody>
              {perClass.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-4 text-center text-slate-400">अद्याप वर्ग जोडलेले नाहीत</td>
                </tr>
              )}
              {perClass.map((p) => (
                <tr key={p.key} className="border-t border-bdr">
                  <td className="px-4 py-3 font-semibold text-slate-700">{p.name}</td>
                  <td className="px-4 py-3 text-center text-slate-600">{p.count}</td>
                  <td className="px-4 py-3"><PctBar pct={p.evalPct} /></td>
                  <td className="px-4 py-3"><PctBar pct={p.notePct} /></td>
                  <td className="px-4 py-3"><PctBar pct={p.attPct} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 text-xs text-slate-500 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500 mr-1 align-middle" />≥80% पूर्ण</span>
          <span>·</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-400 mr-1 align-middle" />50-79% प्रगतीत</span>
          <span>·</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-blue-500 mr-1 align-middle" />1-49% सुरुवात</span>
          <span>·</span>
          <span><span className="inline-block w-2.5 h-2.5 rounded-full bg-slate-300 mr-1 align-middle" />0% सुरू नाही</span>
        </div>
      </div>

      {/* सूचना व मार्गदर्शन */}
      <div>
        <div className="font-bold text-sf mb-3">📢 सूचना व मार्गदर्शन</div>
        <div className="bg-card border border-bdr rounded-2xl p-5">
          <div className="font-bold text-slate-700 mb-3">Software वापरण्याचे टप्पे <span className="text-slate-400 font-normal text-sm">— क्रमाने करा</span></div>
          <ol className="space-y-2">
            {STEPS.map((s, i) => (
              <li key={i}>
                <Link
                  to={STEP_LINKS[i]}
                  className="flex items-start gap-3 bg-slate-50 hover:bg-sf/5 border border-bdr hover:border-sf rounded-lg px-3 py-2 text-sm transition-colors"
                >
                  <span className="shrink-0 w-6 h-6 rounded-full bg-gold text-white text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  <span className="text-slate-700 flex-1">{s}</span>
                  <span className="shrink-0 text-slate-400">›</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </div>
  )
}

function Stat({ value, label, icon, color }: { value: number; label: string; icon: string; color: string }) {
  return (
    <div className={`bg-card border border-bdr border-t-4 ${color} rounded-2xl p-5`}>
      <div className="text-2xl">{icon}</div>
      <div className="mt-1 text-3xl font-extrabold text-sf">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}

function Summary({ label, pct }: { label: string; pct: number }) {
  const b = bucket(pct)
  return (
    <div className="bg-card border border-bdr rounded-2xl p-5">
      <div className="text-sm text-slate-500">{label}</div>
      <div className={`mt-1 text-3xl font-extrabold ${b.color}`}>{pct}%</div>
      <div className="mt-2 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${b.bar} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function PctBar({ pct }: { pct: number }) {
  const b = bucket(pct)
  return (
    <div className="flex items-center gap-2 min-w-[110px]">
      <div className="flex-1 h-2 rounded-full bg-slate-100 overflow-hidden">
        <div className={`h-full ${b.bar} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-semibold ${b.color} w-9 text-right`}>{pct}%</span>
    </div>
  )
}
