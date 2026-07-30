import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { Field, Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface GRRow {
  grNo?: string // सर्वसाधारण नोंदवही क्रमांक
  name?: string
  dob?: string // जन्मदिनांक
  admissionDate?: string // प्रवेश दिनांक
  caste?: string // जात
}

export default function GeneralRegister() {
  const { rows, save, remove } = useCollection<GRRow>('generalRegister')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<GRRow>({})

  function openNew() {
    setEditKey(null)
    setForm({})
    setOpen(true)
  }
  function openEdit(key: string, p: GRRow) {
    setEditKey(key)
    setForm({ ...p })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await save(editKey, form)
    setOpen(false)
  }

  const sorted = [...rows].sort((a, b) => (Number(a.payload.grNo) || 0) - (Number(b.payload.grNo) || 0))

  return (
    <div>
      <PageHeader title="सर्वसाधारण नोंदवही">
        <button onClick={openNew} className={btnPrimary}>
          + नवीन नोंद
        </button>
      </PageHeader>

      <TableCard
        head={
          <>
            <Th>नोंद क्र.</Th>
            <Th>नाव</Th>
            <Th>जन्मदिनांक</Th>
            <Th>प्रवेश दिनांक</Th>
            <Th>जात</Th>
            <Th> </Th>
          </>
        }
      >
        {sorted.length === 0 && (
          <tr>
            <td colSpan={6} className="text-center text-slate-400 py-8">
              अद्याप नोंदी नाहीत
            </td>
          </tr>
        )}
        {sorted.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td className="font-medium">{r.payload.grNo}</Td>
            <Td>{r.payload.name}</Td>
            <Td>{r.payload.dob}</Td>
            <Td>{r.payload.admissionDate}</Td>
            <Td>{r.payload.caste}</Td>
            <Td>
              <div className="flex gap-2 justify-end">
                <button onClick={() => openEdit(r.key, r.payload)} className="text-sf hover:underline">
                  संपादन
                </button>
                <button onClick={() => remove(r.key)} className="text-red-600 hover:underline">
                  हटवा
                </button>
              </div>
            </Td>
          </tr>
        ))}
      </TableCard>

      {open && (
        <Modal
          title={editKey ? 'नोंद संपादन' : 'नवीन नोंद'}
          onClose={() => setOpen(false)}
          onSubmit={submit}
        >
          <Field label="नोंद क्रमांक" value={form.grNo || ''} onChange={(v) => setForm({ ...form, grNo: v })} required />
          <Field label="नाव" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field label="जन्मदिनांक" type="date" value={form.dob || ''} onChange={(v) => setForm({ ...form, dob: v })} />
          <Field
            label="प्रवेश दिनांक"
            type="date"
            value={form.admissionDate || ''}
            onChange={(v) => setForm({ ...form, admissionDate: v })}
          />
          <Field label="जात" value={form.caste || ''} onChange={(v) => setForm({ ...form, caste: v })} />
        </Modal>
      )}
    </div>
  )
}
