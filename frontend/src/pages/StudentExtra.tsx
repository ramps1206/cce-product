import { useState } from 'react'
import CasteWise from './CasteWise'
import IdCard from './IdCard'
import Bonafide from './Bonafide'
import GeneralRegister from './GeneralRegister'
import TransferCertificate from './TransferCertificate'

const TABS = [
  { label: '📊 इयत्ता / जात निहाय', Comp: CasteWise },
  { label: '🪪 Student ID Card', Comp: IdCard },
  { label: '📜 बोनाफाईड', Comp: Bonafide },
  { label: '📔 सर्वसाधारण नोंदवही', Comp: GeneralRegister },
  { label: '📄 शाळा सोडल्याचा दाखला (TC)', Comp: TransferCertificate },
] as const

export default function StudentExtra() {
  const [active, setActive] = useState(0)
  const Active = TABS[active].Comp

  return (
    <div>
      <h1 className="text-xl font-bold text-slate-800 mb-3">📇 विद्यार्थी अतिरिक्त माहिती</h1>
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
