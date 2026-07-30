import { useEffect, useState } from 'react'
import { countPart } from '../lib/store'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { auth } = useAuth()
  const [counts, setCounts] = useState({ students: 0, classes: 0, teachers: 0 })

  async function refresh() {
    setCounts({
      students: await countPart('students'),
      classes: await countPart('classes'),
      teachers: await countPart('teachers'),
    })
  }
  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  return (
    <div>
      <h1 className="text-2xl font-bold text-sf mb-1">डॅशबोर्ड</h1>
      <p className="text-sm text-slate-500 mb-6">{auth?.email}</p>
      <div className="grid grid-cols-3 gap-4 max-w-2xl">
        <Stat label="विद्यार्थी" value={counts.students} icon="👧" />
        <Stat label="वर्ग" value={counts.classes} icon="🏫" />
        <Stat label="शिक्षक" value={counts.teachers} icon="👩‍🏫" />
      </div>
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: number; icon: string }) {
  return (
    <div className="bg-card border border-bdr rounded-xl p-5">
      <div className="text-3xl">{icon}</div>
      <div className="mt-2 text-3xl font-bold text-sf">{value}</div>
      <div className="text-sm text-slate-500">{label}</div>
    </div>
  )
}
