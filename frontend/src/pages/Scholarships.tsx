import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { Field, Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Scholarship {
  studentName?: string
  category?: string // प्रकार (SC/ST/OBC/सुवर्ण महोत्सवी ...)
  amount?: number
  status?: string // मंजूर / प्रलंबित
}

export default function Scholarships() {
  const { rows, save, remove } = useCollection<Scholarship>('scholarships')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Scholarship>({})

  function openNew() {
    setEditKey(null)
    setForm({ status: 'प्रलंबित' })
    setOpen(true)
  }
  function openEdit(key: string, p: Scholarship) {
    setEditKey(key)
    setForm({ ...p })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await save(editKey, { ...form, amount: form.amount ? Number(form.amount) : undefined })
    setOpen(false)
  }

  const total = rows.reduce((s, r) => s + (Number(r.payload.amount) || 0), 0)

  return (
    <div>
      <PageHeader title="शिष्यवृत्ती">
        <button onClick={openNew} className={btnPrimary}>
          + नवीन नोंद
        </button>
      </PageHeader>

      <TableCard
        head={
          <>
            <Th>विद्यार्थी</Th>
            <Th>प्रकार</Th>
            <Th>रक्कम</Th>
            <Th>स्थिती</Th>
            <Th> </Th>
          </>
        }
      >
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center text-slate-400 py-8">
              अद्याप नोंदी नाहीत
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td className="font-medium">{r.payload.studentName}</Td>
            <Td>{r.payload.category}</Td>
            <Td>₹ {r.payload.amount ?? 0}</Td>
            <Td>
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  r.payload.status === 'मंजूर' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {r.payload.status}
              </span>
            </Td>
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
        {rows.length > 0 && (
          <tr className="border-t-2 border-bdr bg-sf/5 font-semibold text-sf">
            <Td>एकूण</Td>
            <Td> </Td>
            <Td>₹ {total}</Td>
            <Td> </Td>
            <Td> </Td>
          </tr>
        )}
      </TableCard>

      {open && (
        <Modal title={editKey ? 'शिष्यवृत्ती संपादन' : 'नवीन शिष्यवृत्ती'} onClose={() => setOpen(false)} onSubmit={submit}>
          <Field
            label="विद्यार्थी"
            value={form.studentName || ''}
            onChange={(v) => setForm({ ...form, studentName: v })}
            required
          />
          <Field label="प्रकार" value={form.category || ''} onChange={(v) => setForm({ ...form, category: v })} />
          <Field
            label="रक्कम (₹)"
            type="number"
            value={form.amount?.toString() || ''}
            onChange={(v) => setForm({ ...form, amount: v ? Number(v) : undefined })}
          />
          <div className="mb-3">
            <label className="block text-xs font-semibold text-slate-600 mb-1">स्थिती</label>
            <select
              value={form.status || 'प्रलंबित'}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-white text-sm"
            >
              <option value="प्रलंबित">प्रलंबित</option>
              <option value="मंजूर">मंजूर</option>
            </select>
          </div>
        </Modal>
      )}
    </div>
  )
}
