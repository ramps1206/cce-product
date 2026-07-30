import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { Field, Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Klass {
  std?: string // इयत्ता
  div?: string // तुकडी
  classTeacher?: string // वर्गशिक्षक
}

export const className = (c: Klass) => `${c.std || ''}${c.div ? ' ' + c.div : ''}`.trim()

export default function Classes() {
  const { rows, save, remove } = useCollection<Klass>('classes')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Klass>({})

  function openNew() {
    setEditKey(null)
    setForm({})
    setOpen(true)
  }
  function openEdit(key: string, payload: Klass) {
    setEditKey(key)
    setForm({ ...payload })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await save(editKey, form)
    setOpen(false)
  }

  const sorted = [...rows].sort((a, b) => (a.payload.std || '').localeCompare(b.payload.std || ''))

  return (
    <div>
      <PageHeader title="वर्ग">
        <button onClick={openNew} className={btnPrimary}>
          + नवीन वर्ग
        </button>
      </PageHeader>

      <TableCard
        head={
          <>
            <Th>इयत्ता</Th>
            <Th>तुकडी</Th>
            <Th>वर्गशिक्षक</Th>
            <Th> </Th>
          </>
        }
      >
        {sorted.length === 0 && (
          <tr>
            <td colSpan={4} className="text-center text-slate-400 py-8">
              अद्याप वर्ग नाहीत
            </td>
          </tr>
        )}
        {sorted.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td className="font-medium">{r.payload.std}</Td>
            <Td>{r.payload.div}</Td>
            <Td>{r.payload.classTeacher}</Td>
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
        <Modal title={editKey ? 'वर्ग संपादन' : 'नवीन वर्ग'} onClose={() => setOpen(false)} onSubmit={submit}>
          <Field label="इयत्ता" value={form.std || ''} onChange={(v) => setForm({ ...form, std: v })} required />
          <Field label="तुकडी" value={form.div || ''} onChange={(v) => setForm({ ...form, div: v })} />
          <Field
            label="वर्गशिक्षक"
            value={form.classTeacher || ''}
            onChange={(v) => setForm({ ...form, classTeacher: v })}
          />
        </Modal>
      )}
    </div>
  )
}
