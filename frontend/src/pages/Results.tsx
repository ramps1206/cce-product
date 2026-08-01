import { useState } from 'react'
import ReportCard from './ReportCard'
import SemesterReport from './SemesterReport'
import Grades from './Grades'
import Nondvahi from './Nondvahi'
import SchoolConsolidated from './SchoolConsolidated'
import CoverPage from './CoverPage'

const TABS = [
  { label: '📄 प्रगती पत्रक', Comp: ReportCard },
  { label: '📊 श्रेणी तक्ता', Comp: SemesterReport },
  { label: '📖 नोंदवही', Comp: Nondvahi },
  { label: '🏆 शाळा एकत्रित निकाल', Comp: SchoolConsolidated },
  { label: '📕 कव्हर पेज', Comp: CoverPage },
  { label: '🏅 श्रेणी सारणी', Comp: Grades },
] as const

export default function Results() {
  const [active, setActive] = useState(0)
  const Active = TABS[active].Comp

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-3">📄 निकाल</h1>
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
