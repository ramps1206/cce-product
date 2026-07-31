import { useState } from 'react'
import SchoolInfo from './SchoolInfo'
import Teachers from './Teachers'
import Classes from './Classes'
import Students from './Students'
import Bharansh from './Bharansh'
import WorkingDays from './WorkingDays'

const TABS = [
  { label: '🏫 शाळा माहिती', Comp: SchoolInfo },
  { label: '👩‍🏫 शिक्षक माहिती', Comp: Teachers },
  { label: '🏫 वर्ग', Comp: Classes },
  { label: '👧 विद्यार्थी', Comp: Students },
  { label: '⚖️ भारांश', Comp: Bharansh },
  { label: '📆 कामाचे दिवस', Comp: WorkingDays },
] as const

export default function DataEntry() {
  const [active, setActive] = useState(0)
  const Active = TABS[active].Comp

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-3">📁 माहिती नोंद</h1>
      <div className="overflow-x-auto flex gap-1 border-b border-bdr mb-4">
        {TABS.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActive(i)}
            className={
              i === active
                ? 'bg-sf text-white font-semibold rounded-t-lg px-3 py-1.5 whitespace-nowrap'
                : 'text-slate-600 hover:bg-slate-100 rounded-t-lg px-3 py-1.5 whitespace-nowrap'
            }
          >
            {tab.label}
          </button>
        ))}
      </div>
      <Active />
    </div>
  )
}
