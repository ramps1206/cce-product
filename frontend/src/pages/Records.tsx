import { useState } from 'react'
import Evaluation from './Evaluation'
import Attendance from './Attendance'

const TABS = [
  { label: '📝 गुणनोंदी', Comp: Evaluation },
  { label: '📅 हजेरी', Comp: Attendance },
] as const

export default function Records() {
  const [active, setActive] = useState(0)
  const Active = TABS[active].Comp
  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-3">📝 नोंदी</h1>
      <div className="overflow-x-auto flex gap-1 border-b border-bdr mb-4">
        {TABS.map((t, i) => (
          <button key={t.label} onClick={() => setActive(i)}
            className={i === active
              ? 'bg-sf text-white font-semibold rounded-t-lg px-3 py-1.5 whitespace-nowrap'
              : 'text-slate-600 hover:bg-slate-100 rounded-t-lg px-3 py-1.5 whitespace-nowrap'}>
            {t.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  )
}
