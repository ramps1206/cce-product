import { useMemo, useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { nextId, putItem } from '../lib/store'
import { syncNow } from '../lib/sync'
import { clsName } from '../lib/domain'
import { PageHeader } from '../components/ui'

const SCHEMES = [
  'महाराष्ट्र शिष्यवृत्ती परीक्षा (इ. 5वी)',
  'महाराष्ट्र शिष्यवृत्ती परीक्षा (इ. 8वी)',
  'NMMS (राष्ट्रीय आर्थिक दुर्बल घटक शिष्यवृत्ती)',
  'सावित्रीबाई फुले शिष्यवृत्ती',
  'अनुसूचित जाती (SC) शिष्यवृत्ती',
  'अनुसूचित जमाती (ST) शिष्यवृत्ती',
  'इतर मागासवर्ग (OBC) शिष्यवृत्ती',
  'विमुक्त जाती भटक्या जमाती (VJNT) शिष्यवृत्ती',
  'दिव्यांग विद्यार्थी शिष्यवृत्ती',
  'इतर शिष्यवृत्ती',
]
const ELIG = ['तपासणी बाकी', 'पात्र', 'अपात्र']
const APPLIED = ['नाही', 'होय']
const AADHAAR = ['लिंक नाही', 'लिंक झाले']
const DBT = ['लागू नाही', 'प्रलंबित', 'जमा झाली', 'नाकारली']
const RESULT = ['लागू नाही', 'प्रलंबित', 'उत्तीर्ण', 'अनुत्तीर्ण']

interface Sch {
  studentKey?: string
  studentName?: string
  classId?: string
  scheme?: string
  eligibility?: string
  applied?: string
  appNo?: string
  appDate?: string
  aadhaar?: string
  dbt?: string
  result?: string
  amount?: string
  remark?: string
}

export default function Scholarships() {
  const { rows, save, remove } = useCollection<Sch>('scholarships')
  const { rows: classRows } = useCollection<any>('classes')
  const { rows: studentRows } = useCollection<any>('students')

  const classMap = useMemo(() => Object.fromEntries(classRows.map((c) => [c.key, clsName(c.payload)])), [classRows])

  const [addCls, setAddCls] = useState('')
  const [addScheme, setAddScheme] = useState(SCHEMES[0])
  const [picked, setPicked] = useState<Record<string, boolean>>({})
  const [fCls, setFCls] = useState('')
  const [fScheme, setFScheme] = useState('')
  const [q, setQ] = useState('')

  const addStudents = studentRows.filter((s) => s.payload.classId === addCls)

  const stats = useMemo(() => ({
    total: rows.length,
    eligible: rows.filter((r) => r.payload.eligibility === 'पात्र').length,
    dbt: rows.filter((r) => r.payload.dbt === 'जमा झाली').length,
    pending: rows.filter((r) => r.payload.result === 'प्रलंबित').length,
  }), [rows])

  const shown = rows.filter((r) =>
    (!fCls || r.payload.classId === fCls) &&
    (!fScheme || r.payload.scheme === fScheme) &&
    (!q || (r.payload.studentName || '').toLowerCase().includes(q.toLowerCase()))
  )

  async function addRows() {
    const chosen = Object.keys(picked).filter((k) => picked[k])
    if (!chosen.length) return alert('विद्यार्थी निवडा!')
    let id = await nextId('scholarships')
    for (const sk of chosen) {
      const st = studentRows.find((s) => s.key === sk)
      await putItem('scholarships', String(id++), {
        studentKey: sk, studentName: st?.payload?.name, classId: addCls, scheme: addScheme,
        eligibility: 'तपासणी बाकी', applied: 'नाही', aadhaar: 'लिंक नाही', dbt: 'लागू नाही', result: 'लागू नाही',
      })
    }
    setPicked({})
    syncNow().catch(() => {})
    window.dispatchEvent(new Event('cce-synced'))
  }

  const upd = (key: string, p: Sch, patch: Partial<Sch>) => save(key, { ...p, ...patch })

  return (
    <div>
      <PageHeader title="🎓 महाराष्ट्र शिष्यवृत्ती माहिती (इ. 1ली ते 8वी)" />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <Stat value={stats.total} label="एकूण अर्ज नोंदी" icon="📋" color="border-t-indigo-500" />
        <Stat value={stats.eligible} label="पात्र विद्यार्थी" icon="✅" color="border-t-green-500" />
        <Stat value={stats.dbt} label="DBT जमा झालेले" icon="💰" color="border-t-teal-500" />
        <Stat value={stats.pending} label="निकाल प्रलंबित" icon="⏳" color="border-t-orange-400" />
      </div>

      {/* Add */}
      <div className="bg-card border border-bdr rounded-xl p-4 mb-4">
        <div className="font-bold text-sf mb-3">+ नवीन नोंद जोडा</div>
        <div className="grid md:grid-cols-3 gap-3 items-start">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">वर्ग (इ. 1 ते 8)</label>
            <select value={addCls} onChange={(e) => { setAddCls(e.target.value); setPicked({}) }} className={sel}>
              <option value="">-- वर्ग निवडा --</option>
              {classRows.map((c) => <option key={c.key} value={c.key}>{clsName(c.payload)}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">विद्यार्थी (एकाधिक निवडा ✓)</label>
            <div className="border border-slate-300 rounded-lg max-h-28 overflow-y-auto bg-white p-1">
              {addStudents.length === 0 && <div className="text-xs text-slate-400 p-2">वर्ग निवडा</div>}
              {addStudents.map((s) => (
                <label key={s.key} className="flex items-center gap-2 text-sm px-2 py-1 hover:bg-slate-50 rounded">
                  <input type="checkbox" checked={!!picked[s.key]} onChange={(e) => setPicked((p) => ({ ...p, [s.key]: e.target.checked }))} />
                  {s.payload.roll ? s.payload.roll + '. ' : ''}{s.payload.name}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">योजना / शिष्यवृत्ती</label>
            <select value={addScheme} onChange={(e) => setAddScheme(e.target.value)} className={sel}>
              {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <button onClick={addRows} className="mt-2 w-full px-3 py-2 rounded-lg text-sm bg-sf text-white hover:bg-sf/90">जोडा</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid md:grid-cols-3 gap-3 mb-3">
        <select value={fCls} onChange={(e) => setFCls(e.target.value)} className={sel}>
          <option value="">-- सर्व वर्ग (1 ते 8) --</option>
          {classRows.map((c) => <option key={c.key} value={c.key}>{clsName(c.payload)}</option>)}
        </select>
        <select value={fScheme} onChange={(e) => setFScheme(e.target.value)} className={sel}>
          <option value="">-- सर्व योजना --</option>
          {SCHEMES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="विद्यार्थ्याचे नाव टाइप करा…" className={sel} />
      </div>
      <div className="text-xs text-slate-500 mb-2">एकूण नोंदी: {shown.length}</div>

      <div className="bg-card border border-bdr rounded-xl overflow-x-auto">
        <table className="w-full text-sm min-w-[1100px]">
          <thead className="bg-sf/5 text-sf">
            <tr>
              {['विद्यार्थ्याचे नाव', 'वर्ग', 'योजना', 'पात्रता', 'अर्ज केला?', 'अर्ज क्र.', 'अर्ज दिनांक', 'आधार जोडणी', 'DBT स्थिती', 'निकाल', 'मंजूर रक्कम (₹)', 'शेरा', 'काढा'].map((h) => (
                <th key={h} className="text-left font-semibold px-2 py-2 whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && <tr><td colSpan={13} className="text-center text-slate-400 py-8">नोंदी नाहीत</td></tr>}
            {shown.map((r) => {
              const p = r.payload
              return (
                <tr key={r.key} className="border-t border-bdr">
                  <td className="px-2 py-1.5 font-medium whitespace-nowrap">{p.studentName}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap">{classMap[p.classId || ''] || '—'}</td>
                  <td className="px-2 py-1.5 whitespace-nowrap text-xs">{p.scheme}</td>
                  <RSel v={p.eligibility} opts={ELIG} on={(v) => upd(r.key, p, { eligibility: v })} />
                  <RSel v={p.applied} opts={APPLIED} on={(v) => upd(r.key, p, { applied: v })} />
                  <RInp v={p.appNo} on={(v) => upd(r.key, p, { appNo: v })} />
                  <RInp v={p.appDate} type="date" on={(v) => upd(r.key, p, { appDate: v })} />
                  <RSel v={p.aadhaar} opts={AADHAAR} on={(v) => upd(r.key, p, { aadhaar: v })} />
                  <RSel v={p.dbt} opts={DBT} on={(v) => upd(r.key, p, { dbt: v })} />
                  <RSel v={p.result} opts={RESULT} on={(v) => upd(r.key, p, { result: v })} />
                  <RInp v={p.amount} type="number" on={(v) => upd(r.key, p, { amount: v })} />
                  <RInp v={p.remark} on={(v) => upd(r.key, p, { remark: v })} />
                  <td className="px-2 py-1.5">
                    <button onClick={() => { if (confirm('नोंद काढायची?')) remove(r.key) }} className="text-red-600">🗑</button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

const sel = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm'
const cellCls = 'px-1.5 py-1 rounded border border-slate-300 text-xs bg-white'

function RSel({ v, opts, on }: { v?: string; opts: string[]; on: (v: string) => void }) {
  return (
    <td className="px-2 py-1.5">
      <select value={v || opts[0]} onChange={(e) => on(e.target.value)} className={cellCls}>
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </td>
  )
}
function RInp({ v, on, type = 'text' }: { v?: string; on: (v: string) => void; type?: string }) {
  return (
    <td className="px-2 py-1.5">
      <input type={type} value={v || ''} onChange={(e) => on(e.target.value)} className={cellCls + ' w-24'} />
    </td>
  )
}
function Stat({ value, label, icon, color }: { value: number; label: string; icon: string; color: string }) {
  return (
    <div className={`bg-card border border-bdr border-t-4 ${color} rounded-2xl p-4`}>
      <div className="text-xl">{icon}</div>
      <div className="mt-1 text-2xl font-extrabold text-sf">{value}</div>
      <div className="text-xs text-slate-500">{label}</div>
    </div>
  )
}
