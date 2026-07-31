import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { clsName, DIVISIONS, STD_NAMES } from '../lib/domain'
import { Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Klass {
  std?: string
  div?: string
  t1?: string // class teacher 1 (teacher key)
  t2?: string // class teacher 2
}

export default function Classes() {
  const { rows, save, remove } = useCollection<Klass>('classes')
  const { rows: teacherRows } = useCollection<any>('teachers')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Klass>({ std: '1', div: '' })

  const teacherName = (key?: string) => teacherRows.find((t) => t.key === key)?.payload?.name || '—'

  function openNew() {
    setEditKey(null)
    setForm({ std: '1', div: '' })
    setOpen(true)
  }
  function openEdit(key: string, p: Klass) {
    setEditKey(key)
    setForm({ ...p })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.div) return alert('तुकडी निवडा!')
    const dup = rows.find((r) => r.key !== editKey && String(r.payload.std) === String(form.std) && r.payload.div === form.div)
    if (dup) return alert('हा वर्ग-तुकडी आधीच आहे!')
    await save(editKey, form)
    setOpen(false)
  }

  const sorted = [...rows].sort(
    (a, b) => (Number(a.payload.std) - Number(b.payload.std)) || (a.payload.div || '').localeCompare(b.payload.div || '')
  )

  return (
    <div>
      <PageHeader title="🏫 वर्ग">
        <button onClick={openNew} className={btnPrimary}>➕ नवीन वर्ग</button>
      </PageHeader>

      <TableCard
        head={<><Th>इयत्ता</Th><Th>तुकडी</Th><Th>वर्गशिक्षक (स.१)</Th><Th>वर्गशिक्षक (स.२)</Th><Th> </Th></>}
      >
        {sorted.length === 0 && (
          <tr><td colSpan={5} className="text-center text-slate-400 py-8">अद्याप वर्ग नाहीत</td></tr>
        )}
        {sorted.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td className="font-medium">{STD_NAMES[String(r.payload.std)] || r.payload.std}</Td>
            <Td>{r.payload.div}</Td>
            <Td>{teacherName(r.payload.t1)}</Td>
            <Td>{teacherName(r.payload.t2)}</Td>
            <Td>
              <div className="flex gap-2 justify-end whitespace-nowrap">
                <button onClick={() => openEdit(r.key, r.payload)} className="text-sf hover:underline">संपादन</button>
                <button onClick={() => remove(r.key)} className="text-red-600 hover:underline">हटवा</button>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      {open && (
        <Modal title={editKey ? 'वर्ग संपादन' : 'नवीन वर्ग जोडा'} onClose={() => setOpen(false)} onSubmit={submit}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">इयत्ता *</label>
              <select value={form.std || '1'} onChange={(e) => setForm({ ...form, std: e.target.value })} className={sel}>
                {Object.entries(STD_NAMES).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">तुकडी *</label>
              <select value={form.div || ''} onChange={(e) => setForm({ ...form, div: e.target.value })} className={sel}>
                <option value="">-- निवडा --</option>
                {DIVISIONS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <TeacherSelect label="वर्गशिक्षक (स.१)" v={form.t1} on={(v) => setForm({ ...form, t1: v })} teachers={teacherRows} />
            <TeacherSelect label="वर्गशिक्षक (स.२)" v={form.t2} on={(v) => setForm({ ...form, t2: v })} teachers={teacherRows} />
          </div>
          {form.div && <p className="text-xs text-slate-500 mt-3">वर्ग: <b>{clsName(form)}</b></p>}
        </Modal>
      )}
    </div>
  )
}

const sel = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-white focus:border-sf outline-none text-sm'

function TeacherSelect({ label, v, on, teachers }: { label: string; v?: string; on: (v: string) => void; teachers: any[] }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select value={v || ''} onChange={(e) => on(e.target.value)} className={sel}>
        <option value="">-- निवडा --</option>
        {teachers.map((t) => <option key={t.key} value={t.key}>{t.payload?.name}</option>)}
      </select>
    </div>
  )
}
