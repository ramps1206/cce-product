import { useState } from 'react'
import { useCollection } from '../lib/useCollection'
import { DISABILITY_TYPES, QUALIFICATIONS, SUBJECTS, remainingService } from '../lib/domain'
import { Modal, PageHeader, TableCard, Td, Th, btnPrimary } from '../components/ui'

interface Teacher {
  name?: string
  qual?: string
  sub?: string
  phone?: string
  dob?: string
  serviceStart?: string
  schoolJoin?: string
  disabled?: string
  disabilityType?: string
  disabilityPercent?: string
  disabilityUdid?: string
}

export default function Teachers() {
  const { rows, save, remove } = useCollection<Teacher>('teachers')
  const [open, setOpen] = useState(false)
  const [editKey, setEditKey] = useState<string | null>(null)
  const [form, setForm] = useState<Teacher>({ disabled: 'नाही' })

  function openNew() {
    setEditKey(null)
    setForm({ disabled: 'नाही' })
    setOpen(true)
  }
  function openEdit(key: string, p: Teacher) {
    setEditKey(key)
    setForm({ ...p })
    setOpen(true)
  }
  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.name?.trim()) return alert('नाव भरा!')
    if (form.disabled === 'होय' && !form.disabilityType) return alert('दिव्यांगत्वाचा प्रकार निवडा!')
    await save(editKey, form)
    setOpen(false)
  }

  const isDisabled = form.disabled === 'होय'

  return (
    <div>
      <PageHeader title="👩‍🏫 शिक्षक यादी">
        <button onClick={openNew} className={btnPrimary}>➕ नवीन शिक्षक</button>
      </PageHeader>

      <TableCard
        head={<>
          <Th>#</Th><Th>नाव</Th><Th>पात्रता</Th><Th>विषय</Th><Th>फोन</Th>
          <Th>जन्मदिनांक</Th><Th>शाळेत रुजू</Th><Th>शिल्लक सेवाकाल</Th><Th>दिव्यांग</Th><Th>कृती</Th>
        </>}
      >
        {rows.length === 0 && (
          <tr><td colSpan={10} className="text-center text-slate-400 py-8">शिक्षक जोडा</td></tr>
        )}
        {rows.map((r, i) => (
          <tr key={r.key} className="border-t border-bdr hover:bg-slate-50">
            <Td>{i + 1}</Td>
            <Td className="font-medium">{r.payload.name}</Td>
            <Td>{r.payload.qual}</Td>
            <Td>{r.payload.sub}</Td>
            <Td>{r.payload.phone}</Td>
            <Td>{r.payload.dob}</Td>
            <Td>{r.payload.schoolJoin}</Td>
            <Td>{remainingService(r.payload.dob)}</Td>
            <Td>{r.payload.disabled === 'होय' ? '✓' : '—'}</Td>
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
        <Modal title={editKey ? 'शिक्षक संपादन' : 'नवीन शिक्षक'} onClose={() => setOpen(false)} onSubmit={submit}>
          <Field label="नाव *" v={form.name} on={(v) => setForm({ ...form, name: v })} ph="शिक्षकाचे संपूर्ण नाव" />
          <div className="grid grid-cols-2 gap-3">
            <Sel label="पात्रता" v={form.qual} on={(v) => setForm({ ...form, qual: v })} opts={QUALIFICATIONS} ph="-- निवडा --" />
            <Sel label="मुख्य विषय" v={form.sub} on={(v) => setForm({ ...form, sub: v })} opts={SUBJECTS} ph="-- निवडा --" />
          </div>
          <Field label="फोन" v={form.phone} on={(v) => setForm({ ...form, phone: v })} ph="मोबाईल नंबर" />

          <div className="text-[11.5px] font-bold text-[#1B5E84] mt-2 mb-1">📅 सेवाविषयक माहिती</div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="जन्मदिनांक" type="date" v={form.dob} on={(v) => setForm({ ...form, dob: v })} />
            <Field label="नोकरी सुरू तारीख" type="date" v={form.serviceStart} on={(v) => setForm({ ...form, serviceStart: v })} />
            <Field label="या शाळेत रुजू दिनांक" type="date" v={form.schoolJoin} on={(v) => setForm({ ...form, schoolJoin: v })} />
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                शिल्लक सेवाकाल <span className="font-normal text-slate-400">(वय ५८ — auto)</span>
              </label>
              <input readOnly value={remainingService(form.dob) || 'जन्मदिनांक भरा'}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-100 text-sm font-semibold text-sf" />
            </div>
          </div>

          <div className="text-[11.5px] font-bold text-[#1B5E84] mt-2 mb-1">🧑‍🦽 दिव्यांगत्व (अपंगत्व) विषयी माहिती</div>
          <div className="grid grid-cols-2 gap-3">
            <Sel label="शिक्षक दिव्यांग आहेत काय?" v={form.disabled} on={(v) => setForm({ ...form, disabled: v })} opts={['नाही', 'होय']} />
            {isDisabled && (
              <Sel label="दिव्यांगत्वाचा प्रकार *" v={form.disabilityType} on={(v) => setForm({ ...form, disabilityType: v })} opts={DISABILITY_TYPES} ph="-- प्रकार निवडा --" />
            )}
          </div>
          {isDisabled && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="दिव्यांगत्व टक्केवारी (%)" type="number" v={form.disabilityPercent} on={(v) => setForm({ ...form, disabilityPercent: v })} ph="उदा. 40" />
              <Field label="UDID / प्रमाणपत्र क्रमांक" v={form.disabilityUdid} on={(v) => setForm({ ...form, disabilityUdid: v })} />
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

const inp = 'w-full px-3 py-2 rounded-lg border border-slate-300 bg-slate-50 focus:bg-white focus:border-sf outline-none text-sm'
function Field({ label, v, on, type = 'text', ph }: { label: string; v?: string; on: (v: string) => void; type?: string; ph?: string }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <input type={type} value={v || ''} placeholder={ph} onChange={(e) => on(e.target.value)} className={inp} />
    </div>
  )
}
function Sel({ label, v, on, opts, ph }: { label: string; v?: string; on: (v: string) => void; opts: string[]; ph?: string }) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-semibold text-slate-600 mb-1">{label}</label>
      <select value={v || ''} onChange={(e) => on(e.target.value)} className={inp + ' bg-white'}>
        {ph && <option value="">{ph}</option>}
        {opts.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  )
}
