import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { countPart, listPart } from '../lib/store'

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

export default function Dashboard() {
  const [c, setC] = useState<Counts>({ students: 0, classes: 0, teachers: 0, evals: 0 })

  async function refresh() {
    setC({
      students: await countPart('students'),
      classes: await countPart('classes'),
      teachers: await countPart('teachers'),
      evals: (await listPart('evaluations')).length,
    })
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
