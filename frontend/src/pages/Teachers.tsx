import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { Field, Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Teacher {
  name?: string
  mobile?: string
  designation?: string // पदनाम
  joinDate?: string // रुजू दिनांक
}

export default function Teachers() {
  const { rows, save, remove } = useCollection<Teacher>('teachers')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Teacher>({})

  function openNew() {
    setEditKey(null)
    setForm({})
    setOpen(true)
  }
  function openEdit(key: string, payload: Teacher) {
    setEditKey(key)
    setForm({ ...payload })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    await save(editKey, form)
    setOpen(false)
  }

  return (
    <div>
      <PageHeader title="शिक्षक">
        <button onClick={openNew} className={btnPrimary}>
          + नवीन शिक्षक
        </button>
      </PageHeader>

      <TableCard
        head={
          <>
            <Th>नाव</Th>
            <Th>पदनाम</Th>
            <Th>मोबाईल</Th>
            <Th>रुजू दिनांक</Th>
            <Th> </Th>
          </>
        }
      >
        {rows.length === 0 && (
          <tr>
            <td colSpan={5} className="text-center text-slate-400 py-8">
              अद्याप शिक्षक नाहीत
            </td>
          </tr>
        )}
        {rows.map((r) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td className="font-medium">{r.payload.name}</Td>
            <Td>{r.payload.designation}</Td>
            <Td>{r.payload.mobile}</Td>
            <Td>{r.payload.joinDate}</Td>
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
        <Modal title={editKey ? 'शिक्षक संपादन' : 'नवीन शिक्षक'} onClose={() => setOpen(false)} onSubmit={submit}>
          <Field label="नाव" value={form.name || ''} onChange={(v) => setForm({ ...form, name: v })} required />
          <Field
            label="पदनाम"
            value={form.designation || ''}
            onChange={(v) => setForm({ ...form, designation: v })}
          />
          <Field label="मोबाईल" value={form.mobile || ''} onChange={(v) => setForm({ ...form, mobile: v })} />
          <Field
            label="रुजू दिनांक"
            type="date"
            value={form.joinDate || ''}
            onChange={(v) => setForm({ ...form, joinDate: v })}
          />
        </Modal>
      )}
    </div>
  )
}
