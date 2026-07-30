import { useEffect, useState } from 'react'
import { api } from '../lib/api'
import { listPart, nextId, putItem, removeItem } from '../lib/store'
import { syncNow } from '../lib/sync'

interface Student {
  rollNo?: number
  name?: string
  cls?: string
  gender?: string
}

export default function Students() {
  const [rows, setRows] = useState<{ key: string; payload: Student }[]>([])
  const [editing, setEditing] = useState<{ key: string; payload: Student } | null>(null)
  const [form, setForm] = useState<Student>({})
  const [showForm, setShowForm] = useState(false)

  async function refresh() {
    const list = await listPart('students')
    list.sort((a, b) => (a.payload.rollNo || 0) - (b.payload.rollNo || 0))
    setRows(list)
  }
  useEffect(() => {
    refresh()
    const h = () => refresh()
    window.addEventListener('cce-synced', h)
    return () => window.removeEventListener('cce-synced', h)
  }, [])

  function openNew() {
    setEditing(null)
    setForm({})
    setShowForm(true)
  }
  function openEdit(r: { key: string; payload: Student }) {
    setEditing(r)
    setForm({ ...r.payload })
    setShowForm(true)
  }

  async function save(e: React.FormEvent) {
    e.preventDefault()
    const key = editing ? editing.key : String(await nextId('students'))
    await putItem('students', key, {
      ...form,
      rollNo: form.rollNo ? Number(form.rollNo) : undefined,
    })
    setShowForm(false)
    await refresh()
    syncNow().catch(() => {})
  }

  async function del(key: string) {
    if (!confirm('विद्यार्थी हटवायचा?')) return
    await removeItem('students', key)
    await refresh()
    syncNow().catch(() => {})
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-bold text-sf">विद्यार्थी यादी</h1>
        <div className="flex gap-2">
          <button
            onClick={() => api.downloadStudents().catch((e) => alert(e.message))}
            className="px-3 py-2 rounded-lg text-sm border border-sf text-sf hover:bg-sf/5"
          >
            ⬇ Excel निर्यात
          </button>
          <button onClick={openNew} className="px-3 py-2 rounded-lg text-sm bg-sf text-white hover:bg-sf/90">
            + नवीन विद्यार्थी
          </button>
        </div>
      </div>

      <div className="bg-card border border-bdr rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-sf/5 text-sf">
            <tr>
              <Th>क्र.</Th>
              <Th>नाव</Th>
              <Th>वर्ग</Th>
              <Th>लिंग</Th>
              <Th> </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center text-slate-400 py-8">
                  अद्याप विद्यार्थी नाहीत
                </td>
              </tr>
            )}
            {rows.map((r) => (
              <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
                <Td>{r.payload.rollNo ?? '—'}</Td>
                <Td className="font-medium">{r.payload.name}</Td>
                <Td>{r.payload.cls}</Td>
                <Td>{r.payload.gender}</Td>
                <Td>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => openEdit(r)} className="text-sf hover:underline">
                      संपादन
                    </button>
                    <button onClick={() => del(r.key)} className="text-red-600 hover:underline">
                      हटवा
                    </button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
          <form onSubmit={save} className="bg-white rounded-2xl p-6 w-[380px] shadow-2xl">
            <h2 className="text-lg font-bold text-sf mb-4">
              {editing ? 'विद्यार्थी संपादन' : 'नवीन विद्यार्थी'}
            </h2>
            <FField label="नाव" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} required />
            <FField
              label="हजेरी क्रमांक"
              type="number"
              value={form.rollNo?.toString() || ''}
              onChange={(v) => setForm({ ...form, rollNo: v ? Number(v) : undefined })}
            />
            <FField label="वर्ग" value={form.cls || ''} onChange={(v) => setForm({ ...form, cls: v })} />
            <FField label="लिंग (M/F)" value={form.gender || ''} onChange={(v) => setForm({ ...form, gender: v })} />
            <div className="flex gap-2 justify-end mt-5">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 rounded-lg text-sm border border-slate-300"
              >
                रद्द
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm bg-sf text-white">
                जतन करा
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="text-left font-semibold px-4 py-2.5">{children}</th>
)
const Td = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <td className={`px-4 py-2.5 ${className}`}>{children}</td>
)

function FField({
  label,
  value,
  onChange,
  type = 'text',
  required,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm"
      />
    </div>
  )
}
